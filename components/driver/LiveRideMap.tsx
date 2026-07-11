"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AdvancedMarker,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  Route,
} from "lucide-react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LiveRideMapProps {
  customerName: string;
  customerPhone?: string;

  pickup: string;
  dropoff: string;

  pickupCoordinates?: Coordinates | null;
  dropoffCoordinates?: Coordinates | null;
  driverCoordinates?: Coordinates | null;

  etaMinutes: number;
  distanceKm: number;

  onCallCustomer?: () => void;
  onNavigate?: () => void;
}

interface RouteRendererProps {
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  onRouteCalculated?: (
    distanceKm: number,
    durationMinutes: number
  ) => void;
}

function RouteRenderer({
  origin,
  destination,
  onRouteCalculated,
}: RouteRendererProps) {
  const map = useMap();
  const rendererRef =
    useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (
      !map ||
      !origin ||
      !destination ||
      typeof google === "undefined"
    ) {
      return;
    }

    const directionsService =
      new google.maps.DirectionsService();

    const directionsRenderer =
      new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: "#fbbf24",
          strokeOpacity: 0.9,
          strokeWeight: 5,
        },
      });

    rendererRef.current = directionsRenderer;

    directionsService.route(
      {
        origin,
        destination,
        travelMode:
          google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        if (
          status !==
            google.maps.DirectionsStatus.OK ||
          !result
        ) {
          return;
        }

        directionsRenderer.setDirections(
          result
        );

        const route =
          result.routes[0]?.legs[0];

        if (!route) {
          return;
        }

        const calculatedDistance =
          Number(
            (
              (route.distance?.value ?? 0) /
              1000
            ).toFixed(2)
          );

        const calculatedDuration =
          Math.ceil(
            (route.duration?.value ?? 0) /
              60
          );

        onRouteCalculated?.(
          calculatedDistance,
          calculatedDuration
        );
      }
    );

    return () => {
      directionsRenderer.setMap(null);
      rendererRef.current = null;
    };
  }, [
    destination,
    map,
    onRouteCalculated,
    origin,
  ]);

  return null;
}

