"use client";

interface Props {
  booking: any;
  open: boolean;
  onClose: () => void;
}

export default function BookingDetailsModal({
  booking,
  open,
  onClose,
}: Props) {
  if (!open || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">

      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 p-8 border border-white/10">

        <div className="flex items-center justify-between">

          <h2 className="text-3xl font-bold">
            Booking Details
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 px-4 py-2"
          >
            Close
          </button>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">

          <Info title="Booking ID" value={booking.bookingId} />
          <Info title="Customer" value={booking.customerName} />
          <Info title="Phone" value={booking.phoneNumber} />
          <Info title="Vehicle" value={booking.vehicleType} />
          <Info title="Pickup" value={booking.pickup} />
          <Info title="Drop" value={booking.drop} />
          <Info title="Distance" value={`${booking.distance || 0} KM`} />
          <Info title="Fare" value={`₹${booking.finalFare || 0}`} />
          <Info title="Payment" value={booking.paymentStatus} />
          <Info title="Ride Status" value={booking.rideStatus} />

        </div>

      </div>

    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div>

      <p className="text-sm text-gray-400">
        {title}
      </p>

      <h3 className="mt-1 text-lg font-semibold">
        {value || "N/A"}
      </h3>

    </div>
  );
}