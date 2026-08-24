import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar03Icon, ClipboardIcon, DollarCircleIcon, DropletIcon, Globe02Icon, Logout03Icon, Moon02Icon, ShoppingBag01Icon, SlidersHorizontalIcon, Sun03Icon, Tick02Icon, UserIcon, WarehouseIcon } from "hugeicons-react";
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
    { labelKey: "sidebar.pedidos", path: "/dashboard", icon: <ShoppingBag01Icon size={18} /> },
    { labelKey: "sidebar.paletaCores", path: "/paleta-cores", icon: <DropletIcon size={18} /> },
    { labelKey: "sidebar.calculadoraMistura", path: "/calculadora-mistura", icon: <SlidersHorizontalIcon size={18} /> },
    { labelKey: "sidebar.materiais", path: "/materiais", icon: <WarehouseIcon size={18} /> },
    { labelKey: "sidebar.orcamento", path: "/orcamento", icon: <DollarCircleIcon size={18} /> },
    { labelKey: "sidebar.ordensPintura", path: "/ordens-pintura", icon: <ClipboardIcon size={18} /> },
    { labelKey: "sidebar.calendario", path: "/calendar", icon: <Calendar03Icon size={18} /> },
    { labelKey: "sidebar.perfil", path: "/perfil", icon: <UserIcon size={18} /> },
];

const LANGUAGES = [
    { code: "pt-BR", labelKey: "sidebar.langPortuguese" },
    { code: "en-US", labelKey: "sidebar.langEnglish" },
];

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();

    const [nome, setNome] = useState(() => localStorage.getItem("userNome") ?? "");
    const [email, setEmail] = useState(() => localStorage.getItem("userEmail") ?? "");
    const [langMenuAberto, setLangMenuAberto] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!langMenuAberto) return;
        function onClick(e: MouseEvent) {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
                setLangMenuAberto(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [langMenuAberto]);

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

            <div className="sidebar-controls">
                <button
                    type="button"
                    className="sidebar-icon-btn"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? t("sidebar.themeToLightAria") : t("sidebar.themeToDarkAria")}
                    title={theme === "dark" ? t("sidebar.themeToLight") : t("sidebar.themeToDark")}
                >
                    {theme === "dark" ? <Sun03Icon size={18} /> : <Moon02Icon size={18} />}
                </button>

                <div className="sidebar-lang-wrap" ref={langMenuRef}>
                    <button
                        type="button"
                        className={`sidebar-icon-btn ${langMenuAberto ? "is-open" : ""}`}
                        onClick={() => setLangMenuAberto((o) => !o)}
                        aria-label={t("sidebar.languageAria")}
                        title={t("sidebar.languageAria")}
                        aria-haspopup="menu"
                        aria-expanded={langMenuAberto}
                    >
                        <Globe02Icon size={18} />
                    </button>

                    {langMenuAberto && (
                        <div className="sidebar-lang-menu" role="menu">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={i18n.language === lang.code}
                                    className={`sidebar-lang-option ${i18n.language === lang.code ? "selected" : ""}`}
                                    onClick={() => { i18n.changeLanguage(lang.code); setLangMenuAberto(false); }}
                                >
                                    {t(lang.labelKey)}
                                    {i18n.language === lang.code && <Tick02Icon size={15} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button type="button" className="sidebar-logout" onClick={handleLogout}>
                <span className="sidebar-nav-icon"><Logout03Icon size={18} /></span>
                <span>{t("sidebar.logout")}</span>
            </button>
        </aside>
    );
}

export default Sidebar;
