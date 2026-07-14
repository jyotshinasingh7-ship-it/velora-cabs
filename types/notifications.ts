export const notificationTypes = [
  "booking_created", "driver_assigned", "driver_arrived", "ride_started",
  "ride_completed", "ride_cancelled", "payment_success", "payment_failed",
  "application_submitted", "application_under_review", "application_needs_changes",
  "application_approved", "application_rejected", "promotion", "announcement",
  "service_alert", "system",
] as const;

export type NotificationType = (typeof notificationTypes)[number];
export type RecipientRole = "customer" | "driver" | "admin" | "fleet_owner";
export type CampaignAudience = "all_users" | "customers" | "drivers" | "fleet_owners" | "selected_user";
export type CampaignStatus = "draft" | "scheduled" | "active" | "sending" | "sent" | "inactive";

export interface AppNotification {
  notificationId: string;
  recipientUid: string;
  recipientRole: RecipientRole;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl: string;
  imageUrl: string;
  metadata: Record<string, unknown>;
  createdAt: unknown;
  readAt: unknown;
  createdBy: string;
  source: string;
  expiresAt: unknown;
  campaignId: string;
}

export interface NotificationCampaign {
  campaignId: string;
  title: string;
  message: string;
  type: "promotion" | "announcement" | "service_alert" | "system";
  audience: CampaignAudience;
  selectedRecipientUid: string;
  actionUrl: string;
  couponCode: string;
  discountPercentage: number | null;
  scheduledAt: unknown;
  expiresAt: unknown;
  status: CampaignStatus;
  sentCount: number;
  createdAt: unknown;
  updatedAt: unknown;
  createdBy: string;
  sentAt: unknown;
}
