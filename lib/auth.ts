import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";

import { auth, db, googleProvider } from "@/lib/firebase";

export type UserRole = "customer" | "driver" | "admin";
export type AuthProviderType = "password" | "google" | "phone";

export interface AppUserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  role: UserRole;
  provider: AuthProviderType;
  emailVerified: boolean;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface CreateProfileOptions {
  user: User;
  provider: AuthProviderType;
  name?: string;
  role?: UserRole;
}

interface EmailSignupInput {
  fullName: string;
  email: string;
  password: string;
}

interface EmailLoginInput {
  email: string;
  password: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function initializeAuthPersistence() {
  await setPersistence(auth, browserLocalPersistence);
}

export async function getUserProfile(
  uid: string
): Promise<AppUserProfile | null> {
  const userReference = doc(db, "users", uid);
  const userSnapshot = await getDoc(userReference);

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.data() as AppUserProfile;
}

export async function createOrUpdateUserProfile({
  user,
  provider,
  name,
  role = "customer",
}: CreateProfileOptions) {
  const userReference = doc(db, "users", user.uid);
  const existingSnapshot = await getDoc(userReference);

  const commonProfileData = {
    uid: user.uid,
    name:
      name?.trim() ||
      user.displayName?.trim() ||
      "Velora Customer",
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? "",
    photoURL: user.photoURL ?? "",
    provider,
    emailVerified: user.emailVerified,
    isActive: true,
    updatedAt: serverTimestamp(),
  };

  if (existingSnapshot.exists()) {
    await setDoc(userReference, commonProfileData, {
      merge: true,
    });

    return;
  }

  await setDoc(userReference, {
    ...commonProfileData,
    role,
    createdAt: serverTimestamp(),
  });
}

export async function signupWithEmail({
  fullName,
  email,
  password,
}: EmailSignupInput) {
  const cleanName = fullName.trim();
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2) {
    throw new Error("auth/invalid-name");
  }

  if (password.length < 8) {
    throw new Error("auth/weak-custom-password");
  }

  await initializeAuthPersistence();

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  await updateProfile(credential.user, {
    displayName: cleanName,
  });

  await createOrUpdateUserProfile({
    user: credential.user,
    provider: "password",
    name: cleanName,
    role: "customer",
  });

  await sendEmailVerification(credential.user);

  return credential.user;
}

export async function loginWithEmail({
  email,
  password,
}: EmailLoginInput) {
  await initializeAuthPersistence();

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password
  );

  await credential.user.reload();

  await createOrUpdateUserProfile({
    user: credential.user,
    provider: "password",
  });

  return credential.user;
}

export async function continueWithGoogle() {
  await initializeAuthPersistence();

  const credential = await signInWithPopup(
    auth,
    googleProvider
  );

  await createOrUpdateUserProfile({
    user: credential.user,
    provider: "google",
    role: "customer",
  });

  return credential.user;
}

export async function resendVerificationEmail(user: User) {
  await user.reload();

  if (user.emailVerified) {
    return;
  }

  await sendEmailVerification(user);
}

export async function sendResetPasswordEmail(email: string) {
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail) {
    throw new Error("auth/missing-email");
  }

  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getRedirectPath(uid: string) {
  const profile = await getUserProfile(uid);

  if (!profile) {
    return "/dashboard";
  }

  if (!profile.isActive) {
    return "/login?error=account-disabled";
  }

  if (profile.role === "admin") {
    return "/admin/dashboard";
  }

  if (profile.role === "driver") {
    return "/driver/dashboard";
  }

  return "/dashboard";
}

export function isEmailVerificationRequired(user: User) {
  const usesPasswordProvider = user.providerData.some(
    (provider) => provider.providerId === "password"
  );

  return usesPasswordProvider && !user.emailVerified;
}

export function getFirebaseAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : error instanceof Error
        ? error.message
        : "";

  const messages: Record<string, string> = {
    "auth/email-already-in-use":
      "This email is already registered. Please login instead.",

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/weak-password":
      "Password is too weak. Use at least 8 characters.",

    "auth/weak-custom-password":
      "Password must contain at least 8 characters.",

    "auth/invalid-name":
      "Please enter your full name.",

    "auth/missing-password":
      "Please enter your password.",

    "auth/missing-email":
      "Please enter your email address.",

    "auth/invalid-credential":
      "Incorrect email or password.",

    "auth/user-not-found":
      "No account was found with this email.",

    "auth/wrong-password":
      "Incorrect email or password.",

    "auth/user-disabled":
      "This account has been disabled. Please contact support.",

    "auth/too-many-requests":
      "Too many attempts. Please wait a few minutes and try again.",

    "auth/network-request-failed":
      "Network error. Please check your internet connection.",

    "auth/popup-closed-by-user":
      "Google sign-in was cancelled.",

    "auth/popup-blocked":
      "Google sign-in popup was blocked by your browser.",

    "auth/cancelled-popup-request":
      "Another Google sign-in request is already open.",

    "auth/account-exists-with-different-credential":
      "An account already exists with this email using another sign-in method.",

    "auth/unauthorized-domain":
      "This website domain is not authorized in Firebase Authentication.",

    "auth/operation-not-allowed":
      "This login method is not enabled in Firebase Console.",

    "auth/internal-error":
      "Authentication service encountered an error. Please try again.",
  };

  return (
    messages[code] ||
    "Something went wrong. Please try again."
  );
}

export function getRoleFromProfileData(
  data: DocumentData | undefined
): UserRole {
  const role = data?.role;

  if (
    role === "admin" ||
    role === "driver" ||
    role === "customer"
  ) {
    return role;
  }

  return "customer";
}