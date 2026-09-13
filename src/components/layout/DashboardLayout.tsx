import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useEscapeKey } from "../../hooks/useEscapeKey";

/** Espelha o colapso do shell no CSS (`@media (max-width: 1024px)`, passo canônico lg). */
const SHELL_COMPACTO = "(max-width: 1024px)";
const DRAWER_ID = "sidebar-drawer";

/**
 * O hook de trava de scroll é "mount-based": este nó só existe enquanto a gaveta
 * está aberta, então montar/desmontar é o liga/desliga da trava.
 */
function BodyScrollLock() {
    useBodyScrollLock();
    return null;
}

function DashboardLayout() {
    const location = useLocation();
    const [compacto, setCompacto] = useState(() => window.matchMedia(SHELL_COMPACTO).matches);
    const [drawerAberto, setDrawerAberto] = useState(false);

    // Ao passar para o layout largo a sidebar volta ao fluxo: a gaveta precisa
    // fechar para não deixar o scrim e a trava de scroll pendurados.
    useEffect(() => {
        const mq = window.matchMedia(SHELL_COMPACTO);
        function onChange(event: MediaQueryListEvent) {
            setCompacto(event.matches);
            if (!event.matches) setDrawerAberto(false);
        }
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    // Navegar fecha a gaveta (os itens de menu ficam dentro dela). Ajuste de
    // estado durante a renderização, não num efeito: é o padrão recomendado para
    // "derivar de uma prop que mudou" e evita o render extra com a gaveta aberta.
    const [rotaAnterior, setRotaAnterior] = useState(location.pathname);
    if (rotaAnterior !== location.pathname) {
        setRotaAnterior(location.pathname);
        setDrawerAberto(false);
    }

    useEscapeKey(() => setDrawerAberto(false));

    const drawerVisivel = compacto && drawerAberto;

    return (
        <div className="dashboard-shell">
            <Sidebar
                id={DRAWER_ID}
                compacto={compacto}
                drawerAberto={drawerVisivel}
                onFecharDrawer={() => setDrawerAberto(false)}
            />

            {drawerVisivel && (
                <>
                    <BodyScrollLock />
                    <div
                        className="drawer-scrim"
                        aria-hidden="true"
                        onClick={() => setDrawerAberto(false)}
                    />
                </>
            )}

            <div className="dashboard-content">
                {compacto && (
                    <MobileHeader
                        drawerAberto={drawerVisivel}
                        onAbrirDrawer={() => setDrawerAberto(true)}
                        drawerId={DRAWER_ID}
                    />
                )}
                <Outlet />
            </div>
        </div>
    );
}

export default DashboardLayout;
