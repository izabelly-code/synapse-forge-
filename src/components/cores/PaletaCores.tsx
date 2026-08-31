import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown01Icon, DropletIcon, GridViewIcon, LeftToRightListBulletIcon, Tick02Icon } from "hugeicons-react";
import { getCores, deletarCor } from "../../services/CorService";
import { getCached, setCached } from "../../services/cache";
import CorCard from "./CorCard";
import NovaCorModal from "./NovaCorModal";
import { Cor, Acabamento } from "../../types";
import { cn } from "../../utils/cn";
import { useDismissable } from "../../hooks/useDismissable";
import ViewToggle from "../ui/ViewToggle";
import SearchField from "../ui/SearchField";
import MenuSurface from "../ui/MenuSurface";
import SkeletonSwap from "../ui/SkeletonSwap";
import { useFlipList } from "../../hooks/useFlipList";

const CACHE_KEY = "cores:all";

const ACABAMENTO_LABEL: Record<Acabamento, string> = {
    FOSCO: "Fosco",
    BRILHANTE: "Brilhante",
    METALICO: "Metálico",
    CETIM: "Cetim",
};

type EstoqueKey = "all" | "ok" | "baixo";
const ESTOQUE_LABELS: Record<EstoqueKey, string> = {
    all: "Estoque: Todos",
    ok: "Em estoque",
    baixo: "Estoque baixo",
};

type OrdKey = "nome-asc" | "nome-desc" | "custo-asc" | "custo-desc" | "estoque-desc" | "estoque-asc";
const ORDENACAO_LABELS: Record<OrdKey, string> = {
    "nome-asc": "Nome (A-Z)",
    "nome-desc": "Nome (Z-A)",
    "custo-asc": "Custo (menor)",
    "custo-desc": "Custo (maior)",
    "estoque-desc": "Estoque (maior)",
    "estoque-asc": "Estoque (menor)",
};

type MenuAberto = null | "fornecedor" | "estoque" | "acabamento" | "ordenacao";

