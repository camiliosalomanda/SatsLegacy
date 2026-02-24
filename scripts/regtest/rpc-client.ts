/**
 * Minimal JSON-RPC client for Bitcoin Core regtest node.
 *
 * Uses Node's built-in fetch — no external dependencies.
 */

export class RegtestRPC {
  private url: string;
  private auth: string;
  private idCounter = 0;

  constructor(
    url = 'http://127.0.0.1:18443',
    user = 'test',
    pass = 'test'
  ) {
    this.url = url;
    this.auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  async call(method: string, params: any[] = []): Promise<any> {
    const id = ++this.idCounter;
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.auth,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });

    const json = await res.json();
    if (json.error) {
      const err = new Error(`RPC ${method}: ${json.error.message} (code ${json.error.code})`);
      (err as any).rpcCode = json.error.code;
      (err as any).rpcMessage = json.error.message;
      throw err;
    }
    return json.result;
  }

  // ── Convenience wrappers ──────────────────────────

  async createWallet(name: string): Promise<void> {
    try {
      await this.call('createwallet', [name]);
    } catch (e: any) {
      // Wallet already exists — that's fine
      if (e.rpcCode === -4 && /already exists/.test(e.rpcMessage)) return;
      throw e;
    }
  }

  async loadWallet(name: string): Promise<void> {
    try {
      await this.call('loadwallet', [name]);
    } catch (e: any) {
      if (e.rpcCode === -4 && /already loaded/.test(e.rpcMessage)) return;
      throw e;
    }
  }

  async getNewAddress(): Promise<string> {
    return this.call('getnewaddress', ['', 'bech32']);
  }

  async generateToAddress(nblocks: number, address: string): Promise<string[]> {
    return this.call('generatetoaddress', [nblocks, address]);
  }

  async sendToAddress(address: string, amountBtc: number): Promise<string> {
    return this.call('sendtoaddress', [address, amountBtc]);
  }

  async getRawTransaction(txid: string, verbose = false): Promise<any> {
    return this.call('getrawtransaction', [txid, verbose]);
  }

  async sendRawTransaction(txHex: string): Promise<string> {
    return this.call('sendrawtransaction', [txHex]);
  }

  async getBlockCount(): Promise<number> {
    return this.call('getblockcount');
  }

  async getTransaction(txid: string): Promise<any> {
    return this.call('gettransaction', [txid]);
  }

  async listUnspent(minconf = 0, maxconf = 9999999, addresses?: string[]): Promise<any[]> {
    return this.call('listunspent', [minconf, maxconf, addresses ?? []]);
  }

  async decodeRawTransaction(txHex: string): Promise<any> {
    return this.call('decoderawtransaction', [txHex]);
  }

  async getBlockHash(height: number): Promise<string> {
    return this.call('getblockhash', [height]);
  }

  async getBlock(hash: string, verbosity = 1): Promise<any> {
    return this.call('getblock', [hash, verbosity]);
  }

  /**
   * Poll the node until it responds — handles Docker startup delay.
   */
  async waitForReady(retries = 30, delayMs = 1000): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.call('getblockchaininfo');
        return;
      } catch {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
    throw new Error(`bitcoind not ready after ${retries} attempts`);
  }
}
