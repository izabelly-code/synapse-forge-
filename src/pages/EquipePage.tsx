import {
    useEffect,
    useState,
    type ChangeEvent,
} from "react";

import {
    UserAdd01Icon,
    UserGroupIcon,
    Cancel01Icon,
    Image01Icon,
    Mail01Icon,
    UserRemove01Icon,
    Refresh01Icon,
} from "hugeicons-react";

import "./EquipePage.css";

import { getUserRole, getToken } from "../hooks/useAuth";

const API_URL = "http://localhost:8081";

interface Equipe {
    id: string;
    nome: string;
    gerenteId: string;
    fotoBase64: string | null;
    bannerBase64: string | null;
    criadoEm: string;
    atualizadoEm: string;
}

interface Integrante {
    id: string;
    nome: string;
    email: string;
    cpf?: string | null;
    telefone?: string | null;
    role: string;
    equipeId?: string | null;
}

interface ClienteDisponivel {
    id: string;
    nome: string;
    email: string;
    cpf?: string | null;
    telefone?: string | null;
    role: string;
    equipeId?: string | null;
}

interface Convite {
    id: string;
    equipeId: string;
    equipeNome: string | null;
    gerenteId: string;
    gerenteNome: string | null;
    usuarioId: string;
    usuarioNome: string | null;
    status: string;
    criadoEm: string;
    expiraEm: string;
}

type ModalEquipeModo = "criacao" | "edicao";

