import EventService from '../services/EventService';
import { getUserById, searchUsersByName } from '../services/UserService';
import { EventData, User } from '../types';
import React, { useEffect, useState } from 'react';
import './EventoModal.css';

interface EventoModalProps {
  evento: Partial<EventData> | null;
  mode?: 'view' | 'create';
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, dados: Partial<EventData>) => Promise<void>;
  onSuccess?: () => void;
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

function EventoModal({ evento, mode = 'view', onClose, onDelete, onUpdate, onSuccess }: Readonly<EventoModalProps>) {
  const isCreateMode = mode === 'create';
  
  const [newParticipant, setNewParticipant] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParticipantInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewParticipant(value);

    if (value.trim().length > 3) {
      const token = localStorage.getItem('token');
      const users = await searchUsersByName(value, token);
      setFilteredUsers(users);
      setShowUserSuggestions(true);
    } else {
      setFilteredUsers([]);
      setShowUserSuggestions(false);
    }
  };

  const handleSelectUser = (user: User) => {
    const alreadyAdded = formData.participantes.includes(user.id);
    if (!alreadyAdded) {
      setFormData((prev) => ({
        ...prev,
        participantes: [...prev.participantes, user.id],
      }));
      setParticipantNames((prev) => [...prev, user.nome]);
    }
    setNewParticipant('');
    setFilteredUsers([]);
    setShowUserSuggestions(false);
  };

  const handleAdicionarParticipante = () => {
    const participante = newParticipant.trim();
    if (!participante) return;

    const matchedUser = filteredUsers.find(
      (user) => user.nome.toLowerCase() === participante.toLowerCase() || user.email.toLowerCase() === participante.toLowerCase()
    );

    if (!matchedUser) {
      globalThis.alert('Selecione um usuário válido da lista para adicionar como participante.');
      return;
    }

    handleSelectUser(matchedUser);
  };

  const handleRemoverParticipante = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participantes: prev.participantes.filter((_, idx) => idx !== index),
    }));
    setParticipantNames((prev) => prev.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    async function loadParticipantNames() {
      if (!evento?.participantes?.length) {
        setParticipantNames([]);
        return;
      }

      const token = localStorage.getItem('token');
      const names = await Promise.all(
        evento.participantes.map(async (id) => {
          const user = await getUserById(id, token);
          return user?.nome || id;
        })
      );

      setParticipantNames(names);
    }

    loadParticipantNames();
  }, [evento?.participantes]);

  if (!evento) return null;

  const handleSalvar = async () => {
    if (!formData.nome.trim() || !formData.data) {
      globalThis.alert('Por favor, preencha o título e a data do evento.');
      return;
    }

    if (isCreateMode) {
      try {
        const sucesso = await EventService.criarEvento(
          localStorage.getItem("userId") || '',
          formData.nome,
          formData.data,
          {
            descricao: formData.descricao || '',
            horarioInicio: formData.horarioInicio || '',
            horarioFim: formData.horarioFim || '',
            participantes: formData.participantes || [],
          }
        );

        if (sucesso) {
          if (onSuccess) {
            onSuccess();
          } else {
            onClose();
          }
        } else {
          globalThis.alert('Não foi possível criar o evento. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao criar evento via EventService:', error);
        globalThis.alert('Não foi possível criar o evento. Tente novamente.');
      }
    } else if (onUpdate && evento.id) {
      try {
        await onUpdate(evento.id, formData);
        setEditando(false);
      } catch (error_) {
        console.error('Erro ao atualizar evento:', error_);
        globalThis.alert('Não foi possível salvar as alterações. Tente novamente.');
      }
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
      setParticipantNames(evento.participantes || []);
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
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      id="participantes"
                      name="participantes"
                      value={newParticipant}
                      onChange={handleParticipantInputChange}
                      placeholder="Digite o nome do participante"
                    />
                    {showUserSuggestions && filteredUsers.length > 0 && (
                      <div className="user-suggestions-dropdown">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="user-suggestion-item"
                            onClick={() => handleSelectUser(user)}
                            style={{ cursor: 'pointer', padding: '8px 12px', borderBottom: '1px solid #eee', textAlign: 'left', width: '100%', background: 'transparent', border: 'none' }}
                          >
                            <strong>{user.nome}</strong>
                            <br />
                            <small style={{ color: '#666' }}>{user.email}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary mini"
                    onClick={handleAdicionarParticipante}
                    disabled={!newParticipant.trim()}
                  >
                    Adicionar
                  </button>
                </div>
                <div className="participants-list">
                  {participantNames.length > 0 ? (
                    participantNames.map((nome, index) => (
                      <span key={`${nome}-${index}`} className="participant-chip">
                        {nome}
                        <button type="button" onClick={() => handleRemoverParticipante(index)} aria-label={`Remover ${nome}`}>
                          ✕
                        </button>
                      </span>
                    ))
                  ) : formData.participantes.length > 0 ? (
                    formData.participantes.map((id, index) => (
                      <span key={`${id}-${index}`} className="participant-chip">
                        {id}
                        <button type="button" onClick={() => handleRemoverParticipante(index)} aria-label={`Remover participante`}>
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
                  {participantNames.length > 0
                    ? participantNames.join(', ')
                    : evento.participantes?.length
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
