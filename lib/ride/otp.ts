import { createHash, randomInt } from "crypto";

export interface RideOtp {
  otp: string;
  hash: string;
}

const OTP_LENGTH = 6;

export function generateRideOtp(): RideOtp {
  const otp = randomInt(
    100000,
    999999
  ).toString();

  return {
    otp,
    hash: hashOtp(otp),
  };
}

export function hashOtp(
  otp: string
): string {
  return createHash("sha256")
    .update(otp)
    .digest("hex");
}

export function verifyRideOtp(
  enteredOtp: string,
  storedHash: string
): boolean {
  return (
    hashOtp(enteredOtp) ===
    storedHash
  );
}

export function generateStartRideOtp() {
  return generateRideOtp();
}

export function generateEndRideOtp() {
  return generateRideOtp();
}

export function maskOtp(
  otp: string
) {
  if (otp.length < OTP_LENGTH) {
    return "******";
  }

  return `••${otp.slice(-2)}`;
}

export function isOtpExpired(
  createdAt: Date,
  expiryMinutes = 30
) {
  const now = Date.now();

  const expiryTime =
    createdAt.getTime() +
    expiryMinutes * 60 * 1000;

  return now > expiryTime;
}

export function getRemainingOtpTime(
  createdAt: Date,
  expiryMinutes = 30
) {
  const remaining =
    createdAt.getTime() +
    expiryMinutes * 60 * 1000 -
    Date.now();

  return Math.max(
    0,
    Math.floor(remaining / 1000)
  );
}

export function canRetryOtp(
  attempts: number,
  maxAttempts = 5
) {
  return attempts < maxAttempts;
}