import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar03Icon, Cancel01Icon, ClipboardIcon, DollarCircleIcon, DropletIcon, Globe02Icon, Logout03Icon, Moon02Icon, PackageIcon, ShoppingBag01Icon, SlidersHorizontalIcon, Sun03Icon, Tick02Icon, UserIcon, WarehouseIcon, UserGroupIcon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { getMyUser } from "../../services/UserService";
import { getUserRole } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import logoDark from "../../assets/Images/black-logo.png";
import logoLight from "../../assets/Images/white-logo.png";
import { cn } from "../../utils/cn";
import { avatarPalette } from "../../utils/avatarPalette";
import { useDismissable } from "../../hooks/useDismissable";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useNotificacoesUrgentes } from "../../hooks/useNotificacoesUrgentes";
import { useNotificacoes } from "../../hooks/useNotificacoes";
import { useAlertasDispensados } from "../../hooks/useAlertasDispensados";
import IconButton from "../ui/IconButton";
import NotificationBell, { NotificationItem } from "../ui/NotificationBell";
import ConviteEquipeCard from "../equipe/ConviteEquipeCard";
import { useMeuConvite } from "../../hooks/useMeuConvite";
import MenuSurface from "../ui/MenuSurface";
import { formatDate } from "../../utils/format";

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
 * Taxonomia das áreas do mapa SYN-53 (docs/syn-53-mapa-menu.md).
 * Agrupamento é só visual: todos os itens ficam sempre visíveis, sem expandir/colapsar.
 */
const NAV_GROUPS: NavGroup[] = [
    {
        id: "pedidos",
        labelKey: "sidebar.areaPedidos",
        items: [
            {
                labelKey: "sidebar.pedidosClientes",
                path: "/dashboard",
                icon: <ShoppingBag01Icon size={18} />,
            },
            {
                labelKey: "sidebar.ordensPintura",
                path: "/ordens-pintura",
                icon: <ClipboardIcon size={18} />,
            },
        ],
    },
    {
        id: "orcamentos",
        labelKey: "sidebar.areaOrcamentos",
        items: [
            {
                labelKey: "sidebar.orcamento",
                path: "/orcamento",
                icon: <DollarCircleIcon size={18} />,
            },
        ],
    },
    {
        id: "estoque",
        labelKey: "sidebar.areaEstoqueCores",
        items: [
            { labelKey: "sidebar.paletaCores", path: "/paleta-cores", icon: <DropletIcon size={18} /> },
            { labelKey: "sidebar.calculadoraMistura", path: "/calculadora-mistura", icon: <SlidersHorizontalIcon size={18} /> },
            { labelKey: "sidebar.materiais", path: "/materiais", icon: <WarehouseIcon size={18} /> },
            { labelKey: "sidebar.estoque", path: "/estoque", icon: <PackageIcon size={18} /> },
        ],
    },
    {
        id: "equipe",
        labelKey: "sidebar.areaEquipe",
        items: [
            { labelKey: "sidebar.equipe", path: "/equipe", icon: <UserGroupIcon size={18} /> },
        ],
    },
    {
        id: "agenda",
        labelKey: "sidebar.areaAgenda",
        items: [
            {
                labelKey: "sidebar.calendario",
                path: "/calendar",
                icon: <Calendar03Icon size={18} />,
            },
        ],
    },
    {
        id: "admin",
        labelKey: "sidebar.areaAdmin",
        items: [
            {
                labelKey: "sidebar.perfil",
                path: "/perfil",
                icon: <UserIcon size={18} />,
            },
            {
                labelKey: "sidebar.areaAdmin",
                path: "/admin",
                icon: <SlidersHorizontalIcon size={18} />,
            },
        ],
    },
];

const LANGUAGES = [
    {
        code: "pt-BR",
        labelKey: "sidebar.langPortuguese",
    },
    {
        code: "en-US",
        labelKey: "sidebar.langEnglish",
    },
];

