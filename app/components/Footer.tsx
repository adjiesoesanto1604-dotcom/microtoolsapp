import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="about"
      className="mt-24 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="mx-auto max-w-6xl px-6 py-16">

        <div className="grid gap-12 md:grid-cols-4">

          {/* Logo */}
          <div className="md:col-span-2">

            <Image
              src="/logo-jie.png"
              alt="JIE Logo"
              width={120}
              height={120}
              className="mb-5"
            />

            <h2 className="text-2xl font-bold text-gray-900">
              Microtools UMKM
            </h2>

            <p className="mt-3 max-w-md leading-7 text-gray-600">
              Platform berisi berbagai kalkulator bisnis gratis untuk membantu
              UMKM menghitung laba, HPP, margin, ROI, harga jual, hingga
              analisis usaha dengan cepat dan mudah.
            </p>
          </div>

          {/* Navigasi */}
          <div>
            <h3 className="mb-5 font-semibold text-gray-900">
              Navigasi
            </h3>

            <ul className="space-y-3 text-gray-600">

              <li>
                <a href="#">Home</a>
              </li>

              <li>
                <a href="#tools">Semua Tools</a>
              </li>

              <li>
                <a href="#about">Tentang</a>
              </li>

            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-5 font-semibold text-gray-900">
              Informasi
            </h3>

            <ul className="space-y-3 text-gray-600">

              <li>✅ Gratis digunakan</li>

              <li>⚡ Tanpa login</li>

              <li>🚀 Dibuat oleh JIE</li>

            </ul>
          </div>

        </div>

        <div className="my-10 h-px bg-gray-200" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-500 md:flex-row">

          <p>
            © {new Date().getFullYear()} JIE. All rights reserved.
          </p>

          <div className="flex gap-6">

            <Link href="#">
              Privacy Policy
            </Link>

            <Link href="#">
              Terms
            </Link>

            <Link href="#">
              Contact
            </Link>

          </div>

        </div>

      </div>
    </footer>
  );
}