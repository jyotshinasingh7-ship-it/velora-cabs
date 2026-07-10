import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";

const apiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let configured = false;

function configureGoogleMaps() {
  if (configured) return;

  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing in .env.local"
    );
  }

  setOptions({
    key: apiKey,
    v: "weekly",
    language: "en",
    region: "IN",
  });

  configured = true;
}

export async function loadPlacesLibrary() {
  configureGoogleMaps();

  return (await importLibrary(
    "places"
  )) as google.maps.PlacesLibrary;
}

export async function loadMapsLibrary() {
  configureGoogleMaps();

  return (await importLibrary(
    "maps"
  )) as google.maps.MapsLibrary;
}

export async function loadRoutesLibrary() {
  configureGoogleMaps();

  return (await importLibrary(
    "routes"
  )) as google.maps.RoutesLibrary;
}