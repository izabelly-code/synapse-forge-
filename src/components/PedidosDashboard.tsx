import { useEffect, useMemo, useRef, useState } from "react";
import {
    FiInbox, FiSearch, FiBell, FiBox, FiActivity, FiClock, FiAlertTriangle, FiCheckCircle,
    FiCalendar, FiChevronDown, FiFilter, FiCheck, FiList, FiGrid,
} from "react-icons/fi";
import { getPedidos, avancarStatus, regredirStatus, deletarPedido } from "../services/PedidoService";
import { getCached, setCached } from "../services/cache";
import PedidoRow from "./PedidoRow";
import NovoPedidoModal from "./NovoPedidoModal";
import PedidoDetalheModal from "./PedidoDetalheModal";
import { Pedido, PedidoStatus } from "../types";

interface Filtro {
    label: string;
    value: PedidoStatus | "";
}

const FILTROS: Filtro[] = [
    { label: "Todos", value: "" },
    { label: "Modelagem", value: "MODELAGEM" },
    { label: "Impressão", value: "IMPRESSAO" },
    { label: "Pintura", value: "PINTURA" },
    { label: "Acabamento", value: "ACABAMENTO" },
    { label: "Finalizado", value: "FINALIZADO" },
];

const CACHE_KEY = "pedidos:all";

type PeriodoKey = "all" | "semana" | "mes" | "atrasados";
const PERIODO_LABELS: Record<PeriodoKey, string> = {
    all: "Todos os prazos",
    semana: "Próx. 7 dias",
    mes: "Este mês",
    atrasados: "Atrasados",
};

