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
    Edit02Icon,
} from "hugeicons-react";

import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import "./EquipePage.css";

import { getUserRole, getToken } from "../hooks/useAuth";
import {
    buscarClientePorEmail as buscarClientePorEmailApi,
    type ClienteResumo,
} from "../services/UserService";

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
    funcaoVisual?: string | null;
}

/** Resultado da busca de cliente por e-mail exato (convite de equipe). */
type ClienteEncontrado = ClienteResumo;

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
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();

    // Chegou aqui redirecionado (login de gerente sem equipe ou 403 SEM_EQUIPE).
    const vindoSemEquipe = searchParams.get("semEquipe") === "1";

    const role = getUserRole();

    const isGerente = role === "GERENTE";
    const isTecnico = role === "TECNICO";
    const isAdmin = role === "ADMIN";

    const podeGerenciarEquipe = isGerente || isAdmin;

    const [equipe, setEquipe] = useState<Equipe | null>(null);

    const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
    const [carregandoIntegrantes, setCarregandoIntegrantes] =
        useState(false);

    const [emailConvite, setEmailConvite] = useState("");
    const [clienteEncontrado, setClienteEncontrado] =
        useState<ClienteEncontrado | null>(null);
    const [clienteNaoEncontrado, setClienteNaoEncontrado] =
        useState(false);

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
    const [bannerPreview, setBannerPreview] =
        useState<string | null>(null);

    const [salvandoEquipe, setSalvandoEquipe] = useState(false);

    const [buscandoCliente, setBuscandoCliente] =
        useState(false);
    const [enviandoConvite, setEnviandoConvite] = useState(false);

    const [clienteSelecionado, setClienteSelecionado] = useState("");

    const [removendoIntegranteId, setRemovendoIntegranteId] =
        useState<string | null>(null);

    const [saindoDaEquipe, setSaindoDaEquipe] = useState(false);

    const [atualizando, setAtualizando] = useState(false);

    const [funcaoVisualEditando, setFuncaoVisualEditando] =
        useState<string | null>(null);

    const [funcaoVisualValor, setFuncaoVisualValor] =
        useState("");

    const [salvandoFuncaoVisual, setSalvandoFuncaoVisual] =
        useState(false);

    /*
     * =========================================================
     * HELPERS
     * =========================================================
     */

    function obterToken(): string {
        const token = getToken();

        if (!token) {
            throw new Error(
                t("equipe.errors.sessionExpired")
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

    function formatarData(data: string): string {
        return new Date(data).toLocaleString(
            i18n.language === "en-US"
                ? "en-US"
                : "pt-BR"
        );
    }

    function traduzirRole(roleIntegrante: string): string {
        const roleNormalizada =
            roleIntegrante?.toUpperCase();

        const chaveRole =
            `equipe.roles.${roleNormalizada}`;

        const traducao = t(chaveRole);

        if (traducao !== chaveRole) {
            return traducao;
        }

        return roleIntegrante;
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
                    t("equipe.errors.loadTeam")
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
                        t("equipe.errors.loadMembers")
                    )
                );
            }

            const data: Integrante[] =
                await response.json();

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

    /*
     * A busca é por e-mail exato: o gerente não vê uma lista de clientes
     * da plataforma, só confirma a pessoa cujo e-mail já conhece.
     */
    async function buscarClientePorEmail() {
        const email = emailConvite.trim();

        if (!email) {
            return;
        }

        try {
            setBuscandoCliente(true);
            setErro(null);
            setClienteEncontrado(null);
            setClienteNaoEncontrado(false);
            setClienteSelecionado("");

            const data = await buscarClientePorEmailApi(
                email,
                obterToken()
            );

            if (!data) {
                setClienteNaoEncontrado(true);
                return;
            }

            setClienteEncontrado(data);
            setClienteSelecionado(data.id);
        } catch (error) {
            console.error(
                "Erro ao buscar cliente por e-mail:",
                error
            );

            setErro(t("equipe.errors.searchClient"));
        } finally {
            setBuscandoCliente(false);
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
                        t("equipe.errors.loadInvites")
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

    // Só roda na montagem: `carregando` já nasce true e `erro` nasce null, então
    // nenhum setState antes do primeiro await (regra set-state-in-effect).
    async function carregarDados() {
        try {
            const minhaEquipe =
                await buscarMinhaEquipe();

            setEquipe(minhaEquipe);

            if (!minhaEquipe) {
                setIntegrantes([]);
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
                    : t("equipe.errors.loadData")
            );
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        // Declarada aqui dentro para que o `await` fique visível ao analisador.
        async function carregarNaMontagem() {
            await carregarDados();
        }
        void carregarNaMontagem();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                await buscarConvites();
            }
        } catch (error) {
            console.error(
                "Erro ao atualizar equipe:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : t("equipe.errors.updateData")
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
                t("equipe.errors.photoMustBeImage")
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
                t("equipe.errors.bannerMustBeImage")
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
                    t("equipe.errors.updatePhoto")
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
                    t("equipe.errors.updateBanner")
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
                t("equipe.errors.teamNameRequired")
            );

            return;
        }

        try {
            setSalvandoEquipe(true);
            setErro(null);

            const token = obterToken();

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
                        t("equipe.errors.createTeam")
                    )
                );
            }

            let equipeCriada: Equipe =
                await response.json();

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
                    : t("equipe.errors.createTeam")
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
                t("equipe.errors.teamNameRequired")
            );

            return;
        }

        try {
            setSalvandoEquipe(true);
            setErro(null);

            const token = obterToken();

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
                        t("equipe.errors.updateTeamName")
                    )
                );
            }

            let equipeAtualizada: Equipe =
                await nomeResponse.json();

            if (foto) {
                equipeAtualizada =
                    await enviarFoto(
                        equipe.id,
                        foto
                    );
            }

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
                    : t("equipe.errors.editTeam")
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

        limparBuscaConvite();
        setErro(null);
        setModalConviteAberto(true);
    }

    function limparBuscaConvite() {
        setEmailConvite("");
        setClienteEncontrado(null);
        setClienteNaoEncontrado(false);
        setClienteSelecionado("");
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
        limparBuscaConvite();
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
                t("equipe.errors.selectUser")
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
                        t("equipe.errors.sendInvite")
                    )
                );
            }

            setModalConviteAberto(false);
            limparBuscaConvite();

            await buscarConvites();
        } catch (error) {
            console.error(
                "Erro ao enviar convite:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : t("equipe.errors.sendInvite")
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
                t("equipe.confirm.removeMember", {
                    name: integrante.nome,
                })
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
                        t("equipe.errors.removeMember")
                    )
                );
            }

            await buscarIntegrantes();
        } catch (error) {
            console.error(
                "Erro ao remover integrante:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : t("equipe.errors.removeMember")
            );
        } finally {
            setRemovendoIntegranteId(null);
        }
    }

    /*
     * =========================================================
     * EDITAR FUNÇÃO VISUAL
     * =========================================================
     */

    function iniciarEdicaoFuncaoVisual(
        integrante: Integrante
    ) {
        if (!isGerente && !isAdmin) {
            return;
        }

        setFuncaoVisualEditando(integrante.id);
        setFuncaoVisualValor(
            integrante.funcaoVisual ?? ""
        );
        setErro(null);
    }

    function cancelarEdicaoFuncaoVisual() {
        if (salvandoFuncaoVisual) {
            return;
        }

        setFuncaoVisualEditando(null);
        setFuncaoVisualValor("");
    }

    async function salvarFuncaoVisual(
        usuarioId: string
    ) {
        if (!isGerente && !isAdmin) {
            return;
        }

        try {
            setSalvandoFuncaoVisual(true);
            setErro(null);

            const token = obterToken();

            const response = await fetch(
                `${API_URL}/equipes/minha/integrantes/${usuarioId}/funcao-visual`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(
                        funcaoVisualValor.trim()
                    ),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await obterMensagemErro(
                        response,
                        i18n.language === "en-US"
                            ? "Could not update the visual function."
                            : "Não foi possível atualizar a função visual."
                    )
                );
            }

            const atualizado: Integrante =
                await response.json();

            setIntegrantes((anteriores) =>
                anteriores.map((integrante) =>
                    integrante.id === usuarioId
                        ? {
                              ...integrante,
                              funcaoVisual:
                                  atualizado.funcaoVisual,
                          }
                        : integrante
                )
            );

            setFuncaoVisualEditando(null);
            setFuncaoVisualValor("");
        } catch (error) {
            console.error(
                "Erro ao atualizar função visual:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : i18n.language === "en-US"
                        ? "Could not update the visual function."
                        : "Não foi possível atualizar a função visual."
            );
        } finally {
            setSalvandoFuncaoVisual(false);
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
                t("equipe.confirm.leaveTeam")
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
                        t("equipe.errors.leaveTeam")
                    )
                );
            }

            setEquipe(null);
            setIntegrantes([]);
            setConvites([]);
        } catch (error) {
            console.error(
                "Erro ao sair da equipe:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : t("equipe.errors.leaveTeam")
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
            <main className="dashboard-main equipe-page">
                <header className="equipe-page-header">
                    <div>
                        <h1 className="dashboard-title">
                            {t("equipe.title")}
                        </h1>

                        <p className="dashboard-subtitle">
                            {t("equipe.subtitle")}
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
                                    ? t("equipe.actions.refreshing")
                                    : t("equipe.actions.refresh")}
                            </button>
                        )}

                        {podeGerenciarEquipe && equipe && (
                            <button
                                type="button"
                                className="equipe-button equipe-primary-button"
                                onClick={abrirModalConvite}
                            >
                                <UserAdd01Icon size={18} />

                                {t("equipe.actions.inviteUser")}
                            </button>
                        )}
                    </div>
                </header>

                {erro &&
                    !modalAberto &&
                    !modalConviteAberto && (
                        <div className="equipe-error">
                            {erro}
                        </div>
                    )}

                {carregando ? (
                    <section className="equipe-card equipe-loading">
                        {t("equipe.loading.team")}
                    </section>
                ) : !equipe ? (
                    <section className="equipe-members-section">
                        {vindoSemEquipe && (
                            <div className="equipe-aviso" role="status">
                                {podeGerenciarEquipe
                                    ? t("equipe.empty.redirectNotice")
                                    : t("equipe.empty.redirectNoticeInvite")}
                            </div>
                        )}

                        <div className="equipe-card equipe-empty-card">
                            <UserGroupIcon size={42} />

                            <h3>
                                {t("equipe.empty.noTeamTitle")}
                            </h3>

                            <p>
                                {isTecnico
                                    ? t(
                                          "equipe.empty.technicianNoTeam"
                                      )
                                    : t(
                                          "equipe.empty.managerNoTeam"
                                      )}
                            </p>

                            {podeGerenciarEquipe && (
                                <button
                                    type="button"
                                    className="equipe-button equipe-primary-button"
                                    onClick={abrirModalCriacao}
                                >
                                    <UserGroupIcon size={18} />

                                    {t(
                                        "equipe.actions.createTeam"
                                    )}
                                </button>
                            )}
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="equipe-card equipe-header-card">
                            <div className="equipe-banner">
                                {equipe.bannerBase64 ? (
                                    <img
                                        src={equipe.bannerBase64}
                                        alt={t(
                                            "equipe.images.bannerAlt"
                                        )}
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
                                            src={equipe.fotoBase64}
                                            alt={t(
                                                "equipe.images.teamPhotoAlt",
                                                {
                                                    name: equipe.nome,
                                                }
                                            )}
                                            className="equipe-avatar-image"
                                        />
                                    ) : (
                                        <UserGroupIcon size={30} />
                                    )}
                                </div>

                                <div className="equipe-info-text">
                                    <h2>
                                        {equipe.nome}
                                    </h2>

                                    <p>
                                        {t(
                                            "equipe.teamDescription"
                                        )}
                                    </p>
                                </div>

                                <div className="equipe-info-actions">
                                    {podeGerenciarEquipe && (
                                        <button
                                            type="button"
                                            className="equipe-button equipe-secondary-button"
                                            onClick={abrirModalEdicao}
                                        >
                                            {t(
                                                "equipe.actions.editTeam"
                                            )}
                                        </button>
                                    )}

                                    {isTecnico && (
                                        <button
                                            type="button"
                                            className="equipe-button equipe-danger-button"
                                            onClick={sairDaEquipe}
                                            disabled={saindoDaEquipe}
                                        >
                                            <UserRemove01Icon
                                                size={17}
                                            />

                                            {saindoDaEquipe
                                                ? t(
                                                      "equipe.actions.leaving"
                                                  )
                                                : t(
                                                      "equipe.actions.leaveTeam"
                                                  )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="equipe-members-section">
                            <div className="equipe-section-header">
                                <div>
                                    <h2>
                                        {t(
                                            "equipe.members.title"
                                        )}
                                    </h2>

                                    <p>
                                        {t(
                                            "equipe.members.description"
                                        )}
                                    </p>
                                </div>

                                <span className="equipe-member-count">
                                    {integrantes.length}{" "}
                                    {integrantes.length === 1
                                        ? t(
                                              "equipe.members.member"
                                          )
                                        : t(
                                              "equipe.members.members"
                                          )}
                                </span>
                            </div>

                            <div className="equipe-card">
                                {carregandoIntegrantes ? (
                                    <div className="equipe-loading">
                                        {t(
                                            "equipe.loading.members"
                                        )}
                                    </div>
                                ) : integrantes.length === 0 ? (
                                    <div className="equipe-empty-card">
                                        <UserGroupIcon size={34} />

                                        <h3>
                                            {t(
                                                "equipe.members.emptyTitle"
                                            )}
                                        </h3>

                                        <p>
                                            {podeGerenciarEquipe
                                                ? t(
                                                      "equipe.members.emptyManager"
                                                  )
                                                : t(
                                                      "equipe.members.emptyTechnician"
                                                  )}
                                        </p>

                                        {podeGerenciarEquipe && (
                                            <button
                                                type="button"
                                                className="equipe-button equipe-primary-button"
                                                onClick={
                                                    abrirModalConvite
                                                }
                                            >
                                                <UserAdd01Icon
                                                    size={18}
                                                />

                                                {t(
                                                    "equipe.actions.inviteFirstMember"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="equipe-list">
                                        {integrantes.map(
                                            (integrante) => (
                                                <div
                                                    className="equipe-member"
                                                    key={
                                                        integrante.id
                                                    }
                                                >
                                                    <div className="equipe-member-avatar">
                                                        <UserGroupIcon
                                                            size={
                                                                20
                                                            }
                                                        />
                                                    </div>

                                                    <div className="equipe-member-main">
                                                        <p className="equipe-member-name">
                                                            {
                                                                integrante.nome
                                                            }
                                                        </p>

                                                        <div className="equipe-member-email">
                                                            {
                                                                integrante.email
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="equipe-member-info">
                                                        <span className="equipe-member-role">
                                                            {traduzirRole(
                                                                integrante.role
                                                            )}
                                                        </span>

                                                        {funcaoVisualEditando ===
                                                        integrante.id ? (
                                                            <div className="equipe-member-function-edit">
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        funcaoVisualValor
                                                                    }
                                                                    onChange={(event) =>
                                                                        setFuncaoVisualValor(
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    placeholder={
                                                                        i18n.language ===
                                                                        "en-US"
                                                                            ? "Visual function"
                                                                            : "Função visual"
                                                                    }
                                                                    maxLength={
                                                                        80
                                                                    }
                                                                    autoFocus
                                                                    disabled={
                                                                        salvandoFuncaoVisual
                                                                    }
                                                                />

                                                                <button
                                                                    type="button"
                                                                    className="equipe-function-save"
                                                                    onClick={() =>
                                                                        salvarFuncaoVisual(
                                                                            integrante.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        salvandoFuncaoVisual
                                                                    }
                                                                >
                                                                    {salvandoFuncaoVisual
                                                                        ? "..."
                                                                        : i18n.language ===
                                                                            "en-US"
                                                                            ? "Save"
                                                                            : "Salvar"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="equipe-function-cancel"
                                                                    onClick={
                                                                        cancelarEdicaoFuncaoVisual
                                                                    }
                                                                    disabled={
                                                                        salvandoFuncaoVisual
                                                                    }
                                                                >
                                                                    {i18n.language ===
                                                                    "en-US"
                                                                        ? "Cancel"
                                                                        : "Cancelar"}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="equipe-member-function">
                                                                {integrante.funcaoVisual?.trim()
                                                                    ? integrante.funcaoVisual
                                                                    : i18n.language ===
                                                                        "en-US"
                                                                        ? "Function not defined"
                                                                        : "Função não definida"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {podeGerenciarEquipe && (
                                                        <div className="equipe-member-actions">
                                                            {(isGerente ||
                                                                isAdmin) &&
                                                                funcaoVisualEditando !==
                                                                    integrante.id && (
                                                                    <button
                                                                        type="button"
                                                                        className="equipe-icon-button"
                                                                        title={
                                                                            i18n.language ===
                                                                            "en-US"
                                                                                ? "Edit visual function"
                                                                                : "Editar função visual"
                                                                        }
                                                                        aria-label={
                                                                            i18n.language ===
                                                                            "en-US"
                                                                                ? "Edit visual function"
                                                                                : "Editar função visual"
                                                                        }
                                                                        onClick={() =>
                                                                            iniciarEdicaoFuncaoVisual(
                                                                                integrante
                                                                            )
                                                                        }
                                                                    >
                                                                        <Edit02Icon
                                                                            size={
                                                                                17
                                                                            }
                                                                        />
                                                                    </button>
                                                                )}

                                                            <button
                                                                type="button"
                                                                className="equipe-icon-button"
                                                                title={t(
                                                                    "equipe.actions.removeMember"
                                                                )}
                                                                aria-label={t(
                                                                    "equipe.actions.removeMember"
                                                                )}
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
                                                                    size={
                                                                        17
                                                                    }
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

                        {podeGerenciarEquipe && (
                            <section className="equipe-members-section equipe-invites-card">
                                <div className="equipe-section-header">
                                    <div>
                                        <h2>
                                            {t(
                                                "equipe.invites.title"
                                            )}
                                        </h2>

                                        <p>
                                            {t(
                                                "equipe.invites.description"
                                            )}
                                        </p>
                                    </div>

                                    <span className="equipe-member-count">
                                        {convites.length}{" "}
                                        {convites.length === 1
                                            ? t(
                                                  "equipe.invites.invite"
                                              )
                                            : t(
                                                  "equipe.invites.invites"
                                              )}
                                    </span>
                                </div>

                                <div className="equipe-card">
                                    {convites.length === 0 ? (
                                        <div className="equipe-empty-invites">
                                            {t(
                                                "equipe.invites.empty"
                                            )}
                                        </div>
                                    ) : (
                                        convites.map(
                                            (convite) => (
                                                <div
                                                    className="equipe-invite-item"
                                                    key={
                                                        convite.id
                                                    }
                                                >
                                                    <div className="equipe-invite-icon">
                                                        <Mail01Icon
                                                            size={
                                                                19
                                                            }
                                                        />
                                                    </div>

                                                    <div className="equipe-invite-main">
                                                        <p className="equipe-invite-name">
                                                            {convite.usuarioNome ||
                                                                t(
                                                                    "equipe.invites.defaultUser"
                                                                )}
                                                        </p>

                                                        <p className="equipe-invite-date">
                                                            {t(
                                                                "equipe.invites.expiresAt",
                                                                {
                                                                    date: formatarData(
                                                                        convite.expiraEm
                                                                    ),
                                                                }
                                                            )}
                                                        </p>
                                                    </div>

                                                    <span className="equipe-pending-badge">
                                                        {t(
                                                            "equipe.invites.pending"
                                                        )}
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
                                        ? t(
                                              "equipe.modal.editTitle"
                                          )
                                        : t(
                                              "equipe.modal.createTitle"
                                          )}
                                </h2>

                                <p>
                                    {modalEquipeModo === "edicao"
                                        ? t(
                                              "equipe.modal.editDescription"
                                          )
                                        : t(
                                              "equipe.modal.createDescription"
                                          )}
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
                                aria-label={t(
                                    "equipe.actions.close"
                                )}
                                title={t(
                                    "equipe.actions.close"
                                )}
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
                                <label
                                    htmlFor="nome-equipe"
                                    className="equipe-form-label"
                                >
                                    {t(
                                        "equipe.form.teamName"
                                    )}
                                </label>

                                <input
                                    id="nome-equipe"
                                    type="text"
                                    className="equipe-form-input"
                                    placeholder={t(
                                        "equipe.form.teamNamePlaceholder"
                                    )}
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

                            <div className="equipe-upload-grid">
                                <div className="equipe-upload-box">
                                    <span className="equipe-form-label">
                                        {t(
                                            "equipe.form.teamPhoto"
                                        )}
                                    </span>

                                    <label className="equipe-upload-label">
                                        {fotoPreview ? (
                                            <img
                                                src={
                                                    fotoPreview
                                                }
                                                alt={t(
                                                    "equipe.images.photoPreviewAlt"
                                                )}
                                                className="equipe-upload-preview"
                                            />
                                        ) : (
                                            <div className="equipe-upload-label-content">
                                                <Image01Icon
                                                    size={
                                                        28
                                                    }
                                                />

                                                <span>
                                                    {modalEquipeModo ===
                                                    "edicao"
                                                        ? t(
                                                              "equipe.form.changePhoto"
                                                          )
                                                        : t(
                                                              "equipe.form.selectPhoto"
                                                          )}
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

                                <div className="equipe-upload-box">
                                    <span className="equipe-form-label">
                                        {t(
                                            "equipe.form.teamBanner"
                                        )}
                                    </span>

                                    <label className="equipe-upload-label">
                                        {bannerPreview ? (
                                            <img
                                                src={
                                                    bannerPreview
                                                }
                                                alt={t(
                                                    "equipe.images.bannerPreviewAlt"
                                                )}
                                                className="equipe-upload-preview"
                                            />
                                        ) : (
                                            <div className="equipe-upload-label-content">
                                                <Image01Icon
                                                    size={
                                                        28
                                                    }
                                                />

                                                <span>
                                                    {modalEquipeModo ===
                                                    "edicao"
                                                        ? t(
                                                              "equipe.form.changeBanner"
                                                          )
                                                        : t(
                                                              "equipe.form.selectBanner"
                                                          )}
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
                                {t(
                                    "equipe.actions.cancel"
                                )}
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
                                        ? t(
                                              "equipe.actions.saving"
                                          )
                                        : t(
                                              "equipe.actions.creating"
                                          )
                                    : modalEquipeModo ===
                                      "edicao"
                                        ? t(
                                              "equipe.actions.saveChanges"
                                          )
                                        : t(
                                              "equipe.actions.createTeam"
                                          )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    {t(
                                        "equipe.inviteModal.title"
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        "equipe.inviteModal.description"
                                    )}
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
                                aria-label={t(
                                    "equipe.actions.close"
                                )}
                                title={t(
                                    "equipe.actions.close"
                                )}
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

                            <form
                                className="equipe-form-group"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    buscarClientePorEmail();
                                }}
                            >
                                <label
                                    className="equipe-form-label"
                                    htmlFor="convite-email"
                                >
                                    {t(
                                        "equipe.inviteModal.emailLabel"
                                    )}
                                </label>

                                <div className="equipe-invite-search">
                                    <input
                                        id="convite-email"
                                        type="email"
                                        className="equipe-form-input"
                                        value={emailConvite}
                                        onChange={(event) => {
                                            setEmailConvite(
                                                event.target.value
                                            );
                                            setClienteEncontrado(null);
                                            setClienteNaoEncontrado(false);
                                            setClienteSelecionado("");
                                        }}
                                        placeholder={t(
                                            "equipe.inviteModal.emailPlaceholder"
                                        )}
                                        autoComplete="off"
                                        disabled={
                                            enviandoConvite
                                        }
                                        autoFocus
                                    />

                                    <button
                                        type="submit"
                                        className="equipe-button"
                                        disabled={
                                            buscandoCliente ||
                                            enviandoConvite ||
                                            !emailConvite.trim()
                                        }
                                    >
                                        {buscandoCliente
                                            ? t(
                                                  "equipe.inviteModal.searching"
                                              )
                                            : t(
                                                  "equipe.inviteModal.search"
                                              )}
                                    </button>
                                </div>

                                <span className="equipe-form-hint">
                                    {t(
                                        "equipe.inviteModal.hint"
                                    )}
                                </span>
                            </form>

                            {clienteEncontrado && (
                                <div className="equipe-client-option selected">
                                    <div className="equipe-client-avatar">
                                        <UserGroupIcon size={19} />
                                    </div>

                                    <div className="equipe-client-info">
                                        <strong>
                                            {clienteEncontrado.nome}
                                        </strong>

                                        <span>
                                            {clienteEncontrado.email}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {clienteNaoEncontrado && (
                                <div className="equipe-empty-clients">
                                    {t(
                                        "equipe.inviteModal.notFound"
                                    )}
                                </div>
                            )}
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
                                {t(
                                    "equipe.actions.cancel"
                                )}
                            </button>

                            <button
                                type="button"
                                className="equipe-button equipe-primary-button"
                                onClick={
                                    enviarConvite
                                }
                                disabled={
                                    enviandoConvite ||
                                    !clienteSelecionado
                                }
                            >
                                <Mail01Icon size={17} />

                                {enviandoConvite
                                    ? t(
                                          "equipe.actions.sending"
                                      )
                                    : t(
                                          "equipe.actions.sendInvite"
                                      )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default EquipePage;