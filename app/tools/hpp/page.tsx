'use client';

import React, { useState, useMemo } from 'react';

// --- TIPE DATA ---
type Material = { id: string; name: string; qty: number; unit: string; price: number };
type Overhead = { id: string; name: string; amount: number };
type AdditionalCost = { active: boolean; amount: number };

// --- HELPER FUNCTIONS ---
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- KOMPONEN ICON ---
const Icons = {
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
  )
};

// --- KOMPONEN UI ---
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

const InputGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all ${props.className || ''}`}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all bg-white ${props.className || ''}`}
  >
    {props.children}
  </select>
);

export default function HppPage() {
  // --- STATE MANAGEMENT ---
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Makanan');
  const [productionQty, setProductionQty] = useState(1);
  const [productionUnit, setProductionUnit] = useState('pcs');

  const [materials, setMaterials] = useState<Material[]>([
    { id: generateId(), name: '', qty: 0, unit: 'kg', price: 0 },
    { id: generateId(), name: '', qty: 0, unit: 'gram', price: 0 },
    { id: generateId(), name: '', qty: 0, unit: 'liter', price: 0 },
  ]);

  const [laborWage, setLaborWage] = useState(0);
  const [laborHourlyRate, setLaborHourlyRate] = useState(0);
  const [laborHours, setLaborHours] = useState(0);
  const [laborBonus, setLaborBonus] = useState(0);

  const [overheads, setOverheads] = useState<Overhead[]>([
    { id: generateId(), name: 'Listrik', amount: 0 },
    { id: generateId(), name: 'Air', amount: 0 },
    { id: generateId(), name: 'Gas', amount: 0 },
    { id: generateId(), name: 'Packaging', amount: 0 },
    { id: generateId(), name: 'Penyusutan Mesin', amount: 0 },
    { id: generateId(), name: 'Perawatan Mesin', amount: 0 },
    { id: generateId(), name: 'Transport Produksi', amount: 0 },
    { id: generateId(), name: 'Sewa Tempat', amount: 0 },
    { id: generateId(), name: 'Quality Control', amount: 0 },
  ]);

  const [additional, setAdditional] = useState<{ [key: string]: AdditionalCost }>({
    admin: { active: false, amount: 0 },
    qc: { active: false, amount: 0 },
    depreciation: { active: false, amount: 0 },
    unexpected: { active: false, amount: 0 },
  });

  const [wastePercent, setWastePercent] = useState(0);
  const [targetMargin, setTargetMargin] = useState(30);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // --- KALKULASI (Real-time) ---
  const calc = useMemo(() => {
    const totalMaterial = materials.reduce((sum, m) => sum + (m.qty * m.price), 0);
    const totalLabor = laborWage + (laborHourlyRate * laborHours) + laborBonus;
    const totalOverhead = overheads.reduce((sum, o) => sum + o.amount, 0);
    const totalAdditional = Object.values(additional).reduce((sum, item) => sum + (item.active ? item.amount : 0), 0);
    
    const subtotal = totalMaterial + totalLabor + totalOverhead + totalAdditional;
    const totalWaste = subtotal * (wastePercent / 100);
    const grandTotal = subtotal + totalWaste;
    
    const safeQty = Math.max(1, productionQty || 1);
    const hppPerUnit = grandTotal / safeQty;

    const percentMaterial = grandTotal ? (totalMaterial / grandTotal) * 100 : 0;
    const percentLabor = grandTotal ? (totalLabor / grandTotal) * 100 : 0;
    const percentOverhead = grandTotal ? (totalOverhead / grandTotal) * 100 : 0;
    const percentWaste = grandTotal ? (totalWaste / grandTotal) * 100 : 0;
    const percentAdditional = grandTotal ? (totalAdditional / grandTotal) * 100 : 0;

    return {
      totalMaterial, totalLabor, totalOverhead, totalAdditional, totalWaste, grandTotal, hppPerUnit, safeQty,
      percentages: {
        material: percentMaterial, labor: percentLabor, overhead: percentOverhead, waste: percentWaste, additional: percentAdditional
      }
    };
  }, [materials, laborWage, laborHourlyRate, laborHours, laborBonus, overheads, additional, wastePercent, productionQty]);

  // --- HANDLERS ---
  const handleMaterialChange = (id: string, field: keyof Material, value: string | number) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
  };
  const addMaterial = () => setMaterials([...materials, { id: generateId(), name: '', qty: 0, unit: 'kg', price: 0 }]);
  const removeMaterial = (id: string) => setMaterials(materials.filter(m => m.id !== id));

  const handleOverheadChange = (id: string, value: number) => {
    setOverheads(overheads.map(o => o.id === id ? { ...o, amount: value } : o));
  };
  const addOverhead = () => setOverheads([...overheads, { id: generateId(), name: 'Biaya Lainnya', amount: 0 }]);
  const removeOverhead = (id: string) => setOverheads(overheads.filter(o => o.id !== id));

  const handleAdditionalToggle = (key: string) => {
    setAdditional({ ...additional, [key]: { ...additional[key], active: !additional[key].active } });
  };
  const handleAdditionalAmount = (key: string, value: number) => {
    setAdditional({ ...additional, [key]: { ...additional[key], amount: value } });
  };

  const resetAll = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh kalkulator? Semua data akan hilang.')) {
      window.location.reload();
    }
  };

  const copySummary = () => {
    const text = [
      '==================================',
      '📦 KALKULATOR HPP',
      '',
      `Produk: ${productName || '-'}`,
      `Kategori: ${productCategory}`,
      `Jumlah Produksi: ${calc.safeQty} ${productionUnit}`,
      '',
      `Total Produksi: ${formatRupiah(calc.grandTotal)}`,
      `HPP per Produk: ${formatRupiah(calc.hppPerUnit)}`,
      `Rekomendasi Harga Jual (${targetMargin}%): ${formatRupiah(calc.hppPerUnit * (1 + (targetMargin / 100)))}`,
      '',
      `Status: ${calc.hppPerUnit > 0 ? 'Dihitung' : 'Belum Dihitung'}`,
      '=================================='
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setToast({ show: true, message: 'Ringkasan berhasil disalin.' });
      setTimeout(() => setToast({ show: false, message: '' }), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 selection:bg-blue-200">
      
      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3">
          <div className="text-green-400"><Icons.Check /></div>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#2563EB] rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0">
                <Icons.Box />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kalkulator HPP</h1>
                  <span className="bg-blue-100 text-[#2563EB] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">Professional Tool</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 max-w-xl">Hitung seluruh biaya produksi hingga mengetahui HPP per produk secara real-time.</p>
              </div>
            </div>
            <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="sm:hidden w-full bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md">Lihat Hasil Dashboard</button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ========================================== */}
          {/* KOLOM KIRI: INPUT (65%) */}
          {/* ========================================== */}
          <div className="w-full lg:w-[65%] space-y-6">
            
            {/* CARD 1: INFORMASI PRODUK */}
            <Card>
              <h2 className="text-xl font-bold mb-6 flex items-center border-b border-gray-100 pb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mr-3 text-sm">1</span>
                Informasi Produk
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputGroup label="Nama Produk">
                  <Input type="text" placeholder="Contoh: Kopi Susu Aren" value={productName} onChange={(e) => setProductName(e.target.value)} />
                </InputGroup>
                <InputGroup label="Kategori Produk">
                  <Select value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                    {['Makanan', 'Minuman', 'Fashion', 'Kerajinan', 'Jasa', 'Lainnya'].map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </InputGroup>
                <InputGroup label="Jumlah Produksi">
                  <Input type="number" min="1" value={productionQty === 0 ? '' : productionQty} onChange={(e) => setProductionQty(Number(e.target.value) || 0)} />
                </InputGroup>
                <InputGroup label="Satuan Produksi">
                  <Select value={productionUnit} onChange={(e) => setProductionUnit(e.target.value)}>
                    {['pcs', 'cup', 'botol', 'box', 'kg', 'gram', 'liter', 'porsi'].map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </InputGroup>
              </div>
            </Card>

            {/* CARD 2: BAHAN BAKU */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b border-gray-100 pb-4 gap-2">
                <h2 className="text-xl font-bold flex items-center">
                   <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mr-3 text-sm">2</span>
                  Bahan Baku
                </h2>
                <div className="sm:text-right bg-blue-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtotal Bahan Baku</p>
                  <p className="text-xl font-black text-[#2563EB]">{formatRupiah(calc.totalMaterial)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Header Table (Desktop) */}
                <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                  <div className="col-span-4">Nama Bahan</div>
                  <div className="col-span-2">Jumlah</div>
                  <div className="col-span-2">Satuan</div>
                  <div className="col-span-3">Harga/Satuan</div>
                  <div className="col-span-1 text-center">Aksi</div>
                </div>

                {materials.map((m) => (
                  <div key={m.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border border-gray-100 sm:border-none">
                    <div className="sm:col-span-4">
                      <label className="sm:hidden text-xs font-semibold text-gray-500 mb-1 block">Nama Bahan</label>
                      <Input type="text" placeholder="Contoh: Tepung" value={m.name} onChange={(e) => handleMaterialChange(m.id, 'name', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                       <label className="sm:hidden text-xs font-semibold text-gray-500 mb-1 block">Jumlah</label>
                      <Input type="number" min="0" value={m.qty === 0 ? '' : m.qty} onChange={(e) => handleMaterialChange(m.id, 'qty', Number(e.target.value))} />
                    </div>
                    <div className="sm:col-span-2">
                       <label className="sm:hidden text-xs font-semibold text-gray-500 mb-1 block">Satuan</label>
                      <Select value={m.unit} onChange={(e) => handleMaterialChange(m.id, 'unit', e.target.value)}>
                        {['kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'lembar', 'botol'].map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </div>
                    <div className="sm:col-span-3">
                       <label className="sm:hidden text-xs font-semibold text-gray-500 mb-1 block">Harga/Satuan (Rp)</label>
                      <Input type="number" min="0" value={m.price === 0 ? '' : m.price} onChange={(e) => handleMaterialChange(m.id, 'price', Number(e.target.value))} />
                    </div>
                    <div className="sm:col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                      <button onClick={() => removeMaterial(m.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Bahan">
                        <Icons.Trash />
                      </button>
                    </div>
                    {/* Subtotal Mobile info */}
                    <div className="sm:hidden col-span-1 text-right text-sm font-semibold text-gray-700 mt-2 border-t border-gray-200 pt-2">
                      Subtotal: <span className="text-[#2563EB]">{formatRupiah(m.qty * m.price)}</span>
                    </div>
                  </div>
                ))}
                
                <button onClick={addMaterial} className="mt-4 flex items-center text-[#2563EB] hover:text-blue-700 font-semibold text-sm px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors w-fit border border-transparent hover:border-blue-100">
                  <span className="mr-2"><Icons.Plus /></span> Tambah Bahan Baku
                </button>
              </div>
            </Card>

            {/* CARD 3: TENAGA KERJA */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b border-gray-100 pb-4 gap-2">
                <h2 className="text-xl font-bold flex items-center">
                   <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mr-3 text-sm">3</span>
                  Tenaga Kerja Langsung
                </h2>
                <div className="sm:text-right bg-blue-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tenaga Kerja</p>
                  <p className="text-xl font-black text-[#2563EB]">{formatRupiah(calc.totalLabor)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputGroup label="Upah Produksi (Borongan/Tetap)">
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-500 font-medium">Rp</span>
                    <Input type="number" min="0" className="pl-12" value={laborWage === 0 ? '' : laborWage} onChange={(e) => setLaborWage(Number(e.target.value))} placeholder="0" />
                  </div>
                </InputGroup>
                <InputGroup label="Tarif per Jam (Opsional)">
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-500 font-medium">Rp</span>
                    <Input type="number" min="0" className="pl-12" value={laborHourlyRate === 0 ? '' : laborHourlyRate} onChange={(e) => setLaborHourlyRate(Number(e.target.value))} placeholder="0" />
                  </div>
                </InputGroup>
                <InputGroup label="Jumlah Jam Kerja (Bila ada tarif)">
                   <Input type="number" min="0" value={laborHours === 0 ? '' : laborHours} onChange={(e) => setLaborHours(Number(e.target.value))} placeholder="0" />
                </InputGroup>
                <InputGroup label="Bonus Produksi (Opsional)">
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-500 font-medium">Rp</span>
                    <Input type="number" min="0" className="pl-12" value={laborBonus === 0 ? '' : laborBonus} onChange={(e) => setLaborBonus(Number(e.target.value))} placeholder="0" />
                  </div>
                </InputGroup>
              </div>
            </Card>

            {/* CARD 4: OVERHEAD */}
            <Card>
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b border-gray-100 pb-4 gap-2">
                <h2 className="text-xl font-bold flex items-center">
                   <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mr-3 text-sm">4</span>
                  Biaya Overhead
                </h2>
                <div className="sm:text-right bg-blue-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Overhead</p>
                  <p className="text-xl font-black text-[#2563EB]">{formatRupiah(calc.totalOverhead)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {overheads.map(o => (
                  <div key={o.id} className="flex items-center space-x-3 bg-gray-50 p-2 pl-4 rounded-xl border border-gray-200 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-all">
                    <input 
                      type="text" 
                      value={o.name} 
                      onChange={(e) => setOverheads(overheads.map(item => item.id === o.id ? {...item, name: e.target.value} : item))}
                      className="bg-transparent border-none outline-none text-sm font-semibold flex-1 text-gray-700 w-full"
                    />
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden px-2 shadow-sm">
                       <span className="text-xs font-medium text-gray-500 mr-1">Rp</span>
                       <input 
                        type="number" min="0" 
                        className="w-24 p-1.5 outline-none text-sm text-right font-bold text-gray-900" 
                        value={o.amount === 0 ? '' : o.amount} 
                        onChange={(e) => handleOverheadChange(o.id, Number(e.target.value))} 
                        placeholder="0"
                      />
                    </div>
                    <button onClick={() => removeOverhead(o.id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"><Icons.Trash /></button>
                  </div>
                ))}
              </div>
              <button onClick={addOverhead} className="mt-4 flex items-center text-[#2563EB] hover:text-blue-700 font-semibold text-sm px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors w-fit border border-transparent hover:border-blue-100">
                <span className="mr-2"><Icons.Plus /></span> Tambah Overhead
              </button>
            </Card>

            {/* CARD 5: BIAYA TAMBAHAN */}
            <Card>
               <h2 className="text-xl font-bold flex items-center mb-6 border-b border-gray-100 pb-4">
                   <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mr-3 text-sm">5</span>
                  Biaya Tambahan <span className="ml-2 text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Opsional</span>
                </h2>
                <div className="space-y-4">
                  {[
                    { id: 'admin', label: 'Administrasi Produksi' },
                    { id: 'qc', label: 'Biaya Quality Control' },
                    { id: 'depreciation', label: 'Penyusutan Aset' },
                    { id: 'unexpected', label: 'Biaya Tak Terduga' }
                  ].map(item => (
                    <div key={item.id} className={`p-4 rounded-xl border transition-all duration-300 ${additional[item.id].active ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <label className="flex items-center cursor-pointer flex-1">
                           <div className="relative">
                            <input type="checkbox" className="sr-only" checked={additional[item.id].active} onChange={() => handleAdditionalToggle(item.id)} />
                            <div className={`block w-12 h-7 rounded-full transition-colors duration-300 ${additional[item.id].active ? 'bg-[#2563EB]' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${additional[item.id].active ? 'transform translate-x-5' : ''}`}></div>
                          </div>
                          <span className={`ml-4 font-semibold ${additional[item.id].active ? 'text-[#2563EB]' : 'text-gray-700'}`}>{item.label}</span>
                        </label>
                        {additional[item.id].active && (
                          <div className="flex items-center bg-white border border-blue-200 rounded-lg overflow-hidden px-3 shadow-sm w-full sm:w-auto animate-in fade-in zoom-in-95 duration-200">
                            <span className="text-gray-500 mr-2 text-sm font-medium">Rp</span>
                            <input 
                              type="number" 
                              className="w-full sm:w-32 py-2 outline-none text-sm font-bold text-gray-900 text-right" 
                              value={additional[item.id].amount === 0 ? '' : additional[item.id].amount} 
                              onChange={(e) => handleAdditionalAmount(item.id, Number(e.target.value))} 
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            </Card>

            {/* CARD 6 & 7: WASTE & TARGET */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-3 text-sm font-black">!</span>
                  Waste Produksi
                </h2>
                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-semibold text-gray-700">Estimasi Kerugian</label>
                    <span className="text-2xl font-black text-orange-600">{wastePercent}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="30" step="1" 
                    value={wastePercent} 
                    onChange={(e) => setWastePercent(Number(e.target.value))}
                    className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-semibold px-1">
                    <span>0%</span>
                    <span>30% (Maks)</span>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl flex items-start space-x-3 border border-orange-100">
                    <div className="text-orange-500 mt-0.5"><Icons.Info /></div>
                    <div>
                      <p className="text-xs text-orange-800 font-semibold uppercase tracking-wider mb-1">Estimasi Nilai Waste</p>
                      <p className="text-lg font-black text-orange-600">{formatRupiah(calc.totalWaste)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <span className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 text-sm font-black">%</span>
                  Target Profit
                </h2>
                <div className="space-y-4">
                  <InputGroup label="Margin Keuntungan (Opsional)">
                    <div className="relative flex items-center">
                      <Input type="number" min="0" max="100" value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} className="pr-12 text-xl font-bold text-[#2563EB]" />
                      <span className="absolute right-4 text-gray-400 font-black text-lg">%</span>
                    </div>
                  </InputGroup>
                  <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    Margin ini akan digunakan sistem untuk menghitung <b className="text-gray-700">rekomendasi harga jual ideal</b> pada dashboard hasil.
                  </p>
                </div>
              </Card>
            </div>

            {/* CARD 8: AKSI MOBILE/KIRI */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 text-lg">
                Hitung HPP Sekarang
              </button>
              <button onClick={resetAll} className="sm:w-1/3 bg-white border-2 border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold py-4 px-6 rounded-xl transition-all">
                Reset Semua
              </button>
            </div>

          </div>

          {/* ========================================== */}
          {/* KOLOM KANAN: DASHBOARD HASIL (35%) */}
          {/* ========================================== */}
          <div className="w-full lg:w-[35%]">
            <div className="sticky top-28 space-y-6">
              
              {/* HASIL UTAMA */}
              <div className="bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] rounded-2xl shadow-2xl p-1 overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-400 opacity-20 blur-2xl"></div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20 relative z-10">
                  <h2 className="text-lg font-bold mb-6 flex items-center text-blue-50 uppercase tracking-widest">
                    Dashboard HPP
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-blue-100 items-center">
                      <span>Bahan Baku</span>
                      <span className="font-semibold text-white">{formatRupiah(calc.totalMaterial)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-100 items-center">
                      <span>Tenaga Kerja</span>
                      <span className="font-semibold text-white">{formatRupiah(calc.totalLabor)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-100 items-center">
                      <span>Overhead</span>
                      <span className="font-semibold text-white">{formatRupiah(calc.totalOverhead)}</span>
                    </div>
                    {calc.totalAdditional > 0 && (
                      <div className="flex justify-between text-sm text-blue-100 items-center">
                        <span>Biaya Tambahan</span>
                        <span className="font-semibold text-white">{formatRupiah(calc.totalAdditional)}</span>
                      </div>
                    )}
                    {calc.totalWaste > 0 && (
                      <div className="flex justify-between text-sm text-orange-200 items-center">
                        <span>Waste ({wastePercent}%)</span>
                        <span className="font-semibold text-orange-100">{formatRupiah(calc.totalWaste)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-white/20 pt-6 mb-6">
                    <p className="text-blue-200 text-xs mb-2 uppercase tracking-widest font-bold flex items-center">
                      <span className="mr-2">🏆</span> Total Biaya Produksi
                    </p>
                    <p className="text-4xl sm:text-5xl font-black tracking-tighter truncate" title={formatRupiah(calc.grandTotal)}>{formatRupiah(calc.grandTotal)}</p>
                  </div>

                  <div className="bg-white rounded-xl p-5 text-gray-900 shadow-inner">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">HPP per {productionUnit}</p>
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-1">
                      <p className="text-3xl font-black text-[#2563EB] truncate" title={formatRupiah(calc.hppPerUnit)}>{formatRupiah(calc.hppPerUnit)}</p>
                      <p className="text-sm font-semibold text-gray-400 mb-1">/ {calc.safeQty} {productionUnit}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* REKOMENDASI HARGA */}
              <Card className="!p-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                  Rekomendasi Harga Jual
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[20, 30, 40, 50].map(margin => {
                    const isTarget = margin === targetMargin;
                    const price = calc.hppPerUnit * (1 + margin/100);
                    return (
                      <div key={margin} className={`p-3 rounded-xl border transition-all ${isTarget ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isTarget ? 'text-[#2563EB]' : 'text-gray-500'}`}>
                          Margin {margin}% {isTarget && <span className="ml-1">(Target)</span>}
                        </p>
                        <p className={`font-black truncate ${isTarget ? 'text-[#2563EB] text-lg' : 'text-gray-900'}`} title={formatRupiah(price)}>
                          {formatRupiah(price)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* BREAKDOWN & ANALISIS */}
              <Card className="!p-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Breakdown Biaya</h3>
                
                {/* Progress Bar Horizontal */}
                <div className="h-5 flex rounded-full overflow-hidden mb-5 bg-gray-100 shadow-inner">
                  <div style={{ width: `${calc.percentages.material}%` }} className="bg-[#2563EB] transition-all duration-700" title="Bahan Baku"></div>
                  <div style={{ width: `${calc.percentages.labor}%` }} className="bg-indigo-400 transition-all duration-700" title="Tenaga Kerja"></div>
                  <div style={{ width: `${calc.percentages.overhead}%` }} className="bg-purple-400 transition-all duration-700" title="Overhead"></div>
                  <div style={{ width: `${calc.percentages.additional}%` }} className="bg-teal-400 transition-all duration-700" title="Tambahan"></div>
                  <div style={{ width: `${calc.percentages.waste}%` }} className="bg-orange-500 transition-all duration-700" title="Waste"></div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-gray-600 mb-6">
                  <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] mr-2"></span> Bahan ({calc.percentages.material.toFixed(0)}%)</div>
                  <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 mr-2"></span> Tenaga ({calc.percentages.labor.toFixed(0)}%)</div>
                  <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 mr-2"></span> Overhead ({calc.percentages.overhead.toFixed(0)}%)</div>
                  {calc.percentages.waste > 0 && <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2"></span> Waste ({calc.percentages.waste.toFixed(0)}%)</div>}
                </div>

                {/* Insight Otomatis */}
                <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-100 space-y-3">
                  <h4 className="text-[11px] font-black text-[#2563EB] uppercase tracking-widest flex items-center mb-1">
                    <span className="mr-2"><Icons.Info /></span> Insight AI
                  </h4>
                  {calc.grandTotal === 0 && <p className="text-sm text-gray-600 font-medium">Masukkan data untuk melihat analisis HPP.</p>}
                  
                  {calc.percentages.material > 60 && (
                    <p className="text-sm text-gray-800 leading-relaxed border-l-2 border-[#2563EB] pl-3 py-0.5">Bahan baku <b>mendominasi</b> biaya produksi. Evaluasi efisiensi supplier.</p>
                  )}
                  {calc.percentages.overhead > 30 && (
                    <p className="text-sm text-gray-800 leading-relaxed border-l-2 border-purple-500 pl-3 py-0.5">Biaya operasional (overhead) <b>cukup tinggi</b>. Pertimbangkan penghematan operasional.</p>
                  )}
                  {calc.percentages.waste > 10 && (
                    <p className="text-sm text-red-800 leading-relaxed border-l-2 border-red-500 pl-3 py-0.5">Persentase waste <b>cukup besar ({wastePercent}%)</b>, segera evaluasi proses produksi.</p>
                  )}
                  {calc.grandTotal > 0 && calc.percentages.material <= 60 && calc.percentages.overhead <= 30 && calc.percentages.waste <= 10 && (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-xs font-bold border border-green-200">
                      ✅ Struktur Biaya Tergolong Efisien
                    </div>
                  )}
                </div>
              </Card>

              {/* SIMULASI */}
              <Card className="!p-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Simulasi Kondisi</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-green-50 border border-green-100">
                    <div>
                      <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-0.5">Efisiensi</p>
                      <p className="text-[10px] font-semibold text-green-600">Biaya turun 10%</p>
                    </div>
                    <p className="font-black text-green-700">{formatRupiah(calc.hppPerUnit * 0.9)}</p>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white border-2 border-blue-200 shadow-md relative z-10 transform scale-105">
                    <div className="absolute -top-2.5 right-3 bg-[#2563EB] text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-widest flex items-center gap-1">
                      <span>⭐</span> IDEAL
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-wider mb-0.5">Normal</p>
                      <p className="text-[10px] font-semibold text-gray-500">Kondisi saat ini</p>
                    </div>
                    <p className="font-black text-xl text-[#2563EB]">{formatRupiah(calc.hppPerUnit)}</p>
                  </div>
                  <div className="flex justify-between items-center p-3.5 rounded-xl bg-red-50 border border-red-100">
                     <div>
                      <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-0.5">Biaya Naik</p>
                      <p className="text-[10px] font-semibold text-red-600">Inflasi 15%</p>
                    </div>
                    <p className="font-black text-red-700">{formatRupiah(calc.hppPerUnit * 1.15)}</p>
                  </div>
                </div>
              </Card>

              {/* ACTION COPY */}
              <button 
                onClick={copySummary}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold text-lg py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3"
              >
                <Icons.Copy />
                <span>Salin Ringkasan</span>
              </button>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
