/**
 * PSBT Builder for SatsLegacy Vaults
 *
 * Creates Partially Signed Bitcoin Transactions (PSBTs) for:
 * - Sweeping vault funds to a new address
 * - Owner spending (anytime)
 * - Heir claiming (after timelock)
 */

import { Buffer } from 'buffer';
import * as bitcoin from 'bitcoinjs-lib';
import type { NetworkType } from '../../types/settings';
import type { Vault } from '../../types/vault';
import {
  fetchAddressUtxos,
  fetchFeeRates,
  fetchRawTransaction,
  fetchBlockHeight,
  type UTXO,
  type FeeRates
} from '../../utils/api/blockchain';

// Network configurations
const networks: Record<NetworkType, bitcoin.Network> = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
  signet: bitcoin.networks.testnet,
};

export interface PSBTResult {
  psbtBase64: string;
  psbtHex: string;
  fee: number;
  feeRate: number;
  inputCount: number;
  outputCount: number;
  totalInput: number;
  totalOutput: number;
  destinationAddress: string;
  error?: string;
}

export interface SweepOptions {
  destinationAddress: string;
  feeRate?: number; // sat/vB, if not provided will use recommended
  feePriority?: 'fastest' | 'halfHour' | 'hour' | 'economy';
  spendPath: 'owner' | 'heir';
  // For heir path, these are required after timelock
  heirPubkey?: string;
  // Witness script from vault creation
  witnessScript?: string;
}

/**
 * Estimate virtual size of a P2WSH spend transaction
 * This is an approximation - actual size depends on witness data
 */
function estimateVsize(inputCount: number, outputCount: number, isTimelockSpend: boolean): number {
  // Base transaction overhead
  const baseSize = 10; // version (4) + locktime (4) + segwit marker/flag (2)

  // Input size (without witness)
  // prevout (36) + scriptSig length (1) + sequence (4) = 41 bytes per input
  const inputSize = 41 * inputCount;

  // Output size for P2WPKH: value (8) + scriptPubKey length (1) + scriptPubKey (22) = 31 bytes
  const outputSize = 31 * outputCount;

  // Witness size estimation for P2WSH timelock script
  // Signature (~72 bytes) + pubkey (33 bytes) + push ops + witness script (~80-100 bytes)
  const witnessPerInput = isTimelockSpend ? 200 : 150;

  // Virtual size = base + inputs + outputs + (witness / 4)
  const weight = (baseSize + inputSize + outputSize) * 4 + (witnessPerInput * inputCount);
  return Math.ceil(weight / 4);
}

/**
 * Build the witness script for a timelock vault
 *
 * Script structure:
 * OP_IF
 *   <owner_pubkey> OP_CHECKSIG
 * OP_ELSE
 *   <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
 *   <heir_pubkey> OP_CHECKSIG
 * OP_ENDIF
 */
