import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MatchCard from "./MatchCard";
import { API_BASE_URL } from "@/lib/api";

interface Jogo {
  jogo_id: number;
  mandante: string;
  visitante: string;
  campeonato: string;
  data_hora: string;
  status: string;
}

const MatchesList = () => {
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

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Carregando jogos...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="jogos" className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">
            Jogos de Hoje
          </h2>
          <p className="text-lg text-muted-foreground">
            Confira as partidas acontecendo agora e os próximos jogos
          </p>
        </div>

        <Tabs defaultValue="finalizados" className="w-full">
          <TabsList className="mb-8 grid w-full max-w-lg mx-auto grid-cols-3">
            <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ao Vivo ({jogosAoVivo.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Próximos ({jogosProximos.length})
            </TabsTrigger>
            <TabsTrigger value="finalizados">
              Finalizados ({jogosFinaliz.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {jogosAoVivo.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum jogo ao vivo no momento.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jogosAoVivo.map((j) => (
                  <MatchCard
                    key={j.jogo_id}
                    homeTeam={j.mandante}
                    awayTeam={j.visitante}
                    stadium=""
                    time="Ao vivo"
                    championship={j.campeonato}
                    status="live"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {jogosProximos.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum jogo agendado.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jogosProximos.map((j) => (
                  <MatchCard
                    key={j.jogo_id}
                    homeTeam={j.mandante}
                    awayTeam={j.visitante}
                    stadium=""
                    time={j.data_hora}
                    championship={j.campeonato}
                    status="upcoming"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="finalizados" className="space-y-4">
            {jogosFinaliz.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum jogo finalizado.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {jogosFinaliz.map((j) => (
                  <MatchCard
                    key={j.jogo_id}
                    homeTeam={j.mandante}
                    awayTeam={j.visitante}
                    stadium=""
                    time={j.data_hora}
                    championship={j.campeonato}
                    status="upcoming"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default MatchesList;
