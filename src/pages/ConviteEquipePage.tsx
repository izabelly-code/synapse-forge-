import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CSSProperties } from "react";

import {
    buscarConviteEquipe,
    aceitarConviteEquipe,
    recusarConviteEquipe
} from "../services/AuthService";

interface ConviteEquipe {
    id: string;
    equipeId: string;
    equipeNome: string;
    gerenteId: string;
    gerenteNome: string;
    usuarioId: string;
    usuarioNome: string;
    status: string;
    criadoEm: string;
    expiraEm: string;
}

type Estado =
    | "carregando"
    | "convite"
    | "processando"
    | "sucesso"
    | "erro";

function ConviteEquipePage() {

    const [searchParams] = useSearchParams();

    const token = searchParams.get("token");
    const acao = searchParams.get("acao");

    const [convite, setConvite] =
        useState<ConviteEquipe | null>(null);

    const [estado, setEstado] =
        useState<Estado>("carregando");

    const [mensagem, setMensagem] =
        useState("");

    const [erro, setErro] =
        useState("");


    // =========================================================
    // BUSCAR CONVITE
    // =========================================================

    useEffect(() => {

        async function carregarConvite() {

            if (!token) {
                setErro(
                    "O link do convite é inválido ou está incompleto."
                );

                setEstado("erro");

                return;
            }

            try {

                const data =
                    await buscarConviteEquipe(token);

                setConvite(data);
                setEstado("convite");

            } catch (error) {

                setErro(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar o convite."
                );

                setEstado("erro");
            }
        }

        carregarConvite();

    }, [token]);


    // =========================================================
    // ACEITAR CONVITE
    // =========================================================

    async function handleAceitar() {

        if (!token) {
            setErro("Token do convite não encontrado.");
            setEstado("erro");
            return;
        }

        setEstado("processando");
        setErro("");

        try {

            await aceitarConviteEquipe(token);

            setMensagem(
                "Convite aceito com sucesso! " +
                "Agora você faz parte da equipe como Técnico. " +
                "Se você já estava conectado à sua conta, " +
                "faça login novamente para atualizar seu acesso."
            );

            setEstado("sucesso");

        } catch (error) {

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível aceitar o convite."
            );

            setEstado("erro");
        }
    }


    // =========================================================
    // RECUSAR CONVITE
    // =========================================================

    async function handleRecusar() {

        if (!token) {
            setErro("Token do convite não encontrado.");
            setEstado("erro");
            return;
        }

        setEstado("processando");
        setErro("");

        try {

            await recusarConviteEquipe(token);

            setMensagem(
                "Convite recusado. " +
                "Nenhuma alteração foi feita na sua conta."
            );

            setEstado("sucesso");

        } catch (error) {

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível recusar o convite."
            );

            setEstado("erro");
        }
    }


    // =========================================================
    // VOLTAR PARA O INÍCIO
    // =========================================================

    function voltarInicio() {
        window.location.href = "/";
    }


    // =========================================================
    // IR PARA LOGIN
    // =========================================================

    function irParaLogin() {
        window.location.href = "/login";
    }


    // =========================================================
    // LOADING
    // =========================================================

    if (estado === "carregando") {

        return (
            <div style={styles.page}>
                <div style={styles.card}>

                    <div style={styles.spinner} />

                    <h1 style={styles.title}>
                        Carregando convite...
                    </h1>

                    <p style={styles.text}>
                        Aguarde enquanto verificamos seu convite.
                    </p>

                </div>
            </div>
        );
    }


    // =========================================================
    // PROCESSANDO
    // =========================================================

    if (estado === "processando") {

        return (
            <div style={styles.page}>
                <div style={styles.card}>

                    <div style={styles.spinner} />

                    <h1 style={styles.title}>
                        Processando...
                    </h1>

                    <p style={styles.text}>
                        Aguarde enquanto processamos sua resposta.
                    </p>

                </div>
            </div>
        );
    }


    // =========================================================
    // ERRO
    // =========================================================

    if (estado === "erro") {

        return (
            <div style={styles.page}>
                <div style={styles.card}>

                    <div style={styles.errorIcon}>
                        ×
                    </div>

                    <h1 style={styles.title}>
                        Não foi possível continuar
                    </h1>

                    <p style={styles.text}>
                        {erro}
                    </p>

                    <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={voltarInicio}
                    >
                        Voltar para o início
                    </button>

                </div>
            </div>
        );
    }


    // =========================================================
    // SUCESSO
    // =========================================================

    if (estado === "sucesso") {

        const conviteAceito =
            mensagem.toLowerCase().includes("aceito");

        return (
            <div style={styles.page}>
                <div style={styles.card}>

                    <div style={styles.successIcon}>
                        ✓
                    </div>

                    <h1 style={styles.title}>
                        Tudo certo!
                    </h1>

                    <p style={styles.text}>
                        {mensagem}
                    </p>

                    {conviteAceito ? (

                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={irParaLogin}
                        >
                            Ir para o login
                        </button>

                    ) : (

                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={voltarInicio}
                        >
                            Voltar para o início
                        </button>

                    )}

                </div>
            </div>
        );
    }


    // =========================================================
    // CONVITE
    // =========================================================

    if (!convite) {
        return null;
    }


    return (
        <div style={styles.page}>

            <div style={styles.card}>

                <div style={styles.logo}>
                    SynapseForge
                </div>


                <div style={styles.teamIcon}>
                    👥
                </div>


                <h1 style={styles.title}>
                    Convite para equipe
                </h1>


                <p style={styles.text}>
                    Olá,{" "}
                    <strong>
                        {convite.usuarioNome}
                    </strong>
                    !
                </p>


                <p style={styles.text}>
                    Você recebeu um convite para fazer
                    parte da equipe:
                </p>


                <div style={styles.teamBox}>

                    <strong style={styles.teamName}>
                        {convite.equipeNome}
                    </strong>

                    <span style={styles.manager}>
                        Gerente: {convite.gerenteNome}
                    </span>

                </div>


                <p style={styles.expiration}>
                    Este convite expira em{" "}
                    {new Date(
                        convite.expiraEm
                    ).toLocaleString("pt-BR")}
                    .
                </p>


                {acao === "recusar" ? (

                    <>
                        <p style={styles.question}>
                            Deseja recusar este convite?
                        </p>

                        <button
                            type="button"
                            style={styles.dangerButton}
                            onClick={handleRecusar}
                        >
                            Recusar convite
                        </button>

                        <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={voltarInicio}
                        >
                            Cancelar
                        </button>
                    </>

                ) : (

                    <>
                        <p style={styles.question}>
                            Deseja aceitar este convite?
                        </p>

                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={handleAceitar}
                        >
                            Aceitar convite
                        </button>

                        <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() =>
                                window.location.href =
                                    "/convite-equipe?token="
                                    + encodeURIComponent(token ?? "")
                                    + "&acao=recusar"
                            }
                        >
                            Recusar convite
                        </button>
                    </>

                )}

            </div>
        </div>
    );
}


