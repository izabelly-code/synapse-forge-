import { useEffect, useState } from "react";
import {
    UserAdd01Icon,
    UserGroupIcon,
    Cancel01Icon,
    Image01Icon,
} from "hugeicons-react";
import { getUserRole, getToken } from "../hooks/useAuth";

interface Equipe {
    id: string;
    nome: string;
    gerenteId: string;
    fotoBase64: string | null;
    bannerBase64: string | null;
    criadoEm: string;
    atualizadoEm: string;
}

function EquipePage() {
    const role = getUserRole();

    const isGerente = role === "GERENTE";
    const isTecnico = role === "TECNICO";
    const isAdmin = role === "ADMIN";

    const podeGerenciarEquipe = isGerente || isAdmin;

    const [equipe, setEquipe] =
        useState<Equipe | null>(null);

    const [carregando, setCarregando] =
        useState(true);

    const [modalAberto, setModalAberto] =
        useState(false);

    // true = edição | false = criação
    const [modoEdicao, setModoEdicao] =
        useState(false);

    const [nomeEquipe, setNomeEquipe] =
        useState("");

    const [foto, setFoto] =
        useState<File | null>(null);

    const [banner, setBanner] =
        useState<File | null>(null);

    const [fotoPreview, setFotoPreview] =
        useState<string | null>(null);

    const [bannerPreview, setBannerPreview] =
        useState<string | null>(null);

    const [salvandoEquipe, setSalvandoEquipe] =
        useState(false);

    const [erro, setErro] =
        useState<string | null>(null);


    // =========================================================
    // BUSCAR MINHA EQUIPE
    // =========================================================

    useEffect(() => {

        async function carregarEquipe() {

            try {

                setCarregando(true);
                setErro(null);

                const token = getToken();

                if (!token) {
                    setErro("Sessão não encontrada.");
                    return;
                }

                const response =
                    await fetch(
                        "http://localhost:8081/equipes/minha",
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );


                // -------------------------------------------------
                // 404 = usuário ainda não possui equipe
                // ISSO NÃO É UM ERRO
                // -------------------------------------------------

                if (response.status === 404) {

                    setEquipe(null);
                    setErro(null);

                    return;
                }


                if (!response.ok) {

                    throw new Error(
                        "Não foi possível carregar a equipe."
                    );
                }


                const data =
                    await response.json();

                setEquipe(data);
                setErro(null);

            } catch (error) {

                console.error(
                    "Erro ao carregar equipe:",
                    error
                );

                setEquipe(null);

                setErro(
                    "Não foi possível carregar os dados da equipe."
                );

            } finally {

                setCarregando(false);
            }
        }

        carregarEquipe();

    }, []);


    // =========================================================
    // LIMPAR CAMPOS DO MODAL
    // =========================================================

    function limparFormulario() {

        setNomeEquipe("");
        setFoto(null);
        setBanner(null);
        setFotoPreview(null);
        setBannerPreview(null);
        setErro(null);
    }


    // =========================================================
    // ABRIR MODAL DE CRIAÇÃO
    // =========================================================

    function abrirModalCriacao() {

        limparFormulario();

        setModoEdicao(false);
        setModalAberto(true);
    }


    // =========================================================
    // ABRIR MODAL DE EDIÇÃO
    // =========================================================

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

        setModoEdicao(true);
        setModalAberto(true);
    }


    // =========================================================
    // FECHAR MODAL
    // =========================================================

    function fecharModal() {

        if (salvandoEquipe) {
            return;
        }

        setModalAberto(false);

        limparFormulario();

        setModoEdicao(false);
    }


    // =========================================================
    // SELECIONAR FOTO
    // =========================================================

    function selecionarFoto(
        event: React.ChangeEvent<HTMLInputElement>
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


    // =========================================================
    // SELECIONAR BANNER
    // =========================================================

    function selecionarBanner(
        event: React.ChangeEvent<HTMLInputElement>
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


    // =========================================================
    // RECARREGAR EQUIPE
    // =========================================================

    async function recarregarEquipe() {

        const token = getToken();

        if (!token) {
            throw new Error(
                "Sua sessão expirou. Faça login novamente."
            );
        }

        const response =
            await fetch(
                "http://localhost:8081/equipes/minha",
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


        // -------------------------------------------------
        // Se por algum motivo a equipe não existir mais
        // -------------------------------------------------

        if (response.status === 404) {

            setEquipe(null);
            setErro(null);

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Não foi possível atualizar os dados da equipe."
            );
        }


        const data =
            await response.json();

        setEquipe(data);
    }


    // =========================================================
    // CRIAR EQUIPE
    // =========================================================

    async function criarEquipe() {

        const nome =
            nomeEquipe.trim();

        if (!nome) {

            setErro(
                "Digite um nome para a equipe."
            );

            return;
        }

        try {

            setSalvandoEquipe(true);
            setErro(null);

            const token = getToken();

            if (!token) {

                setErro(
                    "Sua sessão expirou. Faça login novamente."
                );

                return;
            }


            // -------------------------------------------------
            // FormData
            // -------------------------------------------------

            const formData =
                new FormData();

            formData.append(
                "nome",
                nome
            );

            if (foto) {

                formData.append(
                    "foto",
                    foto
                );
            }

            if (banner) {

                formData.append(
                    "banner",
                    banner
                );
            }


            // -------------------------------------------------
            // POST /equipes
            // -------------------------------------------------

            const response =
                await fetch(
                    "http://localhost:8081/equipes",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },

                        body: formData,
                    }
                );


            if (!response.ok) {

                let mensagem =
                    "Não foi possível criar a equipe.";

                try {

                    const data =
                        await response.json();

                    if (data?.message) {
                        mensagem =
                            data.message;
                    }

                } catch {
                    // Mantém mensagem padrão
                }

                throw new Error(
                    mensagem
                );
            }


            const data =
                await response.json();


            // -------------------------------------------------
            // Equipe criada!
            // -------------------------------------------------

            setEquipe(data);

            setModalAberto(false);

            limparFormulario();

            setModoEdicao(false);

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


    // =========================================================
    // EDITAR EQUIPE
    // =========================================================

    async function editarEquipe() {

        if (!equipe) {
            return;
        }

        const nome =
            nomeEquipe.trim();

        if (!nome) {

            setErro(
                "Digite um nome para a equipe."
            );

            return;
        }

        try {

            setSalvandoEquipe(true);
            setErro(null);

            const token = getToken();

            if (!token) {

                setErro(
                    "Sua sessão expirou. Faça login novamente."
                );

                return;
            }


            // =================================================
            // 1. ATUALIZAR NOME
            // =================================================

            const nomeResponse =
                await fetch(
                    `http://localhost:8081/equipes/${equipe.id}`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            nome: nome,
                        }),
                    }
                );


            if (!nomeResponse.ok) {

                let mensagem =
                    "Não foi possível atualizar o nome da equipe.";

                try {

                    const data =
                        await nomeResponse.json();

                    if (data?.message) {
                        mensagem =
                            data.message;
                    }

                } catch {
                    // Mantém mensagem padrão
                }

                throw new Error(
                    mensagem
                );
            }


            // =================================================
            // 2. ATUALIZAR FOTO
            // =================================================

            if (foto) {

                const fotoFormData =
                    new FormData();

                fotoFormData.append(
                    "foto",
                    foto
                );


                const fotoResponse =
                    await fetch(
                        `http://localhost:8081/equipes/${equipe.id}/foto`,
                        {
                            method: "PUT",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: fotoFormData,
                        }
                    );


                if (!fotoResponse.ok) {

                    let mensagem =
                        "O nome foi atualizado, mas não foi possível atualizar a foto.";

                    try {

                        const data =
                            await fotoResponse.json();

                        if (data?.message) {
                            mensagem =
                                data.message;
                        }

                    } catch {
                        // Mantém mensagem padrão
                    }

                    throw new Error(
                        mensagem
                    );
                }
            }


            // =================================================
            // 3. ATUALIZAR BANNER
            // =================================================

            if (banner) {

                const bannerFormData =
                    new FormData();

                bannerFormData.append(
                    "banner",
                    banner
                );


                const bannerResponse =
                    await fetch(
                        `http://localhost:8081/equipes/${equipe.id}/banner`,
                        {
                            method: "PUT",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: bannerFormData,
                        }
                    );


                if (!bannerResponse.ok) {

                    let mensagem =
                        "Os dados anteriores foram atualizados, mas não foi possível atualizar o banner.";

                    try {

                        const data =
                            await bannerResponse.json();

                        if (data?.message) {
                            mensagem =
                                data.message;
                        }

                    } catch {
                        // Mantém mensagem padrão
                    }

                    throw new Error(
                        mensagem
                    );
                }
            }


            // =================================================
            // 4. RECARREGAR EQUIPE DO BACKEND
            // =================================================

            await recarregarEquipe();


            // =================================================
            // 5. FECHAR MODAL
            // =================================================

            setModalAberto(false);

            limparFormulario();

            setModoEdicao(false);

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


    // =========================================================
    // SALVAR MODAL
    // =========================================================

    function salvarEquipe() {

        if (modoEdicao) {

            editarEquipe();

            return;
        }

        criarEquipe();
    }


    // =========================================================
    // ESC PARA FECHAR MODAL
    // =========================================================

    useEffect(() => {

        function handleEscape(
            event: KeyboardEvent
        ) {

            if (
                event.key === "Escape"
                && modalAberto
                && !salvandoEquipe
            ) {

                fecharModal();
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
        salvandoEquipe
    ]);


    return (
        <>
            <style>{`
                .equipe-page {
                    min-height: 100vh;
                    padding: 40px 48px 56px;
                    max-width: 1400px;
                    margin: 0 auto;
                    box-sizing: border-box;
                }

                .equipe-page-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 28px;
                }

                .equipe-page-kicker {
                    display: block;
                    margin-bottom: 8px;
                    color: var(--color-primary, #FB4A14);
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .equipe-page-title {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 32px;
                    line-height: 1.15;
                    font-weight: 750;
                    letter-spacing: -0.025em;
                }

                .equipe-page-subtitle {
                    margin: 8px 0 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 15px;
                    line-height: 1.5;
                }

                .equipe-primary-button,
                .equipe-secondary-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border-radius: 10px;
                    padding: 11px 16px;
                    font: inherit;
                    font-size: 14px;
                    font-weight: 650;
                    cursor: pointer;
                    transition:
                        transform 140ms ease,
                        box-shadow 140ms ease,
                        background 140ms ease,
                        border-color 140ms ease;
                }

                .equipe-primary-button {
                    flex-shrink: 0;
                    border: 1px solid var(--color-primary, #FB4A14);
                    background: var(--color-primary, #FB4A14);
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(251, 74, 20, 0.18);
                }

                .equipe-primary-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(251, 74, 20, 0.24);
                }

                .equipe-primary-button:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .equipe-secondary-button {
                    margin-left: auto;
                    border: 1px solid var(--color-border-strong, rgba(67, 70, 86, 0.24));
                    background: var(--color-surface, #ffffff);
                    color: var(--color-text, #262626);
                }

                .equipe-secondary-button:hover {
                    border-color: var(--color-primary, #FB4A14);
                    color: var(--color-primary, #FB4A14);
                }

                .equipe-primary-button:focus-visible,
                .equipe-secondary-button:focus-visible {
                    outline: 3px solid rgba(251, 74, 20, 0.2);
                    outline-offset: 2px;
                }

                .equipe-card {
                    border: 1px solid var(--color-border, rgba(67, 70, 86, 0.15));
                    border-radius: 16px;
                    background: var(--color-surface, #ffffff);
                    box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.04));
                }

                .equipe-header-card {
                    overflow: hidden;
                    margin-bottom: 32px;
                }

                .equipe-banner {
                    position: relative;
                    height: 220px;
                    overflow: hidden;
                    background:
                        radial-gradient(
                            circle at 18% 30%,
                            rgba(251, 74, 20, 0.36),
                            transparent 28%
                        ),
                        radial-gradient(
                            circle at 80% 20%,
                            rgba(251, 74, 20, 0.2),
                            transparent 30%
                        ),
                        linear-gradient(
                            135deg,
                            #252525 0%,
                            #3b3b3b 50%,
                            #202020 100%
                        );
                }

                .equipe-banner-image {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .equipe-banner::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            120deg,
                            transparent 0%,
                            rgba(255, 255, 255, 0.035) 45%,
                            transparent 70%
                        );
                    pointer-events: none;
                }

                .equipe-banner-placeholder {
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    right: 9%;
                    top: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 50%;
                    transform: rotate(18deg);
                }

                .equipe-banner-placeholder::before,
                .equipe-banner-placeholder::after {
                    content: "";
                    position: absolute;
                    inset: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    border-radius: 50%;
                }

                .equipe-banner-placeholder::after {
                    inset: 48px;
                }

                .equipe-info {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    padding: 22px 24px 24px;
                }

                .equipe-avatar {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 76px;
                    height: 76px;
                    margin-top: -56px;
                    border: 4px solid var(--color-surface, #ffffff);
                    border-radius: 20px;
                    background:
                        linear-gradient(
                            145deg,
                            var(--color-primary, #FB4A14),
                            #ff774c
                        );
                    color: #ffffff;
                    box-shadow: 0 5px 16px rgba(0, 0, 0, 0.14);
                    z-index: 1;
                    overflow: hidden;
                }

                .equipe-avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .equipe-info-text {
                    min-width: 0;
                }

                .equipe-info-text h2 {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 21px;
                    line-height: 1.25;
                    font-weight: 720;
                }

                .equipe-info-text p {
                    margin: 5px 0 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 14px;
                    line-height: 1.45;
                }

                .equipe-members-section {
                    width: 100%;
                }

                .equipe-section-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 14px;
                }

                .equipe-section-header h2 {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 20px;
                    font-weight: 720;
                    letter-spacing: -0.015em;
                }

                .equipe-section-header p {
                    margin: 5px 0 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 14px;
                }

                .equipe-member-count {
                    flex-shrink: 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 13px;
                    font-weight: 600;
                }

                .equipe-empty-card {
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 24px;
                    text-align: center;
                    color: var(--color-text-muted, #737373);
                }

                .equipe-empty-card > svg {
                    margin-bottom: 14px;
                    opacity: 0.55;
                }

                .equipe-empty-card h3 {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 17px;
                    font-weight: 700;
                }

                .equipe-empty-card p {
                    max-width: 430px;
                    margin: 7px 0 20px;
                    font-size: 14px;
                    line-height: 1.55;
                }

                .equipe-loading {
                    min-height: 300px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-muted, #737373);
                    font-size: 14px;
                }

                .equipe-error {
                    margin-bottom: 18px;
                    padding: 12px 14px;
                    border: 1px solid rgba(190, 30, 45, 0.2);
                    border-radius: 10px;
                    background: rgba(190, 30, 45, 0.06);
                    color: #a51d2d;
                    font-size: 14px;
                }

                /* =====================================================
                   MODAL
                   ===================================================== */

                .equipe-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(0, 0, 0, 0.48);
                    backdrop-filter: blur(4px);
                }

                .equipe-modal {
                    width: min(620px, 100%);
                    max-height: calc(100vh - 48px);
                    overflow-y: auto;
                    border: 1px solid var(--color-border, rgba(67, 70, 86, 0.15));
                    border-radius: 18px;
                    background: var(--color-surface, #ffffff);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
                }

                .equipe-modal-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 24px 24px 18px;
                    border-bottom: 1px solid var(--color-border, rgba(67, 70, 86, 0.15));
                }

                .equipe-modal-header h2 {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 21px;
                    font-weight: 720;
                }

                .equipe-modal-header p {
                    margin: 5px 0 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 13px;
                    line-height: 1.45;
                }

                .equipe-modal-close {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    flex-shrink: 0;
                    border: 0;
                    border-radius: 9px;
                    background: transparent;
                    color: var(--color-text-muted, #737373);
                    cursor: pointer;
                }

                .equipe-modal-close:hover {
                    background: var(--color-surface-2, #f2f2f6);
                    color: var(--color-text, #262626);
                }

                .equipe-modal-body {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 24px;
                }

                .equipe-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .equipe-form-label {
                    color: var(--color-text, #262626);
                    font-size: 13px;
                    font-weight: 700;
                }

                .equipe-form-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px 13px;
                    border: 1px solid var(--color-border-strong, rgba(67, 70, 86, 0.24));
                    border-radius: 10px;
                    background: var(--color-surface, #ffffff);
                    color: var(--color-text, #262626);
                    font: inherit;
                    font-size: 14px;
                    outline: none;
                    transition:
                        border-color 140ms ease,
                        box-shadow 140ms ease;
                }

                .equipe-form-input:focus {
                    border-color: var(--color-primary, #FB4A14);
                    box-shadow: 0 0 0 3px rgba(251, 74, 20, 0.12);
                }

                .equipe-upload-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .equipe-upload-box {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .equipe-upload-label {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 120px;
                    padding: 14px;
                    box-sizing: border-box;
                    border: 1px dashed var(--color-border-strong, rgba(67, 70, 86, 0.24));
                    border-radius: 12px;
                    background: var(--color-surface-2, #f2f2f6);
                    color: var(--color-text-muted, #737373);
                    cursor: pointer;
                    overflow: hidden;
                    transition:
                        border-color 140ms ease,
                        background 140ms ease;
                }

                .equipe-upload-label:hover {
                    border-color: var(--color-primary, #FB4A14);
                    background: rgba(251, 74, 20, 0.035);
                }

                .equipe-upload-label-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    text-align: center;
                }

                .equipe-upload-label-content span {
                    font-size: 12px;
                    font-weight: 650;
                }

                .equipe-upload-preview {
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .equipe-upload-input {
                    display: none;
                }

                .equipe-upload-name {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: var(--color-text-muted, #737373);
                    font-size: 11px;
                }

                .equipe-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 18px 24px 24px;
                    border-top: 1px solid var(--color-border, rgba(67, 70, 86, 0.15));
                }

                .equipe-modal-cancel {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 11px 16px;
                    border: 1px solid var(--color-border-strong, rgba(67, 70, 86, 0.24));
                    border-radius: 10px;
                    background: var(--color-surface, #ffffff);
                    color: var(--color-text, #262626);
                    font: inherit;
                    font-size: 14px;
                    font-weight: 650;
                    cursor: pointer;
                }

                .equipe-modal-cancel:hover {
                    border-color: var(--color-primary, #FB4A14);
                }

                @media (max-width: 900px) {
                    .equipe-page {
                        padding: 32px 28px 48px;
                    }

                    .equipe-banner {
                        height: 190px;
                    }

                    .equipe-page-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .equipe-primary-button {
                        width: 100%;
                    }
                }

                @media (max-width: 600px) {
                    .equipe-page {
                        padding: 24px 18px 40px;
                    }

                    .equipe-page-title {
                        font-size: 27px;
                    }

                    .equipe-banner {
                        height: 150px;
                    }

                    .equipe-info {
                        align-items: flex-start;
                        flex-wrap: wrap;
                        padding: 18px;
                    }

                    .equipe-avatar {
                        width: 64px;
                        height: 64px;
                        margin-top: -46px;
                        border-radius: 16px;
                    }

                    .equipe-info-text {
                        padding-top: 2px;
                        max-width: calc(100% - 82px);
                    }

                    .equipe-secondary-button {
                        width: 100%;
                        margin-left: 0;
                    }

                    .equipe-section-header {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 7px;
                    }

                    .equipe-empty-card {
                        min-height: 260px;
                    }

                    .equipe-upload-grid {
                        grid-template-columns: 1fr;
                    }

                    .equipe-modal-overlay {
                        padding: 12px;
                    }

                    .equipe-modal {
                        max-height: calc(100vh - 24px);
                    }

                    .equipe-modal-header,
                    .equipe-modal-body,
                    .equipe-modal-footer {
                        padding-left: 18px;
                        padding-right: 18px;
                    }

                    .equipe-modal-footer {
                        flex-direction: column-reverse;
                    }

                    .equipe-modal-footer button {
                        width: 100%;
                    }
                }
            `}</style>

            <main className="equipe-page">

                {/* =====================================================
                    CABEÇALHO
                ===================================================== */}

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

                    {podeGerenciarEquipe && equipe && (
                        <button
                            type="button"
                            className="equipe-primary-button"
                        >
                            <UserAdd01Icon size={18} />
                            Convidar usuário
                        </button>
                    )}

                </header>


                {/* =====================================================
                    ERRO
                ===================================================== */}

                {erro && !modalAberto && (
                    <div className="equipe-error">
                        {erro}
                    </div>
                )}


                {/* =====================================================
                    LOADING
                ===================================================== */}

                {carregando ? (

                    <section className="equipe-card equipe-loading">
                        Carregando equipe...
                    </section>

                ) : !equipe ? (

                    /* =================================================
                       SEM EQUIPE
                    ================================================= */

                    <section className="equipe-members-section">

                        <div className="equipe-card equipe-empty-card">

                            <UserGroupIcon size={42} />

                            <h3>
                                Você ainda não possui uma equipe
                            </h3>

                            <p>
                                Crie sua equipe para começar a organizar
                                os integrantes e gerenciar sua produção.
                            </p>

                            {podeGerenciarEquipe && (
                                <button
                                    type="button"
                                    className="equipe-primary-button"
                                    onClick={
                                        abrirModalCriacao
                                    }
                                >
                                    <UserGroupIcon size={18} />
                                    Criar equipe
                                </button>
                            )}

                        </div>

                    </section>

                ) : (

                    /* =================================================
                       EQUIPE EXISTENTE
                    ================================================= */

                    <>
                        <section className="equipe-card equipe-header-card">

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


                                {podeGerenciarEquipe && (
                                    <button
                                        type="button"
                                        className="equipe-secondary-button"
                                        onClick={
                                            abrirModalEdicao
                                        }
                                    >
                                        Editar equipe
                                    </button>
                                )}

                            </div>

                        </section>


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
                                    0 integrantes
                                </span>

                            </div>


                            <div className="equipe-card equipe-empty-card">

                                <UserGroupIcon size={34} />

                                <h3>
                                    Nenhum integrante ainda
                                </h3>

                                <p>
                                    {isTecnico
                                        ? "Você ainda não está vinculado a uma equipe."
                                        : isGerente || isAdmin
                                            ? "Convide usuários para começar a montar sua equipe."
                                            : "Nenhum integrante encontrado."}
                                </p>

                                {podeGerenciarEquipe && (
                                    <button
                                        type="button"
                                        className="equipe-primary-button"
                                    >
                                        <UserAdd01Icon size={18} />
                                        Convidar primeiro integrante
                                    </button>
                                )}

                            </div>

                        </section>
                    </>

                )}

            </main>


            {/* =========================================================
                MODAL DE CRIAÇÃO / EDIÇÃO
            ========================================================= */}

            {modalAberto && (

                <div
                    className="equipe-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            fecharModal();
                        }

                    }}
                >

                    <div className="equipe-modal">

                        {/* HEADER */}

                        <div className="equipe-modal-header">

                            <div>

                                <h2>
                                    {modoEdicao
                                        ? "Editar equipe"
                                        : "Criar equipe"}
                                </h2>

                                <p>
                                    {modoEdicao
                                        ? "Atualize as informações da sua equipe."
                                        : "Configure as informações iniciais da sua equipe."}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="equipe-modal-close"
                                onClick={
                                    fecharModal
                                }
                                disabled={
                                    salvandoEquipe
                                }
                            >
                                <Cancel01Icon size={19} />
                            </button>

                        </div>


                        {/* BODY */}

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
                                                    {modoEdicao
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
                                                    {modoEdicao
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


                        {/* FOOTER */}

                        <div className="equipe-modal-footer">

                            <button
                                type="button"
                                className="equipe-modal-cancel"
                                onClick={
                                    fecharModal
                                }
                                disabled={
                                    salvandoEquipe
                                }
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="equipe-primary-button"
                                onClick={
                                    salvarEquipe
                                }
                                disabled={
                                    salvandoEquipe
                                }
                            >
                                {salvandoEquipe
                                    ? modoEdicao
                                        ? "Salvando..."
                                        : "Criando..."
                                    : modoEdicao
                                        ? "Salvar alterações"
                                        : "Criar equipe"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    );
}

export default EquipePage;