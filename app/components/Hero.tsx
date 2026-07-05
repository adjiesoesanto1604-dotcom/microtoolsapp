export default function Hero() {
  return (
    <section className="py-20 flex items-center justify-center text-center">
      <div className="max-w-3xl mx-auto px-6">

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
          Microtools untuk UMKM
        </h1>

        {/* Subtitle */}
        <h2 className="mt-4 text-xl md:text-2xl text-gray-600 font-medium">
          Panduan lengkap untuk UMKM dalam satu tempat
        </h2>

        {/* Tagline kecil */}
        <p className="mt-6 text-sm md:text-base text-gray-500 leading-relaxed">
          Hitung laba bersih, HPP, harga jual, margin, hingga puluhan tools bisnis lainnya
          tanpa Excel yang ribet.
        </p>

        {/* CTA Button (opsional tapi sangat disarankan) */}
        <div className="mt-8">
          <a
            href="#tools"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Lihat Tools
          </a>
        </div>

      </div>
    </section>
  );
}