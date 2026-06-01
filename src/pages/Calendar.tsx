import { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiAlertTriangle, FiEye, FiUsers, FiClock } from 'react-icons/fi';
import './Calendar.css';
import EventoModal from '../components/EventoModal';
import EventService from '../services/EventService';
import { getUsers } from '../services/UserService';
import { getCached, setCached } from '../services/cache';
import { EventData } from '../types';

type EventDataWithBackendId = EventData & {
  _id?: string | number;
  eventId?: string | number;
  eventoId?: string | number;
};

function getEventId(evento: Partial<EventDataWithBackendId>): string {
  return String(evento.id ?? evento._id ?? evento.eventId ?? evento.eventoId ?? '');
}

const eventosCacheKey = (userId: string, mes: string, ano: string) =>
  `eventos:${userId}:${mes}:${ano}`;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return day === today.getDate() &&
         month === today.getMonth() &&
         year === today.getFullYear();
}

function formatDateBr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const initialEventos = (() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') ?? '' : '';
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const ano = String(today.getFullYear());
    return getCached<EventData[]>(eventosCacheKey(userId, mes, ano));
  })();

  const [eventos, setEventos] = useState<EventData[]>(initialEventos ?? []);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [eventoSelecionado, setEventoSelecionado] = useState<EventData | null>(null);
  const [nomesParticipantes, setNomesParticipantes] = useState<Record<string, string>>({});

    // Funções para gerenciar evento selecionado
  const selecionarEvento = (evento: EventData) => setEventoSelecionado(evento);
  const deselecionar = () => setEventoSelecionado(null);

  const atualizarEvento = async (id: string, dados: Partial<EventData>) => {
    setCarregando(true);
    setErro(null);

    try {
      const updatedEvent = await EventService.atualizarEvento(id, dados, eventoSelecionado?.userId);
      if (updatedEvent) {
        setEventos((prev) => {
          const next = prev.map((evt) => (evt.id === id ? updatedEvent : evt));
          const userId = localStorage.getItem('userId') || '';
          const mes = String(currentMonth + 1).padStart(2, '0');
          const ano = String(currentYear);
          setCached(eventosCacheKey(userId, mes, ano), next);
          return next;
        });
        setEventoSelecionado(updatedEvent);
      } else {
        setErro('Não foi possível atualizar o evento.');
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar evento');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    async function fetchEventos() {
      const userId = localStorage.getItem('userId') || '';
      const mes = String(currentMonth + 1).padStart(2, '0');
      const ano = String(currentYear);
      const key = eventosCacheKey(userId, mes, ano);
      const cached = getCached<EventData[]>(key);

      if (cached !== undefined) {
        setEventos(cached);
      } else {
        setCarregando(true);
      }
      setErro(null);

      try {
        const eventosAPI = await EventService.buscarEventosPorUsuarioMes(userId, mes, ano);
        setEventos(eventosAPI);
        setCached(key, eventosAPI);
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao buscar eventos');
      } finally {
        setCarregando(false);
      }
    }
    fetchEventos();
  }, [currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function handleDayClick(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  }

  function handleCreateNewEvent() {
    const defaultDate = selectedDate || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(defaultDate);
    setCreateModalOpen(true);
  }

  async function handleDeleteEvent(eventoId: string) {
    const sucesso = await EventService.deletarEvento(eventoId);

    if (sucesso) {
      setEventos((prev) => prev.filter((evento) => getEventId(evento) !== String(eventoId)));
      deselecionar();
    } else {
      setErro('Não foi possível deletar o evento.');
    }

    return sucesso;
  }

  async function handleUpdateEvent(eventoId: string, dados: Partial<EventData>) {
    await atualizarEvento(eventoId, dados);
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleString('pt-BR', { month: 'long' });
  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const eventosPorData = useMemo(() => {
    const mapa: Record<string, EventData[]> = {};
    eventos.forEach((evt) => {
      if (!mapa[evt.data]) {
        mapa[evt.data] = [];
      }
      mapa[evt.data].push(evt);
    });
    return mapa;
  }, [eventos]);

  const displayedDate = selectedDate || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const selectedDayEvents = eventosPorData[displayedDate] || [];
  const nextEvents = eventos
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .filter((evt) => evt.data >= `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
    .filter((evt) => evt.data !== displayedDate)
    .slice(0, 4);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let cancelado = false;
    getUsers(token)
      .then((users) => {
        if (cancelado || !Array.isArray(users)) return;
        const mapa: Record<string, string> = {};
        for (const u of users) {
          if (u?.id) mapa[u.id] = u.nome;
        }
        setNomesParticipantes(mapa);
      })
      .catch(() => { /* mantém o fallback para o id */ });
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <div>
          <h1 className="dashboard-title">Calendário</h1>
          <p className="dashboard-subtitle">Gerencie seus eventos e compromissos</p>
        </div>
        <button className="button btn-novo-pedido" onClick={handleCreateNewEvent}>
          + Criar evento
        </button>
      </header>

      {erro && <div className="calendar-error"><FiAlertTriangle size={16} /> {erro}</div>}

      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-card-header">
            <div className="month-navigator">
              <button className="nav-arrow" onClick={handlePrevMonth} aria-label="Mês anterior">
                <FiChevronLeft size={18} />
              </button>
              <div>
                <h2>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {currentYear}</h2>
              </div>
              <button className="nav-arrow" onClick={handleNextMonth} aria-label="Próximo mês">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="week-days">
            {weekDays.map((day) => (
              <div key={day} className="week-day">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${currentYear}-${currentMonth}-${index}`} className="calendar-day empty" />;
              }

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isCurrentDay = isToday(currentYear, currentMonth, day);
              const dayEvents = eventosPorData[dateStr] || [];

              return (
                <button
                  key={dateStr}
                  className={`calendar-day ${isCurrentDay ? 'today' : ''} ${selectedDate === dateStr ? 'selected' : ''}`}
                  onClick={() => handleDayClick(day)}
                  aria-label={`Dia ${day}`}
                >
                  <div className="day-top">
                    <span className="day-number">{day}</span>
                    {dayEvents.length > 0 && <span className="day-badge">{dayEvents.length}</span>}
                  </div>
                  <div className="events-preview">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className="event-chip"
                      >
                        {event.nome}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="calendar-panel">
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-label">Resumo</span>
              <h3>{selectedDate ? formatDateBr(selectedDate) : 'Selecione um dia'}</h3>
            </div>

            <div className="panel-section">
              <h4>{selectedDayEvents.length ? 'Eventos no dia' : 'Nenhum evento agendado'}</h4>
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-card-info">
                      <p className="event-card-title">{event.nome}</p>
                      <p className="event-card-meta">{event.descricao || 'Sem descrição'}</p>
                      {event.horarioInicio && (
                        <p className="event-card-time">
                          <FiClock size={12} />
                          {event.horarioInicio}{event.horarioFim ? ` - ${event.horarioFim}` : ''}
                        </p>
                      )}
                      {event.participantes && event.participantes.length > 0 && (
                        <p className="event-card-participants">
                          <FiUsers size={12} />
                          {event.participantes.map((id) => nomesParticipantes[id] || id).join(', ')}
                        </p>
                      )}
                    </div>
                    <button className="event-card-action" onClick={() => selecionarEvento(event)}>
                      <FiEye size={14} /> Ver / editar
                    </button>
                  </div>
                ))
              ) : (
                <p className="panel-empty">Clique em um dia para ver os eventos desse dia.</p>
              )}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-accent-header">
              <span>Próximos eventos</span>
              <span className="panel-accent-count">{nextEvents.length}</span>
            </div>
            {nextEvents.length > 0 ? (
              nextEvents.map((event) => (
                <div key={event.id} className="next-event-row">
                  <span className="next-event-title">{event.nome}</span>
                  <span className="next-event-date">{formatDateBr(event.data)}</span>
                </div>
              ))
            ) : (
              <p className="panel-empty">Sem eventos no período atual.</p>
            )}
          </div>
        </aside>
      </div>

      {createModalOpen && (
        <EventoModal
          mode="create"
          evento={{ data: selectedDate ?? undefined, nome: '', horarioFim: '', participantes: [] }}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            // Atualiza a lista de eventos
            const userId = localStorage.getItem('userId') || '';
            const mes = String(currentMonth + 1).padStart(2, '0');
            const ano = String(currentYear);
            EventService.buscarEventosPorUsuarioMes(userId, mes, ano).then(setEventos);
          }}
          onDelete={handleDeleteEvent}
        />
      )}

      {eventoSelecionado && !createModalOpen && (
        <EventoModal
          mode="view"
          evento={eventoSelecionado}
          onClose={deselecionar}
          onDelete={handleDeleteEvent}
          onUpdate={handleUpdateEvent}
        />
      )}
    </div>
  );
}

export default Calendar;
