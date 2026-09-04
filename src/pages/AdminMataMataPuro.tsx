import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft, Trophy, Zap, Loader2, CheckCircle2, AlertTriangle, ArrowRightCircle
} from "lucide-react";

interface Campeonato {
  campeonato_id: number;
  nome: string;
  tipo_formato: string;
  ativo: boolean;
  total_times_inscritos: number;
  total_jogos: number;
}

type Mensagem = { tipo: "sucesso" | "erro"; texto: string } | null;

const getToken = () => localStorage.getItem("varzeando_token");

// Converte valor de <input type="datetime-local"> pro formato que o back-end espera
const toBackendDateTime = (valor: string) => (valor ? `${valor.replace("T", " ")}:00` : "");

// Monta a mensagem de erro de forma segura — não anexa "(jogos pendentes: undefined)"
// quando o campo não vem no payload (bug conhecido que existia na tela pós-grupos).
const montarMensagemErro = (data: any, fallback: string): string => {
  const base = data?.message || fallback;
  if (Array.isArray(data?.jogos_pendentes) && data.jogos_pendentes.length > 0) {
    return `${base} (jogos pendentes: ${data.jogos_pendentes.join(", ")})`;
  }
  if (Array.isArray(data?.confrontos_empatados) && data.confrontos_empatados.length > 0) {
    return `${base} (confrontos empatados sem pênaltis: ${data.confrontos_empatados.join(", ")})`;
  }
  return base;
};

