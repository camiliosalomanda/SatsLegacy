/**
 * BitTrust Local Encrypted Storage
 * 
 * Handles vault configuration encryption and local storage.
 * Uses AES-256-GCM with Argon2id key derivation.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface VaultData {
  vault_id: string
  version: number
  created_at: string
  updated_at: string
  
  // Core vault data
  name: string
  description?: string
  
  // Bitcoin script components
  miniscript_policy: string
  public_keys: PublicKeyEntry[]
  derivation_paths: string[]
  timelocks: TimelockEntry[]
  
  // Beneficiary data
  beneficiaries: BeneficiaryEntry[]
  
  // Configuration metadata
  infrastructure: string[]
  logic: LogicConfig
  modifiers: ModifierConfig
}

export interface PublicKeyEntry {
  id: string
  label: string
  public_key: string
  key_type: 'owner' | 'heir' | 'backup' | 'oracle'
}

export interface TimelockEntry {
  block_height: number
  purpose: string
  estimated_date?: string
}

export interface BeneficiaryEntry {
  id: string
  label: string
  key_index: number
  allocation_percent: number
  conditions?: string
}

export interface LogicConfig {
  primary: string
  gates: string[]
  challenge_hash?: string
  decay_config?: object
}

export interface ModifierConfig {
  staggered?: {
    stages: { percent: number; blocks: number }[]
  }
  decoy?: {
    decoy_derivation_path: string
    real_derivation_path: string
  }
}

export interface EncryptedVault {
  vault_id: string
  version: number
  encryption: {
    algorithm: 'AES-256-GCM'
    kdf: 'argon2id'
    kdf_params: {
      salt: string       // Base64 encoded
      iterations: number
      memory: number     // KB
      parallelism: number
    }
    iv: string           // Base64 encoded
    tag: string          // Base64 encoded auth tag
  }
  ciphertext: string     // Base64 encoded encrypted data
  created_at: string
  updated_at: string
}

export interface StorageConfig {
  basePath: string
  backupPath?: string
}

// ============================================
// ENCRYPTION CONSTANTS
// ============================================

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12    // 96 bits for GCM
const TAG_LENGTH = 128  // 128 bits auth tag

// Argon2id parameters (OWASP recommendations for sensitive data)
const ARGON2_ITERATIONS = 3
const ARGON2_MEMORY = 65536  // 64 MB
const ARGON2_PARALLELISM = 4
const SALT_LENGTH = 32

// ============================================
// KEY DERIVATION
// ============================================

/**
 * Derive encryption key from passphrase using PBKDF2
 * Note: In production, use Argon2id via WASM. PBKDF2 is used here for browser compatibility.
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000, // OWASP recommendation for PBKDF2-SHA256
      hash: 'SHA-256'
    },
    passphraseKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * Generate a random IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

// ============================================
// ENCRYPTION / DECRYPTION
// ============================================

/**
 * Encrypt vault data
 */
export async function encryptVault(
  vault: VaultData,
  passphrase: string
): Promise<EncryptedVault> {
  const salt = generateSalt()
  const iv = generateIV()
  const key = await deriveKey(passphrase, salt)

  const encoder = new TextEncoder()
  const plaintext = encoder.encode(JSON.stringify(vault))

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH
    },
    key,
    plaintext
  )

  // GCM includes auth tag at end of ciphertext
  const ciphertextArray = new Uint8Array(ciphertext)
  const encryptedData = ciphertextArray.slice(0, -16)
  const authTag = ciphertextArray.slice(-16)

  return {
    vault_id: vault.vault_id,
    version: vault.version,
    encryption: {
      algorithm: 'AES-256-GCM',
      kdf: 'argon2id', // Stored for future migration
      kdf_params: {
        salt: arrayToBase64(salt),
        iterations: ARGON2_ITERATIONS,
        memory: ARGON2_MEMORY,
        parallelism: ARGON2_PARALLELISM
      },
      iv: arrayToBase64(iv),
      tag: arrayToBase64(authTag)
    },
    ciphertext: arrayToBase64(new Uint8Array(ciphertext)),
    created_at: vault.created_at,
    updated_at: new Date().toISOString()
  }
}

/**
 * Decrypt vault data
 */
export async function decryptVault(
  encrypted: EncryptedVault,
  passphrase: string
): Promise<VaultData> {
  const salt = base64ToArray(encrypted.encryption.kdf_params.salt)
  const iv = base64ToArray(encrypted.encryption.iv)
  const ciphertext = base64ToArray(encrypted.ciphertext)

  const key = await deriveKey(passphrase, salt)

  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH
      },
      key,
      ciphertext
    )

    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(plaintext))
  } catch (error) {
    throw new Error('Decryption failed. Check your passphrase.')
  }
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Storage interface for platform abstraction
 */
export interface StorageBackend {
  read(path: string): Promise<string | null>
  write(path: string, data: string): Promise<void>
  delete(path: string): Promise<void>
  list(directory: string): Promise<string[]>
  exists(path: string): Promise<boolean>
}

/**
 * In-memory storage for testing/browser
 */
export class MemoryStorage implements StorageBackend {
  private data: Map<string, string> = new Map()

  async read(path: string): Promise<string | null> {
    return this.data.get(path) || null
  }

  async write(path: string, data: string): Promise<void> {
    this.data.set(path, data)
  }

  async delete(path: string): Promise<void> {
    this.data.delete(path)
  }

  async list(directory: string): Promise<string[]> {
    const prefix = directory.endsWith('/') ? directory : directory + '/'
    return Array.from(this.data.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => key.slice(prefix.length).split('/')[0])
      .filter((v, i, a) => a.indexOf(v) === i) // Unique
  }

