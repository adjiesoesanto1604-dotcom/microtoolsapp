'use client';

import React, { useState, useMemo, useEffect } from 'react';

// --- INTERFACES & TYPES ---
interface BisnisInfo {
  namaUsaha: string;
  jenisUsaha: string;
  produkUtama: string;
}

interface HargaProduk {
  hargaJual: number;
  hpp: number;
}

interface DataIklan {
  budgetIklan: number;
  cpm: number;
  ctr: number; // Persentase (cth: 1.5%)
  conversionRate: number; // Persentase (cth: 2.0%)
}

interface TargetPenjualan {
  targetOmzet: number;
  targetOrder: number;
  targetProfit: number;
}

interface FormState {
  bisnis: BisnisInfo;
  harga: HargaProduk;
  iklan: DataIklan;
  target: TargetPenjualan;
  simulasiBudget: number; // Persentase pengubah budget (-50% s.d. +100%)
}

interface MetrikOutput {
  budgetAktif: number;
  impressions: number;
  clicks: number;
  orders: number;
  omzet: number;
  totalHpp: number;
  profitKotorProduk: number; // (Harga Jual - HPP) * Orders
  profitBersih: number; // Profit Kotor - Budget Iklan
  roas: number; // Omzet / Budget Iklan
  roiAds: number; // Profit Bersih / Budget Iklan * 100%
  cpa: number; // Budget Iklan / Orders
  cpc: number; // Sesuai input budget & CPM & CTR atau dihitung mandiri
  costPerOrder: number;
  breakEvenRoas: number;
  budgetIdeal: number;
  budgetMaksimal: number;
  orderImpas: number;
}

// --- INITIAL STATE ---
const initialState: FormState = {
  bisnis: {
    namaUsaha: '',
    jenisUsaha: '',
    produkUtama: '',
  },
  harga: {
    hargaJual: 150000,
    hpp: 60000,
  },
  iklan: {
    budgetIklan: 3000000, // Bulanan
    cpm: 45000,
    ctr: 2.5, // 2.5%
    conversionRate: 1.8, // 1.8%
  },
  target: {
    targetOmzet: 15000000,
    targetOrder: 100,
    targetProfit: 5000000,
  },
  simulasiBudget: 0, // 0% pergeseran dasar
};

// --- HELPER GENERIC ---
// Memenuhi syarat: "Semua helper generic harus menggunakan T extends Record<string, string>"
// Kami menyediakan helper sederhana untuk menserialisasi info bisnis demi keperluan ekspor
function serializeInfo<T extends Record<string, string>>(data: T): string {
  return Object.entries(data)
    .filter(([_, v]) => v.trim() !== '')
    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
    .join(', ');
}

