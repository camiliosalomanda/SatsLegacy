import React, { ReactNode } from 'react';
import { SettingsProvider } from '../contexts/SettingsContext';
import { PriceProvider } from '../contexts/PriceContext';
import { UIProvider } from '../contexts/UIContext';
import { VaultProvider } from '../contexts/VaultContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SettingsProvider>
      <PriceProvider>
        <UIProvider>
          <VaultProvider>
            {children}
          </VaultProvider>
        </UIProvider>
      </PriceProvider>
    </SettingsProvider>
  );
}
