import { useCallback, useEffect, useState } from "react";
import { AlertCircleIcon, CheckmarkCircle02Icon, MinusPlus01Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import AddAction from "../ui/AddAction";
import SkeletonSwap from "../ui/SkeletonSwap";
import { AlertaEstoque, getAlertas } from "../../services/EstoqueService";
import { getMateriais } from "../../services/MaterialService";
import { getCores } from "../../services/CorService";
import { Material, UNIDADES, UnidadeMedida } from "../../models/Material";
import { Cor } from "../../types";
import { formatNumber } from "../../utils/format";
import MovimentoEstoqueModal, { InsumoRef, ModoMovimento } from "./MovimentoEstoqueModal";
import HistoricoMovimentacoes from "./HistoricoMovimentacoes";
import { useRecarregarAoVoltar } from "../../hooks/useRecarregarAoVoltar";

interface ModalEstado {
    modo: ModoMovimento;
    insumo?: InsumoRef;
}

function unidadeValida(valor: string | undefined): UnidadeMedida {
    return valor && UNIDADES.includes(valor as UnidadeMedida) ? (valor as UnidadeMedida) : "G";
}

function EstoqueDashboard() {
    const { t } = useTranslation();
    const [alertas, setAlertas] = useState<AlertaEstoque[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [cores, setCores] = useState<Cor[]>([]);
    const [erroInsumos, setErroInsumos] = useState("");
    const [modal, setModal] = useState<ModalEstado | null>(null);
    const [historicoInsumo, setHistoricoInsumo] = useState<InsumoRef | null>(null);
    const [historicoRefresh, setHistoricoRefresh] = useState(0);

    // O skeleton só cobre a primeira carga; ao recarregar depois de uma
    // movimentação a lista de alertas é atualizada no lugar.
    const fetchAlertas = useCallback(() => {
        return getAlertas()
            .then((lista) => { setAlertas(lista); setError(""); })
            .catch(() => setError(t("estoque.dashboard.errorLoad")))
            .finally(() => setFetching(false));
    }, [t]);

    // Materiais e cores alimentam os seletores de insumo (formulários e histórico).
    const fetchInsumos = useCallback(() => {
        return Promise.allSettled([getMateriais(), getCores()]).then(([m, c]) => {
            if (m.status === "fulfilled") setMateriais(m.value);
            if (c.status === "fulfilled") setCores(c.value);
            setErroInsumos(m.status === "rejected" || c.status === "rejected" ? t("estoque.dashboard.errorLoadInsumos") : "");
        });
    }, [t]);

    useEffect(() => {
        // As atualizações de estado ficam nos callbacks das promessas; nada
        // síncrono no corpo do efeito.
        void fetchAlertas();
        void fetchInsumos();
    }, [fetchAlertas, fetchInsumos]);

    // Recarrega ao voltar para a aba (o skeleton só cobre a primeira carga).
    useRecarregarAoVoltar(
        () => {
            void fetchAlertas();
            void fetchInsumos();
        },
        !modal && !historicoInsumo
    );

    function abrirHistorico(insumo: InsumoRef) {
        setHistoricoInsumo(insumo);
        document.getElementById("estoque-historico")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleMovimentoSalvo() {
        setModal(null);
        fetchAlertas();
        fetchInsumos();
        setHistoricoRefresh((k) => k + 1);
    }

    return (
        <>
            {modal && (
                <MovimentoEstoqueModal
                    modo={modal.modo}
                    insumoInicial={modal.insumo}
                    materiais={materiais}
                    cores={cores}
                    onClose={() => setModal(null)}
                    onSalvo={handleMovimentoSalvo}
                />
            )}

            <main className="dashboard-main materiais-page estoque-page">
                <header className="materiais-toolbar">
                    <div>
                        <h1 className="dashboard-title">{t("estoque.dashboard.title")}</h1>
                        <p className="dashboard-subtitle">{t("estoque.dashboard.subtitle")}</p>
                    </div>

                    <div className="toolbar-actions">
                        <button type="button" className="btn-acao-pequeno estoque-btn-ajuste" onClick={() => setModal({ modo: "ajuste" })}>
                            <MinusPlus01Icon size={15} aria-hidden="true" />
                            {t("estoque.dashboard.newAdjustment")}
                        </button>
                        <AddAction label={t("estoque.dashboard.newEntry")} onClick={() => setModal({ modo: "entrada" })} />
                    </div>
                </header>

                {error && <div className="dashboard-error">{error}</div>}
                {erroInsumos && <div className="dashboard-error">{erroInsumos}</div>}

                <section className="estoque-section" aria-labelledby="estoque-alertas-titulo">
                    <div className="estoque-section-head">
                        <div>
                            <h2 className="dashboard-title" id="estoque-alertas-titulo">{t("estoque.dashboard.alertsTitle")}</h2>
                            <p className="dashboard-subtitle">{t("estoque.dashboard.alertsSubtitle")}</p>
                        </div>
                        {!fetching && alertas.length > 0 && (
                            <span className="estoque-alertas-contagem" role="status">
                                <AlertCircleIcon size={14} aria-hidden="true" />
                                {t("estoque.dashboard.alertsCount", { count: alertas.length })}
                            </span>
                        )}
                    </div>

                    <SkeletonSwap
                        ready={!fetching}
                        label={t("estoque.dashboard.alertsTitle")}
                        skeleton={
                            <div className="pedidos-list">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="pedido-row-skeleton" />
                                ))}
                            </div>
                        }
                    >
                        {fetching ? null : alertas.length === 0 ? (
                            <div className="pedidos-empty estoque-empty-compacto">
                                <span className="pedidos-empty-icon estoque-empty-ok"><CheckmarkCircle02Icon size={28} /></span>
                                <p className="empty-title">{t("estoque.dashboard.emptyAlertsTitle")}</p>
                                <p className="empty-sub">{t("estoque.dashboard.emptyAlertsSubtitle")}</p>
                            </div>
                        ) : (
                            <div className="pedidos-list">
                                <div className="pedidos-row-head estoque-row" aria-hidden="true">
                                    <span>{t("estoque.dashboard.colInsumo")}</span>
                                    <span>{t("estoque.dashboard.colType")}</span>
                                    <span>{t("estoque.dashboard.colStock")}</span>
                                    <span>{t("estoque.dashboard.colMinimum")}</span>
                                    <span />
                                </div>
                                {alertas.map((a) => {
                                    const unidade = t(`materiais.unidade.${unidadeValida(a.unidade)}`);
                                    const ref: InsumoRef = { tipoInsumo: a.tipoInsumo, insumoId: a.insumoId };
                                    return (
                                        <div key={`${a.tipoInsumo}-${a.insumoId}`} className="pedido-row estoque-row">
                                            <span className="row-projeto-nome estoque-insumo-nome">
                                                <span className="cell-label">{t("estoque.dashboard.colInsumo")}</span>
                                                {a.nome}
                                            </span>
                                            <span>
                                                <span className="cell-label">{t("estoque.dashboard.colType")}</span>
                                                <span className="estoque-tipo-chip">{t(`estoque.tipoInsumo.${a.tipoInsumo}`)}</span>
                                            </span>
                                            <span className="material-saldo-cell">
                                                <span className="cell-label">{t("estoque.dashboard.colStock")}</span>
                                                <span className="material-saldo is-baixo">{formatNumber(a.saldo)} {unidade}</span>
                                                {/* Ícone + texto: o alerta não depende só da cor. */}
                                                <span className="cor-estoque-baixo" title={t("materiais.dashboard.lowStockTitle")}>
                                                    <AlertCircleIcon size={12} aria-hidden="true" /> {t("estoque.dashboard.lowStock")}
                                                </span>
                                            </span>
                                            <span>
                                                <span className="cell-label">{t("estoque.dashboard.colMinimum")}</span>
                                                {formatNumber(a.estoqueMinimo)} {unidade}
                                            </span>
                                            <div className="material-row-actions">
                                                <button
                                                    type="button"
                                                    className="btn-acao-pequeno"
                                                    onClick={() => setModal({ modo: "entrada", insumo: ref })}
                                                >
                                                    {t("estoque.dashboard.entryAction")}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-acao-pequeno"
                                                    onClick={() => abrirHistorico(ref)}
                                                    aria-controls="estoque-historico"
                                                >
                                                    {t("estoque.dashboard.historyAction")}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </SkeletonSwap>
                </section>

                <HistoricoMovimentacoes
                    materiais={materiais}
                    cores={cores}
                    insumo={historicoInsumo}
                    onSelecionar={setHistoricoInsumo}
                    refreshKey={historicoRefresh}
                />
            </main>
        </>
    );
}

export default EstoqueDashboard;
