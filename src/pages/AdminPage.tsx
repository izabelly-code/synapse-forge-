import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { InboxIcon } from "hugeicons-react";
import { useTranslation } from "react-i18next";

import AdminPedidoModal from "../components/admin/AdminPedidoModal";
import AdminUsuarioModal from "../components/admin/AdminUsuarioModal";
import { ehPapel } from "../components/admin/papeis";
import SearchField from "../components/ui/SearchField";
import SkeletonSwap from "../components/ui/SkeletonSwap";
import { useRecarregarAoVoltar } from "../hooks/useRecarregarAoVoltar";
import {
    deletarAdminPedido,
    deletarAdminUser,
    getAdminPedidos,
    getAdminUsers,
    type AdminPedido,
    type AdminUser,
} from "../services/adminService";
import { cn } from "../utils/cn";
import { formatCurrency, formatDate } from "../utils/format";

type AbaAdmin = "usuarios" | "pedidos";

/** Filtra pelos campos indicados, ignorando maiúsculas/minúsculas e campos vazios. */
function filtrar<T>(itens: T[], busca: string, campos: (item: T) => unknown[]): T[] {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((item) => campos(item).some((valor) => valor != null && String(valor).toLowerCase().includes(termo)));
}

function substituir<T extends { id: string }>(lista: T[], item: T): T[] {
    return lista.map((atual) => (atual.id === item.id ? item : atual));
}

