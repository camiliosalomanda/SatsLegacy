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
import { dateToBlockHeight, estimateCurrentBlockHeight } from './bitcoin-address';

/**
 * Parse a witness script string into a Buffer.
 * Handles both hex string format ("632103...") and comma-separated byte format ("99,33,3,54,...").
 */
function parseWitnessScript(witnessScriptStr: string): Buffer {
  if (typeof witnessScriptStr === 'string' && witnessScriptStr.includes(',')) {
    // Comma-separated numbers format: "99,33,3,54,..."
    const bytes = witnessScriptStr.split(',').map(n => {
      const val = parseInt(n.trim(), 10);
      if (isNaN(val) || val < 0 || val > 255) {
        throw new Error(`Invalid byte value in witnessScript: "${n.trim()}". Expected 0-255.`);
      }
      return val;
    });
    return Buffer.from(bytes);
  }
  // Hex string format: "632103..."
  return Buffer.from(witnessScriptStr, 'hex');
}

// Network configurations
// Note: Signet uses testnet address format (tb1...) and network parameters,
// so bitcoin.networks.testnet is correct for address encoding/decoding.
// Signet differs from testnet in genesis block and consensus rules, but
// bitcoinjs-lib only uses the network object for address prefix/version bytes.
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
 *
 * @param scriptType - Optional: 'multisig_decay' uses larger witness estimate (~300-350 bytes)
 *                     since it includes OP_0 dummy + multiple signatures + branch flag + larger script
 */
function estimateVsize(
  inputCount: number,
  outputCount: number,
  isTimelockSpend: boolean,
  scriptType?: 'multisig_decay'
): number {
  // Base transaction overhead
  const baseSize = 10; // version (4) + locktime (4) + segwit marker/flag (2)

  // Input size (without witness)
  // prevout (36) + scriptSig length (1) + sequence (4) = 41 bytes per input
  const inputSize = 41 * inputCount;

  // Output size for P2WPKH: value (8) + scriptPubKey length (1) + scriptPubKey (22) = 31 bytes
  const outputSize = 31 * outputCount;

  // Witness size estimation depends on script type:
  // - multisig_decay: OP_0 + 2 sigs (~144) + branch flag + witness script (~150) ≈ 300-350 bytes
  // - single-sig timelock/DMS: sig (~72) + branch flag + witness script (~80-100) ≈ 200 bytes
  // - single-sig owner: sig (~72) + branch flag + witness script (~80) ≈ 150 bytes
  let witnessPerInput: number;
  if (scriptType === 'multisig_decay') {
    witnessPerInput = 325;
  } else if (isTimelockSpend) {
    witnessPerInput = 200;
  } else {
    witnessPerInput = 150;
  }

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
      totalOutput: 0,
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
  const isMultisigDecay = vault.logic?.primary === 'multisig_decay';
  const estimatedVsize = estimateVsize(utxos.length, 1, isTimelockSpend, isMultisigDecay ? 'multisig_decay' : undefined);
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

  // Determine if this is a Dead Man's Switch (CSV) vault vs a timelock (CLTV) vault
  const isDeadManSwitch = vault.logic?.primary === 'dead_man_switch';

  // Build witness script - prefer stored witnessScript from vault
  let witnessScript: Buffer | undefined;
  if (options.witnessScript) {
    witnessScript = Buffer.from(options.witnessScript, 'hex');
  } else if (vault.witnessScript) {
    // Use the stored witness script from vault creation
    witnessScript = parseWitnessScript(vault.witnessScript);
  } else if (vault.ownerPubkey && vault.beneficiaries?.[0]?.pubkey) {
    // Fallback: Reconstruct witness script from vault data based on vault type
    if (isDeadManSwitch && vault.sequence) {
      // Dead Man's Switch (CSV) - use sequence value from vault creation
      witnessScript = buildDeadManSwitchWitnessScript(
        vault.ownerPubkey,
        vault.beneficiaries[0].pubkey,
        vault.sequence
      );
    } else {
      // Timelock (CLTV) - use lockDate to compute block height
      // IMPORTANT: Use the same locktime formula as VaultContext/bitcoin-address.ts
      const locktime = vault.lockDate
        ? dateToBlockHeight(vault.lockDate)
        : estimateCurrentBlockHeight() + 52560; // Default ~1 year from now
      witnessScript = buildTimelockWitnessScript(
        vault.ownerPubkey,
        vault.beneficiaries[0].pubkey,
        locktime
      );
    }
  }

  // Create PSBT
  const psbt = new bitcoin.Psbt({ network: btcNetwork });

  // Set locktime/sequence for heir spending path
  // The requirements differ based on vault type:
  // - Timelock (CLTV): nLockTime must match the script's locktime, nSequence < 0xFFFFFFFF
  // - Dead Man's Switch (CSV): nSequence must match the script's sequence value, nLockTime = 0
  if (isTimelockSpend) {
    if (isDeadManSwitch) {
      // CSV heir claim: nLockTime must be 0 (or at least not trigger CLTV),
      // nSequence is set per-input below to the vault's CSV sequence value
      psbt.setLocktime(0);
    } else if (vault.lockDate) {
      // CLTV heir claim: nLockTime MUST match the locktime embedded in the witness
      // script's OP_CHECKLOCKTIMEVERIFY, computed via dateToBlockHeight()
      psbt.setLocktime(dateToBlockHeight(vault.lockDate));
    }
  }

  // Add inputs
  for (const utxo of utxos) {
    // Fetch the raw transaction to get the full output script
    const rawTxHex = await fetchRawTransaction(utxo.txid, network);

    // Determine the correct nSequence value for this input:
    // - Owner path: 0xFFFFFFFF (no restrictions)
    // - Heir CLTV path: 0xFFFFFFFE (enable nLockTime, disable RBF)
    // - Heir CSV path: vault.sequence (the CSV value that satisfies OP_CHECKSEQUENCEVERIFY)
    let inputSequence = 0xffffffff;
    if (isTimelockSpend) {
      if (isDeadManSwitch && vault.sequence) {
        inputSequence = vault.sequence;
      } else {
        inputSequence = 0xfffffffe;
      }
    }

    const inputData: bitcoin.PsbtTxInput & { witnessUtxo?: { script: Uint8Array; value: bigint }; witnessScript?: Buffer } = {
      hash: utxo.txid,
      index: utxo.vout,
      sequence: inputSequence,
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
        value: BigInt(Math.round(utxo.value)),
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
          value: BigInt(Math.round(utxo.value)),
        };
      }
    }

    // Add witness script for P2WSH spending
    if (witnessScript) {
      inputData.witnessScript = witnessScript;
    }

    // TODO: Add bip32Derivation for hardware wallet compatibility.
    // This requires storing the original xpub and derivation path in the Vault type,
    // not just the derived hex pubkey. When available, add:
    //   inputData.bip32Derivation = [{
    //     masterFingerprint: getXpubFingerprint(xpub),
    //     pubkey: Buffer.from(pubkeyHex, 'hex'),
    //     path: "m/84'/0'/0'/0/0"
    //   }];

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
 * Detect whether a witness script uses CHECKMULTISIG or CHECKSIG.
 * Decompiles the script and looks for the relevant opcodes.
 */
