import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 transition hover:border-cyan-500">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-gray-400">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold text-white">
            {value}
          </h2>

        </div>

        <div
          className={`rounded-xl p-4 ${color}`}
        >
          <Icon
            className="text-white"
            size={28}
          />
        </div>

      </div>

    </div>
  );
}