export function buildTimelockWitnessScript(
  ownerPubkeyHex: string,
  heirPubkeyHex: string,
  locktime: number
): Buffer {
  const ownerPubkey = Buffer.from(ownerPubkeyHex, 'hex');
  const heirPubkey = Buffer.from(heirPubkeyHex, 'hex');
  const lockBuffer = bitcoin.script.number.encode(locktime);

  return bitcoin.script.compile([
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
}

/**
 * Create a sweep PSBT for a vault
 *
 * This creates an unsigned PSBT that can be signed by a hardware wallet.
 */
export async function createSweepPsbt(
  vault: Vault,
  options: SweepOptions,
  network: NetworkType = 'mainnet'
): Promise<PSBTResult> {
  const btcNetwork = networks[network];

  // Validate inputs
  if (!vault.address) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee: 0,
      feeRate: 0,
      inputCount: 0,
      outputCount: 0,
      totalInput: 0,
      totalOutput: 0,
      destinationAddress: options.destinationAddress,
      error: 'Vault has no address'
    };
  }

  if (!options.destinationAddress) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee: 0,
      feeRate: 0,
      inputCount: 0,
      outputCount: 0,
      totalInput: 0,
      totalOutput: 0,
      destinationAddress: '',
      error: 'Destination address is required'
    };
  }

  // Validate destination address
  try {
    bitcoin.address.toOutputScript(options.destinationAddress, btcNetwork);
  } catch {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee: 0,
      feeRate: 0,
      inputCount: 0,
      outputCount: 0,
      totalInput: 0,
      totalOutput: options.destinationAddress,
      error: 'Invalid destination address for this network'
    };
  }

  // Fetch UTXOs
  const utxos = await fetchAddressUtxos(vault.address, network);
  if (utxos.length === 0) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee: 0,
      feeRate: 0,
      inputCount: 0,
      outputCount: 0,
      totalInput: 0,
      totalOutput: 0,
      destinationAddress: options.destinationAddress,
      error: 'No UTXOs found for vault address'
    };
  }

  // Get fee rate
  let feeRate = options.feeRate;
  if (!feeRate) {
    const feeRates = await fetchFeeRates(network);
    switch (options.feePriority) {
      case 'fastest':
        feeRate = feeRates.fastestFee;
        break;
      case 'halfHour':
        feeRate = feeRates.halfHourFee;
        break;
      case 'hour':
        feeRate = feeRates.hourFee;
        break;
      case 'economy':
      default:
        feeRate = feeRates.economyFee;
        break;
    }
  }

  // Calculate total input value
  const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

  // Estimate transaction size and fee
  const isTimelockSpend = options.spendPath === 'heir';
  const estimatedVsize = estimateVsize(utxos.length, 1, isTimelockSpend);
  const fee = Math.ceil(estimatedVsize * feeRate);

  // Calculate output value
  const totalOutput = totalInput - fee;
  if (totalOutput <= 0) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee,
      feeRate,
      inputCount: utxos.length,
      outputCount: 1,
      totalInput,
      totalOutput: 0,
      destinationAddress: options.destinationAddress,
      error: `Insufficient funds. Input: ${totalInput} sats, Fee: ${fee} sats`
    };
  }

  // Dust threshold check (546 sats for P2WPKH)
  if (totalOutput < 546) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee,
      feeRate,
      inputCount: utxos.length,
      outputCount: 1,
      totalInput,
      totalOutput,
      destinationAddress: options.destinationAddress,
      error: `Output amount (${totalOutput} sats) is below dust threshold`
    };
  }

  // Build witness script - prefer stored witnessScript from vault
  let witnessScript: Buffer | undefined;
  if (options.witnessScript) {
    witnessScript = Buffer.from(options.witnessScript, 'hex');
  } else if (vault.witnessScript) {
    // Use the stored witness script from vault creation
    // Handle both hex string format and comma-separated number format (from IPC serialization)
    if (typeof vault.witnessScript === 'string' && vault.witnessScript.includes(',')) {
      // Comma-separated numbers format: "99,33,3,54,..."
      const bytes = vault.witnessScript.split(',').map(n => parseInt(n.trim(), 10));
      witnessScript = Buffer.from(bytes);
    } else {
      // Hex string format: "632103..."
      witnessScript = Buffer.from(vault.witnessScript, 'hex');
    }
  } else if (vault.ownerPubkey && vault.beneficiaries?.[0]?.pubkey) {
    // Fallback: Reconstruct witness script from vault data
    // IMPORTANT: Use the same locktime formula as VaultContext/bitcoin-address.ts
    // This converts lockDate to a locktime value that matches the original address generation
    const locktime = vault.lockDate
      ? Math.floor(new Date(vault.lockDate).getTime() / 1000 / 600) + 500000
      : 880000 + 52560; // Default ~1 year from typical block height

    witnessScript = buildTimelockWitnessScript(
      vault.ownerPubkey,
      vault.beneficiaries[0].pubkey,
      locktime
    );
  }

  // Create PSBT
  const psbt = new bitcoin.Psbt({ network: btcNetwork });

  // Set locktime for heir spending path (required for CLTV)
  if (isTimelockSpend && vault.lockDate) {
    const lockDate = new Date(vault.lockDate);
    const now = new Date();
    const daysUntilLock = Math.ceil((lockDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const currentHeight = await fetchBlockHeight(network) || 880000;
    const locktime = currentHeight + Math.max(0, daysUntilLock * 144);
    psbt.setLocktime(locktime);
  }

  // Add inputs
  for (const utxo of utxos) {
    // Fetch the raw transaction to get the full output script
    const rawTxHex = await fetchRawTransaction(utxo.txid, network);

    const inputData: bitcoin.PsbtTxInput & { witnessUtxo?: { script: Uint8Array; value: bigint }; witnessScript?: Buffer } = {
      hash: utxo.txid,
      index: utxo.vout,
      sequence: isTimelockSpend ? 0xfffffffe : 0xffffffff, // Enable locktime for heir path
    };

    if (rawTxHex) {
      // Parse the raw transaction to get the output script
      const tx = bitcoin.Transaction.fromHex(rawTxHex);
      const output = tx.outs[utxo.vout];

      // Ensure script is a proper Uint8Array (bitcoinjs-lib v7 uses Uint8Array, not Buffer)
      let scriptBytes: Uint8Array;
      if (output.script instanceof Uint8Array) {
        scriptBytes = output.script;
      } else if (Buffer.isBuffer(output.script)) {
        scriptBytes = new Uint8Array(output.script);
      } else if (output.script && typeof output.script === 'object' && 'data' in output.script) {
        // Handle serialized Buffer object {type: "Buffer", data: [...]}
        scriptBytes = new Uint8Array((output.script as { data: number[] }).data);
      } else {
        // Handle plain object with numeric keys
        scriptBytes = new Uint8Array(Object.values(output.script) as number[]);
      }

      inputData.witnessUtxo = {
        script: scriptBytes,
        value: BigInt(utxo.value),
      };
    } else {
      // Fallback: construct P2WSH output script from witness script
      if (witnessScript) {
        const p2wsh = bitcoin.payments.p2wsh({
          redeem: { output: witnessScript },
          network: btcNetwork,
        });
        inputData.witnessUtxo = {
          script: p2wsh.output!,
          value: BigInt(utxo.value),
        };
      }
    }

    // Add witness script for P2WSH spending
    if (witnessScript) {
      inputData.witnessScript = witnessScript;
    }

    psbt.addInput(inputData);
  }

  // Add output
  psbt.addOutput({
    address: options.destinationAddress,
    value: BigInt(totalOutput),
  });

  // Return the unsigned PSBT
  return {
    psbtBase64: psbt.toBase64(),
    psbtHex: psbt.toHex(),
    fee,
    feeRate,
    inputCount: utxos.length,
    outputCount: 1,
    totalInput,
    totalOutput,
    destinationAddress: options.destinationAddress,
  };
}

/**
 * Validate a PSBT string (base64 or hex)
 */
export function validatePsbt(psbtString: string, network: NetworkType = 'mainnet'): {
  valid: boolean;
  error?: string;
  inputCount?: number;
  outputCount?: number;
} {
  const btcNetwork = networks[network];

  try {
    let psbt: bitcoin.Psbt;

    // Try base64 first, then hex
    try {
      psbt = bitcoin.Psbt.fromBase64(psbtString, { network: btcNetwork });
    } catch {
      psbt = bitcoin.Psbt.fromHex(psbtString, { network: btcNetwork });
    }

    return {
      valid: true,
      inputCount: psbt.inputCount,
      outputCount: psbt.txOutputs.length,
    };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid PSBT',
    };
  }
}

