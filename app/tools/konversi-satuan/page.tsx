'use client';

import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';

// Interfaces for State
interface FormState {
  category: Category;
  valueInput: string;
  fromUnit: string;
  toUnit: string;
  notes: string;
}

interface ToastState {
  show: boolean;
  message: string;
}

type Category = 'Berat' | 'Volume' | 'Panjang' | 'Luas' | 'Waktu' | 'Suhu' | 'Kecepatan';

interface UnitDef {
  id: string;
  label: string;
  factor: number; // Factor relative to a base unit in its category. Not used for Suhu.
}

interface PopularConversion {
  label: string;
  formula: string;
}

// Constants for Units and Conversion Data
const CATEGORIES: Category[] = ['Berat', 'Volume', 'Panjang', 'Luas', 'Waktu', 'Suhu', 'Kecepatan'];

const UNITS_DATA: Record<Category, UnitDef[]> = {
  'Berat': [
    { id: 't', label: 'Ton', factor: 1000000 },
    { id: 'kg', label: 'Kilogram', factor: 1000 },
    { id: 'hg', label: 'Hektogram', factor: 100 },
    { id: 'dag', label: 'Dekagram', factor: 10 },
    { id: 'g', label: 'Gram', factor: 1 },
    { id: 'dg', label: 'Desigram', factor: 0.1 },
    { id: 'cg', label: 'Centigram', factor: 0.01 },
    { id: 'mg', label: 'Milligram', factor: 0.001 },
  ],
  'Volume': [
    { id: 'm3', label: 'Meter Kubik', factor: 1000 },
    { id: 'l', label: 'Liter', factor: 1 },
    { id: 'dl', label: 'Desiliter', factor: 0.1 },
    { id: 'cl', label: 'Centiliter', factor: 0.01 },
    { id: 'ml', label: 'Mililiter', factor: 0.001 },
  ],
  'Panjang': [
    { id: 'km', label: 'Kilometer', factor: 1000 },
    { id: 'hm', label: 'Hektometer', factor: 100 },
    { id: 'dam', label: 'Dekameter', factor: 10 },
    { id: 'm', label: 'Meter', factor: 1 },
    { id: 'dm', label: 'Desimeter', factor: 0.1 },
    { id: 'cm', label: 'Centimeter', factor: 0.01 },
    { id: 'mm', label: 'Milimeter', factor: 0.001 },
  ],
  'Luas': [
    { id: 'km2', label: 'Kilometer Persegi', factor: 1000000 },
    { id: 'ha', label: 'Hektar', factor: 10000 },
    { id: 'm2', label: 'Meter Persegi', factor: 1 },
    { id: 'cm2', label: 'Centimeter Persegi', factor: 0.0001 },
  ],
  'Waktu': [
    { id: 'bln', label: 'Bulan (30 hr)', factor: 2592000 },
    { id: 'mgg', label: 'Minggu', factor: 604800 },
    { id: 'hr', label: 'Hari', factor: 86400 },
    { id: 'jam', label: 'Jam', factor: 3600 },
    { id: 'mnt', label: 'Menit', factor: 60 },
    { id: 'dtk', label: 'Detik', factor: 1 },
  ],
  'Suhu': [
    { id: 'c', label: 'Celsius', factor: 1 }, // Factors not used for temp calculation, just mapping
    { id: 'f', label: 'Fahrenheit', factor: 1 },
    { id: 'k', label: 'Kelvin', factor: 1 },
  ],
  'Kecepatan': [
    { id: 'kmj', label: 'Km/jam', factor: 1 },
    { id: 'ms', label: 'Meter/detik', factor: 3.6 }, // 1 m/s = 3.6 km/h. Base is km/h
  ]
};

const POPULAR_CONVERSIONS: Record<Category, PopularConversion[]> = {
  'Berat': [
    { label: 'Kg ke Gram', formula: '1 kg = 1000 g' },
    { label: 'Ton ke Kg', formula: '1 ton = 1000 kg' },
    { label: 'Gram ke Mg', formula: '1 g = 1000 mg' },
  ],
  'Volume': [
    { label: 'Liter ke Ml', formula: '1 liter = 1000 ml' },
    { label: 'M³ ke Liter', formula: '1 m³ = 1000 liter' },
  ],
  'Panjang': [
    { label: 'Meter ke Cm', formula: '1 meter = 100 cm' },
    { label: 'Km ke Meter', formula: '1 km = 1000 m' },
  ],
  'Luas': [
    { label: 'M² ke Cm²', formula: '1 m² = 10.000 cm²' },
    { label: 'Hektar ke M²', formula: '1 ha = 10.000 m²' },
  ],
  'Waktu': [
    { label: 'Hari ke Jam', formula: '1 hari = 24 jam' },
    { label: 'Jam ke Menit', formula: '1 jam = 60 menit' },
  ],
  'Suhu': [
    { label: 'C ke F', formula: '(°C × 9/5) + 32' },
    { label: 'C ke Kelvin', formula: '°C + 273.15' },
  ],
  'Kecepatan': [
    { label: 'Km/j ke m/s', formula: 'Dibagi 3.6' },
    { label: 'm/s ke Km/j', formula: 'Dikali 3.6' },
  ]
};

