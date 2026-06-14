import { useEffect, useMemo, useState } from "react";
import {
    FiBell,
    FiCalendar,
    FiChevronDown,
    FiFilter,
    FiEdit2,
    FiGrid,
    FiHelpCircle,
    FiList,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiMoreVertical,
    FiTrash2,
    FiX,
} from "react-icons/fi";
import { getCores } from "../../services/CorService";
import {
    atualizarEtapaOrdemPintura,
    criarOrdemPintura,
    editarOrdemPintura,
    excluirOrdemPintura,
    getOrdensPintura,
} from "../../services/OrdemPinturaService";
import { getPedidos } from "../../services/PedidoService";
import {
    Cor,
    EtapaOrdemPintura,
    OrdemPintura,
    Pedido,
    PrioridadeOrdemPintura,
} from "../../types";

interface Coluna {
    etapa: EtapaOrdemPintura;
    label: string;
    tone: string;
}

const COLUNAS: Coluna[] = [
    { etapa: "AGUARDANDO", label: "Aguardando", tone: "waiting" },
    { etapa: "MISTURANDO_TINTA", label: "Misturando Tinta", tone: "mixing" },
    { etapa: "EM_PINTURA", label: "Em Pintura", tone: "painting" },
    { etapa: "SECANDO", label: "Secando", tone: "drying" },
    { etapa: "FINALIZADO", label: "Finalizado", tone: "done" },
    { etapa: "RETRABALHO", label: "Retrabalho", tone: "rework" },
];

const PRIORIDADE_LABEL: Record<PrioridadeOrdemPintura, string> = {
    BAIXA: "Baixa",
    MEDIA: "Media",
    ALTA: "Alta",
};

type FiltroData = "TODAS" | "HOJE" | "ATRASADAS";

function inicioDoDia(data = new Date()): number {
    const copia = new Date(data);
    copia.setHours(0, 0, 0, 0);
    return copia.getTime();
}

