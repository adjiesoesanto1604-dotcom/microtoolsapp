import Link from "next/link";

type ToolCardProps = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

export default function ToolCard({
  icon,
  title,
  description,
  href,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-600">
        {description}
      </p>

      <span className="mt-5 inline-block font-medium text-blue-600">
        Gunakan →
      </span>
    </Link>
  );
}