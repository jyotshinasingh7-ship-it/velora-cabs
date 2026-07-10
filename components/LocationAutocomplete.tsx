"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LoaderCircle,
  MapPin,
  Navigation,
} from "lucide-react";

import { loadPlacesLibrary } from "@/lib/googleMaps";

export interface SelectedLocation {
  address: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationAutocompleteProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  type?: "pickup" | "dropoff";
  required?: boolean;
  onChange: (value: string) => void;
  onLocationSelect: (
    location: SelectedLocation
  ) => void;
}

interface SuggestionItem {
  prediction: google.maps.places.PlacePrediction;
  text: string;
}

export default function LocationAutocomplete({
  id,
  label,
  placeholder,
  value,
  type = "pickup",
  required = false,
  onChange,
  onLocationSelect,
}: LocationAutocompleteProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const requestIdRef = useRef(0);

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(
      null
    );

  const [suggestions, setSuggestions] = useState<
    SuggestionItem[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isOpen, setIsOpen] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const cleanValue = value.trim();

    if (cleanValue.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchSuggestions(cleanValue);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [value]);

  async function fetchSuggestions(
    input: string
  ) {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const {
        AutocompleteSuggestion,
        AutocompleteSessionToken,
      } = await loadPlacesLibrary();

      if (!sessionTokenRef.current) {
        sessionTokenRef.current =
          new AutocompleteSessionToken();
      }

      const request: google.maps.places.AutocompleteRequest =
        {
          input,
          sessionToken:
            sessionTokenRef.current,
          language: "en",
          region: "in",
          includedRegionCodes: ["in"],
        };

      const { suggestions: results } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions(
          request
        );

      if (requestId !== requestIdRef.current) {
        return;
      }

      const formattedSuggestions =
        results.flatMap((suggestion) => {
          const prediction =
            suggestion.placePrediction;

          if (!prediction) {
            return [];
          }

          return [
            {
              prediction,
              text: prediction.text.toString(),
            },
          ];
        });

      setSuggestions(formattedSuggestions);
      setIsOpen(
        formattedSuggestions.length > 0
      );
    } catch (fetchError) {
      console.error(
        "Location suggestions failed:",
        fetchError
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setSuggestions([]);
      setIsOpen(false);
      setError(
        "Unable to load location suggestions."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }

  async function handleSuggestionSelect(
    item: SuggestionItem
  ) {
    try {
      setIsLoading(true);
      setError(null);
      setIsOpen(false);

      const place =
        item.prediction.toPlace();

      await place.fetchFields({
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "location",
        ],
      });

      const selectedAddress =
        place.formattedAddress ||
        place.displayName ||
        item.text;

      const latitude =
        place.location?.lat() ?? null;

      const longitude =
        place.location?.lng() ?? null;

      onChange(selectedAddress);

      onLocationSelect({
        address: selectedAddress,
        placeId: place.id ?? "",
        latitude,
        longitude,
      });

      setSuggestions([]);

      sessionTokenRef.current = null;
    } catch (selectionError) {
      console.error(
        "Place selection failed:",
        selectionError
      );

      setError(
        "Unable to select this location."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const nextValue = event.target.value;

    onChange(nextValue);

    onLocationSelect({
      address: nextValue,
      placeId: "",
      latitude: null,
      longitude: null,
    });
  }

  const Icon =
    type === "pickup"
      ? MapPin
      : Navigation;

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-white/70"
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
        />

        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
          className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/60 focus:bg-black/35"
        />

        {isLoading && (
          <LoaderCircle
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-amber-400"
          />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0e14] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
          {suggestions.map(
            (item, index) => (
              <button
                key={`${item.prediction.placeId}-${index}`}
                type="button"
                onClick={() =>
                  void handleSuggestionSelect(
                    item
                  )
                }
                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                  <MapPin size={17} />
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-5 text-white">
                    {item.text}
                  </span>

                  <span className="mt-1 block text-xs text-white/35">
                    Google location result
                  </span>
                </span>
              </button>
            )
          )}

          <div className="border-t border-white/10 px-3 pb-1 pt-2 text-right text-[10px] text-white/30">
            Powered by Google
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}