function PaletaCores() {
    const initialCached = getCached<Cor[]>(CACHE_KEY);
    const [cores, setCores] = useState<Cor[]>(initialCached ?? []);
    const [fetching, setFetching] = useState(initialCached === undefined);
    const [error, setError] = useState("");

    const [busca, setBusca] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [estoque, setEstoque] = useState<EstoqueKey>("all");
    const [acabamento, setAcabamento] = useState<"" | Acabamento>("");
    const [ordenacao, setOrdenacao] = useState<OrdKey>("nome-asc");
    const [view, setView] = useState<"grid" | "list">(() => (localStorage.getItem("coresView") === "list" ? "list" : "grid"));

    const [menuAberto, setMenuAberto] = useState<MenuAberto>(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [corEditando, setCorEditando] = useState<Cor | null>(null);

    const buscaRef = useRef<HTMLInputElement>(null);
    const barraRef = useRef<HTMLDivElement>(null);
    const listaRef = useRef<HTMLDivElement>(null);

    function alternarView(v: "grid" | "list") {
        setView(v);
        localStorage.setItem("coresView", v);
    }

    function updateCores(updater: Cor[] | ((prev: Cor[]) => Cor[])) {
        setCores((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            setCached(CACHE_KEY, next);
            return next;
        });
    }

    async function fetchCores() {
        if (getCached<Cor[]>(CACHE_KEY) === undefined) setFetching(true);
        setError("");
        try {
            updateCores(await getCores());
        } catch {
            setError("Erro ao carregar as cores. Tente novamente.");
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchCores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useDismissable({
        enabled: menuAberto !== null,
        refs: barraRef,
        onDismiss: () => setMenuAberto(null),
    });

    const fornecedores = useMemo(
        () => Array.from(new Set(cores.map((c) => c.fornecedor))).sort((a, b) => a.localeCompare(b, "pt-BR")),
        [cores]
    );

    const acabamentos = useMemo(
        () => Array.from(new Set(cores.map((c) => c.acabamento))),
        [cores]
    );

    const filtrosAtivos = busca.trim() !== "" || fornecedor !== "" || estoque !== "all" || acabamento !== "";

    function limparFiltros() {
        setBusca("");
        setFornecedor("");
        setEstoque("all");
        setAcabamento("");
        setMenuAberto(null);
    }

    const visiveis = useMemo(() => {
        const q = busca.trim().toLowerCase();
        const arr = cores.filter((c) => {
            if (fornecedor && c.fornecedor !== fornecedor) return false;
            if (acabamento && c.acabamento !== acabamento) return false;
            const baixo = c.estoqueMl < c.estoqueMinimoMl;
            if (estoque === "baixo" && !baixo) return false;
            if (estoque === "ok" && baixo) return false;
            if (!q) return true;
            return (
                c.nome.toLowerCase().includes(q) ||
                c.fornecedor.toLowerCase().includes(q) ||
                (c.codigo?.toLowerCase().includes(q) ?? false)
            );
        });
        const ordenada = [...arr];
        ordenada.sort((a, b) => {
            switch (ordenacao) {
                case "nome-asc": return a.nome.localeCompare(b.nome, "pt-BR");
                case "nome-desc": return b.nome.localeCompare(a.nome, "pt-BR");
                case "custo-asc": return a.custoMl - b.custoMl;
                case "custo-desc": return b.custoMl - a.custoMl;
                case "estoque-desc": return b.estoqueMl - a.estoqueMl;
                case "estoque-asc": return a.estoqueMl - b.estoqueMl;
                default: return 0;
            }
        });
        return ordenada;
    }, [cores, busca, fornecedor, acabamento, estoque, ordenacao]);

    // Filtrar e ordenar reorganiza a grade: os cards viajam para o novo lugar
    // em vez de a grade inteira ser redesenhada do zero.
    useFlipList(listaRef, visiveis.map((c) => c.id).join("|"));

    async function handleDeletar(id: string) {
        try {
            await deletarCor(id);
            updateCores((prev) => prev.filter((c) => c.id !== id));
        } catch {
            setError("Falha ao excluir a cor.");
        }
    }

    function fecharModal() {
        setModalAberto(false);
        setCorEditando(null);
    }

    const fornecedorLabel = fornecedor || "Fornecedor: Todos";
    const acabamentoLabel = acabamento ? `Acabamento: ${ACABAMENTO_LABEL[acabamento]}` : "Acabamento: Todos";

    return (
        <>
            {(modalAberto || corEditando) && (
                <NovaCorModal
                    cor={corEditando ?? undefined}
                    onClose={fecharModal}
                    onSalvo={() => { fecharModal(); fetchCores(); }}
                />
            )}

            <main className="dashboard-main pedidos-page">
                <header className="pedidos-toolbar">
                    <div>
                        <h1 className="dashboard-title">Paleta de Cores</h1>
                        <p className="dashboard-subtitle">Gerencie as cores, tintas e pigmentos usados na produção.</p>
                    </div>

                    <div className="toolbar-actions">
                        <button className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                            + Nova cor
                        </button>
                    </div>
                </header>

                <SearchField
                    variant="boxed"
                    inputRef={buscaRef}
                    value={busca}
                    onChange={setBusca}
                    placeholder="Buscar por nome da cor, fornecedor ou código..."
                    ariaLabel="Buscar cores"
                />

                <div className="filtros-bar cores-filtros" ref={barraRef}>
                    <div className="filtros-tabs cores-filtros-left">
                        <div className="filtro-menu">
                            <button
                                type="button"
                                className={cn("filtro-action", fornecedor && "is-active")}
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "fornecedor"}
                                onClick={() => setMenuAberto((m) => (m === "fornecedor" ? null : "fornecedor"))}
                            >
                                {fornecedorLabel}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "fornecedor" && (
                                <MenuSurface className="filtro-dropdown" role="menu">
                                    <button
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={fornecedor === ""}
                                        className={cn("filtro-option", fornecedor === "" && "selected")}
                                        onClick={() => { setFornecedor(""); setMenuAberto(null); }}
                                    >
                                        Todos
                                        {fornecedor === "" && <Tick02Icon size={15} />}
                                    </button>
                                    {fornecedores.map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={fornecedor === f}
                                            className={cn("filtro-option", fornecedor === f && "selected")}
                                            onClick={() => { setFornecedor(f); setMenuAberto(null); }}
                                        >
                                            {f}
                                            {fornecedor === f && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </MenuSurface>
                            )}
                        </div>

                        <div className="filtro-menu">
                            <button
                                type="button"
                                className={cn("filtro-action", estoque !== "all" && "is-active")}
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "estoque"}
                                onClick={() => setMenuAberto((m) => (m === "estoque" ? null : "estoque"))}
                            >
                                {ESTOQUE_LABELS[estoque]}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "estoque" && (
                                <MenuSurface className="filtro-dropdown" role="menu">
                                    {(Object.keys(ESTOQUE_LABELS) as EstoqueKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={estoque === k}
                                            className={cn("filtro-option", estoque === k && "selected")}
                                            onClick={() => { setEstoque(k); setMenuAberto(null); }}
                                        >
                                            {ESTOQUE_LABELS[k]}
                                            {estoque === k && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </MenuSurface>
                            )}
                        </div>

                        <div className="filtro-menu">
                            <button
                                type="button"
                                className={cn("filtro-action", acabamento && "is-active")}
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "acabamento"}
                                onClick={() => setMenuAberto((m) => (m === "acabamento" ? null : "acabamento"))}
                            >
                                {acabamentoLabel}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "acabamento" && (
                                <MenuSurface className="filtro-dropdown" role="menu">
                                    <button
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={acabamento === ""}
                                        className={cn("filtro-option", acabamento === "" && "selected")}
                                        onClick={() => { setAcabamento(""); setMenuAberto(null); }}
                                    >
                                        Todos
                                        {acabamento === "" && <Tick02Icon size={15} />}
                                    </button>
                                    {acabamentos.map((a) => (
                                        <button
                                            key={a}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={acabamento === a}
                                            className={cn("filtro-option", acabamento === a && "selected")}
                                            onClick={() => { setAcabamento(a); setMenuAberto(null); }}
                                        >
                                            {ACABAMENTO_LABEL[a]}
                                            {acabamento === a && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </MenuSurface>
                            )}
                        </div>

                        {filtrosAtivos && (
                            <button type="button" className="cores-limpar" onClick={limparFiltros}>
                                Limpar filtros
                            </button>
                        )}
                    </div>

                    <div className="filtros-actions">
                        <div className="filtro-menu">
                            <button
                                type="button"
                                className="filtro-action"
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "ordenacao"}
                                onClick={() => setMenuAberto((m) => (m === "ordenacao" ? null : "ordenacao"))}
                            >
                                Ordenar: {ORDENACAO_LABELS[ordenacao]}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "ordenacao" && (
                                <MenuSurface className="filtro-dropdown" role="menu">
                                    {(Object.keys(ORDENACAO_LABELS) as OrdKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={ordenacao === k}
                                            className={cn("filtro-option", ordenacao === k && "selected")}
                                            onClick={() => { setOrdenacao(k); setMenuAberto(null); }}
                                        >
                                            {ORDENACAO_LABELS[k]}
                                            {ordenacao === k && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </MenuSurface>
                            )}
                        </div>

                        <ViewToggle
                            value={view}
                            onChange={alternarView}
                            ariaLabel="Modo de visualização"
                            options={[
                                { value: "grid", icon: <GridViewIcon size={16} />, label: "Visualizar em grade" },
                                { value: "list", icon: <LeftToRightListBulletIcon size={16} />, label: "Visualizar em lista" },
                            ]}
                        />
                    </div>
                </div>

                {error && <div className="dashboard-error">{error}</div>}

                <SkeletonSwap
                    ready={!fetching}
                    label="Paleta de Cores"
                    skeleton={
                        <div className="cores-grid">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="cor-card-skeleton" />
                            ))}
                        </div>
                    }
                >
                    {fetching ? null : visiveis.length === 0 ? (
                        <div className="pedidos-empty">
                            <span className="pedidos-empty-icon"><DropletIcon size={28} /></span>
                            <p className="empty-title">Nenhuma cor encontrada</p>
                            <p className="empty-sub">
                                {filtrosAtivos ? "Tente ajustar a busca ou os filtros." : "Cadastre a primeira cor para começar a paleta."}
                            </p>
                            {!filtrosAtivos && (
                                <button className="button btn-novo-pedido empty-cta" onClick={() => setModalAberto(true)}>
                                    + Nova cor
                                </button>
                            )}
                        </div>
                    ) : (
                        <div key={view} ref={listaRef} className={view === "grid" ? "cores-grid" : "cores-list"}>
                            {view === "list" && (
                                <div className="cor-row-head" aria-hidden="true">
                                    <span />
                                    <span>Cor</span>
                                    <span>Acabamento</span>
                                    <span>Estoque</span>
                                    <span>Custo/ml</span>
                                    <span />
                                </div>
                            )}
                            {visiveis.map((cor, i) => (
                                <CorCard
                                    key={cor.id}
                                    cor={cor}
                                    index={i}
                                    view={view}
                                    onEditar={setCorEditando}
                                    onDeletar={handleDeletar}
                                />
                            ))}
                        </div>
                    )}
                </SkeletonSwap>
            </main>
        </>
    );
}

export default PaletaCores;
