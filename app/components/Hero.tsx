export default function Hero() {
  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-white py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">

        {/* Badge kecil */}
        <span className="inline-block px-4 py-1 mb-6 text-sm bg-blue-100 text-blue-700 rounded-full">
          Microtools untuk UMKM 🚀
        </span>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          Semua Tools UMKM dalam Satu Tempat
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
          Hitung laba bersih, HPP, harga jual, margin, hingga puluhan tools bisnis lainnya
          tanpa Excel yang ribet. Cepat, simpel, dan gratis digunakan.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#tools"
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Lihat Tools
          </a>

          <a
            href="#about"
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Pelajari Lebih Lanjut
          </a>
        </div>

        {/* Optional mini stats */}
        <div className="mt-12 text-sm text-gray-500">
          ✨ Dipakai untuk membantu UMKM menghitung bisnis lebih cepat
        </div>

      </div>
    </section>
  );
}