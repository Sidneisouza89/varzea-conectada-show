import { Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <a href="#jogos" className="text-sm font-medium transition-colors hover:text-primary">
                Jogos
              </a>
              <a href="#times" className="text-sm font-medium transition-colors hover:text-primary">
                Times
              </a>
              <a href="#campeonatos" className="text-sm font-medium transition-colors hover:text-primary">
                Campeonatos
              </a>
              <a href="#estadios" className="text-sm font-medium transition-colors hover:text-primary">
                Estádios
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
