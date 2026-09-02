import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL, authFetch } from "@/lib/api";
import {
  RefreshCw, PlayCircle, Timer, Goal, Square, CheckCircle2, ChevronLeft, X, Loader2,
} from "lucide-react";

interface Jogo {
  jogo_id: number;
  mandante: string;
  mandante_id: number | null;
  visitante: string;
  visitante_id: number | null;
  campeonato: string;
  campeonato_id: number | null;
  data_hora: string;
  status: string;
}

interface JogadorElenco { jogador_id: number; nome: string; posicao?: string; foto_url?: string | null; }

interface EventoSumula { minuto: string; tempo: number | null; jogador: string; time: string; tipo: string; }

interface Sumula {
  partida: { id: number; status: string; placar_final: string };
  confronto: { mandante: string; visitante: string };
  eventos: EventoSumula[];
  cartoes: EventoSumula[];
}

interface MeuCampeonato { campeonato_id: number; nome: string; role: string; }

const extrairMensagemErro = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
};

// Mesmo componente de busca do Admin.tsx, duplicado aqui pra manter esta tela
// independente (sem criar dependência cruzada entre páginas).
interface OpcaoBusca { id: string; label: string; sub?: string }
const SeletorBusca = ({
  opcoes, valor, onSelecionar, placeholder = "Selecione...",
}: { opcoes: OpcaoBusca[]; valor: string; onSelecionar: (id: string) => void; placeholder?: string }) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const opcaoSelecionada = opcoes.find((o) => o.id === valor);

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setAberto(false); setBusca(""); }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const filtradas = busca.trim() ? opcoes.filter((o) => o.label.toLowerCase().includes(busca.toLowerCase())) : opcoes;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setAberto((v) => !v)}
        className="w-full px-4 py-3.5 rounded-xl border bg-background text-base text-left focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-between">
        <span className={opcaoSelecionada ? "" : "text-muted-foreground"}>{opcaoSelecionada ? opcaoSelecionada.label : placeholder}</span>
        <span className="text-muted-foreground text-xs">▾</span>
      </button>
      {aberto && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border bg-background shadow-lg overflow-hidden">
          <input autoFocus type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite pra buscar..."
            className="w-full px-4 py-3 text-base border-b focus:outline-none" />
          <div className="max-h-64 overflow-y-auto">
            {filtradas.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum resultado.</p>
            ) : (
              filtradas.map((o) => (
                <button key={o.id} type="button" onClick={() => { onSelecionar(o.id); setAberto(false); setBusca(""); }}
                  className={`w-full text-left px-4 py-3 text-base hover:bg-muted/60 transition-colors ${o.id === valor ? "bg-primary/10 font-medium" : ""}`}>
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DelegadoPainel = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isMaster = user?.role === "master";
  const isDelegadoGlobal = user?.role === "delegado";

  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [meusCampeonatos, setMeusCampeonatos] = useState<MeuCampeonato[]>([]);

  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [carregandoJogos, setCarregandoJogos] = useState(true);
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);

  const [sumula, setSumula] = useState<Sumula | null>(null);
  const [carregandoSumula, setCarregandoSumula] = useState(false);

  const [elencoPorTime, setElencoPorTime] = useState<Record<number, JogadorElenco[]>>({});
  const [carregandoElenco, setCarregandoElenco] = useState<number | null>(null);

  const [processando, setProcessando] = useState(false);

  // Modal de registrar gol/cartão
  const [modalTipo, setModalTipo] = useState<"gol" | "cartao" | null>(null);
  const [modalTimeId, setModalTimeId] = useState<number | null>(null);
  const [modalTimeNome, setModalTimeNome] = useState<string>("");
  const [modalJogadorId, setModalJogadorId] = useState("");
  const [modalMinuto, setModalMinuto] = useState("");
  const [modalCartaoTipo, setModalCartaoTipo] = useState<"amarelo" | "vermelho">("amarelo");

  // Verificação de acesso: master, delegado global, ou presidente escopado
  // (tem pelo menos 1 campeonato atribuído) podem entrar. Qualquer outro é
  // redirecionado — mesma lógica do Admin.tsx.
  useEffect(() => {
    const verificar = async () => {
      if (!user) { navigate("/"); return; }
      if (user.role === "master" || user.role === "delegado") { setVerificandoAcesso(false); return; }
      try {
        const res = await authFetch(`${API_BASE_URL}/api/meus-campeonatos-admin`);
        if (res.ok) {
          const data: MeuCampeonato[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMeusCampeonatos(data);
            setVerificandoAcesso(false);
            return;
          }
        }
      } catch { /* segue pro redirect */ }
      navigate("/");
    };
    verificar();
  }, []);

  const fetchJogos = async () => {
    setCarregandoJogos(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jogos`);
      if (res.ok) {
        const todos: Jogo[] = await res.json();
        const naoFinalizados = todos.filter((j) => j.status !== "Finalizado" && j.status !== "Bye");
        const permitidos = (isMaster || isDelegadoGlobal)
          ? naoFinalizados
          : naoFinalizados.filter((j) => j.campeonato_id !== null && meusCampeonatos.some((mc) => mc.campeonato_id === j.campeonato_id));
        permitidos.sort((a, b) => a.jogo_id - b.jogo_id);
        setJogos(permitidos);
      }
    } finally { setCarregandoJogos(false); }
  };

  useEffect(() => {
    if (verificandoAcesso) return;
    fetchJogos();
  }, [verificandoAcesso]);

  const fetchSumula = async (jogoId: number) => {
    setCarregandoSumula(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoId}/sumula`);
      if (res.ok) setSumula(await res.json());
    } finally { setCarregandoSumula(false); }
  };

  const abrirJogo = (j: Jogo) => {
    setJogoSelecionado(j);
    setSumula(null);
    fetchSumula(j.jogo_id);
  };

  const voltarParaLista = () => {
    setJogoSelecionado(null);
    setSumula(null);
    fetchJogos();
  };

  const fetchElenco = async (timeId: number) => {
    if (elencoPorTime[timeId]) return;
    setCarregandoElenco(timeId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/times/${timeId}/jogadores`);
      if (res.ok) {
        const data = await res.json();
        setElencoPorTime((prev) => ({ ...prev, [timeId]: data }));
      }
    } finally { setCarregandoElenco(null); }
  };

  const atualizarStatusLocal = (novoStatus: string) => {
    if (!jogoSelecionado) return;
    setJogoSelecionado({ ...jogoSelecionado, status: novoStatus });
    setJogos((prev) => prev.map((j) => j.jogo_id === jogoSelecionado.jogo_id ? { ...j, status: novoStatus } : j));
  };

  const iniciarPartida = async () => {
    if (!jogoSelecionado) return;
    setProcessando(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoSelecionado.jogo_id}/iniciar`, { method: "POST" });
      if (res.ok) { atualizarStatusLocal("1º Tempo"); }
      else { alert(await extrairMensagemErro(res, "Erro ao iniciar a partida.")); }
    } catch { alert("Erro de conexão."); } finally { setProcessando(false); }
  };

  const marcarIntervalo = async () => {
    if (!jogoSelecionado) return;
    setProcessando(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoSelecionado.jogo_id}/intervalo`, { method: "POST" });
      if (res.ok) { atualizarStatusLocal("Intervalo"); }
      else { alert(await extrairMensagemErro(res, "Erro ao marcar intervalo.")); }
    } catch { alert("Erro de conexão."); } finally { setProcessando(false); }
  };

  const iniciarSegundoTempo = async () => {
    if (!jogoSelecionado) return;
    setProcessando(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoSelecionado.jogo_id}/segundo-tempo`, { method: "POST" });
      if (res.ok) { atualizarStatusLocal("2º Tempo"); }
      else { alert(await extrairMensagemErro(res, "Erro ao iniciar o 2º tempo.")); }
    } catch { alert("Erro de conexão."); } finally { setProcessando(false); }
  };

  const tempoAtual = (): number | null => {
    if (jogoSelecionado?.status === "1º Tempo") return 1;
    if (jogoSelecionado?.status === "2º Tempo") return 2;
    return null;
  };

  const abrirModal = (tipo: "gol" | "cartao", timeId: number, timeNome: string) => {
    setModalTipo(tipo);
    setModalTimeId(timeId);
    setModalTimeNome(timeNome);
    setModalJogadorId("");
    setModalMinuto("");
    setModalCartaoTipo("amarelo");
    fetchElenco(timeId);
  };

  const fecharModal = () => { setModalTipo(null); setModalTimeId(null); };

  const confirmarModal = async () => {
    if (!jogoSelecionado || !modalTimeId || !modalJogadorId) return;
    setProcessando(true);
    try {
      const body: any = { jogador_id: parseInt(modalJogadorId), time_id: modalTimeId, minuto: modalMinuto || null, tempo: tempoAtual() };
      const rota = modalTipo === "gol" ? "gols" : "cartoes";
      if (modalTipo === "cartao") body.tipo = modalCartaoTipo;
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoSelecionado.jogo_id}/${rota}`, { method: "POST", body: JSON.stringify(body) });
      if (res.ok) {
        fecharModal();
        fetchSumula(jogoSelecionado.jogo_id);
      } else {
        alert(await extrairMensagemErro(res, `Erro ao registrar ${modalTipo === "gol" ? "gol" : "cartão"}.`));
      }
    } catch { alert("Erro de conexão."); } finally { setProcessando(false); }
  };

  const placarAoVivo = () => {
    if (!sumula) return { m: 0, v: 0 };
    const m = sumula.eventos.filter((e) => e.time === sumula.confronto.mandante).length;
    const v = sumula.eventos.filter((e) => e.time === sumula.confronto.visitante).length;
    return { m, v };
  };

  const finalizarPartida = async () => {
    if (!jogoSelecionado) return;
    const { m, v } = placarAoVivo();
    if (!confirm(`Finalizar a partida com o placar ${m} x ${v}?`)) return;
    setProcessando(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoSelecionado.jogo_id}/finalizar`, {
        method: "POST", body: JSON.stringify({ gols_mandante: m, gols_visitante: v }),
      });
      if (res.ok) {
        alert("✅ Partida finalizada!");
        voltarParaLista();
      } else {
        alert(await extrairMensagemErro(res, "Erro ao finalizar a partida."));
      }
    } catch { alert("Erro de conexão."); } finally { setProcessando(false); }
  };

  if (verificandoAcesso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-md">

        {!jogoSelecionado ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-1">Painel do Delegado</h1>
              <p className="text-sm text-muted-foreground">Toque num jogo pra iniciar, marcar gols e cartões</p>
            </div>

            <div className="flex justify-end mb-3">
              <button onClick={fetchJogos} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                <RefreshCw className="w-4 h-4" /> Atualizar
              </button>
            </div>

            {carregandoJogos ? (
              <div className="p-10 text-center text-muted-foreground">Carregando...</div>
            ) : jogos.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Nenhum jogo pendente. 🎉</div>
            ) : (
              <div className="space-y-3">
                {jogos.map((j) => (
                  <button key={j.jogo_id} onClick={() => abrirJogo(j)}
                    className="w-full text-left rounded-xl border bg-card/80 p-4 shadow-sm hover:bg-muted/30 transition-colors active:scale-[0.99]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{j.campeonato}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        j.status === "Agendado" ? "bg-muted text-muted-foreground" :
                        j.status === "1º Tempo" || j.status === "2º Tempo" ? "bg-green-100 text-green-700" :
                        j.status === "Intervalo" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{j.status}</span>
                    </div>
                    <p className="font-semibold text-base">{j.mandante} <span className="text-muted-foreground font-normal">vs</span> {j.visitante}</p>
                    <p className="text-xs text-muted-foreground mt-1">{j.data_hora}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={voltarParaLista} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-4 h-4" /> Voltar pros jogos
            </button>

            <div className="rounded-xl border bg-card/80 p-5 shadow-sm mb-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">{jogoSelecionado.campeonato}</p>
              {carregandoSumula || !sumula ? (
                <div className="py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="font-bold text-lg flex-1 text-right">{sumula.confronto.mandante}</span>
                    <span className="text-2xl font-bold text-primary tabular-nums">{placarAoVivo().m} × {placarAoVivo().v}</span>
                    <span className="font-bold text-lg flex-1 text-left">{sumula.confronto.visitante}</span>
                  </div>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                    jogoSelecionado.status === "Agendado" ? "bg-muted text-muted-foreground" :
                    jogoSelecionado.status === "1º Tempo" || jogoSelecionado.status === "2º Tempo" ? "bg-green-100 text-green-700" :
                    jogoSelecionado.status === "Intervalo" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{jogoSelecionado.status}</span>
                </>
              )}
            </div>

            {jogoSelecionado.status === "Agendado" && (
              <button onClick={iniciarPartida} disabled={processando}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-50">
                {processando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />} Iniciar Partida
              </button>
            )}

            {(jogoSelecionado.status === "1º Tempo" || jogoSelecionado.status === "2º Tempo") && jogoSelecionado.mandante_id && jogoSelecionado.visitante_id && (
              <div className="space-y-3">
                {[
                  { id: jogoSelecionado.mandante_id, nome: jogoSelecionado.mandante },
                  { id: jogoSelecionado.visitante_id, nome: jogoSelecionado.visitante },
                ].map((time) => (
                  <div key={time.id} className="rounded-xl border bg-card/80 p-4">
                    <p className="font-semibold text-sm mb-3">{time.nome}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => abrirModal("gol", time.id, time.nome)}
                        className="flex items-center justify-center gap-1.5 bg-primary/10 text-primary py-3 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                        <Goal className="w-4 h-4" /> Gol
                      </button>
                      <button onClick={() => abrirModal("cartao", time.id, time.nome)}
                        className="flex items-center justify-center gap-1.5 bg-yellow-50 text-yellow-700 py-3 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors">
                        <Square className="w-4 h-4" /> Cartão
                      </button>
                    </div>
                  </div>
                ))}

                {jogoSelecionado.status === "1º Tempo" && (
                  <button onClick={marcarIntervalo} disabled={processando}
                    className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary py-3.5 rounded-xl text-base font-semibold hover:bg-primary/5 disabled:opacity-50">
                    {processando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Timer className="w-5 h-5" />} Marcar Intervalo
                  </button>
                )}
                {jogoSelecionado.status === "2º Tempo" && (
                  <button onClick={finalizarPartida} disabled={processando}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-50">
                    {processando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Finalizar Partida
                  </button>
                )}
              </div>
            )}

            {jogoSelecionado.status === "Intervalo" && (
              <button onClick={iniciarSegundoTempo} disabled={processando}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-50">
                {processando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />} Iniciar 2º Tempo
              </button>
            )}

            {sumula && (sumula.eventos.length > 0 || sumula.cartoes.length > 0) && (
              <div className="mt-6 rounded-xl border bg-card/80 p-4">
                <p className="text-sm font-semibold mb-3">Eventos da partida</p>
                <div className="space-y-2">
                  {[...sumula.eventos.map((e) => ({ ...e, cat: "gol" as const })), ...sumula.cartoes.map((e) => ({ ...e, cat: "cartao" as const }))]
                    .sort((a, b) => (parseInt(a.minuto) || 0) - (parseInt(b.minuto) || 0))
                    .map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {e.cat === "gol" ? <Goal className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <Square className={`w-3.5 h-3.5 flex-shrink-0 ${e.tipo === "vermelho" ? "text-red-600" : "text-yellow-600"}`} />}
                        <span className="text-muted-foreground">{e.minuto}'</span>
                        <span className="font-medium">{e.jogador}</span>
                        <span className="text-muted-foreground text-xs">({e.time})</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal registrar gol/cartão */}
      {modalTipo && modalTimeId && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center" onClick={fecharModal}>
          <div className="bg-background w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{modalTipo === "gol" ? "Registrar Gol" : "Registrar Cartão"} — {modalTimeNome}</h3>
              <button onClick={fecharModal}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Jogador *</label>
              {carregandoElenco === modalTimeId ? (
                <p className="text-sm text-muted-foreground py-3">Carregando elenco...</p>
              ) : (elencoPorTime[modalTimeId]?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-3">Esse time não tem jogadores cadastrados ainda.</p>
              ) : (
                <SeletorBusca
                  opcoes={(elencoPorTime[modalTimeId] ?? []).map((j) => ({ id: String(j.jogador_id), label: j.nome }))}
                  valor={modalJogadorId}
                  onSelecionar={setModalJogadorId}
                  placeholder="Buscar jogador..."
                />
              )}
            </div>

            {modalTipo === "cartao" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo de cartão *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setModalCartaoTipo("amarelo")}
                    className={`py-3 rounded-lg text-sm font-medium border-2 transition-colors ${modalCartaoTipo === "amarelo" ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-transparent bg-muted text-muted-foreground"}`}>
                    🟨 Amarelo
                  </button>
                  <button onClick={() => setModalCartaoTipo("vermelho")}
                    className={`py-3 rounded-lg text-sm font-medium border-2 transition-colors ${modalCartaoTipo === "vermelho" ? "border-red-500 bg-red-50 text-red-700" : "border-transparent bg-muted text-muted-foreground"}`}>
                    🟥 Vermelho
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Minuto</label>
              <input type="number" min="0" max="130" value={modalMinuto} onChange={(e) => setModalMinuto(e.target.value)} placeholder="Ex: 23"
                className="w-full px-4 py-3 rounded-xl border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <button onClick={confirmarModal} disabled={!modalJogadorId || processando}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-50">
              {processando ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DelegadoPainel;
