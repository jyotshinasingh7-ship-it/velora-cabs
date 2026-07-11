"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  Route,
  XCircle,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

import DriverSidebar from "@/components/driver/DriverSidebar";
import DriverTopbar from "@/components/driver/DriverTopbar";
import DriverAnalytics from "@/components/driver/DriverAnalytics";
import DriverWalletCard from "@/components/driver/DriverWalletCard";
import LiveRideMap from "@/components/driver/LiveRideMap";

import {
  dispatchRide,
  rejectDriverRequest,
} from "@/lib/driver/dispatch";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface DriverProfile {
  id: string;
  uid: string;

  name: string;
  email: string;
  phoneNumber: string;
  photoURL: string;

  status: string;
  isOnline: boolean;
  isApproved: boolean;

  rating: number;
  totalRides: number;
  ratingCount: number;

  walletBalance: number;
  pendingBalance: number;
  todayEarnings: number;
  todayTrips: number;

  onlineHours: number;
  acceptanceRate: number;
  cancellationRate: number;

  incomingRideId: string;
  activeRideId: string;

  currentLatitude: number | null;
  currentLongitude: number | null;

  vehicleId: string;
  vehicleName: string;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleColor: string;
  vehicleSeats: number;
}

interface RideData {
  id: string;
  bookingId: string;

  customerId: string;
  customerName: string;
  customerPhone: string;

  pickup: string;
  dropoff: string;

  pickupCoordinates: Coordinates | null;
  dropoffCoordinates: Coordinates | null;

  distanceKm: number;
  durationMinutes: number;

  finalFare: number;
  paymentMethod: string;
  paymentStatus: string;

  vehicleType: string;
  rideStatus: string;

  specialInstructions: string;

  pickupEtaMinutes: number;
  driverDistanceToPickupKm: number;
}

type DriverAction =
  | "online"
  | "accept"
  | "reject"
  | "arrived"
  | "start"
  | "complete"
  | null;

function getNumber(
  value: unknown,
  fallback = 0
) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

function getString(
  value: unknown,
  fallback = ""
) {
  return typeof value === "string"
    ? value
    : fallback;
}

function normalizeDriverProfile(
  documentId: string,
  data: DocumentData
): DriverProfile {
  return {
    id: documentId,

    uid: getString(
      data.uid,
      documentId
    ),

    name: getString(
      data.name,
      "Velora Driver"
    ),

    email: getString(data.email),

    phoneNumber: getString(
      data.phoneNumber
    ),

    photoURL: getString(
      data.photoURL
    ),

    status: getString(
      data.status,
      "offline"
    ),

    isOnline:
      Boolean(data.isOnline) ||
      data.status === "online",

    isApproved:
      data.isApproved !== false,

    rating: getNumber(
      data.rating ??
        data.averageRating,
      0
    ),

    totalRides: getNumber(
      data.totalRides,
      0
    ),

    ratingCount: getNumber(
      data.ratingCount,
      0
    ),

    walletBalance: getNumber(
      data.walletBalance,
      0
    ),

    pendingBalance: getNumber(
      data.pendingBalance,
      0
    ),

    todayEarnings: getNumber(
      data.todayEarnings ??
        data.todayEarning,
      0
    ),

    todayTrips: getNumber(
      data.todayTrips,
      0
    ),

    onlineHours: getNumber(
      data.onlineHours,
      0
    ),

    acceptanceRate: getNumber(
      data.acceptanceRate,
      100
    ),

    cancellationRate: getNumber(
      data.cancellationRate,
      0
    ),

    incomingRideId: getString(
      data.incomingRideId
    ),

    activeRideId: getString(
      data.activeRideId
    ),

    currentLatitude:
      data.currentLatitude !==
        undefined &&
      data.currentLatitude !== null
        ? getNumber(
            data.currentLatitude
          )
        : null,

    currentLongitude:
      data.currentLongitude !==
        undefined &&
      data.currentLongitude !== null
        ? getNumber(
            data.currentLongitude
          )
        : null,

    vehicleId: getString(
      data.vehicleId
    ),

    vehicleName: getString(
      data.vehicleName
    ),

    vehicleModel: getString(
      data.vehicleModel
    ),

    vehicleNumber: getString(
      data.vehicleNumber
    ),

    vehicleColor: getString(
      data.vehicleColor
    ),

    vehicleSeats: getNumber(
      data.vehicleSeats,
      4
    ),
  };
}

