import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    AlertCircleIcon,
    ChartColumnIcon,
    CheckmarkCircle02Icon,
    Clock01Icon,
    MoneyBag02Icon,
    PackageIcon,
    ShoppingBag01Icon,
    Table01Icon,
    WarehouseIcon,
} from "hugeicons-react";
import { cn } from "../../utils/cn";
import { formatCurrency, formatNumber } from "../../utils/format";
import type { PedidoStatus } from "../../types";
import type {
    Intervalo,
    MaterialPedidoMetrica,
    PedidoMesMetrica,
    PedidoStatusMetrica,
} from "../../services/MetricasService";
import type { AlertaEstoque } from "../../services/EstoqueService";
import GraficoColunas, { type Coluna } from "./GraficoColunas";
import BarrasHorizontais from "./BarrasHorizontais";
import { mesesDoIntervalo } from "./periodo";

const ETAPAS: PedidoStatus[] = ["MODELAGEM", "IMPRESSAO", "PINTURA", "ACABAMENTO", "FINALIZADO", "CANCELADO"];

export const LIMITE_MATERIAIS = 5;

/* ---------------------------------------------------------------------------
   Estados comuns
--------------------------------------------------------------------------- */

export function WidgetErro({ onTentarDeNovo }: { onTentarDeNovo: () => void }) {
    const { t } = useTranslation();
    return (
        <div className="painel-estado painel-estado--erro" role="alert">
            <AlertCircleIcon size={20} aria-hidden="true" />
            <p>{t("painel.erro")}</p>
            <button type="button" className="painel-link" onClick={onTentarDeNovo}>
                {t("painel.tentarDeNovo")}
            </button>
        </div>
    );
}

export function WidgetVazio({ icone, titulo, texto }: { icone: React.ReactNode; titulo: string; texto?: string }) {
    return (
        <div className="painel-estado">
            <span className="painel-estado-icone" aria-hidden="true">{icone}</span>
            <p className="painel-estado-titulo">{titulo}</p>
            {texto && <p className="painel-estado-texto">{texto}</p>}
        </div>
    );
}

export function WidgetSkeleton({ linhas = 4, grafico = false }: { linhas?: number; grafico?: boolean }) {
    if (grafico) return <div className="painel-skeleton painel-skeleton--grafico" aria-hidden="true" />;
    return (
        <div className="painel-skeleton-linhas" aria-hidden="true">
            {Array.from({ length: linhas }, (_, i) => (
                <div key={i} className="painel-skeleton" />
            ))}
        </div>
    );
}

/* ---------------------------------------------------------------------------
   Indicadores
--------------------------------------------------------------------------- */

function resumoDosPedidos(porStatus: PedidoStatusMetrica[]) {
    const ativos = porStatus.filter((m) => m.status !== "CANCELADO");
    return {
        total: ativos.reduce((soma, m) => soma + m.quantidade, 0),
        valor: ativos.reduce((soma, m) => soma + (m.valorTotal ?? 0), 0),
        emProducao: ativos.filter((m) => m.status !== "FINALIZADO").reduce((soma, m) => soma + m.quantidade, 0),
        atrasados: porStatus.reduce((soma, m) => soma + m.atrasados, 0),
    };
}

