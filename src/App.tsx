import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Times from "./pages/Times";
import TimeDetalhe from "./pages/TimeDetalhe";
import Jogos from "./pages/Jogos";
import JogoDetalhe from "./pages/JogoDetalhe";
import Campeonatos from "./pages/Campeonatos";
import CampeonatoDetalhe from "./pages/CampeonatoDetalhe";
import Estadios from "./pages/Estadios";
import Materias from "./pages/Materias";
import MateriaDetalhe from "./pages/MateriaDetalhe";
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/times" element={<Times />} />
          <Route path="/times/:id" element={<TimeDetalhe />} />
          <Route path="/jogos" element={<Jogos />} />
          <Route path="/jogos/:id" element={<JogoDetalhe />} />
          <Route path="/campeonatos" element={<Campeonatos />} />
          <Route path="/campeonatos/:id" element={<CampeonatoDetalhe />} />
          <Route path="/estadios" element={<Estadios />} />
          <Route path="/materias" element={<Materias />} />
          <Route path="/materias/:id" element={<MateriaDetalhe />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/perfil" element={<Perfil />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
