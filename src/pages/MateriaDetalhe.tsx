import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Newspaper, Heart, Share2, Check } from "lucide-react";

interface Materia {
  materia_id: number;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
  imagem_url?: string | null;
  curtidas?: number;
}

const MateriaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [materia, setMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Curtir
  const [curtido, setCurtido] = useState(false);
  const [curtindo, setCurtindo] = useState(false);

  // Compartilhar
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    const fetchMateria = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/materias/${id}`);
        if (response.ok) {
          const data = await response.json();
          setMateria(data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Erro ao buscar matéria:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMateria();
  }, [id]);

  // Verifica se esse navegador já curtiu essa matéria antes
  useEffect(() => {
    if (id && localStorage.getItem(`materia_curtida_${id}`) === "1") {
      setCurtido(true);
    }
  }, [id]);

  const handleCurtir = async () => {
    if (curtido || curtindo || !materia) return;
    setCurtindo(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/materias/${materia.materia_id}/curtir`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMateria((prev) => (prev ? { ...prev, curtidas: data.curtidas } : prev));
        setCurtido(true);
        localStorage.setItem(`materia_curtida_${materia.materia_id}`, "1");
      }
    } catch (error) {
      console.error("Erro ao curtir matéria:", error);
    } finally {
      setCurtindo(false);
    }
  };

  const handleCompartilhar = async () => {
    if (!materia) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: materia.titulo, url });
      } catch (error) {
        // usuário cancelou o compartilhamento nativo, sem problema
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setLinkCopiado(true);
        setTimeout(() => setLinkCopiado(false), 2000);
      } catch (error) {
        console.error("Erro ao copiar link:", error);
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}
    >
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Botão voltar */}
        <button
          onClick={() => navigate("/materias")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Matérias
        </button>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border bg-card/80 p-8 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-6" />
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-3 bg-muted rounded w-full" />)}
            </div>
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
              <Newspaper className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Matéria não encontrada</h3>
            <p className="text-muted-foreground mb-6">Esta matéria pode ter sido removida ou o link está incorreto.</p>
            <button
              onClick={() => navigate("/materias")}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Ver todas as matérias
            </button>
          </div>
        )}

        {/* Conteúdo */}
        {!loading && materia && (
          <article className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden">

            {materia.imagem_url && (
              <img src={materia.imagem_url} alt={materia.titulo} className="w-full max-h-[420px] object-cover" />
            )}

            <div className="p-8">
              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Varzeando</span>
                <Clock className="w-3 h-3" />
                <span>{materia.data_publicacao}</span>
              </div>

              {/* Título */}
              <h1 className="text-3xl font-bold mb-6 leading-tight">
                {materia.titulo}
              </h1>

              {/* Curtir e Compartilhar */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleCurtir}
                  disabled={curtindo || curtido}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    curtido
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : "border hover:bg-muted"
                  } disabled:cursor-default`}
                >
                  <Heart className={`w-4 h-4 ${curtido ? "fill-current" : ""}`} />
                  {materia.curtidas ?? 0}
                </button>
                <button
                  onClick={handleCompartilhar}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors"
                >
                  {linkCopiado ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  {linkCopiado ? "Link copiado!" : "Compartilhar"}
                </button>
              </div>

              {/* Divisor */}
              <div className="border-t mb-6" />

              {/* Conteúdo — parágrafos normais + fotos inseridas no meio do texto (sintaxe ![legenda](url)) */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {materia.conteudo.split("\n").map((linha, i) => {
                  const matchFoto = linha.trim().match(/^!\[(.*)\]\((https?:\/\/[^\s)]+)\)$/);
                  if (matchFoto) {
                    const [, legenda, urlFoto] = matchFoto;
                    const legendaLimpa = legenda.trim();
                    const legendaEhPlaceholder = legendaLimpa === "" || legendaLimpa === "Adicione uma legenda aqui";
                    return (
                      <figure key={i} className="my-6">
                        <img src={urlFoto} alt={legendaEhPlaceholder ? materia.titulo : legendaLimpa} className="w-full rounded-xl" />
                        {!legendaEhPlaceholder && (
                          <figcaption className="text-center text-sm text-muted-foreground italic mt-2">{legendaLimpa}</figcaption>
                        )}
                      </figure>
                    );
                  }
                  return linha.trim() ? (
                    <p key={i} className="text-foreground leading-relaxed mb-4">
                      {linha}
                    </p>
                  ) : (
                    <br key={i} />
                  );
                })}
              </div>
            </div>

          </article>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default MateriaDetalhe;
