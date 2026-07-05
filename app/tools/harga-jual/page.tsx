"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, Plus, Trash2, Copy, Info, CheckCircle, 
  AlertTriangle, RefreshCw, ChevronRight, TrendingUp,
  AlertCircle
} from 'lucide-react';

// --- TYPES ---
interface ProductInfo {
  name: string;
  qty: number;
  unit: string;
}

interface Material {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface OperationalCosts {
  packaging: number;
  listrik: number;
  gas: number;
  internet: number;
  karyawan: number;
  transportasi: number;
  marketing: number;
  lainnya: number;
}

interface PercentageCosts {
  marketplace: number;
  paymentGateway: number;
  pajak: number;
  affiliate: number;
  cashback: number;
}

interface ProfitTarget {
  mode: 'percentage' | 'nominal';
  value: number;
  competitorPrice: number;
}

interface CalcResult {
  totalMaterial: number;
  totalOperational: number;
  totalCost: number; // HPP Total
  costPerItem: number; // HPP per item
  profitNominal: number; // Profit per item
  targetPriceBase: number; 
  totalFeePercentage: number;
  totalFeeNominal: number;
  finalPriceIdeal: number; // Harga Jual Ideal
  hargaMinimum: number; // Breakeven
  margin: number;
  markup: number;
}

// --- HELPER FUNCTIONS ---
const formatRp = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const parseNum = (val: string): number => {
  const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
};

// --- REUSABLE COMPONENTS ---
const Card = ({ children, title, className = "" }: { children: React.ReactNode, title?: string, className?: string }) => (
  <div className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
    {title && <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 font-semibold text-gray-800">{title}</div>}
    <div className="p-6">{children}</div>
  </div>
);

const InputGroup = ({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

const CurrencyInput = ({ value, onChange, placeholder = "0", max }: { value: number, onChange: (val: number) => void, placeholder?: string, max?: number }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Rp</span>
    <input
      type="text"
      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
      placeholder={placeholder}
      value={value === 0 ? '' : value.toLocaleString('id-ID')}
      onChange={(e) => {
        let val = parseNum(e.target.value);
        if (max !== undefined && val > max) val = max;
        onChange(val);
      }}
    />
  </div>
);

const PercentageInput = ({ value, onChange, placeholder = "0" }: { value: number, onChange: (val: number) => void, placeholder?: string }) => (
  <div className="relative">
    <input
      type="text"
      className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
      placeholder={placeholder}
      value={value === 0 ? '' : value}
      onChange={(e) => {
        let val = parseNum(e.target.value);
        if (val > 500) val = 500; // Max 500%
        onChange(val);
      }}
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">%</span>
  </div>
);


// --- MAIN APP COMPONENT ---
export default function HargaJualPage() {
  // STATE
  const [product, setProduct] = useState<ProductInfo>({ name: '', qty: 1, unit: 'Pcs' });
  
  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: '', qty: 1, price: 0 }
  ]);
  
  const [opsCosts, setOpsCosts] = useState<OperationalCosts>({
    packaging: 0, listrik: 0, gas: 0, internet: 0, karyawan: 0, transportasi: 0, marketing: 0, lainnya: 0
  });

  const [pctCosts, setPctCosts] = useState<PercentageCosts>({
    marketplace: 0, paymentGateway: 0, pajak: 0, affiliate: 0, cashback: 0
  });

  const [profitTarget, setProfitTarget] = useState<ProfitTarget>({
    mode: 'percentage', value: 30, competitorPrice: 0
  });

  const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // DERIVED CALCULATIONS (Real-time)
  const calculateData = (): CalcResult => {
    const qty = product.qty > 0 ? product.qty : 1;
    
    // 1. Total Material
    const totalMaterial = materials.reduce((sum, mat) => sum + (mat.qty * mat.price), 0);
    
    // 2. Total Operational
    const totalOperational = Object.values(opsCosts).reduce((sum, val) => sum + val, 0);
    
    // 3. HPP
    const totalCost = totalMaterial + totalOperational;
    const costPerItem = totalCost / qty;

    // 4. Profit Base
    let profitNominal = 0;
    if (profitTarget.mode === 'percentage') {
      profitNominal = costPerItem * (profitTarget.value / 100);
    } else {
      profitNominal = profitTarget.value;
    }

    // 5. Target Price (Before percentage fees)
    const targetPriceBase = costPerItem + profitNominal;

    // 6. Fees
    const totalFeePercentage = Object.values(pctCosts).reduce((sum, val) => sum + val, 0);
    // Prevent division by zero or negative price if fees are >= 100%
    const feeMultiplier = totalFeePercentage >= 100 ? 0.99 : (totalFeePercentage / 100);
    
    // Formula: Final Price - (Final Price * Fees%) = Target PriceBase
    // Final Price = Target PriceBase / (1 - Fees%)
    const finalPriceIdeal = totalFeePercentage > 0 
      ? targetPriceBase / (1 - feeMultiplier) 
      : targetPriceBase;

    const hargaMinimum = totalFeePercentage > 0
      ? costPerItem / (1 - feeMultiplier)
      : costPerItem;

    const totalFeeNominal = finalPriceIdeal - targetPriceBase;

    // 7. Metrics
    const margin = finalPriceIdeal > 0 ? (profitNominal / finalPriceIdeal) * 100 : 0;
    const markup = costPerItem > 0 ? (profitNominal / costPerItem) * 100 : 0;

    return {
      totalMaterial, totalOperational, totalCost, costPerItem,
      profitNominal, targetPriceBase, totalFeePercentage, totalFeeNominal,
      finalPriceIdeal, hargaMinimum, margin, markup
    };
  };

  const res = calculateData();

  // ACTIONS
  const addMaterial = () => {
    setMaterials([...materials, { id: Date.now().toString(), name: '', qty: 1, price: 0 }]);
  };

  const removeMaterial = (id: string) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const updateMaterial = (id: string, field: keyof Material, value: any) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleValidationAndScroll = () => {
    const newErrors: Record<string, string> = {};
    if (!product.name) newErrors.name = 'Nama produk wajib diisi';
    if (product.qty <= 0) newErrors.qty = 'Qty harus lebih dari 0';
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Kalkulasi berhasil divalidasi & diperbarui!');
    } else {
      showToast('Mohon lengkapi data yang ditandai merah.');
    }
  };

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleCopy = () => {
    const text = `==================================
📊 HASIL KALKULATOR HARGA JUAL
==================================
📦 Produk     : ${product.name || 'Produk Belum Diberi Nama'}
📦 Qty Produksi : ${product.qty} ${product.unit}

💰 Modal / HPP per item : ${formatRp(res.costPerItem)}
🎯 Profit per item      : ${formatRp(res.profitNominal)}
💸 Biaya Admin/Fee      : ${formatRp(res.totalFeeNominal)} (${res.totalFeePercentage}%)

💎 HARGA JUAL IDEAL   : ${formatRp(res.finalPriceIdeal)}
🛡️ Harga Jual Minimum : ${formatRp(res.hargaMinimum)}

📈 Markup : ${res.markup.toFixed(1)}%
📉 Margin : ${res.margin.toFixed(1)}%
==================================
Dihitung dengan Microtools UMKM`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Ringkasan berhasil disalin.');
    });
  };

  const resetAll = () => {
    if (window.confirm("Yakin ingin menghapus semua data?")) {
      setProduct({ name: '', qty: 1, unit: 'Pcs' });
      setMaterials([{ id: Date.now().toString(), name: '', qty: 1, price: 0 }]);
      setOpsCosts({ packaging: 0, listrik: 0, gas: 0, internet: 0, karyawan: 0, transportasi: 0, marketing: 0, lainnya: 0 });
      setPctCosts({ marketplace: 0, paymentGateway: 0, pajak: 0, affiliate: 0, cashback: 0 });
      setProfitTarget({ mode: 'percentage', value: 30, competitorPrice: 0 });
      setErrors({});
    }
  };

  // EDU INSIGHTS GENERATOR
  const getInsights = () => {
    const insights = [];
    if (res.margin < 15) insights.push({ type: 'warn', msg: 'Margin terlalu kecil (< 15%), rentan merugi jika ada biaya tak terduga.' });
    else insights.push({ type: 'good', msg: 'Margin sehat, bisnis memiliki ruang untuk berkembang.' });

    if (profitTarget.competitorPrice > 0) {
      if (res.finalPriceIdeal > profitTarget.competitorPrice * 1.2) {
        insights.push({ type: 'warn', msg: 'Harga Ideal jauh lebih tinggi dari kompetitor. Pastikan nilai jual (USP) Anda sangat kuat.' });
      } else if (res.finalPriceIdeal < profitTarget.competitorPrice * 0.8) {
        insights.push({ type: 'warn', msg: 'Harga terlalu rendah dibanding kompetitor. Anda bisa naikan profit!' });
      }
    }

    if (res.markup > 40) insights.push({ type: 'good', msg: 'Aman untuk sesekali memberikan diskon 10-15%.' });
    if (res.totalOperational === 0) insights.push({ type: 'alert', msg: 'Biaya operasional Rp 0. Hati-hati "Hidden Cost"! Listrik dan tenaga Anda bernilai uang.' });

    return insights;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20 selection:bg-blue-100 selection:text-blue-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md text-white">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Kalkulator Harga Jual UMKM</h1>
            <p className="text-sm text-gray-500 hidden md:block">Hitung harga jual yang sehat berdasarkan seluruh biaya usaha.</p>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ================= LEFT COLUMN (65%) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* CARD 1: Info Produk */}
            <Card title="1. Informasi Produk">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <InputGroup label="Nama Produk" error={errors.name}>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
                      placeholder="Cth: Keripik Pisang Coklat"
                      value={product.name}
                      onChange={(e) => setProduct({...product, name: e.target.value})}
                    />
                  </InputGroup>
                </div>
                <div className="md:col-span-3">
                  <InputGroup label="Jumlah Produksi" error={errors.qty}>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
                      value={product.qty}
                      onChange={(e) => setProduct({...product, qty: Math.max(1, parseInt(e.target.value) || 1)})}
                    />
                  </InputGroup>
                </div>
                <div className="md:col-span-3">
                  <InputGroup label="Satuan">
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
                      value={product.unit}
                      onChange={(e) => setProduct({...product, unit: e.target.value})}
                    />
                  </InputGroup>
                </div>
              </div>
            </Card>

            {/* CARD 2: Biaya Produksi (Bahan Baku) */}
            <Card title="2. Biaya Produksi (Bahan Baku)">
              <div className="hidden md:grid grid-cols-12 gap-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
                <div className="col-span-5">Nama Bahan</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3">Harga Satuan</div>
                <div className="col-span-2 text-right pr-8">Subtotal</div>
              </div>
              
              <div className="flex flex-col gap-3">
                {materials.map((mat, index) => (
                  <div key={mat.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center bg-gray-50/50 md:bg-transparent p-3 md:p-0 rounded-lg border border-gray-100 md:border-none">
                    <div className="md:col-span-5">
                      <span className="text-xs font-medium text-gray-500 md:hidden mb-1 block">Nama Bahan</span>
                      <input 
                        type="text" 
                        placeholder="Cth: Tepung Terigu" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                        value={mat.name}
                        onChange={(e) => updateMaterial(mat.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <div className="w-full">
                        <span className="text-xs font-medium text-gray-500 md:hidden mb-1 block">Qty</span>
                        <input 
                          type="number" 
                          min="0" step="0.1"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                          value={mat.qty}
                          onChange={(e) => updateMaterial(mat.id, 'qty', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <span className="text-xs font-medium text-gray-500 md:hidden mb-1 block">Harga Satuan</span>
                      <CurrencyInput 
                        value={mat.price} 
                        onChange={(val) => updateMaterial(mat.id, 'price', val)} 
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                      <div className="text-sm font-semibold text-gray-700">
                        <span className="md:hidden text-gray-500 font-normal mr-2">Subtotal:</span>
                        {formatRp(mat.qty * mat.price)}
                      </div>
                      <button 
                        onClick={() => removeMaterial(mat.id)}
                        disabled={materials.length === 1}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title="Hapus bahan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-dashed border-gray-200 pt-5">
                <button 
                  onClick={addMaterial}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={16} /> Tambah Bahan
                </button>
                <div className="text-right">
                  <span className="text-sm text-gray-500 mr-3">Total Bahan Baku:</span>
                  <span className="text-lg font-bold text-gray-900">{formatRp(res.totalMaterial)}</span>
                </div>
              </div>
            </Card>

            {/* CARD 3: Biaya Operasional */}
            <Card title="3. Biaya Operasional (Opsional tapi Penting!)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <InputGroup label="Packaging / Kemasan">
                  <CurrencyInput value={opsCosts.packaging} onChange={(v) => setOpsCosts({...opsCosts, packaging: v})} />
                </InputGroup>
                <InputGroup label="Tenaga Kerja / Karyawan">
                  <CurrencyInput value={opsCosts.karyawan} onChange={(v) => setOpsCosts({...opsCosts, karyawan: v})} />
                </InputGroup>
                <InputGroup label="Listrik & Air">
                  <CurrencyInput value={opsCosts.listrik} onChange={(v) => setOpsCosts({...opsCosts, listrik: v})} />
                </InputGroup>
                <InputGroup label="Internet & Komunikasi">
                  <CurrencyInput value={opsCosts.internet} onChange={(v) => setOpsCosts({...opsCosts, internet: v})} />
                </InputGroup>
                <InputGroup label="Transportasi / Bensin">
                  <CurrencyInput value={opsCosts.transportasi} onChange={(v) => setOpsCosts({...opsCosts, transportasi: v})} />
                </InputGroup>
                <InputGroup label="Marketing / Iklan">
                  <CurrencyInput value={opsCosts.marketing} onChange={(v) => setOpsCosts({...opsCosts, marketing: v})} />
                </InputGroup>
                <InputGroup label="Gas Produksi">
                  <CurrencyInput value={opsCosts.gas} onChange={(v) => setOpsCosts({...opsCosts, gas: v})} />
                </InputGroup>
                <InputGroup label="Lainnya (Penyusutan Alat, dll)">
                  <CurrencyInput value={opsCosts.lainnya} onChange={(v) => setOpsCosts({...opsCosts, lainnya: v})} />
                </InputGroup>
              </div>
              <div className="mt-4 flex justify-end border-t border-dashed border-gray-200 pt-4">
                <div className="text-right">
                  <span className="text-sm text-gray-500 mr-3">Total Operasional:</span>
                  <span className="text-lg font-bold text-gray-900">{formatRp(res.totalOperational)}</span>
                </div>
              </div>
            </Card>

            {/* CARD 4: Biaya Persentase */}
            <Card title="4. Biaya Persentase (Potongan Platform)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputGroup label="Fee Marketplace">
                  <PercentageInput value={pctCosts.marketplace} onChange={(v) => setPctCosts({...pctCosts, marketplace: v})} />
                </InputGroup>
                <InputGroup label="Payment Gateway">
                  <PercentageInput value={pctCosts.paymentGateway} onChange={(v) => setPctCosts({...pctCosts, paymentGateway: v})} />
                </InputGroup>
                <InputGroup label="Pajak (PPN/PPh)">
                  <PercentageInput value={pctCosts.pajak} onChange={(v) => setPctCosts({...pctCosts, pajak: v})} />
                </InputGroup>
                <InputGroup label="Affiliate Fee">
                  <PercentageInput value={pctCosts.affiliate} onChange={(v) => setPctCosts({...pctCosts, affiliate: v})} />
                </InputGroup>
                <InputGroup label="Cashback Promo">
                  <PercentageInput value={pctCosts.cashback} onChange={(v) => setPctCosts({...pctCosts, cashback: v})} />
                </InputGroup>
              </div>
              <div className="mt-2 text-sm text-gray-500 flex items-start gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p>Total potongan saat ini: <strong className="text-gray-800">{res.totalFeePercentage}%</strong>. Persentase ini akan diperhitungkan ke dalam Harga Jual agar profit Anda tidak tergerus.</p>
              </div>
            </Card>

            {/* CARD 5: Target Profit */}
            <Card title="5. Target Keuntungan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Mode Target Profit</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                    <button
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${profitTarget.mode === 'percentage' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setProfitTarget({...profitTarget, mode: 'percentage', value: 30})}
                    >
                      Persentase (%)
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${profitTarget.mode === 'nominal' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setProfitTarget({...profitTarget, mode: 'nominal', value: 10000})}
                    >
                      Nominal (Rp)
                    </button>
                  </div>
                  
                  <InputGroup label={`Besaran Profit (${profitTarget.mode === 'percentage' ? 'dari HPP' : 'per item'})`}>
                    {profitTarget.mode === 'percentage' ? (
                      <PercentageInput value={profitTarget.value} onChange={(v) => setProfitTarget({...profitTarget, value: v})} />
                    ) : (
                      <CurrencyInput value={profitTarget.value} onChange={(v) => setProfitTarget({...profitTarget, value: v})} />
                    )}
                  </InputGroup>
                </div>
                
                <div>
                  <InputGroup label="Harga Kompetitor (Opsional)">
                    <CurrencyInput 
                      value={profitTarget.competitorPrice} 
                      onChange={(v) => setProfitTarget({...profitTarget, competitorPrice: v})} 
                      placeholder="Untuk perbandingan di hasil akhir"
                    />
                  </InputGroup>
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Ekspektasi Profit per Item:</div>
                    <div className="text-xl font-bold text-green-600">{formatRp(res.profitNominal)}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* CARD 6: Actions */}
            <div className="flex gap-4 mt-2">
              <button 
                onClick={handleValidationAndScroll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <CheckCircle size={20} className="group-hover:scale-110 transition-transform" /> Validasi & Tampilkan Hasil
              </button>
              <button 
                onClick={resetAll}
                className="bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 font-medium py-4 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} /> Reset
              </button>
            </div>

          </div>


          {/* ================= RIGHT COLUMN (35% - STICKY) ================= */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-5">
              
              {/* HASIL UTAMA */}
              <Card className="border-blue-100 overflow-visible relative">
                {/* Decorative blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} /> Dashboard Hasil
                </h2>
                
                {/* Main Highlight */}
                <div className="bg-blue-600 text-white p-5 rounded-xl shadow-md mb-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                    <Calculator size={64} />
                  </div>
                  <div className="text-blue-100 text-sm font-medium mb-1 relative z-10">Harga Jual Rekomendasi</div>
                  <div className="text-3xl font-extrabold tracking-tight relative z-10 mb-2">{formatRp(res.finalPriceIdeal)}</div>
                  <div className="text-blue-200 text-xs flex justify-between relative z-10 pt-3 border-t border-blue-500/30">
                    <span>HPP: {formatRp(res.costPerItem)}</span>
                    <span>Profit: {formatRp(res.profitNominal)}</span>
                  </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Total Modal (Semua Qty)</div>
                    <div className="font-semibold text-gray-800">{formatRp(res.totalCost)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Harga Pokok (1 {product.unit || 'Item'})</div>
                    <div className="font-semibold text-gray-800">{formatRp(res.costPerItem)}</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <div className="text-xs text-orange-600 mb-1">Harga Jual Minimum</div>
                    <div className="font-semibold text-orange-800">{formatRp(res.hargaMinimum)}</div>
                    <div className="text-[10px] text-orange-500 mt-0.5">Titik impas (Breakeven)</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 mb-1">Total Biaya Platform</div>
                    <div className="font-semibold text-green-800">{formatRp(res.totalFeeNominal)}</div>
                    <div className="text-[10px] text-green-500 mt-0.5">Potongan {res.totalFeePercentage}%</div>
                  </div>
                </div>

                {/* Margin & Markup */}
                <div className="flex items-center gap-4 py-3 border-y border-gray-100">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Margin Profit</div>
                    <div className="text-lg font-bold text-gray-800">{res.margin.toFixed(1)}%</div>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Markup HPP</div>
                    <div className="text-lg font-bold text-gray-800">{res.markup.toFixed(1)}%</div>
                  </div>
                </div>
              </Card>

              {/* DISTRIBUSI BIAYA */}
              <Card title="Distribusi Komponen Harga">
                <div className="flex h-4 rounded-full overflow-hidden mb-4 bg-gray-100">
                  {res.finalPriceIdeal > 0 && (
                    <>
                      <div 
                        className="bg-slate-400 transition-all duration-500" 
                        style={{ width: `${(res.costPerItem / res.finalPriceIdeal) * 100}%` }}
                        title="Modal/HPP"
                      ></div>
                      <div 
                        className="bg-green-500 transition-all duration-500" 
                        style={{ width: `${(res.profitNominal / res.finalPriceIdeal) * 100}%` }}
                        title="Profit Bersih"
                      ></div>
                      <div 
                        className="bg-red-400 transition-all duration-500" 
                        style={{ width: `${(res.totalFeeNominal / res.finalPriceIdeal) * 100}%` }}
                        title="Biaya Platform"
                      ></div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></div> Modal
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></div> Profit
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0"></div> Biaya Admin
                  </div>
                </div>
              </Card>

              {/* SIMULASI HARGA */}
              <Card title="Simulasi Harga" className="bg-gray-900 border-gray-800 text-white">
                <div className="grid grid-cols-3 gap-3">
                  {/* Hemat */}
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center text-center hover:bg-gray-700 transition-colors">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Agresif</div>
                    <div className="font-bold text-sm text-white">{formatRp(res.targetPriceBase - (res.profitNominal * 0.5))}</div>
                    <div className="text-xs text-gray-500 mt-1">Profit 50%↓</div>
                  </div>
                  {/* Ideal */}
                  <div className="bg-blue-600 rounded-lg p-3 border border-blue-500 flex flex-col items-center text-center relative shadow-lg shadow-blue-900/50">
                    <div className="absolute -top-2.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      REKOMENDASI
                    </div>
                    <div className="text-[10px] text-blue-200 uppercase tracking-wider mb-1 mt-1">Ideal</div>
                    <div className="font-bold text-sm text-white">{formatRp(res.finalPriceIdeal)}</div>
                    <div className="text-xs text-blue-200 mt-1">Sesuai Target</div>
                  </div>
                  {/* Premium */}
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center text-center hover:bg-gray-700 transition-colors">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Premium</div>
                    <div className="font-bold text-sm text-white">{formatRp(res.finalPriceIdeal + (res.profitNominal * 0.5))}</div>
                    <div className="text-xs text-gray-500 mt-1">Profit 50%↑</div>
                  </div>
                </div>
              </Card>

              {/* EDUKASI & INSIGHTS */}
              <Card className="bg-blue-50/50 border-blue-100">
                <div className="flex items-center gap-2 font-semibold text-blue-900 mb-4">
                  <Info size={18} className="text-blue-600" /> Analisa Cerdas
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  {getInsights().map((insight, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      {insight.type === 'good' && <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />}
                      {insight.type === 'warn' && <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />}
                      {insight.type === 'alert' && <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                      <span className="text-gray-700 leading-relaxed">{insight.msg}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* TOMBOL SALIN */}
              <button 
                onClick={handleCopy}
                className="w-full bg-white border-2 border-gray-200 hover:border-blue-600 text-gray-700 hover:text-blue-600 font-semibold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group"
              >
                <Copy size={20} className="group-hover:scale-110 transition-transform" /> Salin Ringkasan
              </button>

            </div>
          </div>

        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'} z-50`}>
        <CheckCircle size={20} className="text-green-400" />
        <span className="font-medium text-sm">{toast.msg}</span>
      </div>

    </div>
  );
}