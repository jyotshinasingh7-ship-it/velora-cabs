import { createHash } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireAdminUser, safeLocalActionUrl } from "@/lib/server/notifications";
import { requireUser } from "@/lib/server/requireUser";
import type { CampaignAudience } from "@/types/notifications";

export const runtime = "nodejs";
const types = new Set(["promotion", "announcement", "service_alert", "system"]);
const audiences = new Set<CampaignAudience>(["all_users", "customers", "drivers", "fleet_owners", "selected_user"]);
function optionalTimestamp(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? undefined : Timestamp.fromDate(date); }

export async function POST(request: Request) {
  try {
    const user = await requireUser(request); await requireAdminUser(user);
    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title ?? "").trim(); const message = String(body.message ?? "").trim();
    const type = String(body.type ?? ""); const audience = String(body.audience ?? "") as CampaignAudience;
    const requestId = String(body.requestId ?? "").trim(); const actionValue = String(body.actionUrl ?? "").trim();
    if (title.length < 3 || title.length > 120 || message.length < 3 || message.length > 1000) return NextResponse.json({ message: "Enter a valid title and message." }, { status: 400 });
    if (!types.has(type) || !audiences.has(audience)) return NextResponse.json({ message: "Select a valid type and audience." }, { status: 400 });
    if (!requestId || requestId.length > 100) return NextResponse.json({ message: "Campaign request ID is missing." }, { status: 400 });
    const actionUrl = safeLocalActionUrl(actionValue); if (actionValue && !actionUrl) return NextResponse.json({ message: "Action URL must be a safe local route." }, { status: 400 });
    const discount = body.discountPercentage === "" || body.discountPercentage == null ? null : Number(body.discountPercentage);
    if (discount !== null && (!Number.isFinite(discount) || discount < 0 || discount > 100)) return NextResponse.json({ message: "Discount percentage must be between 0 and 100." }, { status: 400 });
    const scheduledAt = optionalTimestamp(body.scheduledAt); const expiresAt = optionalTimestamp(body.expiresAt);
    if (scheduledAt === undefined || expiresAt === undefined) return NextResponse.json({ message: "Enter valid campaign dates." }, { status: 400 });
    if (scheduledAt && expiresAt && expiresAt.toMillis() <= scheduledAt.toMillis()) return NextResponse.json({ message: "Expiry must be after the start time." }, { status: 400 });
    if (expiresAt && expiresAt.toMillis() <= Date.now()) return NextResponse.json({ message: "Expiry must be in the future." }, { status: 400 });
    let selectedRecipientUid = "";
    if (audience === "selected_user") {
      const selected = String(body.selectedUser ?? "").trim(); if (!selected) return NextResponse.json({ message: "Enter a selected user email or UID." }, { status: 400 });
      const direct = await getAdminDb().collection("users").doc(selected).get();
      if (direct.exists) selectedRecipientUid = direct.id; else { const match = await getAdminDb().collection("users").where("email", "==", selected.toLowerCase()).limit(1).get(); selectedRecipientUid = match.docs[0]?.id ?? ""; }
      if (!selectedRecipientUid) return NextResponse.json({ message: "Selected user was not found." }, { status: 404 });
    }
    const campaignId = createHash("sha256").update(`${user.uid}:${requestId}`).digest("hex");
    const reference = getAdminDb().collection("notificationCampaigns").doc(campaignId);
    if ((await reference.get()).exists) return NextResponse.json({ message: "This campaign request was already created.", campaignId }, { status: 409 });
    const now = Date.now(); const status = body.active === false ? "inactive" : scheduledAt && scheduledAt.toMillis() > now ? "scheduled" : "draft";
    await reference.set({ campaignId, title, message, type, audience, selectedRecipientUid, actionUrl, couponCode: String(body.couponCode ?? "").trim().toUpperCase().slice(0, 40), discountPercentage: discount, scheduledAt, expiresAt, status, sentCount: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), createdBy: user.uid, sentAt: null, active: body.active !== false });
    return NextResponse.json({ success: true, campaignId, status }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ message: code === "UNAUTHENTICATED" ? "Please login again." : code === "FORBIDDEN" ? "Admin access required." : "Unable to create campaign." }, { status: code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 500 });
  }
}
