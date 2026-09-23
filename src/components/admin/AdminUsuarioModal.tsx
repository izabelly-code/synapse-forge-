import { useState } from "react";
import { useTranslation } from "react-i18next";

import { atualizarAdminUser, type AdminUser } from "../../services/adminService";
import Select from "../ui/Select";
import AdminFormModal from "./AdminFormModal";
import { PAPEIS, ehPapel, type Papel } from "./papeis";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Formulario = {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    role: Papel;
    equipeId: string;
    funcaoVisual: string;
    ativo: boolean;
};

type CampoTexto = Exclude<keyof Formulario, "role" | "ativo">;

/** Campos de texto na ordem do formulário (o papel entra depois do telefone): [campo, chave i18n do rótulo, tipo do input]. */
const CAMPOS_TEXTO: [CampoTexto, string, string][] = [
    ["nome", "name", "text"],
    ["email", "email", "email"],
    ["cpf", "cpf", "text"],
    ["telefone", "phone", "tel"],
    ["equipeId", "team", "text"],
    ["funcaoVisual", "function", "text"],
];

interface AdminUsuarioModalProps {
    usuario: AdminUser;
    onClose: () => void;
    onSalvo: (usuario: AdminUser) => void;
}

function AdminUsuarioModal({ usuario, onClose, onSalvo }: AdminUsuarioModalProps) {
    const { t } = useTranslation();
    const [form, setForm] = useState<Formulario>(() => ({
        nome: usuario.nome ?? "",
        email: usuario.email ?? "",
        cpf: usuario.cpf ?? "",
        telefone: usuario.telefone ?? "",
        role: ehPapel(usuario.role) ? usuario.role : "CLIENTE",
        equipeId: usuario.equipeId ?? "",
        funcaoVisual: usuario.funcaoVisual ?? "",
        ativo: usuario.ativo,
    }));
    const [erros, setErros] = useState<Partial<Record<"nome" | "email", string>>>({});
    const [erro, setErro] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    function atualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
        setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    }

    async function salvar() {
        const nome = form.nome.trim();
        const email = form.email.trim();
        const novosErros: typeof erros = {};
        if (!nome) novosErros.nome = t("admin.users.validation.nameRequired");
        if (!email) novosErros.email = t("admin.users.validation.emailRequired");
        else if (!EMAIL_RE.test(email)) novosErros.email = t("admin.users.validation.emailInvalid");
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

        setSalvando(true);
        setErro(null);
        try {
            const salvo = await atualizarAdminUser(usuario.id, {
                nome,
                email,
                cpf: form.cpf.trim() || undefined,
                telefone: form.telefone.trim() || undefined,
                role: form.role,
                equipeId: form.equipeId.trim() || undefined,
                funcaoVisual: form.funcaoVisual.trim() || undefined,
                ativo: form.ativo,
            });
            onSalvo(salvo);
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            setErro(t("admin.errors.save"));
            setSalvando(false);
        }
    }

    function campoTexto([campo, rotulo, tipo]: (typeof CAMPOS_TEXTO)[number]) {
        const erroCampo = campo === "nome" || campo === "email" ? erros[campo] : undefined;
        return (
            <div className="input-group" key={campo}>
                <label htmlFor={`admin-user-${campo}`}>{t(`admin.users.fields.${rotulo}`)}</label>
                <input
                    id={`admin-user-${campo}`}
                    type={tipo}
                    value={form[campo]}
                    onChange={(event) => atualizar(campo, event.target.value)}
                    aria-invalid={!!erroCampo}
                    disabled={salvando}
                />
                {erroCampo && <span className="error-text">{erroCampo}</span>}
            </div>
        );
    }

    return (
        <AdminFormModal
            id="admin-edit-user-title"
            kicker={t("admin.users.editTitle")}
            titulo={usuario.nome}
            descricao={t("admin.users.editDescription")}
            erro={erro}
            salvando={salvando}
            onClose={onClose}
            onSubmit={() => void salvar()}
        >
            {CAMPOS_TEXTO.slice(0, 4).map(campoTexto)}

            <div className="input-group">
                <label htmlFor="admin-user-role">{t("admin.users.fields.role")}</label>
                <Select
                    id="admin-user-role"
                    value={form.role}
                    onChange={(valor) => atualizar("role", valor as Papel)}
                    disabled={salvando}
                    options={PAPEIS.map((papel) => ({ value: papel, label: t(`equipe.roles.${papel}`) }))}
                />
            </div>

            {CAMPOS_TEXTO.slice(4).map(campoTexto)}

            <label className="material-check">
                <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(event) => atualizar("ativo", event.target.checked)}
                    disabled={salvando}
                />
                <span>{t("admin.users.fields.active")}</span>
            </label>
        </AdminFormModal>
    );
}

export default AdminUsuarioModal;
