// Bitcoin price fetching utilities

interface PriceSource {
  url: string;
  parse: (data: unknown) => number;
}

const priceSources: PriceSource[] = [
  {
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    parse: (data: { bitcoin: { usd: number } }) => data.bitcoin.usd
  },
  {
    url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
    parse: (data: { data: { amount: string } }) => parseFloat(data.data.amount)
  },
  {
    url: 'https://blockchain.info/ticker',
    parse: (data: { USD: { last: number } }) => data.USD.last
  }
];

export async function fetchBTCPrice(): Promise<number> {
  for (const source of priceSources) {
    try {
      const response = await fetch(source.url);
      if (response.ok) {
        const data = await response.json();
        return source.parse(data);
      }
    } catch (e) {
      console.warn(`Price fetch failed from ${source.url}:`, e);
    }
  }

  // Fallback price if all APIs fail
  console.warn('All price APIs failed, using fallback');
  return 100000;
}
