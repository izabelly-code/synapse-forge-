import EventService from '../../services/EventService';
import { getUserById, searchUsersByName } from '../../services/UserService';
import { EventData, User } from '../../types';
import React, { useEffect, useRef, useState } from 'react';
import { Cancel01Icon } from "hugeicons-react";
import { useTranslation } from 'react-i18next';
import './EventoModal.css';
import IconButton from '../ui/IconButton';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { formatDate } from '../../utils/format';

interface EventoModalProps {
  evento: Partial<EventData>;
  mode?: 'view' | 'create';
  onClose: () => void;
  onDelete: (id: string) => Promise<boolean>;
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

/** "HH:mm" → hora no idioma ativo; devolve o valor original se não for parseável. */
function formatarHorario(horario: string): string {
  const [horas, minutos] = horario.split(':').map(Number);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return horario;
  return formatDate(new Date(2000, 0, 1, horas, minutos), { hour: '2-digit', minute: '2-digit' });
}

function EventoModal({ evento, mode = 'view', onClose, onDelete, onUpdate, onSuccess }: Readonly<EventoModalProps>) {
  const { t } = useTranslation();
  const isCreateMode = mode === 'create';
  
  const [newParticipant, setNewParticipant] = useState('');
  const painelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(painelRef);
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
      globalThis.alert(t('agenda.modal.errorInvalidParticipant'));
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
      globalThis.alert(t('agenda.modal.errorRequired'));
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
          globalThis.alert(t('agenda.modal.errorCreate'));
        }
      } catch (error) {
        console.error('Erro ao criar evento via EventService:', error);
        globalThis.alert(t('agenda.modal.errorCreate'));
      }
    } else if (onUpdate && evento.id) {
      try {
        await onUpdate(evento.id, formData);
        setEditando(false);
      } catch (error_) {
        console.error('Erro ao atualizar evento:', error_);
        globalThis.alert(t('agenda.modal.errorSave'));
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

  const handleDeletar = async () => {
    if (globalThis.confirm(t('agenda.modal.confirmDelete'))) {
      if (evento.id) {
        const sucesso = await onDelete(evento.id);
        if (sucesso) {
            if (onSuccess) {
              onSuccess();
            } else {
              onClose();
            }  
          }else {
              globalThis.alert(t('agenda.modal.errorDelete'));
            }
      }
        else {
          globalThis.alert(t('agenda.modal.errorDelete'));
        }

    }
  };

  /** "AAAA-MM-DD" → data curta no idioma ativo (construída em horário local para não deslocar o dia). */
  const formatarData = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return formatDate(new Date(ano, mes - 1, dia), { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  let modalTitle = t('agenda.modal.titleDetails');
  if (isCreateMode) {
    modalTitle = t('agenda.modal.titleCreate');
  } else if (editando) {
    modalTitle = t('agenda.modal.titleEdit');
  } else if (evento.nome) {
    modalTitle = evento.nome;
  }

  return (
    <div
      className="evento-modal-overlay"
      onClick={onClose}
    >
      <div
        ref={painelRef}
        className="evento-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evento-modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="evento-modal-header">
          <h2 className="evento-modal-titulo" id="evento-modal-titulo">{modalTitle}</h2>
          <IconButton variant="modal-close" onClick={onClose} aria-label={t('agenda.modal.close')}>
            <Cancel01Icon size={18} />
          </IconButton>
        </div>

        {/* Body */}
        <div className="evento-modal-body">
          {editando ? (
            <form className="evento-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="nome">{t('agenda.modal.nameLabel')}</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder={t('agenda.modal.namePlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="descricao">{t('agenda.modal.descriptionLabel')}</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder={t('agenda.modal.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div className="field-row">
                <div className="form-group">
                  <label htmlFor="data">{t('agenda.modal.dateLabel')}</label>
                  <input
                    type="date"
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="horarioInicio">{t('agenda.modal.startLabel')}</label>
                  <input
                    type="time"
                    id="horarioInicio"
                    name="horarioInicio"
                    value={formData.horarioInicio}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="horarioFim">{t('agenda.modal.endLabel')}</label>
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
                <label htmlFor="participantes">{t('agenda.modal.participantsLabel')}</label>
                <div className="participants-input-row">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      id="participantes"
                      name="participantes"
                      value={newParticipant}
                      onChange={handleParticipantInputChange}
                      placeholder={t('agenda.modal.participantPlaceholder')}
                    />
                    {showUserSuggestions && filteredUsers.length > 0 && (
                      <div className="user-suggestions-dropdown">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="user-suggestion-item"
                            onClick={() => handleSelectUser(user)}
                            style={{ cursor: 'pointer', padding: '8px 12px', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left', width: '100%', background: 'transparent', border: 'none' }}
                          >
                            <strong>{user.nome}</strong>
                            <br />
                            <small style={{ color: 'var(--on-surface-variant)' }}>{user.email}</small>
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
                    {t('agenda.modal.add')}
                  </button>
                </div>
                <div className="participants-list">
                  {participantNames.length > 0 ? (
                    participantNames.map((nome, index) => (
                      <span key={`${nome}-${index}`} className="participant-chip">
                        {nome}
                        <button type="button" onClick={() => handleRemoverParticipante(index)} aria-label={t('agenda.modal.removeParticipantAria', { name: nome })}>
                          <Cancel01Icon size={12} />
                        </button>
                      </span>
                    ))
                  ) : formData.participantes.length > 0 ? (
                    formData.participantes.map((id, index) => (
                      <span key={`${id}-${index}`} className="participant-chip">
                        {id}
                        <button type="button" onClick={() => handleRemoverParticipante(index)} aria-label={t('agenda.modal.removeParticipantGenericAria')}>
                          <Cancel01Icon size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="no-participants">{t('agenda.modal.noParticipantsAdded')}</p>
                  )}
                </div>
              </div>

            </form>
          ) : (
            <div className="evento-detalhes">
              <div className="detalhe-item">
                <span className="detalhe-label">{t('agenda.modal.dateLabel')}</span>
                <span className="detalhe-valor">{evento.data ? formatarData(evento.data) : ''}</span>
              </div>

              {evento.descricao && (
                <div className="detalhe-item">
                  <span className="detalhe-label">{t('agenda.modal.descriptionLabel')}</span>
                  <span className="detalhe-valor">{evento.descricao}</span>
                </div>
              )}

              {evento.horarioInicio && evento.horarioFim && (
                <div className="detalhe-item">
                  <span className="detalhe-label">{t('agenda.modal.timeLabel')}</span>
                  <span className="detalhe-valor">{formatarHorario(evento.horarioInicio)} - {formatarHorario(evento.horarioFim)}</span>
                </div>
              )}

              <div className="detalhe-item">
                <span className="detalhe-label">{t('agenda.modal.participantsLabel')}</span>
                <span className="detalhe-valor">
                  {participantNames.length > 0
                    ? participantNames.join(', ')
                    : evento.participantes?.length
                      ? evento.participantes.join(', ')
                      : t('agenda.modal.noParticipants')}
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
                {t('agenda.modal.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSalvar}>
                {isCreateMode ? t('agenda.modal.create') : t('agenda.modal.saveChanges')}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-danger"
                onClick={handleDeletar}
              >
                {t('agenda.modal.delete')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                {t('agenda.modal.close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setEditando(true)}
              >
                {t('agenda.modal.edit')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventoModal;
