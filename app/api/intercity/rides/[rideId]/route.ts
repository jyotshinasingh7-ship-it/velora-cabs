import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/server/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rideId: string }> }
) {
  try {
    const { rideId } = await params;
    const snapshot = await getAdminDb().collection("intercityRides").doc(rideId).get();

    if (!snapshot.exists) {
      return NextResponse.json({ message: "Intercity ride not found." }, { status: 404 });
    }

    const data = snapshot.data() ?? {};
    const departureAt = data.departureAt as Timestamp | undefined;
    return NextResponse.json({
      ride: {
        id: snapshot.id,
        ...data,
        departureAt: departureAt?.toDate().toISOString() ?? null,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });
  } catch (error) {
    console.error("Intercity ride load failed:", error);
    return NextResponse.json({ message: "Unable to load intercity ride." }, { status: 500 });
  }
}