// Utility function to format number to Indonesian locale with max 4 decimals
const formatNumber = (value: number | undefined): string => {
  if (value === undefined || isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 4,
  }).format(value);
};

// Utility to parse localized number input back to float
const parseLocalNumber = (val: string): number => {
  if (!val) return 0;
  // Replace Indonesian thousand separators (.) and swap decimal comma (,) to dot (.)
  const standardized = val.replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(standardized);
  return isNaN(parsed) ? 0 : parsed;
};

// Special temperature conversion logic
const convertTemperature = (value: number, fromId: string, toId: string): number => {
  if (fromId === toId) return value;
  
  let celsius = 0;
  // Convert from input to Celsius first
  if (fromId === 'c') celsius = value;
  else if (fromId === 'f') celsius = (value - 32) * (5 / 9);
  else if (fromId === 'k') celsius = value - 273.15;

  // Convert from Celsius to Target
  if (toId === 'c') return celsius;
  if (toId === 'f') return (celsius * (9 / 5)) + 32;
  if (toId === 'k') return celsius + 273.15;
  
  return 0;
};

export default function KonversiSatuanPage() {
  // Initial Form State
  const initialFormState: FormState = {
    category: 'Berat',
    valueInput: '100',
    fromUnit: 'kg',
    toUnit: 'g',
    notes: '',
  };

  const [form, setForm] = useState<FormState>(initialFormState);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update from/to units automatically when category changes to prevent invalid states
  useEffect(() => {
    const units = UNITS_DATA[form.category];
    if (units.length >= 2) {
      // Only reset units if the current units are not in the new category
      const fromExists = units.find(u => u.id === form.fromUnit);
      const toExists = units.find(u => u.id === form.toUnit);
      
      if (!fromExists || !toExists) {
        setForm(prev => ({
          ...prev,
          fromUnit: units[1]?.id || units[0].id,
          toUnit: units[4]?.id || (units.length > 1 ? units[1].id : units[0].id),
        }));
      }
    }
  }, [form.category]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  }, []);

  const handleTextChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleNumberInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,]/g, ''); // Allow numbers and comma for decimals
    setForm((prev) => ({ ...prev, valueInput: value }));
  }, []);

  const handleReset = useCallback(() => {
    setForm(initialFormState);
    showToast('Seluruh data berhasil di-reset.');
  }, [initialFormState, showToast]);

  const handleQuickConvert = useCallback((cat: Category, from: string, to: string) => {
    setForm(prev => ({ ...prev, category: cat, fromUnit: from, toUnit: to }));
  }, []);

  const calculations = useMemo(() => {
    const numericValue = parseLocalNumber(form.valueInput);
    const units = UNITS_DATA[form.category];
    const fromUnitDef = units.find(u => u.id === form.fromUnit);
    const toUnitDef = units.find(u => u.id === form.toUnit);

    let result = 0;
    let ratioStr = '1 : 1';
    let baseToRatio = 1;

    if (fromUnitDef && toUnitDef) {
      if (form.category === 'Suhu') {
        result = convertTemperature(numericValue, fromUnitDef.id, toUnitDef.id);
        ratioStr = 'Rumus khusus suhu';
      } else {
        // Standard calculation using factors relative to base
        // If converting to a smaller unit, factorFrom > factorTo, result should be larger.
        // Example: Kg (1000) to Gram (1) -> value * (1000 / 1)
        result = numericValue * (fromUnitDef.factor / toUnitDef.factor);
        baseToRatio = fromUnitDef.factor / toUnitDef.factor;
        
        if (baseToRatio >= 1) {
            ratioStr = `1 : ${formatNumber(baseToRatio)}`;
        } else {
            ratioStr = `${formatNumber(1 / baseToRatio)} : 1`;
        }
      }
    }

    const isValid = form.valueInput.trim() !== '' && !isNaN(numericValue);

    // Dynamic Insight
    let insight = '';
    if (!isValid) {
      insight = 'Silakan masukkan angka untuk melihat hasil konversi.';
    } else {
      switch (form.category) {
        case 'Berat': insight = 'Konversi ini umum digunakan untuk menghitung bahan baku produksi atau takaran resep.'; break;
        case 'Volume': insight = 'Gunakan konversi volume untuk mengelola stok cairan, minuman, atau bahan kimia ringan.'; break;
        case 'Panjang': insight = 'Cocok untuk mengukur kebutuhan material fisik seperti kain, kabel, atau estimasi jarak.'; break;
        case 'Luas': insight = 'Membantu menghitung kebutuhan lahan, sewa area, atau material penutup permukaan.'; break;
        case 'Waktu': insight = 'Berguna untuk estimasi durasi produksi, waktu pengiriman, atau jam kerja karyawan.'; break;
        case 'Suhu': insight = 'Penting untuk standar penyimpanan bahan baku atau proses pemanasan dalam produksi.'; break;
        case 'Kecepatan': insight = 'Gunakan untuk mengestimasi waktu tempuh armada logistik pengiriman barang.'; break;
        default: insight = 'Hasil konversi siap digunakan untuk perhitungan operasional Anda.';
      }
    }

    return {
      numericValue,
      result,
      fromLabel: fromUnitDef?.label || '-',
      toLabel: toUnitDef?.label || '-',
      isValid,
      ratioStr,
      insight,
      popular: POPULAR_CONVERSIONS[form.category] || []
    };
  }, [form]);

  const handleCopy = useCallback(() => {
    if (!calculations.isValid) {
      showToast('Tidak ada hasil untuk disalin.');
      return;
    }
    const textToCopy = `Hasil Konversi ${form.category}
${formatNumber(calculations.numericValue)} ${calculations.fromLabel} = ${formatNumber(calculations.result)} ${calculations.toLabel}

Rasio: ${calculations.ratioStr}
Catatan: ${form.notes || '-'}

Powered by Microtools UMKM`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Hasil konversi berhasil disalin.');
    }).catch(() => {
      showToast('Gagal menyalin ringkasan.');
    });
  }, [form.category, form.notes, calculations, showToast]);

  // Don't render until client to avoid hydration issues
  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-fade-in-up transition-all">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">📏</span>
                <h1 className="text-2xl font-bold text-gray-900">Kalkulator Konversi Satuan</h1>
              </div>
              <p className="text-gray-500 text-sm max-w-2xl">Konversikan berbagai satuan berat, volume, panjang, luas, waktu, dan lainnya secara instan untuk kebutuhan operasional UMKM.</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-1">Professional Tool</span>
              <span className="text-xs text-gray-400 font-medium">Powered by Microtools UMKM</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          { }
          {/* LEFT COLUMN - 65% */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 1: Kategori */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Pilih Kategori Konversi
              </h2>
              <div className="w-full sm:w-1/2">
                <select name="category" value={form.category} onChange={handleTextChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium">
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card 2: Input & Dropdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                Masukkan Nilai
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nilai Awal</label>
                  <input type="text" name="valueInput" value={form.valueInput} onChange={handleNumberInput} placeholder="Cth: 100" className="w-full px-4 py-3 text-lg bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dari Satuan</label>
                  <select name="fromUnit" value={form.fromUnit} onChange={handleTextChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium">
                    {UNITS_DATA[form.category].map(u => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ke Satuan</label>
                  <select name="toUnit" value={form.toUnit} onChange={handleTextChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium">
                    {UNITS_DATA[form.category].map(u => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 3: Quick Conversion */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Quick Conversion
              </h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleQuickConvert('Berat', 'g', 'kg')} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-md text-xs font-semibold transition-colors">Gram ↔ Kilogram</button>
                <button onClick={() => handleQuickConvert('Volume', 'l', 'ml')} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-md text-xs font-semibold transition-colors">Liter ↔ Mililiter</button>
                <button onClick={() => handleQuickConvert('Panjang', 'm', 'cm')} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-md text-xs font-semibold transition-colors">Meter ↔ Centimeter</button>
                <button onClick={() => handleQuickConvert('Panjang', 'm', 'km')} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-md text-xs font-semibold transition-colors">Meter ↔ Kilometer</button>
                <button onClick={() => handleQuickConvert('Waktu', 'jam', 'mnt')} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-md text-xs font-semibold transition-colors">Jam ↔ Menit</button>
                <button onClick={() => handleQuickConvert('Waktu', 'hr', 'mgg')} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-md text-xs font-semibold transition-colors">Hari ↔ Minggu</button>
              </div>
            </div>

            {/* Card 4: Preset UMKM */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                Preset Operasional UMKM
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => handleQuickConvert('Berat', 'kg', 'g')} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all group">
                  <span className="block text-xs font-bold text-gray-800 group-hover:text-indigo-700 mb-1">Bahan Baku</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Kg → Gram</span>
                </button>
                <button onClick={() => handleQuickConvert('Volume', 'l', 'ml')} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all group">
                  <span className="block text-xs font-bold text-gray-800 group-hover:text-indigo-700 mb-1">Kemasan Cair</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Liter → Ml</span>
                </button>
                <button onClick={() => handleQuickConvert('Panjang', 'km', 'm')} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all group">
                  <span className="block text-xs font-bold text-gray-800 group-hover:text-indigo-700 mb-1">Jarak Kirim</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Km → Meter</span>
                </button>
                <button onClick={() => handleQuickConvert('Waktu', 'jam', 'mnt')} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all group">
                  <span className="block text-xs font-bold text-gray-800 group-hover:text-indigo-700 mb-1">Waktu Produksi</span>
                  <span className="block text-[10px] text-gray-500 uppercase">Jam → Menit</span>
                </button>
              </div>
            </div>

            {/* Card 5: Catatan */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
               <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Catatan (Opsional)
              </h2>
              <textarea 
                name="notes" 
                value={form.notes} 
                onChange={handleTextChange} 
                rows={2} 
                placeholder="Tambahkan catatan penggunaan untuk konversi ini..." 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
              ></textarea>
            </div>

            {/* Reset Button */}
            <div className="flex justify-start">
              <button onClick={handleReset} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Reset Seluruh Input
              </button>
            </div>
          </div>

          {}
          {/* RIGHT COLUMN - 35% */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Big Hero Card */}
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"></path></svg>
                </div>
                <h3 className="text-indigo-100 font-semibold text-sm mb-1 uppercase tracking-wider">Hasil Konversi</h3>
                <div className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight flex items-baseline gap-2 flex-wrap">
                  {calculations.isValid ? formatNumber(calculations.result) : '-'}
                  <span className="text-lg font-medium text-indigo-200">{calculations.isValid ? calculations.toLabel : ''}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-indigo-500 pt-4">
                  <div>
                    <p className="text-indigo-200 text-[10px] uppercase tracking-wide mb-1">Kategori</p>
                    <p className="font-semibold text-sm">{form.category}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-[10px] uppercase tracking-wide mb-1">Nilai Awal</p>
                    <p className="font-semibold text-sm">{calculations.isValid ? `${formatNumber(calculations.numericValue)} ${calculations.fromLabel}` : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Status & Rumus Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Status Konversi</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${calculations.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {calculations.isValid ? '🟢 Siap Digunakan' : '🟠 Menunggu Input'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-5 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {calculations.insight}
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    Informasi Rasio
                  </h4>
                  <p className="text-sm font-mono text-blue-900 font-semibold">{calculations.isValid ? calculations.ratioStr : '-'}</p>
                </div>
              </div>

              {/* Detail Visual Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                   Alur Konversi
                </h3>
                
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                     <div className={`h-full bg-indigo-500 transition-all duration-500 ${calculations.isValid ? 'w-full' : 'w-0'}`}></div>
                  </div>
                  
                  <div className="flex justify-between relative z-10">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border-2 ${calculations.isValid ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        1
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 mt-2 text-center w-16">{calculations.isValid ? calculations.fromLabel : 'Awal'}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border-2 ${calculations.isValid ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 mt-2">Proses</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border-2 ${calculations.isValid ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        2
                      </div>
                      <span className="text-[10px] font-semibold text-gray-800 mt-2 text-center w-16">{calculations.isValid ? calculations.toLabel : 'Akhir'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Conversions List */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  Konversi Populer: {form.category}
                </h3>
                <ul className="space-y-2">
                  {calculations.popular.map((pop, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-semibold text-gray-700 text-xs">{pop.label}</span>
                      <span className="font-mono text-xs text-indigo-600 font-bold">{pop.formula}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Copy Button */}
              <button onClick={handleCopy} className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all flex justify-center items-center gap-2 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                Salin Hasil Konversi
              </button>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-500 text-sm font-medium mb-2">© 2026 Platform Microtools UMKM Indonesia</p>
          <p className="text-gray-400 text-xs max-w-3xl mx-auto leading-relaxed">
            Dirancang khusus untuk membantu UMKM melakukan konversi satuan secara cepat, akurat, dan praktis dalam aktivitas operasional sehari-hari.
          </p>
        </div>
      </footer>
    </div>
  );
}