type Props = {
  ride: any;
  updateStatus: (
    id: string,
    status: string
  ) => void;
};

export default function RideRequestCard({
  ride,
  updateStatus,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            {ride.pickup} → {ride.dropoff}
          </h2>

          <p className="mt-2 text-gray-400">
            Status : {ride.status || "pending"}
          </p>

        </div>

        <div className="text-right">

          <p className="text-sm text-gray-500">
            Fare
          </p>

          <h2 className="text-3xl font-bold text-green-400">
            ₹{ride.fare || 0}
          </h2>

        </div>

      </div>

      <div className="mt-6 flex flex-wrap gap-3">

        {ride.status === "pending" && (
          <>
            <button
              onClick={() =>
                updateStatus(
                  ride.id,
                  "accepted"
                )
              }
              className="rounded-xl bg-green-600 px-6 py-3 font-bold"
            >
              Accept
            </button>

            <button
              onClick={() =>
                updateStatus(
                  ride.id,
                  "declined"
                )
              }
              className="rounded-xl bg-red-600 px-6 py-3 font-bold"
            >
              Decline
            </button>
          </>
        )}

        {ride.status === "accepted" && (
          <button
            onClick={() =>
              updateStatus(
                ride.id,
                "ongoing"
              )
            }
            className="rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black"
          >
            Start Ride
          </button>
        )}

        {ride.status === "ongoing" && (
          <button
            onClick={() =>
              updateStatus(
                ride.id,
                "completed"
              )
            }
            className="rounded-xl bg-cyan-600 px-6 py-3 font-bold"
          >
            Complete Ride
          </button>
        )}

      </div>

    </div>
  );
}