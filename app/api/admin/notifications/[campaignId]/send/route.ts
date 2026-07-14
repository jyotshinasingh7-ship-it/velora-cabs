import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { notificationData, requireAdminUser } from "@/lib/server/notifications";
import { requireUser } from "@/lib/server/requireUser";
import type { RecipientRole } from "@/types/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function recipientsFor(campaign: Record<string, unknown>) {
  const db = getAdminDb();
  const recipients = new Map<string, RecipientRole>();
  const audience = String(campaign.audience ?? "");
  if (audience === "selected_user") {
    const uid = String(campaign.selectedRecipientUid ?? "");
    const user = await db.collection("users").doc(uid).get();
    if (user.exists) recipients.set(uid, user.data()?.role === "driver" ? "driver" : user.data()?.role === "admin" ? "admin" : "customer");
  } else if (audience === "fleet_owners") {
    const applications = await db.collection("vehicleOwnerApplications").get();
    applications.forEach(document => { const uid = String(document.data().ownerUid ?? ""); if (uid) recipients.set(uid, "fleet_owner"); });
  } else {
    let usersQuery: FirebaseFirestore.Query = db.collection("users");
    if (audience === "customers") usersQuery = usersQuery.where("role", "==", "customer");
    if (audience === "drivers") usersQuery = usersQuery.where("role", "==", "driver");
    const users = await usersQuery.get();
    users.forEach(document => {
      const role = String(document.data().role ?? "customer");
      if (["customer", "driver", "admin"].includes(role)) recipients.set(document.id, role as RecipientRole);
    });
  }
  return recipients;
}

export async function POST(request: Request, context: { params: Promise<{ campaignId: string }> }) {
  try {
    const user = await requireUser(request); await requireAdminUser(user);
    const { campaignId } = await context.params;
    const db = getAdminDb(); const reference = db.collection("notificationCampaigns").doc(campaignId);
    const campaign = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      const data = snapshot.data() ?? {};
      if (data.status === "sent") throw new Error("ALREADY_SENT");
      if (data.status === "sending") throw new Error("SEND_IN_PROGRESS");
      if (data.active === false || data.status === "inactive") throw new Error("INACTIVE");
      if (data.scheduledAt instanceof Timestamp && data.scheduledAt.toMillis() > Date.now()) throw new Error("NOT_DUE");
      if (data.expiresAt instanceof Timestamp && data.expiresAt.toMillis() <= Date.now()) throw new Error("EXPIRED");
      transaction.update(reference, { status: "sending", sendingStartedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return data;
    });

    const recipients = await recipientsFor(campaign);
    const entries = Array.from(recipients.entries());
    for (let offset = 0; offset < entries.length; offset += 400) {
      const batch = db.batch();
      for (const [recipientUid, recipientRole] of entries.slice(offset, offset + 400)) {
        const data = notificationData({ recipientUid, recipientRole, title: String(campaign.title), message: String(campaign.message), type: campaign.type as "promotion" | "announcement" | "service_alert" | "system", eventKey: `campaign:${campaignId}`, actionUrl: String(campaign.actionUrl ?? ""), metadata: { couponCode: campaign.couponCode ?? "", discountPercentage: campaign.discountPercentage ?? null }, createdBy: user.uid, source: "admin_campaign", expiresAt: campaign.expiresAt instanceof Timestamp ? campaign.expiresAt : null, campaignId });
        batch.set(db.collection("notifications").doc(data.notificationId), data, { merge: false });
      }
      await batch.commit();
    }
    await reference.update({ status: "sent", sentCount: entries.length, sentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true, sentCount: entries.length });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : ["ALREADY_SENT", "SEND_IN_PROGRESS", "INACTIVE", "NOT_DUE", "EXPIRED"].includes(code) ? 409 : 500;
    const message = code === "ALREADY_SENT" ? "This campaign was already sent." : code === "SEND_IN_PROGRESS" ? "This campaign is already being sent." : code === "NOT_DUE" ? "This scheduled campaign is not due yet." : code === "EXPIRED" ? "This campaign has expired." : code === "INACTIVE" ? "Activate the campaign before sending." : status === 401 ? "Please login again." : status === 403 ? "Admin access required." : status === 404 ? "Campaign not found." : "Unable to send campaign.";
    return NextResponse.json({ message }, { status });
  }
}