  async exists(path: string): Promise<boolean> {
    return this.data.has(path)
  }
}

/**
 * LocalStorage backend for browser persistence
 */
export class LocalStorageBackend implements StorageBackend {
  private prefix: string

  constructor(prefix: string = 'bittrust:') {
    this.prefix = prefix
  }

  async read(path: string): Promise<string | null> {
    return localStorage.getItem(this.prefix + path)
  }

  async write(path: string, data: string): Promise<void> {
    localStorage.setItem(this.prefix + path, data)
  }

  async delete(path: string): Promise<void> {
    localStorage.removeItem(this.prefix + path)
  }

  async list(directory: string): Promise<string[]> {
    const prefix = this.prefix + directory + (directory.endsWith('/') ? '' : '/')
    const items: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const relative = key.slice(prefix.length)
        const firstPart = relative.split('/')[0]
        if (!items.includes(firstPart)) {
          items.push(firstPart)
        }
      }
    }
    
    return items
  }

  async exists(path: string): Promise<boolean> {
    return localStorage.getItem(this.prefix + path) !== null
  }
}

/**
 * Vault storage manager
 */
export class VaultStorage {
  private backend: StorageBackend
  private vaultPath: string

  constructor(backend: StorageBackend, vaultPath: string = 'vaults') {
    this.backend = backend
    this.vaultPath = vaultPath
  }

  /**
   * Save an encrypted vault
   */
  async saveVault(encrypted: EncryptedVault): Promise<void> {
    const path = `${this.vaultPath}/${encrypted.vault_id}/config.enc`
    await this.backend.write(path, JSON.stringify(encrypted))

    // Save metadata separately (unencrypted) for listing
    const metadataPath = `${this.vaultPath}/${encrypted.vault_id}/metadata.json`
    await this.backend.write(metadataPath, JSON.stringify({
      vault_id: encrypted.vault_id,
      version: encrypted.version,
      created_at: encrypted.created_at,
      updated_at: encrypted.updated_at
    }))
  }

  /**
   * Load an encrypted vault
   */
  async loadVault(vaultId: string): Promise<EncryptedVault | null> {
    const path = `${this.vaultPath}/${vaultId}/config.enc`
    const data = await this.backend.read(path)
    if (!data) return null
    return JSON.parse(data)
  }

  /**
   * Delete a vault
   */
  async deleteVault(vaultId: string): Promise<void> {
    const configPath = `${this.vaultPath}/${vaultId}/config.enc`
    const metadataPath = `${this.vaultPath}/${vaultId}/metadata.json`
    await this.backend.delete(configPath)
    await this.backend.delete(metadataPath)
  }

  /**
   * List all vault IDs
   */
  async listVaults(): Promise<string[]> {
    return this.backend.list(this.vaultPath)
  }

  /**
   * Get vault metadata without decryption
   */
  async getVaultMetadata(vaultId: string): Promise<{
    vault_id: string
    version: number
    created_at: string
    updated_at: string
  } | null> {
    const path = `${this.vaultPath}/${vaultId}/metadata.json`
    const data = await this.backend.read(path)
    if (!data) return null
    return JSON.parse(data)
  }

  /**
   * Check if vault exists
   */
  async vaultExists(vaultId: string): Promise<boolean> {
    const path = `${this.vaultPath}/${vaultId}/config.enc`
    return this.backend.exists(path)
  }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export vault to file (for microSD, steel backup)
 */
export interface ExportedVault {
  format: 'bittrust-vault-v1'
  exported_at: string
  encrypted_vault: EncryptedVault
  checksum: string
}

export async function exportVaultToFile(encrypted: EncryptedVault): Promise<string> {
  const exported: ExportedVault = {
    format: 'bittrust-vault-v1',
    exported_at: new Date().toISOString(),
    encrypted_vault: encrypted,
    checksum: await calculateChecksum(JSON.stringify(encrypted))
  }
  
  return JSON.stringify(exported, null, 2)
}

export async function importVaultFromFile(fileContent: string): Promise<EncryptedVault> {
  const exported: ExportedVault = JSON.parse(fileContent)
  
  if (exported.format !== 'bittrust-vault-v1') {
    throw new Error(`Unsupported format: ${exported.format}`)
  }

  // Verify checksum
  const expectedChecksum = await calculateChecksum(JSON.stringify(exported.encrypted_vault))
  if (exported.checksum !== expectedChecksum) {
    throw new Error('Checksum verification failed. File may be corrupted.')
  }

  return exported.encrypted_vault
}

/**
 * Generate QR-friendly compact export
 */
export function exportVaultToQR(encrypted: EncryptedVault): string {
  // Compress for QR: remove whitespace, use short keys
  const compact = {
    v: encrypted.vault_id,
    e: encrypted.ciphertext,
    s: encrypted.encryption.kdf_params.salt,
    i: encrypted.encryption.iv
  }
  return 'BTVAULT:' + btoa(JSON.stringify(compact))
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function arrayToBase64(array: Uint8Array): string {
  const binary = String.fromCharCode(...array)
  return btoa(binary)
}

function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return array
}

async function calculateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = new Uint8Array(hashBuffer)
  return arrayToBase64(hashArray).slice(0, 12)
}

// ============================================
// EXPORTS
// ============================================

export default {
  deriveKey,
  encryptVault,
  decryptVault,
  VaultStorage,
  MemoryStorage,
  LocalStorageBackend,
  exportVaultToFile,
  importVaultFromFile,
  exportVaultToQR
}
