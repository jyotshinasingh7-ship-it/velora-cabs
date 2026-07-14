import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ notificationId: string }> }) {
  try {
    const user = await requireUser(request);
    const { notificationId } = await context.params;
    const reference = getAdminDb().collection("notifications").doc(notificationId);
    await getAdminDb().runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      if (snapshot.data()?.recipientUid !== user.uid) throw new Error("FORBIDDEN");
      if (snapshot.data()?.isRead !== true) transaction.update(reference, { isRead: true, readAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ message: code === "UNAUTHENTICATED" ? "Please login again." : code === "NOT_FOUND" ? "Notification not found." : "You cannot update this notification." }, { status: code === "UNAUTHENTICATED" ? 401 : code === "NOT_FOUND" ? 404 : 403 });
  }
}
