import { useEffect, useMemo, useState } from "react";
import { Calendar03Icon, Cancel01Icon, Delete02Icon, FilterIcon, Flag02Icon, GridViewIcon, LeftToRightListBulletIcon, MoreVerticalIcon, PencilEdit02Icon, RefreshIcon, UserIcon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Select from "../ui/Select";
import { getCores } from "../../services/CorService";
import {
    atualizarEtapaOrdemPintura,
    criarOrdemPintura,
    editarOrdemPintura,
    excluirOrdemPintura,
    getOrdensPintura,
} from "../../services/OrdemPinturaService";
import { getPedidos } from "../../services/PedidoService";
import { cn } from "../../utils/cn";
import { formatDate } from "../../utils/format";
import IconButton from "../ui/IconButton";
import SearchField from "../ui/SearchField";
import {
    Cor,
    EtapaOrdemPintura,
    OrdemPintura,
    Pedido,
    PrioridadeOrdemPintura,
} from "../../types";

interface Coluna {
    etapa: EtapaOrdemPintura;
    tone: string;
}

const COLUNAS: Coluna[] = [
    { etapa: "AGUARDANDO", tone: "waiting" },
    { etapa: "MISTURANDO_TINTA", tone: "mixing" },
    { etapa: "EM_PINTURA", tone: "painting" },
    { etapa: "SECANDO", tone: "drying" },
    { etapa: "FINALIZADO", tone: "done" },
    { etapa: "RETRABALHO", tone: "rework" },
];

const PRIORIDADES: PrioridadeOrdemPintura[] = ["BAIXA", "MEDIA", "ALTA"];

type FiltroData = "TODAS" | "HOJE" | "ATRASADAS";

function inicioDoDia(data = new Date()): number {
    const copia = new Date(data);
    copia.setHours(0, 0, 0, 0);
    return copia.getTime();
}

function rotuloPrazo(prazo: string, t: TFunction): string {
    const [ano, mes, dia] = prazo.slice(0, 10).split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    const diferenca = Math.round((inicioDoDia(data) - inicioDoDia()) / 86_400_000);
    if (diferenca === 0) return t("pintura.today");
    if (diferenca === 1) return t("pintura.tomorrow");
    return formatDate(data, { day: "2-digit", month: "2-digit" });
}

function referenciaCurta(id: string): string {
    return `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase()}`;
}

interface NovaOrdemModalProps {
    pedidos: Pedido[];
    cores: Cor[];
    ordem?: OrdemPintura;
    onClose: () => void;
    onSave: (data: {
        pedidoId: string;
        corId: string;
        tecnico: string;
        prioridade: PrioridadeOrdemPintura;
        prazo: string;
    }) => Promise<void>;
}

function NovaOrdemModal({ pedidos, cores, ordem, onClose, onSave }: NovaOrdemModalProps) {
    const { t } = useTranslation();
    const editando = !!ordem;
    const [pedidoId, setPedidoId] = useState(ordem?.pedidoId ?? "");
    const [corId, setCorId] = useState(ordem?.corId ?? "");
    const [tecnico, setTecnico] = useState(ordem?.tecnicoNome ?? "");
    const [prioridade, setPrioridade] = useState<PrioridadeOrdemPintura>(ordem?.prioridade ?? "MEDIA");
    const [prazo, setPrazo] = useState(ordem?.prazo.slice(0, 10) ?? "");
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    const pedido = pedidos.find((item) => item.id === pedidoId);
    const cor = cores.find((item) => item.id === corId);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!pedidoId || !corId || !tecnico.trim() || !prazo) {
            setErro(t("pintura.modal.errorRequired"));
            return;
        }

        setSalvando(true);
        setErro("");
        try {
            await onSave({ pedidoId, corId, tecnico: tecnico.trim(), prioridade, prazo });
            onClose();
        } catch {
            setErro(editando ? t("pintura.modal.errorEdit") : t("pintura.modal.errorCreate"));
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="modal-overlay pintura-modal-overlay" onClick={onClose}>
            <section className="modal-card pintura-order-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <span className="pintura-modal-kicker">{t("pintura.modal.kicker")}</span>
                        <h2>{editando ? t("pintura.modal.titleEdit") : t("pintura.modal.titleNew")}</h2>
                    </div>
                    <IconButton variant="modal-close" onClick={onClose} aria-label={t("pintura.modal.close")}>
                        <Cancel01Icon size={18} />
                    </IconButton>
                </div>

                <form onSubmit={handleSubmit}>
                    {erro && <p className="error">{erro}</p>}

                    <div className="input-group">
                        <label htmlFor="ordem-pedido">{t("pintura.modal.orderLabel")}</label>
                        <Select
                            id="ordem-pedido"
                            value={pedidoId}
                            onChange={setPedidoId}
                            placeholder={t("pintura.modal.orderPlaceholder")}
                            options={pedidos.map((item) => ({
                                value: item.id,
                                label: `${referenciaCurta(item.id)} - ${item.projeto} / ${item.cliente}`,
                            }))}
                        />
                    </div>

                    {pedido && (
                        <div className="pintura-reference-panel">
                            <div>
                                <span>{t("pintura.modal.referencesLabel")}</span>
                                <strong>{pedido.projeto}</strong>
                            </div>
                            {pedido.imagensReferenciaFileIds?.length ? (
                                <div className="pintura-reference-images">
                                    {pedido.imagensReferenciaFileIds.slice(0, 4).map((imagem, index) => (
                                        <img key={index} src={imagem} alt={t("pintura.modal.refImageAlt", { index: index + 1 })} />
                                    ))}
                                </div>
                            ) : (
                                <small>{t("pintura.modal.noReferenceImages")}</small>
                            )}
                        </div>
                    )}

                    <div className="pintura-modal-grid">
                        <div className="input-group">
                            <label htmlFor="ordem-cor">{t("pintura.modal.colorLabel")}</label>
                            <Select
                                id="ordem-cor"
                                value={corId}
                                onChange={setCorId}
                                placeholder={t("pintura.modal.colorPlaceholder")}
                                options={cores.map((item) => ({ value: item.id, label: item.nome }))}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="ordem-tecnico">{t("pintura.technicianLabel")}</label>
                            <input
                                id="ordem-tecnico"
                                value={tecnico}
                                onChange={(e) => setTecnico(e.target.value)}
                                placeholder={t("pintura.modal.technicianPlaceholder")}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="ordem-prioridade">{t("pintura.priorityLabel")}</label>
                            <Select
                                id="ordem-prioridade"
                                value={prioridade}
                                onChange={(v) => setPrioridade(v as PrioridadeOrdemPintura)}
                                options={PRIORIDADES.map((p) => ({ value: p, label: t(`pintura.prioridade.${p}`) }))}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="ordem-prazo">{t("pintura.modal.deadlineLabel")}</label>
                            <input id="ordem-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
                        </div>
                    </div>

                    {cor && (
                        <div className="pintura-color-summary">
                            <span style={{ backgroundColor: cor.hex }} />
                            <div>
                                <strong>{cor.nome}</strong>
                                <small>{cor.hex} · {t(`cores.acabamento.${cor.acabamento}`)}</small>
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>{t("pintura.modal.cancel")}</button>
                        <button type="submit" className="button" disabled={salvando}>
                            {salvando ? t("pintura.modal.saving") : editando ? t("pintura.modal.saveChanges") : t("pintura.modal.create")}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

function OrdensPinturaKanban() {
    const { t } = useTranslation();
    const [ordens, setOrdens] = useState<OrdemPintura[]>([]);
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [cores, setCores] = useState<Cor[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [busca, setBusca] = useState("");
    const [tecnicoFiltro, setTecnicoFiltro] = useState("");
    const [prioridadeFiltro, setPrioridadeFiltro] = useState("");
    const [dataFiltro, setDataFiltro] = useState<FiltroData>("TODAS");
    const [modalAberto, setModalAberto] = useState(false);
    const [ordemEditando, setOrdemEditando] = useState<OrdemPintura | null>(null);
    const [menuOrdemId, setMenuOrdemId] = useState<string | null>(null);
    const [confirmarExclusaoId, setConfirmarExclusaoId] = useState<string | null>(null);
    const [arrastandoId, setArrastandoId] = useState<string | null>(null);
    const [colunaAtiva, setColunaAtiva] = useState<EtapaOrdemPintura | null>(null);
    const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);


    async function carregar() {
        setLoading(true);
        setErro("");
        try {
            const [ordensData, pedidosData, coresData] = await Promise.all([
                getOrdensPintura(),
                getPedidos(),
                getCores(),
            ]);
            setOrdens(ordensData);
            setPedidos(pedidosData);
            setCores(coresData);
            setAtualizadoEm(new Date());
        } catch {
            setErro(t("pintura.errorLoad"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Initial synchronization with the persisted Kanban data.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void carregar();
    }, []);

    const ordensFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const hoje = inicioDoDia();
        return ordens.filter((ordem) => {
            if (termo && ![
                ordem.pedidoProjeto,
                ordem.pedidoCliente,
                ordem.corNome,
                ordem.tecnicoNome,
                referenciaCurta(ordem.id),
            ].some((valor) => valor.toLowerCase().includes(termo))) return false;
            if (tecnicoFiltro && ordem.tecnicoNome !== tecnicoFiltro) return false;
            if (prioridadeFiltro && ordem.prioridade !== prioridadeFiltro) return false;
            const prazo = inicioDoDia(new Date(`${ordem.prazo.slice(0, 10)}T12:00:00`));
            if (dataFiltro === "HOJE" && prazo !== hoje) return false;
            if (dataFiltro === "ATRASADAS" && prazo >= hoje) return false;
            return true;
        });
    }, [ordens, busca, tecnicoFiltro, prioridadeFiltro, dataFiltro]);

    async function handleCriar(data: Parameters<typeof criarOrdemPintura>[0]) {
        const criada = await criarOrdemPintura(data);
        setOrdens((atuais) => [criada, ...atuais]);
        setAtualizadoEm(new Date());
    }

    async function handleEditar(data: Parameters<typeof editarOrdemPintura>[1]) {
        if (!ordemEditando) return;
        const atualizada = await editarOrdemPintura(ordemEditando.id, data);
        setOrdens((atuais) => atuais.map((ordem) => ordem.id === atualizada.id ? atualizada : ordem));
        setOrdemEditando(null);
        setAtualizadoEm(new Date());
    }

    async function handleExcluir(id: string) {
        try {
            await excluirOrdemPintura(id);
            setOrdens((atuais) => atuais.filter((ordem) => ordem.id !== id));
            setMenuOrdemId(null);
            setConfirmarExclusaoId(null);
            setAtualizadoEm(new Date());
        } catch {
            setErro(t("pintura.errorDelete"));
        }
    }

    async function moverOrdem(id: string, etapa: EtapaOrdemPintura) {
        const atual = ordens.find((ordem) => ordem.id === id);
        if (!atual || atual.etapa === etapa) return;

        setOrdens((lista) => lista.map((ordem) => ordem.id === id ? { ...ordem, etapa } : ordem));
        try {
            const atualizada = await atualizarEtapaOrdemPintura(id, etapa);
            setOrdens((lista) => lista.map((ordem) => ordem.id === id ? atualizada : ordem));
            setAtualizadoEm(new Date());
        } catch {
            setOrdens((lista) => lista.map((ordem) => ordem.id === id ? atual : ordem));
            setErro(t("pintura.errorMove"));
        }
    }

    return (
        <>
            {(modalAberto || ordemEditando) && (
                <NovaOrdemModal
                    pedidos={pedidos}
                    cores={cores}
                    ordem={ordemEditando ?? undefined}
                    onClose={() => {
                        setModalAberto(false);
                        setOrdemEditando(null);
                    }}
                    onSave={ordemEditando ? handleEditar : handleCriar}
                />
            )}

            <main className="pintura-page">
                <section className="pintura-content">
                    <header className="pedidos-toolbar">
                        <div>
                            <h1 className="dashboard-title">{t("pintura.title")}</h1>
                            <p className="dashboard-subtitle">{t("pintura.subtitle")}</p>
                        </div>

                        <div className="toolbar-actions">

                            <button type="button" className="button btn-novo-pedido" onClick={() => setModalAberto(true)}>
                                + {t("pintura.newOrder")}
                            </button>
                        </div>
                    </header>

                    <div className="pintura-toolbar">
                        <SearchField
                            variant="compact"
                            value={busca}
                            onChange={setBusca}
                            placeholder={t("pintura.searchPlaceholder")}
                        />
                        <button type="button" className="pintura-filter-static"><FilterIcon size={16} /> {t("pintura.filters")}</button>
                        <Select
                            variant="filter"
                            label={t("pintura.technicianLabel")}
                            icon={<UserIcon size={15} />}
                            value={tecnicoFiltro}
                            onChange={setTecnicoFiltro}
                            options={[
                                { value: "", label: t("pintura.allMasc") },
                                ...Array.from(new Set(ordens.map((ordem) => ordem.tecnicoNome)))
                                    .filter(Boolean)
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((tecnico) => ({ value: tecnico, label: tecnico })),
                            ]}
                        />
                        <Select
                            variant="filter"
                            label={t("pintura.priorityLabel")}
                            icon={<Flag02Icon size={15} />}
                            value={prioridadeFiltro}
                            onChange={setPrioridadeFiltro}
                            options={[
                                { value: "", label: t("pintura.allFem") },
                                { value: "ALTA", label: t("pintura.prioridade.ALTA") },
                                { value: "MEDIA", label: t("pintura.prioridade.MEDIA") },
                                { value: "BAIXA", label: t("pintura.prioridade.BAIXA") },
                            ]}
                        />
                        <Select
                            variant="filter"
                            label={t("pintura.dateLabel")}
                            icon={<Calendar03Icon size={15} />}
                            value={dataFiltro}
                            onChange={(v) => setDataFiltro(v as FiltroData)}
                            options={[
                                { value: "TODAS", label: t("pintura.allFem") },
                                { value: "HOJE", label: t("pintura.today") },
                                { value: "ATRASADAS", label: t("pintura.dateLate") },
                            ]}
                        />
                        <div className="pintura-toolbar-spacer" />
                        <span className="pintura-updated">
                            {atualizadoEm ? t("pintura.updatedNow") : t("pintura.loadingShort")}
                            <button type="button" onClick={carregar} aria-label={t("pintura.refreshAria")}><RefreshIcon size={15} /></button>
                        </span>
                        <div className="pintura-view-toggle">
                            <button type="button" className="active" aria-label={t("pintura.kanbanAria")}><GridViewIcon size={17} /></button>
                            <button type="button" aria-label={t("pintura.listAria")}><LeftToRightListBulletIcon size={17} /></button>
                        </div>
                    </div>

                    {erro && <div className="dashboard-error">{erro}</div>}

                    {loading ? (
                        <div className="pintura-loading">{t("pintura.loading")}</div>
                    ) : (
                        <div className="pintura-board">
                            {COLUNAS.map((coluna) => {
                                const itens = ordensFiltradas.filter((ordem) => ordem.etapa === coluna.etapa);
                                return (
                                    <section
                                        key={coluna.etapa}
                                        className={cn("pintura-column", `tone-${coluna.tone}`, colunaAtiva === coluna.etapa && "is-drop-target")}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = "move";
                                            setColunaAtiva(coluna.etapa);
                                        }}
                                        onDragLeave={(event) => {
                                            if (!event.currentTarget.contains(event.relatedTarget as Node)) setColunaAtiva(null);
                                        }}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            const id = event.dataTransfer.getData("text/plain") || arrastandoId;
                                            setColunaAtiva(null);
                                            setArrastandoId(null);
                                            if (id) void moverOrdem(id, coluna.etapa);
                                        }}
                                    >
                                        <header>
                                            <h2>{t(`pintura.etapa.${coluna.etapa}`)}</h2>
                                            <span>{itens.length}</span>
                                        </header>
                                        <div className="pintura-column-body">
                                            {itens.map((ordem) => (
                                                <article
                                                    key={ordem.id}
                                                    className={cn("pintura-card", arrastandoId === ordem.id && "is-dragging")}
                                                    draggable={menuOrdemId !== ordem.id}
                                                    onDragStart={(event) => {
                                                        event.dataTransfer.setData("text/plain", ordem.id);
                                                        event.dataTransfer.effectAllowed = "move";
                                                        setArrastandoId(ordem.id);
                                                    }}
                                                    onDragEnd={() => {
                                                        setArrastandoId(null);
                                                        setColunaAtiva(null);
                                                    }}
                                                >
                                                    <div className="pintura-card-head">
                                                        <strong className="pintura-card-ref">{referenciaCurta(ordem.id)}</strong>
                                                        <div
                                                            className="pintura-card-menu-wrap"
                                                            onPointerDown={(event) => event.stopPropagation()}
                                                            onClick={(event) => event.stopPropagation()}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="pintura-card-menu-btn"
                                                                aria-label={t("pintura.card.actionsAria")}
                                                                onClick={() => {
                                                                    setMenuOrdemId((atual) => atual === ordem.id ? null : ordem.id);
                                                                    setConfirmarExclusaoId(null);
                                                                }}
                                                            >
                                                                <MoreVerticalIcon size={15} />
                                                            </button>
                                                            {menuOrdemId === ordem.id && (
                                                                <div className="pintura-card-menu">
                                                                    {confirmarExclusaoId === ordem.id ? (
                                                                        <>
                                                                            <span>{t("pintura.card.confirmDelete")}</span>
                                                                            <div>
                                                                                <button type="button" onClick={() => setConfirmarExclusaoId(null)}>{t("pintura.card.cancel")}</button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="danger"
                                                                                    onClick={() => void handleExcluir(ordem.id)}
                                                                                >
                                                                                    {t("pintura.card.delete")}
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setOrdemEditando(ordem);
                                                                                    setMenuOrdemId(null);
                                                                                }}
                                                                            >
                                                                                <PencilEdit02Icon size={14} /> {t("pintura.card.edit")}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="danger"
                                                                                onClick={() => setConfirmarExclusaoId(ordem.id)}
                                                                            >
                                                                                <Delete02Icon size={14} /> {t("pintura.card.delete")}
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="pintura-card-color">
                                                        <span style={{ backgroundColor: ordem.corHex }} />
                                                        <div>
                                                            <strong>{ordem.corNome}</strong>
                                                            <small>{ordem.pedidoProjeto}</small>
                                                        </div>
                                                    </div>
                                                    <div className="pintura-card-footer">
                                                        <div>
                                                            <span>{t("pintura.card.technician")}</span>
                                                            <strong>{ordem.tecnicoNome}</strong>
                                                        </div>
                                                        <div className="pintura-card-tags">
                                                            <span className="pintura-date-tag"><Calendar03Icon size={11} /> {rotuloPrazo(ordem.prazo, t)}</span>
                                                            <span className={cn("pintura-priority", `prioridade-${ordem.prioridade.toLowerCase()}`)}>
                                                                {t(`pintura.prioridade.${ordem.prioridade}`)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

export default OrdensPinturaKanban;
