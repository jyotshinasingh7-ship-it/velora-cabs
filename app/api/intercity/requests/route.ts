import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const scope = new URL(request.url).searchParams.get("scope") === "driver" ? "driverId" : "passengerId";
    const snapshot = await getAdminDb().collection("intercitySeatRequests").where(scope, "==", user.uid).limit(100).get();
    const requests = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    return NextResponse.json({ requests });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    return NextResponse.json({ message: unauthenticated ? "Please login again." : "Unable to load seat requests." }, { status: unauthenticated ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { rideId?: string; seatsRequested?: number };
    const rideId = body.rideId?.trim();
    const seatsRequested = Math.floor(Number(body.seatsRequested));

    if (!rideId || !Number.isInteger(seatsRequested) || seatsRequested < 1 || seatsRequested > 6) {
      return NextResponse.json({ message: "Select a valid number of seats." }, { status: 400 });
    }

    const db = getAdminDb();
    const rideReference = db.collection("intercityRides").doc(rideId);
    const requestReference = db.collection("intercitySeatRequests").doc(`${rideId}_${user.uid}`);

    const result = await db.runTransaction(async (transaction) => {
      const [rideSnapshot, existingRequestSnapshot, userSnapshot] = await Promise.all([
        transaction.get(rideReference),
        transaction.get(requestReference),
        transaction.get(db.collection("users").doc(user.uid)),
      ]);

      if (!rideSnapshot.exists) throw new Error("Intercity ride not found.");
      const ride = rideSnapshot.data() ?? {};
      const existing = existingRequestSnapshot.data() ?? {};
      const passenger = userSnapshot.data() ?? {};
      const status = String(ride.status ?? "");

      if (ride.driverId === user.uid) throw new Error("You cannot request seats on your own ride.");
      if (!["published", "full"].includes(status)) throw new Error("This ride is no longer accepting requests.");
      if (["pending", "accepted"].includes(String(existing.status ?? ""))) throw new Error("You already have an active request for this ride.");
      if (Number(ride.availableSeats ?? 0) < seatsRequested) throw new Error("Requested seats are no longer available.");

      const accepted = ride.instantBooking === true;
      const amount = seatsRequested * Number(ride.pricePerSeat ?? 0);
      const requestData = {
        rideId,
        driverId: String(ride.driverId),
        passengerId: user.uid,
        passengerName: String(passenger.name ?? user.name ?? "Velora Passenger"),
        passengerPhone: String(passenger.phoneNumber ?? user.phone_number ?? ""),
        seatsRequested,
        amount,
        status: accepted ? "accepted" : "pending",
        pickupStop: ride.origin,
        dropoffStop: ride.destination,
        paymentStatus: "pending",
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(requestReference, {
        ...requestData,
        createdAt: FieldValue.serverTimestamp(),
      });

      if (accepted) {
        const remainingSeats = Number(ride.availableSeats) - seatsRequested;
        transaction.update(rideReference, {
          availableSeats: remainingSeats,
          status: remainingSeats === 0 ? "full" : "published",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return accepted ? "accepted" : "pending";
    });

    return NextResponse.json({ success: true, status: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to request seats.";
    return NextResponse.json({ message: message === "UNAUTHENTICATED" ? "Please login before requesting seats." : message }, { status: message === "UNAUTHENTICATED" ? 401 : 409 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { requestId?: string; action?: "accept" | "reject" };
    const requestId = body.requestId?.trim();

    if (!requestId || !["accept", "reject"].includes(body.action ?? "")) {
      return NextResponse.json({ message: "Valid request action is required." }, { status: 400 });
    }

    const db = getAdminDb();
    const requestReference = db.collection("intercitySeatRequests").doc(requestId);

    await db.runTransaction(async (transaction) => {
      const requestSnapshot = await transaction.get(requestReference);
      if (!requestSnapshot.exists) throw new Error("Seat request not found.");
      const seatRequest = requestSnapshot.data() ?? {};
      if (seatRequest.driverId !== user.uid) throw new Error("You cannot manage this request.");
      if (seatRequest.status !== "pending") throw new Error("This request has already been processed.");

      const rideReference = db.collection("intercityRides").doc(String(seatRequest.rideId));
      const rideSnapshot = await transaction.get(rideReference);
      if (!rideSnapshot.exists) throw new Error("Intercity ride not found.");
      const ride = rideSnapshot.data() ?? {};

      if (body.action === "reject") {
        transaction.update(requestReference, { status: "rejected", respondedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        return;
      }

      const requested = Number(seatRequest.seatsRequested ?? 0);
      const available = Number(ride.availableSeats ?? 0);
      if (requested < 1 || available < requested) throw new Error("Enough seats are no longer available.");
      const remaining = available - requested;
      transaction.update(requestReference, { status: "accepted", respondedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      transaction.update(rideReference, { availableSeats: remaining, status: remaining === 0 ? "full" : "published", updatedAt: FieldValue.serverTimestamp() });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update seat request.";
    return NextResponse.json({ message: message === "UNAUTHENTICATED" ? "Please login again." : message }, { status: message === "UNAUTHENTICATED" ? 401 : 409 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const requestId = new URL(request.url).searchParams.get("requestId")?.trim();
    if (!requestId) {
      return NextResponse.json({ message: "Seat request is missing." }, { status: 400 });
    }

    const db = getAdminDb();
    const requestReference = db.collection("intercitySeatRequests").doc(requestId);

    await db.runTransaction(async (transaction) => {
      const requestSnapshot = await transaction.get(requestReference);
      if (!requestSnapshot.exists) throw new Error("Seat request not found.");
      const seatRequest = requestSnapshot.data() ?? {};
      if (seatRequest.passengerId !== user.uid) throw new Error("You cannot cancel this request.");
      if (!["pending", "accepted"].includes(String(seatRequest.status ?? ""))) throw new Error("This request can no longer be cancelled.");

      const rideReference = db.collection("intercityRides").doc(String(seatRequest.rideId));
      const rideSnapshot = await transaction.get(rideReference);
      if (!rideSnapshot.exists) throw new Error("Intercity ride not found.");
      const ride = rideSnapshot.data() ?? {};
      const departureAt = ride.departureAt;
      if (departureAt?.toMillis && departureAt.toMillis() <= Date.now()) throw new Error("Started rides cannot be cancelled.");

      transaction.update(requestReference, {
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (seatRequest.status === "accepted") {
        transaction.update(rideReference, {
          availableSeats: Math.min(
            Number(ride.totalSeats ?? 0),
            Number(ride.availableSeats ?? 0) + Number(seatRequest.seatsRequested ?? 0)
          ),
          status: "published",
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel seat request.";
    return NextResponse.json({ message: message === "UNAUTHENTICATED" ? "Please login again." : message }, { status: message === "UNAUTHENTICATED" ? 401 : 409 });
  }
}
