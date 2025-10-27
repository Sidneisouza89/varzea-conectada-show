import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MatchCard from "./MatchCard";

const MatchesList = () => {
  // Mock data - will be replaced with real data from API
  const liveMatches = [
    {
      homeTeam: "Unidos da Vila",
      awayTeam: "Estrela do Bairro",
      stadium: "Campo do Santos",
      time: "Agora - 2º tempo",
      championship: "Copa Zona Leste",
      status: "live" as const,
      score: "2 - 1"
    },
    {
      homeTeam: "Amigos FC",
      awayTeam: "Raça Tricolor",
      stadium: "Campo da Cohab",
      time: "Agora - 1º tempo",
      championship: "Várzea Master",
      status: "live" as const,
      score: "0 - 0"
    }
  ];

  const upcomingMatches = [
    {
      homeTeam: "Boteco FC",
      awayTeam: "Pelada Roots",
      stadium: "Campo do Parque",
      time: "Hoje às 16:00",
      championship: "Campeonato Regional",
      status: "upcoming" as const
    },
    {
      homeTeam: "Guerreiros da Bola",
      awayTeam: "Vasco da Quebrada",
      stadium: "Estádio Municipal",
      time: "Hoje às 18:00",
      championship: "Liga Metropolitana",
      status: "upcoming" as const
    },
    {
      homeTeam: "Real Madrid da Favela",
      awayTeam: "Ponte Preta FC",
      stadium: "Campo do Jardim",
      time: "Amanhã às 10:00",
      championship: "Copa Zona Leste",
      status: "upcoming" as const
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">
            Jogos de Hoje
          </h2>
          <p className="text-lg text-muted-foreground">
            Confira as partidas acontecendo agora e os próximos jogos
          </p>
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ao Vivo ({liveMatches.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Próximos ({upcomingMatches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((match, index) => (
                <MatchCard key={index} {...match} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMatches.map((match, index) => (
                <MatchCard key={index} {...match} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default MatchesList;
