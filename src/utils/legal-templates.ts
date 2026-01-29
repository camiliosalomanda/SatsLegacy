// Legal document templates and generation utilities

export const legalDocTemplates: Record<string, (state: string) => string> = {
  'Bitcoin-Specific Will Addendum': (state) => `BITCOIN ASSET ADDENDUM TO LAST WILL AND TESTAMENT

State of ${state}

I, _________________________ (the "Testator"), being of sound mind, hereby declare this Addendum to my Last Will and Testament regarding my Bitcoin and cryptocurrency holdings.

ARTICLE I - DIGITAL ASSET DECLARATION
I own Bitcoin stored in self-custody using the SatsLegacy inheritance system. These assets are secured using cryptographic time-locks and are NOT held by any third party.

ARTICLE II - INHERITANCE MECHANISM
My Bitcoin inheritance is managed through SatsLegacy vaults with the following characteristics:
- Time-locked scripts that automatically enable heir access after specified dates
- No custodian or third party holds my private keys
- My heirs have received "Heir Kits" containing necessary recovery information

ARTICLE III - HEIR INSTRUCTIONS
My designated heirs should:
1. Locate their personal Heir Kit (provided separately)
2. Wait until the timelock date specified in their kit
3. Follow the recovery instructions using Sparrow Wallet
4. Contact _________________________ if technical assistance is needed

ARTICLE IV - GOVERNING LAW
This Addendum shall be governed by the laws of the State of ${state}.

Executed this _____ day of ____________, 20___.

_________________________________
Testator Signature

_________________________________
Witness 1 Signature

_________________________________
Witness 2 Signature`,

  'Letter of Instruction': (state) => `LETTER OF INSTRUCTION FOR BITCOIN INHERITANCE

To My Heirs and Executor,

This letter provides detailed instructions for accessing Bitcoin held in my SatsLegacy inheritance vault(s).

WHAT YOU NEED
1. Your personal Heir Kit (envelope/USB provided to you)
2. A computer with Sparrow Wallet installed
3. Your hardware wallet (if one was provided)

STEP-BY-STEP INSTRUCTIONS
1. Verify the timelock has expired (check the date in your Heir Kit)
2. Download Sparrow Wallet from sparrowwallet.com
3. Import the vault file from your Heir Kit
4. Connect your hardware wallet if required
5. Create a transaction to your personal wallet
6. Sign and broadcast the transaction

SECURITY REMINDERS
- Never share your seed phrase or hardware wallet PIN
- Verify all addresses on your hardware wallet screen
- Take your time - the Bitcoin will wait for you

With love,
_________________________

Date: _____________`,

  'Memorandum of Understanding': (state) => `MEMORANDUM OF UNDERSTANDING - BITCOIN INHERITANCE

State of ${state}

PARTIES
Vault Owner: _________________________
Heir 1: _________________________ (___% allocation)
Heir 2: _________________________ (___% allocation)

AGREEMENT
1. The vault uses a timelock mechanism that becomes spendable on: _____________
2. Each heir agrees to their stated percentage allocation.
3. All parties agree to cooperate in the technical process of claiming funds.

SIGNATURES
Vault Owner: _________________________ Date: _________
Heir 1: _________________________ Date: _________
Heir 2: _________________________ Date: _________`,

  'Digital Asset Declaration': (state) => `DECLARATION OF DIGITAL ASSET HOLDINGS

State of ${state}

I, _________________________, declare under penalty of perjury:

1. I own Bitcoin stored in self-custody via SatsLegacy vault
2. Approximate Value: $_____________ USD
3. Vault ID(s): _________________________
4. These assets are NOT held by any exchange, bank, or custodian

Designated heirs with Heir Kits:
- _________________________
- _________________________

DECLARED this _____ day of ____________, 20___.

_________________________________
Declarant Signature`
};

export function generateSingleDoc(docTitle: string, state: string): void {
  const template = legalDocTemplates[docTitle];
  if (!template) {
    alert('Document template not found');
    return;
  }
  const content = template(state);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SatsLegacy_${docTitle.replace(/\s+/g, '_')}_${state}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateLegalDocuments(state: string): void {
  const content = legalDocTemplates['Bitcoin-Specific Will Addendum'](state);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SatsLegacy_Will_Addendum_${state}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
