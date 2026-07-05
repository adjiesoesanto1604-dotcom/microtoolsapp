export default function Footer() {
  return (
    <footer className="border-t bg-white mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Microtools UMKM
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tools sederhana untuk bantu UMKM hitung bisnis lebih cepat tanpa ribet.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Tools
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Hitung Laba Bersih</li>
              <li>HPP Calculator</li>
              <li>Harga Jual</li>
              <li>Margin Usaha</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Kontak
            </h3>
            <p className="text-sm text-gray-600">
              Support: microtools@email.com
            </p>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Microtools UMKM. All rights reserved.
        </div>

      </div>
    </footer>
  );
}