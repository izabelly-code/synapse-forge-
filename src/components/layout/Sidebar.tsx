import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar03Icon, ClipboardIcon, DollarCircleIcon, DropletIcon, Globe02Icon, Logout03Icon, Moon02Icon, ShoppingBag01Icon, SlidersHorizontalIcon, Sun03Icon, Tick02Icon, UserIcon, WarehouseIcon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { getUserById } from "../../services/UserService";
import { useTheme } from "../../contexts/ThemeContext";
import logoDark from "../../assets/Images/black-logo.png";
import logoLight from "../../assets/Images/white-logo.png";
import { cn } from "../../utils/cn";
import { avatarPalette } from "../../utils/avatarPalette";
import { useDismissable } from "../../hooks/useDismissable";
import { useNotificacoesUrgentes } from "../../hooks/useNotificacoesUrgentes";
import IconButton from "../ui/IconButton";
import NotificationBell, { NotificationItem } from "../ui/NotificationBell";

interface NavItem {
    labelKey: string;
    path: string;
    icon: React.ReactNode;
}

interface NavGroup {
    /** Identificador estável — vira o id do heading que rotula a seção. */
    id: string;
    labelKey: string;
    items: NavItem[];
}

/**
 * Taxonomia das 5 áreas do mapa SYN-53 (docs/syn-53-mapa-menu.md).
 * Agrupamento é só visual: todos os itens ficam sempre visíveis, sem expandir/colapsar.
 */
