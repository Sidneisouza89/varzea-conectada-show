import Logo from "./Logo";
import { Instagram, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ligaDiademaLogo from "@/assets/parceiro-liga-diadema.png";

// TikTok não existe no lucide-react, usamos SVG customizado
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

// Lista de parceiros — adicione novos objetos aqui conforme as parcerias forem fechando
const parceiros = [
  {
    nome: "Liga de Futebol Amador de Diadema",
    logo: ligaDiademaLogo,
    link: "#", // troque quando tiverem site/instagram da Liga
  },
  // { nome: "Próximo Parceiro", logo: proximoParceiroLogo, link: "https://..." },
];

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo className="mb-4" />
            <p className="text-sm text-muted-foreground">
              A plataforma completa para o futebol de várzea. Encontre jogos, acompanhe times e campeonatos.
            </p>
          </div>
          {/* Explorar */}
          <div>
            <h3 className="mb-4 font-bold">Explorar</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate("/jogos")} className="transition-colors hover:text-primary">Jogos</button></li>
              <li><button onClick={() => navigate("/times")} className="transition-colors hover:text-primary">Times</button></li>
              <li><button onClick={() => navigate("/campeonatos")} className="transition-colors hover:text-primary">Campeonatos</button></li>
              <li><button onClick={() => navigate("/estadios")} className="transition-colors hover:text-primary">Estádios</button></li>
            </ul>
          </div>
          {/* Comunidade */}
          <div>
            <h3 className="mb-4 font-bold">Comunidade</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate("/times")} className="transition-colors hover:text-primary">Cadastre seu time</button></li>
              <li><button onClick={() => navigate("/campeonatos")} className="transition-colors hover:text-primary">Organize campeonatos</button></li>
              <li><a href="#" className="transition-colors hover:text-primary">Sobre nós</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Contato</a></li>
            </ul>
          </div>
          {/* Redes Sociais */}
          <div>
            <h3 className="mb-4 font-bold">Redes Sociais</h3>
            <div className="flex gap-3">
              <a href="https://instagram.com/projeto_varzeando" target="_blank" rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://tiktok.com/@varzeando2026" target="_blank" rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground">
                <TikTokIcon />
              </a>
              <a href="https://youtube.com/@varzeando-v3i?si=6ae3OjtycQn460ZV" target="_blank" rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Parceiros */}
        <div className="mt-12 border-t pt-8">
          <h3 className="mb-6 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Parceiros
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {parceiros.map((parceiro) => (
              <a
                key={parceiro.nome}
                href={parceiro.link}
                target="_blank"
                rel="noopener noreferrer"
                title={parceiro.nome}
                className="grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
              >
                <img
                  src={parceiro.logo}
                  alt={parceiro.nome}
                  className="h-16 w-auto object-contain"
                />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Varzeando. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