/**
 * Combine multiple PSBTs (for multisig scenarios)
 */
export function combinePsbts(
  psbts: string[],
  network: NetworkType = 'mainnet'
): { combined?: string; error?: string } {
  const btcNetwork = networks[network];

  try {
    const parsedPsbts = psbts.map(p => {
      try {
        return bitcoin.Psbt.fromBase64(p, { network: btcNetwork });
      } catch {
        return bitcoin.Psbt.fromHex(p, { network: btcNetwork });
      }
    });

    if (parsedPsbts.length === 0) {
      return { error: 'No PSBTs provided' };
    }

    const combined = parsedPsbts[0];
    for (let i = 1; i < parsedPsbts.length; i++) {
      combined.combine(parsedPsbts[i]);
    }

    return { combined: combined.toBase64() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to combine PSBTs' };
  }
}

/**
 * Finalize a fully signed PSBT and extract the transaction
 */
export function finalizePsbt(
  psbtString: string,
  network: NetworkType = 'mainnet'
): { txHex?: string; txId?: string; error?: string } {
  const btcNetwork = networks[network];

  try {
    let psbt: bitcoin.Psbt;
    try {
      psbt = bitcoin.Psbt.fromBase64(psbtString, { network: btcNetwork });
    } catch {
      psbt = bitcoin.Psbt.fromHex(psbtString, { network: btcNetwork });
    }

    // Finalize all inputs
    psbt.finalizeAllInputs();

    // Extract the transaction
    const tx = psbt.extractTransaction();

    return {
      txHex: tx.toHex(),
      txId: tx.getId(),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to finalize PSBT' };
  }
}

/**
 * Build the witness script for a Dead Man's Switch vault (CSV)
 *
 * Script structure:
 * OP_IF
 *   <owner_pubkey> OP_CHECKSIG
 * OP_ELSE
 *   <sequence> OP_CHECKSEQUENCEVERIFY OP_DROP
 *   <heir_pubkey> OP_CHECKSIG
 * OP_ENDIF
 */
export function buildDeadManSwitchWitnessScript(
  ownerPubkeyHex: string,
  heirPubkeyHex: string,
  sequence: number
): Buffer {
  const ownerPubkey = Buffer.from(ownerPubkeyHex, 'hex');
  const heirPubkey = Buffer.from(heirPubkeyHex, 'hex');
  const sequenceBuffer = bitcoin.script.number.encode(sequence);

  return bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    ownerPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    sequenceBuffer,
    bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
    bitcoin.opcodes.OP_DROP,
    heirPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ENDIF,
  ]);
}

