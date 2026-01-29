import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import SatsLegacy from '../SatsLegacyRefactored.jsx'
import LandingPage from './LandingPage.jsx'
import DocsPage from './docs/DocsPage.jsx'
import SovereigntyProblemPage from './docs/SovereigntyProblemPage.jsx'
import MiniscriptTimelocksPage from './docs/MiniscriptTimelocksPage.jsx'
import KeyDistributionPage from './docs/KeyDistributionPage.jsx'
import HeirClaimPortal from './components/HeirClaimPortal.jsx'
// Getting Started
import QuickStartPage from './docs/QuickStartPage.jsx'
import InstallationPage from './docs/InstallationPage.jsx'
import FirstVaultPage from './docs/FirstVaultPage.jsx'
// Vault Types
import TimelockVaultPage from './docs/TimelockVaultPage.jsx'
import DeadManSwitchPage from './docs/DeadManSwitchPage.jsx'
import MultisigVaultPage from './docs/MultisigVaultPage.jsx'
import HybridVaultPage from './docs/HybridVaultPage.jsx'
// Security
import SecurityThreatsPage from './docs/SecurityThreatsPage.jsx'
import HardwareWalletsPage from './docs/HardwareWalletsPage.jsx'
import BackupsPage from './docs/BackupsPage.jsx'
import DuressPage from './docs/DuressPage.jsx'
// Infrastructure
import ShamirPage from './docs/ShamirPage.jsx'
import NostrPage from './docs/NostrPage.jsx'
import TorPage from './docs/TorPage.jsx'
// Legal & Planning
import EstatePlanningPage from './docs/EstatePlanningPage.jsx'
import LegalTemplatesPage from './docs/LegalTemplatesPage.jsx'
import HeirCommunicationPage from './docs/HeirCommunicationPage.jsx'
import './index.css'

const isElectron = typeof window !== 'undefined' && window.isElectron;

function useHashRouter() {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const handleHashChange = () => { setHash(window.location.hash || '#/'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  return hash;
}

function App() {
  const [showApp, setShowApp] = useState(false);
  const hash = useHashRouter();

  useEffect(() => {
    if (isElectron) {
      setShowApp(true);
    }
    const hasVisited = localStorage.getItem('SatsLegacy:visited');
    if (hasVisited && (hash === '#/' || hash === '')) {
      setShowApp(true);
    }
  }, []);

  const handleEnterApp = () => {
    localStorage.setItem('SatsLegacy:visited', 'true');
    setShowApp(true);
  };

  const handleBackToLanding = () => {
    setShowApp(false);
    localStorage.removeItem('SatsLegacy:visited');
  };

  // Heir Claim Portal route
  if (hash === '#/claim' || hash.startsWith('#/claim/')) {
    return <HeirClaimPortal />;
  }

  // Documentation routes
  if (hash === '#/docs' || hash === '#/docs/') return <DocsPage />;
  
  // Core Concepts
  if (hash === '#/docs/sovereignty-problem') return <SovereigntyProblemPage />;
  if (hash === '#/docs/miniscript-timelocks') return <MiniscriptTimelocksPage />;
  if (hash === '#/docs/key-distribution') return <KeyDistributionPage />;
  
  // Getting Started
  if (hash === '#/docs/quick-start') return <QuickStartPage />;
  if (hash === '#/docs/installation') return <InstallationPage />;
  if (hash === '#/docs/first-vault') return <FirstVaultPage />;
  
  // Vault Types
  if (hash === '#/docs/vault-timelock') return <TimelockVaultPage />;
  if (hash === '#/docs/vault-deadman') return <DeadManSwitchPage />;
  if (hash === '#/docs/vault-multisig') return <MultisigVaultPage />;
  if (hash === '#/docs/vault-hybrid') return <HybridVaultPage />;
  
  // Security
  if (hash === '#/docs/security-threats') return <SecurityThreatsPage />;
  if (hash === '#/docs/hardware-wallets') return <HardwareWalletsPage />;
  if (hash === '#/docs/backups') return <BackupsPage />;
  if (hash === '#/docs/duress') return <DuressPage />;
  
  // Infrastructure
  if (hash === '#/docs/shamir') return <ShamirPage />;
  if (hash === '#/docs/nostr') return <NostrPage />;
  if (hash === '#/docs/tor') return <TorPage />;
  
  // Legal & Planning
  if (hash === '#/docs/estate-planning') return <EstatePlanningPage />;
  if (hash === '#/docs/legal-templates') return <LegalTemplatesPage />;
  if (hash === '#/docs/heir-communication') return <HeirCommunicationPage />;

  if (hash === '#/whitepaper') {
    window.location.href = '/SatsLegacy-Whitepaper.pdf';
    return null;
  }

  if (showApp) return <SatsLegacy onBackToLanding={handleBackToLanding} />;
  return <LandingPage onEnterApp={handleEnterApp} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)