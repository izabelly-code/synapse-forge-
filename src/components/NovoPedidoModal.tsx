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
    const [objeto3D, setObjeto3D] = useState<File | null>(null);
    const [imagensReferencia, setImagensReferencia] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const hoje = new Date().toISOString().split("T")[0];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro("");

        if (!cliente.trim()) return setErro("Informe o nome do cliente.");
        if (!projeto.trim()) return setErro("Informe o nome do projeto.");
        if (!descricao.trim()) return setErro("Informe a descrição da modelagem e produção.");
        if (!editando && !objeto3D) return setErro("Envie o objeto 3D.");
        if (!editando && imagensReferencia.length === 0) return setErro("Envie pelo menos uma imagem de referência.");
        if (!prazo) return setErro("Informe o prazo.");

        const data = {
            cliente: cliente.trim(),
            projeto: projeto.trim(),
            descricao: descricao.trim(),
            prazo,
            objeto3D,
            imagensReferencia,
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
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
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
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Detalhes de modelagem e produção..."
                            rows={3}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="objeto3D">
                            Upload do objeto 3D {editando && <span className="label-opcional">(opcional)</span>}
                        </label>
                        {pedido?.objeto3D && (
                            <p className="file-current">Arquivo atual: {pedido.objeto3D}</p>
                        )}
                        <input
                            id="objeto3D"
                            type="file"
                            accept=".stl,.obj,.fbx,.glb,.gltf,.3mf"
                            onChange={(e) => setObjeto3D(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="imagensReferencia">
                            Upload de imagens de referência {editando && <span className="label-opcional">(opcional)</span>}
                        </label>
                        {!!pedido?.imagensReferencia?.length && (
                            <p className="file-current">
                                Imagens atuais: {pedido.imagensReferencia.join(", ")}
                            </p>
                        )}
                        <input
                            id="imagensReferencia"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setImagensReferencia(Array.from(e.target.files ?? []))}
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