export interface RefreshPSBTResult extends PSBTResult {
  newAddress: string;        // The new vault address (funds sent here)
  refreshType: 'same' | 'new'; // Whether using same or new vault address
}

export interface RefreshOptions {
  feeRate?: number;
  feePriority?: 'fastest' | 'halfHour' | 'hour' | 'economy';
  // Option to send to a NEW vault address (recommended for privacy)
  // If not provided, sends back to the same address
  newVaultAddress?: string;
  newWitnessScript?: string;
}

/**
 * Create a "check-in" / refresh PSBT for a Dead Man's Switch vault
 *
 * This spends the vault funds back to either:
 * 1. The same vault address (simple refresh)
 * 2. A new vault address with the same script (better privacy)
 *
 * This resets the CSV (relative timelock) timer because:
 * - CSV measures time since the UTXO was created
 * - Spending creates a new UTXO, resetting the timer
 *
 * Owner signs this transaction to prove they're still active.
 */
export async function createRefreshPsbt(
  vault: Vault,
  options: RefreshOptions,
  network: NetworkType = 'mainnet'
): Promise<RefreshPSBTResult> {
  const btcNetwork = networks[network];

  // Determine destination (same address or new)
  const destinationAddress = options.newVaultAddress || vault.address;
  const refreshType = options.newVaultAddress ? 'new' : 'same';

  if (!vault.address) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee: 0,
      feeRate: 0,
      inputCount: 0,
      outputCount: 0,
      totalInput: 0,
      totalOutput: 0,
      destinationAddress: destinationAddress || '',
      newAddress: destinationAddress || '',
      refreshType,
      error: 'Vault has no address'
    };
  }

  if (!destinationAddress) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee: 0,
      feeRate: 0,
      inputCount: 0,
      outputCount: 0,
      totalInput: 0,
      totalOutput: 0,
      destinationAddress: '',
      newAddress: '',
      refreshType,
      error: 'No destination address'
    };
  }

  // Fetch UTXOs
  const utxos = await fetchAddressUtxos(vault.address, network);
  if (utxos.length === 0) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee: 0,
      feeRate: 0,
      inputCount: 0,
      outputCount: 0,
      totalInput: 0,
      totalOutput: 0,
      destinationAddress,
      newAddress: destinationAddress,
      refreshType,
      error: 'No UTXOs found - vault may be empty'
    };
  }

  // Get fee rate
  let feeRate = options.feeRate;
  if (!feeRate) {
    const feeRates = await fetchFeeRates(network);
    switch (options.feePriority) {
      case 'fastest':
        feeRate = feeRates.fastestFee;
        break;
      case 'halfHour':
        feeRate = feeRates.halfHourFee;
        break;
      case 'hour':
        feeRate = feeRates.hourFee;
        break;
      case 'economy':
      default:
        feeRate = feeRates.economyFee;
        break;
    }
  }

  // Calculate totals
  const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
  const estimatedVsize = estimateVsize(utxos.length, 1, false); // Owner spend, not heir
  const fee = Math.ceil(estimatedVsize * feeRate);
  const totalOutput = totalInput - fee;

  if (totalOutput <= 546) {
    return {
      psbtBase64: '',
      psbtHex: '',
      fee,
      feeRate,
      inputCount: utxos.length,
      outputCount: 1,
      totalInput,
      totalOutput,
      destinationAddress,
      newAddress: destinationAddress,
      refreshType,
      error: `Output too small after fees. Input: ${totalInput} sats, Fee: ${fee} sats`
    };
  }

  // Build witness script
  let witnessScript: Buffer | undefined;
  if (options.newWitnessScript) {
    witnessScript = Buffer.from(options.newWitnessScript, 'hex');
  } else if (vault.witnessScript) {
    // Handle both hex string format and comma-separated number format (from IPC serialization)
    if (typeof vault.witnessScript === 'string' && vault.witnessScript.includes(',')) {
      const bytes = vault.witnessScript.split(',').map(n => parseInt(n.trim(), 10));
      witnessScript = Buffer.from(bytes);
    } else {
      witnessScript = Buffer.from(vault.witnessScript, 'hex');
    }
  } else if (vault.ownerPubkey && vault.beneficiaries?.[0]?.pubkey && vault.sequence) {
    // Build CSV witness script from vault data
    witnessScript = buildDeadManSwitchWitnessScript(
      vault.ownerPubkey,
      vault.beneficiaries[0].pubkey,
      vault.sequence
    );
  }

  // Create PSBT
  const psbt = new bitcoin.Psbt({ network: btcNetwork });

  // Add inputs - owner can spend anytime, so sequence = 0xFFFFFFFF
  for (const utxo of utxos) {
    const rawTxHex = await fetchRawTransaction(utxo.txid, network);

    const inputData: bitcoin.PsbtTxInput & { witnessUtxo?: { script: Uint8Array; value: bigint }; witnessScript?: Buffer } = {
      hash: utxo.txid,
      index: utxo.vout,
      sequence: 0xFFFFFFFF, // Owner path - no sequence restriction
    };

    if (rawTxHex) {
      const tx = bitcoin.Transaction.fromHex(rawTxHex);
      const output = tx.outs[utxo.vout];
      // Ensure script is a proper Uint8Array (bitcoinjs-lib v7 uses Uint8Array, not Buffer)
      let scriptBytes: Uint8Array;
      if (output.script instanceof Uint8Array) {
        scriptBytes = output.script;
      } else if (Buffer.isBuffer(output.script)) {
        scriptBytes = new Uint8Array(output.script);
      } else if (output.script && typeof output.script === 'object' && 'data' in output.script) {
        // Handle serialized Buffer object {type: "Buffer", data: [...]}
        scriptBytes = new Uint8Array((output.script as { data: number[] }).data);
      } else {
        // Handle plain object with numeric keys
        scriptBytes = new Uint8Array(Object.values(output.script) as number[]);
      }
      inputData.witnessUtxo = {
        script: scriptBytes,
        value: BigInt(utxo.value),
      };
    } else if (witnessScript) {
      const p2wsh = bitcoin.payments.p2wsh({
        redeem: { output: witnessScript },
        network: btcNetwork,
      });
      inputData.witnessUtxo = {
        script: p2wsh.output!,
        value: BigInt(utxo.value),
      };
    }

    if (witnessScript) {
      inputData.witnessScript = witnessScript;
    }

    psbt.addInput(inputData);
  }

  // Add output - send back to vault (same or new address)
  psbt.addOutput({
    address: destinationAddress,
    value: BigInt(totalOutput),
  });

  return {
    psbtBase64: psbt.toBase64(),
    psbtHex: psbt.toHex(),
    fee,
    feeRate,
    inputCount: utxos.length,
    outputCount: 1,
    totalInput,
    totalOutput,
    destinationAddress,
    newAddress: destinationAddress,
    refreshType,
  };
}