/**
 * Controle de visibilidade dos itens do menu.
 *
 * CLIENTE:
 * - dashboard
 * - perfil
 *
 * ADMIN:
 * - todos os itens normais
 * - administração
 *
 * GERENTE/TECNICO:
 * - todos os itens normais
 * - nunca /admin
 */
function podeVerItem(
    path: string,
    role: string | null
): boolean {
    if (role === "CLIENTE") {
        return (
            path === "/dashboard" ||
            path === "/perfil"
        );
    }

    if (path === "/admin") {
        return role === "ADMIN";
    }

    // Orçamento é só do GERENTE (App.tsx e @PreAuthorize do OrcamentoController):
    // mostrar ao ADMIN levava a uma tela de acesso negado.
    if (path === "/orcamento") {
        return role === "GERENTE";
    }

    return true;
}

interface SidebarProps {
    /** Referenciado pelo `aria-controls` do hambourguer do MobileHeader. */
    id: string;
    /** Abaixo do colapso do shell (1024px) a sidebar é uma gaveta sobreposta. */
    compacto: boolean;
    drawerAberto: boolean;
    onFecharDrawer: () => void;
}

function Sidebar({ id, compacto, drawerAberto, onFecharDrawer }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();

    const role = getUserRole();
    const isCliente = role === "CLIENTE";

    const [nome, setNome] = useState(() => localStorage.getItem("userNome") ?? "");
    const [email, setEmail] = useState(() => localStorage.getItem("userEmail") ?? "");
    const [langMenuAberto, setLangMenuAberto] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const asideRef = useRef<HTMLElement>(null);

    // Enquanto a gaveta está aberta ela é um diálogo: o Tab não deve passear pelo
    // conteúdo atrás do scrim. Fora do modo compacto a sidebar é navegação normal.
    useFocusTrap(asideRef, compacto && drawerAberto);

    useDismissable({
        enabled: langMenuAberto,
        refs: langMenuRef,
        onDismiss: () =>
            setLangMenuAberto(false),
    });

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) return;

        getMyUser(token).then((user) => {
            if (user) {
                const nextNome = user.nome ?? "";
                const nextEmail = user.email ?? "";

                setNome(nextNome);
                setEmail(nextEmail);

                localStorage.setItem(
                    "userNome",
                    nextNome
                );

                localStorage.setItem(
                    "userEmail",
                    nextEmail
                );
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
        return nome
            ? nome.charAt(0).toUpperCase()
            : "?";
    }

    const {
        pedidosUrgentes,
        ordensUrgentes
    } = useNotificacoesUrgentes();

    // SYN-101: o convite de equipe pendente entra no sino e abre o card da equipe.
    const { convite: meuConvite, descartar: descartarConvite } = useMeuConvite();
    const [conviteAberto, setConviteAberto] = useState(false);

    // Avisos persistidos (pedido finalizado para o cliente, ordem de pintura para o
    // técnico). Somem ao clicar ou no X, que só os marca como lidos.
    const { notificacoes: avisos, marcarComoLida } = useNotificacoes();

    // Alertas de prazo também têm X; como são calculados (não estão no banco),
    // o que foi dispensado fica guardado neste navegador.
    const { dispensar: dispensarAlerta, foiDispensado } = useAlertasDispensados();

    /** Identifica o alerta pelo registro + prazo + situação (mudou algum, volta a aparecer). */
    function chaveAlerta(tipo: "pedido" | "ordem", id: string, prazo: string, atrasado: boolean) {
        return `${tipo}:${id}:${prazo.slice(0, 10)}:${atrasado ? "atrasado" : "hoje"}`;
    }

    /** Quando o aviso foi criado: "30/09, 14:20". */
    function dataDoAviso(criadaEm: string) {
        return formatDate(criadaEm, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    }

    /** Prazo de pedido/ordem: "Prazo: 23/06". Meio-dia local evita o dia anterior
     *  no fuso -03:00 (uma data pura vira meia-noite UTC). */
    function dataDoPrazo(prazo: string) {
        const data = formatDate(`${prazo.slice(0, 10)}T12:00:00`, { day: "2-digit", month: "2-digit" });
        return t("pedidos.dashboard.notifDue", { data });
    }

    const notificacoes: NotificationItem[] = [
        ...(meuConvite
            ? [{
                id: `convite-${meuConvite.convite.id}`,
                title: meuConvite.equipe?.nome ?? meuConvite.convite.equipeNome ?? "",
                subtitle: t("equipe.inviteCard.notifSubtitle", {
                    gerente: meuConvite.convite.gerenteNome ?? t("equipe.inviteCard.someone"),
                }),
                tone: "info" as const,
                tagLabel: t("equipe.inviteCard.tag"),
                onSelect: () => setConviteAberto(true),
            }]
            : []),
        ...avisos.map((aviso): NotificationItem => {
            const base = {
                id: `aviso-${aviso.id}`,
                title: aviso.titulo ?? "",
                date: dataDoAviso(aviso.criadaEm),
                onDismiss: () => marcarComoLida(aviso.id),
            };

            // Técnico: ordem de pintura nova (ou passada para ele) -> abre o quadro
            if (aviso.tipo === "ORDEM_PINTURA_ATRIBUIDA") {
                return {
                    ...base,
                    subtitle: t("pintura.notifAssignedSubtitle"),
                    tone: "info",
                    tagLabel: t("pintura.notifAssignedTag"),
                    onSelect: () => {
                        marcarComoLida(aviso.id);
                        navigate("/ordens-pintura");
                    },
                };
            }

            const abrirPedido = () => {
                marcarComoLida(aviso.id);
                navigate(aviso.referenciaId
                    ? `/dashboard?pedido=${encodeURIComponent(aviso.referenciaId)}`
                    : "/dashboard");
            };

            // Cliente: pedido mudou de etapa -> "Seu pedido está em Pintura".
            // FINALIZADO é só mais uma etapa, com texto e cor de "pronto".
            if (aviso.tipo === "PEDIDO_ETAPA_ALTERADA" && aviso.detalhe !== "FINALIZADO") {
                const etapa = aviso.detalhe ? t(`pedidos.status.${aviso.detalhe}`) : "";
                return {
                    ...base,
                    subtitle: t("pedidos.dashboard.notifStageSubtitle", { etapa }),
                    tone: "info",
                    tagLabel: etapa,
                    onSelect: abrirPedido,
                };
            }

            // Cliente: pedido finalizado (etapa FINALIZADO, ou aviso antigo
            // do tipo PEDIDO_FINALIZADO que ainda esteja no banco)
            return {
                ...base,
                subtitle: t("pedidos.dashboard.notifFinishedSubtitle"),
                tone: "success",
                tagLabel: t("pedidos.dashboard.tagFinished"),
                onSelect: abrirPedido,
            };
        }),
        ...pedidosUrgentes
            .filter(({ pedido, atrasado }) => !foiDispensado(chaveAlerta("pedido", pedido.id, pedido.prazo, atrasado)))
            .map(
            ({ pedido, atrasado }) => ({
                id: `pedido-${pedido.id}`,
                title: pedido.projeto,
                subtitle: pedido.cliente,
                date: dataDoPrazo(pedido.prazo),
                tone: atrasado
                    ? ("danger" as const)
                    : ("warn" as const),
                tagLabel: atrasado
                    ? t(
                        "pedidos.dashboard.tagLate"
                    )
                    : t(
                        "pedidos.dashboard.tagDueToday"
                    ),
                onSelect: () =>
                    navigate("/dashboard"),
                onDismiss: () =>
                    dispensarAlerta(chaveAlerta("pedido", pedido.id, pedido.prazo, atrasado)),
            })
        ),

        ...ordensUrgentes
            .filter(({ ordem, atrasada }) => !foiDispensado(chaveAlerta("ordem", ordem.id, ordem.prazo, atrasada)))
            .map(
            ({ ordem, atrasada }) => ({
                id: `ordem-${ordem.id}`,
                title: ordem.corNome,
                subtitle:
                    `${ordem.pedidoProjeto} — ${ordem.tecnicoNome}`,
                date: dataDoPrazo(ordem.prazo),
                tone: atrasada
                    ? ("danger" as const)
                    : ("warn" as const),
                tagLabel: atrasada
                    ? t(
                        "pedidos.dashboard.tagLate"
                    )
                    : t(
                        "pedidos.dashboard.tagDueToday"
                    ),
                onSelect: () =>
                    navigate(
                        "/ordens-pintura"
                    ),
                onDismiss: () =>
                    dispensarAlerta(chaveAlerta("ordem", ordem.id, ordem.prazo, atrasada)),
            })
        ),
    ];

    return (
        <aside
            id={id}
            ref={asideRef}
            className={cn("sidebar", drawerAberto && "is-drawer-open")}
            role={compacto && drawerAberto ? "dialog" : undefined}
            aria-modal={compacto && drawerAberto ? true : undefined}
            aria-label={compacto && drawerAberto ? t("sidebar.navAria") : undefined}
            // Gaveta fechada sai da ordem de tabulação e da árvore de acessibilidade:
            // ela continua montada (a transição de `transform` depende disso).
            inert={compacto && !drawerAberto}
        >
            <div className="sidebar-brand">
                <img src={theme === "dark" ? logoLight : logoDark} alt="SynapseForge" className="sidebar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
                {compacto && (
                    <IconButton
                        variant="sidebar"
                        className="sidebar-drawer-close"
                        onClick={onFecharDrawer}
                        aria-label={t("sidebar.closeMenu")}
                        title={t("sidebar.closeMenu")}
                    >
                        <Cancel01Icon size={18} />
                    </IconButton>
                )}
            </div>

            <nav
                className="sidebar-nav"
                aria-label={t(
                    "sidebar.navAria"
                )}
            >
                {NAV_GROUPS
                    .map((group) => ({
                        ...group,
                        items:
                            group.items.filter(
                                (item) =>
                                    podeVerItem(
                                        item.path,
                                        role
                                    )
                            ),
                    }))
                    .filter(
                        (group) =>
                            group.items.length > 0
                    )
                    .map((group) => {
                        const headingId =
                            `sidebar-area-${group.id}`;

                        const grupoAtivo =
                            group.items.some(
                                (item) =>
                                    item.path ===
                                    location.pathname
                            );

                        /*
                         * CLIENTE:
                         * - A área de pedidos continua sendo "Pedidos"
                         * - O item /dashboard passa a ser "Meus pedidos"
                         * - A área do perfil passa a ser "Minha conta"
                         *
                         * Demais perfis continuam utilizando exatamente
                         * os textos originais.
                         */
                        const groupLabelKey =
                            isCliente &&
                            group.id === "admin"
                                ? "sidebar.areaClienteConta"
                                : group.labelKey;

                        return (
                            <section
                                key={group.id}
                                className={cn(
                                    "sidebar-nav-group",
                                    grupoAtivo &&
                                        "is-current"
                                )}
                                aria-labelledby={
                                    headingId
                                }
                            >
                                <h2
                                    className="sidebar-nav-group-label"
                                    id={headingId}
                                >
                                    {t(
                                        groupLabelKey
                                    )}
                                </h2>

                                <ul className="sidebar-nav-list">
                                    {group.items.map(
                                        (item) => {
                                            const active =
                                                location.pathname ===
                                                item.path;

                                            const itemLabelKey =
                                                isCliente &&
                                                item.path ===
                                                    "/dashboard"
                                                    ? "sidebar.pedidosCliente"
                                                    : item.labelKey;

                                            return (
                                                <li
                                                    key={
                                                        item.path
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "sidebar-nav-item",
                                                            active &&
                                                                "active"
                                                        )}
                                                        aria-current={
                                                            active
                                                                ? "page"
                                                                : undefined
                                                        }
                                                        onClick={() =>
                                                            navigate(
                                                                item.path
                                                            )
                                                        }
                                                    >
                                                        <span className="sidebar-nav-icon">
                                                            {
                                                                item.icon
                                                            }
                                                        </span>

                                                        <span className="sidebar-nav-label">
                                                            {t(
                                                                itemLabelKey
                                                            )}
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        }
                                    )}
                                </ul>
                            </section>
                        );
                    })}
            </nav>

            <div className="sidebar-controls">
                <IconButton
                    variant="sidebar"
                    onClick={toggleTheme}
                    aria-label={
                        theme === "dark"
                            ? t(
                                "sidebar.themeToLightAria"
                            )
                            : t(
                                "sidebar.themeToDarkAria"
                            )
                    }
                    title={
                        theme === "dark"
                            ? t(
                                "sidebar.themeToLight"
                            )
                            : t(
                                "sidebar.themeToDark"
                            )
                    }
                >
                    {theme === "dark" ? (
                        <Sun03Icon size={18} />
                    ) : (
                        <Moon02Icon size={18} />
                    )}
                </IconButton>

                <div
                    className="sidebar-lang-wrap"
                    ref={langMenuRef}
                >
                    <IconButton
                        variant="sidebar"
                        className={cn(
                            langMenuAberto &&
                                "is-open"
                        )}
                        onClick={() =>
                            setLangMenuAberto(
                                (o) => !o
                            )
                        }
                        aria-label={t(
                            "sidebar.languageAria"
                        )}
                        title={t(
                            "sidebar.languageAria"
                        )}
                        aria-haspopup="menu"
                        aria-expanded={
                            langMenuAberto
                        }
                    >
                        <Globe02Icon size={18} />
                    </IconButton>

                    {langMenuAberto && (
                        <MenuSurface
                            className="sidebar-lang-menu"
                            role="menu"
                        >
                            {LANGUAGES.map(
                                (lang) => (
                                    <button
                                        key={
                                            lang.code
                                        }
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={
                                            i18n.language ===
                                            lang.code
                                        }
                                        className={cn(
                                            "sidebar-lang-option",
                                            i18n.language ===
                                                lang.code &&
                                                "selected"
                                        )}
                                        onClick={() => {
                                            i18n.changeLanguage(
                                                lang.code
                                            );

                                            setLangMenuAberto(
                                                false
                                            );
                                        }}
                                    >
                                        {t(
                                            lang.labelKey
                                        )}

                                        {i18n.language ===
                                            lang.code && (
                                            <Tick02Icon
                                                size={
                                                    15
                                                }
                                            />
                                        )}
                                    </button>
                                )
                            )}
                        </MenuSurface>
                    )}
                </div>

                <NotificationBell
                    variant="sidebar"
                    direction="up"
                    ariaLabel={t(
                        "pedidos.dashboard.notificationsAria"
                    )}
                    panelTitle={t(
                        "pedidos.dashboard.notifTitle"
                    )}
                    emptyText={t(
                        "pedidos.dashboard.notifEmpty"
                    )}
                    items={notificacoes}
                    dismissLabel={(titulo) => t("pedidos.dashboard.notifDismissAria", { title: titulo })}
                />

                {meuConvite && conviteAberto && (
                    <ConviteEquipeCard
                        convite={meuConvite}
                        onClose={() => setConviteAberto(false)}
                        onRecusado={() => {
                            setConviteAberto(false);
                            descartarConvite();
                        }}
                    />
                )}
            </div>

            <div className="sidebar-account">
                <div
                    className={cn(
                        "sidebar-avatar",
                        avatarPalette(
                            email || nome
                        )
                    )}
                >
                    {getInitial()}
                </div>

                <div className="sidebar-user-info">
                    <span className="sidebar-user-name">
                        {nome ||
                            t(
                                "sidebar.userFallback"
                            )}
                    </span>

                    {email && (
                        <span className="sidebar-user-email">
                            {email}
                        </span>
                    )}
                </div>

                <IconButton
                    variant="sidebar"
                    className="sidebar-account-logout"
                    onClick={handleLogout}
                    aria-label={t(
                        "sidebar.logout"
                    )}
                    title={t(
                        "sidebar.logout"
                    )}
                >
                    <Logout03Icon size={18} />
                </IconButton>
            </div>
        </aside>
    );
}

export default Sidebar;
