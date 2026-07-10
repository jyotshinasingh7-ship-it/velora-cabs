"use client";

type Props = {
  driverName: string;
  online: boolean;
  setOnline: (value: boolean) => void;
  logout: () => void;
};

export default function DriverHeader({
  driverName,
  online,
  setOnline,
  logout,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-4xl font-bold">
            Welcome, {driverName}
          </h1>

          <p className="mt-2 text-gray-400">
            Velora Driver Panel
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() => setOnline(!online)}
            className={`rounded-xl px-6 py-3 font-bold transition ${
              online
                ? "bg-green-600"
                : "bg-gray-700"
            }`}
          >
            {online ? "🟢 Online" : "⚫ Offline"}
          </button>

          <button
            onClick={logout}
            className="rounded-xl bg-red-600 px-6 py-3 font-bold hover:bg-red-700"
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}