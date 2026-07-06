'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';

// --- TYPES ---
type InvestType = 'Mesin Produksi' | 'Peralatan' | 'Kendaraan' | 'Marketing' | 'Cabang Baru' | 'Franchise' | 'Digital Marketing' | 'Lainnya';
type PeriodType = 'Bulanan' | 'Tahunan';

interface ModalState {
  awal: number;
  instalasi: number;
  pelatihan: number;
  operasional: number;
  lain: number;
}

interface HasilState {
  tambahan: number;
  hemat: number;
  lain: number;
  bulanan: number;
  periodeInvestasi: number;
}

// --- HELPER FUNCTIONS ---
const formatIDR = (num: number): string => {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const parseNum = (str: string): number => {
  const cleanStr = str.replace(/[^0-9]/g, '');
  return cleanStr === '' ? 0 : parseInt(cleanStr, 10);
};

// --- REUSABLE COMPONENTS ---
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200 p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.1)] ${className}`}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-semibold text-slate-700 mb-2">{children}</label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center border-b border-slate-100 pb-4">
    <div className="w-2 h-6 bg-blue-600 rounded-full mr-3"></div>
    {children}
  </h3>
);

// --- MAIN PAGE COMPONENT ---
export default function ROIPage() {
  // --- STATE ---
  const [info, setInfo] = useState({ nama: '', jenis: 'Mesin Produksi' as InvestType });
  const [modal, setModal] = useState<ModalState>({ awal: 0, instalasi: 0, pelatihan: 0, operasional: 0, lain: 0 });
  const [hasil, setHasil] = useState<HasilState>({ tambahan: 0, hemat: 0, lain: 0, bulanan: 0, periodeInvestasi: 12 });
  const [periodeType, setPeriodeType] = useState<PeriodType>('Bulanan');
  const [targetROI, setTargetROI] = useState<number>(20);
  const [simulasi, setSimulasi] = useState<number>(0);
  const [toast, setToast] = useState(false);

  // --- HANDLers ---
  const handleModalChange = (key: keyof ModalState, val: string) => {
    setModal(prev => ({ ...prev, [key]: parseNum(val) }));
  };

  const handleHasilChange = (key: keyof HasilState, val: string) => {
    setHasil(prev => ({ ...prev, [key]: parseNum(val) }));
  };

  const handleReset = () => {
    setInfo({ nama: '', jenis: 'Mesin Produksi' });
    setModal({ awal: 0, instalasi: 0, pelatihan: 0, operasional: 0, lain: 0 });
    setHasil({ tambahan: 0, hemat: 0, lain: 0, bulanan: 0, periodeInvestasi: 12 });
    setPeriodeType('Bulanan');
    setTargetROI(20);
    setSimulasi(0);
  };

  // --- CALCULATIONS (Real-time via useMemo) ---
  const totalInvestasi = useMemo(() => {
    return Object.values(modal).reduce((a, b) => a + b, 0);
  }, [modal]);

  const totalKeuntunganBase = useMemo(() => {
    return hasil.tambahan + hasil.hemat + hasil.lain;
  }, [hasil]);

  const totalKeuntungan = useMemo(() => {
    return totalKeuntunganBase * (1 + simulasi / 100);
  }, [totalKeuntunganBase, simulasi]);

  const profitBersih = useMemo(() => totalKeuntungan - totalInvestasi, [totalKeuntungan, totalInvestasi]);

  const roi = useMemo(() => {
    if (totalInvestasi === 0) return 0;
    const raw = (profitBersih / totalInvestasi) * 100;
    // Cap at 1000% logically for UI scaling, but display actual if needed. Per spec: Max 1000%
    return Math.min(Math.max(raw, -100), 1000); 
  }, [profitBersih, totalInvestasi]);

  const paybackMonths = useMemo(() => {
    if (hasil.bulanan <= 0 || totalInvestasi <= 0) return 0;
    return totalInvestasi / hasil.bulanan;
  }, [totalInvestasi, hasil.bulanan]);

  const formattedPayback = useMemo(() => {
    if (paybackMonths === 0) return 'Belum ada data';
    if (paybackMonths < 1) return `${Math.ceil(paybackMonths * 30)} Hari`;
    if (paybackMonths < 12) return `${paybackMonths.toFixed(1)} Bulan`;
    return `${(paybackMonths / 12).toFixed(1)} Tahun`;
  }, [paybackMonths]);

  const analisis = useMemo(() => {
    if (totalInvestasi === 0) return { title: 'Belum Dihitung', insight: 'Silakan masukkan data modal.', color: 'text-slate-400', bg: 'bg-slate-100', progress: 'bg-slate-300' };
    if (roi < 10) return { title: 'ROI Rendah', insight: 'Investasi ini memiliki margin tipis. Perlu evaluasi efisiensi biaya.', color: 'text-red-600', bg: 'bg-red-50', progress: 'bg-red-500' };
    if (roi < 30) return { title: 'ROI Cukup', insight: 'Keuntungan moderat. Pastikan manajemen risiko dijaga dengan baik.', color: 'text-orange-600', bg: 'bg-orange-50', progress: 'bg-orange-500' };
    if (roi < 60) return { title: 'ROI Baik', insight: 'Investasi solid. Menghasilkan margin keuntungan yang sehat untuk bisnis.', color: 'text-green-600', bg: 'bg-green-50', progress: 'bg-green-500' };
    if (roi <= 100) return { title: 'ROI Sangat Baik', insight: 'Kinerja tinggi. Layak dipertimbangkan untuk ekspansi atau pengulangan.', color: 'text-blue-600', bg: 'bg-blue-50', progress: 'bg-blue-500' };
    return { title: 'ROI Luar Biasa', insight: 'Keuntungan eksponensial. Pastikan validasi data pendapatan tidak over-estimasi.', color: 'text-purple-600', bg: 'bg-purple-50', progress: 'bg-purple-500' };
  }, [roi, totalInvestasi]);

  // Target Calculations
  const getRequiredRevenueForROI = (targetPct: number) => {
    if (totalInvestasi === 0) return 0;
    return totalInvestasi + (totalInvestasi * (targetPct / 100));
  };

  const simPesimis = totalKeuntunganBase * 0.85;
  const simOptimis = totalKeuntunganBase * 1.20;

  // --- COPY TO CLIPBOARD ---
  const handleCopy = () => {
    const text = `
