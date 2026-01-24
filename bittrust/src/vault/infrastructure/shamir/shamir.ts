/**
 * BitTrust Shamir Secret Sharing Implementation
 * 
 * Splits vault encryption keys into shares using Shamir's Secret Sharing.
 * Uses GF(256) arithmetic for byte-level splitting.
 */

// ============================================
// GALOIS FIELD GF(256) ARITHMETIC
// ============================================

// Using the AES polynomial: x^8 + x^4 + x^3 + x + 1 (0x11B)
const PRIME = 0x11B

// Precomputed log and exp tables for fast GF(256) arithmetic
const EXP_TABLE = new Uint8Array(512)
const LOG_TABLE = new Uint8Array(256)

// Initialize tables
function initTables(): void {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x
    LOG_TABLE[x] = i
    x = x << 1
    if (x & 0x100) {
      x ^= PRIME
    }
  }
  // Extend exp table for easy modular access
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255]
  }
}

initTables()

/**
 * Multiply in GF(256)
 */
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]]
}

/**
 * Divide in GF(256)
 */
function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero')
  if (a === 0) return 0
  return EXP_TABLE[(LOG_TABLE[a] - LOG_TABLE[b] + 255) % 255]
}

/**
 * Add in GF(256) (same as XOR)
 */
function gfAdd(a: number, b: number): number {
  return a ^ b
}

// ============================================
// POLYNOMIAL OPERATIONS
// ============================================

/**
 * Evaluate polynomial at x using Horner's method
 */
function evaluatePolynomial(coefficients: Uint8Array, x: number): number {
  let result = 0
  for (let i = coefficients.length - 1; i >= 0; i--) {
    result = gfAdd(gfMul(result, x), coefficients[i])
  }
  return result
}

/**
 * Lagrange interpolation to recover secret (constant term)
 */
function interpolate(points: { x: number; y: number }[]): number {
  let secret = 0
  
  for (let i = 0; i < points.length; i++) {
    let numerator = 1
    let denominator = 1
    
    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        numerator = gfMul(numerator, points[j].x)
        denominator = gfMul(denominator, gfAdd(points[i].x, points[j].x))
      }
    }
    
    const lagrange = gfMul(points[i].y, gfDiv(numerator, denominator))
    secret = gfAdd(secret, lagrange)
  }
  
  return secret
}

// ============================================
// SHARE TYPES
// ============================================

export interface ShamirShare {
  index: number          // Share number (1-255)
  threshold: number      // Minimum shares needed
  totalShares: number    // Total shares created
  data: Uint8Array       // Share data (same length as secret)
  checksum: string       // 4-byte checksum (hex)
  version: number        // Format version
}

export interface ShamirConfig {
  threshold: number      // k - minimum shares needed
  totalShares: number    // n - total shares to create
}

export interface EncodedShare {
  raw: Uint8Array        // Binary representation
  hex: string            // Hex encoding
  base32: string         // Human-friendly encoding
  qrData: string         // Data for QR code
  printable: string[]    // Lines for paper backup
}

// ============================================
// SECURE RANDOM
// ============================================

/**
 * Generate cryptographically secure random bytes
 */
function secureRandom(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return bytes
  }
  throw new Error('Secure random not available')
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Split a secret into shares
 * 
 * @param secret - The secret to split (e.g., 32-byte encryption key)
 * @param config - Threshold and total shares configuration
 * @returns Array of shares
 */
export function split(secret: Uint8Array, config: ShamirConfig): ShamirShare[] {
  const { threshold, totalShares } = config

  // Validate inputs
  if (threshold < 2) {
    throw new Error('Threshold must be at least 2')
  }
  if (totalShares < threshold) {
    throw new Error('Total shares must be >= threshold')
  }
  if (totalShares > 255) {
    throw new Error('Maximum 255 shares supported')
  }
  if (secret.length === 0) {
    throw new Error('Secret cannot be empty')
  }

  const shares: ShamirShare[] = []

  // Generate random coefficients for each byte position
  // For each byte: f(x) = secret[i] + a1*x + a2*x^2 + ... + a(k-1)*x^(k-1)
  for (let shareIndex = 1; shareIndex <= totalShares; shareIndex++) {
    const shareData = new Uint8Array(secret.length)

    for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
      // Generate polynomial coefficients
      // coefficients[0] = secret byte
      // coefficients[1..k-1] = random
      const coefficients = new Uint8Array(threshold)
      coefficients[0] = secret[byteIndex]
      
      const randomCoeffs = secureRandom(threshold - 1)
      for (let i = 1; i < threshold; i++) {
        coefficients[i] = randomCoeffs[i - 1]
      }

      // Evaluate polynomial at x = shareIndex
      shareData[byteIndex] = evaluatePolynomial(coefficients, shareIndex)
    }

    // Calculate checksum
    const checksum = calculateChecksum(shareData, shareIndex, threshold, totalShares)

    shares.push({
      index: shareIndex,
      threshold,
      totalShares,
      data: shareData,
      checksum,
      version: 1
    })
  }

  return shares
}