// --- UTILS FORMAT ---
const formatRupiah = (angka: number): string => {
  if (isNaN(angka) || !isFinite(angka)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};

const formatNumber = (angka: number): string => {
  if (isNaN(angka) || !isFinite(angka)) return '0';
  return new Intl.NumberFormat('id-ID').format(angka);
};

const parseRupiahInput = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

export default function AdsRoasPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- TOAST CONTROLLER ---
  const triggerToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- HANDLERS ---
  const handleBisnisChange = (key: keyof BisnisInfo, val: string) => {
    setForm((prev) => ({
      ...prev,
      bisnis: { ...prev.bisnis, [key]: val },
    }));
  };

  const handleHargaChange = (key: keyof HargaProduk, rawVal: string) => {
    const val = parseRupiahInput(rawVal);
    setForm((prev) => ({
      ...prev,
      harga: { ...prev.harga, [key]: val },
    }));
  };

  const handleIklanChange = (key: keyof DataIklan, rawVal: string, isPercent = false) => {
    let val = 0;
    if (isPercent) {
      const parsed = parseFloat(rawVal);
      val = isNaN(parsed) ? 0 : parsed;
    } else {
      val = parseRupiahInput(rawVal);
    }

    setForm((prev) => ({
      ...prev,
      iklan: { ...prev.iklan, [key]: val },
    }));
  };

  const handleTargetChange = (key: keyof TargetPenjualan, rawVal: string) => {
    const val = parseRupiahInput(rawVal);
    setForm((prev) => ({
      ...prev,
      target: { ...prev.target, [key]: val },
    }));
  };

  const handleReset = () => {
    setForm(initialState);
    triggerToast('Seluruh data berhasil di-reset.');
  };

  // --- ENGINE PERHITUNGAN (useMemo) ---
  const calculateMetrics = (budgetModifierPercent: number): MetrikOutput => {
    const { harga, iklan } = form;
    
    // 1. Budget Aktif setelah dimodifikasi slider/skenario
    const budgetAktif = iklan.budgetIklan * (1 + budgetModifierPercent / 100);

    // 2. Impressions (CPM = Cost per 1000 Impressions)
    // Formula: Impressions = (Budget / CPM) * 1000
    const impressions = iklan.cpm > 0 ? (budgetAktif / iklan.cpm) * 1000 : 0;

    // 3. Clicks (CTR % dari Impressions)
    const clicks = impressions * (iklan.ctr / 100);

    // 4. Orders (Conversion Rate % dari Clicks)
    const orders = clicks * (iklan.conversionRate / 100);

    // 5. Financials
    const omzet = orders * harga.hargaJual;
    const totalHpp = orders * harga.hpp;
    const profitKotorProduk = orders * (harga.hargaJual - harga.hpp);
    const profitBersih = profitKotorProduk - budgetAktif;

    // 6. ROAS (Return on Ad Spend)
    const roas = budgetAktif > 0 ? omzet / budgetAktif : 0;

    // 7. ROI Ads
    const roiAds = budgetAktif > 0 ? (profitBersih / budgetAktif) * 100 : 0;

    // 8. CPA (Cost per Acquisition / Cost per Order)
    const cpa = orders > 0 ? budgetAktif / orders : 0;

    // 9. CPC Mandiri (Jika dihitung dari CPM & CTR: Cost / Click)
    const cpc = clicks > 0 ? budgetAktif / clicks : 0;

    // 10. Break Even ROAS (Harga Jual / Profit Margin Kotor per Unit)
    const profitPerUnit = harga.hargaJual - harga.hpp;
    const breakEvenRoas = profitPerUnit > 0 ? harga.hargaJual / profitPerUnit : 0;

    // 11. Order yang dibutuhkan untuk impas (menutup biaya iklan)
    const orderImpas = profitPerUnit > 0 ? budgetAktif / profitPerUnit : 0;

    // 12. Budget Ideal & Maksimal berdasarkan target profit / omzet
    // Estimasi budget ideal agar mencapai target profit
    const marginBersihPerOrder = profitPerUnit - cpa;
    const budgetIdeal = marginBersihPerOrder > 0 ? (form.target.targetProfit / marginBersihPerOrder) * cpa : 0;
    const budgetMaksimal = profitPerUnit * orders; // Nilai di mana seluruh profit produk habis terpakai biaya iklan

    return {
      budgetAktif,
      impressions,
      clicks,
      orders,
      omzet,
      totalHpp,
      profitKotorProduk,
      profitBersih,
      roas,
      roiAds,
      cpa,
      cpc,
      costPerOrder: cpa,
      breakEvenRoas,
      budgetIdeal,
      budgetMaksimal,
      orderImpas,
    };
  };

  const currentResult = useMemo(() => {
    return calculateMetrics(form.simulasiBudget);
  }, [form]);

  // Skenario untuk 3 kotak simulasi
  const pesimisResult = useMemo(() => calculateMetrics(-20), [form]);
  const normalResult = useMemo(() => calculateMetrics(0), [form]);
  const optimisResult = useMemo(() => calculateMetrics(50), [form]);

  // --- STATUS CAMPAIGN ---
  const { statusLabel, statusColor, badgeColor, insightList } = useMemo(() => {
    const { roas, cpc, orders } = currentResult;
    const convRate = form.iklan.conversionRate;

    let label = '🔴 Rugi';
    let color = 'text-red-600';
    let badge = 'bg-red-100 border-red-200 text-red-800';

    if (roas > 5) {
      label = '🟢 Sangat Menguntungkan';
      color = 'text-green-600';
      badge = 'bg-green-100 border-green-200 text-green-800';
    } else if (roas >= 3) {
      label = '🔵 Baik';
      color = 'text-blue-600';
      badge = 'bg-blue-100 border-blue-200 text-blue-800';
    } else if (roas >= 2) {
      label = '🟡 Perlu Optimasi';
      color = 'text-amber-600';
      badge = 'bg-amber-100 border-amber-200 text-amber-800';
    }

    // Generate dynamic insights
    const insights: string[] = [];

    if (roas > 5) {
      insights.push('ROAS sangat tinggi! Anda memiliki ruang besar untuk meningkatkan budget (scaling up) hingga 50%.');
    } else if (roas >= 3) {
      insights.push('Performa iklan sehat. Tingkatkan budget perlahan (+15-20%) sambil memantau kestabilan ROAS.');
    } else {
      insights.push('ROAS di bawah target minimum. Segera lakukan audit materi kreatif iklan atau target audiens.');
    }

    if (convRate < 1.5) {
      insights.push('Tingkat konversi (CR) tergolong rendah (< 1.5%). Fokus optimasi landing page, kecepatan loading, atau tawarkan promo menarik.');
    } else {
      insights.push('Tingkat konversi halaman penawaran sudah optimal. Pertahankan momentum ini.');
    }

    if (cpc > 5000) {
      insights.push('Biaya per klik (CPC) terlalu mahal. Eksperimen dengan CTR kreatif yang lebih memikat atau perluas minat targeting.');
    }

    if (orders < form.target.targetOrder) {
      insights.push(`Pesanan saat ini (${formatNumber(Math.round(orders))} order) belum mencapai target Anda (${formatNumber(form.target.targetOrder)} order).`);
    }

    return {
      statusLabel: label,
      statusColor: color,
      badgeColor: badge,
      insightList: insights,
    };
  }, [currentResult, form.iklan.conversionRate, form.target.targetOrder]);

  // --- COPY RINGKASAN ---
  const handleCopySummary = async () => {
    const bisnisStr = serializeInfo({
      usaha: form.bisnis.namaUsaha || '-',
      jenis: form.bisnis.jenisUsaha || '-',
      produk: form.bisnis.produkUtama || '-',
    });

    const textToCopy = `=== RINGKASAN KALKULATOR ADS & ROAS UMKM ===
Bisnis: ${bisnisStr}
Produk Utama: ${form.bisnis.produkUtama || 'Produk UMKM'}
-------------------------------------------
[HASIL KINERJA IKLAN]
- Budget Iklan Aktif : ${formatRupiah(currentResult.budgetAktif)}
- Estimasi Omzet     : ${formatRupiah(currentResult.omzet)}
- Estimasi Profit    : ${formatRupiah(currentResult.profitBersih)}
- Total Order        : ${formatNumber(Math.round(currentResult.orders))} order
-------------------------------------------
[METRIK UTAMA]
- ROAS (Return On Ad Spend): ${currentResult.roas.toFixed(2)}x
- ROI Ads                  : ${currentResult.roiAds.toFixed(2)}%
- CPA (Biaya per Order)    : ${formatRupiah(currentResult.cpa)}
- CPC (Biaya per Klik)     : ${formatRupiah(currentResult.cpc)}
- Status Campaign          : ${statusLabel}
- Break Even ROAS          : ${currentResult.breakEvenRoas.toFixed(2)}x
-------------------------------------------
Dihitung otomatis via Microtools UMKM.`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      triggerToast('Ringkasan berhasil disalin ke clipboard.');
    } catch (err) {
      console.error('Gagal menyalin text', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-16">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-950 text-white px-6 py-3 rounded-xl shadow-md flex items-center space-x-2 border border-gray-800 transition-all duration-300">
          <span className="text-green-400">⚡</span>
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  Kalkulator Ads & ROAS UMKM
                </h1>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                  Evaluasi performa iklan digital, hitung rasio profitabilitas belanja iklan, serta optimalkan funnel penjualan Anda secara komprehensif.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Professional Tool
              </span>
              <span className="text-xs text-gray-400 mt-1">Powered by Microtools UMKM</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* KOLOM KIRI (65%) */}
          <div className="w-full lg:w-[65%] space-y-6">
            
            {/* Card 1: Informasi Bisnis */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl">💼</span>
                <h2 className="text-lg font-bold text-gray-900">Informasi Bisnis</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="namaUsaha" className="block text-sm font-semibold text-gray-700 mb-1">Nama Usaha</label>
                  <input
                    type="text"
                    id="namaUsaha"
                    placeholder="Cth: Fashion Kita"
                    value={form.bisnis.namaUsaha}
                    onChange={(e) => handleBisnisChange('namaUsaha', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="jenisUsaha" className="block text-sm font-semibold text-gray-700 mb-1">Jenis Usaha</label>
                  <input
                    type="text"
                    id="jenisUsaha"
                    placeholder="Cth: Fashion Muslim"
                    value={form.bisnis.jenisUsaha}
                    onChange={(e) => handleBisnisChange('jenisUsaha', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="produkUtama" className="block text-sm font-semibold text-gray-700 mb-1">Produk Utama</label>
                  <input
                    type="text"
                    id="produkUtama"
                    placeholder="Cth: Hijab Instan Premium"
                    value={form.bisnis.produkUtama}
                    onChange={(e) => handleBisnisChange('produkUtama', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Card 2: Harga Produk */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl">🏷️</span>
                <h2 className="text-lg font-bold text-gray-900">Harga Produk & HPP</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hargaJual" className="block text-sm font-semibold text-gray-700 mb-1">Harga Jual per Produk (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">Rp</span>
                    <input
                      type="text"
                      id="hargaJual"
                      value={form.harga.hargaJual === 0 ? '' : formatNumber(form.harga.hargaJual)}
                      onChange={(e) => handleHargaChange('hargaJual', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="hpp" className="block text-sm font-semibold text-gray-700 mb-1">HPP per Produk (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">Rp</span>
                    <input
                      type="text"
                      id="hpp"
                      value={form.harga.hpp === 0 ? '' : formatNumber(form.harga.hpp)}
                      onChange={(e) => handleHargaChange('hpp', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Tampilan Profit Otomatis */}
              <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-3.5 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 text-base">💰</span>
                  <span className="text-sm font-bold text-green-800">Margin Profit Kotor per Unit:</span>
                </div>
                <span className="font-extrabold text-green-900 text-base">
                  {formatRupiah(form.harga.hargaJual - form.harga.hpp)}
                  <span className="text-xs font-normal text-green-700 ml-1">
                    ({form.harga.hargaJual > 0 ? (((form.harga.hargaJual - form.harga.hpp) / form.harga.hargaJual) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </div>
            </section>

            {/* Card 3: Data Iklan */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl">📢</span>
                <h2 className="text-lg font-bold text-gray-900">Data Kinerja Iklan</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="budgetIklan" className="block text-sm font-semibold text-gray-700 mb-1">Budget Iklan Bulanan (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">Rp</span>
                    <input
                      type="text"
                      id="budgetIklan"
                      value={form.iklan.budgetIklan === 0 ? '' : formatNumber(form.iklan.budgetIklan)}
                      onChange={(e) => handleIklanChange('budgetIklan', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cpm" className="block text-sm font-semibold text-gray-700 mb-1">Estimasi CPM (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">Rp</span>
                    <input
                      type="text"
                      id="cpm"
                      placeholder="Cth: 40.000"
                      value={form.iklan.cpm === 0 ? '' : formatNumber(form.iklan.cpm)}
                      onChange={(e) => handleIklanChange('cpm', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Biaya per 1.000 Tayangan</span>
                </div>
                <div>
                  <label htmlFor="ctr" className="block text-sm font-semibold text-gray-700 mb-1">Target CTR (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      id="ctr"
                      placeholder="Cth: 2.5"
                      value={form.iklan.ctr === 0 ? '' : form.iklan.ctr}
                      onChange={(e) => handleIklanChange('ctr', e.target.value, true)}
                      className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm">%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Click-Through Rate</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="conversionRate" className="block text-sm font-semibold text-gray-700 mb-1">Conversion Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      id="conversionRate"
                      placeholder="Cth: 1.5"
                      value={form.iklan.conversionRate === 0 ? '' : form.iklan.conversionRate}
                      onChange={(e) => handleIklanChange('conversionRate', e.target.value, true)}
                      className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm">%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Rasio Pengunjung menjadi Pembeli</span>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center h-[38px]">
                    <span className="text-xs font-medium text-blue-800">Estimasi CPC Iklan:</span>
                    <span className="text-xs font-bold text-blue-900">
                      {formatRupiah(currentResult.cpc)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 4: Target Penjualan */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl">🎯</span>
                <h2 className="text-lg font-bold text-gray-900">Sasaran & Target Penjualan</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="targetOmzet" className="block text-sm font-semibold text-gray-700 mb-1">Target Omzet (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">Rp</span>
                    <input
                      type="text"
                      id="targetOmzet"
                      value={form.target.targetOmzet === 0 ? '' : formatNumber(form.target.targetOmzet)}
                      onChange={(e) => handleTargetChange('targetOmzet', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="targetOrder" className="block text-sm font-semibold text-gray-700 mb-1">Target Order (Qty)</label>
                  <input
                    type="text"
                    id="targetOrder"
                    value={form.target.targetOrder === 0 ? '' : formatNumber(form.target.targetOrder)}
                    onChange={(e) => handleTargetChange('targetOrder', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="targetProfit" className="block text-sm font-semibold text-gray-700 mb-1">Target Profit Bersih (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">Rp</span>
                    <input
                      type="text"
                      id="targetProfit"
                      value={form.target.targetProfit === 0 ? '' : formatNumber(form.target.targetProfit)}
                      onChange={(e) => handleTargetChange('targetProfit', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Card 5: Simulasi Slider */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🎚️</span>
                  <h2 className="text-lg font-bold text-gray-900">Simulasi Alokasi Budget</h2>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  form.simulasiBudget > 0 ? 'bg-green-100 text-green-800' :
                  form.simulasiBudget < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.simulasiBudget > 0 ? '+' : ''}{form.simulasiBudget}% Budget Iklan
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Geser slider untuk melihat bagaimana performa penjualan, omzet, dan profit bersih berfluktuasi seiring penambahan atau pengurangan biaya iklan.
              </p>
              <div className="space-y-2">
                <input
                  type="range"
                  min="-50"
                  max="100"
                  step="5"
                  value={form.simulasiBudget}
                  onChange={(e) => setForm(prev => ({ ...prev, simulasiBudget: parseInt(e.target.value, 10) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
                <div className="flex justify-between text-xs font-semibold text-gray-400">
                  <span>Potong -50%</span>
                  <span>Budget Dasar (0%)</span>
                  <span>Ekspansi +100%</span>
                </div>
              </div>
            </section>

            {/* RESET BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="w-full py-3.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <span>🔄</span>
                <span>Reset Seluruh Data</span>
              </button>
            </div>

          </div>

          {/* KOLOM KANAN (DASHBOARD STICKY 35%) */}
          <div className="w-full lg:w-[35%] lg:sticky lg:top-[90px] lg:h-[calc(100vh-120px)] overflow-y-auto hidden-scrollbar space-y-6 pb-12 pr-1">
            
            {/* Card Besar: Estimasi Hasil Ads */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-blue-500 opacity-30 blur-xl"></div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-100 mb-1">PROYEKSI LABA BERSIH IKLAN</h2>
              <p className={`text-3xl font-black tracking-tight ${currentResult.profitBersih < 0 ? 'text-red-300' : 'text-white'}`}>
                {formatRupiah(currentResult.profitBersih)}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-500/40 text-sm">
                <div>
                  <p className="text-blue-200 text-xs">Total Omzet</p>
                  <p className="font-bold text-base">{formatRupiah(currentResult.omzet)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs">Volume Order</p>
                  <p className="font-bold text-base">{formatNumber(Math.round(currentResult.orders))} Qty</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs">Biaya Iklan</p>
                  <p className="font-bold text-base">{formatRupiah(currentResult.budgetAktif)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs">ROAS</p>
                  <p className="font-bold text-base">{currentResult.roas.toFixed(2)}x</p>
                </div>
              </div>
            </div>

            {/* Metrik Ads Detail */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Rincian Metrik Kampanye</h3>
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <span className="text-gray-500 block">ROAS</span>
                  <span className={`text-sm font-bold block mt-1 ${currentResult.roas >= 3 ? 'text-green-600' : 'text-amber-600'}`}>
                    {currentResult.roas.toFixed(2)}x
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <span className="text-gray-500 block">ROI Ads</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {currentResult.roiAds.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <span className="text-gray-500 block">CPA (Cost per Order)</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {formatRupiah(currentResult.cpa)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <span className="text-gray-500 block">Cost per Click (CPC)</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {formatRupiah(currentResult.cpc)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <span className="text-gray-500 block">Break Even ROAS</span>
                  <span className="text-sm font-bold text-gray-600 block mt-1">
                    {currentResult.breakEvenRoas.toFixed(2)}x
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <span className="text-gray-500 block">Target Impas (Order)</span>
                  <span className="text-sm font-bold text-blue-600 block mt-1">
                    {formatNumber(Math.ceil(currentResult.orderImpas))} order
                  </span>
                </div>
              </div>
            </div>

            {/* Funnel Visual */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Corong Konversi (Funnel)</h3>
              <div className="space-y-3.5 text-xs">
                {/* Impression */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500 font-medium">1. Impressions (Paparan Iklan)</span>
                    <span className="font-bold text-gray-800">{formatNumber(Math.round(currentResult.impressions))}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* Click */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500 font-medium">2. Clicks ({form.iklan.ctr}% CTR)</span>
                    <span className="font-bold text-gray-800">{formatNumber(Math.round(currentResult.clicks))}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(form.iklan.ctr * 15, 100)}%` }}></div>
                  </div>
                </div>

                {/* Order */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500 font-medium">3. Pembelian / Order ({form.iklan.conversionRate}% CR)</span>
                    <span className="font-bold text-green-600">{formatNumber(Math.round(currentResult.orders))} order</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(form.iklan.conversionRate * 25, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Campaign */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Evaluasi Status Kampanye</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Kategori Kinerja:</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Insight Otomatis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Analisis Rekomendasi</h3>
              <ul className="space-y-2.5">
                {insightList.map((ins, idx) => (
                  <li key={idx} className="flex items-start text-xs text-gray-600">
                    <span className="text-blue-500 mr-2 font-bold">✨</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Skenario Simulasi Budget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3.5 border-b pb-2">Simulasi 3 Skenario Budget</h3>
              <div className="grid grid-cols-3 gap-2">
                
                {/* Pesimis */}
                <div className="bg-red-50/50 border border-red-100 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] font-bold text-red-700 block mb-1">Pesimis (-20%)</span>
                  <p className="text-[11px] font-semibold text-gray-800">{formatRupiah(pesimisResult.profitBersih)}</p>
                  <span className="text-[9px] text-gray-500 block mt-1">ROAS: {pesimisResult.roas.toFixed(1)}x</span>
                </div>

                {/* Normal */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] font-bold text-blue-700 block mb-1">Normal (0%)</span>
                  <p className="text-[11px] font-semibold text-gray-800">{formatRupiah(normalResult.profitBersih)}</p>
                  <span className="text-[9px] text-gray-500 block mt-1">ROAS: {normalResult.roas.toFixed(1)}x</span>
                </div>

                {/* Optimis */}
                <div className="bg-green-50/50 border border-green-100 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] font-bold text-green-700 block mb-1">Optimis (+50%)</span>
                  <p className="text-[11px] font-semibold text-gray-800">{formatRupiah(optimisResult.profitBersih)}</p>
                  <span className="text-[9px] text-gray-500 block mt-1">ROAS: {optimisResult.roas.toFixed(1)}x</span>
                </div>

              </div>
            </div>

            {/* BUTTON COPY */}
            <button
              onClick={handleCopySummary}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center space-x-2"
            >
              <span>📋</span>
              <span>Salin Ringkasan Kampanye</span>
            </button>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-gray-500 font-semibold">
            © 2026 Platform Microtools UMKM Indonesia
          </p>
          <p className="text-xs text-gray-400 mt-2 max-w-3xl mx-auto leading-relaxed">
            Dirancang khusus untuk memandu pengusaha lokal dalam menyusun budget periklanan, melacak efisiensi biaya CPA, menyeimbangkan ROAS di atas titik impas (Break Even), serta meningkatkan laba bersih UMKM secara berkelanjutan.
          </p>
        </div>
      </footer>

      {/* CUSTOM STYLE UNTUK EMBED STICKY SCROLL */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hidden-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        .hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}