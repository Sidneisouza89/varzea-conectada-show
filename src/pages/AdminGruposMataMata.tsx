import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft, Users, Layers, Shuffle, Trophy, Loader2,
  CheckCircle2, AlertTriangle, Plus, TrendingUp, Zap
} from "lucide-react";

interface TimeInscrito {
  id: number;
  nome_oficial: string;
  apelido: string;
}

interface Campeonato {
  campeonato_id: number;
  nome: string;
  tipo_formato: string;
  ativo: boolean;
  total_times_inscritos: number;
  total_jogos: number;
}

interface TimeClassificacao {
  time_id: number;
  nome: string;
  pts: number;
  pj: number;
  v: number;
  e: number;
  d: number;
  sg: number;
}

type Mensagem = { tipo: "sucesso" | "erro"; texto: string } | null;

const getToken = () => localStorage.getItem("varzeando_token");

// Converte valor de <input type="datetime-local"> pro formato que o back-end espera
const toBackendDateTime = (valor: string) => (valor ? `${valor.replace("T", " ")}:00` : "");

const AdminGruposMataMata = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campeonato, setCampeonato] = useState<Campeonato | null>(null);
  const [times, setTimes] = useState<TimeInscrito[]>([]);
  const [gruposAtuais, setGruposAtuais] = useState<Record<string, TimeInscrito[]>>({});
  const [loading, setLoading] = useState(true);

  // --- Montagem de grupos ---
  const [atribuicoes, setAtribuicoes] = useState<Record<number, string>>({});
  const [gruposDisponiveis, setGruposDisponiveis] = useState<string[]>(["A", "B"]);
  const [salvandoGrupos, setSalvandoGrupos] = useState(false);
  const [msgGrupos, setMsgGrupos] = useState<Mensagem>(null);

  // --- Gerar fase de grupos ---
  const [idaEVoltaFG, setIdaEVoltaFG] = useState(false);
  const [dataInicioFG, setDataInicioFG] = useState("");
  const [intervaloDiasFG, setIntervaloDiasFG] = useState(7);
  const [loadingFG, setLoadingFG] = useState(false);
  const [msgFG, setMsgFG] = useState<Mensagem>(null);
  const [resultadoFG, setResultadoFG] = useState<Record<string, string> | null>(null);

  // --- Classificação por grupo (consulta) ---
  const [mostrarClassificacao, setMostrarClassificacao] = useState(false);
  const [classificacaoGrupos, setClassificacaoGrupos] = useState<Record<string, TimeClassificacao[]>>({});
  const [loadingClassificacao, setLoadingClassificacao] = useState(false);

  // --- Gerar mata-mata pós-grupos ---
  const [classificadosPorGrupo, setClassificadosPorGrupo] = useState<1 | 2>(2);
  const [modoMM, setModoMM] = useState<"sorteio" | "cruzamento">("cruzamento");
  const [idaEVoltaMM, setIdaEVoltaMM] = useState(false);
  const [dataInicioMM, setDataInicioMM] = useState("");
  const [intervaloVoltaMM, setIntervaloVoltaMM] = useState(7);
  const [loadingMM, setLoadingMM] = useState(false);
  const [msgMM, setMsgMM] = useState<Mensagem>(null);
  const [resultadoMM, setResultadoMM] = useState<{
    classificados: Record<string, number[]>;
    fase: number;
    total_confrontos: number;
    teve_bye: boolean;
  } | null>(null);

  const nomeDoTime = (timeId: number) => times.find((t) => t.id === timeId)?.nome_oficial ?? `Time #${timeId}`;

  const fetchTudo = async () => {
    setLoading(true);
    try {
      const [resCamp, resTimes, resGrupos] = await Promise.all([
        fetch(`${API_BASE_URL}/api/campeonatos/${id}`),
        fetch(`${API_BASE_URL}/api/campeonatos/${id}/times`),
        fetch(`${API_BASE_URL}/api/campeonatos/${id}/grupos`),
      ]);

      if (resCamp.ok) setCampeonato(await resCamp.json());
      if (resTimes.ok) setTimes(await resTimes.json());

      if (resGrupos.ok) {
        const grupos: Record<string, TimeInscrito[]> = await resGrupos.json();
        setGruposAtuais(grupos);

        // Inicializa as atribuições e as letras disponíveis a partir do que já existe
        const atribInicial: Record<number, string> = {};
        const letras: string[] = [];
        Object.entries(grupos).forEach(([letra, lista]) => {
          if (letra !== "Sem grupo") letras.push(letra);
          lista.forEach((t) => {
            atribInicial[t.id] = letra === "Sem grupo" ? "" : letra;
          });
        });
        setAtribuicoes(atribInicial);
        if (letras.length > 0) setGruposDisponiveis(letras.sort());
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAdicionarGrupo = () => {
    const proximaLetra = String.fromCharCode(65 + gruposDisponiveis.length); // A, B, C...
    setGruposDisponiveis([...gruposDisponiveis, proximaLetra]);
  };

  const handleMudarGrupo = (timeId: number, letra: string) => {
    setAtribuicoes({ ...atribuicoes, [timeId]: letra });
  };

  const handleSalvarGrupos = async () => {
    setSalvandoGrupos(true);
    setMsgGrupos(null);
    try {
      const payload: Record<string, number[]> = {};
      Object.entries(atribuicoes).forEach(([timeIdStr, letra]) => {
        if (!letra) return; // "Sem grupo" não entra no payload
        const timeId = Number(timeIdStr);
        payload[letra] = payload[letra] ? [...payload[letra], timeId] : [timeId];
      });

      if (Object.keys(payload).length === 0) {
        setMsgGrupos({ tipo: "erro", texto: "Atribua pelo menos um time a um grupo antes de salvar." });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/grupos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ grupos: payload }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsgGrupos({ tipo: "sucesso", texto: data.message });
        fetchTudo();
      } else {
        setMsgGrupos({ tipo: "erro", texto: data.message || "Erro ao salvar grupos." });
      }
    } catch (err) {
      setMsgGrupos({ tipo: "erro", texto: "Erro de conexão ao salvar grupos." });
    } finally {
      setSalvandoGrupos(false);
    }
  };

  const handleGerarFaseDeGrupos = async () => {
    if (!dataInicioFG) {
      setMsgFG({ tipo: "erro", texto: "Informe a data de início da fase de grupos." });
      return;
    }
    setLoadingFG(true);
    setMsgFG(null);
    setResultadoFG(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/gerar-fase-grupos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ida_e_volta: idaEVoltaFG,
          data_inicio: toBackendDateTime(dataInicioFG),
          intervalo_dias: intervaloDiasFG,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsgFG({ tipo: "sucesso", texto: data.message });
        setResultadoFG(data.grupos);
      } else {
        setMsgFG({ tipo: "erro", texto: data.message || "Erro ao gerar fase de grupos." });
      }
    } catch (err) {
      setMsgFG({ tipo: "erro", texto: "Erro de conexão ao gerar fase de grupos." });
    } finally {
      setLoadingFG(false);
    }
  };

  const handleVerClassificacao = async () => {
    setMostrarClassificacao(!mostrarClassificacao);
    if (mostrarClassificacao || Object.keys(classificacaoGrupos).length > 0) return;
    setLoadingClassificacao(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/classificacao-grupos`);
      if (res.ok) {
        const data = await res.json();
        setClassificacaoGrupos(data.grupos);
      }
    } catch (err) {
      console.error("Erro ao buscar classificação:", err);
    } finally {
      setLoadingClassificacao(false);
    }
  };

  const handleGerarMataMata = async () => {
    if (!dataInicioMM) {
      setMsgMM({ tipo: "erro", texto: "Informe a data de início do mata-mata." });
      return;
    }
    setLoadingMM(true);
    setMsgMM(null);
    setResultadoMM(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/gerar-mata-mata-pos-grupos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          classificados_por_grupo: classificadosPorGrupo,
          modo: modoMM,
          ida_e_volta: idaEVoltaMM,
          data_inicio: toBackendDateTime(dataInicioMM),
          intervalo_dias_volta: intervaloVoltaMM,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsgMM({ tipo: "sucesso", texto: data.message });
        setResultadoMM(data);
      } else {
        setMsgMM({ tipo: "erro", texto: data.message || data.jogos_pendentes ? `${data.message} (jogos pendentes: ${data.jogos_pendentes?.join(", ")})` : "Erro ao gerar mata-mata." });
      }
    } catch (err) {
      setMsgMM({ tipo: "erro", texto: "Erro de conexão ao gerar mata-mata." });
    } finally {
      setLoadingMM(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}
    >
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <button
          onClick={() => navigate(`/campeonatos/${id}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para o campeonato
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {loading ? "Carregando..." : campeonato?.nome ?? `Campeonato #${id}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Admin · Grupos + Mata-Mata · {campeonato?.total_times_inscritos ?? 0} times inscritos
            </p>
          </div>
        </div>

        {/* ETAPA 1: MONTAR GRUPOS */}
        <section className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2 font-bold text-lg">
              <Users className="w-5 h-5 text-primary" /> 1. Montar Grupos
            </h2>
            <button
              onClick={handleAdicionarGrupo}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo grupo ({gruposDisponiveis[gruposDisponiveis.length - 1]} → próximo: {String.fromCharCode(65 + gruposDisponiveis.length)})
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : times.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nenhum time inscrito ainda. Inscreva times no campeonato antes de montar os grupos.
            </p>
          ) : (
            <div className="space-y-2">
              {times.map((time) => (
                <div key={time.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-2.5">
                  <span className="font-medium text-sm">{time.nome_oficial}</span>
                  <select
                    value={atribuicoes[time.id] ?? ""}
                    onChange={(e) => handleMudarGrupo(time.id, e.target.value)}
                    className="text-sm rounded-md border bg-background px-3 py-1.5"
                  >
                    <option value="">Sem grupo</option>
                    {gruposDisponiveis.map((letra) => (
                      <option key={letra} value={letra}>Grupo {letra}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {msgGrupos && (
            <div className={`mt-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
              msgGrupos.tipo === "sucesso" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {msgGrupos.tipo === "sucesso" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {msgGrupos.texto}
            </div>
          )}

          <button
            onClick={handleSalvarGrupos}
            disabled={salvandoGrupos || times.length === 0}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {salvandoGrupos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Salvar Grupos
          </button>

          {Object.keys(gruposAtuais).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Grupos atuais</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(gruposAtuais).map(([letra, lista]) => (
                  <div key={letra} className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-bold text-primary mb-1.5">
                      {letra === "Sem grupo" ? "Sem grupo" : `Grupo ${letra}`}
                    </p>
                    <ul className="text-sm space-y-0.5">
                      {lista.map((t) => <li key={t.id} className="text-muted-foreground">{t.nome_oficial}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ETAPA 2: GERAR FASE DE GRUPOS */}
        <section className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 mb-6">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-5">
            <Shuffle className="w-5 h-5 text-primary" /> 2. Gerar Jogos da Fase de Grupos
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data/hora de início</label>
              <input
                type="datetime-local"
                value={dataInicioFG}
                onChange={(e) => setDataInicioFG(e.target.value)}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Intervalo entre rodadas (dias)</label>
              <input
                type="number"
                min={1}
                value={intervaloDiasFG}
                onChange={(e) => setIntervaloDiasFG(Number(e.target.value))}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm mb-5 cursor-pointer">
            <input type="checkbox" checked={idaEVoltaFG} onChange={(e) => setIdaEVoltaFG(e.target.checked)} className="rounded" />
            Cada grupo joga em turno e returno (ida e volta)
          </label>

          {msgFG && (
            <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
              msgFG.tipo === "sucesso" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {msgFG.tipo === "sucesso" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {msgFG.texto}
            </div>
          )}

          {resultadoFG && (
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {Object.entries(resultadoFG).map(([grupo, resumo]) => (
                <div key={grupo} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-semibold">Grupo {grupo}:</span> <span className="text-muted-foreground">{resumo}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleGerarFaseDeGrupos}
            disabled={loadingFG}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loadingFG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
            Gerar Fase de Grupos
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚠️ Só pode ser gerada uma vez por campeonato. Confirme os grupos antes de clicar.
          </p>
        </section>

        {/* CLASSIFICAÇÃO POR GRUPO (consulta) */}
        <section className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 mb-6">
          <button onClick={handleVerClassificacao} className="flex items-center justify-between w-full">
            <h2 className="flex items-center gap-2 font-bold text-lg">
              <TrendingUp className="w-5 h-5 text-primary" /> Classificação por Grupo
            </h2>
            <span className="text-xs text-muted-foreground">{mostrarClassificacao ? "Ocultar ▲" : "Ver ▼"}</span>
          </button>

          {mostrarClassificacao && (
            <div className="mt-5">
              {loadingClassificacao ? (
                <div className="h-24 bg-muted rounded animate-pulse" />
              ) : Object.keys(classificacaoGrupos).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum jogo finalizado nos grupos ainda.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(classificacaoGrupos).map(([letra, tabela]) => (
                    <div key={letra} className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs font-bold text-primary mb-2">Grupo {letra}</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left font-medium pb-1">Time</th>
                            <th className="pb-1">PTS</th>
                            <th className="pb-1">V</th>
                            <th className="pb-1">SG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tabela.map((t, idx) => (
                            <tr key={t.time_id} className={idx < classificadosPorGrupo ? "font-semibold" : "text-muted-foreground"}>
                              <td className="py-0.5">{t.nome}</td>
                              <td className="text-center py-0.5">{t.pts}</td>
                              <td className="text-center py-0.5">{t.v}</td>
                              <td className="text-center py-0.5">{t.sg > 0 ? `+${t.sg}` : t.sg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ETAPA 3: GERAR MATA-MATA PÓS-GRUPOS */}
        <section className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-5">
            <Trophy className="w-5 h-5 text-primary" /> 3. Gerar Mata-Mata (pós-grupos)
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Classificados por grupo</label>
              <select
                value={classificadosPorGrupo}
                onChange={(e) => setClassificadosPorGrupo(Number(e.target.value) as 1 | 2)}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
              >
                <option value={1}>1 (só o líder)</option>
                <option value={2}>2 (líder + vice)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Modo de confronto</label>
              <select
                value={modoMM}
                onChange={(e) => setModoMM(e.target.value as "sorteio" | "cruzamento")}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
              >
                <option value="cruzamento">Cruzamento (evita mesmo grupo)</option>
                <option value="sorteio">Sorteio (totalmente aleatório)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data/hora de início</label>
              <input
                type="datetime-local"
                value={dataInicioMM}
                onChange={(e) => setDataInicioMM(e.target.value)}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Intervalo até o jogo de volta (dias)</label>
              <input
                type="number"
                min={1}
                value={intervaloVoltaMM}
                onChange={(e) => setIntervaloVoltaMM(Number(e.target.value))}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
                disabled={!idaEVoltaMM}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm mb-5 cursor-pointer">
            <input type="checkbox" checked={idaEVoltaMM} onChange={(e) => setIdaEVoltaMM(e.target.checked)} className="rounded" />
            Confrontos de ida e volta
          </label>

          {msgMM && (
            <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
              msgMM.tipo === "sucesso" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {msgMM.tipo === "sucesso" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {msgMM.texto}
            </div>
          )}

          {resultadoMM && (
            <div className="mb-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Fase {resultadoMM.fase} · {resultadoMM.total_confrontos} confronto(s){resultadoMM.teve_bye ? " · com bye" : ""}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(resultadoMM.classificados).map(([letra, ids]) => (
                  <div key={letra} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-semibold">Grupo {letra}:</span>{" "}
                    <span className="text-muted-foreground">{ids.map((tid) => nomeDoTime(tid)).join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGerarMataMata}
            disabled={loadingMM}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loadingMM ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Gerar Mata-Mata
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚠️ Todos os jogos da fase de grupos precisam estar finalizados. Só pode ser gerado uma vez.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminGruposMataMata;
