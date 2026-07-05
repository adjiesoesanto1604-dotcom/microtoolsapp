"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Plus, 
  Trash2, 
  Copy, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  RefreshCcw,
  Calculator,
  Store,
  Shirt
} from 'lucide-react';

// --- Interfaces & Types ---
interface CostItem {
  id: string;
  name: string;
  amount: number;
}

// --- Utility Functions ---
const formatRupiah = (number: number): string => {
  if (isNaN(number) || number === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const parseRupiah = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  return parseInt(numericString, 10) || 0;
};

// --- Initial Data ---
const DEFAULT_FIXED_COSTS: CostItem[] = [
  { id: '1', name: 'Sewa tempat', amount: 2000000 },
  { id: '2', name: 'Gaji karyawan', amount: 3000000 },
  { id: '3', name: 'Listrik & Air', amount: 500000 },
];

const DEFAULT_VARIABLE_COSTS: CostItem[] = [
  { id: '1', name: 'Bahan baku', amount: 3000 },
  { id: '2', name: 'Kemasan', amount: 500 },
];

const TEMPLATES = {
  warung: {
    name: 'Warung Makan',
    fixed: [
      { id: 'w1', name: 'Sewa Ruko', amount: 1500000 },
      { id: 'w2', name: 'Gaji Pelayan (2 org)', amount: 2400000 },
      { id: 'w3', name: 'Retribusi & Listrik', amount: 300000 },
    ],
    variable: [
      { id: 'wv1', name: 'Bahan Baku Makanan', amount: 7000 },
      { id: 'wv2', name: 'Beras & Bumbu', amount: 2000 },
      { id: 'wv3', name: 'Gas & Air (per porsi)', amount: 500 },
    ],
    price: 15000,
    target: 1000
  },
  konveksi: {
    name: 'Konveksi Kaos',
    fixed: [
      { id: 'k1', name: 'Sewa Gudang', amount: 3000000 },
      { id: 'k2', name: 'Cicilan Mesin Jahit', amount: 1000000 },
      { id: 'k3', name: 'Gaji Admin', amount: 2000000 },
    ],
    variable: [
      { id: 'kv1', name: 'Kain Cotton Combed', amount: 25000 },
      { id: 'kv2', name: 'Sablon & Benang', amount: 10000 },
      { id: 'kv3', name: 'Plastik & Label', amount: 1000 },
    ],
    price: 55000,
    target: 500
  }
};

type TemplateKey = keyof typeof TEMPLATES;

export default function BEPPage() {
  // --- State ---
  const [businessName, setBusinessName] = useState<string>('Bisnis Saya');
  const [period, setPeriod] = useState<string>('Bulanan');
  
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>(DEFAULT_FIXED_COSTS);
  const [variableCosts, setVariableCosts] = useState<CostItem[]>(DEFAULT_VARIABLE_COSTS);
  
  const [sellingPrice, setSellingPrice] = useState<number>(15000);
  const [targetSales, setTargetSales] = useState<number>(1000);

  const [copied, setCopied] = useState<boolean>(false);

  // --- Handlers ---
  const handleAddFixedCost = () => {
    setFixedCosts([...fixedCosts, { id: Date.now().toString(), name: '', amount: 0 }]);
  };

  const handleRemoveFixedCost = (id: string) => {
    setFixedCosts(fixedCosts.filter(c => c.id !== id));
  };

  const handleFixedCostChange = <K extends keyof CostItem>(id: string, field: K, value: CostItem[K]) => {
    setFixedCosts(fixedCosts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleAddVariableCost = () => {
    setVariableCosts([...variableCosts, { id: Date.now().toString(), name: '', amount: 0 }]);
  };

  const handleRemoveVariableCost = (id: string) => {
    setVariableCosts(variableCosts.filter(c => c.id !== id));
  };

  const handleVariableCostChange = <K extends keyof CostItem>(id: string, field: K, value: CostItem[K]) => {
    setVariableCosts(variableCosts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const applyTemplate = (key: TemplateKey) => {
    const tpl = TEMPLATES[key];
    setBusinessName(tpl.name);
    setFixedCosts(tpl.fixed);
    setVariableCosts(tpl.variable);
    setSellingPrice(tpl.price);
    setTargetSales(tpl.target);
  };

  // --- Calculations ---
  const totalFixedCost = useMemo(() => fixedCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0), [fixedCosts]);
  const totalVariableCost = useMemo(() => variableCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0), [variableCosts]);
  
  const contributionMargin = sellingPrice - totalVariableCost;
  const contributionMarginRatio = sellingPrice > 0 ? (contributionMargin / sellingPrice) * 100 : 0;
  
  const isLossMaking = contributionMargin <= 0;
  
  const bepUnit = isLossMaking ? 0 : Math.ceil(totalFixedCost / contributionMargin);
  const bepOmzet = isLossMaking ? 0 : Math.ceil(totalFixedCost / (contributionMarginRatio / 100));

  // --- Insights Logic ---
  const getInsights = () => {
    if (isLossMaking) {
      return {
        type: 'danger',
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        text: 'RUGI PASTI: Biaya variabel lebih besar dari harga jual. Bisnis akan rugi di setiap unit yang terjual. Naikkan harga atau tekan biaya variabel segera!',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200'
      };
    }
    
    if (contributionMarginRatio < 25) {
      return {
        type: 'warning',
        icon: <Info className="w-5 h-5 text-yellow-600" />,
        text: 'RISIKO TINGGI: Margin kontribusi sangat tipis. Bisnis butuh volume penjualan yang sangat tinggi hanya untuk balik modal. Rentan terhadap fluktuasi biaya.',
        color: 'text-yellow-800',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200'
      };
    }

    if (contributionMarginRatio > 50) {
      return {
        type: 'success',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'SEHAT: Margin kontribusi sangat baik. Struktur biaya efisien. Fokuslah pada agresivitas marketing untuk mendongkrak volume penjualan.',
        color: 'text-green-800',
        bg: 'bg-green-50',
        border: 'border-green-200'
      };
    }

    return {
      type: 'normal',
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      text: 'NORMAL: Struktur biaya standar. Pantau biaya tetap agar tidak membengkak dan jaga konsistensi penjualan.',
      color: 'text-blue-800',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    };
  };

  const insights = getInsights();

  // --- Scenarios ---
  const scenarioHemat = useMemo(() => {
    const savedFixed = totalFixedCost * 0.9;
    return isLossMaking ? 0 : Math.ceil(savedFixed / contributionMargin);
  }, [totalFixedCost, contributionMargin, isLossMaking]);

  const scenarioPremium = useMemo(() => {
    const premiumPrice = sellingPrice * 1.2;
    const premiumMargin = premiumPrice - totalVariableCost;
    return premiumMargin <= 0 ? 0 : Math.ceil(totalFixedCost / premiumMargin);
  }, [sellingPrice, totalVariableCost, totalFixedCost]);


  // --- Clipboard ---
  const handleCopy = () => {
    const summary = `
========================
📊 TITIK IMPAS (BEP)
Bisnis: ${businessName}
Periode: ${period}
------------------------
BEP Unit: ${new Intl.NumberFormat('id-ID').format(bepUnit)} unit
BEP Omzet: ${formatRupiah(bepOmzet)}
Margin Kontribusi: ${formatRupiah(contributionMargin)}/unit (${contributionMarginRatio.toFixed(1)}%)
------------------------
Status: ${isLossMaking ? 'RUGI' : contributionMarginRatio < 25 ? 'RISIKO TINGGI' : 'UNTUNG / SEHAT'}
========================
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20 selection:bg-blue-100">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Kalkulator BEP (Titik Impas)</h1>
              <p className="text-sm text-gray-500 font-medium">Hitung titik impas dan analisis kelayakan margin bisnis Anda.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Templates */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-sm font-semibold text-gray-500 flex items-center gap-2">
            <Info className="w-4 h-4" /> Coba Template Data:
          </span>
          <div className="flex gap-3">
            <button 
              onClick={() => applyTemplate('warung')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-lg text-sm font-medium transition-all"
            >
              <Store className="w-4 h-4" /> Warung Makan
            </button>
            <button 
              onClick={() => applyTemplate('konveksi')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-lg text-sm font-medium transition-all"
            >
              <Shirt className="w-4 h-4" /> Konveksi
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* =========================================
              KIRI: PANEL INPUT (65%)
          ========================================= */}
          <div className="w-full lg:w-[65%] space-y-6">
            
            {/* 1. Info Bisnis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                Informasi Bisnis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Nama Bisnis / Produk</label>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                    placeholder="Contoh: Kopi Kenangan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1.5">Periode Perhitungan</label>
                  <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white"
                  >
                    <option>Bulanan</option>
                    <option>Tahunan</option>
                    <option>Mingguan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Biaya Tetap */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                    Biaya Tetap (Fixed Costs)
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Biaya yang harus dibayar rutin walau tidak ada penjualan.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block mb-1">Total Biaya Tetap</span>
                  <span className="text-lg font-bold text-gray-900">{formatRupiah(totalFixedCost)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {fixedCosts.map((cost) => (
                  <div key={cost.id} className="flex gap-3 items-center group">
                    <input 
                      type="text" 
                      value={cost.name}
                      onChange={(e) => handleFixedCostChange(cost.id, 'name', e.target.value)}
                      placeholder="Nama Biaya"
                      className="w-1/2 px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none transition-colors"
                    />
                    <div className="relative w-1/2">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                      <input 
                        type="text"
                        value={cost.amount === 0 ? '' : new Intl.NumberFormat('id-ID').format(cost.amount)}
                        onChange={(e) => handleFixedCostChange(cost.id, 'amount', parseRupiah(e.target.value))}
                        placeholder="0"
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveFixedCost(cost.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleAddFixedCost}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Biaya Tetap
              </button>
            </div>

            {/* 3. Biaya Variabel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
                    Biaya Variabel per Unit
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Biaya produksi yang keluar untuk membuat 1 unit produk.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block mb-1">Total Variabel/Unit</span>
                  <span className="text-lg font-bold text-gray-900">{formatRupiah(totalVariableCost)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {variableCosts.map((cost) => (
                  <div key={cost.id} className="flex gap-3 items-center">
                    <input 
                      type="text" 
                      value={cost.name}
                      onChange={(e) => handleVariableCostChange(cost.id, 'name', e.target.value)}
                      placeholder="Nama Biaya (Cth: Bahan Baku)"
                      className="w-1/2 px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none transition-colors"
                    />
                    <div className="relative w-1/2">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                      <input 
                        type="text"
                        value={cost.amount === 0 ? '' : new Intl.NumberFormat('id-ID').format(cost.amount)}
                        onChange={(e) => handleVariableCostChange(cost.id, 'amount', parseRupiah(e.target.value))}
                        placeholder="0"
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveVariableCost(cost.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleAddVariableCost}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Biaya Variabel
              </button>
            </div>

            {/* 4. Harga Jual & Target */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">4</span>
                Harga Jual & Target
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Harga Jual per Unit</label>
                  <p className="text-xs text-gray-500 mb-2">Berapa Anda menjual 1 unit produk/jasa?</p>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                    <input 
                      type="text"
                      value={sellingPrice === 0 ? '' : new Intl.NumberFormat('id-ID').format(sellingPrice)}
                      onChange={(e) => setSellingPrice(parseRupiah(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-lg font-bold text-gray-900 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Target Penjualan (Opsional)</label>
                  <p className="text-xs text-gray-500 mb-2">Target unit yang ingin dijual per {period.toLowerCase()}.</p>
                  <div className="relative">
                    <input 
                      type="text"
                      value={targetSales === 0 ? '' : new Intl.NumberFormat('id-ID').format(targetSales)}
                      onChange={(e) => setTargetSales(parseRupiah(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-lg font-bold text-gray-900 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-3 text-gray-500 font-medium">Unit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aksi */}
            <div className="flex gap-4 pt-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex justify-center items-center gap-2">
                <Calculator className="w-5 h-5" />
                Data Tersimpan (Real-time)
              </button>
              <button 
                onClick={() => {
                  setFixedCosts([]); setVariableCosts([]); setSellingPrice(0); setTargetSales(0);
                }}
                className="px-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* =========================================
              KANAN: DASHBOARD OUTPUT (35% STICKY)
          ========================================= */}
          <div className="w-full lg:w-[35%] lg:sticky lg:top-24 space-y-5 self-start">
            
            {/* KARTU 1: HASIL UTAMA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-blue-600 p-6 text-white">
                <p className="text-blue-100 text-sm font-medium mb-1">Titik Impas (BEP) Unit</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black tracking-tight">{isLossMaking ? '∞' : new Intl.NumberFormat('id-ID').format(bepUnit)}</h3>
                  <span className="text-blue-200 font-medium">Unit</span>
                </div>
                <p className="text-blue-100 text-sm mt-3 opacity-90">
                  Anda harus menjual {isLossMaking ? '?' : new Intl.NumberFormat('id-ID').format(bepUnit)} unit per {period.toLowerCase()} agar tidak rugi.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-500 font-medium">BEP Omzet</span>
                  <span className="text-lg font-bold text-gray-900">{formatRupiah(bepOmzet)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-500 font-medium">Margin Kontribusi</span>
                  <span className="text-lg font-bold text-gray-900">{formatRupiah(contributionMargin)} <span className="text-xs text-gray-400 font-normal">/ unit</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Rasio Margin</span>
                  <span className="text-lg font-bold text-gray-900">{contributionMarginRatio.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* KARTU 2: INSIGHT OTOMATIS */}
            <div className={`rounded-xl border p-5 flex items-start gap-3 transition-colors ${insights.bg} ${insights.border}`}>
              <div className="shrink-0 mt-0.5">{insights.icon}</div>
              <div>
                <h4 className={`font-bold text-sm mb-1 ${insights.color}`}>Diagnosis Bisnis</h4>
                <p className={`text-sm leading-relaxed ${insights.color} opacity-90`}>
                  {insights.text}
                </p>
              </div>
            </div>

            {/* KARTU 3: DISTRIBUSI VISUAL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Uang dari 1 Unit Produk Ke Mana?</h4>
              {sellingPrice > 0 ? (
                <div>
                  <div className="h-6 w-full rounded-full overflow-hidden flex bg-gray-100 mb-2">
                    <div 
                      className="bg-red-400 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (totalVariableCost / sellingPrice) * 100)}%` }}
                    ></div>
                    <div 
                      className="bg-green-500 h-full transition-all duration-500"
                      style={{ width: `${Math.max(0, contributionMarginRatio)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-red-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      Biaya Variabel ({((totalVariableCost / sellingPrice) * 100).toFixed(0)}%)
                    </div>
                    <div className="flex items-center gap-1.5 text-green-700">
                      Margin untuk Laba ({Math.max(0, contributionMarginRatio).toFixed(0)}%)
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center">Masukkan harga jual terlebih dahulu.</p>
              )}
            </div>

            {/* KARTU 4: SIMULASI */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                Simulasi Skenario
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700">Saat Ini (Aktual)</p>
                    <p className="text-[11px] text-gray-500">Kondisi bisnis sesuai input</p>
                  </div>
                  <span className="font-bold text-gray-900">{isLossMaking ? '-' : new Intl.NumberFormat('id-ID').format(bepUnit)} <span className="text-xs font-normal">unit</span></span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div>
                    <p className="text-xs font-bold text-blue-800">Mode Hemat</p>
                    <p className="text-[11px] text-blue-600/70">Biaya Tetap dipotong 10%</p>
                  </div>
                  <span className="font-bold text-blue-700">{scenarioHemat === 0 ? '-' : new Intl.NumberFormat('id-ID').format(scenarioHemat)} <span className="text-xs font-normal">unit</span></span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Harga Premium</p>
                    <p className="text-[11px] text-emerald-600/70">Harga Jual dinaikkan 20%</p>
                  </div>
                  <span className="font-bold text-emerald-700">{scenarioPremium === 0 ? '-' : new Intl.NumberFormat('id-ID').format(scenarioPremium)} <span className="text-xs font-normal">unit</span></span>
                </div>
              </div>
            </div>

            {/* KARTU 5: SALIN */}
            <button 
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-bold transition-all ${
                copied 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Tersalin ke Clipboard!' : 'Salin Ringkasan BEP'}
            </button>

          </div>
        </div>
        
        {/* =========================================
            BAWAH: EDUKASI (100% WIDTH)
        ========================================= */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📚 Edukasi Keuangan: Memahami BEP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div>
              <h4 className="font-bold text-blue-700 mb-2">Apa itu Titik Impas (BEP)?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kondisi di mana bisnis Anda <strong>tidak untung tapi juga tidak rugi</strong> (Balik Modal). Pendapatan yang masuk pas-pasan hanya untuk menutupi seluruh biaya operasional.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-blue-700 mb-2">Komponen Utama</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><span className="font-semibold text-gray-800">Biaya Tetap:</span> Sewa, Gaji Pokok, Penyusutan alat. (Pasti keluar tiap bulan).</li>
                <li><span className="font-semibold text-gray-800">Biaya Variabel:</span> Bahan baku, kemasan, komisi. (Berubah tergantung jumlah produksi).</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-blue-700 mb-2">Rumus Rahasia (Margin Kontribusi)</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                Jangan cuma lihat Laba Bersih. Lihat <strong>Margin Kontribusi</strong> (Harga Jual - Biaya Variabel). 
              </p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-mono text-gray-700">
                BEP = Biaya Tetap / Margin Kontribusi
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}