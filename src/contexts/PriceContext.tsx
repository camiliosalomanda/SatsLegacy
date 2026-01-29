import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchBTCPrice, fetchAddressBalance } from '../utils';
import type { Vault } from '../types/vault';

interface PriceContextValue {
  btcPrice: number;
  priceLoading: boolean;
  lastPriceUpdate: Date | null;
  copiedAddress: boolean;
  setCopiedAddress: (value: boolean) => void;
  refreshPrice: () => Promise<void>;
  updateVaultBalances: (vaults: Vault[], network: 'mainnet' | 'testnet') => Promise<Vault[]>;
  formatUSD: (btc: number) => string;
}

const PriceContext = createContext<PriceContextValue | null>(null);

export function PriceProvider({ children }: { children: ReactNode }) {
  const [btcPrice, setBtcPrice] = useState<number>(100000);
  const [priceLoading, setPriceLoading] = useState<boolean>(true);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const refreshPrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      const price = await fetchBTCPrice();
      setBtcPrice(price);
      setLastPriceUpdate(new Date());
    } catch (e) {
      console.error('Failed to refresh BTC price:', e);
    }
    setPriceLoading(false);
  }, []);

  const updateVaultBalances = useCallback(async (vaults: Vault[], network: 'mainnet' | 'testnet'): Promise<Vault[]> => {
    const updatedVaults = await Promise.all(
      vaults.map(async (vault) => {
        if (vault.address) {
          const balance = await fetchAddressBalance(vault.address, network);
          return {
            ...vault,
            balance,
            balanceUSD: balance * btcPrice
          };
        }
        return vault;
      })
    );
    return updatedVaults;
  }, [btcPrice]);

  const formatUSD = useCallback((btc: number): string => {
    return (btc * btcPrice).toLocaleString();
  }, [btcPrice]);

  // Initial price load
  useEffect(() => {
    refreshPrice();
  }, [refreshPrice]);

  // Refresh price every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshPrice]);

  // Auto-clear copied state
  useEffect(() => {
    if (copiedAddress) {
      const timeout = setTimeout(() => setCopiedAddress(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copiedAddress]);

  return (
    <PriceContext.Provider value={{
      btcPrice,
      priceLoading,
      lastPriceUpdate,
      copiedAddress,
      setCopiedAddress,
      refreshPrice,
      updateVaultBalances,
      formatUSD
    }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
}
