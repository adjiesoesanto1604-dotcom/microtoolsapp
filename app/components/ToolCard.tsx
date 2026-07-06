"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type ToolCardProps = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

const item = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
    },
  },
};

export default function ToolCard({
  icon,
  title,
  description,
  href,
}: ToolCardProps) {
  return (
    <motion.div variants={item} className="h-full">
      <Link
        href={href}
        className="
          group
          flex
          h-full
          flex-col
          rounded-3xl
          border
          border-gray-100
          bg-white
          p-8
          transition-all
          duration-300
          hover:-translate-y-1
          hover:border-gray-200
          hover:shadow-xl
        "
      >
        {/* Icon */}
        <div className="text-4xl">
          {icon}
        </div>

        {/* Title */}
        <h3 className="mt-6 text-2xl font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-4 text-[15px] leading-7 text-gray-500">
          {description}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-8">
          <span className="font-semibold text-blue-600 group-hover:gap-2 inline-flex items-center transition-all">
            Gunakan
            <span className="ml-1 transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}