import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MatchesList from "@/components/MatchesList";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <MatchesList />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