function normalizeRide(
  documentId: string,
  data: DocumentData
): RideData {
  const pickupData =
    typeof data.pickup === "object"
      ? data.pickup
      : null;

  const dropoffData =
    typeof data.dropoff === "object"
      ? data.dropoff
      : null;

  const pickupLatitude =
    data.pickupLatitude ??
    pickupData?.latitude;

  const pickupLongitude =
    data.pickupLongitude ??
    pickupData?.longitude;

  const dropoffLatitude =
    data.dropoffLatitude ??
    data.destinationLatitude ??
    dropoffData?.latitude;

  const dropoffLongitude =
    data.dropoffLongitude ??
    data.destinationLongitude ??
    dropoffData?.longitude;

  return {
    id: documentId,

    bookingId: getString(
      data.bookingId,
      documentId
    ),

    customerId: getString(
      data.customerId ??
        data.userId
    ),

    customerName: getString(
      data.customerName,
      "Velora Customer"
    ),

    customerPhone: getString(
      data.phoneNumber ??
        data.customerPhone
    ),

    pickup:
      typeof data.pickup === "string"
        ? data.pickup
        : getString(
            pickupData?.address
          ),

    dropoff:
      getString(
        data.drop,
        typeof data.dropoff ===
          "string"
          ? data.dropoff
          : getString(
              dropoffData?.address
            )
      ),

    pickupCoordinates:
      pickupLatitude !== undefined &&
      pickupLongitude !== undefined
        ? {
            latitude: getNumber(
              pickupLatitude
            ),
            longitude: getNumber(
              pickupLongitude
            ),
          }
        : null,

    dropoffCoordinates:
      dropoffLatitude !== undefined &&
      dropoffLongitude !== undefined
        ? {
            latitude: getNumber(
              dropoffLatitude
            ),
            longitude: getNumber(
              dropoffLongitude
            ),
          }
        : null,

    distanceKm: getNumber(
      data.distanceKm ??
        data.distance,
      0
    ),

    durationMinutes: getNumber(
      data.durationMinutes,
      0
    ),

    finalFare: getNumber(
      data.fare?.finalFare ??
        data.finalFare ??
        data.estimatedFare,
      0
    ),

    paymentMethod: getString(
      data.paymentMethod,
      "cash"
    ),

    paymentStatus: getString(
      data.paymentStatus,
      "pending"
    ),

    vehicleType: getString(
      data.vehicleName ??
        data.vehicleType,
      "Ride"
    ),

    rideStatus: getString(
      data.rideStatus ??
        data.status,
      "pending"
    ).toLowerCase(),

    specialInstructions:
      getString(
        data.specialInstructions
      ),

    pickupEtaMinutes: getNumber(
      data.pickupEtaMinutes,
      0
    ),

    driverDistanceToPickupKm:
      getNumber(
        data.driverDistanceToPickupKm ??
          data.driverRequestDistanceKm,
        0
      ),
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}
export default function DriverDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [driverProfile, setDriverProfile] =
    useState<DriverProfile | null>(null);

  const [incomingRide, setIncomingRide] =
    useState<RideData | null>(null);

  const [activeRide, setActiveRide] =
    useState<RideData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState<DriverAction>(null);

  const [secondsRemaining, setSecondsRemaining] =
    useState(0);

  const [error, setError] =
    useState("");

  const timeoutHandledRef =
    useRef(false);

  useEffect(() => {
    let unsubscribeDriver:
      | (() => void)
      | undefined;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          unsubscribeDriver?.();

          if (!user) {
            router.replace(
              "/driver/login"
            );
            return;
          }

          setCurrentUser(user);
          setError("");

          const driverReference = doc(
            db,
            "drivers",
            user.uid
          );

          unsubscribeDriver = onSnapshot(
            driverReference,
            (snapshot) => {
              if (!snapshot.exists()) {
                setDriverProfile(null);
                setError(
                  "Driver profile not found."
                );
                setLoading(false);
                return;
              }

              const profile =
                normalizeDriverProfile(
                  snapshot.id,
                  snapshot.data()
                );

              setDriverProfile(profile);
              setLoading(false);
            },
            (snapshotError) => {
              console.error(
                "Driver profile listener failed:",
                snapshotError
              );

              setError(
                "Unable to load driver profile."
              );

              setLoading(false);
            }
          );
        }
      );

    return () => {
      unsubscribeAuth();
      unsubscribeDriver?.();
    };
  }, [router]);

  useEffect(() => {
    if (
      !driverProfile?.incomingRideId
    ) {
      setIncomingRide(null);
      setSecondsRemaining(0);
      return;
    }

    const bookingReference = doc(
      db,
      "bookings",
      driverProfile.incomingRideId
    );

    return onSnapshot(
      bookingReference,
      (snapshot) => {
        if (!snapshot.exists()) {
          setIncomingRide(null);
          return;
        }

        setIncomingRide(
          normalizeRide(
            snapshot.id,
            snapshot.data()
          )
        );

        const requestExpiry =
          snapshot.data()
            .driverRequestExpiresAt;

        const expiryDate =
          requestExpiry?.toDate?.() ??
          (requestExpiry
            ? new Date(requestExpiry)
            : null);

        if (!expiryDate) {
          setSecondsRemaining(30);
          return;
        }

        setSecondsRemaining(
          Math.max(
            0,
            Math.ceil(
              (expiryDate.getTime() -
                Date.now()) /
                1000
            )
          )
        );

        timeoutHandledRef.current =
          false;
      },
      (snapshotError) => {
        console.error(
          "Incoming ride listener failed:",
          snapshotError
        );

        setError(
          "Unable to load incoming ride."
        );
      }
    );
  }, [driverProfile?.incomingRideId]);

  useEffect(() => {
    if (
      !driverProfile?.activeRideId
    ) {
      setActiveRide(null);
      return;
    }

    const bookingReference = doc(
      db,
      "bookings",
      driverProfile.activeRideId
    );

    return onSnapshot(
      bookingReference,
      (snapshot) => {
        if (!snapshot.exists()) {
          setActiveRide(null);
          return;
        }

        setActiveRide(
          normalizeRide(
            snapshot.id,
            snapshot.data()
          )
        );
      },
      (snapshotError) => {
        console.error(
          "Active ride listener failed:",
          snapshotError
        );

        setError(
          "Unable to load active ride."
        );
      }
    );
  }, [driverProfile?.activeRideId]);

  useEffect(() => {
    if (
      !incomingRide ||
      secondsRemaining <= 0
    ) {
      return;
    }

    const timerId = window.setInterval(
      () => {
        setSecondsRemaining(
          (currentSeconds) =>
            Math.max(
              0,
              currentSeconds - 1
            )
        );
      },
      1000
    );

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    incomingRide,
    secondsRemaining,
  ]);

  useEffect(() => {
    if (
      !currentUser ||
      !incomingRide ||
      secondsRemaining > 0 ||
      timeoutHandledRef.current
    ) {
      return;
    }

    timeoutHandledRef.current = true;

    void handleRejectRide(true);
  }, [
    currentUser,
    incomingRide,
    secondsRemaining,
  ]);

  const driverCoordinates =
    useMemo<Coordinates | null>(
      () => {
        if (
          driverProfile
            ?.currentLatitude === null ||
          driverProfile
            ?.currentLongitude === null ||
          driverProfile
            ?.currentLatitude ===
            undefined ||
          driverProfile
            ?.currentLongitude ===
            undefined
        ) {
          return null;
        }

        return {
          latitude:
            driverProfile.currentLatitude,

          longitude:
            driverProfile.currentLongitude,
        };
      },
      [
        driverProfile
          ?.currentLatitude,
        driverProfile
          ?.currentLongitude,
      ]
    );

  const isOnline =
    driverProfile?.status ===
      "online" ||
    driverProfile?.isOnline === true;

  const hasActiveRide =
    Boolean(
      driverProfile?.activeRideId &&
        activeRide
    );

  const displayRide =
    activeRide ?? incomingRide;

  async function handleToggleOnline() {
    if (
      !currentUser ||
      !driverProfile ||
      hasActiveRide
    ) {
      return;
    }

    try {
      setActionLoading("online");
      setError("");

      const nextOnlineState =
        !isOnline;

      await updateDoc(
        doc(
          db,
          "drivers",
          currentUser.uid
        ),
        {
          status: nextOnlineState
            ? "online"
            : "offline",

          isOnline: nextOnlineState,

          lastSeenAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (toggleError) {
      console.error(
        "Online status update failed:",
        toggleError
      );

      setError(
        "Unable to change online status."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAcceptRide() {
    if (
      !currentUser ||
      !driverProfile ||
      !incomingRide
    ) {
      return;
    }

    try {
      setActionLoading("accept");
      setError("");

      const driverReference = doc(
        db,
        "drivers",
        currentUser.uid
      );

      const bookingReference = doc(
        db,
        "bookings",
        incomingRide.id
      );

      await runTransaction(
        db,
        async (transaction) => {
          const driverSnapshot =
            await transaction.get(
              driverReference
            );

          const bookingSnapshot =
            await transaction.get(
              bookingReference
            );

          if (
            !driverSnapshot.exists() ||
            !bookingSnapshot.exists()
          ) {
            throw new Error(
              "Ride request is no longer available."
            );
          }

          const latestDriver =
            driverSnapshot.data();

          const latestBooking =
            bookingSnapshot.data();

          if (
            latestBooking
              .requestedDriverId !==
            currentUser.uid
          ) {
            throw new Error(
              "This ride has already moved to another driver."
            );
          }

          const rideStatus =
            getString(
              latestBooking.rideStatus ??
                latestBooking.status
            ).toLowerCase();

          if (
            rideStatus !==
            "searching_driver"
          ) {
            throw new Error(
              "This ride is no longer available."
            );
          }

          if (
            getString(
              latestDriver.status
            ) !== "online"
          ) {
            throw new Error(
              "You must be online to accept this ride."
            );
          }

          transaction.update(
            bookingReference,
            {
              rideStatus:
                "driver_assigned",

              status:
                "driver_assigned",

              driverId:
                currentUser.uid,

              driverName:
                driverProfile.name,

              driverPhone:
                driverProfile.phoneNumber,

              driverPhotoURL:
                driverProfile.photoURL,

              driverRating:
                driverProfile.rating,

              driverTotalRides:
                driverProfile.totalRides,

              vehicleId:
                driverProfile.vehicleId,

              vehicleName:
                driverProfile.vehicleName,

              vehicleModel:
                driverProfile.vehicleModel,

              vehicleNumber:
                driverProfile.vehicleNumber,

              vehicleColor:
                driverProfile.vehicleColor,

              vehicleSeats:
                driverProfile.vehicleSeats,

              driverDistanceToPickupKm:
                incomingRide
                  .driverDistanceToPickupKm,

              pickupEtaMinutes:
                incomingRide
                  .pickupEtaMinutes,

              acceptedAt:
                serverTimestamp(),

              requestedDriverId: "",

              driverRequestExpiresAt:
                null,

              updatedAt:
                serverTimestamp(),
            }
          );

          transaction.update(
            driverReference,
            {
              status: "busy",

              isOnline: true,

              incomingRideId: "",

              activeRideId:
                incomingRide.id,

              rideRequestStatus:
                "accepted",

              rideRequestExpiresAt:
                null,

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );
    } catch (acceptError) {
      console.error(
        "Ride accept failed:",
        acceptError
      );

      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept ride."
      );
    } finally {
      setActionLoading(null);
    }
  }
    async function handleRejectRide(
    timedOut = false
  ) {
    if (
      !currentUser ||
      !incomingRide
    ) {
      return;
    }

    try {
      setActionLoading("reject");
      setError("");

      await rejectDriverRequest({
        bookingDocumentId:
          incomingRide.id,

        driverId:
          currentUser.uid,
      });
    } catch (rejectError) {
      console.error(
        "Ride rejection failed:",
        rejectError
      );

      setError(
        rejectError instanceof Error
          ? rejectError.message
          : timedOut
            ? "Ride request expired."
            : "Unable to reject ride."
      );

      try {
        await dispatchRide(
          incomingRide.id
        );
      } catch (dispatchError) {
        console.error(
          "Next driver dispatch failed:",
          dispatchError
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDriverArrived() {
    if (
      !currentUser ||
      !driverProfile ||
      !activeRide
    ) {
      return;
    }

    try {
      setActionLoading("arrived");
      setError("");

      const bookingReference = doc(
        db,
        "bookings",
        activeRide.id
      );

      await runTransaction(
        db,
        async (transaction) => {
          const bookingSnapshot =
            await transaction.get(
              bookingReference
            );

          if (!bookingSnapshot.exists()) {
            throw new Error(
              "Active ride not found."
            );
          }

          const bookingData =
            bookingSnapshot.data();

          if (
            bookingData.driverId !==
            currentUser.uid
          ) {
            throw new Error(
              "This ride is not assigned to you."
            );
          }

          const currentStatus =
            getString(
              bookingData.rideStatus ??
                bookingData.status
            ).toLowerCase();

          if (
            currentStatus !==
              "driver_assigned" &&
            currentStatus !==
              "driver_arriving"
          ) {
            throw new Error(
              "Driver arrival cannot be marked at this stage."
            );
          }

          transaction.update(
            bookingReference,
            {
              rideStatus:
                "start_otp_pending",

              status:
                "start_otp_pending",

              arrivedAt:
                serverTimestamp(),

              pickupEtaMinutes: 0,

              driverDistanceToPickupKm: 0,

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );
    } catch (arrivalError) {
      console.error(
        "Driver arrival update failed:",
        arrivalError
      );

      setError(
        arrivalError instanceof Error
          ? arrivalError.message
          : "Unable to mark driver arrival."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStartRide() {
    if (
      !currentUser ||
      !activeRide
    ) {
      return;
    }

    try {
      setActionLoading("start");
      setError("");

      const bookingReference = doc(
        db,
        "bookings",
        activeRide.id
      );

      await runTransaction(
        db,
        async (transaction) => {
          const bookingSnapshot =
            await transaction.get(
              bookingReference
            );

          if (!bookingSnapshot.exists()) {
            throw new Error(
              "Active ride not found."
            );
          }

          const bookingData =
            bookingSnapshot.data();

          if (
            bookingData.driverId !==
            currentUser.uid
          ) {
            throw new Error(
              "This ride is not assigned to you."
            );
          }

          const startOtpVerified =
            bookingData.startOtpVerified ===
              true ||
            bookingData.otp
              ?.startOtpVerified === true;

          if (!startOtpVerified) {
            throw new Error(
              "Start OTP must be verified first."
            );
          }

          transaction.update(
            bookingReference,
            {
              rideStatus:
                "in_progress",

              status:
                "in_progress",

              startedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );
    } catch (startError) {
      console.error(
        "Ride start failed:",
        startError
      );

      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start ride."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCompleteRide() {
    if (
      !currentUser ||
      !driverProfile ||
      !activeRide
    ) {
      return;
    }

    try {
      setActionLoading("complete");
      setError("");

      const bookingReference = doc(
        db,
        "bookings",
        activeRide.id
      );

      const driverReference = doc(
        db,
        "drivers",
        currentUser.uid
      );

      await runTransaction(
        db,
        async (transaction) => {
          const bookingSnapshot =
            await transaction.get(
              bookingReference
            );

          const driverSnapshot =
            await transaction.get(
              driverReference
            );

          if (
            !bookingSnapshot.exists() ||
            !driverSnapshot.exists()
          ) {
            throw new Error(
              "Ride or driver profile not found."
            );
          }

          const bookingData =
            bookingSnapshot.data();

          if (
            bookingData.driverId !==
            currentUser.uid
          ) {
            throw new Error(
              "This ride is not assigned to you."
            );
          }

          const stopOtpVerified =
            bookingData.stopOtpVerified ===
              true ||
            bookingData.otp
              ?.stopOtpVerified === true;

          if (!stopOtpVerified) {
            throw new Error(
              "End OTP must be verified first."
            );
          }

          transaction.update(
            bookingReference,
            {
              rideStatus:
                "completed",

              status:
                "completed",

              completedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );

          transaction.update(
            driverReference,
            {
              status: "online",

              isOnline: true,

              activeRideId: "",

              incomingRideId: "",

              rideRequestStatus: "",

              totalRides:
                driverProfile.totalRides +
                1,

              todayTrips:
                driverProfile.todayTrips +
                1,

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );
    } catch (completeError) {
      console.error(
        "Ride completion failed:",
        completeError
      );

      setError(
        completeError instanceof Error
          ? completeError.message
          : "Unable to complete ride."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() {
    try {
      if (
        currentUser &&
        driverProfile &&
        !hasActiveRide
      ) {
        await updateDoc(
          doc(
            db,
            "drivers",
            currentUser.uid
          ),
          {
            status: "offline",
            isOnline: false,

            lastSeenAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      await signOut(auth);

      router.replace(
        "/driver/login"
      );
    } catch (logoutError) {
      console.error(
        "Driver logout failed:",
        logoutError
      );

      setError(
        "Unable to logout."
      );
    }
  }

  function handleWithdraw() {
    router.push(
      "/driver/wallet"
    );
  }

  function handleCallCustomer() {
    if (!displayRide?.customerPhone) {
      setError(
        "Customer phone number is not available."
      );
      return;
    }

    window.location.href =
      `tel:${displayRide.customerPhone}`;
  }

  function handleNavigate() {
    if (!displayRide) {
      return;
    }

    const destination =
      displayRide.rideStatus ===
        "in_progress"
        ? displayRide.dropoffCoordinates
        : displayRide.pickupCoordinates;

    if (!destination) {
      setError(
        "Navigation coordinates are not available."
      );
      return;
    }

    const navigationUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${encodeURIComponent(
        `${destination.latitude},${destination.longitude}`
      )}` +
      `&travelmode=driving`;

    window.open(
      navigationUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070c] text-white">
        <div className="text-center">
          <LoaderCircle
            size={44}
            className="mx-auto animate-spin text-amber-400"
          />

          <p className="mt-4 text-sm text-white/45">
            Loading driver portal...
          </p>
        </div>
      </main>
    );
  }

  if (!driverProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070c] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-7 text-center">
          <AlertCircle
            size={40}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-5 text-2xl font-bold">
            Driver Profile Missing
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            Your driver profile could not be
            loaded. Contact Velora support.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-xl bg-white px-5 py-3 font-bold text-black"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }
    return (
    <main className="min-h-screen bg-[#05070c] text-white">
      <div className="flex min-h-screen">
        <DriverSidebar
          driverName={driverProfile.name}
          driverPhotoURL={driverProfile.photoURL}
          rating={driverProfile.rating}
          online={isOnline}
        />

        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1600px] space-y-7 px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pt-8">
            <DriverTopbar
              online={isOnline}
              todayEarning={
                driverProfile.todayEarnings
              }
              walletBalance={
                driverProfile.walletBalance
              }
              rating={driverProfile.rating}
              onToggleOnline={
                handleToggleOnline
              }
              loading={
                actionLoading === "online"
              }
            />

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <span className="leading-6">
                  {error}
                </span>
              </div>
            )}

            {!driverProfile.isApproved && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-200">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-bold">
                    Driver approval pending
                  </p>

                  <p className="mt-1 leading-6 text-amber-100/60">
                    You will be able to receive
                    ride requests after Velora
                    approves your profile.
                  </p>
                </div>
              </div>
            )}

            <DriverAnalytics
              todayTrips={
                driverProfile.todayTrips
              }
              todayEarnings={
                driverProfile.todayEarnings
              }
              rating={driverProfile.rating}
              onlineHours={
                driverProfile.onlineHours
              }
              acceptanceRate={
                driverProfile.acceptanceRate
              }
              cancellationRate={
                driverProfile.cancellationRate
              }
            />

            <div className="grid gap-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.75fr)]">
              <section className="space-y-7">
                {incomingRide && !activeRide && (
                  <div className="overflow-hidden rounded-[32px] border border-amber-400/25 bg-[#0b1018] shadow-2xl">
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-amber-400/10 p-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                          New Ride Request
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                          {incomingRide.bookingId}
                        </h2>
                      </div>

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-black/30 text-2xl font-extrabold text-amber-400">
                        {secondsRemaining}
                      </div>
                    </div>

                    <div className="p-6 sm:p-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                          <div className="flex items-start gap-3">
                            <MapPin
                              size={20}
                              className="mt-0.5 shrink-0 text-green-400"
                            />

                            <div>
                              <p className="text-xs uppercase tracking-wide text-white/35">
                                Pickup
                              </p>

                              <p className="mt-2 font-semibold leading-6 text-white">
                                {incomingRide.pickup ||
                                  "Pickup unavailable"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                          <div className="flex items-start gap-3">
                            <Navigation
                              size={20}
                              className="mt-0.5 shrink-0 text-red-400"
                            />

                            <div>
                              <p className="text-xs uppercase tracking-wide text-white/35">
                                Destination
                              </p>

                              <p className="mt-2 font-semibold leading-6 text-white">
                                {incomingRide.dropoff ||
                                  "Destination unavailable"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <DriverRideMetric
                          label="Distance"
                          value={
                            incomingRide.distanceKm > 0
                              ? `${incomingRide.distanceKm} km`
                              : "—"
                          }
                          icon={Route}
                        />

                        <DriverRideMetric
                          label="Duration"
                          value={
                            incomingRide.durationMinutes >
                            0
                              ? `${incomingRide.durationMinutes} min`
                              : "—"
                          }
                          icon={Clock3}
                        />

                        <DriverRideMetric
                          label="Fare"
                          value={formatCurrency(
                            incomingRide.finalFare
                          )}
                          icon={CheckCircle2}
                        />

                        <DriverRideMetric
                          label="Payment"
                          value={
                            incomingRide.paymentMethod
                          }
                          icon={CheckCircle2}
                        />
                      </div>

                      {incomingRide.specialInstructions && (
                        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                          <p className="text-xs uppercase tracking-wide text-white/35">
                            Customer Instructions
                          </p>

                          <p className="mt-2 text-sm leading-6 text-white/70">
                            {
                              incomingRide.specialInstructions
                            }
                          </p>
                        </div>
                      )}

                      <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRejectRide(false)
                          }
                          disabled={
                            actionLoading !== null
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-4 font-bold text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ===
                          "reject" ? (
                            <LoaderCircle
                              size={19}
                              className="animate-spin"
                            />
                          ) : (
                            <XCircle size={19} />
                          )}

                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleAcceptRide
                          }
                          disabled={
                            actionLoading !==
                              null ||
                            secondsRemaining <= 0 ||
                            !driverProfile.isApproved
                          }
                          className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ===
                          "accept" ? (
                            <LoaderCircle
                              size={19}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={19}
                            />
                          )}

                          Accept Ride
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeRide && (
                  <div className="space-y-6">
                    <LiveRideMap
                      customerName={
                        activeRide.customerName
                      }
                      customerPhone={
                        activeRide.customerPhone
                      }
                      pickup={activeRide.pickup}
                      dropoff={
                        activeRide.dropoff
                      }
                      pickupCoordinates={
                        activeRide.pickupCoordinates
                      }
                      dropoffCoordinates={
                        activeRide.dropoffCoordinates
                      }
                      driverCoordinates={
                        driverCoordinates
                      }
                      etaMinutes={
                        activeRide.pickupEtaMinutes
                      }
                      distanceKm={
                        activeRide.driverDistanceToPickupKm ||
                        activeRide.distanceKm
                      }
                      onCallCustomer={
                        handleCallCustomer
                      }
                      onNavigate={
                        handleNavigate
                      }
                    />
                  </div>
                )}

                {!incomingRide &&
                  !activeRide && (
                    <section className="rounded-[32px] border border-white/10 bg-[#0b1018] px-6 py-16 text-center shadow-xl">
                      <Clock3
                        size={42}
                        className="mx-auto text-amber-400"
                      />

                      <h2 className="mt-5 text-2xl font-bold">
                        {isOnline
                          ? "Waiting for Ride Requests"
                          : "You Are Offline"}
                      </h2>

                      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/45">
                        {isOnline
                          ? "Keep this portal open. New nearby ride requests will appear automatically."
                          : "Go online to start receiving nearby customer ride requests."}
                      </p>

                      {!isOnline && (
                        <button
                          type="button"
                          onClick={
                            handleToggleOnline
                          }
                          disabled={
                            actionLoading !== null ||
                            !driverProfile.isApproved
                          }
                          className="mt-7 rounded-xl bg-amber-400 px-7 py-4 font-bold text-black transition hover:bg-amber-300 disabled:opacity-50"
                        >
                          Go Online
                        </button>
                      )}
                    </section>
                  )}
              </section>

              <aside className="space-y-7">
                <DriverWalletCard
                  walletBalance={
                    driverProfile.walletBalance
                  }
                  pendingBalance={
                    driverProfile.pendingBalance
                  }
                  todayEarnings={
                    driverProfile.todayEarnings
                  }
                  onWithdraw={
                    handleWithdraw
                  }
                />
              </aside>
            </div>
                        {activeRide && (
              <section className="rounded-[32px] border border-white/10 bg-[#0b1018] p-6 shadow-xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                      Active Ride Control
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {activeRide.bookingId}
                    </h2>

                    <p className="mt-2 text-sm capitalize text-white/45">
                      Status:{" "}
                      {activeRide.rideStatus.replace(
                        /_/g,
                        " "
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-right">
                    <p className="text-xs uppercase tracking-wide text-white/40">
                      Ride Fare
                    </p>

                    <p className="mt-1 text-2xl font-extrabold text-amber-400">
                      {formatCurrency(
                        activeRide.finalFare
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {(activeRide.rideStatus ===
                    "driver_assigned" ||
                    activeRide.rideStatus ===
                      "driver_arriving") && (
                    <button
                      type="button"
                      onClick={
                        handleDriverArrived
                      }
                      disabled={
                        actionLoading !== null
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-4 font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ===
                      "arrived" ? (
                        <LoaderCircle
                          size={19}
                          className="animate-spin"
                        />
                      ) : (
                        <MapPin size={19} />
                      )}

                      Reached Pickup
                    </button>
                  )}

                  {activeRide.rideStatus ===
                    "start_otp_pending" && (
                    <button
                      type="button"
                      onClick={handleStartRide}
                      disabled={
                        actionLoading !== null
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ===
                      "start" ? (
                        <LoaderCircle
                          size={19}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2
                          size={19}
                        />
                      )}

                      Start Ride
                    </button>
                  )}

                  {activeRide.rideStatus ===
                    "in_progress" && (
                    <button
                      type="button"
                      onClick={
                        handleCompleteRide
                      }
                      disabled={
                        actionLoading !== null
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-4 font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ===
                      "complete" ? (
                        <LoaderCircle
                          size={19}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2
                          size={19}
                        />
                      )}

                      Complete Ride
                    </button>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-wide text-white/35">
                    Current Stage
                  </p>

                  <p className="mt-2 text-sm font-semibold capitalize text-white/75">
                    {activeRide.rideStatus.replace(
                      /_/g,
                      " "
                    )}
                  </p>
                </div>
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <QuickInfoCard
                label="Vehicle"
                value={
                  driverProfile.vehicleName ||
                  driverProfile.vehicleModel ||
                  "Not added"
                }
              />

              <QuickInfoCard
                label="Vehicle Number"
                value={
                  driverProfile.vehicleNumber ||
                  "Not added"
                }
              />

              <QuickInfoCard
                label="Completed Rides"
                value={String(
                  driverProfile.totalRides
                )}
              />

              <QuickInfoCard
                label="Driver Rating"
                value={
                  driverProfile.rating > 0
                    ? driverProfile.rating.toFixed(
                        1
                      )
                    : "New"
                }
              />
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DriverRideMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Route;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <Icon
        size={18}
        className="text-amber-400"
      />

      <p className="mt-3 text-xs uppercase tracking-wide text-white/35">
        {label}
      </p>

      <p className="mt-2 truncate font-bold capitalize text-white">
        {value}
      </p>
    </div>
  );
}

function QuickInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0b1018] p-5">
      <p className="text-xs uppercase tracking-wide text-white/35">
        {label}
      </p>

      <p className="mt-3 truncate text-lg font-bold text-white">
        {value}
      </p>
    </article>
  );
}