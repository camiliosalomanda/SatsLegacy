// Blockchain address balance utilities
import type { NetworkType } from '../../types/settings';
import { torFetch } from './tor-fetch';

// Test addresses to skip
const TEST_ADDRESS_PREFIXES = [
  'bc1qtest',
  'bc1qsimple',
  'bc1qresilient',
  'bc1qguardian',
  'bc1qhostile'
];

/**
 * Get API endpoints for the specified network
 */
function getNetworkApis(network: NetworkType, address: string): string[] {
  switch (network) {
    case 'mainnet':
      return [
        `https://blockstream.info/api/address/${address}`,
        `https://mempool.space/api/address/${address}`
      ];
    case 'testnet':
      return [
        `https://blockstream.info/testnet/api/address/${address}`,
        `https://mempool.space/testnet/api/address/${address}`
      ];
    case 'signet':
      return [
        `https://mempool.space/signet/api/address/${address}`
      ];
    default:
      return [
        `https://blockstream.info/api/address/${address}`
      ];
  }
}

export async function fetchAddressBalance(
  address: string,
  network: NetworkType = 'mainnet'
): Promise<number> {
  if (!address || TEST_ADDRESS_PREFIXES.some(prefix => address.startsWith(prefix))) {
    // Skip fake test addresses
    return 0;
  }

  const apis = getNetworkApis(network, address);

  for (const url of apis) {
    try {
      const response = await torFetch(url);
      if (response.ok) {
        const data = await response.json();
        // Balance in satoshis, convert to BTC
        const funded = data.chain_stats?.funded_txo_sum || 0;
        const spent = data.chain_stats?.spent_txo_sum || 0;
        return (funded - spent) / 100000000;
      }
    } catch (e) {
      console.warn(`Balance fetch failed from ${url}:`, e);
    }
  }

  return 0;
}

/**
 * UTXO structure returned by mempool.space/blockstream APIs
 */
export interface UTXO {
  txid: string;
  vout: number;
  value: number; // in satoshis
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
}

/**
 * Get base API URL for the specified network
 */
export function getApiBaseUrl(network: NetworkType): string {
  switch (network) {
    case 'mainnet':
      return 'https://mempool.space/api';
    case 'testnet':
      return 'https://mempool.space/testnet/api';
    case 'signet':
      return 'https://mempool.space/signet/api';
    default:
      return 'https://mempool.space/api';
  }
}

/**
 * Fetch UTXOs for an address
 */
export async function fetchAddressUtxos(
  address: string,
  network: NetworkType = 'mainnet'
): Promise<UTXO[]> {
  if (!address || TEST_ADDRESS_PREFIXES.some(prefix => address.startsWith(prefix))) {
    return [];
  }

  const baseUrl = getApiBaseUrl(network);
  const url = `${baseUrl}/address/${address}/utxo`;

  try {
    const response = await torFetch(url);
    if (response.ok) {
      const utxos: UTXO[] = await response.json();
      return utxos;
    }
  } catch (e) {
    console.warn(`UTXO fetch failed from ${url}:`, e);
  }

  return [];
}

/**
 * Fetch current block height
 */
export async function fetchBlockHeight(network: NetworkType = 'mainnet'): Promise<number> {
  const baseUrl = getApiBaseUrl(network);
  const url = `${baseUrl}/blocks/tip/height`;

  try {
    const response = await torFetch(url);
    if (response.ok) {
      const height = await response.json();
      return height;
    }
  } catch (e) {
    console.warn(`Block height fetch failed:`, e);
  }

  return 0;
}

/**
 * Fetch recommended fee rates (in sat/vB)
 */
export interface FeeRates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export async function fetchFeeRates(network: NetworkType = 'mainnet'): Promise<FeeRates> {
  const baseUrl = getApiBaseUrl(network);
  const url = `${baseUrl}/v1/fees/recommended`;

  try {
    const response = await torFetch(url);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn(`Fee rates fetch failed:`, e);
  }

  // Default fallback fees
  return {
    fastestFee: 20,
    halfHourFee: 10,
    hourFee: 5,
    economyFee: 2,
    minimumFee: 1
  };
}

/**
 * Fetch raw transaction hex by txid
 */
export async function fetchRawTransaction(
  txid: string,
  network: NetworkType = 'mainnet'
): Promise<string | null> {
  const baseUrl = getApiBaseUrl(network);
  const url = `${baseUrl}/tx/${txid}/hex`;

  try {
    const response = await torFetch(url);
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    console.warn(`Raw tx fetch failed for ${txid}:`, e);
  }

  return null;
}

/**
 * Broadcast result from API
 */
export interface BroadcastResult {
  success: boolean;
  txid?: string;
  error?: string;
}

/**
 * Broadcast a signed transaction to the network
 *
 * Uses mempool.space API which accepts raw transaction hex via POST
 */
export async function broadcastTransaction(
  txHex: string,
  network: NetworkType = 'mainnet'
): Promise<BroadcastResult> {
  const baseUrl = getApiBaseUrl(network);
  const url = `${baseUrl}/tx`;

  // Try primary API (mempool.space)
  try {
    const response = await torFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: txHex,
    });

    if (response.ok) {
      const txid = await response.text();
      return { success: true, txid: txid.trim() };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText || `HTTP ${response.status}` };
    }
  } catch (e) {
    console.warn(`Broadcast failed via mempool.space:`, e);
  }

  // Fallback to blockstream.info
  const fallbackUrls: Record<NetworkType, string> = {
    mainnet: 'https://blockstream.info/api/tx',
    testnet: 'https://blockstream.info/testnet/api/tx',
    signet: 'https://mempool.space/signet/api/tx', // No blockstream signet
  };

  try {
    const fallbackUrl = fallbackUrls[network];
    const response = await torFetch(fallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: txHex,
    });

    if (response.ok) {
      const txid = await response.text();
      return { success: true, txid: txid.trim() };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText || `HTTP ${response.status}` };
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Network error - could not broadcast',
    };
  }
}

/**
 * Get transaction details by txid
 */
export interface TransactionInfo {
  txid: string;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  fee: number;
  size: number;
  weight: number;
}

export async function fetchTransaction(
  txid: string,
  network: NetworkType = 'mainnet'
): Promise<TransactionInfo | null> {
  const baseUrl = getApiBaseUrl(network);
  const url = `${baseUrl}/tx/${txid}`;

  try {
    const response = await torFetch(url);
    if (response.ok) {
      const data = await response.json();
      return {
        txid: data.txid,
        confirmed: data.status?.confirmed || false,
        blockHeight: data.status?.block_height,
        blockTime: data.status?.block_time,
        fee: data.fee || 0,
        size: data.size || 0,
        weight: data.weight || 0,
      };
    }
  } catch (e) {
    console.warn(`Transaction fetch failed for ${txid}:`, e);
  }

  return null;
}
