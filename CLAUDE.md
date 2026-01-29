# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SatsLegacy is a sovereign Bitcoin inheritance application - a desktop app (Electron) and web app for creating time-locked Bitcoin vaults that allow users to set up inheritance plans without third-party custody. The app uses Bitcoin Script timelocks and miniscript to create spending conditions where owners can spend anytime, but heirs can only spend after specified conditions are met.

## Development Commands

```bash
# Run development server (web only)
npm run dev

# Run Electron app in development (starts Vite + Electron)
npm run dev:electron

# Build for production
npm run build              # Web build only (outputs to dist/)
npm run build:electron     # Full Electron app build
npm run build:win          # Windows build
npm run build:mac          # macOS build
npm run build:linux        # Linux build
```

## Architecture

### Entry Points
- **Web/Electron UI**: `SatsLegacy.jsx` - Main React component containing the entire application UI
- **Electron Main Process**: `electron/main.cjs` - Handles vault storage, encryption, IPC, and system operations
- **Electron Preload**: `electron/preload.cjs` - Exposes `window.electronAPI` for renderer-to-main IPC
- **React Entry**: `src/main.jsx` - Hash-based router, determines landing page vs app vs docs views

### Key Directories
- `src/vault/` - Core vault logic module
  - `creation/wizard/` - VaultCreationWizard.tsx for vault setup flow
  - `creation/validation/` - Configuration compatibility checking
  - `infrastructure/local/` - Local encrypted storage
  - `infrastructure/shamir/` - Shamir secret sharing implementation
  - `infrastructure/nostr/` - Nostr relay storage (decentralized backup)
  - `scripts/` - Bitcoin address generation and miniscript compilation
- `src/docs/` - Documentation pages (DocsPage, guides for vault types, security, etc.)
- `src/components/` - Standalone components (HeirClaimPortal, HeirKitGenerator, LicenseModal)

### Data Flow
1. Vaults are created through `VaultCreationWizard` which validates configuration compatibility
2. Vault data is encrypted with AES-256-GCM using PBKDF2-derived keys (600k iterations)
3. In Electron: vaults stored as `.vault` (encrypted) + `.meta` (unencrypted listing info) files in `userData/SatsLegacy/vaults/`
4. The `electronAPI` IPC bridge provides: `vault.*`, `license.*`, `settings.*`, `system.*` methods

### Bitcoin Integration
- Uses `bitcoinjs-lib` for address generation
- Supports P2WPKH, P2WSH, multisig, and timelock scripts
- `src/vault/scripts/bitcoin-address.ts` - Address generation from vault configs
- `src/vault/scripts/miniscript.ts` - Policy compilation to miniscript

### Network Detection
- `window.isElectron` flag indicates Electron environment
- `window.electronAPI` provides IPC methods when in Electron
- Web mode falls back to localStorage/browser-only features

## Vault Types

The app supports multiple inheritance logic types:
- **Timelock**: Owner spends anytime, heir spends after block height
- **Dead Man's Switch**: Requires periodic owner activity to prevent heir access
- **Multisig Decay**: Threshold requirements that decrease over time
- **Hybrid**: Combinations with additional gates (challenge questions, etc.)

## File Naming Conventions

- React components: PascalCase `.jsx` files
- TypeScript modules: camelCase `.ts` files
- Electron files: `.cjs` extension (CommonJS required for Electron main process)
