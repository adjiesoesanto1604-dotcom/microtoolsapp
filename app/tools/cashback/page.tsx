"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';

// --- TYPES & INTERFACES ---
interface FormState {
  namaProduk: string;
  kategori: string;
  hargaModal: number;
  hargaJual: number;
  jumlah: number;
  cashbackPercent: number;
  cashbackNominal: number;
  voucher: number;
  diskon: number;
  biayaAdminPercent: number;
  biayaAffiliatePercent: number;
  promoMarketplace: boolean;
  promoToko: boolean;
  promoVoucher: boolean;
  promoGratisOngkir: boolean;
  gratisOngkirNominal: number;
  targetProfitPercent: number;
}

interface CalculationResult {
  totalPenjualan: number;
  cashbackAmount: number;
  adminAmount: number;
  affiliateAmount: number;
  totalPotongan: number;
  hargaBersih: number;
  profit: number;
  margin: number;
  markup: number;
  profitTanpaCashback: number;
  pendapatanTanpaCashback: number;
  marginTanpaCashback: number;
  maxCashbackNominal: number;
  maxCashbackPercent: number;
  minHargaJual: number;
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
  return numericString ? parseInt(numericString, 10) : 0;
};

// --- MAIN COMPONENT ---
export default function CashbackPage() {
  // --- STATE ---
  const [form, setForm] = useState<FormState>({
    namaProduk: '',
    kategori: 'Lainnya',
    hargaModal: 0,
    hargaJual: 0,
    jumlah: 1,
    cashbackPercent: 0,
    cashbackNominal: 0,
    voucher: 0,
    diskon: 0,
    biayaAdminPercent: 0,
    biayaAffiliatePercent: 0,
    promoMarketplace: false,
    promoToko: false,
    promoVoucher: false,
    promoGratisOngkir: false,
    gratisOngkirNominal: 0,
    targetProfitPercent: 20,
  });

  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- LOGIC CALCULATIONS ---
  const calc = useMemo<CalculationResult>(() => {
    const {
      hargaModal,
      hargaJual,
      jumlah,
      cashbackPercent,
      cashbackNominal,
      voucher,
      diskon,
      biayaAdminPercent,
      biayaAffiliatePercent,
      gratisOngkirNominal,
      targetProfitPercent,
      promoGratisOngkir,
      promoVoucher,
    } = form;

    const totalPenjualan = hargaJual * jumlah;

    // Hitung potongan per item
    const cashbackAmount = (hargaJual * (cashbackPercent / 100)) + cashbackNominal;
    const activeVoucher = promoVoucher ? voucher : 0;
    const adminAmount = hargaJual * (biayaAdminPercent / 100);
    const affiliateAmount = hargaJual * (biayaAffiliatePercent / 100);
    const activeGratisOngkir = promoGratisOngkir ? gratisOngkirNominal : 0;

    const totalPotongan = cashbackAmount + activeVoucher + diskon + adminAmount + affiliateAmount + activeGratisOngkir;
    const hargaBersih = hargaJual - totalPotongan;
    const profit = hargaBersih - hargaModal;

    // Handle Division by Zero
    const margin = hargaBersih > 0 ? (profit / hargaBersih) * 100 : 0;
    const markup = hargaModal > 0 ? (profit / hargaModal) * 100 : 0;

    // Perbandingan Tanpa Cashback
    const totalPotonganTanpaCB = activeVoucher + diskon + adminAmount + affiliateAmount + activeGratisOngkir;
    const hargaBersihTanpaCB = hargaJual - totalPotonganTanpaCB;
    const profitTanpaCB = hargaBersihTanpaCB - hargaModal;
    const marginTanpaCB = hargaBersihTanpaCB > 0 ? (profitTanpaCB / hargaBersihTanpaCB) * 100 : 0;

    // Rekomendasi Max Cashback (Titik Impas / Profit = 0)
    const maxCashbackNominal = hargaJual - hargaModal - activeVoucher - diskon - adminAmount - affiliateAmount - activeGratisOngkir;
    const maxCashbackPercent = hargaJual > 0 ? Math.max(0, (maxCashbackNominal / hargaJual) * 100) : 0;

    // Min Harga Jual untuk mencapai Target Profit
    // Target Harga Jual = (Modal + Nominal Voucher + Diskon + Ongkir) / (1 - %CB - %Admin - %Affiliate - %TargetProfit)
    // Formula ini merupakan estimasi rasio
    const combinedPercent = (cashbackPercent + biayaAdminPercent + biayaAffiliatePercent + targetProfitPercent) / 100;
    const minHargaJual = combinedPercent < 1 
      ? (hargaModal + cashbackNominal + activeVoucher + diskon + activeGratisOngkir) / (1 - combinedPercent) 
      : 0;

    return {
      totalPenjualan,
      cashbackAmount,
      adminAmount,
      affiliateAmount,
      totalPotongan,
      hargaBersih,
      profit,
      margin,
      markup,
      profitTanpaCashback: profitTanpaCB,
      pendapatanTanpaCashback: hargaBersihTanpaCB,
      marginTanpaCashback: marginTanpaCB,
      maxCashbackNominal: Math.max(0, maxCashbackNominal),
      maxCashbackPercent,
      minHargaJual: Math.max(0, minHargaJual),
    };
  }, [form]);

  // --- HANDLERS ---
  const handleNumChange = (field: keyof FormState, value: string) => {
    let parsed = parseIDR(value);
    
    // Validasi
    if (parsed < 0) parsed = 0;
    if (field === 'cashbackPercent' && parsed > 50) parsed = 50; // Maksimal 50%
    if (field === 'biayaAdminPercent' && parsed > 100) parsed = 100;
    if (field === 'biayaAffiliatePercent' && parsed > 100) parsed = 100;
    if (field === 'voucher' && parsed > form.hargaJual) parsed = form.hargaJual;

    setForm((prev) => ({ ...prev, [field]: parsed }));
  };

  const handleTextChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof FormState) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const copySummary = () => {
    const summary = `==================================
💸 KALKULATOR CASHBACK
Produk: ${form.namaProduk || 'Produk Tanpa Nama'}
Kategori: ${form.kategori}
Harga Jual: ${formatIDR(form.hargaJual)}
Cashback: ${formatIDR(calc.cashbackAmount)} (${form.cashbackPercent}%)
Harga Bersih: ${formatIDR(calc.hargaBersih)}
Profit: ${formatIDR(calc.profit)}
Margin: ${calc.margin.toFixed(2)}%
Status: ${calc.profit > 0 ? 'Menguntungkan ✅' : 'Rugi ❌'}
==================================`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).then(() => {
        showToast('📋 Ringkasan berhasil disalin!');
      }).catch(() => {
        showToast('❌ Gagal menyalin teks.');
      });
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = summary;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('📋 Ringkasan berhasil disalin!');
      } catch (err) {
        showToast('❌ Gagal menyalin teks.');
      }
      document.body.removeChild(textArea);
    }
  };

  const resetAll = () => {
    if(confirm('Yakin ingin mereset semua kalkulasi?')) {
      setForm({
        namaProduk: '',
        kategori: 'Lainnya',
        hargaModal: 0,
        hargaJual: 0,
        jumlah: 1,
        cashbackPercent: 0,
        cashbackNominal: 0,
        voucher: 0,
        diskon: 0,
        biayaAdminPercent: 0,
        biayaAffiliatePercent: 0,
        promoMarketplace: false,
        promoToko: false,
        promoVoucher: false,
        promoGratisOngkir: false,
        gratisOngkirNominal: 0,
        targetProfitPercent: 20,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- HELPER COMPONENTS ---
  const InputIDR = ({ label, field, placeholder = '0' }: { label: string, field: keyof FormState, placeholder?: string }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">Rp</span>
        <input
          type="text"
          value={form[field] === 0 ? '' : formatIDR(Number(form[field])).replace('Rp', '').trim()}
          onChange={(e) => handleNumChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>
    </div>
  );

  const InputPercent = ({ label, field, max = 100 }: { label: string, field: keyof FormState, max?: number }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={form[field] === 0 ? '' : Number(form[field])}
          onChange={(e) => handleNumChange(field, e.target.value)}
          placeholder="0"
          max={max}
          className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">%</span>
      </div>
    </div>
  );

  const Toggle = ({ label, field }: { label: string, field: keyof FormState }) => (
    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={Boolean(form[field])} onChange={() => handleToggle(field)} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${form[field] ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${form[field] ? 'transform translate-x-4' : ''}`}></div>
      </div>
    </label>
  );

  // Analysis Logic
  const getAnalysisInsight = () => {
    if (form.cashbackPercent === 0 && calc.cashbackAmount === 0) return { text: "Belum ada cashback yang diterapkan.", color: "text-gray-500", bg: "bg-gray-100" };
    
    // Estimasi persentase total cashback terhadap harga jual
    const effectiveCBPercent = form.hargaJual > 0 ? (calc.cashbackAmount / form.hargaJual) * 100 : 0;

    if (effectiveCBPercent < 5) return { text: "Cashback Rendah. Sangat aman terhadap keuntungan.", color: "text-green-700", bg: "bg-green-100", border: "border-green-200" };
    if (effectiveCBPercent < 10) return { text: "Cashback Normal. Menarik pembeli dengan risiko margin rendah.", color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200" };
    if (effectiveCBPercent < 20) return { text: "Cashback Tinggi. Waspada terhadap penyusutan profit secara signifikan.", color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-200" };
    if (effectiveCBPercent < 30) return { text: "Cashback Agresif. Cocok untuk cuci gudang atau akuisisi user baru.", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" };
    return { text: "Cashback Sangat Tinggi! Berpotensi menyebabkan kerugian finansial (bakar uang).", color: "text-red-700", bg: "bg-red-100", border: "border-red-200" };
  };

  const insight = getAnalysisInsight();

  // Progress Bar Widths (Capped at 100)
  const barModal = form.hargaJual > 0 ? Math.min(100, (form.hargaModal / form.hargaJual) * 100) : 0;
  const barPotongan = form.hargaJual > 0 ? Math.min(100, (calc.totalPotongan / form.hargaJual) * 100) : 0;
  const barProfit = form.hargaJual > 0 && calc.profit > 0 ? Math.min(100, (calc.profit / form.hargaJual) * 100) : 0;

  if (!isClient) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-blue-600 font-medium">Memuat Kalkulator...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-20 selection:bg-blue-200 selection:text-blue-900">
      
      {/* Toast Notification */}
      <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2">
          {toast.message}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 text-white text-2xl shrink-0">
                💸
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Kalkulator Cashback</h1>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 uppercase tracking-wide">
                    Professional Tool
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Hitung cashback, keuntungan, harga bersih, dan dampak profit secara real-time.</p>
              </div>
            </div>
            
            {/* Mobile Actions Header */}
            <div className="flex items-center gap-3 lg:hidden">
                <button onClick={resetAll} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">Reset</button>
                <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth'})} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md shadow-blue-600/20">Lihat Hasil</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN (65%) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Card 1: Informasi Produk */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span> 
                Informasi Produk
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Nama Produk</label>
                  <input 
                    type="text" 
                    value={form.namaProduk}
                    onChange={(e) => handleTextChange('namaProduk', e.target.value)}
                    placeholder="Contoh: Sepatu Sneakers"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Kategori</label>
                  <select 
                    value={form.kategori}
                    onChange={(e) => handleTextChange('kategori', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                  >
                    {['Makanan', 'Minuman', 'Fashion', 'Elektronik', 'Jasa', 'Kerajinan', 'Digital', 'Lainnya'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Harga Produk */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span> 
                Harga & Kuantitas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputIDR label="Harga Modal" field="hargaModal" />
                <InputIDR label="Harga Jual" field="hargaJual" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Jumlah Produk</label>
                  <input
                    type="number"
                    value={form.jumlah === 0 ? '' : form.jumlah}
                    onChange={(e) => handleNumChange('jumlah', e.target.value)}
                    min="1"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Total Penjualan (Kotor)</span>
                <span className="text-lg font-bold text-gray-900">{formatIDR(calc.totalPenjualan)}</span>
              </div>
            </div>

            {/* Card 3: Cashback Dasar */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span> 
                Skema Cashback & Biaya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <InputPercent label="Cashback Persentase (%)" field="cashbackPercent" max={50} />
                <InputIDR label="Cashback Nominal (Opsional)" field="cashbackNominal" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 border-t border-gray-100">
                <InputIDR label="Diskon Langsung" field="diskon" />
                <InputPercent label="Biaya Admin (%)" field="biayaAdminPercent" />
                <InputPercent label="Biaya Affiliate (%)" field="biayaAffiliatePercent" />
              </div>
            </div>

            {/* Card 4: Promo Tambahan */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-sm">4</span> 
                Promo Tambahan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Toggle label="Program Voucher" field="promoVoucher" />
                <Toggle label="Program Gratis Ongkir" field="promoGratisOngkir" />
                <Toggle label="Cashback Marketplace" field="promoMarketplace" />
                <Toggle label="Cashback Ekstra Toko" field="promoToko" />
              </div>

              {/* Conditional Inputs */}
              {(form.promoVoucher || form.promoGratisOngkir) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                  {form.promoVoucher && <InputIDR label="Nominal Voucher Terpotong" field="voucher" />}
                  {form.promoGratisOngkir && <InputIDR label="Subsidi Ongkir (Ditanggung Toko)" field="gratisOngkirNominal" />}
                </div>
              )}
            </div>

            {/* Card 5 & 6: Target & Simulasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-sm">5</span> 
                  Target Profit
                </h2>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Pilih Target Margin (%)</label>
                  <select 
                    value={form.targetProfitPercent}
                    onChange={(e) => handleNumChange('targetProfitPercent', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                    <option value="0">Custom (Isi manual di slider bawah)</option>
                  </select>
                </div>
                
                {form.targetProfitPercent === 0 && (
                  <div className="mt-4">
                    <InputPercent label="Target Profit Custom (%)" field="targetProfitPercent" />
                  </div>
                )}
              </div>

              {/* Simulasi Slider */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-sm">6</span> 
                  Simulasi Real-time
                </h2>
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">Geser persentase Cashback</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{form.cashbackPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={form.cashbackPercent}
                    onChange={(e) => handleNumChange('cashbackPercent', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 7: Aksi */}
            <div className="flex gap-4 pt-4 hidden lg:flex">
               <button 
                onClick={resetAll}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Reset Semua
              </button>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                Analisis Data
              </button>
            </div>

          </div>


          {/* RIGHT COLUMN (35%) - STICKY RESULTS */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* CARD HASIL UTAMA */}
              <div className="bg-white p-1 border-t-4 border-blue-600 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Dashboard Cashback</h2>
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Harga Awal</span>
                      <span className="font-medium text-gray-900">{formatIDR(form.hargaJual)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Cashback</span>
                      <span className="font-medium text-red-500">- {formatIDR(calc.cashbackAmount)}</span>
                    </div>
                    {calc.totalPotongan > calc.cashbackAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Potongan Lainnya</span>
                        <span className="font-medium text-red-500">- {formatIDR(calc.totalPotongan - calc.cashbackAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50/50 -mx-5 px-5 py-4 border-y border-blue-100 mb-6">
                    <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">💸 Harga Bersih (Diterima)</span>
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {formatIDR(calc.hargaBersih)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Profit</span>
                      <span className={`text-sm font-bold ${calc.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatIDR(calc.profit)}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Margin</span>
                      <span className={`text-sm font-bold ${calc.margin >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {calc.margin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Markup</span>
                      <span className={`text-sm font-bold ${calc.markup >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {calc.markup.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD PERBANDINGAN */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">VS Tanpa Cashback</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 mb-2">Tanpa CB</span>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">Pendapatan: <span className="font-bold text-gray-900">{formatIDR(calc.pendapatanTanpaCashback)}</span></p>
                      <p className="text-xs text-gray-600">Profit: <span className="font-bold text-green-600">{formatIDR(calc.profitTanpaCashback)}</span></p>
                      <p className="text-xs text-gray-600">Margin: <span className="font-bold text-gray-900">{calc.marginTanpaCashback.toFixed(1)}%</span></p>
                    </div>
                  </div>
                  <div className="pl-4 border-l border-gray-100">
                    <span className="block text-xs font-semibold text-gray-500 mb-2">Dengan CB</span>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">Pendapatan: <span className="font-bold text-gray-900">{formatIDR(calc.hargaBersih)}</span></p>
                      <p className="text-xs text-gray-600">Profit: <span className={`font-bold ${calc.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatIDR(calc.profit)}</span></p>
                      <p className="text-xs text-gray-600">Margin: <span className={`font-bold ${calc.margin >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{calc.margin.toFixed(1)}%</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD VISUAL BREAKDOWN */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Komposisi Harga Jual</h3>
                
                {form.hargaJual > 0 ? (
                  <>
                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${barModal}%` }} className="bg-slate-400 transition-all duration-500"></div>
                      <div style={{ width: `${barPotongan}%` }} className="bg-red-400 transition-all duration-500"></div>
                      <div style={{ width: `${barProfit}%` }} className="bg-green-500 transition-all duration-500"></div>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Modal ({barModal.toFixed(0)}%)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span> Potongan ({barPotongan.toFixed(0)}%)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Profit ({barProfit.toFixed(0)}%)</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400 italic text-center py-2">Isi Harga Jual untuk melihat grafik</div>
                )}
              </div>

              {/* CARD ANALISIS OTOMATIS */}
              <div className={`rounded-xl border ${insight.border || 'border-gray-200'} shadow-sm p-4 ${insight.bg}`}>
                <div className="flex gap-3">
                  <div className="text-xl">📊</div>
                  <div>
                    <h3 className={`text-sm font-bold ${insight.color} mb-1`}>Insight Analisis</h3>
                    <p className={`text-xs ${insight.color} opacity-90 leading-relaxed`}>
                      {insight.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD SIMULASI (DISPLAY ONLY) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Simulasi Cepat Profit</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-xs font-medium text-gray-600">Ringan <span className="font-bold text-gray-900">(5%)</span></span>
                    <span className="text-xs font-bold text-gray-900">
                      {formatIDR(form.hargaJual - form.hargaModal - (form.hargaJual * 0.05) - calc.totalPotongan + calc.cashbackAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-xs font-medium text-blue-700">Normal <span className="font-bold">(10%)</span> ⭐ IDEAL</span>
                    <span className="text-xs font-bold text-blue-700">
                      {formatIDR(form.hargaJual - form.hargaModal - (form.hargaJual * 0.10) - calc.totalPotongan + calc.cashbackAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 border border-red-100">
                    <span className="text-xs font-medium text-red-700">Promo Besar <span className="font-bold">(20%)</span></span>
                    <span className="text-xs font-bold text-red-700">
                      {formatIDR(form.hargaJual - form.hargaModal - (form.hargaJual * 0.20) - calc.totalPotongan + calc.cashbackAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD REKOMENDASI AI */}
              <div className="bg-slate-900 rounded-xl shadow-lg p-5 text-white">
                <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <span className="text-blue-400">🎯</span> AI Recommendation
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Maksimum Cashback (Tanpa Rugi)</span>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-white">{formatIDR(calc.maxCashbackNominal)}</span>
                      <span className="text-xs text-slate-400 mb-1">({calc.maxCashbackPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-px w-full bg-slate-800"></div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Min. Harga Jual utk Target Profit {form.targetProfitPercent}%</span>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-blue-400">{formatIDR(calc.minHargaJual)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD RINGKASAN */}
              <button 
                onClick={copySummary}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
              >
                📋 Salin Ringkasan
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}