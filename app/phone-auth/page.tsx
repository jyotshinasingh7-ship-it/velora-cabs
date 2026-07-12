import { Suspense } from "react";
import PhoneAuth from "@/components/PhoneAuth";

function PhoneAuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070c] text-white">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />

        <p className="mt-4 text-sm text-white/50">
          Loading phone authentication...
        </p>
      </div>
    </main>
  );
}

export default function PhoneAuthPage() {
  return (
    <Suspense fallback={<PhoneAuthLoading />}>
      <PhoneAuth />
    </Suspense>
  );
}