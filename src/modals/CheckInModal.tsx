import React, { useState, useEffect } from 'react';
import { Heart, X, Copy, Check, Loader2, Download, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useSettings } from '../contexts/SettingsContext';
import { createRefreshPsbt, estimateRefreshCost, type RefreshPSBTResult } from '../vault/scripts/psbt-builder';
import { copyToClipboard } from '../utils/clipboard';
import type { Vault } from '../types/vault';

interface CheckInModalProps {
  vault: Vault;
}

type FeePriority = 'fastest' | 'halfHour' | 'hour' | 'economy';

export function CheckInModal({ vault }: CheckInModalProps) {
  const { closeModal } = useUI();
  const { settings } = useSettings();

  const [feePriority, setFeePriority] = useState<FeePriority>('hour');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEstimating, setIsEstimating] = useState(true);
  const [psbtResult, setPsbtResult] = useState<RefreshPSBTResult | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Estimate fee on load
  useEffect(() => {
    async function estimate() {
      setIsEstimating(true);
      const result = await estimateRefreshCost(vault, settings.network);
      setEstimatedFee(result.estimatedFee);
      setIsEstimating(false);
    }
    estimate();
  }, [vault, settings.network]);

  const handleGeneratePsbt = async () => {
    setIsGenerating(true);
    setPsbtResult(null);

    try {
      const result = await createRefreshPsbt(
        vault,
        { feePriority },
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
        destinationAddress: vault.address || '',
        newAddress: vault.address || '',
        refreshType: 'same',
        error: e instanceof Error ? e.message : 'Failed to generate check-in PSBT'
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
      const blob = new Blob([psbtResult.psbtBase64], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vault.name.replace(/\s+/g, '-')}-checkin-${Date.now()}.psbt`;
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

  const checkInStatus = vault.checkIn;
  const daysRemaining = checkInStatus?.daysRemaining || vault.inactivityTrigger || 90;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Heart size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Check-In</h2>
              <p className="text-sm text-zinc-500">Dead Man's Switch</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border ${
            checkInStatus?.status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
            checkInStatus?.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {checkInStatus?.status === 'critical' ? (
                <AlertTriangle size={24} className="text-red-400" />
              ) : checkInStatus?.status === 'warning' ? (
                <Clock size={24} className="text-yellow-400" />
              ) : (
                <Check size={24} className="text-green-400" />
              )}
              <div>
                <p className={`font-medium ${
                  checkInStatus?.status === 'critical' ? 'text-red-400' :
                  checkInStatus?.status === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {checkInStatus?.status === 'critical' ? 'Check-in Urgent!' :
                   checkInStatus?.status === 'warning' ? 'Check-in Soon' :
                   'Vault Healthy'}
                </p>
                <p className="text-sm text-zinc-400">
                  {daysRemaining} days until heir can claim
                </p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 bg-zinc-800/50 rounded-xl">
            <h3 className="font-medium text-white mb-2">How Check-In Works</h3>
            <p className="text-sm text-zinc-400 mb-3">
              Checking in creates a transaction that spends your vault funds back to the same vault address.
              This resets the inactivity timer because Bitcoin's CSV (relative timelock) measures time since
              the last transaction.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw size={14} className="text-orange-400" />
              <span className="text-zinc-300">Timer resets to {vault.inactivityTrigger || 90} days</span>
            </div>
          </div>

          {/* Fee Estimate */}
          <div className="p-4 bg-zinc-800/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Estimated Fee</span>
              <span className="text-white font-mono">
                {isEstimating ? '...' : formatSats(estimatedFee)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              On-chain transaction fee required
            </p>
          </div>

          {!psbtResult?.psbtBase64 && (
            <>
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
                          ? 'bg-green-500 text-black'
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
                disabled={isGenerating || isEstimating}
                className="w-full py-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Heart size={18} />
                    Generate Check-In PSBT
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
                      <p className="text-green-400 font-medium">Check-In PSBT Ready</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-zinc-500">Fee</p>
                        <p className="text-white">{formatSats(psbtResult.fee)}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Fee Rate</p>
                        <p className="text-white">{psbtResult.feeRate} sat/vB</p>
                      </div>
                    </div>
                  </div>

                  {/* PSBT Output */}
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">PSBT (Base64)</label>
                    <div className="p-3 bg-zinc-800 rounded-xl">
                      <code className="text-xs text-zinc-300 break-all block max-h-24 overflow-y-auto">
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
                      Download
                    </button>
                  </div>

                  <button
                    onClick={() => setPsbtResult(null)}
                    className="w-full py-2 text-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    Generate New PSBT
                  </button>

                  <div className="p-4 bg-zinc-800/50 rounded-xl">
                    <h4 className="font-medium text-white mb-2">Next Steps</h4>
                    <ol className="text-sm text-zinc-400 space-y-2">
                      <li>1. Import this PSBT into your hardware wallet</li>
                      <li>2. Sign the transaction with your owner key</li>
                      <li>3. Broadcast the signed transaction</li>
                      <li>4. Timer resets when transaction confirms</li>
                    </ol>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
