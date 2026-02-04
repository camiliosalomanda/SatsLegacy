/**
 * Input validation utilities for SatsLegacy
 */

/**
 * Check if a string is a valid hex-encoded compressed public key (33 bytes)
 * Format: 02 or 03 prefix + 64 hex characters = 66 chars total
 */
export function isValidHexPubkey(key: string): boolean {
  return /^(02|03)[a-fA-F0-9]{64}$/.test(key);
}

/**
 * Check if a string is a valid extended public key (xpub/tpub/etc)
 * - xpub: mainnet BIP32
 * - tpub: testnet BIP32
 * - xpub/ypub/zpub: different derivation paths (all valid)
 */
export function isValidExtendedPubkey(key: string): boolean {
  // Extended pubkeys start with version prefix and are base58check encoded
  // They're typically 111-112 characters
  return /^[xtuvyz]pub[1-9A-HJ-NP-Za-km-z]{100,}$/.test(key);
}

/**
 * Validate a public key - either hex or extended format
 */
export function validatePublicKey(key: string): { valid: boolean; error?: string } {
  if (!key || !key.trim()) {
    return { valid: false, error: 'Public key is required' };
  }

  const trimmed = key.trim();

  // Check for hex pubkey
  if (/^(02|03)/.test(trimmed)) {
    if (isValidHexPubkey(trimmed)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Invalid hex public key. Must be 02 or 03 followed by 64 hex characters (66 total)'
    };
  }

  // Check for extended pubkey
  if (/^[xtuvyz]pub/.test(trimmed)) {
    if (isValidExtendedPubkey(trimmed)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Invalid extended public key format. Verify you copied the complete xpub/tpub'
    };
  }

  // Unknown format
  return {
    valid: false,
    error: 'Invalid key format. Enter a hex public key (02/03...) or extended public key (xpub/tpub...)'
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string; warnings?: string[] } {
  const warnings: string[] = [];

  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  // Warnings (not errors) for stronger passwords
  if (password.length < 12) {
    warnings.push('Consider using 12+ characters for better security');
  }
  if (!/[A-Z]/.test(password)) {
    warnings.push('Adding uppercase letters increases security');
  }
  if (!/[0-9]/.test(password)) {
    warnings.push('Adding numbers increases security');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    warnings.push('Adding special characters increases security');
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Check if passwords match
 */
export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}

/**
 * Validate beneficiary name
 */
export function validateBeneficiaryName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }
  return { valid: true };
}

/**
 * Validate percentage allocation
 */
export function validatePercentage(
  value: string | number,
  maxAllowed: number
): { valid: boolean; error?: string; parsed?: number } {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(num)) {
    return { valid: false, error: 'Percentage must be a number' };
  }
  if (num <= 0) {
    return { valid: false, error: 'Percentage must be greater than 0' };
  }
  if (num > maxAllowed) {
    return { valid: false, error: `Percentage cannot exceed ${maxAllowed}%` };
  }
  if (num > 100) {
    return { valid: false, error: 'Percentage cannot exceed 100%' };
  }

  return { valid: true, parsed: num };
}