type OrdKey = "recentes" | "prazo-asc" | "prazo-desc";
const ORDENACAO_LABELS: Record<OrdKey, string> = {
    recentes: "Padrão",
    "prazo-asc": "Prazo: mais próximo",
    "prazo-desc": "Prazo: mais distante",
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
    const initialCached = getCached<Pedido[]>(CACHE_KEY);
    const [pedidos, setPedidos] = useState<Pedido[]>(initialCached ?? []);
    const [filtro, setFiltro] = useState<PedidoStatus | "">("");
    const [busca, setBusca] = useState("");
    const [loadingIds, setLoadingIds] = useState(new Set<string>());
    const [fetching, setFetching] = useState(initialCached === undefined);
    const [error, setError] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [pedidoDetalheId, setPedidoDetalheId] = useState<string | null>(null);
    const [notifAberto, setNotifAberto] = useState(false);
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
    const notifRef = useRef<HTMLDivElement>(null);
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
            setError("Erro ao carregar pedidos. Verifique se o servidor está rodando.");
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

    useEffect(() => {
        if (!notifAberto) return;
        function onClick(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifAberto(false);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [notifAberto]);

    useEffect(() => {
        if (!menuAberto) return;
        function onClick(e: MouseEvent) {
            const t = e.target as Node;
            if (periodoRef.current?.contains(t) || filtrosRef.current?.contains(t)) return;
            setMenuAberto(null);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuAberto]);

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
        { key: "total", label: "Total de Pedidos", value: stats.total, icon: <FiBox size={18} />, tone: "neutral" },
        { key: "producao", label: "Em Produção", value: stats.emProducao, icon: <FiActivity size={18} />, tone: "brand" },
        { key: "hoje", label: "Prazo Hoje", value: stats.hoje, icon: <FiClock size={18} />, tone: "warn" },
        { key: "atrasados", label: "Atrasados", value: stats.atrasados, icon: <FiAlertTriangle size={18} />, tone: "danger" },
        { key: "finalizados", label: "Finalizados", value: stats.finalizados, icon: <FiCheckCircle size={18} />, tone: "success" },
    ];

    async function handleDeletar(id: string) {
        try {
            await deletarPedido(id);
            updatePedidos((prev) => prev.filter((p) => p.id !== id));
        } catch {
            setError("Falha ao deletar pedido.");
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
            setError("Falha ao avançar status.");
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
            setError("Falha ao regredir status.");
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
                    onClose={() => setPedidoDetalheId(null)}
                    onUpdated={(atualizado) => {
                        updatePedidos((prev) => prev.map((p) => p.id === atualizado.id ? atualizado : p));
                    }}
                />
            )}

            <main className="dashboard-main pedidos-page">
                <header className="pedidos-toolbar">
                    <div>
                        <h1 className="dashboard-title">Produção</h1>
                        <p className="dashboard-subtitle">Acompanhe todos os pedidos em produção</p>
                    </div>

                    <div className="toolbar-actions">
                        <div className="pedidos-search">
                            <FiSearch size={16} className="search-icon" />
                            <input
                                ref={buscaRef}
                                type="text"
                                placeholder="Buscar cliente ou projeto..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                aria-label="Buscar pedidos"
                            />
                            <kbd className="search-kbd">⌘K</kbd>
                        </div>

                        <div className="notif-wrap" ref={notifRef}>
                            <button
                                className="icon-button"
                                onClick={() => setNotifAberto((v) => !v)}
                                aria-label="Notificações"
                                aria-expanded={notifAberto}
                            >
                                <FiBell size={18} />
                                {urgentes.length > 0 && <span className="notif-badge">{urgentes.length}</span>}
                            </button>

                            {notifAberto && (
                                <div className="notif-panel" role="menu">
                                    <div className="notif-panel-head">Atenção necessária</div>
                                    {urgentes.length === 0 ? (
                                        <p className="notif-empty">Tudo em dia. Nenhum prazo crítico.</p>
                                    ) : (
                                        <ul className="notif-list">
                                            {urgentes.map((p) => {
                                                const atrasado = ehAtrasado(p.prazo);
                                                return (
                                                    <li key={p.id}>
                                                        <button
                                                            className="notif-item"
                                                            onClick={() => { setPedidoDetalheId(p.id); setNotifAberto(false); }}
                                                        >
                                                            <span className="notif-item-projeto">{p.projeto}</span>
                                                            <span className="notif-item-cliente">{p.cliente}</span>
                                                            <span className={`notif-item-tag ${atrasado ? "tag-danger" : "tag-warn"}`}>
                                                                {atrasado ? "Atrasado" : "Vence hoje"}
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                            + Novo Pedido
                        </button>
                    </div>
                </header>

                <section className="stat-cards" aria-label="Resumo da produção">
                    {statCards.map((s) => (
                        <div key={s.key} className="stat-card">
                            <span className={`stat-icon stat-${s.tone}`}>{s.icon}</span>
                            <div className="stat-body">
                                <span className="stat-value">{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        </div>
                    ))}
                </section>

                <div className="filtros-bar">
                    <div className="filtros-tabs">
                        {FILTROS.map((f) => (
                            <button
                                key={f.value}
                                className={`filtro-btn ${filtro === f.value ? "filtro-ativo" : ""}`}
                                onClick={() => setFiltro(f.value)}
                            >
                                {f.label}
                                <span className="filtro-count">{counts[f.value] ?? 0}</span>
                            </button>
                        ))}
                    </div>

                    <div className="filtros-actions">
                        <div className="view-toggle" role="group" aria-label="Modo de visualização">
                            <button
                                type="button"
                                className={`view-btn ${view === "list" ? "is-active" : ""}`}
                                onClick={() => alternarView("list")}
                                aria-pressed={view === "list"}
                                aria-label="Visualizar em lista"
                            >
                                <FiList size={16} />
                            </button>
                            <button
                                type="button"
                                className={`view-btn ${view === "grid" ? "is-active" : ""}`}
                                onClick={() => alternarView("grid")}
                                aria-pressed={view === "grid"}
                                aria-label="Visualizar em grade"
                            >
                                <FiGrid size={16} />
                            </button>
                        </div>

                        <div className="filtro-menu" ref={periodoRef}>
                            <button
                                type="button"
                                className={`filtro-action ${periodo !== "all" ? "is-active" : ""}`}
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "periodo"}
                                onClick={() => setMenuAberto((m) => (m === "periodo" ? null : "periodo"))}
                            >
                                <FiCalendar size={15} />
                                {PERIODO_LABELS[periodo]}
                                <FiChevronDown size={15} className="filtro-action-chev" />
                            </button>
                            {menuAberto === "periodo" && (
                                <div className="filtro-dropdown" role="menu">
                                    {(Object.keys(PERIODO_LABELS) as PeriodoKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={periodo === k}
                                            className={`filtro-option ${periodo === k ? "selected" : ""}`}
                                            onClick={() => { setPeriodo(k); setMenuAberto(null); }}
                                        >
                                            {PERIODO_LABELS[k]}
                                            {periodo === k && <FiCheck size={15} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="filtro-menu" ref={filtrosRef}>
                            <button
                                type="button"
                                className={`filtro-action ${ordenacao !== "recentes" ? "is-active" : ""}`}
                                aria-haspopup="menu"
                                aria-expanded={menuAberto === "filtros"}
                                onClick={() => setMenuAberto((m) => (m === "filtros" ? null : "filtros"))}
                            >
                                <FiFilter size={15} />
                                Filtros
                            </button>
                            {menuAberto === "filtros" && (
                                <div className="filtro-dropdown" role="menu">
                                    {(Object.keys(ORDENACAO_LABELS) as OrdKey[]).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={ordenacao === k}
                                            className={`filtro-option ${ordenacao === k ? "selected" : ""}`}
                                            onClick={() => { setOrdenacao(k); setMenuAberto(null); }}
                                        >
                                            {ORDENACAO_LABELS[k]}
                                            {ordenacao === k && <FiCheck size={15} />}
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
                        <span className="pedidos-empty-icon"><FiInbox size={28} /></span>
                        <p className="empty-title">Nenhum pedido encontrado</p>
                        <p className="empty-sub">
                            {busca ? "Tente outro termo de busca." : filtro ? "Nenhum pedido nesta etapa por enquanto." : "Crie o primeiro pedido para começar."}
                        </p>
                        {!filtro && !busca && (
                            <button className="button btn-novo-pedido empty-cta" onClick={() => setModalAberto(true)}>
                                + Novo Pedido
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={view === "grid" ? "pedidos-grid" : "pedidos-list"}>
                        {view === "list" && (
                            <div className="pedidos-row-head" aria-hidden="true">
                                <span>Pedido</span>
                                <span>Cliente</span>
                                <span>Projeto</span>
                                <span>Prazo</span>
                                <span>Progresso</span>
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
                                onAbrir={(p) => setPedidoDetalheId(p.id)}
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
