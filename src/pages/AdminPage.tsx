
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";


import {
    AdminPedido,
    AdminUser,
    AdminUserUpdateData,
    atualizarAdminUser,
    deletarAdminUser,
    getAdminPedidos,
    getAdminUsers,
    deletarAdminPedido
} from "../services/adminService";
import { editarPedido, getPedido } from "../services/PedidoService";
import { useRecarregarAoVoltar } from "../hooks/useRecarregarAoVoltar";




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
    prazo: string;
};

type ErrosPedido = {
    cliente?: string;
    projeto?: string;
    prazo?: string;
};

type PedidoComArquivos = AdminPedido & {
    objeto3DFileId?: string | null;
    imagensBase64?: (string | null)[];
    imagensReferenciaFileIds?: string[];
    imagensReferenciaIds?: string[];
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

    const [pedidoComArquivos, setPedidoComArquivos] =
        useState<PedidoComArquivos | null>(null);

    const [carregandoArquivosPedido, setCarregandoArquivosPedido] =
        useState(false);

    const [formularioPedido, setFormularioPedido] =
        useState<FormularioPedido | null>(null);

    const [errosPedido, setErrosPedido] =
        useState<ErrosPedido>({});

    const [objeto3D, setObjeto3D] =
        useState<File | null>(null);

    const [removerObjeto3D, setRemoverObjeto3D] =
        useState(false);

    const [novasImagens, setNovasImagens] =
        useState<File[]>([]);

    const [imagensRemover, setImagensRemover] =
        useState<Set<string>>(new Set());

    const [salvandoPedido, setSalvandoPedido] =
        useState(false);

    const [excluindoPedido, setExcluindoPedido] =
        useState(false);

    const novasImagensPreviews = useMemo(
        () =>
            novasImagens.map((arquivo) => ({
                arquivo,
                url: URL.createObjectURL(arquivo),
            })),
        [novasImagens]
    );

    useEffect(() => {
        return () => {
            novasImagensPreviews.forEach(
                ({ url }) => URL.revokeObjectURL(url)
            );
        };
    }, [novasImagensPreviews]);


    useEffect(() => {
        carregarDados();
    }, []);

    // `silencioso`: recarga ao voltar para a aba, sem trocar a lista pelo "carregando".
    async function carregarDados(silencioso = false) {
        try {
            if (!silencioso) setCarregando(true);
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

    useRecarregarAoVoltar(
        () => void carregarDados(true),
        !usuarioEditando && !pedidoEditando
    );

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


    async function abrirEdicaoPedido(pedido: AdminPedido) {
        setPedidoEditando(pedido);
        setPedidoComArquivos(null);
        setCarregandoArquivosPedido(true);
        setErrosPedido({});
        setObjeto3D(null);
        setRemoverObjeto3D(false);
        setNovasImagens([]);
        setImagensRemover(new Set());

        setFormularioPedido({
            clienteId: pedido.clienteId || "",
            cliente: pedido.cliente || "",
            projeto: pedido.projeto || "",
            descricao: pedido.descricao || "",
            prazo: pedido.prazo
                ? String(pedido.prazo).slice(0, 10)
                : "",
        });

        try {
            const detalhe = await getPedido(pedido.id);
            setPedidoComArquivos(detalhe as PedidoComArquivos);
        } catch (error) {
            console.error(
                "Erro ao carregar arquivos do pedido:",
                error
            );
            // O modal continua funcionando mesmo se os arquivos
            // não puderem ser carregados.
        } finally {
            setCarregandoArquivosPedido(false);
        }
    }


    function limparErroPedido(campo: keyof ErrosPedido) {
        setErrosPedido((atuais) => ({
            ...atuais,
            [campo]: undefined,
        }));
    }


    function validarPedido(): ErrosPedido {
        const erros: ErrosPedido = {};

        if (!formularioPedido?.projeto.trim()) {
            erros.projeto = t(
                "pedidos.form.errorProject",
                "O nome do pedido é obrigatório."
            );
        }

        const hoje =
            new Date()
                .toISOString()
                .split("T")[0];

        if (!formularioPedido?.prazo) {
            erros.prazo = t(
                "pedidos.form.errorDeadline",
                "O prazo é obrigatório."
            );
        } else if (
            formularioPedido.prazo < hoje
        ) {
            erros.prazo = t(
                "pedidos.form.errorDeadlinePast",
                "O prazo não pode ser anterior a hoje."
            );
        }

        return erros;
    }


    function removerNovaImagem(index: number) {
        setNovasImagens((atuais) =>
            atuais.filter(
                (_, indice) => indice !== index
            )
        );
    }


    function adicionarImagens(files: FileList | null) {
        if (!files) {
            return;
        }

        const selecionadas = Array.from(files)
            .filter((arquivo) =>
                arquivo.type.startsWith("image/")
            );

        setNovasImagens((atuais) => {
            const chaves = new Set(
                atuais.map(
                    (arquivo) =>
                        `${arquivo.name}-${arquivo.size}`
                )
            );

            const unicas = selecionadas.filter(
                (arquivo) =>
                    !chaves.has(
                        `${arquivo.name}-${arquivo.size}`
                    )
            );

            return [...atuais, ...unicas];
        });
    }


    function alternarRemocaoImagem(
        imagemId: string
    ) {
        if (!imagemId) {
            return;
        }

        setImagensRemover((atuais) => {
            const proximo = new Set(atuais);

            if (proximo.has(imagemId)) {
                proximo.delete(imagemId);
            } else {
                proximo.add(imagemId);
            }

            return proximo;
        });
    }


    function fecharEdicaoPedido() {
        if (salvandoPedido) {
            return;
        }

        setPedidoEditando(null);
        setPedidoComArquivos(null);
        setFormularioPedido(null);
        setErrosPedido({});
        setObjeto3D(null);
        setRemoverObjeto3D(false);
        setNovasImagens([]);
        setImagensRemover(new Set());
    }


    async function salvarPedido() {
        if (!pedidoEditando || !formularioPedido) {
            return;
        }

        const novosErros = validarPedido();

        if (Object.keys(novosErros).length > 0) {
            setErrosPedido(novosErros);
            return;
        }

        try {
            setSalvandoPedido(true);
            setErro(null);

            const pedidoAtualizado =
                await editarPedido(
                    pedidoEditando.id,
                    {
                        clienteId:
                            formularioPedido.clienteId ||
                            undefined,
                        cliente:
                            formularioPedido.cliente.trim(),
                        projeto:
                            formularioPedido.projeto.trim(),
                        descricao:
                            formularioPedido.descricao.trim(),
                        prazo:
                            formularioPedido.prazo,
                        objeto3D,
                        imagensReferencia:
                            novasImagens,
                        removerObjeto3D,
                        imagensRemover:
                            Array.from(imagensRemover),
                    }
                );

            setPedidos((atuais) =>
                atuais.map((pedido) =>
                    pedido.id === pedidoAtualizado.id
                        ? (pedidoAtualizado as AdminPedido)
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
                error instanceof Error
                    ? error.message
                    : t("admin.errors.save")
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

                <section className="pedidos-list">

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

                <section className="pedidos-list">

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

                
                {pedidoEditando && formularioPedido && (() => {
                    const imagensAtuais =
                        pedidoComArquivos?.imagensReferenciaFileIds ??
                        [];

                    const idsImagens =
                        pedidoComArquivos?.imagensReferenciaIds ??
                        [];

                    return (
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
                                className="modal-card pedido-detalhe-modal is-editing"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="admin-edit-order-title"
                            >
                                <div className="modal-header pedido-detalhe-header">
                                    <div>
                                        <span className="pedido-detalhe-kicker">
                                            {t("admin.orders.editTitle")}
                                        </span>

                                        <h2 id="admin-edit-order-title">
                                            {formularioPedido.projeto ||
                                                t("admin.orders.editTitle")}
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

                                <form
                                    className="pedido-edit-form"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void salvarPedido();
                                    }}
                                    noValidate
                                >
                                    {erro && (
                                        <p
                                            className="pedido-edit-error"
                                            role="alert"
                                        >
                                            {erro}
                                        </p>
                                    )}

                                    <div className="pedido-edit-grid">
                                        <div className="input-group">
                                            <label htmlFor="admin-pedido-cliente">
                                                {t(
                                                    "admin.orders.fields.client"
                                                )}
                                            </label>

                                            <select
                                                id="admin-pedido-cliente"
                                                value={
                                                    formularioPedido.clienteId
                                                }
                                                onChange={(event) => {
                                                    const id =
                                                        event.target.value;

                                                    const clienteSelecionado =
                                                        usuarios.find(
                                                            (usuario) =>
                                                                usuario.id ===
                                                                    id &&
                                                                usuario.role ===
                                                                    "CLIENTE"
                                                        );

                                                    setFormularioPedido(
                                                        (atual) =>
                                                            atual
                                                                ? {
                                                                    ...atual,
                                                                    clienteId:
                                                                        id,
                                                                    cliente:
                                                                        clienteSelecionado?.nome ??
                                                                        "",
                                                                }
                                                                : atual
                                                    );

                                                    limparErroPedido(
                                                        "cliente"
                                                    );
                                                }}
                                                disabled={salvandoPedido}
                                            >
                                                <option value="">
                                                    {t(
                                                        "pedidos.form.noClientLinked",
                                                        "Nenhum cliente vinculado"
                                                    )}
                                                </option>

                                                {usuarios
                                                    .filter(
                                                        (usuario) =>
                                                            usuario.role ===
                                                            "CLIENTE"
                                                    )
                                                    .map(
                                                        (usuario) => (
                                                            <option
                                                                key={
                                                                    usuario.id
                                                                }
                                                                value={
                                                                    usuario.id
                                                                }
                                                            >
                                                                {
                                                                    usuario.nome
                                                                }{" "}
                                                                —{" "}
                                                                {
                                                                    usuario.email
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                            </select>

                                            {errosPedido.cliente && (
                                                <span className="error-text">
                                                    {errosPedido.cliente}
                                                </span>
                                            )}
                                        </div>

                                        <div className="input-group">
                                            <label htmlFor="admin-pedido-projeto">
                                                {t(
                                                    "admin.orders.fields.project"
                                                )}
                                            </label>

                                            <input
                                                id="admin-pedido-projeto"
                                                type="text"
                                                className={
                                                    errosPedido.projeto
                                                        ? "input-error"
                                                        : ""
                                                }
                                                value={
                                                    formularioPedido.projeto
                                                }
                                                onChange={(event) => {
                                                    setFormularioPedido(
                                                        (atual) =>
                                                            atual
                                                                ? {
                                                                    ...atual,
                                                                    projeto:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }
                                                                : atual
                                                    );

                                                    limparErroPedido(
                                                        "projeto"
                                                    );
                                                }}
                                                disabled={salvandoPedido}
                                                aria-invalid={
                                                    !!errosPedido.projeto
                                                }
                                            />

                                            {errosPedido.projeto && (
                                                <span className="error-text">
                                                    {errosPedido.projeto}
                                                </span>
                                            )}
                                        </div>

                                        <div className="input-group">
                                            <label htmlFor="admin-pedido-prazo">
                                                {t(
                                                    "admin.orders.fields.deadline"
                                                )}
                                            </label>

                                            <input
                                                id="admin-pedido-prazo"
                                                type="date"
                                                className={
                                                    errosPedido.prazo
                                                        ? "input-error"
                                                        : ""
                                                }
                                                value={
                                                    formularioPedido.prazo
                                                }
                                                min={
                                                    new Date()
                                                        .toISOString()
                                                        .split("T")[0]
                                                }
                                                onChange={(event) => {
                                                    setFormularioPedido(
                                                        (atual) =>
                                                            atual
                                                                ? {
                                                                    ...atual,
                                                                    prazo:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }
                                                                : atual
                                                    );

                                                    limparErroPedido(
                                                        "prazo"
                                                    );
                                                }}
                                                disabled={salvandoPedido}
                                                aria-invalid={
                                                    !!errosPedido.prazo
                                                }
                                            />

                                            {errosPedido.prazo && (
                                                <span className="error-text">
                                                    {errosPedido.prazo}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="admin-pedido-descricao">
                                            {t(
                                                "admin.orders.fields.description"
                                            )}
                                        </label>

                                        <textarea
                                            id="admin-pedido-descricao"
                                            rows={4}
                                            value={
                                                formularioPedido.descricao
                                            }
                                            onChange={(event) =>
                                                setFormularioPedido(
                                                    (atual) =>
                                                        atual
                                                            ? {
                                                                ...atual,
                                                                descricao:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            }
                                                            : atual
                                                )
                                            }
                                            disabled={salvandoPedido}
                                        />
                                    </div>

                                    <div className="pedido-edit-section">
                                        <div className="pedido-edit-section-title">
                                            <div>
                                                <h3>
                                                    {t(
                                                        "pedidos.detalhe.object3dSectionTitle",
                                                        "Objeto 3D"
                                                    )}
                                                </h3>

                                                <span>
                                                    {t(
                                                        "pedidos.novo.object3dSectionHint",
                                                        "Arquivo 3D do pedido."
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {pedidoComArquivos?.objeto3DFileId &&
                                            !removerObjeto3D && (
                                                <div className="pedido-edit-file">
                                                    <div>
                                                        <strong>
                                                            Objeto 3D cadastrado
                                                        </strong>

                                                        <span>
                                                            O pedido já possui
                                                            um arquivo 3D.
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="pedido-remove-btn"
                                                        onClick={() =>
                                                            setRemoverObjeto3D(
                                                                true
                                                            )
                                                        }
                                                        disabled={
                                                            salvandoPedido
                                                        }
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            )}

                                        {removerObjeto3D && (
                                            <div className="pedido-edit-file is-new">
                                                <div>
                                                    <strong>
                                                        Objeto 3D marcado para remoção
                                                    </strong>

                                                    <span>
                                                        Selecione outro arquivo abaixo
                                                        para substituir.
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="pedido-remove-btn"
                                                    onClick={() =>
                                                        setRemoverObjeto3D(
                                                            false
                                                        )
                                                    }
                                                    disabled={
                                                        salvandoPedido
                                                    }
                                                >
                                                    Desfazer
                                                </button>
                                            </div>
                                        )}

                                        {objeto3D && (
                                            <div className="pedido-edit-file is-new">
                                                <div>
                                                    <strong>
                                                        {objeto3D.name}
                                                    </strong>

                                                    <span>
                                                        Novo arquivo selecionado.
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="pedido-remove-btn"
                                                    onClick={() =>
                                                        setObjeto3D(null)
                                                    }
                                                    disabled={
                                                        salvandoPedido
                                                    }
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        )}

                                        <label className="pedido-upload-btn">
                                            +
                                            {objeto3D
                                                ? "Substituir objeto 3D"
                                                : "Adicionar objeto 3D"}

                                            <input
                                                type="file"
                                                accept=".stl,.obj,.fbx,.glb,.gltf,.3mf"
                                                onChange={(event) => {
                                                    const arquivo =
                                                        event.target
                                                            .files?.[0] ??
                                                        null;

                                                    setObjeto3D(
                                                        arquivo
                                                    );

                                                    if (arquivo) {
                                                        setRemoverObjeto3D(
                                                            false
                                                        );
                                                    }

                                                    event.target.value = "";
                                                }}
                                                disabled={
                                                    salvandoPedido
                                                }
                                            />
                                        </label>

                                        <span className="input-hint">
                                            {t(
                                                "pedidos.form.object3dFormats",
                                                "Formatos: STL, OBJ, FBX, GLB, GLTF e 3MF."
                                            )}
                                        </span>
                                    </div>

                                    <div className="pedido-edit-section">
                                        <div className="pedido-edit-section-title">
                                            <div>
                                                <h3>
                                                    {t(
                                                        "pedidos.detalhe.imagesSectionTitle",
                                                        "Imagens de referência"
                                                    )}
                                                </h3>

                                                <span>
                                                    {t(
                                                        "pedidos.novo.imagesSectionHint",
                                                        "Adicione imagens de referência ao pedido."
                                                    )}
                                                </span>
                                            </div>

                                            <label className="pedido-upload-btn">
                                                +
                                                {t(
                                                    "pedidos.novo.imagesAdd",
                                                    "Adicionar imagens"
                                                )}

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(event) => {
                                                        adicionarImagens(
                                                            event.target.files
                                                        );

                                                        event.target.value =
                                                            "";
                                                    }}
                                                    disabled={
                                                        salvandoPedido
                                                    }
                                                />
                                            </label>
                                        </div>

                                        {carregandoArquivosPedido && (
                                            <p className="input-hint">
                                                Carregando arquivos atuais...
                                            </p>
                                        )}

                                        {imagensAtuais.length > 0 && (
                                            <div className="pedido-edit-images">
                                                {imagensAtuais.map(
                                                    (
                                                        imagem,
                                                        indice
                                                    ) => {
                                                        const imagemId =
                                                            idsImagens[
                                                                indice
                                                            ] ?? "";

                                                        const marcadaParaRemocao =
                                                            imagemId
                                                                ? imagensRemover.has(
                                                                    imagemId
                                                                )
                                                                : false;

                                                        if (!imagem) {
                                                            return null;
                                                        }

                                                        return (
                                                            <div
                                                                key={
                                                                    imagemId ||
                                                                    `imagem-atual-${indice}`
                                                                }
                                                                className={
                                                                    "pedido-edit-image" +
                                                                    (marcadaParaRemocao
                                                                        ? " is-new"
                                                                        : "")
                                                                }
                                                            >
                                                                <img
                                                                    src={
                                                                        imagem
                                                                    }
                                                                    alt={`Imagem de referência ${indice + 1}`}
                                                                />

                                                                {imagemId && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            alternarRemocaoImagem(
                                                                                imagemId
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            salvandoPedido
                                                                        }
                                                                    >
                                                                        {marcadaParaRemocao
                                                                            ? "Desfazer remoção"
                                                                            : "Remover"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        )}

                                        {novasImagensPreviews.length > 0 && (
                                            <div className="pedido-edit-images">
                                                {novasImagensPreviews.map(
                                                    (
                                                        preview,
                                                        indice
                                                    ) => (
                                                        <div
                                                            key={`${preview.arquivo.name}-${preview.arquivo.size}-${indice}`}
                                                            className="pedido-edit-image is-new"
                                                        >
                                                            <img
                                                                src={preview.url}
                                                                alt={
                                                                    preview.arquivo.name
                                                                }
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removerNovaImagem(
                                                                        indice
                                                                    )
                                                                }
                                                                disabled={
                                                                    salvandoPedido
                                                                }
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {imagensAtuais.length === 0 &&
                                            novasImagensPreviews.length === 0 && (
                                                <p className="pedido-detalhe-empty">
                                                    Nenhuma imagem de referência.
                                                </p>
                                            )}
                                    </div>

                                    <div className="modal-actions pedido-edit-actions">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={fecharEdicaoPedido}
                                            disabled={salvandoPedido}
                                        >
                                            {t(
                                                "admin.actions.cancel"
                                            )}
                                        </button>

                                        <button
                                            type="submit"
                                            className="button button-primary"
                                            disabled={salvandoPedido}
                                        >
                                            {salvandoPedido
                                                ? t(
                                                    "admin.actions.saving"
                                                )
                                                : t(
                                                    "admin.actions.save"
                                                )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    );
                })()}



        </main>
    );
}

export default AdminPage;
