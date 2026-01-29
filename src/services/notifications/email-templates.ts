/**
 * Email templates for SatsLegacy notifications
 */

export interface CheckInReminderData {
  vaultName: string;
  daysRemaining: number;
  status: 'warning' | 'critical' | 'expired';
  checkInUrl?: string;
}

export interface HeirNotificationData {
  vaultName: string;
  ownerName?: string;
  claimInstructions?: string;
}

/**
 * Generate check-in reminder email HTML
 */
export function generateCheckInReminderHtml(data: CheckInReminderData): string {
  const { vaultName, daysRemaining, status } = data;

  const urgencyColor = status === 'critical' ? '#ef4444' : status === 'expired' ? '#dc2626' : '#eab308';
  const urgencyText = status === 'critical' ? 'Urgent' : status === 'expired' ? 'Expired' : 'Reminder';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SatsLegacy Check-In Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #18181b;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #27272a 0%, #18181b 100%); border-radius: 16px 16px 0 0; border: 1px solid #3f3f46; border-bottom: none;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #f97316;">SatsLegacy</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">Bitcoin Inheritance Vault</p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 8px 16px; background-color: ${urgencyColor}20; color: ${urgencyColor}; border-radius: 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; border: 1px solid ${urgencyColor}40;">
                      ${urgencyText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px; background-color: #27272a; border: 1px solid #3f3f46; border-top: none; border-bottom: none;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff;">Check-In Required</h2>

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #a1a1aa; line-height: 1.6;">
                Your vault <strong style="color: #ffffff;">"${vaultName}"</strong> requires a check-in to maintain control.
              </p>

              <!-- Status Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background-color: ${urgencyColor}10; border: 1px solid ${urgencyColor}30; border-radius: 12px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 60px; vertical-align: middle;">
                          <div style="width: 48px; height: 48px; background-color: ${urgencyColor}20; border-radius: 12px; text-align: center; line-height: 48px; font-size: 24px;">
                            ${status === 'expired' ? '⚠️' : '⏰'}
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          ${status === 'expired' ? `
                            <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${urgencyColor};">Check-In Period Expired</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Your heirs may now be able to claim the vault funds.</p>
                          ` : `
                            <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${urgencyColor};">${daysRemaining} days remaining</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Check in before the timer expires to maintain control.</p>
                          `}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #ffffff;">How to Check In</h3>
              <ol style="margin: 0 0 24px 0; padding-left: 20px; color: #a1a1aa; line-height: 1.8;">
                <li>Open SatsLegacy and navigate to your vault</li>
                <li>Click the "Check In" button</li>
                <li>Generate and sign the check-in PSBT with your hardware wallet</li>
                <li>Broadcast the transaction to reset the timer</li>
              </ol>

              <p style="margin: 0; font-size: 14px; color: #71717a;">
                The check-in process creates a transaction that spends your vault funds back to the same address, resetting the inactivity timer.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #18181b; border-radius: 0 0 16px 16px; border: 1px solid #3f3f46; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #52525b; text-align: center;">
                This is an automated notification from SatsLegacy. Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generate check-in reminder plain text
 */
export function generateCheckInReminderText(data: CheckInReminderData): string {
  const { vaultName, daysRemaining, status } = data;

  if (status === 'expired') {
    return `
SatsLegacy Check-In EXPIRED

Your vault "${vaultName}" check-in period has expired.

WARNING: Your heirs may now be able to claim the vault funds.

To regain exclusive control, you should:
1. Open SatsLegacy and navigate to your vault
2. Click the "Check In" button
3. Generate and sign the check-in PSBT with your hardware wallet
4. Broadcast the transaction to reset the timer

The check-in process creates a transaction that spends your vault funds back to the same address, resetting the inactivity timer.

---
This is an automated notification from SatsLegacy.
`;
  }

  return `
SatsLegacy Check-In ${status === 'critical' ? 'URGENT' : 'Reminder'}

Your vault "${vaultName}" requires a check-in.

TIME REMAINING: ${daysRemaining} days

To check in:
1. Open SatsLegacy and navigate to your vault
2. Click the "Check In" button
3. Generate and sign the check-in PSBT with your hardware wallet
4. Broadcast the transaction to reset the timer

The check-in process creates a transaction that spends your vault funds back to the same address, resetting the inactivity timer.

---
This is an automated notification from SatsLegacy.
`;
}

/**
 * Generate heir notification email HTML (when vault becomes claimable)
 */
export function generateHeirNotificationHtml(data: HeirNotificationData): string {
  const { vaultName, ownerName } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SatsLegacy Vault Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #18181b;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #27272a 0%, #18181b 100%); border-radius: 16px 16px 0 0; border: 1px solid #3f3f46; border-bottom: none;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #f97316;">SatsLegacy</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">Bitcoin Inheritance Vault</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px; background-color: #27272a; border: 1px solid #3f3f46; border-top: none; border-bottom: none;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff;">Vault Now Claimable</h2>

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #a1a1aa; line-height: 1.6;">
                You have been designated as a beneficiary of the vault <strong style="color: #ffffff;">"${vaultName}"</strong>${ownerName ? ` by ${ownerName}` : ''}.
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #a1a1aa; line-height: 1.6;">
                The vault's inactivity period has expired, and you may now be eligible to claim your designated portion of the funds.
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background-color: #f9731610; border: 1px solid #f9731630; border-radius: 12px;">
                    <p style="margin: 0; font-size: 14px; color: #f97316; font-weight: bold;">Important</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                      To claim funds, you will need the Heir Kit that was provided to you. This contains the necessary information to construct a valid claim transaction.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #71717a;">
                If you have questions about this notification or need assistance, please refer to the documentation included in your Heir Kit.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #18181b; border-radius: 0 0 16px 16px; border: 1px solid #3f3f46; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #52525b; text-align: center;">
                This is an automated notification from SatsLegacy.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generate heir notification plain text
 */
export function generateHeirNotificationText(data: HeirNotificationData): string {
  const { vaultName, ownerName } = data;

  return `
SatsLegacy Vault Notification

VAULT NOW CLAIMABLE

You have been designated as a beneficiary of the vault "${vaultName}"${ownerName ? ` by ${ownerName}` : ''}.

The vault's inactivity period has expired, and you may now be eligible to claim your designated portion of the funds.

IMPORTANT: To claim funds, you will need the Heir Kit that was provided to you. This contains the necessary information to construct a valid claim transaction.

If you have questions about this notification or need assistance, please refer to the documentation included in your Heir Kit.

---
This is an automated notification from SatsLegacy.
`;
}
