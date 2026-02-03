import React, { useEffect, useRef } from 'react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';
import { useSettings } from '../contexts/SettingsContext';

// Views
import { DashboardView } from '../views/DashboardView';
import { VaultsView } from '../views/VaultsView';
import { VaultDetailView } from '../views/VaultDetailView';
import { SimulatorView } from '../views/SimulatorView';
import { LegalView } from '../views/LegalView';
import { LearnView } from '../views/LearnView';

// Components
import { Sidebar } from '../components/navigation/Sidebar';
import { LoadingScreen } from '../components/common/LoadingScreen';

// Modals
import { ModalRenderer } from '../modals/ModalRenderer';
import { PasswordModal } from '../modals/PasswordModal';

// External components
import { VaultCreationWizard } from '../vault/creation/wizard/VaultCreationWizard';
import HeirKitGenerator from '../components/HeirKitGenerator';

export function SatsLegacy() {
  const {
    vaults,
    selectedVault,
    isLoading,
    pendingVaultData,
    createVault,
    saveVaultWithPassword,
    saveVaultChanges,
    setPendingVaultData
  } = useVaults();

  const {
    currentView,
    setCurrentView,
    showCreateWizard,
    setShowCreateWizard,
    showHeirKitGenerator,
    setShowHeirKitGenerator,
    openModal,
    closeModal,
    activeModal
  } = useUI();

  const { licenseInfo } = useSettings();

  // Track if we just created a vault to trigger password modal
  // NOTE: All hooks must be called before any conditional returns
  const justCreatedVault = useRef(false);

  // Watch for pendingVaultData changes to open password modal
  useEffect(() => {
    if (pendingVaultData && justCreatedVault.current) {
      justCreatedVault.current = false;
      openModal({ type: 'password', mode: 'create' });
    }
  }, [pendingVaultData, openModal]);

  // Early return for loading state (after all hooks)
  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderView = () => {
    if (selectedVault) {
      return <VaultDetailView vault={selectedVault} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'vaults':
        return <VaultsView />;
      case 'simulator':
        return <SimulatorView />;
      case 'legal':
        return <LegalView />;
      case 'learn':
        return <LearnView />;
      default:
        return <DashboardView />;
    }
  };

  const handleCreateVault = (config: unknown, name: string, description: string) => {
    justCreatedVault.current = true;
    createVault(config, name, description);
    setShowCreateWizard(false);
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      if (activeModal?.type === 'password' && activeModal.mode === 'save') {
        await saveVaultChanges(password);
      } else {
        await saveVaultWithPassword(password);
      }
      closeModal();
    } catch (e) {
      alert('Failed to save vault: ' + (e as Error).message);
    }
  };

  const handlePasswordCancel = () => {
    setPendingVaultData(null);
    closeModal();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Vault Creation Wizard */}
      {showCreateWizard && (
        <VaultCreationWizard
          onComplete={handleCreateVault}
          onCancel={() => setShowCreateWizard(false)}
          licenseInfo={licenseInfo}
          onUpgrade={() => {
            setShowCreateWizard(false);
            openModal({ type: 'settings' });
          }}
        />
      )}

      {/* Heir Kit Generator */}
      {showHeirKitGenerator && selectedVault && (
        <HeirKitGenerator
          vault={selectedVault}
          beneficiaries={selectedVault.beneficiaries}
          onClose={() => setShowHeirKitGenerator(false)}
        />
      )}

      {/* Password Modal (special handling for vault creation) */}
      {activeModal?.type === 'password' && (
        <PasswordModal
          mode={activeModal.mode}
          onSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
        />
      )}

      {/* Other Modals */}
      {activeModal && activeModal.type !== 'password' && (
        <ModalRenderer />
      )}
    </div>
  );
}

export default SatsLegacy;
