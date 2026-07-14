import { createHash, randomInt } from "crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";
import { setNotification } from "@/lib/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

function createOtp() {
  const otp = randomInt(100000, 1000000).toString();
  return { otp, hash: hashOtp(otp) };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const bookingDocumentId = new URL(request.url).searchParams.get("bookingDocumentId")?.trim();

    if (!bookingDocumentId) return NextResponse.json({ message: "Booking information is missing." }, { status: 400 });

    const db = getAdminDb();
    const [bookingSnapshot, secretSnapshot] = await Promise.all([
      db.collection("bookings").doc(bookingDocumentId).get(),
      db.collection("rideOtpSecrets").doc(bookingDocumentId).get(),
    ]);

    if (!bookingSnapshot.exists) return NextResponse.json({ message: "Booking not found." }, { status: 404 });

    const booking = bookingSnapshot.data() ?? {};
    if (booking.customerId !== user.uid && booking.userId !== user.uid) {
      return NextResponse.json({ message: "You cannot view this OTP." }, { status: 403 });
    }

    const status = String(booking.rideStatus ?? booking.status ?? "").toLowerCase();
    const secrets = secretSnapshot.data() ?? {};
    const otp = status === "start_otp_pending" ? secrets.startOtp : status === "stop_otp_pending" ? secrets.stopOtp : "";

    return NextResponse.json({ otp: String(otp ?? "") });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    return NextResponse.json({ message: unauthenticated ? "Please login again." : "Unable to load ride OTP." }, { status: unauthenticated ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as {
      bookingDocumentId?: string;
      action?: "arrived" | "request_end" | "verify_start" | "verify_end";
      otp?: string;
    };
    const bookingDocumentId = body.bookingDocumentId?.trim();

    if (!bookingDocumentId || !body.action) return NextResponse.json({ message: "Ride action is missing." }, { status: 400 });

    const db = getAdminDb();
    const bookingReference = db.collection("bookings").doc(bookingDocumentId);
    const secretReference = db.collection("rideOtpSecrets").doc(bookingDocumentId);
    const driverReference = db.collection("drivers").doc(user.uid);

    const result = await db.runTransaction(async (transaction) => {
      const [bookingSnapshot, driverSnapshot] = await Promise.all([
        transaction.get(bookingReference),
        transaction.get(driverReference),
      ]);

      if (!bookingSnapshot.exists || !driverSnapshot.exists) throw new Error("Ride or driver not found.");
      const booking = bookingSnapshot.data() ?? {};
      const status = String(booking.rideStatus ?? booking.status ?? "").toLowerCase();
      if (booking.driverId !== user.uid) throw new Error("This ride is not assigned to you.");

      if (body.action === "arrived") {
        if (!["driver_assigned", "driver_arriving", "driver_arrived"].includes(status)) throw new Error("Arrival cannot be marked now.");
        const generated = createOtp();
        transaction.set(secretReference, { startOtp: generated.otp, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        transaction.update(bookingReference, {
          rideStatus: "start_otp_pending", status: "start_otp_pending",
          startOtpHash: generated.hash, "otp.startOtpHash": generated.hash,
          startOtpVerified: false, "otp.startOtpVerified": false,
          startOtpAttempts: 0, "otp.startOtpAttempts": 0,
          arrivedAt: FieldValue.serverTimestamp(), "timeline.arrivedAt": FieldValue.serverTimestamp(),
          pickupEtaMinutes: 0, driverDistanceToPickupKm: 0, updatedAt: FieldValue.serverTimestamp(),
        });
        const customerUid = String(booking.customerId ?? booking.userId ?? "");
        setNotification(transaction, db, { recipientUid: customerUid, recipientRole: "customer", title: "Driver arrived", message: "Your driver has reached the pickup location.", type: "driver_arrived", eventKey: `booking:${bookingDocumentId}:driver_arrived`, actionUrl: "/dashboard", metadata: { bookingDocumentId }, source: "ride_lifecycle" });
        return;
      }

      if (body.action === "request_end") {
        if (status !== "in_progress") throw new Error("Ride completion cannot be requested now.");
        const generated = createOtp();
        transaction.set(secretReference, { stopOtp: generated.otp, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        transaction.update(bookingReference, {
          rideStatus: "stop_otp_pending", status: "stop_otp_pending",
          stopOtpHash: generated.hash, "otp.stopOtpHash": generated.hash,
          stopOtpVerified: false, "otp.stopOtpVerified": false,
          stopOtpAttempts: 0, "otp.stopOtpAttempts": 0, updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      const type = body.action === "verify_start" ? "start" : "stop";
      const expectedStatus = type === "start" ? "start_otp_pending" : "stop_otp_pending";
      if (status !== expectedStatus) throw new Error("OTP is not required at this stage.");
      if (!/^\d{6}$/.test(body.otp ?? "")) throw new Error("Enter a valid 6-digit OTP.");

      const bookingHash = String(type === "start" ? booking.otp?.startOtpHash ?? booking.startOtpHash ?? "" : booking.otp?.stopOtpHash ?? booking.stopOtpHash ?? "");
      const attempts = Number(type === "start" ? booking.otp?.startOtpAttempts ?? booking.startOtpAttempts ?? 0 : booking.otp?.stopOtpAttempts ?? booking.stopOtpAttempts ?? 0);
      if (attempts >= 5) throw new Error("Maximum OTP attempts reached.");

      if (!bookingHash || hashOtp(body.otp ?? "") !== bookingHash) {
        transaction.update(bookingReference, type === "start"
          ? { startOtpAttempts: attempts + 1, "otp.startOtpAttempts": attempts + 1, updatedAt: FieldValue.serverTimestamp() }
          : { stopOtpAttempts: attempts + 1, "otp.stopOtpAttempts": attempts + 1, updatedAt: FieldValue.serverTimestamp() });
        return "incorrect_otp";
      }

      if (type === "start") {
        transaction.update(bookingReference, {
          rideStatus: "in_progress", status: "in_progress", startOtpVerified: true,
          "otp.startOtpVerified": true, startedAt: FieldValue.serverTimestamp(),
          "timeline.startedAt": FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(secretReference, { startOtp: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        const customerUid = String(booking.customerId ?? booking.userId ?? "");
        setNotification(transaction, db, { recipientUid: customerUid, recipientRole: "customer", title: "Ride started", message: "Your Velora ride is now in progress.", type: "ride_started", eventKey: `booking:${bookingDocumentId}:started`, actionUrl: "/dashboard", metadata: { bookingDocumentId }, source: "ride_lifecycle" });
      } else {
        const cashPayment = String(booking.paymentMethod ?? "").toLowerCase() === "cash";
        transaction.update(bookingReference, {
          rideStatus: "completed", status: "completed", stopOtpVerified: true,
          "otp.stopOtpVerified": true, completedAt: FieldValue.serverTimestamp(),
          "timeline.completedAt": FieldValue.serverTimestamp(),
          ...(cashPayment ? {
            paymentStatus: "paid",
            paidAmount: Number(booking.payableFare ?? 0),
            paidAt: FieldValue.serverTimestamp(),
            cashCollectedAt: FieldValue.serverTimestamp(),
          } : {}),
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(driverReference, {
          status: "online", isOnline: true, activeRideId: "", incomingRideId: "",
          rideRequestStatus: "", totalRides: FieldValue.increment(1), todayTrips: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(secretReference, { stopOtp: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        const customerUid = String(booking.customerId ?? booking.userId ?? "");
        setNotification(transaction, db, { recipientUid: customerUid, recipientRole: "customer", title: "Ride completed", message: "Your ride is complete. Thank you for choosing Velora.", type: "ride_completed", eventKey: `booking:${bookingDocumentId}:completed`, actionUrl: "/dashboard", metadata: { bookingDocumentId }, source: "ride_lifecycle" });
        if (cashPayment) setNotification(transaction, db, { recipientUid: customerUid, recipientRole: "customer", title: "Cash payment recorded", message: "Your cash payment was recorded successfully.", type: "payment_success", eventKey: `booking:${bookingDocumentId}:cash_payment_success`, actionUrl: "/dashboard", metadata: { bookingDocumentId, paymentMethod: "cash" }, source: "ride_lifecycle" });
      }
      return "success";
    });

    if (result === "incorrect_otp") {
      return NextResponse.json({ message: "Incorrect OTP." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update ride.";
    return NextResponse.json({ message: message === "UNAUTHENTICATED" ? "Please login again." : message }, { status: message === "UNAUTHENTICATED" ? 401 : 409 });
  }
}
