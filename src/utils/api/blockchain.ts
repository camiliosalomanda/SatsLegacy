// Blockchain address balance utilities

// Test addresses to skip
const TEST_ADDRESS_PREFIXES = [
  'bc1qtest',
  'bc1qsimple',
  'bc1qresilient',
  'bc1qguardian',
  'bc1qhostile'
];

export async function fetchAddressBalance(
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<number> {
  if (!address || TEST_ADDRESS_PREFIXES.some(prefix => address.startsWith(prefix))) {
    // Skip fake test addresses
    return 0;
  }

  const apis = network === 'mainnet' ? [
    `https://blockstream.info/api/address/${address}`,
    `https://mempool.space/api/address/${address}`
  ] : [
    `https://blockstream.info/testnet/api/address/${address}`,
    `https://mempool.space/testnet/api/address/${address}`
  ];

  for (const url of apis) {
    try {
      const response = await fetch(url);
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
