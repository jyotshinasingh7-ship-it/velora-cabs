import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";
import { setNotification } from "@/lib/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed = new Set(["under_review", "needs_changes", "approved", "rejected"]);

export async function POST(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const reviewer = await requireUser(request);
    const { applicationId } = await context.params;
    const body = await request.json() as { status?: string; notes?: string };
    const status = body.status ?? "";
    const notes = body.notes?.trim() ?? "";
    if (!allowed.has(status)) return NextResponse.json({ message: "Invalid review status." }, { status: 400 });
    if (["needs_changes", "rejected"].includes(status) && notes.length < 3) return NextResponse.json({ message: "Review notes are required." }, { status: 400 });
    const db = getAdminDb();
    await db.runTransaction(async transaction => {
      const adminRef = db.collection("users").doc(reviewer.uid);
      const applicationRef = db.collection("driverApplications").doc(applicationId);
      const [adminSnap, applicationSnap] = await Promise.all([transaction.get(adminRef), transaction.get(applicationRef)]);
      if (adminSnap.data()?.role !== "admin") throw new Error("FORBIDDEN");
      if (!applicationSnap.exists) throw new Error("NOT_FOUND");
      const application = applicationSnap.data()!;
      if (["approved", "rejected"].includes(application.status)) throw new Error("TERMINAL_STATUS");
      if (application.applicantUid === reviewer.uid) throw new Error("SELF_REVIEW");
      const now = FieldValue.serverTimestamp();
      transaction.update(applicationRef, { status, reviewedBy: reviewer.uid, reviewedAt: now, updatedAt: now, reviewNotes: notes, rejectionReason: status === "rejected" ? notes : "", changeRequests: status === "needs_changes" ? [notes] : [], reviewHistory: FieldValue.arrayUnion({ status, notes, reviewedBy: reviewer.uid, reviewedAt: new Date().toISOString() }) });
      transaction.set(db.collection("users").doc(application.applicantUid), { applicationStatus: status, updatedAt: now, ...(status === "approved" ? { role: "driver", accountType: "driver", onboardingIntent: "driver" } : {}) }, { merge: true });
      if (status === "approved") transaction.set(db.collection("drivers").doc(application.applicantUid), { uid: application.applicantUid, name: application.legalName, email: application.email, phoneNumber: application.phoneNumber, licenceNumber: application.licenceNumber, preferredServiceArea: application.preferredServiceArea, isApproved: true, isActive: true, isOnline: false, status: "offline", incomingRideId: "", activeRideId: "", rating: 0, ratingCount: 0, totalRides: 0, walletBalance: 0, pendingBalance: 0, createdAt: now, approvedAt: now, approvedBy: reviewer.uid, updatedAt: now }, { merge: true });
      const notificationType = status === "under_review" ? "application_under_review" : status === "needs_changes" ? "application_needs_changes" : status === "approved" ? "application_approved" : "application_rejected";
      const title = status === "under_review" ? "Application under review" : status === "needs_changes" ? "Driver application needs changes" : status === "approved" ? "Driver application approved" : "Driver application update";
      const message = status === "approved" ? "Your driver application was approved. You can now access the driver dashboard." : status === "needs_changes" ? notes : status === "rejected" ? notes : "An administrator is reviewing your driver application.";
      setNotification(transaction, db, { recipientUid: application.applicantUid, recipientRole: status === "approved" ? "driver" : "customer", title, message, type: notificationType, eventKey: `driver_application:${applicationId}:${status}`, actionUrl: status === "approved" ? "/driver/dashboard" : "/driver/onboarding", metadata: { applicationId, status }, createdBy: reviewer.uid, source: "driver_application_review" });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHENTICATED" ? 401 : ["FORBIDDEN", "SELF_REVIEW"].includes(code) ? 403 : code === "NOT_FOUND" ? 404 : code === "TERMINAL_STATUS" ? 409 : 500;
    if (status === 500) console.error("Driver application review failed:", error);
    return NextResponse.json({ message: status === 401 ? "Please login again." : status === 403 ? "Admin review access required." : status === 404 ? "Application not found." : status === 409 ? "Approved and rejected applications are final." : "Unable to review application." }, { status });
  }
}
