import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { ArrowLeft, Trophy, Swords } from "lucide-react";

interface JogoAPI {
  jogo_id: number;
  mandante: string;
  mandante_id: number | null;
  mandante_logo?: string | null;
  visitante: string;
  visitante_id: number | null;
  visitante_logo?: string | null;
  status: string;
  gols_mandante: number;
  gols_visitante: number;
  rodada: number | null;
  confronto_id: number | null;
}

interface Campeonato { campeonato_id: number; nome: string; }

interface TimeConfronto { id: number; nome: string; logo?: string | null; gols: number }

interface Confronto {
  confronto_id: number;
  times: TimeConfronto[];
  bye: boolean;
  finalizado: boolean;
  vencedorId: number | null;
}

// Agrupa os jogos de UMA fase (mesma rodada) em confrontos, somando o
// placar agregado por time (cobre jogo único e ida+volta na mesma conta,
// já que soma por identidade do time, não por mandante/visitante).
const montarConfrontos = (jogosDaRodada: JogoAPI[]): Confronto[] => {
  const porConfronto: Record<number, JogoAPI[]> = {};
  jogosDaRodada.forEach((j) => {
    if (j.confronto_id == null) return;
    (porConfronto[j.confronto_id] ??= []).push(j);
  });

  return Object.entries(porConfronto).map(([cid, jogos]) => {
    if (jogos.length === 1 && jogos[0].status === "Bye") {
      const j = jogos[0];
      return {
        confronto_id: Number(cid),
        times: j.mandante_id != null ? [{ id: j.mandante_id, nome: j.mandante, logo: j.mandante_logo, gols: 0 }] : [],
        bye: true,
        finalizado: true,
        vencedorId: j.mandante_id,
      };
    }

    const mapa: Record<number, { nome: string; logo?: string | null; gols: number }> = {};
    let todosFinalizados = jogos.length > 0;
    jogos.forEach((j) => {
      if (j.status !== "Finalizado") todosFinalizados = false;
      if (j.mandante_id != null) {
        mapa[j.mandante_id] ??= { nome: j.mandante, logo: j.mandante_logo, gols: 0 };
        mapa[j.mandante_id].gols += j.gols_mandante ?? 0;
      }
      if (j.visitante_id != null) {
        mapa[j.visitante_id] ??= { nome: j.visitante, logo: j.visitante_logo, gols: 0 };
        mapa[j.visitante_id].gols += j.gols_visitante ?? 0;
      }
    });
    const times = Object.entries(mapa).map(([id, t]) => ({ id: Number(id), ...t }));

    let vencedorId: number | null = null;
    if (todosFinalizados && times.length === 2) {
      if (times[0].gols > times[1].gols) vencedorId = times[0].id;
      else if (times[1].gols > times[0].gols) vencedorId = times[1].id;
      // empate no agregado sem decisão registrada aqui (pode ter sido por
      // pênaltis, que não aparecem nessa listagem) — fica sem vencedor
      // destacado até o placar ser corrigido/resolvido no Admin.
    }

    return { confronto_id: Number(cid), times, bye: jogos.length === 1 && times.length < 2, finalizado: todosFinalizados, vencedorId };
  });
};

const LABELS_DO_FIM = ["Final", "Semifinal", "Quartas de Final", "Oitavas de Final", "16-avos de Final", "32-avos de Final"];

const ChaveamentoMataMata = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campeonato, setCampeonato] = useState<Campeonato | null>(null);
  const [fases, setFases] = useState<{ rodada: number; confrontos: Confronto[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resCamp, resJogos] = await Promise.all([
          fetch(`${API_BASE_URL}/api/campeonatos/${id}`),
          fetch(`${API_BASE_URL}/api/jogos?campeonato_id=${id}`),
        ]);
        if (resCamp.ok) setCampeonato(await resCamp.json());
        if (resJogos.ok) {
          const todos: JogoAPI[] = await resJogos.json();
          const mataMata = todos.filter((j) => j.confronto_id != null && j.rodada != null);
          if (mataMata.length === 0) {
            setErro("Esse campeonato ainda não tem chaveamento de mata-mata gerado.");
          } else {
            const porRodada: Record<number, JogoAPI[]> = {};
            mataMata.forEach((j) => { (porRodada[j.rodada as number] ??= []).push(j); });
            const rodadasOrdenadas = Object.keys(porRodada).map(Number).sort((a, b) => a - b);
            setFases(rodadasOrdenadas.map((r) => ({ rodada: r, confrontos: montarConfrontos(porRodada[r]) })));
          }
        }
      } catch {
        setErro("Erro de conexão ao carregar o chaveamento.");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  const labelFase = (indexColuna: number, totalFases: number) => {
    const indexFromEnd = totalFases - 1 - indexColuna;
    return LABELS_DO_FIM[indexFromEnd] ?? `Fase ${indexColuna + 1}`;
  };

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}>
      <Header />
      <main className="container mx-auto px-4 py-10">

        <button onClick={() => navigate(`/campeonatos/${id}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para o campeonato
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-1">{campeonato?.nome ?? "Chaveamento"}</h1>
          <p className="text-muted-foreground">Chaveamento do mata-mata</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && erro && (
          <div className="text-center py-20">
            <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{erro}</p>
          </div>
        )}

        {!loading && !erro && fases.length > 0 && (
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-8 min-w-max px-2">
              {fases.map((fase, colIdx) => (
                <div key={fase.rodada} className="flex flex-col justify-around gap-6" style={{ minWidth: "260px" }}>
                  <h2 className="text-center font-bold text-sm uppercase tracking-wider text-primary mb-2 sticky top-0">
                    {labelFase(colIdx, fases.length)}
                  </h2>
                  <div className="flex flex-col justify-around gap-8 flex-1">
                    {fase.confrontos.map((c) => (
                      <div key={c.confronto_id} className="rounded-xl border bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden relative">
                        {c.bye ? (
                          <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {c.times[0]?.logo ? (
                                <img src={c.times[0].logo} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">{c.times[0]?.nome[0]}</div>
                              )}
                              <span className="text-sm font-semibold truncate">{c.times[0]?.nome ?? "?"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">BYE</span>
                          </div>
                        ) : (
                          [0, 1].map((i) => {
                            const t = c.times[i];
                            const venceu = c.finalizado && t && c.vencedorId === t.id;
                            return (
                              <div key={i} className={`px-4 py-2.5 flex items-center justify-between gap-2 ${i === 0 ? "border-b" : ""} ${venceu ? "bg-primary/5" : ""}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  {t?.logo ? (
                                    <img src={t.logo} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">{t?.nome?.[0] ?? "?"}</div>
                                  )}
                                  <span className={`text-sm truncate ${venceu ? "font-bold text-primary" : "text-foreground"}`}>{t?.nome ?? "A definir"}</span>
                                </div>
                                {t && (
                                  <span className={`text-sm tabular-nums flex-shrink-0 ${venceu ? "font-bold text-primary" : "text-muted-foreground"}`}>{t.gols}</span>
                                )}
                              </div>
                            );
                          })
                        )}
                        {!c.bye && !c.finalizado && (
                          <div className="px-4 py-1 bg-muted/50 text-center">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Em aberto</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default ChaveamentoMataMata;
