"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  type DocumentData,
  type QuerySnapshot,
  type Timestamp,
  where,
} from "firebase/firestore";
import {
  AlertCircle,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import BookingForm from "@/components/BookingForm";
import ProfileCard from "@/components/dashboard/ProfileCard";
import ActiveBooking from "@/components/dashboard/ActiveBooking";
import BookingHistory from "@/components/dashboard/BookingHistory";
import NotificationBell from "@/components/NotificationBell";

import { auth, db } from "@/lib/firebase";
import {
  getRedirectPath,
  getUserProfile,
  isEmailVerificationRequired,
  logoutUser,
} from "@/lib/auth";

interface Booking {
  id: string;
  bookingId: string;
  customerId: string;
  userId?: string;
  customerName: string;
  customerEmail?: string;
  pickup: string;
  drop: string;
  dropoff?: string;
  vehicleType: string;
  distance?: number;
  distanceKm?: number;
  durationMinutes?: number;
  estimatedFare?: number;
  finalFare: number;
  rideStatus: string;
  status?: string;
  paymentStatus: string;
  bookingType?: "now" | "schedule";
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface DashboardStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
}

function normalizeRideStatus(booking: Booking) {
  return booking.rideStatus || booking.status || "Pending";
}

function normalizeBooking(
  documentId: string,
  data: DocumentData
): Booking {
  return {
    id: documentId,
    bookingId: data.bookingId ?? documentId,
    customerId: data.customerId ?? data.userId ?? "",
    userId: data.userId ?? "",
    customerName: data.customerName ?? "Velora Customer",
    customerEmail: data.customerEmail ?? "",
    pickup: data.pickup ?? "",
    drop: data.drop ?? data.dropoff ?? "",
    dropoff: data.dropoff ?? data.drop ?? "",
    vehicleType: data.vehicleType ?? "Not selected",
    distance: data.distance ?? data.distanceKm ?? 0,
    distanceKm: data.distanceKm ?? data.distance ?? 0,
    durationMinutes: data.durationMinutes ?? 0,
    estimatedFare: data.estimatedFare ?? data.finalFare ?? 0,
    finalFare: data.finalFare ?? data.estimatedFare ?? 0,
    rideStatus: data.rideStatus ?? data.status ?? "Pending",
    status: data.status ?? data.rideStatus ?? "Pending",
    paymentStatus: data.paymentStatus ?? "Pending",
    bookingType: data.bookingType ?? "now",
    scheduledDate: data.scheduledDate ?? "",
    scheduledTime: data.scheduledTime ?? "",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function getCreatedAtMilliseconds(booking: Booking) {
  return booking.createdAt?.toMillis?.() ?? 0;
}

function mergeBookingSnapshots(
  customerSnapshot: QuerySnapshot<DocumentData>,
  userSnapshot: QuerySnapshot<DocumentData>
) {
  const bookingMap = new Map<string, Booking>();

  customerSnapshot.forEach((bookingDocument) => {
    bookingMap.set(
      bookingDocument.id,
      normalizeBooking(
        bookingDocument.id,
        bookingDocument.data()
      )
    );
  });

  userSnapshot.forEach((bookingDocument) => {
    bookingMap.set(
      bookingDocument.id,
      normalizeBooking(
        bookingDocument.id,
        bookingDocument.data()
      )
    );
  });

  return Array.from(bookingMap.values()).sort(
    (firstBooking, secondBooking) =>
      getCreatedAtMilliseconds(secondBooking) -
      getCreatedAtMilliseconds(firstBooking)
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [customerBookings, setCustomerBookings] =
    useState<QuerySnapshot<DocumentData> | null>(null);

  const [userBookings, setUserBookings] =
    useState<QuerySnapshot<DocumentData> | null>(null);

  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] =
    useState("");

  useEffect(() => {
    let unsubscribeCustomerBookings:
      | (() => void)
      | undefined;

    let unsubscribeUserBookings:
      | (() => void)
      | undefined;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribeCustomerBookings?.();
        unsubscribeUserBookings?.();

        if (!user) {
          router.replace("/login");
          return;
        }

        if (isEmailVerificationRequired(user)) {
          await logoutUser();
          router.replace("/login?error=email-not-verified");
          return;
        }

        try {
          setLoading(true);
          setDashboardError("");
          setCurrentUser(user);

          const profile = await getUserProfile(user.uid);
          const redirectPath = await getRedirectPath(user.uid);

          if (
            profile &&
            profile.role !== "customer" &&
            redirectPath !== "/dashboard"
          ) {
            router.replace(redirectPath);
            return;
          }

          const customerQuery = query(
            collection(db, "bookings"),
            where("customerId", "==", user.uid)
          );

          const userQuery = query(
            collection(db, "bookings"),
            where("userId", "==", user.uid)
          );

          unsubscribeCustomerBookings = onSnapshot(
            customerQuery,
            (snapshot) => {
              setCustomerBookings(snapshot);
            },
            () => {
              setDashboardError(
                "Unable to load your bookings."
              );
              setLoading(false);
            }
          );

          unsubscribeUserBookings = onSnapshot(
            userQuery,
            (snapshot) => {
              setUserBookings(snapshot);
            },
            () => {
              setDashboardError(
                "Unable to load your bookings."
              );
              setLoading(false);
            }
          );
        } catch {
          setDashboardError(
            "Unable to open your dashboard."
          );
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeCustomerBookings?.();
      unsubscribeUserBookings?.();
    };
  }, [router]);

  useEffect(() => {
    if (!customerBookings || !userBookings) {
      return;
    }

    setBookings(
      mergeBookingSnapshots(
        customerBookings,
        userBookings
      )
    );

    setLoading(false);
  }, [customerBookings, userBookings]);

  const activeBooking = useMemo(() => {
    return bookings.find((booking) => {
      const status =
        normalizeRideStatus(booking).toLowerCase();

      return (
        status !== "completed" &&
        status !== "cancelled"
      );
    });
  }, [bookings]);

  const stats = useMemo<DashboardStats>(() => {
    return bookings.reduce(
      (result, booking) => {
        const status =
          normalizeRideStatus(booking).toLowerCase();

        result.total += 1;

        if (status === "completed") {
          result.completed += 1;
        } else if (status === "cancelled") {
          result.cancelled += 1;
        } else {
          result.pending += 1;
        }

        return result;
      },
      {
        total: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
      }
    );
  }, [bookings]);

  async function handleLogout() {
    await logoutUser();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070c] text-white">
        <div className="text-center">
          <LoaderCircle
            size={44}
            className="mx-auto animate-spin text-amber-400"
          />

          <p className="mt-4 text-sm text-white/50">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070c] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
              Customer Portal
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Welcome back
              {currentUser?.displayName
                ? `, ${currentUser.displayName.split(" ")[0]}`
                : ""}
            </h1>

            <p className="mt-3 text-sm text-white/50 sm:text-base">
              Book rides, monitor active journeys and manage
              your travel history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ProfileCard />

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/65 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </header>

        {dashboardError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            {dashboardError}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Total Bookings"
            value={stats.total}
            icon={CarFront}
          />

          <DashboardStatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
          />

          <DashboardStatCard
            title="Active / Pending"
            value={stats.pending}
            icon={Clock3}
          />

          <DashboardStatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
          />
        </section>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-2xl sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-black">
                <CarFront size={21} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Book a New Ride
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  Select locations, vehicle and payment method.
                </p>
              </div>
            </div>

            <BookingForm />
          </section>

          <section className="space-y-7">
            <ActiveBooking
              booking={activeBooking ?? null}
            />

            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
              <div className="flex items-center gap-3">
                <CalendarClock
                  size={21}
                  className="text-amber-400"
                />

                <div>
                  <h2 className="font-bold">
                    Scheduled Rides
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    {
                      bookings.filter(
                        (booking) =>
                          booking.bookingType ===
                            "schedule" &&
                          normalizeRideStatus(
                            booking
                          ).toLowerCase() !==
                            "cancelled"
                      ).length
                    }{" "}
                    upcoming or previous scheduled rides
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-2xl sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              Booking History
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Review your previous, active and scheduled rides.
            </p>
          </div>

          <BookingHistory bookings={bookings} />
        </section>
      </div>
    </main>
  );
}

interface DashboardStatCardProps {
  title: string;
  value: number;
  icon: typeof CarFront;
}

function DashboardStatCard({
  title,
  value,
  icon: Icon,
}: DashboardStatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-amber-400/25">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/45">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
