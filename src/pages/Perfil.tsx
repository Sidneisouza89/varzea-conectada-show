import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { ShieldCheck, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

const roleBadgeColor = (role: string) => {
  const cores: Record<string, string> = {
    master: "bg-primary/10 text-primary border border-primary/20",
    presidente: "bg-blue-100 text-blue-700 border border-blue-200",
    delegado: "bg-purple-100 text-purple-700 border border-purple-200",
    capitao: "bg-green-100 text-green-700 border border-green-200",
    olheiro: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    torcedor: "bg-muted text-muted-foreground border border-border",
  };
  return cores[role] ?? "bg-muted text-muted-foreground";
};

const roleDescricao: Record<string, string> = {
  master: "Acesso total ao sistema Varzeando.",
  presidente: "Gerencia campeonatos, jogos, árbitros e conteúdo.",
  delegado: "Registra gols e finaliza partidas.",
  capitao: "Cadastra e gerencia jogadores do seu time.",
  olheiro: "Acesso ao módulo de análise de talentos.",
  torcedor: "Acompanha jogos, times e campeonatos.",
};

const Perfil = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("varzeando_token");

  // TODOS os hooks ANTES de qualquer return condicional
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    if (!user || !token) {
      navigate("/");
    }
  }, []);

  // Return condicional só DEPOIS de todos os hooks
  if (!user || !token) return null;

  const trocarSenha = async () => {
    setMsg(null);
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMsg({ tipo: "erro", texto: "Preencha todos os campos." }); return;
    }
    if (novaSenha.length < 6) {
      setMsg({ tipo: "erro", texto: "A nova senha deve ter pelo menos 6 caracteres." }); return;
    }
    if (novaSenha !== confirmarSenha) {
      setMsg({ tipo: "erro", texto: "A nova senha e a confirmação não coincidem." }); return;
    }
    if (senhaAtual === novaSenha) {
      setMsg({ tipo: "erro", texto: "A nova senha deve ser diferente da atual." }); return;
    }
    setSalvando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/trocar-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ tipo: "ok", texto: "✅ Senha alterada com sucesso!" });
        setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      } else {
        setMsg({ tipo: "erro", texto: data.message || data.error || "Erro ao trocar senha." });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}>
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 text-primary font-bold text-3xl">
            {user.name[0].toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
          <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium ${roleBadgeColor(user.role)}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {user.role}
          </span>
          {roleDescricao[user.role] && (
            <p className="text-muted-foreground text-sm mt-2">{roleDescricao[user.role]}</p>
          )}
        </div>

        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-8">
          <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> Trocar Senha
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Senha Atual</label>
              <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nova Senha</label>
              <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirmar Nova Senha</label>
              <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha" className={inputClass} />
            </div>
            {msg && (
              <div className={`flex items-center gap-2 text-sm font-medium p-3 rounded-xl ${
                msg.tipo === "ok" ? "bg-green-50 text-green-700 dark:bg-green-900/20" : "bg-red-50 text-red-700 dark:bg-red-900/20"
              }`}>
                {msg.tipo === "ok" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {msg.texto}
              </div>
            )}
            <button onClick={trocarSenha} disabled={salvando}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4" />
              {salvando ? "Salvando..." : "Alterar Senha"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          🔐 Autenticação em dois fatores (MFA) via celular — em breve!
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default Perfil;
