import React, { useState, useEffect } from 'react';
import {
  Shield, Clock, Wallet, CheckCircle, ChevronRight, ChevronLeft,
  AlertTriangle, Info, ExternalLink, Copy, Check, Download,
  Key, FileText, HelpCircle, Lock, Unlock, QrCode, Usb,
  Monitor, ArrowRight, RefreshCw, Zap
} from 'lucide-react';

// ============================================
// HEIR CLAIM PORTAL
// Guides non-technical heirs through claiming their inheritance
// Route: /claim or /claim/:vaultId
// ============================================

const HeirClaimPortal = () => {
  const [step, setStep] = useState(0);
  const [vaultId, setVaultId] = useState('');
  const [vaultData, setVaultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [transactionSigned, setTransactionSigned] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState('');

  // Simulated vault lookup - replace with actual API call
  const lookupVault = async (id) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data - replace with actual vault lookup
    if (id === 'demo' || id.length > 10) {
      setVaultData({
        id: id,
        name: 'Family Legacy Vault',
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        balance: '1.25',
        balanceUSD: '$125,000',
        unlockDate: '2024-12-31',
        unlockBlock: 880000,
        currentBlock: 878234,
        isUnlocked: true, // For demo purposes
        yourShare: '50%',
        yourAmount: '1.25',
        scriptType: 'timelock',
        coHeirs: [
          { name: 'Michael', relationship: 'Brother' }
        ]
      });
      setIsLoading(false);
      return true;
    } else {
      setError('Vault not found. Please check your vault ID and try again.');
      setIsLoading(false);
      return false;
    }
  };

  const handleVaultLookup = async () => {
    const success = await lookupVault(vaultId);
    if (success) {
      setStep(1);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { title: 'Find Vault', icon: QrCode },
    { title: 'Verify Status', icon: Clock },
    { title: 'Setup Wallet', icon: Wallet },
    { title: 'Connect Device', icon: Usb },
    { title: 'Claim Funds', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">BitTrust</h1>
              <p className="text-xs text-zinc-500">Inheritance Claim Portal</p>
            </div>
          </div>
          <a 
            href="https://sparrowwallet.com/download" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            Need Sparrow Wallet?
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Progress Bar */}
      {vaultData && (
        <div className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className={`flex flex-col items-center ${i <= step ? 'text-orange-400' : 'text-zinc-600'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1
                      ${i < step ? 'bg-orange-500 text-white' : i === step ? 'bg-orange-500/20 border-2 border-orange-500' : 'bg-zinc-800'}`}>
                      {i < step ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{s.title}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 sm:w-24 h-0.5 mx-1 ${i < step ? 'bg-orange-500' : 'bg-zinc-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 0: Find Vault */}
        {step === 0 && !vaultData && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Key className="w-10 h-10 text-orange-400" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Claim Your Inheritance</h2>
              <p className="text-zinc-400">
                Enter the vault ID from your heir kit to begin the claim process.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Vault ID or Address
                </label>
                <input
                  type="text"
                  value={vaultId}
                  onChange={(e) => setVaultId(e.target.value)}
                  placeholder="Enter vault ID or scan QR code"
                  className="w-full px-4 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white
                    placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-lg"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleVaultLookup}
                disabled={!vaultId || isLoading}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 
                  disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors
                  flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Looking up vault...
                  </>
                ) : (
                  <>
                    Find Vault
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-zinc-400" />
                Where do I find my Vault ID?
              </h3>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Check your <strong className="text-white">Heir Kit</strong> - it should include a document with your vault details</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Look for a <strong className="text-white">QR code</strong> - you can scan it with your phone's camera</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Contact your <strong className="text-white">co-heirs</strong> if you don't have the information</span>
                </li>
              </ul>
              
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-500">
                  <strong className="text-zinc-300">Demo:</strong> Enter "demo" as the vault ID to see how the claim process works.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Verify Status */}
        {step === 1 && vaultData && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Vault Found</h2>
              <p className="text-zinc-400">Verify the vault details match your heir kit</p>
            </div>

            {/* Vault Card */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{vaultData.name}</h3>
                  <p className="text-zinc-500">{vaultData.scriptType} vault</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-zinc-800/50 rounded-xl">
                  <p className="text-sm text-zinc-500 mb-1">Your Share</p>
                  <p className="text-2xl font-bold text-orange-400">{vaultData.yourAmount} BTC</p>
                  <p className="text-sm text-zinc-500">{vaultData.yourShare} of vault</p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-xl">
                  <p className="text-sm text-zinc-500 mb-1">Status</p>
                  {vaultData.isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <Unlock className="w-6 h-6 text-green-400" />
                      <span className="text-xl font-bold text-green-400">Unlocked</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-6 h-6 text-amber-400" />
                      <span className="text-xl font-bold text-amber-400">Locked</span>
                    </div>
                  )}
                  <p className="text-sm text-zinc-500">
                    {vaultData.isUnlocked ? 'Ready to claim' : `Unlocks ${vaultData.unlockDate}`}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-500 mb-2">Vault Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-zinc-300 font-mono bg-zinc-900 p-2 rounded">
                    {vaultData.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(vaultData.address)}
                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-zinc-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Alert */}
            {vaultData.isUnlocked ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-300 font-medium">Vault is Unlocked</p>
                    <p className="text-sm text-green-300/80 mt-1">
                      The timelock has expired. You can now claim your inheritance by following the steps below.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-medium">Vault Still Locked</p>
                    <p className="text-sm text-amber-300/80 mt-1">
                      This vault unlocks on {vaultData.unlockDate}. Please return after this date to claim your funds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Co-heirs */}
            {vaultData.coHeirs && vaultData.coHeirs.length > 0 && (
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">Other Beneficiaries</h4>
                <div className="space-y-2">
                  {vaultData.coHeirs.map((heir, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
                        {heir.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{heir.name}</p>
                        <p className="text-xs text-zinc-500">{heir.relationship}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-4 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!vaultData.isUnlocked}
                className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 
                  disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors
                  flex items-center justify-center gap-2"
              >
                Continue to Claim
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Setup Wallet */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Setup Sparrow Wallet</h2>
              <p className="text-zinc-400">You'll need wallet software to claim your Bitcoin</p>
            </div>

            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Sparrow Wallet</h3>
                  <p className="text-sm text-zinc-400">
                    Free, open-source Bitcoin wallet. Runs on your computer - no account needed.
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-white">Download Sparrow</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Go to sparrowwallet.com and download for your operating system (Windows, Mac, or Linux).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-white">Install and Open</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Run the installer and open Sparrow. It will connect to the Bitcoin network automatically.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-white">Import Vault Configuration</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      In Sparrow: File → Import Wallet → Select the vault file from your heir kit.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://sparrowwallet.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                  rounded-xl transition-colors text-center"
              >
                Download Sparrow Wallet
                <ExternalLink className="w-4 h-4 inline ml-2" />
              </a>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300">
                    <strong>Why Sparrow?</strong> It's trusted by the Bitcoin community, works with hardware wallets, 
                    and doesn't require creating an account or trusting any company with your coins.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold 
                  rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                I Have Sparrow Installed
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Connect Hardware Wallet */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Connect Your Hardware Wallet</h2>
              <p className="text-zinc-400">The device you received holds your signing key</p>
            </div>

            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-white">Locate Your Hardware Wallet</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Find the small device you were given (Coldcard, Trezor, Ledger, etc.). 
                      It may be in a safe or with your heir kit documents.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-white">Connect via USB</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Plug the device into your computer using the USB cable. 
                      Turn it on and enter your PIN if prompted.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-white">Sparrow Detects Device</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      In Sparrow, go to Settings → Hardware Wallet. Your device should appear. 
                      Follow prompts to connect.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware wallet images/icons */}
            <div className="grid grid-cols-4 gap-4">
              {['Coldcard', 'Trezor', 'Ledger', 'Other'].map((device) => (
                <div key={device} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Usb className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-400">{device}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-300">
                    <strong>Can't find your hardware wallet?</strong> Check your heir kit for recovery seed words. 
                    You can restore the wallet on a new device, but this should be a last resort.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setWalletConnected(true);
                  setStep(4);
                }}
                className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold 
                  rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Device Connected - Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Claim Funds */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Claim Your Bitcoin</h2>
              <p className="text-zinc-400">Create and sign the claim transaction</p>
            </div>

            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="space-y-6">
                {/* Destination Address */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Your Destination Address
                  </label>
                  <p className="text-xs text-zinc-500 mb-2">
                    Where should the Bitcoin be sent? Use an address from YOUR personal wallet.
                  </p>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="bc1q... or 3... or 1..."
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white
                      placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                {/* Transaction Summary */}
                <div className="p-4 bg-zinc-800/50 rounded-xl">
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">Transaction Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Amount</span>
                      <span className="text-white font-medium">{vaultData?.yourAmount} BTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Network Fee (estimated)</span>
                      <span className="text-white">~0.00005 BTC</span>
                    </div>
                    <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between">
                      <span className="text-zinc-400 font-medium">You Receive</span>
                      <span className="text-orange-400 font-bold">~{(parseFloat(vaultData?.yourAmount || 0) - 0.00005).toFixed(5)} BTC</span>
                    </div>
                  </div>
                </div>

                {/* Steps in Sparrow */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-zinc-300">In Sparrow Wallet:</p>
                  <div className="space-y-2 text-sm text-zinc-400">
                    <p>1. Click <strong className="text-white">Send</strong> tab</p>
                    <p>2. Paste your destination address above into "Pay to" field</p>
                    <p>3. Click <strong className="text-white">Create Transaction</strong></p>
                    <p>4. Review and click <strong className="text-white">Finalize Transaction for Signing</strong></p>
                    <p>5. Click <strong className="text-white">Sign</strong> - approve on your hardware wallet</p>
                    <p>6. Click <strong className="text-white">Broadcast Transaction</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-300">
                    <strong>Almost done!</strong> After broadcasting, your Bitcoin will arrive at your address 
                    within 10-60 minutes. Save the transaction ID for your records.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-4 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setTransactionSigned(true);
                  alert('In production, this would guide you through the actual signing process in Sparrow.');
                }}
                disabled={!destinationAddress}
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 
                  disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors
                  flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                I've Broadcast the Transaction
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {transactionSigned && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Congratulations!</h2>
              <p className="text-zinc-400 mb-6">
                Your inheritance claim has been submitted to the Bitcoin network. 
                The funds will arrive at your address within 10-60 minutes.
              </p>
              <div className="p-4 bg-zinc-800 rounded-xl mb-6">
                <p className="text-sm text-zinc-500 mb-1">Amount Claimed</p>
                <p className="text-3xl font-bold text-orange-400">{vaultData?.yourAmount} BTC</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
          <p>BitTrust - Sovereign Bitcoin Inheritance</p>
          <p className="mt-1">
            Need help? Contact your co-heirs or visit{' '}
            <a href="#" className="text-orange-400 hover:text-orange-300">support documentation</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HeirClaimPortal;
