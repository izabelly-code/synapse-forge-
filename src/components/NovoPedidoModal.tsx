import { useState } from "react";
import { criarPedido, editarPedido } from "../services/PedidoService";
import { Pedido } from "../types";

interface NovoPedidoModalProps {
    onClose: () => void;
    onCriado: () => void;
    pedido?: Pedido;
}

function NovoPedidoModal({ onClose, onCriado, pedido }: NovoPedidoModalProps) {
    const editando = !!pedido;

    const [cliente, setCliente] = useState(pedido?.cliente ?? "");
    const [projeto, setProjeto] = useState(pedido?.projeto ?? "");
    const [descricao, setDescricao] = useState(pedido?.descricao ?? "");
    const [prazo, setPrazo] = useState(pedido?.prazo ?? "");
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const hoje = new Date().toISOString().split("T")[0];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro("");

        if (!cliente.trim()) return setErro("Informe o nome do cliente.");
        if (!projeto.trim()) return setErro("Informe o nome do projeto.");
        if (!prazo) return setErro("Informe o prazo.");

        const data = {
            cliente: cliente.trim(),
            projeto: projeto.trim(),
            descricao: descricao.trim() || undefined,
            prazo,
        };

        try {
            setLoading(true);
            if (editando) {
                await editarPedido(pedido!.id, data);
            } else {
                await criarPedido(data);
            }
            onCriado();
        } catch {
            setErro(editando ? "Erro ao salvar pedido. Tente novamente." : "Erro ao criar pedido. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2>{editando ? "Editar Pedido" : "Novo Pedido"}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {erro && <p className="error">{erro}</p>}

                    <div className="input-group">
                        <label htmlFor="cliente">Cliente</label>
                        <input
                            id="cliente"
                            value={cliente}
                            onChange={(e) => setCliente(e.target.value)}
                            placeholder="Nome do cliente"
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="projeto">Projeto</label>
                        <input
                            id="projeto"
                            value={projeto}
                            onChange={(e) => setProjeto(e.target.value)}
                            placeholder="Nome do projeto"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="descricao">
                            Descrição <span className="label-opcional">(opcional)</span>
                        </label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Detalhes do pedido..."
                            rows={3}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="prazo">Prazo</label>
                        <input
                            id="prazo"
                            type="date"
                            value={prazo}
                            onChange={(e) => setPrazo(e.target.value)}
                            min={editando ? undefined : hoje}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="button" disabled={loading}>
                            {loading ? (editando ? "Salvando..." : "Criando...") : (editando ? "Salvar" : "Criar Pedido")}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default NovoPedidoModal;
