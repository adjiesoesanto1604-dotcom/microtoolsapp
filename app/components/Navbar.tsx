export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-6 border-b">

      <h1 className="text-2xl font-bold text-blue-600">
        Microtools UMKM
      </h1>
      <div className="flex gap-8">
        
        <a href="#">Home</a>

        <a href="#">Tools</a>

        <a href="#">Tentang</a>

      </div>

    </nav>
  );
}