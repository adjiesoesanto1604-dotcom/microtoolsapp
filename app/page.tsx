import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedTools from "./components/FeaturedTools";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeaturedTools />
    </main>
  );
}
