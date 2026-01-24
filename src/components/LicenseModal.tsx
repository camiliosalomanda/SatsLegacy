/**
 * BitTrust License Modal
 * 
 * Handles license purchase and activation.
 */

import React, { useState } from 'react';
import { X, Shield, Check, Zap, Crown, Key, ExternalLink } from 'lucide-react';

interface LicenseModalProps {
  onClose: () => void;
  onActivate: (key: string) => Promise<{ success: boolean; error?: string }>;
  onPurchase: (tier: 'standard' | 'pro') => Promise<void>;
  currentTier: 'free' | 'standard' | 'pro';
}

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceNote: 'forever',
    features: [
      '3 vaults maximum',
      'Basic timelock scripts',
      'Local storage only',
      'Community support'
    ],
    limitations: [
      'No Shamir backups',
      'No Nostr sync',
      'No legal templates'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$99',
    priceNote: 'one-time',
    features: [
      '10 vaults',
      'All inheritance logic types',
      'Shamir backup splits',
      'Nostr relay backup',
      'Email support'
    ],
    limitations: [
      'No legal templates'
    ],
    highlighted: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$299',
    priceNote: 'one-time',
    features: [
      'Unlimited vaults',
      'All inheritance logic types',
      'Shamir backup splits',
      'Nostr relay backup',
      'State-specific legal templates',
      'Priority support',
      'Future updates included'
    ],
    limitations: [],
    highlighted: true
  }
];

export const LicenseModal: React.FC<LicenseModalProps> = ({
  onClose,
  onActivate,
  onPurchase,
  currentTier
}) => {
  const [view, setView] = useState<'plans' | 'activate'>('plans');
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setActivating(true);
    setError('');

    const result = await onActivate(licenseKey.trim());
    
    setActivating(false);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Invalid license key');
    }
  };

  const handlePurchase = async (tier: 'standard' | 'pro') => {
    setPurchasing(tier);
    await onPurchase(tier);
    setPurchasing(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Shield size={20} className="text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">BitTrust License</h2>
              <p className="text-sm text-zinc-500">One-time purchase, lifetime sovereignty</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setView('plans')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              view === 'plans'
                ? 'text-orange-400 border-b-2 border-orange-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Plans & Pricing
          </button>
          <button
            onClick={() => setView('activate')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              view === 'activate'
                ? 'text-orange-400 border-b-2 border-orange-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Activate License
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {view === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TIERS.map((tier) => {
                const isCurrent = tier.id === currentTier;
                const canPurchase = tier.id !== 'free' && !isCurrent;

                return (
                  <div
                    key={tier.id}
                    className={`rounded-xl border p-6 ${
                      tier.highlighted
                        ? 'border-orange-500 bg-orange-500/5'
                        : 'border-zinc-800 bg-zinc-800/30'
                    }`}
                  >
                    {/* Tier Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {tier.id === 'free' && <Shield size={20} className="text-zinc-500" />}
                        {tier.id === 'standard' && <Zap size={20} className="text-blue-400" />}
                        {tier.id === 'pro' && <Crown size={20} className="text-orange-400" />}
                        <span className="font-semibold text-white">{tier.name}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                          Current
                        </span>
                      )}
                      {tier.highlighted && !isCurrent && (
                        <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                          Best Value
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-white">{tier.price}</span>
                      <span className="text-zinc-500 ml-2">{tier.priceNote}</span>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-zinc-300">{feature}</span>
                        </div>
                      ))}
                      {tier.limitations.map((limitation, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <X size={16} className="text-zinc-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-zinc-500">{limitation}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    {canPurchase ? (
                      <button
                        onClick={() => handlePurchase(tier.id as 'standard' | 'pro')}
                        disabled={purchasing !== null}
                        className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          tier.highlighted
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-black hover:opacity-90'
                            : 'bg-zinc-700 text-white hover:bg-zinc-600'
                        }`}
                      >
                        {purchasing === tier.id ? (
                          'Opening checkout...'
                        ) : (
                          <>
                            Pay with Bitcoin
                            <ExternalLink size={16} />
                          </>
                        )}
                      </button>
                    ) : isCurrent ? (
                      <button
                        disabled
                        className="w-full py-3 rounded-lg font-medium bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 rounded-lg font-medium bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      >
                        Free Forever
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {view === 'activate' && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
                  <Key size={32} className="text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Activate Your License</h3>
                <p className="text-zinc-500 mt-2">
                  Enter the license key from your purchase confirmation email.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">License Key</label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleActivate}
                  disabled={activating || !licenseKey.trim()}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activating ? 'Activating...' : 'Activate License'}
                </button>
              </div>

              <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl">
                <p className="text-sm text-zinc-400">
                  <strong className="text-zinc-300">Don't have a license?</strong>{' '}
                  <button
                    onClick={() => setView('plans')}
                    className="text-orange-400 hover:text-orange-300"
                  >
                    View plans and purchase
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-800/30">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Shield size={16} />
            <span>Payments processed via BTCPay Server • Bitcoin only • No KYC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;
