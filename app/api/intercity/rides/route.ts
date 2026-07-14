import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LocationInput {
  address?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}

interface PublishRideRequest {
  origin?: LocationInput;
  destination?: LocationInput;
  departureAt?: string;
  totalSeats?: number;
  pricePerSeat?: number;
  luggageAllowed?: boolean;
  womenOnly?: boolean;
  instantBooking?: boolean;
  notes?: string;
}

function normalizeLocation(location: LocationInput | undefined, order: number) {
  const address = location?.address?.trim() ?? "";
  const placeId = location?.placeId?.trim() ?? "";
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!address || !placeId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Select valid origin and destination locations.");
  }

  return { address, placeId, latitude, longitude, order };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = url.searchParams.get("origin")?.trim().toLowerCase() ?? "";
    const destination = url.searchParams.get("destination")?.trim().toLowerCase() ?? "";
    const departureDate = url.searchParams.get("date")?.trim() ?? "";
    const seats = Math.max(1, Math.min(6, Number(url.searchParams.get("seats") ?? 1)));
    const snapshot = await getAdminDb()
      .collection("intercityRides")
      .where("status", "in", ["published", "full"])
      .limit(100)
      .get();

    const rides = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }))
      .filter((ride) => {
        const data = ride as Record<string, unknown>;
        const originAddress = String((data.origin as { address?: string })?.address ?? "").toLowerCase();
        const destinationAddress = String((data.destination as { address?: string })?.address ?? "").toLowerCase();
        const departureAt = data.departureAt as Timestamp | undefined;
        const matchesDate = !departureDate || departureAt?.toDate().toISOString().slice(0, 10) === departureDate;
        return (!origin || originAddress.includes(origin))
          && (!destination || destinationAddress.includes(destination))
          && matchesDate
          && Number(data.availableSeats ?? 0) >= seats
          && Boolean(departureAt && departureAt.toMillis() > Date.now());
      })
      .map((ride) => {
        const data = ride as Record<string, unknown>;
        const departureAt = data.departureAt as Timestamp;
        return { ...ride, departureAt: departureAt.toDate().toISOString() };
      });

    return NextResponse.json({ rides });
  } catch (error) {
    console.error("Intercity search failed:", error);
    return NextResponse.json({ message: "Unable to search intercity rides." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as PublishRideRequest;
    const db = getAdminDb();
    const driverSnapshot = await db.collection("drivers").doc(user.uid).get();

    if (!driverSnapshot.exists) {
      return NextResponse.json({ message: "Driver profile not found." }, { status: 403 });
    }

    const driver = driverSnapshot.data() ?? {};
    if (driver.isApproved === false) {
      return NextResponse.json({ message: "Driver approval is required before publishing rides." }, { status: 403 });
    }

    const vehicleSeats = Number(driver.vehicleSeats ?? 0);
    const totalSeats = Math.floor(Number(body.totalSeats));
    const pricePerSeat = Math.round(Number(body.pricePerSeat));
    const departureAt = new Date(body.departureAt ?? "");

    if (!driver.vehicleId || !driver.vehicleNumber || vehicleSeats < 2) {
      return NextResponse.json({ message: "Complete vehicle details before publishing a ride." }, { status: 409 });
    }

    if (!Number.isInteger(totalSeats) || totalSeats < 1 || totalSeats > Math.min(6, vehicleSeats - 1)) {
      return NextResponse.json({ message: "Available seats exceed vehicle capacity." }, { status: 400 });
    }

    if (!Number.isFinite(pricePerSeat) || pricePerSeat < 50 || pricePerSeat > 10000) {
      return NextResponse.json({ message: "Price per seat must be between ₹50 and ₹10,000." }, { status: 400 });
    }

    if (Number.isNaN(departureAt.getTime()) || departureAt.getTime() < Date.now() + 60 * 60 * 1000) {
      return NextResponse.json({ message: "Departure must be at least one hour from now." }, { status: 400 });
    }

    const origin = normalizeLocation(body.origin, 0);
    const destination = normalizeLocation(body.destination, 1);
    if (origin.placeId === destination.placeId) {
      return NextResponse.json({ message: "Origin and destination cannot be the same." }, { status: 400 });
    }

    const rideReference = await db.collection("intercityRides").add({
      driverId: user.uid,
      driverName: String(driver.name ?? user.name ?? "Velora Driver"),
      driverPhotoURL: String(driver.photoURL ?? ""),
      driverRating: Number(driver.rating ?? driver.averageRating ?? 0),
      vehicleId: String(driver.vehicleId),
      vehicleName: String(driver.vehicleName ?? driver.vehicleModel ?? "Vehicle"),
      vehicleNumber: String(driver.vehicleNumber),
      vehicleSeats,
      origin,
      destination,
      stops: [],
      departureAt: Timestamp.fromDate(departureAt),
      totalSeats,
      availableSeats: totalSeats,
      pricePerSeat,
      status: "published",
      luggageAllowed: body.luggageAllowed !== false,
      womenOnly: body.womenOnly === true,
      instantBooking: body.instantBooking === true,
      notes: String(body.notes ?? "").trim().slice(0, 500),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, rideId: rideReference.id }, { status: 201 });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    const message = error instanceof Error && !unauthenticated ? error.message : "Unable to publish intercity ride.";
    return NextResponse.json({ message: unauthenticated ? "Please login as a driver." : message }, { status: unauthenticated ? 401 : 500 });
  }
}
