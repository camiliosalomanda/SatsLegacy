import React, { useState, useRef } from 'react';
import {
  FileInput,
  X,
  Upload,
  Check,
  Loader2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useSettings } from '../contexts/SettingsContext';
import { validatePsbt, finalizePsbt } from '../vault/scripts/psbt-builder';
import { broadcastTransaction, fetchTransaction } from '../utils/api/blockchain';
import { copyToClipboard } from '../utils/clipboard';
import type { Vault } from '../types/vault';

interface PSBTImportModalProps {
  vault: Vault;
}

type Step = 'import' | 'review' | 'broadcast' | 'success';

interface ParsedPsbt {
  inputCount: number;
  outputCount: number;
  raw: string;
}

export function PSBTImportModal({ vault }: PSBTImportModalProps) {
  const { closeModal } = useUI();
  const { settings } = useSettings();

  const [step, setStep] = useState<Step>('import');
  const [psbtInput, setPsbtInput] = useState('');
  const [parsedPsbt, setParsedPsbt] = useState<ParsedPsbt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txResult, setTxResult] = useState<{ txid: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPsbtInput(content.trim());
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleValidatePsbt = () => {
    if (!psbtInput.trim()) {
      setError('Please enter or upload a PSBT');
      return;
    }

    const validation = validatePsbt(psbtInput.trim(), settings.network);

    if (!validation.valid) {
      setError(validation.error || 'Invalid PSBT format');
      return;
    }

    setParsedPsbt({
      inputCount: validation.inputCount || 0,
      outputCount: validation.outputCount || 0,
      raw: psbtInput.trim(),
    });
    setError(null);
    setStep('review');
  };

  const handleFinalize = async () => {
    if (!parsedPsbt) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Finalize the PSBT (extract the signed transaction)
      const result = finalizePsbt(parsedPsbt.raw, settings.network);

      if (result.error || !result.txHex) {
        setError(result.error || 'Failed to finalize PSBT - it may not be fully signed');
        setIsProcessing(false);
        return;
      }

      setStep('broadcast');

      // Broadcast the transaction
      const broadcastResult = await broadcastTransaction(result.txHex, settings.network);

      if (!broadcastResult.success) {
        setError(broadcastResult.error || 'Broadcast failed');
        setIsProcessing(false);
        return;
      }

      setTxResult({ txid: broadcastResult.txid! });
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyTxid = async () => {
    if (txResult?.txid) {
      await copyToClipboard(txResult.txid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExplorerUrl = (txid: string) => {
    switch (settings.network) {
      case 'mainnet':
        return `https://mempool.space/tx/${txid}`;
      case 'testnet':
        return `https://mempool.space/testnet/tx/${txid}`;
      case 'signet':
        return `https://mempool.space/signet/tx/${txid}`;
      default:
        return `https://mempool.space/tx/${txid}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FileInput size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Signed PSBT</h2>
              <p className="text-sm text-zinc-500">{vault.name}</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {['import', 'review', 'broadcast', 'success'].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-orange-500 text-black'
                      : ['import', 'review', 'broadcast', 'success'].indexOf(step) > i
                      ? 'bg-green-500 text-black'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {['import', 'review', 'broadcast', 'success'].indexOf(step) > i ? (
                    <Check size={16} />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && (
                  <div
                    className={`w-8 h-0.5 ${
                      ['import', 'review', 'broadcast', 'success'].indexOf(step) > i
                        ? 'bg-green-500'
                        : 'bg-zinc-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Import Step */}
          {step === 'import' && (
            <>
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-400">
                  Import a signed PSBT from your hardware wallet (Coldcard, Trezor, Ledger)
                  or signing software (Sparrow, Bitcoin Core).
                </p>
              </div>

              {/* Security Notes */}
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-300 font-medium mb-1">🔐 SECURITY</p>
                <ul className="text-xs text-green-300/70 space-y-1">
                  <li>• PSBT keeps private keys on your hardware wallet - never exposed</li>
                  <li>• Always verify addresses and amounts on your hardware wallet screen</li>
                  <li>• Broadcast routes through Tor if enabled in Settings</li>
                </ul>
              </div>

              {/* File upload */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".psbt,.txt"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={20} />
                  Upload .psbt file
                </button>
              </div>

              {/* Text input */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Or paste PSBT (Base64 or Hex)</label>
                <textarea
                  value={psbtInput}
                  onChange={(e) => {
                    setPsbtInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="cHNidP8BAH..."
                  rows={6}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleValidatePsbt}
                disabled={!psbtInput.trim()}
                className="w-full py-3 bg-orange-500 text-black font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Validate PSBT
              </button>
            </>
          )}

          {/* Review Step */}
          {step === 'review' && parsedPsbt && (
            <>
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={18} className="text-green-400" />
                  <p className="text-green-400 font-medium">Valid PSBT</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Inputs</p>
                    <p className="text-white font-medium">{parsedPsbt.inputCount}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Outputs</p>
                    <p className="text-white font-medium">{parsedPsbt.outputCount}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Before broadcasting</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Make sure this PSBT was signed by your hardware wallet and you've verified
                      the transaction details on the device screen.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep('import');
                    setError(null);
                  }}
                  className="flex-1 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-orange-500 text-black font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Radio size={18} />
                      Finalize & Broadcast
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Broadcast Step (loading state) */}
          {step === 'broadcast' && isProcessing && (
            <div className="py-12 text-center">
              <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-white font-medium">Broadcasting transaction...</p>
              <p className="text-sm text-zinc-500 mt-2">
                Submitting to {settings.network} network
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && txResult && (
            <>
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Transaction Broadcast!</h3>
                <p className="text-zinc-400">
                  Your transaction has been submitted to the {settings.network} network.
                </p>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <p className="text-xs text-zinc-500 mb-2">Transaction ID</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-orange-400 font-mono break-all">
                    {txResult.txid}
                  </code>
                  <button
                    onClick={handleCopyTxid}
                    className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              <a
                href={getExplorerUrl(txResult.txid)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                View on Mempool.space
              </a>

              <button
                onClick={closeModal}
                className="w-full py-3 bg-orange-500 text-black font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
