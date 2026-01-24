import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import BitTrust from '../BitTrust.jsx'
import LandingPage from './LandingPage.jsx'
import './index.css'

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.isElectron;

function App() {
  const [showApp, setShowApp] = useState(false);

  // In Electron, skip landing page and go straight to app
  useEffect(() => {
    if (isElectron) {
      setShowApp(true);
    }
    
    // Check if user has visited before (web only)
    const hasVisited = localStorage.getItem('bittrust:visited');
    if (hasVisited) {
      setShowApp(true);
    }
  }, []);

  const handleEnterApp = () => {
    localStorage.setItem('bittrust:visited', 'true');
    setShowApp(true);
  };

  const handleBackToLanding = () => {
    setShowApp(false);
  };

  if (showApp) {
    return <BitTrust onBackToLanding={handleBackToLanding} />;
  }

  return <LandingPage onEnterApp={handleEnterApp} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
