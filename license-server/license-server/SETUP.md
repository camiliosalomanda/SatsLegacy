# BitTrust License Server Setup

Automated license delivery: Payment → License Key → Email

## Architecture

```
Customer pays → BTCPay webhook → Cloudflare Worker → Resend email → Customer gets license
```

## Prerequisites

1. **Cloudflare account** (free) - https://cloudflare.com
2. **Resend account** (free tier: 3k emails/month) - https://resend.com

## Step 1: Generate License Keys

Run this once to create your signing keypair:

```bash
# Using Node.js
node -e "
const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
console.log('PRIVATE KEY (keep secret!):');
console.log(privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex'));
console.log('');
console.log('PUBLIC KEY (safe to share):');
console.log(publicKey.export({ type: 'spki', format: 'der' }).toString('hex'));
"
```

Save both keys somewhere safe!

## Step 2: Set Up Resend

1. Go to https://resend.com and create account
2. Add your domain (or use their test domain to start)
3. Go to API Keys → Create API Key
4. Copy the key (starts with `re_`)

## Step 3: Deploy Cloudflare Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to the license server folder
cd bittrust-license-server

# Deploy the worker
wrangler deploy

# Set secrets
wrangler secret put BTCPAY_WEBHOOK_SECRET
# Enter the secret you'll set in BTCPay webhook config

wrangler secret put LICENSE_PRIVATE_KEY
# Enter the private key from Step 1

wrangler secret put LICENSE_PUBLIC_KEY
# Enter the public key from Step 1

wrangler secret put RESEND_API_KEY
# Enter your Resend API key
```

Your worker will be live at: `https://bittrust-license.YOUR-SUBDOMAIN.workers.dev`

## Step 4: Configure BTCPay Webhook

In BTCPay Server:

1. Go to **Store Settings → Webhooks**
2. Click **Create Webhook**
3. **Payload URL:** `https://bittrust-license.YOUR-SUBDOMAIN.workers.dev/webhook/btcpay`
4. **Secret:** Create a random string, save it (you'll use this for BTCPAY_WEBHOOK_SECRET)
5. **Events:** Check `Invoice settled` and `Invoice payment settled`
6. Click **Add webhook**

## Step 5: Create BTCPay Payment Buttons

In BTCPay Server:

1. Go to **Plugins → Pay Button**
2. Create button for Standard ($99):
   - Price: 99
   - Currency: USD
   - Order ID: `standard-{random}`
   - Metadata: `{"tier": "standard"}`
   - Buyer email: Required
3. Create button for Pro ($299):
   - Price: 299
   - Currency: USD
   - Order ID: `pro-{random}`
   - Metadata: `{"tier": "pro"}`
   - Buyer email: Required

## Step 6: Update Landing Page Links

In `LandingPage.jsx`, update the buy links to your BTCPay payment pages:

```javascript
// Standard tier
href="https://bittrust-pay.lndyn.com/api/v1/invoices?storeId=YOUR_STORE_ID&price=99&currency=USD&..."

// Pro tier
href="https://bittrust-pay.lndyn.com/api/v1/invoices?storeId=YOUR_STORE_ID&price=299&currency=USD&..."
```

Or use the Pay Button HTML that BTCPay generates.

## Step 7: Update App to Verify Licenses

In your Electron app, update the license verification to call your worker:

```javascript
const response = await fetch('https://bittrust-license.YOUR-SUBDOMAIN.workers.dev/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ licenseKey })
});
const { valid, tier } = await response.json();
```

## Testing

1. Create a test invoice in BTCPay
2. Pay it (use testnet first if unsure)
3. Check Cloudflare Worker logs: `wrangler tail`
4. Customer should receive email with license key

## Costs

- Cloudflare Worker: **Free** (100k requests/day)
- Resend: **Free** up to 3k emails/month, then $20/month
- BTCPay: Your Luna Node cost (~$12/month)

**Total: ~$12/month** until you exceed free tiers

## Troubleshooting

**No email received:**
- Check Cloudflare Worker logs: `wrangler tail`
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for failed deliveries

**Invalid signature errors:**
- Verify BTCPAY_WEBHOOK_SECRET matches BTCPay config
- Check webhook is sending to correct URL

**License not activating:**
- Verify LICENSE_PUBLIC_KEY in app matches the keypair
- Check license key format (base64 with dashes)
