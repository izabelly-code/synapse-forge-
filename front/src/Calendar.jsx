import React, { useState } from 'react';
import './Calendar.css';

// Helper to get days in month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [reminders, setReminders] = useState({}); // { 'YYYY-MM-DD': [reminder, ...] }
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

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

  function addReminder(date) {
    const text = prompt('Adicionar lembrete para ' + date + ':');
    if (text) {
      setReminders((prev) => ({
        ...prev,
        [date]: prev[date] ? [...prev[date], text] : [text],
      }));
    }
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>{'<'}</button>
        <span>{monthName} {currentYear}</span>
        <button onClick={handleNextMonth}>{'>'}</button>
      </div>
      <div className="calendar-grid">
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <button
              key={dateStr}
              className="calendar-day"
              onClick={() => addReminder(dateStr)}
              tabIndex={0}
              aria-label={`Adicionar lembrete para o dia ${day}`}
              style={{ textAlign: 'left' }}
            >
              <div className="day-number">{day}</div>
              <ul className="reminders">
                {(reminders[dateStr] || []).map((rem, idx) => (
                  <li key={dateStr + '-' + idx}>{rem}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
