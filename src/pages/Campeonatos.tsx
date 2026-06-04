import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

interface Campeonato {
  campeonato_id: number;
  nome: string;
  tipo_formato: string;
  ativo: boolean;
}

const Campeonatos = () => {
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampeonatos = async () => {
      try {
        const token = localStorage.getItem("varzeando_token");
        const response = await fetch(`${API_BASE_URL}/api/campeonatos`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCampeonatos(data);
        }
      } catch (error) {
        console.error("Erro ao buscar campeonatos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampeonatos();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Campeonatos</h1>
          <p className="text-muted-foreground text-lg">
            Competições de várzea em Diadema
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando campeonatos...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campeonatos.map((c) => (
              <div key={c.campeonato_id} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🏆</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${c.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {c.ativo ? "Ativo" : "Encerrado"}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{c.nome}</h3>
                <p className="text-sm text-muted-foreground">{c.tipo_formato?.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && campeonatos.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhum campeonato encontrado.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Campeonatos;