function EquipePage() {
    const role = getUserRole();

    const isGerente = role === "GERENTE";
    const isTecnico = role === "TECNICO";
    const isAdmin = role === "ADMIN";

    const podeGerenciarEquipe = isGerente || isAdmin;

    const [equipe, setEquipe] = useState<Equipe | null>(null);

    const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
    const [carregandoIntegrantes, setCarregandoIntegrantes] = useState(false);

    const [clientesDisponiveis, setClientesDisponiveis] = useState<
        ClienteDisponivel[]
    >([]);

    const [convites, setConvites] = useState<Convite[]>([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const [modalAberto, setModalAberto] = useState(false);
    const [modalEquipeModo, setModalEquipeModo] =
        useState<ModalEquipeModo>("criacao");

    const [modalConviteAberto, setModalConviteAberto] = useState(false);

    const [nomeEquipe, setNomeEquipe] = useState("");

    const [foto, setFoto] = useState<File | null>(null);
    const [banner, setBanner] = useState<File | null>(null);

    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const [salvandoEquipe, setSalvandoEquipe] = useState(false);

    const [carregandoClientes, setCarregandoClientes] = useState(false);
    const [enviandoConvite, setEnviandoConvite] = useState(false);

    const [clienteSelecionado, setClienteSelecionado] = useState("");

    const [removendoIntegranteId, setRemovendoIntegranteId] =
        useState<string | null>(null);

    const [saindoDaEquipe, setSaindoDaEquipe] = useState(false);

    const [atualizando, setAtualizando] = useState(false);

    /*
     * =========================================================
     * HELPERS
     * =========================================================
     */

    function obterToken(): string {
        const token = getToken();

        if (!token) {
            throw new Error(
                "Sua sessão expirou. Faça login novamente."
            );
        }

        return token;
    }

    async function obterMensagemErro(
        response: Response,
        mensagemPadrao: string
    ): Promise<string> {
        try {
            const data = await response.json();

            if (data?.message) {
                return data.message;
            }

            if (data?.mensagem) {
                return data.mensagem;
            }

            if (typeof data === "string") {
                return data;
            }
        } catch {
            try {
                const texto = await response.text();

                if (texto) {
                    return texto;
                }
            } catch {
                // Mantém mensagem padrão.
            }
        }

        return mensagemPadrao;
    }

    /*
     * =========================================================
     * BUSCAR MINHA EQUIPE
     * =========================================================
     */

    async function buscarMinhaEquipe(): Promise<Equipe | null> {
        const token = obterToken();

        const response = await fetch(
            `${API_URL}/equipes/minha`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(
                await obterMensagemErro(
                    response,
                    "Não foi possível carregar a equipe."
                )
            );
        }

        return await response.json();
    }

    /*
     * =========================================================
     * BUSCAR INTEGRANTES
     * =========================================================
     */

    async function buscarIntegrantes() {
        if (!equipe) {
            setIntegrantes([]);
            return;
        }

        try {
            setCarregandoIntegrantes(true);

            const token = obterToken();

            const response = await fetch(
                `${API_URL}/equipes/minha/integrantes`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        "Não foi possível carregar os integrantes."
                    )
                );
            }

            const data: Integrante[] = await response.json();

            setIntegrantes(data);
        } catch (error) {
            console.error(
                "Erro ao carregar integrantes:",
                error
            );

            setIntegrantes([]);
        } finally {
            setCarregandoIntegrantes(false);
        }
    }

    /*
     * =========================================================
     * BUSCAR CLIENTES DISPONÍVEIS
     * =========================================================
     */

    async function buscarClientesDisponiveis() {
        if (!podeGerenciarEquipe || !equipe) {
            return;
        }

        try {
            setCarregandoClientes(true);

            const token = obterToken();

            const response = await fetch(
                `${API_URL}/equipes/minha/clientes-disponiveis`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        "Não foi possível carregar os clientes disponíveis."
                    )
                );
            }

            const data: ClienteDisponivel[] =
                await response.json();

            setClientesDisponiveis(data);
        } catch (error) {
            console.error(
                "Erro ao carregar clientes disponíveis:",
                error
            );

            setClientesDisponiveis([]);
        } finally {
            setCarregandoClientes(false);
        }
    }

    /*
     * =========================================================
     * BUSCAR CONVITES PENDENTES
     * =========================================================
     */

    async function buscarConvites() {
        if (!podeGerenciarEquipe || !equipe) {
            setConvites([]);
            return;
        }

        try {
            const token = obterToken();

            const response = await fetch(
                `${API_URL}/equipes/${equipe.id}/convites`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        "Não foi possível carregar os convites."
                    )
                );
            }

            const data: Convite[] =
                await response.json();

            setConvites(data);
        } catch (error) {
            console.error(
                "Erro ao carregar convites:",
                error
            );

            setConvites([]);
        }
    }

    /*
     * =========================================================
     * CARREGAR DADOS DA PÁGINA
     * =========================================================
     */

    async function carregarDados() {
        try {
            setCarregando(true);
            setErro(null);

            const minhaEquipe =
                await buscarMinhaEquipe();

            setEquipe(minhaEquipe);

            if (!minhaEquipe) {
                setIntegrantes([]);
                setClientesDisponiveis([]);
                setConvites([]);
                return;
            }

            /*
             * Como buscarIntegrantes usa o estado equipe,
             * fazemos a chamada diretamente aqui para evitar
             * depender de uma atualização assíncrona do React.
             */

            const token = obterToken();

            const integrantesResponse =
                await fetch(
                    `${API_URL}/equipes/minha/integrantes`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (integrantesResponse.ok) {
                const integrantesData =
                    await integrantesResponse.json();

                setIntegrantes(integrantesData);
            }

            if (podeGerenciarEquipe) {
                const clientesResponse =
                    await fetch(
                        `${API_URL}/equipes/minha/clientes-disponiveis`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                if (clientesResponse.ok) {
                    const clientesData =
                        await clientesResponse.json();

                    setClientesDisponiveis(clientesData);
                }

                const convitesResponse =
                    await fetch(
                        `${API_URL}/equipes/${minhaEquipe.id}/convites`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                if (convitesResponse.ok) {
                    const convitesData =
                        await convitesResponse.json();

                    setConvites(convitesData);
                }
            }
        } catch (error) {
            console.error(
                "Erro ao carregar dados da equipe:",
                error
            );

            setEquipe(null);

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar os dados da equipe."
            );
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarDados();
    }, []);

    /*
     * =========================================================
     * ATUALIZAR DADOS
     * =========================================================
     */

    async function atualizarDados() {
        try {
            setAtualizando(true);
            setErro(null);

            const minhaEquipe =
                await buscarMinhaEquipe();

            setEquipe(minhaEquipe);

            if (!minhaEquipe) {
                setIntegrantes([]);
                setClientesDisponiveis([]);
                setConvites([]);
                return;
            }

            const token = obterToken();

            const integrantesResponse =
                await fetch(
                    `${API_URL}/equipes/minha/integrantes`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (integrantesResponse.ok) {
                setIntegrantes(
                    await integrantesResponse.json()
                );
            }

            if (podeGerenciarEquipe) {
                await Promise.all([
                    buscarClientesDisponiveis(),
                    buscarConvites(),
                ]);
            }
        } catch (error) {
            console.error(
                "Erro ao atualizar equipe:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível atualizar os dados."
            );
        } finally {
            setAtualizando(false);
        }
    }

    /*
     * =========================================================
     * LIMPAR FORMULÁRIO
     * =========================================================
     */

    function limparFormularioEquipe() {
        setNomeEquipe("");
        setFoto(null);
        setBanner(null);
        setFotoPreview(null);
        setBannerPreview(null);
    }

    /*
     * =========================================================
     * ABRIR MODAL DE CRIAÇÃO
     * =========================================================
     */

    function abrirModalCriacao() {
        limparFormularioEquipe();

        setErro(null);
        setModalEquipeModo("criacao");
        setModalAberto(true);
    }

    /*
     * =========================================================
     * ABRIR MODAL DE EDIÇÃO
     * =========================================================
     */

    function abrirModalEdicao() {
        if (!equipe) {
            return;
        }

        setNomeEquipe(equipe.nome);

        setFoto(null);
        setBanner(null);

        setFotoPreview(
            equipe.fotoBase64 || null
        );

        setBannerPreview(
            equipe.bannerBase64 || null
        );

        setErro(null);

        setModalEquipeModo("edicao");
        setModalAberto(true);
    }

    /*
     * =========================================================
     * FECHAR MODAL DE EQUIPE
     * =========================================================
     */

    function fecharModalEquipe() {
        if (salvandoEquipe) {
            return;
        }

        setModalAberto(false);
        limparFormularioEquipe();
    }

    /*
     * =========================================================
     * SELECIONAR FOTO
     * =========================================================
     */

    function selecionarFoto(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const arquivo =
            event.target.files?.[0];

        if (!arquivo) {
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            setErro(
                "A foto precisa ser uma imagem."
            );

            return;
        }

        setFoto(arquivo);

        const preview =
            URL.createObjectURL(arquivo);

        setFotoPreview(preview);
        setErro(null);
    }

    /*
     * =========================================================
     * SELECIONAR BANNER
     * =========================================================
     */

    function selecionarBanner(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const arquivo =
            event.target.files?.[0];

        if (!arquivo) {
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            setErro(
                "O banner precisa ser uma imagem."
            );

            return;
        }

        setBanner(arquivo);

        const preview =
            URL.createObjectURL(arquivo);

        setBannerPreview(preview);
        setErro(null);
    }

    /*
     * =========================================================
     * UPLOAD DA FOTO
     * =========================================================
     */

    async function enviarFoto(
        equipeId: string,
        arquivo: File
    ) {
        const token = obterToken();

        const formData = new FormData();

        formData.append("file", arquivo);

        const response = await fetch(
            `${API_URL}/equipes/${equipeId}/foto`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(
                await obterMensagemErro(
                    response,
                    "Não foi possível atualizar a foto da equipe."
                )
            );
        }

        return await response.json();
    }

    /*
     * =========================================================
     * UPLOAD DO BANNER
     * =========================================================
     */

    async function enviarBanner(
        equipeId: string,
        arquivo: File
    ) {
        const token = obterToken();

        const formData = new FormData();

        formData.append("file", arquivo);

        const response = await fetch(
            `${API_URL}/equipes/${equipeId}/banner`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(
                await obterMensagemErro(
                    response,
                    "Não foi possível atualizar o banner da equipe."
                )
            );
        }

        return await response.json();
    }

    /*
     * =========================================================
     * CRIAR EQUIPE
     * =========================================================
     */

    async function criarEquipe() {
        const nome = nomeEquipe.trim();

        if (!nome) {
            setErro(
                "Digite um nome para a equipe."
            );

            return;
        }

        try {
            setSalvandoEquipe(true);
            setErro(null);

            const token = obterToken();

            /*
             * O backend recebe EquipeRequestDTO em JSON.
             */
            const response = await fetch(
                `${API_URL}/equipes`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nome,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        "Não foi possível criar a equipe."
                    )
                );
            }

            let equipeCriada: Equipe =
                await response.json();

            /*
             * Foto e banner são enviados depois da criação,
             * porque possuem endpoints próprios no backend.
             */
            if (foto) {
                equipeCriada =
                    await enviarFoto(
                        equipeCriada.id,
                        foto
                    );
            }

            if (banner) {
                equipeCriada =
                    await enviarBanner(
                        equipeCriada.id,
                        banner
                    );
            }

            setEquipe(equipeCriada);

            setModalAberto(false);
            limparFormularioEquipe();

            await atualizarDados();
        } catch (error) {
            console.error(
                "Erro ao criar equipe:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível criar a equipe."
            );
        } finally {
            setSalvandoEquipe(false);
        }
    }

    /*
     * =========================================================
     * EDITAR EQUIPE
     * =========================================================
     */

    async function editarEquipe() {
        if (!equipe) {
            return;
        }

        const nome = nomeEquipe.trim();

        if (!nome) {
            setErro(
                "Digite um nome para a equipe."
            );

            return;
        }

        try {
            setSalvandoEquipe(true);
            setErro(null);

            const token = obterToken();

            /*
             * 1. Atualiza o nome
             */
            const nomeResponse =
                await fetch(
                    `${API_URL}/equipes/${equipe.id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            nome,
                        }),
                    }
                );

            if (!nomeResponse.ok) {
                throw new Error(
                    await obterMensagemErro(
                        nomeResponse,
                        "Não foi possível atualizar o nome da equipe."
                    )
                );
            }

            let equipeAtualizada: Equipe =
                await nomeResponse.json();

            /*
             * 2. Atualiza foto, se uma nova foi selecionada
             */
            if (foto) {
                equipeAtualizada =
                    await enviarFoto(
                        equipe.id,
                        foto
                    );
            }

            /*
             * 3. Atualiza banner, se um novo foi selecionado
             */
            if (banner) {
                equipeAtualizada =
                    await enviarBanner(
                        equipe.id,
                        banner
                    );
            }

            setEquipe(equipeAtualizada);

            setModalAberto(false);
            limparFormularioEquipe();

            await atualizarDados();
        } catch (error) {
            console.error(
                "Erro ao editar equipe:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível editar a equipe."
            );
        } finally {
            setSalvandoEquipe(false);
        }
    }

    /*
     * =========================================================
     * SALVAR EQUIPE
     * =========================================================
     */

    function salvarEquipe() {
        if (modalEquipeModo === "edicao") {
            editarEquipe();
            return;
        }

        criarEquipe();
    }

    /*
     * =========================================================
     * ABRIR MODAL DE CONVITE
     * =========================================================
     */

    async function abrirModalConvite() {
        if (!equipe) {
            return;
        }

        setClienteSelecionado("");
        setErro(null);
        setModalConviteAberto(true);

        await buscarClientesDisponiveis();
    }

    /*
     * =========================================================
     * FECHAR MODAL DE CONVITE
     * =========================================================
     */

    function fecharModalConvite() {
        if (enviandoConvite) {
            return;
        }

        setModalConviteAberto(false);
        setClienteSelecionado("");
    }

    /*
     * =========================================================
     * ENVIAR CONVITE
     * =========================================================
     */

    async function enviarConvite() {
        if (!equipe) {
            return;
        }

        if (!clienteSelecionado) {
            setErro(
                "Selecione um usuário para convidar."
            );

            return;
        }

        try {
            setEnviandoConvite(true);
            setErro(null);

            const token = obterToken();

            const response = await fetch(
                `${API_URL}/equipes/${equipe.id}/convites/${clienteSelecionado}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        "Não foi possível enviar o convite."
                    )
                );
            }

            setModalConviteAberto(false);
            setClienteSelecionado("");

            await Promise.all([
                buscarClientesDisponiveis(),
                buscarConvites(),
            ]);
        } catch (error) {
            console.error(
                "Erro ao enviar convite:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível enviar o convite."
            );
        } finally {
            setEnviandoConvite(false);
        }
    }

    /*
     * =========================================================
     * REMOVER INTEGRANTE
     * =========================================================
     */

    async function removerIntegrante(
        usuarioId: string
    ) {
        if (!equipe) {
            return;
        }

        const integrante =
            integrantes.find(
                (item) => item.id === usuarioId
            );

        if (!integrante) {
            return;
        }

        const confirmar =
            window.confirm(
                `Deseja realmente remover ${integrante.nome} da equipe?`
            );

        if (!confirmar) {
            return;
        }

        try {
            setRemovendoIntegranteId(usuarioId);
            setErro(null);

            const token = obterToken();

            const response =
                await fetch(
                    `${API_URL}/equipes/${equipe.id}/integrantes/${usuarioId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        "Não foi possível remover o integrante."
                    )
                );
            }

            await Promise.all([
                buscarIntegrantes(),
                buscarClientesDisponiveis(),
            ]);
        } catch (error) {
            console.error(
                "Erro ao remover integrante:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível remover o integrante."
            );
        } finally {
            setRemovendoIntegranteId(null);
        }
    }

    /*
     * =========================================================
     * TÉCNICO SAIR DA EQUIPE
     * =========================================================
     */

    async function sairDaEquipe() {
        const confirmar =
            window.confirm(
                "Deseja realmente sair desta equipe?"
            );

        if (!confirmar) {
            return;
        }

        try {
            setSaindoDaEquipe(true);
            setErro(null);

            const token = obterToken();

            const response =
                await fetch(
                    `${API_URL}/equipes/minha/integrantes`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        "Não foi possível sair da equipe."
                    )
                );
            }

            setEquipe(null);
            setIntegrantes([]);
            setClientesDisponiveis([]);
            setConvites([]);
        } catch (error) {
            console.error(
                "Erro ao sair da equipe:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível sair da equipe."
            );
        } finally {
            setSaindoDaEquipe(false);
        }
    }

    /*
     * =========================================================
     * ESC PARA FECHAR MODAIS
     * =========================================================
     */

    useEffect(() => {
        function handleEscape(
            event: KeyboardEvent
        ) {
            if (event.key !== "Escape") {
                return;
            }

            if (
                modalAberto &&
                !salvandoEquipe
            ) {
                fecharModalEquipe();
            }

            if (
                modalConviteAberto &&
                !enviandoConvite
            ) {
                fecharModalConvite();
            }
        }

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [
        modalAberto,
        salvandoEquipe,
        modalConviteAberto,
        enviandoConvite,
    ]);

    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <>

            <main className="equipe-page">

                {/* =====================================================
                    CABEÇALHO
                ====================================================== */}

                <header className="equipe-page-header">

                    <div>
                        <span className="equipe-page-kicker">
                            Equipe
                        </span>

                        <h1 className="equipe-page-title">
                            Minha equipe
                        </h1>

                        <p className="equipe-page-subtitle">
                            Visualize e gerencie os integrantes da sua equipe.
                        </p>
                    </div>

                    <div className="equipe-header-actions">
                        {equipe && (
                            <button
                                type="button"
                                className="equipe-button equipe-secondary-button"
                                onClick={atualizarDados}
                                disabled={atualizando}
                            >
                                <Refresh01Icon size={17} />

                                {atualizando
                                    ? "Atualizando..."
                                    : "Atualizar"}
                            </button>
                        )}

                        {podeGerenciarEquipe && equipe && (
                            <button
                                type="button"
                                className="equipe-button equipe-primary-button"
                                onClick={abrirModalConvite}
                            >
                                <UserAdd01Icon size={18} />
                                Convidar usuário
                            </button>
                        )}
                    </div>

                </header>

                {/* =====================================================
                    ERRO
                ====================================================== */}

                {erro && !modalAberto && !modalConviteAberto && (
                    <div className="equipe-error">
                        {erro}
                    </div>
                )}

                {/* =====================================================
                    LOADING
                ====================================================== */}

                {carregando ? (

                    <section className="equipe-card equipe-loading">
                        Carregando equipe...
                    </section>

                ) : !equipe ? (

                    /*
                     * =================================================
                     * SEM EQUIPE
                     * =================================================
                     */

                    <section className="equipe-members-section">

                        <div className="equipe-card equipe-empty-card">

                            <UserGroupIcon size={42} />

                            <h3>
                                Você ainda não possui uma equipe
                            </h3>

                            <p>
                                {isTecnico
                                    ? "Você ainda não está vinculado a nenhuma equipe."
                                    : "Crie sua equipe para começar a organizar os integrantes e gerenciar sua produção."}
                            </p>

                            {podeGerenciarEquipe && (
                                <button
                                    type="button"
                                    className="equipe-button equipe-primary-button"
                                    onClick={abrirModalCriacao}
                                >
                                    <UserGroupIcon size={18} />
                                    Criar equipe
                                </button>
                            )}

                        </div>

                    </section>

                ) : (

                    /*
                     * =================================================
                     * EQUIPE EXISTENTE
                     * =================================================
                     */

                    <>

                        {/* =================================================
                            HEADER DA EQUIPE
                        ================================================== */}

                        <section
                            className="equipe-card equipe-header-card"
                        >

                            <div className="equipe-banner">

                                {equipe.bannerBase64 ? (

                                    <img
                                        src={
                                            equipe.bannerBase64
                                        }
                                        alt="Banner da equipe"
                                        className="equipe-banner-image"
                                    />

                                ) : (

                                    <div className="equipe-banner-placeholder" />

                                )}

                            </div>

                            <div className="equipe-info">

                                <div className="equipe-avatar">

                                    {equipe.fotoBase64 ? (

                                        <img
                                            src={
                                                equipe.fotoBase64
                                            }
                                            alt={
                                                `Foto da equipe ${equipe.nome}`
                                            }
                                            className="equipe-avatar-image"
                                        />

                                    ) : (

                                        <UserGroupIcon
                                            size={30}
                                        />

                                    )}

                                </div>

                                <div className="equipe-info-text">

                                    <h2>
                                        {equipe.nome}
                                    </h2>

                                    <p>
                                        Equipe de produção e desenvolvimento
                                    </p>

                                </div>

                                <div className="equipe-info-actions">

                                    {podeGerenciarEquipe && (
                                        <button
                                            type="button"
                                            className="equipe-button equipe-secondary-button"
                                            onClick={abrirModalEdicao}
                                        >
                                            Editar equipe
                                        </button>
                                    )}

                                    {isTecnico && (
                                        <button
                                            type="button"
                                            className="equipe-button equipe-danger-button"
                                            onClick={sairDaEquipe}
                                            disabled={saindoDaEquipe}
                                        >
                                            <UserRemove01Icon size={17} />

                                            {saindoDaEquipe
                                                ? "Saindo..."
                                                : "Sair da equipe"}
                                        </button>
                                    )}

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            INTEGRANTES
                        ================================================== */}

                        <section className="equipe-members-section">

                            <div className="equipe-section-header">

                                <div>

                                    <h2>
                                        Integrantes
                                    </h2>

                                    <p>
                                        Pessoas que fazem parte desta equipe.
                                    </p>

                                </div>

                                <span className="equipe-member-count">
                                    {integrantes.length}{" "}
                                    {integrantes.length === 1
                                        ? "integrante"
                                        : "integrantes"}
                                </span>

                            </div>

                            <div className="equipe-card">

                                {carregandoIntegrantes ? (

                                    <div className="equipe-loading">
                                        Carregando integrantes...
                                    </div>

                                ) : integrantes.length === 0 ? (

                                    <div className="equipe-empty-card">

                                        <UserGroupIcon size={34} />

                                        <h3>
                                            Nenhum integrante ainda
                                        </h3>

                                        <p>
                                            {podeGerenciarEquipe
                                                ? "Convide usuários para começar a montar sua equipe."
                                                : "Nenhum integrante encontrado."}
                                        </p>

                                        {podeGerenciarEquipe && (
                                            <button
                                                type="button"
                                                className="equipe-button equipe-primary-button"
                                                onClick={abrirModalConvite}
                                            >
                                                <UserAdd01Icon size={18} />
                                                Convidar primeiro integrante
                                            </button>
                                        )}

                                    </div>

                                ) : (

                                    <div className="equipe-list">

                                        {integrantes.map(
                                            (integrante) => (

                                                <div
                                                    className="equipe-member"
                                                    key={integrante.id}
                                                >

                                                    <div className="equipe-member-avatar">
                                                        <UserGroupIcon
                                                            size={20}
                                                        />
                                                    </div>

                                                    <div className="equipe-member-main">

                                                        <p className="equipe-member-name">
                                                            {integrante.nome}
                                                        </p>

                                                        <div className="equipe-member-email">
                                                            {integrante.email}
                                                        </div>

                                                    </div>

                                                    <span className="equipe-member-role">
                                                        {integrante.role}
                                                    </span>

                                                    {podeGerenciarEquipe && (
                                                        <div className="equipe-member-actions">

                                                            <button
                                                                type="button"
                                                                className="equipe-icon-button"
                                                                title="Remover integrante"
                                                                onClick={() =>
                                                                    removerIntegrante(
                                                                        integrante.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    removendoIntegranteId ===
                                                                    integrante.id
                                                                }
                                                            >
                                                                <UserRemove01Icon
                                                                    size={17}
                                                                />
                                                            </button>

                                                        </div>
                                                    )}

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                        </section>

                        {/* =================================================
                            CONVITES PENDENTES
                        ================================================== */}

                        {podeGerenciarEquipe && (
                            <section className="equipe-members-section equipe-invites-card">

                                <div className="equipe-section-header">

                                    <div>

                                        <h2>
                                            Convites pendentes
                                        </h2>

                                        <p>
                                            Usuários que ainda precisam responder ao convite.
                                        </p>

                                    </div>

                                    <span className="equipe-member-count">
                                        {convites.length}{" "}
                                        {convites.length === 1
                                            ? "convite"
                                            : "convites"}
                                    </span>

                                </div>

                                <div className="equipe-card">

                                    {convites.length === 0 ? (

                                        <div className="equipe-empty-invites">
                                            Nenhum convite pendente.
                                        </div>

                                    ) : (

                                        convites.map(
                                            (convite) => (

                                                <div
                                                    className="equipe-invite-item"
                                                    key={convite.id}
                                                >

                                                    <div className="equipe-invite-icon">
                                                        <Mail01Icon
                                                            size={19}
                                                        />
                                                    </div>

                                                    <div className="equipe-invite-main">

                                                        <p className="equipe-invite-name">
                                                            {convite.usuarioNome ||
                                                                "Usuário"}
                                                        </p>

                                                        <p className="equipe-invite-date">
                                                            Expira em{" "}
                                                            {new Date(
                                                                convite.expiraEm
                                                            ).toLocaleString(
                                                                "pt-BR"
                                                            )}
                                                        </p>

                                                    </div>

                                                    <span className="equipe-pending-badge">
                                                        Pendente
                                                    </span>

                                                </div>

                                            )
                                        )

                                    )}

                                </div>

                            </section>
                        )}

                    </>

                )}

            </main>

            {/* =========================================================
                MODAL DE CRIAÇÃO / EDIÇÃO DA EQUIPE
            ========================================================== */}

            {modalAberto && (

                <div
                    className="equipe-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharModalEquipe();
                        }

                    }}
                >

                    <div className="equipe-modal">

                        <div className="equipe-modal-header">

                            <div>

                                <h2>
                                    {modalEquipeModo === "edicao"
                                        ? "Editar equipe"
                                        : "Criar equipe"}
                                </h2>

                                <p>
                                    {modalEquipeModo === "edicao"
                                        ? "Atualize as informações da sua equipe."
                                        : "Configure as informações iniciais da sua equipe."}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="equipe-modal-close"
                                onClick={
                                    fecharModalEquipe
                                }
                                disabled={
                                    salvandoEquipe
                                }
                            >
                                <Cancel01Icon size={19} />
                            </button>

                        </div>

                        <div className="equipe-modal-body">

                            {erro && (
                                <div className="equipe-error">
                                    {erro}
                                </div>
                            )}

                            {/* NOME */}

                            <div className="equipe-form-group">

                                <label
                                    htmlFor="nome-equipe"
                                    className="equipe-form-label"
                                >
                                    Nome da equipe
                                </label>

                                <input
                                    id="nome-equipe"
                                    type="text"
                                    className="equipe-form-input"
                                    placeholder="Ex.: Equipe Synapse"
                                    value={
                                        nomeEquipe
                                    }
                                    onChange={(event) =>
                                        setNomeEquipe(
                                            event.target.value
                                        )
                                    }
                                    maxLength={100}
                                    disabled={
                                        salvandoEquipe
                                    }
                                />

                            </div>

                            {/* UPLOADS */}

                            <div className="equipe-upload-grid">

                                {/* FOTO */}

                                <div className="equipe-upload-box">

                                    <span className="equipe-form-label">
                                        Foto da equipe
                                    </span>

                                    <label className="equipe-upload-label">

                                        {fotoPreview ? (

                                            <img
                                                src={
                                                    fotoPreview
                                                }
                                                alt="Preview da foto"
                                                className="equipe-upload-preview"
                                            />

                                        ) : (

                                            <div className="equipe-upload-label-content">

                                                <Image01Icon
                                                    size={28}
                                                />

                                                <span>
                                                    {modalEquipeModo ===
                                                    "edicao"
                                                        ? "Trocar foto"
                                                        : "Selecionar foto"}
                                                </span>

                                            </div>

                                        )}

                                        <input
                                            type="file"
                                            className="equipe-upload-input"
                                            accept="image/*"
                                            onChange={
                                                selecionarFoto
                                            }
                                            disabled={
                                                salvandoEquipe
                                            }
                                        />

                                    </label>

                                    {foto && (
                                        <span className="equipe-upload-name">
                                            {foto.name}
                                        </span>
                                    )}

                                </div>

                                {/* BANNER */}

                                <div className="equipe-upload-box">

                                    <span className="equipe-form-label">
                                        Banner da equipe
                                    </span>

                                    <label className="equipe-upload-label">

                                        {bannerPreview ? (

                                            <img
                                                src={
                                                    bannerPreview
                                                }
                                                alt="Preview do banner"
                                                className="equipe-upload-preview"
                                            />

                                        ) : (

                                            <div className="equipe-upload-label-content">

                                                <Image01Icon
                                                    size={28}
                                                />

                                                <span>
                                                    {modalEquipeModo ===
                                                    "edicao"
                                                        ? "Trocar banner"
                                                        : "Selecionar banner"}
                                                </span>

                                            </div>

                                        )}

                                        <input
                                            type="file"
                                            className="equipe-upload-input"
                                            accept="image/*"
                                            onChange={
                                                selecionarBanner
                                            }
                                            disabled={
                                                salvandoEquipe
                                            }
                                        />

                                    </label>

                                    {banner && (
                                        <span className="equipe-upload-name">
                                            {banner.name}
                                        </span>
                                    )}

                                </div>

                            </div>

                        </div>

                        <div className="equipe-modal-footer">

                            <button
                                type="button"
                                className="equipe-modal-cancel"
                                onClick={
                                    fecharModalEquipe
                                }
                                disabled={
                                    salvandoEquipe
                                }
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="equipe-button equipe-primary-button"
                                onClick={
                                    salvarEquipe
                                }
                                disabled={
                                    salvandoEquipe
                                }
                            >
                                {salvandoEquipe
                                    ? modalEquipeModo ===
                                      "edicao"
                                        ? "Salvando..."
                                        : "Criando..."
                                    : modalEquipeModo ===
                                      "edicao"
                                        ? "Salvar alterações"
                                        : "Criar equipe"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =========================================================
                MODAL DE CONVITE
            ========================================================== */}

            {modalConviteAberto && (

                <div
                    className="equipe-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharModalConvite();
                        }

                    }}
                >

                    <div className="equipe-modal equipe-modal-small">

                        <div className="equipe-modal-header">

                            <div>

                                <h2>
                                    Convidar usuário
                                </h2>

                                <p>
                                    Escolha um cliente para enviar um convite para esta equipe.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="equipe-modal-close"
                                onClick={
                                    fecharModalConvite
                                }
                                disabled={
                                    enviandoConvite
                                }
                            >
                                <Cancel01Icon size={19} />
                            </button>

                        </div>

                        <div className="equipe-modal-body">

                            {erro && (
                                <div className="equipe-error">
                                    {erro}
                                </div>
                            )}

                            <div className="equipe-form-group">

                                <span className="equipe-form-label">
                                    Clientes disponíveis
                                </span>

                                {carregandoClientes ? (

                                    <div className="equipe-loading-clients">
                                        Carregando clientes...
                                    </div>

                                ) : clientesDisponiveis.length === 0 ? (

                                    <div className="equipe-empty-clients">
                                        Não há clientes disponíveis para convite.
                                    </div>

                                ) : (

                                    <div className="equipe-client-list">

                                        {clientesDisponiveis.map(
                                            (cliente) => (

                                                <button
                                                    type="button"
                                                    key={cliente.id}
                                                    className={
                                                        "equipe-client-option" +
                                                        (clienteSelecionado ===
                                                        cliente.id
                                                            ? " selected"
                                                            : "")
                                                    }
                                                    onClick={() =>
                                                        setClienteSelecionado(
                                                            cliente.id
                                                        )
                                                    }
                                                    disabled={
                                                        enviandoConvite
                                                    }
                                                >

                                                    <div className="equipe-client-avatar">
                                                        <UserGroupIcon
                                                            size={19}
                                                        />
                                                    </div>

                                                    <div className="equipe-client-info">

                                                        <strong>
                                                            {cliente.nome}
                                                        </strong>

                                                        <span>
                                                            {cliente.email}
                                                        </span>

                                                    </div>

                                                </button>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                        </div>

                        <div className="equipe-modal-footer">

                            <button
                                type="button"
                                className="equipe-modal-cancel"
                                onClick={
                                    fecharModalConvite
                                }
                                disabled={
                                    enviandoConvite
                                }
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="equipe-button equipe-primary-button"
                                onClick={
                                    enviarConvite
                                }
                                disabled={
                                    enviandoConvite ||
                                    !clienteSelecionado ||
                                    clientesDisponiveis.length === 0
                                }
                            >
                                <Mail01Icon size={17} />

                                {enviandoConvite
                                    ? "Enviando..."
                                    : "Enviar convite"}
                            </button>

                        </div>

                    </div>

                </div>

            )}
        </>
    );
}

export default EquipePage;