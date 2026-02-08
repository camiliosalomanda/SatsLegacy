/**
 * BitTrust Vault Creation Wizard
 *
 * Multi-step wizard for configuring vault infrastructure and inheritance logic.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Shield, Clock, Users, Key, HardDrive, Cloud, Lock,
  AlertTriangle, CheckCircle, ChevronRight, ChevronLeft,
  Info, Zap, Eye, EyeOff, RefreshCw, Wallet, Server, Crown
} from 'lucide-react';

import {
  validateConfiguration,
  canAddOption,
  getAvailableOptions,
  PRESET_BUNDLES,
  type VaultConfiguration,
  type InfrastructureOption,
  type InheritanceLogic,
  type Modifier,
  type ValidationResult,
  type PresetBundle
} from '../validation/compatibility';

// ============================================
// LICENSE TIER CONFIGURATION
// ============================================

// Free tier: Simple Sovereign only
const FREE_TIER_BUNDLES = ['simple_sovereign'];
const FREE_TIER_INFRASTRUCTURE: InfrastructureOption[] = ['local', 'microsd'];
const FREE_TIER_LOGIC: InheritanceLogic[] = ['timelock'];
const FREE_TIER_MODIFIERS: Modifier[] = [];

// Standard tier: Everything EXCEPT Active Guardian and Hostile Environment features
// Active Guardian uses: dead_man_switch, staggered
// Hostile Environment uses: duress, decoy
const STANDARD_TIER_BUNDLES = ['simple_sovereign', 'resilient_sovereign'];
const STANDARD_TIER_INFRASTRUCTURE: InfrastructureOption[] = ['local', 'microsd', 'shamir', 'nostr', 'ipfs', 'multisig_config'];
const STANDARD_TIER_LOGIC: InheritanceLogic[] = ['timelock', 'multisig_decay', 'challenge', 'oracle'];
const STANDARD_TIER_MODIFIERS: Modifier[] = ['multi_beneficiary'];

// Pro tier: Everything (Active Guardian + Hostile Environment)
// Additional: dead_man_switch, duress, staggered, decoy
const PRO_ONLY_BUNDLES = ['active_guardian', 'hostile_environment'];
const PRO_ONLY_LOGIC: InheritanceLogic[] = ['dead_man_switch', 'duress'];
const PRO_ONLY_MODIFIERS: Modifier[] = ['staggered', 'decoy'];

// Helper to check if feature requires Pro
const requiresPro = (feature: string, type: 'bundle' | 'logic' | 'modifier'): boolean => {
  switch (type) {
    case 'bundle': return PRO_ONLY_BUNDLES.includes(feature);
    case 'logic': return PRO_ONLY_LOGIC.includes(feature as InheritanceLogic);
    case 'modifier': return PRO_ONLY_MODIFIERS.includes(feature as Modifier);
    default: return false;
  }
};

// ============================================
// TYPES
// ============================================

interface LicenseInfo {
  licensed: boolean;
  tier?: string;
}

interface WizardProps {
  onComplete: (config: VaultConfiguration, name: string, description?: string) => void;
  onCancel: () => void;
  licenseInfo?: LicenseInfo;
  onUpgrade?: () => void;
}

interface StepProps {
  config: VaultConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<VaultConfiguration>>;
  validation: ValidationResult;
}

type WizardStep = 'name' | 'bundle' | 'infrastructure' | 'logic' | 'modifiers' | 'review';

/** Wizard steps in order -- defined outside component to avoid recreation on each render */
const WIZARD_STEPS: WizardStep[] = ['name', 'bundle', 'infrastructure', 'logic', 'modifiers', 'review'];

// ============================================
// OPTION METADATA
// ============================================

