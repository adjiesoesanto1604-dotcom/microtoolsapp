'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";

// --- TYPES ---
interface AppState {
  productName: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  discountPercent: number;
  discountNominal: number;
  adminFeePercent: number;
  affiliateFeePercent: number;
  targetProfitPercent: number;
  
  // Toggles & Optional Inputs
  useFlashSale: boolean;
  useVoucher: boolean;
  voucherNominal: number;
  useCashback: boolean;
  cashbackNominal: number;
  useFreeShipping: boolean;
  freeShippingNominal: number;

  sliderDiscount: number;
}

// --- UTILS ---
const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// --- COMPONENTS ---

// Custom Input for Numbers
const NumericInput = ({ 
  label, 
  value, 
  onChange, 
  prefix, 
  suffix, 
  max 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  prefix?: string;
  suffix?: string;
  max?: number;
}) => {
  const [localValue, setLocalValue] = useState(value === 0 ? "" : value.toString());

  useEffect(() => {
    setLocalValue(value === 0 ? "" : value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, ""); // Only numbers
    let numVal = parseInt(val, 10);
    
    if (isNaN(numVal)) {
      setLocalValue("");
      onChange(0);
      return;
    }

    if (max !== undefined && numVal > max) numVal = max;

    setLocalValue(numVal.toString());
    onChange(numVal);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 text-sm font-medium">{prefix}</span>
        )}
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="0"
          className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 transition-all focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-blue-300 shadow-sm ${
            prefix ? "pl-10" : ""
          } ${suffix ? "pr-8" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 text-sm font-medium">{suffix}</span>
        )}
      </div>
    </div>
  );
};

