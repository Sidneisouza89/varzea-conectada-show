import Logo from "./Logo";
import { Instagram, Twitter, Facebook } from "lucide-react";

const Footer = () => {
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

          {/* Links */}
          <div>
            <h3 className="mb-4 font-bold">Explorar</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-primary">Jogos</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Times</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Campeonatos</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Estádios</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold">Comunidade</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-primary">Cadastre seu time</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Organize campeonatos</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Sobre nós</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">Contato</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 font-bold">Redes Sociais</h3>
            <div className="flex gap-3">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Varzeando. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
