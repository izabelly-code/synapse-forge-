import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
    ArrowDown01Icon,
    ArrowUp01Icon,
    Calendar03Icon,
    DashboardSquareEditIcon,
    Tick02Icon,
    ViewIcon,
    ViewOffSlashIcon,
} from "hugeicons-react";
import { cn } from "../../utils/cn";
import { formatDate } from "../../utils/format";
import MenuSurface from "../ui/MenuSurface";
import LoadingButton from "../ui/LoadingButton";
import { useDismissable } from "../../hooks/useDismissable";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useRecarregarAoVoltar } from "../../hooks/useRecarregarAoVoltar";
import {
    getMateriaisMaisUsados,
    getPedidosPorMes,
    getPedidosPorStatus,
    type Intervalo,
} from "../../services/MetricasService";
import { getAlertas } from "../../services/EstoqueService";
import {
    getPreferencias,
    salvarPreferencias,
    type PeriodoPainel,
    type WidgetId,
    type WidgetPreferencia,
} from "../../services/PreferenciasService";
import { useMetrica, type Metrica } from "./useMetrica";
import { PERIODO_PADRAO, PERIODOS, intervaloDoFiltro, type FiltroPeriodo } from "./periodo";
import {
    BotaoTabela,
    EstoqueBaixoWidget,
    IndicadoresWidget,
    LIMITE_MATERIAIS,
    MateriaisMaisUsadosWidget,
    PedidosPorEtapaWidget,
    PedidosPorMesWidget,
    WidgetErro,
    WidgetSkeleton,
} from "./widgets";
import "./PainelGerencial.css";

const WIDGETS_PADRAO: WidgetPreferencia[] = (
    ["indicadores", "pedidosPorMes", "pedidosPorEtapa", "materiaisMaisUsados", "estoqueBaixo"] as WidgetId[]
).map((id) => ({ id, visivel: true }));

/** Widgets que ocupam a largura toda; os outros dividem a linha em duas colunas. */
const LARGOS: WidgetId[] = ["indicadores", "pedidosPorMes"];

const SEM_INTERVALO: Intervalo = {};

// funções estáveis (fora do componente) para o effect do useMetrica não rodar a cada render
const buscarMateriais = (intervalo: Intervalo) => getMateriaisMaisUsados(LIMITE_MATERIAIS, intervalo);
const buscarAlertas = () => getAlertas();

/** Layout salvo por uma versão anterior pode ter widget a menos ou repetido: completa com o padrão. */
function normalizarLayout(widgets: WidgetPreferencia[] | undefined): WidgetPreferencia[] {
    const conhecidos = new Set(WIDGETS_PADRAO.map((w) => w.id));
    const vistos = new Set<WidgetId>();
    const lista: WidgetPreferencia[] = [];
    for (const widget of widgets ?? []) {
        if (!conhecidos.has(widget.id) || vistos.has(widget.id)) continue;
        vistos.add(widget.id);
        lista.push({ id: widget.id, visivel: widget.visivel });
    }
    for (const widget of WIDGETS_PADRAO) {
        if (!vistos.has(widget.id)) lista.push({ ...widget });
    }
    return lista;
}

function conteudo<T>(metrica: Metrica<T>, recarregar: () => void, skeleton: ReactNode, render: (dados: T) => ReactNode) {
    if (metrica.erro) return <WidgetErro onTentarDeNovo={recarregar} />;
    if (metrica.dados === undefined) return skeleton;
    return <div className={cn("painel-conteudo", metrica.atualizando && "is-atualizando")}>{render(metrica.dados)}</div>;
}

