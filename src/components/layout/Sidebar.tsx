import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiPackage, FiCalendar, FiUser, FiLogOut, FiDroplet, FiBox, FiSliders, FiClipboard, FiDollarSign, FiSun, FiMoon, FiGlobe } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { getUserById } from "../../services/UserService";
import { useTheme } from "../../contexts/ThemeContext";
import logoDark from "../../assets/Images/black-logo.png";
import logoLight from "../../assets/Images/white-logo.png";

interface NavItem {
    labelKey: string;
    path: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
    { labelKey: "sidebar.pedidos", path: "/dashboard", icon: <FiPackage size={18} /> },
    { labelKey: "sidebar.paletaCores", path: "/paleta-cores", icon: <FiDroplet size={18} /> },
    { labelKey: "sidebar.calculadoraMistura", path: "/calculadora-mistura", icon: <FiSliders size={18} /> },
    { labelKey: "sidebar.materiais", path: "/materiais", icon: <FiBox size={18} /> },
    { labelKey: "sidebar.orcamento", path: "/orcamento", icon: <FiDollarSign size={18} /> },
    { labelKey: "sidebar.ordensPintura", path: "/ordens-pintura", icon: <FiClipboard size={18} /> },
    { labelKey: "sidebar.calendario", path: "/calendar", icon: <FiCalendar size={18} /> },
    { labelKey: "sidebar.perfil", path: "/perfil", icon: <FiUser size={18} /> },
];

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();

    const [nome, setNome] = useState(() => localStorage.getItem("userNome") ?? "");
    const [email, setEmail] = useState(() => localStorage.getItem("userEmail") ?? "");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (!userId || !token) return;
        getUserById(userId, token).then((user) => {
            if (user) {
                const nextNome = user.nome ?? "";
                const nextEmail = user.email ?? "";
                setNome(nextNome);
                setEmail(nextEmail);
                localStorage.setItem("userNome", nextNome);
                localStorage.setItem("userEmail", nextEmail);
            }
        });
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userNome");
        localStorage.removeItem("userEmail");
        navigate("/login");
    }

    function getInitial() {
        return nome ? nome.charAt(0).toUpperCase() : "?";
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src={theme === "dark" ? logoLight : logoDark} alt="SynapseForge" className="sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
            </div>

            <div className="sidebar-user">
                <div className="sidebar-avatar">{getInitial()}</div>
                <div className="sidebar-user-info">
                    <span className="sidebar-user-name">{nome || t("sidebar.userFallback")}</span>
                    {email && <span className="sidebar-user-email">{email}</span>}
                </div>
            </div>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            type="button"
                            className={`sidebar-nav-item ${active ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="sidebar-nav-icon">{item.icon}</span>
                            <span>{t(item.labelKey)}</span>
                        </button>
                    );
                })}
            </nav>

            <button
                type="button"
                className="sidebar-nav-item sidebar-theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? t("sidebar.themeToLightAria") : t("sidebar.themeToDarkAria")}
            >
                <span className="sidebar-nav-icon">{theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}</span>
                <span>{theme === "dark" ? t("sidebar.themeToLight") : t("sidebar.themeToDark")}</span>
            </button>

            <button
                type="button"
                className="sidebar-nav-item sidebar-lang-toggle"
                onClick={() => i18n.changeLanguage(i18n.language === "pt-BR" ? "en-US" : "pt-BR")}
                aria-label={t("sidebar.languageAria")}
            >
                <span className="sidebar-nav-icon"><FiGlobe size={18} /></span>
                <span>{i18n.language === "pt-BR" ? t("sidebar.langEnglish") : t("sidebar.langPortuguese")}</span>
            </button>

            <button type="button" className="sidebar-logout" onClick={handleLogout}>
                <span className="sidebar-nav-icon"><FiLogOut size={18} /></span>
                <span>{t("sidebar.logout")}</span>
            </button>
        </aside>
    );
}

export default Sidebar;
