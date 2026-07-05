export type Tool = {
  title: string;
  slug: string;
  description: string;
  category: string;
};

export const tools: Tool[] = [
  {
    title: "Kalkulator Harga Jual",
    slug: "harga-jual",
    description: "Tentukan harga jual berdasarkan HPP dan markup.",
    category: "Keuangan",
  },
  {
    title: "Kalkulator Laba Rugi",
    slug: "laba-rugi",
    description: "Hitung laba atau rugi usaha dengan cepat.",
    category: "Keuangan",
  },
  {
    title: "Kalkulator BEP",
    slug: "bep",
    description: "Hitung titik impas (Break Even Point) bisnis Anda.",
    category: "Keuangan",
  },
];