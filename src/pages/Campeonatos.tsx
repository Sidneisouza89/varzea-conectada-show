import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { Trophy, Zap, CheckCircle2, Clock, Star } from "lucide-react";

interface Campeonato {
  campeonato_id: number;
  nome: string;
  tipo_formato: string;
  pontos_vitoria: number;
  pontos_empate: number;
  ativo: boolean;
}

const formatoLabel: Record<string, string> = {
  PONTOS_CORRIDOS: "Pontos Corridos",
  MATA_MATA: "Mata-Mata",
  GRUPOS_E_MATA_MATA: "Grupos + Mata-Mata",
};

const Campeonatos = () => {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "encerrados">("todos");

  useEffect(() => {
    const fetchCampeonatos = async () => {
      try {
        const token = localStorage.getItem("varzeando_token");
        const response = await fetch(`${API_BASE_URL}/api/campeonatos`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCampeonatos(data);
        }
      } catch (error) {
        console.error("Erro ao buscar campeonatos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampeonatos();
  }, []);

  const campeonatosFiltrados = campeonatos.filter((c) => {
    if (filtro === "ativos") return c.ativo;
    if (filtro === "encerrados") return !c.ativo;
    return true;
  });

  const ativos = campeonatos.filter((c) => c.ativo).length;
  const encerrados = campeonatos.filter((c) => !c.ativo).length;

  return (
    <div className="min-h-screen bg-background bg-page-gradient">

      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Campeonatos</h1>
          <p className="text-muted-foreground text-lg">Competições de várzea em Diadema</p>
        </div>

        {!loading && campeonatos.length > 0 && (
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border rounded-xl px-5 py-3 shadow-sm">
              <Star className="w-4 h-4 text-primary" />
              <span className="font-semibold">{campeonatos.length}</span>
              <span className="text-muted-foreground text-sm">Total</span>
            </div>
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border rounded-xl px-5 py-3 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="font-semibold">{ativos}</span>
              <span className="text-muted-foreground text-sm">Ativos</span>
            </div>
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border rounded-xl px-5 py-3 shadow-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{encerrados}</span>
              <span className="text-muted-foreground text-sm">Encerrados</span>
            </div>
          </div>
        )}

        {!loading && campeonatos.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl border bg-card/80 backdrop-blur-sm p-1 gap-1">
              {(["todos", "ativos", "encerrados"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    filtro === f
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "todos" ? "Todos" : f === "ativos" ? `Ativos (${ativos})` : `Encerrados (${encerrados})`}
                </button>
              ))}
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

        {!loading && campeonatosFiltrados.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {campeonatosFiltrados.map((c) => (
              <div
                key={c.campeonato_id}
                className="rounded-xl border bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                    c.ativo
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {c.ativo ? <><Zap className="w-3 h-3" /> Ativo</> : <><Clock className="w-3 h-3" /> Encerrado</>}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1 leading-tight">{c.nome}</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  {formatoLabel[c.tipo_formato] ?? c.tipo_formato?.replace(/_/g, " ")}
                </p>
                <div className="flex gap-2 pt-4 border-t">
                  <div className="flex-1 text-center bg-muted/60 rounded-lg py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Vitória</p>
                    <p className="font-bold text-green-600">{c.pontos_vitoria ?? 3} pts</p>
                  </div>
                  <div className="flex-1 text-center bg-muted/60 rounded-lg py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Empate</p>
                    <p className="font-bold text-yellow-600">{c.pontos_empate ?? 1} pts</p>
                  </div>
                  <div className="flex-1 text-center bg-muted/60 rounded-lg py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Derrota</p>
                    <p className="font-bold text-red-500">0 pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && campeonatosFiltrados.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum campeonato encontrado</h3>
            <p className="text-muted-foreground">
              {filtro === "todos" ? "Nenhum campeonato cadastrado ainda."
                : `Não há campeonatos ${filtro === "ativos" ? "ativos" : "encerrados"} no momento.`}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Campeonatos;
