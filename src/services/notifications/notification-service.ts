/**
 * SatsLegacy Notification Service
 *
 * Handles email notifications for:
 * - Dead Man's Switch check-in reminders
 * - Heir notifications when vaults become claimable
 *
 * Uses Resend for email delivery.
 */

import { Resend } from 'resend';
import {
  generateCheckInReminderHtml,
  generateCheckInReminderText,
  generateHeirNotificationHtml,
  generateHeirNotificationText,
  type CheckInReminderData,
  type HeirNotificationData,
} from './email-templates';

export interface NotificationConfig {
  resendApiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  private resend: Resend | null = null;
  private fromEmail: string = '';
  private fromName: string = 'SatsLegacy';

  /**
   * Initialize the notification service with Resend API key
   */
  initialize(config: NotificationConfig): void {
    if (!config.resendApiKey) {
      console.warn('NotificationService: No Resend API key provided, notifications disabled');
      return;
    }

    this.resend = new Resend(config.resendApiKey);
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName || 'SatsLegacy';
  }

  /**
   * Check if the service is configured and ready
   */
  isConfigured(): boolean {
    return this.resend !== null && this.fromEmail !== '';
  }

  /**
   * Send a check-in reminder email to the vault owner
   */
  async sendCheckInReminder(
    toEmail: string,
    data: CheckInReminderData
  ): Promise<SendResult> {
    if (!this.resend) {
      return { success: false, error: 'Notification service not configured' };
    }

    try {
      const subject = data.status === 'expired'
        ? `⚠️ SatsLegacy: Check-In Expired for "${data.vaultName}"`
        : data.status === 'critical'
        ? `🚨 URGENT: Check-In Required for "${data.vaultName}" (${data.daysRemaining} days)`
        : `⏰ SatsLegacy: Check-In Reminder for "${data.vaultName}" (${data.daysRemaining} days)`;

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: toEmail,
        subject,
        html: generateCheckInReminderHtml(data),
        text: generateCheckInReminderText(data),
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send check-in reminder:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Send notification to heirs when a vault becomes claimable
   */
  async sendHeirNotification(
    toEmail: string,
    data: HeirNotificationData
  ): Promise<SendResult> {
    if (!this.resend) {
      return { success: false, error: 'Notification service not configured' };
    }

    try {
      const subject = `SatsLegacy: Vault "${data.vaultName}" is Now Claimable`;

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: toEmail,
        subject,
        html: generateHeirNotificationHtml(data),
        text: generateHeirNotificationText(data),
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send heir notification:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Send a test email to verify configuration
   */
  async sendTestEmail(toEmail: string): Promise<SendResult> {
    if (!this.resend) {
      return { success: false, error: 'Notification service not configured' };
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: toEmail,
        subject: 'SatsLegacy: Test Notification',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #f97316;">SatsLegacy Test Email</h2>
            <p>This is a test notification from SatsLegacy.</p>
            <p>If you received this email, your notification settings are configured correctly.</p>
          </div>
        `,
        text: 'SatsLegacy Test Email\n\nThis is a test notification from SatsLegacy.\nIf you received this email, your notification settings are configured correctly.',
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send test email:', message);
      return { success: false, error: message };
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
