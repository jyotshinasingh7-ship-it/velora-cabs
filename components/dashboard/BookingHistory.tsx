"use client";

import type { Timestamp } from "firebase/firestore";

interface Booking {
  id: string;
  bookingId: string;
  pickup: string;
  drop: string;
  vehicleType: string;
  finalFare: number;
  rideStatus: string;
  paymentStatus: string;
  createdAt?: Timestamp | null;
}

interface BookingHistoryProps {
  bookings: Booking[];
}

export default function BookingHistory({
  bookings,
}: BookingHistoryProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

      <h2 className="mb-6 text-2xl font-bold">
        Booking History
      </h2>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">

          <p className="text-lg font-semibold">
            No Bookings Found
          </p>

          <p className="mt-2 text-gray-400">
            Your booking history will appear here.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {bookings.map((booking) => (

            <div
              key={booking.id}
              className="rounded-2xl border border-white/10 bg-slate-900 p-5"
            >

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-bold">
                    {booking.bookingId}
                  </h3>

                  <p className="mt-1 text-sm text-gray-400 capitalize">
                    {booking.vehicleType}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-cyan-400">
                    ₹{booking.finalFare}
                  </p>

                  <p className="text-sm text-gray-400">
                    {booking.paymentStatus}
                  </p>
                </div>

              </div>

              <div className="my-4 border-t border-white/10"></div>

              <div className="space-y-2">

                <div>
                  <p className="text-xs text-gray-500">
                    Pickup
                  </p>

                  <p>{booking.pickup}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Drop
                  </p>

                  <p>{booking.drop}</p>
                </div>

              </div>

              <div className="mt-5 flex items-center justify-between">

                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-400">
                  {booking.rideStatus}
                </span>

                <span className="text-sm text-gray-400">
                  {booking.createdAt?.toDate
                    ? booking.createdAt
                        .toDate()
                        .toLocaleString()
                    : "-"}
                </span>

              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}
