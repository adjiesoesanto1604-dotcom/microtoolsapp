export default function Hero() {
  return (
    <section className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-between px-10">

      {/* Kiri */}
      <div className="max-w-2xl">

        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
          🚀 Platform untuk UMKM Indonesia
        </span>

        <h1 className="mt-6 text-6xl font-extrabold leading-tight text-gray-900">
          Semua Kalkulator
          <span className="text-blue-600"> Bisnis UMKM </span>
          dalam Satu Tempat.
        </h1>

        <p className="mt-6 text-lg leading-8 text-gray-600">
          Hitung laba bersih, HPP, harga jual, margin,
          hingga puluhan tools bisnis lainnya
          tanpa Excel yang ribet.
        </p>

        <div className="mt-10 flex gap-4">

          <button className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700">
            Coba Gratis
          </button>

          <button className="rounded-xl border border-gray-300 px-8 py-4 font-semibold transition hover:bg-gray-100">
            Lihat Tools
          </button>

        </div>

      </div>

      {/* Kanan */}
      <div className="hidden h-[420px] w-[420px] rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 lg:flex items-center justify-center text-3xl font-bold text-white shadow-2xl">

        Dashboard Preview

      </div>

    </section>
  );
}