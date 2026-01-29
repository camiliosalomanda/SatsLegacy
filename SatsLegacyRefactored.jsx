/**
 * SatsLegacy - Refactored Version
 *
 * This is the new refactored version of SatsLegacy using:
 * - React Context for state management
 * - Extracted components, views, and modals
 * - TypeScript type definitions
 *
 * Import this instead of the old SatsLegacy.jsx when ready to switch.
 */

import React from 'react';
import { AppProviders } from './src/app/AppProviders';
import { SatsLegacy } from './src/app/SatsLegacy';

// Wrapper component that provides context and backwards compatibility
function SatsLegacyApp({ onBackToLanding }) {
  return (
    <AppProviders>
      <SatsLegacy />
    </AppProviders>
  );
}

export default SatsLegacyApp;
