import { useEffect, useMemo, useState } from "react";
import { ArrowDown01Icon, ArrowUp01Icon, Clock01Icon, MinusPlus01Icon, PackageIcon, Undo02Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { MovimentoEstoque, TipoInsumo, TipoMovimento, getMovimentos } from "../../services/EstoqueService";
import { Material, UNIDADES, UnidadeMedida } from "../../models/Material";
import { Cor } from "../../types";
import { formatDate, formatNumber } from "../../utils/format";
import { cn } from "../../utils/cn";
import Select from "../ui/Select";
import SkeletonSwap from "../ui/SkeletonSwap";
import type { InsumoRef } from "./MovimentoEstoqueModal";

const TIPOS_INSUMO: TipoInsumo[] = ["MATERIAL", "COR"];

const ICONE_MOVIMENTO: Record<TipoMovimento, React.ReactNode> = {
    ENTRADA: <ArrowUp01Icon size={13} aria-hidden="true" />,
    BAIXA: <ArrowDown01Icon size={13} aria-hidden="true" />,
    ESTORNO: <Undo02Icon size={13} aria-hidden="true" />,
    AJUSTE: <MinusPlus01Icon size={13} aria-hidden="true" />,
};

/** BAIXA sai do saldo; ENTRADA e ESTORNO entram; AJUSTE já vem com sinal. */
function quantidadeComSinal(m: MovimentoEstoque): number {
    if (m.tipo === "BAIXA") return -Math.abs(m.quantidade);
    if (m.tipo === "AJUSTE") return m.quantidade;
    return Math.abs(m.quantidade);
}

function unidadeValida(valor: string | undefined): UnidadeMedida {
    return valor && UNIDADES.includes(valor as UnidadeMedida) ? (valor as UnidadeMedida) : "G";
}

function refCurta(id: string): string {
    return `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase()}`;
}

interface HistoricoMovimentacoesProps {
    materiais: Material[];
    cores: Cor[];
    /** Insumo em foco; quem controla é a página (a linha em alerta também aponta para cá). */
    insumo: InsumoRef | null;
    onSelecionar: (insumo: InsumoRef | null) => void;
    /** Incrementado a cada movimentação registrada, para recarregar o histórico. */
    refreshKey: number;
}

function HistoricoMovimentacoes({ materiais, cores, insumo, onSelecionar, refreshKey }: HistoricoMovimentacoesProps) {
    const { t } = useTranslation();
    const [tipoInsumo, setTipoInsumo] = useState<TipoInsumo>(insumo?.tipoInsumo ?? "MATERIAL");
    // Cache do último carregamento, identificado pela chave insumo+refreshKey:
    // loading/erro/lista são derivados dela, sem setState solto em efeito.
    const [carregado, setCarregado] = useState<{ chave: string; movimentos: MovimentoEstoque[] } | null>(null);
    const [chaveComErro, setChaveComErro] = useState("");

    const chaveInsumo = insumo ? `${insumo.tipoInsumo}:${insumo.insumoId}` : "";
    const chave = chaveInsumo ? `${chaveInsumo}:${refreshKey}` : "";
    const mesmoInsumo = !!carregado && carregado.chave.startsWith(`${chaveInsumo}:`);
    const movimentos = chaveInsumo && mesmoInsumo ? carregado.movimentos : [];
    const error = chave && chaveComErro === chave ? t("estoque.historico.errorLoad") : "";
    // Skeleton só na primeira carga do insumo; ao recarregar (nova movimentação) a lista fica no lugar.
    const fetching = !!chave && carregado?.chave !== chave && !mesmoInsumo && !error;

    // O tipo do filtro acompanha o insumo apontado de fora (botão "Histórico" da linha em alerta).
    const tipoEfetivo = insumo ? insumo.tipoInsumo : tipoInsumo;

    const opcoesInsumo = useMemo(() => {
        if (tipoEfetivo === "MATERIAL") return materiais.map((m) => ({ value: m.id, label: m.nome }));
        return cores.map((c) => ({ value: c.id, label: c.fornecedor ? `${c.nome} · ${c.fornecedor}` : c.nome }));
    }, [tipoEfetivo, materiais, cores]);

    // A primeira opção é "nenhum": no filtro, o Select só se marca como ativo
    // quando o valor difere dela — ou seja, quando há um insumo escolhido.
    const opcoesFiltroInsumo = useMemo(
        () => [{ value: "", label: t("estoque.historico.insumoPlaceholder") }, ...opcoesInsumo],
        [opcoesInsumo, t],
    );

    useEffect(() => {
        if (!insumo || !chave) return;
        let ativo = true;
        getMovimentos(insumo.tipoInsumo, insumo.insumoId)
            .then((lista) => {
                if (!ativo) return;
                const ordenados = [...lista].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
                setCarregado({ chave, movimentos: ordenados });
            })
            .catch(() => { if (ativo) setChaveComErro(chave); });
        return () => { ativo = false; };
    }, [insumo, chave]);

    const nomeInsumo = insumo ? opcoesInsumo.find((o) => o.value === insumo.insumoId)?.label ?? "" : "";

    return (
        <section className="estoque-section" id="estoque-historico" aria-labelledby="estoque-historico-titulo">
            <div className="estoque-section-head">
                <div>
                    <h2 className="dashboard-title" id="estoque-historico-titulo">{t("estoque.historico.title")}</h2>
                    <p className="dashboard-subtitle">{t("estoque.historico.subtitle")}</p>
                </div>

                <div className="estoque-historico-filtros">
                    <Select
                        variant="filter"
                        label={t("estoque.historico.filterType")}
                        ariaLabel={t("estoque.historico.filterType")}
                        value={tipoEfetivo}
                        onChange={(v) => { setTipoInsumo(v as TipoInsumo); onSelecionar(null); }}
                        options={TIPOS_INSUMO.map((tipo) => ({ value: tipo, label: t(`estoque.tipoInsumo.${tipo}`) }))}
                    />
                    <Select
                        variant="filter"
                        label={t("estoque.historico.filterInsumo")}
                        ariaLabel={t("estoque.historico.filterInsumo")}
                        icon={<PackageIcon size={15} />}
                        value={insumo?.insumoId ?? ""}
                        onChange={(v) => onSelecionar(v ? { tipoInsumo: tipoEfetivo, insumoId: v } : null)}
                        options={opcoesFiltroInsumo}
                        disabled={opcoesInsumo.length === 0}
                    />
                </div>
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            {!insumo ? (
                <div className="pedidos-empty estoque-empty-compacto">
                    <span className="pedidos-empty-icon"><Clock01Icon size={28} /></span>
                    <p className="empty-title">{t("estoque.historico.emptySelectTitle")}</p>
                    <p className="empty-sub">{t("estoque.historico.emptySelectSubtitle")}</p>
                </div>
            ) : (
                <SkeletonSwap
                    ready={!fetching}
                    label={t("estoque.historico.title")}
                    skeleton={
                        <div className="pedidos-list">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="pedido-row-skeleton" />
                            ))}
                        </div>
                    }
                >
                    {fetching ? null : movimentos.length === 0 ? (
                        <div className="pedidos-empty estoque-empty-compacto">
                            <span className="pedidos-empty-icon"><Clock01Icon size={28} /></span>
                            <p className="empty-title">{t("estoque.historico.emptyTitle")}</p>
                            <p className="empty-sub">{t("estoque.historico.emptySubtitle", { name: nomeInsumo })}</p>
                        </div>
                    ) : (
                        <div className="pedidos-list">
                            <div className="pedidos-row-head estoque-mov-row" aria-hidden="true">
                                <span>{t("estoque.historico.colDate")}</span>
                                <span>{t("estoque.historico.colType")}</span>
                                <span>{t("estoque.historico.colQuantity")}</span>
                                <span>{t("estoque.historico.colBalance")}</span>
                                <span>{t("estoque.historico.colStage")}</span>
                                <span>{t("estoque.historico.colReason")}</span>
                            </div>
                            {movimentos.map((m) => {
                                const qtd = quantidadeComSinal(m);
                                const unidade = t(`materiais.unidade.${unidadeValida(m.unidade)}`);
                                return (
                                    <div key={m.id} className="pedido-row estoque-mov-row">
                                        <span className="estoque-mov-data">
                                            <span className="cell-label">{t("estoque.historico.colDate")}</span>
                                            <span>{formatDate(m.criadoEm, { dateStyle: "short", timeStyle: "short" })}</span>
                                            {m.pedidoId && (
                                                <span className="estoque-mov-sub">{t("estoque.historico.orderRef", { ref: refCurta(m.pedidoId) })}</span>
                                            )}
                                        </span>
                                        <span>
                                            <span className="cell-label">{t("estoque.historico.colType")}</span>
                                            <span className={cn("estoque-mov-chip", `mov-${m.tipo}`)}>
                                                {ICONE_MOVIMENTO[m.tipo]}
                                                {t(`estoque.historico.tipo.${m.tipo}`)}
                                            </span>
                                        </span>
                                        <span>
                                            <span className="cell-label">{t("estoque.historico.colQuantity")}</span>
                                            <span className={cn("estoque-mov-qtd", qtd < 0 ? "is-negativa" : "is-positiva")}>
                                                {formatNumber(qtd, { signDisplay: "always" })} {unidade}
                                            </span>
                                        </span>
                                        <span>
                                            <span className="cell-label">{t("estoque.historico.colBalance")}</span>
                                            {formatNumber(m.saldoApos)} {unidade}
                                        </span>
                                        <span>
                                            <span className="cell-label">{t("estoque.historico.colStage")}</span>
                                            {m.etapaOrigem ? t(`pedidos.status.${m.etapaOrigem}`) : t("estoque.historico.stageManual")}
                                        </span>
                                        <span className="estoque-mov-motivo">
                                            <span className="cell-label">{t("estoque.historico.colReason")}</span>
                                            {m.motivo?.trim() || t("estoque.historico.noReason")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </SkeletonSwap>
            )}
        </section>
    );
}

export default HistoricoMovimentacoes;