export function IndicadoresWidget({ porStatus }: { porStatus: PedidoStatusMetrica[] }) {
    const { t } = useTranslation();
    const resumo = resumoDosPedidos(porStatus);

    const kpis = [
        { id: "total", icone: <ShoppingBag01Icon size={20} />, valor: formatNumber(resumo.total), rotulo: t("painel.kpis.total") },
        { id: "valor", icone: <MoneyBag02Icon size={20} />, valor: formatCurrency(resumo.valor, { maximumFractionDigits: 0 }), rotulo: t("painel.kpis.valor") },
        { id: "producao", icone: <PackageIcon size={20} />, valor: formatNumber(resumo.emProducao), rotulo: t("painel.kpis.producao") },
        { id: "atrasados", icone: <Clock01Icon size={20} />, valor: formatNumber(resumo.atrasados), rotulo: t("painel.kpis.atrasados"), alerta: resumo.atrasados > 0 },
    ];

    return (
        <dl className="painel-kpis">
            {kpis.map((kpi) => (
                <div key={kpi.id} className={cn("stat-card painel-kpi", kpi.alerta && "is-alerta")}>
                    <span className="stat-icon" aria-hidden="true">{kpi.alerta ? <AlertCircleIcon size={20} /> : kpi.icone}</span>
                    {/* dt antes do dd (ordem exigida no <dl>); o CSS mostra o valor em cima */}
                    <div className="stat-body painel-kpi-corpo">
                        <dt className="stat-label">{kpi.rotulo}</dt>
                        <dd className="stat-value painel-kpi-valor">{kpi.valor}</dd>
                    </div>
                </div>
            ))}
        </dl>
    );
}

/* ---------------------------------------------------------------------------
   Pedidos por mês
--------------------------------------------------------------------------- */

type MetricaMensal = "quantidade" | "valor";

function rotuloMes(mes: string, lang: string, opcoes: Intl.DateTimeFormatOptions): string {
    const [ano, numero] = mes.split("-").map(Number);
    return new Intl.DateTimeFormat(lang, opcoes).format(new Date(ano, numero - 1, 1));
}

