"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { tools } from "../data/tools";
import ToolCard from "./ToolCard";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function FeaturedTools() {
  const [search, setSearch] = useState("");

  const filteredTools = tools.filter((tool) => {
    const keyword = search.toLowerCase();

    return (
      tool.title.toLowerCase().includes(keyword) ||
      tool.description.toLowerCase().includes(keyword)
    );
  });

  return (
    <section
      id="tools"
      className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24"
    >
      {/* Background Blur */}
      <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .5 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900">
            Tools Favorit UMKM
          </h2>

          <p className="mt-4 text-gray-600">
            Semua kalkulator yang paling sering digunakan pelaku UMKM.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: .2 }}
          className="mt-10 flex justify-center"
        >
          <div className="w-full max-w-xl">
            <input
              type="text"
              placeholder="🔍 Cari tools... (contoh: laba, omzet, harga)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full
                rounded-2xl
                border
                border-white/40
                bg-white/70
                backdrop-blur-xl
                px-5
                py-4
                shadow-lg
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-200
              "
            />
          </div>
        </motion.div>

        {/* Counter */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: .3 }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          Menampilkan{" "}
          <span className="font-bold text-blue-600">
            {filteredTools.length}
          </span>{" "}
          tools
        </motion.p>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.href}
              {...tool}
            />
          ))}
        </motion.div>

        {/* Empty */}
        {filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-20 text-center"
          >
            <div className="text-6xl">🔍</div>

            <h3 className="mt-5 text-2xl font-bold text-gray-800">
              Tools tidak ditemukan
            </h3>

            <p className="mt-2 text-gray-500">
              Coba gunakan kata kunci lain.
            </p>
          </motion.div>
        )}

      </div>
    </section>
  );
}