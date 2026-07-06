'use client';

import React, { useState, useMemo, useEffect } from 'react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface FormState {
  productName: string;
  category: string;
  hpp: number;
  opsCost: number;
  marketCost: number;
  shippingCost: number;
  packCost: number;
  otherCost: number;
  sellPrice: number;
  discountPct: number;
  cashback: number;
  adminFeePct: number;
  affiliateFeePct: number;
  targetMargin: number;
}

const INITIAL_STATE: FormState = {
  productName: '',
  category: 'Makanan',
  hpp: 0,
  opsCost: 0,
  marketCost: 0,
  shippingCost: 0,
  packCost: 0,
  otherCost: 0,
  sellPrice: 0,
  discountPct: 0,
  cashback: 0,
  adminFeePct: 0,
  affiliateFeePct: 0,
  targetMargin: 30,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const formatIDR = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number): string => {
  if (!isFinite(value)) return '0.0%';
  const cappedValue = Math.min(Math.max(value, -999), 1000); // Cap visual range
  return cappedValue.toFixed(1) + '%';
};

// ==========================================
// INLINE SVG ICONS (No External Libraries)
// ==========================================
const Icons = {
  Package: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Dollar: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  Sliders: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ==========================================
// REUSABLE COMPONENTS
// ==========================================
const Card = ({ children, title, icon: Icon }: { children: React.ReactNode, title?: string, icon?: React.ElementType }) => (
  <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
    {title && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
        {Icon && <div className="text-blue-600"><Icon /></div>}
        <h3 className="font-semibold text-gray-800 tracking-tight">{title}</h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

// ==========================================
// MAIN APPLICATION
// ==========================================
export default function MarginPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [toast, setToast] = useState<string | null>(null);

  // Update specific field securely
  const updateForm = (key: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Safe numeric parser for IDR input
  const handleCurrencyInput = (key: keyof FormState, val: string) => {
    const numericValue = parseInt(val.replace(/\D/g, ''), 10);
    updateForm(key, isNaN(numericValue) ? 0 : numericValue);
  };

  const handlePercentInput = (key: keyof FormState, val: string) => {
    const numericValue = parseFloat(val);
    updateForm(key, isNaN(numericValue) ? 0 : Math.max(0, numericValue)); // Prevent negative
  };

  // ==========================================
  // CORE BUSINESS LOGIC (Memoized)
  // ==========================================
  const calc = useMemo(() => {
    // 1. Total Modal
    const totalModal = form.hpp + form.opsCost + form.marketCost + form.shippingCost + form.packCost + form.otherCost;

    // 2. Deductions
    const discountRp = (form.sellPrice * form.discountPct) / 100;
    const adminFeeRp = (form.sellPrice * form.adminFeePct) / 100;
    const affiliateFeeRp = (form.sellPrice * form.affiliateFeePct) / 100;
    const totalDeductions = discountRp + form.cashback + adminFeeRp + affiliateFeeRp;

    // 3. Harga Jual Bersih
    const netSellPrice = form.sellPrice - totalDeductions;

    // 4. Profit & Metrics
    const profit = netSellPrice - totalModal;
    const margin = netSellPrice > 0 ? (profit / netSellPrice) * 100 : 0;
    const markup = totalModal > 0 ? (profit / totalModal) * 100 : 0;
    const roi = markup; 
    const breakEvenPrice = totalModal;

    // 5. Analysis Insight Engine
    let status = { text: '', color: '', bg: '', desc: '' };
    if (margin < 10) {
      status = { text: 'Margin Sangat Tipis', color: 'text-red-700', bg: 'bg-red-50 border-red-200', desc: 'Margin terlalu tipis, pertimbangkan menaikkan harga jual atau menekan biaya produksi.' };
    } else if (margin >= 10 && margin < 20) {
      status = { text: 'Margin Cukup', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', desc: 'Margin di batas aman, pantau terus pengeluaran tak terduga agar profitabilitas terjaga.' };
    } else if (margin >= 20 && margin < 35) {
      status = { text: 'Margin Sehat', color: 'text-green-700', bg: 'bg-green-50 border-green-200', desc: 'Margin sudah sehat untuk sebagian besar bisnis UMKM. Anda bisa fokus pada pertumbuhan volume.' };
    } else if (margin >= 35 && margin <= 50) {
      status = { text: 'Margin Sangat Baik', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', desc: 'Profitabilitas luar biasa! Bisnis memiliki ruang untuk memberikan diskon ekstra atau berekspansi.' };
    } else {
      status = { text: 'Margin Premium', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', desc: 'Kategori produk premium dengan profit sangat tinggi. Pastikan persepsi *value* produk Anda setara.' };
    }

    // 6. Visual Composition
    const safeBasePrice = form.sellPrice > 0 ? form.sellPrice : 1;
    const modalPct = Math.max(0, Math.min(100, (totalModal / safeBasePrice) * 100));
    const extraCostPct = Math.max(0, Math.min(100, (totalDeductions / safeBasePrice) * 100));
    const profitPct = Math.max(0, Math.min(100, (profit / safeBasePrice) * 100));

    // 7. Recommended Prices Engine (Reverse engineering sell price)
    const feePctTotal = (form.discountPct + form.adminFeePct + form.affiliateFeePct) / 100;
    const getRecPrice = (targetM: number) => {
      const M = targetM / 100;
      const denominator = (1 - feePctTotal) * (1 - M);
      if (denominator <= 0) return 0; // Invalid parameters condition
      const rawPrice = (totalModal - (form.cashback * (1 - M))) / denominator;
      return Math.max(0, rawPrice);
    };

    const recPrices = {
      10: getRecPrice(10),
      20: getRecPrice(20),
      30: getRecPrice(30),
      40: getRecPrice(40),
      50: getRecPrice(50),
    };

    // 8. Scenario Engine (-10%, Normal, +10%)
    const getScenario = (offset: number) => {
      const sp = form.sellPrice * (1 + offset / 100);
      const ded = (sp * feePctTotal) + form.cashback;
      const net = sp - ded;
      const p = net - totalModal;
      return {
        price: sp,
        margin: net > 0 ? (p / net) * 100 : 0
      };
    };

    return {
      totalModal, totalDeductions, netSellPrice, profit, margin, markup, roi, breakEvenPrice,
      status, modalPct, extraCostPct, profitPct, recPrices,
      scenarios: {
        down: getScenario(-10),
        normal: getScenario(0),
        up: getScenario(10)
      }
    };
  }, [form]);

  // ==========================================
  // ACTIONS
  // ==========================================
  const copyToClipboard = () => {
    const text = `==================================
📈 KALKULATOR MARGIN
Produk: ${form.productName || 'Tanpa Nama'}
Kategori: ${form.category}

Modal: ${formatIDR(calc.totalModal)}
Harga Jual: ${formatIDR(form.sellPrice)}
Profit: ${formatIDR(calc.profit)}
Margin: ${formatPercent(calc.margin)}
Markup: ${formatPercent(calc.markup)}
Status: ${calc.status.text}
==================================`;
    
    navigator.clipboard.writeText(text).then(() => {
      setToast('Ringkasan berhasil disalin.');
      setTimeout(() => setToast(null), 3000);
    });
  };

  const handleReset = () => {
    if (confirm('Anda yakin ingin mereset seluruh perhitungan?')) {
      setForm(INITIAL_STATE);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* HEADER SAAS PREMIUM */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
              📈
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Kalkulator Margin</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                  Professional Tool
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium hidden sm:block">
                Hitung margin keuntungan, markup, laba, dan rekomendasi harga secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border border-gray-700">
          <Icons.Check />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ==========================================
              KIRI (INPUT AREA - 65%)
              ========================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: PRODUK */}
            <Card title="Informasi Produk" icon={Icons.Package}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Produk</label>
                  <input 
                    type="text" 
                    value={form.productName}
                    onChange={(e) => updateForm('productName', e.target.value)}
                    placeholder="Contoh: Kopi Susu Aren"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                  <select 
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-shadow cursor-pointer"
                  >
                    {['Makanan', 'Minuman', 'Fashion', 'Jasa', 'Kerajinan', 'Lainnya'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* CARD 2: BIAYA (MODAL) */}
            <Card title="Struktur Biaya (HPP & Operasional)" icon={Icons.Dollar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Harga Pokok (HPP)', key: 'hpp' },
                  { label: 'Biaya Operasional per Produk', key: 'opsCost' },
                  { label: 'Biaya Admin Marketplace', key: 'marketCost' },
                  { label: 'Biaya Pengiriman/Logistik', key: 'shippingCost' },
                  { label: 'Biaya Kemasan (Packaging)', key: 'packCost' },
                  { label: 'Biaya Lainnya', key: 'otherCost' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{item.label}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium text-sm">Rp</span>
                      </div>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={form[item.key as keyof FormState] === 0 ? '' : (form[item.key as keyof FormState] as number).toLocaleString('id-ID')}
                        onChange={(e) => handleCurrencyInput(item.key as keyof FormState, e.target.value)}
                        placeholder="0"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none font-medium transition-shadow"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center shadow-inner">
                <span className="font-bold text-gray-700">Total Modal per Produk:</span>
                <span className="text-2xl font-black text-blue-700">{formatIDR(calc.totalModal)}</span>
              </div>
            </Card>

            {/* CARD 3: HARGA JUAL */}
            <Card title="Harga Jual & Potongan Pendapatan" icon={Icons.Tag}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Jual Saat Ini</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-600 font-bold">Rp</span>
                  </div>
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={form.sellPrice === 0 ? '' : form.sellPrice.toLocaleString('id-ID')}
                    onChange={(e) => handleCurrencyInput('sellPrice', e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border-2 border-blue-200 text-gray-900 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block pl-12 p-4 text-lg font-bold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: 'Diskon (%)', key: 'discountPct', isPercent: true },
                    { label: 'Cashback (Nominal Rp)', key: 'cashback', isPercent: false },
                    { label: 'Biaya Admin Pembayaran (%)', key: 'adminFeePct', isPercent: true },
                    { label: 'Biaya Affiliate (%)', key: 'affiliateFeePct', isPercent: true },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{item.label}</label>
                      <div className="relative">
                        {!item.isPercent && (
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <span className="text-gray-500 font-medium text-sm">Rp</span>
                           </div>
                        )}
                        <input 
                          type="text"
                          inputMode={item.isPercent ? "decimal" : "numeric"}
                          value={form[item.key as keyof FormState] === 0 ? '' : item.isPercent ? form[item.key as keyof FormState] : (form[item.key as keyof FormState] as number).toLocaleString('id-ID')}
                          onChange={(e) => item.isPercent ? handlePercentInput(item.key as keyof FormState, e.target.value) : handleCurrencyInput(item.key as keyof FormState, e.target.value)}
                          placeholder="0"
                          className={`w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block ${item.isPercent ? 'pr-8 pl-3' : 'pl-10 p-3'} p-3 outline-none transition-shadow`}
                        />
                        {item.isPercent && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-medium text-sm">%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* CARD 4 & 5: TARGET & SIMULASI SLIDER */}
            <Card title="Simulasi Interaktif & Target" icon={Icons.Sliders}>
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-sm font-semibold text-gray-700">Geser untuk melihat efek ke margin</label>
                  <span className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    {formatIDR(form.sellPrice)}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={calc.totalModal > 0 ? calc.totalModal * 4 : 500000} 
                  step={calc.totalModal > 0 ? (calc.totalModal > 100000 ? 5000 : 1000) : 1000}
                  value={form.sellPrice} 
                  onChange={(e) => updateForm('sellPrice', parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="text-sm font-semibold text-gray-700 block mb-3">Target Margin Impian (%)</label>
                <div className="flex flex-wrap gap-3">
                  {[10, 20, 30, 40, 50].map(val => (
                    <button
                      key={val}
                      onClick={() => updateForm('targetMargin', val)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        form.targetMargin === val 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      type="number"
                      value={form.targetMargin}
                      onChange={(e) => updateForm('targetMargin', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-gray-100 border-none text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-center"
                      placeholder="Custom"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm font-bold">%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* CARD 6: AKSI */}
            <div className="flex gap-4">
               <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Icons.Dashboard />
                  Lihat Dashboard Detail
                </button>
                <button 
                  onClick={handleReset}
                  className="bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold py-4 px-8 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 active:scale-95"
                >
                  Reset Semua
                </button>
            </div>
            
          </div>

          {/* ==========================================
              KANAN (STICKY DASHBOARD - 35%)
              ========================================== */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 space-y-6">
              
              {/* HASIL UTAMA */}
              <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-2xl shadow-blue-900/10 overflow-hidden relative">
                {/* Background glow decoration */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                
                <div className="p-6 relative z-10">
                  <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 tracking-tight">
                    <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Icons.Dashboard /></span>
                    Dashboard Margin
                  </h2>

                  {/* Highlight Utama */}
                  <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100 shadow-inner mb-6 relative overflow-hidden">
                    <span className="text-4xl block mb-2 drop-shadow-sm">🏆</span>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">MARGIN ANDA</span>
                    <span className={`text-5xl font-black tracking-tighter ${calc.margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatPercent(calc.margin)}
                    </span>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Harga Jual</span>
                      <span className="font-bold text-gray-900">{formatIDR(form.sellPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Total Modal</span>
                      <span className="font-bold text-red-500">-{formatIDR(calc.totalModal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Biaya Tambahan</span>
                      <span className="font-bold text-orange-500">-{formatIDR(calc.totalDeductions)}</span>
                    </div>
                    <div className="h-px bg-gray-200 my-2"></div>
                    <div className="flex justify-between items-center text-base">
                      <span className="font-black text-gray-900">Laba Bersih</span>
                      <span className={`font-black ${calc.profit >= 0 ? 'text-green-600' : 'text-red-600'} bg-green-50 px-3 py-1 rounded-lg`}>
                        {formatIDR(calc.profit)}
                      </span>
                    </div>
                  </div>

                  {/* Mini Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center">
                      <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Markup</span>
                      <span className="text-lg font-black text-gray-800">{formatPercent(calc.markup)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center">
                      <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">ROI</span>
                      <span className="text-lg font-black text-gray-800">{formatPercent(calc.roi)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD ANALISIS (INSIGHT OTOMATIS) */}
              <div className={`rounded-2xl border-2 p-5 ${calc.status.bg} transition-colors duration-300`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={calc.status.color}><Icons.Check /></div>
                  <h3 className={`font-bold text-lg tracking-tight ${calc.status.color}`}>{calc.status.text}</h3>
                </div>
                <p className={`text-sm font-medium leading-relaxed ${calc.status.color} opacity-90`}>
                  {calc.status.desc}
                </p>
              </div>

              {/* VISUAL PROGRESS BAR */}
              <Card>
                <h3 className="text-sm font-bold text-gray-800 mb-4 tracking-tight">Komposisi Harga Jual</h3>
                <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-red-400 transition-all duration-500 ease-out" style={{ width: `${calc.modalPct}%` }}></div>
                  <div className="h-full bg-orange-400 transition-all duration-500 ease-out" style={{ width: `${calc.extraCostPct}%` }}></div>
                  <div className="h-full bg-green-500 transition-all duration-500 ease-out" style={{ width: `${calc.profitPct}%` }}></div>
                </div>
                <div className="flex justify-between text-xs mt-4 font-semibold">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400"></span><span className="text-gray-600">Modal ({calc.modalPct.toFixed(0)}%)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400"></span><span className="text-gray-600">Biaya ({calc.extraCostPct.toFixed(0)}%)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-gray-600">Profit ({calc.profitPct.toFixed(0)}%)</span></div>
                </div>
              </Card>

              {/* REKOMENDASI HARGA (TARGET) */}
              <Card>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-sm font-bold text-gray-800 tracking-tight">Rekomendasi Harga Jual</h3>
                   <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded uppercase">Auto</span>
                 </div>
                 <div className="space-y-2.5">
                   {[10, 20, 30, 40, 50].map(m => (
                     <div key={m} className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${form.targetMargin === m ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-100'}`}>
                       <span className={`text-sm font-bold ${form.targetMargin === m ? 'text-blue-700' : 'text-gray-500'}`}>Target {m}%</span>
                       <span className={`text-sm font-black ${form.targetMargin === m ? 'text-blue-700' : 'text-gray-900'}`}>
                         {formatIDR(calc.recPrices[m as keyof typeof calc.recPrices])}
                       </span>
                     </div>
                   ))}
                 </div>
              </Card>

              {/* SIMULASI HARGA NAIK/TURUN */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-red-100 rounded-xl p-3 text-center shadow-sm">
                  <span className="block text-[10px] font-black text-red-600 uppercase mb-2 bg-red-50 py-1 rounded">Harga -10%</span>
                  <span className="block text-xs font-bold text-gray-500 mb-1">{formatIDR(calc.scenarios.down.price)}</span>
                  <span className="block text-sm font-black text-red-700">{formatPercent(calc.scenarios.down.margin)}</span>
                </div>
                <div className="bg-blue-600 rounded-xl p-3 text-center shadow-lg shadow-blue-600/30 relative overflow-hidden transform scale-105 z-10 border border-blue-500">
                  <span className="block text-[10px] font-black text-white uppercase mb-2 bg-blue-500 py-1 rounded">⭐ Normal</span>
                  <span className="block text-xs font-bold text-blue-100 mb-1">{formatIDR(calc.scenarios.normal.price)}</span>
                  <span className="block text-sm font-black text-white">{formatPercent(calc.scenarios.normal.margin)}</span>
                </div>
                <div className="bg-white border border-green-100 rounded-xl p-3 text-center shadow-sm">
                  <span className="block text-[10px] font-black text-green-600 uppercase mb-2 bg-green-50 py-1 rounded">Harga +10%</span>
                  <span className="block text-xs font-bold text-gray-500 mb-1">{formatIDR(calc.scenarios.up.price)}</span>
                  <span className="block text-sm font-black text-green-700">{formatPercent(calc.scenarios.up.margin)}</span>
                </div>
              </div>

              {/* BREAK EVEN & SALIN */}
              <div className="flex gap-3">
                <div className="flex-1 bg-gray-900 text-white rounded-xl p-5 flex flex-col justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-5 rounded-bl-full"></div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Harga Minimum (BEP)</span>
                  <span className="text-xl font-black">{formatIDR(calc.breakEvenPrice)}</span>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm group active:scale-95"
                  title="Salin Ringkasan"
                >
                  <div className="group-hover:scale-110 transition-transform"><Icons.Copy /></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Salin</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}