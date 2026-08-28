import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, Clock, ChevronRight } from "lucide-react";

interface Materia {
  materia_id: number;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
  imagem_url?: string | null;
}

const Materias = () => {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/materias`);
        if (response.ok) {
          const data = await response.json();
          setMaterias(data);
        }
      } catch (error) {
        console.error("Erro ao buscar matérias:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterias();
  }, []);

  // Remove as linhas de foto embutida (![legenda](url)) antes de gerar o resumo, senão apareceria o link cru no card
  const limparFotosEmbutidas = (texto: string) =>
    texto?.replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, "").replace(/\n{2,}/g, "\n").trim();

  // Resumo do conteúdo para o card
  const resumo = (texto: string, max = 160) => {
    const limpo = limparFotosEmbutidas(texto);
    return limpo?.length > max ? limpo.substring(0, max) + "..." : limpo;
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
            <Newspaper className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Matérias</h1>
          <p className="text-muted-foreground text-lg">
            Notícias e histórias da várzea de Diadema
          </p>
        </div>

        {/* Destaque — primeira matéria em banner */}
        {!loading && materias.length > 0 && (
          <div
            className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-md mb-10 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group overflow-hidden"
            onClick={() => navigate(`/materias/${materias[0].materia_id}`)}
          >
            {materias[0].imagem_url && (
              <img src={materias[0].imagem_url} alt={materias[0].titulo} className="w-full h-56 md:h-72 object-cover" />
            )}
            <div className="p-8">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">Destaque</span>
                <Clock className="w-3 h-3" />
                <span>{materias[0].data_publicacao}</span>
              </div>
              <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {materias[0].titulo}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {resumo(materias[0].conteudo, 300)}
              </p>
              <span className="inline-flex items-center gap-1 text-primary font-medium text-sm">
                Ler matéria completa <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card/80 p-6 animate-pulse">
                <div className="h-3 bg-muted rounded w-1/3 mb-4" />
                <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* Grid de matérias (a partir da segunda) */}
        {!loading && materias.length > 1 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {materias.slice(1).map((m) => (
              <div
                key={m.materia_id}
                className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group overflow-hidden"
                onClick={() => navigate(`/materias/${m.materia_id}`)}
              >
                {m.imagem_url && (
                  <img src={m.imagem_url} alt={m.titulo} className="w-full h-40 object-cover" />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{m.data_publicacao}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors">
                    {m.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {resumo(m.conteudo)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-primary text-sm font-medium">
                    Ler mais <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!loading && materias.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
              <Newspaper className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma matéria publicada</h3>
            <p className="text-muted-foreground">As novidades da várzea aparecerão aqui em breve.</p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default Materias;
