/**
 * BitTrust License Server
 * 
 * Cloudflare Worker that:
 * 1. Receives BTCPay webhook on successful payment
 * 2. Generates Ed25519-signed license key
 * 3. Emails license to customer via Resend
 * 
 * Deploy: npx wrangler deploy
 */

// You'll set these as Cloudflare Worker secrets:
// wrangler secret put BTCPAY_WEBHOOK_SECRET
// wrangler secret put LICENSE_PRIVATE_KEY
// wrangler secret put RESEND_API_KEY

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    // BTCPay webhook endpoint
    if (url.pathname === '/webhook/btcpay' && request.method === 'POST') {
      return handleBTCPayWebhook(request, env);
    }

    // License verification endpoint (for app to verify)
    if (url.pathname === '/verify' && request.method === 'POST') {
      return handleVerifyLicense(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleBTCPayWebhook(request, env) {
  try {
    // Verify webhook signature from BTCPay
    const signature = request.headers.get('BTCPay-Sig');
    const body = await request.text();
    
    if (!await verifyBTCPaySignature(body, signature, env.BTCPAY_WEBHOOK_SECRET)) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);
    
    // Only process settled invoices
    if (payload.type !== 'InvoiceSettled' && payload.type !== 'InvoicePaymentSettled') {
      return new Response('Ignored', { status: 200 });
    }

    const invoice = payload.invoiceId;
    const metadata = payload.metadata || {};
    const email = metadata.buyerEmail || payload.buyerEmail;
    const tier = metadata.tier || metadata.itemCode || 'standard';
    const orderId = metadata.orderId || invoice;

    if (!email) {
      console.error('No email in webhook payload');
      return new Response('No email provided', { status: 400 });
    }

    // Generate license
    const license = await generateLicense(tier, email, orderId, env);
    
    // Email license to customer
    await sendLicenseEmail(email, license, tier, env);

    // Store license in KV for verification (optional)
    if (env.LICENSES) {
      await env.LICENSES.put(license.key.substring(0, 32), JSON.stringify({
        email,
        tier,
        orderId,
        createdAt: new Date().toISOString()
      }));
    }

    return new Response(JSON.stringify({ success: true, orderId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleVerifyLicense(request, env) {
  try {
    const { licenseKey } = await request.json();
    
    if (!licenseKey) {
      return new Response(JSON.stringify({ valid: false, error: 'No license key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const license = decodeLicense(licenseKey);
    
    if (!license) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid format' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValid = await verifyLicenseSignature(license, env);

    return new Response(JSON.stringify({
      valid: isValid,
      tier: isValid ? license.tier : null,
      email: isValid ? license.email : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ valid: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function generateLicense(tier, email, orderId, env) {
  const licenseData = {
    tier: tier,
    email: email,
    orderId: orderId,
    issuedAt: new Date().toISOString(),
    version: 1
  };

  // Create signature using Ed25519
  const dataToSign = JSON.stringify(licenseData);
  const signature = await signData(dataToSign, env.LICENSE_PRIVATE_KEY);
  
  licenseData.signature = signature;

  // Encode as base64 license key
  const licenseKey = btoa(JSON.stringify(licenseData));
  
  // Format as readable chunks
  const formattedKey = licenseKey.match(/.{1,5}/g).join('-');

  return {
    key: formattedKey,
    data: licenseData
  };
}

function decodeLicense(licenseKey) {
  try {
    // Remove dashes and decode
    const cleaned = licenseKey.replace(/-/g, '');
    const decoded = atob(cleaned);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function signData(data, privateKeyHex) {
  // Import the private key
  const privateKeyBytes = hexToBytes(privateKeyHex);
  
  const key = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  // Sign the data
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const signature = await crypto.subtle.sign('Ed25519', key, dataBytes);
  
  return bytesToHex(new Uint8Array(signature));
}

async function verifyLicenseSignature(license, env) {
  try {
    const { signature, ...dataWithoutSig } = license;
    const dataToVerify = JSON.stringify(dataWithoutSig);
    
    // Get public key from private key (or store separately)
    const publicKeyHex = env.LICENSE_PUBLIC_KEY;
    const publicKeyBytes = hexToBytes(publicKeyHex);
    
    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(dataToVerify);
    const signatureBytes = hexToBytes(signature);

    return await crypto.subtle.verify('Ed25519', key, signatureBytes, dataBytes);
  } catch {
    return false;
  }
}

async function verifyBTCPaySignature(body, signature, secret) {
  if (!signature || !secret) return false;
  
  // BTCPay uses HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSig = 'sha256=' + bytesToHex(new Uint8Array(sig));
  
  return signature === expectedSig;
}

async function sendLicenseEmail(email, license, tier, env) {
  const tierName = tier === 'pro' ? 'Pro' : 'Standard';
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'BitTrust <noreply@bittrust.app>',
      to: email,
      subject: `Your BitTrust ${tierName} License Key`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            .logo { font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 24px; }
            .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .license-key { background: #09090b; border: 1px solid #f97316; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 14px; word-break: break-all; color: #f97316; }
            .tier { display: inline-block; background: #f97316; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .steps { margin: 24px 0; }
            .step { display: flex; gap: 12px; margin: 12px 0; }
            .step-num { background: #27272a; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; }
            a { color: #f97316; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🛡️ BitTrust</div>
            
            <h1 style="margin: 0 0 8px 0;">Thank you for your purchase!</h1>
            <p style="color: #a1a1aa; margin: 0;">Your sovereign Bitcoin inheritance awaits.</p>
            
            <div class="card">
              <div style="margin-bottom: 16px;">
                <span class="tier">${tierName.toUpperCase()} LICENSE</span>
              </div>
              
              <p style="margin: 0 0 12px 0; color: #a1a1aa; font-size: 14px;">Your license key:</p>
              <div class="license-key">${license.key}</div>
            </div>
            
            <div class="steps">
              <h3 style="margin: 0 0 16px 0;">How to activate:</h3>
              <div class="step">
                <div class="step-num">1</div>
                <div>Open BitTrust desktop app</div>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <div>Go to Settings → License</div>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <div>Paste your license key and click Activate</div>
              </div>
            </div>
            
            <div class="card" style="background: #1a1407; border-color: #422006;">
              <p style="margin: 0; font-size: 14px; color: #fbbf24;">
                <strong>⚠️ Save this email!</strong><br>
                This license key is your proof of purchase. Store it somewhere safe.
              </p>
            </div>
            
            <div class="footer">
              <p>Questions? Reply to this email or visit our <a href="https://btc-trust.vercel.app">website</a>.</p>
              <p style="margin-top: 16px;">Not your keys, not your coins. Not your script, not your inheritance.</p>
              <p>© 2025 BitTrust</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}

// Utility functions
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
