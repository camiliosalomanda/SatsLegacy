/**
 * BitTrust Vault Module - Usage Examples
 * 
 * This file demonstrates how to use the vault infrastructure
 * and inheritance logic systems.
 */

import {
  // Validation
  validateConfiguration,
  canAddOption,
  getAvailableOptions,
  PRESET_BUNDLES,
  type VaultConfiguration,
  
  // Scripts
  generatePolicy,
  generateStaggeredPolicies,
  extractRedeemInfo,
  type KeyDescriptor,
  type TimelockConfig,
  type VaultScriptConfig,
  
  // Storage
  encryptVault,
  decryptVault,
  VaultStorage,
  LocalStorageBackend,
  exportVaultToFile,
  importVaultFromFile,
  
  // Shamir
  shamirSplit,
  shamirCombine,
  shamirEncode,
  shamirDecode,
  
  // Nostr
  NostrVaultStorage,
  generateNostrKeys,
  HeartbeatManager,
  
  // Helpers
  createVaultData,
  estimateBlockHeight
} from './vault';

// ============================================
// EXAMPLE 1: Simple Timelock Vault
// ============================================

async function createSimpleTimelockVault() {
  console.log('=== Example 1: Simple Timelock Vault ===\n');

  // 1. Define configuration
  const config: VaultConfiguration = {
    infrastructure: ['local', 'microsd'],
    primaryLogic: 'timelock',
    additionalGates: [],
    modifiers: []
  };

  // 2. Validate configuration
  const validation = validateConfiguration(config);
  console.log('Valid:', validation.valid);
  console.log('Warnings:', validation.warnings.length);
  console.log('Recommendations:', validation.recommendations.map(r => r.message));

  // 3. Define keys
  const keys: KeyDescriptor[] = [
    {
      id: 'owner',
      label: 'My Coldcard',
      publicKey: '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc',
      derivationPath: "m/84'/0'/0'/0/0",
      keyType: 'owner'
    },
    {
      id: 'heir1',
      label: 'Spouse Trezor',
      publicKey: '03b31cc8c6a6ce63b9c8b2e1c0a1c9c8b7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1',
      derivationPath: "m/84'/0'/0'/0/0",
      keyType: 'heir'
    }
  ];

  // 4. Set timelock for 1 year from now
  const targetDate = new Date();
  targetDate.setFullYear(targetDate.getFullYear() + 1);
  
  const timelocks: TimelockConfig[] = [
    {
      type: 'absolute',
      value: estimateBlockHeight(targetDate),
      estimatedDate: targetDate
    }
  ];

  // 5. Generate policy
  const scriptConfig: VaultScriptConfig = {
    keys,
    timelocks,
    logic: 'timelock',
    additionalGates: []
  };

  const policy = generatePolicy(scriptConfig);
  console.log('\nGenerated Policy:', policy);

  // 6. Extract redeem info
  const redeemInfo = extractRedeemInfo(policy, scriptConfig);
  console.log('\nSpend Paths:');
  redeemInfo.spendPaths.forEach(path => {
    console.log(`  - ${path.name}: ${path.requirements.join(', ')}`);
  });
}

// ============================================
// EXAMPLE 2: Resilient Sovereign (Preset Bundle)
// ============================================

async function createResilientSovereignVault() {
  console.log('\n=== Example 2: Resilient Sovereign Vault ===\n');

  // 1. Use preset bundle
  const bundle = PRESET_BUNDLES.find(b => b.id === 'resilient_sovereign')!;
  console.log('Bundle:', bundle.name);
  console.log('Description:', bundle.description);

  // 2. Validate the bundle's configuration
  const validation = validateConfiguration(bundle.config);
  console.log('Valid:', validation.valid);

  // 3. Check what options are available to add
  const available = getAvailableOptions(bundle.config);
  console.log('\nAvailable to add:');
  console.log('  Infrastructure:', available.infrastructure.filter(o => o.canAdd).map(o => o.option));
  console.log('  Gates:', available.gates.filter(o => o.canAdd).map(o => o.option));
  console.log('  Modifiers:', available.modifiers.filter(o => o.canAdd).map(o => o.option));
}

// ============================================
// EXAMPLE 3: Multisig Decay with Challenge
// ============================================

