import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { ArrowLeft, MapPin, Shield } from "lucide-react";

interface Time {
  id: number;
  nome_oficial: string;
  apelido: string;
  regiao: string;
  historia?: string;
  logo_url?: string;
}

const TimeDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [time, setTime] = useState<Time | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/times/${id}`);
        if (response.ok) {
          setTime(await response.json());
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTime();
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
          onClick={() => navigate("/times")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Times
        </button>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border bg-card/80 p-8 animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-28 h-28 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-6 bg-muted rounded w-2/3 mb-3" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-3 bg-muted rounded w-full" />)}
            </div>
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
              <Shield className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Time não encontrado</h3>
            <button
              onClick={() => navigate("/times")}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 mt-4"
            >
              Ver todos os times
            </button>
          </div>
        )}

        {/* Conteúdo */}
        {!loading && time && (
          <article className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-md overflow-hidden">

            {/* Header do time */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-10">
              <div className="flex items-center gap-6">
                {/* Brasão */}
                {time.logo_url ? (
                  <img
                    src={time.logo_url}
                    alt={`Brasão ${time.nome_oficial}`}
                    className="w-28 h-28 object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-4xl border-4 border-primary/20">
                    {time.apelido ? time.apelido[0] : time.nome_oficial[0]}
                  </div>
                )}

                {/* Info */}
                <div>
                  <h1 className="text-2xl font-bold leading-tight mb-1">{time.nome_oficial}</h1>
                  {time.apelido && (
                    <p className="text-muted-foreground italic mb-3">"{time.apelido}"</p>
                  )}
                  {time.regiao && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{time.regiao} — Diadema/SP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* História */}
            <div className="px-8 py-8">
              {time.historia ? (
                <>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Nossa História
                  </h2>
                  <div className="border-t mb-6" />
                  {time.historia.split("\n").map((paragrafo, i) =>
                    paragrafo.trim() ? (
                      <p key={i} className="text-foreground leading-relaxed mb-4">
                        {paragrafo}
                      </p>
                    ) : <br key={i} />
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>A história deste time será contada em breve.</p>
                  <p className="text-sm mt-1">Em construção pelo Varzeando. 🏟️</p>
                </div>
              )}
            </div>

          </article>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default TimeDetalhe;
