import { useEffect, useState } from "react";
import { AlertCircleIcon, InboxIcon } from "hugeicons-react";
import AddAction from "../ui/AddAction";
import { useTranslation } from "react-i18next";
import { getMateriais, inativarMaterial } from "../../services/MaterialService";
import MaterialModal from "./MaterialModal";
import { Material } from "../../models/Material";
import { formatCurrency, formatNumber } from "../../utils/format";
import SkeletonSwap from "../ui/SkeletonSwap";
import { cn } from "../../utils/cn";

/** Saldo no mínimo ou abaixo dele: a mesma regra de GET /estoque/alertas. */
function emAlerta(m: Material): boolean {
    return (m.saldo ?? 0) <= (m.estoqueMinimo ?? 0);
}

function MateriaisDashboard() {
    const { t } = useTranslation();
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [materialEditando, setMaterialEditando] = useState<Material | null>(null);

    async function fetchMateriais() {
        setFetching(true);
        setError("");
        try {
            setMateriais(await getMateriais());
        } catch {
            setError(t("materiais.dashboard.errorLoad"));
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        fetchMateriais();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function fecharModal() {
        setModalAberto(false);
        setMaterialEditando(null);
    }

    async function handleExcluir(id: string) {
        if (!window.confirm(t("materiais.dashboard.confirmDelete"))) return;
        try {
            await inativarMaterial(id);
            setMateriais((prev) => prev.filter((m) => m.id !== id));
        } catch {
            setError(t("materiais.dashboard.errorDelete"));
        }
    }

    return (
        <>
            {(modalAberto || materialEditando) && (
                <MaterialModal
                    material={materialEditando ?? undefined}
                    onClose={fecharModal}
                    onSalvo={() => { fecharModal(); fetchMateriais(); }}
                />
            )}

            <main className="dashboard-main materiais-page">
                <header className="materiais-toolbar">
                    <div>
                        <h1 className="dashboard-title">{t("materiais.dashboard.title")}</h1>
                        <p className="dashboard-subtitle">{t("materiais.dashboard.subtitle")}</p>
                    </div>

                    <div className="toolbar-actions">
                        <AddAction label={t("materiais.dashboard.newMaterial")} onClick={() => setModalAberto(true)} />
                    </div>
                </header>

                {error && <div className="dashboard-error">{error}</div>}

                <SkeletonSwap
                    ready={!fetching}
                    label={t("materiais.dashboard.title")}
                    skeleton={
                        <div className="pedidos-list">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="pedido-row-skeleton" />
                            ))}
                        </div>
                    }
                >
                    {fetching ? null : materiais.length === 0 ? (
                        <div className="pedidos-empty">
                            <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                            <p className="empty-title">{t("materiais.dashboard.emptyTitle")}</p>
                            <p className="empty-sub">{t("materiais.dashboard.emptySubtitle")}</p>
                            <button className="button btn-novo-pedido empty-cta" onClick={() => setModalAberto(true)}>
                                {t("materiais.dashboard.newMaterial")}
                            </button>
                        </div>
                    ) : (
                        <div className="pedidos-list">
                            <div className="pedidos-row-head material-row" aria-hidden="true">
                                <span>{t("materiais.dashboard.colName")}</span>
                                <span>{t("materiais.dashboard.colType")}</span>
                                <span>{t("materiais.dashboard.colDensity")}</span>
                                <span>{t("materiais.dashboard.colPricePerGram")}</span>
                                <span>{t("materiais.dashboard.colStock")}</span>
                                <span />
                            </div>
                            {materiais.map((m) => (
                                <div key={m.id} className="pedido-row material-row">
                                    <span className="row-projeto-nome">
                                        <span className="cell-label">{t("materiais.dashboard.colName")}</span>
                                        {m.nome}
                                    </span>
                                    <span>
                                        <span className="cell-label">{t("materiais.dashboard.colType")}</span>
                                        {m.tipo}
                                    </span>
                                    <span>
                                        <span className="cell-label">{t("materiais.dashboard.colDensity")}</span>
                                        {t("materiais.dashboard.densityValue", {
                                            value: formatNumber(m.densidadeGcm3, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }),
                                        })}
                                    </span>
                                    <span>
                                        <span className="cell-label">{t("materiais.dashboard.colPricePerGram")}</span>
                                        {formatCurrency(m.precoPorGrama, { minimumFractionDigits: 3 })}
                                    </span>
                                    <span className="material-saldo-cell">
                                        <span className="cell-label">{t("materiais.dashboard.colStock")}</span>
                                        <span className={cn("material-saldo", emAlerta(m) && "is-baixo")}>
                                            {formatNumber(m.saldo ?? 0)} {t(`materiais.unidade.${m.unidade ?? "G"}`)}
                                        </span>
                                        {emAlerta(m) && (
                                            /* Ícone + texto, não só cor: o alerta precisa ser perceptível sem depender do vermelho. */
                                            <span className="cor-estoque-baixo" title={t("materiais.dashboard.lowStockTitle")}>
                                                <AlertCircleIcon size={12} aria-hidden="true" /> {t("materiais.dashboard.lowStock")}
                                            </span>
                                        )}
                                    </span>
                                    <div className="material-row-actions">
                                        <button
                                            type="button"
                                            className="btn-acao-pequeno"
                                            onClick={() => setMaterialEditando(m)}
                                        >
                                            {t("materiais.dashboard.edit")}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-acao-pequeno btn-acao-perigo"
                                            onClick={() => handleExcluir(m.id)}
                                        >
                                            {t("materiais.dashboard.delete")}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SkeletonSwap>
            </main>
        </>
    );
}

export default MateriaisDashboard;