async function createMultisigDecayVault() {
  console.log('\n=== Example 3: Multisig Decay with Challenge ===\n');

  const config: VaultConfiguration = {
    infrastructure: ['local', 'shamir', 'nostr'],
    primaryLogic: 'multisig_decay',
    additionalGates: ['challenge'],
    modifiers: ['staggered']
  };

  const validation = validateConfiguration(config);
  console.log('Valid:', validation.valid);

  // Define keys for 2-of-3 multisig
  const keys: KeyDescriptor[] = [
    {
      id: 'owner',
      label: 'My Coldcard',
      publicKey: '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc',
      keyType: 'owner'
    },
    {
      id: 'heir1',
      label: 'Spouse Trezor',
      publicKey: '03b31cc8c6a6ce63b9c8b2e1c0a1c9c8b7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1',
      keyType: 'heir'
    },
    {
      id: 'heir2',
      label: 'Child Ledger',
      publicKey: '03c41dd9d7b7df74c9e9c3e2d2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
      keyType: 'heir'
    }
  ];

  // Set decay to 2 years from now
  const decayDate = new Date();
  decayDate.setFullYear(decayDate.getFullYear() + 2);

  const timelocks: TimelockConfig[] = [
    {
      type: 'absolute',
      value: estimateBlockHeight(decayDate),
      estimatedDate: decayDate
    }
  ];

  // Generate policy with decay config
  const scriptConfig: VaultScriptConfig = {
    keys,
    timelocks,
    logic: 'multisig_decay',
    additionalGates: ['challenge'],
    challengeHash: 'a1b2c3d4e5f6...', // SHA256 of passphrase
    decayConfig: {
      initialThreshold: 2,
      initialTotal: 3,
      decayedThreshold: 1,
      decayedTotal: 2,
      decayAfterBlocks: timelocks[0].value
    }
  };

  const policy = generatePolicy(scriptConfig);
  console.log('Generated Policy:', policy);

  // Generate staggered release policies
  const staggeredScriptConfig: VaultScriptConfig = {
    ...scriptConfig,
    staggeredConfig: {
      stages: [
        { percent: 25, blocksAfterTrigger: 0 },
        { percent: 25, blocksAfterTrigger: 26280 },
        { percent: 50, blocksAfterTrigger: 105120 }
      ]
    }
  };

  const staggeredPolicies = generateStaggeredPolicies(staggeredScriptConfig);
  console.log('\nStaggered Policies:');
  staggeredPolicies.forEach(p => {
    console.log(`  Stage ${p.stage}: ${p.percent}% - ${p.policy.slice(0, 50)}...`);
  });
}

// ============================================
// EXAMPLE 4: Encrypted Storage
// ============================================

async function demonstrateStorage() {
  console.log('\n=== Example 4: Encrypted Storage ===\n');

  // 1. Create vault data
  const vaultData = createVaultData(
    {
      infrastructure: ['local', 'microsd'],
      primaryLogic: 'timelock',
      additionalGates: [],
      modifiers: []
    },
    'Family Inheritance',
    [
      {
        id: 'owner',
        label: 'My Coldcard',
        publicKey: '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc',
        keyType: 'owner'
      },
      {
        id: 'heir1',
        label: 'Spouse',
        publicKey: '03b31cc8c6a6ce63b9c8b2e1c0a1c9c8b7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1',
        keyType: 'heir'
      }
    ],
    [{ type: 'absolute', value: 920000, estimatedDate: new Date('2026-01-01') }],
    'Primary family inheritance vault'
  );

  console.log('Created vault:', vaultData.vault_id);
  console.log('Policy:', vaultData.miniscript_policy);

  // 2. Encrypt vault
  const passphrase = 'correct horse battery staple';
  const encrypted = await encryptVault(vaultData, passphrase);
  console.log('\nEncrypted vault size:', encrypted.ciphertext.length, 'chars');

  // 3. Decrypt vault
  const decrypted = await decryptVault(encrypted, passphrase);
  console.log('Decrypted vault name:', decrypted.name);
  console.log('Match:', decrypted.vault_id === vaultData.vault_id);

  // 4. Export to file
  const fileContent = await exportVaultToFile(encrypted);
  console.log('\nExported file size:', fileContent.length, 'chars');

  // 5. Import from file
  const imported = await importVaultFromFile(fileContent);
  console.log('Imported vault ID:', imported.vault_id);
}

// ============================================
// EXAMPLE 5: Shamir Secret Sharing
// ============================================

