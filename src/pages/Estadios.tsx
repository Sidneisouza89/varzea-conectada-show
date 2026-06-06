import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { MapPin, Search, Building2, Navigation } from "lucide-react";

interface Estadio {
  id: number;
  nome_oficial: string;
  apelido: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const Estadios = () => {
  const [estadios, setEstadios] = useState<Estadio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchEstadios = async () => {
      try {
        const token = localStorage.getItem("varzeando_token");
        const response = await fetch(`${API_BASE_URL}/api/estadios`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setEstadios(data);
        }
      } catch (error) {
        console.error("Erro ao buscar estádios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEstadios();
  }, []);

  const estadiosFiltrados = estadios.filter((e) => {
    const termo = busca.toLowerCase();
    return (
      e.nome_oficial?.toLowerCase().includes(termo) ||
      e.apelido?.toLowerCase().includes(termo) ||
      e.bairro?.toLowerCase().includes(termo)
    );
  });

  const bairros = [...new Set(estadios.map((e) => e.bairro).filter(Boolean))];

  return (
    <div className="min-h-screen relative bg-background">
      <div className="fixed inset-0 -z-10 bg-gradient-hero opacity-[0.08] pointer-events-none" />

      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Estádios</h1>
          <p className="text-muted-foreground text-lg">Campos e praças esportivas de Diadema</p>
        </div>

        {!loading && estadios.length > 0 && (
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border rounded-xl px-5 py-3 shadow-sm">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-semibold">{estadios.length}</span>
              <span className="text-muted-foreground text-sm">Campos</span>
            </div>
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border rounded-xl px-5 py-3 shadow-sm">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="font-semibold">{bairros.length}</span>
              <span className="text-muted-foreground text-sm">Bairros</span>
            </div>
          </div>
        )}

        {!loading && estadios.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou bairro..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-card/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card/80 p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-6" />
                <div className="h-8 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && estadiosFiltrados.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {estadiosFiltrados.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {e.cidade ?? "Diadema"}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1 leading-tight">{e.nome_oficial}</h3>
                {e.apelido && e.apelido !== e.nome_oficial && (
                  <p className="text-sm text-muted-foreground italic mb-3">"{e.apelido}"</p>
                )}
                {e.bairro && (
                  <div className="flex items-center gap-1.5 mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{e.bairro} — {e.estado ?? "SP"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && estadios.length > 0 && estadiosFiltrados.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum campo encontrado</h3>
            <p className="text-muted-foreground">Tente buscar por outro nome ou bairro.</p>
          </div>
        )}

        {!loading && estadios.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum estádio cadastrado</h3>
            <p className="text-muted-foreground">Os campos de várzea de Diadema aparecerão aqui em breve.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Estadios;
