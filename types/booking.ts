import type { Timestamp } from "firebase/firestore";
import type {
  BillingMode,
  CanonicalPaymentMethod,
  CanonicalPaymentStatus,
  FareSnapshot,
  SettlementStatus,
} from "@/types/finance";

export type RideStatus =
  | "pending"
  | "searching_driver"
  | "driver_assigned"
  | "driver_arriving"
  | "driver_arrived"
  | "start_otp_pending"
  | "in_progress"
  | "stop_otp_pending"
  | "completed"
  | "cancelled";

export type PaymentStatus = CanonicalPaymentStatus;
export type PaymentMethod = CanonicalPaymentMethod;

export type BookingType =
  | "now"
  | "schedule";

export type BookingFor =
  | "self"
  | "someone_else";

export type CancelledBy =
  | "customer"
  | "driver"
  | "admin"
  | "system";

export interface BookingLocation {
  address: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AssignedDriver {
  id: string;
  name: string;
  phoneNumber: string;
  photoURL: string;
  rating: number;
  totalRides: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
}

export interface AssignedVehicle {
  id: string;
  name: string;
  model: string;
  category: string;
  number: string;
  color: string;
  seats: number;
  photoURL: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  subtotal: number;

  gstPercentage: number;
  gstAmount: number;

  tollCharge: number;
  parkingCharge: number;
  waitingCharge: number;
  nightCharge: number;
  driverAllowance: number;
  cancellationFee: number;

  discountAmount: number;
  finalFare: number;
}

export interface ConditionalChargeState {
  tollApplicable: boolean;
  parkingApplicable: boolean;
  waitingApplicable: boolean;
  nightChargeApplicable: boolean;
  driverAllowanceApplicable: boolean;

  freeWaitingMinutes: number;
  waitingMinutes: number;

  nightChargeReason: string;
  tollNotes: string;
  parkingNotes: string;
}

export interface RideOtpState {
  startOtpHash: string;
  startOtpVerified: boolean;
  startOtpAttempts: number;

  stopOtpHash: string;
  stopOtpVerified: boolean;
  stopOtpAttempts: number;
}

export interface RideTimeline {
  createdAt?: Timestamp | null;
  acceptedAt?: Timestamp | null;
  driverArrivingAt?: Timestamp | null;
  arrivedAt?: Timestamp | null;
  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  cancelledAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface RideCancellation {
  cancelledBy: CancelledBy | "";
  cancellationReason: string;
  cancellationNotes: string;
  cancellationFeeApplied: number;
}

export interface RideRating {
  customerRating: number | null;
  customerReview: string;
  ratedAt?: Timestamp | null;
}

export interface RazorpayDetails {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Booking {
  id: string;
  bookingId: string;

  customerId: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;

  bookingFor: BookingFor;
  bookingType: BookingType;

  pickup: BookingLocation;
  dropoff: BookingLocation;

  scheduledDate: string;
  scheduledTime: string;
  scheduledAt?: Timestamp | Date | null;

  vehicleType: string;
  vehicleName: string;

  distanceKm: number;
  durationMinutes: number;
  billableKm: number;

  rideStatus: RideStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  billingMode: BillingMode;
  settlementStatus: SettlementStatus;
  paymentMethodLocked: boolean;
  corporateBillingStatus: string;
  financeSchemaVersion: number;
  fareLocked: boolean;
  fareSnapshot: FareSnapshot | null;
  financeReviewRequired: boolean;
  financeCompatibilityReason: string | null;

  driver: AssignedDriver | null;
  vehicle: AssignedVehicle | null;

  pickupEtaMinutes: number | null;
  driverDistanceToPickupKm: number | null;

  fare: FareBreakdown;
  conditionalCharges: ConditionalChargeState;
  otp: RideOtpState;
  timeline: RideTimeline;
  cancellation: RideCancellation;
  rating: RideRating;
  razorpay: RazorpayDetails;

  specialInstructions: string;
}
