'use client';
import React, { useState, useMemo, useEffect } from 'react';

// ==========================================
// INTERFACES & TYPES
// ==========================================
interface BusinessInfo {
  nama: string;
  jenis: string;
  kategori: string;
}

interface SalesMetrics {
  hargaJual: string;
  produkTerjual: string;
  jumlahTransaksi: string;
  rataRataItem: string;
}

interface OperationalMetrics {
  hariOperasional: string;
  jamOperasional: string;
}

interface TargetMetrics {
  targetOmzet: string;
  targetPertumbuhan: string;
}

interface CurrentStateMetrics {
  omzetBulanLalu: string;
  omzetBulanIni: string;
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function OmzetBulananPage() {
  // --- STATE ---
  // Card 1: Informasi Usaha
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    nama: 'Aroma Kopi Nusantara',
    jenis: 'F&B (Coffee Shop)',
    kategori: 'Kuliner',
  });

  // Card 2: Penjualan
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
    hargaJual: '25000',
    produkTerjual: '80',
    jumlahTransaksi: '65',
    rataRataItem: '1.2',
  });

  // Card 3: Operasional
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics>({
    hariOperasional: '26',
    jamOperasional: '10',
  });

  // Card 4: Target
  const [targetMetrics, setTargetMetrics] = useState<TargetMetrics>({
    targetOmzet: '60000000',
    targetPertumbuhan: '15',
  });

  // Card 5: Kondisi Saat Ini
  const [currentStateMetrics, setCurrentStateMetrics] = useState<CurrentStateMetrics>({
    omzetBulanLalu: '45000000',
    omzetBulanIni: '35000000', // Sisa progres omzet berjalan
  });

  // Card 6: Slider Simulasi (% Perubahan, dari -20% sampai +50%)
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

  // Helper untuk input numerik (hanya mengizinkan angka desimal/bulat yang valid)
  const handleNumberChange = (
    value: string,
    key: string,
    setter: React.Dispatch<React.SetStateAction<any>>,
    allowDecimal = false
  ) => {
    const regex = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    const cleanValue = value.replace(regex, '');
    
    // Cegah multi desimal point
    if (allowDecimal && (cleanValue.match(/\./g) || []).length > 1) {
      return;
    }
    
    setter((prev: any) => ({ ...prev, [key]: cleanValue }));
  };

  // Reset handler
  const handleReset = () => {
    setBusinessInfo({
      nama: '',
      jenis: '',
      kategori: '',
    });
    setSalesMetrics({
      hargaJual: '0',
      produkTerjual: '0',
      jumlahTransaksi: '0',
      rataRataItem: '1',
    });
    setOperationalMetrics({
      hariOperasional: '26',
      jamOperasional: '8',
    });
    setTargetMetrics({
      targetOmzet: '0',
      targetPertumbuhan: '0',
    });
    setCurrentStateMetrics({
      omzetBulanLalu: '0',
      omzetBulanIni: '0',
    });
    setSimulationSlider(0);
    showToast('Seluruh data input omzet berhasil di-reset!');
  };

  // ==========================================
  // CALCULATIONS (using useMemo)
  // ==========================================
  const calculations = useMemo(() => {
    const parseNum = (val: string): number => Number(val) || 0;

    // Nilai-nilai dasar
    const hargaJual = parseNum(salesMetrics.hargaJual);
    const produkTerjual = Math.max(0, parseNum(salesMetrics.produkTerjual));
    const jumlahTransaksi = Math.max(1, parseNum(salesMetrics.jumlahTransaksi)); // Minimal 1 untuk pembagian aman
    
    const hariOps = Math.max(1, parseNum(operationalMetrics.hariOperasional));
    const jamOps = Math.max(1, parseNum(operationalMetrics.jamOperasional));

    const targetOmzet = Math.max(1, parseNum(targetMetrics.targetOmzet)); // Minimal 1 untuk pembagian aman
    const omzetBulanIni = parseNum(currentStateMetrics.omzetBulanIni);

    // Multiplier simulasi slider
    const multiplier = 1 + simulationSlider / 100;

    // Perhitungan Inti (Sebelum simulasi vs Setelah simulasi)
    const rawOmzetHarian = hargaJual * produkTerjual;
    const omzetHarian = rawOmzetHarian * multiplier;

    const omzetMingguan = omzetHarian * 7;
    const omzetBulanan = omzetHarian * hariOps;
    
    const omzetPerJam = omzetHarian / jamOps;
    const omzetPerTransaksi = omzetHarian / jumlahTransaksi;

    // Progress target terhadap omzet bulanan simulasi
    const progressPercent = Math.min(100, Math.max(0, (omzetBulanIni / targetOmzet) * 100));

    // Status Pencapaian Target & Insight Otomatis
    let statusLabel = 'Normal';
    let statusColor = 'bg-yellow-500';
    let statusBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    let insightText = '';

    const selisihTarget = targetOmzet - omzetBulanan;

    if (omzetBulanan === 0) {
      statusLabel = 'Data Kosong';
      statusColor = 'bg-gray-400';
      statusBg = 'bg-gray-50 text-gray-600 border-gray-200';
      insightText = 'Silakan isi parameter penjualan Anda pada formulir sebelah kiri.';
    } else if (omzetBulanan >= targetOmzet) {
      statusLabel = 'Sangat Baik';
      statusColor = 'bg-green-500';
      statusBg = 'bg-green-50 text-green-700 border-green-200';
      insightText = 'Selamat! Proyeksi omzet bulanan Anda telah melampaui target yang ditetapkan. Fokus pada stabilitas pasokan dan retensi pelanggan.';
    } else if (progressPercent >= 75) {
      statusLabel = 'Normal';
      statusColor = 'bg-blue-500';
      statusBg = 'bg-blue-50 text-blue-700 border-blue-200';
      insightText = `Proyeksi omzet Anda sudah mendekati target (${progressPercent.toFixed(0)}%). Tambahkan sedikit aktivitas promosi taktis untuk menutup kekurangan sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selisihTarget)}.`;
    } else if (progressPercent >= 40) {
      statusLabel = 'Perlu Ditingkatkan';
      statusColor = 'bg-orange-500';
      statusBg = 'bg-orange-50 text-orange-700 border-orange-200';
      insightText = 'Kinerja omzet berada di tingkat sedang. Anda perlu meningkatkan frekuensi transaksi harian atau menaikkan jumlah item per transaksi.';
    } else {
      statusLabel = 'Jauh dari Target';
      statusColor = 'bg-red-500';
      statusBg = 'bg-red-50 text-red-700 border-red-200';
      insightText = 'Perhatian! Proyeksi omzet bulanan Anda masih sangat jauh dari target. Evaluasi harga jual, target pasar, atau lakukan strategi promosi agresif segera.';
    }

    // Simulasi Skenario (Pesimis -20%, Normal, Optimis +50%)
    const skenarioPesimisOmzet = omzetBulanan * 0.8;
    const skenarioPesimisProduk = produkTerjual * 0.8;
    const skenarioPesimisTransaksi = jumlahTransaksi * 0.8;

    const skenarioNormalOmzet = omzetBulanan;
    const skenarioNormalProduk = produkTerjual;
    const skenarioNormalTransaksi = jumlahTransaksi;

    const skenarioOptimisOmzet = omzetBulanan * 1.5;
    const skenarioOptimisProduk = produkTerjual * 1.5;
    const skenarioOptimisTransaksi = jumlahTransaksi * 1.5;

    // Progress bar visual untuk distribusi periode
    const totalRepresentasiKala = omzetBulanan + omzetMingguan + omzetHarian + targetOmzet || 1;
    const pctHarianVisual = (omzetHarian / totalRepresentasiKala) * 100;
    const pctMingguanVisual = (omzetMingguan / totalRepresentasiKala) * 100;
    const pctBulananVisual = (omzetBulanan / totalRepresentasiKala) * 100;
    const pctTargetVisual = (targetOmzet / totalRepresentasiKala) * 100;

    return {
      omzetHarian,
      omzetMingguan,
      omzetBulanan,
      omzetPerJam,
      omzetPerTransaksi,
      produkTerjualSimulated: produkTerjual * multiplier,
      jumlahTransaksiSimulated: jumlahTransaksi * multiplier,
      progressPercent,
      targetOmzet,
      omzetBulanIni,
      statusLabel,
      statusColor,
      statusBg,
      insightText,
      // Skenario
      skenarioPesimis: {
        omzet: skenarioPesimisOmzet,
        produk: skenarioPesimisProduk,
        transaksi: skenarioPesimisTransaksi,
      },
      skenarioNormal: {
        omzet: skenarioNormalOmzet,
        produk: skenarioNormalProduk,
        transaksi: skenarioNormalTransaksi,
      },
      skenarioOptimis: {
        omzet: skenarioOptimisOmzet,
        produk: skenarioOptimisProduk,
        transaksi: skenarioOptimisTransaksi,
      },
      // Pct visual
      pctHarianVisual,
      pctMingguanVisual,
      pctBulananVisual,
      pctTargetVisual,
    };
  }, [salesMetrics, operationalMetrics, targetMetrics, currentStateMetrics, simulationSlider]);

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
OMZET BULANAN
Nama : ${businessInfo.nama || '-'}
Jenis : ${businessInfo.jenis || '-'}
Omzet Harian : ${formatRupiah(calculations.omzetHarian)}
Omzet Bulanan : ${formatRupiah(calculations.omzetBulanan)}
Target : ${formatRupiah(calculations.targetOmzet)}
Progress : ${calculations.progressPercent.toFixed(1)}%
Status : ${calculations.statusLabel}
Insight : ${calculations.insightText}
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
      showToast('Ringkasan omzet berhasil disalin ke clipboard!');
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
            📈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                Kalkulator Omzet Bulanan
              </h1>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider uppercase border border-blue-200">
                Professional Tool
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 font-medium">
              Hitung estimasi omzet usaha berdasarkan aktivitas penjualan harian secara otomatis.
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
            
            {/* CARD 1: Informasi Usaha */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="text-xl">🏪</span>
                <h3 className="font-bold text-gray-900 text-base">Informasi Usaha</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nama Usaha</label>
                  <input
                    type="text"
                    value={businessInfo.nama}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, nama: e.target.value })}
                    placeholder="Contoh: Aroma Kopi"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jenis Usaha</label>
                  <input
                    type="text"
                    value={businessInfo.jenis}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, jenis: e.target.value })}
                    placeholder="Contoh: F&B (Coffeeshop)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategori</label>
                  <input
                    type="text"
                    value={businessInfo.kategori}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, kategori: e.target.value })}
                    placeholder="Contoh: Kuliner / Jasa"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </section>

            {/* CARD 2: Penjualan */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛍️</span>
                  <h3 className="font-bold text-gray-900 text-base">Parameter Penjualan</h3>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                  Omzet Kasar: {formatRupiah(Number(salesMetrics.hargaJual) * Number(salesMetrics.produkTerjual))} / hari
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Harga Jual per Produk</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(Number(salesMetrics.hargaJual) || 0)}
                      onChange={(e) => handleNumberChange(e.target.value, 'hargaJual', setSalesMetrics)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jumlah Produk Terjual / Hari</label>
                  <input
                    type="text"
                    value={formatNumber(Number(salesMetrics.produkTerjual) || 0)}
                    onChange={(e) => handleNumberChange(e.target.value, 'produkTerjual', setSalesMetrics)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jumlah Transaksi / Hari</label>
                  <input
                    type="text"
                    value={formatNumber(Number(salesMetrics.jumlahTransaksi) || 0)}
                    onChange={(e) => handleNumberChange(e.target.value, 'jumlahTransaksi', setSalesMetrics)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rata-rata Item per Transaksi</label>
                  <input
                    type="text"
                    value={salesMetrics.rataRataItem}
                    onChange={(e) => handleNumberChange(e.target.value, 'rataRataItem', setSalesMetrics, true)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                  />
                </div>
              </div>
            </section>

            {/* CARD 3: Operasional */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="text-xl">⚙️</span>
                <h3 className="font-bold text-gray-900 text-base">Operasional Usaha</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hari Operasional per Bulan</label>
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={operationalMetrics.hariOperasional}
                      onChange={(e) => setOperationalMetrics({ ...operationalMetrics, hariOperasional: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jam Operasional per Hari</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={operationalMetrics.jamOperasional}
                    onChange={(e) => setOperationalMetrics({ ...operationalMetrics, jamOperasional: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                  />
                </div>
              </div>
            </section>

            {/* CARD 4: Target */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="text-xl">🎯</span>
                <h3 className="font-bold text-gray-900 text-base">Target & Pertumbuhan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Omzet Bulanan</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(Number(targetMetrics.targetOmzet) || 0)}
                      onChange={(e) => handleNumberChange(e.target.value, 'targetOmzet', setTargetMetrics)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Pertumbuhan (%)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="text"
                      value={targetMetrics.targetPertumbuhan}
                      onChange={(e) => handleNumberChange(e.target.value, 'targetPertumbuhan', setTargetMetrics, true)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 5: Kondisi Saat Ini */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="text-xl">📊</span>
                <h3 className="font-bold text-gray-900 text-base">Kondisi Saat Ini (Aktual)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Omzet Bulan Lalu</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(Number(currentStateMetrics.omzetBulanLalu) || 0)}
                      onChange={(e) => handleNumberChange(e.target.value, 'omzetBulanLalu', setCurrentStateMetrics)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Omzet Bulan Ini (Berjalan / Sementara)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(Number(currentStateMetrics.omzetBulanIni) || 0)}
                      onChange={(e) => handleNumberChange(e.target.value, 'omzetBulanIni', setCurrentStateMetrics)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 6: Simulasi Slider */}
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl border border-blue-700 shadow-sm hover:shadow-md transition-all p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🎛️</span>
                <h3 className="font-bold text-base">Simulasi Realtime Penjualan</h3>
              </div>
              <p className="text-xs text-blue-100 mb-6 leading-relaxed">
                Gunakan penggeser untuk mensimulasikan kenaikan atau penurunan volume transaksi harian secara instan (dari rentang penurunan <span className="font-bold">-20%</span> hingga peningkatan kapasitas <span className="font-bold">+50%</span>).
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-blue-200">Kondisi Saat Ini</span>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${simulationSlider === 0 ? 'bg-blue-500' : simulationSlider > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {simulationSlider === 0 ? 'Normal (0%)' : simulationSlider > 0 ? `Naik +${simulationSlider}%` : `Turun ${simulationSlider}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  value={simulationSlider}
                  onChange={(e) => setSimulationSlider(Number(e.target.value))}
                  className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[10px] text-blue-200 font-bold uppercase">
                  <span>📉 -20% (Pesimis)</span>
                  <span>Normal (0%)</span>
                  <span>📈 +50% (Optimis Tinggi)</span>
                </div>
              </div>
            </section>

            {/* CARD TERAKHIR: Tombol Reset */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center gap-2 bg-white"
              >
                <span>🔄</span> Reset Seluruh Input Omzet
              </button>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (35%) ================= */}
          <div className="lg:col-span-4">
            
            {/* STICKY CONTAINER */}
            <div className="lg:sticky lg:top-28 space-y-6">

              {/* DASHBOARD CARD BESAR: TOTAL OMZET BULANAN */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-7xl select-none">
                  📈
                </div>
                <div className="relative z-10">
                  <span className="text-xs font-bold tracking-widest text-blue-700 uppercase block mb-1">
                    ESTIMASI OMZET BULANAN
                  </span>
                  <div className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight my-2">
                    {formatRupiah(calculations.omzetBulanan)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      Proyeksi Bulanan
                    </span>
                    {simulationSlider !== 0 && (
                      <span className="text-[11px] text-blue-600 font-medium">
                        Terpengaruh simulasi ({simulationSlider > 0 ? '+' : ''}{simulationSlider}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* DASHBOARD CARD KECIL: Grid Omzet */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Omzet Harian</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {formatRupiah(calculations.omzetHarian)}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Omzet per Jam</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {formatRupiah(calculations.omzetPerJam)}
                  </span>
                </div>
              </div>

              {/* CARD BREAKDOWN */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">⏳</span>
                  <h4 className="font-bold text-gray-900 text-sm">Rincian Periode Omzet</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Omzet Harian</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(calculations.omzetHarian)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Omzet Mingguan</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(calculations.omzetMingguan)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-900 font-bold">Total Omzet Bulanan</span>
                    <span className="font-black text-blue-600">{formatRupiah(calculations.omzetBulanan)}</span>
                  </div>
                </div>
              </div>

              {/* CARD PRODUKTIVITAS */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">🎯</span>
                  <h4 className="font-bold text-gray-900 text-sm">Metrik Produktivitas Penjualan</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Produk Terjual / Hari</span>
                    <span className="font-bold text-gray-950 bg-gray-100 px-2.5 py-0.5 rounded">
                      {formatNumber(calculations.produkTerjualSimulated)} Pcs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transaksi / Hari</span>
                    <span className="font-bold text-gray-950 bg-gray-100 px-2.5 py-0.5 rounded">
                      {formatNumber(calculations.jumlahTransaksiSimulated)} Kali
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Rata-rata Omzet / Transaksi</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                      {formatRupiah(calculations.omzetPerTransaksi)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD PROGRESS TARGET */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">🚀</span>
                  <h4 className="font-bold text-gray-900 text-sm">Pencapaian Target Omzet</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-500">Progress saat ini</span>
                    <span className="text-blue-600 font-bold">{calculations.progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${calculations.progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold pt-1">
                    <span>Mulai: {formatRupiah(calculations.omzetBulanIni)}</span>
                    <span>Target: {formatRupiah(calculations.targetOmzet)}</span>
                  </div>
                </div>
              </div>

              {/* CARD STATUS & INSIGHT */}
              <div className={`border rounded-xl p-5 ${calculations.statusBg} transition-all`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3.5 h-3.5 rounded-full ${calculations.statusColor} animate-pulse inline-block`}></span>
                  <span className="font-black text-sm uppercase tracking-wide">
                    Status: {calculations.statusLabel}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {calculations.insightText}
                </p>
              </div>

              {/* CARD SIMULASI SCENARIO */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">⚖️</span>
                  <h4 className="font-bold text-gray-900 text-sm">Analisis 3 Skenario</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Skenario Pesimis */}
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-red-700 block uppercase">Pesimis (-20%)</span>
                    <span className="text-[10px] font-bold text-gray-900 block mt-1">
                      {formatRupiah(calculations.skenarioPesimis.omzet)}
                    </span>
                    <span className="text-[8px] text-gray-500 block mt-0.5">
                      {formatNumber(calculations.skenarioPesimis.produk)} Pcs
                    </span>
                  </div>

                  {/* Skenario Normal */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-gray-700 block uppercase">Normal (Asli)</span>
                    <span className="text-[10px] font-bold text-gray-900 block mt-1">
                      {formatRupiah(calculations.skenarioNormal.omzet)}
                    </span>
                    <span className="text-[8px] text-gray-500 block mt-0.5">
                      {formatNumber(calculations.skenarioNormal.produk)} Pcs
                    </span>
                  </div>

                  {/* Skenario Optimis */}
                  <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-green-700 block uppercase">Optimis (+50%)</span>
                    <span className="text-[10px] font-bold text-gray-900 block mt-1">
                      {formatRupiah(calculations.skenarioOptimis.omzet)}
                    </span>
                    <span className="text-[8px] text-gray-500 block mt-0.5">
                      {formatNumber(calculations.skenarioOptimis.produk)} Pcs
                    </span>
                  </div>

                </div>
              </div>

              {/* CARD REKOMENDASI */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">💡</span>
                  <h4 className="font-bold text-gray-900 text-sm">Rekomendasi Taktis</h4>
                </div>
                <ul className="space-y-2.5">
                  {[
                    { id: 1, text: 'Tambah promosi untuk genjot produk terjual per hari.', checked: calculations.progressPercent < 80 },
                    { id: 2, text: 'Tingkatkan jumlah transaksi lewat program membership / bundling.', checked: true },
                    { id: 3, text: 'Naikkan average order value (AOV) dengan strategi cross-selling.', checked: true },
                    { id: 4, text: 'Tambah jam operasional untuk menyasar segmen pasar sore/malam.', checked: calculations.omzetBulanan < calculations.targetOmzet },
                    { id: 5, text: 'Naikkan harga jual produk secara bertahap dibarengi value improvement.', checked: false },
                  ].map((rec) => (
                    <li key={rec.id} className="flex items-start gap-2.5 text-xs text-gray-600">
                      <span className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-[10px] ${rec.checked ? 'bg-green-100 text-green-700 font-bold' : 'bg-gray-100 text-gray-400'}`}>
                        ✓
                      </span>
                      <span className={rec.checked ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}>
                        {rec.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CARD BREAKDOWN VISUAL (Horizontal Progress Distibution) */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📊</span>
                  <h4 className="font-bold text-gray-900 text-sm">Proporsi Keuangan Visual</h4>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex">
                  <div className="bg-sky-400 h-full" style={{ width: `${Math.max(5, calculations.pctHarianVisual)}%` }} title="Harian"></div>
                  <div className="bg-indigo-400 h-full" style={{ width: `${Math.max(5, calculations.pctMingguanVisual)}%` }} title="Mingguan"></div>
                  <div className="bg-blue-600 h-full" style={{ width: `${Math.max(5, calculations.pctBulananVisual)}%` }} title="Bulanan"></div>
                  <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(5, calculations.pctTargetVisual)}%` }} title="Target"></div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase mt-2">
                  <span className="text-sky-500">● Hari</span>
                  <span className="text-indigo-500">● Minggu</span>
                  <span className="text-blue-600">● Bulan</span>
                  <span className="text-emerald-500">● Target</span>
                </div>
              </div>

              {/* CARD TERAKHIR: Salin Ringkasan */}
              <button
                onClick={handleCopySummary}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>📋</span> Salin Ringkasan Laporan Omzet
              </button>

            </div>

          </div>

        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-gray-200 mt-16 py-8 text-center text-xs text-gray-400">
        <p>© 2026 Platform Microtools UMKM Indonesia. All rights reserved.</p>
        <p className="mt-1">Dirancang khusus untuk pembukuan dan analisis finansial UMKM yang sehat, adaptif, dan berkelanjutan.</p>
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