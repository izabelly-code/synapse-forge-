import type { HTMLAttributes, ReactNode } from "react";
import { useMenuHighlight } from "../../hooks/useMenuHighlight";

interface MenuSurfaceProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

/**
 * Painel de menu com realce viajante. Só monta quando o menu está aberto, então
 * o hook fica sempre habilitado; o `<span>` é a peça que desliza atrás dos itens
 * e sai da árvore de acessibilidade pelo aria-hidden (um role="menu" só deve
 * expor menuitems).
 *
 * Usado pelos kebabs, pelos dropdowns de filtro e pelo dropup de idioma.
 */
function MenuSurface({ children, ...rest }: MenuSurfaceProps) {
    const ref = useMenuHighlight<HTMLDivElement>({ enabled: true });

    return (
        <div ref={ref} {...rest}>
            <span className="menu-highlight" aria-hidden="true" />
            {children}
        </div>
    );
}

export default MenuSurface;
