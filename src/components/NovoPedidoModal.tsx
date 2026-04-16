import { useState } from "react";
import { criarPedido } from "../services/PedidoService";

interface NovoPedidoModalProps {
    onClose: () => void;
    onCriado: () => void;
}

function NovoPedidoModal({ onClose, onCriado }: NovoPedidoModalProps) {
    const [cliente, setCliente] = useState("");
    const [projeto, setProjeto] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prazo, setPrazo] = useState("");
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const hoje = new Date().toISOString().split("T")[0];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro("");

        if (!cliente.trim()) return setErro("Informe o nome do cliente.");
        if (!projeto.trim()) return setErro("Informe o nome do projeto.");
        if (!prazo) return setErro("Informe o prazo.");

        try {
            setLoading(true);
            await criarPedido({
                cliente: cliente.trim(),
                projeto: projeto.trim(),
                descricao: descricao.trim() || undefined,
                prazo,
            });
            onCriado();
        } catch {
            setErro("Erro ao criar pedido. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                <div className="modal-header">
                    <h2>Novo Pedido</h2>
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
                            min={hoje}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="button" disabled={loading}>
                            {loading ? "Criando..." : "Criar Pedido"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default NovoPedidoModal;
