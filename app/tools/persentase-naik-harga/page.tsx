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

interface PriceState {
  hargaModal: number;
  hargaLama: number;
}

type ModeKenaikan = 'persentase' | 'nominal';

interface KenaikanState {
  mode: ModeKenaikan;
  persentase: number; // nilai 0-100+
  nominal: number;
}

interface TargetState {
  margin: number; // dalam persen 0-100
  laba: number; // nominal Rp
}

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info';
}

// ==========================================
// COMPONENT MAIN
// ==========================================

export default function PersentaseNaikHargaPage() {
  // --- 1. State Management ---
  const [product, setProduct] = useState<ProductInfo>({
    nama: 'Kopi Susu Gula Aren',
    kategori: 'Minuman',
    jenisUsaha: 'Kuliner (F&B)',
  });

  const [prices, setPrices] = useState<PriceState>({
    hargaModal: 8000,
    hargaLama: 15000,
  });

  const [kenaikan, setKenaikan] = useState<KenaikanState>({
    mode: 'persentase',
    persentase: 15, // Default naik 15%
    nominal: 2000,
  });

  const [target, setTarget] = useState<TargetState>({
    margin: 50,
    laba: 10000,
  });

  // Slider Simulasi Tambahan (dalam Persen, Rentang -10% s.d +50%)
  const [sliderSimulasi, setSliderSimulasi] = useState<number>(0);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- 2. Helper Functions ---
  const formatRupiah = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPersen = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const addToast = (text: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  // Toast Auto-dismiss (3 detik)
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // --- 3. Realtime Calculations (useMemo) ---
  const kalkulasi = useMemo(() => {
    const modal = Math.max(0, prices.hargaModal);
    const lama = Math.max(0, prices.hargaLama);
    
    // Hitung Kenaikan Dasar berdasarkan Mode
    let nominalKenaikanDasar = 0;
    let persentaseKenaikanDasar = 0;

    if (kenaikan.mode === 'persentase') {
      persentaseKenaikanDasar = Math.max(-100, kenaikan.persentase);
      nominalKenaikanDasar = lama * (persentaseKenaikanDasar / 100);
    } else {
      nominalKenaikanDasar = Math.max(0, kenaikan.nominal);
      persentaseKenaikanDasar = lama > 0 ? (nominalKenaikanDasar / lama) * 100 : 0;
    }

    // Kombinasikan dengan Slider Simulasi (Mempengaruhi secara multiplikatif/aditif pada harga baru)
    // Slider merentang dari -10% hingga +50% dari harga dasar baru yang sudah dihitung
    const hargaDasarBaru = lama + nominalKenaikanDasar;
    const penyesuaianSliderNominal = hargaDasarBaru * (sliderSimulasi / 100);
    
    const hargaBaru = Math.max(0, hargaDasarBaru + penyesuaianSliderNominal);
    const nominalKenaikanTotal = Math.max(0, hargaBaru - lama);
    const persentaseKenaikanTotal = lama > 0 ? (nominalKenaikanTotal / lama) * 100 : 0;

    // Selisih Harga
    const selisihHarga = hargaBaru - lama;

    // Laba & Margin Lama
    const labaLama = Math.max(0, lama - modal);
    const marginLama = lama > 0 ? (labaLama / lama) * 100 : 0;

    // Laba & Margin Baru
    const labaBaru = Math.max(0, hargaBaru - modal);
    const marginBaru = hargaBaru > 0 ? (labaBaru / hargaBaru) * 100 : 0;

    // Selisih Laba
    const selisihLaba = labaBaru - labaLama;

    // Markup (Laba dibanding Modal)
    const markupLama = modal > 0 ? (labaLama / modal) * 100 : 0;
    const markupBaru = modal > 0 ? (labaBaru / modal) * 100 : 0;

    // ROI Sederhana (Return on Investment dari perspektif harga modal pokok)
    const roiSederhana = modal > 0 ? (labaBaru / modal) * 100 : 0;

    // Status Logika Evaluasi Kenaikan
    let statusLabel = '🟢 Kenaikan Ideal';
    let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let statusDot = 'bg-emerald-500';

    if (persentaseKenaikanTotal === 0) {
      statusLabel = '⚪ Tidak Ada Kenaikan';
      statusColor = 'bg-slate-50 text-slate-700 border-slate-200';
      statusDot = 'bg-slate-400';
    } else if (marginBaru < 15) {
      statusLabel = '🔴 Berpotensi Menurunkan Penjualan / Margin Tipis';
      statusColor = 'bg-red-50 text-red-700 border-red-200';
      statusDot = 'bg-red-500';
    } else if (persentaseKenaikanTotal > 30) {
      statusLabel = '🟠 Kenaikan Cukup Tinggi';
      statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
      statusDot = 'bg-amber-500';
    } else if (marginBaru >= 40) {
      statusLabel = '🟢 Margin Sangat Baik';
      statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      statusDot = 'bg-emerald-600';
    } else if (marginBaru >= 25 && marginBaru < 40) {
      statusLabel = '🟢 Margin Aman';
      statusColor = 'bg-teal-50 text-teal-700 border-teal-200';
      statusDot = 'bg-teal-500';
    }

    // Dynamic Business Insights
    const insights: string[] = [];
    if (persentaseKenaikanTotal > 0 && persentaseKenaikanTotal <= 10) {
      insights.push('Kenaikan harga masih sangat kompetitif dan kemungkinan besar dapat langsung diterima oleh pelanggan setia tanpa penolakan berarti.');
      insights.push('Harga masih aman terhadap fluktuasi pasar normal.');
    } else if (persentaseKenaikanTotal > 10 && persentaseKenaikanTotal <= 25) {
      insights.push('Kenaikan harga berada dalam batas wajar industri UMKM. Lakukan sosialisasi berkala atau berikan benefit tambahan kecil (seperti kemasan baru) untuk meredam komplain.');
      insights.push('Margin meningkat secara sehat.');
    } else if (persentaseKenaikanTotal > 25) {
      insights.push('Peringatan: Kenaikan terlalu tinggi dalam satu waktu! Berpotensi menurunkan volume penjualan secara signifikan jika kompetitor menahan harga.');
      insights.push('Disarankan untuk menaikkan harga secara bertahap (misal 10% sekarang, dan sisanya 3 bulan kemudian).');
    }

    if (marginBaru > marginLama) {
      insights.push(`Tambahan laba per unit cukup signifikan sebesar ${formatRupiah(selisihLaba)}. Ini akan mempercepat titik impas (BEP) operasional Anda.`);
    } else if (marginBaru < marginLama) {
      insights.push('Perhatian: Walaupun harga naik, margin keuntungan Anda justru menurun karena harga pokok modal yang terlalu tinggi atau salah perhitungan.');
    }

    if (marginBaru >= target.margin) {
      insights.push(`Selamat! Target margin keuntungan Anda (${target.margin}%) telah terlampaui dengan margin baru mencapai ${formatPersen(marginBaru)}.`);
    } else {
      insights.push(`Margin saat ini (${formatPersen(marginBaru)}) belum mencapai target margin ideal Anda yaitu ${target.margin}%.`);
    }

    // Skenario Simulasi Penjualan (Pesimis, Normal, Optimis)
    const skenario = {
      pesimis: {
        harga: hargaBaru * 0.95, // Koreksi karena promo atau diskon penyesuaian
        laba: Math.max(0, (hargaBaru * 0.95) - modal),
        margin: (hargaBaru * 0.95) > 0 ? ((Math.max(0, (hargaBaru * 0.95) - modal)) / (hargaBaru * 0.95)) * 100 : 0,
        persentaseNaik: lama > 0 ? (((hargaBaru * 0.95) - lama) / lama) * 100 : 0,
      },
      normal: {
        harga: hargaBaru,
        laba: labaBaru,
        margin: marginBaru,
        persentaseNaik: persentaseKenaikanTotal,
      },
      optimis: {
        harga: hargaBaru * 1.05, // Bisa bundling atau up-selling
        laba: Math.max(0, (hargaBaru * 1.05) - modal),
        margin: (hargaBaru * 1.05) > 0 ? ((Math.max(0, (hargaBaru * 1.05) - modal)) / (hargaBaru * 1.05)) * 100 : 0,
        persentaseNaik: lama > 0 ? (((hargaBaru * 1.05) - lama) / lama) * 100 : 0,
      }
    };

    return {
      modal,
      lama,
      hargaBaru,
      nominalKenaikanTotal,
      persentaseKenaikanTotal,
      selisihHarga,
      labaLama,
      labaBaru,
      selisihLaba,
      marginLama,
      marginBaru,
      markupLama,
      markupBaru,
      roiSederhana,
      statusLabel,
      statusColor,
      statusDot,
      insights,
      skenario
    };
  }, [prices, kenaikan, sliderSimulasi, target]);

  // --- 4. Interactive Handlers ---
  const handleReset = () => {
    setProduct({
      nama: 'Kopi Susu Gula Aren',
      kategori: 'Minuman',
      jenisUsaha: 'Kuliner (F&B)',
    });
    setPrices({
      hargaModal: 8000,
      hargaLama: 15000,
    });
    setKenaikan({
      mode: 'persentase',
      persentase: 15,
      nominal: 2000,
    });
    setTarget({
      margin: 50,
      laba: 10000,
    });
    setSliderSimulasi(0);
    addToast('Semua input berhasil di-reset ke nilai bawaan!', 'info');
  };

  const handleSalinRingkasan = () => {
    const textRingkasan = `--- RINGKASAN KENAIKAN HARGA (MICROTOOLS UMKM) ---
Nama Produk   : ${product.nama} (${product.kategori} - ${product.jenisUsaha})
Harga Modal   : ${formatRupiah(kalkulasi.modal)}
Harga Lama    : ${formatRupiah(kalkulasi.lama)}
Harga Baru    : ${formatRupiah(kalkulasi.hargaBaru)}
Kenaikan      : +${formatPersen(kalkulasi.persentaseKenaikanTotal)} (${formatRupiah(kalkulasi.nominalKenaikanTotal)})
Margin Baru   : ${formatPersen(kalkulasi.marginBaru)} (Lama: ${formatPersen(kalkulasi.marginLama)})
Laba Baru     : ${formatRupiah(kalkulasi.labaBaru)} /unit
Status        : ${kalkulasi.statusLabel}

Insight Utama :
${kalkulasi.insights.map((ins, idx) => `${idx + 1}. ${ins}`).join('\n')}
--------------------------------------------------`;

    // Metode fallback copy to clipboard aman untuk iframe
    try {
      const el = document.createElement('textarea');
      el.value = textRingkasan;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      addToast('Ringkasan berhasil disalin ke clipboard!', 'success');
    } catch (err) {
      addToast('Gagal menyalin teks otomatis.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center justify-between gap-3 transition-all transform translate-y-0 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <span>{toast.text}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* HEADER STICKY */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label="chart">📈</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-950 tracking-tight">Kalkulator Persentase Naik Harga</h1>
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100 hidden sm:inline-block">
                  Professional Tool
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Hitung kenaikan harga berdasarkan persentase maupun nominal serta lihat dampaknya terhadap laba dan margin.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Powered by</span>
            <span className="text-xs font-bold text-blue-600">Microtools UMKM</span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI (65%) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: INFORMASI PRODUK */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">📦</span>
                <h2 className="font-bold text-slate-900 text-base">Informasi Produk / Layanan</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Produk</label>
                  <input
                    type="text"
                    value={product.nama}
                    onChange={(e) => setProduct({ ...product, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    placeholder="Nama barang / jasa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                  <input
                    type="text"
                    value={product.kategori}
                    onChange={(e) => setProduct({ ...product, kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    placeholder="Kategori produk"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Jenis Usaha</label>
                  <input
                    type="text"
                    value={product.jenisUsaha}
                    onChange={(e) => setProduct({ ...product, jenisUsaha: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    placeholder="Jenis usaha"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: HARGA SAAT INI */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0">
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  Harga Aktif
                </span>
              </div>
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">💰</span>
                <h2 className="font-bold text-slate-900 text-base">Harga Saat Ini</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Harga Modal / Pokok (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-medium">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={prices.hargaModal || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setPrices({ ...prices, hargaModal: val });
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-800"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cost of Goods Sold (COGS) atau biaya produksi.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Harga Jual Lama (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-medium">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={prices.hargaLama || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setPrices({ ...prices, hargaLama: val });
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-800"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Harga yang dibebankan ke pembeli saat ini.</p>
                </div>
              </div>
            </div>

            {/* CARD 3: PENGATURAN KENAIKAN HARGA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">⚙️</span>
                  <h2 className="font-bold text-slate-900 text-base">Metode Kenaikan Harga</h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setKenaikan({ ...kenaikan, mode: 'persentase' })}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      kenaikan.mode === 'persentase'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Berdasarkan Persentase (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKenaikan({ ...kenaikan, mode: 'nominal' })}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      kenaikan.mode === 'nominal'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Berdasarkan Nominal (Rp)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OPSI 1: PERSENTASE */}
                <div className={`p-4 rounded-xl border transition-all ${
                  kenaikan.mode === 'persentase'
                    ? 'border-blue-200 bg-blue-50/25'
                    : 'border-slate-150 bg-slate-50 opacity-60'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="radio"
                      id="radio-persen"
                      name="mode-kenaikan"
                      checked={kenaikan.mode === 'persentase'}
                      onChange={() => setKenaikan({ ...kenaikan, mode: 'persentase' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="radio-persen" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Input Persentase Kenaikan (%)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      disabled={kenaikan.mode !== 'persentase'}
                      value={kenaikan.persentase || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setKenaikan({ ...kenaikan, persentase: val });
                      }}
                      className="w-full pr-8 pl-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-sm text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Contoh: Mengisi 10 akan menaikkan harga lama sebesar 10%.
                  </p>
                </div>

                {/* OPSI 2: NOMINAL */}
                <div className={`p-4 rounded-xl border transition-all ${
                  kenaikan.mode === 'nominal'
                    ? 'border-blue-200 bg-blue-50/25'
                    : 'border-slate-150 bg-slate-50 opacity-60'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="radio"
                      id="radio-nominal"
                      name="mode-kenaikan"
                      checked={kenaikan.mode === 'nominal'}
                      onChange={() => setKenaikan({ ...kenaikan, mode: 'nominal' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="radio-nominal" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Input Nominal Kenaikan (Rp)
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-slate-400 font-medium">Rp</span>
                    <input
                      type="number"
                      disabled={kenaikan.mode !== 'nominal'}
                      value={kenaikan.nominal || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setKenaikan({ ...kenaikan, nominal: val });
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Contoh: Mengisi 5.000 akan menambah harga jual lama langsung sebesar Rp 5.000.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 4: TARGET BISNIS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">🎯</span>
                <h2 className="font-bold text-slate-900 text-base">Target Bisnis & Batasan Ideal</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Margin Keuntungan (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={target.margin || ''}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        setTarget({ ...target, margin: val });
                      }}
                      className="w-full pr-8 pl-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      placeholder="50"
                    />
                    <span className="absolute right-3 top-2 text-sm text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Digunakan untuk memberi notifikasi pencapaian efisiensi margin.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Nominal Laba Per Unit (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-medium">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={target.laba || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setTarget({ ...target, laba: val });
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      placeholder="10.000"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Keuntungan minimum yang ditargetkan dari setiap satu barang.</p>
                </div>
              </div>
            </div>

            {/* CARD 5: SIMULASI REALTIME SLIDER */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">🎚️</span>
                  <h2 className="font-bold text-slate-900 text-base">Eksperimen Penyesuaian Dinamis</h2>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  sliderSimulasi > 0 ? 'bg-amber-100 text-amber-800' : sliderSimulasi < 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {sliderSimulasi >= 0 ? `+${sliderSimulasi}` : sliderSimulasi}% Penyesuaian
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Geser slider di bawah untuk melakukan simulasi diskon (<span className="text-red-500 font-medium">-10%</span>) atau simulasi markup tinggi tambahan hingga (<span className="text-emerald-500 font-medium">+50%</span>) secara langsung.
              </p>
              <div className="space-y-4">
                <input
                  type="range"
                  min="-10"
                  max="50"
                  value={sliderSimulasi}
                  onChange={(e) => setSliderSimulasi(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>-10% (Pesimis / Diskon)</span>
                  <span>0% (Sesuai Input)</span>
                  <span>+50% (Optimis / Markup Tinggi)</span>
                </div>
              </div>
            </div>

            {/* CARD 6: BUTTON RESET */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all duration-150 flex items-center gap-2"
              >
                🔄 Reset Semua Input Kalkulator
              </button>
            </div>

          </div>

          {/* KOLOM KANAN STICKY (35%) */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
            
            {/* STICKY MAIN DASHBOARD */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg border border-blue-700">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100 bg-blue-700 px-3 py-1 rounded-full">
                  Harga Jual Rekomendasi
                </span>
                <span className="text-xs text-blue-200">Realtime</span>
              </div>
              <p className="text-xs text-blue-100 mb-1">{product.nama || 'Produk Tanpa Nama'}</p>
              <div className="text-3xl font-extrabold tracking-tight mb-2">
                {formatRupiah(kalkulasi.hargaBaru)}
              </div>
              <div className="text-xs text-blue-100 flex items-center gap-2">
                <span className="bg-blue-800 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                  +{formatPersen(kalkulasi.persentaseKenaikanTotal)}
                </span>
                <span>Naik {formatRupiah(kalkulasi.nominalKenaikanTotal)} dari harga lama</span>
              </div>
            </div>

            {/* DASHBOARD GRID (4 KARTU KECIL) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Harga Lama</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">{formatRupiah(kalkulasi.lama)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Harga Baru</span>
                <span className="text-sm font-bold text-blue-600 block mt-1">{formatRupiah(kalkulasi.hargaBaru)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Nominal Naik</span>
                <span className="text-sm font-bold text-slate-800 block mt-1">+{formatRupiah(kalkulasi.nominalKenaikanTotal)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Persentase Naik</span>
                <span className="text-sm font-bold text-emerald-600 block mt-1">+{formatPersen(kalkulasi.persentaseKenaikanTotal)}</span>
              </div>
            </div>

            {/* CARD STATUS LOGIKA */}
            <div className={`p-4 rounded-xl border ${kalkulasi.statusColor} shadow-sm`}>
              <span className="text-[10px] font-bold uppercase block tracking-wider mb-2">Status Evaluasi Harga</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${kalkulasi.statusDot} shrink-0`}></span>
                <span className="text-sm font-bold">{kalkulasi.statusLabel}</span>
              </div>
            </div>

            {/* PROGRESS BAR VISUAL PROPORSIONAL */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Struktur Komposisi Harga Baru</h3>
              <div className="space-y-3">
                {/* Visual Progress Bar */}
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  {/* Proporsi Modal */}
                  <div 
                    style={{ width: `${Math.min(100, kalkulasi.hargaBaru > 0 ? (kalkulasi.modal / kalkulasi.hargaBaru) * 100 : 0)}%` }}
                    className="h-full bg-slate-400"
                    title="Modal Pokok"
                  ></div>
                  {/* Proporsi Laba Lama */}
                  <div 
                    style={{ width: `${Math.min(100, kalkulasi.hargaBaru > 0 ? (kalkulasi.labaLama / kalkulasi.hargaBaru) * 100 : 0)}%` }}
                    className="h-full bg-blue-400"
                    title="Laba Lama"
                  ></div>
                  {/* Proporsi Tambahan Laba */}
                  <div 
                    style={{ width: `${Math.min(100, kalkulasi.hargaBaru > 0 ? (kalkulasi.selisihLaba / kalkulasi.hargaBaru) * 100 : 0)}%` }}
                    className="h-full bg-emerald-500 animate-pulse"
                    title="Tambahan Laba Baru"
                  ></div>
                </div>
                
                {/* Legenda Indikator */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 bg-slate-400 rounded-sm"></span>
                    <span>Modal: {formatPersen(kalkulasi.hargaBaru > 0 ? (kalkulasi.modal / kalkulasi.hargaBaru) * 100 : 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-sm"></span>
                    <span>Laba Lm: {formatPersen(kalkulasi.hargaBaru > 0 ? (kalkulasi.labaLama / kalkulasi.hargaBaru) * 100 : 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-sm"></span>
                    <span>Tambahan: {formatPersen(kalkulasi.hargaBaru > 0 ? (Math.max(0, kalkulasi.selisihLaba) / kalkulasi.hargaBaru) * 100 : 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BREAKDOWN RINCIAN HARGA */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 border-b border-slate-100 pb-2">Rincian Perubahan Nilai</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Modal Pokok</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(kalkulasi.modal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Jual Lama</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(kalkulasi.lama)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Kenaikan</span>
                  <span className="font-semibold text-slate-800">+{formatRupiah(kalkulasi.nominalKenaikanTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Persentase Naik</span>
                  <span className="font-semibold text-emerald-600">+{formatPersen(kalkulasi.persentaseKenaikanTotal)}</span>
                </div>
                <div className="border-t border-slate-100 my-1 pt-1 flex justify-between font-bold text-sm">
                  <span className="text-slate-900">Harga Baru Direkomendasikan</span>
                  <span className="text-blue-600">{formatRupiah(kalkulasi.hargaBaru)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Selisih Harga Pokok Jual</span>
                  <span>+{formatRupiah(kalkulasi.selisihHarga)}</span>
                </div>
              </div>
            </div>

            {/* ANALISIS MARGIN DETAIL */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 border-b border-slate-100 pb-2">Perbandingan Margin & Laba</h3>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">LABA LAMA / UNIT</span>
                    <span className="font-bold text-slate-700">{formatRupiah(kalkulasi.labaLama)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">LABA BARU / UNIT</span>
                    <span className="font-bold text-emerald-600">{formatRupiah(kalkulasi.labaBaru)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MARGIN LAMA</span>
                    <span className="font-bold text-slate-700">{formatPersen(kalkulasi.marginLama)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MARGIN BARU</span>
                    <span className="font-bold text-blue-600">{formatPersen(kalkulasi.marginBaru)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2 border-t border-slate-100 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MARKUP BARU</span>
                    <span className="font-bold text-slate-700">{formatPersen(kalkulasi.markupBaru)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ROI SEDERHANA</span>
                    <span className="font-bold text-slate-700">{formatPersen(kalkulasi.roiSederhana)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 SKENARIO SIMULASI PENJUALAN */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 border-b border-slate-100 pb-2">Skenario Estimasi Penjualan</h3>
              <div className="space-y-3">
                
                {/* Skenario Pesimis */}
                <div className="p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-red-700">🔴 SKENARIO PESIMIS (-5% diskon paksa)</span>
                    <span className="text-[10px] text-red-500 font-semibold">{formatPersen(kalkulasi.skenario.pesimis.persentaseNaik)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 font-medium">
                    <div>Harga: <span className="font-bold text-slate-800">{formatRupiah(kalkulasi.skenario.pesimis.harga)}</span></div>
                    <div>Laba: <span className="font-bold text-slate-800">{formatRupiah(kalkulasi.skenario.pesimis.laba)}</span></div>
                    <div>Margin: <span className="font-bold text-slate-800">{formatPersen(kalkulasi.skenario.pesimis.margin)}</span></div>
                  </div>
                </div>

                {/* Skenario Normal */}
                <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-blue-700">🔵 SKENARIO NORMAL (Sesuai Kalkulator)</span>
                    <span className="text-[10px] text-blue-500 font-semibold">{formatPersen(kalkulasi.skenario.normal.persentaseNaik)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 font-medium">
                    <div>Harga: <span className="font-bold text-slate-800">{formatRupiah(kalkulasi.skenario.normal.harga)}</span></div>
                    <div>Laba: <span className="font-bold text-slate-800">{formatRupiah(kalkulasi.skenario.normal.laba)}</span></div>
                    <div>Margin: <span className="font-bold text-slate-800">{formatPersen(kalkulasi.skenario.normal.margin)}</span></div>
                  </div>
                </div>

                {/* Skenario Optimis */}
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-emerald-700">🟢 SKENARIO OPTIMIS (+5% bundling/service)</span>
                    <span className="text-[10px] text-emerald-500 font-semibold">{formatPersen(kalkulasi.skenario.optimis.persentaseNaik)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 font-medium">
                    <div>Harga: <span className="font-bold text-slate-800">{formatRupiah(kalkulasi.skenario.optimis.harga)}</span></div>
                    <div>Laba: <span className="font-bold text-slate-800">{formatRupiah(kalkulasi.skenario.optimis.laba)}</span></div>
                    <div>Margin: <span className="font-bold text-slate-800">{formatPersen(kalkulasi.skenario.optimis.margin)}</span></div>
                  </div>
                </div>

              </div>
            </div>

            {/* AUTOMATIC INSIGHT CARDS */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-2 border-b border-slate-100 pb-2">💡 Insight Bisnis Pintar</h3>
              <div className="space-y-2">
                {kalkulasi.insights.length > 0 ? (
                  kalkulasi.insights.map((insight, index) => (
                    <div key={index} className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                      <span className="text-blue-500">✨</span>
                      <span>{insight}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Silakan masukkan kombinasi harga modal dan kenaikan di kolom kiri untuk mendapatkan insight taktis.</p>
                )}
              </div>
            </div>

            {/* BUTTON ACTION SALIN */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSalinRingkasan}
                className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-850 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                📋 Salin Ringkasan Strategi
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            © 2026 Platform Microtools UMKM Indonesia.
          </p>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Dirancang khusus untuk membantu UMKM menentukan strategi kenaikan harga secara profesional, cepat, dan akurat agar bisnis tetap tumbuh dan sehat secara finansial.
          </p>
        </div>
      </footer>
    </div>
  );
}