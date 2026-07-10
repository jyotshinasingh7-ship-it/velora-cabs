type Props = {
  totalRides: number;
};

export default function DriverStats({
  totalRides,
}: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-3">

      <div className="rounded-2xl bg-green-600 p-6">
        <h2 className="text-sm">
          Today's Earnings
        </h2>

        <p className="mt-3 text-3xl font-bold">
          ₹1250
        </p>
      </div>

      <div className="rounded-2xl bg-cyan-600 p-6">
        <h2 className="text-sm">
          Today's Trips
        </h2>

        <p className="mt-3 text-3xl font-bold">
          {totalRides}
        </p>
      </div>

      <div className="rounded-2xl bg-yellow-500 p-6 text-black">
        <h2 className="text-sm">
          Rating
        </h2>

        <p className="mt-3 text-3xl font-bold">
          ⭐ 4.9
        </p>
      </div>

    </div>
  );
}