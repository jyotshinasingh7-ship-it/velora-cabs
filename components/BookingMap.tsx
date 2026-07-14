"use client";

import { useEffect, useRef, useState } from "react";

import {
  loadMapsLibrary,
  loadRoutesLibrary,
} from "@/lib/googleMaps";

interface BookingMapProps {
  pickup: string;
  dropoff: string;
  pickupPlaceId?: string;
  dropoffPlaceId?: string;
  onDistanceChange?: (
    distanceMeters: number,
    durationSeconds: number
  ) => void;
}

export default function BookingMap({
  pickup,
  dropoff,
  pickupPlaceId = "",
  dropoffPlaceId = "",
  onDistanceChange,
}: BookingMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<google.maps.Map | null>(null);

  const directionsRendererRef =
    useRef<google.maps.DirectionsRenderer | null>(
      null
    );

  const onDistanceChangeRef =
    useRef(onDistanceChange);

  const [mapReady, setMapReady] =
    useState(false);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [mapError, setMapError] =
    useState<string | null>(null);

  useEffect(() => {
    onDistanceChangeRef.current =
      onDistanceChange;
  }, [onDistanceChange]);

  useEffect(() => {
    let isMounted = true;

    async function initializeMap() {
      try {
        setMapError(null);

        const { Map } =
          await loadMapsLibrary();

        const { DirectionsRenderer } =
          await loadRoutesLibrary();

        if (
          !isMounted ||
          !mapContainerRef.current
        ) {
          return;
        }

        const map = new Map(
          mapContainerRef.current,
          {
            center: {
              lat: 28.6139,
              lng: 77.209,
            },
            zoom: 10,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            clickableIcons: false,
            gestureHandling: "cooperative",
            backgroundColor: "#111827",
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [
                  {
                    visibility: "off",
                  },
                ],
              },
              {
                featureType: "transit",
                elementType: "labels",
                stylers: [
                  {
                    visibility: "off",
                  },
                ],
              },
            ],
          }
        );

        const directionsRenderer =
          new DirectionsRenderer({
            map,
            suppressMarkers: false,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: "#fbbf24",
              strokeOpacity: 0.95,
              strokeWeight: 6,
            },
          });

        mapRef.current = map;

        directionsRendererRef.current =
          directionsRenderer;

        setMapReady(true);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMapError(
          error instanceof Error
            ? error.message
            : "Google Maps could not be loaded."
        );
      }
    }

    void initializeMap();

    return () => {
      isMounted = false;

      directionsRendererRef.current?.setMap(
        null
      );

      directionsRendererRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !directionsRendererRef.current
    ) {
      return;
    }

    const cleanPickupPlaceId =
      pickupPlaceId.trim();

    const cleanDropoffPlaceId =
      dropoffPlaceId.trim();

    /*
     * Do not request a route from incomplete
     * or manually typed location text.
     */
    if (
      !cleanPickupPlaceId ||
      !cleanDropoffPlaceId
    ) {
      directionsRendererRef.current.set(
        "directions",
        null
      );

      onDistanceChangeRef.current?.(0, 0);

      setRouteLoading(false);
      setMapError(null);

      return;
    }

    if (
      cleanPickupPlaceId ===
      cleanDropoffPlaceId
    ) {
      directionsRendererRef.current.set(
        "directions",
        null
      );

      onDistanceChangeRef.current?.(0, 0);

      setMapError(
        "Pickup and drop-off locations cannot be the same."
      );

      return;
    }

    let cancelled = false;

    async function calculateRoute() {
      try {
        setRouteLoading(true);
        setMapError(null);

        const { DirectionsService } =
          await loadRoutesLibrary();

        if (cancelled) {
          return;
        }

        const directionsService =
          new DirectionsService();

        const result =
          await directionsService.route({
            origin: {
              placeId:
                cleanPickupPlaceId,
            },
            destination: {
              placeId:
                cleanDropoffPlaceId,
            },
            travelMode:
              google.maps.TravelMode.DRIVING,
            unitSystem:
              google.maps.UnitSystem.METRIC,
            provideRouteAlternatives: false,
            avoidHighways: false,
            avoidTolls: false,
          });

        if (cancelled) {
          return;
        }

        const route = result.routes[0];
        const leg = route?.legs[0];

        if (!route || !leg) {
          throw new Error(
            "No driving route was found between these locations."
          );
        }

        directionsRendererRef.current
          ?.setDirections(result);

        const distanceMeters =
          leg.distance?.value ?? 0;

        const durationSeconds =
          leg.duration?.value ?? 0;

        onDistanceChangeRef.current?.(
          distanceMeters,
          durationSeconds
        );
      } catch (routeError) {
        if (cancelled) {
          return;
        }

        directionsRendererRef.current?.set(
          "directions",
          null
        );

        onDistanceChangeRef.current?.(0, 0);

        const status = typeof routeError === "object" && routeError !== null && "code" in routeError
          ? String((routeError as { code?: unknown }).code)
          : "";
        setMapError(status.includes("ZERO_RESULTS")
          ? "No driving route exists between the selected locations."
          : "A driving route could not be calculated. Please select both locations again from the Google suggestions.");
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    }

    void calculateRoute();

    return () => {
      cancelled = true;
    };
  }, [
    mapReady,
    pickupPlaceId,
    dropoffPlaceId,
  ]);

  const waitingForLocations =
    !pickupPlaceId.trim() ||
    !dropoffPlaceId.trim();

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-950">
      <div
        ref={mapContainerRef}
        className="h-full min-h-[360px] w-full"
        aria-label="Pickup and drop-off route map"
      />

      {!mapReady && !mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/80 px-5 py-3 text-sm font-medium text-white shadow-xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-amber-400" />

            Loading map...
          </div>
        </div>
      )}

      {routeLoading && (
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/85 px-5 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-md">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-amber-400" />

            Calculating route...
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-red-400/30 bg-red-950/90 px-4 py-3 text-sm text-red-100 shadow-xl backdrop-blur-md">
          <p className="font-semibold">
            Route unavailable
          </p>

          <p className="mt-1 text-xs leading-5 text-red-200">
            {mapError}
          </p>
        </div>
      )}

      {mapReady &&
        !routeLoading &&
        !mapError &&
        waitingForLocations && (
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-center text-sm leading-6 text-white/75 shadow-xl backdrop-blur-md">
            Select pickup and drop-off from
            Google suggestions to view the
            route.
          </div>
        )}

      {mapReady &&
        !routeLoading &&
        !mapError &&
        !waitingForLocations && (
          <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-32px)] rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-xs text-white/70 shadow-xl backdrop-blur-md">
            <p className="truncate">
              <span className="text-amber-400">
                From:
              </span>{" "}
              {pickup}
            </p>

            <p className="mt-1 truncate">
              <span className="text-amber-400">
                To:
              </span>{" "}
              {dropoff}
            </p>
          </div>
        )}
    </div>
  );
}
