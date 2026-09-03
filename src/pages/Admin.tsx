import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL, authFetch } from "@/lib/api";
import {
  ShieldCheck, Users, Newspaper, RefreshCw, PlusCircle,
  Trash2, Edit3, Save, X, Swords, Calendar, CalendarClock, CheckCircle2, Trophy, MapPin, Layers, Shirt, Phone,
  ImagePlus, Loader2, KeyRound, Radio, UserRound, Goal, Square, FileText
} from "lucide-react";

interface Usuario { id: number; username: string; role: string; is_active: boolean; }
interface Materia { materia_id: number; titulo: string; conteudo: string; data_publicacao: string; imagem_url?: string | null; curtidas?: number; }
interface Jogo { jogo_id: number; mandante: string; mandante_id: number | null; visitante: string; visitante_id: number | null; campeonato: string; campeonato_id: number | null; data_hora: string; status: string; gols_mandante: number; gols_visitante: number; }
interface EventoSumula { minuto: string; tempo: number | null; jogador: string; time: string; tipo: string; }
interface Sumula { eventos: EventoSumula[]; cartoes: EventoSumula[]; }
interface Time { id: number; nome_oficial: string; apelido?: string; regiao?: string; logo_url?: string | null; }
interface Jogador { jogador_id: number; nome: string; posicao?: string; foto_url?: string | null; cpf_revelado?: string; }
interface Campeonato { campeonato_id: number; nome: string; tipo_formato: string; genero: string; ativo: boolean; }
interface Estadio { id: number; nome_oficial: string; apelido: string; bairro: string; cidade: string; estado: string; }
interface Contato { contato_id: number; nome: string; telefone: string; papel: string; observacoes?: string; campeonato_id: number; campeonato_nome?: string; }
interface MeuCampeonato { campeonato_id: number; nome: string; role: string; }
interface PresidenteAtribuido { usuario_id: number; username: string; }

const ROLES = ["torcedor", "capitao", "delegado", "olheiro", "presidente", "master"];

const FORMATOS = [
  { value: "PONTOS_CORRIDOS", label: "Pontos Corridos" },
  { value: "MATA_MATA", label: "Mata-Mata (eliminação simples)" },
  { value: "GRUPOS_E_MATA_MATA", label: "Grupos + Mata-Mata (tipo Copa do Mundo)" },
  { value: "IDA_E_VOLTA", label: "Ida e Volta (tipo Paulistão)" },
  { value: "PONTOS_CORRIDOS_PLAYOFFS", label: "Pontos Corridos + Playoffs (top 8 vai à chave)" },
];

const GENEROS = ["Masculino", "Feminino", "Misto"];

// Configuração do Cloudinary pra upload de imagem das matérias (unsigned preset, seguro pro frontend)
const CLOUDINARY_CLOUD_NAME = "dw8ive72f";
const CLOUDINARY_UPLOAD_PRESET = "varzeando_materias";

// Sobe uma imagem direto do navegador pro Cloudinary e devolve a URL segura. Lança erro se falhar.
const uploadImagemCloudinary = async (arquivo: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", arquivo);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Falha no upload da imagem.");
  const data = await res.json();
  return data.secure_url as string;
};

type Aba = "usuarios"|"presidentes"|"campeonatos"|"novo_campeonato"|"jogos"|"novo_jogo"|"times"|"novo_time"|"jogadores"|"novo_jogador"|"materias"|"nova_materia"|"editar_materia"|"estadios"|"novo_estadio"|"contatos"|"novo_contato";

// Mensagem padrão quando a sessão expira de vez (falha até na tentativa de refresh)
const SESSION_EXPIRED_MSG = "Sua sessão expirou. Saia e entre novamente no Admin para continuar.";

// Extrai uma mensagem de erro amigável a partir da resposta da API
const extrairMensagemErro = async (res: Response, fallback: string) => {
  if (res.status === 401) return SESSION_EXPIRED_MSG;
  try {
    const data = await res.json();
    return data.message || data.error || data.msg || fallback;
  } catch {
    return fallback;
  }
};

