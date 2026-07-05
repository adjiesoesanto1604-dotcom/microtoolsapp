"use client";

import React, { useState, useEffect, useRef } from "react";

// --- TYPES ---
type PeriodType = "Harian" | "Mingguan" | "Bulanan";

interface BusinessInfo {
  name: string;
  periodType: PeriodType;
  month: string;
  year: string;
}

interface CashItem {
  id: string;
  name: string;
  amount: number;
  rawInput: string;
}

interface InitialBalance {
  cash: number;
  rawCash: string;
  bank: number;
  rawBank: string;
}

interface DashboardResults {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  initialBalanceTotal: number;
  finalBalance: number;
  cashFlowRatio: number;
  status: "Sangat Sehat" | "Stabil" | "Tidak Sehat";
  insights: string[];
  recommendations: string[];
  simulation: {
    hemat: number;
    aktual: number;
    optimis: number;
  };
}

// --- UTILS ---
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const parseRawNumber = (val: string): number => {
  const parsed = Number(val.replace(/[^0-9]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

const formatRawString = (val: string): string => {
  const digits = val.replace(/[^0-9]/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- DEFAULT DATA ---
const DEFAULT_CASH_IN: CashItem[] = [
  { id: "in-1", name: "Penjualan Produk", amount: 0, rawInput: "" },
  { id: "in-2", name: "Pendapatan Jasa", amount: 0, rawInput: "" },
  { id: "in-3", name: "Piutang Dibayar", amount: 0, rawInput: "" },
  { id: "in-4", name: "Pendapatan Lain", amount: 0, rawInput: "" },
];

const DEFAULT_CASH_OUT: CashItem[] = [
  { id: "out-1", name: "Pembelian Barang", amount: 0, rawInput: "" },
  { id: "out-2", name: "Gaji", amount: 0, rawInput: "" },
  { id: "out-3", name: "Sewa", amount: 0, rawInput: "" },
  { id: "out-4", name: "Listrik & Air", amount: 0, rawInput: "" },
  { id: "out-5", name: "Transportasi", amount: 0, rawInput: "" },
  { id: "out-6", name: "Marketing", amount: 0, rawInput: "" },
  { id: "out-7", name: "Internet", amount: 0, rawInput: "" },
  { id: "out-8", name: "Operasional Lain", amount: 0, rawInput: "" },
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

// --- MAIN COMPONENT ---
export default function CashFlowPage() {
  // State
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "",
    periodType: "Bulanan",
    month: MONTHS[new Date().getMonth()],
    year: currentYear.toString(),
  });

  const [cashIn, setCashIn] = useState<CashItem[]>(DEFAULT_CASH_IN);
  const [cashOut, setCashOut] = useState<CashItem[]>(DEFAULT_CASH_OUT);
  const [initialBalance, setInitialBalance] = useState<InitialBalance>({
    cash: 0,
    rawCash: "",
    bank: 0,
    rawBank: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DashboardResults | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derived Totals (Real-time for UI feedback)
  const realTimeTotalIn = cashIn.reduce((sum, item) => sum + item.amount, 0);
  const realTimeTotalOut = cashOut.reduce((sum, item) => sum + item.amount, 0);
  const realTimeInitialBal = initialBalance.cash + initialBalance.bank;

  // Handlers
  const handleInfoChange = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo((prev) => ({ ...prev, [field]: value }));
    clearError("businessInfo");
  };

  const handleCashItemChange = (type: "in" | "out", id: string, field: "name" | "rawInput", value: string) => {
    const setState = type === "in" ? setCashIn : setCashOut;
    
    setState((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        
        if (field === "rawInput") {
          const formatted = formatRawString(value);
          const amount = parseRawNumber(value);
          return { ...item, rawInput: formatted, amount };
        }
        
        return { ...item, [field]: value };
      })
    );
  };

  const addCashItem = (type: "in" | "out") => {
    const setState = type === "in" ? setCashIn : setCashOut;
    setState((prev) => [
      ...prev,
      { id: `${type}-${generateId()}`, name: "", amount: 0, rawInput: "" },
    ]);
  };

  const removeCashItem = (type: "in" | "out", id: string) => {
    const setState = type === "in" ? setCashIn : setCashOut;
    setState((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInitialBalanceChange = (field: "rawCash" | "rawBank", value: string) => {
    const formatted = formatRawString(value);
    const amount = parseRawNumber(value);
    const key = field === "rawCash" ? "cash" : "bank";
    
    setInitialBalance((prev) => ({
      ...prev,
      [field]: formatted,
      [key]: amount,
    }));
  };

  const clearError = (key: string) => {
    if (validationErrors[key]) {
      const newErrors = { ...validationErrors };
      delete newErrors[key];
      setValidationErrors(newErrors);
    }
  };

  // Logic Engine
  const calculateEngine = () => {
    const errors: Record<string, string> = {};

    if (!businessInfo.name.trim()) {
      errors.businessName = "Nama bisnis wajib diisi.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors({});

    const totalCashIn = cashIn.reduce((sum, item) => sum + item.amount, 0);
    const totalCashOut = cashOut.reduce((sum, item) => sum + item.amount, 0);
    const initialBalanceTotal = initialBalance.cash + initialBalance.bank;
    const netCashFlow = totalCashIn - totalCashOut;
    const finalBalance = initialBalanceTotal + netCashFlow;
    
    // Safety check for ratio
    const cashFlowRatio = totalCashIn > 0 ? (totalCashOut / totalCashIn) * 100 : 0;

    // Determine Status
    let status: DashboardResults["status"] = "Stabil";
    if (netCashFlow < 0) {
      status = "Tidak Sehat";
    } else if (netCashFlow > 0 && finalBalance > (totalCashOut * 1.5)) {
      status = "Sangat Sehat";
    }

    // Generate Insights
    const insights: string[] = [];
    if (netCashFlow > 0) insights.push("Cash Flow Positif (Pendapatan lebih besar dari pengeluaran).");
    if (netCashFlow < 0) insights.push("⚠ Pengeluaran melebihi pemasukan. Ada defisit kas.");
    if (totalCashOut > 0 && totalCashIn > 0 && cashFlowRatio < 80) insights.push("Pengeluaran operasional terkendali dengan baik.");
    if (finalBalance < totalCashOut && totalCashOut > 0) insights.push("⚠ Saldo akhir berisiko tidak cukup untuk menutup operasional bulan depan.");
    if (totalCashIn === 0) insights.push("Belum ada pencatatan kas masuk.");

    // Generate Recommendations (Rule-based)
    const recommendations: string[] = [];
    
    // Rule 1: Negative Cash Flow
    if (netCashFlow < 0) recommendations.push("Lakukan pemotongan biaya operasional yang tidak esensial segera mungkin.");
    
    // Rule 2: Gaji
    const gajiItem = cashOut.find(i => i.name.toLowerCase().includes("gaji"));
    if (gajiItem && totalCashOut > 0 && (gajiItem.amount / totalCashOut) > 0.4) {
      recommendations.push("Beban gaji mengambil proporsi besar (>40%) dari total biaya. Pastikan produktivitas karyawan sejalan dengan beban ini.");
    }

    // Rule 3: Marketing
    const marketingItem = cashOut.find(i => i.name.toLowerCase().includes("marketing") || i.name.toLowerCase().includes("pemasaran"));
    if (marketingItem && totalCashOut > 0 && (marketingItem.amount / totalCashOut) < 0.05 && netCashFlow > 0) {
      recommendations.push("Anggaran marketing sangat rendah (<5%). Pertimbangkan meningkatkan promosi untuk mendorong skala penjualan, mumpung cash flow positif.");
    }

    // Rule 4: Sewa
    const sewaItem = cashOut.find(i => i.name.toLowerCase().includes("sewa"));
    if (sewaItem && totalCashOut > 0 && (sewaItem.amount / totalCashOut) > 0.3) {
      recommendations.push("Biaya sewa cukup membebani (>30% biaya). Apakah ada opsi negosiasi atau optimasi penggunaan ruang usaha?");
    }

    // Rule 5: Piutang
    const piutangItem = cashIn.find(i => i.name.toLowerCase().includes("piutang"));
    if (piutangItem && totalCashIn > 0 && (piutangItem.amount / totalCashIn) > 0.4) {
      recommendations.push("Pemasukan sangat bergantung pada pelunasan piutang. Perketat kebijakan tempo kredit pelanggan agar kas tidak tersendat.");
    }

    // Rule 6: Healthy Balance
    if (status === "Sangat Sehat") {
      recommendations.push("Kondisi kas sangat sehat. Anda bisa mulai mempertimbangkan investasi alat, ekspansi, atau menabung dana darurat usaha.");
    }

    // Rule 7: Listrik & Air (Utility)
    const utilItem = cashOut.find(i => i.name.toLowerCase().includes("listrik") || i.name.toLowerCase().includes("air"));
    if (utilItem && totalCashOut > 0 && (utilItem.amount / totalCashOut) > 0.15) {
      recommendations.push("Biaya utilitas (listrik/air) menyedot >15% pengeluaran. Lakukan inspeksi efisiensi energi di lokasi usaha.");
    }

    // Rule 8: Dangerously low balance
    if (finalBalance > 0 && finalBalance < (totalCashOut * 0.2)) {
      recommendations.push("Saldo tunai akhir sangat menipis (<20% pengeluaran bulanan). Hindari pembelian aset tetap bulan ini untuk menjaga likuiditas.");
    }

    // Rule 9: No marketing at all
    if (!marketingItem || marketingItem.amount === 0) {
      if (totalCashIn > 0) recommendations.push("Tidak ada pengeluaran marketing tercatat. Mengalokasikan dana kecil untuk digital marketing dapat meningkatkan jangkauan UMKM Anda.");
    }

    // Rule 10: Cash In heavy on "Pendapatan Lain"
    const lainItem = cashIn.find(i => i.name.toLowerCase().includes("lain"));
    const mainSales = (cashIn.find(i => i.name.toLowerCase().includes("penjualan"))?.amount || 0) + 
                      (cashIn.find(i => i.name.toLowerCase().includes("jasa"))?.amount || 0);
    if (lainItem && mainSales > 0 && lainItem.amount > mainSales) {
      recommendations.push("Pendapatan sampingan/lainnya lebih besar dari bisnis inti. Evaluasi kembali core business Anda, apakah sedang menurun?");
    }

    // Fallback if none trigger
    if (recommendations.length === 0) {
      recommendations.push("Terus pertahankan pencatatan rutin. Lakukan rekonsiliasi kas minimal seminggu sekali.");
    }

    setResults({
      totalCashIn,
      totalCashOut,
      netCashFlow,
      initialBalanceTotal,
      finalBalance,
      cashFlowRatio,
      status,
      insights,
      recommendations,
      simulation: {
        aktual: finalBalance,
        hemat: initialBalanceTotal + (totalCashIn - (totalCashOut * 0.9)), // Pengeluaran turun 10%
        optimis: initialBalanceTotal + ((totalCashIn * 1.2) - totalCashOut), // Pendapatan naik 20%
      },
    });

    // Scroll to results
    setTimeout(() => {
      document.getElementById("dashboard-results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleReset = () => {
    setBusinessInfo({ name: "", periodType: "Bulanan", month: MONTHS[new Date().getMonth()], year: currentYear.toString() });
    setCashIn(DEFAULT_CASH_IN.map(i => ({ ...i, amount: 0, rawInput: "" })));
    setCashOut(DEFAULT_CASH_OUT.map(i => ({ ...i, amount: 0, rawInput: "" })));
    setInitialBalance({ cash: 0, rawCash: "", bank: 0, rawBank: "" });
    setResults(null);
    setValidationErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopy = async () => {
    if (!results) return;

    const periodStr = businessInfo.periodType === "Bulanan" 
      ? `${businessInfo.month} ${businessInfo.year}` 
      : businessInfo.periodType;

    const text = `==================================
RINGKASAN CASH FLOW UMKM
Nama Bisnis: ${businessInfo.name}
Periode: ${periodStr}
Saldo Awal: ${formatCurrency(results.initialBalanceTotal)}
Cash In: ${formatCurrency(results.totalCashIn)}
Cash Out: ${formatCurrency(results.totalCashOut)}
Net Cash Flow: ${formatCurrency(results.netCashFlow)}
Saldo Akhir: ${formatCurrency(results.finalBalance)}
Status: ${results.status}

Insight:
${results.insights.map(i => `- ${i}`).join("\n")}

Rekomendasi:
${results.recommendations.map(r => `- ${r}`).join("\n")}
==================================`;

    try {
      await navigator.clipboard.writeText(text);
      setToastMessage("Ringkasan berhasil disalin.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Gagal menyalin", err);
    }
  };

  // --- RENDER HELPERS ---
  const InputError = ({ msg }: { msg?: string }) => {
    if (!msg) return null;
    return <p className="text-red-500 text-sm mt-1">{msg}</p>;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Cash Flow UMKM
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl leading-relaxed">
            Pantau arus kas bisnis secara real-time untuk mengetahui kondisi keuangan usaha serta memastikan kas selalu cukup untuk operasional.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* SECTION 1: INFORMASI BISNIS */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-blue-600 mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
            Informasi Bisnis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bisnis</label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border ${validationErrors.businessName ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                placeholder="Contoh: Kedai Kopi Maju"
                value={businessInfo.name}
                onChange={(e) => handleInfoChange("name", e.target.value)}
              />
              <InputError msg={validationErrors.businessName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periode Laporan</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                value={businessInfo.periodType}
                onChange={(e) => handleInfoChange("periodType", e.target.value as PeriodType)}
              >
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
              </select>
            </div>
            
            {businessInfo.periodType === "Bulanan" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={businessInfo.month}
                    onChange={(e) => handleInfoChange("month", e.target.value)}
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={businessInfo.year}
                    onChange={(e) => handleInfoChange("year", e.target.value)}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 4: SALDO AWAL (Moved up for logical flow: Beginning -> In -> Out -> End) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-blue-600 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
              Saldo Awal Periode
            </div>
            <span className="text-lg font-bold text-gray-800 bg-gray-50 px-4 py-1 rounded-lg">
              {formatCurrency(realTimeInitialBal)}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kas Tunai (Di laci/brankas)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="0"
                  value={initialBalance.rawCash}
                  onChange={(e) => handleInitialBalanceChange("rawCash", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kas Bank (Rekening Usaha)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="0"
                  value={initialBalance.rawBank}
                  onChange={(e) => handleInitialBalanceChange("rawBank", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: KAS MASUK */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-blue-600 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
              Kas Masuk (Cash In)
            </div>
            <span className="text-lg font-bold text-emerald-600 bg-emerald-50 px-4 py-1 rounded-lg">
              + {formatCurrency(realTimeTotalIn)}
            </span>
          </h2>
          
          <div className="space-y-4">
            {cashIn.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    placeholder="Nama Pemasukan"
                    value={item.name}
                    onChange={(e) => handleCashItemChange("in", item.id, "name", e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-1/2 relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder="0"
                      value={item.rawInput}
                      onChange={(e) => handleCashItemChange("in", item.id, "rawInput", e.target.value)}
                    />
                  </div>
                  {cashIn.length > 1 && (
                    <button 
                      onClick={() => removeCashItem("in", item.id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => addCashItem("in")}
            className="mt-6 flex items-center text-blue-600 font-medium hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Tambah Kas Masuk
          </button>
        </div>

        {/* SECTION 3: KAS KELUAR */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-blue-600 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
              Kas Keluar (Cash Out)
            </div>
            <span className="text-lg font-bold text-rose-600 bg-rose-50 px-4 py-1 rounded-lg">
              - {formatCurrency(realTimeTotalOut)}
            </span>
          </h2>
          
          <div className="space-y-4">
            {cashOut.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    placeholder="Nama Pengeluaran"
                    value={item.name}
                    onChange={(e) => handleCashItemChange("out", item.id, "name", e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-1/2 relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                      placeholder="0"
                      value={item.rawInput}
                      onChange={(e) => handleCashItemChange("out", item.id, "rawInput", e.target.value)}
                    />
                  </div>
                  {cashOut.length > 1 && (
                    <button 
                      onClick={() => removeCashItem("out", item.id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => addCashItem("out")}
            className="mt-6 flex items-center text-blue-600 font-medium hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Tambah Pengeluaran
          </button>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={calculateEngine}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-[0.99] text-lg"
          >
            Hitung Cash Flow
          </button>
          <button
            onClick={handleReset}
            className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 font-medium py-4 px-8 rounded-2xl hover:bg-gray-50 transition-all"
          >
            Reset Data
          </button>
        </div>

        {/* DASHBOARD HASIL */}
        {results && (
          <div id="dashboard-results" className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-t-2 border-gray-200 border-dashed pt-12 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center">Dashboard Keuangan</h2>
              <p className="text-gray-500 text-center mt-2">
                Analisis komprehensif untuk {businessInfo.name} ({businessInfo.periodType === "Bulanan" ? `${businessInfo.month} ${businessInfo.year}` : businessInfo.periodType})
              </p>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-gray-500 font-medium mb-2 block">Total Cash In</span>
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(results.totalCashIn)}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <span className="text-gray-500 font-medium mb-2 block">Total Cash Out</span>
                <span className="text-2xl font-bold text-rose-600">{formatCurrency(results.totalCashOut)}</span>
              </div>
              <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${results.netCashFlow >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                <span className="text-gray-600 font-medium mb-2 block">Net Cash Flow</span>
                <span className={`text-2xl font-bold ${results.netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {results.netCashFlow >= 0 ? "+" : ""}{formatCurrency(results.netCashFlow)}
                </span>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <span className="text-gray-500 font-medium mb-2 block">Saldo Awal</span>
                <span className="text-xl font-bold text-gray-800">{formatCurrency(results.initialBalanceTotal)}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-2 ring-gray-900 ring-offset-2">
                <span className="text-gray-900 font-medium mb-2 block">Saldo Akhir</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(results.finalBalance)}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <span className="text-gray-500 font-medium mb-2 block flex items-center justify-between">
                  Cash Flow Ratio
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded">Out/In</span>
                </span>
                <span className={`text-2xl font-bold ${results.cashFlowRatio > 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {results.cashFlowRatio.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* STATUS & DISTRIBUSI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* STATUS CARD */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-center items-center text-center">
                <h3 className="text-gray-500 font-medium mb-4">Status Keuangan</h3>
                <div className="mb-4">
                  {results.status === "Sangat Sehat" && <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl">🟢</div>}
                  {results.status === "Stabil" && <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto text-4xl">🟡</div>}
                  {results.status === "Tidak Sehat" && <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto text-4xl">🔴</div>}
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{results.status}</h4>
                <p className="text-gray-600 max-w-sm">
                  {results.status === "Sangat Sehat" && "Kondisi kas sangat prima. Pendapatan menutupi pengeluaran dengan cadangan saldo yang besar."}
                  {results.status === "Stabil" && "Arus kas positif namun margin tipis. Tetap waspada terhadap pengeluaran tak terduga."}
                  {results.status === "Tidak Sehat" && "Arus kas negatif (Defisit). Pengeluaran membakar saldo kas yang ada. Perlu intervensi segera."}
                </p>
              </div>

              {/* DISTRIBUSI KEUANGAN (KOMPARATIF) */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-gray-800 font-bold mb-6 text-lg">Komparasi Proporsi Kas</h3>
                <div className="space-y-6">
                  {(() => {
                    // Valid visualization: Compare independent metrics to the highest one.
                    const maxVal = Math.max(results.totalCashIn, results.totalCashOut, results.finalBalance, 1);
                    const inPct = (results.totalCashIn / maxVal) * 100;
                    const outPct = (results.totalCashOut / maxVal) * 100;
                    const balPct = (Math.max(0, results.finalBalance) / maxVal) * 100; // avoid negative width
                    
                    return (
                      <>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700">Cash In</span>
                            <span className="text-gray-500">{formatCurrency(results.totalCashIn)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${inPct}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700">Cash Out</span>
                            <span className="text-gray-500">{formatCurrency(results.totalCashOut)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div className="bg-rose-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${outPct}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700">Saldo Akhir</span>
                            <span className="text-gray-500">{formatCurrency(results.finalBalance)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div className="bg-blue-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${balPct}%` }}></div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* ANALISIS & REKOMENDASI GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ANALISIS */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-gray-800 font-bold mb-6 text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Analisis Utama
                </h3>
                <ul className="space-y-4">
                  {results.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mt-1 mr-3 text-lg">{insight.includes('⚠') ? '⚠' : '✔'}</span>
                      <span className={`text-base ${insight.includes('⚠') ? 'text-rose-700 font-medium' : 'text-gray-700'}`}>
                        {insight.replace('⚠', '').trim()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* REKOMENDASI */}
              <div className="bg-blue-50 p-8 rounded-2xl shadow-sm border border-blue-100">
                <h3 className="text-blue-900 font-bold mb-6 text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Rekomendasi Tindakan
                </h3>
                <ul className="space-y-4">
                  {results.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start bg-white p-4 rounded-xl shadow-sm">
                      <div className="min-w-6 min-h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">{idx + 1}</div>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SIMULASI BISNIS */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-gray-800 font-bold mb-2 text-lg">Simulasi & Proyeksi Bulan Depan</h3>
              <p className="text-gray-500 mb-6">Bagaimana jika terjadi perubahan pada pola keuangan Anda?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <span className="text-gray-600 font-medium block mb-1">Mode Hemat</span>
                  <span className="text-xs text-gray-500 block mb-4">Pengeluaran ditekan 10%</span>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(results.simulation.hemat)}</div>
                  <div className="mt-2 text-sm text-emerald-600 font-medium">
                    +{formatCurrency(results.simulation.hemat - results.finalBalance)} dari aktual
                  </div>
                </div>
                
                <div className="bg-blue-600 p-6 rounded-xl shadow-md text-white">
                  <span className="font-medium block mb-1">Kondisi Aktual</span>
                  <span className="text-xs text-blue-200 block mb-4">Sesuai pencatatan saat ini</span>
                  <div className="text-2xl font-bold">{formatCurrency(results.simulation.aktual)}</div>
                  <div className="mt-2 text-sm text-blue-100 font-medium">
                    Base Projection
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <span className="text-gray-600 font-medium block mb-1">Mode Optimis</span>
                  <span className="text-xs text-gray-500 block mb-4">Pemasukan naik 20%</span>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(results.simulation.optimis)}</div>
                  <div className="mt-2 text-sm text-emerald-600 font-medium">
                    +{formatCurrency(results.simulation.optimis - results.finalBalance)} dari aktual
                  </div>
                </div>
              </div>
            </div>

            {/* RINGKASAN & COPY */}
            <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Simpan Ringkasan Laporan</h3>
                <p className="text-gray-400 max-w-lg">
                  Salin seluruh hasil analisis, status, dan rekomendasi ini ke clipboard Anda untuk dibagikan ke tim atau disimpan di catatan.
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="w-full md:w-auto bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-6 rounded-xl flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                Salin Ringkasan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center animate-in slide-in-from-bottom-5 z-50">
          <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          {toastMessage}
        </div>
      )}
    </div>
  );
}