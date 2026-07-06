'use client';

import React, { useState, useMemo, useEffect } from 'react';

// --- INTERFACES ---
interface FormState {
  namaUsaha: string;
  jenisUsaha: string;
  kategori: string;
  omzetHarian: number;
  hariOperasional: number;
  hppBahanBaku: number;
  hppLainnya: number;
  gaji: number;
  sewa: number;
  listrik: number;
  air: number;
  internet: number;
  transportasi: number;
  opsLainnya: number;
  persenPajak: number;
  persenCadangan: number;
  simulasiOmzet: number;
}

interface FinancialResult {
  omzet: number;
  hpp: number;
  ops: number;
  pajak: number;
  cadangan: number;
  totalBiaya: number; // HPP + Ops
  totalPotongan: number; // HPP + Ops + Pajak + Cadangan
  profitBersih: number;
  margin: number;
}

// --- INITIAL STATE ---
const initialState: FormState = {
  namaUsaha: '',
  jenisUsaha: '',
  kategori: 'Makanan & Minuman',
  omzetHarian: 1500000,
  hariOperasional: 26,
  hppBahanBaku: 10000000,
  hppLainnya: 2000000,
  gaji: 5000000,
  sewa: 2000000,
  listrik: 500000,
  air: 100000,
  internet: 350000,
  transportasi: 500000,
  opsLainnya: 500000,
  persenPajak: 0.5, // UMKM 0.5%
  persenCadangan: 10,
  simulasiOmzet: 0,
};

// --- UTILS ---
const formatRupiah = (angka: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};

const formatNumber = (angka: number): string => {
  return new Intl.NumberFormat('id-ID').format(angka);
};

const parseRupiahInput = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