function rotuloPrazo(prazo: string): string {
    const [ano, mes, dia] = prazo.slice(0, 10).split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    const diferenca = Math.round((inicioDoDia(data) - inicioDoDia()) / 86_400_000);
    if (diferenca === 0) return "Hoje";
    if (diferenca === 1) return "Amanha";
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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
            setErro("Preencha todos os campos da ordem.");
            return;
        }

        setSalvando(true);
        setErro("");
        try {
            await onSave({ pedidoId, corId, tecnico: tecnico.trim(), prioridade, prazo });
            onClose();
        } catch {
            setErro(editando ? "Nao foi possivel editar a ordem de pintura." : "Nao foi possivel criar a ordem de pintura.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="modal-overlay pintura-modal-overlay" onClick={onClose}>
            <section className="modal-card pintura-order-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <span className="pintura-modal-kicker">Producao</span>
                        <h2>{editando ? "Editar Ordem de Pintura" : "Nova Ordem de Pintura"}</h2>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {erro && <p className="error">{erro}</p>}

                    <div className="input-group">
                        <label htmlFor="ordem-pedido">Pedido</label>
                        <select id="ordem-pedido" value={pedidoId} onChange={(e) => setPedidoId(e.target.value)}>
                            <option value="">Selecione um pedido</option>
                            {pedidos.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {referenciaCurta(item.id)} - {item.projeto} / {item.cliente}
                                </option>
                            ))}
                        </select>
                    </div>

                    {pedido && (
                        <div className="pintura-reference-panel">
                            <div>
                                <span>Referencias do projeto</span>
                                <strong>{pedido.projeto}</strong>
                            </div>
                            {pedido.imagensReferenciaFileIds?.length ? (
                                <div className="pintura-reference-images">
                                    {pedido.imagensReferenciaFileIds.slice(0, 4).map((imagem, index) => (
                                        <img key={index} src={imagem} alt={`Referencia ${index + 1}`} />
                                    ))}
                                </div>
                            ) : (
                                <small>Nenhuma imagem de referencia cadastrada.</small>
                            )}
                        </div>
                    )}

                    <div className="pintura-modal-grid">
                        <div className="input-group">
                            <label htmlFor="ordem-cor">Cor</label>
                            <select id="ordem-cor" value={corId} onChange={(e) => setCorId(e.target.value)}>
                                <option value="">Selecione a cor</option>
                                {cores.map((item) => (
                                    <option key={item.id} value={item.id}>{item.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="ordem-tecnico">Tecnico</label>
                            <input
                                id="ordem-tecnico"
                                value={tecnico}
                                onChange={(e) => setTecnico(e.target.value)}
                                placeholder="Nome do tecnico"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="ordem-prioridade">Prioridade</label>
                            <select
                                id="ordem-prioridade"
                                value={prioridade}
                                onChange={(e) => setPrioridade(e.target.value as PrioridadeOrdemPintura)}
                            >
                                <option value="BAIXA">Baixa</option>
                                <option value="MEDIA">Media</option>
                                <option value="ALTA">Alta</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="ordem-prazo">Prazo</label>
                            <input id="ordem-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
                        </div>
                    </div>

                    {cor && (
                        <div className="pintura-color-summary">
                            <span style={{ backgroundColor: cor.hex }} />
                            <div>
                                <strong>{cor.nome}</strong>
                                <small>{cor.hex} · {cor.acabamento}</small>
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="button" disabled={salvando}>
                            {salvando ? "Salvando..." : editando ? "Salvar Alteracoes" : "Criar Ordem"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

function OrdensPinturaKanban() {
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
            setErro("Nao foi possivel carregar as ordens de pintura.");
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
            setErro("Nao foi possivel excluir a ordem de pintura.");
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
            setErro("Nao foi possivel mover a ordem. Tente novamente.");
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
                <header className="pintura-topbar">
                    <div className="pintura-breadcrumb">
                        <span className="pintura-breadcrumb-icon">A</span>
                        <span>Pintura e Mistura de Cores</span>
                        <span className="pintura-breadcrumb-chevron">›</span>
                        <strong>Kanban de Ordens de Pintura</strong>
                    </div>
                    <div className="pintura-top-actions">
                        <button type="button" aria-label="Notificacoes"><FiBell size={18} /><span>2</span></button>
                        <button type="button" aria-label="Ajuda"><FiHelpCircle size={18} /></button>
                    </div>
                </header>

                <section className="pintura-content">
                    <div className="pintura-heading">
                        <div>
                            <h1>Kanban de Ordens de Pintura</h1>
                            <p>Acompanhe o fluxo de trabalho das ordens de pintura em cada etapa do processo.</p>
                        </div>
                        <button type="button" className="pintura-new-order" onClick={() => setModalAberto(true)}>
                            <FiPlus size={18} /> Nova Ordem
                        </button>
                    </div>

                    <div className="pintura-toolbar">
                        <label className="pintura-search">
                            <input
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar por pedido, cor ou tecnico..."
                            />
                            <FiSearch size={17} />
                        </label>
                        <button type="button" className="pintura-filter-static"><FiFilter size={16} /> Filtros</button>
                        <label className="pintura-select">
                            <span>Tecnico:</span>
                            <select value={tecnicoFiltro} onChange={(e) => setTecnicoFiltro(e.target.value)}>
                                <option value="">Todos</option>
                                {Array.from(new Set(ordens.map((ordem) => ordem.tecnicoNome)))
                                    .filter(Boolean)
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((tecnico) => <option key={tecnico} value={tecnico}>{tecnico}</option>)}
                            </select>
                            <FiChevronDown size={14} />
                        </label>
                        <label className="pintura-select">
                            <span>Prioridade:</span>
                            <select value={prioridadeFiltro} onChange={(e) => setPrioridadeFiltro(e.target.value)}>
                                <option value="">Todas</option>
                                <option value="ALTA">Alta</option>
                                <option value="MEDIA">Media</option>
                                <option value="BAIXA">Baixa</option>
                            </select>
                            <FiChevronDown size={14} />
                        </label>
                        <label className="pintura-select">
                            <span>Data:</span>
                            <select value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value as FiltroData)}>
                                <option value="TODAS">Todas</option>
                                <option value="HOJE">Hoje</option>
                                <option value="ATRASADAS">Atrasadas</option>
                            </select>
                            <FiChevronDown size={14} />
                        </label>
                        <div className="pintura-toolbar-spacer" />
                        <span className="pintura-updated">
                            {atualizadoEm ? "Atualizado agora ha pouco" : "Carregando..."}
                            <button type="button" onClick={carregar} aria-label="Atualizar"><FiRefreshCw size={15} /></button>
                        </span>
                        <div className="pintura-view-toggle">
                            <button type="button" className="active" aria-label="Kanban"><FiGrid size={17} /></button>
                            <button type="button" aria-label="Lista"><FiList size={17} /></button>
                        </div>
                    </div>

                    {erro && <div className="dashboard-error">{erro}</div>}

                    {loading ? (
                        <div className="pintura-loading">Carregando ordens de pintura...</div>
                    ) : (
                        <div className="pintura-board">
                            {COLUNAS.map((coluna) => {
                                const itens = ordensFiltradas.filter((ordem) => ordem.etapa === coluna.etapa);
                                return (
                                    <section
                                        key={coluna.etapa}
                                        className={`pintura-column tone-${coluna.tone} ${colunaAtiva === coluna.etapa ? "is-drop-target" : ""}`}
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
                                            <h2>{coluna.label}</h2>
                                            <span>{itens.length}</span>
                                        </header>
                                        <div className="pintura-column-body">
                                            {itens.map((ordem) => (
                                                <article
                                                    key={ordem.id}
                                                    className={`pintura-card ${arrastandoId === ordem.id ? "is-dragging" : ""}`}
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
                                                                aria-label="Acoes da ordem"
                                                                onClick={() => {
                                                                    setMenuOrdemId((atual) => atual === ordem.id ? null : ordem.id);
                                                                    setConfirmarExclusaoId(null);
                                                                }}
                                                            >
                                                                <FiMoreVertical size={15} />
                                                            </button>
                                                            {menuOrdemId === ordem.id && (
                                                                <div className="pintura-card-menu">
                                                                    {confirmarExclusaoId === ordem.id ? (
                                                                        <>
                                                                            <span>Excluir esta ordem?</span>
                                                                            <div>
                                                                                <button type="button" onClick={() => setConfirmarExclusaoId(null)}>Cancelar</button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="danger"
                                                                                    onClick={() => void handleExcluir(ordem.id)}
                                                                                >
                                                                                    Excluir
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
                                                                                <FiEdit2 size={14} /> Editar
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="danger"
                                                                                onClick={() => setConfirmarExclusaoId(ordem.id)}
                                                                            >
                                                                                <FiTrash2 size={14} /> Excluir
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
                                                            <span>Tecnico</span>
                                                            <strong>{ordem.tecnicoNome}</strong>
                                                        </div>
                                                        <div className="pintura-card-tags">
                                                            <span className="pintura-date-tag"><FiCalendar size={11} /> {rotuloPrazo(ordem.prazo)}</span>
                                                            <span className={`pintura-priority prioridade-${ordem.prioridade.toLowerCase()}`}>
                                                                {PRIORIDADE_LABEL[ordem.prioridade]}
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