// =========================================================
// ESTILOS
// =========================================================

const styles: Record<string, CSSProperties> = {

    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f2f2f6",
        fontFamily: "'Inter', Arial, sans-serif",
        boxSizing: "border-box"
    },

    card: {
        width: "100%",
        maxWidth: "520px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "40px 32px",
        boxSizing: "border-box",
        textAlign: "center",
        boxShadow:
            "0 8px 32px rgba(31, 26, 30, 0.10)"
    },

    logo: {
        color: "#FB4A14",
        fontSize: "22px",
        fontWeight: 700,
        marginBottom: "28px"
    },

    teamIcon: {
        width: "72px",
        height: "72px",
        margin: "0 auto 20px",
        borderRadius: "50%",
        background: "#fff0eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "32px"
    },

    successIcon: {
        width: "72px",
        height: "72px",
        margin: "0 auto 20px",
        borderRadius: "50%",
        background: "#e8f7ee",
        color: "#16834d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "38px",
        fontWeight: 700
    },

    errorIcon: {
        width: "72px",
        height: "72px",
        margin: "0 auto 20px",
        borderRadius: "50%",
        background: "#fdeaea",
        color: "#c62828",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "40px",
        fontWeight: 700
    },

    title: {
        margin: "0 0 16px",
        color: "#262626",
        fontSize: "26px",
        fontWeight: 700
    },

    text: {
        margin: "0 0 14px",
        color: "#737373",
        fontSize: "15px",
        lineHeight: 1.6
    },

    teamBox: {
        margin: "24px 0",
        padding: "20px",
        borderRadius: "14px",
        background: "#f7f7f9",
        border: "1px solid rgba(67, 70, 86, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    teamName: {
        color: "#262626",
        fontSize: "20px"
    },

    manager: {
        color: "#737373",
        fontSize: "14px"
    },

    expiration: {
        margin: "0 0 24px",
        color: "#888",
        fontSize: "13px"
    },

    question: {
        margin: "0 0 16px",
        color: "#434656",
        fontSize: "15px",
        fontWeight: 600
    },

    primaryButton: {
        width: "100%",
        border: "none",
        borderRadius: "9999px",
        padding: "14px 24px",
        background: "#FB4A14",
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: "10px"
    },

    dangerButton: {
        width: "100%",
        border: "none",
        borderRadius: "9999px",
        padding: "14px 24px",
        background: "#c62828",
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: "10px"
    },

    secondaryButton: {
        width: "100%",
        border: "1px solid rgba(67, 70, 86, 0.20)",
        borderRadius: "9999px",
        padding: "13px 24px",
        background: "#ffffff",
        color: "#434656",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer"
    },

    spinner: {
        width: "42px",
        height: "42px",
        margin: "0 auto 20px",
        borderRadius: "50%",
        border: "4px solid #f2f2f6",
        borderTop: "4px solid #FB4A14"
    }
};

export default ConviteEquipePage;

