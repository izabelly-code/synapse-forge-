import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { criarMaterial, editarMaterial } from "../services/MaterialService";
import { Material } from "../models/Material";

interface MaterialModalProps {
    material?: Material;
    onClose: () => void;
    onSalvo: () => void;
}

type CampoErro = "nome" | "tipo" | "densidadeGcm3" | "precoPorGrama";
type Erros = Partial<Record<CampoErro, string>>;

function MaterialModal({ material, onClose, onSalvo }: MaterialModalProps) {
    const editando = !!material;

    const [nome, setNome] = useState(material?.nome ?? "");
    const [tipo, setTipo] = useState(material?.tipo ?? "");
    const [densidade, setDensidade] = useState(material ? String(material.densidadeGcm3) : "");
    const [preco, setPreco] = useState(material ? String(material.precoPorGrama) : "");
    const [ativo, setAtivo] = useState(material?.ativo ?? true);
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");

    const nomeRef = useRef<HTMLInputElement>(null);
    const tipoRef = useRef<HTMLInputElement>(null);
    const densidadeRef = useRef<HTMLInputElement>(null);
    const precoRef = useRef<HTMLInputElement>(null);

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
        if (!nome.trim()) e.nome = "Informe o nome do material.";
        if (!tipo.trim()) e.tipo = "Informe o tipo.";
        const dens = Number(densidade);
        if (!densidade || isNaN(dens) || dens <= 0) e.densidadeGcm3 = "Informe uma densidade positiva.";
        const prc = Number(preco);
        if (!preco || isNaN(prc) || prc < 0) e.precoPorGrama = "Informe um preço válido.";
        return e;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setErroEnvio("");

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            if (novosErros.nome) nomeRef.current?.focus();
            else if (novosErros.tipo) tipoRef.current?.focus();
            else if (novosErros.densidadeGcm3) densidadeRef.current?.focus();
            else if (novosErros.precoPorGrama) precoRef.current?.focus();
            return;
        }

        const data = {
            nome: nome.trim(),
            tipo: tipo.trim(),
            densidadeGcm3: Number(densidade),
            precoPorGrama: Number(preco),
            ativo: editando ? ativo : true,
        };

        try {
            setLoading(true);
            if (editando) {
                await editarMaterial(material!.id, data);
            } else {
                await criarMaterial(data);
            }
            onSalvo();
        } catch {
            setErroEnvio(editando ? "Erro ao salvar material. Tente novamente." : "Erro ao criar material. Tente novamente.");
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
                    <h2 id="modal-titulo">{editando ? "Editar Material" : "Novo Material"}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {erroEnvio && <p className="error">{erroEnvio}</p>}

                    <div className="input-group">
                        <label htmlFor="nome">Nome</label>
                        <input
                            id="nome"
                            ref={nomeRef}
                            className={erros.nome ? "input-error" : ""}
                            value={nome}
                            onChange={(e) => { setNome(e.target.value); limparErro("nome"); }}
                            placeholder="Nome do material"
                            aria-invalid={!!erros.nome}
                            aria-describedby={erros.nome ? "nome-erro" : undefined}
                            autoFocus
                        />
                        <span className="input-hint" id="nome-erro">
                            {erros.nome && <span className="error-text">{erros.nome}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="tipo">Tipo</label>
                        <input
                            id="tipo"
                            ref={tipoRef}
                            className={erros.tipo ? "input-error" : ""}
                            value={tipo}
                            onChange={(e) => { setTipo(e.target.value); limparErro("tipo"); }}
                            placeholder="Ex: RESINA, PLA, ABS"
                            aria-invalid={!!erros.tipo}
                            aria-describedby={erros.tipo ? "tipo-erro" : undefined}
                        />
                        <span className="input-hint" id="tipo-erro">
                            {erros.tipo && <span className="error-text">{erros.tipo}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="densidade">Densidade (g/cm³)</label>
                        <input
                            id="densidade"
                            ref={densidadeRef}
                            type="number"
                            step="0.01"
                            min="0.01"
                            className={erros.densidadeGcm3 ? "input-error" : ""}
                            value={densidade}
                            onChange={(e) => { setDensidade(e.target.value); limparErro("densidadeGcm3"); }}
                            placeholder="Ex: 1.10"
                            aria-invalid={!!erros.densidadeGcm3}
                            aria-describedby={erros.densidadeGcm3 ? "densidade-erro" : undefined}
                        />
                        <span className="input-hint" id="densidade-erro">
                            {erros.densidadeGcm3 && <span className="error-text">{erros.densidadeGcm3}</span>}
                        </span>
                    </div>

                    <div className="input-group">
                        <label htmlFor="preco">Preço por grama (R$)</label>
                        <input
                            id="preco"
                            ref={precoRef}
                            type="number"
                            step="0.001"
                            min="0"
                            className={erros.precoPorGrama ? "input-error" : ""}
                            value={preco}
                            onChange={(e) => { setPreco(e.target.value); limparErro("precoPorGrama"); }}
                            placeholder="Ex: 0.132"
                            aria-invalid={!!erros.precoPorGrama}
                            aria-describedby={erros.precoPorGrama ? "preco-erro" : undefined}
                        />
                        <span className="input-hint" id="preco-erro">
                            {erros.precoPorGrama && <span className="error-text">{erros.precoPorGrama}</span>}
                        </span>
                    </div>

                    {editando && (
                        <div className="input-group">
                            <label className="material-check">
                                <input
                                    type="checkbox"
                                    checked={ativo}
                                    onChange={(e) => setAtivo(e.target.checked)}
                                />
                                <span>Ativo</span>
                            </label>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="button" disabled={loading}>
                            {loading ? (editando ? "Salvando..." : "Criando...") : (editando ? "Salvar" : "Criar Material")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MaterialModal;
