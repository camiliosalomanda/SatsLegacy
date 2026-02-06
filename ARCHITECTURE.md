# SatsLegacy Architecture & Configuration Reference

## System Overview

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Customer      │────▶│   BTCPay Server      │────▶│  Cloudflare │
│   (Payment)     │     │   (pay.satslegacy.io)│     │   Worker    │
└─────────────────┘     └──────────────────────┘     └──────┬──────┘
                                                            │
                        ┌──────────────────────┐            │
                        │   Resend             │◀───────────┘
                        │   (Email Service)    │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Customer Email     │
                        │   (License Key)      │
                        └──────────────────────┘

┌─────────────────┐     ┌──────────────────────┐
│   GitHub Repo   │────▶│   Vercel             │
│   (Code)        │     │   (satslegacy.io)    │
└────────┬────────┘     └──────────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│  GitHub Actions │────▶│   GitHub Releases    │
│  (Build)        │     │   (Installers)       │
└─────────────────┘     └──────────────────────┘

┌─────────────────┐
│  Electron App   │◀─── Downloads from GitHub Releases
│  (Desktop)      │     Verifies licenses with Ed25519 public key
└─────────────────┘
```

---

## Component Details

### 1. BTCPay Server
- **URL**: `https://pay.satslegacy.io`
- **Purpose**: Accept Bitcoin payments for Standard ($99) and Pro ($299) licenses
- **Hosted On**: Luna Node (or your hosting provider)

#### Configuration Items:
| Item | Location | Value/Notes |
|------|----------|-------------|
| Store ID | BTCPay Dashboard | Your store identifier |
| POS App URL | `https://pay.satslegacy.io/apps/2L3STy2vfnfXfJrNk2CFANmDM1fw/pos/form` | Both tiers on same page |
| Webhook URL | Store Settings → Webhooks | `https://bittrust-license.bittrust-license.workers.dev/webhook/btcpay` |
| Webhook Secret | Store Settings → Webhooks | Random string (must match BTCPAY_WEBHOOK_SECRET in Worker) |
| Webhook Events | Store Settings → Webhooks | "Invoice settled", "Invoice payment settled" |

---

### 2. Cloudflare Worker (License Server)
- **URL**: `https://bittrust-license.bittrust-license.workers.dev`
- **Purpose**: Generate and sign license keys after payment, send via email
- **Code Location**: `SatsLegacy-private/license-server/license-server/worker.js`

#### Secrets (set via `wrangler secret put`):
| Secret Name | Purpose | How to Set |
|-------------|---------|------------|
| `BTCPAY_WEBHOOK_SECRET` | Verify webhook requests from BTCPay | Must match BTCPay webhook config |
| `LICENSE_PRIVATE_KEY` | Sign license keys (Ed25519) | `302e020100300506032b6570042204203e1e040ec0112cf6db86394c34ceedcd9eaf5c660377d5396749b35a01276ef9` |
| `LICENSE_PUBLIC_KEY` | Verify signatures | `302a300506032b657003210051f73ef4fb18534c9fd11d3a98cde137313c52b771a141a6b11e1a13ae1afe18` |
| `RESEND_API_KEY` | Send emails via Resend | Starts with `re_` |

#### Commands:
```bash
cd SatsLegacy-private/license-server/license-server

# View secrets
wrangler secret list

# Set a secret
wrangler secret put SECRET_NAME

# Deploy worker
wrangler deploy

# View logs
wrangler tail
```

---

### 3. Resend (Email Service)
- **URL**: `https://resend.com`
- **Purpose**: Send license key emails to customers after payment
- **Free Tier**: 3,000 emails/month

#### Configuration Items:
| Item | Location | Notes |
|------|----------|-------|
| API Key | Resend Dashboard → API Keys | Starts with `re_`, set as RESEND_API_KEY in Worker |
| Domain | Resend Dashboard → Domains | Your sending domain (or use test domain) |
| From Address | In worker.js | e.g., `licenses@satslegacy.io` |

---

### 4. Electron App (Desktop Client)
- **Code Location**: `BTCTrust/` (main repo)
- **Main Process**: `electron/main.cjs`
- **Purpose**: Desktop app users download and run

#### Configuration Items in `electron/main.cjs`:
| Item | Line | Current Value |
|------|------|---------------|
| `BTCPAY_PUBLIC_KEY` | ~455 | `302a300506032b657003210051f73ef4fb18534c9fd11d3a98cde137313c52b771a141a6b11e1a13ae1afe18` |
| BTCPay Checkout URL | ~517 | `https://pay.satslegacy.io/apps/2L3STy2vfnfXfJrNk2CFANmDM1fw/pos/form` |

#### License Storage:
- **Path**: `{userData}/SatsLegacy/license.json`
- **Format**: JSON with tier, email, signature, activated_at

