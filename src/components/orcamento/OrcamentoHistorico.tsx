import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterIcon, InboxIcon } from "hugeicons-react";
import {
    aprovarOrcamento,
    rejeitarOrcamento,
    FILTRO_ORCAMENTOS_VAZIO,
    type FiltroOrcamentos,
    type SituacaoOrcamento,
} from "../../services/OrcamentoService";
import { Orcamento } from "../../models/Orcamento";
import { FiCheck, FiX } from "react-icons/fi";
import { formatCurrency, formatDate } from "../../utils/format";
import OrcamentoDetalheModal from "./OrcamentoDetalheModal";
import OrcamentoFiltroModal from "./OrcamentoFiltroModal";
import IconButton from "../ui/IconButton";
import LinkButton from "../ui/LinkButton";
import { useRecarregarAoVoltar } from "../../hooks/useRecarregarAoVoltar";
import { useOrcamentosPaginados } from "../../hooks/useOrcamentosPaginados";

function formatarData(criadoEm: string | null) {
    if (!criadoEm) return "—";
    const data = new Date(criadoEm);
    return Number.isNaN(data.getTime())
        ? "—"
        : formatDate(data, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusOrcamento(orcamento: Orcamento): NonNullable<Orcamento["status"]> {
    return orcamento.status ?? "PENDENTE";
}

/** Quantos campos do filtro estão preenchidos (vira o número no ícone). */
function camposAtivos(filtro: FiltroOrcamentos) {
    return Object.values(filtro).filter((valor) => valor.trim() !== "").length;
}

function OrcamentoHistorico() {
    const { t } = useTranslation();
    const [loadingIds, setLoadingIds] = useState(new Set<string>());
    const [erroDecisao, setErroDecisao] = useState("");
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);

    // Cada bloco tem o seu filtro: filtrar o histórico não mexe nos pendentes e vice-versa.
    const [filtroPendentes, setFiltroPendentes] = useState<FiltroOrcamentos>(FILTRO_ORCAMENTOS_VAZIO);
    const [filtroHistorico, setFiltroHistorico] = useState<FiltroOrcamentos>(FILTRO_ORCAMENTOS_VAZIO);
    const [filtroAberto, setFiltroAberto] = useState<SituacaoOrcamento | null>(null);

    // Voltar à aba recarrega as duas seções; uma decisão recarrega só o histórico.
    const [recarga, setRecarga] = useState(0);
    const [recargaHistorico, setRecargaHistorico] = useState(0);
    useRecarregarAoVoltar(() => setRecarga((n) => n + 1), !orcamentoSelecionado && !filtroAberto);

    const pendentes = useOrcamentosPaginados("PENDENTES", filtroPendentes, recarga);
    const decididos = useOrcamentosPaginados("DECIDIDOS", filtroHistorico, recarga + recargaHistorico);

    const primeiraCarga = pendentes.carregando || decididos.carregando;
    const semNenhumOrcamento = !primeiraCarga
        && camposAtivos(filtroPendentes) === 0
        && camposAtivos(filtroHistorico) === 0
        && pendentes.total === 0
        && decididos.total === 0;
    const erroCarga = pendentes.erro || decididos.erro;

    function definirFiltro(situacao: SituacaoOrcamento, filtro: FiltroOrcamentos) {
        if (situacao === "PENDENTES") setFiltroPendentes(filtro);
        else setFiltroHistorico(filtro);
    }

    async function decidirOrcamento(orcamento: Orcamento, decisao: "aprovar" | "rejeitar") {
        if (!orcamento.id) return;
        const id = orcamento.id;
        setLoadingIds((ids) => new Set(ids).add(id));
        setErroDecisao("");
        try {
            await (decisao === "aprovar" ? aprovarOrcamento(id) : rejeitarOrcamento(id));
            // Sai dos pendentes na hora; o histórico é recarregado para entrar na posição certa.
            pendentes.remover(id);
            setRecargaHistorico((n) => n + 1);
        } catch {
            setErroDecisao(t(decisao === "aprovar" ? "orcamento.historico.errorApprove" : "orcamento.historico.errorReject"));
        } finally {
            setLoadingIds((ids) => {
                const next = new Set(ids);
                next.delete(id);
                return next;
            });
        }
    }

    function renderLinha(o: Orcamento, comAcoes = false) {
        const carregando = o.id ? loadingIds.has(o.id) : false;
        return (
            <div
                key={o.id}
                className="pedido-row orcamento-row"
                onClick={() => setOrcamentoSelecionado(o)}
            >
                <span className="orcamento-row-cliente">{o.cliente}</span>
                <span className="orcamento-row-projeto">
                    {/* O botao e o alvo real de teclado/leitor de tela: a linha
                        inteira nao pode ser um control porque contem botoes. */}
                    <button
                        type="button"
                        className="orcamento-row-projeto-btn"
                        onClick={(event) => {
                            event.stopPropagation();
                            setOrcamentoSelecionado(o);
                        }}
                        aria-label={t("orcamento.historico.openDetails", { project: o.projeto })}
                    >
                        {o.projeto}
                    </button>
                </span>
                <span className="orcamento-row-preco">{formatCurrency(o.precoFinal)}</span>
                <span>{formatarData(o.criadoEm)}</span>
                {!comAcoes && (
                    <span className={`orcamento-status orcamento-status-${statusOrcamento(o).toLowerCase()}`}>
                        {statusOrcamento(o) === "APROVADO" ? <FiCheck size={14} /> : <FiX size={14} />}
                        {t(`orcamento.status.${statusOrcamento(o)}`)}
                    </span>
                )}
                {comAcoes && (
                    <span className="orcamento-acoes" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="orcamento-decisao orcamento-aprovar" onClick={() => decidirOrcamento(o, "aprovar")} disabled={carregando} aria-label={t("orcamento.historico.approveAria", { project: o.projeto })}>
                            <FiCheck size={16} /> {t("orcamento.historico.approve")}
                        </button>
                        <button type="button" className="orcamento-decisao orcamento-rejeitar" onClick={() => decidirOrcamento(o, "rejeitar")} disabled={carregando} aria-label={t("orcamento.historico.rejectAria", { project: o.projeto })}>
                            <FiX size={16} /> {t("orcamento.historico.reject")}
                        </button>
                    </span>
                )}
            </div>
        );
    }

    function renderLista(lista: Orcamento[], comAcoes = false) {
        return (
            <div className="pedidos-list">
                <div className={`pedidos-row-head orcamento-row ${comAcoes ? "orcamento-row-pendente" : ""}`} aria-hidden="true">
                    <span>{t("orcamento.historico.colClient")}</span>
                    <span>{t("orcamento.historico.colProject")}</span>
                    <span>{t("orcamento.historico.colFinalPrice")}</span>
                    <span>{t("orcamento.historico.colDate")}</span>
                    {!comAcoes && <span>{t("orcamento.historico.colStatus")}</span>}
                    {comAcoes && <span>{t("orcamento.historico.colActions")}</span>}
                </div>
                {lista.map((o) => renderLinha(o, comAcoes))}
            </div>
        );
    }

    function renderSkeleton() {
        return (
            <div className="pedidos-list">
                {[1, 2, 3].map((i) => <div key={i} className="pedido-row-skeleton" />)}
            </div>
        );
    }

    function renderSecao(
        situacao: SituacaoOrcamento,
        secao: ReturnType<typeof useOrcamentosPaginados>,
        subtitulo: string,
        vazio: string,
        comAcoes: boolean
    ): ReactNode {
        if (secao.carregando) return renderSkeleton();
        const filtrado = camposAtivos(situacao === "PENDENTES" ? filtroPendentes : filtroHistorico) > 0;
        return (
            <>
                <div className="orcamento-secao-head">
                    <p>{subtitulo}</p>
                    <span className="orcamento-contador">{secao.total}</span>
                </div>
                {secao.itens.length === 0 && !filtrado && <p className="orcamento-lista-vazia">{vazio}</p>}
                {secao.itens.length === 0 && filtrado && (
                    <p className="orcamento-lista-vazia">
                        {t("orcamento.historico.filterNoResults")}{" "}
                        <LinkButton onClick={() => definirFiltro(situacao, FILTRO_ORCAMENTOS_VAZIO)}>
                            {t("orcamento.historico.filterClear")}
                        </LinkButton>
                    </p>
                )}
                {secao.itens.length > 0 && renderLista(secao.itens, comAcoes)}
                {secao.itens.length > 0 && (
                    <div className="orcamento-paginacao">
                        <span className="orcamento-paginacao-info">
                            {t("orcamento.historico.showingOf", { shown: secao.itens.length, total: secao.total })}
                        </span>
                        {secao.temMais && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => void secao.carregarMais()}
                                disabled={secao.carregandoMais}
                            >
                                {secao.carregandoMais ? t("orcamento.historico.loadingMore") : t("orcamento.historico.loadMore")}
                            </button>
                        )}
                    </div>
                )}
            </>
        );
    }

    function renderCabecalho(situacao: SituacaoOrcamento, titulo: string) {
        const filtro = situacao === "PENDENTES" ? filtroPendentes : filtroHistorico;
        const ativos = camposAtivos(filtro);
        const nomeBloco = situacao === "PENDENTES" ? "Pending" : "History";
        return (
            <div className="orcamento-historico-head">
                <h2 className="dashboard-title orcamento-historico-title">{titulo}</h2>
                <IconButton
                    variant="toolbar"
                    className={ativos > 0 ? "orcamento-filtro-btn is-active" : "orcamento-filtro-btn"}
                    onClick={() => setFiltroAberto(situacao)}
                    aria-label={t(`orcamento.historico.filterOpen${nomeBloco}`)}
                    title={t(`orcamento.historico.filterOpen${nomeBloco}`)}
                    aria-haspopup="dialog"
                >
                    <FilterIcon size={18} />
                    {ativos > 0 && (
                        <span className="orcamento-filtro-badge" aria-label={t("orcamento.historico.filterActiveCount", { count: ativos })}>
                            {ativos}
                        </span>
                    )}
                </IconButton>
            </div>
        );
    }

    if (semNenhumOrcamento) {
        return (
            <section className="orcamento-pendentes">
                <div className="orcamento-historico-head">
                    <h2 className="dashboard-title orcamento-historico-title">{t("orcamento.historico.pendingTitle")}</h2>
                </div>
                <div className="pedidos-empty">
                    <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                    <p className="empty-title">{t("orcamento.historico.emptyTitle")}</p>
                    <p className="empty-sub">{t("orcamento.historico.emptySub")}</p>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="orcamento-pendentes">
                {renderCabecalho("PENDENTES", t("orcamento.historico.pendingTitle"))}
                {(erroCarga || erroDecisao) && (
                    <div className="dashboard-error">{erroDecisao || t("orcamento.historico.errorLoad")}</div>
                )}
                {renderSecao("PENDENTES", pendentes, t("orcamento.historico.pendingSubtitle"), t("orcamento.historico.pendingEmpty"), true)}
            </section>
            <section className="orcamento-historico">
                {renderCabecalho("DECIDIDOS", t("orcamento.historico.title"))}
                {renderSecao("DECIDIDOS", decididos, t("orcamento.historico.decidedSubtitle"), t("orcamento.historico.decidedEmpty"), false)}
            </section>
            {filtroAberto && (
                <OrcamentoFiltroModal
                    titulo={t(filtroAberto === "PENDENTES" ? "orcamento.historico.filterTitlePending" : "orcamento.historico.filterTitleHistory")}
                    filtro={filtroAberto === "PENDENTES" ? filtroPendentes : filtroHistorico}
                    onAplicar={(filtro) => {
                        definirFiltro(filtroAberto, filtro);
                        setFiltroAberto(null);
                    }}
                    onClose={() => setFiltroAberto(null)}
                />
            )}
            {orcamentoSelecionado && (
                <OrcamentoDetalheModal
                    orcamento={orcamentoSelecionado}
                    onClose={() => setOrcamentoSelecionado(null)}
                />
            )}
        </>
    );
}

export default OrcamentoHistorico;
