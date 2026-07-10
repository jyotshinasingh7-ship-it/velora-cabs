"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import BookingDetailsModal from "@/components/admin/BookingDetailsModal";

interface Booking {
  id: string;
  bookingId: string;
  customerId?: string;
  customerName: string;
  phoneNumber: string;

  pickup: string;
  drop: string;

  vehicleType: string;

  distance: number;

  estimatedFare: number;
  fareWithoutGST: number;
  gstAmount: number;
  gstPercentage: number;

  finalFare: number;

  baseFare: number;
  perKm: number;
  billableKm: number;

  driverAllowance: number;
  waitingCharge: number;
  parking: number;
  toll: number;

  paymentMethod: string;
  paymentStatus: string;

  rideStatus: string;

  driverId?: string;
  driverName?: string;

  createdAt?: any;
  updatedAt?: any;
}

const STATUS_OPTIONS = [
  "Pending",
  "Accepted",
  "Driver Assigned",
  "On The Way",
  "Started",
  "Completed",
  "Cancelled",
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [openModal, setOpenModal] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Booking[] = snapshot.docs.map(
          (docItem) =>
            ({
              id: docItem.id,
              ...docItem.data(),
            } as Booking)
        );

        setBookings(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.bookingId
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        booking.customerName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        booking.phoneNumber
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        booking.pickup
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        booking.drop
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All"
          ? true
          : booking.rideStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  async function updateRideStatus(
    bookingId: string,
    status: string
  ) {
    try {
      setUpdatingId(bookingId);

      await updateDoc(
        doc(db, "bookings", bookingId),
        {
          rideStatus: status,
          updatedAt: new Date(),
        }
      );
    } catch (error) {
      console.error(error);
      alert("Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  function openDetails(booking: Booking) {
    setSelectedBooking(booking);
    setOpenModal(true);
  }

  function closeDetails() {
    setOpenModal(false);
    setSelectedBooking(null);
  }
    return (
    <>
      <div className="space-y-6">

        {/* Header */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Bookings
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Manage customer bookings, ride status and booking details.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <input
              type="text"
              placeholder="Search booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="All">
                All Status
              </option>

              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>

          </div>

        </div>

        {/* Stats */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

            <p className="text-sm text-gray-400">
              Total Bookings
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {bookings.length}
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

            <p className="text-sm text-gray-400">
              Pending
            </p>

            <h2 className="mt-2 text-3xl font-bold text-yellow-400">
              {
                bookings.filter(
                  (b) => b.rideStatus === "Pending"
                ).length
              }
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

            <p className="text-sm text-gray-400">
              Completed
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-400">
              {
                bookings.filter(
                  (b) => b.rideStatus === "Completed"
                ).length
              }
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

            <p className="text-sm text-gray-400">
              Cancelled
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-400">
              {
                bookings.filter(
                  (b) => b.rideStatus === "Cancelled"
                ).length
              }
            </h2>

          </div>

        </div>

        {/* Desktop Table */}

        <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-slate-900 lg:block">

          <table className="min-w-full">

            <thead className="border-b border-white/10">

              <tr className="text-left text-gray-400">

                <th className="px-6 py-4">
                  Booking
                </th>

                <th className="px-6 py-4">
                  Customer
                </th>

                <th className="px-6 py-4">
                  Route
                </th>

                <th className="px-6 py-4">
                  Vehicle
                </th>

                <th className="px-6 py-4">
                  Fare
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400"
                  >
                    Loading bookings...
                  </td>

                </tr>

              ) : filteredBookings.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400"
                  >
                    No bookings found.
                  </td>

                </tr>

              ) : (

                filteredBookings.map((booking) => (
                                      <tr
                    key={booking.id}
                    className="border-b border-white/5 transition hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">
                          {booking.bookingId}
                        </p>

                        <p className="text-xs text-gray-400">
                          {booking.paymentMethod || "N/A"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">
                          {booking.customerName}
                        </p>

                        <p className="text-sm text-gray-400">
                          {booking.phoneNumber}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="max-w-xs">
                        <p className="truncate text-white">
                          {booking.pickup}
                        </p>

                        <p className="truncate text-sm text-gray-400">
                          {booking.drop}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      {booking.vehicleType}
                    </td>

                    <td className="px-6 py-5 font-semibold text-green-400">
                      ₹{booking.finalFare}
                    </td>

                    <td className="px-6 py-5">
                      <select
                        value={booking.rideStatus}
                        disabled={updatingId === booking.id}
                        onChange={(e) =>
                          updateRideStatus(
                            booking.id,
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-center">

                        <button
                          onClick={() => openDetails(booking)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-700"
                        >
                          View Details
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Mobile Cards */}

        <div className="space-y-4 lg:hidden">

          {loading ? (

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-gray-400">
              Loading bookings...
            </div>

          ) : filteredBookings.length === 0 ? (

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-gray-400">
              No bookings found.
            </div>

          ) : (

            filteredBookings.map((booking) => (
                              <div
                key={booking.id}
                className="rounded-2xl border border-white/10 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h2 className="text-lg font-bold text-white">
                      {booking.bookingId}
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      {booking.customerName}
                    </p>

                    <p className="text-sm text-gray-400">
                      {booking.phoneNumber}
                    </p>

                  </div>

                  <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-400">
                    {booking.vehicleType}
                  </span>

                </div>

                <div className="mt-5 space-y-3">

                  <div>

                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Pickup
                    </p>

                    <p className="mt-1 text-white">
                      {booking.pickup}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Drop
                    </p>

                    <p className="mt-1 text-white">
                      {booking.drop}
                    </p>

                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div>

                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Fare
                      </p>

                      <p className="mt-1 font-semibold text-green-400">
                        ₹{booking.finalFare}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Distance
                      </p>

                      <p className="mt-1 text-white">
                        {booking.distance} KM
                      </p>

                    </div>

                  </div>

                  <div>

                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                      Ride Status
                    </p>

                    <select
                      value={booking.rideStatus}
                      disabled={updatingId === booking.id}
                      onChange={(e) =>
                        updateRideStatus(
                          booking.id,
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>

                  </div>

                </div>

                <div className="mt-6">

                  <button
                    onClick={() => openDetails(booking)}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
                  >
                    View Booking Details
                  </button>

                </div>

              </div>
            ))
          )}

        </div>
      </div>
            <BookingDetailsModal
        booking={selectedBooking}
        open={openModal}
        onClose={closeDetails}
      />
    </>
  );
}