import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft, Trophy, MapPin, Calendar, Clock,
  CheckCircle2, Swords, Target
} from "lucide-react";

interface Sumula {
  partida: {
    id: number;
    campeonato: string;
    data_hora: string;
    status: string;
    placar_final: string;
  };
  local_e_equipe: {
    estadio: string;
    arbitro: string;
    delegado: string;
  };
  confronto: {
    mandante: string;
    visitante: string;
  };
  eventos: {
    minuto: string;
    jogador: string;
    time: string;
    tipo: string;
  }[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  "Finalizado":             { label: "Encerrado",             color: "bg-green-100 text-green-700" },
  "Agendado":               { label: "Próximo",               color: "bg-muted text-muted-foreground" },
  "Em andamento":           { label: "Ao Vivo",               color: "bg-red-100 text-red-700" },
  "Aguardando confirmação": { label: "Aguard. confirmação",   color: "bg-blue-100 text-blue-700" },
  "Em disputa":             { label: "Em disputa",            color: "bg-orange-100 text-orange-700" },
};

const JogoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("varzeando_token");

  const [sumula, setSumula] = useState<Sumula | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const fetchSumula = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jogos/${id}/sumula`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          setSumula(await res.json());
        } else if (res.status === 404) {
          setErro("Jogo não encontrado.");
        } else if (res.status === 401) {
          setErro("Faça login para ver os detalhes do jogo.");
        } else {
          setErro("Erro ao carregar a súmula.");
        }
      } catch {
        setErro("Erro de conexão.");
      } finally {
        setLoading(false);
      }
    };
    fetchSumula();
  }, [id]);

  const [gols_mandante, gols_visitante] = sumula?.partida.placar_final?.split(" x ").map(Number) ?? [0, 0];
  const status = sumula ? statusConfig[sumula.partida.status] ?? { label: sumula.partida.status, color: "bg-muted text-muted-foreground" } : null;

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">

        {/* Voltar */}
        <button onClick={() => navigate("/jogos")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para Jogos
        </button>

        {loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        )}

        {erro && (
          <div className="text-center py-20">
            <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{erro}</p>
          </div>
        )}

        {sumula && !loading && (
          <div className="space-y-4">

            {/* Card principal — Placar */}
            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">{sumula.partida.campeonato}</span>
                {status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                )}
              </div>

              {/* Times e placar */}
              <div className="flex items-center justify-center gap-6">
                <div className="flex-1 text-right">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl ml-auto mb-2">
                    {sumula.confronto.mandante[0]}
                  </div>
                  <p className="font-bold text-lg leading-tight">{sumula.confronto.mandante}</p>
                  <p className="text-xs text-muted-foreground">Casa</p>
                </div>

                <div className="text-center px-4">
                  {sumula.partida.status === "Finalizado" || sumula.partida.status === "Em andamento" ? (
                    <div className="bg-muted rounded-2xl px-6 py-3">
                      <p className="text-4xl font-bold tabular-nums">
                        {gols_mandante} <span className="text-muted-foreground text-2xl">x</span> {gols_visitante}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-2xl px-6 py-3">
                      <p className="text-2xl font-bold text-muted-foreground">VS</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mr-auto mb-2">
                    {sumula.confronto.visitante[0]}
                  </div>
                  <p className="font-bold text-lg leading-tight">{sumula.confronto.visitante}</p>
                  <p className="text-xs text-muted-foreground">Visitante</p>
                </div>
              </div>
            </div>

            {/* Informações da partida */}
            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Informações</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Data e hora</span>
                  <span className="font-medium ml-auto">{sumula.partida.data_hora}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Estádio</span>
                  <span className="font-medium ml-auto">{sumula.local_e_equipe.estadio}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Árbitro</span>
                  <span className="font-medium ml-auto">{sumula.local_e_equipe.arbitro}</span>
                </div>
                {sumula.local_e_equipe.delegado !== "N/A" && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Delegado</span>
                    <span className="font-medium ml-auto">{sumula.local_e_equipe.delegado}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gols */}
            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" /> Gols
              </h2>
              {sumula.eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum gol registrado.</p>
              ) : (
                <div className="space-y-2">
                  {sumula.eventos.map((ev, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                      <span className="w-10 text-center text-xs font-bold bg-primary/10 text-primary rounded-lg py-1">{ev.minuto}'</span>
                      <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="font-medium">{ev.jogador}</span>
                      <span className="text-muted-foreground text-xs">({ev.time})</span>
                      {ev.tipo !== "Normal" && (
                        <span className="ml-auto text-xs text-muted-foreground">{ev.tipo}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JogoDetalhe;
