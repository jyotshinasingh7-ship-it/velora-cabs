"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, MapPin, Navigation, Phone, Route } from "lucide-react";
import { loadMapsLibrary, loadMarkerLibrary, loadRoutesLibrary } from "@/lib/googleMaps";

interface Coordinates { latitude: number; longitude: number; }
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

function validPosition(value?: Coordinates | null): google.maps.LatLngLiteral | null {
  if (!value || !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude) || Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180) return null;
  return { lat: value.latitude, lng: value.longitude };
}

function markerContent(kind: "driver" | "pickup" | "dropoff") {
  const element = document.createElement("div");
  const colors = kind === "driver" ? "bg-amber-400 text-black" : kind === "pickup" ? "bg-green-500 text-white" : "bg-red-500 text-white";
  element.className = `flex h-11 w-11 items-center justify-center rounded-full border-4 border-white ${colors} text-lg font-black shadow-xl`;
  element.textContent = kind === "driver" ? "➤" : "●";
  element.setAttribute("aria-label", `${kind} location`);
  return element;
}

export default function LiveRideMap({ customerName, customerPhone = "", pickup, dropoff, pickupCoordinates = null, dropoffCoordinates = null, driverCoordinates = null, etaMinutes, distanceKm, onCallCustomer, onNavigate }: LiveRideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const routeRequestRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [calculatedEtaMinutes, setCalculatedEtaMinutes] = useState(etaMinutes);
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState(distanceKm);

  useEffect(() => setCalculatedEtaMinutes(etaMinutes), [etaMinutes]);
  useEffect(() => setCalculatedDistanceKm(distanceKm), [distanceKm]);

  const driverPosition = useMemo(() => validPosition(driverCoordinates), [driverCoordinates]);
  const pickupPosition = useMemo(() => validPosition(pickupCoordinates), [pickupCoordinates]);
  const dropoffPosition = useMemo(() => validPosition(dropoffCoordinates), [dropoffCoordinates]);
  const fallbackCenter = useMemo(() => driverPosition ?? pickupPosition ?? dropoffPosition ?? { lat: 27.4924, lng: 77.6737 }, [driverPosition, dropoffPosition, pickupPosition]);

  useEffect(() => {
    let cancelled = false;
    let tilesListener: google.maps.MapsEventListener | null = null;
    async function initialize() {
      if (!containerRef.current) return;
      if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) { setMapError("Google Maps is not configured."); return; }
      try {
        const [{ Map }, , { AdvancedMarkerElement }] = await Promise.all([loadMapsLibrary(), loadRoutesLibrary(), loadMarkerLibrary()]);
        if (cancelled || !containerRef.current) return;
        mapRef.current = new Map(containerRef.current, { center: fallbackCenter, zoom: 14, gestureHandling: "greedy", disableDefaultUI: true, mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID" });
        rendererRef.current = new google.maps.DirectionsRenderer({ map: mapRef.current, suppressMarkers: true, preserveViewport: false, polylineOptions: { strokeColor: "#fbbf24", strokeOpacity: 0.9, strokeWeight: 5 } });
        // Retain the loaded constructor for marker updates without importing another loader.
        markerConstructorRef.current = AdvancedMarkerElement;
        tilesListener = google.maps.event.addListenerOnce(mapRef.current, "tilesloaded", () => { if (!cancelled) setMapReady(true); });
        window.setTimeout(() => { if (!cancelled) setMapReady(true); }, 5000);
      } catch (error) {
        if (!cancelled) setMapError(error instanceof Error && error.message.includes("API_KEY") ? "Google Maps is not configured." : "Unable to load live navigation.");
      }
    }
    void initialize();
    return () => {
      cancelled = true;
      routeRequestRef.current += 1;
      if (tilesListener) tilesListener.remove();
      markersRef.current.forEach(marker => { marker.map = null; });
      markersRef.current = [];
      rendererRef.current?.setMap(null);
      rendererRef.current = null;
      mapRef.current = null;
      markerConstructorRef.current = null;
    };
    // Map initialization must run once; later coordinate changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markerConstructorRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    const Marker = markerConstructorRef.current;
    if (!mapReady || !map || !Marker) return;
    markersRef.current.forEach(marker => { marker.map = null; });
    markersRef.current = [];
    for (const [kind, position, title] of [["driver", driverPosition, "Driver location"], ["pickup", pickupPosition, "Pickup location"], ["dropoff", dropoffPosition, "Drop-off location"]] as const) {
      if (position) markersRef.current.push(new Marker({ map, position, title, content: markerContent(kind) }));
    }

    const origin = driverPosition ?? pickupPosition;
    const destination = driverPosition ? pickupPosition : dropoffPosition;
    const renderer = rendererRef.current;
    const requestId = ++routeRequestRef.current;
    setRouteError("");
    if (!origin || !destination || !renderer) {
      renderer?.set("directions", null);
      map.setCenter(fallbackCenter);
      return;
    }
    const service = new google.maps.DirectionsService();
    service.route({ origin, destination, travelMode: google.maps.TravelMode.DRIVING, provideRouteAlternatives: false }, (result, status) => {
      if (requestId !== routeRequestRef.current) return;
      if (status !== google.maps.DirectionsStatus.OK || !result) { renderer.set("directions", null); setRouteError(status === google.maps.DirectionsStatus.ZERO_RESULTS ? "No driving route is available." : "Unable to update the live route."); return; }
      renderer.setDirections(result);
      const leg = result.routes[0]?.legs[0];
      if (leg) { setCalculatedDistanceKm(Number(((leg.distance?.value ?? 0) / 1000).toFixed(2))); setCalculatedEtaMinutes(Math.ceil((leg.duration?.value ?? 0) / 60)); }
    });
  }, [driverPosition, dropoffPosition, fallbackCenter, mapReady, pickupPosition]);

  function openGoogleNavigation() {
    if (onNavigate) { onNavigate(); return; }
    const destination = pickupPosition ?? dropoffPosition;
    if (!destination) return;
    const origin = driverPosition ? `${driverPosition.lat},${driverPosition.lng}` : "Current Location";
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(`${destination.lat},${destination.lng}`)}&travelmode=driving`, "_blank", "noopener,noreferrer");
  }
  function callCustomer() { if (onCallCustomer) { onCallCustomer(); return; } if (customerPhone) window.location.href = `tel:${customerPhone}`; }

  return <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1018] shadow-2xl">
    <div className="relative h-[420px] bg-slate-900">
      <div ref={containerRef} className="h-full w-full" aria-label="Live ride map" />
      {!mapReady && !mapError && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1018]"><div className="text-center"><LoaderCircle size={34} className="mx-auto animate-spin text-amber-400" /><p className="mt-3 text-sm text-white/45">Loading live navigation...</p></div></div>}
      {mapError && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1018] p-6 text-center"><div><MapPin className="mx-auto text-amber-400" /><p className="mt-3 font-semibold text-white">Map unavailable</p><p className="mt-2 text-sm text-white/45">{mapError}</p></div></div>}
      {routeError && !mapError && <p role="status" className="absolute inset-x-4 bottom-4 z-10 rounded-xl border border-red-400/20 bg-black/80 px-4 py-3 text-center text-xs text-red-200">{routeError}</p>}
      <div className="absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-black/75 px-4 py-3 shadow-xl backdrop-blur-xl"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">Customer</p><h3 className="mt-1 truncate font-bold text-white">{customerName}</h3></div>
      <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 shadow-xl backdrop-blur-xl"><p className="text-[10px] uppercase tracking-wide text-white/40">Live ETA</p><p className="mt-1 text-xl font-bold text-amber-400">{calculatedEtaMinutes > 0 ? `${calculatedEtaMinutes} min` : "Updating"}</p></div>
    </div>
    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
      <div className="space-y-4"><LocationCard title="Pickup" value={pickup} color="green" /><LocationCard title="Destination" value={dropoff} color="red" /></div>
      <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Metric label="ETA" value={calculatedEtaMinutes > 0 ? `${calculatedEtaMinutes} min` : "—"} color="text-amber-400" /><Metric label="Distance" value={calculatedDistanceKm > 0 ? `${calculatedDistanceKm} km` : "—"} color="text-cyan-400" /></div>
        <button type="button" onClick={openGoogleNavigation} disabled={!pickupPosition && !dropoffPosition} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"><Navigation size={20} />Start Navigation</button>
        <button type="button" onClick={callCustomer} disabled={!customerPhone && !onCallCustomer} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 py-4 font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"><Phone size={20} />Call Customer</button>
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4"><Route size={18} className="mt-0.5 shrink-0 text-cyan-400" /><p className="text-xs leading-5 text-white/45">The route automatically updates when the driver&apos;s Firestore location changes.</p></div>
      </div>
    </div>
  </section>;
}

function LocationCard({ title, value, color }: { title: string; value: string; color: "green" | "red" }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start gap-3"><MapPin size={19} className={`mt-0.5 shrink-0 ${color === "green" ? "text-green-400" : "text-red-400"}`} /><div><p className={`text-xs font-semibold uppercase tracking-wide ${color === "green" ? "text-green-400" : "text-red-400"}`}>{title}</p><p className="mt-2 text-sm font-semibold leading-6 text-white">{value || "Not available"}</p></div></div></div>; }
function Metric({ label, value, color }: { label: string; value: string; color: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-white/45">{label}</p><h3 className={`mt-2 text-2xl font-bold ${color}`}>{value}</h3></div>; }
