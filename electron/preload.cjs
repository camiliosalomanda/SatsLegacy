/**
 * BitTrust Electron Preload Script
 * 
 * Exposes safe IPC channels to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Vault operations
  vault: {
    list: () => ipcRenderer.invoke('vault:list'),
    create: (vault, password) => ipcRenderer.invoke('vault:create', { vault, password }),
    load: (vaultId, password) => ipcRenderer.invoke('vault:load', { vaultId, password }),
    update: (vaultId, vault, password) => ipcRenderer.invoke('vault:update', { vaultId, vault, password }),
    delete: (vaultId) => ipcRenderer.invoke('vault:delete', { vaultId }),
    export: (vaultId, password) => ipcRenderer.invoke('vault:export', { vaultId, password }),
    import: () => ipcRenderer.invoke('vault:import')
  },
  
  // License operations
  license: {
    check: () => ipcRenderer.invoke('license:check'),
    activate: (licenseKey) => ipcRenderer.invoke('license:activate', { licenseKey }),
    purchase: (tier) => ipcRenderer.invoke('license:purchase', { tier })
  },
  
  // Settings
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings) => ipcRenderer.invoke('settings:save', { settings })
  },
  
  // System
  system: {
    openExternal: (url) => ipcRenderer.invoke('system:openExternal', { url }),
    getAppInfo: () => ipcRenderer.invoke('system:getAppInfo')
  }
});

// Flag to detect Electron environment
contextBridge.exposeInMainWorld('isElectron', true);
