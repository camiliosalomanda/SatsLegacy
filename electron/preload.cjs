/**
 * SatsLegacy Electron Preload Script
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
  },

  // Notifications
  notifications: {
    sendCheckInReminder: (toEmail, vaultName, daysRemaining, status) =>
      ipcRenderer.invoke('notifications:sendCheckInReminder', { toEmail, vaultName, daysRemaining, status }),
    sendHeirNotification: (toEmail, vaultName, ownerName) =>
      ipcRenderer.invoke('notifications:sendHeirNotification', { toEmail, vaultName, ownerName }),
    testEmail: (toEmail) =>
      ipcRenderer.invoke('notifications:testEmail', { toEmail })
  },

  // Duress protection
  duress: {
    setPassword: (password) => ipcRenderer.invoke('duress:setPassword', { password }),
    removePassword: () => ipcRenderer.invoke('duress:removePassword'),
    checkPassword: (password) => ipcRenderer.invoke('duress:checkPassword', { password }),
    getDecoyVaults: () => ipcRenderer.invoke('duress:getDecoyVaults'),
    createDecoyVault: (vault) => ipcRenderer.invoke('duress:createDecoyVault', { vault }),
    deleteDecoyVault: (vaultId) => ipcRenderer.invoke('duress:deleteDecoyVault', { vaultId }),
    executeWipe: () => ipcRenderer.invoke('duress:executeWipe'),
    sendSilentAlert: () => ipcRenderer.invoke('duress:sendSilentAlert')
  },

  // Tor proxy operations
  tor: {
    // Make HTTP request through Tor SOCKS5 proxy
    fetch: (url, options) => ipcRenderer.invoke('tor:fetch', { url, options }),
    // Test Tor connection
    testConnection: () => ipcRenderer.invoke('tor:testConnection'),
    // Get current Tor status
    getStatus: () => ipcRenderer.invoke('tor:getStatus')
  }
});

// Flag to detect Electron environment
contextBridge.exposeInMainWorld('isElectron', true);
