import { tools } from "../data/tools";
import ToolCard from "./ToolCard";

export default function FeaturedTools() {
  return (
    <section
      id="tools"
      className="bg-gray-50 py-20"
    >
      <div className="mx-auto max-w-6xl px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Tools Favorit UMKM
          </h2>

          <p className="mt-4 text-gray-600">
            Semua kalkulator yang paling sering digunakan pelaku UMKM.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard
              key={tool.href}
              {...tool}
            />
          ))}
        </div>
      </div>
    </section>
  );
}