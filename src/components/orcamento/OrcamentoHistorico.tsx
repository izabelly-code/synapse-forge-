import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { InboxIcon } from "hugeicons-react";
import { aprovarOrcamento, getOrcamentos, rejeitarOrcamento } from "../../services/OrcamentoService";
import { Orcamento } from "../../models/Orcamento";
import { useFlipList } from "../../hooks/useFlipList";
import { FiCheck, FiX } from "react-icons/fi";
import { formatCurrency, formatDate } from "../../utils/format";
import OrcamentoDetalheModal from "./OrcamentoDetalheModal";


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

function OrcamentoHistorico() {
    const { t } = useTranslation();
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const listaRef = useRef<HTMLDivElement>(null);
    const [loadingIds, setLoadingIds] = useState(new Set<string>());
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);

    useEffect(() => {
        async function fetchOrcamentos() {
            setFetching(true);
            setError("");
            try {
                setOrcamentos(await getOrcamentos());
            } catch {
                setError(t("orcamento.historico.errorLoad"));
            } finally {
                setFetching(false);
            }
        }
        fetchOrcamentos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Quando o histórico muda de ordem, as linhas viajam para o novo lugar.
    useFlipList(listaRef, orcamentos.map((o) => o.id).join("|"));

    // Quando o histórico muda de ordem, as linhas viajam para o novo lugar.
    useFlipList(listaRef, orcamentos.map((o) => o.id).join("|"));

    async function decidirOrcamento(orcamento: Orcamento, decisao: "aprovar" | "rejeitar") {
        if (!orcamento.id) return;
        setLoadingIds((ids) => new Set(ids).add(orcamento.id as string));
        setError("");
        try {
            const atualizado = await (decisao === "aprovar"
                ? aprovarOrcamento(orcamento.id)
                : rejeitarOrcamento(orcamento.id));
            setOrcamentos((lista) => lista.map((item) => (
                item.id === orcamento.id
                    ? atualizado
                    : item
            )));
        } catch {
            setError(t(decisao === "aprovar" ? "orcamento.historico.errorApprove" : "orcamento.historico.errorReject"));
        } finally {
            setLoadingIds((ids) => {
                const next = new Set(ids);
                next.delete(orcamento.id as string);
                return next;
            });
        }
    }

    const pendentes = orcamentos.filter((o) => statusOrcamento(o) === "PENDENTE");
    const decididos = orcamentos.filter((o) => statusOrcamento(o) !== "PENDENTE");

    function renderLinha(o: Orcamento, comAcoes = false) {
        const carregando = o.id ? loadingIds.has(o.id) : false;
        return (
            <div
                key={o.id}
                className="pedido-row orcamento-row"
                role="button"
                tabIndex={0}
                onClick={() => setOrcamentoSelecionado(o)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOrcamentoSelecionado(o);
                    }
                }}
                aria-label={t("orcamento.historico.openDetails", { project: o.nomeMaterial })}
            >
                <span className="orcamento-row-cliente">{o.cliente}</span>
                <span className="orcamento-row-projeto">{o.projeto}</span>
                <span className="orcamento-row-preco">{formatCurrency(o.precoFinal)}</span>
                <span>{formatarData(o.criadoEm)}</span>
                {comAcoes && (
                    <span className="orcamento-acoes" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="orcamento-decisao orcamento-aprovar" onClick={() => decidirOrcamento(o, "aprovar")} disabled={carregando} aria-label={t("orcamento.historico.approveAria", { project: o.nomeMaterial })}>
                            <FiCheck size={16} /> {t("orcamento.historico.approve")}
                        </button>
                        <button type="button" className="orcamento-decisao orcamento-rejeitar" onClick={() => decidirOrcamento(o, "rejeitar")} disabled={carregando} aria-label={t("orcamento.historico.rejectAria", { project: o.nomeMaterial })}>
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
                    {comAcoes && <span>{t("orcamento.historico.colActions")}</span>}
                </div>
                {lista.map((o) => renderLinha(o, comAcoes))}
            </div>
        );
    }

    let pendentesConteudo: ReactNode;
    if (fetching) {
        pendentesConteudo = (
            <div className="pedidos-list">
                {[1, 2, 3].map((i) => <div key={i} className="pedido-row-skeleton" />)}
            </div>
        );
    } else if (orcamentos.length === 0) {
        pendentesConteudo = (
            <div className="pedidos-empty">
                <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                        <p className="empty-title">{t("orcamento.historico.emptyTitle")}</p>
                        <p className="empty-sub">{t("orcamento.historico.emptySub")}</p>
            </div>
        );
    } else {
        pendentesConteudo = (
            <>
                <div className="orcamento-secao-head">
                    <p>{t("orcamento.historico.pendingSubtitle")}</p>
                    <span className="orcamento-contador">{pendentes.length}</span>
                </div>
                {pendentes.length === 0 ? <p className="orcamento-lista-vazia">{t("orcamento.historico.pendingEmpty")}</p> : renderLista(pendentes, true)}
            </>
        );
    }

    const historicoConteudo = fetching || orcamentos.length === 0 ? null : (
        <>
            <div className="orcamento-secao-head">
                <p>{t("orcamento.historico.decidedSubtitle")}</p>
                <span className="orcamento-contador">{decididos.length}</span>
            </div>
            {decididos.length === 0 ? <p className="orcamento-lista-vazia">{t("orcamento.historico.decidedEmpty")}</p> : renderLista(decididos)}
        </>
    );

    return (
        <>
            <section className="orcamento-pendentes">
                <div className="orcamento-historico-head">
                    <h2 className="dashboard-title orcamento-historico-title">{t("orcamento.historico.pendingTitle")}</h2>
                </div>
                {error && <div className="dashboard-error">{error}</div>}
                {pendentesConteudo}
            </section>
            <section className="orcamento-historico">
                <div className="orcamento-historico-head">
                    <h2 className="dashboard-title orcamento-historico-title">{t("orcamento.historico.title")}</h2>
                </div>
                {historicoConteudo}
            </section>
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
