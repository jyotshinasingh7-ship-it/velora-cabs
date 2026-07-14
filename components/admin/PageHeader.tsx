interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

      <div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Velora Operations</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h1>

        <p className="mt-2 text-sm text-white/45">
          {subtitle}
        </p>

      </div>

      {action}

    </div>
  );
}