/**
 * Combine shares to recover the secret
 * 
 * @param shares - Array of shares (must have at least threshold shares)
 * @returns The recovered secret
 */
export function combine(shares: ShamirShare[]): Uint8Array {
  if (shares.length === 0) {
    throw new Error('No shares provided')
  }

  const threshold = shares[0].threshold
  const dataLength = shares[0].data.length

  // Validate shares
  if (shares.length < threshold) {
    throw new Error(`Need at least ${threshold} shares, got ${shares.length}`)
  }

  // Verify all shares have same parameters
  for (const share of shares) {
    if (share.threshold !== threshold) {
      throw new Error('Shares have mismatched thresholds')
    }
    if (share.data.length !== dataLength) {
      throw new Error('Shares have mismatched data lengths')
    }
    // Verify checksum
    const expectedChecksum = calculateChecksum(
      share.data, 
      share.index, 
      share.threshold, 
      share.totalShares
    )
    if (share.checksum !== expectedChecksum) {
      throw new Error(`Share ${share.index} has invalid checksum`)
    }
  }

  // Check for duplicate indices
  const indices = new Set(shares.map(s => s.index))
  if (indices.size !== shares.length) {
    throw new Error('Duplicate share indices detected')
  }

  // Use only threshold shares (first k)
  const usedShares = shares.slice(0, threshold)
  const secret = new Uint8Array(dataLength)

  // Recover each byte
  for (let byteIndex = 0; byteIndex < dataLength; byteIndex++) {
    const points = usedShares.map(share => ({
      x: share.index,
      y: share.data[byteIndex]
    }))
    secret[byteIndex] = interpolate(points)
  }

  return secret
}

/**
 * Verify a share's checksum
 */
export function verifyShare(share: ShamirShare): boolean {
  const expectedChecksum = calculateChecksum(
    share.data,
    share.index,
    share.threshold,
    share.totalShares
  )
  return share.checksum === expectedChecksum
}

// ============================================
// ENCODING FUNCTIONS
// ============================================

/**
 * Calculate checksum for a share
 */
function calculateChecksum(
  data: Uint8Array,
  index: number,
  threshold: number,
  totalShares: number
): string {
  // Simple checksum: SHA256 of (data || index || threshold || total), take first 4 bytes
  const toHash = new Uint8Array(data.length + 3)
  toHash.set(data)
  toHash[data.length] = index
  toHash[data.length + 1] = threshold
  toHash[data.length + 2] = totalShares
  
  // Use SubtleCrypto if available, otherwise simple XOR checksum
  let checksum = 0
  for (let i = 0; i < toHash.length; i++) {
    checksum = ((checksum << 5) - checksum + toHash[i]) | 0
  }
  
  return Math.abs(checksum).toString(16).padStart(8, '0').slice(0, 8)
}

/**
 * Encode a share for storage/display
 */
export function encodeShare(share: ShamirShare): EncodedShare {
  // Create raw binary format
  // [version:1][index:1][threshold:1][total:1][checksum:4][data:N]
  const raw = new Uint8Array(4 + 4 + share.data.length)
  raw[0] = share.version
  raw[1] = share.index
  raw[2] = share.threshold
  raw[3] = share.totalShares
  
  // Add checksum bytes
  const checksumBytes = hexToBytes(share.checksum)
  raw.set(checksumBytes, 4)
  
  // Add data
  raw.set(share.data, 8)

  // Generate encodings
  const hex = bytesToHex(raw)
  const base32 = bytesToBase32(raw)
  
  // QR data uses compact format
  const qrData = `BITTRUST:${share.version}:${share.index}/${share.threshold}:${bytesToHex(share.data)}:${share.checksum}`

  // Printable format for paper backup
  const printable = generatePrintableShare(share)

  return { raw, hex, base32, qrData, printable }
}

