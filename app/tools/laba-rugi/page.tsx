'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Info,
  BarChart3,
  Activity,
  Briefcase,
  Settings2,
  Building,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// --- TYPES & INTERFACES ---
interface LineItem {
  id: string;
  name: string;
  amount: number;
}

interface OpexState {
  salary: number;
  rent: number;
  marketing: number;
  transport: number;
  internet: number;
  others: number;
}

interface AdvancedState {
  enabled: boolean;
  otherIncome: number;
  interest: number;
  taxRate: number; // percentage
  depreciation: number;
}

// --- UTILS ---
const formatIDR = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const parseIDR = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(numericString, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// --- REUSABLE COMPONENTS ---
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const Label = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const CurrencyInput = ({
  value,
  onChange,
  placeholder = '0',
  className = ''
}: {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(value === 0 ? '' : formatIDR(value).replace('Rp', '').trim());

  useEffect(() => {
    if (value === 0 && displayValue === '') return;
    setDisplayValue(formatIDR(value).replace('Rp', '').trim());
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setDisplayValue(rawVal);
    onChange(parseIDR(rawVal));
  };

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-semibold">
        Rp
      </span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all duration-200 ${className}`}
      />
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function LabaRugiPage() {
  // --- STATE ---
  const [businessName, setBusinessName] = useState('');
  const [periodType, setPeriodType] = useState('Bulanan');
  const [periodDate, setPeriodDate] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [revenues, setRevenues] = useState<LineItem[]>([
    { id: '1', name: 'Penjualan Produk Utama', amount: 0 },
    { id: '2', name: 'Penjualan Produk Lain', amount: 0 },
  ]);

  const [cogs, setCogs] = useState<LineItem[]>([
    { id: '1', name: 'Bahan Baku', amount: 0 },
    { id: '2', name: 'Tenaga Kerja Produksi', amount: 0 },
    { id: '3', name: 'Biaya Produksi Lain', amount: 0 },
  ]);

  const [opex, setOpex] = useState<OpexState>({
    salary: 0, rent: 0, marketing: 0, transport: 0, internet: 0, others: 0,
  });

  const [advanced, setAdvanced] = useState<AdvancedState>({
    enabled: false, otherIncome: 0, interest: 0, taxRate: 0, depreciation: 0,
  });

  // --- CALCULATIONS (Memoized for Performance) ---
  const totalRevenue = useMemo(() => revenues.reduce((sum, item) => sum + item.amount, 0), [revenues]);
  const totalCogs = useMemo(() => cogs.reduce((sum, item) => sum + item.amount, 0), [cogs]);

  const grossProfit = totalRevenue - totalCogs;

  const totalOpex = useMemo(() => {
    const baseOpex = Object.values(opex).reduce((sum, val) => sum + val, 0);
    return baseOpex + (advanced.enabled ? advanced.depreciation : 0);
  }, [opex, advanced]);

  const ebit = useMemo(() => {
    let result = grossProfit - totalOpex;
    if (advanced.enabled) {
      result = result + advanced.otherIncome - advanced.interest;
    }
    return result;
  }, [grossProfit, totalOpex, advanced]);

  const taxAmount = useMemo(() => {
    if (!advanced.enabled || ebit <= 0 || advanced.taxRate <= 0) return 0;
    const rate = Math.min(advanced.taxRate, 100);
    return (ebit * rate) / 100;
  }, [ebit, advanced]);

  const netProfit = ebit - taxAmount;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // --- HELPERS ---
  const getMarginColor = (margin: number) => {
    if (margin <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (margin < 10) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const copyToClipboard = () => {
    const summary = [
      '==================================',
      '📊 LABA RUGI',
      '==================================',
      `Bisnis     : ${businessName || 'Belum diisi'}`,
      `Periode    : ${periodType} ${periodDate ? `(${periodDate})` : ''}`,
      '',
      '[1] PENDAPATAN',
      `Total Pendapatan: ${formatIDR(totalRevenue)}`,
      '',
      '[2] PENGELUARAN',
      `Total HPP       : ${formatIDR(totalCogs)}`,
      `Laba Kotor      : ${formatIDR(grossProfit)}`,
      `Total OPEX      : ${formatIDR(totalOpex)}`,
      '',
      '[3] HASIL AKHIR',
      `Laba Bersih     : ${formatIDR(netProfit)}`,
      `Margin Laba     : ${netMargin.toFixed(1)}%`,
      `Status          : ${netMargin > 0 ? 'UNTUNG ✅' : netMargin < 0 ? 'RUGI ❌' : 'BEP ➖'}`,
      '=================================='
    ].join('\n');

    navigator.clipboard.writeText(summary);
    showToast('Ringkasan berhasil disalin.');
  };

  const resetAll = () => {
    if(window.confirm('Yakin ingin mereset semua data?')) {
      setRevenues([
        { id: '1', name: 'Penjualan Produk Utama', amount: 0 }, 
        { id: '2', name: 'Penjualan Produk Lain', amount: 0 }
      ]);
      setCogs([
        { id: '1', name: 'Bahan Baku', amount: 0 }, 
        { id: '2', name: 'Tenaga Kerja Produksi', amount: 0 }, 
        { id: '3', name: 'Biaya Produksi Lain', amount: 0 }
      ]);
      setOpex({ salary: 0, rent: 0, marketing: 0, transport: 0, internet: 0, others: 0 });
      setAdvanced({ enabled: false, otherIncome: 0, interest: 0, taxRate: 0, depreciation: 0 });
      showToast('Data berhasil di-reset');
    }
  };

  const addLineItem = (setter: React.Dispatch<React.SetStateAction<LineItem[]>>) => {
    setter(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), name: '', amount: 0 }]);
  };

  const removeLineItem = (id: string, setter: React.Dispatch<React.SetStateAction<LineItem[]>>) => {
    setter(prev => prev.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: 'name' | 'amount', value: string | number, setter: React.Dispatch<React.SetStateAction<LineItem[]>>) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900 tracking-tight">
                Kalkulator Laba Rugi <span className="text-blue-600 font-black"></span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">Analisis keuntungan bisnis UMKM secara real-time, otomatis, dan profesional.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ========================================== */}
          {/* KIRI (INPUTS - 65%)                        */}
          {/* ========================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* KARTU 1: INFO BISNIS */}
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Periode & Info Bisnis</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-1">
                  <Label>Nama Bisnis</Label>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Contoh: Kedai Kopi Adjie" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <Label>Tipe Periode</Label>
                  <select 
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all appearance-none"
                  >
                    <option>Bulanan</option>
                    <option>Kuartalan</option>
                    <option>Tahunan</option>
                  </select>
                </div>
                <div>
                  <Label>Pilih Bulan/Tahun</Label>
                  <input 
                    type="month" 
                    value={periodDate}
                    onChange={(e) => setPeriodDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>
            </Card>

            {/* KARTU 2: PENDAPATAN */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Pendapatan (Revenue)</h2>
                </div>
                <div className="text-sm font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                  Total: {formatIDR(totalRevenue)}
                </div>
              </div>
              
              <div className="space-y-3">
                {revenues.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                    <div className="w-full sm:w-1/2">
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => updateLineItem(item.id, 'name', e.target.value, setRevenues)}
                        placeholder="Sumber Pendapatan"
                        className="w-full px-3 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                      />
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center gap-2">
                      <div className="flex-1">
                        <CurrencyInput 
                          value={item.amount} 
                          onChange={(val) => updateLineItem(item.id, 'amount', val, setRevenues)}
                          className="!bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => removeLineItem(item.id, setRevenues)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => addLineItem(setRevenues)}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 w-max"
              >
                <Plus className="w-4 h-4" /> Tambah Pendapatan
              </button>
            </Card>

            {/* KARTU 3: HPP */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Harga Pokok Penjualan (HPP)</h2>
                </div>
                <div className="text-sm font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">
                  Total: {formatIDR(totalCogs)}
                </div>
              </div>
              
              <div className="space-y-3">
                {cogs.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                    <div className="w-full sm:w-1/2">
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => updateLineItem(item.id, 'name', e.target.value, setCogs)}
                        placeholder="Komponen HPP"
                        className="w-full px-3 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                      />
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center gap-2">
                      <div className="flex-1">
                        <CurrencyInput 
                          value={item.amount} 
                          onChange={(val) => updateLineItem(item.id, 'amount', val, setCogs)}
                          className="!bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => removeLineItem(item.id, setCogs)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => addLineItem(setCogs)}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 w-max"
              >
                <Plus className="w-4 h-4" /> Tambah Komponen HPP
              </button>
            </Card>

            {/* KARTU 4: OPEX */}
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Biaya Operasional (OPEX)</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label>Gaji Karyawan</Label>
                  <CurrencyInput value={opex.salary} onChange={(v) => setOpex({...opex, salary: v})} />
                </div>
                <div>
                  <Label>Sewa & Utilitas</Label>
                  <CurrencyInput value={opex.rent} onChange={(v) => setOpex({...opex, rent: v})} />
                </div>
                <div>
                  <Label>Pemasaran & Iklan</Label>
                  <CurrencyInput value={opex.marketing} onChange={(v) => setOpex({...opex, marketing: v})} />
                </div>
                <div>
                  <Label>Transportasi</Label>
                  <CurrencyInput value={opex.transport} onChange={(v) => setOpex({...opex, transport: v})} />
                </div>
                <div>
                  <Label>Internet & Komunikasi</Label>
                  <CurrencyInput value={opex.internet} onChange={(v) => setOpex({...opex, internet: v})} />
                </div>
                <div>
                  <Label>Lain-lain</Label>
                  <CurrencyInput value={opex.others} onChange={(v) => setOpex({...opex, others: v})} />
                </div>
              </div>
            </Card>

            {/* KARTU 5: FITUR LANJUTAN */}
            <Card className="border-dashed border-2 hover:border-blue-200 transition-colors">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setAdvanced({...advanced, enabled: !advanced.enabled})}
              >
                <div className="flex items-center gap-2">
                  <Settings2 className={`w-5 h-5 transition-colors ${advanced.enabled ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                  <h2 className="text-lg font-bold text-gray-900">Fitur Lanjutan (Pajak, Bunga, Depresiasi)</h2>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${advanced.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${advanced.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </div>

              {advanced.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <Label>Pendapatan Lain-lain</Label>
                    <CurrencyInput value={advanced.otherIncome} onChange={(v) => setAdvanced({...advanced, otherIncome: v})} />
                  </div>
                  <div>
                    <Label>Beban Bunga</Label>
                    <CurrencyInput value={advanced.interest} onChange={(v) => setAdvanced({...advanced, interest: v})} />
                  </div>
                  <div>
                    <Label>Depresiasi (Penyusutan)</Label>
                    <CurrencyInput value={advanced.depreciation} onChange={(v) => setAdvanced({...advanced, depreciation: v})} />
                  </div>
                  <div>
                    <Label>Pajak Bisnis (%)</Label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={advanced.taxRate || ''}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value);
                          if(isNaN(val)) val = 0;
                          if(val > 100) val = 100;
                          if(val < 0) val = 0;
                          setAdvanced({...advanced, taxRate: val});
                        }}
                        placeholder="0"
                        className="w-full pr-8 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      />
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 font-medium">%</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  showToast('Data dihitung secara otomatis! 🚀');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Calculator className="w-5 h-5" /> Hitung Laba Rugi
              </button>
              <button 
                onClick={resetAll}
                className="px-6 py-3.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* ========================================== */}
          {/* KANAN (STICKY DASHBOARD - 35%)             */}
          {/* ========================================== */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 flex flex-col gap-6">
              
              {/* HASIL UTAMA */}
              <Card className="border-blue-100 shadow-blue-900/5 bg-gradient-to-b from-white to-blue-50/30">
                <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Dashboard Laba Rugi
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Total Pendapatan</span>
                    <span className="font-semibold text-gray-900">{formatIDR(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Total HPP</span>
                    <span className="font-semibold text-gray-900">-{formatIDR(totalCogs)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
                    <span className="text-gray-700 font-bold">Laba Kotor</span>
                    <span className="font-bold text-gray-900">{formatIDR(grossProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Total OPEX</span>
                    <span className="font-semibold text-gray-900">-{formatIDR(totalOpex)}</span>
                  </div>
                  
                  {advanced.enabled && (
                    <>
                      <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
                        <span className="text-gray-700 font-bold">EBIT</span>
                        <span className="font-bold text-gray-900">{formatIDR(ebit)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Pajak ({advanced.taxRate}%)</span>
                        <span className="font-semibold text-red-600">-{formatIDR(taxAmount)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                  <span className="block text-blue-100 text-sm font-medium mb-1 relative z-10">Laba Bersih</span>
                  <div className="text-3xl font-black tracking-tight mb-3 relative z-10 break-words">
                    {formatIDR(netProfit)}
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getMarginColor(netMargin)}`}>
                      Margin: {netMargin.toFixed(1)}%
                    </span>
                    {netMargin > 20 && <Sparkles className="w-4 h-4 text-yellow-300" />}
                  </div>
                </div>
              </Card>

              {/* DISTRIBUSI VISUAL */}
              <Card>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Distribusi Keuangan</h3>
                {totalRevenue > 0 ? (
                  <div>
                    <div className="h-4 flex rounded-full overflow-hidden mb-3 bg-gray-100">
                      <div style={{width: `${Math.min((totalCogs/totalRevenue)*100, 100)}%`}} className="bg-orange-400 transition-all duration-500" />
                      <div style={{width: `${Math.min((totalOpex/totalRevenue)*100, 100)}%`}} className="bg-purple-500 transition-all duration-500" />
                      <div style={{width: `${Math.max(0, netMargin)}%`}} className="bg-blue-500 transition-all duration-500" />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" />HPP</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" />OPEX</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" />Laba</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Masukkan pendapatan untuk melihat distribusi.</p>
                )}
              </Card>

              {/* AUTOMATIC INSIGHTS */}
              {totalRevenue > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-900 mb-1">Analisis Otomatis</h4>
                      <p className="text-xs text-blue-800/80 leading-relaxed">
                        {netMargin < 0 
                          ? "Bisnis sedang merugi. Segera evaluasi struktur HPP atau tekan biaya operasional (OPEX)." 
                          : netMargin < 10
                          ? "Margin cukup tipis. Fokus pada efisiensi operasional atau pertimbangkan strategi kenaikan harga bertahap."
                          : netMargin < 25
                          ? "Margin sehat! Bisnis berjalan efisien. Pertahankan struktur biaya ini."
                          : "Margin sangat luar biasa! Model bisnis ini sangat profit. Waktu yang tepat untuk mempertimbangkan ekspansi."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULASI BISNIS */}
              <Card>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Simulasi Skenario Bisnis</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors cursor-default">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-600">Mode Hemat (Cost -10%)</span>
                      <span className="text-xs font-bold text-blue-600">
                        {formatIDR(
                          totalRevenue - (totalCogs * 0.9) - (totalOpex * 0.9) + 
                          (advanced.enabled ? advanced.otherIncome - advanced.interest - (ebit * 0.9 > 0 ? (ebit * 0.9 * advanced.taxRate / 100) : 0) : 0)
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-xl border-2 border-blue-600 bg-blue-50 relative cursor-default">
                    <div className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> IDEAL
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-blue-900">Aktual (Saat Ini)</span>
                      <span className="text-xs font-bold text-blue-700">{formatIDR(netProfit)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors cursor-default">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-600">Premium (Rev +20%)</span>
                      <span className="text-xs font-bold text-green-600">
                        {formatIDR(
                          (totalRevenue * 1.2) - totalCogs - totalOpex + 
                          (advanced.enabled ? advanced.otherIncome - advanced.interest - (((totalRevenue * 1.2) - totalCogs - totalOpex + advanced.otherIncome - advanced.interest) > 0 ? (((totalRevenue * 1.2) - totalCogs - totalOpex + advanced.otherIncome - advanced.interest) * advanced.taxRate / 100) : 0) : 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* COPY BUTTON */}
              <button 
                onClick={copyToClipboard}
                className="w-full bg-white border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 text-gray-700 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                <Copy className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" /> 
                Salin Ringkasan
              </button>

            </div>
          </div>
          
        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}