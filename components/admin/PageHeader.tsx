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
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>

        <h1 className="text-4xl font-bold text-white">
          {title}
        </h1>

        <p className="mt-2 text-gray-400">
          {subtitle}
        </p>

      </div>

      {action}

    </div>
  );
}