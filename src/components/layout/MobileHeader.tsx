import { useEffect, useRef } from "react";
import { Menu01Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import logoDark from "../../assets/Images/black-logo.png";
import logoLight from "../../assets/Images/white-logo.png";
import IconButton from "../ui/IconButton";

interface MobileHeaderProps {
    /** Estado da gaveta — alimenta `aria-expanded` e a devolução do foco ao fechar. */
    drawerAberto: boolean;
    onAbrirDrawer: () => void;
    /** `id` do elemento controlado pelo hambúrguer (a gaveta). */
    drawerId: string;
}

/**
 * Barra sticky do shell no modo compacto (≤1024px), onde a Sidebar virou gaveta:
 * hambúrguer + logo pequeno. Renderizado pelo DashboardLayout só abaixo do
 * colapso; o CSS esconde a classe por padrão como segunda trava.
 */
function MobileHeader({ drawerAberto, onAbrirDrawer, drawerId }: MobileHeaderProps) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const headerRef = useRef<HTMLElement>(null);
    const estavaAberto = useRef(false);

    // Devolve o foco ao hambúrguer quando a gaveta fecha (Escape, scrim, troca de
    // rota): o useFocusTrap da Sidebar captura o gatilho na montagem dela, que
    // acontece antes de qualquer abertura, então o foco não voltaria sozinho.
    useEffect(() => {
        if (drawerAberto) {
            estavaAberto.current = true;
            return;
        }
        if (!estavaAberto.current) return;
        estavaAberto.current = false;
        headerRef.current
            ?.querySelector<HTMLButtonElement>(".mobile-header-toggle")
            ?.focus({ preventScroll: true });
    }, [drawerAberto]);

    return (
        <header className="mobile-header" ref={headerRef}>
            <IconButton
                variant="sidebar"
                className="mobile-header-toggle"
                onClick={onAbrirDrawer}
                aria-label={t("sidebar.openMenu")}
                title={t("sidebar.openMenu")}
                aria-expanded={drawerAberto}
                aria-controls={drawerId}
            >
                <Menu01Icon size={20} />
            </IconButton>

            <img
                src={theme === "dark" ? logoLight : logoDark}
                alt="SynapseForge"
                className="mobile-header-logo"
            />
        </header>
    );
}

export default MobileHeader;