export function PedidosPorMesWidget({
    dados,
    intervalo,
    tabela,
}: {
    dados: PedidoMesMetrica[];
    intervalo: Intervalo;
    tabela: boolean;
}) {
    const { t, i18n } = useTranslation();
    const [metrica, setMetrica] = useState<MetricaMensal>("quantidade");

    const meses = mesesDoIntervalo(intervalo, dados);
    const porMes = new Map(dados.map((d) => [d.mes, d]));
    const linhas = meses.map((mes) => porMes.get(mes) ?? { mes, quantidade: 0, cancelados: 0, valorTotal: 0 });
    const semDados = linhas.every((l) => l.quantidade === 0 && l.cancelados === 0);

    const formatarValor = (v: number) =>
        metrica === "quantidade" ? formatNumber(v) : formatCurrency(v, { maximumFractionDigits: 0 });
    const formatarEixo = (v: number) =>
        metrica === "quantidade"
            ? formatNumber(v, { notation: "compact" })
            : formatCurrency(v, { notation: "compact", maximumFractionDigits: 1 });

    const colunas: Coluna[] = linhas.map((linha, i) => {
        const numeroMes = Number(linha.mes.slice(5, 7));
        const valor = linha.valorTotal ?? 0;
        return {
            id: linha.mes,
            valor: metrica === "quantidade" ? linha.quantidade : valor,
            rotulo: rotuloMes(linha.mes, i18n.language, { month: "short" }).replace(".", ""),
            rotuloSecundario: i === 0 || numeroMes === 1 ? linha.mes.slice(0, 4) : undefined,
            titulo: rotuloMes(linha.mes, i18n.language, { month: "long", year: "numeric" }),
            detalhes: [
                metrica === "quantidade"
                    ? formatCurrency(valor, { maximumFractionDigits: 0 })
                    : t("painel.pedidosCount", { count: linha.quantidade }),
                t("painel.canceladosCount", { count: linha.cancelados }),
            ],
        };
    });

    if (semDados) {
        return (
            <WidgetVazio
                icone={<ChartColumnIcon size={26} />}
                titulo={t("painel.vazio.pedidos")}
                texto={t("painel.vazio.pedidosTexto")}
            />
        );
    }

    return (
        <div className="painel-mensal">
            <div className="view-toggle painel-segmento" role="group" aria-label={t("painel.widgets.pedidosPorMes.metricaAria")}>
                {(["quantidade", "valor"] as MetricaMensal[]).map((opcao) => (
                    <button
                        key={opcao}
                        type="button"
                        className={cn("view-btn", metrica === opcao && "is-active")}
                        aria-pressed={metrica === opcao}
                        onClick={() => setMetrica(opcao)}
                    >
                        {t(`painel.widgets.pedidosPorMes.metrica_${opcao}`)}
                    </button>
                ))}
            </div>

            {tabela ? (
                <div className="painel-tabela-wrap">
                    <table className="painel-tabela">
                        <thead>
                            <tr>
                                <th scope="col">{t("painel.tabela.mes")}</th>
                                <th scope="col">{t("painel.tabela.pedidos")}</th>
                                <th scope="col">{t("painel.tabela.cancelados")}</th>
                                <th scope="col">{t("painel.tabela.valor")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhas.map((linha) => (
                                <tr key={linha.mes}>
                                    <th scope="row">{rotuloMes(linha.mes, i18n.language, { month: "long", year: "numeric" })}</th>
                                    <td>{formatNumber(linha.quantidade)}</td>
                                    <td>{formatNumber(linha.cancelados)}</td>
                                    <td>{formatCurrency(linha.valorTotal ?? 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <GraficoColunas
                    colunas={colunas}
                    formatarValor={formatarValor}
                    formatarEixo={formatarEixo}
                    ariaLabel={t(`painel.widgets.pedidosPorMes.graficoAria_${metrica}`)}
                />
            )}
        </div>
    );
}

/** Botão do cabeçalho que alterna gráfico ⇄ tabela (a tabela é o equivalente acessível do gráfico). */
export function BotaoTabela({ tabela, onAlternar }: { tabela: boolean; onAlternar: () => void }) {
    const { t } = useTranslation();
    return (
        <button type="button" className="painel-acao" aria-pressed={tabela} onClick={onAlternar}>
            {tabela ? <ChartColumnIcon size={16} aria-hidden="true" /> : <Table01Icon size={16} aria-hidden="true" />}
            <span>{tabela ? t("painel.tabela.verGrafico") : t("painel.tabela.ver")}</span>
        </button>
    );
}

/* ---------------------------------------------------------------------------
   Pedidos por etapa
--------------------------------------------------------------------------- */

export function PedidosPorEtapaWidget({ porStatus }: { porStatus: PedidoStatusMetrica[] }) {
    const { t } = useTranslation();
    const etapas = ETAPAS.map((status) => (
        porStatus.find((m) => m.status === status) ?? { status, quantidade: 0, valorTotal: null, atrasados: 0 }
    ));

    if (etapas.every((m) => m.quantidade === 0)) {
        return (
            <WidgetVazio
                icone={<ShoppingBag01Icon size={26} />}
                titulo={t("painel.vazio.pedidos")}
                texto={t("painel.vazio.pedidosTexto")}
            />
        );
    }

    return (
        <BarrasHorizontais
            barras={etapas.map((m) => ({
                id: m.status,
                nome: t(`pedidos.status.${m.status}`),
                rotulo: t(`pedidos.status.${m.status}`),
                valor: m.quantidade,
                valorFormatado: formatNumber(m.quantidade),
                secundaria: m.status === "CANCELADO",
                detalhe: (
                    <>
                        <span>{formatCurrency(m.valorTotal ?? 0, { maximumFractionDigits: 0 })}</span>
                        {m.atrasados > 0 && (
                            <span className="painel-atrasados">
                                <AlertCircleIcon size={12} aria-hidden="true" />
                                {t("painel.atrasadosCount", { count: m.atrasados })}
                            </span>
                        )}
                    </>
                ),
            }))}
        />
    );
}

/* ---------------------------------------------------------------------------
   Materiais mais usados
--------------------------------------------------------------------------- */

export function MateriaisMaisUsadosWidget({ materiais }: { materiais: MaterialPedidoMetrica[] }) {
    const { t } = useTranslation();

    if (materiais.length === 0) {
        return <WidgetVazio icone={<WarehouseIcon size={26} />} titulo={t("painel.vazio.materiais")} />;
    }

    return (
        <BarrasHorizontais
            ordenada
            barras={materiais.map((m, i) => {
                const nome = m.nome ?? t("painel.materialExcluido");
                return {
                    id: m.materialId,
                    nome,
                    rotulo: (
                        <>
                            <span className="painel-posicao" aria-hidden="true">{i + 1}</span>
                            <span className={m.nome ? undefined : "painel-sem-nome"}>{nome}</span>
                        </>
                    ),
                    valor: m.quantidadePedidos,
                    valorFormatado: t("painel.pedidosCount", { count: m.quantidadePedidos }),
                    detalhe: <span>{formatCurrency(m.valorTotal ?? 0, { maximumFractionDigits: 0 })}</span>,
                };
            })}
        />
    );
}

/* ---------------------------------------------------------------------------
   Estoque abaixo do mínimo
--------------------------------------------------------------------------- */

function formatarQuantidade(valor: number, unidade: string): string {
    return `${formatNumber(valor, { maximumFractionDigits: 1 })} ${unidade.toLowerCase()}`;
}

const LIMITE_ALERTAS = 5;

function proporcaoDoMinimo(alerta: AlertaEstoque): number {
    return alerta.estoqueMinimo > 0 ? Math.min(1, alerta.saldo / alerta.estoqueMinimo) : 0;
}

export function EstoqueBaixoWidget({ alertas }: { alertas: AlertaEstoque[] }) {
    const { t } = useTranslation();

    if (alertas.length === 0) {
        return <WidgetVazio icone={<CheckmarkCircle02Icon size={26} />} titulo={t("painel.widgets.estoqueBaixo.vazio")} />;
    }

    // os mais críticos primeiro (menor fração do mínimo); o resto fica na tela de estoque
    const criticos = [...alertas].sort((a, b) => proporcaoDoMinimo(a) - proporcaoDoMinimo(b)).slice(0, LIMITE_ALERTAS);
    const restantes = alertas.length - criticos.length;

    return (
        <>
            <ul className="painel-estoque">
                {criticos.map((alerta) => {
                    const proporcao = proporcaoDoMinimo(alerta);
                    return (
                        <li key={`${alerta.tipoInsumo}-${alerta.insumoId}`} className="painel-estoque-item">
                            <div className="painel-estoque-topo">
                                <span className="painel-estoque-nome">{alerta.nome}</span>
                                <span className="painel-estoque-tipo">
                                    {t(alerta.tipoInsumo === "COR" ? "painel.widgets.estoqueBaixo.tipoCor" : "painel.widgets.estoqueBaixo.tipoMaterial")}
                                </span>
                            </div>
                            <div
                                className="painel-estoque-trilho"
                                role="meter"
                                aria-label={alerta.nome}
                                aria-valuemin={0}
                                aria-valuemax={alerta.estoqueMinimo}
                                aria-valuenow={Math.min(alerta.saldo, alerta.estoqueMinimo)}
                            >
                                <span className="painel-estoque-preenchimento" style={{ width: `${proporcao * 100}%` }} />
                            </div>
                            <div className="painel-estoque-detalhe">
                                <span className="painel-atrasados">
                                    <AlertCircleIcon size={12} aria-hidden="true" />
                                    {t("painel.widgets.estoqueBaixo.abaixo")}
                                </span>
                                <span>
                                    {alerta.estoqueMinimo > 0
                                        ? t("painel.widgets.estoqueBaixo.saldoDe", {
                                            saldo: formatarQuantidade(alerta.saldo, alerta.unidade),
                                            minimo: formatarQuantidade(alerta.estoqueMinimo, alerta.unidade),
                                        })
                                        : formatarQuantidade(alerta.saldo, alerta.unidade)}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className="painel-estoque-rodape">
                {restantes > 0 && (
                    <span>{t("painel.widgets.estoqueBaixo.maisItens", { count: restantes })}</span>
                )}
                <Link to="/estoque" className="painel-link">
                    {t("painel.widgets.estoqueBaixo.verEstoque")}
                </Link>
            </div>
        </>
    );
}