function detectScriptType(witnessScript: Buffer): 'multisig' | 'checksig' {
  try {
    const decompiled = bitcoin.script.decompile(witnessScript);
    if (decompiled) {
      for (const op of decompiled) {
        if (op === bitcoin.opcodes.OP_CHECKMULTISIG || op === bitcoin.opcodes.OP_CHECKMULTISIGVERIFY) {
          return 'multisig';
        }
      }
    }
  } catch {
    // Fall through to default
  }
  return 'checksig';
}

/**
 * Serialize a witness stack into the finalScriptWitness format expected by bitcoinjs-lib.
 */
function serializeWitnessStack(witnessStack: Buffer[]): Buffer {
  const parts: Buffer[] = [];
  parts.push(Buffer.from([witnessStack.length]));
  for (const item of witnessStack) {
    const buf = Buffer.isBuffer(item) ? item : Buffer.from(item);
    if (buf.length < 0xfd) {
      parts.push(Buffer.from([buf.length]));
    } else if (buf.length <= 0xffff) {
      parts.push(Buffer.from([0xfd, buf.length & 0xff, (buf.length >> 8) & 0xff]));
    }
    parts.push(buf);
  }
  return Buffer.concat(parts);
}

/**
 * Finalize a fully signed PSBT and extract the transaction.
 *
 * Uses a custom finalizer for P2WSH vault scripts.
 *
 * For CHECKSIG scripts (timelock / dead man's switch):
 * - Owner path (OP_IF):  [signature, 0x01 (TRUE), witnessScript]
 * - Heir path (OP_ELSE): [signature, 0x00 (FALSE/empty), witnessScript]
 *
 * For CHECKMULTISIG scripts (multisig decay):
 * - Before decay (OP_IF):  [OP_0, sig1, sig2, ..., 0x01 (TRUE), witnessScript]
 * - After decay (OP_ELSE): [OP_0, sig1, ..., 0x00 (FALSE/empty), witnessScript]
 *
 * @param spendPath - Which branch of the script is being used
 */
