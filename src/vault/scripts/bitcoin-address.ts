/**
 * SatsLegacy Bitcoin Address Utilities
 * 
 * Generates vault addresses from configuration.
 * Uses bitcoinjs-lib for address derivation.
 */

import * as bitcoin from 'bitcoinjs-lib';

// Network configurations
const networks = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
  signet: bitcoin.networks.testnet, // Signet uses testnet address format
};

/**
 * Generate a simple P2WPKH (native segwit) address from a public key
 */
export function generateP2WPKHAddress(
  publicKeyHex: string,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): string {
  const pubkeyBuffer = Buffer.from(publicKeyHex, 'hex');
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: pubkeyBuffer,
    network: networks[network],
  });
  
  if (!address) {
    throw new Error('Failed to generate P2WPKH address');
  }
  
  return address;
}

/**
 * Generate a P2WSH (native segwit script hash) address from a witness script
 */
export function generateP2WSHAddress(
  witnessScriptHex: string,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): string {
  const scriptBuffer = Buffer.from(witnessScriptHex, 'hex');
  const { address } = bitcoin.payments.p2wsh({
    redeem: { output: scriptBuffer },
    network: networks[network],
  });
  
  if (!address) {
    throw new Error('Failed to generate P2WSH address');
  }
  
  return address;
}

/**
 * Generate a simple 2-of-2 multisig address (owner + heir)
 * This is a simplified version for basic inheritance vaults
 */
export function generateMultisigAddress(
  publicKeys: string[],
  threshold: number,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; redeemScript: string } {
  const pubkeyBuffers = publicKeys.map(pk => Buffer.from(pk, 'hex'));
  
  const p2ms = bitcoin.payments.p2ms({
    m: threshold,
    pubkeys: pubkeyBuffers,
    network: networks[network],
  });
  
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: p2ms,
    network: networks[network],
  });
  
  if (!p2wsh.address || !p2ms.output) {
    throw new Error('Failed to generate multisig address');
  }
  
  return {
    address: p2wsh.address,
    redeemScript: p2ms.output.toString('hex'),
  };
}

/**
 * Generate a timelocked inheritance address
 * 
 * Script: OP_IF <owner_pubkey> OP_CHECKSIG OP_ELSE <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <heir_pubkey> OP_CHECKSIG OP_ENDIF
 * 
 * Owner can spend anytime, heir can spend after locktime
 */
export function generateTimelockAddress(
  ownerPubkeyHex: string,
  heirPubkeyHex: string,
  locktime: number, // Block height
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; witnessScript: string; redeemInfo: object } {
  const ownerPubkey = Buffer.from(ownerPubkeyHex, 'hex');
  const heirPubkey = Buffer.from(heirPubkeyHex, 'hex');
  
  // Build the script manually
  // OP_IF
  //   <owner_pubkey> OP_CHECKSIG
  // OP_ELSE
  //   <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  //   <heir_pubkey> OP_CHECKSIG
  // OP_ENDIF
  
  const lockBuffer = bitcoin.script.number.encode(locktime);
  
  const witnessScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    ownerPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    lockBuffer,
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    bitcoin.opcodes.OP_DROP,
    heirPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ENDIF,
  ]);
  
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: witnessScript },
    network: networks[network],
  });
  
  if (!p2wsh.address) {
    throw new Error('Failed to generate timelock address');
  }
  
  return {
    address: p2wsh.address,
    witnessScript: witnessScript.toString('hex'),
    redeemInfo: {
      ownerPubkey: ownerPubkeyHex,
      heirPubkey: heirPubkeyHex,
      locktime,
      spendPaths: [
        {
          name: 'Owner',
          description: 'Owner can spend anytime',
          witness: '<signature> <owner_pubkey> OP_TRUE',
        },
        {
          name: 'Heir',
          description: `Heir can spend after block ${locktime}`,
          witness: '<signature> <heir_pubkey> OP_FALSE',
        },
      ],
    },
  };
}

/**
 * Generate address for a vault based on its configuration
 */
export function generateVaultAddress(
  vaultConfig: {
    logic: { primary: string };
    ownerPubkey?: string;
    heirPubkeys?: string[];
    locktime?: number;
  },
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; script?: string; redeemInfo?: object } {
  const { logic, ownerPubkey, heirPubkeys, locktime } = vaultConfig;
  
  // If no keys provided, generate a placeholder address
  if (!ownerPubkey || !heirPubkeys || heirPubkeys.length === 0) {
    // Return empty - address will be generated when keys are added
    return { address: '' };
  }
  
  switch (logic.primary) {
    case 'timelock':
    case 'dead_man_switch': {
      const result = generateTimelockAddress(
        ownerPubkey,
        heirPubkeys[0],
        locktime || 880000 + 52560, // Default ~1 year from now
        network
      );
      return {
        address: result.address,
        script: result.witnessScript,
        redeemInfo: result.redeemInfo,
      };
    }
    
    case 'multisig_decay': {
      // For multisig, use 2-of-3 with owner + heirs
      const allKeys = [ownerPubkey, ...heirPubkeys.slice(0, 2)];
      const result = generateMultisigAddress(allKeys, 2, network);
      return {
        address: result.address,
        script: result.redeemScript,
      };
    }
    
    default: {
      // Default to simple timelock
      if (heirPubkeys.length > 0) {
        const result = generateTimelockAddress(
          ownerPubkey,
          heirPubkeys[0],
          locktime || 880000 + 52560,
          network
        );
        return {
          address: result.address,
          script: result.witnessScript,
          redeemInfo: result.redeemInfo,
        };
      }
      return { address: '' };
    }
  }
}

/**
 * Validate a Bitcoin address
 */
export function validateAddress(
  address: string,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): boolean {
  try {
    bitcoin.address.toOutputScript(address, networks[network]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get address type from address string
 */
export function getAddressType(address: string): string {
  if (address.startsWith('bc1q') && address.length === 42) {
    return 'P2WPKH (Native SegWit)';
  } else if (address.startsWith('bc1q') && address.length === 62) {
    return 'P2WSH (Native SegWit Script)';
  } else if (address.startsWith('bc1p')) {
    return 'P2TR (Taproot)';
  } else if (address.startsWith('3')) {
    return 'P2SH (Script Hash)';
  } else if (address.startsWith('1')) {
    return 'P2PKH (Legacy)';
  } else if (address.startsWith('tb1') || address.startsWith('2') || address.startsWith('m') || address.startsWith('n')) {
    return 'Testnet Address';
  }
  return 'Unknown';
}

export default {
  generateP2WPKHAddress,
  generateP2WSHAddress,
  generateMultisigAddress,
  generateTimelockAddress,
  generateVaultAddress,
  validateAddress,
  getAddressType,
};