// Converte "DD/MM/YYYY HH:mm" (como vem do backend) para "YYYY-MM-DDTHH:mm" (formato do input datetime-local)
const paraDatetimeLocal = (dataHoraBr: string) => {
  const m = dataHoraBr?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return "";
  const [, dd, mm, yyyy, hh, min] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

// Converte "DD/MM/YYYY HH:mm" em Date, pra permitir ordenação cronológica real na aba Jogos
const paraData = (dataHoraBr: string): Date => {
  const m = dataHoraBr?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return new Date(0);
  const [, dd, mm, yyyy, hh, min] = m;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
};

// Converte "YYYY-MM-DDTHH:mm" (valor do input datetime-local) para "YYYY-MM-DD HH:MM:SS" (formato exigido pelo backend na rota /reagendar)
const paraFormatoBackend = (isoLocal: string) => `${isoLocal.replace("T", " ")}:00`;

interface OpcaoBusca { id: string; label: string }

const SeletorBusca = ({
  opcoes,
  valor,
  onSelecionar,
  placeholder = "Selecione...",
}: {
  opcoes: OpcaoBusca[];
  valor: string;
  onSelecionar: (id: string) => void;
  placeholder?: string;
}) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const opcaoSelecionada = opcoes.find((o) => o.id === valor);

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
        setBusca("");
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const filtradas = busca.trim()
    ? opcoes.filter((o) => o.label.toLowerCase().includes(busca.toLowerCase()))
    : opcoes;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full px-4 py-3 rounded-xl border bg-background text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-between"
      >
        <span className={opcaoSelecionada ? "" : "text-muted-foreground"}>
          {opcaoSelecionada ? opcaoSelecionada.label : placeholder}
        </span>
        <span className="text-muted-foreground text-xs">▾</span>
      </button>
      {aberto && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-background shadow-lg overflow-hidden">
          <input
            autoFocus
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite pra buscar..."
            className="w-full px-4 py-2.5 text-sm border-b focus:outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtradas.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum resultado.</p>
            ) : (
              filtradas.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onSelecionar(o.id); setAberto(false); setBusca(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors ${o.id === valor ? "bg-primary/10 font-medium" : ""}`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("varzeando_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isMaster = user?.role === "master";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [estadios, setEstadios] = useState<Estadio[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [meusCampeonatos, setMeusCampeonatos] = useState<MeuCampeonato[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingJogos, setLoadingJogos] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(true);
  const [loadingEstadios, setLoadingEstadios] = useState(true);
  const [loadingContatos, setLoadingContatos] = useState(true);
  const [aba, setAba] = useState<Aba>(isMaster ? "usuarios" : "campeonatos");
  const [salvando, setSalvando] = useState<number | null>(null);

  // Nova matéria
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [novoImagemUrl, setNovoImagemUrl] = useState("");
  const [enviandoImagemNova, setEnviandoImagemNova] = useState(false);
  const [enviandoFotoTextoNova, setEnviandoFotoTextoNova] = useState(false);
  const novoConteudoRef = useRef<HTMLTextAreaElement>(null);
  const [publicando, setPublicando] = useState(false);
  const [msgPublicacao, setMsgPublicacao] = useState("");

  // Editar matéria
  const [materiaEditando, setMateriaEditando] = useState<Materia | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editConteudo, setEditConteudo] = useState("");
  const [editImagemUrl, setEditImagemUrl] = useState("");
  const [enviandoImagemEdit, setEnviandoImagemEdit] = useState(false);
  const [enviandoFotoTextoEdit, setEnviandoFotoTextoEdit] = useState(false);
  const editConteudoRef = useRef<HTMLTextAreaElement>(null);
  const [salvandoMateria, setSalvandoMateria] = useState(false);
  const [msgEditMateria, setMsgEditMateria] = useState("");

  // Novo jogo
  const [novoJogo, setNovoJogo] = useState({ campeonato_id: "", time_mandante_id: "", time_visitante_id: "", data_hora: "", estadio_id: "" });
  const [agendando, setAgendando] = useState(false);
  const [msgJogo, setMsgJogo] = useState("");

  // Novo campeonato
  const [novoCamp, setNovoCamp] = useState({ nome: "", tipo_formato: "PONTOS_CORRIDOS", genero: "Masculino", pontos_vitoria: "3", pontos_empate: "1", pontos_derrota: "0" });
  const [criandoCamp, setCriandoCamp] = useState(false);
  const [msgCamp, setMsgCamp] = useState("");

  // Editar campeonato
  const [campEditando, setCampEditando] = useState<number | null>(null);
  const [campEditNome, setCampEditNome] = useState("");
  const [campEditFormato, setCampEditFormato] = useState("");
  const [campEditGenero, setCampEditGenero] = useState("Masculino");
  const [salvandoCamp, setSalvandoCamp] = useState(false);

  // Novo time
  const [novoTimeForm, setNovoTimeForm] = useState({ nome_oficial: "", apelido: "", regiao: "Diadema", logo_url: "" });
  const [criandoTime, setCriandoTime] = useState(false);
  const [msgTime, setMsgTime] = useState("");

  // Editar time
  const [timeEditando, setTimeEditando] = useState<Time | null>(null);
  const [timeEdit, setTimeEdit] = useState({ nome_oficial: "", apelido: "", regiao: "", logo_url: "" });
  const [salvandoTime, setSalvandoTime] = useState(false);

  // Jogadores — elenco de um time escolhido
  const [timeSelecionadoJogadores, setTimeSelecionadoJogadores] = useState("");
  const [jogadoresDoTime, setJogadoresDoTime] = useState<Jogador[]>([]);
  const [carregandoJogadoresTime, setCarregandoJogadoresTime] = useState(false);

  // Número de camisa — depende de time + campeonato selecionados
  const [campeonatoSelecionadoJogadores, setCampeonatoSelecionadoJogadores] = useState("");
  const [numerosPorJogador, setNumerosPorJogador] = useState<Record<number, number | null>>({});
  const [carregandoNumeros, setCarregandoNumeros] = useState(false);
  const [editandoNumeroJogadorId, setEditandoNumeroJogadorId] = useState<number | null>(null);
  const [numeroInputValor, setNumeroInputValor] = useState("");
  const [salvandoNumero, setSalvandoNumero] = useState<number | null>(null);

  // Novo jogador
  const [novoJogadorForm, setNovoJogadorForm] = useState({ nome: "", time_id: "", posicao: "", cpf: "", data_nascimento: "", foto_url: "" });
  const [criandoJogador, setCriandoJogador] = useState(false);
  const [msgJogador, setMsgJogador] = useState("");
  const [enviandoFotoJogadorNovo, setEnviandoFotoJogadorNovo] = useState(false);

  // Editar jogador
  const [jogadorEditando, setJogadorEditando] = useState<Jogador | null>(null);
  const [jogadorEdit, setJogadorEdit] = useState({ nome: "", posicao: "", foto_url: "" });
  const [salvandoJogador, setSalvandoJogador] = useState(false);
  const [enviandoFotoJogadorEdit, setEnviandoFotoJogadorEdit] = useState(false);

  // Novo estádio
  const [novoEstadio, setNovoEstadio] = useState({ nome_oficial: "", apelido: "", rua: "", numero: "", bairro: "", cidade: "Diadema", estado: "SP", cep: "" });
  const [criandoEstadio, setCriandoEstadio] = useState(false);
  const [msgEstadio, setMsgEstadio] = useState("");

  // Editar estádio
  const [estadioEditando, setEstadioEditando] = useState<Estadio | null>(null);
  const [estadioEdit, setEstadioEdit] = useState({ nome_oficial: "", apelido: "", bairro: "", cidade: "", estado: "" });
  const [salvandoEstadio, setSalvandoEstadio] = useState(false);

  // Novo contato
  const [novoContato, setNovoContato] = useState({ nome: "", telefone: "", papel: "", observacoes: "", campeonato_id: "" });
  const [criandoContato, setCriandoContato] = useState(false);
  const [msgContato, setMsgContato] = useState("");

  // Editar contato
  const [contatoEditando, setContatoEditando] = useState<Contato | null>(null);
  const [contatoEdit, setContatoEdit] = useState({ nome: "", telefone: "", papel: "", observacoes: "", campeonato_id: "" });
  const [salvandoContato, setSalvandoContato] = useState(false);

  // Placar rápido (finalizar)
  const [placar, setPlacar] = useState<Record<number, { m: string; v: string }>>({});
  const [finalizando, setFinalizando] = useState<number | null>(null);

  // Editar placar
  const [editando, setEditando] = useState<number | null>(null);
  const [placarEdit, setPlacarEdit] = useState<{ m: string; v: string }>({ m: "", v: "" });
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  // Reagendar jogo (RF-08)
  const [reagendando, setReagendando] = useState<number | null>(null);
  const [reagendarForm, setReagendarForm] = useState<{ data_hora: string; estadio_id: string }>({ data_hora: "", estadio_id: "" });
  const [salvandoReagendamento, setSalvandoReagendamento] = useState(false);

  // Súmula (gol/cartão) de um jogo específico, editável direto na aba Jogos
  const [jogoSumulaAberta, setJogoSumulaAberta] = useState<number | null>(null);
  const [sumulaPorJogo, setSumulaPorJogo] = useState<Record<number, Sumula>>({});
  const [carregandoSumula, setCarregandoSumula] = useState<number | null>(null);
  const [elencoParaSumula, setElencoParaSumula] = useState<Record<number, Jogador[]>>({});
  const [carregandoElencoSumula, setCarregandoElencoSumula] = useState<number | null>(null);
  const [modalSumulaTipo, setModalSumulaTipo] = useState<"gol" | "cartao" | null>(null);
  const [modalSumulaJogoId, setModalSumulaJogoId] = useState<number | null>(null);
  const [modalSumulaTimeId, setModalSumulaTimeId] = useState<number | null>(null);
  const [modalSumulaTimeNome, setModalSumulaTimeNome] = useState("");
  const [modalSumulaJogadorId, setModalSumulaJogadorId] = useState("");
  const [modalSumulaMinuto, setModalSumulaMinuto] = useState("");
  const [modalSumulaTempo, setModalSumulaTempo] = useState<string>("");
  const [modalSumulaCartaoTipo, setModalSumulaCartaoTipo] = useState<"amarelo" | "vermelho">("amarelo");
  const [processandoSumula, setProcessandoSumula] = useState(false);

  // Presidentes por campeonato (aba master-only)
  const [presidentesPorCamp, setPresidentesPorCamp] = useState<Record<number, PresidenteAtribuido[]>>({});
  const [carregandoPresidentes, setCarregandoPresidentes] = useState<number | null>(null);
  const [campExpandido, setCampExpandido] = useState<number | null>(null);
  const [novoPresidenteId, setNovoPresidenteId] = useState<Record<number, string>>({});
  const [atribuindoPresidente, setAtribuindoPresidente] = useState<number | null>(null);
  const [msgPresidentes, setMsgPresidentes] = useState<Record<number, string>>({});

  // Verificação de acesso ao Admin: master sempre entra; qualquer outro usuário
  // só entra se tiver pelo menos 1 campeonato atribuído (role escopado via
  // CampeonatoUsuarioRole). Precisa ser assíncrono porque o role global salvo
  // no login (user.role) não reflete mais quem é presidente — isso agora só
  // vive no backend, escopado por campeonato.
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  useEffect(() => {
    const verificarAcesso = async () => {
      if (!user) { navigate("/"); return; }
      if (user.role === "master") { setVerificandoAcesso(false); return; }
      try {
        const res = await authFetch(`${API_BASE_URL}/api/meus-campeonatos-admin`);
        if (res.ok) {
          const data: MeuCampeonato[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMeusCampeonatos(data);
            setVerificandoAcesso(false);
            return;
          }
        }
      } catch { /* segue pro redirect abaixo */ }
      navigate("/");
    };
    verificarAcesso();
  }, []);

  const fetchUsuarios = async () => {
    setLoadingUsers(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/usuarios`);
      if (res.ok) setUsuarios(await res.json());
    } finally { setLoadingUsers(false); }
  };
  const fetchMaterias = async () => { setLoadingMaterias(true); try { const res = await fetch(`${API_BASE_URL}/api/materias`); if (res.ok) setMaterias(await res.json()); } finally { setLoadingMaterias(false); } };
  const fetchJogos = async () => { setLoadingJogos(true); try { const res = await fetch(`${API_BASE_URL}/api/jogos`); if (res.ok) setJogos(await res.json()); } finally { setLoadingJogos(false); } };
  const fetchTimes = async () => { setLoadingTimes(true); try { const res = await fetch(`${API_BASE_URL}/api/times`); if (res.ok) setTimes(await res.json()); } finally { setLoadingTimes(false); } };
  const fetchCampeonatos = async () => { const res = await fetch(`${API_BASE_URL}/api/campeonatos`); if (res.ok) setCampeonatos(await res.json()); };
  const fetchEstadios = async () => { setLoadingEstadios(true); try { const res = await fetch(`${API_BASE_URL}/api/estadios`); if (res.ok) setEstadios(await res.json()); } finally { setLoadingEstadios(false); } };
  const fetchContatos = async () => { setLoadingContatos(true); try { const res = await authFetch(`${API_BASE_URL}/api/contatos`); if (res.ok) setContatos(await res.json()); } finally { setLoadingContatos(false); } };
  const fetchMeusCampeonatos = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/meus-campeonatos-admin`);
      if (res.ok) setMeusCampeonatos(await res.json());
    } catch { /* silencioso: se falhar, a lista de campeonatos visíveis fica vazia pra não-master */ }
  };

  useEffect(() => {
    if (verificandoAcesso) return;
    fetchUsuarios(); fetchMaterias(); fetchJogos(); fetchTimes(); fetchCampeonatos(); fetchEstadios(); fetchContatos();
  }, [verificandoAcesso]);

  // Campeonatos que o usuário logado pode de fato administrar: master vê todos,
  // qualquer outro usuário só vê os que aparecem em /api/meus-campeonatos-admin
  // (hoje, na prática, só quem tem role 'presidente' escopado por campeonato).
  const campeonatosPermitidos = isMaster
    ? campeonatos
    : campeonatos.filter((c) => meusCampeonatos.some((mc) => mc.campeonato_id === c.campeonato_id));

  // Mesma lógica pra jogos: master vê todos, os demais só veem jogos dos
  // campeonatos que administram. Amistosos (campeonato_id null) só aparecem
  // pra master, já que não pertencem a nenhum campeonato escopável.
  const jogosPermitidos = isMaster
    ? jogos
    : jogos.filter((j) => j.campeonato_id !== null && meusCampeonatos.some((mc) => mc.campeonato_id === j.campeonato_id));

  const fetchPresidentesDoCamp = async (campId: number) => {
    setCarregandoPresidentes(campId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/campeonatos/${campId}/presidentes`);
      if (res.ok) {
        const data = await res.json();
        setPresidentesPorCamp((prev) => ({ ...prev, [campId]: data }));
      }
    } finally { setCarregandoPresidentes(null); }
  };

  const alternarExpandirCamp = (campId: number) => {
    if (campExpandido === campId) { setCampExpandido(null); return; }
    setCampExpandido(campId);
    if (!presidentesPorCamp[campId]) fetchPresidentesDoCamp(campId);
  };

  const atribuirPresidente = async (campId: number) => {
    const usuarioId = novoPresidenteId[campId];
    if (!usuarioId) return;
    setAtribuindoPresidente(campId);
    setMsgPresidentes((prev) => ({ ...prev, [campId]: "" }));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/campeonatos/${campId}/presidentes`, {
        method: "POST", body: JSON.stringify({ usuario_id: parseInt(usuarioId) }),
      });
      if (res.ok) {
        setNovoPresidenteId((prev) => ({ ...prev, [campId]: "" }));
        fetchPresidentesDoCamp(campId);
      } else {
        setMsgPresidentes((prev) => ({ ...prev, [campId]: "" }));
        alert(await extrairMensagemErro(res, "Erro ao atribuir presidente."));
      }
    } catch (err) {
      alert("Erro de conexão ao atribuir presidente.");
    } finally { setAtribuindoPresidente(null); }
  };

  const removerPresidente = async (campId: number, usuarioId: number) => {
    if (!confirm("Remover o acesso de presidente deste usuário neste campeonato?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/campeonatos/${campId}/presidentes/${usuarioId}`, { method: "DELETE" });
      if (res.ok) {
        setPresidentesPorCamp((prev) => ({ ...prev, [campId]: (prev[campId] ?? []).filter((p) => p.usuario_id !== usuarioId) }));
      } else {
        alert(await extrairMensagemErro(res, "Erro ao remover presidente."));
      }
    } catch (err) {
      alert("Erro de conexão ao remover presidente.");
    }
  };

  const mudarRole = async (userId: number, novoRole: string) => {
    setSalvando(userId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/usuarios/${userId}/role`, { method: "PUT", body: JSON.stringify({ role: novoRole }) });
      if (res.ok) {
        setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, role: novoRole } : u));
      } else {
        alert(await extrairMensagemErro(res, "Erro ao atualizar o papel do usuário."));
      }
    } catch (err) {
      alert("Erro de conexão ao atualizar o papel do usuário.");
    } finally { setSalvando(null); }
  };

  const resetarSenha = async (userId: number, username: string) => {
    const novaSenha = window.prompt(`Nova senha pra '${username}' (mínimo 6 caracteres):`, "");
    if (novaSenha === null) return; // cancelou
    if (novaSenha.length < 6) { alert("A senha precisa ter pelo menos 6 caracteres."); return; }
    setSalvando(userId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/admin/usuarios/${userId}/resetar-senha`, { method: "PUT", body: JSON.stringify({ nova_senha: novaSenha }) });
      if (res.ok) {
        alert(`✅ Senha de '${username}' resetada!`);
      } else {
        alert(await extrairMensagemErro(res, "Erro ao resetar senha."));
      }
    } catch (err) {
      alert("Erro de conexão ao resetar senha.");
    } finally { setSalvando(null); }
  };

  const deletarMateria = async (id: number) => {
    if (!confirm("Remover esta matéria?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/materias/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMaterias((prev) => prev.filter((m) => m.materia_id !== id));
      } else {
        alert(await extrairMensagemErro(res, "Erro ao remover matéria."));
      }
    } catch (err) {
      alert("Erro de conexão ao remover matéria.");
    }
  };

  const abrirEdicaoMateria = (m: Materia) => {
    setMateriaEditando(m);
    setEditTitulo(m.titulo);
    setEditConteudo(m.conteudo ?? "");
    setEditImagemUrl(m.imagem_url ?? "");
    setMsgEditMateria("");
    setAba("editar_materia");
  };

  const handleUploadImagemEdit = async (arquivo: File) => {
    setEnviandoImagemEdit(true); setMsgEditMateria("");
    try {
      const url = await uploadImagemCloudinary(arquivo);
      setEditImagemUrl(url);
    } catch (err) {
      setMsgEditMateria("Erro ao enviar a imagem. Tenta de novo.");
    } finally { setEnviandoImagemEdit(false); }
  };

  const handleInserirFotoNoTextoEdit = async (arquivo: File) => {
    setEnviandoFotoTextoEdit(true); setMsgEditMateria("");
    try {
      const url = await uploadImagemCloudinary(arquivo);
      const legenda = (window.prompt("Legenda da foto (deixe em branco se não quiser legenda):", "") ?? "").trim();
      const textarea = editConteudoRef.current;
      const posicao = textarea?.selectionStart ?? editConteudo.length;
      const trecho = `\n![${legenda}](${url})\n`;
      const novoTexto = editConteudo.slice(0, posicao) + trecho + editConteudo.slice(posicao);
      setEditConteudo(novoTexto);
      requestAnimationFrame(() => {
        textarea?.focus();
        const novaPosicao = posicao + trecho.length;
        textarea?.setSelectionRange(novaPosicao, novaPosicao);
      });
    } catch (err) {
      setMsgEditMateria("Erro ao enviar a foto pro texto. Tenta de novo.");
    } finally { setEnviandoFotoTextoEdit(false); }
  };

  const salvarEdicaoMateria = async () => {
    if (!materiaEditando) return;
    if (!editTitulo.trim() || !editConteudo.trim()) { setMsgEditMateria("Preencha título e conteúdo."); return; }
    setSalvandoMateria(true); setMsgEditMateria("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/materias/${materiaEditando.materia_id}`, {
        method: "PUT", body: JSON.stringify({ titulo: editTitulo, conteudo: editConteudo, imagem_url: editImagemUrl }),
      });
      if (res.ok) { setMsgEditMateria("✅ Matéria atualizada!"); fetchMaterias(); setTimeout(() => setAba("materias"), 1500); }
      else { setMsgEditMateria(await extrairMensagemErro(res, "Erro ao salvar.")); }
    } catch (err) {
      setMsgEditMateria("Erro de conexão ao salvar.");
    } finally { setSalvandoMateria(false); }
  };

  const handleUploadImagemNova = async (arquivo: File) => {
    setEnviandoImagemNova(true); setMsgPublicacao("");
    try {
      const url = await uploadImagemCloudinary(arquivo);
      setNovoImagemUrl(url);
    } catch (err) {
      setMsgPublicacao("Erro ao enviar a imagem. Tenta de novo.");
    } finally { setEnviandoImagemNova(false); }
  };

  // Sobe uma foto, pergunta a legenda numa caixinha simples, e cola "![legenda](url)" pronto e correto
  // no ponto onde o cursor estiver dentro do textarea de conteúdo (evita o usuário editar a sintaxe à mão e quebrar ela)
  const handleInserirFotoNoTexto = async (arquivo: File) => {
    setEnviandoFotoTextoNova(true); setMsgPublicacao("");
    try {
      const url = await uploadImagemCloudinary(arquivo);
      const legenda = (window.prompt("Legenda da foto (deixe em branco se não quiser legenda):", "") ?? "").trim();
      const textarea = novoConteudoRef.current;
      const posicao = textarea?.selectionStart ?? novoConteudo.length;
      const trecho = `\n![${legenda}](${url})\n`;
      const novoTexto = novoConteudo.slice(0, posicao) + trecho + novoConteudo.slice(posicao);
      setNovoConteudo(novoTexto);
      // devolve o foco pro textarea, logo depois do trecho inserido
      requestAnimationFrame(() => {
        textarea?.focus();
        const novaPosicao = posicao + trecho.length;
        textarea?.setSelectionRange(novaPosicao, novaPosicao);
      });
    } catch (err) {
      setMsgPublicacao("Erro ao enviar a foto pro texto. Tenta de novo.");
    } finally { setEnviandoFotoTextoNova(false); }
  };

  const publicarMateria = async () => {
    if (!novoTitulo.trim() || !novoConteudo.trim()) { setMsgPublicacao("Preencha título e conteúdo."); return; }
    setPublicando(true); setMsgPublicacao("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/materias`, { method: "POST", body: JSON.stringify({ titulo: novoTitulo, conteudo: novoConteudo, imagem_url: novoImagemUrl || null }) });
      if (res.ok) { setMsgPublicacao("✅ Matéria publicada!"); setNovoTitulo(""); setNovoConteudo(""); setNovoImagemUrl(""); fetchMaterias(); setTimeout(() => setAba("materias"), 1500); }
      else { setMsgPublicacao(await extrairMensagemErro(res, "Erro ao publicar.")); }
    } catch (err) {
      setMsgPublicacao("Erro de conexão ao publicar.");
    } finally { setPublicando(false); }
  };

  const abrirEdicaoCamp = (c: Campeonato) => {
    setCampEditando(c.campeonato_id);
    setCampEditNome(c.nome);
    setCampEditFormato(c.tipo_formato);
    setCampEditGenero(c.genero ?? "Masculino");
  };

  const salvarEdicaoCamp = async (campId: number) => {
    if (!campEditNome.trim()) return;
    setSalvandoCamp(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/campeonatos/${campId}`, {
        method: "PUT", body: JSON.stringify({ nome: campEditNome, tipo_formato: campEditFormato, genero: campEditGenero }),
      });
      if (res.ok) { setCampEditando(null); fetchCampeonatos(); }
      else { alert(await extrairMensagemErro(res, "Erro ao salvar campeonato.")); }
    } catch (err) {
      alert("Erro de conexão ao salvar campeonato.");
    } finally { setSalvandoCamp(false); }
  };

  const agendarJogo = async () => {
    if (!novoJogo.time_mandante_id || !novoJogo.time_visitante_id || !novoJogo.data_hora) { setMsgJogo("Preencha mandante, visitante e data/hora."); return; }
    if (novoJogo.time_mandante_id === novoJogo.time_visitante_id) { setMsgJogo("Mandante e visitante não podem ser o mesmo time."); return; }
    setAgendando(true); setMsgJogo("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos`, {
        method: "POST",
        body: JSON.stringify({
          campeonato_id: novoJogo.campeonato_id ? parseInt(novoJogo.campeonato_id) : null,
          time_mandante_id: parseInt(novoJogo.time_mandante_id),
          time_visitante_id: parseInt(novoJogo.time_visitante_id),
          data_hora: novoJogo.data_hora,
          estadio_id: novoJogo.estadio_id ? parseInt(novoJogo.estadio_id) : null,
        }),
      });
      if (res.ok) { setMsgJogo("✅ Jogo agendado!"); setNovoJogo({ campeonato_id: "", time_mandante_id: "", time_visitante_id: "", data_hora: "", estadio_id: "" }); fetchJogos(); setTimeout(() => setAba("jogos"), 1500); }
      else { setMsgJogo(await extrairMensagemErro(res, "Erro ao agendar jogo.")); }
    } catch (err) {
      setMsgJogo("Erro de conexão ao agendar jogo.");
    } finally { setAgendando(false); }
  };

  const criarCampeonato = async () => {
    if (!novoCamp.nome.trim()) { setMsgCamp("Preencha o nome do campeonato."); return; }
    setCriandoCamp(true); setMsgCamp("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/campeonatos`, { method: "POST", body: JSON.stringify({ nome: novoCamp.nome, tipo_formato: novoCamp.tipo_formato, genero: novoCamp.genero, pontos_vitoria: parseInt(novoCamp.pontos_vitoria), pontos_empate: parseInt(novoCamp.pontos_empate), pontos_derrota: parseInt(novoCamp.pontos_derrota) }) });
      if (res.ok) { setMsgCamp("✅ Campeonato criado!"); setNovoCamp({ nome: "", tipo_formato: "PONTOS_CORRIDOS", genero: "Masculino", pontos_vitoria: "3", pontos_empate: "1", pontos_derrota: "0" }); fetchCampeonatos(); setTimeout(() => setAba("campeonatos"), 1500); }
      else { setMsgCamp(await extrairMensagemErro(res, "Erro ao criar campeonato.")); }
    } catch (err) {
      setMsgCamp("Erro de conexão ao criar campeonato.");
    } finally { setCriandoCamp(false); }
  };

  const criarTime = async () => {
    if (!novoTimeForm.nome_oficial.trim()) { setMsgTime("Preencha o nome oficial do time."); return; }
    setCriandoTime(true); setMsgTime("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/times`, { method: "POST", body: JSON.stringify(novoTimeForm) });
      if (res.ok) { setMsgTime("✅ Time cadastrado!"); setNovoTimeForm({ nome_oficial: "", apelido: "", regiao: "Diadema", logo_url: "" }); fetchTimes(); setTimeout(() => setAba("times"), 1500); }
      else { setMsgTime(await extrairMensagemErro(res, "Erro ao cadastrar time.")); }
    } catch (err) {
      setMsgTime("Erro de conexão ao cadastrar time.");
    } finally { setCriandoTime(false); }
  };

  const abrirEdicaoTime = (t: Time) => {
    setTimeEditando(t);
    setTimeEdit({ nome_oficial: t.nome_oficial, apelido: t.apelido ?? "", regiao: t.regiao ?? "", logo_url: t.logo_url ?? "" });
  };

  const salvarEdicaoTime = async () => {
    if (!timeEditando) return;
    setSalvandoTime(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/times/${timeEditando.id}`, { method: "PUT", body: JSON.stringify(timeEdit) });
      if (res.ok) { setTimeEditando(null); fetchTimes(); }
      else { alert(await extrairMensagemErro(res, "Erro ao salvar time.")); }
    } catch (err) {
      alert("Erro de conexão ao salvar time.");
    } finally { setSalvandoTime(false); }
  };

  const fetchJogadoresDoTime = async (timeId: string) => {
    if (!timeId) { setJogadoresDoTime([]); return; }
    setCarregandoJogadoresTime(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/times/${timeId}/jogadores`);
      if (res.ok) setJogadoresDoTime(await res.json());
      else { setJogadoresDoTime([]); alert(await extrairMensagemErro(res, "Erro ao carregar elenco.")); }
    } catch (err) {
      alert("Erro de conexão ao carregar elenco.");
    } finally { setCarregandoJogadoresTime(false); }
  };

  const selecionarTimeJogadores = (timeId: string) => {
    setTimeSelecionadoJogadores(timeId);
    fetchJogadoresDoTime(timeId);
    setNumerosPorJogador({});
    if (campeonatoSelecionadoJogadores) fetchNumerosCamisa(timeId, campeonatoSelecionadoJogadores);
  };

  const fetchNumerosCamisa = async (timeId: string, campeonatoId: string) => {
    if (!timeId || !campeonatoId) { setNumerosPorJogador({}); return; }
    setCarregandoNumeros(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/times/${timeId}/elenco-publico?campeonato_id=${campeonatoId}`);
      if (res.ok) {
        const data: { jogador_id: number; numero_camisa: number | null }[] = await res.json();
        const mapa: Record<number, number | null> = {};
        data.forEach((j) => { mapa[j.jogador_id] = j.numero_camisa; });
        setNumerosPorJogador(mapa);
      }
    } finally { setCarregandoNumeros(false); }
  };

  const selecionarCampeonatoJogadores = (campId: string) => {
    setCampeonatoSelecionadoJogadores(campId);
    if (timeSelecionadoJogadores) fetchNumerosCamisa(timeSelecionadoJogadores, campId);
  };

  const abrirEdicaoNumero = (jogadorId: number) => {
    setEditandoNumeroJogadorId(jogadorId);
    setNumeroInputValor(numerosPorJogador[jogadorId] != null ? String(numerosPorJogador[jogadorId]) : "");
  };

  const salvarNumeroCamisa = async (jogadorId: number) => {
    if (!timeSelecionadoJogadores || !campeonatoSelecionadoJogadores || !numeroInputValor) return;
    setSalvandoNumero(jogadorId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogadores/${jogadorId}/camisa`, {
        method: "POST",
        body: JSON.stringify({
          time_id: parseInt(timeSelecionadoJogadores),
          campeonato_id: parseInt(campeonatoSelecionadoJogadores),
          numero_camisa: parseInt(numeroInputValor),
        }),
      });
      if (res.ok) {
        setEditandoNumeroJogadorId(null);
        fetchNumerosCamisa(timeSelecionadoJogadores, campeonatoSelecionadoJogadores);
      } else {
        alert(await extrairMensagemErro(res, "Erro ao salvar número de camisa."));
      }
    } catch (err) {
      alert("Erro de conexão ao salvar número de camisa.");
    } finally { setSalvandoNumero(null); }
  };

  const removerNumeroCamisa = async (jogadorId: number) => {
    if (!timeSelecionadoJogadores || !campeonatoSelecionadoJogadores) return;
    if (!confirm("Remover o número de camisa desse jogador nesse campeonato?")) return;
    setSalvandoNumero(jogadorId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogadores/${jogadorId}/camisa?time_id=${timeSelecionadoJogadores}&campeonato_id=${campeonatoSelecionadoJogadores}`, { method: "DELETE" });
      if (res.ok) {
        fetchNumerosCamisa(timeSelecionadoJogadores, campeonatoSelecionadoJogadores);
      } else {
        alert(await extrairMensagemErro(res, "Erro ao remover número de camisa."));
      }
    } catch (err) {
      alert("Erro de conexão ao remover número de camisa.");
    } finally { setSalvandoNumero(null); }
  };

  const handleUploadFotoJogadorNovo = async (arquivo: File) => {
    setEnviandoFotoJogadorNovo(true); setMsgJogador("");
    try {
      const url = await uploadImagemCloudinary(arquivo);
      setNovoJogadorForm((p) => ({ ...p, foto_url: url }));
    } catch (err) {
      setMsgJogador("Erro ao enviar a foto. Tenta de novo.");
    } finally { setEnviandoFotoJogadorNovo(false); }
  };

  const criarJogador = async () => {
    if (!novoJogadorForm.nome.trim() || !novoJogadorForm.time_id || !novoJogadorForm.cpf.trim() || !novoJogadorForm.data_nascimento) {
      setMsgJogador("Preencha nome, time, CPF e data de nascimento.");
      return;
    }
    setCriandoJogador(true); setMsgJogador("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogadores`, {
        method: "POST",
        body: JSON.stringify({
          nome: novoJogadorForm.nome,
          time_id: parseInt(novoJogadorForm.time_id),
          posicao: novoJogadorForm.posicao,
          cpf: novoJogadorForm.cpf,
          data_nascimento: novoJogadorForm.data_nascimento,
          foto_url: novoJogadorForm.foto_url || null,
        }),
      });
      if (res.ok) {
        setMsgJogador("✅ Jogador cadastrado!");
        setNovoJogadorForm({ nome: "", time_id: "", posicao: "", cpf: "", data_nascimento: "", foto_url: "" });
        if (timeSelecionadoJogadores) fetchJogadoresDoTime(timeSelecionadoJogadores);
        setTimeout(() => setAba("jogadores"), 1500);
      } else {
        setMsgJogador(await extrairMensagemErro(res, "Erro ao cadastrar jogador."));
      }
    } catch (err) {
      setMsgJogador("Erro de conexão ao cadastrar jogador.");
    } finally { setCriandoJogador(false); }
  };

  const abrirEdicaoJogador = (j: Jogador) => {
    setJogadorEditando(j);
    setJogadorEdit({ nome: j.nome, posicao: j.posicao ?? "", foto_url: j.foto_url ?? "" });
  };

  const handleUploadFotoJogadorEdit = async (arquivo: File) => {
    setEnviandoFotoJogadorEdit(true);
    try {
      const url = await uploadImagemCloudinary(arquivo);
      setJogadorEdit((p) => ({ ...p, foto_url: url }));
    } catch (err) {
      alert("Erro ao enviar a foto. Tenta de novo.");
    } finally { setEnviandoFotoJogadorEdit(false); }
  };

  const salvarEdicaoJogador = async () => {
    if (!jogadorEditando) return;
    setSalvandoJogador(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogadores/${jogadorEditando.jogador_id}`, { method: "PUT", body: JSON.stringify(jogadorEdit) });
      if (res.ok) {
        setJogadorEditando(null);
        if (timeSelecionadoJogadores) fetchJogadoresDoTime(timeSelecionadoJogadores);
      } else {
        alert(await extrairMensagemErro(res, "Erro ao salvar jogador."));
      }
    } catch (err) {
      alert("Erro de conexão ao salvar jogador.");
    } finally { setSalvandoJogador(false); }
  };

  const criarEstadio = async () => {
    if (!novoEstadio.nome_oficial.trim()) { setMsgEstadio("Preencha o nome do estádio."); return; }
    setCriandoEstadio(true); setMsgEstadio("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/estadios`, { method: "POST", body: JSON.stringify(novoEstadio) });
      if (res.ok) { setMsgEstadio("✅ Estádio cadastrado!"); setNovoEstadio({ nome_oficial: "", apelido: "", rua: "", numero: "", bairro: "", cidade: "Diadema", estado: "SP", cep: "" }); fetchEstadios(); setTimeout(() => setAba("estadios"), 1500); }
      else { setMsgEstadio(await extrairMensagemErro(res, "Erro ao cadastrar estádio.")); }
    } catch (err) {
      setMsgEstadio("Erro de conexão ao cadastrar estádio.");
    } finally { setCriandoEstadio(false); }
  };

  const abrirEdicaoEstadio = (e: Estadio) => {
    setEstadioEditando(e);
    setEstadioEdit({ nome_oficial: e.nome_oficial, apelido: e.apelido ?? "", bairro: e.bairro ?? "", cidade: e.cidade, estado: e.estado });
  };

  const salvarEdicaoEstadio = async () => {
    if (!estadioEditando) return;
    setSalvandoEstadio(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/estadios/${estadioEditando.id}`, {
        method: "PUT", body: JSON.stringify(estadioEdit),
      });
      if (res.ok) { setEstadioEditando(null); fetchEstadios(); }
      else { alert(await extrairMensagemErro(res, "Erro ao salvar estádio.")); }
    } catch (err) {
      alert("Erro de conexão ao salvar estádio.");
    } finally { setSalvandoEstadio(false); }
  };

  const criarContato = async () => {
    if (!novoContato.nome.trim() || !novoContato.campeonato_id) { setMsgContato("Preencha nome e campeonato."); return; }
    setCriandoContato(true); setMsgContato("");
    try {
      const res = await authFetch(`${API_BASE_URL}/api/contatos`, {
        method: "POST",
        body: JSON.stringify({
          nome: novoContato.nome,
          telefone: novoContato.telefone,
          papel: novoContato.papel,
          observacoes: novoContato.observacoes,
          campeonato_id: parseInt(novoContato.campeonato_id),
        }),
      });
      if (res.ok) { setMsgContato("✅ Contato cadastrado!"); setNovoContato({ nome: "", telefone: "", papel: "", observacoes: "", campeonato_id: "" }); fetchContatos(); setTimeout(() => setAba("contatos"), 1500); }
      else { setMsgContato(await extrairMensagemErro(res, "Erro ao cadastrar contato.")); }
    } catch (err) {
      setMsgContato("Erro de conexão ao cadastrar contato.");
    } finally { setCriandoContato(false); }
  };

  const abrirEdicaoContato = (c: Contato) => {
    setContatoEditando(c);
    setContatoEdit({ nome: c.nome, telefone: c.telefone ?? "", papel: c.papel ?? "", observacoes: c.observacoes ?? "", campeonato_id: String(c.campeonato_id) });
  };

  const salvarEdicaoContato = async () => {
    if (!contatoEditando) return;
    setSalvandoContato(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/contatos/${contatoEditando.contato_id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: contatoEdit.nome,
          telefone: contatoEdit.telefone,
          papel: contatoEdit.papel,
          observacoes: contatoEdit.observacoes,
          campeonato_id: parseInt(contatoEdit.campeonato_id),
        }),
      });
      if (res.ok) { setContatoEditando(null); fetchContatos(); }
      else { alert(await extrairMensagemErro(res, "Erro ao salvar contato.")); }
    } catch (err) {
      alert("Erro de conexão ao salvar contato.");
    } finally { setSalvandoContato(false); }
  };

  const deletarContato = async (id: number) => {
    if (!confirm("Remover este contato?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/contatos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContatos((prev) => prev.filter((c) => c.contato_id !== id));
      } else {
        alert(await extrairMensagemErro(res, "Erro ao remover contato."));
      }
    } catch (err) {
      alert("Erro de conexão ao remover contato.");
    }
  };

  const finalizarJogo = async (jogoId: number) => {
    const p = placar[jogoId];
    if (!p || p.m === "" || p.v === "") { alert("Preencha o placar antes de finalizar."); return; }
    setFinalizando(jogoId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoId}/finalizar`, { method: "POST", body: JSON.stringify({ gols_mandante: parseInt(p.m), gols_visitante: parseInt(p.v) }) });
      if (res.ok) {
        fetchJogos();
        setPlacar((prev) => { const n = { ...prev }; delete n[jogoId]; return n; });
      } else {
        alert(await extrairMensagemErro(res, "Erro ao finalizar jogo."));
      }
    } catch (err) {
      alert("Erro de conexão ao finalizar jogo.");
    } finally { setFinalizando(null); }
  };

  const abrirEdicao = (j: Jogo) => { setEditando(j.jogo_id); setPlacarEdit({ m: String(j.gols_mandante ?? 0), v: String(j.gols_visitante ?? 0) }); };

  const salvarEdicao = async (jogoId: number) => {
    if (placarEdit.m === "" || placarEdit.v === "") { alert("Preencha os dois placares."); return; }
    setSalvandoEdit(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoId}/editar-placar`, { method: "POST", body: JSON.stringify({ gols_mandante: parseInt(placarEdit.m), gols_visitante: parseInt(placarEdit.v) }) });
      if (res.ok) { setEditando(null); fetchJogos(); }
      else { alert(await extrairMensagemErro(res, "Erro ao salvar placar.")); }
    } catch (err) {
      alert("Erro de conexão ao salvar placar.");
    } finally { setSalvandoEdit(false); }
  };

  const abrirReagendamento = (j: Jogo) => {
    setReagendando(j.jogo_id);
    setReagendarForm({ data_hora: paraDatetimeLocal(j.data_hora), estadio_id: "" });
  };

  const salvarReagendamento = async (jogoId: number) => {
    if (!reagendarForm.data_hora) { alert("Selecione a nova data e hora."); return; }
    setSalvandoReagendamento(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoId}/reagendar`, {
        method: "POST",
        body: JSON.stringify({
          data_hora: paraFormatoBackend(reagendarForm.data_hora),
          ...(reagendarForm.estadio_id ? { estadio_id: parseInt(reagendarForm.estadio_id) } : {}),
        }),
      });
      if (res.ok) { setReagendando(null); fetchJogos(); }
      else { alert(await extrairMensagemErro(res, "Erro ao reagendar jogo.")); }
    } catch (err) {
      alert("Erro de conexão ao reagendar jogo.");
    } finally { setSalvandoReagendamento(false); }
  };

  const deletarJogo = async (id: number) => {
    if (!confirm("Remover este jogo?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJogos((prev) => prev.filter((j) => j.jogo_id !== id));
      } else {
        alert(await extrairMensagemErro(res, "Erro ao remover jogo."));
      }
    } catch (err) {
      alert("Erro de conexão ao remover jogo.");
    }
  };

  const fetchSumulaJogo = async (jogoId: number) => {
    setCarregandoSumula(jogoId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${jogoId}/sumula`);
      if (res.ok) {
        const data = await res.json();
        setSumulaPorJogo((prev) => ({ ...prev, [jogoId]: { eventos: data.eventos ?? [], cartoes: data.cartoes ?? [] } }));
      }
    } finally { setCarregandoSumula(null); }
  };

  const alternarSumulaJogo = (j: Jogo) => {
    if (jogoSumulaAberta === j.jogo_id) { setJogoSumulaAberta(null); return; }
    setJogoSumulaAberta(j.jogo_id);
    if (!sumulaPorJogo[j.jogo_id]) fetchSumulaJogo(j.jogo_id);
  };

  const fetchElencoParaSumula = async (timeId: number) => {
    if (elencoParaSumula[timeId]) return;
    setCarregandoElencoSumula(timeId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/times/${timeId}/jogadores`);
      if (res.ok) {
        const data = await res.json();
        setElencoParaSumula((prev) => ({ ...prev, [timeId]: data }));
      }
    } finally { setCarregandoElencoSumula(null); }
  };

  const abrirModalSumula = (jogoId: number, tipo: "gol" | "cartao", timeId: number, timeNome: string) => {
    setModalSumulaTipo(tipo);
    setModalSumulaJogoId(jogoId);
    setModalSumulaTimeId(timeId);
    setModalSumulaTimeNome(timeNome);
    setModalSumulaJogadorId("");
    setModalSumulaMinuto("");
    setModalSumulaTempo("");
    setModalSumulaCartaoTipo("amarelo");
    fetchElencoParaSumula(timeId);
  };

  const fecharModalSumula = () => { setModalSumulaTipo(null); setModalSumulaJogoId(null); setModalSumulaTimeId(null); };

  const confirmarModalSumula = async () => {
    if (!modalSumulaJogoId || !modalSumulaTimeId || !modalSumulaJogadorId) return;
    setProcessandoSumula(true);
    try {
      const body: any = {
        jogador_id: parseInt(modalSumulaJogadorId),
        time_id: modalSumulaTimeId,
        minuto: modalSumulaMinuto || null,
        tempo: modalSumulaTempo ? parseInt(modalSumulaTempo) : null,
      };
      const rota = modalSumulaTipo === "gol" ? "gols" : "cartoes";
      if (modalSumulaTipo === "cartao") body.tipo = modalSumulaCartaoTipo;
      const res = await authFetch(`${API_BASE_URL}/api/jogos/${modalSumulaJogoId}/${rota}`, { method: "POST", body: JSON.stringify(body) });
      if (res.ok) {
        const jogoId = modalSumulaJogoId;
        fecharModalSumula();
        fetchSumulaJogo(jogoId);
      } else {
        alert(await extrairMensagemErro(res, `Erro ao registrar ${modalSumulaTipo === "gol" ? "gol" : "cartão"}.`));
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally { setProcessandoSumula(false); }
  };

  const roleBadgeColor = (role: string) => {
    const cores: Record<string, string> = { master: "bg-primary/10 text-primary", presidente: "bg-blue-100 text-blue-700", delegado: "bg-purple-100 text-purple-700", capitao: "bg-green-100 text-green-700", olheiro: "bg-yellow-100 text-yellow-700", torcedor: "bg-muted text-muted-foreground" };
    return cores[role] ?? "bg-muted text-muted-foreground";
  };

  const abas: { key: Aba; label: string; icon: any }[] = [
    ...(isMaster ? [{ key: "usuarios" as Aba, label: "Usuários", icon: Users }] : []),
    ...(isMaster ? [{ key: "presidentes" as Aba, label: "Presidentes", icon: ShieldCheck }] : []),
    { key: "campeonatos", label: "Campeonatos", icon: Trophy },
    ...(isMaster ? [{ key: "novo_campeonato" as Aba, label: "Novo Camp.", icon: PlusCircle }] : []),
    { key: "jogos", label: "Jogos", icon: Swords },
    { key: "novo_jogo", label: "Novo Jogo", icon: Calendar },
    { key: "times", label: "Times", icon: Shirt },
    ...(isMaster ? [{ key: "novo_time" as Aba, label: "Novo Time", icon: PlusCircle }] : []),
    ...(isMaster ? [{ key: "jogadores" as Aba, label: "Jogadores", icon: UserRound }] : []),
    ...(isMaster ? [{ key: "novo_jogador" as Aba, label: "Novo Jogador", icon: PlusCircle }] : []),
    { key: "estadios", label: "Estádios", icon: MapPin },
    ...(isMaster ? [{ key: "novo_estadio" as Aba, label: "Novo Estádio", icon: PlusCircle }] : []),
    { key: "contatos", label: "Contatos", icon: Phone },
    { key: "novo_contato", label: "Novo Contato", icon: PlusCircle },
    { key: "materias", label: "Matérias", icon: Newspaper },
    { key: "nova_materia", label: "Nova Matéria", icon: PlusCircle },
  ];

  const inputClass = "w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (verificandoAcesso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ backgroundImage: "linear-gradient(135deg, rgba(232,116,0,0.12) 0%, transparent 50%, rgba(0,51,128,0.12) 100%)", backgroundAttachment: "fixed" }}>
      <Header />
      <main className="container mx-auto px-4 py-12">

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"><ShieldCheck className="w-8 h-8 text-primary" /></div>
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground mb-4">
            {isMaster ? "Gerencie usuários, campeonatos, jogos e conteúdo" : "Gerencie o(s) campeonato(s) sob sua responsabilidade"}
          </p>
          <button onClick={() => navigate("/delegado")} className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            <Radio className="w-4 h-4" /> Painel do Delegado (registrar jogo ao vivo)
          </button>
        </div>

        {/* Resumo */}
        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          {[
            ...(isMaster ? [{ icon: Users, count: usuarios.length, label: "Usuários" }] : []),
            { icon: Trophy, count: campeonatosPermitidos.length, label: "Campeonatos" },
            { icon: Swords, count: jogosPermitidos.length, label: "Jogos" },
            { icon: Shirt, count: times.length, label: "Times" },
            { icon: MapPin, count: estadios.length, label: "Estádios" },
            { icon: Phone, count: contatos.length, label: "Contatos" },
            { icon: Newspaper, count: materias.length, label: "Matérias" },
          ].map(({ icon: Icon, count, label }) => (
            <div key={label} className="flex items-center gap-2 bg-card/80 border rounded-xl px-5 py-3 shadow-sm">
              <Icon className="w-4 h-4 text-primary" /><span className="font-semibold">{count}</span><span className="text-muted-foreground text-sm">{label}</span>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center rounded-xl border bg-card/80 p-1 gap-1 max-w-4xl">
            {abas.filter(a => a.key !== "editar_materia").map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setAba(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${aba === key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ABA: USUÁRIOS */}
        {aba === "usuarios" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Gestão de Usuários</h2>
              <button onClick={fetchUsuarios} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {loadingUsers ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : (
              <div className="divide-y">
                {usuarios.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{u.username[0].toUpperCase()}</div>
                      <div><p className="font-medium text-sm">{u.username}</p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(u.role)}`}>{u.role}</span></div>
                    </div>
                    {user.role === "master" && u.username !== user.name && (
                      <div className="flex items-center gap-2">
                        <select defaultValue={u.role} onChange={(e) => mudarRole(u.id, e.target.value)} disabled={salvando === u.id} className="text-sm border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button onClick={() => resetarSenha(u.id, u.username)} disabled={salvando === u.id} className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50" title="Resetar senha">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {salvando === u.id && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: PRESIDENTES (master-only) — atribuir/remover presidente escopado por campeonato */}
        {aba === "presidentes" && isMaster && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Presidentes por Campeonato</h2>
              <p className="text-xs text-muted-foreground">Cada presidente só administra o campeonato atribuído aqui.</p>
            </div>
            {campeonatos.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum campeonato cadastrado.</div> : (
              <div className="divide-y">
                {campeonatos.map((c) => {
                  const expandido = campExpandido === c.campeonato_id;
                  const presidentesLista = presidentesPorCamp[c.campeonato_id] ?? [];
                  const candidatos = usuarios.filter((u) => !presidentesLista.some((p) => p.usuario_id === u.id));
                  return (
                    <div key={c.campeonato_id} className="px-6 py-4">
                      <button onClick={() => alternarExpandirCamp(c.campeonato_id)} className="w-full flex items-center justify-between text-left">
                        <div>
                          <p className="font-medium text-sm">{c.nome}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {presidentesPorCamp[c.campeonato_id]
                              ? `${presidentesLista.length} presidente(s) atribuído(s)`
                              : "Clique pra ver os presidentes"}
                          </p>
                        </div>
                        <span className="text-muted-foreground text-xs">{expandido ? "▲" : "▾"}</span>
                      </button>
                      {expandido && (
                        <div className="mt-3 pl-1 space-y-3">
                          {carregandoPresidentes === c.campeonato_id ? (
                            <p className="text-sm text-muted-foreground">Carregando...</p>
                          ) : presidentesLista.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Ninguém atribuído ainda.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {presidentesLista.map((p) => (
                                <div key={p.usuario_id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                                  <span className="text-sm font-medium">{p.username}</span>
                                  <button onClick={() => removerPresidente(c.campeonato_id, p.usuario_id)} className="text-destructive hover:opacity-70" title="Remover presidente">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <SeletorBusca
                                opcoes={candidatos.map((u) => ({ id: String(u.id), label: `${u.username} (${u.role})` }))}
                                valor={novoPresidenteId[c.campeonato_id] ?? ""}
                                onSelecionar={(idSel) => setNovoPresidenteId((prev) => ({ ...prev, [c.campeonato_id]: idSel }))}
                                placeholder="Buscar usuário pra atribuir..."
                              />
                            </div>
                            <button
                              onClick={() => atribuirPresidente(c.campeonato_id)}
                              disabled={!novoPresidenteId[c.campeonato_id] || atribuindoPresidente === c.campeonato_id}
                              className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                            >
                              {atribuindoPresidente === c.campeonato_id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />} Atribuir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: CAMPEONATOS */}
        {aba === "campeonatos" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Campeonatos</h2>
              {isMaster && <button onClick={() => setAba("novo_campeonato")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"><PlusCircle className="w-4 h-4" /> Novo</button>}
            </div>
            {campeonatosPermitidos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {isMaster ? "Nenhum campeonato cadastrado." : "Você ainda não é presidente de nenhum campeonato. Fale com a equipe master."}
              </div>
            ) : (
              <div className="divide-y">
                {campeonatosPermitidos.map((c) => (
                  <div key={c.campeonato_id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    {campEditando === c.campeonato_id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input value={campEditNome} onChange={(e) => setCampEditNome(e.target.value)} className="flex-1 min-w-[160px] px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <select value={campEditFormato} onChange={(e) => setCampEditFormato(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {FORMATOS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <select value={campEditGenero} onChange={(e) => setCampEditGenero(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <button onClick={() => salvarEdicaoCamp(c.campeonato_id)} disabled={salvandoCamp} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90">
                          <Save className="w-3 h-3" /> Salvar
                        </button>
                        <button onClick={() => setCampEditando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{c.nome}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{FORMATOS.find(f => f.value === c.tipo_formato)?.label ?? c.tipo_formato} · {c.genero}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.ativo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{c.ativo ? "Ativo" : "Encerrado"}</span>
                          <button
                            onClick={() => navigate(`/admin/campeonatos/${c.campeonato_id}/grupos`)}
                            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                            title="Gerenciar Grupos & Mata-Mata"
                          >
                            <Layers className="w-3.5 h-3.5" /> Grupos
                          </button>
                          <button onClick={() => abrirEdicaoCamp(c)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar campeonato"><Edit3 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO CAMPEONATO (master-only: não existe camp_id pra escopar antes de criar) */}
        {aba === "novo_campeonato" && isMaster && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Criar Novo Campeonato</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Nome *</label><input type="text" value={novoCamp.nome} onChange={(e) => setNovoCamp(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Copa Elite Diadema 2026" className={inputClass} /></div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Formato</label>
                <select value={novoCamp.tipo_formato} onChange={(e) => setNovoCamp(p => ({ ...p, tipo_formato: e.target.value }))} className={inputClass}>
                  {FORMATOS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gênero</label>
                <select value={novoCamp.genero} onChange={(e) => setNovoCamp(p => ({ ...p, genero: e.target.value }))} className={inputClass}>
                  {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="border rounded-xl p-4 bg-muted/30">
                <p className="text-sm font-medium mb-3">Pontuação</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{ key: "pontos_vitoria", label: "Vitória", color: "text-green-600" }, { key: "pontos_empate", label: "Empate", color: "text-yellow-600" }, { key: "pontos_derrota", label: "Derrota", color: "text-red-500" }].map(({ key, label, color }) => (
                    <div key={key} className="text-center">
                      <label className={`text-xs font-medium mb-1 block ${color}`}>{label}</label>
                      <input type="number" min="0" max="10" value={(novoCamp as any)[key]} onChange={(e) => setNovoCamp(p => ({ ...p, [key]: e.target.value }))} className="w-full text-center border rounded-lg px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                </div>
              </div>
              {msgCamp && <p className={`text-sm font-medium ${msgCamp.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgCamp}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={criarCampeonato} disabled={criandoCamp} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{criandoCamp ? "Criando..." : "Criar Campeonato"}</button>
                <button onClick={() => setNovoCamp({ nome: "", tipo_formato: "PONTOS_CORRIDOS", genero: "Masculino", pontos_vitoria: "3", pontos_empate: "1", pontos_derrota: "0" })} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: JOGOS */}
        {aba === "jogos" && (() => {
          const jogosOrdenados = [...jogosPermitidos].sort((a, b) => paraData(a.data_hora).getTime() - paraData(b.data_hora).getTime());
          const jogosNaoEncerrados = jogosOrdenados.filter((j) => j.status !== "Finalizado");
          const jogosEncerrados = jogosOrdenados.filter((j) => j.status === "Finalizado");

          const renderJogoCard = (j: Jogo) => (
            <div key={j.jogo_id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{j.mandante} <span className="text-muted-foreground">vs</span> {j.visitante}</p>
                  <p className="text-xs text-muted-foreground">{j.campeonato} · {j.data_hora}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${j.status === "Finalizado" ? "bg-green-100 text-green-700" : j.status === "Em andamento" ? "bg-yellow-100 text-yellow-700" : j.status === "Aguardando confirmação" ? "bg-blue-100 text-blue-700" : j.status === "Em disputa" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>{j.status}</span>
                  <button onClick={() => alternarSumulaJogo(j)} className="text-muted-foreground hover:text-primary transition-colors" title="Ver/editar súmula (gols e cartões)">
                    {jogoSumulaAberta === j.jogo_id ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </button>
                  <button onClick={() => editando === j.jogo_id ? setEditando(null) : abrirEdicao(j)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar placar">
                    {editando === j.jogo_id ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => reagendando === j.jogo_id ? setReagendando(null) : abrirReagendamento(j)} className="text-muted-foreground hover:text-primary transition-colors" title="Reagendar jogo">
                    {reagendando === j.jogo_id ? <X className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
                  </button>
                  {isMaster && (
                    <button onClick={() => deletarJogo(j.jogo_id)} className="text-destructive hover:opacity-70" title="Remover jogo (apenas master)"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              {jogoSumulaAberta === j.jogo_id && (
                <div className="mt-2 p-3 bg-muted/30 rounded-xl border space-y-3">
                  {carregandoSumula === j.jogo_id ? (
                    <p className="text-xs text-muted-foreground">Carregando súmula...</p>
                  ) : (
                    <>
                      {[
                        { id: j.mandante_id, nome: j.mandante },
                        { id: j.visitante_id, nome: j.visitante },
                      ].map((time) => time.id ? (
                        <div key={time.id} className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">{time.nome}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => abrirModalSumula(j.jogo_id, "gol", time.id as number, time.nome)}
                              className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                              <Goal className="w-3 h-3" /> Gol
                            </button>
                            <button onClick={() => abrirModalSumula(j.jogo_id, "cartao", time.id as number, time.nome)}
                              className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg hover:bg-yellow-100 transition-colors">
                              <Square className="w-3 h-3" /> Cartão
                            </button>
                          </div>
                        </div>
                      ) : null)}
                      {(() => {
                        const s = sumulaPorJogo[j.jogo_id];
                        const combinados = s ? [...s.eventos.map(e => ({ ...e, cat: "gol" as const })), ...s.cartoes.map(e => ({ ...e, cat: "cartao" as const }))] : [];
                        if (combinados.length === 0) return <p className="text-xs text-muted-foreground">Nenhum gol ou cartão registrado ainda.</p>;
                        return (
                          <div className="space-y-1 pt-1 border-t">
                            {combinados.map((e, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs">
                                {e.cat === "gol" ? <Goal className="w-3 h-3 text-primary flex-shrink-0" /> : <Square className={`w-3 h-3 flex-shrink-0 ${e.tipo === "vermelho" ? "text-red-600" : "text-yellow-600"}`} />}
                                <span className="text-muted-foreground">{e.minuto || "?"}'</span>
                                <span className="font-medium">{e.jogador}</span>
                                <span className="text-muted-foreground">({e.time})</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
              {j.status !== "Finalizado" && editando !== j.jogo_id && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.mandante}</span>
                  <input type="number" min="0" placeholder="0" value={placar[j.jogo_id]?.m ?? ""} onChange={(e) => setPlacar((prev) => ({ ...prev, [j.jogo_id]: { ...prev[j.jogo_id], m: e.target.value } }))} className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <span className="text-muted-foreground font-bold">×</span>
                  <input type="number" min="0" placeholder="0" value={placar[j.jogo_id]?.v ?? ""} onChange={(e) => setPlacar((prev) => ({ ...prev, [j.jogo_id]: { ...prev[j.jogo_id], v: e.target.value } }))} className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.visitante}</span>
                  <button onClick={() => finalizarJogo(j.jogo_id)} disabled={finalizando === j.jogo_id} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 ml-auto">
                    {finalizando === j.jogo_id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Finalizar
                  </button>
                </div>
              )}
              {editando === j.jogo_id && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <Edit3 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.mandante}</span>
                  <input type="number" min="0" value={placarEdit.m} onChange={(e) => setPlacarEdit(p => ({ ...p, m: e.target.value }))} className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <span className="text-muted-foreground font-bold">×</span>
                  <input type="number" min="0" value={placarEdit.v} onChange={(e) => setPlacarEdit(p => ({ ...p, v: e.target.value }))} className="w-12 text-center border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{j.visitante}</span>
                  <button onClick={() => salvarEdicao(j.jogo_id)} disabled={salvandoEdit} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 ml-auto">
                    {salvandoEdit ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                  </button>
                  <button onClick={() => setEditando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">Cancelar</button>
                </div>
              )}
              {reagendando === j.jogo_id && (
                <div className="flex flex-wrap items-center gap-2 mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <CalendarClock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <input type="datetime-local" value={reagendarForm.data_hora} onChange={(e) => setReagendarForm(p => ({ ...p, data_hora: e.target.value }))} className="border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <select value={reagendarForm.estadio_id} onChange={(e) => setReagendarForm(p => ({ ...p, estadio_id: e.target.value }))} className="border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Manter estádio atual</option>
                    {estadios.map((e) => <option key={e.id} value={e.id}>{e.apelido || e.nome_oficial}</option>)}
                  </select>
                  <button onClick={() => salvarReagendamento(j.jogo_id)} disabled={salvandoReagendamento} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 ml-auto">
                    {salvandoReagendamento ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Reagendar
                  </button>
                  <button onClick={() => setReagendando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">Cancelar</button>
                </div>
              )}
            </div>
          );

          return (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Jogos</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setAba("novo_jogo")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"><PlusCircle className="w-4 h-4" /> Novo</button>
                <button onClick={fetchJogos} className="text-muted-foreground hover:text-foreground ml-2"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {loadingJogos ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
              jogosPermitidos.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum jogo cadastrado.</div> : (
              <>
                <div className="px-6 py-2.5 bg-muted/50 border-b">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Não Encerrados ({jogosNaoEncerrados.length})</p>
                </div>
                {jogosNaoEncerrados.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-muted-foreground text-center">Nenhum jogo pendente. 🎉</p>
                ) : (
                  <div className="divide-y">{jogosNaoEncerrados.map(renderJogoCard)}</div>
                )}
                <div className="px-6 py-2.5 bg-muted/50 border-b border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Encerrados ({jogosEncerrados.length})</p>
                </div>
                {jogosEncerrados.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-muted-foreground text-center">Nenhum jogo finalizado ainda.</p>
                ) : (
                  <div className="divide-y">{jogosEncerrados.map(renderJogoCard)}</div>
                )}
              </>
            )}
          </div>
          );
        })()}

        {/* ABA: NOVO JOGO */}
        {aba === "novo_jogo" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Agendar Novo Jogo</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1.5 block">Mandante *</label>
                  <SeletorBusca
                    opcoes={times.map((t) => ({ id: String(t.id), label: t.nome_oficial }))}
                    valor={novoJogo.time_mandante_id}
                    onSelecionar={(idSel) => setNovoJogo((p) => ({ ...p, time_mandante_id: idSel }))}
                    placeholder="Buscar time mandante..."
                  />
                </div>
                <div><label className="text-sm font-medium mb-1.5 block">Visitante *</label>
                  <SeletorBusca
                    opcoes={times.map((t) => ({ id: String(t.id), label: t.nome_oficial }))}
                    valor={novoJogo.time_visitante_id}
                    onSelecionar={(idSel) => setNovoJogo((p) => ({ ...p, time_visitante_id: idSel }))}
                    placeholder="Buscar time visitante..."
                  />
                </div>
              </div>
              <div><label className="text-sm font-medium mb-1.5 block">Data e Hora *</label><input type="datetime-local" value={novoJogo.data_hora} onChange={(e) => setNovoJogo((p) => ({ ...p, data_hora: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Campeonato</label>
                <select value={novoJogo.campeonato_id} onChange={(e) => setNovoJogo((p) => ({ ...p, campeonato_id: e.target.value }))} className={inputClass}>
                  <option value="">{isMaster ? "Amistoso" : "Selecione o campeonato"}</option>{campeonatosPermitidos.map((c) => <option key={c.campeonato_id} value={c.campeonato_id}>{c.nome}</option>)}
                </select>
                {!isMaster && <p className="text-xs text-muted-foreground mt-1">Só aparecem os campeonatos sob sua responsabilidade.</p>}
              </div>
              <div><label className="text-sm font-medium mb-1.5 block">Estádio</label>
                <select value={novoJogo.estadio_id} onChange={(e) => setNovoJogo((p) => ({ ...p, estadio_id: e.target.value }))} className={inputClass}>
                  <option value="">Sem estádio</option>{estadios.map((e) => <option key={e.id} value={e.id}>{e.apelido || e.nome_oficial}</option>)}
                </select>
              </div>
              {msgJogo && <p className={`text-sm font-medium ${msgJogo.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgJogo}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={agendarJogo} disabled={agendando} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{agendando ? "Agendando..." : "Agendar Jogo"}</button>
                <button onClick={() => setNovoJogo({ campeonato_id: "", time_mandante_id: "", time_visitante_id: "", data_hora: "", estadio_id: "" })} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: TIMES */}
        {aba === "times" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Times</h2>
              <div className="flex items-center gap-2">
                {isMaster && <button onClick={() => setAba("novo_time")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"><PlusCircle className="w-4 h-4" /> Novo</button>}
                <button onClick={fetchTimes} className="text-muted-foreground hover:text-foreground ml-2"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {loadingTimes ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
              times.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum time cadastrado.</div> : (
              <div className="divide-y">
                {times.map((t) => (
                  <div key={t.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    {timeEditando?.id === t.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={timeEdit.nome_oficial} onChange={(ev) => setTimeEdit(p => ({ ...p, nome_oficial: ev.target.value }))} placeholder="Nome oficial" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <input value={timeEdit.apelido} onChange={(ev) => setTimeEdit(p => ({ ...p, apelido: ev.target.value }))} placeholder="Apelido" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <input value={timeEdit.regiao} onChange={(ev) => setTimeEdit(p => ({ ...p, regiao: ev.target.value }))} placeholder="Região" className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <input value={timeEdit.logo_url} onChange={(ev) => setTimeEdit(p => ({ ...p, logo_url: ev.target.value }))} placeholder="URL do brasão (Cloudinary)" className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <div className="flex gap-2">
                          <button onClick={salvarEdicaoTime} disabled={salvandoTime} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                            {salvandoTime ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                          </button>
                          <button onClick={() => setTimeEditando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
                            {t.logo_url ? (
                              <img src={t.logo_url} alt={t.nome_oficial} className="w-full h-full object-cover" />
                            ) : (
                              t.nome_oficial[0]
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{t.nome_oficial}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.apelido && `"${t.apelido}" · `}{t.regiao}</p>
                          </div>
                        </div>
                        {isMaster && (
                          <button onClick={() => abrirEdicaoTime(t)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar time (apenas master)">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO TIME (master-only: times agora são recurso global) */}
        {aba === "novo_time" && isMaster && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Shirt className="w-5 h-5 text-primary" /> Cadastrar Novo Time</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Nome Oficial *</label><input type="text" value={novoTimeForm.nome_oficial} onChange={(e) => setNovoTimeForm(p => ({ ...p, nome_oficial: e.target.value }))} placeholder="Ex: E.C. Diadema" className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Apelido</label><input type="text" value={novoTimeForm.apelido} onChange={(e) => setNovoTimeForm(p => ({ ...p, apelido: e.target.value }))} placeholder="Ex: Diadema" className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Região</label><input type="text" value={novoTimeForm.regiao} onChange={(e) => setNovoTimeForm(p => ({ ...p, regiao: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">URL do Brasão (Cloudinary)</label><input type="text" value={novoTimeForm.logo_url} onChange={(e) => setNovoTimeForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://res.cloudinary.com/..." className={inputClass} /></div>
              {msgTime && <p className={`text-sm font-medium ${msgTime.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgTime}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={criarTime} disabled={criandoTime} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{criandoTime ? "Salvando..." : "Cadastrar Time"}</button>
                <button onClick={() => setNovoTimeForm({ nome_oficial: "", apelido: "", regiao: "Diadema", logo_url: "" })} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: JOGADORES (master-only) — escolhe um time, vê e edita o elenco */}
        {aba === "jogadores" && isMaster && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b space-y-3">
              <h2 className="font-bold text-lg">Jogadores</h2>
              <SeletorBusca
                opcoes={times.map((t) => ({ id: String(t.id), label: t.nome_oficial }))}
                valor={timeSelecionadoJogadores}
                onSelecionar={selecionarTimeJogadores}
                placeholder="Escolha um time pra ver o elenco..."
              />
              <SeletorBusca
                opcoes={campeonatos.map((c) => ({ id: String(c.campeonato_id), label: c.nome }))}
                valor={campeonatoSelecionadoJogadores}
                onSelecionar={selecionarCampeonatoJogadores}
                placeholder="Escolha um campeonato pra ver/editar números de camisa (opcional)..."
              />
            </div>
            {!timeSelecionadoJogadores ? (
              <div className="p-8 text-center text-muted-foreground">Escolha um time acima pra ver o elenco.</div>
            ) : carregandoJogadoresTime ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : jogadoresDoTime.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Esse time ainda não tem jogadores cadastrados.</div>
            ) : (
              <div className="divide-y">
                {jogadoresDoTime.map((j) => (
                  <div key={j.jogador_id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    {jogadorEditando?.jogador_id === j.jogador_id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={jogadorEdit.nome} onChange={(ev) => setJogadorEdit(p => ({ ...p, nome: ev.target.value }))} placeholder="Nome" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <input value={jogadorEdit.posicao} onChange={(ev) => setJogadorEdit(p => ({ ...p, posicao: ev.target.value }))} placeholder="Posição" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="flex items-center gap-3">
                          {jogadorEdit.foto_url && <img src={jogadorEdit.foto_url} alt="" className="w-12 h-12 rounded-full object-cover" />}
                          <label className="flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:opacity-80">
                            {enviandoFotoJogadorEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                            {enviandoFotoJogadorEdit ? "Enviando..." : jogadorEdit.foto_url ? "Trocar foto" : "Adicionar foto"}
                            <input type="file" accept="image/*" className="hidden" disabled={enviandoFotoJogadorEdit} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFotoJogadorEdit(f); }} />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={salvarEdicaoJogador} disabled={salvandoJogador} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                            {salvandoJogador ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                          </button>
                          <button onClick={() => setJogadorEditando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden flex-shrink-0">
                            {j.foto_url ? <img src={j.foto_url} alt={j.nome} className="w-full h-full object-cover" /> : j.nome[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{j.nome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{j.posicao || "Posição não informada"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {campeonatoSelecionadoJogadores && (
                            editandoNumeroJogadorId === j.jogador_id ? (
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" max="999" autoFocus value={numeroInputValor} onChange={(e) => setNumeroInputValor(e.target.value)}
                                  className="w-14 text-center border rounded-lg px-1 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <button onClick={() => salvarNumeroCamisa(j.jogador_id)} disabled={!numeroInputValor || salvandoNumero === j.jogador_id} className="text-primary hover:opacity-70 disabled:opacity-50" title="Salvar número">
                                  {salvandoNumero === j.jogador_id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => setEditandoNumeroJogadorId(null)} className="text-muted-foreground hover:text-foreground" title="Cancelar"><X className="w-3.5 h-3.5" /></button>
                                {numerosPorJogador[j.jogador_id] != null && (
                                  <button onClick={() => { removerNumeroCamisa(j.jogador_id); setEditandoNumeroJogadorId(null); }} className="text-destructive hover:opacity-70" title="Remover número">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button onClick={() => abrirEdicaoNumero(j.jogador_id)} disabled={carregandoNumeros}
                                className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary/30 text-primary text-xs font-bold hover:bg-primary/10 transition-colors disabled:opacity-50"
                                title="Editar número de camisa">
                                {carregandoNumeros ? <Loader2 className="w-3 h-3 animate-spin" /> : (numerosPorJogador[j.jogador_id] ?? "+")}
                              </button>
                            )
                          )}
                          <button onClick={() => abrirEdicaoJogador(j)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar jogador">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO JOGADOR (master-only) */}
        {aba === "novo_jogador" && isMaster && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><UserRound className="w-5 h-5 text-primary" /> Cadastrar Novo Jogador</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Nome *</label><input type="text" value={novoJogadorForm.nome} onChange={(e) => setNovoJogadorForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Kaue Rodrigues Dos Santos" className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Time *</label>
                <SeletorBusca
                  opcoes={times.map((t) => ({ id: String(t.id), label: t.nome_oficial }))}
                  valor={novoJogadorForm.time_id}
                  onSelecionar={(idSel) => setNovoJogadorForm(p => ({ ...p, time_id: idSel }))}
                  placeholder="Buscar time..."
                />
              </div>
              <div><label className="text-sm font-medium mb-1.5 block">Posição</label><input type="text" value={novoJogadorForm.posicao} onChange={(e) => setNovoJogadorForm(p => ({ ...p, posicao: e.target.value }))} placeholder="Ex: Lateral Direito" className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">CPF *</label><input type="text" value={novoJogadorForm.cpf} onChange={(e) => setNovoJogadorForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Data de Nascimento *</label><input type="date" value={novoJogadorForm.data_nascimento} onChange={(e) => setNovoJogadorForm(p => ({ ...p, data_nascimento: e.target.value }))} className={inputClass} /></div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Foto (opcional)</label>
                {novoJogadorForm.foto_url && <img src={novoJogadorForm.foto_url} alt="Prévia" className="w-24 h-24 rounded-full object-cover mb-2 mx-auto" />}
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-4 text-sm text-muted-foreground hover:bg-muted/40 cursor-pointer transition-colors">
                  {enviandoFotoJogadorNovo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {enviandoFotoJogadorNovo ? "Enviando..." : novoJogadorForm.foto_url ? "Trocar foto" : "Escolher foto"}
                  <input type="file" accept="image/*" className="hidden" disabled={enviandoFotoJogadorNovo} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFotoJogadorNovo(f); }} />
                </label>
              </div>
              {msgJogador && <p className={`text-sm font-medium ${msgJogador.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgJogador}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={criarJogador} disabled={criandoJogador || enviandoFotoJogadorNovo} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{criandoJogador ? "Salvando..." : "Cadastrar Jogador"}</button>
                <button onClick={() => { setNovoJogadorForm({ nome: "", time_id: "", posicao: "", cpf: "", data_nascimento: "", foto_url: "" }); setMsgJogador(""); }} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: ESTÁDIOS */}
        {aba === "estadios" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Estádios</h2>
              {isMaster && <button onClick={() => setAba("novo_estadio")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"><PlusCircle className="w-4 h-4" /> Novo</button>}
            </div>
            {loadingEstadios ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
              estadios.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum estádio cadastrado.</div> : (
              <div className="divide-y">
                {estadios.map((e) => (
                  <div key={e.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    {estadioEditando?.id === e.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={estadioEdit.nome_oficial} onChange={(ev) => setEstadioEdit(p => ({ ...p, nome_oficial: ev.target.value }))} placeholder="Nome oficial" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <input value={estadioEdit.apelido} onChange={(ev) => setEstadioEdit(p => ({ ...p, apelido: ev.target.value }))} placeholder="Apelido" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input value={estadioEdit.bairro} onChange={(ev) => setEstadioEdit(p => ({ ...p, bairro: ev.target.value }))} placeholder="Bairro" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <input value={estadioEdit.cidade} onChange={(ev) => setEstadioEdit(p => ({ ...p, cidade: ev.target.value }))} placeholder="Cidade" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <input value={estadioEdit.estado} onChange={(ev) => setEstadioEdit(p => ({ ...p, estado: ev.target.value }))} placeholder="UF" maxLength={2} className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={salvarEdicaoEstadio} disabled={salvandoEstadio} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                            {salvandoEstadio ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                          </button>
                          <button onClick={() => setEstadioEditando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{e.nome_oficial}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{e.apelido && `"${e.apelido}" · `}{e.bairro}{e.bairro && ", "}{e.cidade} - {e.estado}</p>
                        </div>
                        {isMaster && (
                          <button onClick={() => abrirEdicaoEstadio(e)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar estádio (apenas master)">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO ESTÁDIO (master-only: estádios agora são recurso global) */}
        {aba === "novo_estadio" && isMaster && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Cadastrar Novo Estádio</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Nome Oficial *</label><input type="text" value={novoEstadio.nome_oficial} onChange={(e) => setNovoEstadio(p => ({ ...p, nome_oficial: e.target.value }))} placeholder="Ex: Estádio Municipal José Batista..." className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Apelido</label><input type="text" value={novoEstadio.apelido} onChange={(e) => setNovoEstadio(p => ({ ...p, apelido: e.target.value }))} placeholder="Ex: Distrital do Inamar" className={inputClass} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><label className="text-sm font-medium mb-1.5 block">Rua</label><input type="text" value={novoEstadio.rua} onChange={(e) => setNovoEstadio(p => ({ ...p, rua: e.target.value }))} placeholder="Ex: Av. das Nações" className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Número</label><input type="text" value={novoEstadio.numero} onChange={(e) => setNovoEstadio(p => ({ ...p, numero: e.target.value }))} placeholder="S/N" className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Bairro</label><input type="text" value={novoEstadio.bairro} onChange={(e) => setNovoEstadio(p => ({ ...p, bairro: e.target.value }))} placeholder="Ex: Jardim Inamar" className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">CEP</label><input type="text" value={novoEstadio.cep} onChange={(e) => setNovoEstadio(p => ({ ...p, cep: e.target.value }))} placeholder="09980-000" className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block">Cidade</label><input type="text" value={novoEstadio.cidade} onChange={(e) => setNovoEstadio(p => ({ ...p, cidade: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Estado</label><input type="text" value={novoEstadio.estado} onChange={(e) => setNovoEstadio(p => ({ ...p, estado: e.target.value }))} maxLength={2} className={inputClass} /></div>
              </div>
              {msgEstadio && <p className={`text-sm font-medium ${msgEstadio.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgEstadio}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={criarEstadio} disabled={criandoEstadio} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{criandoEstadio ? "Salvando..." : "Cadastrar Estádio"}</button>
                <button onClick={() => setNovoEstadio({ nome_oficial: "", apelido: "", rua: "", numero: "", bairro: "", cidade: "Diadema", estado: "SP", cep: "" })} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: CONTATOS */}
        {aba === "contatos" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Contatos-Chave</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setAba("novo_contato")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"><PlusCircle className="w-4 h-4" /> Novo</button>
                <button onClick={fetchContatos} className="text-muted-foreground hover:text-foreground ml-2"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {loadingContatos ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
              contatos.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum contato cadastrado.</div> : (
              <div className="divide-y">
                {contatos.map((c) => (
                  <div key={c.contato_id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    {contatoEditando?.contato_id === c.contato_id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={contatoEdit.nome} onChange={(ev) => setContatoEdit(p => ({ ...p, nome: ev.target.value }))} placeholder="Nome" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <input value={contatoEdit.telefone} onChange={(ev) => setContatoEdit(p => ({ ...p, telefone: ev.target.value }))} placeholder="Telefone" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <input value={contatoEdit.papel} onChange={(ev) => setContatoEdit(p => ({ ...p, papel: ev.target.value }))} placeholder="Papel (ex: Coordenador Liga Diadema)" className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <textarea value={contatoEdit.observacoes} onChange={(ev) => setContatoEdit(p => ({ ...p, observacoes: ev.target.value }))} placeholder="Observações" rows={2} className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                        <select value={contatoEdit.campeonato_id} onChange={(ev) => setContatoEdit(p => ({ ...p, campeonato_id: ev.target.value }))} className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="">Selecione o campeonato</option>
                          {campeonatosPermitidos.map((camp) => <option key={camp.campeonato_id} value={camp.campeonato_id}>{camp.nome}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={salvarEdicaoContato} disabled={salvandoContato} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                            {salvandoContato ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                          </button>
                          <button onClick={() => setContatoEditando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.nome[0]}</div>
                          <div>
                            <p className="font-medium text-sm">{c.nome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.papel} · {c.telefone}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.campeonato_nome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => abrirEdicaoContato(c)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar contato"><Edit3 className="w-4 h-4" /></button>
                          {isMaster && (
                            <button onClick={() => deletarContato(c.contato_id)} className="text-destructive hover:opacity-70" title="Remover contato (apenas master)"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO CONTATO */}
        {aba === "novo_contato" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Cadastrar Contato-Chave</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Nome *</label><input type="text" value={novoContato.nome} onChange={(e) => setNovoContato(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Sandro Almeida" className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Telefone</label><input type="text" value={novoContato.telefone} onChange={(e) => setNovoContato(p => ({ ...p, telefone: e.target.value }))} placeholder="Ex: 11999999999" className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Papel</label><input type="text" value={novoContato.papel} onChange={(e) => setNovoContato(p => ({ ...p, papel: e.target.value }))} placeholder="Ex: Coordenador Liga Diadema" className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Campeonato *</label>
                <select value={novoContato.campeonato_id} onChange={(e) => setNovoContato(p => ({ ...p, campeonato_id: e.target.value }))} className={inputClass}>
                  <option value="">Selecione o campeonato</option>
                  {campeonatosPermitidos.map((c) => <option key={c.campeonato_id} value={c.campeonato_id}>{c.nome}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium mb-1.5 block">Observações</label><textarea value={novoContato.observacoes} onChange={(e) => setNovoContato(p => ({ ...p, observacoes: e.target.value }))} placeholder="Notas sobre o contato..." rows={4} className={`${inputClass} resize-none`} /></div>
              {msgContato && <p className={`text-sm font-medium ${msgContato.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgContato}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={criarContato} disabled={criandoContato} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{criandoContato ? "Salvando..." : "Cadastrar Contato"}</button>
                <button onClick={() => setNovoContato({ nome: "", telefone: "", papel: "", observacoes: "", campeonato_id: "" })} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: MATÉRIAS */}
        {aba === "materias" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Matérias Publicadas</h2>
              <button onClick={() => setAba("nova_materia")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"><PlusCircle className="w-4 h-4" /> Nova</button>
            </div>
            {loadingMaterias ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
              materias.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhuma matéria.</div> : (
              <div className="divide-y">
                {materias.map((m) => (
                  <div key={m.materia_id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{m.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.data_publicacao}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => abrirEdicaoMateria(m)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar matéria"><Edit3 className="w-4 h-4" /></button>
                      {isMaster && (
                        <button onClick={() => deletarMateria(m.materia_id)} className="text-destructive hover:opacity-70" title="Remover matéria (apenas master)"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVA MATÉRIA */}
        {aba === "nova_materia" && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Edit3 className="w-5 h-5 text-primary" /> Nova Matéria</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Título</label><input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Ex: Copa Elite Diadema 2026 começa com tudo!" className={inputClass} /></div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Foto (opcional)</label>
                {novoImagemUrl && <img src={novoImagemUrl} alt="Prévia" className="w-full max-h-56 object-cover rounded-xl mb-2" />}
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-4 text-sm text-muted-foreground hover:bg-muted/40 cursor-pointer transition-colors">
                  {enviandoImagemNova ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {enviandoImagemNova ? "Enviando..." : novoImagemUrl ? "Trocar foto" : "Escolher foto"}
                  <input type="file" accept="image/*" className="hidden" disabled={enviandoImagemNova} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImagemNova(f); }} />
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium block">Conteúdo</label>
                  <label className="flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:opacity-80">
                    {enviandoFotoTextoNova ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                    {enviandoFotoTextoNova ? "Enviando..." : "Inserir Foto no Texto"}
                    <input type="file" accept="image/*" className="hidden" disabled={enviandoFotoTextoNova} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInserirFotoNoTexto(f); e.target.value = ""; }} />
                  </label>
                </div>
                <textarea ref={novoConteudoRef} value={novoConteudo} onChange={(e) => setNovoConteudo(e.target.value)} placeholder="Escreva o conteúdo da matéria aqui... Posicione o cursor onde quiser e clique em 'Inserir Foto no Texto' pra colocar uma imagem no meio." rows={12} className={`${inputClass} resize-none`} />
                <p className="text-xs text-muted-foreground mt-1">Dica: clique no texto onde quer a foto antes de escolher o arquivo, ela entra ali. Depois vai perguntar a legenda — NÃO edite a linha da foto no texto na mão, pra não quebrar.</p>
              </div>
              {msgPublicacao && <p className={`text-sm font-medium ${msgPublicacao.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgPublicacao}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={publicarMateria} disabled={publicando || enviandoImagemNova} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{publicando ? "Publicando..." : "Publicar Matéria"}</button>
                <button onClick={() => { setNovoTitulo(""); setNovoConteudo(""); setNovoImagemUrl(""); setMsgPublicacao(""); }} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: EDITAR MATÉRIA */}
        {aba === "editar_materia" && materiaEditando && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Edit3 className="w-5 h-5 text-primary" /> Editar Matéria</h2>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Título</label><input type="text" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} className={inputClass} /></div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Foto (opcional)</label>
                {editImagemUrl && <img src={editImagemUrl} alt="Prévia" className="w-full max-h-56 object-cover rounded-xl mb-2" />}
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-4 text-sm text-muted-foreground hover:bg-muted/40 cursor-pointer transition-colors">
                  {enviandoImagemEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {enviandoImagemEdit ? "Enviando..." : editImagemUrl ? "Trocar foto" : "Escolher foto"}
                  <input type="file" accept="image/*" className="hidden" disabled={enviandoImagemEdit} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImagemEdit(f); }} />
                </label>
                {editImagemUrl && <button onClick={() => setEditImagemUrl("")} className="text-xs text-destructive mt-1.5 hover:underline">Remover foto</button>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium block">Conteúdo</label>
                  <label className="flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:opacity-80">
                    {enviandoFotoTextoEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                    {enviandoFotoTextoEdit ? "Enviando..." : "Inserir Foto no Texto"}
                    <input type="file" accept="image/*" className="hidden" disabled={enviandoFotoTextoEdit} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInserirFotoNoTextoEdit(f); e.target.value = ""; }} />
                  </label>
                </div>
                <textarea ref={editConteudoRef} value={editConteudo} onChange={(e) => setEditConteudo(e.target.value)} rows={14} className={`${inputClass} resize-none`} />
                <p className="text-xs text-muted-foreground mt-1">Dica: clique no texto onde quer a foto antes de escolher o arquivo, ela entra ali. Depois vai perguntar a legenda — NÃO edite a linha da foto no texto na mão, pra não quebrar.</p>
              </div>
              {msgEditMateria && <p className={`text-sm font-medium ${msgEditMateria.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgEditMateria}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={salvarEdicaoMateria} disabled={salvandoMateria || enviandoImagemEdit} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{salvandoMateria ? "Salvando..." : "Salvar Alterações"}</button>
                <button onClick={() => { setAba("materias"); setMateriaEditando(null); }} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Cancelar</button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal registrar gol/cartão em jogo (via aba Jogos → súmula) */}
      {modalSumulaTipo && modalSumulaTimeId && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center" onClick={fecharModalSumula}>
          <div className="bg-background w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{modalSumulaTipo === "gol" ? "Registrar Gol" : "Registrar Cartão"} — {modalSumulaTimeNome}</h3>
              <button onClick={fecharModalSumula}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Jogador *</label>
              {carregandoElencoSumula === modalSumulaTimeId ? (
                <p className="text-sm text-muted-foreground py-3">Carregando elenco...</p>
              ) : (elencoParaSumula[modalSumulaTimeId]?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-3">Esse time não tem jogadores cadastrados ainda.</p>
              ) : (
                <SeletorBusca
                  opcoes={(elencoParaSumula[modalSumulaTimeId] ?? []).map((jg) => ({ id: String(jg.jogador_id), label: jg.nome }))}
                  valor={modalSumulaJogadorId}
                  onSelecionar={setModalSumulaJogadorId}
                  placeholder="Buscar jogador..."
                />
              )}
            </div>

            {modalSumulaTipo === "cartao" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo de cartão *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setModalSumulaCartaoTipo("amarelo")}
                    className={`py-3 rounded-lg text-sm font-medium border-2 transition-colors ${modalSumulaCartaoTipo === "amarelo" ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-transparent bg-muted text-muted-foreground"}`}>
                    🟨 Amarelo
                  </button>
                  <button onClick={() => setModalSumulaCartaoTipo("vermelho")}
                    className={`py-3 rounded-lg text-sm font-medium border-2 transition-colors ${modalSumulaCartaoTipo === "vermelho" ? "border-red-500 bg-red-50 text-red-700" : "border-transparent bg-muted text-muted-foreground"}`}>
                    🟥 Vermelho
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Minuto</label>
                <input type="number" min="0" max="130" value={modalSumulaMinuto} onChange={(e) => setModalSumulaMinuto(e.target.value)} placeholder="Ex: 23"
                  className="w-full px-4 py-3 rounded-xl border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tempo</label>
                <select value={modalSumulaTempo} onChange={(e) => setModalSumulaTempo(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Não sei</option>
                  <option value="1">1º tempo</option>
                  <option value="2">2º tempo</option>
                </select>
              </div>
            </div>

            <button onClick={confirmarModalSumula} disabled={!modalSumulaJogadorId || processandoSumula}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl text-base font-semibold hover:opacity-90 disabled:opacity-50">
              {processandoSumula ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Admin;
