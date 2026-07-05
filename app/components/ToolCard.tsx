import Link from "next/link";

type ToolCardProps = {
  title: string;
  description: string;
  category: string;
  href?: string;
};

export default function ToolCard({
  title,
  description,
  category,
  href = "#",
}: ToolCardProps) {
  return (
    <div className="border rounded-xl p-5 bg-white hover:shadow-md transition duration-200">
      {/* Category */}
      <div className="text-xs text-blue-600 mb-2 font-medium">
        {category}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-2">
        {description}
      </p>

      {/* Button */}
      <Link
        href={href}
        className="inline-block mt-4 text-sm text-blue-600 hover:underline"
      >
        Gunakan →
      </Link>
    </div>
  );
}