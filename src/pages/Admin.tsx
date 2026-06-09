import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import {
  ShieldCheck, Users, Trophy, Building2, Newspaper,
  UserCheck, UserX, RefreshCw, PlusCircle, Trash2, Edit3, Save, X
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

const ROLES = ["torcedor", "capitao", "delegado", "olheiro", "presidente", "master"];

const Admin = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("varzeando_token");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [aba, setAba] = useState<"usuarios" | "materias" | "nova_materia">("usuarios");
  const [salvando, setSalvando] = useState<number | null>(null);

  // Nova matéria
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [msgPublicacao, setMsgPublicacao] = useState("");

  // Redireciona se não for admin
  useEffect(() => {
    if (!user || (user.role !== "master" && user.role !== "presidente")) {
      navigate("/");
    }
  }, []);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Carrega usuários
  const fetchUsuarios = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/usuarios`, { headers });
      if (res.ok) setUsuarios(await res.json());
    } finally {
      setLoadingUsers(false);
    }
  };

  // Carrega matérias
  const fetchMaterias = async () => {
    setLoadingMaterias(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/materias`);
      if (res.ok) setMaterias(await res.json());
    } finally {
      setLoadingMaterias(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchMaterias();
  }, []);

  // Muda role do usuário
  const mudarRole = async (userId: number, novoRole: string) => {
    setSalvando(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/usuarios/${userId}/role`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ role: novoRole }),
      });
      if (res.ok) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: u.role = novoRole } : u))
        );
      }
    } finally {
      setSalvando(null);
    }
  };

  // Deleta matéria
  const deletarMateria = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover esta matéria?")) return;
    const res = await fetch(`${API_BASE_URL}/api/materias/${id}`, { method: "DELETE", headers });
    if (res.ok) setMaterias((prev) => prev.filter((m) => m.materia_id !== id));
  };

  // Publica matéria
  const publicarMateria = async () => {
    if (!novoTitulo.trim() || !novoConteudo.trim()) {
      setMsgPublicacao("Preencha o título e o conteúdo.");
      return;
    }
    setPublicando(true);
    setMsgPublicacao("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/materias`, {
        method: "POST",
        headers,
        body: JSON.stringify({ titulo: novoTitulo, conteudo: novoConteudo }),
      });
      if (res.ok) {
        setMsgPublicacao("✅ Matéria publicada com sucesso!");
        setNovoTitulo("");
        setNovoConteudo("");
        fetchMaterias();
        setTimeout(() => setAba("materias"), 1500);
      } else {
        setMsgPublicacao("Erro ao publicar. Tente novamente.");
      }
    } finally {
      setPublicando(false);
    }
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

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}
    >
      <Header />
      <main className="container mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie usuários e conteúdo do Varzeando</p>
        </div>

        {/* Resumo */}
        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          <div className="flex items-center gap-2 bg-card/80 border rounded-xl px-5 py-3 shadow-sm">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold">{usuarios.length}</span>
            <span className="text-muted-foreground text-sm">Usuários</span>
          </div>
          <div className="flex items-center gap-2 bg-card/80 border rounded-xl px-5 py-3 shadow-sm">
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="font-semibold">{materias.length}</span>
            <span className="text-muted-foreground text-sm">Matérias</span>
          </div>
        </div>

        {/* Abas */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl border bg-card/80 p-1 gap-1">
            {[
              { key: "usuarios", label: "Usuários", icon: Users },
              { key: "materias", label: "Matérias", icon: Newspaper },
              { key: "nova_materia", label: "Nova Matéria", icon: PlusCircle },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setAba(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  aba === key
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
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
              <div className="p-8 text-center text-muted-foreground">Carregando usuários...</div>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                    {/* Só master pode mudar roles, e não pode mudar o próprio */}
                    {user.role === "master" && u.username !== user.username && (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={u.role}
                          onChange={(e) => mudarRole(u.id, e.target.value)}
                          disabled={salvando === u.id}
                          className="text-sm border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {salvando === u.id && (
                          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: MATÉRIAS */}
        {aba === "materias" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Matérias Publicadas</h2>
              <button
                onClick={() => setAba("nova_materia")}
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"
              >
                <PlusCircle className="w-4 h-4" /> Nova
              </button>
            </div>
            {loadingMaterias ? (
              <div className="p-8 text-center text-muted-foreground">Carregando matérias...</div>
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
                    <button
                      onClick={() => deletarMateria(m.materia_id)}
                      className="text-destructive hover:opacity-70 transition-opacity"
                      title="Remover matéria"
                    >
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
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Copa Elite Diadema 2026 começa com tudo!"
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Conteúdo</label>
                <textarea
                  value={novoConteudo}
                  onChange={(e) => setNovoConteudo(e.target.value)}
                  placeholder="Escreva o conteúdo da matéria aqui..."
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              {msgPublicacao && (
                <p className={`text-sm font-medium ${msgPublicacao.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>
                  {msgPublicacao}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={publicarMateria}
                  disabled={publicando}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {publicando ? "Publicando..." : "Publicar Matéria"}
                </button>
                <button
                  onClick={() => { setNovoTitulo(""); setNovoConteudo(""); setMsgPublicacao(""); }}
                  className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
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
