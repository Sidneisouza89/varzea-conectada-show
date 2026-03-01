import { useState } from "react";
import { Menu, Search, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import LoginModal from "./LoginModal";
import { API_ENDPOINTS } from "@/lib/api";

const Header = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("varzeando_token");
    localStorage.removeItem("varzeando_user");
    window.location.reload();
  };

  return (
    <>
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
                {isAdmin && (
                  <a
                    href={API_ENDPOINTS.monitoring}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
                  >
                    <Activity className="h-4 w-4" />
                    Monitoramento
                  </a>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                <Search className="h-5 w-5" />
              </Button>

              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline">{user.name}</span>
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setLoginOpen(true)}>
                  <User className="h-5 w-5" />
                </Button>
              )}

              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

export default Header;
