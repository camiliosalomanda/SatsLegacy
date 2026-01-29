// Re-export all utilities
export { fetchBTCPrice } from './api/bitcoin-price';
export { fetchAddressBalance } from './api/blockchain';
export { copyToClipboard } from './clipboard';
export { getDaysUntilUnlock, getTotalBTC, getTotalBeneficiaries, calculateVaultProgress } from './vault-helpers';
export { legalDocTemplates, generateSingleDoc, generateLegalDocuments } from './legal-templates';
