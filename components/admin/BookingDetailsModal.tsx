"use client";

import { X } from "lucide-react";

interface BookingDetails {
  bookingId?: string;
  customerName?: string;
  phoneNumber?: string;
  vehicleType?: string;
  pickup?: string;
  drop?: string;
  distance?: number;
  finalFare?: number;
  paymentStatus?: string;
  rideStatus?: string;
}

interface Props {
  booking: BookingDetails | null;
  open: boolean;
  onClose: () => void;
}

export default function BookingDetailsModal({ booking, open, onClose }: Props) {
  if (!open || !booking) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Booking details">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1018] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Ride Record</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Booking Details</h2></div>
          <button type="button" onClick={onClose} aria-label="Close booking details" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/55 transition hover:border-red-400/30 hover:text-red-300"><X size={19} /></button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Info title="Booking ID" value={booking.bookingId} />
          <Info title="Customer" value={booking.customerName} />
          <Info title="Phone" value={booking.phoneNumber} />
          <Info title="Vehicle" value={booking.vehicleType} />
          <Info title="Pickup" value={booking.pickup} />
          <Info title="Drop" value={booking.drop} />
          <Info title="Distance" value={`${booking.distance || 0} km`} />
          <Info title="Fare" value={`₹${booking.finalFare || 0}`} />
          <Info title="Payment" value={booking.paymentStatus} />
          <Info title="Ride Status" value={booking.rideStatus} />
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string | number | undefined }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs uppercase tracking-wide text-white/35">{title}</p><p className="mt-2 break-words text-sm font-semibold text-white/75">{value || "N/A"}</p></div>;
}
