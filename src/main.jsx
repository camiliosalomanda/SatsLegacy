import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import BitTrust from '../BitTrust.jsx'
import LandingPage from './LandingPage.jsx'
import DocsPage from './docs/DocsPage.jsx'
import SovereigntyProblemPage from './docs/SovereigntyProblemPage.jsx'
import MiniscriptTimelocksPage from './docs/MiniscriptTimelocksPage.jsx'
import KeyDistributionPage from './docs/KeyDistributionPage.jsx'
import HeirClaimPortal from './components/HeirClaimPortal.jsx'
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
    const hasVisited = localStorage.getItem('bittrust:visited');
    if (hasVisited && (hash === '#/' || hash === '')) {
      setShowApp(true);
    }
  }, []);

  const handleEnterApp = () => {
    localStorage.setItem('bittrust:visited', 'true');
    setShowApp(true);
  };

  const handleBackToLanding = () => {
    setShowApp(false);
    localStorage.removeItem('bittrust:visited');
  };

  // Heir Claim Portal route - accessible without login
  if (hash === '#/claim' || hash.startsWith('#/claim/')) {
    return <HeirClaimPortal />;
  }

  // Documentation routes
  if (hash === '#/docs' || hash === '#/docs/') return <DocsPage />;
  if (hash === '#/docs/sovereignty-problem') return <SovereigntyProblemPage />;
  if (hash === '#/docs/miniscript-timelocks') return <MiniscriptTimelocksPage />;
  if (hash === '#/docs/key-distribution') return <KeyDistributionPage />;
  if (hash === '#/whitepaper') {
    window.location.href = '/BitTrust-Whitepaper.pdf';
    return null;
  }

  if (showApp) return <BitTrust onBackToLanding={handleBackToLanding} />;
  return <LandingPage onEnterApp={handleEnterApp} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
