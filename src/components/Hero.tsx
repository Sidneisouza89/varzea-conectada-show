import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
        }} />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl">
            Onde tem jogo<br />de várzea hoje?
          </h1>
          <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">
            Encontre partidas perto de você, acompanhe campeonatos e veja as estatísticas dos times da sua região.
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-2xl">
            <div className="flex flex-col gap-3 rounded-2xl bg-background p-3 shadow-lg md:flex-row">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Sua cidade ou bairro"
                  className="h-12 border-0 pl-10 focus-visible:ring-primary"
                />
              </div>
              <Button size="lg" className="h-12 shadow-glow transition-base hover:scale-105">
                <Search className="mr-2 h-5 w-5" />
                Buscar jogos
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 md:gap-8">
            <div className="rounded-xl bg-background/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-primary-foreground md:text-3xl">150+</div>
              <div className="text-sm text-primary-foreground/80">Jogos hoje</div>
            </div>
            <div className="rounded-xl bg-background/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-primary-foreground md:text-3xl">320</div>
              <div className="text-sm text-primary-foreground/80">Times ativos</div>
            </div>
            <div className="rounded-xl bg-background/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-primary-foreground md:text-3xl">45</div>
              <div className="text-sm text-primary-foreground/80">Campeonatos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