const AdminMataMataPuro = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campeonato, setCampeonato] = useState<Campeonato | null>(null);
  const [loading, setLoading] = useState(true);

  // Etapa 1: gerar primeira fase (só relevante se o campeonato ainda não
  // tiver nenhum jogo — em campeonatos já em andamento, essa etapa fica
  // desabilitada e a pessoa vai direto pra "Avançar Fase")
  const [idaEVolta1, setIdaEVolta1] = useState(false);
  const [dataInicio1, setDataInicio1] = useState("");
  const [intervaloVolta1, setIntervaloVolta1] = useState(7);
  const [loading1, setLoading1] = useState(false);
  const [msg1, setMsg1] = useState<Mensagem>(null);

  // Etapa 2: avançar fase (apura vencedores da fase atual e sorteia a próxima)
  const [idaEVolta2, setIdaEVolta2] = useState(false);
  const [dataInicio2, setDataInicio2] = useState("");
  const [intervaloVolta2, setIntervaloVolta2] = useState(7);
  const [loading2, setLoading2] = useState(false);
  const [msg2, setMsg2] = useState<Mensagem>(null);
  const [resultado2, setResultado2] = useState<{
    encerrado: boolean;
    campeao_time_id?: number;
    fase?: number;
    total_confrontos?: number;
    teve_bye?: boolean;
  } | null>(null);

  const fetchCampeonato = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}`);
      if (res.ok) setCampeonato(await res.json());
    } catch (err) {
      console.error("Erro ao carregar campeonato:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampeonato();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const jaTemJogos = (campeonato?.total_jogos ?? 0) > 0;

  const handleGerarPrimeiraFase = async () => {
    if (!dataInicio1) {
      setMsg1({ tipo: "erro", texto: "Informe a data de início da primeira fase." });
      return;
    }
    setLoading1(true);
    setMsg1(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/mata-mata/gerar-primeira-fase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ida_e_volta: idaEVolta1,
          data_inicio: toBackendDateTime(dataInicio1),
          intervalo_dias_volta: intervaloVolta1,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg1({ tipo: "sucesso", texto: data.message });
        fetchCampeonato();
      } else {
        setMsg1({ tipo: "erro", texto: montarMensagemErro(data, "Erro ao gerar primeira fase.") });
      }
    } catch (err) {
      setMsg1({ tipo: "erro", texto: "Erro de conexão ao gerar primeira fase." });
    } finally {
      setLoading1(false);
    }
  };

  const handleAvancarFase = async () => {
    if (!dataInicio2) {
      setMsg2({ tipo: "erro", texto: "Informe a data de início da próxima fase." });
      return;
    }
    setLoading2(true);
    setMsg2(null);
    setResultado2(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos/${id}/mata-mata/proxima-fase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ida_e_volta: idaEVolta2,
          data_inicio: toBackendDateTime(dataInicio2),
          intervalo_dias_volta: intervaloVolta2,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg2({ tipo: "sucesso", texto: data.message });
        setResultado2({
          encerrado: !!data.encerrado,
          campeao_time_id: data.campeao_time_id,
          fase: data.fase,
          total_confrontos: data.total_confrontos,
          teve_bye: data.teve_bye,
        });
      } else {
        setMsg2({ tipo: "erro", texto: montarMensagemErro(data, "Erro ao avançar fase.") });
      }
    } catch (err) {
      setMsg2({ tipo: "erro", texto: "Erro de conexão ao avançar fase." });
    } finally {
      setLoading2(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}
    >
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <button
          onClick={() => navigate(`/campeonatos/${id}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para o campeonato
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {loading ? "Carregando..." : campeonato?.nome ?? `Campeonato #${id}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Admin · Mata-Mata · {campeonato?.total_times_inscritos ?? 0} times inscritos · {campeonato?.total_jogos ?? 0} jogos
            </p>
          </div>
        </div>

        {/* ETAPA 1: GERAR PRIMEIRA FASE */}
        <section className={`rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 mb-6 ${jaTemJogos ? "opacity-60" : ""}`}>
          <h2 className="flex items-center gap-2 font-bold text-lg mb-2">
            <Zap className="w-5 h-5 text-primary" /> 1. Gerar Primeira Fase
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Sorteia os confrontos iniciais a partir dos times inscritos. Só funciona se o campeonato
            ainda não tiver nenhum jogo cadastrado.
            {jaTemJogos && " Este campeonato já tem jogos — essa etapa não se aplica mais."}
          </p>

          <fieldset disabled={jaTemJogos} className="contents">
            <div className="grid gap-4 sm:grid-cols-2 mb-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data/hora de início</label>
                <input
                  type="datetime-local"
                  value={dataInicio1}
                  onChange={(e) => setDataInicio1(e.target.value)}
                  className="w-full text-sm rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Intervalo até o jogo de volta (dias)</label>
                <input
                  type="number"
                  min={1}
                  value={intervaloVolta1}
                  onChange={(e) => setIntervaloVolta1(Number(e.target.value))}
                  className="w-full text-sm rounded-md border bg-background px-3 py-2"
                  disabled={!idaEVolta1}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm mb-5 cursor-pointer">
              <input type="checkbox" checked={idaEVolta1} onChange={(e) => setIdaEVolta1(e.target.checked)} className="rounded" />
              Confrontos de ida e volta
            </label>

            {msg1 && (
              <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
                msg1.tipo === "sucesso" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {msg1.tipo === "sucesso" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {msg1.texto}
              </div>
            )}

            <button
              onClick={handleGerarPrimeiraFase}
              disabled={loading1 || jaTemJogos}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Gerar Primeira Fase
            </button>
          </fieldset>
        </section>

        {/* ETAPA 2: AVANÇAR FASE */}
        <section className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-6">
          <h2 className="flex items-center gap-2 font-bold text-lg mb-2">
            <ArrowRightCircle className="w-5 h-5 text-primary" /> 2. Avançar Fase
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Use isso depois que <strong>todos os jogos da fase atual</strong> estiverem finalizados.
            O sistema apura os vencedores de cada confronto e sorteia os confrontos da próxima fase
            automaticamente. Se restar só 1 vencedor, o campeão é declarado e nenhuma fase nova é criada.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data/hora de início da próxima fase</label>
              <input
                type="datetime-local"
                value={dataInicio2}
                onChange={(e) => setDataInicio2(e.target.value)}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Intervalo até o jogo de volta (dias)</label>
              <input
                type="number"
                min={1}
                value={intervaloVolta2}
                onChange={(e) => setIntervaloVolta2(Number(e.target.value))}
                className="w-full text-sm rounded-md border bg-background px-3 py-2"
                disabled={!idaEVolta2}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm mb-5 cursor-pointer">
            <input type="checkbox" checked={idaEVolta2} onChange={(e) => setIdaEVolta2(e.target.checked)} className="rounded" />
            Confrontos de ida e volta
          </label>

          {msg2 && (
            <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
              msg2.tipo === "sucesso" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {msg2.tipo === "sucesso" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {msg2.texto}
            </div>
          )}

          {resultado2?.encerrado && (
            <div className="mb-5 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 shrink-0" /> Campeonato encerrado! Confira a mensagem acima pro nome do campeão.
            </div>
          )}

          {resultado2 && !resultado2.encerrado && (
            <div className="mb-5 rounded-lg bg-muted/40 px-4 py-3 text-sm">
              Fase {resultado2.fase} gerada · {resultado2.total_confrontos} confronto(s)
              {resultado2.teve_bye ? " · com bye" : ""}
            </div>
          )}

          <button
            onClick={handleAvancarFase}
            disabled={loading2}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
            Avançar Fase (Apurar Vencedores)
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚠️ Se algum jogo da fase atual ainda não foi finalizado, ou empatou sem pênaltis registrados,
            o sistema avisa quais jogos faltam resolver.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminMataMataPuro;
