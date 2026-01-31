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

// Suppress GPU cache errors on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-software-rasterizer');

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
  // Use ICO on Windows for proper taskbar/title bar icon
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icons/win/icon.ico')
    : path.join(__dirname, '../build/icons/png/256x256.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#09090b',
    titleBarStyle: 'hiddenInset',
    icon: iconPath,
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

  // Start background monitoring for check-in reminders
  startCheckInMonitor();

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
      description: vault.description,
      created_at: vault.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      infrastructure: vault.infrastructure,
      logic: vault.logic,
      beneficiaries: vault.beneficiaries || [],
      address: vault.address,
      ownerPubkey: vault.ownerPubkey,
      lockDate: vault.lockDate,
      inactivityTrigger: vault.inactivityTrigger
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
      description: vault.description,
      created_at: vault.created_at,
      updated_at: new Date().toISOString(),
      infrastructure: vault.infrastructure,
      logic: vault.logic,
      beneficiaries: vault.beneficiaries || [],
      address: vault.address,
      ownerPubkey: vault.ownerPubkey,
      lockDate: vault.lockDate,
      inactivityTrigger: vault.inactivityTrigger
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

const DEFAULT_SETTINGS = {
  torEnabled: false,
  network: 'mainnet',
  electrumServer: 'electrum.blockstream.info:50002',
  theme: 'dark',
  notifications: {
    enabled: false,
    warningDays: 7,
    criticalDays: 2
  },
  duress: {
    enabled: false,
    action: 'show_decoy',
    decoyVaultIds: [],
    silentAlert: false
  }
};

ipcMain.handle('settings:load', async () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return { success: true, settings: DEFAULT_SETTINGS };
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    // Merge with defaults to ensure all fields exist
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
    if (settings.notifications) {
      mergedSettings.notifications = { ...DEFAULT_SETTINGS.notifications, ...settings.notifications };
    }
    return { success: true, settings: mergedSettings };
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
// DURESS PROTECTION
// ============================================

const DECOY_VAULTS_PATH = path.join(VAULTS_PATH, '.decoy');

// Hash password for duress comparison (same algorithm as vault encryption)
function hashDuressPassword(password, salt) {
  return crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), ITERATIONS, KEY_LENGTH, 'sha256').toString('base64');
}

