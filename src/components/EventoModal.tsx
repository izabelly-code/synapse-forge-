import EventService from '../services/EventService';
import { EventData } from '../types';
import React, { useState } from 'react';
import './EventoModal.css';

interface EventoModalProps {
  evento: Partial<EventData> | null;
  mode?: 'view' | 'create';
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, dados: Partial<EventData>) => void;
}

interface FormData {
  id?: string;
  nome: string;
  descricao: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  participantes: string[];
}

function EventoModal({ evento, mode = 'view', onClose, onDelete, onUpdate }: EventoModalProps) {
  const isCreateMode = mode === 'create';
  
  const [newParticipant, setNewParticipant] = useState('');
  const [editando, setEditando] = useState(isCreateMode);
  const [formData, setFormData] = useState<FormData>({
    id: evento?.id,
    nome: evento?.nome || '',
    descricao: evento?.descricao || '',
    data: evento?.data || '',
    horarioInicio: evento?.horarioInicio || '',
    horarioFim: evento?.horarioFim || '',
    participantes: evento?.participantes || [],
  });

  if (!evento) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdicionarParticipante = () => {
    const participante = newParticipant.trim();
    if (!participante) return;
    setFormData((prev) => ({
      ...prev,
      participantes: [...prev.participantes, participante],
    }));
    setNewParticipant('');
  };

  const handleRemoverParticipante = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participantes: prev.participantes.filter((_, idx) => idx !== index),
    }));
  };

  const handleSalvar = async () => {
    if (!formData.nome.trim() || !formData.data) {
      window.alert('Por favor, preencha o título e a data do evento.');
      return;
    }

    if (isCreateMode) {
      try {
        const novoEvento = await EventService.criarEvento(
          localStorage.getItem("userId") || '',
          formData.nome,
          formData.data,
          formData.descricao || '',
          formData.horarioInicio || '',
          formData.horarioFim || '',
          formData.participantes || []
        );

        return novoEvento;
      } catch (error) {
        console.error('Erro ao criar evento via EventService:', error);
        window.alert('Não foi possível criar o evento. Tente novamente.');
      }
    } else if (onUpdate && evento.id) {
      onUpdate(evento.id, formData);
      setEditando(false);
    }
  };

  const handleCancelar = () => {
    if (isCreateMode) {
      onClose();
    } else {
      setEditando(false);
      setFormData({
        nome: evento.nome || '',
        descricao: evento.descricao || '',
        data: evento.data || '',
        horarioInicio: evento.horarioInicio || '',
        horarioFim: evento.horarioFim || '',
        participantes: evento.participantes || [],
      });
    }
  };

  const handleDeletar = () => {
    if (globalThis.confirm('Tem certeza que deseja deletar este evento?')) {
      if (onDelete && evento.id) {
        onDelete(evento.id);
      }
    }
  };

  const formatarData = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  let modalTitle = 'Detalhes do evento';
  if (isCreateMode) {
    modalTitle = 'Criar novo evento';
  } else if (editando) {
    modalTitle = 'Editar Evento';
  } else if (evento.nome) {
    modalTitle = evento.nome;
  }

  return (
    <div
      className="evento-modal-overlay"
      onClick={onClose}
    >
      <div
        className="evento-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="evento-modal-header">
          <h2 className="evento-modal-titulo">{modalTitle}</h2>
          <button className="evento-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="evento-modal-body">
          {editando ? (
            <form className="evento-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="nome">Título do Evento</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Digite o título do evento"
                />
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Digite a descrição do evento"
                  rows={4}
                />
              </div>

              <div className="field-row">
                <div className="form-group">
                  <label htmlFor="data">Data</label>
                  <input
                    type="date"
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="horarioInicio">Início</label>
                  <input
                    type="time"
                    id="horarioInicio"
                    name="horarioInicio"
                    value={formData.horarioInicio}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="horarioFim">Fim</label>
                  <input
                    type="time"
                    id="horarioFim"
                    name="horarioFim"
                    value={formData.horarioFim}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="participantes">Participantes</label>
                <div className="participants-input-row">
                  <input
                    type="text"
                    id="participantes"
                    name="participantes"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    placeholder="Adicionar participante"
                  />
                  <button type="button" className="btn btn-secondary mini" onClick={handleAdicionarParticipante}>
                    Adicionar
                  </button>
                </div>
                <div className="participants-list">
                  {formData.participantes.length > 0 ? (
                    formData.participantes.map((nome, index) => (
                      <span key={`${nome}-${index}`} className="participant-chip">
                        {nome}
                        <button type="button" onClick={() => handleRemoverParticipante(index)} aria-label={`Remover ${nome}`}>
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="no-participants">Nenhum participante adicionado.</p>
                  )}
                </div>
              </div>

            </form>
          ) : (
            <div className="evento-detalhes">
              <div className="detalhe-item">
                <span className="detalhe-label">📅 Data</span>
                <span className="detalhe-valor">{evento.data ? formatarData(evento.data) : ''}</span>
              </div>

              {evento.descricao && (
                <div className="detalhe-item">
                  <span className="detalhe-label">📝 Descrição</span>
                  <span className="detalhe-valor">{evento.descricao}</span>
                </div>
              )}

              {evento.horarioInicio && evento.horarioFim && (
                <div className="detalhe-item">
                  <span className="detalhe-label">⏱ Horário</span>
                  <span className="detalhe-valor">{evento.horarioInicio} - {evento.horarioFim}</span>
                </div>
              )}

              <div className="detalhe-item">
                <span className="detalhe-label">👥 Participantes</span>
                <span className="detalhe-valor">
                  {evento.participantes && evento.participantes.length > 0
                    ? evento.participantes.join(', ')
                    : 'Nenhum participante'}
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
                onClick={handleCancelar}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSalvar}>
                {isCreateMode ? 'Criar Evento' : 'Salvar Alterações'}
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
                className="btn btn-secondary"
                onClick={onClose}
              >
                Fechar
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