async function demonstrateShamir() {
  console.log('\n=== Example 5: Shamir Secret Sharing ===\n');

  // 1. Generate a secret (vault encryption key)
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  console.log('Original secret (first 8 bytes):', Array.from(secret.slice(0, 8)));

  // 2. Split into 3 shares, threshold of 2
  const shares = shamirSplit(secret, { threshold: 2, totalShares: 3 });
  console.log('\nGenerated', shares.length, 'shares');

  // 3. Encode shares for storage
  shares.forEach((share, i) => {
    const encoded = shamirEncode(share);
    console.log(`\nShare ${i + 1}:`);
    console.log('  Hex (first 32 chars):', encoded.hex.slice(0, 32) + '...');
    console.log('  QR Data:', encoded.qrData.slice(0, 50) + '...');
    console.log('  Printable lines:', encoded.printable.length);
  });

  // 4. Recover with 2 shares
  const recoveredShares = [shares[0], shares[2]]; // Skip share[1]
  const recovered = shamirCombine(recoveredShares);
  console.log('\nRecovered secret (first 8 bytes):', Array.from(recovered.slice(0, 8)));
  console.log('Match:', arraysEqual(secret, recovered));
}

// ============================================
// EXAMPLE 6: Nostr Relay Storage
// ============================================

async function demonstrateNostr() {
  console.log('\n=== Example 6: Nostr Relay Storage ===\n');

  // 1. Generate Nostr keys
  const keys = await generateNostrKeys();
  console.log('Public key:', keys.publicKey.slice(0, 20) + '...');

  // 2. Create storage manager
  const storage = new NostrVaultStorage({
    relays: [
      { url: 'wss://relay.damus.io', read: true, write: true },
      { url: 'wss://nos.lol', read: true, write: true }
    ],
    timeout: 5000
  });
  storage.setKeys(keys);

  console.log('Nostr storage configured with 2 relays');

  // Note: Actual connection would require running WebSocket server
  // This is just demonstrating the API
  console.log('\nTo use in production:');
  console.log('  1. await storage.connect()');
  console.log('  2. await storage.storeVault(vaultId, encryptedBlob)');
  console.log('  3. await storage.retrieveVault(vaultId)');

  // 3. Heartbeat manager for dead man's switch
  const heartbeat = new HeartbeatManager(storage, {
    intervalSeconds: 30 * 24 * 60 * 60, // 30 days
    gracePeriodSeconds: 7 * 24 * 60 * 60, // 7 days grace
    vaultIds: ['vault-123', 'vault-456']
  });
  heartbeat.setKeys(keys);

  console.log('\nHeartbeat configured:');
  console.log('  Interval: 30 days');
  console.log('  Grace period: 7 days');
  console.log('  Vaults covered: 2');
}

// ============================================
// EXAMPLE 7: Compatibility Checking
// ============================================

async function demonstrateCompatibility() {
  console.log('\n=== Example 7: Compatibility Checking ===\n');

  // Start with a base configuration
  const config: VaultConfiguration = {
    infrastructure: ['local', 'shamir'],
    primaryLogic: 'timelock',
    additionalGates: [],
    modifiers: []
  };

  // Check if we can add multisig_config (conflicts with shamir)
  const canAddMultisig = canAddOption(config, 'infrastructure', 'multisig_config');
  console.log('Can add multisig_config?', canAddMultisig.canAdd);
  if (!canAddMultisig.canAdd) {
    console.log('  Reason:', canAddMultisig.reason);
  }

  // Check if we can add nostr
  const canAddNostr = canAddOption(config, 'infrastructure', 'nostr');
  console.log('\nCan add nostr?', canAddNostr.canAdd);

  // Check dead_man_switch requirements
  const canAddDMS = canAddOption(config, 'logic', 'dead_man_switch');
  console.log('\nCan use dead_man_switch?', canAddDMS.canAdd);
  if (!canAddDMS.canAdd) {
    console.log('  Reason:', canAddDMS.reason);
  }

  // Now add nostr and try again
  config.infrastructure.push('nostr');
  const canAddDMSNow = canAddOption(config, 'logic', 'dead_man_switch');
  console.log('\nAfter adding nostr, can use dead_man_switch?', canAddDMSNow.canAdd);
}

// ============================================
// UTILITIES
// ============================================

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ============================================
// RUN EXAMPLES
// ============================================

async function runAllExamples() {
  await createSimpleTimelockVault();
  await createResilientSovereignVault();
  await createMultisigDecayVault();
  await demonstrateStorage();
  await demonstrateShamir();
  await demonstrateNostr();
  await demonstrateCompatibility();
}

// Uncomment to run:
// runAllExamples().catch(console.error);

export {
  createSimpleTimelockVault,
  createResilientSovereignVault,
  createMultisigDecayVault,
  demonstrateStorage,
  demonstrateShamir,
  demonstrateNostr,
  demonstrateCompatibility,
  runAllExamples
};
