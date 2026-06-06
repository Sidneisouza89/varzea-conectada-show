import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";

interface Time {
  id: number;
  nome_oficial: string;
  apelido: string;
  regiao: string;
}

const Times = () => {
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchTimes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/times`);
        if (response.ok) {
          const data = await response.json();
          setTimes(data);
        }
      } catch (error) {
        console.error("Erro ao buscar times:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimes();
  }, []);

  const timesFiltrados = times.filter(
    (t) =>
      t.nome_oficial.toLowerCase().includes(busca.toLowerCase()) ||
      t.regiao?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen relative bg-background">
      {/* Gradiente de fundo */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-orange-500/10 via-background to-blue-900/20 pointer-events-none" />

      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Times de Várzea</h1>
          <p className="text-muted-foreground text-lg">
            {times.length} times cadastrados em Diadema
          </p>
        </div>

        <div className="mb-8 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Buscar time ou região..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-xl border bg-card/80 p-5 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-2 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {timesFiltrados.map((time) => (
              <div
                key={time.id}
                className="rounded-xl border bg-card/80 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {time.apelido ? time.apelido[0] : time.nome_oficial[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">{time.nome_oficial}</h3>
                    {time.apelido && (
                      <p className="text-xs text-muted-foreground">{time.apelido}</p>
                    )}
                  </div>
                </div>
                {time.regiao && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>📍</span>
                    <span>{time.regiao}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && timesFiltrados.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhum time encontrado.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Times;