/**
 * Estimate the cost of a check-in refresh transaction
 * Useful for displaying to users before they commit
 */
export async function estimateRefreshCost(
  vault: Vault,
  network: NetworkType = 'mainnet'
): Promise<{ estimatedFee: number; feeRate: number; inputCount: number; error?: string }> {
  if (!vault.address) {
    return { estimatedFee: 0, feeRate: 0, inputCount: 0, error: 'Vault has no address' };
  }

  const utxos = await fetchAddressUtxos(vault.address, network);
  if (utxos.length === 0) {
    return { estimatedFee: 0, feeRate: 0, inputCount: 0, error: 'No UTXOs found' };
  }

  const feeRates = await fetchFeeRates(network);
  const feeRate = feeRates.hourFee; // Use 1-hour priority as default estimate
  const estimatedVsize = estimateVsize(utxos.length, 1, false);
  const estimatedFee = Math.ceil(estimatedVsize * feeRate);

  return {
    estimatedFee,
    feeRate,
    inputCount: utxos.length,
  };
}

export default {
  createSweepPsbt,
  createRefreshPsbt,
  estimateRefreshCost,
  validatePsbt,
  combinePsbts,
  finalizePsbt,
  buildTimelockWitnessScript,
  buildDeadManSwitchWitnessScript,
};
