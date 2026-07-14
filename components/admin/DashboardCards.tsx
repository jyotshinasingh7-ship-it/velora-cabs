import {
  BookOpenCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  IndianRupee,
  UsersRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface DashboardCardsProps {
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
  customers: number;
  drivers: number;
}

export default function DashboardCards(props: DashboardCardsProps) {
  const cards: Array<{ title: string; value: string | number; icon: LucideIcon; tone?: string }> = [
    { title: "Total Bookings", value: props.totalBookings, icon: BookOpenCheck },
    { title: "Today's Bookings", value: props.todayBookings, icon: CalendarDays },
    { title: "Pending", value: props.pendingBookings, icon: Clock3, tone: "text-amber-300" },
    { title: "Completed", value: props.completedBookings, icon: CheckCircle2, tone: "text-emerald-300" },
    { title: "Cancelled", value: props.cancelledBookings, icon: XCircle, tone: "text-red-300" },
    { title: "Revenue", value: `₹${props.revenue.toLocaleString("en-IN")}`, icon: IndianRupee, tone: "text-amber-300" },
    { title: "Customers", value: props.customers, icon: UsersRound },
    { title: "Drivers", value: props.drivers, icon: CarFront },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, tone }) => (
        <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-amber-400/20">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm text-white/40">{title}</p><p className={`mt-3 text-3xl font-extrabold ${tone ?? "text-white"}`}>{value}</p></div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400"><Icon size={20} /></span>
          </div>
        </article>
      ))}
    </section>
  );
}
