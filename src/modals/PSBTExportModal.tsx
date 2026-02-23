import React, { useState } from 'react';
import { FileOutput, X, Copy, Check, Loader2, Download, Send, ArrowRight, Upload } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useSettings } from '../contexts/SettingsContext';
import { createSweepPsbt, type PSBTResult } from '../vault/scripts/psbt-builder';
import { copyToClipboard } from '../utils/clipboard';
import type { Vault } from '../types/vault';

interface PSBTExportModalProps {
  vault: Vault;
}

type FeePriority = 'fastest' | 'halfHour' | 'hour' | 'economy';
type SpendPath = 'owner' | 'heir';

export function PSBTExportModal({ vault }: PSBTExportModalProps) {
  const { closeModal, openModal } = useUI();
  const { settings } = useSettings();

  const isMultisigDecay = vault.logic?.primary === 'multisig_decay';
  const [destinationAddress, setDestinationAddress] = useState('');
  const [feePriority, setFeePriority] = useState<FeePriority>('hour');
  const [spendPath, setSpendPath] = useState<SpendPath>('owner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [psbtResult, setPsbtResult] = useState<PSBTResult | null>(null);
  const [copied, setCopied] = useState(false);

  const canUseHeirPath = vault.beneficiaries?.some(b => b.pubkey);

  const handleGeneratePsbt = async () => {
    if (!destinationAddress || destinationAddress.length < 20) return;

    setIsGenerating(true);
    setPsbtResult(null);

    // Debug: Log vault witnessScript
    console.log('[PSBTExportModal] Vault witnessScript:', vault.witnessScript);
    console.log('[PSBTExportModal] Vault witnessScript length:', vault.witnessScript?.length);
    console.log('[PSBTExportModal] Vault ownerPubkey:', vault.ownerPubkey);
    console.log('[PSBTExportModal] Vault beneficiaries:', vault.beneficiaries?.map(b => b.pubkey));

    try {
      const result = await createSweepPsbt(
        vault,
        {
          destinationAddress,
          feePriority,
          spendPath,
          heirPubkey: spendPath === 'heir' ? vault.beneficiaries?.[0]?.pubkey : undefined,
        },
        settings.network
      );

      setPsbtResult(result);
    } catch (e) {
      setPsbtResult({
        psbtBase64: '',
        psbtHex: '',
        fee: 0,
        feeRate: 0,
        inputCount: 0,
        outputCount: 0,
        totalInput: 0,
        totalOutput: 0,
        destinationAddress,
        error: e instanceof Error ? e.message : 'Failed to generate PSBT'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPsbt = async () => {
    if (psbtResult?.psbtBase64) {
      await copyToClipboard(psbtResult.psbtBase64);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPsbt = () => {
    if (psbtResult?.psbtBase64) {
      // Convert base64 to binary for proper .psbt file format
      const binaryString = atob(psbtResult.psbtBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vault.name.replace(/\s+/g, '-')}-${spendPath}.psbt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatSats = (sats: number) => {
    if (sats >= 100000000) {
      return `${(sats / 100000000).toFixed(8)} BTC`;
    }
    return `${sats.toLocaleString()} sats`;
  };

  const hasRequiredConfig = vault.address && vault.ownerPubkey;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FileOutput size={20} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export PSBT</h2>
              <p className="text-sm text-zinc-500">{vault.name}</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!hasRequiredConfig ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-400 font-medium">Configuration Required</p>
              <p className="text-sm text-zinc-400 mt-1">
                This vault needs an owner key and address before PSBTs can be generated.
                Add an owner key and beneficiary first.
              </p>
            </div>
          ) : (
            <>
              {/* Vault Info */}
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Balance</span>
                  <span className="text-white font-medium">{vault.balance.toFixed(8)} BTC</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-zinc-400">Address</span>
                  <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">{vault.address}</span>
                </div>
              </div>

              {/* Security Notes */}
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-300 font-medium mb-1">🔐 PSBT SECURITY</p>
                <ul className="text-xs text-green-300/70 space-y-1">
                  <li>• PSBT contains no private keys - safe to transfer via USB/email</li>
                  <li>• Sign on hardware wallet - verify destination address on device screen</li>
                  <li>• Never trust addresses shown only on computer - verify on hardware</li>
                </ul>
              </div>

              {!psbtResult?.psbtBase64 && (
                <>
                  {/* Spend Path Selection */}
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Spending Path</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSpendPath('owner')}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          spendPath === 'owner'
                            ? 'bg-orange-500/10 border-orange-500/50 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <p className="font-medium">{isMultisigDecay ? 'Before Decay' : 'Owner'}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {isMultisigDecay ? 'Multi-sig threshold spend' : 'Spend anytime with owner key'}
                        </p>
                      </button>
                      <button
                        onClick={() => setSpendPath('heir')}
                        disabled={!canUseHeirPath}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          spendPath === 'heir'
                            ? 'bg-orange-500/10 border-orange-500/50 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        } ${!canUseHeirPath ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <p className="font-medium">{isMultisigDecay ? 'After Decay' : 'Heir'}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {isMultisigDecay
                            ? 'Reduced threshold + timelock'
                            : canUseHeirPath ? 'After timelock expires' : 'No heir key configured'}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Destination Address */}
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Destination Address</label>
                    <input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder={settings.network === 'mainnet' ? 'bc1q...' : 'tb1q...'}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Fee Priority */}
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Fee Priority</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['fastest', 'halfHour', 'hour', 'economy'] as FeePriority[]).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setFeePriority(priority)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            feePriority === priority
                              ? 'bg-orange-500 text-black'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {priority === 'fastest' ? 'Fast' :
                           priority === 'halfHour' ? '30min' :
                           priority === 'hour' ? '1hr' : 'Low'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGeneratePsbt}
                    disabled={!destinationAddress || destinationAddress.length < 20 || isGenerating}
                    className="w-full py-3 bg-orange-500 text-black font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Generating PSBT...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Generate PSBT
                      </>
                    )}
                  </button>
                </>
              )}

              {/* PSBT Result */}
              {psbtResult && (
                <>
                  {psbtResult.error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-red-400 font-medium">Error</p>
                      <p className="text-sm text-zinc-400 mt-1">{psbtResult.error}</p>
                      <button
                        onClick={() => setPsbtResult(null)}
                        className="mt-3 text-sm text-zinc-500 hover:text-white transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Check size={18} className="text-green-400" />
                          <p className="text-green-400 font-medium">PSBT Generated</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-zinc-500">Inputs</p>
                            <p className="text-white">{psbtResult.inputCount}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Total In</p>
                            <p className="text-white">{formatSats(psbtResult.totalInput)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Fee</p>
                            <p className="text-white">{formatSats(psbtResult.fee)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Fee Rate</p>
                            <p className="text-white">{psbtResult.feeRate} sat/vB</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-green-500/20">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-500">Output:</span>
                            <span className="text-orange-400 font-medium">{formatSats(psbtResult.totalOutput)}</span>
                            <ArrowRight size={14} className="text-zinc-600" />
                            <span className="text-zinc-400 font-mono text-xs truncate max-w-[150px]">
                              {psbtResult.destinationAddress}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PSBT Output */}
                      <div>
                        <label className="block text-sm text-zinc-400 mb-2">PSBT (Base64)</label>
                        <div className="p-3 bg-zinc-800 rounded-xl">
                          <code className="text-xs text-zinc-300 break-all block max-h-32 overflow-y-auto">
                            {psbtResult.psbtBase64}
                          </code>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyPsbt}
                          className="flex-1 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                        >
                          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={handleDownloadPsbt}
                          className="flex-1 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={18} />
                          Download .psbt
                        </button>
                      </div>

                      <button
                        onClick={() => setPsbtResult(null)}
                        className="w-full py-2 text-zinc-500 hover:text-white transition-colors text-sm"
                      >
                        Generate New PSBT
                      </button>

                      <div className="pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 text-center mb-3">
                          Sign this PSBT with your hardware wallet, then import the signed version to broadcast.
                        </p>
                        <button
                          onClick={() => {
                            closeModal();
                            setTimeout(() => openModal({ type: 'psbtImport', vault }), 100);
                          }}
                          className="w-full py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-medium rounded-xl hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Upload size={18} />
                          Import Signed PSBT
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
