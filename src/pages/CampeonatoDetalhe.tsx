import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import {
  Trophy, ArrowLeft, Shield, Swords, TrendingUp,
  CheckCircle2, Minus, XCircle, Calendar, LayoutGrid, ListOrdered,
  Settings2, GitBranch
} from "lucide-react";

interface TimeTabela {
  nome: string;
  logo_url?: string | null;
  pts: number;
  pj: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
}

interface TimeGrupo extends TimeTabela {
  time_id: number;
}

interface Jogo {
  jogo_id: number;
  mandante: string;
  visitante: string;
  campeonato: string;
  data_hora: string;
  status: string;
  gols_mandante: number;
  gols_visitante: number;
  rodada: number | null;
  confronto_id: number | null;
}

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
  IDA_E_VOLTA: "Ida e Volta",
  PONTOS_CORRIDOS_PLAYOFFS: "Pontos Corridos + Playoffs",
};

const CampeonatoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campeonato, setCampeonato] = useState<Campeonato | null>(null);
  const [tabelaGeral, setTabelaGeral] = useState<TimeTabela[]>([]);
  const [grupos, setGrupos] = useState<Record<string, TimeGrupo[]>>({});
  const [temGrupos, setTemGrupos] = useState(false);
  const [visaoTabela, setVisaoTabela] = useState<"grupos" | "geral">("grupos");
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [aba, setAba] = useState<"tabela" | "jogos">("tabela");
  const [loading, setLoading] = useState(true);

  // identifica se o usuário logado é admin (mesmo critério usado no Header)
  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "master" || user?.role === "presidente";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resGrupos, resClass] = await Promise.all([
          fetch(`${API_BASE_URL}/api/campeonatos/${id}/classificacao-grupos`),
          fetch(`${API_BASE_URL}/api/campeonatos/${id}/classificacao`),
        ]);

        if (resGrupos.ok) {
          const dataGrupos = await resGrupos.json();
          const chaves = Object.keys(dataGrupos.grupos || {});
          if (chaves.length > 0) {
            setGrupos(dataGrupos.grupos);
            setTemGrupos(true);
          }
        }

        if (resClass.ok) {
          const dataClass = await resClass.json();
          setTabelaGeral(dataClass.tabela);
          setCampeonato((prev) => prev ?? { campeonato_id: Number(id), nome: dataClass.campeonato, tipo_formato: "", pontos_vitoria: 3, pontos_empate: 1, ativo: true });
        }

        const token = localStorage.getItem("varzeando_token");
        const resJogos = await fetch(`${API_BASE_URL}/api/jogos`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (resJogos.ok) {
          const dataJogos: Jogo[] = await resJogos.json();
          const resC = await fetch(`${API_BASE_URL}/api/campeonatos`);
          if (resC.ok) {
            const camps: Campeonato[] = await resC.json();
            const camp = camps.find(c => c.campeonato_id === Number(id));
            if (camp) {
              setCampeonato(camp);
              setJogos(dataJogos.filter(j => j.campeonato === camp.nome));
            } else {
              setJogos(dataJogos);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const jogosFinaliz = jogos.filter(j => j.status === "Finalizado");
  const jogosProximos = jogos.filter(j => j.status === "Agendado");

  // Já tem algum jogo de mata-mata gerado (confronto_id preenchido)? Se sim,
  // mostra o botão "Ver Chaveamento" — é visualização pública, não gestão,
  // então aparece pra qualquer visitante, não só admin.
  const temChaveamento = jogos.some(j => j.confronto_id != null);

  const nomeFasePorRodada = (() => {
    const confrontosPorRodada: Record<number, Set<number>> = {};
    jogos.forEach((j) => {
      if (j.rodada == null || j.confronto_id == null) return;
      if (!confrontosPorRodada[j.rodada]) confrontosPorRodada[j.rodada] = new Set();
      confrontosPorRodada[j.rodada].add(j.confronto_id);
    });

    const mapa: Record<number, string> = {};
    Object.entries(confrontosPorRodada).forEach(([rodadaStr, confrontos]) => {
      const rodada = Number(rodadaStr);
      const qtd = confrontos.size;
      if (qtd === 1) mapa[rodada] = "Final";
      else if (qtd === 2) mapa[rodada] = "Semifinal";
      else if (qtd === 4) mapa[rodada] = "Quartas de Final";
      else if (qtd === 8) mapa[rodada] = "Oitavas de Final";
      else if (qtd === 16) mapa[rodada] = "16 Avos de Final";
      else mapa[rodada] = "Mata-Mata";
    });
    return mapa;
  })();

  const nomeFaseDoJogo = (j: Jogo): string | null => {
    if (j.rodada == null || j.confronto_id == null) return null;
    return nomeFasePorRodada[j.rodada] ?? null;
  };

  const renderTabelaGenerica = (lista: (TimeTabela | TimeGrupo)[]) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/40">
          <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-8">#</th>
          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Time</th>
          <th className="px-4 py-3 font-semibold text-muted-foreground text-center">PTS</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">PJ</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">V</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">E</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">D</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">GP</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">GC</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">SG</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((time, idx) => (
          <tr
            key={time.nome}
            className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${idx === 0 ? "bg-primary/5" : ""}`}
          >
            <td className="px-4 py-3">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                idx === 0 ? "bg-primary text-white" :
                idx === 1 ? "bg-blue-100 text-blue-700" :
                idx === 2 ? "bg-orange-100 text-orange-700" :
                "bg-muted text-muted-foreground"
              }`}>
                {idx + 1}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                  {time.logo_url ? <img src={time.logo_url} alt={time.nome} className="w-full h-full object-cover" /> : time.nome[0]}
                </div>
                <span className="font-medium">{time.nome}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-center">
              <span className="font-bold text-lg text-primary">{time.pts}</span>
            </td>
            <td className="px-3 py-3 text-center text-muted-foreground">{time.pj}</td>
            <td className="px-3 py-3 text-center">
              <span className="flex items-center justify-center gap-0.5 text-green-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />{time.v}
              </span>
            </td>
            <td className="px-3 py-3 text-center">
              <span className="flex items-center justify-center gap-0.5 text-yellow-600 font-medium">
                <Minus className="w-3 h-3" />{time.e}
              </span>
            </td>
            <td className="px-3 py-3 text-center">
              <span className="flex items-center justify-center gap-0.5 text-red-500 font-medium">
                <XCircle className="w-3 h-3" />{time.d}
              </span>
            </td>
            <td className="px-3 py-3 text-center text-muted-foreground">{time.gp}</td>
            <td className="px-3 py-3 text-center text-muted-foreground">{time.gc}</td>
            <td className="px-3 py-3 text-center">
              <span className={`font-medium ${time.sg > 0 ? "text-green-600" : time.sg < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {time.sg > 0 ? `+${time.sg}` : time.sg}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTabelaCompacta = (lista: (TimeTabela | TimeGrupo)[]) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/40">
          <th className="text-left px-3 py-3 font-semibold text-muted-foreground w-8">#</th>
          <th className="text-left px-3 py-3 font-semibold text-muted-foreground">Time</th>
          <th className="px-3 py-3 font-semibold text-muted-foreground text-center">PTS</th>
          <th className="px-2 py-3 font-semibold text-muted-foreground text-center">PJ</th>
          <th className="px-2 py-3 font-semibold text-muted-foreground text-center">V</th>
          <th className="px-2 py-3 font-semibold text-muted-foreground text-center">E</th>
          <th className="px-2 py-3 font-semibold text-muted-foreground text-center">D</th>
          <th className="px-2 py-3 font-semibold text-muted-foreground text-center">SG</th>
        </tr>
      </thead>
      <tbody>
        {lista.map((time, idx) => (
          <tr
            key={time.nome}
            className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${idx === 0 ? "bg-primary/5" : ""}`}
          >
            <td className="px-3 py-2.5">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                idx === 0 ? "bg-primary text-white" :
                idx === 1 ? "bg-blue-100 text-blue-700" :
                idx === 2 ? "bg-orange-100 text-orange-700" :
                "bg-muted text-muted-foreground"
              }`}>
                {idx + 1}
              </span>
            </td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0 overflow-hidden">
                  {time.logo_url ? <img src={time.logo_url} alt={time.nome} className="w-full h-full object-cover" /> : time.nome[0]}
                </div>
                <span className="font-medium truncate">{time.nome}</span>
              </div>
            </td>
            <td className="px-3 py-2.5 text-center">
              <span className="font-bold text-primary">{time.pts}</span>
            </td>
            <td className="px-2 py-2.5 text-center text-muted-foreground">{time.pj}</td>
            <td className="px-2 py-2.5 text-center text-green-600 font-medium">{time.v}</td>
            <td className="px-2 py-2.5 text-center text-yellow-600 font-medium">{time.e}</td>
            <td className="px-2 py-2.5 text-center text-red-500 font-medium">{time.d}</td>
            <td className="px-2 py-2.5 text-center">
              <span className={`font-medium ${time.sg > 0 ? "text-green-600" : time.sg < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {time.sg > 0 ? `+${time.sg}` : time.sg}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}
    >
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-5xl">

        <button
          onClick={() => navigate("/campeonatos")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Campeonatos
        </button>

        {loading ? (
          <div className="animate-pulse h-16 bg-muted rounded-xl mb-8" />
        ) : (
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-3xl font-bold">{campeonato?.nome ?? `Campeonato #${id}`}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${campeonato?.ativo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {campeonato?.ativo ? "Ativo" : "Encerrado"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {temGrupos
                    ? "Fase de Grupos"
                    : formatoLabel[campeonato?.tipo_formato ?? ""] ?? campeonato?.tipo_formato?.replace(/_/g, " ") ?? "—"}
                </span>
              </div>
            </div>

            {temChaveamento && (
              <button
                onClick={() => navigate(`/campeonatos/${id}/chaveamento`)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                <GitBranch className="w-4 h-4" /> Ver Chaveamento
              </button>
            )}

            {isAdmin && campeonato?.tipo_formato === "GRUPOS_E_MATA_MATA" && (
              <button
                onClick={() => navigate(`/admin/campeonatos/${id}/grupos`)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                <Settings2 className="w-4 h-4" /> Gerenciar Grupos
              </button>
            )}
          </div>
        )}

        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-4 w-fit">
          <button
            onClick={() => setAba("tabela")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${aba === "tabela" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <TrendingUp className="w-4 h-4" /> Classificação
          </button>
          <button
            onClick={() => setAba("jogos")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${aba === "jogos" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Swords className="w-4 h-4" /> Jogos ({jogos.length})
          </button>
        </div>

        {aba === "tabela" && temGrupos && !loading && (
          <div className="flex gap-1 mb-6 w-fit border rounded-lg p-1 bg-card/60">
            <button
              onClick={() => setVisaoTabela("grupos")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${visaoTabela === "grupos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Por Grupo
            </button>
            <button
              onClick={() => setVisaoTabela("geral")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${visaoTabela === "geral" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ListOrdered className="w-3.5 h-3.5" /> Geral
            </button>
          </div>
        )}

        {aba === "tabela" && (
          <>
            {loading ? (
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-8 space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
              </div>
            ) : temGrupos && visaoTabela === "grupos" ? (
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(grupos).map(([nomeGrupo, times]) => (
                  <div key={nomeGrupo} className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b bg-muted/30">
                      <h3 className="font-bold text-sm">Grupo {nomeGrupo}</h3>
                    </div>
                    {times.length === 0 ? (
                      <div className="py-12 text-center">
                        <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhum jogo finalizado ainda neste grupo.</p>
                      </div>
                    ) : (
                      renderTabelaCompacta(times)
                    )}
                  </div>
                ))}
              </div>
            ) : tabelaGeral.length === 0 ? (
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm py-20 text-center">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum jogo finalizado ainda.</p>
                <p className="text-sm text-muted-foreground mt-1">A tabela será gerada conforme os jogos forem encerrados.</p>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
                {renderTabelaGenerica(tabelaGeral)}
              </div>
            )}
          </>
        )}

        {aba === "jogos" && (
          <div className="space-y-6">
            {jogosProximos.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Próximos Jogos
                </h2>
                <div className="space-y-2">
                  {jogosProximos.map(j => {
                    const fase = nomeFaseDoJogo(j);
                    return (
                      <div key={j.jogo_id} className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                          <p className="font-semibold">{j.mandante}</p>
                          <p className="text-xs text-muted-foreground">Casa</p>
                        </div>
                        <div className="text-center px-4">
                          {fase && (
                            <span className="inline-block mb-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              {fase}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground mb-1">{j.data_hora}</p>
                          <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">PRÓXIMO</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold">{j.visitante}</p>
                          <p className="text-xs text-muted-foreground">Visitante</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {jogosFinaliz.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Jogos Finalizados
                </h2>
                <div className="space-y-2">
                  {jogosFinaliz.map(j => {
                    const fase = nomeFaseDoJogo(j);
                    return (
                      <div key={j.jogo_id} className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                          <p className="font-semibold">{j.mandante}</p>
                          <p className="text-xs text-muted-foreground">Casa</p>
                        </div>
                        <div className="text-center px-4 min-w-[80px]">
                          {fase && (
                            <span className="inline-block mb-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              {fase}
                            </span>
                          )}
                          <p className="text-2xl font-bold tabular-nums">{j.gols_mandante} <span className="text-muted-foreground">x</span> {j.gols_visitante}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{j.data_hora}</p>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold">{j.visitante}</p>
                          <p className="text-xs text-muted-foreground">Visitante</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {jogos.length === 0 && !loading && (
              <div className="py-20 text-center">
                <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum jogo cadastrado neste campeonato.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CampeonatoDetalhe;
