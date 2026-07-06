'use client';

import React, { useState, useMemo, useEffect } from 'react';

// ==========================================
// INTERFACES & TYPES
// ==========================================
interface ProductInfo {
  nama: string;
  kategori: string;
  jenisUsaha: string;
}

interface BasePrice {
  hargaModal: string;
  hargaJual: string;
  diskon: string; // Persentase
  biayaTambahan: string;
}

interface TaxInfo {
  jenisPajak: 'PPN_11' | 'PPN_12' | 'TANPA_PAJAK' | 'CUSTOM';
  customPajak: string; // Persentase
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function HargaSetelahPajakPage() {
  // --- STATE ---
  // Card 1: Informasi Produk
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    nama: 'Paket Usaha Premium',
    kategori: 'Jasa & Layanan',
    jenisUsaha: 'B2B Agency',
  });

  // Card 2: Harga Dasar
  const [basePrice, setBasePrice] = useState<BasePrice>({
    hargaModal: '1500000',
    hargaJual: '3000000',
    diskon: '10',
    biayaTambahan: '50000',
  });

  // Card 3: Pajak
  const [taxInfo, setTaxInfo] = useState<TaxInfo>({
    jenisPajak: 'PPN_11',
    customPajak: '0',
  });

  // Card 4: Slider Simulasi (% Perubahan Harga, -20% sampai +30%)
  const [simulationSlider, setSimulationSlider] = useState<number>(0);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide Toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Helper Sanitasi Input Numerik (100% Type-Safe, tanpa issue Generic/Record constraint)
  const cleanNumberInput = (value: string, allowDecimal: boolean = false, isPercentage: boolean = false): string => {
    const regex = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    let cleanValue = value.replace(regex, '');

    // Cegah multi desimal point
    if (allowDecimal && (cleanValue.match(/\./g) || []).length > 1) {
      // Ambil string sebelum desimal kedua
      const parts = cleanValue.split('.');
      cleanValue = `${parts[0]}.${parts.slice(1).join('').replace(/\./g, '')}`;
    }

    // Batasi persentase maksimal 100
    if (isPercentage && Number(cleanValue) > 100) {
      cleanValue = '100';
    }

    return cleanValue;
  };

  // Reset handler
  const handleReset = () => {
    setProductInfo({
      nama: '',
      kategori: '',
      jenisUsaha: '',
    });
    setBasePrice({
      hargaModal: '0',
      hargaJual: '0',
      diskon: '0',
      biayaTambahan: '0',
    });
    setTaxInfo({
      jenisPajak: 'TANPA_PAJAK',
      customPajak: '0',
    });
    setSimulationSlider(0);
    showToast('Seluruh data input berhasil di-reset!');
  };

  // ==========================================
  // CALCULATIONS (using useMemo)
  // ==========================================
  const calculations = useMemo(() => {
    const parseNum = (val: string): number => Number(val) || 0;

    // 1. Parsing Nilai Dasar (Validasi aman dari angka negatif)
    const modal = Math.max(0, parseNum(basePrice.hargaModal));
    const rawHargaJual = Math.max(0, parseNum(basePrice.hargaJual));
    const diskonPct = Math.min(100, Math.max(0, parseNum(basePrice.diskon)));
    const biayaTambahan = Math.max(0, parseNum(basePrice.biayaTambahan));

    // 2. Tentukan Persentase Pajak Aktual
    let pajakPct = 0;
    if (taxInfo.jenisPajak === 'PPN_11') pajakPct = 11;
    else if (taxInfo.jenisPajak === 'PPN_12') pajakPct = 12;
    else if (taxInfo.jenisPajak === 'CUSTOM') pajakPct = Math.min(100, Math.max(0, parseNum(taxInfo.customPajak)));

    // 3. Kalkulasi Simulasi Harga Jual
    const multiplier = 1 + simulationSlider / 100;
    const simHargaJual = rawHargaJual * multiplier;

    // 4. Kalkulasi Harga Bersih Sebelum Pajak
    const nominalDiskon = simHargaJual * (diskonPct / 100);
    const hargaBersihSebelumPajak = Math.max(0, simHargaJual - nominalDiskon + biayaTambahan);

    // 5. Kalkulasi Pajak & Harga Final
    const nominalPajak = hargaBersihSebelumPajak * (pajakPct / 100);
    const hargaFinal = hargaBersihSebelumPajak + nominalPajak;

    // 6. Profitabilitas
    // Asumsi: Laba bersih pedagang berasal dari (Harga Bersih - Harga Modal).
    // Pajak diteruskan ke konsumen, sehingga tidak menggerus laba (Pajak Keluaran).
    const labaKotor = hargaBersihSebelumPajak - modal;
    const marginPct = hargaBersihSebelumPajak > 0 ? (labaKotor / hargaBersihSebelumPajak) * 100 : 0;
    const markupPct = modal > 0 ? (labaKotor / modal) * 100 : 0;
    const roi = markupPct; // Konteks produk tunggal, ROI ≈ Markup

    // 7. Status & Insights
    let statusLabel = 'Normal';
    let statusColor = 'bg-yellow-500';
    let statusBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    let insightTexts: string[] = [];

    if (hargaBersihSebelumPajak === 0) {
      statusLabel = 'Data Kosong';
      statusColor = 'bg-gray-400';
      statusBg = 'bg-gray-50 text-gray-600 border-gray-200';
      insightTexts.push('Silakan masukkan harga jual dan modal produk Anda.');
    } else if (marginPct < 0) {
      statusLabel = 'Rugi Total';
      statusColor = 'bg-red-700';
      statusBg = 'bg-red-50 text-red-800 border-red-300';
      insightTexts.push('RUGI! Harga jual bersih Anda berada di bawah harga modal.');
      insightTexts.push('Segera naikkan harga jual atau kurangi diskon.');
    } else if (marginPct < 15) {
      statusLabel = 'Margin Rendah';
      statusColor = 'bg-red-500';
      statusBg = 'bg-red-50 text-red-700 border-red-200';
      insightTexts.push('Margin sangat rendah, rentan terhadap fluktuasi biaya operasional.');
      if (diskonPct > 10) insightTexts.push('Diskon terlalu tinggi, batasi diskon maksimal untuk menjaga profit.');
    } else if (marginPct < 30) {
      statusLabel = 'Margin Tipis';
      statusColor = 'bg-orange-500';
      statusBg = 'bg-orange-50 text-orange-700 border-orange-200';
      insightTexts.push('Margin cukup kompetitif di pasaran, namun perlu efisiensi biaya tambahan.');
      if (nominalPajak > labaKotor) insightTexts.push('Pajak terlalu besar dibanding margin keuntungan Anda.');
      insightTexts.push('Coba naikkan harga jual sedikit untuk memperlebar margin.');
    } else if (marginPct < 50) {
      statusLabel = 'Margin Aman';
      statusColor = 'bg-blue-500';
      statusBg = 'bg-blue-50 text-blue-700 border-blue-200';
      insightTexts.push('Margin sudah sehat. Struktur harga sudah ideal untuk UMKM.');
      insightTexts.push('Harga masih kompetitif, pertahankan posisi pasar Anda.');
    } else {
      statusLabel = 'Margin Sangat Baik';
      statusColor = 'bg-green-500';
      statusBg = 'bg-green-50 text-green-700 border-green-200';
      insightTexts.push('Sangat Menguntungkan! Anda memiliki ruang bermanuver yang besar.');
      insightTexts.push('Gunakan kelebihan margin ini untuk program marketing atau peningkatan kualitas.');
    }

    // 8. Kalkulasi 3 Skenario (Pesimis -20%, Normal 0%, Optimis +30%)
    const calcScenario = (scenarioMultiplier: number) => {
        const sJual = rawHargaJual * scenarioMultiplier;
        const sDiskon = sJual * (diskonPct / 100);
        const sBersih = Math.max(0, sJual - sDiskon + biayaTambahan);
        const sPajak = sBersih * (pajakPct / 100);
        const sFinal = sBersih + sPajak;
        const sLaba = sBersih - modal;
        const sMargin = sBersih > 0 ? (sLaba / sBersih) * 100 : 0;
        return { hargaFinal: sFinal, pajak: sPajak, laba: sLaba, margin: sMargin };
    };

    const skenarioPesimis = calcScenario(0.8);
    const skenarioNormal = calcScenario(1.0);
    const skenarioOptimis = calcScenario(1.3);

    // 9. Proporsi Visual Breakdown (Harga Final = Modal + Biaya Tambahan + Laba + Pajak)
    const totalRepresentasi = hargaFinal || 1; 
    // Jika rugi, laba visual dianggap 0 agar progress bar tidak rusak (NaN/Negatif)
    const visualLaba = Math.max(0, labaKotor - biayaTambahan); 
    const visualBiaya = biayaTambahan;
    const visualModal = modal;
    
    const pctModalVisual = (visualModal / totalRepresentasi) * 100;
    const pctBiayaVisual = (visualBiaya / totalRepresentasi) * 100;
    const pctPajakVisual = (nominalPajak / totalRepresentasi) * 100;
    const pctLabaVisual = (visualLaba / totalRepresentasi) * 100;

    return {
      simHargaJual,
      nominalDiskon,
      hargaBersihSebelumPajak,
      nominalPajak,
      hargaFinal,
      labaKotor,
      marginPct,
      markupPct,
      roi,
      statusLabel,
      statusColor,
      statusBg,
      insightTexts,
      skenarioPesimis,
      skenarioNormal,
      skenarioOptimis,
      pctModalVisual,
      pctBiayaVisual,
      pctPajakVisual,
      pctLabaVisual,
    };
  }, [basePrice, taxInfo, simulationSlider]);

  // Format ke Rupiah
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format Angka Biasa
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Copy Clipboard handler
  const handleCopySummary = () => {
    const textToCopy = `==================================
KALKULATOR HARGA & PAJAK
==================================
Produk      : ${productInfo.nama || '-'}
Kategori    : ${productInfo.kategori || '-'}

[ RINCIAN BIAYA ]
Harga Modal : ${formatRupiah(Number(basePrice.hargaModal) || 0)}
Harga Jual  : ${formatRupiah(calculations.simHargaJual)}
Diskon      : ${basePrice.diskon}% (${formatRupiah(calculations.nominalDiskon)})
Harga Sblm Pajak : ${formatRupiah(calculations.hargaBersihSebelumPajak)}

[ PAJAK & FINAL ]
Pajak       : ${formatRupiah(calculations.nominalPajak)}
HARGA FINAL : ${formatRupiah(calculations.hargaFinal)}

[ ANALISIS KEUNTUNGAN ]
Laba Kotor  : ${formatRupiah(calculations.labaKotor)}
Margin      : ${calculations.marginPct.toFixed(1)}%
Status      : ${calculations.statusLabel}

Insight     : ${calculations.insightTexts.join(' ')}
==================================`;

    try {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Ringkasan berhasil disalin.');
    } catch (err) {
      showToast('Gagal menyalin ringkasan, silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 w-full h-20 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl text-blue-600 shadow-inner">
            💳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                Kalkulator Harga Setelah Pajak
              </h1>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider uppercase border border-blue-200">
                Professional Tool
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 font-medium">
              Hitung harga jual setelah PPN beserta analisis laba dan margin secara otomatis.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Powered by</span>
          <span className="text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Microtools UMKM
          </span>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[1280px] mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          
          {/* ================= LEFT COLUMN (65%) ================= */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* CARD 1: Informasi Produk */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="text-xl">📦</span>
                <h3 className="font-bold text-gray-900 text-base">Informasi Produk</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nama Produk</label>
                  <input
                    type="text"
                    value={productInfo.nama}
                    onChange={(e) => setProductInfo(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Contoh: Paket Premium"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategori Produk</label>
                  <input
                    type="text"
                    value={productInfo.kategori}
                    onChange={(e) => setProductInfo(prev => ({ ...prev, kategori: e.target.value }))}
                    placeholder="Contoh: Jasa / Retail"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jenis Usaha</label>
                  <input
                    type="text"
                    value={productInfo.jenisUsaha}
                    onChange={(e) => setProductInfo(prev => ({ ...prev, jenisUsaha: e.target.value }))}
                    placeholder="Contoh: B2B / B2C"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </section>

            {/* CARD 2: Harga Dasar */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏷️</span>
                  <h3 className="font-bold text-gray-900 text-base">Harga Dasar</h3>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                  Harga Bersih Sblm Pajak: {formatRupiah(calculations.hargaBersihSebelumPajak)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Harga Modal (HPP)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(Number(basePrice.hargaModal) || 0)}
                      onChange={(e) => setBasePrice(prev => ({ ...prev, hargaModal: cleanNumberInput(e.target.value) }))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Harga Jual Sebelum Pajak</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(Number(basePrice.hargaJual) || 0)}
                      onChange={(e) => setBasePrice(prev => ({ ...prev, hargaJual: cleanNumberInput(e.target.value) }))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Diskon (%)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="text"
                      value={basePrice.diskon}
                      onChange={(e) => setBasePrice(prev => ({ ...prev, diskon: cleanNumberInput(e.target.value, true, true) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Biaya Tambahan</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(Number(basePrice.biayaTambahan) || 0)}
                      onChange={(e) => setBasePrice(prev => ({ ...prev, biayaTambahan: cleanNumberInput(e.target.value) }))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 3: Pajak */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="text-xl">🏛️</span>
                <h3 className="font-bold text-gray-900 text-base">Pajak</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jenis Pajak</label>
                  <select
                    value={taxInfo.jenisPajak}
                    onChange={(e) => setTaxInfo(prev => ({ ...prev, jenisPajak: e.target.value as TaxInfo['jenisPajak'] }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="TANPA_PAJAK">Tanpa Pajak (0%)</option>
                    <option value="PPN_11">PPN 11%</option>
                    <option value="PPN_12">PPN 12%</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                {taxInfo.jenisPajak === 'CUSTOM' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Persentase Pajak (%)</label>
                    <div className="relative rounded-lg shadow-sm">
                      <input
                        type="text"
                        value={taxInfo.customPajak}
                        onChange={(e) => setTaxInfo(prev => ({ ...prev, customPajak: cleanNumberInput(e.target.value, true, true) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-bold">%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CARD 4: Simulasi Slider */}
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl border border-blue-700 shadow-sm hover:shadow-md transition-all p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🎛️</span>
                <h3 className="font-bold text-base">Simulasi Perubahan Harga</h3>
              </div>
              
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-blue-200">Perubahan Harga Jual</span>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${simulationSlider === 0 ? 'bg-blue-500' : simulationSlider > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {simulationSlider === 0 ? 'Normal (0%)' : simulationSlider > 0 ? `+${simulationSlider}%` : `${simulationSlider}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="30"
                  value={simulationSlider}
                  onChange={(e) => setSimulationSlider(Number(e.target.value))}
                  className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[10px] text-blue-200 font-bold uppercase">
                  <span>📉 -20%</span>
                  <span>0%</span>
                  <span>📈 +30%</span>
                </div>
              </div>
            </section>

            {/* CARD 5: Tombol Reset */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center gap-2 bg-white"
              >
                <span>🔄</span> Reset Semua Input
              </button>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (35%) ================= */}
          <div className="lg:col-span-4">
            
            {/* STICKY CONTAINER */}
            <div className="lg:sticky lg:top-28 space-y-6">

              {/* DASHBOARD CARD 1: HARGA SETELAH PAJAK */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-7xl select-none">
                  💎
                </div>
                <div className="relative z-10">
                  <span className="text-xs font-bold tracking-widest text-blue-700 uppercase block mb-1">
                    HARGA SETELAH PAJAK
                  </span>
                  <div className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight my-2">
                    {formatRupiah(calculations.hargaFinal)}
                  </div>
                </div>
              </div>

              {/* DASHBOARD GRID: 4 Metrik */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Harga Sebelum Pajak</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {formatRupiah(calculations.hargaBersihSebelumPajak)}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Pajak</span>
                  <span className="text-sm font-bold text-red-600 block mt-1">
                    {formatRupiah(calculations.nominalPajak)}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Laba</span>
                  <span className={`text-sm font-bold block mt-1 ${calculations.labaKotor < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatRupiah(calculations.labaKotor)}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Margin</span>
                  <span className="text-sm font-bold text-blue-600 block mt-1">
                    {calculations.marginPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* CARD BREAKDOWN */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">🧾</span>
                  <h4 className="font-bold text-gray-900 text-sm">Breakdown Harga</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Harga Modal</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(Number(basePrice.hargaModal) || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Harga Jual (Simulasi)</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(calculations.simHargaJual)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Diskon</span>
                    <span className="font-semibold text-rose-500">- {formatRupiah(calculations.nominalDiskon)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Biaya Tambahan</span>
                    <span className="font-semibold text-emerald-600">+ {formatRupiah(Number(basePrice.biayaTambahan) || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-900 font-bold">Sebelum Pajak</span>
                    <span className="font-bold text-gray-900">{formatRupiah(calculations.hargaBersihSebelumPajak)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 pt-1">
                    <span>Pajak</span>
                    <span>+ {formatRupiah(calculations.nominalPajak)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-900 bg-gray-50 rounded px-2 py-1 mt-2">
                    <span className="text-gray-900 font-black">Harga Final</span>
                    <span className="font-black text-blue-700">{formatRupiah(calculations.hargaFinal)}</span>
                  </div>
                </div>
              </div>

              {/* CARD MARGIN & ROI */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">📈</span>
                  <h4 className="font-bold text-gray-900 text-sm">Margin & Laba</h4>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Margin</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{calculations.marginPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Markup</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{calculations.markupPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">ROI Sederhana</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{calculations.roi.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                    <span className="text-gray-900 font-bold">Laba Bersih</span>
                    <span className={`font-black ${calculations.labaKotor < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatRupiah(calculations.labaKotor)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD STATUS & INSIGHT */}
              <div className={`border rounded-xl p-5 ${calculations.statusBg} transition-all`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3.5 h-3.5 rounded-full ${calculations.statusColor} animate-pulse inline-block`}></span>
                  <span className="font-black text-sm uppercase tracking-wide">
                    {calculations.statusLabel}
                  </span>
                </div>
                <div className="text-xs leading-relaxed font-medium space-y-1.5 mt-3">
                  {calculations.insightTexts.map((text, idx) => (
                    <p key={idx}>• {text}</p>
                  ))}
                </div>
              </div>

              {/* CARD SIMULASI 3 SKENARIO */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">⚖️</span>
                  <h4 className="font-bold text-gray-900 text-sm">Skenario Harga Jual</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* Skenario Pesimis */}
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-red-700 block uppercase mb-1">Pesimis (-20%)</span>
                    <span className="text-[10px] font-bold text-gray-900 block">
                      {formatRupiah(calculations.skenarioPesimis.hargaFinal)}
                    </span>
                    <div className="text-[8px] text-gray-600 mt-1 border-t border-red-200 pt-1 text-left">
                      <span className="block text-red-500 font-semibold">Pajak: {formatRupiah(calculations.skenarioPesimis.pajak)}</span>
                      <span className="block font-semibold mt-0.5">Laba: {formatRupiah(calculations.skenarioPesimis.laba)}</span>
                      <span className="block mt-0.5">Mrg: {calculations.skenarioPesimis.margin.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Skenario Normal */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-gray-700 block uppercase mb-1">Normal 0%</span>
                    <span className="text-[10px] font-bold text-gray-900 block">
                      {formatRupiah(calculations.skenarioNormal.hargaFinal)}
                    </span>
                    <div className="text-[8px] text-gray-600 mt-1 border-t border-gray-200 pt-1 text-left">
                      <span className="block text-red-500 font-semibold">Pajak: {formatRupiah(calculations.skenarioNormal.pajak)}</span>
                      <span className="block font-semibold mt-0.5">Laba: {formatRupiah(calculations.skenarioNormal.laba)}</span>
                      <span className="block mt-0.5">Mrg: {calculations.skenarioNormal.margin.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Skenario Optimis */}
                  <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-green-700 block uppercase mb-1">Optimis (+30%)</span>
                    <span className="text-[10px] font-bold text-gray-900 block">
                      {formatRupiah(calculations.skenarioOptimis.hargaFinal)}
                    </span>
                    <div className="text-[8px] text-gray-600 mt-1 border-t border-green-200 pt-1 text-left">
                      <span className="block text-red-500 font-semibold">Pajak: {formatRupiah(calculations.skenarioOptimis.pajak)}</span>
                      <span className="block font-semibold mt-0.5">Laba: {formatRupiah(calculations.skenarioOptimis.laba)}</span>
                      <span className="block mt-0.5">Mrg: {calculations.skenarioOptimis.margin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD BREAKDOWN VISUAL */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📊</span>
                  <h4 className="font-bold text-gray-900 text-sm">Proporsi Visual</h4>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex">
                  <div className="bg-sky-400 h-full transition-all" style={{ width: `${Math.max(2, calculations.pctModalVisual)}%` }} title="Modal"></div>
                  <div className="bg-indigo-400 h-full transition-all" style={{ width: `${Math.max(2, calculations.pctBiayaVisual)}%` }} title="Biaya Tambahan"></div>
                  <div className="bg-red-400 h-full transition-all" style={{ width: `${Math.max(2, calculations.pctPajakVisual)}%` }} title="Pajak"></div>
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.max(2, calculations.pctLabaVisual)}%` }} title="Laba"></div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase mt-3">
                  <span className="text-sky-500">● Modal</span>
                  <span className="text-indigo-500">● Biaya</span>
                  <span className="text-red-400">● Pajak</span>
                  <span className="text-emerald-500">● Laba</span>
                </div>
              </div>

              {/* CARD BUTTON: Salin Ringkasan */}
              <button
                onClick={handleCopySummary}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>📋</span> Salin Ringkasan
              </button>

            </div>

          </div>

        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-gray-200 mt-16 py-8 text-center text-xs text-gray-400">
        <p>© 2026 Platform Microtools UMKM Indonesia. All rights reserved.</p>
        <p className="mt-1">Dirancang khusus untuk membantu UMKM menghitung harga setelah pajak secara cepat, akurat, dan profesional.</p>
      </footer>

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border border-gray-800 max-w-sm">
          <span className="text-xl">✨</span>
          <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}