const NAV_GROUPS: NavGroup[] = [
    {
        id: "pedidos",
        labelKey: "sidebar.areaPedidos",
        items: [
            { labelKey: "sidebar.pedidosClientes", path: "/dashboard", icon: <ShoppingBag01Icon size={18} /> },
            { labelKey: "sidebar.ordensPintura", path: "/ordens-pintura", icon: <ClipboardIcon size={18} /> },
        ],
    },
    {
        id: "orcamentos",
        labelKey: "sidebar.areaOrcamentos",
        items: [
            { labelKey: "sidebar.orcamento", path: "/orcamento", icon: <DollarCircleIcon size={18} /> },
        ],
    },
    {
        id: "estoque",
        labelKey: "sidebar.areaEstoqueCores",
        items: [
            { labelKey: "sidebar.paletaCores", path: "/paleta-cores", icon: <DropletIcon size={18} /> },
            { labelKey: "sidebar.calculadoraMistura", path: "/calculadora-mistura", icon: <SlidersHorizontalIcon size={18} /> },
            { labelKey: "sidebar.materiais", path: "/materiais", icon: <WarehouseIcon size={18} /> },
        ],
    },
    {
        id: "agenda",
        labelKey: "sidebar.areaAgenda",
        items: [
            { labelKey: "sidebar.calendario", path: "/calendar", icon: <Calendar03Icon size={18} /> },
        ],
    },
    {
        id: "admin",
        labelKey: "sidebar.areaAdmin",
        items: [
            { labelKey: "sidebar.perfil", path: "/perfil", icon: <UserIcon size={18} /> },
        ],
    },
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

    useDismissable({
        enabled: langMenuAberto,
        refs: langMenuRef,
        onDismiss: () => setLangMenuAberto(false),
    });

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

    const { pedidosUrgentes, ordensUrgentes } = useNotificacoesUrgentes();
    const notificacoes: NotificationItem[] = [
        ...pedidosUrgentes.map(({ pedido, atrasado }) => ({
            id: `pedido-${pedido.id}`,
            title: pedido.projeto,
            subtitle: pedido.cliente,
            tone: atrasado ? ("danger" as const) : ("warn" as const),
            tagLabel: atrasado ? t("pedidos.dashboard.tagLate") : t("pedidos.dashboard.tagDueToday"),
            onSelect: () => navigate("/dashboard"),
        })),
        ...ordensUrgentes.map(({ ordem, atrasada }) => ({
            id: `ordem-${ordem.id}`,
            title: ordem.corNome,
            subtitle: `${ordem.pedidoProjeto} — ${ordem.tecnicoNome}`,
            tone: atrasada ? ("danger" as const) : ("warn" as const),
            tagLabel: atrasada ? t("pedidos.dashboard.tagLate") : t("pedidos.dashboard.tagDueToday"),
            onSelect: () => navigate("/ordens-pintura"),
        })),
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src={theme === "dark" ? logoLight : logoDark} alt="SynapseForge" className="sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
            </div>

            <nav className="sidebar-nav" aria-label={t("sidebar.navAria")}>
                {NAV_GROUPS.map((group) => {
                    const headingId = `sidebar-area-${group.id}`;
                    const grupoAtivo = group.items.some((item) => item.path === location.pathname);
                    return (
                        <section
                            key={group.id}
                            className={cn("sidebar-nav-group", grupoAtivo && "is-current")}
                            aria-labelledby={headingId}
                        >
                            <h2 className="sidebar-nav-group-label" id={headingId}>{t(group.labelKey)}</h2>
                            <ul className="sidebar-nav-list">
                                {group.items.map((item) => {
                                    const active = location.pathname === item.path;
                                    return (
                                        <li key={item.path}>
                                            <button
                                                type="button"
                                                className={cn("sidebar-nav-item", active && "active")}
                                                aria-current={active ? "page" : undefined}
                                                onClick={() => navigate(item.path)}
                                            >
                                                <span className="sidebar-nav-icon">{item.icon}</span>
                                                <span className="sidebar-nav-label">{t(item.labelKey)}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })}
            </nav>

            <div className="sidebar-controls">
                <IconButton
                    variant="sidebar"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? t("sidebar.themeToLightAria") : t("sidebar.themeToDarkAria")}
                    title={theme === "dark" ? t("sidebar.themeToLight") : t("sidebar.themeToDark")}
                >
                    {theme === "dark" ? <Sun03Icon size={18} /> : <Moon02Icon size={18} />}
                </IconButton>

                <div className="sidebar-lang-wrap" ref={langMenuRef}>
                    <IconButton
                        variant="sidebar"
                        className={cn(langMenuAberto && "is-open")}
                        onClick={() => setLangMenuAberto((o) => !o)}
                        aria-label={t("sidebar.languageAria")}
                        title={t("sidebar.languageAria")}
                        aria-haspopup="menu"
                        aria-expanded={langMenuAberto}
                    >
                        <Globe02Icon size={18} />
                    </IconButton>

                    {langMenuAberto && (
                        <div className="sidebar-lang-menu" role="menu">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={i18n.language === lang.code}
                                    className={cn("sidebar-lang-option", i18n.language === lang.code && "selected")}
                                    onClick={() => { i18n.changeLanguage(lang.code); setLangMenuAberto(false); }}
                                >
                                    {t(lang.labelKey)}
                                    {i18n.language === lang.code && <Tick02Icon size={15} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <NotificationBell
                    variant="sidebar"
                    direction="up"
                    ariaLabel={t("pedidos.dashboard.notificationsAria")}
                    panelTitle={t("pedidos.dashboard.notifTitle")}
                    emptyText={t("pedidos.dashboard.notifEmpty")}
                    items={notificacoes}
                />
            </div>

            <div className="sidebar-account">
                <div className={cn("sidebar-avatar", avatarPalette(email || nome))}>{getInitial()}</div>
                <div className="sidebar-user-info">
                    <span className="sidebar-user-name">{nome || t("sidebar.userFallback")}</span>
                    {email && <span className="sidebar-user-email">{email}</span>}
                </div>
                <IconButton
                    variant="sidebar"
                    className="sidebar-account-logout"
                    onClick={handleLogout}
                    aria-label={t("sidebar.logout")}
                    title={t("sidebar.logout")}
                >
                    <Logout03Icon size={18} />
                </IconButton>
            </div>
        </aside>
    );
}

export default Sidebar;
