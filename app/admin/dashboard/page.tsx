"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import DashboardCards from "@/components/admin/DashboardCards";
import RecentBookings from "@/components/admin/RecentBookings";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
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
      }));

      // Users
      const userSnap = await getDocs(collection(db, "users"));

      const users = userSnap.docs.map((doc) => doc.data());

      const customers = users.filter(
        (u: any) => u.role === "customer"
      ).length;

      const drivers = users.filter(
        (u: any) => u.role === "driver"
      ).length;

      const today = new Date().toDateString();

      const todayBookings = bookingData.filter((b: any) => {
        if (!b.createdAt?.toDate) return false;

        return (
          b.createdAt.toDate().toDateString() === today
        );
      }).length;

      const pending = bookingData.filter(
        (b: any) => b.rideStatus === "Pending"
      ).length;

      const completed = bookingData.filter(
        (b: any) => b.rideStatus === "Completed"
      ).length;

      const cancelled = bookingData.filter(
        (b: any) => b.rideStatus === "Cancelled"
      ).length;

      const revenue = bookingData.reduce(
        (sum: number, booking: any) =>
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