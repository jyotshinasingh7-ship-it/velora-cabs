import "server-only";

import { createHash } from "crypto";
import { FieldValue, Timestamp, type Firestore, type Transaction } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { NotificationType, RecipientRole } from "@/types/notifications";
import { getAdminDb } from "@/lib/server/firebaseAdmin";

export interface NotificationInput {
  recipientUid: string;
  recipientRole: RecipientRole;
  title: string;
  message: string;
  type: NotificationType;
  eventKey: string;
  actionUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  source: string;
  expiresAt?: Timestamp | null;
  campaignId?: string;
}

export function safeLocalActionUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) return "";
  try {
    const parsed = new URL(path, "https://velora.local");
    return parsed.origin === "https://velora.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "";
  } catch {
    return "";
  }
}

export function notificationIdFor(eventKey: string, recipientUid: string) {
  return createHash("sha256").update(`${eventKey}:${recipientUid}`).digest("hex");
}

export function notificationData(input: NotificationInput) {
  const notificationId = notificationIdFor(input.eventKey, input.recipientUid);
  return {
    notificationId,
    recipientUid: input.recipientUid,
    recipientRole: input.recipientRole,
    title: input.title.trim().slice(0, 120),
    message: input.message.trim().slice(0, 1000),
    type: input.type,
    isRead: false,
    actionUrl: safeLocalActionUrl(input.actionUrl),
    imageUrl: input.imageUrl?.trim().slice(0, 500) ?? "",
    metadata: input.metadata ?? {},
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
    createdBy: input.createdBy ?? "system",
    source: input.source,
    expiresAt: input.expiresAt ?? null,
    campaignId: input.campaignId ?? "",
  };
}

export function setNotification(transaction: Transaction, db: Firestore, input: NotificationInput) {
  const data = notificationData(input);
  transaction.set(db.collection("notifications").doc(data.notificationId), data, { merge: false });
  return data.notificationId;
}

export async function createNotification(input: NotificationInput) {
  const db = getAdminDb();
  const data = notificationData(input);
  const reference = db.collection("notifications").doc(data.notificationId);
  try {
    await reference.create(data);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code !== "6" && code !== "already-exists") throw error;
  }
  return data.notificationId;
}

export async function createScheduledRideReminder(input: { driverUid: string; bookingDocumentId: string; scheduledAt: Timestamp }) {
  return createNotification({
    recipientUid: input.driverUid,
    recipientRole: "driver",
    title: "Scheduled ride reminder",
    message: "You have an upcoming scheduled Velora ride.",
    type: "system",
    eventKey: `booking:${input.bookingDocumentId}:scheduled_reminder:${input.scheduledAt.toMillis()}`,
    actionUrl: "/driver/dashboard",
    metadata: { bookingDocumentId: input.bookingDocumentId, scheduledAt: input.scheduledAt },
    source: "scheduled_ride_reminder",
  });
}

export async function requireAdminUser(user: DecodedIdToken) {
  const snapshot = await getAdminDb().collection("users").doc(user.uid).get();
  if (snapshot.data()?.role !== "admin") throw new Error("FORBIDDEN");
}
