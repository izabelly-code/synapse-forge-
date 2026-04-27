import { useState, useMemo } from 'react';
import './Calendar.css';
import EventoModal from '../components/EventoModal';
import { useEventos } from '../hooks/useEventos';
import { EventData } from '../types';

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

function Calendar({ onBack }: { onBack: () => void }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    eventos,
    carregando,
    erro,
    eventoSelecionado,
    atualizarEvento,
    deletarEvento,
    selecionarEvento,
    deselecionar,
  } = useEventos('user_123');

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

  function handleDeleteEvent(eventoId: string) {
    deletarEvento(eventoId);
    deselecionar();
  }

  function handleUpdateEvent(eventoId: string, dados: Partial<EventData>) {
    atualizarEvento(eventoId, dados);
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
    .slice(0, 4);

  return (
    <div className="calendar-page">
      {erro && <div className="calendar-error">⚠️ {erro}</div>}
      {carregando && <div className="calendar-loading">Carregando eventos...</div>}

      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-card-header">
            <button className="pill-button back-button" onClick={onBack}>← Voltar</button>

            <div className="month-navigator">
              <button className="nav-arrow" onClick={handlePrevMonth} aria-label="Mês anterior">
                ←
              </button>
              <div>
                <h2>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {currentYear}</h2>
              </div>
              <button className="nav-arrow" onClick={handleNextMonth} aria-label="Próximo mês">
                →
              </button>
            </div>

            <div className="calendar-card-buttons">
              <button className="pill-button pill-primary" onClick={handleCreateNewEvent}>Criar evento</button>
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
                  onClick={() => {
                    handleDayClick(day);
                    if (dayEvents.length > 0) {
                      selecionarEvento(dayEvents[0]);
                    }
                  }}
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
                    <div>
                      <p className="event-card-title">{event.nome}</p>
                      <p className="event-card-meta">{event.descricao || 'Sem descrição'}</p>
                    </div>
                    <span className="event-dot" />
                  </div>
                ))
              ) : (
                <p className="panel-empty">Clique em um dia para ver os eventos desse dia.</p>
              )}
            </div>

            <div className="panel-section panel-accent">
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
          </div>
        </aside>
      </div>

      {createModalOpen && (
        <EventoModal
          mode="create"
          evento={{ data: selectedDate ?? undefined, nome: '', horarioFim: '', participantes: [] }}
          onClose={() => setCreateModalOpen(false)}
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
