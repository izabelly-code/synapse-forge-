import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { InboxIcon } from "hugeicons-react";
import { getOrcamentos } from "../../services/OrcamentoService";
import { Orcamento } from "../../models/Orcamento";
import SkeletonSwap from "../ui/SkeletonSwap";
import { useFlipList } from "../../hooks/useFlipList";
import { formatCurrency, formatDate, formatNumber } from "../../utils/format";

function formatarData(criadoEm: string | null) {
    if (!criadoEm) return "—";
    const data = new Date(criadoEm);
    return isNaN(data.getTime())
        ? "—"
        : formatDate(data, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function OrcamentoHistorico() {
    const { t } = useTranslation();
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const listaRef = useRef<HTMLDivElement>(null);

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

    return (
        <section className="orcamento-historico">
            <div className="orcamento-historico-head">
                <h2 className="dashboard-title orcamento-historico-title">{t("orcamento.historico.title")}</h2>
                <p className="dashboard-subtitle">{t("orcamento.historico.subtitle")}</p>
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            <SkeletonSwap
                ready={!fetching}
                label={t("orcamento.historico.title")}
                skeleton={
                    <div className="pedidos-list">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="pedido-row-skeleton" />
                        ))}
                    </div>
                }
            >
                {fetching ? null : orcamentos.length === 0 ? (
                    <div className="pedidos-empty">
                        <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                        <p className="empty-title">{t("orcamento.historico.emptyTitle")}</p>
                        <p className="empty-sub">{t("orcamento.historico.emptySub")}</p>
                    </div>
                ) : (
                    <div ref={listaRef} className="pedidos-list">
                        <div className="pedidos-row-head orcamento-row" aria-hidden="true">
                            <span>{t("orcamento.historico.colMaterial")}</span>
                            <span>{t("orcamento.historico.colVolume")}</span>
                            <span>{t("orcamento.historico.colDate")}</span>
                            <span>{t("orcamento.historico.colFinalPrice")}</span>
                        </div>
                        {orcamentos.map((o) => (
                            <div key={o.id} data-flip-id={o.id} className="pedido-row orcamento-row">
                                <span className="row-projeto-nome">
                                    <span className="cell-label">{t("orcamento.historico.colMaterial")}</span>
                                    {o.nomeMaterial}
                                </span>
                                <span>
                                    <span className="cell-label">{t("orcamento.historico.colVolume")}</span>
                                    {t("orcamento.historico.volumeValue", { value: formatNumber(o.volumeCm3) })}
                                </span>
                                <span>
                                    <span className="cell-label">{t("orcamento.historico.colDate")}</span>
                                    {formatarData(o.criadoEm)}
                                </span>
                                <span className="orcamento-row-preco">
                                    <span className="cell-label">{t("orcamento.historico.colFinalPrice")}</span>
                                    {formatCurrency(o.precoFinal)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </SkeletonSwap>
        </section>
    );
}

export default OrcamentoHistorico;
