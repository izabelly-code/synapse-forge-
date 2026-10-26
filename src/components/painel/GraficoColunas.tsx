import { useLayoutEffect, useRef, useState } from "react";

export interface Coluna {
    /** Identificador estável (o mês "AAAA-MM"). */
    id: string;
    valor: number;
    /** Rótulo curto do eixo X ("ago"). */
    rotulo: string;
    /** Segunda linha do eixo X, só onde ajuda a ler (o ano no primeiro mês e em janeiro). */
    rotuloSecundario?: string;
    /** Título do tooltip ("agosto de 2026"). */
    titulo: string;
    /** Linhas extras do tooltip, abaixo do valor. */
    detalhes: string[];
}

interface GraficoColunasProps {
    colunas: Coluna[];
    formatarValor: (valor: number) => string;
    /** Formato curto dos ticks do eixo Y (compacto). */
    formatarEixo: (valor: number) => string;
    ariaLabel: string;
}

const ALTURA_PLOT = 200;
const FAIXA_X = 34;
const TOPO = 22; // espaço para o rótulo de valor sobre a coluna mais alta
const LARGURA_MAX_COLUNA = 24;
const RAIO = 4;

/** Teto "redondo" do eixo e o passo entre os ticks (4 divisões: 0, 1/4, 1/2, 3/4, teto). */
function escalaRedonda(maximo: number): { teto: number; passo: number } {
    if (maximo <= 0) return { teto: 4, passo: 1 };
    const bruto = maximo / 4;
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const fracao = bruto / potencia;
    const passo = (fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 2.5 ? 2.5 : fracao <= 5 ? 5 : 10) * potencia;
    return { teto: passo * 4, passo };
}

/** Coluna com o topo arredondado (4px) e a base reta, crescendo da linha de base. */
function caminhoColuna(x: number, y: number, largura: number, altura: number): string {
    const r = Math.min(RAIO, largura / 2, altura);
    const base = y + altura;
    return [
        `M${x},${base}`,
        `V${y + r}`,
        `A${r},${r} 0 0 1 ${x + r},${y}`,
        `H${x + largura - r}`,
        `A${r},${r} 0 0 1 ${x + largura},${y + r}`,
        `V${base}`,
        "Z",
    ].join(" ");
}

/**
 * Colunas de uma série só (uma cor, um eixo), em SVG próprio com os tokens do tema.
 * Rótulo de valor só na coluna mais alta e na última (o resto fica no eixo, no
 * tooltip e na visão em tabela). Cada coluna tem uma área de toque da faixa
 * inteira, maior que a marca, com o mesmo tooltip no hover e no foco do teclado.
 */
