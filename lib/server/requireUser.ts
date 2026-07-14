import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/server/firebaseAdmin";

export async function requireUser(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("UNAUTHENTICATED");
  }

  try {
    return await getAdminAuth().verifyIdToken(token, true);
  } catch {
    throw new Error("UNAUTHENTICATED");
  }
}
