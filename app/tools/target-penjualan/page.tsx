'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// --- TYPES & INTERFACES ---
interface BusinessData {
  businessName: string;
  productName: string;
  category: string;
  targetOmzet: string;
  hargaJual: string;
  targetLaba: string;
  periode: string;
  hariOperasional: string;
  jamOperasional: string;
  rataPelanggan: string;
  currentSales: string;
  currentUnits: string;
  desiredGrowth: string;
  simulationSlider: number;
}

interface ToastState {
  show: boolean;
  message: string;
}

const CATEGORIES = ['Makanan', 'Minuman', 'Fashion', 'Jasa', 'Kerajinan', 'Digital', 'Lainnya'];
const PERIODES = ['Harian', 'Mingguan', 'Bulanan', 'Tahunan'];

// --- FORMATTERS ---
const formatIDR = (value: number): string => {
  if (Number.isNaN(value) || !isFinite(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  if (Number.isNaN(value) || !isFinite(value)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(value);
};

// --- SVG ICONS ---
const Icons = {
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Briefcase: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
};

// --- REUSABLE COMPONENTS ---
interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  prefix?: string;
  suffix?: string;
}

const InputGroup = React.memo(({ label, value, onChange, type = 'text', prefix = '', suffix = '' }: InputGroupProps) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-gray-500 text-sm">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block text-sm transition-all hover:border-gray-300 shadow-sm ${prefix ? 'pl-10' : 'pl-3'} ${suffix ? 'pr-12' : 'pr-3'} py-2.5`}
      />
      {suffix && <span className="absolute right-3 text-gray-500 text-sm">{suffix}</span>}
    </div>
  </div>
));
InputGroup.displayName = 'InputGroup';

// --- MAIN PAGE ---
export default function TargetPenjualanPage() {
  // --- STATE ---
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [data, setData] = useState<BusinessData>({
    businessName: 'Toko Kopi Senja',
    productName: 'Kopi Susu Gula Aren',
    category: 'Minuman',
    targetOmzet: '50000000',
    hargaJual: '25000',
    targetLaba: '15000000',
    periode: 'Bulanan',
    hariOperasional: '26',
    jamOperasional: '10',
    rataPelanggan: '40',
    currentSales: '35000000',
    currentUnits: '1400',
    desiredGrowth: '20',
    simulationSlider: 0,
  });

  // --- CLEANUP MEMORY LEAK ---
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // --- SAFE PARSER HELPER ---
  const parseSafe = useCallback((val: string, min = 0, max = Infinity): number => {
    if (!val || val.trim() === '') return 0; // Empty string is safely 0 for calculation
    const parsed = Number(val);
    if (Number.isNaN(parsed)) return 0;
    return Math.min(Math.max(min, parsed), max);
  }, []);

  // --- CORE CALCULATIONS ---
  const results = useMemo(() => {
    const rawOmzet = parseSafe(data.targetOmzet);
    const rawLaba = parseSafe(data.targetLaba);
    const curSales = parseSafe(data.currentSales);
    
    // Validasi pembagi tidak boleh 0 (minimal 1)
    const harga = parseSafe(data.hargaJual, 1);
    const hariOp = parseSafe(data.hariOperasional, 1);
    const jamOp = parseSafe(data.jamOperasional, 1, 24); // Maksimal 24 jam
    const pelanggan = parseSafe(data.rataPelanggan, 1);

    // 1. Simulasi Slider (-20% to +50%)
    const multiplier = 1 + ((data.simulationSlider || 0) / 100);
    const simulatedOmzet = rawOmzet * multiplier;
    
    const marginLaba = rawOmzet > 0 ? (rawLaba / rawOmzet) : 0;
    const simulatedLaba = simulatedOmzet * marginLaba;

    // 2. Unit Logic (Berdasarkan periode utama)
    const targetUnitPeriod = simulatedOmzet / harga;

    // 3. Time Breakdown & Projections (Fix Logika Periode)
    const targetHarian = targetUnitPeriod / hariOp;
    
    let targetMingguan = targetHarian * 7;
    let targetBulanan = targetHarian * 30;

    // Sesuaikan proyeksi breakdown berdasarkan periode yang dipilih pengguna
    if (data.periode === 'Mingguan') {
      targetMingguan = targetUnitPeriod;
      targetBulanan = targetMingguan * 4.33; // Rata-rata minggu dalam sebulan
    } else if (data.periode === 'Bulanan') {
      targetBulanan = targetUnitPeriod;
    } else if (data.periode === 'Tahunan') {
      targetBulanan = targetUnitPeriod / 12;
      targetMingguan = targetUnitPeriod / 52;
    }

    // 4. Productivity
    const targetPerJam = targetHarian / jamOp;
    const targetPerPelanggan = targetHarian / pelanggan;

    // 5. Analysis Logic
    let status = 'Ringan';
    let insight = 'Target harian masih realistis untuk UMKM.';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let progressBarColor = 'bg-emerald-500';

    if (targetHarian >= 10 && targetHarian < 30) {
      status = 'Normal';
      insight = 'Target ideal. Diperlukan konsistensi pemasaran harian.';
      statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
      progressBarColor = 'bg-blue-500';
    } else if (targetHarian >= 30 && targetHarian < 75) {
      status = 'Padat';
      insight = 'Diperlukan peningkatan jumlah pelanggan agar target tercapai.';
      statusColor = 'text-yellow-700 bg-yellow-50 border-yellow-200';
      progressBarColor = 'bg-yellow-500';
    } else if (targetHarian >= 75 && targetHarian <= 150) {
      status = 'Tinggi';
      insight = 'Pertimbangkan menaikkan harga jual atau jam operasional.';
      statusColor = 'text-orange-700 bg-orange-50 border-orange-200';
      progressBarColor = 'bg-orange-500';
    } else if (targetHarian > 150) {
      status = 'Sangat Tinggi';
      insight = 'Target sangat ambisius. Dibutuhkan ekspansi tim atau cabang baru.';
      statusColor = 'text-red-700 bg-red-50 border-red-200';
      progressBarColor = 'bg-red-500';
    }

    // 6. Visual Progress (Mencegah Infinity & NaN)
    let progressPercent = 0;
    if (simulatedOmzet > 0 && curSales > 0) {
      progressPercent = Math.min(100, (curSales / simulatedOmzet) * 100);
    }
    const isCompleted = progressPercent >= 100;

    // 7. Scenarios Logic
    const scenarios = {
      pesimis: {
        omzet: targetUnitPeriod * 0.8 * harga,
        unit: targetUnitPeriod * 0.8,
        laba: (targetUnitPeriod * 0.8 * harga) * marginLaba
      },
      normal: {
        omzet: targetUnitPeriod * harga,
        unit: targetUnitPeriod,
        laba: simulatedLaba
      },
      optimis: {
        omzet: targetUnitPeriod * 1.2 * harga,
        unit: targetUnitPeriod * 1.2,
        laba: (targetUnitPeriod * 1.2 * harga) * marginLaba
      }
    };

    // 8. Rekomendasi
    const minOmzetHarian = simulatedOmzet / hariOp;
    const minTransaksi = targetHarian;

    return {
      simulatedOmzet,
      simulatedLaba,
      targetUnit: targetUnitPeriod,
      targetHarian,
      targetMingguan,
      targetBulanan,
      targetPerJam,
      targetPerPelanggan,
      status,
      insight,
      statusColor,
      progressBarColor,
      progressPercent,
      isCompleted,
      scenarios,
      minOmzetHarian,
      minTransaksi,
      harga,
      curSales
    };
  }, [data, parseSafe]);

  // --- HANDLERS ---
  const handleInputChange = useCallback((field: keyof BusinessData, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setData({
      businessName: '',
      productName: '',
      category: 'Makanan',
      targetOmzet: '',
      hargaJual: '',
      targetLaba: '',
      periode: 'Bulanan',
      hariOperasional: '',
      jamOperasional: '',
      rataPelanggan: '',
      currentSales: '',
      currentUnits: '',
      desiredGrowth: '',
      simulationSlider: 0,
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, message: msg });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = `==================================
🎯 TARGET PENJUALAN
Bisnis: ${data.businessName || '-'}
Produk: ${data.productName || '-'}
----------------------------------
Target Omzet: ${formatIDR(results.simulatedOmzet)}
Target Unit: ${formatNumber(results.targetUnit)} Produk
----------------------------------
Target Harian: ${formatNumber(results.targetHarian)} Produk/hari
Target Mingguan: ${formatNumber(results.targetMingguan)} Produk/minggu
----------------------------------
Status: ${results.status}
Insight: ${results.insight}
==================================`;

    // Fallback Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Ringkasan berhasil disalin.');
      } catch (err) {
        console.error('Failed to copy via clipboard API', err);
      }
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // hindari scroll
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Ringkasan berhasil disalin.');
      } catch (err) {
        console.error('Gagal menyalin teks', err);
      }
      textArea.remove();
    }
  }, [data, results, showToast]);

  return (
    <div suppressHydrationWarning className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Kalkulator Target Penjualan</h1>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 uppercase tracking-wider hidden sm:inline-block">
                  Professional Tool
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
                Rencanakan target omzet, unit, dan harian otomatis untuk UMKM.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <div className="bg-green-500/20 text-green-400 rounded-full p-1"><Icons.Check /></div>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: INPUTS (±65% -> col-span-7)                                    */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* CARD 1: INFORMASI BISNIS */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Briefcase /></div>
                <h2 className="text-lg font-semibold tracking-tight">Informasi Bisnis</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label="Nama Bisnis" value={data.businessName} onChange={(v) => handleInputChange('businessName', v)} />
                <InputGroup label="Nama Produk" value={data.productName} onChange={(v) => handleInputChange('productName', v)} />
                <div className="flex flex-col gap-1.5 w-full sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Kategori Bisnis</label>
                  <select 
                    value={data.category} 
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block text-sm py-2.5 px-3 hover:border-gray-300 shadow-sm transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* CARD 2: TARGET PENJUALAN */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Target /></div>
                <h2 className="text-lg font-semibold tracking-tight">Target Keuangan</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup type="number" label="Target Omzet" value={data.targetOmzet} onChange={(v) => handleInputChange('targetOmzet', v)} prefix="Rp" />
                <InputGroup type="number" label="Harga Jual per Produk" value={data.hargaJual} onChange={(v) => handleInputChange('hargaJual', v)} prefix="Rp" />
                <InputGroup type="number" label="Target Laba (Opsional)" value={data.targetLaba} onChange={(v) => handleInputChange('targetLaba', v)} prefix="Rp" />
                
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-medium text-gray-700">Periode Target</label>
                  <select 
                    value={data.periode} 
                    onChange={(e) => handleInputChange('periode', e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block text-sm py-2.5 px-3 hover:border-gray-300 shadow-sm transition-colors cursor-pointer"
                  >
                    {PERIODES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* CARD 3: HARI OPERASIONAL */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
               <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Clock /></div>
                <h2 className="text-lg font-semibold tracking-tight">Kapasitas Operasional</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <InputGroup type="number" label="Hari Operasional" value={data.hariOperasional} onChange={(v) => handleInputChange('hariOperasional', v)} suffix="Hari" />
                <InputGroup type="number" label="Jam per Hari" value={data.jamOperasional} onChange={(v) => handleInputChange('jamOperasional', v)} suffix="Jam" />
                <InputGroup type="number" label="Rata-rata Pelanggan" value={data.rataPelanggan} onChange={(v) => handleInputChange('rataPelanggan', v)} suffix="Orang" />
              </div>
            </section>

            {/* CARD 4: KONDISI SAAT INI */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.TrendingUp /></div>
                <h2 className="text-lg font-semibold tracking-tight">Kondisi Penjualan Saat Ini</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <InputGroup type="number" label="Penjualan Saat Ini" value={data.currentSales} onChange={(v) => handleInputChange('currentSales', v)} prefix="Rp" />
                <InputGroup type="number" label="Unit Terjual Saat Ini" value={data.currentUnits} onChange={(v) => handleInputChange('currentUnits', v)} suffix="Unit" />
                <InputGroup type="number" label="Target Pertumbuhan" value={data.desiredGrowth} onChange={(v) => handleInputChange('desiredGrowth', v)} suffix="%" />
              </div>
            </section>

             {/* CARD 5: SIMULASI SLIDER */}
             <section className="bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 p-6 text-white relative overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-600/30">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-blue-800 opacity-20 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-lg font-semibold mb-1">Simulasi Target (Real-time)</h2>
                <p className="text-blue-200 text-sm mb-6">Geser slider untuk melihat dampak perubahan omzet secara langsung di dashboard kanan.</p>
                
                <div className="flex flex-col gap-5 bg-blue-700/40 p-5 rounded-xl border border-blue-500/50 backdrop-blur-sm">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold bg-blue-800/80 px-2.5 py-1 rounded shadow-sm">-20%</span>
                    <div className="text-center">
                      <span className="text-3xl font-extrabold tracking-tight">{data.simulationSlider > 0 ? '+' : ''}{data.simulationSlider}%</span>
                      <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold mt-1">Penyesuaian Omzet</p>
                    </div>
                    <span className="text-xs font-semibold bg-blue-800/80 px-2.5 py-1 rounded shadow-sm">+50%</span>
                  </div>
                  <input 
                    type="range" min="-20" max="50" step="5"
                    value={data.simulationSlider} 
                    onChange={(e) => handleInputChange('simulationSlider', Number(e.target.value))}
                    className="w-full h-2 bg-blue-900/60 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
            </section>

            {/* CARD 6: AKSI */}
            <section className="flex gap-4 pt-2">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
              >
                Lihat Hasil Kalkulasi
              </button>
              <button 
                onClick={handleReset} 
                className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] shadow-sm"
              >
                Reset Semua
              </button>
            </section>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: STICKY DASHBOARD (±35% -> col-span-5)                         */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="sticky top-28 space-y-6">
              
              {/* CARD HASIL */}
              <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-200 overflow-hidden">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 tracking-tight">Dashboard Target Penjualan</h3>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Highlight Unit */}
                  <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100 transition-all transform hover:scale-[1.02] hover:shadow-md cursor-default">
                    <div className="text-4xl mb-3 animate-bounce" style={{animationDuration: '2s'}}>🎯</div>
                    <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-widest">Target Unit</p>
                    <h4 className="text-4xl sm:text-5xl font-extrabold text-blue-900 tracking-tight">
                      {formatNumber(results.targetUnit)}
                    </h4>
                    <p className="text-sm font-medium text-blue-700/70 mt-2">Produk / {data.periode}</p>
                  </div>

                  {/* Financials */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Target Omzet</p>
                      <p className="font-bold text-gray-900 truncate" title={formatIDR(results.simulatedOmzet)}>{formatIDR(results.simulatedOmzet)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Harga Jual</p>
                      <p className="font-bold text-gray-900 truncate" title={formatIDR(results.harga)}>{formatIDR(results.harga)}</p>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Time Breakdown */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></div>Target per Hari
                      </span>
                      <span className="font-bold text-gray-900">{formatNumber(results.targetHarian)} <span className="text-xs text-gray-400 font-medium">unit</span></span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:scale-150 transition-transform"></div>Target per Minggu
                      </span>
                      <span className="font-bold text-gray-900">{formatNumber(results.targetMingguan)} <span className="text-xs text-gray-400 font-medium">unit</span></span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-300 group-hover:scale-150 transition-transform"></div>Target per Bulan
                      </span>
                      <span className="font-bold text-gray-900">{formatNumber(results.targetBulanan)} <span className="text-xs text-gray-400 font-medium">unit</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD PRODUKTIVITAS & VISUAL */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Produktivitas</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Per Jam</p>
                    <p className="font-extrabold text-gray-900 text-lg">{formatNumber(results.targetPerJam)} <span className="text-xs font-medium text-gray-500">unit</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Per Pelanggan</p>
                    <p className="font-extrabold text-gray-900 text-lg">{formatNumber(results.targetPerPelanggan)} <span className="text-xs font-medium text-gray-500">unit</span></p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                    <span className="text-blue-600">Target Tercapai</span>
                    <span className="text-gray-900">{formatNumber(results.progressPercent)}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full ${results.progressBarColor} rounded-full transition-all duration-1000 ease-out relative`}
                      style={{ width: `${Math.min(100, results.progressPercent)}%` }}
                    >
                       <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-gray-500">
                    <span>Rp {formatNumber(results.curSales)}</span>
                    <span>Sisa: Rp {formatNumber(Math.max(0, results.simulatedOmzet - results.curSales))}</span>
                  </div>
                </div>
              </div>

              {/* CARD ANALISIS */}
              <div className={`rounded-xl p-5 border shadow-sm transition-colors duration-500 ${results.statusColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💡</span>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Status: {results.status}</h4>
                </div>
                <p className="text-sm font-medium opacity-90 leading-relaxed mt-1">
                  {results.insight}
                </p>
              </div>

              {/* CARD SIMULASI 3 TINGKAT */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Simulasi 3 Tingkat</h4>
                 <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Pesimis (80%)</span>
                        <span className="font-bold text-gray-900 text-sm">{formatNumber(results.scenarios.pesimis.unit)} unit</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Omzet: {formatIDR(results.scenarios.pesimis.omzet)}</span>
                        <span>Laba: {formatIDR(results.scenarios.pesimis.laba)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50/50 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">⭐ Normal (100%)</span>
                        <span className="font-extrabold text-blue-900 text-sm">{formatNumber(results.scenarios.normal.unit)} unit</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-medium text-blue-700/80">
                        <span>Omzet: {formatIDR(results.scenarios.normal.omzet)}</span>
                        <span>Laba: {formatIDR(results.scenarios.normal.laba)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Optimis (120%)</span>
                        <span className="font-bold text-gray-900 text-sm">{formatNumber(results.scenarios.optimis.unit)} unit</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Omzet: {formatIDR(results.scenarios.optimis.omzet)}</span>
                        <span>Laba: {formatIDR(results.scenarios.optimis.laba)}</span>
                      </div>
                    </div>
                 </div>
              </div>

               {/* CARD REKOMENDASI */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Rekomendasi Harian</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Minimal Pelanggan</span>
                    <span className="font-bold text-gray-900">{formatNumber(results.minTransaksi)} <span className="text-xs font-normal text-gray-500">orang</span></span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Minimal Transaksi</span>
                    <span className="font-bold text-gray-900">{formatNumber(results.minTransaksi)} <span className="text-xs font-normal text-gray-500">struk</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Minimal Omzet</span>
                    <span className="font-bold text-gray-900">{formatIDR(results.minOmzetHarian)}</span>
                  </div>
                </div>
              </div>

              {/* CARD BREAKDOWN VISUAL BAR */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Breakdown Target</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-gray-600">Target Harian</span>
                      <span>{formatNumber(results.targetHarian)}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full"><div className="h-full bg-blue-300 rounded-full" style={{width: '20%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-gray-600">Target Mingguan</span>
                      <span>{formatNumber(results.targetMingguan)}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{width: '50%'}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-gray-600">Target Bulanan / {data.periode}</span>
                      <span>{formatNumber(results.targetBulanan)}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full"><div className="h-full bg-blue-600 rounded-full" style={{width: '100%'}}></div></div>
                  </div>
                </div>
              </div>

              {/* COPY BUTTON CARD */}
              <div className="pt-2">
                <button 
                  onClick={handleCopy}
                  className="w-full bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 text-gray-700 font-semibold py-4 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Icons.Copy />
                  Salin Ringkasan
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
      
      {/* GLOBAL STYLES FOR ANIMATION */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}