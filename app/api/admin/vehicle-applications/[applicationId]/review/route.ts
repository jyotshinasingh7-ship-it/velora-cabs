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
      const applicationRef = db.collection("vehicleOwnerApplications").doc(applicationId);
      const [adminSnap, applicationSnap] = await Promise.all([transaction.get(adminRef), transaction.get(applicationRef)]);
      if (adminSnap.data()?.role !== "admin") throw new Error("FORBIDDEN");
      if (!applicationSnap.exists) throw new Error("NOT_FOUND");
      const application = applicationSnap.data()!;
      if (["approved", "rejected"].includes(application.status)) throw new Error("TERMINAL_STATUS");
      if (application.ownerUid === reviewer.uid) throw new Error("SELF_REVIEW");
      const now = FieldValue.serverTimestamp();
      const registrationId = String(application.registrationNumber).replace(/[^A-Z0-9]/gi, "").toUpperCase();
      const vehicleRef = db.collection("vehicles").doc(registrationId);
      if (status === "approved") {
        const existingVehicle = await transaction.get(vehicleRef);
        if (existingVehicle.exists && existingVehicle.data()?.ownerUid !== application.ownerUid) throw new Error("DUPLICATE_REGISTRATION");
        transaction.set(vehicleRef, { ownerUid: application.ownerUid, applicationId, registrationNumber: registrationId, vehicleMake: application.vehicleMake, vehicleModel: application.vehicleModel, manufacturingYear: application.manufacturingYear, vehicleType: application.vehicleType, seats: application.seats, fuelType: application.fuelType, serviceCategory: application.serviceCategory, permitStatus: application.permitStatus, permitExpiry: application.permitExpiry, insuranceExpiry: application.insuranceExpiry, fitnessExpiry: application.fitnessExpiry, pollutionExpiry: application.pollutionExpiry, acAvailable: application.acAvailable, luggageCapacity: application.luggageCapacity, vehicleColor: application.vehicleColor, isApproved: true, isActive: false, dispatchEnabled: false, approvedAt: now, approvedBy: reviewer.uid, createdAt: now, updatedAt: now }, { merge: true });
      }
      transaction.update(applicationRef, { status, reviewedBy: reviewer.uid, reviewedAt: now, updatedAt: now, reviewNotes: notes, rejectionReason: status === "rejected" ? notes : "", changeRequests: status === "needs_changes" ? [notes] : [], reviewHistory: FieldValue.arrayUnion({ status, notes, reviewedBy: reviewer.uid, reviewedAt: new Date().toISOString() }) });
      transaction.set(db.collection("users").doc(application.ownerUid), { applicationStatus: status, updatedAt: now }, { merge: true });
      const notificationType = status === "under_review" ? "application_under_review" : status === "needs_changes" ? "application_needs_changes" : status === "approved" ? "application_approved" : "application_rejected";
      const title = status === "under_review" ? "Vehicle application under review" : status === "needs_changes" ? "Vehicle application needs changes" : status === "approved" ? "Vehicle application approved" : "Vehicle application update";
      const message = status === "approved" ? "Your vehicle application was approved. The vehicle remains inactive until operational activation." : status === "needs_changes" ? notes : status === "rejected" ? notes : "An administrator is reviewing your vehicle application.";
      setNotification(transaction, db, { recipientUid: application.ownerUid, recipientRole: "fleet_owner", title, message, type: notificationType, eventKey: `vehicle_application:${applicationId}:${status}`, actionUrl: "/fleet/onboarding", metadata: { applicationId, status }, createdBy: reviewer.uid, source: "vehicle_application_review" });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "UNAUTHENTICATED" ? 401 : ["FORBIDDEN", "SELF_REVIEW"].includes(code) ? 403 : code === "NOT_FOUND" ? 404 : ["DUPLICATE_REGISTRATION", "TERMINAL_STATUS"].includes(code) ? 409 : 500;
    if (status === 500) console.error("Vehicle application review failed:", error);
    const message = code === "DUPLICATE_REGISTRATION" ? "That registration already belongs to another approved vehicle." : code === "TERMINAL_STATUS" ? "Approved and rejected applications are final." : status === 401 ? "Please login again." : status === 403 ? "Admin review access required." : status === 404 ? "Application not found." : "Unable to review application.";
    return NextResponse.json({ message }, { status });
  }
}
