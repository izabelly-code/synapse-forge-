import { useEffect, useMemo, useRef, useState } from "react";
import { Activity01Icon, Alert02Icon, ArrowDown01Icon, Calendar03Icon, CheckmarkCircle02Icon, Clock01Icon, FilterIcon, GridViewIcon, InboxIcon, LeftToRightListBulletIcon, PlusSignIcon, ShoppingBag01Icon, Tick02Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { getPedidos, avancarStatus, regredirStatus, deletarPedido } from "../../services/PedidoService";
import { getCached, setCached } from "../../services/cache";
import PedidoRow from "./PedidoRow";
import NovoPedidoModal from "./NovoPedidoModal";
import PedidoDetalheModal from "./PedidoDetalheModal";
import { Pedido, PedidoStatus } from "../../types";
import { cn } from "../../utils/cn";
import { useDismissable } from "../../hooks/useDismissable";
import ViewToggle from "../ui/ViewToggle";
import SearchField from "../ui/SearchField";
import NotificationBell from "../ui/NotificationBell";

const FILTRO_VALUES: (PedidoStatus | "")[] = ["", "MODELAGEM", "IMPRESSAO", "PINTURA", "ACABAMENTO", "FINALIZADO"];

const CACHE_KEY = "pedidos:all";

type PeriodoKey = "all" | "semana" | "mes" | "atrasados";
const PERIODO_I18N: Record<PeriodoKey, string> = {
    all: "pedidos.dashboard.periodAll",
    semana: "pedidos.dashboard.periodWeek",
    mes: "pedidos.dashboard.periodMonth",
    atrasados: "pedidos.dashboard.periodLate",
};

type OrdKey = "recentes" | "prazo-asc" | "prazo-desc";
const ORDENACAO_I18N: Record<OrdKey, string> = {
    recentes: "pedidos.dashboard.sortDefault",
    "prazo-asc": "pedidos.dashboard.sortDeadlineAsc",
    "prazo-desc": "pedidos.dashboard.sortDeadlineDesc",
};

function startOfToday(): number {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function dentroDoPeriodo(p: Pedido, periodo: PeriodoKey): boolean {
    if (periodo === "all") return true;
    const t = new Date(p.prazo).getTime();
    const inicio = startOfToday();
    if (periodo === "atrasados") return p.status !== "FINALIZADO" && t < inicio;
    if (periodo === "semana") return t >= inicio && t < inicio + 7 * 24 * 60 * 60 * 1000;
    const agora = new Date();
    const iniMes = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).getTime();
    return t >= iniMes && t < fimMes;
}

function ehHoje(prazo: string): boolean {
    const inicio = startOfToday();
    const fim = inicio + 24 * 60 * 60 * 1000;
    const t = new Date(prazo).getTime();
    return t >= inicio && t < fim;
}

function ehAtrasado(prazo: string): boolean {
    return new Date(prazo).getTime() < startOfToday();
}

function PedidosDashboard() {
    const { t } = useTranslation();
    const initialCached = getCached<Pedido[]>(CACHE_KEY);
    const [pedidos, setPedidos] = useState<Pedido[]>(initialCached ?? []);
    const [filtro, setFiltro] = useState<PedidoStatus | "">("");
    const [busca, setBusca] = useState("");
    const [loadingIds, setLoadingIds] = useState(new Set<string>());
    const [fetching, setFetching] = useState(initialCached === undefined);
    const [error, setError] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [pedidoDetalheId, setPedidoDetalheId] = useState<string | null>(null);
    const [detalheEmEdicao, setDetalheEmEdicao] = useState(false);
    const [periodo, setPeriodo] = useState<PeriodoKey>("all");
    const [ordenacao, setOrdenacao] = useState<OrdKey>("recentes");
    const [menuAberto, setMenuAberto] = useState<null | "periodo" | "filtros">(null);
    const [recemAvancado, setRecemAvancado] = useState<string | null>(null);
    const [view, setView] = useState<"list" | "grid">(() => (localStorage.getItem("pedidosView") === "grid" ? "grid" : "list"));

    function alternarView(v: "list" | "grid") {
        setView(v);
        localStorage.setItem("pedidosView", v);
    }

    const buscaRef = useRef<HTMLInputElement>(null);
    const periodoRef = useRef<HTMLDivElement>(null);
    const filtrosRef = useRef<HTMLDivElement>(null);
    const avancoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (avancoTimer.current) clearTimeout(avancoTimer.current); }, []);

    function updatePedidos(updater: Pedido[] | ((prev: Pedido[]) => Pedido[])) {
        setPedidos((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            setCached(CACHE_KEY, next);
            return next;
        });
    }

    async function fetchPedidos() {
        if (getCached<Pedido[]>(CACHE_KEY) === undefined) setFetching(true);
        setError("");
        try {
            updatePedidos(await getPedidos());
        } catch {
            setError(t("pedidos.dashboard.errorLoad"));
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchPedidos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                buscaRef.current?.focus();
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    useDismissable({
        enabled: menuAberto !== null,
        refs: [periodoRef, filtrosRef],
        onDismiss: () => setMenuAberto(null),
    });

    const counts = useMemo(() => {
        const base: Record<string, number> = { "": pedidos.length };
        for (const p of pedidos) base[p.status] = (base[p.status] ?? 0) + 1;
        return base;
    }, [pedidos]);

    const stats = useMemo(() => {
        let emProducao = 0, hoje = 0, atrasados = 0, finalizados = 0;
        for (const p of pedidos) {
            const fim = p.status === "FINALIZADO";
            if (fim) { finalizados++; continue; }
            emProducao++;
            if (ehAtrasado(p.prazo)) atrasados++;
            else if (ehHoje(p.prazo)) hoje++;
        }
        return { total: pedidos.length, emProducao, hoje, atrasados, finalizados };
    }, [pedidos]);

    const urgentes = useMemo(
        () => pedidos
            .filter((p) => p.status !== "FINALIZADO" && (ehAtrasado(p.prazo) || ehHoje(p.prazo)))
            .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime()),
        [pedidos]
    );

    const visiveis = useMemo(() => {
        const q = busca.trim().toLowerCase();
        const arr = pedidos.filter((p) => {
            if (filtro && p.status !== filtro) return false;
            if (!dentroDoPeriodo(p, periodo)) return false;
            if (!q) return true;
            return (
                p.cliente.toLowerCase().includes(q) ||
                p.projeto.toLowerCase().includes(q) ||
                (p.descricao?.toLowerCase().includes(q) ?? false)
            );
        });
        if (ordenacao === "recentes") return arr;
        return [...arr].sort((a, b) => {
            const d = new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
            return ordenacao === "prazo-asc" ? d : -d;
        });
    }, [pedidos, filtro, busca, periodo, ordenacao]);

    const statCards = [
        { key: "total", label: t("pedidos.dashboard.statTotal"), value: stats.total, icon: <ShoppingBag01Icon size={18} /> },
        { key: "producao", label: t("pedidos.dashboard.statInProduction"), value: stats.emProducao, icon: <Activity01Icon size={18} /> },
        { key: "hoje", label: t("pedidos.dashboard.statDueToday"), value: stats.hoje, icon: <Clock01Icon size={18} /> },
        { key: "atrasados", label: t("pedidos.dashboard.statLate"), value: stats.atrasados, icon: <Alert02Icon size={18} /> },
        { key: "finalizados", label: t("pedidos.dashboard.statDone"), value: stats.finalizados, icon: <CheckmarkCircle02Icon size={18} /> },
    ];

    async function handleDeletar(id: string) {
        try {
            await deletarPedido(id);
            updatePedidos((prev) => prev.filter((p) => p.id !== id));
        } catch {
            setError(t("pedidos.dashboard.errorDelete"));
        }
    }

    async function handleAvancar(id: string) {
        setLoadingIds((prev) => new Set(prev).add(id));
        try {
            const updated = await avancarStatus(id);
            updatePedidos((prev) => prev.map((p) => (p.id === id ? updated : p)));
            setRecemAvancado(id);
            if (avancoTimer.current) clearTimeout(avancoTimer.current);
            avancoTimer.current = setTimeout(() => setRecemAvancado(null), 600);
        } catch {
            setError(t("pedidos.dashboard.errorAdvance"));
        } finally {
            setLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    async function handleRegredir(id: string) {
        setLoadingIds((prev) => new Set(prev).add(id));
        try {
            const updated = await regredirStatus(id);
            updatePedidos((prev) => prev.map((p) => (p.id === id ? updated : p)));
            setRecemAvancado(id);
            if (avancoTimer.current) clearTimeout(avancoTimer.current);
            avancoTimer.current = setTimeout(() => setRecemAvancado(null), 600);
        } catch {
            setError(t("pedidos.dashboard.errorRegress"));
        } finally {
            setLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    return (
        <>
            {modalAberto && (
                <NovoPedidoModal
                    onClose={() => setModalAberto(false)}
                    onCriado={() => { setModalAberto(false); fetchPedidos(); }}
                />
            )}
            {pedidoDetalheId && (
                <PedidoDetalheModal
                    pedidoId={pedidoDetalheId}
                    abrirEmEdicao={detalheEmEdicao}
                    onClose={() => { setPedidoDetalheId(null); setDetalheEmEdicao(false); }}
                    onUpdated={(atualizado) => {
                        updatePedidos((prev) => prev.map((p) => p.id === atualizado.id ? atualizado : p));
                    }}
                />
            )}

            <main className="dashboard-main pedidos-page">
                <header className="pedidos-toolbar">
                    <div>
                        <h1 className="dashboard-title">{t("pedidos.dashboard.title")}</h1>
                        <p className="dashboard-subtitle">{t("pedidos.dashboard.subtitle")}</p>
                    </div>

                    <div className="toolbar-actions">
                        <SearchField
                            variant="pill"
                            inputRef={buscaRef}
                            value={busca}
                            onChange={setBusca}
                            placeholder={t("pedidos.dashboard.searchPlaceholder")}
                            ariaLabel={t("pedidos.dashboard.searchAria")}
                            trailing={<kbd className="search-kbd">⌘K</kbd>}
                        />

                        <NotificationBell
                            ariaLabel={t("pedidos.dashboard.notificationsAria")}
                            panelTitle={t("pedidos.dashboard.notifTitle")}
                            emptyText={t("pedidos.dashboard.notifEmpty")}
                            items={urgentes.map((p) => {
                                const atrasado = ehAtrasado(p.prazo);
                                return {
                                    id: p.id,
                                    title: p.projeto,
                                    subtitle: p.cliente,
                                    tone: atrasado ? "danger" : "warn",
                                    tagLabel: atrasado ? t("pedidos.dashboard.tagLate") : t("pedidos.dashboard.tagDueToday"),
                                    onSelect: () => setPedidoDetalheId(p.id),
                                };
                            })}
                        />

                        <button className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                            <PlusSignIcon size={16} strokeWidth={2.25} />
                            {t("pedidos.dashboard.newOrder")}
                        </button>
                    </div>
                </header>

                <section className="stat-cards" aria-label={t("pedidos.dashboard.statsAria")}>
                    {statCards.map((s) => (
                        <div key={s.key} className="stat-card">
                            <span className="stat-icon">{s.icon}</span>
                            <div className="stat-body">
                                <span className="stat-value">{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        </div>
                    ))}
                </section>

                <div className="filtros-bar">
                    <div className="filtros-tabs">
                        {FILTRO_VALUES.map((valor) => (
                            <button
                                key={valor}
                                className={cn("filtro-btn", filtro === valor && "filtro-ativo")}
                                onClick={() => setFiltro(valor)}
                            >
                                {valor === "" ? t("pedidos.dashboard.filterAll") : t(`pedidos.status.${valor}`)}
                                <span className="filtro-count">{counts[valor] ?? 0}</span>
                            </button>
                        ))}
                    </div>

                    <div className="filtros-actions">
                        <ViewToggle
                            value={view}
                            onChange={alternarView}
                            ariaLabel={t("pedidos.dashboard.viewModeAria")}
                            options={[
                                { value: "list", icon: <LeftToRightListBulletIcon size={16} />, label: t("pedidos.dashboard.viewList") },
                                { value: "grid", icon: <GridViewIcon size={16} />, label: t("pedidos.dashboard.viewGrid") },
                            ]}
                        />

                        <div className="filtro-menu" ref={periodoRef}>
                            <button
                                type="button"
                                className={cn("filtro-action", periodo !== "all" && "is-active")}
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "periodo"}
                                onClick={() => setMenuAberto((m) => (m === "periodo" ? null : "periodo"))}
                            >
                                <Calendar03Icon size={15} />
                                {t(PERIODO_I18N[periodo])}
                                <ArrowDown01Icon size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "periodo" && (
                                <div className="filtro-dropdown" role="menu">
                                    {(Object.keys(PERIODO_I18N) as PeriodoKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={periodo === k}
                                            className={cn("filtro-option", periodo === k && "selected")}
                                            onClick={() => { setPeriodo(k); setMenuAberto(null); }}
                                        >
                                            {t(PERIODO_I18N[k])}
                                            {periodo === k && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="filtro-menu" ref={filtrosRef}>
                            <button
                                type="button"
                                className={cn("filtro-action", ordenacao !== "recentes" && "is-active")}
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "filtros"}
                                onClick={() => setMenuAberto((m) => (m === "filtros" ? null : "filtros"))}
                            >
                                <FilterIcon size={15} />
                                {t("pedidos.dashboard.filtersButton")}
                            </button>
                            {menuAberto === "filtros" && (
                                <div className="filtro-dropdown" role="menu">
                                    {(Object.keys(ORDENACAO_I18N) as OrdKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={ordenacao === k}
                                            className={cn("filtro-option", ordenacao === k && "selected")}
                                            onClick={() => { setOrdenacao(k); setMenuAberto(null); }}
                                        >
                                            {t(ORDENACAO_I18N[k])}
                                            {ordenacao === k && <Tick02Icon size={15} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && <div className="dashboard-error">{error}</div>}

                {fetching ? (
                    <div className="pedidos-list">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="pedido-row-skeleton" />
                        ))}
                    </div>
                ) : visiveis.length === 0 ? (
                    <div className="pedidos-empty">
                        <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                        <p className="empty-title">{t("pedidos.dashboard.emptyTitle")}</p>
                        <p className="empty-sub">
                            {busca ? t("pedidos.dashboard.emptySearchHint") : filtro ? t("pedidos.dashboard.emptyFilterHint") : t("pedidos.dashboard.emptyCta")}
                        </p>
                        {!filtro && !busca && (
                            <button className="button btn-novo-pedido empty-cta" onClick={() => setModalAberto(true)}>
                                <PlusSignIcon size={16} strokeWidth={2.25} />
                                {t("pedidos.dashboard.newOrder")}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={view === "grid" ? "pedidos-grid" : "pedidos-list"}>
                        {view === "list" && (
                            <div className="pedidos-row-head" aria-hidden="true">
                                <span>{t("pedidos.dashboard.headOrder")}</span>
                                <span>{t("pedidos.dashboard.headClient")}</span>
                                <span>{t("pedidos.dashboard.headProject")}</span>
                                <span>{t("pedidos.dashboard.headDeadline")}</span>
                                <span>{t("pedidos.dashboard.headProgress")}</span>
                                <span />
                            </div>
                        )}
                        {visiveis.map((pedido, i) => (
                            <PedidoRow
                                key={pedido.id}
                                pedido={pedido}
                                index={i}
                                onAvancar={handleAvancar}
                                onRegredir={handleRegredir}
                                onDeletar={handleDeletar}
                                onAbrir={(p) => { setDetalheEmEdicao(false); setPedidoDetalheId(p.id); }}
                                onEditar={(p) => { setDetalheEmEdicao(true); setPedidoDetalheId(p.id); }}
                                loading={loadingIds.has(pedido.id)}
                                justAdvanced={recemAvancado === pedido.id}
                            />
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}

export default PedidosDashboard;
