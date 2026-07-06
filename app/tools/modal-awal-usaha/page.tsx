'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// --- TYPES & INTERFACES ---
interface BusinessData {
  // Informasi Usaha
  namaUsaha: string;
  jenisUsaha: string;
  targetBuka: string;
  lamaPersiapan: string;
  
  // Biaya Tempat
  sewaTempat: string;
  renovasi: string;
  deposit: string;
  interior: string;
  
  // Peralatan
  mesin: string;
  alatProduksi: string;
  alatOperasional: string;
  furniture: string;
  
  // Persediaan Awal
  stokBarang: string;
  bahanBaku: string;
  packaging: string;
  
  // Legalitas
  perizinan: string;
  npwp: string; // Biaya urus jika ada
  nib: string;
  sertifikasi: string; // Halal, BPOM, dll
  
  // Operasional Awal (Per Bulan)
  gajiKaryawan: string;
  listrik: string;
  air: string;
  internet: string;
  marketing: string;
  transportasi: string;
  
  // Cadangan & Simulasi
  persenCadangan: string;
  simulationSlider: number;
}

interface ToastState {
  show: boolean;
  message: string;
}

const JENIS_USAHA = ['Warung / Toko', 'Coffee Shop', 'F&B / Restoran', 'Fashion', 'Jasa', 'Laundry', 'Online Shop', 'Lainnya'];
const PERSEN_CADANGAN = ['5', '10', '15', '20', '30', '50'];

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
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  Store: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>,
  Tool: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Package: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
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
export default function ModalAwalUsahaPage() {
  // --- STATE ---
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default values set realistically for a small Coffee Shop as an example
  const [data, setData] = useState<BusinessData>({
    namaUsaha: 'Kopi Senja',
    jenisUsaha: 'Coffee Shop',
    targetBuka: '1 Bulan Kedepan',
    lamaPersiapan: '1',
    
    sewaTempat: '30000000',
    renovasi: '15000000',
    deposit: '5000000',
    interior: '10000000',
    
    mesin: '25000000',
    alatProduksi: '5000000',
    alatOperasional: '3000000',
    furniture: '12000000',
    
    stokBarang: '2000000',
    bahanBaku: '5000000',
    packaging: '1500000',
    
    perizinan: '1000000',
    npwp: '0',
    nib: '0',
    sertifikasi: '2500000',
    
    gajiKaryawan: '6000000',
    listrik: '1500000',
    air: '300000',
    internet: '450000',
    marketing: '1000000',
    transportasi: '500000',
    
    persenCadangan: '20',
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
    // 1. Parse all inputs safely
    const tempat = parseSafe(data.sewaTempat) + parseSafe(data.renovasi) + parseSafe(data.deposit) + parseSafe(data.interior);
    const peralatan = parseSafe(data.mesin) + parseSafe(data.alatProduksi) + parseSafe(data.alatOperasional) + parseSafe(data.furniture);
    const persediaan = parseSafe(data.stokBarang) + parseSafe(data.bahanBaku) + parseSafe(data.packaging);
    const legalitas = parseSafe(data.perizinan) + parseSafe(data.npwp) + parseSafe(data.nib) + parseSafe(data.sertifikasi);
    
    // Operasional (asumsi input adalah per bulan, kita hitung 1 bulan awal di modal awal)
    const operasional = parseSafe(data.gajiKaryawan) + parseSafe(data.listrik) + parseSafe(data.air) + parseSafe(data.internet) + parseSafe(data.marketing) + parseSafe(data.transportasi);

    const totalBase = tempat + peralatan + persediaan + legalitas + operasional;
    
    // 2. Dana Cadangan
    const persen = parseSafe(data.persenCadangan, 0, 100);
    const cadanganAwal = totalBase * (persen / 100);
    const totalAwal = totalBase + cadanganAwal;

    // 3. Simulasi Slider multiplier (-20% to +50%)
    const multiplier = 1 + ((data.simulationSlider || 0) / 100);
    
    // 4. Final Values (After Simulation)
    const finalTempat = tempat * multiplier;
    const finalPeralatan = peralatan * multiplier;
    const finalPersediaan = persediaan * multiplier;
    const finalLegalitas = legalitas * multiplier;
    const finalOperasional = operasional * multiplier;
    const finalCadangan = cadanganAwal * multiplier;
    
    const finalTotal = totalAwal * multiplier;
    const finalBaseTotal = totalBase * multiplier; // tanpa cadangan untuk hitung modal minimum

    // 5. Percentages for Progress Bar
    const getPercent = (value: number) => finalTotal > 0 ? Math.min(100, (value / finalTotal) * 100) : 0;
    
    // 6. Cash Buffer (Months) = Dana Cadangan / Biaya Operasional per bulan
    const cashBuffer = finalOperasional > 0 ? (finalCadangan / finalOperasional) : 99; // if 0 op cost, infinite buffer

    // 7. Modal Minimum (Minimal agar bisa buka = Total tanpa dana cadangan & asumsi efisiensi 10%)
    const modalMinimum = finalBaseTotal * 0.9; 

    // 8. Analysis Logic & Insight
    let status = 'Berisiko';
    let insight = 'Modal cadangan sangat minim. Rentan jika terjadi pengeluaran tak terduga.';
    let statusColor = 'text-red-700 bg-red-50 border-red-200';
    let progressBarColor = 'bg-red-500';
    
    const rekomendasi = [];

    if (cashBuffer >= 6) {
      status = 'Sangat Aman';
      insight = 'Dana cadangan luar biasa. Bisnis punya nafas panjang untuk berkembang dan bereksperimen.';
      statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      progressBarColor = 'bg-emerald-500';
      rekomendasi.push('Fokus pada penetrasi pasar tanpa takut kehabisan modal awal.');
      rekomendasi.push('Pertimbangkan investasi sisa dana ke deposito jangka pendek.');
    } else if (cashBuffer >= 3) {
      status = 'Aman';
      insight = 'Proporsi modal sangat baik. Anda memiliki runway 3+ bulan tanpa pendapatan.';
      statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
      progressBarColor = 'bg-blue-500';
      rekomendasi.push('Jalankan rencana sesuai blueprint.');
      rekomendasi.push('Pantau burn-rate (pengeluaran operasional bulanan) agar tetap sesuai estimasi.');
    } else if (cashBuffer >= 1.5) {
      status = 'Cukup';
      insight = 'Modal standar UMKM. Dibutuhkan penjualan yang stabil dalam bulan pertama agar arus kas terjaga.';
      statusColor = 'text-yellow-700 bg-yellow-50 border-yellow-200';
      progressBarColor = 'bg-yellow-500';
      rekomendasi.push('Gencarkan marketing pada bulan pertama untuk menutup operasional.');
      rekomendasi.push('Tunda pembelian aset tidak mendesak jika memungkinkan.');
    } else {
      status = 'Tipis / Berisiko';
      insight = 'Nafas usaha kurang dari 1.5 bulan. Jika bulan pertama sepi, bisnis berisiko kehabisan kas operasional.';
      statusColor = 'text-orange-700 bg-orange-50 border-orange-200';
      progressBarColor = 'bg-orange-500';
      rekomendasi.push('Sangat disarankan menaikkan persentase Dana Cadangan.');
      rekomendasi.push('Kurangi biaya sewa/renovasi, alihkan uang tunai ke operasional.');
      rekomendasi.push('Tekan pengeluaran tetap bulanan seminimal mungkin.');
    }

    // 9. Scenarios Logic
    const scenarios = {
      pesimis: {
        total: finalTotal * 0.8, // Jika bisa berhemat 20%
        label: '-20% Efisiensi'
      },
      normal: {
        total: finalTotal,
        label: 'Sesuai Rencana'
      },
      optimis: {
        total: finalTotal * 1.2, // Jika overbudget 20%
        label: '+20% Overbudget'
      }
    };

    return {
      finalTotal,
      finalTempat,
      finalPeralatan,
      finalPersediaan,
      finalLegalitas,
      finalOperasional,
      finalCadangan,
      cashBuffer,
      modalMinimum,
      status,
      insight,
      statusColor,
      progressBarColor,
      rekomendasi,
      scenarios,
      pct: {
        tempat: getPercent(finalTempat),
        peralatan: getPercent(finalPeralatan),
        persediaan: getPercent(finalPersediaan),
        legalitas: getPercent(finalLegalitas),
        operasional: getPercent(finalOperasional),
        cadangan: getPercent(finalCadangan)
      }
    };
  }, [data, parseSafe]);

  // --- HANDLERS ---
  const handleInputChange = useCallback((field: keyof BusinessData, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setData({
      namaUsaha: '', jenisUsaha: 'Lainnya', targetBuka: '', lamaPersiapan: '',
      sewaTempat: '', renovasi: '', deposit: '', interior: '',
      mesin: '', alatProduksi: '', alatOperasional: '', furniture: '',
      stokBarang: '', bahanBaku: '', packaging: '',
      perizinan: '', npwp: '', nib: '', sertifikasi: '',
      gajiKaryawan: '', listrik: '', air: '', internet: '', marketing: '', transportasi: '',
      persenCadangan: '10', simulationSlider: 0,
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, message: msg });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = `==================================
📊 KEBUTUHAN MODAL AWAL USAHA
==================================
Usaha: ${data.namaUsaha || '-'}
Jenis: ${data.jenisUsaha}
----------------------------------
TOTAL MODAL : ${formatIDR(results.finalTotal)}
----------------------------------
Breakdown:
- Tempat      : ${formatIDR(results.finalTempat)}
- Peralatan   : ${formatIDR(results.finalPeralatan)}
- Persediaan  : ${formatIDR(results.finalPersediaan)}
- Operasional : ${formatIDR(results.finalOperasional)}
- Legalitas   : ${formatIDR(results.finalLegalitas)}
- Cadangan    : ${formatIDR(results.finalCadangan)}
----------------------------------
Status      : ${results.status}
Cash Buffer : ${formatNumber(results.cashBuffer)} Bulan
Insight     : ${results.insight}
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
      textArea.style.position = "fixed";
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
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Kalkulator Modal Awal</h1>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 uppercase tracking-wider hidden sm:inline-block">
                  Professional Tool
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
                Rencanakan dan hitung seluruh kebutuhan modal usaha sebelum launching.
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
            
            {/* CARD 1: INFORMASI USAHA */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Activity /></div>
                <h2 className="text-lg font-semibold tracking-tight">Informasi Usaha</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label="Nama Usaha" value={data.namaUsaha} onChange={(v) => handleInputChange('namaUsaha', v)} />
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-medium text-gray-700">Jenis Usaha</label>
                  <select 
                    value={data.jenisUsaha} 
                    onChange={(e) => handleInputChange('jenisUsaha', e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block text-sm py-2.5 px-3 hover:border-gray-300 shadow-sm transition-colors cursor-pointer"
                  >
                    {JENIS_USAHA.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <InputGroup label="Target Buka Usaha" value={data.targetBuka} onChange={(v) => handleInputChange('targetBuka', v)} />
                <InputGroup type="number" label="Lama Persiapan" value={data.lamaPersiapan} onChange={(v) => handleInputChange('lamaPersiapan', v)} suffix="Bulan" />
              </div>
            </section>

            {/* CARD 2: BIAYA TEMPAT */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Store /></div>
                <h2 className="text-lg font-semibold tracking-tight">Biaya Tempat / Sewa</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup type="number" label="Sewa Tempat (Tahunan)" value={data.sewaTempat} onChange={(v) => handleInputChange('sewaTempat', v)} prefix="Rp" />
                <InputGroup type="number" label="Biaya Renovasi" value={data.renovasi} onChange={(v) => handleInputChange('renovasi', v)} prefix="Rp" />
                <InputGroup type="number" label="Uang Deposit (Jika Ada)" value={data.deposit} onChange={(v) => handleInputChange('deposit', v)} prefix="Rp" />
                <InputGroup type="number" label="Desain & Interior" value={data.interior} onChange={(v) => handleInputChange('interior', v)} prefix="Rp" />
              </div>
            </section>

            {/* CARD 3: PERALATAN */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
               <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Tool /></div>
                <h2 className="text-lg font-semibold tracking-tight">Peralatan & Aset Fisik</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup type="number" label="Mesin Utama" value={data.mesin} onChange={(v) => handleInputChange('mesin', v)} prefix="Rp" />
                <InputGroup type="number" label="Peralatan Produksi / Dapur" value={data.alatProduksi} onChange={(v) => handleInputChange('alatProduksi', v)} prefix="Rp" />
                <InputGroup type="number" label="Peralatan Operasional (Kasir, dll)" value={data.alatOperasional} onChange={(v) => handleInputChange('alatOperasional', v)} prefix="Rp" />
                <InputGroup type="number" label="Furniture (Meja, Kursi, Rak)" value={data.furniture} onChange={(v) => handleInputChange('furniture', v)} prefix="Rp" />
              </div>
            </section>

            {/* CARD 4: PERSEDIAAN AWAL */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Package /></div>
                <h2 className="text-lg font-semibold tracking-tight">Persediaan / Bahan Baku Awal</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <InputGroup type="number" label="Stok Barang Jual" value={data.stokBarang} onChange={(v) => handleInputChange('stokBarang', v)} prefix="Rp" />
                <InputGroup type="number" label="Bahan Baku Mentah" value={data.bahanBaku} onChange={(v) => handleInputChange('bahanBaku', v)} prefix="Rp" />
                <InputGroup type="number" label="Kemasan / Packaging" value={data.packaging} onChange={(v) => handleInputChange('packaging', v)} prefix="Rp" />
              </div>
            </section>

            {/* CARD 5: LEGALITAS & ADMINISTRASI */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.FileText /></div>
                <h2 className="text-lg font-semibold tracking-tight">Legalitas & Administrasi</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup type="number" label="Perizinan Usaha" value={data.perizinan} onChange={(v) => handleInputChange('perizinan', v)} prefix="Rp" />
                <InputGroup type="number" label="NPWP Badan/Pribadi" value={data.npwp} onChange={(v) => handleInputChange('npwp', v)} prefix="Rp" />
                <InputGroup type="number" label="Pengurusan NIB" value={data.nib} onChange={(v) => handleInputChange('nib', v)} prefix="Rp" />
                <InputGroup type="number" label="Sertifikasi (Halal/BPOM/dll)" value={data.sertifikasi} onChange={(v) => handleInputChange('sertifikasi', v)} prefix="Rp" />
              </div>
            </section>

            {/* CARD 6: OPERASIONAL AWAL */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Activity /></div>
                <h2 className="text-lg font-semibold tracking-tight">Biaya Operasional (Bulan Pertama)</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <InputGroup type="number" label="Gaji Karyawan" value={data.gajiKaryawan} onChange={(v) => handleInputChange('gajiKaryawan', v)} prefix="Rp" />
                <InputGroup type="number" label="Listrik" value={data.listrik} onChange={(v) => handleInputChange('listrik', v)} prefix="Rp" />
                <InputGroup type="number" label="Air" value={data.air} onChange={(v) => handleInputChange('air', v)} prefix="Rp" />
                <InputGroup type="number" label="Internet & Telp" value={data.internet} onChange={(v) => handleInputChange('internet', v)} prefix="Rp" />
                <InputGroup type="number" label="Marketing / Iklan" value={data.marketing} onChange={(v) => handleInputChange('marketing', v)} prefix="Rp" />
                <InputGroup type="number" label="Transport & Bensin" value={data.transportasi} onChange={(v) => handleInputChange('transportasi', v)} prefix="Rp" />
              </div>
            </section>

             {/* CARD 7: SIMULASI & CADANGAN */}
             <section className="bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 p-6 text-white relative overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-600/30">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-blue-800 opacity-20 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Icons.Shield /></div>
                  <h2 className="text-lg font-semibold">Manajemen Risiko & Simulasi</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-4 flex flex-col gap-2">
                    <label className="text-sm font-medium text-blue-100">Alokasi Dana Darurat</label>
                    <select 
                      value={data.persenCadangan} 
                      onChange={(e) => handleInputChange('persenCadangan', e.target.value)}
                      className="w-full bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent block text-sm py-3 px-3 shadow-sm cursor-pointer border-0 font-bold"
                    >
                      {PERSEN_CADANGAN.map(p => <option key={p} value={p}>{p}% dari Total Modal</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-8 flex flex-col gap-3 bg-blue-700/40 p-4 rounded-xl border border-blue-500/50 backdrop-blur-sm">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-semibold bg-blue-800/80 px-2.5 py-1 rounded shadow-sm">-20%</span>
                      <div className="text-center">
                        <span className="text-2xl font-extrabold tracking-tight">{data.simulationSlider > 0 ? '+' : ''}{data.simulationSlider}%</span>
                        <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold mt-1">Simulasi Kebutuhan Modal</p>
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
              </div>
            </section>

            {/* CARD 8: AKSI */}
            <section className="flex gap-4 pt-2">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
              >
                Lihat Estimasi Modal
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
                  <h3 className="font-semibold text-gray-900 tracking-tight">Dashboard Modal Usaha</h3>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Highlight Total Modal */}
                  <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100 transition-all transform hover:scale-[1.02] hover:shadow-md cursor-default">
                    <div className="text-4xl mb-3 animate-bounce" style={{animationDuration: '2s'}}>💰</div>
                    <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-widest">Total Modal Awal</p>
                    <h4 className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight truncate" title={formatIDR(results.finalTotal)}>
                      {formatIDR(results.finalTotal)}
                    </h4>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Breakdown List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></div>Tempat & Sewa
                      </span>
                      <span className="font-bold text-gray-900">{formatIDR(results.finalTempat)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></div>Peralatan
                      </span>
                      <span className="font-bold text-gray-900">{formatIDR(results.finalPeralatan)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-teal-500 group-hover:scale-150 transition-transform"></div>Persediaan
                      </span>
                      <span className="font-bold text-gray-900">{formatIDR(results.finalPersediaan)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-gray-500 group-hover:scale-150 transition-transform"></div>Legalitas
                      </span>
                      <span className="font-bold text-gray-900">{formatIDR(results.finalLegalitas)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:scale-150 transition-transform"></div>Operasional 1 Bln
                      </span>
                      <span className="font-bold text-gray-900">{formatIDR(results.finalOperasional)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-150 transition-transform"></div>Dana Cadangan
                      </span>
                      <span className="font-bold text-green-600">{formatIDR(results.finalCadangan)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD BREAKDOWN KOMPOSISI (PROGRESS BAR) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Persentase Komposisi</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                      <span>Tempat</span>
                      <span>{formatNumber(results.pct.tempat)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{width: `${results.pct.tempat}%`}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                      <span>Peralatan</span>
                      <span>{formatNumber(results.pct.peralatan)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${results.pct.peralatan}%`}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                      <span>Operasional</span>
                      <span>{formatNumber(results.pct.operasional)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{width: `${results.pct.operasional}%`}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                      <span className="text-green-600">Cadangan</span>
                      <span className="text-green-600">{formatNumber(results.pct.cadangan)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{width: `${results.pct.cadangan}%`}}></div></div>
                  </div>
                </div>
              </div>

              {/* CARD ANALISIS & CASH BUFFER */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Analisis Keamanan Kas</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cash Buffer</p>
                    <p className="font-extrabold text-gray-900 text-lg">
                      {results.cashBuffer > 90 ? '>12' : formatNumber(results.cashBuffer)} <span className="text-xs font-medium text-gray-500">Bulan</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Modal Minimum</p>
                    <p className="font-extrabold text-gray-900 text-[13px] truncate" title={formatIDR(results.modalMinimum)}>{formatIDR(results.modalMinimum)}</p>
                  </div>
                </div>

                {/* INSIGHT CARD */}
                <div className={`rounded-xl p-4 border transition-colors duration-500 ${results.statusColor}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">💡</span>
                    <h4 className="font-extrabold text-[13px] uppercase tracking-wider">Status: {results.status}</h4>
                  </div>
                  <p className="text-[13px] font-medium opacity-90 leading-relaxed">
                    {results.insight}
                  </p>
                </div>
              </div>

              {/* CARD REKOMENDASI */}
              {results.rekomendasi.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Rekomendasi Tindakan</h4>
                  <ul className="space-y-2.5">
                    {results.rekomendasi.map((rek, idx) => (
                      <li key={idx} className="flex gap-2.5 text-sm font-medium text-gray-700">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                         <span>{rek}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CARD SIMULASI 3 TINGKAT */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Skenario Kemungkinan</h4>
                 <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Pesimis</span>
                        <span className="text-[11px] font-medium text-gray-500">{results.scenarios.pesimis.label}</span>
                      </div>
                      <div className="font-bold text-gray-900 text-sm">
                        {formatIDR(results.scenarios.pesimis.total)}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50/50 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">⭐ Normal</span>
                        <span className="text-[11px] font-medium text-blue-600/80">{results.scenarios.normal.label}</span>
                      </div>
                      <div className="font-extrabold text-blue-900 text-sm">
                        {formatIDR(results.scenarios.normal.total)}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Optimis</span>
                        <span className="text-[11px] font-medium text-gray-500">{results.scenarios.optimis.label}</span>
                      </div>
                      <div className="font-bold text-gray-900 text-sm">
                        {formatIDR(results.scenarios.optimis.total)}
                      </div>
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