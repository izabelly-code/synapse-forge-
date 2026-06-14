import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { criarPedido } from "../../services/PedidoService";

interface NovoPedidoModalProps {
    onClose: () => void;
    onCriado: () => void;
}

type CampoErro = "cliente" | "projeto" | "prazo";
type Erros = Partial<Record<CampoErro, string>>;

function NovoPedidoModal({ onClose, onCriado }: NovoPedidoModalProps) {
    const [cliente, setCliente] = useState("");
    const [projeto, setProjeto] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prazo, setPrazo] = useState("");
    const [objeto3D, setObjeto3D] = useState<File | null>(null);
    const [imagensReferencia, setImagensReferencia] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");

    const clienteRef = useRef<HTMLInputElement>(null);
    const projetoRef = useRef<HTMLInputElement>(null);
    const prazoRef = useRef<HTMLInputElement>(null);

    const hoje = new Date().toISOString().split("T")[0];

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflowAnterior;
        };
    }, [onClose]);

    function limparErro(campo: CampoErro) {
        setErros((prev) => {
            if (!prev[campo]) return prev;
            const next = { ...prev };
            delete next[campo];
            return next;
        });
    }

    function validar(): Erros {
        const e: Erros = {};
        if (!cliente.trim()) e.cliente = "Informe o nome do cliente.";
        if (!projeto.trim()) e.projeto = "Informe o nome do projeto.";
        if (!prazo) e.prazo = "Informe o prazo.";
        return e;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setErroEnvio("");

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            if (novosErros.cliente) clienteRef.current?.focus();
            else if (novosErros.projeto) projetoRef.current?.focus();
            else if (novosErros.prazo) prazoRef.current?.focus();
            return;
        }

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
            await criarPedido(data);
            onCriado();
        } catch {
            setErroEnvio("Erro ao criar pedido. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 id="modal-titulo">Novo Pedido</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {erroEnvio && <p className="error">{erroEnvio}</p>}

                    <div className="input-group">
                        <label htmlFor="cliente">Cliente</label>
                        <input
                            id="cliente"
                            ref={clienteRef}
                            className={erros.cliente ? "input-error" : ""}
                            value={cliente}
                            onChange={(e) => { setCliente(e.target.value); limparErro("cliente"); }}
                            placeholder="Nome do cliente"
                            aria-invalid={!!erros.cliente}
                            aria-describedby={erros.cliente ? "cliente-erro" : undefined}
                            autoFocus
                        />
                        <span className="input-hint" id="cliente-erro">
                            {erros.cliente && <span className="error-text">{erros.cliente}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="projeto">Projeto</label>
                        <input
                            id="projeto"
                            ref={projetoRef}
                            className={erros.projeto ? "input-error" : ""}
                            value={projeto}
                            onChange={(e) => { setProjeto(e.target.value); limparErro("projeto"); }}
                            placeholder="Nome do projeto"
                            aria-invalid={!!erros.projeto}
                            aria-describedby={erros.projeto ? "projeto-erro" : undefined}
                        />
                        <span className="input-hint" id="projeto-erro">
                            {erros.projeto && <span className="error-text">{erros.projeto}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Detalhes do pedido, referências, acabamento desejado..."
                            rows={3}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="objeto3D">
                            Upload do objeto 3D
                        </label>
                        <input
                            id="objeto3D"
                            type="file"
                            accept=".stl,.obj,.fbx,.glb,.gltf,.3mf"
                            onChange={(e) => setObjeto3D(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="imagensReferencia">
                            Upload de imagens de referência
                        </label>
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
                            ref={prazoRef}
                            type="date"
                            className={erros.prazo ? "input-error" : ""}
                            value={prazo}
                            onChange={(e) => { setPrazo(e.target.value); limparErro("prazo"); }}
                            min={hoje}
                            aria-invalid={!!erros.prazo}
                            aria-describedby={erros.prazo ? "prazo-erro" : undefined}
                        />
                        <span className="input-hint" id="prazo-erro">
                            {erros.prazo && <span className="error-text">{erros.prazo}</span>}
                        </span>
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
