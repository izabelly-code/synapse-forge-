import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import AdminPedidoModal from "../components/admin/AdminPedidoModal";
import AdminUsuarioModal from "../components/admin/AdminUsuarioModal";
import { ehPapel } from "../components/admin/papeis";
import SearchField from "../components/ui/SearchField";
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
                <button type="button" className="btn-acao-pequeno" onClick={onExcluir} disabled={excluindoId !== null}>
                    {excluindoId === id ? t("admin.actions.deleting") : t("admin.actions.delete")}
                </button>
            </div>
        );
    }

    return (
        <main className="dashboard-main">
            <section className="dashboard-title-block">
                <div className="dashboard-title-row">
                    <div>
                        <span className="pedido-detalhe-kicker">{t("admin.kicker")}</span>
                        <h1 className="dashboard-title">{t("admin.title")}</h1>
                        <p className="dashboard-subtitle">{t("admin.subtitle")}</p>
                    </div>
                </div>
            </section>

            <section className="filtros-bar">
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

                <div className="filtros-actions">
                    <SearchField
                        variant="boxed"
                        value={busca}
                        onChange={setBusca}
                        placeholder={aba === "usuarios" ? t("admin.search.usersPlaceholder") : t("admin.search.ordersPlaceholder")}
                        ariaLabel={t("admin.search.aria")}
                    />
                </div>
            </section>

            {erro && <div className="error-text">{erro}</div>}

            {carregando ? (
                <div className="pintura-loading">{t("admin.loading")}</div>
            ) : aba === "usuarios" ? (
                <ListaAdmin
                    cabecalho={[t("admin.users.name"), t("admin.users.role"), t("admin.users.team"), t("admin.users.status"), t("admin.actions.edit")]}
                    vazio={t("admin.empty.users")}
                >
                    {usuariosFiltrados.map((usuario, index) => (
                        <LinhaAdmin key={usuario.id} index={index}>
                            <div>
                                <strong>{usuario.nome}</strong>
                                <small>{usuario.email}</small>
                            </div>
                            <span>{ehPapel(usuario.role) ? t(`equipe.roles.${usuario.role}`) : "—"}</span>
                            <span>{usuario.equipeId || t("admin.users.noTeam")}</span>
                            <span>{usuario.ativo ? t("admin.status.active") : t("admin.status.inactive")}</span>
                            {acoes(usuario.id, () => setUsuarioEditando(usuario), () => excluirUsuario(usuario))}
                        </LinhaAdmin>
                    ))}
                </ListaAdmin>
            ) : (
                <ListaAdmin
                    cabecalho={[
                        t("admin.orders.project"),
                        t("admin.orders.client"),
                        t("admin.orders.status"),
                        t("admin.orders.deadline"),
                        t("admin.orders.price"),
                        t("admin.actions.edit"),
                    ]}
                    vazio={t("admin.empty.orders")}
                >
                    {pedidosFiltrados.map((pedido, index) => (
                        <LinhaAdmin key={pedido.id} index={index}>
                            <div>
                                <strong>{pedido.projeto}</strong>
                                <small>{pedido.id}</small>
                            </div>
                            <span>{pedido.cliente}</span>
                            <span>{pedido.status ? t(`pedidos.status.${pedido.status}`) : "—"}</span>
                            {/* prazo é LocalDate: meia-noite local, senão o fuso volta um dia */}
                            <span>{pedido.prazo ? formatDate(`${String(pedido.prazo).slice(0, 10)}T00:00:00`) : "—"}</span>
                            <span>{pedido.precoFinal != null ? formatCurrency(pedido.precoFinal) : "—"}</span>
                            {acoes(pedido.id, () => setPedidoEditando(pedido), () => excluirPedido(pedido))}
                        </LinhaAdmin>
                    ))}
                </ListaAdmin>
            )}

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

function ListaAdmin({ cabecalho, vazio, children }: { cabecalho: string[]; vazio: string; children: ReactNode[] }) {
    return (
        <section className="pedidos-list">
            <div className="pedidos-row-head material-row">
                {cabecalho.map((rotulo, i) => (
                    <span key={i}>{rotulo}</span>
                ))}
            </div>
            {children.length === 0 ? (
                <div className="empty-state">
                    <h2 className="empty-title">{vazio}</h2>
                </div>
            ) : (
                children
            )}
        </section>
    );
}

function LinhaAdmin({ index, children }: { index: number; children: ReactNode }) {
    return (
        <div className="pedido-row material-row" style={{ "--row-index": index } as CSSProperties}>
            {children}
        </div>
    );
}

export default AdminPage;
