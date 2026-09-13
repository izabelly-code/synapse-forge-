import { useState, useMemo, useEffect } from 'react';
import { Alert02Icon, ArrowLeft01Icon, ArrowRight01Icon, Clock01Icon, UserMultiple02Icon, ViewIcon } from "hugeicons-react";
import { useTranslation } from 'react-i18next';
import './Calendar.css';
import EventoModal from '../components/calendario/EventoModal';
import EventService from '../services/EventService';
import { getUsers } from '../services/UserService';
import { getCached, setCached } from '../services/cache';
import { EventData } from '../types';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/format';

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

/** "AAAA-MM-DD" → data curta no idioma ativo (construída em horário local para não deslocar o dia). */
function formatDateStr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return formatDate(new Date(year, month - 1, day), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "HH:mm" → hora no idioma ativo; devolve o valor original se não for parseável. */
function formatTimeStr(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeStr;
  return formatDate(new Date(2000, 0, 1, hours, minutes), { hour: '2-digit', minute: '2-digit' });
}

/** Abreviações dos dias da semana (Dom..Sáb) no idioma ativo. 07/01/2024 foi um domingo. */
function getWeekDayLabels(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const label = formatDate(new Date(2024, 0, 7 + i), { weekday: 'short' }).replace('.', '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
}

/** "AAAA-MM-DD" → "Segunda-feira, 08 de setembro" no idioma ativo (cabeçalho de dia da visão lista). */
function formatDayHeading(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const label = formatDate(new Date(year, month - 1, day), { weekday: 'long', day: '2-digit', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type EventCardProps = {
  event: EventData;
  nomesParticipantes: Record<string, string>;
  onView: (evento: EventData) => void;
};

/** Card de evento — usado no painel lateral (>=641px) e na visao lista do mobile (<=640px). */
function EventCard({ event, nomesParticipantes, onView }: Readonly<EventCardProps>) {
  const { t } = useTranslation();

  return (
    <div className="event-card">
      <div className="event-card-info">
        <p className="event-card-title">{event.nome}</p>
        <p className="event-card-meta">{event.descricao || t('agenda.calendar.noDescription')}</p>
        {event.horarioInicio && (
          <p className="event-card-time">
            <Clock01Icon size={12} />
            {formatTimeStr(event.horarioInicio)}{event.horarioFim ? ` - ${formatTimeStr(event.horarioFim)}` : ''}
          </p>
        )}
        {event.participantes && event.participantes.length > 0 && (
          <p className="event-card-participants">
            <UserMultiple02Icon size={12} />
            {event.participantes.map((id) => nomesParticipantes[id] || id).join(', ')}
          </p>
        )}
      </div>
      <button className="event-card-action" onClick={() => onView(event)}>
        <ViewIcon size={14} /> {t('agenda.calendar.viewEdit')}
      </button>
    </div>
  );
}

function Calendar() {
  const { t } = useTranslation();
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
        setErro(t('agenda.calendar.errorUpdate'));
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('agenda.calendar.errorUpdateGeneric'));
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
        setErro(err instanceof Error ? err.message : t('agenda.calendar.errorLoad'));
      } finally {
        setCarregando(false);
      }
    }
    fetchEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const weekDays = getWeekDayLabels();

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
      setErro(t('agenda.calendar.errorDelete'));
    }

    return sucesso;
  }

  async function handleUpdateEvent(eventoId: string, dados: Partial<EventData>) {
    await atualizarEvento(eventoId, dados);
  }

  const monthName = formatDate(new Date(currentYear, currentMonth), { month: 'long' });
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

  const mesAtualPrefixo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const hojeStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  /** Eventos do mes exibido agrupados por dia (dias sem evento nao entram) — base da visao lista. */
  const diasComEventos = useMemo(
    () =>
      Object.keys(eventosPorData)
        .filter((data) => data.startsWith(mesAtualPrefixo))
        .sort((a, b) => a.localeCompare(b))
        .map((data) => ({
          data,
          hoje: data === hojeStr,
          eventos: eventosPorData[data]
            .slice()
            .sort((a, b) => (a.horarioInicio ?? '').localeCompare(b.horarioInicio ?? '')),
        })),
    [eventosPorData, mesAtualPrefixo, hojeStr]
  );

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
          <h1 className="dashboard-title">{t('agenda.calendar.title')}</h1>
          <p className="dashboard-subtitle">{t('agenda.calendar.subtitle')}</p>
        </div>
        <button className="button btn-novo-pedido" onClick={handleCreateNewEvent}>
          + {t('agenda.calendar.newEvent')}
        </button>
      </header>

      {erro && <div className="calendar-error"><Alert02Icon size={16} /> {erro}</div>}

      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-card-header">
            <div className="month-navigator">
              <button className="nav-arrow" onClick={handlePrevMonth} aria-label={t('agenda.calendar.prevMonth')}>
                <ArrowLeft01Icon size={18} />
              </button>
              <div>
                <h2>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {currentYear}</h2>
              </div>
              <button className="nav-arrow" onClick={handleNextMonth} aria-label={t('agenda.calendar.nextMonth')}>
                <ArrowRight01Icon size={18} />
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
                  className={cn('calendar-day', isCurrentDay && 'today', selectedDate === dateStr && 'selected')}
                  onClick={() => handleDayClick(day)}
                  aria-label={t('agenda.calendar.dayAria', { day })}
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

          {/* Visao lista (<=640px): substitui a grade por eventos do mes agrupados por dia */}
          <div className="calendar-agenda">
            {diasComEventos.length > 0 ? (
              diasComEventos.map((grupo) => (
                <section key={grupo.data} className="agenda-dia">
                  <h3 className={cn('agenda-dia-titulo', grupo.hoje && 'is-today')}>
                    <span className="agenda-dia-data">{formatDayHeading(grupo.data)}</span>
                    {grupo.hoje && <span className="agenda-dia-hoje">{t('agenda.calendar.today')}</span>}
                  </h3>
                  {grupo.eventos.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      nomesParticipantes={nomesParticipantes}
                      onView={selecionarEvento}
                    />
                  ))}
                </section>
              ))
            ) : (
              <p className="panel-empty">{t('agenda.calendar.listEmpty')}</p>
            )}
          </div>
        </section>

        <aside className="calendar-panel">
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-label">{t('agenda.calendar.summary')}</span>
              <h3>{selectedDate ? formatDateStr(selectedDate) : t('agenda.calendar.selectDay')}</h3>
            </div>

            <div className="panel-section">
              <h4>{selectedDayEvents.length ? t('agenda.calendar.eventsOnDay') : t('agenda.calendar.noEventsScheduled')}</h4>
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    nomesParticipantes={nomesParticipantes}
                    onView={selecionarEvento}
                  />
                ))
              ) : (
                <p className="panel-empty">{t('agenda.calendar.clickDayHint')}</p>
              )}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-accent-header">
              <span>{t('agenda.calendar.upcoming')}</span>
              <span className="panel-accent-count">{nextEvents.length}</span>
            </div>
            {nextEvents.length > 0 ? (
              nextEvents.map((event) => (
                <div key={event.id} className="next-event-row">
                  <span className="next-event-title">{event.nome}</span>
                  <span className="next-event-date">{formatDateStr(event.data)}</span>
                </div>
              ))
            ) : (
              <p className="panel-empty">{t('agenda.calendar.noUpcoming')}</p>
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
