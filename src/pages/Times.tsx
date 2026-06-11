import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { MapPin, ChevronRight } from "lucide-react";

interface Time {
  id: number;
  nome_oficial: string;
  apelido: string;
  regiao: string;
  logo_url?: string;
}

const Times = () => {
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();

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
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}
    >
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Times da Várzea</h1>
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-card/80 p-5 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-muted" />
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
                onClick={() => navigate(`/times/${time.id}`)}
                className="rounded-xl border bg-card/80 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Brasão ou inicial */}
                  {time.logo_url ? (
                    <img
                      src={time.logo_url}
                      alt={`Brasão ${time.nome_oficial}`}
                      className="w-14 h-14 rounded-full object-contain bg-white border p-0.5"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary/20 transition-colors">
                      {time.apelido ? time.apelido[0] : time.nome_oficial[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                      {time.nome_oficial}
                    </h3>
                    {time.apelido && (
                      <p className="text-xs text-muted-foreground truncate">{time.apelido}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {time.regiao && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{time.regiao}</span>
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                </div>
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
