import React from 'react';
import { useUI } from '../contexts/UIContext';
import { useVaults } from '../contexts/VaultContext';
import { PasswordModal } from './PasswordModal';
import { AddBeneficiaryModal } from './AddBeneficiaryModal';
import { ExportModal } from './ExportModal';
import { OwnerKeyModal } from './OwnerKeyModal';
import { DeleteVaultModal } from './DeleteVaultModal';
import { EditVaultModal } from './EditVaultModal';
import { SettingsModal } from './SettingsModal';

interface ModalRendererProps {
  onPasswordSubmit?: (password: string) => void;
  onPasswordCancel?: () => void;
}

export function ModalRenderer({ onPasswordSubmit, onPasswordCancel }: ModalRendererProps) {
  const { activeModal, closeModal } = useUI();
  const { selectedVault } = useVaults();

  if (!activeModal) return null;

  switch (activeModal.type) {
    case 'password':
      return (
        <PasswordModal
          mode={activeModal.mode}
          onSubmit={onPasswordSubmit || (() => {})}
          onCancel={onPasswordCancel || closeModal}
        />
      );
    case 'addBeneficiary':
      return selectedVault ? <AddBeneficiaryModal /> : null;
    case 'export':
      return selectedVault ? <ExportModal /> : null;
    case 'ownerKey':
      return selectedVault ? <OwnerKeyModal /> : null;
    case 'delete':
      return <DeleteVaultModal vault={activeModal.vault} />;
    case 'edit':
      return selectedVault ? <EditVaultModal /> : null;
    case 'settings':
      return <SettingsModal />;
    default:
      return null;
  }
}