export function finalizePsbt(
  psbtString: string,
  network: NetworkType = 'mainnet',
  spendPath: 'owner' | 'heir' | 'multisig_before_decay' | 'multisig_after_decay' = 'owner'
): { txHex?: string; txId?: string; error?: string } {
  const btcNetwork = networks[network];

  try {
    let psbt: bitcoin.Psbt;
    try {
      psbt = bitcoin.Psbt.fromBase64(psbtString, { network: btcNetwork });
    } catch {
      psbt = bitcoin.Psbt.fromHex(psbtString, { network: btcNetwork });
    }

    // Custom finalizer for P2WSH vault scripts
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.finalizeInput(i, (_inputIndex: number, input: any) => {
        if (!input.partialSig || input.partialSig.length === 0) {
          throw new Error(`Input ${i} has no signatures`);
        }
        const witnessScript = input.witnessScript;
        if (!witnessScript) {
          throw new Error(`Input ${i} has no witness script`);
        }

        const scriptType = detectScriptType(Buffer.from(witnessScript));
        let witnessStack: Buffer[];

        if (scriptType === 'multisig') {
          // CHECKMULTISIG witness: [OP_0, sig1, sig2, ..., branchFlag, witnessScript]
          // OP_0 is the dummy element required by CHECKMULTISIG bug
          const sigs = input.partialSig.map((ps: any) => ps.signature);
          const branchFlag = (spendPath === 'owner' || spendPath === 'multisig_before_decay')
            ? Buffer.from([0x01])  // TRUE = OP_IF branch (before decay)
            : Buffer.alloc(0);     // empty = OP_ELSE branch (after decay)

          witnessStack = [
            Buffer.alloc(0), // OP_0 dummy for CHECKMULTISIG
            ...sigs,
            branchFlag,
            Buffer.from(witnessScript),
          ];
        } else {
          // CHECKSIG witness: [sig, branchFlag, witnessScript]
          const sig = input.partialSig[0].signature;
          const branchFlag = (spendPath === 'owner')
            ? Buffer.from([0x01])  // TRUE = OP_IF branch
            : Buffer.alloc(0);     // empty = OP_ELSE branch

          witnessStack = [sig, branchFlag, Buffer.from(witnessScript)];
        }

        return { finalScriptWitness: serializeWitnessStack(witnessStack) };
      });
    }

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
  newWitnessScript?: string; // Hex witness script for the new address (needed for future spends)
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
  const isMultisigDecayRefresh = vault.logic?.primary === 'multisig_decay';
  const estimatedVsize = estimateVsize(utxos.length, 1, false, isMultisigDecayRefresh ? 'multisig_decay' : undefined); // Owner spend, not heir
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

  // Build witness script for SPENDING the current vault's UTXOs.
  // IMPORTANT: This must be the CURRENT vault's witness script, not the new address's.
  // options.newWitnessScript is for the OUTPUT address (stored for future spends).
  let witnessScript: Buffer | undefined;
  if (vault.witnessScript) {
    witnessScript = parseWitnessScript(vault.witnessScript);
  } else if (vault.ownerPubkey && vault.beneficiaries?.[0]?.pubkey) {
    // Fallback: Reconstruct from vault data based on vault type
    if (vault.logic?.primary === 'dead_man_switch' && vault.sequence) {
      witnessScript = buildDeadManSwitchWitnessScript(
        vault.ownerPubkey,
        vault.beneficiaries[0].pubkey,
        vault.sequence
      );
    } else if (vault.lockDate) {
      witnessScript = buildTimelockWitnessScript(
        vault.ownerPubkey,
        vault.beneficiaries[0].pubkey,
        dateToBlockHeight(vault.lockDate)
      );
    }
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
        value: BigInt(Math.round(utxo.value)),
      };
    } else if (witnessScript) {
      const p2wsh = bitcoin.payments.p2wsh({
        redeem: { output: witnessScript },
        network: btcNetwork,
      });
      inputData.witnessUtxo = {
        script: p2wsh.output!,
        value: BigInt(Math.round(utxo.value)),
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
    // Return the new address's witness script so callers can store it for future spends.
    // If refreshing to the same address, the witness script is unchanged.
    // If refreshing to a new address, the caller MUST store this to spend from the new address.
    newWitnessScript: options.newWitnessScript || (vault.witnessScript && !vault.witnessScript.includes(',')
      ? vault.witnessScript
      : witnessScript?.toString('hex')),
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
