"use client";

interface Booking {
  id: string;
  bookingId: string;
  pickup: string;
  drop: string;
  vehicleType: string;
  finalFare: number;
  rideStatus: string;
  paymentStatus: string;
}

interface ActiveBookingProps {
  booking: Booking | null;
}

export default function ActiveBooking({
  booking,
}: ActiveBookingProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

      <h2 className="mb-6 text-2xl font-bold">
        Active Booking
      </h2>

      {!booking ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">

          <p className="text-lg font-semibold">
            No Active Ride
          </p>

          <p className="mt-2 text-gray-400">
            Book a ride to see live updates here.
          </p>

        </div>
      ) : (
        <div className="space-y-5">

          <div className="flex justify-between">
            <span className="text-gray-400">
              Booking ID
            </span>

            <span className="font-semibold">
              {booking.bookingId}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Vehicle
            </span>

            <span className="capitalize">
              {booking.vehicleType}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-400">
              Pickup
            </p>

            <p className="font-semibold">
              {booking.pickup}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400">
              Drop
            </p>

            <p className="font-semibold">
              {booking.drop}
            </p>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Fare
            </span>

            <span className="font-bold text-cyan-400">
              ₹{booking.finalFare}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Ride Status
            </span>

            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-400">
              {booking.rideStatus}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Payment
            </span>

            <span className="font-semibold">
              {booking.paymentStatus}
            </span>
          </div>

        </div>
      )}

    </div>
  );
}