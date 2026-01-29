export { NotificationService, notificationService } from './notification-service';
export type { NotificationConfig, SendResult } from './notification-service';
export type { CheckInReminderData, HeirNotificationData } from './email-templates';
export {
  generateCheckInReminderHtml,
  generateCheckInReminderText,
  generateHeirNotificationHtml,
  generateHeirNotificationText,
} from './email-templates';
