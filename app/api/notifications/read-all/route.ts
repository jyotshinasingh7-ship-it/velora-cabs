import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const db = getAdminDb();
    let updated = 0;
    while (true) {
      const snapshot = await db.collection("notifications").where("recipientUid", "==", user.uid).where("isRead", "==", false).limit(400).get();
      if (snapshot.empty) break;
      const batch = db.batch();
      snapshot.docs.forEach(document => batch.update(document.ref, { isRead: true, readAt: FieldValue.serverTimestamp() }));
      await batch.commit();
      updated += snapshot.size;
      if (snapshot.size < 400) break;
    }
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    return NextResponse.json({ message: unauthenticated ? "Please login again." : "Unable to update notifications." }, { status: unauthenticated ? 401 : 500 });
  }
}