==================================
💹 KALKULATOR ROI SAAS
Investasi: ${info.nama || 'Tanpa Nama'} (${info.jenis})
==================================
Total Modal: ${formatIDR(totalInvestasi)}
Pendapatan: ${formatIDR(totalKeuntungan)}
Profit: ${formatIDR(profitBersih)}
----------------------------------
ROI: ${roi.toFixed(1)}%
Payback: ${formattedPayback}
Status: ${analisis.title}
==================================
`;
    navigator.clipboard.writeText(text).then(() => {
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      
      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-200">
              <span className="text-xl">💹</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Kalkulator ROI</h1>
              <p className="text-xs text-slate-500 font-medium">Analisis profitabilitas bisnis otomatis</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Professional Tool
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        
        {/* Intro */}
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Hitung Return on Investment</h2>
          <p className="text-slate-600 leading-relaxed">
            Estimasi balik modal, keuntungan investasi, dan analisis profitabilitas bisnis Anda secara real-time dengan dashboard tingkat premium.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================= */}
          {/* KOLOM KIRI (65%) - INPUTS                 */}
          {/* ======================================= */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            
            {/* CARD 1: Info */}
            <Card>
              <SectionTitle>Informasi Investasi</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Nama Investasi</Label>
                  <input 
                    type="text" 
                    value={info.nama}
                    onChange={(e) => setInfo({...info, nama: e.target.value})}
                    placeholder="Contoh: Mesin Kopi Espresso"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label>Jenis Investasi</Label>
                  <select 
                    value={info.jenis}
                    onChange={(e) => setInfo({...info, jenis: e.target.value as InvestType})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-800 appearance-none"
                  >
                    <option>Mesin Produksi</option>
                    <option>Peralatan</option>
                    <option>Kendaraan</option>
                    <option>Marketing</option>
                    <option>Cabang Baru</option>
                    <option>Franchise</option>
                    <option>Digital Marketing</option>
                    <option>Lainnya</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* CARD 2: Modal */}
            <Card>
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <div className="w-2 h-6 bg-slate-800 rounded-full mr-3"></div>
                  Modal Investasi
                </h3>
                <div className="text-right">
                  <span className="block text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Modal</span>
                  <span className="text-xl font-black text-slate-900">{formatIDR(totalInvestasi)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Modal Awal / Harga Beli', key: 'awal' },
                  { label: 'Biaya Instalasi', key: 'instalasi' },
                  { label: 'Biaya Pelatihan', key: 'pelatihan' },
                  { label: 'Biaya Operasional Awal', key: 'operasional' },
                  { label: 'Biaya Lainnya', key: 'lain' }
                ].map((item) => (
                  <div key={item.key}>
                    <Label>{item.label}</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-medium font-mono">Rp</span>
                      <input 
                        type="text" 
                        value={modal[item.key as keyof ModalState] === 0 ? '' : modal[item.key as keyof ModalState].toLocaleString('id-ID')}
                        onChange={(e) => handleModalChange(item.key as keyof ModalState, e.target.value)}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-900 font-mono font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* CARD 3: Hasil */}
            <Card>
               <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                  Estimasi Hasil Investasi
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 {[
                  { label: 'Total Pendapatan Tambahan', key: 'tambahan', help: 'Proyeksi total pemasukan ekstra dari investasi ini.' },
                  { label: 'Total Penghematan Biaya', key: 'hemat', help: 'Biaya operasional lama yang berhasil dipangkas.' },
                  { label: 'Nilai/Keuntungan Lain', key: 'lain', help: 'Nilai sisa aset atau benefit finansial lainnya.' },
                ].map((item) => (
                  <div key={item.key}>
                    <div className="flex justify-between items-end mb-2">
                       <label className="block text-sm font-semibold text-slate-700">{item.label}</label>
                    </div>
                    <div className="relative group">
                      <span className="absolute left-4 top-3 text-slate-400 font-medium font-mono">Rp</span>
                      <input 
                        type="text" 
                        value={hasil[item.key as keyof HasilState] === 0 ? '' : hasil[item.key as keyof HasilState].toLocaleString('id-ID')}
                        onChange={(e) => handleHasilChange(item.key as keyof HasilState, e.target.value)}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-900 font-mono font-medium"
                      />
                      {/* Tooltip lite */}
                      <p className="text-[11px] text-slate-500 mt-1">{item.help}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 p-5 rounded-lg">
                 <h4 className="text-sm font-bold text-blue-900 mb-4">Untuk Perhitungan Payback Period:</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Rata-rata Pendapatan / Bulan</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-400 font-medium font-mono">Rp</span>
                        <input 
                          type="text" 
                          value={hasil.bulanan === 0 ? '' : hasil.bulanan.toLocaleString('id-ID')}
                          onChange={(e) => handleHasilChange('bulanan', e.target.value)}
                          placeholder="0"
                          className="w-full pl-12 pr-4 py-3 rounded-lg border border-blue-200 bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-900 font-mono font-medium"
                        />
                      </div>
                    </div>
                 </div>
              </div>
            </Card>

            {/* CARD 4 & 5: Target & Simulasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <SectionTitle>Target ROI Anda</SectionTitle>
                <div className="relative mb-6">
                  <input 
                    type="number" 
                    value={targetROI}
                    onChange={(e) => setTargetROI(Number(e.target.value))}
                    className="w-full px-4 py-3 text-2xl font-black text-slate-900 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-4 top-3 text-2xl text-slate-400 font-black">%</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[10, 20, 30, 50, 100, 200].map(val => (
                    <button 
                      key={val}
                      onClick={() => setTargetROI(val)}
                      className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${targetROI === val ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionTitle>Simulasi Resesi / Boom</SectionTitle>
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>Penyesuaian Pendapatan</span>
                    <span className={simulasi > 0 ? 'text-green-600' : simulasi < 0 ? 'text-red-600' : ''}>
                      {simulasi > 0 ? '+' : ''}{simulasi}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="-20" max="50" step="5"
                    value={simulasi}
                    onChange={(e) => setSimulasi(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>Pesimis (-20%)</span>
                    <span>Normal (0%)</span>
                    <span>Optimis (+50%)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Geser untuk melihat dampak perubahan pendapatan terhadap ROI secara real-time.</p>
              </Card>
            </div>

            {/* CARD 6: Actions */}
            <div className="flex gap-4 mb-10 lg:mb-0">
               {/* Note: In a fully reactive app, 'Hitung' might just scroll down on mobile. We'll make it visual */}
               <button 
                 onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transition-all active:scale-[0.98]"
               >
                 Perbarui Dasbor
               </button>
               <button 
                 onClick={handleReset}
                 className="px-8 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
               >
                 Reset
               </button>
            </div>

          </div>

          {/* ======================================= */}
          {/* KOLOM KANAN (35%) - DASHBOARD STICKY      */}
          {/* ======================================= */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
             <div className="sticky top-28 flex flex-col gap-6 max-h-[calc(100vh-8rem)] overflow-y-auto pb-10 scrollbar-hide">
                
                {/* 1. HASIL UTAMA */}
                <div className="bg-slate-900 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden">
                   {/* Background Decor */}
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
                   <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500 opacity-20 blur-3xl rounded-full"></div>

                   <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6 flex items-center">
                     <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                     Dashboard ROI
                   </h3>

                   <div className="flex flex-col gap-6 relative z-10">
                     <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                        <span className="text-slate-300 font-medium">Return on Investment</span>
                        <div className="text-right">
                          <span className={`text-5xl font-black tracking-tighter ${roi >= 0 ? 'text-white' : 'text-red-400'}`}>
                            {roi.toFixed(1)}<span className="text-3xl">%</span>
                          </span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-xs text-slate-400 mb-1">Profit Bersih</span>
                          <span className={`text-lg font-bold font-mono ${profitBersih >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatIDR(profitBersih)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-slate-400 mb-1">Payback Period</span>
                          <span className="text-lg font-bold text-white">{formattedPayback}</span>
                        </div>
                     </div>
                   </div>
                </div>

                {/* 2. ANALISIS OTOMATIS */}
                <Card className={`border-l-4 ${analisis.progress.replace('bg-', 'border-')}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${analisis.bg}`}>
                      <svg className={`w-5 h-5 ${analisis.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h4 className={`font-bold ${analisis.color}`}>{analisis.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">{analisis.insight}</p>
                </Card>

                {/* 3. BREAKDOWN KOMPOSISI */}
                <Card>
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Komposisi Keuangan</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500">Total Investasi</span>
                        <span className="text-slate-800 font-mono">{formatIDR(totalInvestasi)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-slate-800 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500">Total Pendapatan</span>
                        <span className="text-blue-600 font-mono">{formatIDR(totalKeuntungan)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((totalKeuntungan / (totalInvestasi || 1)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 4. SCENARIO SIMULASI (Mini Cards) */}
                <Card>
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Skenario Pendapatan</h4>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-100">
                        <div>
                          <span className="block text-xs font-bold text-red-800">Pesimis (-15%)</span>
                          <span className="text-xs text-red-600">ROI: {totalInvestasi ? (((simPesimis - totalInvestasi)/totalInvestasi)*100).toFixed(1) : 0}%</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-red-900">{formatIDR(simPesimis - totalInvestasi)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-100 shadow-sm relative">
                        <div className="absolute -left-1.5 -top-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow">⭐ IDEAL</div>
                        <div>
                          <span className="block text-xs font-bold text-green-800 ml-2">Normal (Proyeksi)</span>
                          <span className="text-xs text-green-600 ml-2">ROI: {totalInvestasi ? (((totalKeuntunganBase - totalInvestasi)/totalInvestasi)*100).toFixed(1) : 0}%</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-green-900">{formatIDR(totalKeuntunganBase - totalInvestasi)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div>
                          <span className="block text-xs font-bold text-blue-800">Optimis (+20%)</span>
                          <span className="text-xs text-blue-600">ROI: {totalInvestasi ? (((simOptimis - totalInvestasi)/totalInvestasi)*100).toFixed(1) : 0}%</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-blue-900">{formatIDR(simOptimis - totalInvestasi)}</span>
                     </div>
                  </div>
                </Card>

                {/* 5. TARGET GOALS */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white">
                  <h4 className="text-sm font-bold text-slate-300 mb-4">Jalur Menuju Target {targetROI}%</h4>
                  <p className="text-xs text-slate-400 mb-3">Untuk mencapai ROI target, total pendapatan Anda harus mencapai:</p>
                  <div className="text-2xl font-black text-green-400 font-mono mb-4 border-b border-slate-700 pb-4">
                     {formatIDR(getRequiredRevenueForROI(targetROI))}
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between">
                     <span>Gap Pendapatan Saat Ini:</span>
                     <span className="font-bold text-white font-mono">
                        {totalKeuntungan >= getRequiredRevenueForROI(targetROI) 
                          ? '✅ Tercapai' 
                          : formatIDR(getRequiredRevenueForROI(targetROI) - totalKeuntungan) + ' lagi'
                        }
                     </span>
                  </div>
                </Card>

                {/* 6. SALIN RINGKASAN */}
                <button 
                  onClick={handleCopy}
                  className="w-full py-4 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-700 font-bold hover:bg-slate-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  Salin Ringkasan
                </button>

             </div>
          </div>

        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 z-50 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span className="text-sm font-bold">Ringkasan berhasil disalin!</span>
      </div>

    </div>
  );
}