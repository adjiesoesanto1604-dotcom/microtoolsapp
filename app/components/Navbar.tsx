"use client";

import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6">

        {/* ================= LOGO ================= */}
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl text-white shadow-lg">
            📊
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Microtools UMKM
            </h1>

            <p className="text-xs text-gray-500">
              Semua kalkulator bisnis dalam satu tempat
            </p>
          </div>
        </a>

        {/* ================= MENU DESKTOP ================= */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#"
            className="font-medium text-gray-600 transition hover:text-blue-600"
          >
            Home
          </a>

          <a
            href="#tools"
            className="font-medium text-gray-600 transition hover:text-blue-600"
          >
            Tools
          </a>

          <a
            href="#about"
            className="font-medium text-gray-600 transition hover:text-blue-600"
          >
            Tentang
          </a>
        </nav>

        {/* ================= BUTTON DESKTOP ================= */}
        <div className="hidden md:block">
          <a
            href="#tools"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
          >
            Mulai Hitung →
          </a>
        </div>

        {/* ================= HAMBURGER ================= */}
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl text-gray-700 md:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {open && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="space-y-1 px-6 py-5">

            <a
              href="#"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
            >
              Home
            </a>

            <a
              href="#tools"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
            >
              Tools
            </a>

            <a
              href="#about"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
            >
              Tentang
            </a>

            <a
              href="#tools"
              onClick={() => setOpen(false)}
              className="mt-3 block rounded-xl bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
            >
              Mulai Hitung
            </a>

          </div>
        </div>
      )}
    </header>
  );
}