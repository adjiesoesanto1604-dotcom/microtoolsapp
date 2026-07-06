'use client';

import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';

// Interfaces for State
interface FormState {
  namaInvestasi: string;
  jenisInvestasi: string;
  kategoriUsaha: string;
  investasiAwal: string;
  biayaRenovasi: string;
  biayaPeralatan: string;
  modalKerja: string;
  labaBulan: string;
  labaTahun: string;
  estimasiPertumbuhan: string;
  hariOperasional: string;
  jamOperasional: string;
  estimasiPenjualan: string;
  simulasiLaba: number; // Slider value -30 to +50
}

interface ToastState {
  show: boolean;
  message: string;
}

interface ScenarioResult {
  label: string;
  labaBulan: number;
  paybackMonths: number;
  roi: number;
  color: string;
  bg: string;
}

// Utility to format number to Rupiah string
const formatRupiah = (value: number | string): string => {
  if (!value) return '';
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9-]/g, '')) : value;
  if (isNaN(numericValue)) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
};

// Utility to parse Rupiah string back to number
const parseNumber = (value: string): number => {
  if (!value) return 0;
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

// Format standard number
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

// Format Payback Period in Years and Months
const formatPaybackPeriod = (totalMonths: number): string => {
  if (totalMonths <= 0) return '0 Bulan';
  if (!isFinite(totalMonths) || totalMonths > 1200) return 'Belum Lunas / Terlalu Lama';

  const years = Math.floor(totalMonths / 12);
  const months = Math.ceil(totalMonths % 12);

  if (years > 0) {
    if (months > 0) {
      return `${years} Tahun ${months} Bulan`;
    }
    return `${years} Tahun`;
  }
  return `${months} Bulan`;
};

export default function PaybackPeriodPage() {
  // Initial Form State
  const initialFormState: FormState = {
    namaInvestasi: 'Kedai Kopi Masa Depan',
    jenisInvestasi: 'F&B',
    kategoriUsaha: 'Usaha Kecil',
    investasiAwal: '50000000',
    biayaRenovasi: '25000000',
    biayaPeralatan: '40000000',
    modalKerja: '15000000',
    labaBulan: '8500000',
    labaTahun: '102000000', // 8.5m * 12
    estimasiPertumbuhan: '10',
    hariOperasional: '26',
    jamOperasional: '12',
    estimasiPenjualan: '50',
    simulasiLaba: 0,
  };

  const [form, setForm] = useState<FormState>(initialFormState);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  }, []);

  const handleTextChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCurrencyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericString = value.replace(/[^0-9]/g, '');
    setForm((prev) => ({ ...prev, [name]: numericString }));
  }, []);

  const handleLabaBulanChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseNumber(value);
    setForm((prev) => ({
      ...prev,
      labaBulan: value,
      labaTahun: (numValue * 12).toString(),
    }));
  }, []);

  const handleLabaTahunChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseNumber(value);
    setForm((prev) => ({
      ...prev,
      labaTahun: value,
      labaBulan: Math.round(numValue / 12).toString(),
    }));
  }, []);

  const handleSliderChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, simulasiLaba: parseInt(e.target.value, 10) }));
  }, []);

  const handleReset = useCallback(() => {
    setForm(initialFormState);
    showToast('Seluruh data berhasil di-reset.');
  }, [initialFormState, showToast]);

  const calculations = useMemo(() => {
    // Modal Awal
    const invAwal = parseNumber(form.investasiAwal);
    const renovasi = parseNumber(form.biayaRenovasi);
    const peralatan = parseNumber(form.biayaPeralatan);
    const modalKerja = parseNumber(form.modalKerja);
    const totalInvestasi = invAwal + renovasi + peralatan + modalKerja;

    // Keuntungan Dasar
    const baseLabaBulan = parseNumber(form.labaBulan);

    // Simulasi
    const simulasiMultiplier = 1 + (form.simulasiLaba / 100);
    const simulatedLabaBulan = baseLabaBulan * simulasiMultiplier;
    const simulatedLabaTahun = simulatedLabaBulan * 12;

    // Payback Period (Bulan)
    const paybackMonths = simulatedLabaBulan > 0 ? totalInvestasi / simulatedLabaBulan : Infinity;

    // ROI Tahunan
    const roiTahunan = totalInvestasi > 0 ? (simulatedLabaTahun / totalInvestasi) * 100 : 0;

    // Status Insight
    let status = { text: '', color: '', bg: '', badge: '', insight: '' };
    if (paybackMonths === Infinity) {
      status = { text: 'Belum Lunas', color: 'text-gray-500', bg: 'bg-gray-100', badge: '⚪ Tidak Valid', insight: 'Usaha tidak menghasilkan laba, investasi tidak akan kembali.' };
    } else if (paybackMonths < 12) {
      status = { text: 'Sangat Cepat', color: 'text-emerald-600', bg: 'bg-emerald-100', badge: '🟢 Sangat Cepat', insight: 'Investasi sangat sehat dan cepat kembali. Layak untuk segera dieksekusi atau dipertahankan.' };
    } else if (paybackMonths <= 24) {
      status = { text: 'Baik', color: 'text-blue-600', bg: 'bg-blue-100', badge: '🔵 Baik', insight: 'Investasi sehat dengan durasi pengembalian standar bisnis pada umumnya.' };
    } else if (paybackMonths <= 36) {
      status = { text: 'Cukup Lama', color: 'text-amber-600', bg: 'bg-amber-100', badge: '🟠 Cukup Lama', insight: 'Investasi masih layak tetapi perlu strategi untuk meningkatkan laba bulanan agar lebih cepat.' };
    } else {
      status = { text: 'Terlalu Lama', color: 'text-rose-600', bg: 'bg-rose-100', badge: '🔴 Terlalu Lama', insight: 'Payback period terlalu lama. Evaluasi kembali nilai investasi atau tingkat keuntungan usaha.' };
    }

    // Scenarios (Pesimis -20%, Normal, Optimis +20% dari simulasi saat ini)
    const scenarios: ScenarioResult[] = [
      {
        label: 'Pesimis (-20%)',
        labaBulan: simulatedLabaBulan * 0.8,
        paybackMonths: (simulatedLabaBulan * 0.8) > 0 ? totalInvestasi / (simulatedLabaBulan * 0.8) : Infinity,
        roi: totalInvestasi > 0 ? ((simulatedLabaBulan * 0.8 * 12) / totalInvestasi) * 100 : 0,
        color: 'text-rose-600',
        bg: 'bg-rose-50'
      },
      {
        label: 'Normal',
        labaBulan: simulatedLabaBulan,
        paybackMonths: paybackMonths,
        roi: roiTahunan,
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      {
        label: 'Optimis (+20%)',
        labaBulan: simulatedLabaBulan * 1.2,
        paybackMonths: (simulatedLabaBulan * 1.2) > 0 ? totalInvestasi / (simulatedLabaBulan * 1.2) : Infinity,
        roi: totalInvestasi > 0 ? ((simulatedLabaBulan * 1.2 * 12) / totalInvestasi) * 100 : 0,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
      }
    ];

    // Progress Bar (Max target is 60 months / 5 years for visual scaling)
    const maxMonths = 60;
    const progressPercent = paybackMonths === Infinity ? 0 : Math.min(100, Math.max(0, 100 - ((paybackMonths / maxMonths) * 100)));

    return {
      totalInvestasi,
      simulatedLabaBulan,
      simulatedLabaTahun,
      paybackMonths,
      roiTahunan,
      status,
      scenarios,
      progressPercent
    };
  }, [form]);

  const handleCopy = useCallback(() => {
    const textToCopy = `Ringkasan Kalkulator Payback Period
Nama Investasi: ${form.namaInvestasi}
Total Investasi: ${formatRupiah(calculations.totalInvestasi)}
Laba Bulanan: ${formatRupiah(calculations.simulatedLabaBulan)}
Payback Period: ${formatPaybackPeriod(calculations.paybackMonths)}
ROI Tahunan: ${formatNumber(calculations.roiTahunan)}%
Status: ${calculations.status.text}

Powered by Microtools UMKM`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Ringkasan berhasil disalin.');
    }).catch(() => {
      showToast('Gagal menyalin ringkasan.');
    });
  }, [form.namaInvestasi, calculations, showToast]);

  // Don't render until client to avoid hydration issues
  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-fade-in-up">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">💰</span>
                <h1 className="text-2xl font-bold text-gray-900">Kalkulator Payback Period</h1>
              </div>
              <p className="text-gray-500 text-sm max-w-2xl">Hitung berapa lama waktu yang dibutuhkan agar modal investasi kembali berdasarkan keuntungan usaha.</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-1">Professional Tool</span>
              <span className="text-xs text-gray-400 font-medium">Powered by Microtools UMKM</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN - 65% */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 1: Informasi Investasi */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Informasi Investasi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Investasi</label>
                  <input type="text" name="namaInvestasi" value={form.namaInvestasi} onChange={handleTextChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" placeholder="Cth: Cabang Baru" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Investasi</label>
                  <input type="text" name="jenisInvestasi" value={form.jenisInvestasi} onChange={handleTextChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" placeholder="Cth: F&B" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori Usaha</label>
                  <select name="kategoriUsaha" value={form.kategoriUsaha} onChange={handleTextChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium">
                    <option value="Usaha Mikro">Usaha Mikro</option>
                    <option value="Usaha Kecil">Usaha Kecil</option>
                    <option value="Usaha Menengah">Usaha Menengah</option>
                    <option value="Startup">Startup</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Modal Awal */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Rincian Modal Awal
                </h2>
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold">
                  Total: {formatRupiah(calculations.totalInvestasi)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total Investasi Awal (Dasar)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                    <input type="text" name="investasiAwal" value={formatNumber(parseNumber(form.investasiAwal))} onChange={handleCurrencyChange} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Biaya Renovasi & Bangunan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                    <input type="text" name="biayaRenovasi" value={formatNumber(parseNumber(form.biayaRenovasi))} onChange={handleCurrencyChange} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Biaya Peralatan & Mesin</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                    <input type="text" name="biayaPeralatan" value={formatNumber(parseNumber(form.biayaPeralatan))} onChange={handleCurrencyChange} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Modal Kerja (Bulan-bulan awal)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                    <input type="text" name="modalKerja" value={formatNumber(parseNumber(form.modalKerja))} onChange={handleCurrencyChange} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Keuntungan */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                Asumsi Keuntungan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Laba Bersih / Bulan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                    <input type="text" name="labaBulan" value={formatNumber(parseNumber(form.labaBulan))} onChange={handleLabaBulanChange} className="w-full pl-10 pr-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Laba Bersih / Tahun</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</span>
                    <input type="text" name="labaTahun" value={formatNumber(parseNumber(form.labaTahun))} onChange={handleLabaTahunChange} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estimasi Pertumbuhan Laba</label>
                  <div className="relative">
                    <input type="text" name="estimasiPertumbuhan" value={formatNumber(parseNumber(form.estimasiPertumbuhan))} onChange={handleCurrencyChange} className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Operasional */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Data Operasional
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hari Operasional / Bulan</label>
                  <div className="relative">
                    <input type="text" name="hariOperasional" value={formatNumber(parseNumber(form.hariOperasional))} onChange={handleCurrencyChange} className="w-full pl-4 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Hari</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jam Operasional / Hari</label>
                  <div className="relative">
                    <input type="text" name="jamOperasional" value={formatNumber(parseNumber(form.jamOperasional))} onChange={handleCurrencyChange} className="w-full pl-4 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Jam</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estimasi Penjualan / Hari</label>
                  <div className="relative">
                    <input type="text" name="estimasiPenjualan" value={formatNumber(parseNumber(form.estimasiPenjualan))} onChange={handleCurrencyChange} className="w-full pl-4 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Unit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Simulasi Slider */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
                  Simulasi Realtime
                </h2>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${form.simulasiLaba > 0 ? 'bg-emerald-100 text-emerald-700' : form.simulasiLaba < 0 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                  {form.simulasiLaba > 0 ? '+' : ''}{form.simulasiLaba}% Perubahan Laba
                </span>
              </div>
              <div className="px-2">
                <input 
                  type="range" 
                  min="-30" 
                  max="50" 
                  step="1"
                  value={form.simulasiLaba}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 font-medium mt-2">
                  <span>Pesimis (-30%)</span>
                  <span>Normal (0%)</span>
                  <span>Optimis (+50%)</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-start">
              <button onClick={handleReset} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Reset Seluruh Input
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN - 35% */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Big Hero Card */}
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                </div>
                <h3 className="text-indigo-100 font-semibold text-sm mb-1">Estimasi Payback Period</h3>
                <div className="text-4xl font-extrabold mb-6 tracking-tight">
                  {formatPaybackPeriod(calculations.paybackMonths)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-indigo-500 pt-4">
                  <div>
                    <p className="text-indigo-200 text-xs mb-1">Total Investasi</p>
                    <p className="font-semibold text-sm">{formatRupiah(calculations.totalInvestasi)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs mb-1">Laba Bulanan</p>
                    <p className="font-semibold text-sm">{formatRupiah(calculations.simulatedLabaBulan)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs mb-1">ROI Tahunan</p>
                    <p className="font-semibold text-sm">{formatNumber(calculations.roiTahunan)}%</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs mb-1">Sisa Modal (bln 1)</p>
                    <p className="font-semibold text-sm">{formatRupiah(Math.max(0, calculations.totalInvestasi - calculations.simulatedLabaBulan))}</p>
                  </div>
                </div>
              </div>

              {/* Status & Ringkasan Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Status Kelayakan</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${calculations.status.bg} ${calculations.status.color}`}>
                    {calculations.status.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {calculations.status.insight}
                </p>

                <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Visualisasi Target</h4>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${calculations.progressPercent > 66 ? 'bg-emerald-500' : calculations.progressPercent > 33 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${calculations.progressPercent}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-400">
                  <span>Hari H</span>
                  <span>Lunas ({formatPaybackPeriod(calculations.paybackMonths)})</span>
                  <span>5 Thn (Max)</span>
                </div>
              </div>

              {/* 3 Skenario Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Analisis 3 Skenario
                </h3>
                <div className="space-y-3">
                  {calculations.scenarios.map((sc, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${sc.bg.replace('bg-', 'border-').replace('50', '200')} flex justify-between items-center`}>
                      <div>
                        <p className={`text-xs font-bold ${sc.color} mb-0.5 uppercase`}>{sc.label}</p>
                        <p className="text-xs font-medium text-gray-600">{formatRupiah(sc.labaBulan)} / bln</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-gray-800">{formatPaybackPeriod(sc.paybackMonths)}</p>
                        <p className="text-xs text-gray-500 font-medium">ROI {formatNumber(sc.roi)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rekomendasi Checklist */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Rekomendasi Tindakan</h3>
                <ul className="space-y-2 text-sm text-gray-600 font-medium">
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Tingkatkan laba bersih dengan efisiensi.</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Kurangi biaya operasional yang tidak perlu.</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Optimalkan kapasitas produksi/layanan.</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Tingkatkan volume penjualan per hari.</li>
                  <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Evaluasi investasi tambahan dengan hati-hati.</li>
                </ul>
              </div>

              {/* Copy Button */}
              <button onClick={handleCopy} className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all flex justify-center items-center gap-2 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                Salin Ringkasan
              </button>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-500 text-sm font-medium mb-2">© 2026 Platform Microtools UMKM Indonesia</p>
          <p className="text-gray-400 text-xs max-w-3xl mx-auto leading-relaxed">
            Dirancang khusus untuk membantu UMKM menganalisis kelayakan investasi dan memperkirakan waktu pengembalian modal secara cepat, akurat, dan mudah dipahami.
          </p>
        </div>
      </footer>
    </div>
  );
}