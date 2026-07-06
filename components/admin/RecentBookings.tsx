"use client";

interface Booking {
  id: string;
  bookingId: string;
  customerName: string;
  pickup: string;
  drop: string;
  vehicleType: string;
  finalFare: number;
  rideStatus: string;
  paymentStatus: string;
}

interface RecentBookingsProps {
  bookings: Booking[];
}

export default function RecentBookings({
  bookings,
}: RecentBookingsProps) {
  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-2xl font-bold text-white">
          Recent Bookings
        </h2>

        <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-400">
          {bookings.length} Total
        </span>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-white/10 text-left text-gray-400">

              <th className="pb-4">Booking</th>

              <th className="pb-4">Customer</th>

              <th className="pb-4">Route</th>

              <th className="pb-4">Vehicle</th>

              <th className="pb-4">Fare</th>

              <th className="pb-4">Ride</th>

              <th className="pb-4">Payment</th>

            </tr>

          </thead>

          <tbody>

            {bookings.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="py-12 text-center text-gray-500"
                >
                  No Bookings Found
                </td>

              </tr>

            ) : (

              bookings.map((booking) => (

                <tr
                  key={booking.id}
                  className="border-b border-white/5 transition hover:bg-white/5"
                >

                  <td className="py-5 font-semibold text-cyan-400">
                    {booking.bookingId}
                  </td>

                  <td className="py-5">
                    {booking.customerName}
                  </td>

                  <td className="py-5">
                    <div>

                      <p>{booking.pickup}</p>

                      <p className="text-sm text-gray-500">
                        ↓
                      </p>

                      <p>{booking.drop}</p>

                    </div>
                  </td>

                  <td className="py-5">
                    {booking.vehicleType}
                  </td>

                  <td className="py-5 font-bold text-green-400">
                    ₹{booking.finalFare}
                  </td>

                  <td className="py-5">

                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">

                      {booking.rideStatus}

                    </span>

                  </td>

                  <td className="py-5">

                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        booking.paymentStatus === "Paid"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {booking.paymentStatus}
                    </span>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}