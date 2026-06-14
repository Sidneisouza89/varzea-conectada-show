import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import {
  ShieldCheck, Users, Newspaper, RefreshCw, PlusCircle,
  Trash2, Edit3, Save, X, Swords, Calendar, CheckCircle2
} from "lucide-react";

interface Usuario {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
}

interface Materia {
  materia_id: number;
  titulo: string;
  data_publicacao: string;
}

interface Jogo {
  jogo_id: number;
  mandante: string;
  visitante: string;
  campeonato: string;
  data_hora: string;
  status: string;
}

interface Time {
  id: number;
  nome_oficial: string;
}

interface Campeonato {
  campeonato_id: number;
  nome: string;
}

const ROLES = ["torcedor", "capitao", "delegado", "olheiro", "presidente", "master"];

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
  const [aba, setAba] = useState<"usuarios" | "materias" | "nova_materia" | "jogos" | "novo_jogo">("usuarios");
  const [salvando, setSalvando] = useState<number | null>(null);

  // Nova matéria
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [msgPublicacao, setMsgPublicacao] = useState("");

  // Novo jogo
  const [novoJogo, setNovoJogo] = useState({
    campeonato_id: "",
    time_mandante_id: "",
    time_visitante_id: "",
    data_hora: "",
    estadio_id: "",
  });
  const [agendando, setAgendando] = useState(false);
  const [msgJogo, setMsgJogo] = useState("");

  // Placar rápido
  const [placar, setPlacar] = useState<Record<number, { m: string; v: string }>>({});
  const [finalizando, setFinalizando] = useState<number | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "master" && user.role !== "presidente")) {
      navigate("/");
    }
  }, []);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchUsuarios = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/usuarios`, { headers });
      if (res.ok) setUsuarios(await res.json());
    } finally { setLoadingUsers(false); }
  };

  const fetchMaterias = async () => {
    setLoadingMaterias(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/materias`);
      if (res.ok) setMaterias(await res.json());
    } finally { setLoadingMaterias(false); }
  };

  const fetchJogos = async () => {
    setLoadingJogos(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jogos`);
      if (res.ok) setJogos(await res.json());
    } finally { setLoadingJogos(false); }
  };

  const fetchTimes = async () => {
    const res = await fetch(`${API_BASE_URL}/api/times`);
    if (res.ok) setTimes(await res.json());
  };

  const fetchCampeonatos = async () => {
    const res = await fetch(`${API_BASE_URL}/api/campeonatos`);
    if (res.ok) setCampeonatos(await res.json());
  };

  useEffect(() => {
    fetchUsuarios();
    fetchMaterias();
    fetchJogos();
    fetchTimes();
    fetchCampeonatos();
  }, []);

  const mudarRole = async (userId: number, novoRole: string) => {
    setSalvando(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/usuarios/${userId}/role`, {
        method: "PUT", headers,
        body: JSON.stringify({ role: novoRole }),
      });
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
      const res = await fetch(`${API_BASE_URL}/api/materias`, {
        method: "POST", headers,
        body: JSON.stringify({ titulo: novoTitulo, conteudo: novoConteudo }),
      });
      if (res.ok) {
        setMsgPublicacao("✅ Matéria publicada!");
        setNovoTitulo(""); setNovoConteudo("");
        fetchMaterias();
        setTimeout(() => setAba("materias"), 1500);
      } else { setMsgPublicacao("Erro ao publicar."); }
    } finally { setPublicando(false); }
  };

  const agendarJogo = async () => {
    if (!novoJogo.time_mandante_id || !novoJogo.time_visitante_id || !novoJogo.data_hora) {
      setMsgJogo("Preencha mandante, visitante e data/hora."); return;
    }
    if (novoJogo.time_mandante_id === novoJogo.time_visitante_id) {
      setMsgJogo("Mandante e visitante não podem ser o mesmo time."); return;
    }
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
      if (res.ok) {
        setMsgJogo("✅ Jogo agendado com sucesso!");
        setNovoJogo({ campeonato_id: "", time_mandante_id: "", time_visitante_id: "", data_hora: "", estadio_id: "" });
        fetchJogos();
        setTimeout(() => setAba("jogos"), 1500);
      } else { setMsgJogo("Erro ao agendar jogo."); }
    } finally { setAgendando(false); }
  };

  const finalizarJogo = async (jogoId: number) => {
    const p = placar[jogoId];
    if (!p || p.m === "" || p.v === "") { alert("Preencha o placar antes de finalizar."); return; }
    setFinalizando(jogoId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jogos/${jogoId}/finalizar`, {
        method: "POST", headers,
        body: JSON.stringify({ gols_mandante: parseInt(p.m), gols_visitante: parseInt(p.v) }),
      });
      if (res.ok) {
        fetchJogos();
        setPlacar((prev) => { const n = { ...prev }; delete n[jogoId]; return n; });
      }
    } finally { setFinalizando(null); }
  };

  const deletarJogo = async (id: number) => {
    if (!confirm("Remover este jogo?")) return;
    const res = await fetch(`${API_BASE_URL}/api/jogos/${id}`, { method: "DELETE", headers });
    if (res.ok) setJogos((prev) => prev.filter((j) => j.jogo_id !== id));
  };

  const roleBadgeColor = (role: string) => {
    const cores: Record<string, string> = {
      master: "bg-primary/10 text-primary",
      presidente: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      delegado: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      capitao: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      olheiro: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      torcedor: "bg-muted text-muted-foreground",
    };
    return cores[role] ?? "bg-muted text-muted-foreground";
  };

  const abas = [
    { key: "usuarios", label: "Usuários", icon: Users },
    { key: "jogos", label: "Jogos", icon: Swords },
    { key: "novo_jogo", label: "Novo Jogo", icon: Calendar },
    { key: "materias", label: "Matérias", icon: Newspaper },
    { key: "nova_materia", label: "Nova Matéria", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}>
      <Header />
      <main className="container mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie usuários, jogos e conteúdo do Varzeando</p>
        </div>

        {/* Resumo */}
        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          <div className="flex items-center gap-2 bg-card/80 border rounded-xl px-5 py-3 shadow-sm">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold">{usuarios.length}</span>
            <span className="text-muted-foreground text-sm">Usuários</span>
          </div>
          <div className="flex items-center gap-2 bg-card/80 border rounded-xl px-5 py-3 shadow-sm">
            <Swords className="w-4 h-4 text-primary" />
            <span className="font-semibold">{jogos.length}</span>
            <span className="text-muted-foreground text-sm">Jogos</span>
          </div>
          <div className="flex items-center gap-2 bg-card/80 border rounded-xl px-5 py-3 shadow-sm">
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="font-semibold">{materias.length}</span>
            <span className="text-muted-foreground text-sm">Matérias</span>
          </div>
        </div>

        {/* Abas */}
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="inline-flex rounded-xl border bg-card/80 p-1 gap-1">
            {abas.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setAba(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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
              <button onClick={fetchUsuarios} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {loadingUsers ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : (
              <div className="divide-y">
                {usuarios.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.username}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(u.role)}`}>{u.role}</span>
                      </div>
                    </div>
                    {user.role === "master" && u.username !== user.username && (
                      <div className="flex items-center gap-2">
                        <select defaultValue={u.role} onChange={(e) => mudarRole(u.id, e.target.value)}
                          disabled={salvando === u.id}
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

        {/* ABA: JOGOS */}
        {aba === "jogos" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Jogos</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setAba("novo_jogo")}
                  className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80">
                  <PlusCircle className="w-4 h-4" /> Novo
                </button>
                <button onClick={fetchJogos} className="text-muted-foreground hover:text-foreground ml-2">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            {loadingJogos ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : jogos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum jogo cadastrado.</div>
            ) : (
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
                          j.status === "Em andamento" ? "bg-yellow-100 text-yellow-700" :
                          "bg-muted text-muted-foreground"
                        }`}>{j.status}</span>
                        <button onClick={() => deletarJogo(j.jogo_id)} className="text-destructive hover:opacity-70">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Placar rápido — só pra jogos não finalizados */}
                    {j.status !== "Finalizado" && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.mandante}</span>
                        <input type="number" min="0" placeholder="0"
                          value={placar[j.jogo_id]?.m ?? ""}
                          onChange={(e) => setPlacar((prev) => ({ ...prev, [j.jogo_id]: { ...prev[j.jogo_id], m: e.target.value } }))}
                          className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span className="text-muted-foreground font-bold">×</span>
                        <input type="number" min="0" placeholder="0"
                          value={placar[j.jogo_id]?.v ?? ""}
                          onChange={(e) => setPlacar((prev) => ({ ...prev, [j.jogo_id]: { ...prev[j.jogo_id], v: e.target.value } }))}
                          className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.visitante}</span>
                        <button onClick={() => finalizarJogo(j.jogo_id)}
                          disabled={finalizando === j.jogo_id}
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
                  <select value={novoJogo.time_mandante_id}
                    onChange={(e) => setNovoJogo((p) => ({ ...p, time_mandante_id: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Selecione...</option>
                    {times.map((t) => <option key={t.id} value={t.id}>{t.nome_oficial}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Visitante *</label>
                  <select value={novoJogo.time_visitante_id}
                    onChange={(e) => setNovoJogo((p) => ({ ...p, time_visitante_id: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Selecione...</option>
                    {times.map((t) => <option key={t.id} value={t.id}>{t.nome_oficial}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Data e Hora *</label>
                <input type="datetime-local"
                  value={novoJogo.data_hora}
                  onChange={(e) => setNovoJogo((p) => ({ ...p, data_hora: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Campeonato</label>
                <select value={novoJogo.campeonato_id}
                  onChange={(e) => setNovoJogo((p) => ({ ...p, campeonato_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Amistoso (sem campeonato)</option>
                  {campeonatos.map((c) => <option key={c.campeonato_id} value={c.campeonato_id}>{c.nome}</option>)}
                </select>
              </div>
              {msgJogo && (
                <p className={`text-sm font-medium ${msgJogo.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>
                  {msgJogo}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={agendarJogo} disabled={agendando}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {agendando ? "Agendando..." : "Agendar Jogo"}
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
              <button onClick={() => setAba("nova_materia")}
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80">
                <PlusCircle className="w-4 h-4" /> Nova
              </button>
            </div>
            {loadingMaterias ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : materias.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhuma matéria publicada.</div>
            ) : (
              <div className="divide-y">
                {materias.map((m) => (
                  <div key={m.materia_id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{m.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.data_publicacao}</p>
                    </div>
                    <button onClick={() => deletarMateria(m.materia_id)} className="text-destructive hover:opacity-70">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                  placeholder="Ex: Copa Elite Diadema 2026 começa com tudo!"
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Conteúdo</label>
                <textarea value={novoConteudo} onChange={(e) => setNovoConteudo(e.target.value)}
                  placeholder="Escreva o conteúdo da matéria aqui..." rows={12}
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              {msgPublicacao && (
                <p className={`text-sm font-medium ${msgPublicacao.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>
                  {msgPublicacao}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={publicarMateria} disabled={publicando}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {publicando ? "Publicando..." : "Publicar Matéria"}
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
