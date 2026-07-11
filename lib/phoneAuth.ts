import {
  browserLocalPersistence,
  type ConfirmationResult,
  RecaptchaVerifier,
  setPersistence,
  signInWithPhoneNumber,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export type PhoneAccountType =
  | "customer"
  | "driver"
  | "partner";

let recaptchaVerifier: RecaptchaVerifier | null = null;

function normalizeIndianPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return `+${digits}`;
  }

  throw new Error("auth/invalid-phone-number");
}

function getDefaultApplicationStatus(
  accountType: PhoneAccountType
) {
  return accountType === "customer"
    ? "not_required"
    : "not_started";
}

export function setupRecaptcha(
  containerId: string
) {
  if (typeof window === "undefined") {
    throw new Error(
      "auth/recaptcha-client-only"
    );
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new RecaptchaVerifier(
    auth,
    containerId,
    {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved automatically.
      },
      "expired-callback": () => {
        clearPhoneRecaptcha();
      },
    }
  );

  return recaptchaVerifier;
}

export async function sendPhoneOtp({
  phoneNumber,
  recaptchaContainerId,
}: {
  phoneNumber: string;
  recaptchaContainerId: string;
}): Promise<ConfirmationResult> {
  await setPersistence(
    auth,
    browserLocalPersistence
  );

  const formattedPhoneNumber =
    normalizeIndianPhoneNumber(phoneNumber);

  const verifier = setupRecaptcha(
    recaptchaContainerId
  );

  try {
    await verifier.render();

    return await signInWithPhoneNumber(
      auth,
      formattedPhoneNumber,
      verifier
    );
  } catch (error) {
    clearPhoneRecaptcha();
    throw error;
  }
}

export async function verifyPhoneOtp({
  confirmationResult,
  otp,
  accountType,
  fullName,
}: {
  confirmationResult: ConfirmationResult;
  otp: string;
  accountType: PhoneAccountType;
  fullName?: string;
}) {
  const cleanOtp = otp.replace(/\D/g, "");

  if (cleanOtp.length !== 6) {
    throw new Error(
      "auth/invalid-verification-code"
    );
  }

  const credential =
    await confirmationResult.confirm(cleanOtp);

  await createOrUpdatePhoneUserProfile({
    user: credential.user,
    accountType,
    fullName,
  });

  clearPhoneRecaptcha();

  return credential.user;
}

async function createOrUpdatePhoneUserProfile({
  user,
  accountType,
  fullName,
}: {
  user: User;
  accountType: PhoneAccountType;
  fullName?: string;
}) {
  const userReference = doc(
    db,
    "users",
    user.uid
  );

  const existingSnapshot = await getDoc(
    userReference
  );

  const cleanName =
    fullName?.trim() ||
    user.displayName?.trim() ||
    "Velora User";

  const commonData = {
    uid: user.uid,
    name: cleanName,
    phoneNumber: user.phoneNumber ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    provider: "phone",
    phoneVerified: true,
    emailVerified: user.emailVerified,
    isActive: true,
    updatedAt: serverTimestamp(),
  };

  if (existingSnapshot.exists()) {
    await setDoc(
      userReference,
      commonData,
      {
        merge: true,
      }
    );

    return;
  }

  await setDoc(userReference, {
    ...commonData,

    role: "customer",

    accountType,
    onboardingIntent: accountType,

    applicationStatus:
      getDefaultApplicationStatus(
        accountType
      ),

    createdAt: serverTimestamp(),
  });
}

export async function getPhoneRedirectPath(
  uid: string
) {
  const userReference = doc(
    db,
    "users",
    uid
  );

  const userSnapshot = await getDoc(
    userReference
  );

  if (!userSnapshot.exists()) {
    return "/dashboard";
  }

  const data = userSnapshot.data();

  if (data.isActive === false) {
    return "/login?error=account-disabled";
  }

  if (data.role === "admin") {
    return "/admin/dashboard";
  }

  if (data.role === "driver") {
    return "/driver/dashboard";
  }

  if (data.role === "partner") {
    return "/partner/dashboard";
  }

  if (
    data.accountType === "driver" &&
    data.applicationStatus !== "approved"
  ) {
    return "/earn/driver";
  }

  if (
    data.accountType === "partner" &&
    data.applicationStatus !== "approved"
  ) {
    return "/earn/vehicle";
  }

  return "/dashboard";
}

export function clearPhoneRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  if (typeof document !== "undefined") {
    const container = document.getElementById(
      "phone-recaptcha-container"
    );

    if (container) {
      container.innerHTML = "";
    }
  }
}

export function getPhoneAuthErrorMessage(
  error: unknown
) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown })
      .code === "string"
      ? (error as { code: string }).code
      : error instanceof Error
        ? error.message
        : "";

  const messages: Record<string, string> = {
    "auth/invalid-phone-number":
      "Enter a valid 10-digit Indian phone number.",

    "auth/missing-phone-number":
      "Please enter your phone number.",

    "auth/invalid-verification-code":
      "The OTP is incorrect. Please enter the 6-digit code again.",

    "auth/missing-verification-code":
      "Please enter the OTP sent to your phone.",

    "auth/code-expired":
      "This OTP has expired. Please request a new OTP.",

    "auth/session-expired":
      "This OTP session has expired. Please request a new OTP.",

    "auth/too-many-requests":
      "Too many attempts. Please wait before trying again.",

    "auth/quota-exceeded":
      "SMS limit has been reached. Please try again later.",

    "auth/captcha-check-failed":
      "Security verification failed. Please try again.",

    "auth/missing-app-credential":
      "Security verification could not start. Refresh and try again.",

    "auth/operation-not-allowed":
      "Phone login is not enabled in Firebase Authentication.",

    "auth/network-request-failed":
      "Network error. Check your internet connection.",

    "auth/user-disabled":
      "This account has been disabled.",

    "auth/unauthorized-domain":
      "This website domain is not authorized for phone authentication.",

    "auth/recaptcha-client-only":
      "Phone authentication is available only in the browser.",
  };

  return (
    messages[code] ||
    "Phone authentication failed. Please try again."
  );
}