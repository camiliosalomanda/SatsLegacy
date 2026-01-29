import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ViewName, ModalType, EditFormData } from '../types/ui';
import type { Vault } from '../types/vault';

interface UIContextValue {
  // Navigation
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;

  // Modals
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;

  // Specific modal states
  showCreateWizard: boolean;
  setShowCreateWizard: (show: boolean) => void;
  showHeirKitGenerator: boolean;
  setShowHeirKitGenerator: (show: boolean) => void;

  // Edit form data (shared across edit modal)
  editFormData: EditFormData;
  setEditFormData: (data: EditFormData) => void;

  // Simulator data
  simulatorData: SimulatorData;
  setSimulatorData: (data: SimulatorData) => void;
}

interface SimulatorData {
  btcAmount: number;
  years: number;
  generations: number;
  heirs: number;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentViewState] = useState<ViewName>('dashboard');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showHeirKitGenerator, setShowHeirKitGenerator] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({ name: '', description: '' });
  const [simulatorData, setSimulatorData] = useState<SimulatorData>({
    btcAmount: 1,
    years: 25,
    generations: 2,
    heirs: 2
  });

  const setCurrentView = useCallback((view: ViewName) => {
    setCurrentViewState(view);
  }, []);

  const openModal = useCallback((modal: ModalType) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return (
    <UIContext.Provider value={{
      currentView,
      setCurrentView,
      activeModal,
      openModal,
      closeModal,
      showCreateWizard,
      setShowCreateWizard,
      showHeirKitGenerator,
      setShowHeirKitGenerator,
      editFormData,
      setEditFormData,
      simulatorData,
      setSimulatorData
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
