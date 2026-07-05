import { tools } from "../data/tools";
import ToolCard from "./ToolCard";

export default function FeaturedTools() {
  return (
    <section id="tools" className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Featured Tools
          </h2>
          <p className="text-gray-600 mt-3">
            Pilih tools yang sesuai kebutuhan bisnis kamu
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.slice(0, 3).map((tool) => (
            <ToolCard
              key={tool.slug}
              title={tool.title}
              description={tool.description}
              category={tool.category}
              href={`/tools/${tool.slug}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}