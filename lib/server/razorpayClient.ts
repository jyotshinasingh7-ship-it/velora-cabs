import "server-only";

import Razorpay from "razorpay";

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_CONFIGURATION_MISSING");
  }
  if (
    (process.env.VERCEL_ENV === "preview"
      || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "velora-cabs-staging")
    && !keyId.startsWith("rzp_test_")
  ) {
    throw new Error("RAZORPAY_PREVIEW_REQUIRES_TEST_KEY");
  }
  return { keyId, keySecret };
}
export function getRazorpayWebhookSecret() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_CONFIGURATION_MISSING");
  return secret;
}

export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