---

### 5. GitHub Repository
- **Public Repo**: `https://github.com/camiliosalomanda/SatsLegacy`
- **Private Repo**: `https://github.com/camiliosalomanda/SatsLegacy-private` (license server)

#### GitHub Actions Secrets (for builds):
| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Auto-provided, creates releases |
| `APPLE_ID` | macOS code signing |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS notarization |
| `APPLE_TEAM_ID` | macOS team identifier |

---

### 6. Vercel (Website Hosting)
- **URL**: `https://satslegacy.io`
- **Deploys From**: GitHub `main` branch (auto-deploy)
- **Config File**: `vercel.json`

#### No secrets needed - static site deployment

---

### 7. GitHub Releases (Installers)
- **URL**: `https://github.com/camiliosalomanda/SatsLegacy/releases`
- **Built By**: GitHub Actions on version tags (`v*`)

#### Current Version: 1.7.0

#### Download URLs (in LandingPage.jsx):
| Platform | Filename |
|----------|----------|
| Windows Installer | `SatsLegacy.Setup.1.7.0.exe` |
| Windows Portable | `SatsLegacy.1.7.0.exe` |
| macOS Apple Silicon | `SatsLegacy-1.7.0-arm64.dmg` |
| macOS Intel | `SatsLegacy-1.7.0.dmg` |
| Linux AppImage | `SatsLegacy-1.7.0.AppImage` |
| Linux Deb | `SatsLegacy_1.7.0_amd64.deb` |

---

## Key Pairs Reference

### Ed25519 License Signing Keys
Generated: 2024 (current session)

**PRIVATE KEY** (SECRET - Cloudflare Worker only):
```
302e020100300506032b6570042204203e1e040ec0112cf6db86394c34ceedcd9eaf5c660377d5396749b35a01276ef9
```

**PUBLIC KEY** (in Electron app main.cjs):
```
302a300506032b657003210051f73ef4fb18534c9fd11d3a98cde137313c52b771a141a6b11e1a13ae1afe18
```

---

## Payment Flow

1. **Customer** visits `satslegacy.io` → clicks "Buy with Bitcoin"
2. **BTCPay** creates invoice, customer pays
3. **BTCPay Webhook** fires to Cloudflare Worker on payment settled
4. **Worker** verifies webhook signature, generates signed license key
5. **Resend** sends email with license key to customer
6. **Customer** enters license key in Electron app
7. **App** verifies signature with public key, activates license

---

## Tier Limits

| Feature | Free | Standard ($99) | Pro ($299) |
|---------|------|----------------|------------|
| Vaults | 3 | 10 | Unlimited |
| Bundles | Simple Sovereign | + Resilient Sovereign | All |
| Logic | Timelock | + Multisig Decay | + Dead Man's Switch, Duress |
| Modifiers | None | Multi-beneficiary | + Staggered, Decoy |
| Legal Templates | No | No | Yes |
| Support | Community | Email | Priority |

---

## Quick Commands Reference

### Cloudflare Worker
```bash
cd SatsLegacy-private/license-server/license-server
wrangler deploy          # Deploy changes
wrangler tail            # View logs
wrangler secret list     # List secrets
wrangler secret put NAME # Set a secret
```

### Electron App Build
```bash
cd BTCTrust
npm run dev:electron     # Local development
npm run build:win        # Build Windows
npm run build:mac        # Build macOS
npm run build:linux      # Build Linux
```

### Release New Version
```bash
npm version 1.5.5 --no-git-tag-version
# Update version in LandingPage.jsx
git add -A && git commit -m "Bump version to 1.5.5"
git push && git tag v1.5.5 && git push --tags
# GitHub Actions builds automatically
# Publish release at github.com/camiliosalomanda/SatsLegacy/releases
```

---

## Troubleshooting

### License not received after payment
1. Check BTCPay webhook is configured correctly
2. Check Cloudflare Worker logs: `wrangler tail`
3. Verify BTCPAY_WEBHOOK_SECRET matches
4. Check Resend dashboard for failed emails

### License won't activate in app
1. Verify public key in main.cjs matches private key in Worker
2. Check license key format (base64 encoded JSON)
3. Look at Electron dev console for errors

### Build failing
1. Check GitHub Actions logs
2. Verify Apple signing secrets for macOS
3. Ensure version updated in package.json AND LandingPage.jsx

---

## Monthly Costs

| Service | Cost |
|---------|------|
| Cloudflare Worker | Free (100k req/day) |
| Resend | Free < 3k emails, then $20/mo |
| BTCPay (Luna Node) | ~$12/mo |
| GitHub | Free |
| Vercel | Free |
| **Total** | ~$12/mo base |