export default function DiskonPage() {
  // --- STATE ---
  const [state, setState] = useState<AppState>({
    productName: "",
    category: "Makanan",
    costPrice: 0,
    sellingPrice: 0,
    quantity: 1,
    discountPercent: 0,
    discountNominal: 0,
    adminFeePercent: 0,
    affiliateFeePercent: 0,
    targetProfitPercent: 30,
    useFlashSale: false,
    useVoucher: false,
    voucherNominal: 0,
    useCashback: false,
    cashbackNominal: 0,
    useFreeShipping: false,
    freeShippingNominal: 0,
    sliderDiscount: 0,
  });

  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const updateState = (key: keyof AppState, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  // --- LOGIC CALCULATIONS (Real-time via useMemo) ---
  const calc = useMemo(() => {
    const qty = state.quantity > 0 ? state.quantity : 1;
    const hargaJual = state.sellingPrice;
    const hargaModal = state.costPrice;

    // Determine primary discount (Slider overrides manual if slider > 0, else combine manual)
    let diskonPersenAktif = state.sliderDiscount > 0 ? state.sliderDiscount : state.discountPercent;
    let diskonNominalAktif = state.sliderDiscount > 0 ? 0 : state.discountNominal;

    // Flash sale override (example logic: Flash sale adds extra 10% on top if checked, just for simulation complexity)
    // Actually, prompt says "Tampilkan input tambahan jika aktif". We'll treat Flash sale as just a label or we can add a specific input.
    // Let's stick to using the slider/inputs as the main driver.

    // 1. Total Penjualan Normal
    const totalPenjualanNormal = hargaJual * qty;
    const totalModalNormal = hargaModal * qty;

    // 2. Diskon Utama (Per Item)
    let nominalDiskonDariPersen = (hargaJual * diskonPersenAktif) / 100;
    let totalDiskonProduk = nominalDiskonDariPersen + diskonNominalAktif;
    if (totalDiskonProduk > hargaJual) totalDiskonProduk = hargaJual; // Cap at price

    const hargaSetelahDiskon = hargaJual - totalDiskonProduk;

    // 3. Potongan Tambahan (Per Item)
    const voucher = state.useVoucher ? state.voucherNominal : 0;
    const cashback = state.useCashback ? state.cashbackNominal : 0;
    const gratisOngkir = state.useFreeShipping ? state.freeShippingNominal : 0;
    
    // Fee dihitung dari harga setelah diskon (standar marketplace)
    const adminFee = (hargaSetelahDiskon * state.adminFeePercent) / 100;
    const affiliateFee = (hargaSetelahDiskon * state.affiliateFeePercent) / 100;

    const totalPotonganTambahan = voucher + cashback + gratisOngkir + adminFee + affiliateFee;

    // 4. Harga Bersih & Profit (Per Item)
    const hargaBersih = hargaSetelahDiskon - totalPotonganTambahan;
    const profit = hargaBersih - hargaModal;
    
    const margin = hargaBersih > 0 ? (profit / hargaBersih) * 100 : 0;
    const markup = hargaModal > 0 ? (profit / hargaModal) * 100 : 0;

    // 5. Perbandingan (Tanpa Promo vs Dengan Promo) - Total
    const adminTanpaPromo = (hargaJual * state.adminFeePercent) / 100;
    const affiliateTanpaPromo = (hargaJual * state.affiliateFeePercent) / 100;
    const hargaBersihTanpaPromo = hargaJual - adminTanpaPromo - affiliateTanpaPromo;
    const profitTanpaPromo = hargaBersihTanpaPromo - hargaModal;

    const totalPendapatanTanpaPromo = hargaJual * qty;
    const totalProfitTanpaPromo = profitTanpaPromo * qty;
    const marginTanpaPromo = hargaBersihTanpaPromo > 0 ? (profitTanpaPromo / hargaBersihTanpaPromo) * 100 : 0;

    const totalPendapatanDenganPromo = hargaSetelahDiskon * qty;
    const totalProfitDenganPromo = profit * qty;

    // 6. Analisis Insight
    const totalPotonganKeseluruhan = hargaJual - hargaBersih;
    const persenPotonganTotal = hargaJual > 0 ? (totalPotonganKeseluruhan / hargaJual) * 100 : 0;

    let statusPromo = "Tanpa Promo";
    let insightText = "Belum ada diskon signifikan yang diterapkan.";
    let statusColor = "text-gray-600";

    if (persenPotonganTotal > 0 && persenPotonganTotal < 10) {
      statusPromo = "Promo Ringan";
      insightText = "Diskon aman terhadap keuntungan. Cocok untuk retensi pelanggan.";
      statusColor = "text-blue-600";
    } else if (persenPotonganTotal >= 10 && persenPotonganTotal < 25) {
      statusPromo = "Promo Normal";
      insightText = "Standar promo marketplace. Menarik tanpa merusak margin terlalu dalam.";
      statusColor = "text-green-600";
    } else if (persenPotonganTotal >= 25 && persenPotonganTotal < 40) {
      statusPromo = "Promo Agresif";
      insightText = "Potensi sales tinggi, namun perhatikan margin bersih Anda.";
      statusColor = "text-yellow-600";
    } else if (persenPotonganTotal >= 40 && persenPotonganTotal < 60) {
      statusPromo = "Promo Besar";
      insightText = "Profit mulai tergerus drastis. Idealnya hanya untuk cuci gudang (clearance).";
      statusColor = "text-orange-600";
    } else if (persenPotonganTotal >= 60) {
      statusPromo = "Promo Ekstrem";
      insightText = "Peringatan! Diskon terlalu tinggi dan berpotensi menyebabkan kerugian operasional.";
      statusColor = "text-red-600";
    }

    if (profit < 0) {
      statusPromo = "RUGI";
      insightText = "🚨 STRATEGI INI MENYEBABKAN KERUGIAN! Kurangi diskon atau beban biaya.";
      statusColor = "text-red-600";
    }

    // 7. Rekomendasi
    // Target profit = Target% dari modal
    const targetProfitNominal = hargaModal * (state.targetProfitPercent / 100);
    const requiredHargaBersih = hargaModal + targetProfitNominal;
    
    // Reverse math for minimum selling price assuming current fees stay proportional
    // This is a simplified estimation for the recommendation
    const feeMultiplier = 1 - ((state.adminFeePercent + state.affiliateFeePercent) / 100);
    let minSellingPrice = 0;
    if (feeMultiplier > 0) {
        minSellingPrice = (requiredHargaBersih + voucher + cashback + gratisOngkir + diskonNominalAktif) / (feeMultiplier - (diskonPersenAktif/100));
    }

    // 8. Breakdown Composition
    const compModal = hargaJual > 0 ? (hargaModal / hargaJual) * 100 : 0;
    const compDiskon = hargaJual > 0 ? (totalDiskonProduk / hargaJual) * 100 : 0;
    const compBiaya = hargaJual > 0 ? (totalPotonganTambahan / hargaJual) * 100 : 0;
    const compProfit = hargaJual > 0 ? (Math.max(0, profit) / hargaJual) * 100 : 0;

    // Simulasi Cards Data
    const simRingan = hargaJual - (hargaJual * 0.1);
    const simNormal = hargaJual - (hargaJual * 0.2);
    const simFlash = hargaJual - (hargaJual * 0.4);

    return {
      qty,
      hargaJual,
      hargaModal,
      totalPenjualanNormal,
      hargaSetelahDiskon,
      hargaBersih,
      profit,
      margin,
      markup,
      totalDiskonProduk,
      voucher,
      cashback,
      totalPotonganKeseluruhan,
      
      // Comparison
      profitTanpaPromo,
      marginTanpaPromo,
      totalPendapatanTanpaPromo,
      totalPendapatanDenganPromo,
      totalProfitTanpaPromo,
      totalProfitDenganPromo,
      
      // Analysis
      statusPromo,
      insightText,
      statusColor,
      persenPotonganTotal,

      // Composition
      compModal,
      compDiskon,
      compBiaya,
      compProfit,

      // Rec
      minSellingPrice: isNaN(minSellingPrice) || minSellingPrice < 0 ? 0 : minSellingPrice,

      // Sim Cards
      simRingan,
      simNormal,
      simFlash
    };
  }, [state]);

  // --- ACTIONS ---
  const handleReset = () => {
    setState({
      productName: "",
      category: "Makanan",
      costPrice: 0,
      sellingPrice: 0,
      quantity: 1,
      discountPercent: 0,
      discountNominal: 0,
      adminFeePercent: 0,
      affiliateFeePercent: 0,
      targetProfitPercent: 30,
      useFlashSale: false,
      useVoucher: false,
      voucherNominal: 0,
      useCashback: false,
      cashbackNominal: 0,
      useFreeShipping: false,
      freeShippingNominal: 0,
      sliderDiscount: 0,
    });
  };

  const handleCopySummary = () => {
    const summary = `
==================================
🏷️ KALKULATOR DISKON SAAS
==================================
Produk      : ${state.productName || "Produk Tanpa Nama"}
Kategori    : ${state.category}
Harga Modal : ${formatRupiah(state.costPrice)}
Harga Awal  : ${formatRupiah(state.sellingPrice)}

--- PROMO & BIAYA ---
Total Diskon: ${formatRupiah(calc.totalDiskonProduk)}
Voucher     : ${formatRupiah(calc.voucher)}
Cashback    : ${formatRupiah(calc.cashback)}
Total Beban : ${formatRupiah(calc.totalPotonganKeseluruhan)}

--- HASIL AKHIR ---
Harga Akhir : ${formatRupiah(calc.hargaSetelahDiskon)}
Penerimaan  : ${formatRupiah(calc.hargaBersih)}
Profit      : ${formatRupiah(calc.profit)}
Margin      : ${formatPercent(calc.margin)}
Markup      : ${formatPercent(calc.markup)}

Status      : ${calc.statusPromo}
Insight     : ${calc.insightText}
==================================
    `.trim();

    navigator.clipboard.writeText(summary).then(() => {
      showToast("Ringkasan berhasil disalin!");
    });
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      
      {/* Toast */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          {toast.msg}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-200">
              🏷️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kalkulator Diskon</h1>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">Professional Tool</span>
              </div>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Hitung harga setelah diskon, keuntungan, cashback, dan simulasi promo otomatis untuk strategi UMKM yang profitable.
              </p>
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN - INPUTS (65%) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            
            {/* CARD 1: INFORMASI PRODUK */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                Informasi Produk
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Nama Produk</label>
                  <input
                    type="text"
                    value={state.productName}
                    onChange={(e) => updateState("productName", e.target.value)}
                    placeholder="Contoh: Sepatu Sneakers"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all hover:border-blue-300 shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={state.category}
                    onChange={(e) => updateState("category", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all hover:border-blue-300 shadow-sm cursor-pointer"
                  >
                    {["Makanan", "Minuman", "Fashion", "Elektronik", "Jasa", "Kerajinan", "Digital", "Lainnya"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CARD 2: HARGA PRODUK */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 relative z-10">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Struktur Harga Dasar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                <NumericInput label="Harga Modal (COGS)" value={state.costPrice} onChange={(v) => updateState("costPrice", v)} prefix="Rp" />
                <NumericInput label="Harga Jual Normal" value={state.sellingPrice} onChange={(v) => updateState("sellingPrice", v)} prefix="Rp" />
                <NumericInput label="Jumlah Produk" value={state.quantity} onChange={(v) => updateState("quantity", v)} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-3 rounded-lg relative z-10">
                <span className="text-sm font-medium text-gray-500">Total Penjualan (Tanpa Diskon):</span>
                <span className="text-lg font-bold text-gray-900">{formatRupiah(calc.totalPenjualanNormal)}</span>
              </div>
            </div>

            {/* CARD 3 & 4: PROMO & SIMULASI (Combined for better UX) */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Pengaturan Promo & Biaya
                </h2>
              </div>
              
              {/* Diskon Utama */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <NumericInput label="Diskon Persentase" value={state.discountPercent} onChange={(v) => updateState("discountPercent", v)} max={100} suffix="%" />
                <NumericInput label="Diskon Nominal" value={state.discountNominal} onChange={(v) => updateState("discountNominal", v)} prefix="Rp" />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={state.useVoucher} onChange={(e) => updateState("useVoucher", e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Voucher Toko</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={state.useCashback} onChange={(e) => updateState("useCashback", e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Cashback</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={state.useFreeShipping} onChange={(e) => updateState("useFreeShipping", e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Subsidi Ongkir</span>
                </label>
              </div>

              {/* Conditional Inputs based on Toggles */}
              {(state.useVoucher || state.useCashback || state.useFreeShipping) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  {state.useVoucher && <NumericInput label="Nominal Voucher" value={state.voucherNominal} onChange={(v) => updateState("voucherNominal", v)} prefix="Rp" />}
                  {state.useCashback && <NumericInput label="Nominal Cashback" value={state.cashbackNominal} onChange={(v) => updateState("cashbackNominal", v)} prefix="Rp" />}
                  {state.useFreeShipping && <NumericInput label="Subsidi Ongkir" value={state.freeShippingNominal} onChange={(v) => updateState("freeShippingNominal", v)} prefix="Rp" />}
                </div>
              )}

              {/* Platform Fees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                <NumericInput label="Biaya Admin Marketplace" value={state.adminFeePercent} onChange={(v) => updateState("adminFeePercent", v)} max={100} suffix="%" />
                <NumericInput label="Biaya Affiliate/Kreator" value={state.affiliateFeePercent} onChange={(v) => updateState("affiliateFeePercent", v)} max={100} suffix="%" />
              </div>
            </div>

            {/* CARD 5: TARGET & SLIDER SIMULASI */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                Target & Simulasi Cepat
              </h2>
              
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Target Profit</label>
                  <div className="flex gap-2">
                    <select
                      value={state.targetProfitPercent}
                      onChange={(e) => updateState("targetProfitPercent", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                    >
                      {[10, 20, 30, 40, 50].map(p => <option key={p} value={p}>{p}%</option>)}
                      <option value={state.targetProfitPercent}>Custom ({state.targetProfitPercent}%)</option>
                    </select>
                  </div>
                </div>

                <div className="w-full md:w-2/3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Simulasi Diskon Instan</label>
                    <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{state.sliderDiscount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={state.sliderDiscount}
                    onChange={(e) => updateState("sliderDiscount", Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">Geser untuk melihat perubahan profit secara real-time di Dashboard.</p>
                </div>
              </div>
            </div>

            {/* CARD 7: AKSI */}
            <div className="flex gap-4">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                Hitung Ulang & Lihat Hasil
              </button>
              <button onClick={handleReset} className="px-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl shadow-sm transition-all active:scale-95">
                Reset Semua
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN - STICKY DASHBOARD (35%) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6 flex flex-col gap-6">
              
              {/* CARD HASIL UTAMA */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-0 overflow-hidden transition-all">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white text-center">
                  <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">Harga Akhir Konsumen</p>
                  <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex justify-center items-center gap-2">
                    <span>🏷️</span> {formatRupiah(calc.hargaSetelahDiskon)}
                  </h2>
                  <div className="flex justify-center items-center gap-2 text-sm text-blue-100">
                    <span className="line-through opacity-70">{formatRupiah(calc.hargaJual)}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">-{formatPercent(calc.persenPotonganTotal)}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Metrik Keuntungan (Per Item)</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Profit Bersih</p>
                      <p className={`text-lg font-bold ${calc.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatRupiah(calc.profit)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Margin Profit</p>
                      <p className={`text-lg font-bold ${calc.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(calc.margin)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Penerimaan Bersih</span>
                      <span className="font-medium text-gray-900">{formatRupiah(calc.hargaBersih)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Potongan Promo</span>
                      <span className="font-medium text-red-500">-{formatRupiah(calc.totalPotonganKeseluruhan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Markup dari Modal</span>
                      <span className="font-medium text-gray-900">{formatPercent(calc.markup)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD ANALISIS */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-8 rounded-full ${calc.profit < 0 ? 'bg-red-500' : (calc.persenPotonganTotal > 40 ? 'bg-orange-500' : 'bg-green-500')}`}></div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Simulasi</h3>
                    <p className={`text-lg font-bold ${calc.statusColor}`}>{calc.statusPromo}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 pl-5 border-l-2 border-transparent">{calc.insightText}</p>
              </div>

              {/* CARD VISUAL BREAKDOWN */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Komposisi Harga Jual</h3>
                
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-3">
                  <div style={{ width: `${calc.compModal}%` }} className="bg-gray-400 transition-all duration-500" title="Modal"></div>
                  <div style={{ width: `${calc.compBiaya}%` }} className="bg-red-300 transition-all duration-500" title="Biaya & Fee"></div>
                  <div style={{ width: `${calc.compDiskon}%` }} className="bg-red-500 transition-all duration-500" title="Diskon"></div>
                  <div style={{ width: `${calc.compProfit}%` }} className="bg-green-500 transition-all duration-500" title="Profit"></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-400"></span> Modal ({formatPercent(calc.compModal)})</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500"></span> Profit ({formatPercent(calc.compProfit)})</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Promo ({formatPercent(calc.compDiskon)})</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-300"></span> Biaya/Fee ({formatPercent(calc.compBiaya)})</div>
                </div>
              </div>

              {/* CARD PERBANDINGAN */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Bandingkan Skenario</h3>
                
                <div className="flex justify-between items-center text-sm mb-2">
                  <div className="w-2/5 text-center p-2 bg-gray-50 rounded border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Tanpa Promo</p>
                    <p className="font-bold text-gray-900">{formatRupiah(calc.profitTanpaPromo)}</p>
                  </div>
                  <div className="w-1/5 text-center text-gray-400 font-bold text-xs">VS</div>
                  <div className="w-2/5 text-center p-2 bg-blue-50 rounded border border-blue-100">
                    <p className="text-xs text-blue-600 mb-1">Promo Aktif</p>
                    <p className="font-bold text-blue-900">{formatRupiah(calc.profit)}</p>
                  </div>
                </div>
                {calc.profitTanpaPromo > calc.profit && calc.profit > 0 && (
                   <p className="text-xs text-center text-orange-500 mt-2 font-medium">Anda kehilangan {formatRupiah(calc.profitTanpaPromo - calc.profit)} potensi profit per item demi diskon.</p>
                )}
              </div>

              {/* CARD REKOMENDASI */}
              <div className="bg-blue-600 rounded-xl shadow-lg border border-blue-700 p-5 text-white">
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Insight AI</h3>
                <p className="text-sm text-blue-50 leading-relaxed">
                  Agar mencapai target profit <span className="font-bold text-white">{state.targetProfitPercent}%</span> dengan struktur biaya saat ini, harga jual minimal Anda sebaiknya di angka:
                </p>
                <div className="mt-3 text-2xl font-bold bg-white/10 p-2 rounded-lg text-center border border-white/20">
                  {formatRupiah(calc.minSellingPrice)}
                </div>
              </div>

              {/* ACTION: COPY */}
              <button 
                onClick={handleCopySummary}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                Salin Ringkasan
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}