function GraficoColunas({ colunas, formatarValor, formatarEixo, ariaLabel }: GraficoColunasProps) {
    const caixaRef = useRef<HTMLDivElement>(null);
    const [largura, setLargura] = useState(0);
    const [ativa, setAtiva] = useState<number | null>(null);

    useLayoutEffect(() => {
        const caixa = caixaRef.current;
        if (!caixa) return;
        const observer = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
        observer.observe(caixa);
        return () => observer.disconnect();
    }, []);

    const maximo = Math.max(0, ...colunas.map((c) => c.valor));
    const { teto, passo } = escalaRedonda(maximo);
    const ticks = [0, 1, 2, 3, 4].map((i) => i * passo);
    const margemEsquerda = Math.max(28, ...ticks.map((t) => formatarEixo(t).length * 6.5 + 8));
    const larguraPlot = Math.max(0, largura - margemEsquerda);
    const faixa = colunas.length > 0 ? larguraPlot / colunas.length : 0;
    const larguraColuna = Math.max(2, Math.min(LARGURA_MAX_COLUNA, faixa * 0.6));
    // com muitos meses, só um rótulo a cada N para não encavalar (~44px por rótulo)
    const saltoRotulo = Math.max(1, Math.ceil(44 / Math.max(faixa, 1)));
    const alturaTotal = TOPO + ALTURA_PLOT + FAIXA_X;

    const y = (valor: number) => TOPO + ALTURA_PLOT - (teto > 0 ? (valor / teto) * ALTURA_PLOT : 0);
    const indiceMaior = colunas.reduce((melhor, c, i) => (c.valor > colunas[melhor].valor ? i : melhor), 0);
    const rotulados = new Set([indiceMaior, colunas.length - 1]);

    const colunaAtiva = ativa !== null ? colunas[ativa] : null;
    const centroAtiva = ativa !== null ? margemEsquerda + faixa * ativa + faixa / 2 : 0;

    return (
        <div ref={caixaRef} className="grafico-colunas">
            {largura > 0 && (
                <svg
                    width={largura}
                    height={alturaTotal}
                    role="img"
                    aria-label={ariaLabel}
                    onPointerLeave={() => setAtiva(null)}
                >
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line
                                className="grafico-grade"
                                x1={margemEsquerda}
                                x2={largura}
                                y1={y(tick)}
                                y2={y(tick)}
                            />
                            <text className="grafico-tick" x={margemEsquerda - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                                {formatarEixo(tick)}
                            </text>
                        </g>
                    ))}

                    {colunas.map((coluna, i) => {
                        const x = margemEsquerda + faixa * i + (faixa - larguraColuna) / 2;
                        const topo = y(coluna.valor);
                        const altura = TOPO + ALTURA_PLOT - topo;
                        const mostraRotuloX = i % saltoRotulo === 0 || i === colunas.length - 1;
                        return (
                            <g key={coluna.id}>
                                {altura > 0 && (
                                    <path
                                        className={ativa === i ? "grafico-coluna is-ativa" : "grafico-coluna"}
                                        d={caminhoColuna(x, topo, larguraColuna, altura)}
                                    />
                                )}
                                {rotulados.has(i) && coluna.valor > 0 && (
                                    <text className="grafico-rotulo" x={x + larguraColuna / 2} y={topo - 6} textAnchor="middle">
                                        {formatarValor(coluna.valor)}
                                    </text>
                                )}
                                {mostraRotuloX && (
                                    <text className="grafico-eixo-x" x={margemEsquerda + faixa * i + faixa / 2} y={TOPO + ALTURA_PLOT + 16} textAnchor="middle">
                                        {coluna.rotulo}
                                        {coluna.rotuloSecundario && (
                                            <tspan x={margemEsquerda + faixa * i + faixa / 2} dy="13" className="grafico-eixo-ano">
                                                {coluna.rotuloSecundario}
                                            </tspan>
                                        )}
                                    </text>
                                )}
                                <rect
                                    className="grafico-alvo"
                                    x={margemEsquerda + faixa * i}
                                    y={TOPO}
                                    width={faixa}
                                    height={ALTURA_PLOT}
                                    tabIndex={0}
                                    role="graphics-symbol"
                                    aria-label={`${coluna.titulo}: ${formatarValor(coluna.valor)}. ${coluna.detalhes.join(". ")}`}
                                    onPointerEnter={() => setAtiva(i)}
                                    onFocus={() => setAtiva(i)}
                                    onBlur={() => setAtiva(null)}
                                />
                            </g>
                        );
                    })}

                    <line
                        className="grafico-base"
                        x1={margemEsquerda}
                        x2={largura}
                        y1={TOPO + ALTURA_PLOT}
                        y2={TOPO + ALTURA_PLOT}
                    />
                </svg>
            )}

            {colunaAtiva && (
                <div
                    className="grafico-tooltip"
                    role="presentation"
                    style={{
                        left: Math.min(Math.max(centroAtiva, 80), Math.max(80, largura - 80)),
                        // acima do rótulo de valor da coluna, para não cobri-lo
                        top: y(colunaAtiva.valor) - 24,
                    }}
                >
                    <strong>{formatarValor(colunaAtiva.valor)}</strong>
                    <span className="grafico-tooltip-titulo">{colunaAtiva.titulo}</span>
                    {colunaAtiva.detalhes.map((linha) => (
                        <span key={linha} className="grafico-tooltip-detalhe">{linha}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GraficoColunas;