const INFRASTRUCTURE_META: Record<InfrastructureOption, {
  name: string;
  icon: React.ElementType;
  description: string;
  protects: string;
}> = {
  local: {
    name: 'Local Encrypted Storage',
    icon: HardDrive,
    description: 'Vault data encrypted on this device.',
    protects: 'Your responsibility to back up.'
  },
  microsd: {
    name: 'MicroSD / Steel Export',
    icon: Key,
    description: 'Export encrypted backup to physical media.',
    protects: 'Protects against device failure.'
  },
  shamir: {
    name: 'Shamir Backup Splits',
    icon: Users,
    description: 'Split backup into shares. Any 2-of-3 reconstructs.',
    protects: 'Protects against single point of failure.'
  },
  nostr: {
    name: 'Nostr Relay Storage',
    icon: Cloud,
    description: 'Encrypted blob on censorship-resistant network.',
    protects: 'Survives house fire. You hold decryption key.'
  },
  ipfs: {
    name: 'IPFS Pinning',
    icon: Server,
    description: 'Content-addressed backup on distributed network.',
    protects: 'Redundant off-site storage.'
  },
  multisig_config: {
    name: 'Multisig Config Distribution',
    icon: Lock,
    description: 'Vault config requires multiple hardware wallets.',
    protects: 'Expert mode. Maximum security.'
  }
};

const LOGIC_META: Record<InheritanceLogic, {
  name: string;
  icon: React.ElementType;
  description: string;
  maintenance: string;
}> = {
  timelock: {
    name: 'Pure Timelock',
    icon: Clock,
    description: 'Heirs can spend after a specific block height.',
    maintenance: 'No maintenance required. Immutable once set.'
  },
  dead_man_switch: {
    name: "Dead Man's Switch",
    icon: RefreshCw,
    description: 'Requires periodic proof of life.',
    maintenance: 'Requires check-in every 30-90 days.'
  },
  multisig_decay: {
    name: 'Multisig Decay',
    icon: Users,
    description: 'Starts 2-of-3, decays to 1-of-2 after timelock.',
    maintenance: 'No maintenance. Automatic decay.'
  },
  challenge: {
    name: 'Challenge-Response',
    icon: Key,
    description: 'Heir must prove knowledge (passphrase, path).',
    maintenance: 'Gate only. Combine with other logic.'
  },
  oracle: {
    name: 'Oracle-Assisted',
    icon: Eye,
    description: 'External attestation (notary, service).',
    maintenance: 'Adds trust assumption. Use carefully.'
  },
  duress: {
    name: 'Duress Routing',
    icon: AlertTriangle,
    description: 'Wrong PIN sends funds to burn/donate address.',
    maintenance: 'Escape hatch. Combine with other logic.'
  }
};

const MODIFIER_META: Record<Modifier, {
  name: string;
  icon: React.ElementType;
  description: string;
}> = {
  staggered: {
    name: 'Staggered Release',
    icon: Clock,
    description: 'Funds unlock in portions over time (25% now, 25% in 6mo, etc).'
  },
  multi_beneficiary: {
    name: 'Multi-Beneficiary',
    icon: Users,
    description: 'Different heirs with different conditions and amounts.'
  },
  decoy: {
    name: 'Decoy Vault',
    icon: EyeOff,
    description: 'Visible wallet with small balance. Real vault hidden.'
  }
};

// ============================================
// MAIN WIZARD COMPONENT
// ============================================