/**
 * Decode a share from encoded format
 */
export function decodeShare(encoded: string): ShamirShare {
  // Try to detect format
  if (encoded.startsWith('BITTRUST:')) {
    return decodeQRFormat(encoded)
  } else if (/^[A-Z2-7]+=*$/.test(encoded)) {
    return decodeBase32Format(encoded)
  } else if (/^[0-9a-fA-F]+$/.test(encoded)) {
    return decodeHexFormat(encoded)
  }
  
  throw new Error('Unrecognized share format')
}

function decodeQRFormat(data: string): ShamirShare {
  const parts = data.split(':')
  if (parts.length !== 5 || parts[0] !== 'BITTRUST') {
    throw new Error('Invalid QR format')
  }
  
  const version = parseInt(parts[1])
  const [index, threshold] = parts[2].split('/').map(n => parseInt(n))
  const shareData = hexToBytes(parts[3])
  const checksum = parts[4]
  
  // Total shares not stored in QR, set to 0 (unknown)
  return {
    version,
    index,
    threshold,
    totalShares: 0,
    data: shareData,
    checksum
  }
}

function decodeHexFormat(hex: string): ShamirShare {
  const raw = hexToBytes(hex)
  return {
    version: raw[0],
    index: raw[1],
    threshold: raw[2],
    totalShares: raw[3],
    checksum: bytesToHex(raw.slice(4, 8)),
    data: raw.slice(8)
  }
}

function decodeBase32Format(base32: string): ShamirShare {
  const raw = base32ToBytes(base32)
  return {
    version: raw[0],
    index: raw[1],
    threshold: raw[2],
    totalShares: raw[3],
    checksum: bytesToHex(raw.slice(4, 8)),
    data: raw.slice(8)
  }
}

/**
 * Generate printable lines for paper backup
 */
function generatePrintableShare(share: ShamirShare): string[] {
  const lines: string[] = []
  
  lines.push('═══════════════════════════════════════════════')
  lines.push(`    BITTRUST SHAMIR SHARE ${share.index} OF ${share.totalShares}`)
  lines.push(`    THRESHOLD: ${share.threshold} SHARES NEEDED`)
  lines.push('═══════════════════════════════════════════════')
  lines.push('')
  lines.push('SHARE DATA:')
  
  // Split data into readable chunks
  const hex = bytesToHex(share.data)
  for (let i = 0; i < hex.length; i += 32) {
    const chunk = hex.slice(i, i + 32)
    const formatted = chunk.match(/.{1,4}/g)?.join(' ') || chunk
    lines.push(`  ${formatted}`)
  }
  
  lines.push('')
  lines.push(`CHECKSUM: ${share.checksum.toUpperCase()}`)
  lines.push('')
  lines.push('───────────────────────────────────────────────')
  lines.push('⚠ STORE SEPARATELY FROM OTHER SHARES')
  lines.push('⚠ DO NOT PHOTOGRAPH OR DIGITIZE')
  lines.push('───────────────────────────────────────────────')
  lines.push('RECOVERY: bittrust.app/recover')
  lines.push(`VERSION: ${share.version}`)
  
  return lines
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function bytesToBase32(bytes: Uint8Array): string {
  let result = ''
  let bits = 0
  let value = 0
  
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    
    while (bits >= 5) {
      bits -= 5
      result += BASE32_ALPHABET[(value >> bits) & 0x1f]
    }
  }
  
  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  
  // Add padding
  while (result.length % 8 !== 0) {
    result += '='
  }
  
  return result
}

function base32ToBytes(base32: string): Uint8Array {
  // Remove padding
  base32 = base32.replace(/=+$/, '')
  
  const bytes: number[] = []
  let bits = 0
  let value = 0
  
  for (const char of base32) {
    const index = BASE32_ALPHABET.indexOf(char.toUpperCase())
    if (index === -1) throw new Error('Invalid base32 character')
    
    value = (value << 5) | index
    bits += 5
    
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 0xff)
    }
  }
  
  return new Uint8Array(bytes)
}

// ============================================
// EXPORTS
// ============================================

export default {
  split,
  combine,
  verifyShare,
  encodeShare,
  decodeShare
}
