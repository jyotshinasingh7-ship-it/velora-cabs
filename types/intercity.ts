import type { Timestamp } from "firebase/firestore";

export type IntercityRideStatus =
  | "draft"
  | "published"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled";

export type SeatRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

export interface IntercityStop {
  address: string;
  placeId: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface IntercityRide {
  id: string;
  driverId: string;
  driverName: string;
  driverPhotoURL: string;
  driverRating: number;
  vehicleId: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleSeats: number;
  origin: IntercityStop;
  destination: IntercityStop;
  stops: IntercityStop[];
  departureAt: Timestamp | Date;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  status: IntercityRideStatus;
  luggageAllowed: boolean;
  womenOnly: boolean;
  instantBooking: boolean;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface IntercitySeatRequest {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  seatsRequested: number;
  amount: number;
  status: SeatRequestStatus;
  pickupStop: IntercityStop;
  dropoffStop: IntercityStop;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
