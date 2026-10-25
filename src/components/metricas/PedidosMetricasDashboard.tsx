import { useCallback, useEffect, useState } from "react";
import { AlertCircleIcon, ChartHistogramIcon, WarehouseIcon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import SkeletonSwap from "../ui/SkeletonSwap";
import {
    MaterialPedidoMetrica,
    PedidoStatusMetrica,
    getMateriaisMaisUsados,
    getPedidosPorStatus,
} from "../../services/PedidoMetricasService";
import { PedidoStatus } from "../../types";
import { formatCurrency, formatNumber } from "../../utils/format";
import { useRecarregarAoVoltar } from "../../hooks/useRecarregarAoVoltar";

/** Ordem do fluxo do pedido; etapas sem pedidos aparecem com zero para o gráfico não "pular" etapas. */
const ETAPAS: PedidoStatus[] = ["MODELAGEM", "IMPRESSAO", "PINTURA", "ACABAMENTO", "FINALIZADO", "CANCELADO"];

const LIMITE_MATERIAIS = 5;

function SkeletonLinhas({ quantidade }: { quantidade: number }) {
    return (
        <div className="metricas-barras">
            {Array.from({ length: quantidade }, (_, i) => (
                <div key={i} className="pedido-row-skeleton metricas-skeleton" />
            ))}
        </div>
    );
}

function PedidosMetricasDashboard() {
    const { t } = useTranslation();
    const [porStatus, setPorStatus] = useState<PedidoStatusMetrica[]>([]);
    const [materiais, setMateriais] = useState<MaterialPedidoMetrica[]>([]);
    const [carregandoStatus, setCarregandoStatus] = useState(true);
    const [carregandoMateriais, setCarregandoMateriais] = useState(true);
    const [erroStatus, setErroStatus] = useState("");
    const [erroMateriais, setErroMateriais] = useState("");

    // Os dois endpoints são independentes: um falhar não esconde o outro.
    const carregar = useCallback(() => {
        void getPedidosPorStatus()
            .then((lista) => { setPorStatus(lista); setErroStatus(""); })
            .catch(() => setErroStatus(t("pedidos.metricas.errorStatus")))
            .finally(() => setCarregandoStatus(false));

        void getMateriaisMaisUsados(LIMITE_MATERIAIS)
            .then((lista) => { setMateriais(lista); setErroMateriais(""); })
            .catch(() => setErroMateriais(t("pedidos.metricas.errorMaterials")))
            .finally(() => setCarregandoMateriais(false));
    }, [t]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    useRecarregarAoVoltar(carregar);

    const etapas = ETAPAS.map((status) => (
        porStatus.find((m) => m.status === status)
        ?? { status, quantidade: 0, valorTotal: null, atrasados: 0 }
    ));

    // Cancelados entram na contagem por etapa, mas não no total nem no valor.
    const ativos = etapas.filter((m) => m.status !== "CANCELADO");
    const totalPedidos = ativos.reduce((soma, m) => soma + m.quantidade, 0);
    const valorTotal = ativos.reduce((soma, m) => soma + (m.valorTotal ?? 0), 0);
    const emProducao = ativos
        .filter((m) => m.status !== "FINALIZADO")
        .reduce((soma, m) => soma + m.quantidade, 0);
    const atrasados = etapas.reduce((soma, m) => soma + m.atrasados, 0);

    const maiorEtapa = Math.max(1, ...etapas.map((m) => m.quantidade));
    const maiorMaterial = Math.max(1, ...materiais.map((m) => m.quantidadePedidos));
    const semPedidos = etapas.every((m) => m.quantidade === 0);

    const kpis = [
        { id: "total", label: t("pedidos.metricas.kpiTotal"), valor: formatNumber(totalPedidos) },
        { id: "producao", label: t("pedidos.metricas.kpiInProduction"), valor: formatNumber(emProducao) },
        { id: "valor", label: t("pedidos.metricas.kpiValue"), valor: formatCurrency(valorTotal) },
        { id: "atrasados", label: t("pedidos.metricas.kpiLate"), valor: formatNumber(atrasados), alerta: atrasados > 0 },
    ];

    return (
        <main className="dashboard-main metricas-page">
            <header>
                <h1 className="dashboard-title">{t("pedidos.metricas.title")}</h1>
                <p className="dashboard-subtitle">{t("pedidos.metricas.subtitle")}</p>
            </header>

            {erroStatus && <div className="dashboard-error">{erroStatus}</div>}

            <SkeletonSwap
                ready={!carregandoStatus}
                label={t("pedidos.metricas.kpiAria")}
                skeleton={
                    <div className="metricas-kpis">
                        {kpis.map((k) => <div key={k.id} className="pedido-row-skeleton metricas-kpi-skeleton" />)}
                    </div>
                }
            >
                <dl className="metricas-kpis" aria-label={t("pedidos.metricas.kpiAria")}>
                    {kpis.map((k) => (
                        <div key={k.id} className={k.alerta ? "metricas-kpi is-alerta" : "metricas-kpi"}>
                            <dt>{k.label}</dt>
                            <dd>
                                {k.alerta && <AlertCircleIcon size={18} aria-hidden="true" />}
                                {k.valor}
                            </dd>
                        </div>
                    ))}
                </dl>
            </SkeletonSwap>

            <div className="metricas-grid">
                <section className="metricas-card" aria-labelledby="metricas-status-titulo">
                    <div className="metricas-card-head">
                        <h2 id="metricas-status-titulo">{t("pedidos.metricas.statusTitle")}</h2>
                        <p className="dashboard-subtitle">{t("pedidos.metricas.statusSubtitle")}</p>
                    </div>

                    <SkeletonSwap
                        ready={!carregandoStatus}
                        label={t("pedidos.metricas.statusTitle")}
                        skeleton={<SkeletonLinhas quantidade={ETAPAS.length} />}
                    >
                        {carregandoStatus ? null : erroStatus ? null : semPedidos ? (
                            <div className="pedidos-empty metricas-empty">
                                <span className="pedidos-empty-icon"><ChartHistogramIcon size={28} /></span>
                                <p className="empty-title">{t("pedidos.metricas.emptyStatusTitle")}</p>
                                <p className="empty-sub">{t("pedidos.metricas.emptyStatusSubtitle")}</p>
                            </div>
                        ) : (
                            <ul className="metricas-barras">
                                {etapas.map((m) => (
                                    <li key={m.status} className="metricas-barra">
                                        <div className="metricas-barra-topo">
                                            <span className="metricas-barra-nome">{t(`pedidos.status.${m.status}`)}</span>
                                            <span className="metricas-barra-valor">
                                                {t("pedidos.metricas.ordersCount", { count: m.quantidade })}
                                            </span>
                                        </div>
                                        <div
                                            className="metricas-trilho"
                                            role="meter"
                                            aria-label={t(`pedidos.status.${m.status}`)}
                                            aria-valuemin={0}
                                            aria-valuemax={maiorEtapa}
                                            aria-valuenow={m.quantidade}
                                        >
                                            <span
                                                className={`metricas-preenchimento etapa-${m.status}`}
                                                style={{ width: `${(m.quantidade / maiorEtapa) * 100}%` }}
                                            />
                                        </div>
                                        <div className="metricas-barra-detalhe">
                                            <span>{formatCurrency(m.valorTotal ?? 0)}</span>
                                            {m.atrasados > 0 && (
                                                <span className="metricas-atrasados">
                                                    <AlertCircleIcon size={12} aria-hidden="true" />
                                                    {t("pedidos.metricas.lateCount", { count: m.atrasados })}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SkeletonSwap>
                </section>

                <section className="metricas-card" aria-labelledby="metricas-materiais-titulo">
                    <div className="metricas-card-head">
                        <h2 id="metricas-materiais-titulo">{t("pedidos.metricas.materialsTitle")}</h2>
                        <p className="dashboard-subtitle">
                            {t("pedidos.metricas.materialsSubtitle", { count: LIMITE_MATERIAIS })}
                        </p>
                    </div>

                    {erroMateriais && <div className="dashboard-error">{erroMateriais}</div>}

                    <SkeletonSwap
                        ready={!carregandoMateriais}
                        label={t("pedidos.metricas.materialsTitle")}
                        skeleton={<SkeletonLinhas quantidade={LIMITE_MATERIAIS} />}
                    >
                        {carregandoMateriais ? null : erroMateriais ? null : materiais.length === 0 ? (
                            <div className="pedidos-empty metricas-empty">
                                <span className="pedidos-empty-icon"><WarehouseIcon size={28} /></span>
                                <p className="empty-title">{t("pedidos.metricas.emptyMaterialsTitle")}</p>
                                <p className="empty-sub">{t("pedidos.metricas.emptyMaterialsSubtitle")}</p>
                            </div>
                        ) : (
                            <ol className="metricas-barras">
                                {materiais.map((m, i) => {
                                    const nome = m.nome ?? t("pedidos.metricas.deletedMaterial");
                                    return (
                                        <li key={m.materialId} className="metricas-barra">
                                            <div className="metricas-barra-topo">
                                                <span className="metricas-barra-nome">
                                                    <span className="metricas-posicao">{i + 1}</span>
                                                    <span className={m.nome ? undefined : "metricas-sem-nome"}>{nome}</span>
                                                </span>
                                                <span className="metricas-barra-valor">
                                                    {t("pedidos.metricas.ordersCount", { count: m.quantidadePedidos })}
                                                </span>
                                            </div>
                                            <div
                                                className="metricas-trilho"
                                                role="meter"
                                                aria-label={nome}
                                                aria-valuemin={0}
                                                aria-valuemax={maiorMaterial}
                                                aria-valuenow={m.quantidadePedidos}
                                            >
                                                <span
                                                    className="metricas-preenchimento"
                                                    style={{ width: `${(m.quantidadePedidos / maiorMaterial) * 100}%` }}
                                                />
                                            </div>
                                            <div className="metricas-barra-detalhe">
                                                <span>{formatCurrency(m.valorTotal ?? 0)}</span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </SkeletonSwap>
                </section>
            </div>
        </main>
    );
}

export default PedidosMetricasDashboard;
