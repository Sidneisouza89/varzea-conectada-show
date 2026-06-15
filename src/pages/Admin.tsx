import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import {
  ShieldCheck, Users, Newspaper, RefreshCw, PlusCircle,
  Trash2, Edit3, Save, X, Swords, Calendar, CheckCircle2, Trophy
} from "lucide-react";

interface Usuario { id: number; username: string; role: string; is_active: boolean; }
interface Materia { materia_id: number; titulo: string; data_publicacao: string; }
interface Jogo { jogo_id: number; mandante: string; visitante: string; campeonato: string; data_hora: string; status: string; }
interface Time { id: number; nome_oficial: string; }
interface Campeonato { campeonato_id: number; nome: string; tipo_formato: string; ativo: boolean; }

const ROLES = ["torcedor", "capitao", "delegado", "olheiro", "presidente", "master"];

const FORMATOS = [
  { value: "PONTOS_CORRIDOS", label: "Pontos Corridos" },
  { value: "MATA_MATA", label: "Mata-Mata (eliminação simples)" },
  { value: "GRUPOS_E_MATA_MATA", label: "Grupos + Mata-Mata (tipo Copa do Mundo)" },
  { value: "IDA_E_VOLTA", label: "Ida e Volta (tipo Paulistão)" },
  { value: "PONTOS_CORRIDOS_PLAYOFFS", label: "Pontos Corridos + Playoffs (top 8 vai à chave)" },
];

