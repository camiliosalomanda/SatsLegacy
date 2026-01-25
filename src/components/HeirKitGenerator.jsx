import React, { useState } from 'react';
import {
  Package, Download, FileText, Key, Users, MapPin, QrCode,
  Shield, CheckCircle, ChevronRight, ChevronLeft,
  Copy, Check, AlertTriangle, Printer, Mail, Lock, Unlock,
  X, Info, Clock, Wallet
} from 'lucide-react';

// ============================================
// HEIR KIT GENERATOR
// Generates complete inheritance packages for beneficiaries
// ============================================

const HeirKitGenerator = ({ vault, beneficiaries, onClose, onGeneratePDF }) => {
  const [step, setStep] = useState(0);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [kitOptions, setKitOptions] = useState({
    includeVaultDocs: true,
    includeKeyInfo: true,
    includeRecoveryInstructions: true,
    includeCoHeirContacts: true,
    includeBackupLocations: false,
    includeQRCodes: true,
    encryptKit: false,
    encryptionPassword: '',
    deliveryMethod: 'download'
  });
  const [generatedKit, setGeneratedKit] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Default vault data if not provided
  const vaultData = vault || {
    name: 'Family Legacy Vault',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    balance: '2.5',
    balanceUSD: '$250,000',
    unlockDate: '12/31/2026',
    daysRemaining: 341,
    scriptType: 'timelock',
    miniscript: 'or(pk(owner), and(thresh(1, pk(heir1), pk(heir2)), after(1798761600)))'
  };

  const beneficiaryList = beneficiaries || [
    { id: 1, name: 'Sarah', relationship: 'Daughter', percentage: 50, xpub: 'xpub6D4BDPcP2GT57...kL9m', amount: '1.25' },
    { id: 2, name: 'Michael', relationship: 'Son', percentage: 50, xpub: 'xpub6E5C3H7K9M2R...nH2p', amount: '1.25' }
  ];

  const steps = [
    { title: 'Select Beneficiary', icon: Users },
    { title: 'Kit Contents', icon: Package },
    { title: 'Security', icon: Shield },
    { title: 'Generate', icon: Download }
  ];

  const generateRecoveryInstructions = () => {
    return [
      {
        step: 1,
        title: 'Verify the Timelock Has Expired',
        description: `The vault unlocks on ${vaultData.unlockDate}. Before this date, the funds cannot be claimed.`,
        simple: 'Think of this like a time-locked safe - it only opens after a specific date.',
        action: 'Check mempool.space to verify the current date/block.'
      },
      {
        step: 2,
        title: 'Install Sparrow Wallet',
        description: 'Download Sparrow Wallet from sparrowwallet.com - free, open-source Bitcoin wallet software.',
        simple: 'Sparrow is like a secure banking app for Bitcoin that runs on your computer.',
        action: 'Go to sparrowwallet.com/download and install for your operating system.'
      },
      {
        step: 3,
        title: 'Connect Your Hardware Wallet',
        description: 'Plug in your hardware wallet device. Sparrow will detect it automatically.',
        simple: 'Your hardware wallet is the small device you received - it holds your secret key.',
        action: 'Connect via USB cable and unlock your device.'
      },
      {
        step: 4,
        title: 'Import the Vault Configuration',
        description: 'In Sparrow: File → Import Wallet → Select the vault file from this kit.',
        simple: 'This tells Sparrow where the Bitcoin is stored.',
        action: 'Use the vault configuration file included in this kit.'
      },
      {
        step: 5,
        title: 'Create a Claim Transaction',
        description: 'Click "Send" in Sparrow. Enter YOUR destination address and set the fee.',
        simple: 'You are moving the coins from the vault to your personal wallet.',
        action: 'Use a new address from YOUR wallet as the destination.'
      },
      {
        step: 6,
        title: 'Sign with Your Hardware Wallet',
        description: 'Approve the transaction on your hardware wallet screen.',
        simple: 'Your device asks you to verify and approve - this prevents mistakes.',
        action: 'Check the amount and address on device, then confirm.'
      },
      {
        step: 7,
        title: 'Broadcast the Transaction',
        description: 'Click "Broadcast" in Sparrow. Within 10-60 minutes, coins arrive.',
        simple: 'Like pressing send on a bank transfer - cannot be reversed once sent.',
        action: 'Save the transaction ID for your records.'
      }
    ];
  };

  const handleGenerateKit = async () => {
    setIsGenerating(true);
    
    // Build kit data
    const kitData = {
      generatedAt: new Date().toISOString(),
      beneficiary: selectedBeneficiary,
      vault: vaultData,
      options: kitOptions,
      recoveryInstructions: kitOptions.includeRecoveryInstructions ? generateRecoveryInstructions() : null,
      coHeirs: kitOptions.includeCoHeirContacts 
        ? beneficiaryList.filter(b => b.id !== selectedBeneficiary.id)
        : null
    };
    
    // If PDF generation callback provided, use it
    if (onGeneratePDF) {
      try {
        await onGeneratePDF(kitData);
      } catch (err) {
        console.error('PDF generation failed:', err);
      }
    }
    
    setGeneratedKit(kitData);
    setIsGenerating(false);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(generatedKit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heir-kit-${selectedBeneficiary.name.toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Generate Heir Kit</h2>
              <p className="text-sm text-zinc-500">Create inheritance package for beneficiary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-2 ${i <= step ? 'text-orange-400' : 'text-zinc-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${i < step ? 'bg-orange-500 text-white' : i === step ? 'bg-orange-500/20 border border-orange-500' : 'bg-zinc-800'}`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-px mx-2 ${i < step ? 'bg-orange-500' : 'bg-zinc-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 0: Select Beneficiary */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Select Beneficiary</h3>
                <p className="text-sm text-zinc-400">Choose which heir to generate a kit for</p>
              </div>
              
              <div className="space-y-3">
                {beneficiaryList.map((beneficiary) => (
                  <button
                    key={beneficiary.id}
                    onClick={() => setSelectedBeneficiary(beneficiary)}
                    className={`w-full p-4 rounded-xl border transition-all text-left
                      ${selectedBeneficiary?.id === beneficiary.id 
                        ? 'bg-orange-500/10 border-orange-500' 
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                          ${selectedBeneficiary?.id === beneficiary.id ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                          {beneficiary.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{beneficiary.name}</p>
                          <p className="text-sm text-zinc-500">{beneficiary.relationship}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-400 font-semibold">{beneficiary.percentage}%</p>
                        <p className="text-sm text-zinc-500">{beneficiary.amount} BTC</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Kit Contents */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Kit Contents</h3>
                <p className="text-sm text-zinc-400">Select what to include in {selectedBeneficiary?.name}'s kit</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'includeVaultDocs', icon: FileText, label: 'Vault Documentation', 
                    description: 'Vault address, policy, timelock date', recommended: true },
                  { key: 'includeKeyInfo', icon: Key, label: 'Key Information', 
                    description: 'Their xpub and role in the vault', recommended: true },
                  { key: 'includeRecoveryInstructions', icon: FileText, label: 'Recovery Instructions', 
                    description: 'Step-by-step claiming guide (non-technical)', recommended: true },
                  { key: 'includeCoHeirContacts', icon: Users, label: 'Co-Heir Contacts', 
                    description: 'Other beneficiary info if needed', recommended: beneficiaryList.length > 1 },
                  { key: 'includeQRCodes', icon: QrCode, label: 'QR Codes', 
                    description: 'Scannable vault address and xpub', recommended: true }
                ].map((item) => (
                  <label key={item.key} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all
                    ${kitOptions[item.key] ? 'bg-orange-500/10 border-orange-500/50' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
                    <input
                      type="checkbox"
                      checked={kitOptions[item.key]}
                      onChange={(e) => setKitOptions(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-900 text-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-zinc-400" />
                        <span className="font-medium text-white">{item.label}</span>
                        {item.recommended && (
                          <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full">Recommended</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Security */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Security & Delivery</h3>
                <p className="text-sm text-zinc-400">How should the kit be delivered?</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'download', icon: Download, label: 'Download PDF' },
                  { value: 'print', icon: Printer, label: 'Print' },
                  { value: 'email', icon: Mail, label: 'Email' }
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setKitOptions(prev => ({ ...prev, deliveryMethod: method.value }))}
                    className={`p-4 rounded-xl border text-center transition-all
                      ${kitOptions.deliveryMethod === method.value 
                        ? 'bg-orange-500/10 border-orange-500' 
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}
                  >
                    <method.icon className={`w-6 h-6 mx-auto mb-2 ${kitOptions.deliveryMethod === method.value ? 'text-orange-400' : 'text-zinc-400'}`} />
                    <p className={`font-medium text-sm ${kitOptions.deliveryMethod === method.value ? 'text-white' : 'text-zinc-300'}`}>{method.label}</p>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-300 font-medium">Physical Security</p>
                    <p className="text-sm text-amber-300/80 mt-1">
                      Store printed copies in a secure location (safe, safety deposit box). 
                      Digital copies should be encrypted or stored on secure devices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <div className="space-y-6">
              {!generatedKit ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Review & Generate</h3>
                    <p className="text-sm text-zinc-400">Confirm details before generating</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">Beneficiary</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                          {selectedBeneficiary?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{selectedBeneficiary?.name}</p>
                          <p className="text-sm text-zinc-500">{selectedBeneficiary?.percentage}% • {selectedBeneficiary?.amount} BTC</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">Contents</h4>
                      <div className="flex flex-wrap gap-2">
                        {kitOptions.includeVaultDocs && <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm rounded-full">Vault Docs</span>}
                        {kitOptions.includeKeyInfo && <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm rounded-full">Key Info</span>}
                        {kitOptions.includeRecoveryInstructions && <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm rounded-full">Recovery Guide</span>}
                        {kitOptions.includeCoHeirContacts && <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm rounded-full">Co-Heirs</span>}
                        {kitOptions.includeQRCodes && <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm rounded-full">QR Codes</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateKit}
                    disabled={isGenerating}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50
                      text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Package className="w-5 h-5" />
                        Generate Heir Kit
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Kit Generated!</h3>
                    <p className="text-sm text-zinc-400">Ready for {selectedBeneficiary?.name}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleDownloadJSON}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold 
                        rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Kit (JSON)
                    </button>
                    
                    <button
                      onClick={() => {
                        setGeneratedKit(null);
                        setStep(0);
                        setSelectedBeneficiary(null);
                      }}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium 
                        rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Generate for Another Heir
                    </button>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-300 font-medium">Next Steps</p>
                        <ul className="text-sm text-blue-300/80 mt-2 space-y-1">
                          <li>• Deliver kit to {selectedBeneficiary?.name} securely</li>
                          <li>• Walk them through the contents</li>
                          <li>• Ensure they store it safely</li>
                          <li>• Keep a backup copy yourself</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!generatedKit && (
          <div className="p-6 border-t border-zinc-800 flex justify-between">
            <button
              onClick={() => step === 0 ? onClose() : setStep(step - 1)}
              className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !selectedBeneficiary}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 
                  disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeirKitGenerator;
