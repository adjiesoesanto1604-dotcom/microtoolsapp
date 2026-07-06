'use client';

import React, { useState, useMemo, useEffect } from 'react';

// ==========================================
// INTERFACES & TYPES
// ==========================================
interface InfoProduk {
  nama: string;
  kategori: string;
  sku: string;
  brand: string;
}

interface HargaState {
  awal: number | '';
  modal: number | '';
  stok: number | '';
}

interface DiskonState {
  persentase: number;
}

interface TargetPenjualan {
  unit: number | '';
  transaksi: number | '';
  hari: number | '';
}

interface SimulasiState {
  alasan: string;
  catatan: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface SkenarioDiskon {
  label: string;
  persentase: number;
  hargaAkhir: number;
  nominalDiskon: number;
  potensiOmzet: number;
}

// ==========================================
// COMPONENT MAIN
// ==========================================
export default function PersentaseTurunHargaPage() {
  // --- 1. State Management ---
  const [produk, setProduk] = useState<InfoProduk>({
    nama: 'Sepatu Lari Premium',
    kategori: 'Olahraga',
    sku: 'SLP-001',
    brand: 'Athletica',
  });

  const [harga, setHarga] = useState<HargaState>({
    awal: 500000,
    modal: 300000,
    stok: 150,
  });

  const [diskon, setDiskon] = useState<DiskonState>({
    persentase: 15,
  });

  const [target, setTarget] = useState<TargetPenjualan>({
    unit: 50,
    transaksi: 45,
    hari: 7,
  });

  const [simulasi, setSimulasi] = useState<SimulasiState>({
    alasan: 'Flash Sale',
    catatan: 'Promo spesial akhir bulan untuk menghabiskan stok.',
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- 2. Formatters ---
  const formatRupiah = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const formatPersen = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0%';
    return `${value.toFixed(1).replace('.', ',')}%`;
  };

  // --- 3. Toast Handler ---
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // --- 4. Realtime Calculations ---
  const kalkulasi = useMemo(() => {
    const awal = Number(harga.awal) || 0;
    const modal = Number(harga.modal) || 0;
    const stok = Number(harga.stok) || 0;
    const persentase = Number(diskon.persentase) || 0;
    const targetUnit = Number(target.unit) || 0;

    // Kalkulasi Harga & Diskon
    const nominalTurun = awal * (persentase / 100);
    const hargaBaru = Math.max(0, awal - nominalTurun);
    
    // Kalkulasi Margin
    const marginBaruRp = hargaBaru - modal;
    const marginBaruPersen = hargaBaru > 0 ? (marginBaruRp / hargaBaru) * 100 : 0;
    const marginAwalRp = awal - modal;

    // Kalkulasi Omzet & Keuntungan
    const potensiOmzet = hargaBaru * targetUnit;
    const estimasiKeuntungan = marginBaruRp * targetUnit;
    const totalDiskon = nominalTurun * targetUnit;
    const estimasiKerugianMargin = marginAwalRp > 0 ? (marginAwalRp - marginBaruRp) * targetUnit : 0; // Opportunity cost

    // Nilai Stok
    const nilaiStokAwal = awal * stok;
    const nilaiStokBaru = hargaBaru * stok;

    // Logika Status
    let statusLabel = 'Normal';
    let statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
    let barColor = 'bg-blue-500';

    if (persentase > 50) {
      statusLabel = 'Harga Sangat Rendah';
      statusColor = 'bg-red-100 text-red-800 border-red-200';
      barColor = 'bg-red-500';
    } else if (persentase >= 30) {
      statusLabel = 'Diskon Besar';
      statusColor = 'bg-orange-100 text-orange-800 border-orange-200';
      barColor = 'bg-orange-500';
    } else if (persentase >= 10) {
      statusLabel = 'Promo Menarik';
      statusColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
      barColor = 'bg-indigo-500';
    }

    // Insight Otomatis
    let insight = '';
    if (marginBaruRp < 0) {
      insight = 'Harga sangat rendah dan di bawah modal. Periksa kembali apakah strategi rugi ini disengaja untuk mengakuisisi pelanggan.';
    } else if (persentase > 30) {
      insight = 'Diskon cukup besar. Pastikan volume penjualan meningkat drastis untuk mengimbangi penurunan margin per unit.';
    } else if (persentase > 0) {
      insight = 'Penurunan harga masih dalam batas wajar. Cocok untuk promo reguler tanpa merusak nilai brand di mata pelanggan.';
    } else {
      insight = 'Harga normal tanpa diskon. Margin maksimal terjaga, namun daya tarik promosi mungkin kurang agresif.';
    }

    // Skenario Simulasi
    const buatSkenario = (label: string, persenSkenario: number): SkenarioDiskon => {
      const hAkhir = Math.max(0, awal * (1 - persenSkenario / 100));
      return {
        label,
        persentase: persenSkenario,
        hargaAkhir: hAkhir,
        nominalDiskon: awal - hAkhir,
        potensiOmzet: hAkhir * targetUnit,
      };
    };

    const skenario: SkenarioDiskon[] = [
      buatSkenario('Ringan (10%)', 10),
      buatSkenario('Sedang (25%)', 25),
      buatSkenario('Agresif (50%)', 50),
    ];

    // Rekomendasi Checklist
    const rekomendasi = [
      'Gunakan promo bundling produk',
      'Tambahkan batas waktu promo (Urgency)',
      'Naikkan exposure iklan digital',
    ];
    if (persentase > 20) rekomendasi.push('Hindari durasi diskon terlalu lama');
    if (targetUnit > stok) rekomendasi.push('⚠️ Pastikan stok cukup (Stok < Target)');
    if (marginBaruRp < 0) rekomendasi.push('⚠️ Evaluasi ulang! Penjualan merugi per unit');

    return {
      awal,
      modal,
      stok,
      targetUnit,
      persentase,
      nominalTurun,
      hargaBaru,
      marginBaruRp,
      marginBaruPersen,
      potensiOmzet,
      estimasiKeuntungan,
      totalDiskon,
      estimasiKerugianMargin,
      nilaiStokAwal,
      nilaiStokBaru,
      statusLabel,
      statusColor,
      barColor,
      insight,
      skenario,
      rekomendasi,
    };
  }, [harga, diskon, target]);

  // --- 5. Interactive Handlers ---
  const handleReset = () => {
    setProduk({ nama: '', kategori: '', sku: '', brand: '' });
    setHarga({ awal: '', modal: '', stok: '' });
    setDiskon({ persentase: 0 });
    setTarget({ unit: '', transaksi: '', hari: '' });
    setSimulasi({ alasan: 'Promo', catatan: '' });
    addToast('Seluruh data berhasil di-reset.', 'info');
  };

  const handleSalinRingkasan = () => {
    const text = `--- RINGKASAN PENURUNAN HARGA ---
Produk: ${produk.nama || '-'}
Harga Awal: ${formatRupiah(kalkulasi.awal)}
Diskon: ${formatPersen(kalkulasi.persentase)} (${formatRupiah(kalkulasi.nominalTurun)})
Harga Akhir: ${formatRupiah(kalkulasi.hargaBaru)}

Potensi Omzet: ${formatRupiah(kalkulasi.potensiOmzet)} (Target: ${formatNumber(kalkulasi.targetUnit)} unit)
Estimasi Profit: ${formatRupiah(kalkulasi.estimasiKeuntungan)}
Margin Baru: ${formatPersen(kalkulasi.marginBaruPersen)}
Status: ${kalkulasi.statusLabel}

Insight:
${kalkulasi.insight}
-----------------------------------`;

    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      addToast('Ringkasan berhasil disalin.', 'success');
    } catch (err) {
      addToast('Gagal menyalin teks.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center justify-between gap-3 transition-all animate-fade-in ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl bg-blue-50 p-2 rounded-xl border border-blue-100" role="img" aria-label="icon">
              📉
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl text-slate-900 tracking-tight">Kalkulator Persentase Turun Harga</h1>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200 hidden sm:inline-block">
                  Professional Tool
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                Hitung harga setelah diskon atau penurunan harga secara otomatis beserta dampaknya terhadap omzet dan margin.
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Powered by</span>
            <span className="text-sm font-bold text-blue-600 block">Microtools UMKM</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI (Input Area) - 60% -> col-span-7 */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card 1: Informasi Produk */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-blue-500">1.</span> Informasi Produk
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Produk</label>
                  <input
                    type="text"
                    value={produk.nama}
                    onChange={(e) => setProduk({ ...produk, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white"
                    placeholder="Contoh: Sepatu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={produk.kategori}
                    onChange={(e) => setProduk({ ...produk, kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white"
                    placeholder="Contoh: Fashion"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">SKU</label>
                  <input
                    type="text"
                    value={produk.sku}
                    onChange={(e) => setProduk({ ...produk, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white"
                    placeholder="Kode barang"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Brand</label>
                  <input
                    type="text"
                    value={produk.brand}
                    onChange={(e) => setProduk({ ...produk, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white"
                    placeholder="Merk produk"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Harga Awal */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-blue-500">2.</span> Data Harga & Stok
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={harga.awal}
                    onChange={(e) => setHarga({ ...harga, awal: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={harga.modal}
                    onChange={(e) => setHarga({ ...harga, modal: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={harga.stok}
                    onChange={(e) => setHarga({ ...harga, stok: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Penurunan Harga (Slider) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-blue-500">3.</span> Persentase Penurunan
                </h2>
                <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  {kalkulasi.persentase}%
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Input Persentase (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={diskon.persentase === 0 ? '' : diskon.persentase}
                    onChange={(e) => setDiskon({ persentase: Math.min(100, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-semibold"
                    placeholder="0"
                  />
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={Math.min(80, kalkulasi.persentase)}
                    onChange={(e) => setDiskon({ persentase: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
                    <span>0% (Tetap)</span>
                    <span>40%</span>
                    <span>80% (Maks Simulasi)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Target Penjualan */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-blue-500">4.</span> Target & Estimasi Promo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Unit Terjual</label>
                  <input
                    type="number"
                    min="0"
                    value={target.unit}
                    onChange={(e) => setTarget({ ...target, unit: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Est. Transaksi</label>
                  <input
                    type="number"
                    min="0"
                    value={target.transaksi}
                    onChange={(e) => setTarget({ ...target, transaksi: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hari Promosi</label>
                  <input
                    type="number"
                    min="0"
                    value={target.hari}
                    onChange={(e) => setTarget({ ...target, hari: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Card 5: Simulasi Text/Select */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-blue-500">5.</span> Catatan Strategi
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Alasan Penurunan Harga</label>
                  <select
                    value={simulasi.alasan}
                    onChange={(e) => setSimulasi({ ...simulasi, alasan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="Promo">Promo</option>
                    <option value="Clearance">Clearance</option>
                    <option value="Flash Sale">Flash Sale</option>
                    <option value="Diskon Musiman">Diskon Musiman</option>
                    <option value="Cuci Gudang">Cuci Gudang</option>
                    <option value="Kompetitor">Kompetitor</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Promosi</label>
                  <textarea
                    rows={3}
                    value={simulasi.catatan}
                    onChange={(e) => setSimulasi({ ...simulasi, catatan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="Tulis alasan atau strategi dibalik promo ini..."
                  />
                </div>
              </div>
            </div>

            {/* Button Reset */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="bg-white border border-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm"
              >
                Reset Seluruh Input
              </button>
            </div>

          </div>

          {/* KOLOM KANAN (Sticky Dashboard) - 40% -> col-span-5 */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 pb-8">
            
            {/* Card Utama: Harga Setelah Turun */}
            <div className="bg-blue-600 text-white rounded-xl shadow-md p-6 border border-blue-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl transform translate-x-4 -translate-y-4 font-black">
                %
              </div>
              <h3 className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Harga Setelah Turun</h3>
              <div className="text-3xl font-extrabold tracking-tight mb-4 drop-shadow-sm">
                {formatRupiah(kalkulasi.hargaBaru)}
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-700/50 rounded-lg p-3 border border-blue-500/30">
                  <span className="block text-[10px] text-blue-200 uppercase font-semibold">Total Diskon Diberikan</span>
                  <span className="block text-sm font-bold text-white mt-0.5">{formatRupiah(kalkulasi.totalDiskon)}</span>
                </div>
                <div className="bg-blue-700/50 rounded-lg p-3 border border-blue-500/30">
                  <span className="block text-[10px] text-blue-200 uppercase font-semibold">Margin Baru / Unit</span>
                  <span className={`block text-sm font-bold mt-0.5 ${kalkulasi.marginBaruRp < 0 ? 'text-red-300' : 'text-white'}`}>
                    {formatRupiah(kalkulasi.marginBaruRp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Analisis Harga & Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Analisis & Status</h3>
              
              {/* Progress Visual 0-80% */}
              <div className="mb-5">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                  <span>0%</span>
                  <span>{kalkulasi.persentase}% Penurunan</span>
                  <span>80%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${kalkulasi.barColor}`} 
                    style={{ width: `${Math.min(100, (kalkulasi.persentase / 80) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-2 rounded-lg border ${kalkulasi.statusColor} flex items-center justify-between mb-4`}>
                <span className="text-xs font-bold uppercase">Status</span>
                <span className="text-sm font-extrabold">{kalkulasi.statusLabel}</span>
              </div>

              {/* Insight Text */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium flex items-start gap-2">
                <span>💡</span>
                <span>{kalkulasi.insight}</span>
              </div>
            </div>

            {/* Card: Visual Perbandingan Harga */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Struktur Nilai Harga</h3>
              
              <div className="w-full h-8 bg-slate-100 rounded-lg overflow-hidden flex relative border border-slate-200">
                {/* Bagian Harga Akhir */}
                <div 
                  className="h-full bg-blue-500 flex items-center justify-center transition-all"
                  style={{ width: `${kalkulasi.awal > 0 ? (kalkulasi.hargaBaru / kalkulasi.awal) * 100 : 100}%` }}
                >
                  {kalkulasi.hargaBaru > 0 && <span className="text-[10px] font-bold text-white px-1 overflow-hidden truncate">Harga Akhir</span>}
                </div>
                {/* Bagian Nominal Turun */}
                <div 
                  className="h-full bg-red-400 flex items-center justify-center transition-all opacity-80"
                  style={{ width: `${kalkulasi.awal > 0 ? (kalkulasi.nominalTurun / kalkulasi.awal) * 100 : 0}%` }}
                >
                  {kalkulasi.nominalTurun > 0 && <span className="text-[10px] font-bold text-white px-1 overflow-hidden truncate">Diskon</span>}
                </div>
              </div>
              
              <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2">
                <span>Total: {formatRupiah(kalkulasi.awal)}</span>
                <span className="text-red-500">Turun: {formatRupiah(kalkulasi.nominalTurun)}</span>
              </div>
            </div>

            {/* Card: 3 Skenario Simulasi */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Simulasi Alternatif Diskon</h3>
              <div className="space-y-3">
                {kalkulasi.skenario.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">-{formatRupiah(item.nominalDiskon)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Harga Akhir</span>
                        <span className="font-bold text-slate-800">{formatRupiah(item.hargaAkhir)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Potensi Omzet</span>
                        <span className="font-bold text-blue-600">{formatRupiah(item.potensiOmzet)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Rekomendasi / Checklist */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Checklist Promosi</h3>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                {kalkulasi.rekomendasi.map((rek, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {rek.startsWith('⚠️') ? (
                      <span className="text-red-500 shrink-0">⚠️</span>
                    ) : (
                      <span className="text-green-500 shrink-0">✔</span>
                    )}
                    <span className={rek.startsWith('⚠️') ? 'text-red-600 font-bold' : ''}>{rek.replace('⚠️ ', '')}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Button Copy */}
            <button
              onClick={handleSalinRingkasan}
              className="w-full bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-slate-800 transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
            >
              <span>📋</span> Salin Ringkasan
            </button>

          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-800 mb-2">
            © 2026 Platform Microtools UMKM Indonesia
          </p>
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            Dirancang khusus untuk membantu UMKM mengambil keputusan harga secara cepat, akurat, dan berbasis simulasi finansial.
          </p>
        </div>
      </footer>
    </div>
  );
}