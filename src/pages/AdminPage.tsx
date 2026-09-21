
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";


import {
    AdminPedido,
    AdminPedidoUpdateData,
    AdminUser,
    AdminUserUpdateData,
    atualizarAdminPedido,
    atualizarAdminUser,
    deletarAdminUser,
    getAdminPedidos,
    getAdminUsers,
    deletarAdminPedido
} from "../services/adminService";




type AbaAdmin = "usuarios" | "pedidos";

type FormularioUsuario = {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    role: "ADMIN" | "GERENTE" | "TECNICO" | "CLIENTE";
    equipeId: string;
    funcaoVisual: string;
    ativo: boolean;
};


type FormularioPedido = {
    clienteId: string;
    cliente: string;
    projeto: string;
    descricao: string;
    materialId: string;
    volumeCm3: string;
    tempoImpressaoHoras: string;
    tempoMaoDeObraHoras: string;
    custoMaquinaHora: string;
    custoMaoDeObraHora: string;
    margemLucro: string;
    custoMaterial: string;
    custoMaquina: string;
    custoMaoDeObra: string;
    custoTotal: string;
    precoFinal: string;
    status: string;
    prazo: string;
};



function AdminPage() {
    const { t, i18n } = useTranslation();

    const [aba, setAba] = useState<AbaAdmin>("usuarios");

    const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
    const [pedidos, setPedidos] = useState<AdminPedido[]>([]);

    const [busca, setBusca] = useState("");

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [excluindoUsuario, setExcluindoUsuario] = useState(false);

    const [erro, setErro] = useState<string | null>(null);

    const [usuarioEditando, setUsuarioEditando] = useState<AdminUser | null>(null);

    const [formulario, setFormulario] = useState<FormularioUsuario | null>(null);

    const [errosUsuario, setErrosUsuario] = useState<{
        nome?: string;
        email?: string;
        role?: string;
    }>({});

    const [pedidoEditando, setPedidoEditando] =
        useState<AdminPedido | null>(null);

    const [formularioPedido, setFormularioPedido] =
        useState<FormularioPedido | null>(null);

    const [salvandoPedido, setSalvandoPedido] =
        useState(false);


    const [excluindoPedido, setExcluindoPedido] =
    useState(false);




    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            setCarregando(true);
            setErro(null);

            const [usuariosData, pedidosData] =
                await Promise.all([
                    getAdminUsers(),
                    getAdminPedidos(),
                ]);

            setUsuarios(usuariosData);
            setPedidos(pedidosData);
        } catch (error) {
            console.error(
                "Erro ao carregar dados administrativos:",
                error
            );

            setErro(t("admin.errors.load"));
        } finally {
            setCarregando(false);
        }
    }

    const usuariosFiltrados = useMemo(() => {
        const termo = busca
            .trim()
            .toLowerCase();

        if (!termo) {
            return usuarios;
        }

        return usuarios.filter((usuario) =>
            [
                usuario.nome,
                usuario.email,
                usuario.role,
                usuario.cpf,
                usuario.telefone,
                usuario.equipeId,
                usuario.funcaoVisual,
            ]
                .filter(Boolean)
                .some((valor) =>
                    String(valor)
                        .toLowerCase()
                        .includes(termo)
                )
        );
    }, [usuarios, busca]);

    const pedidosFiltrados = useMemo(() => {
        const termo = busca
            .trim()
            .toLowerCase();

        if (!termo) {
            return pedidos;
        }

        return pedidos.filter((pedido) =>
            [
                pedido.id,
                pedido.cliente,
                pedido.projeto,
                pedido.status,
                pedido.materialId,
            ]
                .filter(Boolean)
                .some((valor) =>
                    String(valor)
                        .toLowerCase()
                        .includes(termo)
                )
        );
    }, [pedidos, busca]);

    function formatarData(
        valor?: string
    ): string {
        if (!valor) {
            return "—";
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return "—";
        }

        return data.toLocaleDateString(
            i18n.language === "en-US"
                ? "en-US"
                : "pt-BR"
        );
    }

    function formatarMoeda(
        valor?: number
    ): string {
        if (
            valor === undefined ||
            valor === null
        ) {
            return "—";
        }

        return valor.toLocaleString(
            i18n.language === "en-US"
                ? "en-US"
                : "pt-BR",
            {
                style: "currency",
                currency: "BRL",
            }
        );
    }

    function abrirEdicao(usuario: AdminUser) {
        setErrosUsuario({});
        setUsuarioEditando(usuario);

        setFormulario({
            nome: usuario.nome || "",
            email: usuario.email || "",
            cpf: usuario.cpf || "",
            telefone: usuario.telefone || "",
            role:
                usuario.role === "ADMIN" ||
                usuario.role === "GERENTE" ||
                usuario.role === "TECNICO" ||
                usuario.role === "CLIENTE"
                    ? usuario.role
                    : "CLIENTE",
            equipeId: usuario.equipeId || "",
            funcaoVisual:
                usuario.funcaoVisual || "",
            ativo: usuario.ativo,
        });
    }


    function abrirEdicaoPedido(pedido: AdminPedido) {
        setPedidoEditando(pedido);

        setFormularioPedido({
            clienteId: pedido.clienteId || "",
            cliente: pedido.cliente || "",
            projeto: pedido.projeto || "",
            descricao: pedido.descricao || "",
            materialId: pedido.materialId || "",
            volumeCm3:
                pedido.volumeCm3 !== undefined
                    ? String(pedido.volumeCm3)
                    : "",
            tempoImpressaoHoras:
                pedido.tempoImpressaoHoras !== undefined
                    ? String(pedido.tempoImpressaoHoras)
                    : "",
            tempoMaoDeObraHoras:
                pedido.tempoMaoDeObraHoras !== undefined
                    ? String(pedido.tempoMaoDeObraHoras)
                    : "",
            custoMaquinaHora:
                pedido.custoMaquinaHora !== undefined
                    ? String(pedido.custoMaquinaHora)
                    : "",
            custoMaoDeObraHora:
                pedido.custoMaoDeObraHora !== undefined
                    ? String(pedido.custoMaoDeObraHora)
                    : "",
            margemLucro:
                pedido.margemLucro !== undefined
                    ? String(pedido.margemLucro)
                    : "",
            custoMaterial:
                pedido.custoMaterial !== undefined
                    ? String(pedido.custoMaterial)
                    : "",
            custoMaquina:
                pedido.custoMaquina !== undefined
                    ? String(pedido.custoMaquina)
                    : "",
            custoMaoDeObra:
                pedido.custoMaoDeObra !== undefined
                    ? String(pedido.custoMaoDeObra)
                    : "",
            custoTotal:
                pedido.custoTotal !== undefined
                    ? String(pedido.custoTotal)
                    : "",
            precoFinal:
                pedido.precoFinal !== undefined
                    ? String(pedido.precoFinal)
                    : "",
            status: pedido.status || "",
            prazo: pedido.prazo || "",
        });
    }


    function fecharEdicaoPedido() {
        if (salvandoPedido) {
            return;
        }

        setPedidoEditando(null);
        setFormularioPedido(null);
    }

    
    async function salvarPedido() {
        if (!pedidoEditando || !formularioPedido) {
            return;
        }

        try {
            setSalvandoPedido(true);
            setErro(null);

            const dados: AdminPedidoUpdateData = {
                clienteId:
                    formularioPedido.clienteId || undefined,

                cliente:
                    formularioPedido.cliente || undefined,

                projeto:
                    formularioPedido.projeto || undefined,

                descricao:
                    formularioPedido.descricao || undefined,

                materialId:
                    formularioPedido.materialId || undefined,

                volumeCm3:
                    formularioPedido.volumeCm3 !== ""
                        ? Number(formularioPedido.volumeCm3)
                        : undefined,

                tempoImpressaoHoras:
                    formularioPedido.tempoImpressaoHoras !== ""
                        ? Number(
                            formularioPedido.tempoImpressaoHoras
                        )
                        : undefined,

                tempoMaoDeObraHoras:
                    formularioPedido.tempoMaoDeObraHoras !== ""
                        ? Number(
                            formularioPedido.tempoMaoDeObraHoras
                        )
                        : undefined,

                custoMaquinaHora:
                    formularioPedido.custoMaquinaHora !== ""
                        ? Number(
                            formularioPedido.custoMaquinaHora
                        )
                        : undefined,

                custoMaoDeObraHora:
                    formularioPedido.custoMaoDeObraHora !== ""
                        ? Number(
                            formularioPedido.custoMaoDeObraHora
                        )
                        : undefined,

                margemLucro:
                    formularioPedido.margemLucro !== ""
                        ? Number(
                            formularioPedido.margemLucro
                        )
                        : undefined,

                custoMaterial:
                    formularioPedido.custoMaterial !== ""
                        ? Number(
                            formularioPedido.custoMaterial
                        )
                        : undefined,

                custoMaquina:
                    formularioPedido.custoMaquina !== ""
                        ? Number(
                            formularioPedido.custoMaquina
                        )
                        : undefined,

                custoMaoDeObra:
                    formularioPedido.custoMaoDeObra !== ""
                        ? Number(
                            formularioPedido.custoMaoDeObra
                        )
                        : undefined,

                custoTotal:
                    formularioPedido.custoTotal !== ""
                        ? Number(
                            formularioPedido.custoTotal
                        )
                        : undefined,

                precoFinal:
                    formularioPedido.precoFinal !== ""
                        ? Number(
                            formularioPedido.precoFinal
                        )
                        : undefined,

                status:
                    formularioPedido.status || undefined,

                prazo:
                    formularioPedido.prazo || undefined,
            };

            const pedidoAtualizado =
                await atualizarAdminPedido(
                    pedidoEditando.id,
                    dados
                );

            setPedidos((atuais) =>
                atuais.map((pedido) =>
                    pedido.id === pedidoAtualizado.id
                        ? pedidoAtualizado
                        : pedido
                )
            );

            fecharEdicaoPedido();
        } catch (error) {
            console.error(
                "Erro ao atualizar pedido:",
                error
            );

            setErro(
                t("admin.errors.save")
            );
        } finally {
            setSalvandoPedido(false);
        }
    }

    
    async function excluirPedido(pedido: AdminPedido) {
        const confirmar = window.confirm(
            t("admin.orders.deleteConfirm")
        );

        if (!confirmar) {
            return;
        }

        try {
            setExcluindoPedido(true);
            setErro(null);

            await deletarAdminPedido(pedido.id);

            setPedidos((atuais) =>
                atuais.filter(
                    (item) => item.id !== pedido.id
                )
            );
        } catch (error) {
            console.error(
                "Erro ao excluir pedido:",
                error
            );

            setErro(
                t("admin.errors.deleteOrder")
            );
        } finally {
            setExcluindoPedido(false);
        }
    }


    function fecharEdicao() {
        if (salvando) {
            return;
        }

        setUsuarioEditando(null);
        setFormulario(null);
        setErrosUsuario({});
    }

    function atualizarCampo<K extends keyof FormularioUsuario>(
        campo: K,
        valor: FormularioUsuario[K]
    ) {
        setFormulario((atual) => {
            if (!atual) {
                return atual;
            }

            return {
                ...atual,
                [campo]: valor,
            };
        });

        if (campo === "nome" || campo === "email" || campo === "role") {
            setErrosUsuario((atuais) => ({
                ...atuais,
                [campo]: undefined,
            }));
        }
    }

    async function salvarUsuario() {
        if (
            !usuarioEditando ||
            !formulario
        ) {
            return;
        }

        const nome = formulario.nome.trim();
        const email = formulario.email.trim();
        const role = formulario.role?.trim();

        const novosErros: {
            nome?: string;
            email?: string;
            role?: string;
        } = {};

        if (!nome) {
            novosErros.nome = t(
                "admin.users.validation.nameRequired",
                "O nome é obrigatório."
            );
        }

        if (!email) {
            novosErros.email = t(
                "admin.users.validation.emailRequired",
                "O e-mail é obrigatório."
            );
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            novosErros.email = t(
                "admin.users.validation.emailInvalid",
                "Informe um e-mail válido."
            );
        }

        if (!role) {
            novosErros.role = t(
                "admin.users.validation.roleRequired",
                "A função é obrigatória."
            );
        }

        if (Object.keys(novosErros).length > 0) {
            setErrosUsuario(novosErros);
            return;
        }

        try {
            setSalvando(true);
            setErro(null);

            const dados: AdminUserUpdateData = {
                nome,
                email,
                cpf: formulario.cpf.trim() || undefined,
                telefone: formulario.telefone.trim() || undefined,
                role: formulario.role,
                equipeId: formulario.equipeId.trim() || undefined,
                funcaoVisual:
                    formulario.funcaoVisual.trim() || undefined,
                ativo: formulario.ativo,
            };

            const usuarioAtualizado =
                await atualizarAdminUser(
                    usuarioEditando.id,
                    dados
                );

            setUsuarios((atuais) =>
                atuais.map((usuario) =>
                    usuario.id ===
                    usuarioAtualizado.id
                        ? usuarioAtualizado
                        : usuario
                )
            );

            fecharEdicao();
        } catch (error) {
            console.error(
                "Erro ao atualizar usuário:",
                error
            );

            setErro(t("admin.errors.save"));
        } finally {
            setSalvando(false);
        }
    }


    async function excluirUsuario(usuario: AdminUser) {
        const confirmar = window.confirm(
            t("admin.users.deleteConfirm")
        );

        if (!confirmar) {
            return;
        }

        try {
            setExcluindoUsuario(true);
            setErro(null);

            await deletarAdminUser(usuario.id);

            setUsuarios((atuais) =>
                atuais.filter(
                    (item) => item.id !== usuario.id
                )
            );
        } catch (error) {
            console.error(
                "Erro ao excluir usuário:",
                error
            );

            setErro(
                t("admin.errors.deleteUser")
            );
        } finally {
            setExcluindoUsuario(false);
        }
    }


    function limparBusca() {
        setBusca("");
    }

    function trocarAba(
        novaAba: AbaAdmin
    ) {
        setAba(novaAba);
        limparBusca();
    }

    function obterRoleLabel(
        role?: string
    ): string {
        if (
            role === "ADMIN" ||
            role === "GERENTE" ||
            role === "TECNICO" ||
            role === "CLIENTE"
        ) {
            return t(
                `equipe.roles.${role}`
            );
        }

        return "—";
    }

    function obterStatusLabel(
        ativo: boolean
    ): string {
        return ativo
            ? t("admin.status.active")
            : t("admin.status.inactive");
    }

    return (
        <main className="dashboard-main">

            <section className="dashboard-title-block">
                <div className="dashboard-title-row">
                    <div>
                        <span className="pedido-detalhe-kicker">
                            {t("admin.kicker")}
                        </span>

                        <h1 className="dashboard-title">
                            {t("admin.title")}
                        </h1>

                        <p className="dashboard-subtitle">
                            {t("admin.subtitle")}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="button"
                        onClick={carregarDados}
                        disabled={carregando}
                    >
                        {carregando
                            ? t(
                                  "admin.actions.refreshing"
                              )
                            : t(
                                  "admin.actions.refresh"
                              )}
                    </button>
                </div>
            </section>

            <section className="filtros-bar">

                <div className="filtros-tabs">

                    <button
                        type="button"
                        className={
                            aba === "usuarios"
                                ? "filtro-btn filtro-ativo"
                                : "filtro-btn"
                        }
                        onClick={() =>
                            trocarAba(
                                "usuarios"
                            )
                        }
                    >
                        {t("admin.tabs.users")}

                        <span className="filtro-count">
                            {usuarios.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={
                            aba === "pedidos"
                                ? "filtro-btn filtro-ativo"
                                : "filtro-btn"
                        }
                        onClick={() =>
                            trocarAba(
                                "pedidos"
                            )
                        }
                    >
                        {t("admin.tabs.orders")}

                        <span className="filtro-count">
                            {pedidos.length}
                        </span>
                    </button>

                </div>

                <div className="filtros-actions">

                    <div
                        className="ui-search-field ui-search-field--boxed"
                        style={{
                            marginBottom: 0,
                        }}
                    >
                        <input
                            type="search"
                            value={busca}
                            onChange={(event) =>
                                setBusca(
                                    event.target.value
                                )
                            }
                            placeholder={
                                aba === "usuarios"
                                    ? t(
                                          "admin.search.usersPlaceholder"
                                      )
                                    : t(
                                          "admin.search.ordersPlaceholder"
                                      )
                            }
                            aria-label={t(
                                "admin.search.aria"
                            )}
                        />
                    </div>

                </div>

            </section>

            {erro && (
                <div className="error-text">
                    {erro}
                </div>
            )}

            {carregando ? (
                <div className="pintura-loading">
                    {t("admin.loading")}
                </div>
            ) : aba === "usuarios" ? (

                <section>

                    <div className="pedidos-row-head material-row">
                        <span>
                            {t("admin.users.name")}
                        </span>

                        <span>
                            {t("admin.users.role")}
                        </span>

                        <span>
                            {t("admin.users.team")}
                        </span>

                        <span>
                            {t("admin.users.status")}
                        </span>

                        <span>
                            {t("admin.actions.edit")}
                        </span>
                    </div>

                    {usuariosFiltrados.length ===
                    0 ? (
                        <div className="empty-state">
                            <h2 className="empty-title">
                                {t(
                                    "admin.empty.users"
                                )}
                            </h2>
                        </div>
                    ) : (
                        usuariosFiltrados.map(
                            (
                                usuario,
                                index
                            ) => (
                                <div
                                    key={
                                        usuario.id
                                    }
                                    className="pedido-row material-row"
                                    style={{
                                        "--row-index":
                                            index,
                                    } as React.CSSProperties}
                                >
                                    <div>
                                        <strong>
                                            {
                                                usuario.nome
                                            }
                                        </strong>

                                        <small>
                                            {
                                                usuario.email
                                            }
                                        </small>
                                    </div>

                                    <span>
                                        {obterRoleLabel(
                                            usuario.role
                                        )}
                                    </span>

                                    <span>
                                        {usuario.equipeId ||
                                            t(
                                                "admin.users.noTeam"
                                            )}
                                    </span>

                                    <span>
                                        {obterStatusLabel(
                                            usuario.ativo
                                        )}
                                    </span>

                                        <div className="material-row-actions">
                                        <button
                                            type="button"
                                            className="btn-acao-pequeno"
                                            onClick={() =>
                                                abrirEdicao(usuario)
                                            }
                                            disabled={excluindoUsuario}
                                        >
                                            {t("admin.actions.edit")}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-acao-pequeno"
                                            onClick={() =>
                                                excluirUsuario(usuario)
                                            }
                                            disabled={excluindoUsuario}
                                        >
                                            {t("admin.actions.delete")}
                                        </button>
                                        </div>


                                </div>
                            )
                        )
                    )}

                </section>

            ) : (

                <section>

                        <div className="pedidos-row-head material-row">
                            <span>
                                {t("admin.orders.project")}
                            </span>

                            <span>
                                {t("admin.orders.client")}
                            </span>

                            <span>
                                {t("admin.orders.status")}
                            </span>

                            <span>
                                {t("admin.orders.deadline")}
                            </span>

                            <span>
                                {t("admin.orders.price")}
                            </span>

                            <span>
                                {t("admin.actions.edit")}
                            </span>
                        </div>



                    {pedidosFiltrados.length ===
                    0 ? (
                        <div className="empty-state">
                            <h2 className="empty-title">
                                {t(
                                    "admin.empty.orders"
                                )}
                            </h2>
                        </div>
                    ) : (
                        pedidosFiltrados.map(
                            (
                                pedido,
                                index
                            ) => (
                                <div
                                    key={
                                        pedido.id
                                    }
                                    className="pedido-row material-row"
                                    style={{
                                        "--row-index":
                                            index,
                                    } as React.CSSProperties}
                                >
                                    <div>
                                        <strong>
                                            {
                                                pedido.projeto
                                            }
                                        </strong>

                                        <small>
                                            {pedido.id}
                                        </small>
                                    </div>

                                    <span>
                                        {
                                            pedido.cliente
                                        }
                                    </span>

                                    <span>
                                        {pedido.status
                                            ? t(
                                                `pedidos.status.${pedido.status}`
                                            )
                                            : "—"}
                                    </span>

                                    <span>
                                        {formatarData(
                                            pedido.prazo
                                        )}
                                    </span>

                                    <span>
                                        {formatarMoeda(
                                            pedido.precoFinal
                                        )}
                                    </span>

                                    

                                <div className="material-row-actions">
                                    <button
                                        type="button"
                                        className="btn-acao-pequeno"
                                        onClick={() =>
                                            abrirEdicaoPedido(pedido)
                                        }
                                        disabled={
                                            salvandoPedido ||
                                            excluindoPedido
                                        }
                                    >
                                        {t("admin.actions.edit")}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-acao-pequeno"
                                        onClick={() =>
                                            excluirPedido(pedido)
                                        }
                                        disabled={
                                            salvandoPedido ||
                                            excluindoPedido
                                        }
                                    >
                                        {t("admin.actions.delete")}
                                    </button>
                                </div>




                                </div>
                            )
                        )
                    )}

                </section>
            )}

            {usuarioEditando &&
                formulario && (
                    <div
                        className="modal-overlay"
                        role="presentation"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                fecharEdicao();
                            }
                        }}
                    >
                        <div
                            className="modal-card"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-edit-user-title"
                        >

                            <div className="modal-header">
                                <div>
                                    <span className="pedido-detalhe-kicker">
                                        {t(
                                            "admin.users.editTitle"
                                        )}
                                    </span>

                                    <h2 id="admin-edit-user-title">
                                        {
                                            usuarioEditando.nome
                                        }
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        fecharEdicao
                                    }
                                    disabled={
                                        salvando
                                    }
                                    aria-label={t(
                                        "admin.actions.cancel"
                                    )}
                                >
                                    ×
                                </button>
                            </div>

                            <p className="dashboard-subtitle">
                                {t(
                                    "admin.users.editDescription"
                                )}
                            </p>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    flexDirection:
                                        "column",
                                    gap:
                                        "var(--space-4)",
                                    marginTop:
                                        "var(--space-5)",
                                }}
                            >

                                <div className="input-group">
                                    <label>
                                        {t(
                                            "admin.users.fields.name"
                                        )}
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulario.nome
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "nome",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                    {errosUsuario.nome && (
                                        <span className="error-text">
                                            {errosUsuario.nome}
                                        </span>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label>
                                        {t(
                                            "admin.users.fields.email"
                                        )}
                                    </label>

                                    <input
                                        type="email"
                                        value={
                                            formulario.email
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "email",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                    {errosUsuario.email && (
                                        <span className="error-text">
                                            {errosUsuario.email}
                                        </span>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label>
                                        {t(
                                            "admin.users.fields.cpf"
                                        )}
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulario.cpf
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "cpf",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="input-group">
                                    <label>
                                        {t(
                                            "admin.users.fields.phone"
                                        )}
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulario.telefone
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "telefone",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="input-group">
                                    <label>
                                        {t(
                                            "admin.users.fields.role"
                                        )}
                                    </label>

                                    <select
                                        value={
                                            formulario.role
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "role",
                                                event
                                                    .target
                                                    .value as FormularioUsuario["role"]
                                            )
                                        }
                                    >
                                        <option value="ADMIN">
                                            {t(
                                                "equipe.roles.ADMIN"
                                            )}
                                        </option>

                                        <option value="GERENTE">
                                            {t(
                                                "equipe.roles.GERENTE"
                                            )}
                                        </option>

                                        <option value="TECNICO">
                                            {t(
                                                "equipe.roles.TECNICO"
                                            )}
                                        </option>

                                        <option value="CLIENTE">
                                            {t(
                                                "equipe.roles.CLIENTE"
                                            )}
                                        </option>
                                    </select>

                                    {errosUsuario.role && (
                                        <span className="error-text">
                                            {errosUsuario.role}
                                        </span>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label>
                                        {t(
                                            "admin.users.fields.team"
                                        )}
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulario.equipeId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "equipeId",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <div className="input-group">
                                    <label>
                                        {t(
                                            "admin.users.fields.function"
                                        )}
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulario.funcaoVisual
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "funcaoVisual",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <label className="material-check">
                                    <input
                                        type="checkbox"
                                        checked={
                                            formulario.ativo
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "ativo",
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    <span>
                                        {t(
                                            "admin.users.fields.active"
                                        )}
                                    </span>
                                </label>

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={
                                        fecharEdicao
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    {t(
                                        "admin.actions.cancel"
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="button"
                                    onClick={
                                        salvarUsuario
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    {salvando
                                        ? t(
                                              "admin.actions.saving"
                                          )
                                        : t(
                                              "admin.actions.save"
                                          )}
                                </button>

                            </div>

                        </div>
                    </div>
                )}

                
                {pedidoEditando && formularioPedido && (
                    <div
                        className="modal-overlay"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                fecharEdicaoPedido();
                            }
                        }}
                    >
                        <div
                            className="modal-card"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-edit-order-title"
                        >
                            <div className="modal-header">
                                <div>
                                    <span className="pedido-detalhe-kicker">
                                        {t("admin.orders.editTitle")}
                                    </span>

                                    <h2 id="admin-edit-order-title">
                                        {pedidoEditando.projeto}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={fecharEdicaoPedido}
                                    disabled={salvandoPedido}
                                    aria-label={t(
                                        "admin.actions.cancel"
                                    )}
                                >
                                    ×
                                </button>
                            </div>

                            <p className="dashboard-subtitle">
                                {t("admin.orders.editDescription")}
                            </p>

                           
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "var(--space-4)",
                                        marginTop: "var(--space-5)",
                                    }}
                                >
                                    <div className="input-group">
                                        <label>
                                            {t("admin.orders.fields.client")}
                                        </label>

                                        <input
                                            type="text"
                                            value={formularioPedido.cliente}
                                            onChange={(event) =>
                                                setFormularioPedido((atual) =>
                                                    atual
                                                        ? {
                                                            ...atual,
                                                            cliente:
                                                                event.target.value,
                                                        }
                                                        : atual
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            {t("admin.orders.fields.clientId")}
                                        </label>

                                        <input
                                            type="text"
                                            value={formularioPedido.clienteId}
                                            onChange={(event) =>
                                                setFormularioPedido((atual) =>
                                                    atual
                                                        ? {
                                                            ...atual,
                                                            clienteId:
                                                                event.target.value,
                                                        }
                                                        : atual
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            {t("admin.orders.fields.project")}
                                        </label>

                                        <input
                                            type="text"
                                            value={formularioPedido.projeto}
                                            onChange={(event) =>
                                                setFormularioPedido((atual) =>
                                                    atual
                                                        ? {
                                                            ...atual,
                                                            projeto:
                                                                event.target.value,
                                                        }
                                                        : atual
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            {t("admin.orders.fields.description")}
                                        </label>

                                        <textarea
                                            value={formularioPedido.descricao}
                                            onChange={(event) =>
                                                setFormularioPedido((atual) =>
                                                    atual
                                                        ? {
                                                            ...atual,
                                                            descricao:
                                                                event.target.value,
                                                        }
                                                        : atual
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            {t("admin.orders.fields.material")}
                                        </label>

                                        <input
                                            type="text"
                                            value={formularioPedido.materialId}
                                            onChange={(event) =>
                                                setFormularioPedido((atual) =>
                                                    atual
                                                        ? {
                                                            ...atual,
                                                            materialId:
                                                                event.target.value,
                                                        }
                                                        : atual
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            {t("admin.orders.fields.deadline")}
                                        </label>

                                        <input
                                            type="date"
                                            value={formularioPedido.prazo}
                                            onChange={(event) =>
                                                setFormularioPedido((atual) =>
                                                    atual
                                                        ? {
                                                            ...atual,
                                                            prazo:
                                                                event.target.value,
                                                        }
                                                        : atual
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            {t("admin.orders.fields.status")}
                                        </label>


                                        <div className="input-group">
                                            <label>
                                                {t("admin.orders.fields.status")}
                                            </label>

                                        <select
                                            value={formularioPedido.status}
                                            onChange={(event) =>
                                                setFormularioPedido((atual) =>
                                                    atual
                                                        ? {
                                                            ...atual,
                                                            status:
                                                                event.target.value,
                                                        }
                                                        : atual
                                                )
                                            }
                                        >
                                            <option value="">
                                                —
                                            </option>

                                            <option value="MODELAGEM">
                                                {t("pedidos.status.MODELAGEM")}
                                            </option>

                                            <option value="IMPRESSAO">
                                                {t("pedidos.status.IMPRESSAO")}
                                            </option>

                                            <option value="PINTURA">
                                                {t("pedidos.status.PINTURA")}
                                            </option>

                                            <option value="ACABAMENTO">
                                                {t("pedidos.status.ACABAMENTO")}
                                            </option>

                                            <option value="FINALIZADO">
                                                {t("pedidos.status.FINALIZADO")}
                                            </option>
                                        </select>
                                    </div>


                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={fecharEdicaoPedido}
                                        disabled={salvandoPedido}
                                    >
                                        {t("admin.actions.cancel")}
                                    </button>

                                    <button
                                        type="button"
                                        className="button button-primary"
                                        onClick={salvarPedido}
                                        disabled={salvandoPedido}
                                    >
                                        {salvandoPedido
                                            ? t("admin.actions.saving")
                                            : t("admin.actions.save")}
                                    </button>
                                </div>


                        </div>
                    </div>
                )}



        </main>
    );
}

export default AdminPage;
