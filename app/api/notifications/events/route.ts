import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { createNotification } from "@/lib/server/notifications";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
type EventName = "booking_created" | "driver_assigned" | "driver_application_submitted" | "vehicle_application_submitted";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json() as { event?: EventName; documentId?: string };
    const documentId = body.documentId?.trim() ?? "";
    if (!body.event || !documentId) return NextResponse.json({ message: "Notification event information is missing." }, { status: 400 });
    const db = getAdminDb();

    if (body.event === "booking_created" || body.event === "driver_assigned") {
      const snapshot = await db.collection("bookings").doc(documentId).get();
      if (!snapshot.exists) return NextResponse.json({ message: "Booking not found." }, { status: 404 });
      const booking = snapshot.data() ?? {};
      if (body.event === "booking_created") {
        if (booking.customerId !== user.uid && booking.userId !== user.uid) throw new Error("FORBIDDEN");
        await createNotification({ recipientUid: user.uid, recipientRole: "customer", title: "Booking confirmed", message: `Your ride ${String(booking.bookingId ?? documentId)} has been created successfully.`, type: "booking_created", eventKey: `booking:${documentId}:created`, actionUrl: "/dashboard", metadata: { bookingDocumentId: documentId, bookingId: booking.bookingId ?? documentId }, source: "booking" });
      } else {
        if (booking.driverId !== user.uid || String(booking.rideStatus ?? booking.status).toLowerCase() !== "driver_assigned") throw new Error("FORBIDDEN");
        const customerUid = String(booking.customerId ?? booking.userId ?? "");
        await createNotification({ recipientUid: customerUid, recipientRole: "customer", title: "Driver assigned", message: `${String(booking.driverName ?? "Your driver")} has accepted your ride.`, type: "driver_assigned", eventKey: `booking:${documentId}:driver_assigned`, actionUrl: "/dashboard", metadata: { bookingDocumentId: documentId, driverId: user.uid }, source: "ride_lifecycle" });
      }
    } else if (body.event === "driver_application_submitted") {
      const snapshot = await db.collection("driverApplications").doc(documentId).get();
      if (snapshot.data()?.applicantUid !== user.uid || snapshot.data()?.status !== "submitted") throw new Error("FORBIDDEN");
      await createNotification({ recipientUid: user.uid, recipientRole: "customer", title: "Driver application submitted", message: "Your driver application has been submitted for review.", type: "application_submitted", eventKey: `driver_application:${documentId}:submitted:${snapshot.data()?.submittedAt?.toMillis?.() ?? "current"}`, actionUrl: "/driver/onboarding", metadata: { applicationId: documentId }, source: "driver_onboarding" });
    } else {
      const snapshot = await db.collection("vehicleOwnerApplications").doc(documentId).get();
      if (snapshot.data()?.ownerUid !== user.uid || snapshot.data()?.status !== "submitted") throw new Error("FORBIDDEN");
      await createNotification({ recipientUid: user.uid, recipientRole: "fleet_owner", title: "Vehicle application submitted", message: "Your vehicle application has been submitted for review.", type: "application_submitted", eventKey: `vehicle_application:${documentId}:submitted:${snapshot.data()?.submittedAt?.toMillis?.() ?? "current"}`, actionUrl: "/fleet/onboarding", metadata: { applicationId: documentId }, source: "vehicle_onboarding" });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ message: code === "UNAUTHENTICATED" ? "Please login again." : code === "FORBIDDEN" ? "Notification event verification failed." : "Unable to create notification." }, { status: code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 500 });
  }
}