const Admin = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("varzeando_token");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingJogos, setLoadingJogos] = useState(true);
  const [aba, setAba] = useState<"usuarios"|"materias"|"nova_materia"|"jogos"|"novo_jogo"|"campeonatos"|"novo_campeonato">("usuarios");
  const [salvando, setSalvando] = useState<number | null>(null);

  // Nova matéria
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [msgPublicacao, setMsgPublicacao] = useState("");

  // Novo jogo
  const [novoJogo, setNovoJogo] = useState({ campeonato_id: "", time_mandante_id: "", time_visitante_id: "", data_hora: "", estadio_id: "" });
  const [agendando, setAgendando] = useState(false);
  const [msgJogo, setMsgJogo] = useState("");

  // Novo campeonato
  const [novoCamp, setNovoCamp] = useState({
    nome: "",
    tipo_formato: "PONTOS_CORRIDOS",
    pontos_vitoria: "3",
    pontos_empate: "1",
    pontos_derrota: "0",
  });
  const [criandoCamp, setCriandoCamp] = useState(false);
  const [msgCamp, setMsgCamp] = useState("");

  // Placar rápido
  const [placar, setPlacar] = useState<Record<number, { m: string; v: string }>>({});
  const [finalizando, setFinalizando] = useState<number | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "master" && user.role !== "presidente")) navigate("/");
  }, []);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchUsuarios = async () => {
    setLoadingUsers(true);
    try { const res = await fetch(`${API_BASE_URL}/api/admin/usuarios`, { headers }); if (res.ok) setUsuarios(await res.json()); }
    finally { setLoadingUsers(false); }
  };
  const fetchMaterias = async () => {
    setLoadingMaterias(true);
    try { const res = await fetch(`${API_BASE_URL}/api/materias`); if (res.ok) setMaterias(await res.json()); }
    finally { setLoadingMaterias(false); }
  };
  const fetchJogos = async () => {
    setLoadingJogos(true);
    try { const res = await fetch(`${API_BASE_URL}/api/jogos`); if (res.ok) setJogos(await res.json()); }
    finally { setLoadingJogos(false); }
  };
  const fetchTimes = async () => { const res = await fetch(`${API_BASE_URL}/api/times`); if (res.ok) setTimes(await res.json()); };
  const fetchCampeonatos = async () => { const res = await fetch(`${API_BASE_URL}/api/campeonatos`); if (res.ok) setCampeonatos(await res.json()); };

  useEffect(() => { fetchUsuarios(); fetchMaterias(); fetchJogos(); fetchTimes(); fetchCampeonatos(); }, []);

  const mudarRole = async (userId: number, novoRole: string) => {
    setSalvando(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/usuarios/${userId}/role`, { method: "PUT", headers, body: JSON.stringify({ role: novoRole }) });
      if (res.ok) setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, role: novoRole } : u));
    } finally { setSalvando(null); }
  };

  const deletarMateria = async (id: number) => {
    if (!confirm("Remover esta matéria?")) return;
    const res = await fetch(`${API_BASE_URL}/api/materias/${id}`, { method: "DELETE", headers });
    if (res.ok) setMaterias((prev) => prev.filter((m) => m.materia_id !== id));
  };

  const publicarMateria = async () => {
    if (!novoTitulo.trim() || !novoConteudo.trim()) { setMsgPublicacao("Preencha título e conteúdo."); return; }
    setPublicando(true); setMsgPublicacao("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/materias`, { method: "POST", headers, body: JSON.stringify({ titulo: novoTitulo, conteudo: novoConteudo }) });
      if (res.ok) { setMsgPublicacao("✅ Matéria publicada!"); setNovoTitulo(""); setNovoConteudo(""); fetchMaterias(); setTimeout(() => setAba("materias"), 1500); }
      else { setMsgPublicacao("Erro ao publicar."); }
    } finally { setPublicando(false); }
  };

  const agendarJogo = async () => {
    if (!novoJogo.time_mandante_id || !novoJogo.time_visitante_id || !novoJogo.data_hora) { setMsgJogo("Preencha mandante, visitante e data/hora."); return; }
    if (novoJogo.time_mandante_id === novoJogo.time_visitante_id) { setMsgJogo("Mandante e visitante não podem ser o mesmo time."); return; }
    setAgendando(true); setMsgJogo("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/jogos`, {
        method: "POST", headers,
        body: JSON.stringify({
          campeonato_id: novoJogo.campeonato_id ? parseInt(novoJogo.campeonato_id) : null,
          time_mandante_id: parseInt(novoJogo.time_mandante_id),
          time_visitante_id: parseInt(novoJogo.time_visitante_id),
          data_hora: novoJogo.data_hora,
          estadio_id: novoJogo.estadio_id ? parseInt(novoJogo.estadio_id) : null,
        }),
      });
      if (res.ok) { setMsgJogo("✅ Jogo agendado!"); setNovoJogo({ campeonato_id: "", time_mandante_id: "", time_visitante_id: "", data_hora: "", estadio_id: "" }); fetchJogos(); setTimeout(() => setAba("jogos"), 1500); }
      else { setMsgJogo("Erro ao agendar jogo."); }
    } finally { setAgendando(false); }
  };

  const criarCampeonato = async () => {
    if (!novoCamp.nome.trim()) { setMsgCamp("Preencha o nome do campeonato."); return; }
    setCriandoCamp(true); setMsgCamp("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/campeonatos`, {
        method: "POST", headers,
        body: JSON.stringify({
          nome: novoCamp.nome,
          tipo_formato: novoCamp.tipo_formato,
          pontos_vitoria: parseInt(novoCamp.pontos_vitoria),
          pontos_empate: parseInt(novoCamp.pontos_empate),
          pontos_derrota: parseInt(novoCamp.pontos_derrota),
        }),
      });
      if (res.ok) {
        setMsgCamp("✅ Campeonato criado com sucesso!");
        setNovoCamp({ nome: "", tipo_formato: "PONTOS_CORRIDOS", pontos_vitoria: "3", pontos_empate: "1", pontos_derrota: "0" });
        fetchCampeonatos();
        setTimeout(() => setAba("campeonatos"), 1500);
      } else { setMsgCamp("Erro ao criar campeonato."); }
    } finally { setCriandoCamp(false); }
  };

  const finalizarJogo = async (jogoId: number) => {
    const p = placar[jogoId];
    if (!p || p.m === "" || p.v === "") { alert("Preencha o placar antes de finalizar."); return; }
    setFinalizando(jogoId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jogos/${jogoId}/finalizar`, { method: "POST", headers, body: JSON.stringify({ gols_mandante: parseInt(p.m), gols_visitante: parseInt(p.v) }) });
      if (res.ok) { fetchJogos(); setPlacar((prev) => { const n = { ...prev }; delete n[jogoId]; return n; }); }
    } finally { setFinalizando(null); }
  };

  const deletarJogo = async (id: number) => {
    if (!confirm("Remover este jogo?")) return;
    const res = await fetch(`${API_BASE_URL}/api/jogos/${id}`, { method: "DELETE", headers });
    if (res.ok) setJogos((prev) => prev.filter((j) => j.jogo_id !== id));
  };

  const roleBadgeColor = (role: string) => {
    const cores: Record<string, string> = {
      master: "bg-primary/10 text-primary", presidente: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      delegado: "bg-purple-100 text-purple-700", capitao: "bg-green-100 text-green-700",
      olheiro: "bg-yellow-100 text-yellow-700", torcedor: "bg-muted text-muted-foreground",
    };
    return cores[role] ?? "bg-muted text-muted-foreground";
  };

  const abas = [
    { key: "usuarios", label: "Usuários", icon: Users },
    { key: "campeonatos", label: "Campeonatos", icon: Trophy },
    { key: "novo_campeonato", label: "Novo Camp.", icon: PlusCircle },
    { key: "jogos", label: "Jogos", icon: Swords },
    { key: "novo_jogo", label: "Novo Jogo", icon: Calendar },
    { key: "materias", label: "Matérias", icon: Newspaper },
    { key: "nova_materia", label: "Nova Matéria", icon: PlusCircle },
  ];

  const inputClass = "w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}>
      <Header />
      <main className="container mx-auto px-4 py-12">

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie usuários, campeonatos, jogos e conteúdo</p>
        </div>

        {/* Resumo */}
        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          {[
            { icon: Users, count: usuarios.length, label: "Usuários" },
            { icon: Trophy, count: campeonatos.length, label: "Campeonatos" },
            { icon: Swords, count: jogos.length, label: "Jogos" },
            { icon: Newspaper, count: materias.length, label: "Matérias" },
          ].map(({ icon: Icon, count, label }) => (
            <div key={label} className="flex items-center gap-2 bg-card/80 border rounded-xl px-5 py-3 shadow-sm">
              <Icon className="w-4 h-4 text-primary" />
              <span className="font-semibold">{count}</span>
              <span className="text-muted-foreground text-sm">{label}</span>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex justify-center mb-8 overflow-x-auto pb-2">
          <div className="inline-flex rounded-xl border bg-card/80 p-1 gap-1">
            {abas.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setAba(key as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  aba === key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ABA: USUÁRIOS */}
        {aba === "usuarios" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Gestão de Usuários</h2>
              <button onClick={fetchUsuarios} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {loadingUsers ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : (
              <div className="divide-y">
                {usuarios.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{u.username[0].toUpperCase()}</div>
                      <div>
                        <p className="font-medium text-sm">{u.username}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(u.role)}`}>{u.role}</span>
                      </div>
                    </div>
                    {user.role === "master" && u.username !== user.username && (
                      <div className="flex items-center gap-2">
                        <select defaultValue={u.role} onChange={(e) => mudarRole(u.id, e.target.value)} disabled={salvando === u.id}
                          className="text-sm border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {salvando === u.id && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: CAMPEONATOS */}
        {aba === "campeonatos" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Campeonatos</h2>
              <button onClick={() => setAba("novo_campeonato")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80">
                <PlusCircle className="w-4 h-4" /> Novo
              </button>
            </div>
            {campeonatos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum campeonato cadastrado.</div>
            ) : (
              <div className="divide-y">
                {campeonatos.map((c) => (
                  <div key={c.campeonato_id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{c.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {FORMATOS.find(f => f.value === c.tipo_formato)?.label ?? c.tipo_formato}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.ativo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {c.ativo ? "Ativo" : "Encerrado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO CAMPEONATO */}
        {aba === "novo_campeonato" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Criar Novo Campeonato
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome do Campeonato *</label>
                <input type="text" value={novoCamp.nome} onChange={(e) => setNovoCamp(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Copa Elite Diadema 2026" className={inputClass} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Formato</label>
                <select value={novoCamp.tipo_formato} onChange={(e) => setNovoCamp(p => ({ ...p, tipo_formato: e.target.value }))} className={inputClass}>
                  {FORMATOS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                {/* Descrição do formato selecionado */}
                <p className="text-xs text-muted-foreground mt-1.5">
                  {novoCamp.tipo_formato === "PONTOS_CORRIDOS" && "Todos jogam contra todos. Quem tiver mais pontos no final vence."}
                  {novoCamp.tipo_formato === "MATA_MATA" && "Eliminação direta. Perdeu, saiu. Um jogo por confronto."}
                  {novoCamp.tipo_formato === "GRUPOS_E_MATA_MATA" && "Fase de grupos seguida de mata-mata. Estilo Copa do Mundo."}
                  {novoCamp.tipo_formato === "IDA_E_VOLTA" && "Dois jogos por confronto. O placar agregado decide. Estilo Paulistão."}
                  {novoCamp.tipo_formato === "PONTOS_CORRIDOS_PLAYOFFS" && "Fase de pontos corridos. Os melhores colocados (ex: top 8) avançam para a chave."}
                </p>
              </div>

              <div className="border rounded-xl p-4 bg-muted/30">
                <p className="text-sm font-medium mb-3">Pontuação</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "pontos_vitoria", label: "Vitória", color: "text-green-600" },
                    { key: "pontos_empate", label: "Empate", color: "text-yellow-600" },
                    { key: "pontos_derrota", label: "Derrota", color: "text-red-500" },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="text-center">
                      <label className={`text-xs font-medium mb-1 block ${color}`}>{label}</label>
                      <input type="number" min="0" max="10"
                        value={(novoCamp as any)[key]}
                        onChange={(e) => setNovoCamp(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full text-center border rounded-lg px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                </div>
              </div>

              {msgCamp && (
                <p className={`text-sm font-medium ${msgCamp.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgCamp}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={criarCampeonato} disabled={criandoCamp}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {criandoCamp ? "Criando..." : "Criar Campeonato"}
                </button>
                <button onClick={() => setNovoCamp({ nome: "", tipo_formato: "PONTOS_CORRIDOS", pontos_vitoria: "3", pontos_empate: "1", pontos_derrota: "0" })}
                  className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  <X className="w-4 h-4" /> Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: JOGOS */}
        {aba === "jogos" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Jogos</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setAba("novo_jogo")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80">
                  <PlusCircle className="w-4 h-4" /> Novo
                </button>
                <button onClick={fetchJogos} className="text-muted-foreground hover:text-foreground ml-2"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {loadingJogos ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
              jogos.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum jogo cadastrado.</div> : (
              <div className="divide-y">
                {jogos.map((j) => (
                  <div key={j.jogo_id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{j.mandante} <span className="text-muted-foreground">vs</span> {j.visitante}</p>
                        <p className="text-xs text-muted-foreground">{j.campeonato} · {j.data_hora}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          j.status === "Finalizado" ? "bg-green-100 text-green-700" :
                          j.status === "Em andamento" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
                        }`}>{j.status}</span>
                        <button onClick={() => deletarJogo(j.jogo_id)} className="text-destructive hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {j.status !== "Finalizado" && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.mandante}</span>
                        <input type="number" min="0" placeholder="0" value={placar[j.jogo_id]?.m ?? ""}
                          onChange={(e) => setPlacar((prev) => ({ ...prev, [j.jogo_id]: { ...prev[j.jogo_id], m: e.target.value } }))}
                          className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span className="text-muted-foreground font-bold">×</span>
                        <input type="number" min="0" placeholder="0" value={placar[j.jogo_id]?.v ?? ""}
                          onChange={(e) => setPlacar((prev) => ({ ...prev, [j.jogo_id]: { ...prev[j.jogo_id], v: e.target.value } }))}
                          className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.visitante}</span>
                        <button onClick={() => finalizarJogo(j.jogo_id)} disabled={finalizando === j.jogo_id}
                          className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 ml-auto">
                          {finalizando === j.jogo_id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Finalizar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO JOGO */}
        {aba === "novo_jogo" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Agendar Novo Jogo
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mandante (Casa) *</label>
                  <select value={novoJogo.time_mandante_id} onChange={(e) => setNovoJogo((p) => ({ ...p, time_mandante_id: e.target.value }))} className={inputClass}>
                    <option value="">Selecione...</option>
                    {times.map((t) => <option key={t.id} value={t.id}>{t.nome_oficial}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Visitante *</label>
                  <select value={novoJogo.time_visitante_id} onChange={(e) => setNovoJogo((p) => ({ ...p, time_visitante_id: e.target.value }))} className={inputClass}>
                    <option value="">Selecione...</option>
                    {times.map((t) => <option key={t.id} value={t.id}>{t.nome_oficial}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Data e Hora *</label>
                <input type="datetime-local" value={novoJogo.data_hora} onChange={(e) => setNovoJogo((p) => ({ ...p, data_hora: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Campeonato</label>
                <select value={novoJogo.campeonato_id} onChange={(e) => setNovoJogo((p) => ({ ...p, campeonato_id: e.target.value }))} className={inputClass}>
                  <option value="">Amistoso (sem campeonato)</option>
                  {campeonatos.map((c) => <option key={c.campeonato_id} value={c.campeonato_id}>{c.nome}</option>)}
                </select>
              </div>
              {msgJogo && <p className={`text-sm font-medium ${msgJogo.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgJogo}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={agendarJogo} disabled={agendando}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  <Save className="w-4 h-4" />{agendando ? "Agendando..." : "Agendar Jogo"}
                </button>
                <button onClick={() => setNovoJogo({ campeonato_id: "", time_mandante_id: "", time_visitante_id: "", data_hora: "", estadio_id: "" })}
                  className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  <X className="w-4 h-4" /> Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: MATÉRIAS */}
        {aba === "materias" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Matérias Publicadas</h2>
              <button onClick={() => setAba("nova_materia")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80">
                <PlusCircle className="w-4 h-4" /> Nova
              </button>
            </div>
            {loadingMaterias ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
              materias.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhuma matéria.</div> : (
              <div className="divide-y">
                {materias.map((m) => (
                  <div key={m.materia_id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{m.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.data_publicacao}</p>
                    </div>
                    <button onClick={() => deletarMateria(m.materia_id)} className="text-destructive hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVA MATÉRIA */}
        {aba === "nova_materia" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" /> Nova Matéria
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Título</label>
                <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Copa Elite Diadema 2026 começa com tudo!" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Conteúdo</label>
                <textarea value={novoConteudo} onChange={(e) => setNovoConteudo(e.target.value)}
                  placeholder="Escreva o conteúdo da matéria aqui..." rows={12}
                  className={`${inputClass} resize-none`} />
              </div>
              {msgPublicacao && <p className={`text-sm font-medium ${msgPublicacao.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgPublicacao}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={publicarMateria} disabled={publicando}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  <Save className="w-4 h-4" />{publicando ? "Publicando..." : "Publicar Matéria"}
                </button>
                <button onClick={() => { setNovoTitulo(""); setNovoConteudo(""); setMsgPublicacao(""); }}
                  className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  <X className="w-4 h-4" /> Limpar
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default Admin;