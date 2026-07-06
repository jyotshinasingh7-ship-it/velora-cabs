"use client";

import { useEffect, useMemo, useState } from "react";

import BookingForm from "@/components/BookingForm";
import ProfileCard from "@/components/dashboard/ProfileCard";
import BookingStats from "@/components/dashboard/BookingStats";
import ActiveBooking from "@/components/dashboard/ActiveBooking";
import BookingHistory from "@/components/dashboard/BookingHistory";

import { auth, db } from "@/lib/firebase";

import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

interface Booking {
  id: string;

  bookingId: string;

  customerId: string;

  customerName: string;

  pickup: string;

  drop: string;

  vehicleType: string;

  finalFare: number;

  rideStatus: string;

  paymentStatus: string;

  createdAt?: any;
}

export default function DashboardPage() {

  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {

      if (!user) {

        window.location.href = "/login";

        return;

      }

      const q = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc")
      );

      const unsubscribeBookings = onSnapshot(q, (snapshot) => {

        const data: Booking[] = [];

        snapshot.forEach((doc) => {

          const booking = {
            id: doc.id,
            ...(doc.data() as Omit<Booking, "id">),
          };

          if (booking.customerId === user.uid) {

            data.push(booking);

          }

        });

        setBookings(data);

        setLoading(false);

      });

      return unsubscribeBookings;

    });

    return () => unsubscribeAuth();

  }, []);

  const activeBooking = useMemo(() => {

    return bookings.find(
      (booking) =>
        booking.rideStatus !== "Completed" &&
        booking.rideStatus !== "Cancelled"
    );

  }, [bookings]);

  const stats = useMemo(() => {

    return {

      total: bookings.length,

      completed: bookings.filter(
        (b) => b.rideStatus === "Completed"
      ).length,

      cancelled: bookings.filter(
        (b) => b.rideStatus === "Cancelled"
      ).length,

      pending: bookings.filter(
        (b) => b.rideStatus === "Pending"
      ).length,

    };

  }, [bookings]);
    if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-gray-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Customer Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Welcome back to Velora Cabs
            </p>
          </div>

          <ProfileCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2">
            <BookingForm />
          </div>

          <div>
            <BookingStats stats={stats} />
          </div>

        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          <div className="lg:col-span-1">
            <ActiveBooking booking={activeBooking ?? null} />
          </div>

          <div className="lg:col-span-2">
            <BookingHistory bookings={bookings} />
          </div>

        </div>

      </div>

    </div>
  );
}
