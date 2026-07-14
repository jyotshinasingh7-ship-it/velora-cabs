import "server-only";

import { calculateRideFare, isNightRide } from "@/lib/ride/pricing";
import { getAdminDb } from "@/lib/server/firebaseAdmin";

type BookingData = Record<string, unknown>;

function finiteNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function bookingDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  return new Date();
}

function indiaHour(date: Date) {
  return Number(new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(date));
}

async function authoritativeRoute(booking: BookingData) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
  if (!key) throw new Error("PAYMENT_ROUTE_VERIFICATION_NOT_CONFIGURED");

  const pickupPlaceId = String(booking.pickupPlaceId ?? "").trim();
  const dropoffPlaceId = String(booking.dropoffPlaceId ?? "").trim();
  if (!pickupPlaceId || !dropoffPlaceId) throw new Error("BOOKING_ROUTE_MISSING");

  const query = new URLSearchParams({
    origin: `place_id:${pickupPlaceId}`,
    destination: `place_id:${dropoffPlaceId}`,
    mode: "driving",
    key,
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("PAYMENT_ROUTE_LOOKUP_FAILED");
  const result = (await response.json()) as {
    status?: string;
    routes?: Array<{ legs?: Array<{ distance?: { value?: number }; duration?: { value?: number } }> }>;
  };
  const leg = result.routes?.[0]?.legs?.[0];
  const distanceMeters = finiteNumber(leg?.distance?.value);
  const durationSeconds = finiteNumber(leg?.duration?.value);
  if (result.status !== "OK" || distanceMeters <= 0 || durationSeconds <= 0) {
    throw new Error("PAYMENT_ROUTE_LOOKUP_FAILED");
  }
  return { distanceMeters, durationSeconds };
}

export async function calculateAuthoritativePayment(booking: BookingData) {
  const vehicleType = String(booking.vehicleType ?? "").trim();
  if (!vehicleType) throw new Error("BOOKING_VEHICLE_MISSING");
  const pricingSnapshot = await getAdminDb().collection("settings").doc(vehicleType).get();
  if (!pricingSnapshot.exists) throw new Error("PAYMENT_PRICING_NOT_FOUND");
  const pricing = pricingSnapshot.data() ?? {};
  if (pricing.enabled === false) throw new Error("PAYMENT_PRICING_NOT_AVAILABLE");

  const route = await authoritativeRoute(booking);
  const multiplier = String(booking.serviceType ?? "") === "outstation" && String(booking.tripType ?? "") === "round_trip" ? 2 : 1;
  const rideDate = bookingDate(booking.scheduledAt);
  const result = calculateRideFare({
    baseFare: finiteNumber(pricing.baseFare),
    perKm: finiteNumber(pricing.perKm),
    perMinute: finiteNumber(pricing.perMinute),
    distanceKm: (route.distanceMeters / 1000) * multiplier,
    durationMinutes: (route.durationSeconds / 60) * multiplier,
    minimumKm: Math.max(1, finiteNumber(pricing.minimumKm, 1)),
    minimumFare: finiteNumber(pricing.minimumFare),
    platformCharge: finiteNumber(pricing.platformCharge),
    gstPercentage: finiteNumber(pricing.gst),
    isNightRide: isNightRide(indiaHour(rideDate)),
    nightCharge: finiteNumber(pricing.nightCharge),
    tollCharge: 0,
    parkingCharge: 0,
    waitingMinutes: 0,
    freeWaitingMinutes: 0,
    waitingChargePerMinute: finiteNumber(pricing.waitingCharge),
    driverAllowance: finiteNumber(pricing.driverAllowance),
    driverAllowanceApplicable: String(booking.serviceType ?? "") === "outstation",
  });
  if (result.finalFare <= 0) throw new Error("PAYMENT_AMOUNT_INVALID");
  return {
    amountInPaise: Math.round(result.finalFare * 100),
    payableFare: result.finalFare,
    fareBreakdown: result,
    routeDistanceMeters: route.distanceMeters * multiplier,
    routeDurationSeconds: route.durationSeconds * multiplier,
  };
}
