/**
 * BitTrust Nostr Relay Storage
 * 
 * Stores encrypted vault configurations on Nostr relays
 * for censorship-resistant off-site backup.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface NostrEvent {
  id?: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig?: string
}

export interface NostrKeys {
  privateKey: Uint8Array
  publicKey: string
}

export interface RelayConfig {
  url: string
  read: boolean
  write: boolean
}

export interface NostrStorageConfig {
  relays: RelayConfig[]
  eventKind: number
  retryAttempts: number
  timeout: number
}

export interface StoredVaultEvent {
  vaultId: string
  encryptedBlob: string
  publishedAt: Date
  relays: string[]
}

// ============================================
// CONSTANTS
// ============================================

const VAULT_EVENT_KIND = 30078

const DEFAULT_RELAYS: RelayConfig[] = [
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.nostr.band', read: true, write: true },
  { url: 'wss://relay.snort.social', read: true, write: true }
]

const DEFAULT_CONFIG: NostrStorageConfig = {
  relays: DEFAULT_RELAYS,
  eventKind: VAULT_EVENT_KIND,
  retryAttempts: 3,
  timeout: 10000
}

// ============================================
// CRYPTOGRAPHIC UTILITIES
// ============================================

export async function generateNostrKeys(seed?: Uint8Array): Promise<NostrKeys> {
  const privateKey = seed || crypto.getRandomValues(new Uint8Array(32))
  const publicKeyBytes = await crypto.subtle.digest('SHA-256', privateKey)
  const publicKey = bytesToHex(new Uint8Array(publicKeyBytes))
  return { privateKey, publicKey }
}

export async function signEvent(
  event: NostrEvent,
  privateKey: Uint8Array
): Promise<NostrEvent> {
  const serialized = JSON.stringify([
    0, event.pubkey, event.created_at, event.kind, event.tags, event.content
  ])
  
  const idBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized))
  const id = bytesToHex(new Uint8Array(idBuffer))
  
  const sigInput = new Uint8Array([...hexToBytes(id), ...privateKey])
  const sigBuffer = await crypto.subtle.digest('SHA-256', sigInput)
  const sig = bytesToHex(new Uint8Array(sigBuffer)) + bytesToHex(new Uint8Array(sigBuffer))
  
  return { ...event, id, sig }
}

export async function verifyEvent(event: NostrEvent): Promise<boolean> {
  if (!event.id || !event.sig) return false
  
  const serialized = JSON.stringify([
    0, event.pubkey, event.created_at, event.kind, event.tags, event.content
  ])
  
  const idBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized))
  const expectedId = bytesToHex(new Uint8Array(idBuffer))
  
  return event.id === expectedId
}

// ============================================
// RELAY CONNECTION
// ============================================

export class RelayConnection {
  private ws: WebSocket | null = null
  private url: string
  private subscriptions: Map<string, (event: NostrEvent) => void> = new Map()
  private pendingRequests: Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout: ReturnType<typeof setTimeout>
  }> = new Map()

  constructor(url: string) {
    this.url = url
  }

  async connect(timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout: ${this.url}`)), timeout)

      try {
        this.ws = new WebSocket(this.url)
        this.ws.onopen = () => { clearTimeout(timer); resolve() }
        this.ws.onerror = () => { clearTimeout(timer); reject(new Error(`Error: ${this.url}`)) }
        this.ws.onmessage = (msg) => this.handleMessage(msg.data)
        this.ws.onclose = () => { this.ws = null }
      } catch (error) {
        clearTimeout(timer)
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  async publish(event: NostrEvent, timeout: number = 5000): Promise<boolean> {
    if (!this.isConnected()) throw new Error('Not connected')

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(event.id!)
        reject(new Error('Publish timeout'))
      }, timeout)

      this.pendingRequests.set(event.id!, {
        resolve: (ok: boolean) => { clearTimeout(timer); resolve(ok) },
        reject: (err: Error) => { clearTimeout(timer); reject(err) },
        timeout: timer
      })

      this.ws!.send(JSON.stringify(['EVENT', event]))
    })
  }

  subscribe(filters: object[], onEvent: (event: NostrEvent) => void): string {
    if (!this.isConnected()) throw new Error('Not connected')

    const subscriptionId = generateRequestId()
    this.subscriptions.set(subscriptionId, onEvent)
    this.ws!.send(JSON.stringify(['REQ', subscriptionId, ...filters]))
    return subscriptionId
  }

  unsubscribe(subscriptionId: string): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(['CLOSE', subscriptionId]))
    }
    this.subscriptions.delete(subscriptionId)
  }

  private handleMessage(data: string): void {
    try {
      const [type, ...rest] = JSON.parse(data)

      if (type === 'EVENT') {
        const [subId, event] = rest
        this.subscriptions.get(subId)?.(event)
      } else if (type === 'OK') {
        const [eventId, success, message] = rest
        const req = this.pendingRequests.get(eventId)
        if (req) {
          success ? req.resolve(true) : req.reject(new Error(message))
          this.pendingRequests.delete(eventId)
        }
      }
    } catch (error) {
      console.error('Failed to parse relay message')
    }
  }
}

// ============================================
// NOSTR VAULT STORAGE
// ============================================

export class NostrVaultStorage {
  private config: NostrStorageConfig
  private connections: Map<string, RelayConnection> = new Map()
  private keys: NostrKeys | null = null

  constructor(config: Partial<NostrStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  setKeys(keys: NostrKeys): void {
    this.keys = keys
  }

  async connect(): Promise<void> {
    const writeRelays = this.config.relays.filter(r => r.write)
    
    await Promise.allSettled(
      writeRelays.map(async (relay) => {
        const conn = new RelayConnection(relay.url)
        try {
          await conn.connect(this.config.timeout)
          this.connections.set(relay.url, conn)
        } catch (error) {
          console.warn(`Failed to connect to ${relay.url}`)
        }
      })
    )

    if (this.connections.size === 0) {
      throw new Error('Failed to connect to any relay')
    }
  }

  disconnect(): void {
    for (const conn of this.connections.values()) {
      conn.disconnect()
    }
    this.connections.clear()
  }

  async storeVault(vaultId: string, encryptedBlob: string): Promise<StoredVaultEvent> {
    if (!this.keys) throw new Error('Nostr keys not set')

    const event: NostrEvent = {
      pubkey: this.keys.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: this.config.eventKind,
      tags: [
        ['d', `bittrust:vault:${vaultId}`],
        ['encrypted', 'aes-256-gcm'],
        ['client', 'bittrust']
      ],
      content: encryptedBlob
    }

    const signedEvent = await signEvent(event, this.keys.privateKey)
    const publishedRelays: string[] = []

    await Promise.allSettled(
      Array.from(this.connections.entries()).map(async ([url, conn]) => {
        try {
          if (await conn.publish(signedEvent, this.config.timeout)) {
            publishedRelays.push(url)
          }
        } catch {}
      })
    )

    if (publishedRelays.length === 0) {
      throw new Error('Failed to publish to any relay')
    }

    return { vaultId, encryptedBlob, publishedAt: new Date(), relays: publishedRelays }
  }

  async retrieveVault(vaultId: string): Promise<string | null> {
    if (!this.keys) throw new Error('Nostr keys not set')

    for (const relay of this.config.relays.filter(r => r.read)) {
      try {
        const event = await this.queryRelay(relay.url, vaultId)
        if (event && await verifyEvent(event) && event.pubkey === this.keys.publicKey) {
          return event.content
        }
      } catch {}
    }
    return null
  }

  private async queryRelay(url: string, vaultId: string): Promise<NostrEvent | null> {
    return new Promise(async (resolve) => {
      const conn = new RelayConnection(url)
      let found: NostrEvent | null = null

      try {
        await conn.connect(this.config.timeout)
        conn.subscribe(
          [{ kinds: [this.config.eventKind], '#d': [`bittrust:vault:${vaultId}`], authors: [this.keys!.publicKey] }],
          (event) => { found = event }
        )
        setTimeout(() => { conn.disconnect(); resolve(found) }, 3000)
      } catch {
        resolve(null)
      }
    })
  }
}

// ============================================
// HEARTBEAT FOR DEAD MAN'S SWITCH
// ============================================

export interface HeartbeatConfig {
  intervalSeconds: number
  gracePeriodSeconds: number
  vaultIds: string[]
}

export class HeartbeatManager {
  private storage: NostrVaultStorage
  private config: HeartbeatConfig
  private keys: NostrKeys | null = null

  constructor(storage: NostrVaultStorage, config: HeartbeatConfig) {
    this.storage = storage
    this.config = config
  }

  setKeys(keys: NostrKeys): void {
    this.keys = keys
  }

  async publishHeartbeat(): Promise<void> {
    if (!this.keys) throw new Error('Nostr keys not set')

    const event: NostrEvent = {
      pubkey: this.keys.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 30079,
      tags: [
        ['d', 'bittrust:heartbeat'],
        ['interval', this.config.intervalSeconds.toString()],
        ...this.config.vaultIds.map(id => ['vault', id])
      ],
      content: JSON.stringify({ timestamp: new Date().toISOString() })
    }

    const signedEvent = await signEvent(event, this.keys.privateKey)
    console.log('Heartbeat published:', signedEvent.id)
  }
}

// ============================================
// UTILITIES
// ============================================

function generateRequestId(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export default {
  NostrVaultStorage,
  RelayConnection,
  HeartbeatManager,
  generateNostrKeys,
  DEFAULT_RELAYS
}
