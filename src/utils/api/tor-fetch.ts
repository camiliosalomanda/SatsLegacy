/**
 * Tor-aware fetch utility
 *
 * Routes HTTP requests through Tor SOCKS5 proxy when enabled.
 * Falls back to direct fetch when Tor is disabled or unavailable.
 */

import type { TorSettings } from '../../types/settings';

const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

interface TorFetchResponse {
  success: boolean;
  status?: number;
  statusText?: string;
  data?: string;
  headers?: Record<string, string>;
  error?: string;
}

interface TorTestResult {
  success: boolean;
  connected: boolean;
  ip?: string;
  isTor?: boolean;
  error?: string;
}

// Cache for Tor settings to avoid repeated IPC calls
let cachedTorSettings: TorSettings | null = null;
let settingsLastFetched = 0;
const SETTINGS_CACHE_MS = 5000; // Refresh settings every 5 seconds

/**
 * Get current Tor settings (cached)
 */
async function getTorSettings(): Promise<TorSettings> {
  const now = Date.now();

  if (cachedTorSettings && (now - settingsLastFetched) < SETTINGS_CACHE_MS) {
    return cachedTorSettings;
  }

  if (electronAPI) {
    try {
      const result = await electronAPI.settings.load();
      if (result.settings?.tor) {
        cachedTorSettings = result.settings.tor;
        settingsLastFetched = now;
        return cachedTorSettings;
      }
    } catch (e) {
      console.warn('Failed to load Tor settings:', e);
    }
  }

  // Default settings
  return {
    enabled: false,
    host: '127.0.0.1',
    port: 9050
  };
}

/**
 * Clear the settings cache (call when settings change)
 */
export function clearTorSettingsCache(): void {
  cachedTorSettings = null;
  settingsLastFetched = 0;
}

/**
 * Fetch with Tor support
 *
 * When Tor is enabled and running in Electron, routes the request
 * through the Tor SOCKS5 proxy. Otherwise falls back to direct fetch.
 */
export async function torFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const torSettings = await getTorSettings();

  // Use Tor proxy if enabled and in Electron
  if (torSettings.enabled && electronAPI?.tor) {
    const torOptions = {
      method: options.method || 'GET',
      headers: options.headers as Record<string, string>,
      body: options.body as string | undefined
    };

    const result: TorFetchResponse = await electronAPI.tor.fetch(url, torOptions);

    if (result.success) {
      // Create a Response-like object from the Tor result
      return new Response(result.data, {
        status: result.status || 200,
        statusText: result.statusText || 'OK',
        headers: new Headers(result.headers || {})
      });
    } else {
      // Tor request failed - throw error or fall back
      console.warn(`Tor fetch failed for ${url}:`, result.error);
      throw new Error(`Tor request failed: ${result.error}`);
    }
  }

  // Direct fetch (no Tor or not in Electron)
  return fetch(url, options);
}

/**
 * Test Tor connection
 *
 * Verifies that the Tor proxy is running and properly routing traffic.
 * Returns the exit node IP and confirmation that traffic is going through Tor.
 */
export async function testTorConnection(): Promise<TorTestResult> {
  if (!electronAPI?.tor) {
    return {
      success: false,
      connected: false,
      error: 'Tor API not available (not running in Electron)'
    };
  }

  return electronAPI.tor.testConnection();
}

/**
 * Get current Tor status
 */
export async function getTorStatus(): Promise<{
  connected: boolean;
  lastError: string | null;
  lastCheck: number | null;
}> {
  if (!electronAPI?.tor) {
    return {
      connected: false,
      lastError: 'Not running in Electron',
      lastCheck: null
    };
  }

  const result = await electronAPI.tor.getStatus();
  return {
    connected: result.connected || false,
    lastError: result.lastError || null,
    lastCheck: result.lastCheck || null
  };
}

/**
 * Check if Tor is available and enabled
 */
export async function isTorEnabled(): Promise<boolean> {
  const settings = await getTorSettings();
  return settings.enabled && !!electronAPI?.tor;
}
