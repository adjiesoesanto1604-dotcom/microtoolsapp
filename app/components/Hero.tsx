"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white py-28 px-6">

      {/* Background Blur */}
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl"
      />

      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-indigo-300/20 blur-3xl"
      />

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute left-20 top-32 hidden text-4xl lg:block"
      >
        📈
      </motion.div>

      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute right-24 top-40 hidden text-4xl lg:block"
      >
        💰
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="absolute bottom-28 left-40 hidden text-3xl lg:block"
      >
        📊
      </motion.div>

      <div className="relative mx-auto max-w-6xl text-center">

        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700"
        >
          🚀 Microtools untuk UMKM
        </motion.span>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.7,
          }}
          className="mt-7 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-7xl"
        >
          Semua Tools UMKM
          <br />

          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            dalam Satu Tempat
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.45,
            duration: 0.7,
          }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-600"
        >
          Hitung laba bersih, HPP, harga jual, margin, ROI, cashflow,
          hingga puluhan tools bisnis lainnya tanpa Excel yang ribet.
          Cepat, simpel, dan gratis digunakan.
        </motion.p>

        {/* Button */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.7,
            duration: 0.5,
          }}
          className="mt-10 flex justify-center"
        >
          <motion.a
            href="#tools"
            whileHover={{
              scale: 1.06,
            }}
            whileTap={{
              scale: 0.95,
            }}
            className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg transition"
          >
            🚀 Lihat Semua Tools
          </motion.a>
        </motion.div>

        {/* Mini Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1,
          }}
          className="mt-10 text-sm text-gray-500"
        >
          ✨ Sudah tersedia <b>20+ kalkulator bisnis</b> untuk membantu UMKM
          menghitung usaha lebih cepat.
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
          }}
          className="mt-16 text-3xl text-gray-400"
        >
          ↓
        </motion.div>

      </div>
    </section>
  );
}