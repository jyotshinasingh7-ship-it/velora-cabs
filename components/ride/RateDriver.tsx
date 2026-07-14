"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Star,
} from "lucide-react";

import { auth } from "@/lib/firebase";

interface RateDriverProps {
  bookingDocumentId: string;
  bookingId: string;
  driverId: string;
  driverName: string;
  existingRating?: number | null;
  existingReview?: string;
  onRatingSaved?: () => void;
}

const quickFeedbackOptions = [
  "Professional driver",
  "Clean vehicle",
  "Safe driving",
  "On-time pickup",
  "Polite behaviour",
  "Smooth journey",
];

export default function RateDriver({
  bookingDocumentId,
  bookingId,
  driverId,
  driverName,
  existingRating = null,
  existingReview = "",
  onRatingSaved,
}: RateDriverProps) {
  const [rating, setRating] = useState(
    existingRating ?? 0
  );

  const [hoveredRating, setHoveredRating] =
    useState(0);

  const [review, setReview] =
    useState(existingReview);

  const [selectedFeedback, setSelectedFeedback] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(
      existingRating
        ? "You have already rated this ride."
        : ""
    );

  const hasExistingRating =
    Boolean(existingRating);

  const visibleRating =
    hoveredRating || rating;

  const ratingLabel = useMemo(() => {
    if (visibleRating === 1) {
      return "Poor";
    }

    if (visibleRating === 2) {
      return "Fair";
    }

    if (visibleRating === 3) {
      return "Good";
    }

    if (visibleRating === 4) {
      return "Very Good";
    }

    if (visibleRating === 5) {
      return "Excellent";
    }

    return "Select your rating";
  }, [visibleRating]);

  function toggleFeedback(option: string) {
    setSelectedFeedback((current) =>
      current.includes(option)
        ? current.filter(
            (item) => item !== option
          )
        : [...current, option]
    );

    setError("");
  }

  async function handleSubmitRating() {
    setError("");
    setSuccess("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "Please login again before submitting your rating."
      );
      return;
    }

    if (!bookingDocumentId || !bookingId) {
      setError("Booking information is missing.");
      return;
    }

    if (!driverId) {
      setError(
        "Driver information is not available."
      );
      return;
    }

    if (rating < 1 || rating > 5) {
      setError(
        "Please select a rating between 1 and 5 stars."
      );
      return;
    }

    try {
      setLoading(true);

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/rides/rating", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingDocumentId,
          bookingId,
          driverId,
          driverName,
          rating,
          review: review.trim(),
          quickFeedback: selectedFeedback,
        }),
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to submit rating.");

      setSuccess(
        "Thank you! Your rating has been submitted."
      );

      onRatingSaved?.();
    } catch (ratingError) {
      setError(
        ratingError instanceof Error
          ? ratingError.message
          : "Unable to submit rating."
      );
    } finally {
      setLoading(false);
    }
  }

  if (hasExistingRating) {
    return (
      <section className="rounded-3xl border border-green-400/20 bg-green-500/10 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2
            size={26}
            className="mt-0.5 shrink-0 text-green-400"
          />

          <div>
            <h2 className="text-xl font-bold text-white">
              Ride Rated
            </h2>

            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <Star
                    key={star}
                    size={20}
                    className={
                      star <=
                      (existingRating ?? 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/20"
                    }
                  />
                )
              )}
            </div>

            {existingReview && (
              <p className="mt-4 text-sm leading-6 text-white/60">
                “{existingReview}”
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black">
          <Star
            size={23}
            className="fill-current"
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            Rate Your Driver
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/45">
            Tell us about your ride with{" "}
            {driverName || "your driver"}.
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/25 p-5 text-center">
        <div
          className="flex justify-center gap-2"
          onMouseLeave={() =>
            setHoveredRating(0)
          }
        >
          {[1, 2, 3, 4, 5].map(
            (star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() =>
                  setHoveredRating(star)
                }
                onFocus={() =>
                  setHoveredRating(star)
                }
                onBlur={() =>
                  setHoveredRating(0)
                }
                onClick={() => {
                  setRating(star);
                  setError("");
                }}
                disabled={loading}
                className="rounded-lg p-1 transition hover:scale-110 disabled:cursor-not-allowed"
                aria-label={`Rate ${star} out of 5`}
              >
                <Star
                  size={34}
                  className={`transition ${
                    star <= visibleRating
                      ? "fill-amber-400 text-amber-400"
                      : "text-white/20"
                  }`}
                />
              </button>
            )
          )}
        </div>

        <p className="mt-3 font-semibold text-amber-300">
          {ratingLabel}
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium text-white/70">
          What went well?
        </p>

        <div className="flex flex-wrap gap-2">
          {quickFeedbackOptions.map(
            (option) => {
              const selected =
                selectedFeedback.includes(
                  option
                );

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    toggleFeedback(option)
                  }
                  disabled={loading}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                    selected
                      ? "border-amber-400 bg-amber-400/10 text-amber-300"
                      : "border-white/10 bg-black/20 text-white/50 hover:border-white/20"
                  }`}
                >
                  {option}
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="driver-review"
          className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70"
        >
          <MessageSquareText
            size={17}
            className="text-amber-400"
          />

          Write a review
        </label>

        <textarea
          id="driver-review"
          value={review}
          onChange={(event) => {
            setReview(event.target.value);
            setError("");
          }}
          rows={4}
          maxLength={500}
          disabled={loading}
          placeholder="Share your experience with the driver and vehicle..."
          className="w-full resize-none rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
        />

        <p className="mt-2 text-right text-xs text-white/30">
          {review.length}/500
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-200"
        >
          {success}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmitRating}
        disabled={
          loading ||
          rating < 1 ||
          !driverId
        }
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && (
          <Loader2
            size={19}
            className="animate-spin"
          />
        )}

        {loading
          ? "Submitting Rating..."
          : "Submit Rating"}
      </button>
    </section>
  );
}
