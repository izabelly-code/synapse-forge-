import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
    register,
    registerGerente
} from "../../services/AuthService";

import {
    ViewIcon,
    ViewOffSlashIcon
} from "hugeicons-react";

import logo from "../../assets/Images/white-logo.png";

import LinkButton from "../ui/LinkButton";
import LoadingButton from "../ui/LoadingButton";
import FieldMessage from "../ui/FieldMessage";
import FieldStatus, {
    type FieldState
} from "../ui/FieldStatus";

interface RegisterProps {
    onRegister: () => void;
    onVoltarEscolha?: () => void;
    tipoCadastro?: "CLIENTE" | "GERENTE";
}

type CampoRegistro = "nome" | "email" | "cpf" | "telefone" | "confirmSenha";

function Register({
    onRegister,
    onVoltarEscolha,
    tipoCadastro = "CLIENTE"
}: RegisterProps) {

    const { t } = useTranslation();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmSenha, setConfirmSenha] = useState("");
    const [cpf, setCpf] = useState("");
    const [telefone, setTelefone] = useState("");
    const [nomeLoja, setNomeLoja] = useState("");

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailCadastrado, setEmailCadastrado] = useState("");

    const [showSenha, setShowSenha] = useState(false);

    // "Reward early, punish late" (SYN-73): o erro de um campo só aparece depois que a
    // pessoa sai dele (ou tenta enviar); a partir daí some assim que o valor fica válido.
    const [tocados, setTocados] = useState<ReadonlySet<CampoRegistro>>(new Set());
    const [tentouEnviar, setTentouEnviar] = useState(false);

    function tocar(campo: CampoRegistro) {
        setTocados((atuais) => (atuais.has(campo) ? atuais : new Set(atuais).add(campo)));
    }

    function mostrarErro(campo: CampoRegistro, erro: string | undefined) {
        return tentouEnviar || tocados.has(campo) ? erro : undefined;
    }

    const nomeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nomeRef.current?.focus();
    }, []);

    // =========================================================
    // VALIDAÇÃO DE EMAIL
    // =========================================================

    function validarEmail(valor: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
    }

    // =========================================================
    // FORÇA DA SENHA
    // =========================================================

    function forcaSenha(senha: string) {

        if (senha.length < 6) {
            return "fraca";
        }

        if (
            senha.match(/[A-Z]/) &&
            senha.match(/[0-9]/)
        ) {
            return "forte";
        }

        return "media";
    }

    // =========================================================
    // FORMATAR CPF
    // =========================================================

    function formatarCPF(valor: string) {

        // Corta em 11 dígitos antes da máscara: colar 12 dígitos gerava "123.456.7890-1".
        return valor
            .replace(/\D/g, "")
            .slice(0, 11)
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(
                /(\d{3})(\d{1,2})$/,
                "$1-$2"
            )
            .slice(0, 14);
    }

    // =========================================================
    // FORMATAR TELEFONE
    // =========================================================

    function formatarTelefone(valor: string) {

        const numeros = valor
            .replace(/\D/g, "")
            .slice(0, 11);

        if (numeros.length === 0) {
            return "";
        }

        if (numeros.length <= 2) {
            return `(${numeros}`;
        }

        if (numeros.length <= 6) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        }

        // Fixo (10 dígitos): (11) 3456-7890 · celular (11): (11) 93456-7890
        const corte = numeros.length === 11 ? 7 : 6;
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, corte)}-${numeros.slice(corte)}`;
    }

    // =========================================================
    // VALIDAR CPF
    // =========================================================

    function validarCPF(cpf: string) {

        const cleanCpf = cpf.replace(/\D/g, "");

        if (cleanCpf.length !== 11) {
            return false;
        }

        if (/^(\d)\1+$/.test(cleanCpf)) {
            return false;
        }

        let soma = 0;
        let resto;

        for (let i = 0; i < 9; i++) {
            soma +=
                parseInt(cleanCpf[i]) *
                (10 - i);
        }

        resto = (soma * 10) % 11;

        if (resto >= 10) {
            resto = 0;
        }

        if (resto !== parseInt(cleanCpf[9])) {
            return false;
        }

        soma = 0;

        for (let i = 0; i < 10; i++) {
            soma +=
                parseInt(cleanCpf[i]) *
                (11 - i);
        }

        resto = (soma * 10) % 11;

        if (resto >= 10) {
            resto = 0;
        }

        return resto === parseInt(cleanCpf[10]);
    }

    // =========================================================
    // VALIDAR TELEFONE
    // =========================================================

    function validarTelefone(telefone: string) {

        const numeros = telefone.replace(/\D/g, "");

        if (
            numeros.length < 10 ||
            numeros.length > 11
        ) {
            return false;
        }

        const ddd = numeros.slice(0, 2);
        const numero = numeros.slice(2);

        const dddsValidos = [
            "11", "12", "13", "14", "15",
            "16", "17", "18", "19", "21",
            "22", "24", "27", "28", "31",
            "32", "33", "34", "35", "37",
            "38", "41", "42", "43", "44",
            "45", "46", "47", "48", "49",
            "51", "53", "54", "55", "61",
            "62", "64", "63", "65", "66",
            "67", "68", "69", "71", "73",
            "74", "75", "77", "79", "81",
            "87", "82", "83", "84", "85",
            "88", "86", "89", "91", "93",
            "94", "92", "97", "95", "96",
            "98", "99"
        ];

        if (!dddsValidos.includes(ddd)) {
            return false;
        }

        if (/^(\d)\1+$/.test(numeros)) {
            return false;
        }

        if (
            numeros.length === 11 &&
            !numero.startsWith("9")
        ) {
            return false;
        }

        return true;
    }

    // =========================================================
    // ESTADOS DOS CAMPOS
    // =========================================================

    const nivelSenha = forcaSenha(senha);

    const cpfDigitos = cpf.replace(/\D/g, "");
    const telDigitos = telefone.replace(/\D/g, "");

    const erroNome = mostrarErro(
        "nome",
        nome.trim().length < 3
            ? t("register.validation.nameShort")
            : undefined
    );

    const erroEmail = mostrarErro(
        "email",
        email.trim() !== "" && !validarEmail(email)
            ? t("register.validation.emailInvalidFormat")
            : undefined
    );

    const erroCpf = mostrarErro(
        "cpf",
        cpf === ""
            ? undefined
            : cpfDigitos.length < 11
                ? t("register.validation.cpfIncomplete")
                : !validarCPF(cpf)
                    ? t("register.validation.cpfInvalid")
                    : undefined
    );

    const erroTelefone = mostrarErro(
        "telefone",
        telefone === ""
            ? undefined
            : telDigitos.length < 10
                ? t("register.validation.phoneIncomplete")
                : !validarTelefone(telefone)
                    ? t("register.validation.phoneInvalid")
                    : undefined
    );

    const erroConfirm = mostrarErro(
        "confirmSenha",
        confirmSenha !== "" && senha !== confirmSenha
            ? t("register.validation.passwordMismatch")
            : undefined
    );

    function estado(
        erro: string | undefined,
        ok: boolean
    ): FieldState {

        if (erro) {
            return "invalid";
        }

        return ok
            ? "valid"
            : "idle";
    }

    // =========================================================
    // CADASTRO
    // =========================================================

    async function handleRegister(
        e?: React.FormEvent
    ) {

        if (e) {
            e.preventDefault();
        }

        setErro("");
        setSucesso("");
        setTentouEnviar(true);

        if (!nome.trim()) {
            return setErro(
                t("register.errors.nameRequired")
            );
        }

        if (nome.trim().length < 3) {
            return setErro(
                t("register.errors.nameMinLength")
            );
        }

        if (tipoCadastro === "GERENTE" && !nomeLoja.trim()) {
            return setErro(
                t("register.errors.shopNameRequired")
            );
        }

        if (!email.trim()) {
            return setErro(
                t("register.errors.emailRequired")
            );
        }

        if (!validarEmail(email)) {
            return setErro(
                t("register.errors.emailInvalid")
            );
        }

        const cpfNum = cpf.replace(/\D/g, "");

        if (cpfNum.length < 11) {
            return setErro(
                t("register.errors.cpfIncomplete")
            );
        }

        if (!validarCPF(cpf)) {
            return setErro(
                t("register.errors.cpfInvalid")
            );
        }

        const telNum = telefone.replace(/\D/g, "");

        if (telNum.length < 10) {
            return setErro(
                t("register.errors.phoneIncomplete")
            );
        }

        if (!validarTelefone(telefone)) {
            return setErro(
                t("register.errors.phoneInvalid")
            );
        }

        if (!senha) {
            return setErro(
                t("register.errors.passwordRequired")
            );
        }

        if (senha.length < 6) {
            return setErro(
                t("register.errors.passwordMinLength")
            );
        }

        if (!confirmSenha) {
            return setErro(
                t("register.errors.confirmPasswordRequired")
            );
        }

        if (senha !== confirmSenha) {
            return setErro(
                t("register.errors.passwordMismatch")
            );
        }

        try {

            setLoading(true);

            const dados = {
                nome: nome.trim(),
                email: email.trim(),
                senha,
                cpf,
                telefone
            };

            if (tipoCadastro === "GERENTE") {
                await registerGerente({
                    ...dados,
                    nomeEquipe: nomeLoja.trim(),
                });
            } else {
                await register(dados);
            }

            setEmailCadastrado(email.trim());

        } catch (error) {

            const msg =
                error instanceof Error
                    ? error.message
                    : "";

            setErro(
                msg.includes("já cadastrado")
                    ? t("register.errors.emailAlreadyRegistered")
                    : t("register.errors.generic")
            );

        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // TELA DE CONFIRMAÇÃO DE EMAIL
    // =========================================================

    if (emailCadastrado) {

        return (
            <div className="screen-container">

                <div className="left-side">

                    <div className="left-overlay"></div>

                    <img
                        src={logo}
                        alt="Logo SynapseForge"
                        className="logo"
                    />

                    <div className="left-content">

                        <h1>
                            {t("register.confirmation.almostThere")}
                        </h1>

                        <p>
                            {t("register.confirmation.subtitle")}
                        </p>

                    </div>

                </div>

                <div className="right-side">

                    <div
                        className="card"
                        style={{
                            textAlign: "center"
                        }}
                    >

                        <div
                            style={{
                                fontSize: "2.5rem",
                                marginBottom: "1rem"
                            }}
                        >
                            📧
                        </div>

                        <h2>
                            {t("register.confirmation.title")}
                        </h2>

                        <p
                            style={{
                                color:
                                    "var(--on-surface-variant)",
                                fontSize: "0.9375rem",
                                lineHeight: 1.6,
                                marginBottom: "1.5rem"
                            }}
                        >
                            {t("register.confirmation.sentTo")}
                            <br />

                            <strong
                                style={{
                                    color:
                                        "var(--on-background)"
                                }}
                            >
                                {emailCadastrado}
                            </strong>
                        </p>

                        <p
                            style={{
                                color:
                                    "var(--on-surface-variant)",
                                fontSize: "0.875rem",
                                marginBottom: "1.5rem"
                            }}
                        >
                            {t("register.confirmation.instructions")}
                        </p>

                        <LinkButton
                            onClick={onRegister}
                        >
                            {t("register.buttons.backToLogin")}
                        </LinkButton>

                    </div>

                </div>

            </div>
        );
    }

    // =========================================================
    // FORMULÁRIO
    // =========================================================

    return (
        <div className="screen-container">

            <div className="left-side">

                <div className="left-overlay"></div>

                <img
                    src={logo}
                    alt="Logo SynapseForge"
                    className="logo"
                />

                <div className="left-content">

                    <h1>
                        {tipoCadastro === "GERENTE"
                            ? t("register.manager.leftTitle")
                            : t("register.client.leftTitle")
                        }
                    </h1>

                    <p>
                        {tipoCadastro === "GERENTE"
                            ? t("register.manager.leftDescription")
                            : t("register.client.leftDescription")
                        }
                    </p>

                </div>

            </div>

            <div className="right-side">

                <form
                    className="card card-wide"
                    onSubmit={handleRegister}
                >

                    <h2>
                        {tipoCadastro === "GERENTE"
                            ? t("register.manager.formTitle")
                            : t("register.client.formTitle")
                        }
                    </h2>

                    {erro && (
                        <p className="error" role="alert">
                            {erro}
                        </p>
                    )}

                    {sucesso && (
                        <p className="success">
                            {sucesso}
                        </p>
                    )}

                    <div className="input-group">

                        <label htmlFor="register-nome">
                            {t("register.fields.name")}
                        </label>

                        <div className="input-wrapper">

                            <input
                                id="register-nome"
                                ref={nomeRef}
                                autoComplete="name"
                                value={nome}
                                onChange={(e) =>
                                    setNome(e.target.value)
                                }
                                onBlur={() => tocar("nome")}
                                className={erroNome ? "input-error" : ""}
                                placeholder={t(
                                    "register.placeholders.name"
                                )}
                                aria-invalid={!!erroNome}
                            />

                            <FieldStatus
                                state={
                                    estado(
                                        erroNome,
                                        nome.trim().length >= 3
                                    )
                                }
                            />

                        </div>

                        <FieldMessage
                            error={erroNome}
                        />

                    </div>

                    {tipoCadastro === "GERENTE" && (
                        <div className="input-group">

                            <label htmlFor="register-loja">
                                {t("register.fields.shopName")}
                            </label>

                            <div className="input-wrapper">

                                <input
                                    id="register-loja"
                                    value={nomeLoja}
                                    onChange={(e) =>
                                        setNomeLoja(e.target.value)
                                    }
                                    placeholder={t(
                                        "register.placeholders.shopName"
                                    )}
                                />

                            </div>

                            {/* Mesmo slot de mensagem dos outros campos: mantém o espaçamento. */}
                            <FieldMessage error={undefined} />

                        </div>
                    )}

                    <div className="input-group">

                        <label htmlFor="register-email">
                            {t("register.fields.email")}
                        </label>

                        <div className="input-wrapper">

                            <input
                                id="register-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                onBlur={() => tocar("email")}
                                className={erroEmail ? "input-error" : ""}
                                placeholder={t(
                                    "register.placeholders.email"
                                )}
                                aria-invalid={!!erroEmail}
                            />

                            <FieldStatus
                                state={
                                    estado(
                                        erroEmail,
                                        email !== "" &&
                                        validarEmail(email)
                                    )
                                }
                            />

                        </div>

                        <FieldMessage
                            error={erroEmail}
                        />

                    </div>

                    <div className="form-row">

                        <div className="input-group">

                            <label htmlFor="register-cpf">
                                {t("register.fields.cpf")}
                            </label>

                            <div className="input-wrapper">

                                <input
                                    id="register-cpf"
                                    inputMode="numeric"
                                    value={cpf}
                                    onChange={(e) =>
                                        setCpf(formatarCPF(e.target.value))
                                    }
                                    onBlur={() => tocar("cpf")}
                                    className={erroCpf ? "input-error" : ""}
                                    placeholder={t(
                                        "register.placeholders.cpf"
                                    )}
                                    aria-invalid={!!erroCpf}
                                />

                                <FieldStatus
                                    state={
                                        estado(
                                            erroCpf,
                                            cpfDigitos.length === 11 &&
                                            validarCPF(cpf)
                                        )
                                    }
                                />

                            </div>

                            <FieldMessage
                                error={erroCpf}
                            />

                        </div>

                        <div className="input-group">

                            <label htmlFor="register-telefone">
                                {t("register.fields.phone")}
                            </label>

                            <div className="input-wrapper">

                                <input
                                    id="register-telefone"
                                    type="tel"
                                    autoComplete="tel-national"
                                    value={telefone}
                                    onChange={(e) =>
                                        setTelefone(formatarTelefone(e.target.value))
                                    }
                                    onBlur={() => tocar("telefone")}
                                    className={erroTelefone ? "input-error" : ""}
                                    placeholder={t(
                                        "register.placeholders.phone"
                                    )}
                                    aria-invalid={!!erroTelefone}
                                />

                                <FieldStatus
                                    state={
                                        estado(
                                            erroTelefone,
                                            telDigitos.length >= 10 &&
                                            validarTelefone(telefone)
                                        )
                                    }
                                />

                            </div>

                            <FieldMessage
                                error={erroTelefone}
                            />

                        </div>

                    </div>

                    <div className="form-row">

                        <div className="input-group">

                            <label htmlFor="register-senha">
                                {t("register.fields.password")}
                            </label>

                            <div className="input-wrapper">

                                <input
                                    id="register-senha"
                                    autoComplete="new-password"
                                    type={
                                        showSenha
                                            ? "text"
                                            : "password"
                                    }
                                    value={senha}
                                    onChange={(e) =>
                                        setSenha(e.target.value)
                                    }
                                    placeholder={t(
                                        "register.placeholders.password"
                                    )}
                                />

                                <button
                                    type="button"
                                    className="input-icon"
                                    onClick={() =>
                                        setShowSenha(
                                            !showSenha
                                        )
                                    }
                                    aria-label={
                                        showSenha
                                            ? t("register.buttons.hidePassword")
                                            : t("register.buttons.showPassword")
                                    }
                                >
                                    {showSenha
                                        ? <ViewOffSlashIcon />
                                        : <ViewIcon />
                                    }
                                </button>

                            </div>

                            <FieldMessage
                                hint={
                                    senha && (
                                        <span
                                            className={
                                                `senha-${nivelSenha}`
                                            }
                                        >
                                            {nivelSenha === "fraca" &&
                                                t("register.passwordStrength.weak")
                                            }

                                            {nivelSenha === "media" &&
                                                t("register.passwordStrength.medium")
                                            }

                                            {nivelSenha === "forte" &&
                                                t("register.passwordStrength.strong")
                                            }
                                        </span>
                                    )
                                }
                            />

                        </div>

                        <div className="input-group">

                            <label htmlFor="register-confirmar">
                                {t("register.fields.confirmPassword")}
                            </label>

                            <div className="input-wrapper">

                                <input
                                    id="register-confirmar"
                                    autoComplete="new-password"
                                    type="password"
                                    value={confirmSenha}
                                    onChange={(e) =>
                                        setConfirmSenha(
                                            e.target.value
                                        )
                                    }
                                    onBlur={() => tocar("confirmSenha")}
                                    className={erroConfirm ? "input-error" : ""}
                                    placeholder={t(
                                        "register.placeholders.confirmPassword"
                                    )}
                                    aria-invalid={!!erroConfirm}
                                />

                                <FieldStatus
                                    state={
                                        estado(
                                            erroConfirm,
                                            confirmSenha !== "" &&
                                            senha === confirmSenha
                                        )
                                    }
                                />

                            </div>

                            <FieldMessage
                                error={erroConfirm}
                            />

                        </div>

                    </div>

                    <LoadingButton
                        pending={loading}
                        pendingLabel={t(
                            "register.buttons.registering"
                        )}
                    >
                        {t("register.buttons.register")}
                    </LoadingButton>

                    {onVoltarEscolha && (
                        <LinkButton
                            onClick={onVoltarEscolha}
                        >
                            ← {t("register.buttons.backToChoice")}
                        </LinkButton>
                    )}

                    <LinkButton
                        onClick={onRegister}
                    >
                        {t("register.buttons.alreadyHaveAccount")}
                    </LinkButton>

                </form>

            </div>

        </div>
    );
}

export default Register;