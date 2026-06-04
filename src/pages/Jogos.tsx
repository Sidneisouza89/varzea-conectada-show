import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MatchCard from "@/components/MatchCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/lib/api";

interface Jogo {
  jogo_id: number;
  mandante: string;
  visitante: string;
  campeonato: string;
  data_hora: string;
  status: string;
}

const Jogos = () => {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const token = localStorage.getItem("varzeando_token");
        const response = await fetch(`${API_BASE_URL}/api/jogos`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setJogos(data);
        }
      } catch (error) {
        console.error("Erro ao buscar jogos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJogos();
  }, []);

  const jogosAoVivo = jogos.filter((j) => j.status === "Em andamento");
  const jogosProximos = jogos.filter((j) => j.status === "Agendado");
  const jogosFinaliz = jogos.filter((j) => j.status === "Finalizado");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Jogos</h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe os jogos de várzea em Diadema
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando jogos...</p>
        ) : (
          <Tabs defaultValue="finalizados" className="w-full">
            <TabsList className="mb-8 grid w-full max-w-lg mx-auto grid-cols-3">
              <TabsTrigger value="live">
                Ao Vivo ({jogosAoVivo.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Próximos ({jogosProximos.length})
              </TabsTrigger>
              <TabsTrigger value="finalizados">
                Finalizados ({jogosFinaliz.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              {jogosAoVivo.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum jogo ao vivo.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {jogosAoVivo.map((j) => (
                    <MatchCard key={j.jogo_id} homeTeam={j.mandante} awayTeam={j.visitante}
                      stadium="" time="Ao vivo" championship={j.campeonato} status="live" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              {jogosProximos.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum jogo agendado.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {jogosProximos.map((j) => (
                    <MatchCard key={j.jogo_id} homeTeam={j.mandante} awayTeam={j.visitante}
                      stadium="" time={j.data_hora} championship={j.campeonato} status="upcoming" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="finalizados">
              {jogosFinaliz.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum jogo finalizado.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {jogosFinaliz.map((j) => (
                    <MatchCard key={j.jogo_id} homeTeam={j.mandante} awayTeam={j.visitante}
                      stadium="" time={j.data_hora} championship={j.campeonato} status="upcoming" />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Jogos;
