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
    <div className="min-h-screen bg-background">
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
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando times...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {timesFiltrados.map((time) => (
              <div
                key={time.id}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
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
