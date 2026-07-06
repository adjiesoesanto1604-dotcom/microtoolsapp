'use client';

import React, { useState, useMemo, useEffect } from 'react';

// ==========================================
// INTERFACES & TYPES
// ==========================================
interface BusinessInfo {
  nama: string;
  jenis: string;
  cabang: string;
  hariOperasional: string;
  jamOperasional: string;
}

interface CostCategory {
  [key: string]: string;
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function BiayaOperasionalPage() {
  // --- STATE ---
  // Info Usaha
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    nama: 'Kopi Kenangan Rakyat',
    jenis: 'F&B (Coffeeshop)',
    cabang: '2',
    hariOperasional: '26',
    jamOperasional: '8',
  });

  // SDM Costs
  const [sdmCosts, setSdmCosts] = useState<CostCategory>({
    gajiOwner: '5000000',
    gajiKaryawan: '6000000',
    bonus: '1000000',
    bpjs: '300000',
    lembur: '500000',
  });

  // Tempat Costs
  const [tempatCosts, setTempatCosts] = useState<CostCategory>({
    sewa: '2500000',
    listrik: '800000',
    air: '200000',
    internet: '350000',
    gas: '150000',
  });

  // Operasional Costs
  const [operasionalCosts, setOperasionalCosts] = useState<CostCategory>({
    transportasi: '400000',
    maintenance: '300000',
    atk: '100000',
    packaging: '1200000',
    kebersihan: '150000',
  });

  // Marketing Costs
  const [marketingCosts, setMarketingCosts] = useState<CostCategory>({
    iklan: '800000',
    konten: '500000',
    promosi: '300000',
    marketplaceFee: '400000',
  });

  // Lain-lain Costs
  const [lainCosts, setLainCosts] = useState<CostCategory>({
    pajak: '500000',
    administrasi: '200000',
    takTerduga: '500000',
  });

  // Slider Simulasi (% Perubahan, dari -20% sampai +50%)
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

  // Helper untuk mengubah string input berformat angka
  const handleCostChange = (
    value: string,
    key: string,
    setter: React.Dispatch<React.SetStateAction<CostCategory>>
  ) => {
    // Hanya izinkan angka saja
    const cleanValue = value.replace(/[^0-9]/g, '');
    setter((prev) => ({ ...prev, [key]: cleanValue }));
  };

  // Helper reset seluruh input ke nilai awal/kosong
  const handleReset = () => {
    setBusinessInfo({
      nama: '',
      jenis: '',
      cabang: '1',
      hariOperasional: '26',
      jamOperasional: '8',
    });
    setSdmCosts({ gajiOwner: '0', gajiKaryawan: '0', bonus: '0', bpjs: '0', lembur: '0' });
    setTempatCosts({ sewa: '0', listrik: '0', air: '0', internet: '0', gas: '0' });
    setOperasionalCosts({ transportasi: '0', maintenance: '0', atk: '0', packaging: '0', kebersihan: '0' });
    setMarketingCosts({ iklan: '0', konten: '0', promosi: '0', marketplaceFee: '0' });
    setLainCosts({ pajak: '0', administrasi: '0', takTerduga: '0' });
    setSimulationSlider(0);
    showToast('Seluruh data input berhasil di-reset!');
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // ==========================================
  // CALCULATIONS (using useMemo)
  // ==========================================
  const calculations = useMemo(() => {
    const parseNum = (val: string): number => Number(val) || 0;

    // Sum untuk masing-masing kategori (sebelum simulasi)
    const sumSdm = Object.values(sdmCosts).reduce((acc, curr) => acc + parseNum(curr), 0);
    const sumTempat = Object.values(tempatCosts).reduce((acc, curr) => acc + parseNum(curr), 0);
    const sumOperasional = Object.values(operasionalCosts).reduce((acc, curr) => acc + parseNum(curr), 0);
    const sumMarketing = Object.values(marketingCosts).reduce((acc, curr) => acc + parseNum(curr), 0);
    const sumLain = Object.values(lainCosts).reduce((acc, curr) => acc + parseNum(curr), 0);

    // Total Biaya Dasar (Tanpa Simulasi)
    const rawTotal = sumSdm + sumTempat + sumOperasional + sumMarketing + sumLain;

    // Faktor pengali berdasarkan slider simulasi (misal slider = 15, artinya kenaikan 15% -> pengali = 1.15)
    const multiplier = 1 + simulationSlider / 100;

    // Biaya setelah simulasi slider utama
    const totalOperasional = rawTotal * multiplier;

    const sdmSimulated = sumSdm * multiplier;
    const tempatSimulated = sumTempat * multiplier;
    const operasionalSimulated = sumOperasional * multiplier;
    const marketingSimulated = sumMarketing * multiplier;
    const lainSimulated = sumLain * multiplier;

    // Nilai-nilai pembagi dari info usaha
    const cabangCount = Math.max(1, parseNum(businessInfo.cabang));
    const hariOps = Math.max(1, parseNum(businessInfo.hariOperasional));
    const jamOps = Math.max(1, parseNum(businessInfo.jamOperasional));

    // Turunan Biaya (Simulated)
    const biayaHarian = totalOperasional / hariOps;
    const biayaMingguan = biayaHarian * 7;
    const biayaBulanan = totalOperasional;
    const biayaPerJam = biayaHarian / jamOps;
    const biayaPerCabang = totalOperasional / cabangCount;

    // Persentase Kontribusi Kategori
    const totalForPercent = totalOperasional || 1; // Cegah NaN
    const percentSdm = (sdmSimulated / totalForPercent) * 100;
    const percentTempat = (tempatSimulated / totalForPercent) * 100;
    const percentMarketing = (marketingSimulated / totalForPercent) * 100;
    const percentOperasional = (operasionalSimulated / totalForPercent) * 100;
    const percentLain = (lainSimulated / totalForPercent) * 100;

    // Status Efisiensi & Insight
    // Hitung rasio total biaya terhadap standar fiktif (misal 15 juta sebagai threshold normal)
    let statusLabel = 'Normal';
    let statusColor = 'bg-yellow-500';
    let statusBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    let insightText = '';

    if (totalOperasional === 0) {
      statusLabel = 'Data Kosong';
      statusColor = 'bg-gray-400';
      statusBg = 'bg-gray-50 text-gray-600 border-gray-200';
      insightText = 'Silakan isi formulir biaya operasional di sebelah kiri untuk melihat hasil analisis.';
    } else if (totalOperasional < 5000000) {
      statusLabel = 'Sangat Efisien';
      statusColor = 'bg-green-500';
      statusBg = 'bg-green-50 text-green-700 border-green-200';
      insightText = 'Pengeluaran operasional Anda sangat ramping. Pertahankan struktur biaya ini selagi menjaga kualitas produk dan pelayanan.';
    } else if (totalOperasional <= 15000000) {
      statusLabel = 'Normal';
      statusColor = 'bg-blue-500';
      statusBg = 'bg-blue-50 text-blue-700 border-blue-200';
      insightText = 'Biaya operasional Anda berada pada tingkat rata-rata yang sehat untuk UMKM. Lakukan monitoring berkala pada biaya pemasaran.';
    } else if (totalOperasional <= 30000000) {
      statusLabel = 'Tinggi';
      statusColor = 'bg-orange-500';
      statusBg = 'bg-orange-50 text-orange-700 border-orange-200';
      insightText = 'Biaya operasional cukup besar. Pertimbangkan untuk mengevaluasi efisiensi penggunaan listrik, sewa tempat, atau menyeimbangkan biaya SDM.';
    } else {
      statusLabel = 'Sangat Tinggi';
      statusColor = 'bg-red-500';
      statusBg = 'bg-red-50 text-red-700 border-red-200';
      insightText = 'Peringatan! Biaya operasional sangat tinggi. Segera lakukan audit keuangan, negosiasi ulang biaya sewa, atau optimalkan jam kerja karyawan untuk mengurangi lembur.';
    }

    // Tiga Skenario Tambahan (Pesimis -20%, Normal, Optimis +50% berdasarkan biaya dasar)
    const skenarioPesimisTotal = rawTotal * 0.8;
    const skenarioOptimisTotal = rawTotal * 1.5;

    return {
      totalOperasional,
      biayaHarian,
      biayaMingguan,
      biayaBulanan,
      biayaPerJam,
      biayaPerCabang,
      rawTotal,
      // Kontribusi kategorial
      sumSdm: sdmSimulated,
      sumTempat: tempatSimulated,
      sumOperasional: operasionalSimulated,
      sumMarketing: marketingSimulated,
      sumLain: lainSimulated,
      // Persentase
      percentSdm,
      percentTempat,
      percentMarketing,
      percentOperasional,
      percentLain,
      // Status
      statusLabel,
      statusColor,
      statusBg,
      insightText,
      // Skenario
      skenarioPesimis: {
        total: skenarioPesimisTotal,
        harian: skenarioPesimisTotal / hariOps,
        perCabang: skenarioPesimisTotal / cabangCount,
      },
      skenarioNormal: {
        total: rawTotal,
        harian: rawTotal / hariOps,
        perCabang: rawTotal / cabangCount,
      },
      skenarioOptimis: {
        total: skenarioOptimisTotal,
        harian: skenarioOptimisTotal / hariOps,
        perCabang: skenarioOptimisTotal / cabangCount,
      },
    };
  }, [businessInfo, sdmCosts, tempatCosts, operasionalCosts, marketingCosts, lainCosts, simulationSlider]);

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
BIAYA OPERASIONAL
Nama : ${businessInfo.nama || '-'}
Jenis : ${businessInfo.jenis || '-'}
Total : ${formatRupiah(calculations.totalOperasional)}
SDM : ${formatRupiah(calculations.sumSdm)}
Operasional : ${formatRupiah(calculations.sumOperasional)}
Marketing : ${formatRupiah(calculations.sumMarketing)}
Status : ${calculations.statusLabel}
Insight : ${calculations.insightText}
==================================`;

    // Clipboard API Fallback
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
      showToast('Ringkasan berhasil disalin ke clipboard!');
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
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                Kalkulator Biaya Operasional
              </h1>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider uppercase border border-blue-200">
                Professional Tool
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 font-medium">
              Hitung seluruh biaya operasional usaha secara otomatis.
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
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <span className="text-xl">🏪</span>
                <h3 className="font-bold text-gray-900 text-base">Informasi Usaha</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nama Usaha</label>
                  <input
                    type="text"
                    value={businessInfo.nama}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, nama: e.target.value })}
                    placeholder="Contoh: Kopi Kenangan Rakyat"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jenis Usaha</label>
                  <input
                    type="text"
                    value={businessInfo.jenis}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, jenis: e.target.value })}
                    placeholder="Contoh: F&B (Coffeeshop)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jumlah Cabang</label>
                    <input
                      type="number"
                      min="1"
                      value={businessInfo.cabang}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, cabang: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hari Ops / Bln</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={businessInfo.hariOperasional}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, hariOperasional: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jam Ops / Hari</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={businessInfo.jamOperasional}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, jamOperasional: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition text-center"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 2: SDM */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <h3 className="font-bold text-gray-900 text-base">Biaya SDM</h3>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                  Total: {formatRupiah(Object.values(sdmCosts).reduce((a, b) => a + (Number(b) || 0), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Gaji Owner', key: 'gajiOwner' },
                  { label: 'Gaji Karyawan', key: 'gajiKaryawan' },
                  { label: 'Bonus / Komisi', key: 'bonus' },
                  { label: 'Tunjangan / BPJS', key: 'bpjs' },
                  { label: 'Uang Lembur', key: 'lembur' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-bold">Rp</span>
                      </div>
                      <input
                        type="text"
                        value={formatNumber(Number(sdmCosts[item.key]) || 0)}
                        onChange={(e) => handleCostChange(e.target.value, item.key, setSdmCosts)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CARD 3: Tempat */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <h3 className="font-bold text-gray-900 text-base">Biaya Tempat & Utilitas</h3>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold border border-amber-100">
                  Total: {formatRupiah(Object.values(tempatCosts).reduce((a, b) => a + (Number(b) || 0), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Sewa Tempat / Gedung', key: 'sewa' },
                  { label: 'Tagihan Listrik', key: 'listrik' },
                  { label: 'Tagihan Air (PDAM)', key: 'air' },
                  { label: 'Internet & Telepon', key: 'internet' },
                  { label: 'Gas / Bahan Bakar Utama', key: 'gas' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-bold">Rp</span>
                      </div>
                      <input
                        type="text"
                        value={formatNumber(Number(tempatCosts[item.key]) || 0)}
                        onChange={(e) => handleCostChange(e.target.value, item.key, setTempatCosts)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CARD 4: Operasional */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚙️</span>
                  <h3 className="font-bold text-gray-900 text-base">Biaya Operasional Rutin</h3>
                </div>
                <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-semibold border border-rose-100">
                  Total: {formatRupiah(Object.values(operasionalCosts).reduce((a, b) => a + (Number(b) || 0), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Transportasi & Kurir', key: 'transportasi' },
                  { label: 'Maintenance & Servis Alat', key: 'maintenance' },
                  { label: 'ATK & Keperluan Kantor', key: 'atk' },
                  { label: 'Packaging / Kemasan Produk', key: 'packaging' },
                  { label: 'Kebersihan & Keamanan', key: 'kebersihan' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-bold">Rp</span>
                      </div>
                      <input
                        type="text"
                        value={formatNumber(Number(operasionalCosts[item.key]) || 0)}
                        onChange={(e) => handleCostChange(e.target.value, item.key, setOperasionalCosts)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CARD 5: Marketing */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📣</span>
                  <h3 className="font-bold text-gray-900 text-base">Biaya Pemasaran (Marketing)</h3>
                </div>
                <span className="text-xs bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full font-semibold border border-sky-100">
                  Total: {formatRupiah(Object.values(marketingCosts).reduce((a, b) => a + (Number(b) || 0), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Iklan Berbayar (FB/IG/Google)', key: 'iklan' },
                  { label: 'Pembuatan Konten / Influencer', key: 'konten' },
                  { label: 'Promosi / Diskon / Brosur', key: 'promosi' },
                  { label: 'Marketplace Admin Fee (Shopee/Tokopedia)', key: 'marketplaceFee' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-bold">Rp</span>
                      </div>
                      <input
                        type="text"
                        value={formatNumber(Number(marketingCosts[item.key]) || 0)}
                        onChange={(e) => handleCostChange(e.target.value, item.key, setMarketingCosts)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CARD 6: Lain-lain */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <h3 className="font-bold text-gray-900 text-base">Lain-lain & Cadangan</h3>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-semibold border border-gray-200">
                  Total: {formatRupiah(Object.values(lainCosts).reduce((a, b) => a + (Number(b) || 0), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Pajak Usaha', key: 'pajak' },
                  { label: 'Administrasi Bank & Legal', key: 'administrasi' },
                  { label: 'Biaya Tak Terduga', key: 'takTerduga' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-bold">Rp</span>
                      </div>
                      <input
                        type="text"
                        value={formatNumber(Number(lainCosts[item.key]) || 0)}
                        onChange={(e) => handleCostChange(e.target.value, item.key, setLainCosts)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CARD 7: Simulasi */}
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl border border-blue-700 shadow-sm hover:shadow-md transition p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🎛️</span>
                <h3 className="font-bold text-base">Simulasi Pertumbuhan / Penurunan Biaya</h3>
              </div>
              <p className="text-xs text-blue-100 mb-6 leading-relaxed">
                Gunakan slider di bawah untuk mensimulasikan dampak perubahan ekonomi atau inflasi (dari penurunan <span className="font-bold">-20%</span> hingga kenaikan <span className="font-bold">+50%</span>) secara realtime pada seluruh post biaya.
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-blue-200">Kondisi Saat Ini</span>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${simulationSlider === 0 ? 'bg-blue-500' : simulationSlider > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
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
                  <span>📉 -20% (Sangat Efisien)</span>
                  <span>Normal (0%)</span>
                  <span>📈 +50% (Skenario Ekstrem)</span>
                </div>
              </div>
            </section>

            {/* CARD TERAKHIR: Tombol Aksi */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 hover:text-gray-900 transition flex items-center justify-center gap-2 bg-white"
              >
                <span>🔄</span> Reset Seluruh Input
              </button>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (35%) ================= */}
          <div className="lg:col-span-4">
            
            {/* STICKY CONTAINER */}
            <div className="lg:sticky lg:top-28 space-y-6">

              {/* CARD 1: TOTAL BIAYA (Main Result) */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-7xl select-none">
                  💰
                </div>
                <div className="relative z-10">
                  <span className="text-xs font-bold tracking-widest text-blue-700 uppercase block mb-1">
                    TOTAL BIAYA OPERASIONAL
                  </span>
                  <div className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight my-2">
                    {formatRupiah(calculations.totalOperasional)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      Per Bulan
                    </span>
                    {simulationSlider !== 0 && (
                      <span className="text-[11px] text-blue-600 font-medium">
                        Terpengaruh simulasi ({simulationSlider > 0 ? '+' : ''}{simulationSlider}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: Total SDM vs Total Operasional */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Total SDM</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {formatRupiah(calculations.sumSdm)}
                  </span>
                  <span className="text-[9px] text-indigo-500 font-bold block">
                    {calculations.percentSdm.toFixed(1)}% dari Total
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Operasional</span>
                  <span className="text-sm font-bold text-gray-900 block mt-1">
                    {formatRupiah(calculations.sumOperasional)}
                  </span>
                  <span className="text-[9px] text-rose-500 font-bold block">
                    {calculations.percentOperasional.toFixed(1)}% dari Total
                  </span>
                </div>
              </div>

              {/* CARD 3: Breakdown (Harian, Mingguan, Bulanan) */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">⏳</span>
                  <h4 className="font-bold text-gray-900 text-sm">Breakdown Periode Waktu</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Biaya Harian</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(calculations.biayaHarian)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Biaya Mingguan</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(calculations.biayaMingguan)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-900 font-bold">Biaya Bulanan</span>
                    <span className="font-black text-blue-600">{formatRupiah(calculations.biayaBulanan)}</span>
                  </div>
                </div>
              </div>

              {/* CARD 4: Produktivitas */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">🎯</span>
                  <h4 className="font-bold text-gray-900 text-sm">Indikator Produktivitas</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Beban Biaya per Hari</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      {formatRupiah(calculations.biayaHarian)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Beban Biaya per Jam Kerja</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      {formatRupiah(calculations.biayaPerJam)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Beban Biaya per Cabang</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      {formatRupiah(calculations.biayaPerCabang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 5 & 9: Progress Breakdown Visual (Combined for Clean UX) */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">📈</span>
                  <h4 className="font-bold text-gray-900 text-sm">Distribusi Anggaran Visual</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Progress Bar 1: SDM */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600">SDM</span>
                      <span className="font-bold text-indigo-600">{calculations.percentSdm.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calculations.percentSdm}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Progress Bar 2: Tempat */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600">Tempat & Utilitas</span>
                      <span className="font-bold text-amber-600">{calculations.percentTempat.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calculations.percentTempat}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Progress Bar 3: Marketing */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600">Pemasaran (Marketing)</span>
                      <span className="font-bold text-sky-600">{calculations.percentMarketing.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calculations.percentMarketing}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Progress Bar 4: Operasional */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600">Operasional</span>
                      <span className="font-bold text-rose-600">{calculations.percentOperasional.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calculations.percentOperasional}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Progress Bar 5: Lainnya */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600">Lain-lain & Pajak</span>
                      <span className="font-bold text-gray-600">{calculations.percentLain.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gray-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calculations.percentLain}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 6: Status & Insight */}
              <div className={`border rounded-xl p-5 ${calculations.statusBg} transition`}>
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

              {/* CARD 7: Skenario (Pesimis, Normal, Optimis) */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">⚖️</span>
                  <h4 className="font-bold text-gray-900 text-sm">Analisis Multi-Skenario</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Skenario Pesimis */}
                  <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-green-700 block uppercase">Efisiensi (-20%)</span>
                    <span className="text-[10px] font-bold text-gray-900 block mt-1">
                      {formatRupiah(calculations.skenarioPesimis.total)}
                    </span>
                    <span className="text-[8px] text-gray-500 block mt-0.5">
                      Harian: {formatRupiah(calculations.skenarioPesimis.harian)}
                    </span>
                  </div>

                  {/* Skenario Normal */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-gray-700 block uppercase">Normal (Asli)</span>
                    <span className="text-[10px] font-bold text-gray-900 block mt-1">
                      {formatRupiah(calculations.skenarioNormal.total)}
                    </span>
                    <span className="text-[8px] text-gray-500 block mt-0.5">
                      Harian: {formatRupiah(calculations.skenarioNormal.harian)}
                    </span>
                  </div>

                  {/* Skenario Optimis */}
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-center">
                    <span className="text-[9px] font-black text-red-700 block uppercase">Ekstrem (+50%)</span>
                    <span className="text-[10px] font-bold text-gray-900 block mt-1">
                      {formatRupiah(calculations.skenarioOptimis.total)}
                    </span>
                    <span className="text-[8px] text-gray-500 block mt-0.5">
                      Harian: {formatRupiah(calculations.skenarioOptimis.harian)}
                    </span>
                  </div>

                </div>
              </div>

              {/* CARD 8: Rekomendasi Pintar */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <span className="text-lg">💡</span>
                  <h4 className="font-bold text-gray-900 text-sm">Rekomendasi Optimal</h4>
                </div>
                <ul className="space-y-2.5">
                  {[
                    { id: 1, text: 'Gunakan teknologi pintar otomatis untuk kurangi biaya listrik.', checked: calculations.sumTempat > 1000000 },
                    { id: 2, text: 'Optimasi performa & ROI iklan berbayar secara bulanan.', checked: calculations.sumMarketing > 1500000 },
                    { id: 3, text: 'Pertimbangkan negosiasi sewa jangka panjang guna pangkas rate sewa tahunan.', checked: true },
                    { id: 4, text: 'Targetkan peningkatkan omset 15% untuk mengimbangi beban biaya tetap.', checked: true },
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

              {/* CARD TERAKHIR: Salin Ringkasan */}
              <button
                onClick={handleCopySummary}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>📋</span> Salin Ringkasan Laporan
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