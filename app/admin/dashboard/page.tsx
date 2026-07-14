"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import DashboardCards from "@/components/admin/DashboardCards";
import RecentBookings from "@/components/admin/RecentBookings";

interface DashboardBooking {
  id: string;
  bookingId: string;
  customerName: string;
  pickup: string;
  drop: string;
  vehicleType: string;
  finalFare: number;
  rideStatus: string;
  status?: string;
  paymentStatus: string;
  createdAt?: Timestamp | null;
}

interface DashboardUser {
  role?: string;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    revenue: 0,
    customers: 0,
    drivers: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      // Bookings
      const bookingSnap = await getDocs(collection(db, "bookings"));

      const bookingData = bookingSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as DashboardBooking));

      // Users
      const userSnap = await getDocs(collection(db, "users"));

      const users = userSnap.docs.map((doc) => doc.data() as DashboardUser);

      const customers = users.filter(
        (user) => user.role === "customer"
      ).length;

      const drivers = users.filter(
        (user) => user.role === "driver"
      ).length;

      const today = new Date().toDateString();

      const todayBookings = bookingData.filter((booking) => {
        if (!booking.createdAt) return false;

        return (
          booking.createdAt.toDate().toDateString() === today
        );
      }).length;

      const pending = bookingData.filter(
        (booking) =>
          ["pending", "searching_driver"].includes(
            String(booking.rideStatus ?? booking.status ?? "").toLowerCase()
          )
      ).length;

      const completed = bookingData.filter(
        (booking) =>
          String(booking.rideStatus ?? booking.status ?? "").toLowerCase() === "completed"
      ).length;

      const cancelled = bookingData.filter(
        (booking) =>
          String(booking.rideStatus ?? booking.status ?? "").toLowerCase() === "cancelled"
      ).length;

      const revenue = bookingData.reduce(
        (sum, booking) =>
          sum + Number(booking.finalFare || 0),
        0
      );

      setBookings(bookingData);

      setStats({
        totalBookings: bookingData.length,
        todayBookings,
        pendingBookings: pending,
        completedBookings: completed,
        cancelledBookings: cancelled,
        revenue,
        customers,
        drivers,
      });
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-xl text-white">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div>

      <DashboardCards
        totalBookings={stats.totalBookings}
        todayBookings={stats.todayBookings}
        pendingBookings={stats.pendingBookings}
        completedBookings={stats.completedBookings}
        cancelledBookings={stats.cancelledBookings}
        revenue={stats.revenue}
        customers={stats.customers}
        drivers={stats.drivers}
      />

      <RecentBookings bookings={bookings} />

    </div>
  );
}
