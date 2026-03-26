import React, { useState } from 'react';
import './EventoModal.css';

/**
 * Componente Modal para exibir e editar eventos
 *
 * @param {Object} evento - Dados do evento
 * @param {Function} onClose - Callback para fechar modal
 * @param {Function} onDelete - Callback para deletar evento
 * @param {Function} onUpdate - Callback para atualizar evento
 */
function EventoModal({ evento, onClose, onDelete, onUpdate }) {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nome: evento.nome,
    descricao: evento.descricao,
    cor: evento.cor,
  });

  if (!evento) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSalvar = () => {
    if (onUpdate) {
      onUpdate(evento.id, formData);
      setEditando(false);
    }
  };

  const handleDeletar = () => {
    if (window.confirm('Tem certeza que deseja deletar este evento?')) {
      if (onDelete) {
        onDelete(evento.id);
      }
    }
  };

  const formatarData = (dataStr) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarDataHora = (dataStr) => {
    if (!dataStr) return 'N/A';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="evento-modal-overlay" onClick={onClose}>
      <div className="evento-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="evento-modal-header">
          <div
            className="evento-modal-cor"
            style={{ backgroundColor: evento.cor }}
          />
          <h2 className="evento-modal-titulo">
            {editando ? 'Editar Evento' : evento.nome}
          </h2>
          <button className="evento-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="evento-modal-body">
          {editando ? (
            <form className="evento-form">
              {/* Nome */}
              <div className="form-group">
                <label htmlFor="nome">Nome do Evento</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Digite o nome do evento"
                />
              </div>

              {/* Descrição */}
              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Digite a descrição do evento"
                  rows="4"
                />
              </div>

              {/* Cor */}
              <div className="form-group">
                <label htmlFor="cor">Cor</label>
                <div className="color-picker">
                  <input
                    type="color"
                    id="cor"
                    name="cor"
                    value={formData.cor}
                    onChange={handleInputChange}
                  />
                  <span className="color-value">{formData.cor}</span>
                </div>
              </div>
            </form>
          ) : (
            <div className="evento-detalhes">
              {/* Data */}
              <div className="detalhe-item">
                <span className="detalhe-label">📅 Data</span>
                <span className="detalhe-valor">{formatarData(evento.data)}</span>
              </div>

              {/* Descrição */}
              {evento.descricao && (
                <div className="detalhe-item">
                  <span className="detalhe-label">📝 Descrição</span>
                  <span className="detalhe-valor">{evento.descricao}</span>
                </div>
              )}

              {/* Usuário */}
              <div className="detalhe-item">
                <span className="detalhe-label">👤 Usuário</span>
                <span className="detalhe-valor">{evento.user_id}</span>
              </div>

              {/* Data de Criação */}
              <div className="detalhe-item">
                <span className="detalhe-label">➕ Criado em</span>
                <span className="detalhe-valor">
                  {formatarDataHora(evento.criado_em)}
                </span>
              </div>

              {/* Data de Atualização */}
              <div className="detalhe-item">
                <span className="detalhe-label">✏️ Atualizado em</span>
                <span className="detalhe-valor">
                  {formatarDataHora(evento.atualizado_em)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="evento-modal-footer">
          {editando ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setEditando(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSalvar}>
                Salvar Alterações
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-danger"
                onClick={handleDeletar}
              >
                Deletar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setEditando(true)}
              >
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventoModal;