export const VaultCreationWizard: React.FC<WizardProps> = ({ onComplete, onCancel, licenseInfo, onUpgrade }) => {
  const [step, setStep] = useState<WizardStep>('name');
  const [vaultName, setVaultName] = useState('');
  const [vaultDescription, setVaultDescription] = useState('');
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string>('');

  const isLicensed = licenseInfo?.licensed ?? false;
  const isPro = licenseInfo?.tier === 'pro';
  
  const [config, setConfig] = useState<VaultConfiguration>({
    infrastructure: ['local'],
    primaryLogic: 'timelock',
    additionalGates: [],
    modifiers: []
  });

  const validation = useMemo(() => validateConfiguration(config), [config]);

  const steps = WIZARD_STEPS;
  const currentIndex = steps.indexOf(step);

  const canProceed = useMemo(() => {
    switch (step) {
      case 'name':
        return vaultName.trim().length > 0;
      case 'bundle':
        return true; // Can skip or select
      case 'infrastructure':
      case 'logic':
      case 'modifiers':
        return validation.errors.length === 0;
      case 'review':
        return validation.valid;
      default:
        return true;
    }
  }, [step, vaultName, validation]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  }, [currentIndex, steps]);

  const handleBack = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  }, [currentIndex, steps]);

  const handleBundleSelect = useCallback((bundleId: string | null) => {
    setSelectedBundle(bundleId);
    if (bundleId) {
      const bundle = PRESET_BUNDLES.find(b => b.id === bundleId);
      if (bundle) {
        setConfig({ ...bundle.config });
      }
    } else {
      // Reset to default config when "Start from Scratch" is selected
      setConfig({
        infrastructure: ['local'],
        primaryLogic: 'timelock',
        additionalGates: [],
        modifiers: []
      });
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (validation.valid) {
      onComplete(config, vaultName, vaultDescription || undefined);
    }
  }, [config, vaultName, vaultDescription, validation, onComplete]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Create New Vault</h2>
            <button
              onClick={onCancel}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i < currentIndex
                      ? 'bg-orange-500 text-black'
                      : i === currentIndex
                      ? 'bg-orange-500/20 text-orange-500 border border-orange-500'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {i < currentIndex ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < currentIndex ? 'bg-orange-500' : 'bg-zinc-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'name' && (
            <NameStep
              name={vaultName}
              setName={setVaultName}
              description={vaultDescription}
              setDescription={setVaultDescription}
            />
          )}
          {step === 'bundle' && (
            <BundleStep
              selected={selectedBundle}
              onSelect={handleBundleSelect}
              isLicensed={isLicensed}
              isPro={isPro}
              onLockedClick={(name) => {
                setUpgradeFeature(name);
                setShowUpgradeModal(true);
              }}
            />
          )}
          {step === 'infrastructure' && (
            <InfrastructureStep
              config={config}
              setConfig={setConfig}
              validation={validation}
              isLicensed={isLicensed}
              isPro={isPro}
              onLockedClick={(name) => {
                setUpgradeFeature(name);
                setShowUpgradeModal(true);
              }}
            />
          )}
          {step === 'logic' && (
            <LogicStep
              config={config}
              setConfig={setConfig}
              validation={validation}
              isLicensed={isLicensed}
              isPro={isPro}
              onLockedClick={(name) => {
                setUpgradeFeature(name);
                setShowUpgradeModal(true);
              }}
            />
          )}
          {step === 'modifiers' && (
            <ModifiersStep
              config={config}
              setConfig={setConfig}
              validation={validation}
              isLicensed={isLicensed}
              isPro={isPro}
              onLockedClick={(name) => {
                setUpgradeFeature(name);
                setShowUpgradeModal(true);
              }}
            />
          )}
          {step === 'review' && (
            <ReviewStep
              config={config}
              name={vaultName}
              description={vaultDescription}
              validation={validation}
            />
          )}
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100]">
            <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Upgrade Required</h3>
                  <p className="text-sm text-zinc-400">Premium feature</p>
                </div>
              </div>
              <p className="text-zinc-300 mb-4">
                <span className="font-medium text-white">{upgradeFeature}</span> is available with a SatsLegacy Pro license.
              </p>
              <p className="text-sm text-zinc-400 mb-6">
                Unlock all vault types, advanced security features, and priority support.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowUpgradeModal(false);
                    if (onUpgrade) {
                      onUpgrade();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-400 transition-colors cursor-pointer"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-zinc-700 flex items-center justify-between">
          <button
            onClick={currentIndex === 0 ? onCancel : handleBack}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {step === 'review' ? (
            <button
              onClick={handleComplete}
              disabled={!validation.valid}
              className="px-6 py-2 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Create Vault
              <CheckCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-2 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// STEP COMPONENTS
// ============================================

const NameStep: React.FC<{
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}> = ({ name, setName, description, setDescription }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-2">Name Your Vault</h3>
      <p className="text-zinc-400 text-sm">
        Choose a name that helps you identify this vault's purpose.
      </p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Vault Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 64))}
          placeholder="e.g., Family Inheritance, Emergency Fund"
          maxLength={64}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          autoFocus
        />
        {name.length >= 64 && (
          <p className="text-xs text-zinc-500 mt-1">Maximum 64 characters</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes about this vault's purpose..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
        />
      </div>
    </div>
  </div>
);

const BundleStep: React.FC<{
  selected: string | null;
  onSelect: (id: string | null) => void;
  isLicensed: boolean;
  isPro: boolean;
  onLockedClick: (name: string) => void;
}> = ({ selected, onSelect, isLicensed, isPro, onLockedClick }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-2">Choose Your Starting Point</h3>
      <p className="text-zinc-400 text-sm">
        Select a preset that matches your needs, then customize in the next steps.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PRESET_BUNDLES.map((bundle) => {
        const isFreeTier = FREE_TIER_BUNDLES.includes(bundle.id);
        const isStandardTier = STANDARD_TIER_BUNDLES.includes(bundle.id);
        const isProOnly = PRO_ONLY_BUNDLES.includes(bundle.id);

        // Determine if locked: Pro bundles require Pro, Standard bundles require any license, Free bundles are free
        const isLocked = isProOnly ? !isPro : (!isLicensed && !isFreeTier);
        const lockLabel = isProOnly ? 'Pro' : 'Standard';

        return (
        <button
          key={bundle.id}
          onClick={() => isLocked ? onLockedClick(bundle.name) : onSelect(bundle.id)}
          className={`text-left p-4 rounded-lg border transition-all relative ${
            selected === bundle.id
              ? 'border-orange-500 bg-orange-500/10'
              : isLocked
              ? 'border-zinc-700 bg-zinc-800/30 opacity-75'
              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
          }`}
        >
          {isLocked && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-zinc-700 rounded text-xs text-zinc-400">
              <Lock className="w-3 h-3" />
              {lockLabel}
            </div>
          )}
          <div className="flex items-start justify-between mb-2">
            <h4 className={`font-semibold ${isLocked ? 'text-zinc-400' : 'text-white'}`}>{bundle.name}</h4>
            {selected === bundle.id && (
              <CheckCircle className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <p className={`text-sm mb-2 ${isLocked ? 'text-zinc-500' : 'text-orange-400'}`}>{bundle.tagline}</p>
          <p className={`text-sm mb-3 ${isLocked ? 'text-zinc-500' : 'text-zinc-400'}`}>{bundle.description}</p>
          <div className="flex flex-wrap gap-1">
            {bundle.bestFor.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2 py-0.5 rounded ${isLocked ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-700 text-zinc-300'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </button>
        );
      })}
    </div>

    <button
      onClick={() => onSelect(null)}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        selected === null
          ? 'border-orange-500 bg-orange-500/10'
          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-zinc-400" />
        <span className="font-medium text-white">Start from Scratch</span>
        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded ml-2">Free</span>
        {selected === null && (
          <CheckCircle className="w-5 h-5 text-orange-500 ml-auto" />
        )}
      </div>
      <p className="text-sm text-zinc-400 mt-1">
        Build your own configuration from individual options. Free tier includes local storage + timelock.
      </p>
    </button>
  </div>
);

interface StepPropsWithLicense extends StepProps {
  isLicensed: boolean;
  isPro: boolean;
  onLockedClick: (name: string) => void;
}

const InfrastructureStep: React.FC<StepPropsWithLicense> = ({ config, setConfig, validation, isLicensed, isPro, onLockedClick }) => {
  const availableOptions = useMemo(() => getAvailableOptions(config), [config]);

  // Infrastructure options are all available with Standard tier (no Pro-only infrastructure)
  const isInfraLocked = useCallback((option: InfrastructureOption): boolean => {
    if (FREE_TIER_INFRASTRUCTURE.includes(option)) return false;
    return !isLicensed; // Standard tier unlocks all infrastructure
  }, [isLicensed]);

  const toggleOption = useCallback((option: InfrastructureOption) => {
    if (isInfraLocked(option)) {
      onLockedClick(INFRASTRUCTURE_META[option].name);
      return;
    }

    setConfig(prev => {
      const has = prev.infrastructure.includes(option);
      if (option === 'local') return prev; // Can't remove local

      return {
        ...prev,
        infrastructure: has
          ? prev.infrastructure.filter(o => o !== option)
          : [...prev.infrastructure, option]
      };
    });
  }, [setConfig, isInfraLocked, onLockedClick]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Vault Infrastructure</h3>
        <p className="text-zinc-400 text-sm">
          Where does your vault live? How does it survive disasters?
        </p>
      </div>

      <div className="space-y-3">
        {(Object.keys(INFRASTRUCTURE_META) as InfrastructureOption[]).map((option) => {
          const meta = INFRASTRUCTURE_META[option];
          const Icon = meta.icon;
          const isSelected = config.infrastructure.includes(option);
          const availability = availableOptions.infrastructure.find(o => o.option === option);
          const isDisabled = option !== 'local' && !isSelected && !availability?.canAdd;
          const isLocked = isInfraLocked(option);

          return (
            <button
              key={option}
              onClick={() => !isDisabled && option !== 'local' && toggleOption(option)}
              disabled={(isDisabled && !isLocked) || option === 'local'}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10'
                  : isLocked
                  ? 'border-zinc-800 bg-zinc-800/30 opacity-60'
                  : isDisabled
                  ? 'border-zinc-800 bg-zinc-800/30 opacity-50 cursor-not-allowed'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-500/20' : 'bg-zinc-700'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-zinc-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isLocked ? 'text-zinc-400' : 'text-white'}`}>{meta.name}</span>
                    {option === 'local' && (
                      <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">
                        Always On
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Standard
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${isLocked ? 'text-zinc-500' : 'text-zinc-400'}`}>{meta.description}</p>
                  <p className={`text-xs mt-1 ${isLocked ? 'text-zinc-600' : 'text-zinc-500'}`}>{meta.protects}</p>
                  {isDisabled && !isLocked && availability?.reason && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {availability.reason}
                    </p>
                  )}
                </div>
                {option !== 'local' && !isLocked && (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
                  }`}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-black" />}
                  </div>
                )}
                {isLocked && (
                  <Lock className="w-5 h-5 text-zinc-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {validation.warnings.filter(w => w.code.startsWith('INFRA')).length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-500 mb-2">Warnings</h4>
          {validation.warnings.filter(w => w.code.startsWith('INFRA')).map((warning, i) => (
            <p key={i} className="text-sm text-yellow-400/80">{warning.message}</p>
          ))}
        </div>
      )}
    </div>
  );
};

const LogicStep: React.FC<StepPropsWithLicense> = ({ config, setConfig, validation, isLicensed, isPro, onLockedClick }) => {
  const availableOptions = useMemo(() => getAvailableOptions(config), [config]);

  // Check if a logic option is locked based on tier
  const isLogicLocked = useCallback((logic: InheritanceLogic): boolean => {
    if (PRO_ONLY_LOGIC.includes(logic)) return !isPro;
    if (FREE_TIER_LOGIC.includes(logic)) return false;
    return !isLicensed; // Standard tier features
  }, [isLicensed, isPro]);

  const setPrimaryLogic = useCallback((logic: InheritanceLogic) => {
    if (isLogicLocked(logic)) {
      onLockedClick(LOGIC_META[logic].name);
      return;
    }

    setConfig(prev => ({
      ...prev,
      primaryLogic: logic,
      // Remove from gates if it was there
      additionalGates: prev.additionalGates.filter(g => g !== logic)
    }));
  }, [setConfig, isLogicLocked, onLockedClick]);

  const toggleGate = useCallback((gate: InheritanceLogic) => {
    if (isLogicLocked(gate)) {
      onLockedClick(LOGIC_META[gate].name);
      return;
    }

    setConfig(prev => {
      const has = prev.additionalGates.includes(gate);
      return {
        ...prev,
        additionalGates: has
          ? prev.additionalGates.filter(g => g !== gate)
          : [...prev.additionalGates, gate]
      };
    });
  }, [setConfig, isLogicLocked, onLockedClick]);

  const primaryOptions: InheritanceLogic[] = ['timelock', 'dead_man_switch', 'multisig_decay'];
  const gateOptions: InheritanceLogic[] = ['challenge', 'oracle', 'duress'];

  return (
    <div className="space-y-8">
      {/* Primary Logic */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Primary Inheritance Trigger</h3>
        <p className="text-zinc-400 text-sm mb-4">
          What conditions unlock this vault for your heirs?
        </p>

        <div className="space-y-3">
          {primaryOptions.map((option) => {
            const meta = LOGIC_META[option];
            const Icon = meta.icon;
            const isSelected = config.primaryLogic === option;
            const availability = availableOptions.logic.find(o => o.option === option);
            const isDisabled = !isSelected && !availability?.canAdd;
            const isLocked = isLogicLocked(option);
            const lockLabel = PRO_ONLY_LOGIC.includes(option) ? 'Pro' : 'Standard';

            return (
              <button
                key={option}
                onClick={() => !isDisabled && setPrimaryLogic(option)}
                disabled={isDisabled && !isLocked}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10'
                    : isLocked
                    ? 'border-zinc-800 bg-zinc-800/30 opacity-60'
                    : isDisabled
                    ? 'border-zinc-800 bg-zinc-800/30 opacity-50'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-500/20' : 'bg-zinc-700'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isLocked ? 'text-zinc-400' : 'text-white'}`}>{meta.name}</span>
                      {isLocked && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {lockLabel}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isLocked ? 'text-zinc-500' : 'text-zinc-400'}`}>{meta.description}</p>
                    <p className={`text-xs mt-1 ${isLocked ? 'text-zinc-600' : 'text-zinc-500'}`}>{meta.maintenance}</p>
                  </div>
                  {!isLocked && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>
                  )}
                  {isLocked && (
                    <Lock className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Gates */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Additional Security Gates</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Layer extra requirements on top of the primary trigger.
        </p>

        <div className="space-y-3">
          {gateOptions.map((option) => {
            const meta = LOGIC_META[option];
            const Icon = meta.icon;
            const isSelected = config.additionalGates.includes(option);
            const availability = availableOptions.gates.find(o => o.option === option);
            const isDisabled = !isSelected && !availability?.canAdd;
            const isLocked = isLogicLocked(option);
            const lockLabel = PRO_ONLY_LOGIC.includes(option) ? 'Pro' : 'Standard';

            return (
              <button
                key={option}
                onClick={() => !isDisabled && toggleGate(option)}
                disabled={(isDisabled && !isLocked)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10'
                    : isLocked
                    ? 'border-zinc-800 bg-zinc-800/30 opacity-60'
                    : isDisabled
                    ? 'border-zinc-800 bg-zinc-800/30 opacity-50'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-500/20' : 'bg-zinc-700'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isLocked ? 'text-zinc-400' : 'text-white'}`}>{meta.name}</span>
                      {isLocked && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {lockLabel}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isLocked ? 'text-zinc-500' : 'text-zinc-400'}`}>{meta.description}</p>
                    <p className={`text-xs mt-1 ${isLocked ? 'text-zinc-600' : 'text-zinc-500'}`}>{meta.maintenance}</p>
                  </div>
                  {!isLocked && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
                    }`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-black" />}
                    </div>
                  )}
                  {isLocked && (
                    <Lock className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {validation.errors.filter(e => e.code.startsWith('LOGIC')).length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-red-500 mb-2">Configuration Errors</h4>
          {validation.errors.filter(e => e.code.startsWith('LOGIC')).map((error, i) => (
            <p key={i} className="text-sm text-red-400/80">{error.message}</p>
          ))}
        </div>
      )}
    </div>
  );
};

const ModifiersStep: React.FC<StepPropsWithLicense> = ({ config, setConfig, validation, isLicensed, isPro, onLockedClick }) => {
  const availableOptions = useMemo(() => getAvailableOptions(config), [config]);

  // Check if a modifier is locked based on tier
  const isModifierLocked = useCallback((modifier: Modifier): boolean => {
    if (PRO_ONLY_MODIFIERS.includes(modifier)) return !isPro;
    if (FREE_TIER_MODIFIERS.includes(modifier)) return false;
    if (STANDARD_TIER_MODIFIERS.includes(modifier)) return !isLicensed;
    return !isLicensed; // Default to requiring license
  }, [isLicensed, isPro]);

  const toggleModifier = useCallback((modifier: Modifier) => {
    if (isModifierLocked(modifier)) {
      onLockedClick(MODIFIER_META[modifier].name);
      return;
    }

    setConfig(prev => {
      const has = prev.modifiers.includes(modifier);
      return {
        ...prev,
        modifiers: has
          ? prev.modifiers.filter(m => m !== modifier)
          : [...prev.modifiers, modifier]
      };
    });
  }, [setConfig, isModifierLocked, onLockedClick]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Release Modifiers</h3>
        <p className="text-zinc-400 text-sm">
          Optional adjustments to how inheritance is distributed.
        </p>
      </div>

      <div className="space-y-3">
        {(Object.keys(MODIFIER_META) as Modifier[]).map((option) => {
          const meta = MODIFIER_META[option];
          const Icon = meta.icon;
          const isSelected = config.modifiers.includes(option);
          const availability = availableOptions.modifiers.find(o => o.option === option);
          const isDisabled = !isSelected && !availability?.canAdd;
          const isLocked = isModifierLocked(option);
          const lockLabel = PRO_ONLY_MODIFIERS.includes(option) ? 'Pro' : 'Standard';

          return (
            <button
              key={option}
              onClick={() => !isDisabled && toggleModifier(option)}
              disabled={(isDisabled && !isLocked)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10'
                  : isLocked
                  ? 'border-zinc-800 bg-zinc-800/30 opacity-60'
                  : isDisabled
                  ? 'border-zinc-800 bg-zinc-800/30 opacity-50'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-500/20' : 'bg-zinc-700'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-zinc-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isLocked ? 'text-zinc-400' : 'text-white'}`}>{meta.name}</span>
                    {isLocked && (
                      <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {lockLabel}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${isLocked ? 'text-zinc-500' : 'text-zinc-400'}`}>{meta.description}</p>
                  {isDisabled && !isLocked && availability?.reason && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {availability.reason}
                    </p>
                  )}
                </div>
                {!isLocked && (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
                  }`}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-black" />}
                  </div>
                )}
                {isLocked && (
                  <Lock className="w-5 h-5 text-zinc-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {validation.recommendations.length > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Recommendations
          </h4>
          {validation.recommendations.map((rec, i) => (
            <p key={i} className="text-sm text-blue-400/80 mb-1">
              {rec.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewStep: React.FC<{
  config: VaultConfiguration;
  name: string;
  description: string;
  validation: ValidationResult;
}> = ({ config, name, description, validation }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Review Your Vault</h3>
        <p className="text-zinc-400 text-sm">
          Confirm your configuration before creating the vault.
        </p>
      </div>

      {/* Vault Info */}
      <div className="p-4 bg-zinc-800 rounded-lg">
        <h4 className="text-sm font-medium text-zinc-400 mb-2">Vault Details</h4>
        <p className="text-white font-medium">{name}</p>
        {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
      </div>

      {/* Infrastructure */}
      <div className="p-4 bg-zinc-800 rounded-lg">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">Infrastructure</h4>
        <div className="space-y-2">
          {config.infrastructure.map((option) => {
            const meta = INFRASTRUCTURE_META[option];
            const Icon = meta.icon;
            return (
              <div key={option} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-orange-500" />
                <span className="text-white">{meta.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logic */}
      <div className="p-4 bg-zinc-800 rounded-lg">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">Inheritance Logic</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {React.createElement(LOGIC_META[config.primaryLogic].icon, {
              className: "w-4 h-4 text-orange-500"
            })}
            <span className="text-white">{LOGIC_META[config.primaryLogic].name}</span>
            <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">Primary</span>
          </div>
          {config.additionalGates.map((gate) => {
            const meta = LOGIC_META[gate];
            const Icon = meta.icon;
            return (
              <div key={gate} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">{meta.name}</span>
                <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">Gate</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modifiers */}
      {config.modifiers.length > 0 && (
        <div className="p-4 bg-zinc-800 rounded-lg">
          <h4 className="text-sm font-medium text-zinc-400 mb-3">Modifiers</h4>
          <div className="space-y-2">
            {config.modifiers.map((modifier) => {
              const meta = MODIFIER_META[modifier];
              const Icon = meta.icon;
              return (
                <div key={modifier} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4 text-orange-500" />
                  <span className="text-white">{meta.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* What This Means */}
      <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <h4 className="text-sm font-medium text-orange-400 mb-3">What This Means</h4>
        <ul className="space-y-2 text-sm text-orange-300/80">
          {config.primaryLogic === 'timelock' && (
            <li>• You can spend anytime with your key; heirs can only spend after the timelock expires</li>
          )}
          {config.infrastructure.includes('local') && config.infrastructure.length === 1 && (
            <li>• Vault is stored locally on this device - make sure to back up your vault file</li>
          )}
          {config.infrastructure.includes('nostr') && (
            <li>• Your vault config survives on Nostr relays (you hold decryption key)</li>
          )}
          {config.infrastructure.includes('shamir') && (
            <li>• Backup is split into shares you distribute to separate locations</li>
          )}
          {config.primaryLogic === 'multisig_decay' && (
            <li>• Heirs need multiple keys while you're active, fewer after decay</li>
          )}
          {config.primaryLogic === 'dead_man_switch' && (
            <li>• You must check in periodically or inheritance triggers</li>
          )}
          {config.additionalGates.includes('challenge') && (
            <li>• Heirs must prove knowledge (passphrase) to spend</li>
          )}
          {config.additionalGates.includes('duress') && (
            <li>• Wrong PIN routes funds to burn address (coercion protection)</li>
          )}
          {config.modifiers.includes('staggered') && (
            <li>• Funds release in portions over time, not all at once</li>
          )}
          {config.modifiers.includes('decoy') && (
            <li>• Decoy wallet with small balance hides real vault</li>
          )}
        </ul>
      </div>

      {/* Validation Status */}
      {validation.valid ? (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-400">Configuration valid. Ready to create vault.</span>
        </div>
      ) : (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-red-500 mb-2">Configuration Errors</h4>
          {validation.errors.map((error, i) => (
            <p key={i} className="text-sm text-red-400/80">{error.message}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default VaultCreationWizard;
