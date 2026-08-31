import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown01Icon, DropletIcon, GridViewIcon, LeftToRightListBulletIcon, Tick02Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
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

type EstoqueKey = "all" | "ok" | "baixo";
const ESTOQUE_KEYS: Record<EstoqueKey, string> = {
    all: "cores.paleta.stockAll",
    ok: "cores.paleta.stockOk",
    baixo: "cores.paleta.stockLow",
};

type OrdKey = "nome-asc" | "nome-desc" | "custo-asc" | "custo-desc" | "estoque-desc" | "estoque-asc";
const ORDENACAO_KEYS: Record<OrdKey, string> = {
    "nome-asc": "cores.paleta.sortNameAsc",
    "nome-desc": "cores.paleta.sortNameDesc",
    "custo-asc": "cores.paleta.sortCostAsc",
    "custo-desc": "cores.paleta.sortCostDesc",
    "estoque-desc": "cores.paleta.sortStockDesc",
    "estoque-asc": "cores.paleta.sortStockAsc",
};

type MenuAberto = null | "fornecedor" | "estoque" | "acabamento" | "ordenacao";

function PaletaCores() {
    const { t } = useTranslation();
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
            setError(t("cores.paleta.errorLoad"));
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
            setError(t("cores.paleta.errorDelete"));
        }
    }

    function fecharModal() {
        setModalAberto(false);
        setCorEditando(null);
    }

    const fornecedorLabel = fornecedor || t("cores.paleta.supplierAll");
    const acabamentoLabel = acabamento
        ? t("cores.paleta.finishSelected", { finish: t(`cores.acabamento.${acabamento}`) })
        : t("cores.paleta.finishAll");

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
                        <h1 className="dashboard-title">{t("cores.paleta.title")}</h1>
                        <p className="dashboard-subtitle">{t("cores.paleta.subtitle")}</p>
                    </div>

                    <div className="toolbar-actions">
                        <button className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                            + {t("cores.paleta.newColor")}
                        </button>
                    </div>
                </header>

                <SearchField
                    variant="boxed"
                    inputRef={buscaRef}
                    value={busca}
                    onChange={setBusca}
                    placeholder={t("cores.paleta.searchPlaceholder")}
                    ariaLabel={t("cores.paleta.searchAria")}
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
                                        {t("cores.paleta.all")}
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
                                {t(ESTOQUE_KEYS[estoque])}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "estoque" && (
                                <MenuSurface className="filtro-dropdown" role="menu">
                                    {(Object.keys(ESTOQUE_KEYS) as EstoqueKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={estoque === k}
                                            className={cn("filtro-option", estoque === k && "selected")}
                                            onClick={() => { setEstoque(k); setMenuAberto(null); }}
                                        >
                                            {t(ESTOQUE_KEYS[k])}
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
                                        {t("cores.paleta.all")}
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
                                            {t(`cores.acabamento.${a}`)}
                                            {acabamento === a && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </MenuSurface>
                            )}
                        </div>

                        {filtrosAtivos && (
                            <button type="button" className="cores-limpar" onClick={limparFiltros}>
                                {t("cores.paleta.clearFilters")}
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
                                {t("cores.paleta.sortLabel", { order: t(ORDENACAO_KEYS[ordenacao]) })}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "ordenacao" && (
                                <MenuSurface className="filtro-dropdown" role="menu">
                                    {(Object.keys(ORDENACAO_KEYS) as OrdKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={ordenacao === k}
                                            className={cn("filtro-option", ordenacao === k && "selected")}
                                            onClick={() => { setOrdenacao(k); setMenuAberto(null); }}
                                        >
                                            {t(ORDENACAO_KEYS[k])}
                                            {ordenacao === k && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </MenuSurface>
                            )}
                        </div>

                        <ViewToggle
                            value={view}
                            onChange={alternarView}
                            ariaLabel={t("cores.paleta.viewModeAria")}
                            options={[
                                { value: "grid", icon: <GridViewIcon size={16} />, label: t("cores.paleta.viewGrid") },
                                { value: "list", icon: <LeftToRightListBulletIcon size={16} />, label: t("cores.paleta.viewList") },
                            ]}
                        />
                    </div>
                </div>

                {error && <div className="dashboard-error">{error}</div>}

                <SkeletonSwap
                    ready={!fetching}
                    label={t("cores.paleta.title")}
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
                            <p className="empty-title">{t("cores.paleta.emptyTitle")}</p>
                            <p className="empty-sub">
                                {filtrosAtivos ? t("cores.paleta.emptyFilterHint") : t("cores.paleta.emptyCta")}
                            </p>
                            {!filtrosAtivos && (
                                <button className="button btn-novo-pedido empty-cta" onClick={() => setModalAberto(true)}>
                                    + {t("cores.paleta.newColor")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div key={view} ref={listaRef} className={view === "grid" ? "cores-grid" : "cores-list"}>
                            {view === "list" && (
                                <div className="cor-row-head" aria-hidden="true">
                                    <span />
                                    <span>{t("cores.paleta.headColor")}</span>
                                    <span>{t("cores.paleta.headFinish")}</span>
                                    <span>{t("cores.paleta.headStock")}</span>
                                    <span>{t("cores.paleta.headCost")}</span>
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
