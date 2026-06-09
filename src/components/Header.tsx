import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, User, Activity, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import LoginModal from "./LoginModal";
import { API_ENDPOINTS } from "@/lib/api";

const NAV_LINKS = [
  { to: "/jogos", label: "Jogos" },
  { to: "/times", label: "Times" },
  { to: "/campeonatos", label: "Campeonatos" },
  { to: "/estadios", label: "Estádios" },
  { to: "/materias", label: "Matérias" },
  { to: "/olheiros", label: "Olheiros" },
];

const Header = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "master" || user?.role === "presidente";
  const isMonitor = isAdmin || user?.role === "admin";

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

            {/* Logo + Nav desktop */}
            <div className="flex items-center gap-8">
              <Link to="/">
                <Logo />
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Painel ADM — só master/presidente */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    title="Painel Administrativo"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                )}

                {/* Monitoramento — discreto */}
                {isMonitor && (
                  <a
                    href={API_ENDPOINTS.monitoring}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                    title="Grafana - Monitoramento"
                  >
                    <Activity className="h-3.5 w-3.5" />
                  </a>
                )}
              </nav>
            </div>

            {/* Ações direita */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                <Search className="h-5 w-5" />
              </Button>

              {user ? (
                <div className="flex items-center gap-2">
                  {/* Badge de role */}
                  <span className={`hidden md:inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === 'master' ? 'bg-primary/10 text-primary' :
                    user.role === 'presidente' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    user.role === 'torcedor' ? 'bg-muted text-muted-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {user.role}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                    <User className="h-5 w-5" />
                    <span className="hidden md:inline">{user.name || user.username}</span>
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setLoginOpen(true)}>
                  <User className="h-5 w-5" />
                </Button>
              )}

              {/* Hamburguer mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium py-2 transition-colors hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-sm font-medium text-primary py-2"
                onClick={() => setMobileOpen(false)}
              >
                <ShieldCheck className="h-4 w-4" />
                Painel Admin
              </Link>
            )}
            {isMonitor && (
              <a
                href={API_ENDPOINTS.monitoring}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                <Activity className="h-4 w-4" />
                Monitoramento
              </a>
            )}
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

export default Header;
