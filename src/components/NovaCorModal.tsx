import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { criarCor, editarCor, CorInput } from "../services/CorService";
import { Cor, Acabamento } from "../types";

interface NovaCorModalProps {
    onClose: () => void;
    onSalvo: () => void;
    cor?: Cor;
}

type CampoErro = "nome" | "fornecedor" | "estoqueMl" | "custoMl";
type Erros = Partial<Record<CampoErro, string>>;

const ACABAMENTOS: { value: Acabamento; label: string }[] = [
    { value: "FOSCO", label: "Fosco" },
    { value: "BRILHANTE", label: "Brilhante" },
    { value: "METALICO", label: "Metálico" },
    { value: "CETIM", label: "Cetim" },
];

function NovaCorModal({ onClose, onSalvo, cor }: NovaCorModalProps) {
    const editando = !!cor;

    const [nome, setNome] = useState(cor?.nome ?? "");
    const [fornecedor, setFornecedor] = useState(cor?.fornecedor ?? "");
    const [codigo, setCodigo] = useState(cor?.codigo ?? "");
    const [hex, setHex] = useState(cor?.hex ?? "#FB4A14");
    const [acabamento, setAcabamento] = useState<Acabamento>(cor?.acabamento ?? "FOSCO");
    const [estoqueMl, setEstoqueMl] = useState(cor ? String(cor.estoqueMl) : "");
    const [estoqueMinimoMl, setEstoqueMinimoMl] = useState(cor ? String(cor.estoqueMinimoMl) : "500");
    const [custoMl, setCustoMl] = useState(cor ? String(cor.custoMl) : "");
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<Erros>({});
    const [erroEnvio, setErroEnvio] = useState("");

    const nomeRef = useRef<HTMLInputElement>(null);
    const fornecedorRef = useRef<HTMLInputElement>(null);
    const estoqueRef = useRef<HTMLInputElement>(null);
    const custoRef = useRef<HTMLInputElement>(null);

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
        if (!nome.trim()) e.nome = "Informe o nome da cor.";
        if (!fornecedor.trim()) e.fornecedor = "Informe o fornecedor.";
        if (estoqueMl === "" || Number(estoqueMl) < 0) e.estoqueMl = "Informe um estoque válido.";
        if (custoMl === "" || Number(custoMl) < 0) e.custoMl = "Informe um custo válido.";
        return e;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setErroEnvio("");

        const novosErros = validar();
        if (Object.keys(novosErros).length > 0) {
            setErros(novosErros);
            if (novosErros.nome) nomeRef.current?.focus();
            else if (novosErros.fornecedor) fornecedorRef.current?.focus();
            else if (novosErros.estoqueMl) estoqueRef.current?.focus();
            else if (novosErros.custoMl) custoRef.current?.focus();
            return;
        }

        const data: CorInput = {
            nome: nome.trim(),
            fornecedor: fornecedor.trim(),
            codigo: codigo.trim() || undefined,
            hex,
            acabamento,
            estoqueMl: Number(estoqueMl),
            estoqueMinimoMl: Number(estoqueMinimoMl) || 0,
            custoMl: Number(custoMl),
        };

        try {
            setLoading(true);
            if (editando) {
                await editarCor(cor!.id, data);
            } else {
                await criarCor(data);
            }
            onSalvo();
        } catch {
            setErroEnvio(editando ? "Erro ao salvar cor. Tente novamente." : "Erro ao criar cor. Tente novamente.");
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
                aria-labelledby="cor-modal-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 id="cor-modal-titulo">{editando ? "Editar cor" : "Nova cor"}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {erroEnvio && <p className="error">{erroEnvio}</p>}

                    <div className="cor-modal-topo">
                        <div className="cor-modal-swatch-wrap">
                            <span className="cor-modal-swatch" style={{ background: hex }} aria-hidden="true" />
                            <input
                                type="color"
                                className="cor-modal-color-input"
                                value={hex}
                                onChange={(e) => setHex(e.target.value)}
                                aria-label="Selecionar cor"
                            />
                        </div>
                        <div className="input-group cor-modal-hex">
                            <label htmlFor="hex">Cor (HEX)</label>
                            <input
                                id="hex"
                                value={hex}
                                onChange={(e) => setHex(e.target.value)}
                                placeholder="#FB4A14"
                            />
                            <span className="input-hint" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="nome">Nome da cor</label>
                        <input
                            id="nome"
                            ref={nomeRef}
                            className={erros.nome ? "input-error" : ""}
                            value={nome}
                            onChange={(e) => { setNome(e.target.value); limparErro("nome"); }}
                            placeholder="Ex.: Vermelho Queimado"
                            aria-invalid={!!erros.nome}
                            autoFocus
                        />
                        <span className="input-hint">
                            {erros.nome && <span className="error-text">{erros.nome}</span>}
                        </span>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="fornecedor">Fornecedor</label>
                            <input
                                id="fornecedor"
                                ref={fornecedorRef}
                                className={erros.fornecedor ? "input-error" : ""}
                                value={fornecedor}
                                onChange={(e) => { setFornecedor(e.target.value); limparErro("fornecedor"); }}
                                placeholder="Ex.: Suvinil"
                                aria-invalid={!!erros.fornecedor}
                            />
                            <span className="input-hint">
                                {erros.fornecedor && <span className="error-text">{erros.fornecedor}</span>}
                            </span>
                        </div>

                        <div className="input-group">
                            <label htmlFor="codigo">
                                Código <span className="label-opcional">(opcional)</span>
                            </label>
                            <input
                                id="codigo"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                placeholder="Ex.: SV-072"
                            />
                            <span className="input-hint" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="acabamento">Acabamento</label>
                        <select
                            id="acabamento"
                            className="cor-modal-select"
                            value={acabamento}
                            onChange={(e) => setAcabamento(e.target.value as Acabamento)}
                        >
                            {ACABAMENTOS.map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                        <span className="input-hint" />
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="estoque">Estoque (ml)</label>
                            <input
                                id="estoque"
                                ref={estoqueRef}
                                type="number"
                                min={0}
                                className={erros.estoqueMl ? "input-error" : ""}
                                value={estoqueMl}
                                onChange={(e) => { setEstoqueMl(e.target.value); limparErro("estoqueMl"); }}
                                placeholder="0"
                                aria-invalid={!!erros.estoqueMl}
                            />
                            <span className="input-hint">
                                {erros.estoqueMl && <span className="error-text">{erros.estoqueMl}</span>}
                            </span>
                        </div>

                        <div className="input-group">
                            <label htmlFor="estoqueMin">Estoque mínimo (ml)</label>
                            <input
                                id="estoqueMin"
                                type="number"
                                min={0}
                                value={estoqueMinimoMl}
                                onChange={(e) => setEstoqueMinimoMl(e.target.value)}
                                placeholder="500"
                            />
                            <span className="input-hint" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="custo">Custo por ml (R$)</label>
                        <input
                            id="custo"
                            ref={custoRef}
                            type="number"
                            min={0}
                            step="0.01"
                            className={erros.custoMl ? "input-error" : ""}
                            value={custoMl}
                            onChange={(e) => { setCustoMl(e.target.value); limparErro("custoMl"); }}
                            placeholder="0,00"
                            aria-invalid={!!erros.custoMl}
                        />
                        <span className="input-hint">
                            {erros.custoMl && <span className="error-text">{erros.custoMl}</span>}
                        </span>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="button" disabled={loading}>
                            {loading ? (editando ? "Salvando..." : "Criando...") : (editando ? "Salvar" : "Criar cor")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NovaCorModal;
