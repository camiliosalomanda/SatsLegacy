import React, { useState } from 'react';
import {
  Package, Download, FileText, Key, Users, QrCode,
  CheckCircle, ChevronRight, ChevronLeft, Printer, X, Info
} from 'lucide-react';

const HeirKitGenerator = ({ vault, beneficiaries, onClose }) => {
  const [step, setStep] = useState(0);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [kitOptions, setKitOptions] = useState({
    includeVaultDocs: true,
    includeKeyInfo: true,
    includeRecoveryInstructions: true,
    includeCoHeirContacts: true,
    includeQRCodes: true,
  });
  const [generatedKit, setGeneratedKit] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const vaultData = vault || {
    name: 'Family Legacy Vault',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    balance: '2.5',
    balanceUSD: 250000,
    lockDate: new Date('2027-01-01'),
    scriptType: 'timelock',
  };

  const beneficiaryList = beneficiaries || [
    { name: 'Sarah (Daughter)', percentage: 50, pubkey: 'xpub6D4BDPcP2GT57...kL9m' },
    { name: 'Michael (Son)', percentage: 50, pubkey: 'xpub6E5C3H7K9M2R...nH2p' }
  ];

  const steps = [
    { title: 'Select Beneficiary', icon: Users },
    { title: 'Kit Contents', icon: Package },
    { title: 'Generate', icon: Download }
  ];

  const generateRecoveryInstructions = () => {
    const unlockDate = vaultData.lockDate instanceof Date 
      ? vaultData.lockDate.toLocaleDateString() 
      : vaultData.lockDate;
    
    return [
      { step: 1, title: 'Verify the Timelock Has Expired', description: `The vault unlocks on ${unlockDate}. Before this date, the funds cannot be claimed.`, simple: 'Think of this like a time-locked safe - it only opens after a specific date.' },
      { step: 2, title: 'Install Sparrow Wallet', description: 'Download Sparrow Wallet from sparrowwallet.com - free, open-source Bitcoin wallet software.', simple: 'Sparrow is like a secure banking app for Bitcoin that runs on your computer.' },
      { step: 3, title: 'Connect Your Hardware Wallet', description: 'Plug in your hardware wallet device. Sparrow will detect it automatically.', simple: 'Your hardware wallet is the small device you received - it holds your secret key.' },
      { step: 4, title: 'Import the Vault Configuration', description: 'In Sparrow: File → Import Wallet → Select the vault file from this kit.', simple: 'This tells Sparrow where the Bitcoin is stored.' },
      { step: 5, title: 'Create a Claim Transaction', description: 'Click "Send" in Sparrow. Enter YOUR destination address and set the fee.', simple: 'You are moving the coins from the vault to your personal wallet.' },
      { step: 6, title: 'Sign with Your Hardware Wallet', description: 'Approve the transaction on your hardware wallet screen.', simple: 'Your device asks you to verify and approve - this prevents mistakes.' },
      { step: 7, title: 'Broadcast the Transaction', description: 'Click "Broadcast" in Sparrow. Within 10-60 minutes, coins arrive.', simple: 'Like pressing send on a bank transfer - cannot be reversed once sent.' }
    ];
  };

  const generatePDFContent = () => {
    const unlockDate = vaultData.lockDate instanceof Date ? vaultData.lockDate.toLocaleDateString() : (vaultData.unlockDate || 'Not specified');
    const shareAmount = (parseFloat(vaultData.balance) * selectedBeneficiary.percentage / 100).toFixed(4);
    const instructions = generateRecoveryInstructions();
    
    return `<!DOCTYPE html><html><head><title>SatsLegacy Heir Kit - ${selectedBeneficiary.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;padding:40px;max-width:800px;margin:0 auto}
h1{font-size:28px;margin-bottom:8px}
h2{font-size:20px;margin:24px 0 12px;border-bottom:2px solid #f97316;padding-bottom:4px}
h3{font-size:16px;margin:16px 0 8px}
.subtitle{color:#666;margin-bottom:24px}
.warning{background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:24px 0}
.warning-title{font-weight:bold;margin-bottom:4px}
.info-grid{display:grid;grid-template-columns:140px 1fr;gap:8px;margin:16px 0}
.info-label{font-weight:600;color:#666}
.address{font-family:monospace;background:#f3f4f6;padding:8px 12px;border-radius:4px;word-break:break-all;font-size:14px}
.step{display:flex;gap:16px;margin:20px 0;padding:16px;background:#fafafa;border-radius:8px}
.step-number{width:32px;height:32px;background:#f97316;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0}
.step-content{flex:1}
.step-title{font-weight:600;margin-bottom:4px}
.step-desc{color:#444;font-size:14px}
.step-simple{color:#666;font-size:13px;font-style:italic;margin-top:8px}
.resources{background:#f8fafc;padding:20px;border-radius:8px;margin:24px 0}
.resource{margin:12px 0}
.resource-name{font-weight:600}
.resource-url{color:#2563eb;font-family:monospace;font-size:14px}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#666;font-size:12px}
@media print{body{padding:20px}.step{break-inside:avoid}h2{break-after:avoid}}
</style></head><body>
<h1>🔐 SatsLegacy Heir Kit</h1>
<p class="subtitle">Prepared for: <strong>${selectedBeneficiary.name}</strong> | Generated: ${new Date().toLocaleDateString()}</p>
<div class="warning"><div class="warning-title">⚠️ IMPORTANT: Store this document securely</div><div>This kit contains sensitive information about your Bitcoin inheritance. Keep it in a safe, safety deposit box, or other secure location.</div></div>
${kitOptions.includeVaultDocs ? `<h2>Vault Information</h2><div class="info-grid"><span class="info-label">Vault Name:</span><span>${vaultData.name}</span><span class="info-label">Vault Type:</span><span>${vaultData.scriptType || 'Timelock'}</span><span class="info-label">Unlock Date:</span><span>${unlockDate}</span><span class="info-label">Total Balance:</span><span>${vaultData.balance} BTC</span></div><h3>Vault Address</h3><div class="address">${vaultData.address}</div>` : ''}
${kitOptions.includeKeyInfo ? `<h2>Your Inheritance Share</h2><div class="info-grid"><span class="info-label">Your Percentage:</span><span>${selectedBeneficiary.percentage}%</span><span class="info-label">Your Amount:</span><span><strong>${shareAmount} BTC</strong></span></div>${selectedBeneficiary.pubkey ? `<h3>Your Public Key</h3><div class="address">${selectedBeneficiary.pubkey}</div>` : ''}` : ''}
${kitOptions.includeRecoveryInstructions ? `<h2>How to Claim Your Inheritance</h2><p style="margin-bottom:16px;color:#666">Follow these steps carefully after the timelock has expired:</p>${instructions.map(inst => `<div class="step"><div class="step-number">${inst.step}</div><div class="step-content"><div class="step-title">${inst.title}</div><div class="step-desc">${inst.description}</div><div class="step-simple">💡 ${inst.simple}</div></div></div>`).join('')}` : ''}
${kitOptions.includeCoHeirContacts && beneficiaryList.length > 1 ? `<h2>Other Beneficiaries</h2><p>You may need to coordinate with these co-heirs:</p><ul style="margin:12px 0 12px 24px">${beneficiaryList.filter(b => b.name !== selectedBeneficiary.name).map(b => `<li><strong>${b.name}</strong> (${b.percentage}%)</li>`).join('')}</ul>` : ''}
<div class="resources"><h2 style="margin-top:0">Important Resources</h2><div class="resource"><div class="resource-name">Sparrow Wallet Download</div><div class="resource-url">sparrowwallet.com/download</div></div><div class="resource"><div class="resource-name">Bitcoin Block Explorer</div><div class="resource-url">mempool.space</div></div><div class="resource"><div class="resource-name">SatsLegacy Claim Portal</div><div class="resource-url">btc-trust.vercel.app/#/claim</div></div></div>
<div class="warning" style="background:#f0f9ff;border-color:#3b82f6"><div class="warning-title">🔒 Security Reminders</div><ul style="margin:8px 0 0 20px"><li>Never share your hardware wallet PIN or seed phrase</li><li>Verify all addresses on your hardware wallet screen</li><li>When in doubt, ask a trusted technical friend for help</li></ul></div>
<div class="footer"><p>SatsLegacy - Sovereign Bitcoin Inheritance</p><p>Not your keys, not your coins. Not your script, not your inheritance.</p></div>
</body></html>`;
  };

  const handleGenerateKit = async () => {
    setIsGenerating(true);
    try {
      setGeneratedKit({
        generatedAt: new Date().toISOString(),
        beneficiary: selectedBeneficiary,
        vault: vaultData,
        options: kitOptions,
      });
    } catch (err) {
      console.error('Kit generation failed:', err);
    }
    setIsGenerating(false);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(generatedKit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heir-kit-${selectedBeneficiary.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const content = generatePDFContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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

        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-2 ${i <= step ? 'text-orange-400' : 'text-zinc-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i < step ? 'bg-orange-500 text-white' : i === step ? 'bg-orange-500/20 border border-orange-500' : 'bg-zinc-800'}`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-12 sm:w-24 h-px mx-2 ${i < step ? 'bg-orange-500' : 'bg-zinc-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Select Beneficiary</h3>
                <p className="text-sm text-zinc-400">Choose which heir to generate a kit for</p>
              </div>
              <div className="space-y-3">
                {beneficiaryList.map((beneficiary, index) => (
                  <button key={index} onClick={() => setSelectedBeneficiary(beneficiary)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${selectedBeneficiary?.name === beneficiary.name ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${selectedBeneficiary?.name === beneficiary.name ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                          {beneficiary.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{beneficiary.name}</p>
                          <p className="text-sm text-zinc-500">Beneficiary</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-400 font-semibold">{beneficiary.percentage}%</p>
                        <p className="text-sm text-zinc-500">{(parseFloat(vaultData.balance) * beneficiary.percentage / 100).toFixed(4)} BTC</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Kit Contents</h3>
                <p className="text-sm text-zinc-400">Select what to include in {selectedBeneficiary?.name}'s kit</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'includeVaultDocs', icon: FileText, label: 'Vault Documentation', description: 'Vault address, policy, timelock date', recommended: true },
                  { key: 'includeKeyInfo', icon: Key, label: 'Key Information', description: 'Their xpub and share percentage', recommended: true },
                  { key: 'includeRecoveryInstructions', icon: FileText, label: 'Recovery Instructions', description: 'Step-by-step claiming guide', recommended: true },
                  { key: 'includeCoHeirContacts', icon: Users, label: 'Co-Heir Information', description: 'Other beneficiaries for coordination', recommended: beneficiaryList.length > 1 },
                ].map((item) => (
                  <label key={item.key} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${kitOptions[item.key] ? 'bg-orange-500/10 border-orange-500/50' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}>
                    <input type="checkbox" checked={kitOptions[item.key]} onChange={(e) => setKitOptions(prev => ({ ...prev, [item.key]: e.target.checked }))} className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-900 text-orange-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-zinc-400" />
                        <span className="font-medium text-white">{item.label}</span>
                        {item.recommended && <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full">Recommended</span>}
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
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
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">{selectedBeneficiary?.name.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-white">{selectedBeneficiary?.name}</p>
                          <p className="text-sm text-zinc-500">{selectedBeneficiary?.percentage}% • {(parseFloat(vaultData.balance) * selectedBeneficiary?.percentage / 100).toFixed(4)} BTC</p>
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
                      </div>
                    </div>
                  </div>
                  <button onClick={handleGenerateKit} disabled={isGenerating} className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    {isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : <><Package className="w-5 h-5" />Generate Heir Kit</>}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-400" /></div>
                    <h3 className="text-lg font-semibold text-white mb-2">Kit Generated!</h3>
                    <p className="text-sm text-zinc-400">Ready for {selectedBeneficiary?.name}</p>
                  </div>
                  <div className="space-y-3">
                    <button onClick={handlePrint} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Printer className="w-5 h-5" />Print / Save as PDF
                    </button>
                    <button onClick={handleDownloadJSON} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />Download Data (JSON)
                    </button>
                    <button onClick={() => { setGeneratedKit(null); setStep(0); setSelectedBeneficiary(null); }} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Users className="w-4 h-4" />Generate for Another Heir
                    </button>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-300 font-medium">Next Steps</p>
                        <ul className="text-sm text-blue-300/80 mt-2 space-y-1">
                          <li>• Print and deliver kit to {selectedBeneficiary?.name}</li>
                          <li>• Walk them through the contents</li>
                          <li>• Ensure they store it securely</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {!generatedKit && (
          <div className="p-6 border-t border-zinc-800 flex justify-between">
            <button onClick={() => step === 0 ? onClose() : setStep(step - 1)} className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />{step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < 2 && (
              <button onClick={() => setStep(step + 1)} disabled={step === 0 && !selectedBeneficiary} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2">
                Next<ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeirKitGenerator;
