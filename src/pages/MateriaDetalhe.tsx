import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Newspaper } from "lucide-react";

interface Materia {
  materia_id: number;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
}

const MateriaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [materia, setMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          <article className="rounded-2xl border bg-card/80 backdrop-blur-sm p-8 shadow-md">

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

            {/* Divisor */}
            <div className="border-t mb-6" />

            {/* Conteúdo — preserva quebras de linha */}
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {materia.conteudo.split("\n").map((paragrafo, i) =>
                paragrafo.trim() ? (
                  <p key={i} className="text-foreground leading-relaxed mb-4">
                    {paragrafo}
                  </p>
                ) : (
                  <br key={i} />
                )
              )}
            </div>

          </article>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default MateriaDetalhe;