export default function LiveRideMap({
  customerName,
  customerPhone = "",
  pickup,
  dropoff,
  pickupCoordinates = null,
  dropoffCoordinates = null,
  driverCoordinates = null,
  etaMinutes,
  distanceKm,
  onCallCustomer,
  onNavigate,
}: LiveRideMapProps) {
  const [
    calculatedEtaMinutes,
    setCalculatedEtaMinutes,
  ] = useState(etaMinutes);

  const [
    calculatedDistanceKm,
    setCalculatedDistanceKm,
  ] = useState(distanceKm);

  const [mapLoaded, setMapLoaded] =
    useState(false);

  useEffect(() => {
    setCalculatedEtaMinutes(etaMinutes);
  }, [etaMinutes]);

  useEffect(() => {
    setCalculatedDistanceKm(distanceKm);
  }, [distanceKm]);

  const driverPosition =
    useMemo<google.maps.LatLngLiteral | null>(
      () => {
        if (!driverCoordinates) {
          return null;
        }

        return {
          lat: driverCoordinates.latitude,
          lng: driverCoordinates.longitude,
        };
      },
      [driverCoordinates]
    );

  const pickupPosition =
    useMemo<google.maps.LatLngLiteral | null>(
      () => {
        if (!pickupCoordinates) {
          return null;
        }

        return {
          lat: pickupCoordinates.latitude,
          lng: pickupCoordinates.longitude,
        };
      },
      [pickupCoordinates]
    );

  const dropoffPosition =
    useMemo<google.maps.LatLngLiteral | null>(
      () => {
        if (!dropoffCoordinates) {
          return null;
        }

        return {
          lat: dropoffCoordinates.latitude,
          lng: dropoffCoordinates.longitude,
        };
      },
      [dropoffCoordinates]
    );

  const mapCenter =
    driverPosition ??
    pickupPosition ??
    dropoffPosition ?? {
      lat: 27.4924,
      lng: 77.6737,
    };

  function openGoogleNavigation() {
    if (onNavigate) {
      onNavigate();
      return;
    }

    const destination =
      pickupPosition ?? dropoffPosition;

    if (!destination) {
      alert(
        "Navigation coordinates are not available."
      );
      return;
    }

    const originQuery = driverPosition
      ? `${driverPosition.lat},${driverPosition.lng}`
      : "Current Location";

    const destinationQuery =
      `${destination.lat},${destination.lng}`;

    const navigationUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(
        originQuery
      )}` +
      `&destination=${encodeURIComponent(
        destinationQuery
      )}` +
      `&travelmode=driving`;

    window.open(
      navigationUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function callCustomer() {
    if (onCallCustomer) {
      onCallCustomer();
      return;
    }

    if (!customerPhone) {
      alert(
        "Customer phone number is not available."
      );
      return;
    }

    window.location.href =
      `tel:${customerPhone}`;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1018] shadow-2xl">
      <div className="relative h-[420px] bg-slate-900">
        {!mapLoaded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1018]">
            <div className="text-center">
              <LoaderCircle
                size={34}
                className="mx-auto animate-spin text-amber-400"
              />

              <p className="mt-3 text-sm text-white/45">
                Loading live navigation...
              </p>
            </div>
          </div>
        )}

        <Map
          defaultCenter={mapCenter}
          center={mapCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI
          mapId={
            process.env
              .NEXT_PUBLIC_GOOGLE_MAP_ID ||
            "DEMO_MAP_ID"
          }
          onTilesLoaded={() =>
            setMapLoaded(true)
          }
          className="h-full w-full"
        >
          {driverPosition && (
            <AdvancedMarker
              position={driverPosition}
              title="Driver location"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-amber-400 text-black shadow-xl">
                <Navigation size={20} />
              </div>
            </AdvancedMarker>
          )}

          {pickupPosition && (
            <AdvancedMarker
              position={pickupPosition}
              title="Pickup location"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-green-500 text-white shadow-xl">
                <MapPin size={18} />
              </div>
            </AdvancedMarker>
          )}

          {dropoffPosition && (
            <AdvancedMarker
              position={dropoffPosition}
              title="Drop-off location"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-red-500 text-white shadow-xl">
                <MapPin size={18} />
              </div>
            </AdvancedMarker>
          )}

          <RouteRenderer
            origin={
              driverPosition ??
              pickupPosition
            }
            destination={
              driverPosition
                ? pickupPosition
                : dropoffPosition
            }
            onRouteCalculated={(
              newDistance,
              newDuration
            ) => {
              setCalculatedDistanceKm(
                newDistance
              );

              setCalculatedEtaMinutes(
                newDuration
              );
            }}
          />
        </Map>

        <div className="absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-black/75 px-4 py-3 shadow-xl backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
            Customer
          </p>

          <h3 className="mt-1 truncate font-bold text-white">
            {customerName}
          </h3>
        </div>

        <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 shadow-xl backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Live ETA
          </p>

          <p className="mt-1 text-xl font-bold text-amber-400">
            {calculatedEtaMinutes > 0
              ? `${calculatedEtaMinutes} min`
              : "Updating"}
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start gap-3">
              <MapPin
                size={19}
                className="mt-0.5 shrink-0 text-green-400"
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-400">
                  Pickup
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-white">
                  {pickup || "Not available"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start gap-3">
              <MapPin
                size={19}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
                  Destination
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-white">
                  {dropoff ||
                    "Not available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-white/45">
                ETA
              </p>

              <h3 className="mt-2 text-2xl font-bold text-amber-400">
                {calculatedEtaMinutes > 0
                  ? `${calculatedEtaMinutes} min`
                  : "—"}
              </h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-white/45">
                Distance
              </p>

              <h3 className="mt-2 text-2xl font-bold text-cyan-400">
                {calculatedDistanceKm > 0
                  ? `${calculatedDistanceKm} km`
                  : "—"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={openGoogleNavigation}
            disabled={
              !pickupPosition &&
              !dropoffPosition
            }
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Navigation size={20} />
            Start Navigation
          </button>

          <button
            type="button"
            onClick={callCustomer}
            disabled={
              !customerPhone &&
              !onCallCustomer
            }
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 py-4 font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Phone size={20} />
            Call Customer
          </button>

          <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
            <Route
              size={18}
              className="mt-0.5 shrink-0 text-cyan-400"
            />

            <p className="text-xs leading-5 text-white/45">
              The route automatically updates
              when the driver&apos;s Firestore
              location changes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}