function PainelGerencial() {
    const { t } = useTranslation();

    const [prefsProntas, setPrefsProntas] = useState(false);
    const [layout, setLayout] = useState<WidgetPreferencia[]>(WIDGETS_PADRAO);
    const [filtro, setFiltro] = useState<FiltroPeriodo>({ tipo: "atalho", periodo: PERIODO_PADRAO });
    // último atalho escolhido: é o que vai para as preferências quando o filtro está num intervalo à mão
    const [ultimoAtalho, setUltimoAtalho] = useState<PeriodoPainel>(PERIODO_PADRAO);
    const [tentativa, setTentativa] = useState(0);
    const [tabelaMensal, setTabelaMensal] = useState(false);

    // não-null = modo "personalizar": as mudanças ficam no rascunho até salvar
    const [rascunho, setRascunho] = useState<WidgetPreferencia[] | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

    const [menuAberto, setMenuAberto] = useState(false);
    const [deCustom, setDeCustom] = useState("");
    const [ateCustom, setAteCustom] = useState("");
    const [erroCustom, setErroCustom] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelado = false;

        async function carregar() {
            try {
                const prefs = await getPreferencias();
                if (cancelado || !prefs.dashboard) return;
                setLayout(normalizarLayout(prefs.dashboard.widgets));
                if (PERIODOS.includes(prefs.dashboard.periodo)) {
                    setFiltro({ tipo: "atalho", periodo: prefs.dashboard.periodo });
                    setUltimoAtalho(prefs.dashboard.periodo);
                }
            } catch {
                // sem preferências (ou back fora): fica o layout padrão
            } finally {
                if (!cancelado) setPrefsProntas(true);
            }
        }

        void carregar();
        return () => {
            cancelado = true;
        };
    }, []);

    useEffect(() => {
        if (!aviso) return;
        const timer = window.setTimeout(() => setAviso(null), 3500);
        return () => window.clearTimeout(timer);
    }, [aviso]);

    const intervalo = useMemo(() => intervaloDoFiltro(filtro), [filtro]);

    const porStatus = useMetrica(getPedidosPorStatus, intervalo, tentativa, prefsProntas);
    const porMes = useMetrica(getPedidosPorMes, intervalo, tentativa, prefsProntas);
    const materiais = useMetrica(buscarMateriais, intervalo, tentativa, prefsProntas);
    const alertas = useMetrica(buscarAlertas, SEM_INTERVALO, tentativa, prefsProntas);

    const recarregar = () => setTentativa((n) => n + 1);
    useRecarregarAoVoltar(recarregar, rascunho === null);

    useDismissable({ enabled: menuAberto, refs: menuRef, onDismiss: () => setMenuAberto(false) });
    useEscapeKey(() => setMenuAberto(false));

    function salvarLayoutEmSegundoPlano(widgets: WidgetPreferencia[], periodo: PeriodoPainel) {
        void salvarPreferencias({ dashboard: { periodo, widgets } }).catch(() => {});
    }

    function escolherAtalho(periodo: PeriodoPainel) {
        setFiltro({ tipo: "atalho", periodo });
        setUltimoAtalho(periodo);
        setMenuAberto(false);
        setErroCustom("");
        salvarLayoutEmSegundoPlano(layout, periodo);
    }

    function aplicarPersonalizado(event: FormEvent) {
        event.preventDefault();
        if (!deCustom || !ateCustom) {
            setErroCustom(t("painel.periodo.obrigatorio"));
            return;
        }
        if (deCustom > ateCustom) {
            setErroCustom(t("painel.periodo.invalido"));
            return;
        }
        setErroCustom("");
        setFiltro({ tipo: "personalizado", de: deCustom, ate: ateCustom });
        setMenuAberto(false);
    }

    function abrirMenu() {
        if (!menuAberto && filtro.tipo === "personalizado") {
            setDeCustom(filtro.de);
            setAteCustom(filtro.ate);
        }
        setMenuAberto((aberto) => !aberto);
    }

    const rotuloFiltro = filtro.tipo === "atalho"
        ? t(`painel.periodo.${filtro.periodo}`)
        : `${formatDate(`${filtro.de}T00:00`)} – ${formatDate(`${filtro.ate}T00:00`)}`;

    /* ----- personalizar ----- */

    function iniciarEdicao() {
        setRascunho(layout.map((w) => ({ ...w })));
        setAviso(null);
    }

    function mover(indice: number, delta: number) {
        setRascunho((atual) => {
            if (!atual) return atual;
            const destino = indice + delta;
            if (destino < 0 || destino >= atual.length) return atual;
            const lista = [...atual];
            [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
            return lista;
        });
    }

    function alternarVisivel(indice: number) {
        setRascunho((atual) => atual && atual.map((w, i) => (i === indice ? { ...w, visivel: !w.visivel } : w)));
    }

    async function salvarEdicao() {
        if (!rascunho) return;
        setSalvando(true);
        try {
            await salvarPreferencias({ dashboard: { periodo: ultimoAtalho, widgets: rascunho } });
            setLayout(rascunho);
            setRascunho(null);
            setAviso({ tipo: "ok", texto: t("painel.personalizar.salvo") });
        } catch {
            setAviso({ tipo: "erro", texto: t("painel.personalizar.erroSalvar") });
        } finally {
            setSalvando(false);
        }
    }

    /* ----- widgets ----- */

    const editando = rascunho !== null;
    const lista = rascunho ?? layout;
    const nenhumVisivel = !editando && lista.every((w) => !w.visivel);

    function widget(id: WidgetId): { titulo: string; subtitulo: string; acoes?: ReactNode; corpo: ReactNode } {
        switch (id) {
            case "indicadores":
                return {
                    titulo: t("painel.widgets.indicadores.titulo"),
                    subtitulo: t("painel.widgets.indicadores.subtitulo"),
                    corpo: conteudo(porStatus, recarregar, <WidgetSkeleton linhas={1} />, (dados) => <IndicadoresWidget porStatus={dados} />),
                };
            case "pedidosPorMes":
                return {
                    titulo: t("painel.widgets.pedidosPorMes.titulo"),
                    subtitulo: t("painel.widgets.pedidosPorMes.subtitulo"),
                    acoes: <BotaoTabela tabela={tabelaMensal} onAlternar={() => setTabelaMensal((v) => !v)} />,
                    corpo: conteudo(porMes, recarregar, <WidgetSkeleton grafico />, (dados) => (
                        <PedidosPorMesWidget dados={dados} intervalo={intervalo} tabela={tabelaMensal} />
                    )),
                };
            case "pedidosPorEtapa":
                return {
                    titulo: t("painel.widgets.pedidosPorEtapa.titulo"),
                    subtitulo: t("painel.widgets.pedidosPorEtapa.subtitulo"),
                    corpo: conteudo(porStatus, recarregar, <WidgetSkeleton linhas={6} />, (dados) => <PedidosPorEtapaWidget porStatus={dados} />),
                };
            case "materiaisMaisUsados":
                return {
                    titulo: t("painel.widgets.materiaisMaisUsados.titulo"),
                    subtitulo: t("painel.widgets.materiaisMaisUsados.subtitulo", { count: LIMITE_MATERIAIS }),
                    corpo: conteudo(materiais, recarregar, <WidgetSkeleton linhas={5} />, (dados) => <MateriaisMaisUsadosWidget materiais={dados} />),
                };
            case "estoqueBaixo":
                return {
                    titulo: t("painel.widgets.estoqueBaixo.titulo"),
                    subtitulo: t("painel.widgets.estoqueBaixo.subtitulo"),
                    corpo: conteudo(alertas, recarregar, <WidgetSkeleton linhas={3} />, (dados) => <EstoqueBaixoWidget alertas={dados} />),
                };
        }
    }

    return (
        <main className="dashboard-main painel-page">
            <header className="dashboard-title-block">
                <h1 className="dashboard-title">{t("painel.title")}</h1>
                <p className="dashboard-subtitle">{t("painel.subtitle")}</p>
            </header>

            <div className="painel-filtros">
                <div className="filtro-menu" ref={menuRef}>
                    <button
                        type="button"
                        className={cn("filtro-action", "painel-filtro-periodo")}
                        aria-haspopup="dialog"
                        aria-expanded={menuAberto}
                        onClick={abrirMenu}
                    >
                        <Calendar03Icon size={15} aria-hidden="true" />
                        <span className="filtro-action-label">
                            <span className="painel-filtro-rotulo">{t("painel.periodo.label")}:</span> {rotuloFiltro}
                        </span>
                        <ArrowDown01Icon size={15} className="filtro-action-chev" aria-hidden="true" />
                    </button>

                    {menuAberto && (
                        <MenuSurface className="filtro-dropdown painel-periodo-menu" role="dialog" aria-label={t("painel.periodo.label")}>
                            <div role="menu" aria-label={t("painel.periodo.atalhos")}>
                                {PERIODOS.map((periodo) => {
                                    const selecionado = filtro.tipo === "atalho" && filtro.periodo === periodo;
                                    return (
                                        <button
                                            key={periodo}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={selecionado}
                                            className={cn("filtro-option", selecionado && "selected")}
                                            onClick={() => escolherAtalho(periodo)}
                                        >
                                            {t(`painel.periodo.${periodo}`)}
                                            {selecionado && <Tick02Icon size={15} aria-hidden="true" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <form className="painel-periodo-form" onSubmit={aplicarPersonalizado} noValidate>
                                <span className="painel-periodo-form-titulo">{t("painel.periodo.personalizado")}</span>
                                <div className="painel-periodo-campos">
                                    <label>
                                        <span>{t("painel.periodo.de")}</span>
                                        <input type="date" value={deCustom} onChange={(e) => setDeCustom(e.target.value)} />
                                    </label>
                                    <label>
                                        <span>{t("painel.periodo.ate")}</span>
                                        <input type="date" value={ateCustom} onChange={(e) => setAteCustom(e.target.value)} />
                                    </label>
                                </div>
                                {erroCustom && <p className="painel-periodo-erro" role="alert">{erroCustom}</p>}
                                <button type="submit" className="btn-secondary painel-periodo-aplicar">
                                    {t("painel.periodo.aplicar")}
                                </button>
                            </form>
                        </MenuSurface>
                    )}
                </div>

                <div className="painel-filtros-acoes">
                    {aviso && (
                        <span className={cn("painel-aviso", aviso.tipo === "erro" && "is-erro")} role="status">
                            {aviso.texto}
                        </span>
                    )}
                    {editando ? (
                        <>
                            <button type="button" className="painel-acao" onClick={() => setRascunho(WIDGETS_PADRAO.map((w) => ({ ...w })))}>
                                {t("painel.personalizar.restaurar")}
                            </button>
                            <button type="button" className="btn-secondary painel-botao" onClick={() => setRascunho(null)} disabled={salvando}>
                                {t("painel.personalizar.cancelar")}
                            </button>
                            <LoadingButton
                                type="button"
                                className="painel-botao"
                                pending={salvando}
                                pendingLabel={t("painel.personalizar.salvando")}
                                onClick={() => void salvarEdicao()}
                            >
                                {t("painel.personalizar.salvar")}
                            </LoadingButton>
                        </>
                    ) : (
                        <button type="button" className="filtro-action" onClick={iniciarEdicao}>
                            <DashboardSquareEditIcon size={15} aria-hidden="true" />
                            <span className="filtro-action-label">{t("painel.personalizar.botao")}</span>
                        </button>
                    )}
                </div>
            </div>

            {editando && <p className="painel-ajuda">{t("painel.personalizar.ajuda")}</p>}

            {nenhumVisivel ? (
                <div className="painel-card painel-vazio-geral">
                    <p className="painel-estado-titulo">{t("painel.personalizar.nenhumVisivel")}</p>
                    <button type="button" className="painel-link" onClick={iniciarEdicao}>
                        {t("painel.personalizar.botao")}
                    </button>
                </div>
            ) : (
                <div className="painel-grid-wrap">
                    <div className="painel-grid">
                        {lista.map((item, indice) => {
                            if (!editando && !item.visivel) return null;
                            const dados = widget(item.id);
                            const largo = LARGOS.includes(item.id);
                            return (
                                <section
                                    key={item.id}
                                    className={cn(
                                        "painel-card",
                                        largo && "painel-card--largo",
                                        item.id === "indicadores" && "painel-card--sem-moldura",
                                        editando && "is-editando",
                                        editando && !item.visivel && "is-oculto",
                                    )}
                                    aria-labelledby={`painel-${item.id}-titulo`}
                                >
                                    <div className="painel-card-head">
                                        <div className="painel-card-titulos">
                                            <h2 id={`painel-${item.id}-titulo`}>{dados.titulo}</h2>
                                            <p>{dados.subtitulo}</p>
                                        </div>

                                        {editando ? (
                                            <div className="painel-card-controles" role="group" aria-label={dados.titulo}>
                                                <button
                                                    type="button"
                                                    className="painel-controle"
                                                    onClick={() => mover(indice, -1)}
                                                    disabled={indice === 0}
                                                    aria-label={t("painel.personalizar.subir", { nome: dados.titulo })}
                                                >
                                                    <ArrowUp01Icon size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="painel-controle"
                                                    onClick={() => mover(indice, 1)}
                                                    disabled={indice === lista.length - 1}
                                                    aria-label={t("painel.personalizar.descer", { nome: dados.titulo })}
                                                >
                                                    <ArrowDown01Icon size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={cn("painel-controle", !item.visivel && "is-desligado")}
                                                    onClick={() => alternarVisivel(indice)}
                                                    aria-pressed={item.visivel}
                                                    aria-label={t(item.visivel ? "painel.personalizar.ocultar" : "painel.personalizar.mostrar", { nome: dados.titulo })}
                                                >
                                                    {item.visivel ? <ViewIcon size={16} /> : <ViewOffSlashIcon size={16} />}
                                                </button>
                                            </div>
                                        ) : (
                                            dados.acoes
                                        )}
                                    </div>

                                    {editando && !item.visivel ? (
                                        <p className="painel-oculto">{t("painel.personalizar.oculto")}</p>
                                    ) : (
                                        dados.corpo
                                    )}
                                </section>
                            );
                        })}
                    </div>
                </div>
            )}
        </main>
    );
}

export default PainelGerencial;