// Set duress password
ipcMain.handle('duress:setPassword', async (event, { password }) => {
  try {
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    // Generate salt and hash
    const salt = crypto.randomBytes(SALT_LENGTH).toString('base64');
    const passwordHash = hashDuressPassword(password, salt);

    // Update duress settings
    settings.duress = {
      ...settings.duress,
      enabled: true,
      passwordHash,
      salt
    };

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Remove duress password
ipcMain.handle('duress:removePassword', async () => {
  try {
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    // Clear duress settings
    settings.duress = {
      enabled: false,
      action: 'show_decoy',
      decoyVaultIds: [],
      silentAlert: false
    };

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check if password is duress password (returns true without revealing to UI)
ipcMain.handle('duress:checkPassword', async (event, { password }) => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return { success: true, isDuress: false };
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));

    if (!settings.duress?.enabled || !settings.duress?.passwordHash || !settings.duress?.salt) {
      return { success: true, isDuress: false };
    }

    // Hash the provided password with stored salt
    const testHash = hashDuressPassword(password, settings.duress.salt);
    const isDuress = testHash === settings.duress.passwordHash;

    return { success: true, isDuress };
  } catch (error) {
    return { success: false, error: error.message, isDuress: false };
  }
});

// Get decoy vaults (separate from real vaults)
ipcMain.handle('duress:getDecoyVaults', async () => {
  try {
    // Ensure decoy directory exists
    if (!fs.existsSync(DECOY_VAULTS_PATH)) {
      fs.mkdirSync(DECOY_VAULTS_PATH, { recursive: true });
    }

    const files = fs.readdirSync(DECOY_VAULTS_PATH);
    const vaults = [];

    for (const file of files) {
      if (file.endsWith('.meta')) {
        const metaPath = path.join(DECOY_VAULTS_PATH, file);
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        meta.isDecoy = true; // Mark as decoy
        vaults.push(meta);
      }
    }

    return { success: true, vaults };
  } catch (error) {
    return { success: false, error: error.message, vaults: [] };
  }
});

// Create decoy vault
ipcMain.handle('duress:createDecoyVault', async (event, { vault }) => {
  try {
    if (!fs.existsSync(DECOY_VAULTS_PATH)) {
      fs.mkdirSync(DECOY_VAULTS_PATH, { recursive: true });
    }

    const vaultId = vault.vault_id || crypto.randomUUID();
    const metaPath = path.join(DECOY_VAULTS_PATH, `${vaultId}.meta`);

    // Save metadata only (decoy vaults don't need full encrypted data)
    const meta = {
      vault_id: vaultId,
      name: vault.name,
      description: vault.description,
      created_at: vault.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: vault.address,
      balance: vault.balance || 0,
      balanceUSD: vault.balanceUSD || 0,
      beneficiaries: vault.beneficiaries || [],
      lockDate: vault.lockDate,
      isDecoy: true
    };

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    // Update settings to include this decoy vault
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    if (!settings.duress) settings.duress = { ...DEFAULT_SETTINGS.duress };
    if (!settings.duress.decoyVaultIds) settings.duress.decoyVaultIds = [];
    if (!settings.duress.decoyVaultIds.includes(vaultId)) {
      settings.duress.decoyVaultIds.push(vaultId);
    }

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

    return { success: true, vaultId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete decoy vault
ipcMain.handle('duress:deleteDecoyVault', async (event, { vaultId }) => {
  try {
    const metaPath = path.join(DECOY_VAULTS_PATH, `${vaultId}.meta`);

    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }

    // Remove from settings
    if (fs.existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      if (settings.duress?.decoyVaultIds) {
        settings.duress.decoyVaultIds = settings.duress.decoyVaultIds.filter(id => id !== vaultId);
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Execute duress action (wipe real vaults)
ipcMain.handle('duress:executeWipe', async () => {
  try {
    // Securely delete all real vault files
    const files = fs.readdirSync(VAULTS_PATH);

    for (const file of files) {
      const filePath = path.join(VAULTS_PATH, file);

      // Skip decoy directory
      if (file === '.decoy') continue;

      // Skip if not a file
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      // Overwrite with random data before deleting (secure wipe)
      const fileSize = stat.size;
      const randomData = crypto.randomBytes(fileSize);
      fs.writeFileSync(filePath, randomData);

      // Delete file
      fs.unlinkSync(filePath);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Send silent duress alert (if configured)
ipcMain.handle('duress:sendSilentAlert', async () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return { success: false, error: 'No settings' };
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));

    if (!settings.duress?.silentAlert || !settings.duress?.alertEmail) {
      return { success: false, error: 'Silent alert not configured' };
    }

    // Send email alert using Resend
    const apiKey = settings.notifications?.resendApiKey;
    if (!apiKey) {
      return { success: false, error: 'Email not configured' };
    }

    const resend = await getResendClient(apiKey);
    if (!resend) {
      return { success: false, error: 'Failed to initialize email' };
    }

    await resend.emails.send({
      from: settings.notifications?.fromEmail || 'alerts@satslegacy.com',
      to: settings.duress.alertEmail,
      subject: 'Security Alert',
      html: `
        <h2>Duress Alert Triggered</h2>
        <p>A duress password was entered on your SatsLegacy application.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If this was you in a test, no action is needed.</p>
        <p>If this was unexpected, your security may be compromised.</p>
      `
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// TOR SOCKS5 PROXY
// ============================================

let torStatus = {
  connected: false,
  lastError: null,
  lastCheck: null
};

/**
 * Create a SOCKS proxy agent for Tor
 */
async function createTorAgent(host, port) {
  try {
    const { SocksProxyAgent } = await import('socks-proxy-agent');
    return new SocksProxyAgent(`socks5://${host}:${port}`);
  } catch (error) {
    console.error('Failed to create Tor agent:', error.message);
    return null;
  }
}

/**
 * Make an HTTP/HTTPS request through Tor
 */
ipcMain.handle('tor:fetch', async (event, { url, options = {} }) => {
  try {
    // Load settings to get Tor config
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) };
    }

    const torConfig = settings.tor || { enabled: false, host: '127.0.0.1', port: 9050 };

    if (!torConfig.enabled) {
      return { success: false, error: 'Tor is not enabled' };
    }

    const agent = await createTorAgent(torConfig.host, torConfig.port);
    if (!agent) {
      torStatus.connected = false;
      torStatus.lastError = 'Failed to create SOCKS agent';
      return { success: false, error: 'Failed to create Tor agent' };
    }

    // Use native fetch with the agent
    const fetchOptions = {
      ...options,
      agent,
      headers: {
        'User-Agent': 'SatsLegacy/1.0',
        ...(options.headers || {})
      }
    };

    // Use node-fetch or https module for proxy support
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');

    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        agent: agent,
        headers: {
          'User-Agent': 'SatsLegacy/1.0',
          'Host': parsedUrl.hostname,
          ...(options.headers || {})
        },
        timeout: 30000
      };

      const req = protocol.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          torStatus.connected = true;
          torStatus.lastError = null;
          torStatus.lastCheck = Date.now();

          resolve({
            success: true,
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data,
            headers: res.headers
          });
        });
      });

      req.on('error', (error) => {
        torStatus.connected = false;
        torStatus.lastError = error.message;
        torStatus.lastCheck = Date.now();

        resolve({
          success: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        torStatus.connected = false;
        torStatus.lastError = 'Connection timeout';
        resolve({
          success: false,
          error: 'Connection timeout'
        });
      });

      // Send body if present
      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  } catch (error) {
    torStatus.connected = false;
    torStatus.lastError = error.message;
    return { success: false, error: error.message };
  }
});

/**
 * Test Tor connection by checking IP via Tor check service
 */
ipcMain.handle('tor:testConnection', async () => {
  try {
    // Load settings
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) };
    }

    const torConfig = settings.tor || { host: '127.0.0.1', port: 9050 };
    const agent = await createTorAgent(torConfig.host, torConfig.port);

    if (!agent) {
      return {
        success: false,
        connected: false,
        error: 'Failed to create SOCKS agent - is Tor running?'
      };
    }

    const https = require('https');
    const { URL } = require('url');

    return new Promise((resolve) => {
      // Use Tor Project's check service
      const checkUrl = new URL('https://check.torproject.org/api/ip');

      const req = https.request({
        hostname: checkUrl.hostname,
        port: 443,
        path: checkUrl.pathname,
        method: 'GET',
        agent: agent,
        headers: {
          'User-Agent': 'SatsLegacy/1.0',
          'Host': checkUrl.hostname
        },
        timeout: 15000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            torStatus.connected = result.IsTor === true;
            torStatus.lastError = null;
            torStatus.lastCheck = Date.now();

            resolve({
              success: true,
              connected: result.IsTor === true,
              ip: result.IP,
              isTor: result.IsTor
            });
          } catch (e) {
            resolve({
              success: false,
              connected: false,
              error: 'Invalid response from Tor check'
            });
          }
        });
      });

      req.on('error', (error) => {
        torStatus.connected = false;
        torStatus.lastError = error.message;
        torStatus.lastCheck = Date.now();

        let errorMsg = error.message;
        if (error.code === 'ECONNREFUSED') {
          errorMsg = 'Connection refused - is Tor daemon running on ' + torConfig.host + ':' + torConfig.port + '?';
        }

        resolve({
          success: false,
          connected: false,
          error: errorMsg
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          connected: false,
          error: 'Connection timeout - Tor may be slow or not running'
        });
      });

      req.end();
    });
  } catch (error) {
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
});

/**
 * Get current Tor connection status
 */
ipcMain.handle('tor:getStatus', async () => {
  return {
    success: true,
    ...torStatus
  };
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

// ============================================
// NOTIFICATIONS (Resend Email)
// ============================================

let resendClient = null;

async function getResendClient(apiKey) {
  if (!apiKey) return null;
  try {
    // Dynamic import for ESM module
    const { Resend } = await import('resend');
    return new Resend(apiKey);
  } catch (error) {
    console.error('Failed to initialize Resend:', error.message);
    return null;
  }
}

ipcMain.handle('notifications:sendCheckInReminder', async (event, { toEmail, vaultName, daysRemaining, status }) => {
  try {
    // Load settings to get API key
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    const apiKey = settings.notifications?.resendApiKey;
    const fromEmail = settings.notifications?.fromEmail || 'notifications@satslegacy.com';

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    const client = await getResendClient(apiKey);
    if (!client) {
      return { success: false, error: 'Failed to initialize email client' };
    }

    const urgencyText = status === 'critical' ? 'URGENT' : status === 'expired' ? 'Expired' : 'Reminder';
    const urgencyColor = status === 'critical' ? '#ef4444' : status === 'expired' ? '#dc2626' : '#eab308';

    const subject = status === 'expired'
      ? `⚠️ SatsLegacy: Check-In Expired for "${vaultName}"`
      : status === 'critical'
      ? `🚨 URGENT: Check-In Required for "${vaultName}" (${daysRemaining} days)`
      : `⏰ SatsLegacy: Check-In Reminder for "${vaultName}" (${daysRemaining} days)`;

    const result = await client.emails.send({
      from: `SatsLegacy <${fromEmail}>`,
      to: toEmail,
      subject,
      html: generateCheckInHtml(vaultName, daysRemaining, status, urgencyColor),
      text: generateCheckInText(vaultName, daysRemaining, status)
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notifications:sendHeirNotification', async (event, { toEmail, vaultName, ownerName }) => {
  try {
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    const apiKey = settings.notifications?.resendApiKey;
    const fromEmail = settings.notifications?.fromEmail || 'notifications@satslegacy.com';

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    const client = await getResendClient(apiKey);
    if (!client) {
      return { success: false, error: 'Failed to initialize email client' };
    }

    const result = await client.emails.send({
      from: `SatsLegacy <${fromEmail}>`,
      to: toEmail,
      subject: `SatsLegacy: Vault "${vaultName}" is Now Claimable`,
      html: generateHeirHtml(vaultName, ownerName),
      text: generateHeirText(vaultName, ownerName)
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notifications:testEmail', async (event, { toEmail }) => {
  try {
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    const apiKey = settings.notifications?.resendApiKey;
    const fromEmail = settings.notifications?.fromEmail || 'notifications@satslegacy.com';

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    const client = await getResendClient(apiKey);
    if (!client) {
      return { success: false, error: 'Failed to initialize email client' };
    }

    const result = await client.emails.send({
      from: `SatsLegacy <${fromEmail}>`,
      to: toEmail,
      subject: 'SatsLegacy: Test Notification',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #18181b; color: #fff;">
          <h2 style="color: #f97316;">SatsLegacy Test Email</h2>
          <p style="color: #a1a1aa;">This is a test notification from SatsLegacy.</p>
          <p style="color: #a1a1aa;">If you received this email, your notification settings are configured correctly.</p>
        </div>
      `,
      text: 'SatsLegacy Test Email\n\nThis is a test notification from SatsLegacy.\nIf you received this email, your notification settings are configured correctly.'
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Email template helpers
function generateCheckInHtml(vaultName, daysRemaining, status, urgencyColor) {
  const urgencyText = status === 'critical' ? 'Urgent' : status === 'expired' ? 'Expired' : 'Reminder';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #18181b;">
  <table style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="padding: 30px; background-color: #27272a; border-radius: 16px; border: 1px solid #3f3f46;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #f97316;">SatsLegacy</h1>
        <span style="display: inline-block; padding: 8px 16px; background-color: ${urgencyColor}20; color: ${urgencyColor}; border-radius: 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;">
          ${urgencyText}
        </span>
        <h2 style="margin: 20px 0; color: #ffffff;">Check-In Required</h2>
        <p style="color: #a1a1aa; line-height: 1.6;">
          Your vault <strong style="color: #ffffff;">"${vaultName}"</strong> requires a check-in to maintain control.
        </p>
        <div style="padding: 20px; background-color: ${urgencyColor}10; border: 1px solid ${urgencyColor}30; border-radius: 12px; margin: 20px 0;">
          ${status === 'expired'
            ? `<p style="margin: 0; color: ${urgencyColor}; font-weight: bold;">Check-In Period Expired</p>
               <p style="margin: 4px 0 0 0; color: #a1a1aa;">Your heirs may now be able to claim the vault funds.</p>`
            : `<p style="margin: 0; color: ${urgencyColor}; font-weight: bold;">${daysRemaining} days remaining</p>
               <p style="margin: 4px 0 0 0; color: #a1a1aa;">Check in before the timer expires to maintain control.</p>`
          }
        </div>
        <h3 style="color: #ffffff; margin-bottom: 12px;">How to Check In</h3>
        <ol style="color: #a1a1aa; line-height: 1.8; padding-left: 20px;">
          <li>Open SatsLegacy and navigate to your vault</li>
          <li>Click the "Check In" button</li>
          <li>Generate and sign the check-in PSBT with your hardware wallet</li>
          <li>Broadcast the transaction to reset the timer</li>
        </ol>
        <p style="color: #52525b; font-size: 12px; margin-top: 30px; text-align: center;">
          This is an automated notification from SatsLegacy. Do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateCheckInText(vaultName, daysRemaining, status) {
  if (status === 'expired') {
    return `SatsLegacy Check-In EXPIRED\n\nYour vault "${vaultName}" check-in period has expired.\n\nWARNING: Your heirs may now be able to claim the vault funds.\n\nTo regain exclusive control:\n1. Open SatsLegacy and navigate to your vault\n2. Click the "Check In" button\n3. Generate and sign the check-in PSBT\n4. Broadcast the transaction\n\nThis is an automated notification from SatsLegacy.`;
  }
  return `SatsLegacy Check-In ${status === 'critical' ? 'URGENT' : 'Reminder'}\n\nYour vault "${vaultName}" requires a check-in.\n\nTIME REMAINING: ${daysRemaining} days\n\nTo check in:\n1. Open SatsLegacy and navigate to your vault\n2. Click the "Check In" button\n3. Generate and sign the check-in PSBT\n4. Broadcast the transaction\n\nThis is an automated notification from SatsLegacy.`;
}

function generateHeirHtml(vaultName, ownerName) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #18181b;">
  <table style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="padding: 30px; background-color: #27272a; border-radius: 16px; border: 1px solid #3f3f46;">
        <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #f97316;">SatsLegacy</h1>
        <h2 style="margin: 0 0 20px 0; color: #ffffff;">Vault Now Claimable</h2>
        <p style="color: #a1a1aa; line-height: 1.6;">
          You have been designated as a beneficiary of the vault <strong style="color: #ffffff;">"${vaultName}"</strong>${ownerName ? ` by ${ownerName}` : ''}.
        </p>
        <p style="color: #a1a1aa; line-height: 1.6;">
          The vault's inactivity period has expired, and you may now be eligible to claim your designated portion of the funds.
        </p>
        <div style="padding: 20px; background-color: #f9731610; border: 1px solid #f9731630; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #f97316; font-weight: bold;">Important</p>
          <p style="margin: 8px 0 0 0; color: #a1a1aa;">
            To claim funds, you will need the Heir Kit that was provided to you. This contains the necessary information to construct a valid claim transaction.
          </p>
        </div>
        <p style="color: #52525b; font-size: 12px; margin-top: 30px; text-align: center;">
          This is an automated notification from SatsLegacy.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateHeirText(vaultName, ownerName) {
  return `SatsLegacy Vault Notification\n\nVAULT NOW CLAIMABLE\n\nYou have been designated as a beneficiary of the vault "${vaultName}"${ownerName ? ` by ${ownerName}` : ''}.\n\nThe vault's inactivity period has expired, and you may now be eligible to claim your designated portion of the funds.\n\nIMPORTANT: To claim funds, you will need the Heir Kit that was provided to you.\n\nThis is an automated notification from SatsLegacy.`;
}

// ============================================
// BACKGROUND CHECK-IN MONITOR
// ============================================

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
const NOTIFICATION_COOLDOWN_PATH = path.join(APP_DATA_PATH, 'notification-cooldown.json');

let checkInMonitorInterval = null;

/**
 * Load notification cooldown state to avoid spamming
 */
function loadNotificationCooldown() {
  try {
    if (fs.existsSync(NOTIFICATION_COOLDOWN_PATH)) {
      return JSON.parse(fs.readFileSync(NOTIFICATION_COOLDOWN_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load notification cooldown:', error.message);
  }
  return {};
}

/**
 * Save notification cooldown state
 */
function saveNotificationCooldown(cooldown) {
  try {
    fs.writeFileSync(NOTIFICATION_COOLDOWN_PATH, JSON.stringify(cooldown, null, 2));
  } catch (error) {
    console.error('Failed to save notification cooldown:', error.message);
  }
}

/**
 * Calculate check-in status for a vault
 */
function calculateCheckInStatus(vault) {
  const { logic, inactivityTrigger, checkIn } = vault;

  // Only process dead_man_switch vaults
  if (logic?.primary !== 'dead_man_switch') {
    return null;
  }

  const intervalDays = inactivityTrigger || 90;
  const lastCheckIn = checkIn?.lastCheckIn || vault.created_at || new Date().toISOString();
  const warningDays = checkIn?.warningThresholdDays || 7;
  const criticalDays = checkIn?.criticalThresholdDays || 2;

  const now = new Date();
  const lastDate = new Date(lastCheckIn);
  const nextDue = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((nextDue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  let status = 'healthy';
  if (daysRemaining <= 0) {
    status = 'expired';
  } else if (daysRemaining <= criticalDays) {
    status = 'critical';
  } else if (daysRemaining <= warningDays) {
    status = 'warning';
  }

  return {
    status,
    daysRemaining: Math.max(0, daysRemaining),
    nextDue: nextDue.toISOString()
  };
}

/**
 * Check all vaults and send notifications as needed
 */
async function checkVaultsAndNotify() {
  try {
    // Load settings
    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    // Check if notifications are enabled
    if (!settings.notifications?.enabled || !settings.notifications?.resendApiKey || !settings.notifications?.ownerEmail) {
      return;
    }

    // Load notification cooldown
    const cooldown = loadNotificationCooldown();
    const now = Date.now();
    const cooldownHours = {
      warning: 24,   // Send warning at most once per day
      critical: 12,  // Send critical every 12 hours
      expired: 24    // Send expired once per day
    };

    // Read all vault metadata
    const files = fs.readdirSync(VAULTS_PATH);
    let notificationsUpdated = false;

    for (const file of files) {
      if (!file.endsWith('.meta')) continue;

      const metaPath = path.join(VAULTS_PATH, file);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const vaultId = meta.vault_id;

      // Calculate check-in status
      const checkInStatus = calculateCheckInStatus(meta);
      if (!checkInStatus) continue;

      // Determine if we should send notification
      const { status, daysRemaining } = checkInStatus;

      if (status === 'healthy') continue;

      // Check cooldown
      const cooldownKey = `${vaultId}_${status}`;
      const lastNotified = cooldown[cooldownKey] || 0;
      const cooldownMs = cooldownHours[status] * 60 * 60 * 1000;

      if (now - lastNotified < cooldownMs) {
        continue; // Still in cooldown period
      }

      // Send notification
      console.log(`Sending ${status} notification for vault "${meta.name}"`);

      const client = await getResendClient(settings.notifications.resendApiKey);
      if (!client) continue;

      const fromEmail = settings.notifications.fromEmail || 'notifications@satslegacy.com';
      const urgencyColor = status === 'critical' ? '#ef4444' : status === 'expired' ? '#dc2626' : '#eab308';

      const subject = status === 'expired'
        ? `⚠️ SatsLegacy: Check-In Expired for "${meta.name}"`
        : status === 'critical'
        ? `🚨 URGENT: Check-In Required for "${meta.name}" (${daysRemaining} days)`
        : `⏰ SatsLegacy: Check-In Reminder for "${meta.name}" (${daysRemaining} days)`;

      try {
        await client.emails.send({
          from: `SatsLegacy <${fromEmail}>`,
          to: settings.notifications.ownerEmail,
          subject,
          html: generateCheckInHtml(meta.name, daysRemaining, status, urgencyColor),
          text: generateCheckInText(meta.name, daysRemaining, status)
        });

        // Update cooldown
        cooldown[cooldownKey] = now;
        notificationsUpdated = true;

        console.log(`Sent ${status} notification for vault "${meta.name}"`);

        // If expired, also notify heirs (if they have email)
        if (status === 'expired' && meta.beneficiaries) {
          for (const beneficiary of meta.beneficiaries) {
            if (beneficiary.email) {
              const heirCooldownKey = `${vaultId}_heir_${beneficiary.email}`;
              if (now - (cooldown[heirCooldownKey] || 0) >= 24 * 60 * 60 * 1000) {
                try {
                  await client.emails.send({
                    from: `SatsLegacy <${fromEmail}>`,
                    to: beneficiary.email,
                    subject: `SatsLegacy: Vault "${meta.name}" is Now Claimable`,
                    html: generateHeirHtml(meta.name, null),
                    text: generateHeirText(meta.name, null)
                  });
                  cooldown[heirCooldownKey] = now;
                  console.log(`Sent heir notification to ${beneficiary.email}`);
                } catch (heirError) {
                  console.error(`Failed to notify heir ${beneficiary.email}:`, heirError.message);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to send notification for vault "${meta.name}":`, error.message);
      }
    }

    if (notificationsUpdated) {
      saveNotificationCooldown(cooldown);
    }
  } catch (error) {
    console.error('Check-in monitor error:', error.message);
  }
}

/**
 * Start the background check-in monitor
 */
function startCheckInMonitor() {
  // Run immediately on startup
  setTimeout(() => {
    console.log('Running initial check-in monitor check');
    checkVaultsAndNotify();
  }, 5000); // Wait 5 seconds after startup

  // Then run periodically
  checkInMonitorInterval = setInterval(() => {
    console.log('Running periodic check-in monitor check');
    checkVaultsAndNotify();
  }, CHECK_INTERVAL_MS);
}

/**
 * Stop the background check-in monitor
 */
function stopCheckInMonitor() {
  if (checkInMonitorInterval) {
    clearInterval(checkInMonitorInterval);
    checkInMonitorInterval = null;
  }
}

// Clean up on app quit
app.on('before-quit', () => {
  stopCheckInMonitor();
});