// --- MAIN COMPONENT ---
export default function EstimasiProfitBulananPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- HANDLERS ---
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseRupiahInput(value) }));
  };

  const handleFloatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const val = parseFloat(value);
    setForm((prev) => ({ ...prev, [name]: isNaN(val) ? 0 : val }));
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, simulasiOmzet: parseInt(e.target.value, 10) }));
  };

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

  const handleReset = () => {
    setForm(initialState);
    triggerToast('Seluruh data berhasil di-reset.');
  };

  // --- CALCULATIONS (useMemo) ---
  const calculateResult = (customSimulasi?: number): FinancialResult => {
    const omzetBulananAwal = form.omzetHarian * form.hariOperasional;
    const hppAwal = form.hppBahanBaku + form.hppLainnya;
    const totalOps =
      form.gaji +
      form.sewa +
      form.listrik +
      form.air +
      form.internet +
      form.transportasi +
      form.opsLainnya;

    const simulasi = customSimulasi !== undefined ? customSimulasi : form.simulasiOmzet;
    const multiplier = 1 + simulasi / 100;

    // Asumsi HPP berbanding lurus dengan omzet, operasional tetap
    const omzet = omzetBulananAwal * multiplier;
    const hpp = hppAwal * multiplier;
    const totalBiaya = hpp + totalOps;

    const profitKotor = omzet - totalBiaya;
    const pajak = profitKotor > 0 ? (form.persenPajak / 100) * profitKotor : 0;
    const profitSetelahPajak = profitKotor - pajak;
    const cadangan = profitSetelahPajak > 0 ? (form.persenCadangan / 100) * profitSetelahPajak : 0;
    const profitBersih = profitSetelahPajak - cadangan;
    const margin = omzet > 0 ? (profitBersih / omzet) * 100 : 0;
    const totalPotongan = totalBiaya + pajak + cadangan;

    return {
      omzet,
      hpp,
      ops: totalOps,
      pajak,
      cadangan,
      totalBiaya,
      totalPotongan,
      profitBersih,
      margin,
    };
  };

  const currentResult = useMemo(() => calculateResult(), [form]);
  const pesimisResult = useMemo(() => calculateResult(-20), [form]);
  const normalResult = useMemo(() => calculateResult(0), [form]);
  const optimisResult = useMemo(() => calculateResult(50), [form]);

  // --- STATUS & INSIGHTS ---
  const { statusLabel, statusColor, insightText } = useMemo(() => {
    const margin = currentResult.margin;
    if (margin > 30) {
      return {
        statusLabel: '🟢 Sangat Sehat',
        statusColor: 'text-green-600',
        insightText: 'Profit usaha sangat sehat. Pertahankan efisiensi atau pertimbangkan ekspansi bisnis.',
      };
    } else if (margin >= 20) {
      return {
        statusLabel: '🔵 Baik',
        statusColor: 'text-blue-600',
        insightText: 'Kondisi finansial baik dan stabil. Jaga performa penjualan Anda.',
      };
    } else if (margin >= 10) {
      return {
        statusLabel: '🟠 Tipis',
        statusColor: 'text-orange-600',
        insightText: 'Margin mulai menurun, segera evaluasi dan tekan biaya operasional Anda.',
      };
    } else if (margin >= 0) {
      return {
        statusLabel: '🔴 Berisiko',
        statusColor: 'text-red-600',
        insightText: 'Keuntungan sangat berisiko. Evaluasi ulang HPP dan naikkan harga jual jika perlu.',
      };
    } else {
      return {
        statusLabel: '⚫ Rugi',
        statusColor: 'text-gray-800',
        insightText: 'Usaha mengalami kerugian. Segera evaluasi HPP atau tingkatkan omzet harian.',
      };
    }
  }, [currentResult.margin]);

  const rekomendasi = useMemo(() => {
    const margin = currentResult.margin;
    const hppRatio = currentResult.omzet > 0 ? currentResult.hpp / currentResult.omzet : 0;
    const opsRatio = currentResult.omzet > 0 ? currentResult.ops / currentResult.omzet : 0;
    
    const recs: string[] = [];
    if (margin < 0) recs.push('Segera periksa penyebab kerugian utama (HPP atau Operasional)');
    if (hppRatio > 0.5) recs.push('Negosiasi harga dengan supplier untuk menekan bahan baku');
    if (opsRatio > 0.3) recs.push('Kurangi biaya operasional yang tidak produktif');
    if (margin < 20 && margin >= 0) recs.push('Tingkatkan volume penjualan / efisiensi promosi');
    if (currentResult.profitBersih > 0) recs.push('Pertahankan alokasi dana cadangan bulanan');
    if (recs.length === 0) recs.push('Pertahankan performa bisnis yang efisien ini');
    
    return recs;
  }, [currentResult]);

  // --- COPY HANDLER ---
  const handleCopy = async () => {
    const textToCopy = `Ringkasan Estimasi Profit Bulanan:
Nama Usaha: ${form.namaUsaha || 'Tanpa Nama'}
Omzet Bulanan: ${formatRupiah(currentResult.omzet)}
Total Biaya (HPP + Ops): ${formatRupiah(currentResult.totalBiaya)}
Profit Bersih: ${formatRupiah(currentResult.profitBersih)}
Margin Profit: ${currentResult.margin.toFixed(2)}%
Status: ${statusLabel.replace(/[^a-zA-Z ]/g, '').trim()}
Dihitung menggunakan Microtools UMKM`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      triggerToast('Ringkasan berhasil disalin.');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-16">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all duration-300">
          <span>✅</span>
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  Kalkulator Estimasi Profit Bulanan
                </h1>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                  Hitung estimasi laba bersih bulanan berdasarkan omzet, HPP, dan biaya operasional secara otomatis.
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* KOLOM KIRI (65%) */}
          <div className="w-full lg:w-[65%] space-y-6">
            
            {/* Card 1: Informasi Usaha */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition-shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Informasi Usaha</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="namaUsaha" className="block text-sm font-medium text-gray-700 mb-1">Nama Usaha</label>
                  <input
                    type="text"
                    id="namaUsaha"
                    name="namaUsaha"
                    value={form.namaUsaha}
                    onChange={handleTextChange}
                    placeholder="Cth: Kedai Kopi"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="jenisUsaha" className="block text-sm font-medium text-gray-700 mb-1">Jenis Usaha</label>
                  <input
                    type="text"
                    id="jenisUsaha"
                    name="jenisUsaha"
                    value={form.jenisUsaha}
                    onChange={handleTextChange}
                    placeholder="Cth: F&B"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    id="kategori"
                    name="kategori"
                    value={form.kategori}
                    onChange={handleTextChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    <option value="Makanan & Minuman">Makanan & Minuman</option>
                    <option value="Retail">Retail</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Card 2: Penjualan */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition-shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Penjualan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="omzetHarian" className="block text-sm font-medium text-gray-700 mb-1">Omzet Harian (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">Rp</span>
                    <input
                      type="text"
                      id="omzetHarian"
                      name="omzetHarian"
                      value={form.omzetHarian === 0 ? '' : formatNumber(form.omzetHarian)}
                      onChange={handleNumberChange}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="hariOperasional" className="block text-sm font-medium text-gray-700 mb-1">Hari Operasional per Bulan</label>
                  <input
                    type="number"
                    id="hariOperasional"
                    name="hariOperasional"
                    value={form.hariOperasional === 0 ? '' : form.hariOperasional}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setForm(p => ({ ...p, hariOperasional: isNaN(val) ? 0 : val > 31 ? 31 : val }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-800">Estimasi Omzet Bulanan Dasar:</span>
                <span className="font-bold text-indigo-900">{formatRupiah(form.omzetHarian * form.hariOperasional)}</span>
              </div>
            </section>

            {/* Card 3: Biaya Produksi / HPP */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition-shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Biaya Produksi (HPP Bulanan)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hppBahanBaku" className="block text-sm font-medium text-gray-700 mb-1">Biaya Bahan Baku (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">Rp</span>
                    <input
                      type="text"
                      id="hppBahanBaku"
                      name="hppBahanBaku"
                      value={form.hppBahanBaku === 0 ? '' : formatNumber(form.hppBahanBaku)}
                      onChange={handleNumberChange}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="hppLainnya" className="block text-sm font-medium text-gray-700 mb-1">Biaya Produksi Lain (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">Rp</span>
                    <input
                      type="text"
                      id="hppLainnya"
                      name="hppLainnya"
                      value={form.hppLainnya === 0 ? '' : formatNumber(form.hppLainnya)}
                      onChange={handleNumberChange}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total HPP Bulanan Dasar:</span>
                <span className="font-bold text-gray-900">{formatRupiah(form.hppBahanBaku + form.hppLainnya)}</span>
              </div>
            </section>

            {/* Card 4: Biaya Operasional */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition-shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Biaya Operasional Bulanan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Gaji Karyawan', name: 'gaji', value: form.gaji },
                  { label: 'Sewa Tempat', name: 'sewa', value: form.sewa },
                  { label: 'Listrik', name: 'listrik', value: form.listrik },
                  { label: 'Air', name: 'air', value: form.air },
                  { label: 'Internet', name: 'internet', value: form.internet },
                  { label: 'Transportasi', name: 'transportasi', value: form.transportasi },
                  { label: 'Biaya Lainnya', name: 'opsLainnya', value: form.opsLainnya },
                ].map((item) => (
                  <div key={item.name}>
                    <label htmlFor={item.name} className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">Rp</span>
                      <input
                        type="text"
                        id={item.name}
                        name={item.name}
                        value={item.value === 0 ? '' : formatNumber(item.value)}
                        onChange={handleNumberChange}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Biaya Operasional:</span>
                <span className="font-bold text-gray-900">
                  {formatRupiah(form.gaji + form.sewa + form.listrik + form.air + form.internet + form.transportasi + form.opsLainnya)}
                </span>
              </div>
            </section>

            {/* Card 5: Pajak & Cadangan */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition-shadow">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Pajak & Dana Cadangan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="persenPajak" className="block text-sm font-medium text-gray-700 mb-1">Pajak Usaha (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      id="persenPajak"
                      name="persenPajak"
                      value={form.persenPajak === 0 ? '' : form.persenPajak}
                      onChange={handleFloatChange}
                      className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="persenCadangan" className="block text-sm font-medium text-gray-700 mb-1">Dana Cadangan (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      id="persenCadangan"
                      name="persenCadangan"
                      value={form.persenCadangan === 0 ? '' : form.persenCadangan}
                      onChange={handleFloatChange}
                      className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 6: Simulasi */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow transition-shadow">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-900">Simulasi Perubahan Omzet</h2>
                <span className={`text-sm font-bold px-2 py-1 rounded-md ${form.simulasiOmzet > 0 ? 'bg-green-100 text-green-700' : form.simulasiOmzet < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {form.simulasiOmzet > 0 ? '+' : ''}{form.simulasiOmzet}%
                </span>
              </div>
              <div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="5"
                  value={form.simulasiOmzet}
                  onChange={handleRangeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>-20% (Turun)</span>
                  <span>0% (Normal)</span>
                  <span>+50% (Naik)</span>
                </div>
              </div>
            </section>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
            >
              Reset Seluruh Input
            </button>

          </div>

          {/* KOLOM KANAN (DASHBOARD STICKY 35%) */}
          <div className="w-full lg:w-[35%] lg:sticky lg:top-[90px] lg:h-[calc(100vh-120px)] overflow-y-auto hidden-scrollbar space-y-6 pb-10">
            
            {/* Card Besar: Estimasi Profit */}
            <div className="bg-indigo-600 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-indigo-500 opacity-50 blur-2xl"></div>
              <h2 className="text-sm font-semibold text-indigo-100 uppercase tracking-wider mb-2">Estimasi Profit Bersih</h2>
              <p className={`text-3xl font-extrabold mb-6 tracking-tight ${currentResult.profitBersih < 0 ? 'text-red-300' : 'text-white'}`}>
                {formatRupiah(currentResult.profitBersih)}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-indigo-200">Total Omzet</p>
                  <p className="font-semibold">{formatRupiah(currentResult.omzet)}</p>
                </div>
                <div>
                  <p className="text-indigo-200">Margin Profit</p>
                  <p className="font-semibold">{currentResult.margin.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-indigo-200">Total Biaya</p>
                  <p className="font-semibold">{formatRupiah(currentResult.totalBiaya)}</p>
                </div>
                <div>
                  <p className="text-indigo-200">Status</p>
                  <p className="font-semibold">{statusLabel}</p>
                </div>
              </div>
            </div>

            {/* Breakdown Profit */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Breakdown Aliran Kas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Omzet Bulanan</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(currentResult.omzet)}</span>
                </div>
                <div className="flex justify-center text-gray-400 text-xs">↓ dikurangi</div>
                <div className="flex justify-between items-center">
                  <span className="text-red-500">HPP (Produksi)</span>
                  <span className="font-medium text-red-600">- {formatRupiah(currentResult.hpp)}</span>
                </div>
                <div className="flex justify-center text-gray-400 text-xs">↓ dikurangi</div>
                <div className="flex justify-between items-center">
                  <span className="text-red-500">Biaya Operasional</span>
                  <span className="font-medium text-red-600">- {formatRupiah(currentResult.ops)}</span>
                </div>
                <div className="flex justify-center text-gray-400 text-xs">↓ dikurangi</div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-500">Pajak ({form.persenPajak}%)</span>
                  <span className="font-medium text-orange-600">- {formatRupiah(currentResult.pajak)}</span>
                </div>
                <div className="flex justify-center text-gray-400 text-xs">↓ dikurangi</div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-500">Dana Cadangan ({form.persenCadangan}%)</span>
                  <span className="font-medium text-blue-600">- {formatRupiah(currentResult.cadangan)}</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Profit Bersih</span>
                  <span className={`font-bold ${currentResult.profitBersih < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatRupiah(currentResult.profitBersih)}
                  </span>
                </div>
              </div>
            </div>

            {/* Visualisasi Margin & Insight */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-3">Status Profitabilitas</h3>
              
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>0%</span>
                <span className={statusColor}>{currentResult.margin.toFixed(2)}% Margin</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full ${
                    currentResult.margin > 30 ? 'bg-green-500' : 
                    currentResult.margin >= 20 ? 'bg-blue-500' : 
                    currentResult.margin >= 10 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(Math.max(currentResult.margin, 0), 100)}%` }}
                ></div>
              </div>
              
              <div className={`text-sm p-3 rounded-lg border ${
                currentResult.margin > 30 ? 'bg-green-50 border-green-100 text-green-800' : 
                currentResult.margin >= 20 ? 'bg-blue-50 border-blue-100 text-blue-800' : 
                currentResult.margin >= 10 ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-red-50 border-red-100 text-red-800'
              }`}>
                <span className="font-semibold block mb-1">Insight Otomatis:</span>
                {insightText}
              </div>
            </div>

            {/* Visual Profit Horizontal Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Proporsi Pengeluaran</h3>
              
              <div className="w-full flex h-6 rounded-md overflow-hidden mb-2">
                {currentResult.omzet > 0 ? (
                  <>
                    <div className="bg-red-400 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${(currentResult.totalPotongan / currentResult.omzet) * 100}%` }}>Biaya</div>
                    <div className="bg-green-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${Math.max(currentResult.margin, 0)}%` }}>Profit</div>
                  </>
                ) : (
                  <div className="w-full bg-gray-200"></div>
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span> Total Biaya/Potongan</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Profit Bersih</span>
              </div>
            </div>

            {/* Analisis 3 Skenario */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Analisis 3 Skenario</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 rounded-tl-lg">Skenario</th>
                      <th className="px-2 py-2">Omzet</th>
                      <th className="px-2 py-2">Profit</th>
                      <th className="px-2 py-2 rounded-tr-lg">Mrgn</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-2 py-2 font-medium text-red-600">Pesimis (-20%)</td>
                      <td className="px-2 py-2">{formatRupiah(pesimisResult.omzet)}</td>
                      <td className="px-2 py-2">{formatRupiah(pesimisResult.profitBersih)}</td>
                      <td className="px-2 py-2">{pesimisResult.margin.toFixed(1)}%</td>
                    </tr>
                    <tr className="border-b bg-blue-50/30">
                      <td className="px-2 py-2 font-medium text-blue-600">Normal (0%)</td>
                      <td className="px-2 py-2">{formatRupiah(normalResult.omzet)}</td>
                      <td className="px-2 py-2">{formatRupiah(normalResult.profitBersih)}</td>
                      <td className="px-2 py-2">{normalResult.margin.toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-medium text-green-600">Optimis (+50%)</td>
                      <td className="px-2 py-2">{formatRupiah(optimisResult.omzet)}</td>
                      <td className="px-2 py-2">{formatRupiah(optimisResult.profitBersih)}</td>
                      <td className="px-2 py-2">{optimisResult.margin.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rekomendasi Checklist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">Rekomendasi Tindakan</h3>
              <ul className="space-y-2">
                {rekomendasi.map((rek, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <span className="text-green-500 mr-2 font-bold">✔</span>
                    <span>{rek}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              <span>📋</span> Salin Ringkasan
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-gray-500 font-medium">
            © 2026 Platform Microtools UMKM Indonesia
          </p>
          <p className="text-xs text-gray-400 mt-2 max-w-3xl mx-auto">
            Dirancang khusus untuk membantu UMKM memantau profit usaha, mengevaluasi biaya, dan mengambil keputusan bisnis berdasarkan data finansial yang akurat.
          </p>
        </div>
      </footer>

      {/* STYLES UTILITY UNTUK SCROLLBAR KANAN */}
      <style dangerouslySetInnerHTML={{__html: `
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