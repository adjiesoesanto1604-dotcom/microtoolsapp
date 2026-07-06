'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";

// --- TYPES ---
interface ProductInfo {
  name: string;
  category: string;
}

interface Costs {
  hpp: number;
  operasional: number;
  packaging: number;
  marketplace: number;
  pengiriman: number;
  admin: number;
  affiliate: number;
  lainnya: number;
}

interface Discounts {
  percent: number;
  cashback: number;
  voucher: number;
}

// --- UTILS ---
const formatIDR = (num: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercent = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

// --- COMPONENTS ---

// 1. Reusable Card Component
const Card = ({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) => (
  <div
    className={`bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg ${className}`}
  >
    {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
    {children}
  </div>
);

// 2. Currency Input Component
const CurrencyInput = ({
  label,
  value,
  onChange,
  placeholder = "0",
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
}) => {
  const displayValue = value === 0 ? "" : value.toLocaleString("id-ID");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    onChange(Number(raw));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">Rp</span>
        </div>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  );
};

// 3. Percent Input Component
const PercentInput = ({
  label,
  value,
  onChange,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  max?: number;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = Number(e.target.value);
    if (isNaN(raw) || raw < 0) raw = 0;
    if (raw > max) raw = max;
    onChange(raw);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value === 0 ? "" : value}
          onChange={handleChange}
          placeholder="0"
          className="w-full pr-8 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">%</span>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function MarkupPage() {
  // --- STATE ---
  const [productInfo, setProductInfo] = useState<ProductInfo>({ name: "", category: "" });
  const [costs, setCosts] = useState<Costs>({
    hpp: 0,
    operasional: 0,
    packaging: 0,
    marketplace: 0,
    pengiriman: 0,
    admin: 0,
    affiliate: 0,
    lainnya: 0,
  });
  const [markupPercent, setMarkupPercent] = useState<number>(30);
  const [discounts, setDiscounts] = useState<Discounts>({ percent: 0, cashback: 0, voucher: 0 });
  const [toast, setToast] = useState({ visible: false, message: "" });

  // --- LOGIC & CALCULATIONS (useMemo for real-time efficiency) ---
  const calc = useMemo(() => {
    // 1. Modal
    const totalModal = Object.values(costs).reduce((acc, curr) => acc + curr, 0);

    // 2. Harga Dasar (Sebelum Diskon)
    const hargaJualAwal = totalModal * (1 + markupPercent / 100);

    // 3. Potongan
    const diskonNominal = hargaJualAwal * (discounts.percent / 100);
    const totalPotongan = diskonNominal + discounts.cashback + discounts.voucher;

    // 4. Harga Bersih & Profit
    const hargaBersih = Math.max(0, hargaJualAwal - totalPotongan);
    const profit = hargaBersih - totalModal;

    // 5. Metrik Performa (Safe division)
    const effectiveMarkup = totalModal > 0 ? (profit / totalModal) * 100 : 0;
    const margin = hargaBersih > 0 ? (profit / hargaBersih) * 100 : 0;
    const roi = totalModal > 0 ? (profit / totalModal) * 100 : 0;

    // 6. Break Even Point (Minimum price to cover costs + discounts if applied fixed)
    // Formula: BEP = Total Modal + Cashback + Voucher / (1 - Diskon%)
    const bep = discounts.percent < 100 
        ? (totalModal + discounts.cashback + discounts.voucher) / (1 - discounts.percent / 100)
        : 0;

    // 7. Status Insight
    let status = "";
    let insight = "";
    if (effectiveMarkup < 20) {
      status = "Markup Rendah";
      insight = "Markup rentan habis oleh biaya tak terduga. Pertimbangkan efisiensi HPP.";
    } else if (effectiveMarkup <= 50) {
      status = "Markup Cukup";
      insight = "Margin aman untuk operasional standar. Fokus pada peningkatan volume penjualan.";
    } else if (effectiveMarkup <= 100) {
      status = "Markup Ideal";
      insight = "Posisi sangat sehat. Ruang gerak luas untuk strategi promosi dan diskon.";
    } else if (effectiveMarkup <= 200) {
      status = "Markup Tinggi";
      insight = "Profitabilitas unggul. Pastikan nilai (value) produk sesuai dengan ekspektasi pelanggan.";
    } else {
      status = "Markup Sangat Tinggi";
      insight = "Margin ekstrem. Risiko daya beli pasar menurun, kecuali produk bersifat eksklusif.";
    }

    return {
      totalModal,
      hargaJualAwal,
      totalPotongan,
      hargaBersih,
      profit,
      effectiveMarkup,
      margin,
      roi,
      bep,
      status,
      insight,
    };
  }, [costs, markupPercent, discounts]);

  // --- HANDLERS ---
  const handleCostChange = (key: keyof Costs, value: number) => {
    setCosts((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscountChange = (key: keyof Discounts, value: number) => {
    setDiscounts((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if(confirm("Anda yakin ingin mereset semua data perhitungan?")) {
        setProductInfo({ name: "", category: "" });
        setCosts({ hpp: 0, operasional: 0, packaging: 0, marketplace: 0, pengiriman: 0, admin: 0, affiliate: 0, lainnya: 0 });
        setMarkupPercent(30);
        setDiscounts({ percent: 0, cashback: 0, voucher: 0 });
    }
  };

  const copySummary = () => {
    const text = `==================================
🏷️ KALKULATOR MARKUP
==================================
Produk      : ${productInfo.name || "Tanpa Nama"} (${productInfo.category || "-"})
Total Modal : ${formatIDR(calc.totalModal)}
Target Mkup : ${markupPercent}%
----------------------------------
Harga Jual  : ${formatIDR(calc.hargaJualAwal)}
Potongan    : ${formatIDR(calc.totalPotongan)}
Harga Bersih: ${formatIDR(calc.hargaBersih)}
----------------------------------
Profit      : ${formatIDR(calc.profit)}
Margin      : ${formatPercent(calc.margin)}
ROI         : ${formatPercent(calc.roi)}
Status      : ${calc.status}
==================================`;

    navigator.clipboard.writeText(text).then(() => {
      setToast({ visible: true, message: "📋 Ringkasan berhasil disalin!" });
      setTimeout(() => setToast({ visible: false, message: "" }), 3000);
    });
  };

  const markupPresets = [20, 30, 40, 50, 75, 100, 150, 200];
  const categories = ["Makanan", "Minuman", "Fashion", "Jasa", "Kerajinan", "Digital", "Lainnya"];

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-blue-200">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xl">🏷️</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  Kalkulator Markup
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Professional Tool
                </span>
              </div>
              <p className="text-sm text-gray-500 hidden md:block">
                Hitung persentase markup, harga jual ideal, dan margin secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: INPUTS (65%) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Informasi Produk */}
          <Card title="Informasi Produk">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600">Nama Produk</label>
                <input
                  type="text"
                  value={productInfo.name}
                  onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                  placeholder="Cth: Kopi Susu Aren"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600">Kategori</label>
                <select
                  value={productInfo.category}
                  onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Card 2: Modal Produk */}
          <Card title="Rincian Modal (Cost)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput label="Harga Pokok (HPP)" value={costs.hpp} onChange={(v) => handleCostChange("hpp", v)} />
              <CurrencyInput label="Biaya Operasional" value={costs.operasional} onChange={(v) => handleCostChange("operasional", v)} />
              <CurrencyInput label="Biaya Packaging" value={costs.packaging} onChange={(v) => handleCostChange("packaging", v)} />
              <CurrencyInput label="Biaya Marketplace/Platform" value={costs.marketplace} onChange={(v) => handleCostChange("marketplace", v)} />
              <CurrencyInput label="Biaya Pengiriman" value={costs.pengiriman} onChange={(v) => handleCostChange("pengiriman", v)} />
              <CurrencyInput label="Admin Pembayaran" value={costs.admin} onChange={(v) => handleCostChange("admin", v)} />
              <CurrencyInput label="Biaya Affiliate" value={costs.affiliate} onChange={(v) => handleCostChange("affiliate", v)} />
              <CurrencyInput label="Biaya Lainnya" value={costs.lainnya} onChange={(v) => handleCostChange("lainnya", v)} />
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-600">Total Modal:</span>
              <span className="text-xl font-bold text-gray-900">{formatIDR(calc.totalModal)}</span>
            </div>
          </Card>

          {/* Card 3: Target Markup */}
          <Card title="Target Markup">
            <div className="space-y-4">
              <div className="w-full md:w-1/2">
                <PercentInput label="Persentase Markup Target" value={markupPercent} onChange={setMarkupPercent} max={300} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {markupPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setMarkupPercent(preset)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      markupPercent === preset
                        ? "bg-blue-50 border-blue-600 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Card 4: Diskon & Promosi */}
          <Card title="Simulasi Promosi (Opsional)">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PercentInput label="Diskon (%)" value={discounts.percent} onChange={(v) => handleDiscountChange("percent", v)} max={100} />
              <CurrencyInput label="Cashback (Rp)" value={discounts.cashback} onChange={(v) => handleDiscountChange("cashback", v)} />
              <CurrencyInput label="Voucher (Rp)" value={discounts.voucher} onChange={(v) => handleDiscountChange("voucher", v)} />
            </div>
          </Card>

           {/* Card 5: Simulasi Slider */}
           <Card title="Simulasi Cepat Markup">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                <span>0%</span>
                <span className="text-blue-600 font-bold">{markupPercent}%</span>
                <span>300%</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="1"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </Card>

          {/* Card 6: Aksi */}
          <div className="flex gap-4">
             <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              Hitung Markup (Real-time)
            </button>
            <button 
              onClick={handleReset}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY RESULTS (35%) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit pb-12">
          
          {/* Card Hasil Utama */}
          <Card className="border-t-4 border-t-blue-600 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <span className="text-8xl">🏆</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard Markup</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Modal</span>
                <span className="font-medium">{formatIDR(calc.totalModal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Target Markup</span>
                <span className="font-medium">{formatPercent(markupPercent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Harga Jual (Katalog)</span>
                <span className="font-medium">{formatIDR(calc.hargaJualAwal)}</span>
              </div>
              
              {calc.totalPotongan > 0 && (
                 <div className="flex justify-between text-sm text-red-500 bg-red-50 p-2 rounded-md">
                 <span>Total Potongan</span>
                 <span className="font-medium">-{formatIDR(calc.totalPotongan)}</span>
               </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Harga Jual Bersih</div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {formatIDR(calc.hargaBersih)}
                </div>
              </div>

              {/* Highlight Block */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-blue-800 text-sm font-semibold mb-1 flex items-center gap-1">
                    <span>🏆</span> EFF. MARKUP
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatPercent(calc.effectiveMarkup)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue-800 text-sm font-semibold mb-1">PROFIT</div>
                  <div className="text-lg font-bold text-blue-700">
                    +{formatIDR(calc.profit)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                 <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Margin</div>
                    <div className="text-lg font-semibold text-gray-800">{formatPercent(calc.margin)}</div>
                 </div>
                 <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">ROI</div>
                    <div className="text-lg font-semibold text-gray-800">{formatPercent(calc.roi)}</div>
                 </div>
              </div>
            </div>
          </Card>

          {/* Card Visual Progress */}
          <Card title="Komposisi Harga (Visual)">
            <div className="h-6 flex rounded-full overflow-hidden bg-gray-100">
              {calc.hargaJualAwal > 0 ? (
                <>
                  <div 
                    style={{ width: `${(calc.totalModal / calc.hargaJualAwal) * 100}%` }} 
                    className="bg-gray-400 h-full transition-all duration-500"
                    title="Modal"
                  ></div>
                  <div 
                    style={{ width: `${(Math.max(0, calc.profit) / calc.hargaJualAwal) * 100}%` }} 
                    className="bg-blue-500 h-full transition-all duration-500"
                    title="Profit"
                  ></div>
                  <div 
                    style={{ width: `${(calc.totalPotongan / calc.hargaJualAwal) * 100}%` }} 
                    className="bg-red-400 h-full transition-all duration-500"
                    title="Potongan"
                  ></div>
                </>
              ) : (
                <div className="w-full bg-gray-200"></div>
              )}
            </div>
            <div className="flex justify-between mt-3 text-xs font-medium">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400"></span>Modal</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Profit</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>Diskon</div>
            </div>
          </Card>

          {/* Card Analisis & Status */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                calc.effectiveMarkup < 20 ? 'bg-red-500' :
                calc.effectiveMarkup <= 50 ? 'bg-yellow-500' :
                calc.effectiveMarkup <= 100 ? 'bg-green-500' :
                calc.effectiveMarkup <= 200 ? 'bg-blue-500' : 'bg-purple-500'
              }`}></div>
              <h4 className="font-bold text-gray-800">{calc.status || "Status Markup"}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {calc.insight || "Masukkan modal dan target markup untuk melihat analisis."}
            </p>
          </Card>

          {/* Break Even Point */}
           <Card className="bg-gray-900 text-white border-none">
            <h4 className="text-sm font-medium text-gray-400 mb-1">Break Even Point (Titik Impas)</h4>
            <div className="text-xl font-bold">
              {formatIDR(calc.bep)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Harga jual minimum agar tidak rugi (menutupi modal & beban diskon yang diinput).
            </p>
          </Card>

          {/* Perbandingan Markup vs Margin */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-blue-50/50 border-blue-100">
              <div className="text-xs font-bold text-blue-800 mb-1">MARKUP</div>
              <div className="text-xl font-bold text-gray-900 mb-1">{formatPercent(calc.effectiveMarkup)}</div>
              <div className="text-[10px] text-gray-500 leading-tight">Keuntungan berbanding modal yang dikeluarkan.</div>
            </Card>
            <Card className="p-4 bg-emerald-50/50 border-emerald-100">
              <div className="text-xs font-bold text-emerald-800 mb-1">MARGIN</div>
              <div className="text-xl font-bold text-gray-900 mb-1">{formatPercent(calc.margin)}</div>
              <div className="text-[10px] text-gray-500 leading-tight">Persentase keuntungan dari total pendapatan.</div>
            </Card>
          </div>

          {/* Simulasi Harga */}
          <Card title="Simulasi Kompetisi">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-700">Harga Murah (-10%)</div>
                  <div className="text-xs text-gray-500">Cepat putar modal</div>
                </div>
                <div className="font-semibold text-gray-900">{formatIDR(calc.hargaBersih * 0.9)}</div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border border-blue-200 bg-blue-50 shadow-sm">
                <div>
                  <div className="text-sm font-bold text-blue-800 flex items-center gap-1">
                     ⭐ NORMAL (IDEAL)
                  </div>
                </div>
                <div className="font-bold text-blue-900">{formatIDR(calc.hargaBersih)}</div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-700">Premium (+10%)</div>
                  <div className="text-xs text-gray-500">Fokus brand value</div>
                </div>
                <div className="font-semibold text-gray-900">{formatIDR(calc.hargaBersih * 1.1)}</div>
              </div>
            </div>
          </Card>

          {/* Action Copy */}
          <button
            onClick={copySummary}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-black text-white font-medium rounded-xl transition-colors shadow-md"
          >
            <span>📋</span> Salin Ringkasan
          </button>

        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center gap-2 ${
          toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}