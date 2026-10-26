import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface Barra {
    id: string;
    rotulo: ReactNode;
    /** Nome em texto puro para o leitor de tela (o rótulo pode ter ícone ou posição). */
    nome: string;
    valor: number;
    /** Valor já formatado, mostrado na ponta. */
    valorFormatado: string;
    /** Linha secundária abaixo da barra (valor em R$, atrasados...). */
    detalhe?: ReactNode;
    /** Barra de contexto (ex.: cancelados): cinza, sem a cor da série. */
    secundaria?: boolean;
}

interface BarrasHorizontaisProps {
    barras: Barra[];
    ordenada?: boolean;
}

/**
 * Barras horizontais de uma série só: todas na mesma cor (a cor carrega a série,
 * não o tamanho), valor escrito na ponta de cada uma, linha de base comum.
 * Pouca quantidade de barras (até ~7), então todo valor fica visível sem tooltip.
 */
function BarrasHorizontais({ barras, ordenada = false }: BarrasHorizontaisProps) {
    const maximo = Math.max(1, ...barras.map((b) => b.valor));
    const Lista = ordenada ? "ol" : "ul";

    return (
        <Lista className="painel-barras">
            {barras.map((barra) => (
                <li key={barra.id} className={cn("painel-barra", barra.secundaria && "is-secundaria")}>
                    <div className="painel-barra-topo">
                        <span className="painel-barra-nome">{barra.rotulo}</span>
                        <span className="painel-barra-valor">{barra.valorFormatado}</span>
                    </div>
                    <div
                        className="painel-barra-trilho"
                        role="meter"
                        aria-label={barra.nome}
                        aria-valuemin={0}
                        aria-valuemax={maximo}
                        aria-valuenow={barra.valor}
                        aria-valuetext={barra.valorFormatado}
                    >
                        {barra.valor > 0 && (
                            <span className="painel-barra-preenchimento" style={{ width: `${(barra.valor / maximo) * 100}%` }} />
                        )}
                    </div>
                    {barra.detalhe && <div className="painel-barra-detalhe">{barra.detalhe}</div>}
                </li>
            ))}
        </Lista>
    );
}

export default BarrasHorizontais;
