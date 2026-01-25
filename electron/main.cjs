/**
 * SatsLegacy Electron Main Process
 * 
 * Handles:
 * - Vault storage and encryption
 * - License verification
 * - Hardware wallet communication
 * - File system operations
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ============================================
// APP CONFIGURATION
// ============================================

const isDev = !app.isPackaged;
const APP_NAME = 'SatsLegacy';
const APP_DATA_PATH = path.join(app.getPath('userData'), 'SatsLegacy');
const VAULTS_PATH = path.join(APP_DATA_PATH, 'vaults');
const LICENSE_PATH = path.join(APP_DATA_PATH, 'license.json');
const SETTINGS_PATH = path.join(APP_DATA_PATH, 'settings.json');

// Ensure directories exist
function ensureDirectories() {
  [APP_DATA_PATH, VAULTS_PATH].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// ============================================
// WINDOW MANAGEMENT
// ============================================

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#09090b',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureDirectories();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// ENCRYPTION UTILITIES
// ============================================

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const ITERATIONS = 600000;

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

function encrypt(data, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted.toString('base64')
  };
}

function decrypt(encryptedData, password) {
  const salt = Buffer.from(encryptedData.salt, 'base64');
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');
  const data = Buffer.from(encryptedData.data, 'base64');
  const key = deriveKey(password, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

// ============================================
// VAULT OPERATIONS
// ============================================

ipcMain.handle('vault:list', async () => {
  try {
    const files = fs.readdirSync(VAULTS_PATH);
    const vaults = [];
    
    for (const file of files) {
      if (file.endsWith('.vault')) {
        const metaPath = path.join(VAULTS_PATH, file.replace('.vault', '.meta'));
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          vaults.push(meta);
        }
      }
    }
    
    return { success: true, vaults };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vault:create', async (event, { vault, password }) => {
  try {
    const vaultId = vault.vault_id || crypto.randomUUID();
    const vaultPath = path.join(VAULTS_PATH, `${vaultId}.vault`);
    const metaPath = path.join(VAULTS_PATH, `${vaultId}.meta`);
    
    // Encrypt vault data
    const encrypted = encrypt(vault, password);
    fs.writeFileSync(vaultPath, JSON.stringify(encrypted, null, 2));
    
    // Save unencrypted metadata for listing
    const meta = {
      vault_id: vaultId,
      name: vault.name,
      created_at: vault.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      infrastructure: vault.infrastructure,
      logic: vault.logic
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    return { success: true, vaultId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vault:load', async (event, { vaultId, password }) => {
  try {
    const vaultPath = path.join(VAULTS_PATH, `${vaultId}.vault`);
    
    if (!fs.existsSync(vaultPath)) {
      return { success: false, error: 'Vault not found' };
    }
    
    const encrypted = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
    const vault = decrypt(encrypted, password);
    
    return { success: true, vault };
  } catch (error) {
    return { success: false, error: 'Invalid password or corrupted vault' };
  }
});

ipcMain.handle('vault:update', async (event, { vaultId, vault, password }) => {
  try {
    const vaultPath = path.join(VAULTS_PATH, `${vaultId}.vault`);
    const metaPath = path.join(VAULTS_PATH, `${vaultId}.meta`);
    
    // Encrypt and save
    const encrypted = encrypt(vault, password);
    fs.writeFileSync(vaultPath, JSON.stringify(encrypted, null, 2));
    
    // Update metadata
    const meta = {
      vault_id: vaultId,
      name: vault.name,
      created_at: vault.created_at,
      updated_at: new Date().toISOString(),
      infrastructure: vault.infrastructure,
      logic: vault.logic
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vault:delete', async (event, { vaultId }) => {
  try {
    const vaultPath = path.join(VAULTS_PATH, `${vaultId}.vault`);
    const metaPath = path.join(VAULTS_PATH, `${vaultId}.meta`);
    
    if (fs.existsSync(vaultPath)) fs.unlinkSync(vaultPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vault:export', async (event, { vaultId, password }) => {
  try {
    const vaultPath = path.join(VAULTS_PATH, `${vaultId}.vault`);
    const encrypted = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
    
    // Verify password first
    decrypt(encrypted, password);
    
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `SatsLegacy-vault-${vaultId.slice(0, 8)}.btv`,
      filters: [{ name: 'SatsLegacy Vault', extensions: ['btv'] }]
    });
    
    if (filePath) {
      const exportData = {
        format: 'SatsLegacy-vault-v1',
        exported_at: new Date().toISOString(),
        encrypted_vault: encrypted
      };
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      return { success: true, filePath };
    }
    
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vault:import', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'SatsLegacy Vault', extensions: ['btv'] }],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths.length > 0) {
      const content = fs.readFileSync(filePaths[0], 'utf8');
      const importData = JSON.parse(content);
      
      if (importData.format !== 'SatsLegacy-vault-v1') {
        return { success: false, error: 'Invalid vault format' };
      }
      
      return { success: true, encrypted: importData.encrypted_vault };
    }
    
    return { success: false, error: 'Import cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// LICENSE MANAGEMENT
// ============================================

// BTCPay Server Ed25519 public key (replace with your actual key)
const BTCPAY_PUBLIC_KEY = 'YOUR_ED25519_PUBLIC_KEY_HERE';

ipcMain.handle('license:check', async () => {
  try {
    if (!fs.existsSync(LICENSE_PATH)) {
      return { success: true, licensed: false, tier: 'free' };
    }
    
    const license = JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'));
    
    // Verify signature
    const isValid = verifyLicense(license);
    
    if (isValid) {
      return { 
        success: true, 
        licensed: true, 
        tier: license.tier,
        email: license.email,
        activated_at: license.activated_at,
        vault_limit: license.tier === 'pro' ? Infinity : 10
      };
    }
    
    return { success: true, licensed: false, tier: 'free' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:activate', async (event, { licenseKey }) => {
  try {
    // Decode and verify license key
    const license = decodeLicenseKey(licenseKey);
    
    if (!license) {
      return { success: false, error: 'Invalid license key' };
    }
    
    // Verify signature
    if (!verifyLicense(license)) {
      return { success: false, error: 'License signature verification failed' };
    }
    
    // Save license
    license.activated_at = new Date().toISOString();
    license.machine_id = getMachineId();
    fs.writeFileSync(LICENSE_PATH, JSON.stringify(license, null, 2));
    
    return { 
      success: true, 
      tier: license.tier,
      vault_limit: license.tier === 'pro' ? Infinity : 10
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:purchase', async (event, { tier }) => {
  // Open BTCPay Server checkout
  const btcpayUrl = tier === 'pro' 
    ? 'https://your-btcpay-server.com/checkout/pro'
    : 'https://your-btcpay-server.com/checkout/standard';
  
  shell.openExternal(btcpayUrl);
  return { success: true };
});

function decodeLicenseKey(key) {
  try {
    // License format: base64(JSON({ tier, email, issued_at, signature }))
    const decoded = Buffer.from(key, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function verifyLicense(license) {
  try {
    // In production, verify Ed25519 signature
    // For now, check structure
    return license && license.tier && license.signature;
  } catch {
    return false;
  }
}

function getMachineId() {
  // Generate unique machine identifier
  const os = require('os');
  const data = os.hostname() + os.platform() + os.arch();
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

// ============================================
// SETTINGS
// ============================================

ipcMain.handle('settings:load', async () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return { 
        success: true, 
        settings: {
          torEnabled: false,
          network: 'mainnet',
          electrumServer: 'electrum.blockstream.info:50002',
          theme: 'dark'
        }
      };
    }
    
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings:save', async (event, { settings }) => {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// SYSTEM OPERATIONS
// ============================================

ipcMain.handle('system:openExternal', async (event, { url }) => {
  shell.openExternal(url);
  return { success: true };
});

ipcMain.handle('system:getAppInfo', async () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    dataPath: APP_DATA_PATH
  };
});
