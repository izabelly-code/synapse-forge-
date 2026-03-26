import React, { useState, useMemo } from 'react';
import './Calendar.css';
import EventoModal from './components/EventoModal.jsx';
import { useEventos } from './hooks/useEventos.js';

// Helper to get days in month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get the first day of the week (0 = Sunday)
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// Helper to check if date is today
function isToday(year, month, day) {
  const today = new Date();
  return day === today.getDate() &&
         month === today.getMonth() &&
         year === today.getFullYear();
}

function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Hook customizado para gerenciar eventos com mock server
  const {
    eventos,
    carregando,
    erro,
    eventoSelecionado,
    atualizarEvento,
    deletarEvento,
    selecionarEvento,
    deselecionar,
  } = useEventos('user_123'); // user_id hardcoded para teste

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

  function handleDayClick(day) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  }

  function handleDeleteEvent(eventoId) {
    deletarEvento(eventoId);
    deselecionar();
  }

  function handleUpdateEvent(eventoId, dados) {
    atualizarEvento(eventoId, dados);
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleString('pt-BR', { month: 'long' });
  const calendarDays = [];
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Memoizar eventos do mês atual para evitar recálculos desnecessários
  const eventosPorData = useMemo(() => {
    const mapa = {};
    eventos.forEach((evt) => {
      if (!mapa[evt.data]) {
        mapa[evt.data] = [];
      }
      mapa[evt.data].push(evt);
    });
    return mapa;
  }, [eventos]);

  return (
    <div className="calendar-container">
      {erro && <div className="calendar-error">⚠️ {erro}</div>}
      {carregando && <div className="calendar-loading">Carregando eventos...</div>}

      <div className="calendar-header">
        <button className="nav-button" onClick={handlePrevMonth}>
          ← Anterior
        </button>
        <h2 className="month-year">
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {currentYear}
        </h2>
        <button className="nav-button" onClick={handleNextMonth}>
          Próximo →
        </button>
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
            return <div key={`empty-${index}`} className="calendar-day empty"></div>;
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
              <div className={`day-number ${isCurrentDay ? 'today-number' : ''}`}>
                {day}
              </div>
              {dayEvents.length > 0 && (
                <div className="events-preview">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                      key={idx}
                      className="event-dot"
                      title={event.nome}
                      style={{ backgroundColor: event.cor }}
                    >
                      •
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="more-events">+{dayEvents.length - 2}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal de Evento */}
      {eventoSelecionado && (
        <EventoModal
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
