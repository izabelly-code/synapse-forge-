import { useState } from "react";
import { useTranslation } from "react-i18next";

import { atualizarAdminPedido, type AdminPedido, type AdminUser } from "../../services/adminService";
import { hojeISO } from "../../utils/format";
import Select from "../ui/Select";
import AdminFormModal from "./AdminFormModal";

type Formulario = {
    clienteId: string;
    projeto: string;
    descricao: string;
    prazo: string;
};

interface AdminPedidoModalProps {
    pedido: AdminPedido;
    /** Clientes da plataforma toda: o admin não é limitado à própria equipe. */
    clientes: AdminUser[];
    onClose: () => void;
    onSalvo: (pedido: AdminPedido) => void;
}

/**
 * Edição dos dados do pedido pelo painel Admin. Usa `PUT /admin/pedidos/{id}`, que alcança pedidos
 * de qualquer equipe (o `/pedidos` comum é isolado por equipe desde a SYN-100). Arquivos (objeto 3D
 * e imagens) ficam fora: o endpoint de admin só recebe JSON.
 */
function AdminPedidoModal({ pedido, clientes, onClose, onSalvo }: AdminPedidoModalProps) {
    const { t } = useTranslation();
    const prazoOriginal = pedido.prazo ? String(pedido.prazo).slice(0, 10) : "";
    const [form, setForm] = useState<Formulario>({
        clienteId: pedido.clienteId ?? "",
        projeto: pedido.projeto ?? "",
        descricao: pedido.descricao ?? "",
        prazo: prazoOriginal,
    });
    const [erros, setErros] = useState<Partial<Record<"projeto" | "prazo", string>>>({});
    const [erro, setErro] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const hoje = hojeISO();

    function atualizar(campo: keyof Formulario, valor: string) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
        setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    }

    async function salvar() {
        const novosErros: typeof erros = {};
        if (!form.projeto.trim()) novosErros.projeto = t("pedidos.form.errorProject");
        if (!form.prazo) novosErros.prazo = t("pedidos.form.errorDeadline");
        // Um pedido atrasado pode ser corrigido sem mexer no prazo; só um prazo NOVO no passado é recusado.
        else if (form.prazo !== prazoOriginal && form.prazo < hoje) novosErros.prazo = t("pedidos.form.errorDeadlinePast");
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

        const cliente = clientes.find((usuario) => usuario.id === form.clienteId);
        setSalvando(true);
        setErro(null);
        try {
            const salvo = await atualizarAdminPedido(pedido.id, {
                // O backend ignora campos nulos: sem cliente escolhido, o vínculo atual fica como está.
                clienteId: cliente?.id,
                cliente: cliente?.nome,
                projeto: form.projeto.trim(),
                descricao: form.descricao.trim(),
                prazo: form.prazo,
            });
            onSalvo(salvo);
        } catch (error) {
            console.error("Erro ao atualizar pedido:", error);
            setErro(t("admin.errors.saveOrder"));
            setSalvando(false);
        }
    }

    return (
        <AdminFormModal
            id="admin-edit-order-title"
            kicker={t("admin.orders.editTitle")}
            titulo={form.projeto || t("admin.orders.editTitle")}
            descricao={t("admin.orders.editDescription")}
            erro={erro}
            salvando={salvando}
            onClose={onClose}
            onSubmit={() => void salvar()}
        >
            <div className="input-group">
                <label htmlFor="admin-pedido-cliente">{t("admin.orders.fields.client")}</label>
                <Select
                    id="admin-pedido-cliente"
                    value={form.clienteId}
                    onChange={(valor) => atualizar("clienteId", valor)}
                    disabled={salvando}
                    options={[
                        { value: "", label: pedido.cliente || t("pedidos.form.noClientLinked") },
                        ...clientes.map((usuario) => ({ value: usuario.id, label: `${usuario.nome} — ${usuario.email}` })),
                    ]}
                />
            </div>

            <div className="pedido-edit-grid">
                <div className="input-group">
                    <label htmlFor="admin-pedido-projeto">{t("admin.orders.fields.project")}</label>
                    <input
                        id="admin-pedido-projeto"
                        type="text"
                        className={erros.projeto ? "input-error" : undefined}
                        value={form.projeto}
                        onChange={(event) => atualizar("projeto", event.target.value)}
                        aria-invalid={!!erros.projeto}
                        disabled={salvando}
                    />
                    {erros.projeto && <span className="error-text">{erros.projeto}</span>}
                </div>

                <div className="input-group">
                    <label htmlFor="admin-pedido-prazo">{t("admin.orders.fields.deadline")}</label>
                    <input
                        id="admin-pedido-prazo"
                        type="date"
                        className={erros.prazo ? "input-error" : undefined}
                        value={form.prazo}
                        min={prazoOriginal && prazoOriginal < hoje ? prazoOriginal : hoje}
                        onChange={(event) => atualizar("prazo", event.target.value)}
                        aria-invalid={!!erros.prazo}
                        disabled={salvando}
                    />
                    {erros.prazo && <span className="error-text">{erros.prazo}</span>}
                </div>
            </div>

            <div className="input-group">
                <label htmlFor="admin-pedido-descricao">{t("admin.orders.fields.description")}</label>
                <textarea
                    id="admin-pedido-descricao"
                    rows={4}
                    value={form.descricao}
                    onChange={(event) => atualizar("descricao", event.target.value)}
                    disabled={salvando}
                />
            </div>
        </AdminFormModal>
    );
}

export default AdminPedidoModal;