function AdminPage() {
    const { t } = useTranslation();

    const [aba, setAba] = useState<AbaAdmin>("usuarios");
    const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
    const [pedidos, setPedidos] = useState<AdminPedido[]>([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [excluindoId, setExcluindoId] = useState<string | null>(null);
    const [usuarioEditando, setUsuarioEditando] = useState<AdminUser | null>(null);
    const [pedidoEditando, setPedidoEditando] = useState<AdminPedido | null>(null);

    // Só a parte assíncrona: nenhum setState antes do primeiro await, para poder
    // ser chamada direto do effect de montagem (`carregando` já nasce true).
    async function buscarDados() {
        try {
            const [usuariosData, pedidosData] = await Promise.all([getAdminUsers(), getAdminPedidos()]);
            setUsuarios(usuariosData);
            setPedidos(pedidosData);
            setErro(null);
        } catch (error) {
            console.error("Erro ao carregar dados administrativos:", error);
            setErro(t("admin.errors.load"));
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        // Declarada aqui dentro para que o `await` fique visível ao analisador.
        async function carregarNaMontagem() {
            await buscarDados();
        }
        void carregarNaMontagem();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Recarga silenciosa ao voltar para a aba; pausada com um modal aberto.
    useRecarregarAoVoltar(() => void buscarDados(), !usuarioEditando && !pedidoEditando);

    const usuariosFiltrados = useMemo(
        () => filtrar(usuarios, busca, (u) => [u.nome, u.email, u.role, u.cpf, u.telefone, u.equipeId, u.funcaoVisual]),
        [usuarios, busca],
    );
    const pedidosFiltrados = useMemo(
        () => filtrar(pedidos, busca, (p) => [p.id, p.cliente, p.projeto, p.status, p.materialId]),
        [pedidos, busca],
    );
    const clientes = useMemo(() => usuarios.filter((u) => u.role === "CLIENTE"), [usuarios]);

    function trocarAba(nova: AbaAdmin) {
        setAba(nova);
        setBusca("");
    }

    async function excluir(id: string, confirmacao: string, mensagemErro: string, apagar: (id: string) => Promise<void>, remover: () => void) {
        if (!window.confirm(confirmacao)) return;
        setExcluindoId(id);
        setErro(null);
        try {
            await apagar(id);
            remover();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            setErro(mensagemErro);
        } finally {
            setExcluindoId(null);
        }
    }

    function excluirUsuario(usuario: AdminUser) {
        void excluir(usuario.id, t("admin.users.deleteConfirm"), t("admin.errors.deleteUser"), deletarAdminUser, () =>
            setUsuarios((atuais) => atuais.filter((item) => item.id !== usuario.id)),
        );
    }

    function excluirPedido(pedido: AdminPedido) {
        void excluir(pedido.id, t("admin.orders.deleteConfirm"), t("admin.errors.deleteOrder"), deletarAdminPedido, () =>
            setPedidos((atuais) => atuais.filter((item) => item.id !== pedido.id)),
        );
    }

    function acoes(id: string, onEditar: () => void, onExcluir: () => void) {
        return (
            <div className="material-row-actions">
                <button type="button" className="btn-acao-pequeno" onClick={onEditar} disabled={excluindoId !== null}>
                    {t("admin.actions.edit")}
                </button>
                <button type="button" className="btn-acao-pequeno btn-acao-perigo" onClick={onExcluir} disabled={excluindoId !== null}>
                    {excluindoId === id ? t("admin.actions.deleting") : t("admin.actions.delete")}
                </button>
            </div>
        );
    }

    return (
        <main className="dashboard-main">
            <header className="materiais-toolbar">
                <div>
                    <h1 className="dashboard-title">{t("admin.title")}</h1>
                    <p className="dashboard-subtitle">{t("admin.subtitle")}</p>
                </div>
            </header>

            <section className="filtros-bar admin-filtros">
                <div className="filtros-tabs">
                    {(
                        [
                            ["usuarios", t("admin.tabs.users"), usuarios.length],
                            ["pedidos", t("admin.tabs.orders"), pedidos.length],
                        ] as const
                    ).map(([id, rotulo, total]) => (
                        <button key={id} type="button" className={cn("filtro-btn", aba === id && "filtro-ativo")} onClick={() => trocarAba(id)}>
                            {rotulo}
                            <span className="filtro-count">{total}</span>
                        </button>
                    ))}
                </div>

                <SearchField
                    variant="pill"
                    value={busca}
                    onChange={setBusca}
                    placeholder={aba === "usuarios" ? t("admin.search.usersPlaceholder") : t("admin.search.ordersPlaceholder")}
                    ariaLabel={t("admin.search.aria")}
                />
            </section>

            {erro && <div className="dashboard-error">{erro}</div>}

            <SkeletonSwap
                ready={!carregando}
                label={t("admin.title")}
                skeleton={
                    <div className="pedidos-list">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="pedido-row-skeleton" />
                        ))}
                    </div>
                }
            >
                {carregando ? null : aba === "usuarios" ? (
                    <ListaAdmin
                        tipo="usuarios"
                        cabecalho={[t("admin.users.name"), t("admin.users.role"), t("admin.users.team"), t("admin.users.status")]}
                        vazio={t("admin.empty.users")}
                    >
                        {usuariosFiltrados.map((usuario, index) => (
                            <LinhaAdmin key={usuario.id} tipo="usuarios" index={index}>
                                <div className="admin-cell-titulo">
                                    <strong title={usuario.nome}>{usuario.nome}</strong>
                                    <small title={usuario.email}>{usuario.email}</small>
                                </div>
                                <Celula rotulo={t("admin.users.role")}>
                                    {ehPapel(usuario.role) ? t(`equipe.roles.${usuario.role}`) : "—"}
                                </Celula>
                                <Celula rotulo={t("admin.users.team")} titulo={usuario.equipeId}>
                                    {usuario.equipeId || t("admin.users.noTeam")}
                                </Celula>
                                <Celula rotulo={t("admin.users.status")}>
                                    <span className={cn("admin-status", !usuario.ativo && "is-inativo")}>
                                        {usuario.ativo ? t("admin.status.active") : t("admin.status.inactive")}
                                    </span>
                                </Celula>
                                {acoes(usuario.id, () => setUsuarioEditando(usuario), () => excluirUsuario(usuario))}
                            </LinhaAdmin>
                        ))}
                    </ListaAdmin>
                ) : (
                    <ListaAdmin
                        tipo="pedidos"
                        cabecalho={[
                            t("admin.orders.project"),
                            t("admin.orders.client"),
                            t("admin.orders.status"),
                            t("admin.orders.deadline"),
                            t("admin.orders.price"),
                        ]}
                        vazio={t("admin.empty.orders")}
                    >
                        {pedidosFiltrados.map((pedido, index) => (
                            <LinhaAdmin key={pedido.id} tipo="pedidos" index={index}>
                                <div className="admin-cell-titulo">
                                    <strong title={pedido.projeto}>{pedido.projeto}</strong>
                                    {/* o id inteiro (24 caracteres) só no title; a busca continua achando por ele */}
                                    <small title={pedido.id}>#{pedido.id.slice(-6)}</small>
                                </div>
                                <Celula rotulo={t("admin.orders.client")} titulo={pedido.cliente}>{pedido.cliente}</Celula>
                                <Celula rotulo={t("admin.orders.status")}>
                                    {pedido.status ? t(`pedidos.status.${pedido.status}`) : "—"}
                                </Celula>
                                {/* prazo é LocalDate: meia-noite local, senão o fuso volta um dia */}
                                <Celula rotulo={t("admin.orders.deadline")}>
                                    {pedido.prazo ? formatDate(`${String(pedido.prazo).slice(0, 10)}T00:00:00`) : "—"}
                                </Celula>
                                <Celula rotulo={t("admin.orders.price")}>
                                    {pedido.precoFinal != null ? formatCurrency(pedido.precoFinal) : "—"}
                                </Celula>
                                {acoes(pedido.id, () => setPedidoEditando(pedido), () => excluirPedido(pedido))}
                            </LinhaAdmin>
                        ))}
                    </ListaAdmin>
                )}
            </SkeletonSwap>

            {usuarioEditando && (
                <AdminUsuarioModal
                    usuario={usuarioEditando}
                    onClose={() => setUsuarioEditando(null)}
                    onSalvo={(salvo) => {
                        setUsuarios((atuais) => substituir(atuais, salvo));
                        setUsuarioEditando(null);
                    }}
                />
            )}

            {pedidoEditando && (
                <AdminPedidoModal
                    pedido={pedidoEditando}
                    clientes={clientes}
                    onClose={() => setPedidoEditando(null)}
                    onSalvo={(salvo) => {
                        setPedidos((atuais) => substituir(atuais, salvo));
                        setPedidoEditando(null);
                    }}
                />
            )}
        </main>
    );
}

type TipoLista = "usuarios" | "pedidos";

function ListaAdmin({ tipo, cabecalho, vazio, children }: { tipo: TipoLista; cabecalho: string[]; vazio: string; children: ReactNode[] }) {
    if (children.length === 0) {
        return (
            <div className="pedidos-empty">
                <span className="pedidos-empty-icon"><InboxIcon size={28} /></span>
                <p className="empty-title">{vazio}</p>
            </div>
        );
    }

    return (
        <section className="pedidos-list">
            <div className={cn("pedidos-row-head admin-row", `admin-row--${tipo}`)} aria-hidden="true">
                {cabecalho.map((rotulo, i) => (
                    <span key={i}>{rotulo}</span>
                ))}
                <span />
            </div>
            {children}
        </section>
    );
}

function LinhaAdmin({ tipo, index, children }: { tipo: TipoLista; index: number; children: ReactNode }) {
    return (
        <div className={cn("pedido-row admin-row", `admin-row--${tipo}`)} style={{ "--row-index": index } as CSSProperties}>
            {children}
        </div>
    );
}

/** Célula de valor; o rótulo só aparece quando a linha empilha (lista estreita). */
function Celula({ rotulo, titulo, children }: { rotulo: string; titulo?: string; children: ReactNode }) {
    return (
        <div className="admin-cell" title={titulo}>
            <span className="cell-label">{rotulo}</span>
            <span className="admin-cell-valor">{children}</span>
        </div>
    );
}

export default AdminPage;
