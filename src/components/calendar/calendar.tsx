"use client"
import React, { useState, useEffect } from 'react';
import { getEventType, EVENT_TYPES, EVENT_EXTRA_KEYS } from '@/config/eventTypes';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<any>(null);

  // Fetch events from MongoDB on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch('/api/calendar', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        console.error('Failed to fetch events');
      }
    };
    fetchEvents();
  }, []);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));


  const handleDeleteEvent = async () => {
    if (selectedEvent && selectedEvent._id) {
      try {
        const response = await fetch('/api/calendar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedEvent._id }),
        });

        if (response.ok) {
          // Remove the event from the local state after successful deletion
          setEvents(events.filter((event) => event._id !== selectedEvent._id));
          setSelectedEvent(null);
        } else {
          console.error('Failed to delete event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleEditEvent = () => {
    setIsEditing(true);
    setEditedEvent({
      ...selectedEvent,
      date: selectedEvent.date ? new Date(selectedEvent.date).toISOString().split('T')[0] : '',
      time: selectedEvent.time || ''
    });
  };

  const handleSaveEvent = async () => {
    if (editedEvent && editedEvent._id) {
      try {
        // Adjust the edited event date to remove timezone offset
        const selectedDate = new Date(editedEvent.date);
        const adjustedDate = new Date(
          selectedDate.getUTCFullYear(),
          selectedDate.getUTCMonth(),
          selectedDate.getUTCDate()
        );

        const dayStr = adjustedDate.toISOString().slice(0, 10);
        const updatedItem: any = {
          title: editedEvent.title,
          date: dayStr,
          time: editedEvent.time || '',
          description: editedEvent.description || '',
          location: editedEvent.location || '',
          eventType: editedEvent.eventType || '',
        };
        EVENT_EXTRA_KEYS.forEach((k) => { updatedItem[k] = editedEvent[k] ?? ''; });

        const response = await fetch('/api/calendar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editedEvent._id, updatedItem }),
        });

        if (response.ok) {
          const merged = { ...selectedEvent, ...updatedItem, _id: editedEvent._id };
          setEvents(events.map((event) => (event._id === editedEvent._id ? merged : event)));
          setSelectedEvent(merged);
          setIsEditing(false);
          setEditedEvent(null);
        } else {
          console.error('Failed to update event');
        }
      } catch (error) {
        console.error('Error updating event:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedEvent(null);
  };

  const getEventsForDate = (date: Date) => {
    const dayEvents = events.filter(
      (event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getUTCDate() === date.getDate() &&
          eventDate.getUTCMonth() === date.getMonth() &&
          eventDate.getUTCFullYear() === date.getFullYear()
        );
      }
    );

    // Sort events by time
    return dayEvents.sort((a, b) => {
      const timeA = a.time || '23:59'; // Events without time go to end
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    });
  };

  // Helper function to generate all calendar days (complete weeks)
  const generateCalendarDays = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // Move start date to the beginning of the week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Move end date to the end of the week (Saturday)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Helper function to format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full mx-auto flex flex-col md:flex-row h-full">
      <div className="bg-transparent w-full h-full">
        <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/10">
          <button onClick={handlePrevMonth} className="text-[#8a919c] hover:text-[#22d3ee] text-sm font-medium">Prev</button>
          <h2 className="font-semibold text-[#e7eaee] tracking-wide">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={handleNextMonth} className="text-[#8a919c] hover:text-[#22d3ee] text-sm font-medium">Next</button>
        </div>
        <div className="grid grid-cols-7 gap-1 p-3 h-full">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-[10px] font-semibold tracking-widest uppercase text-[#8a919c] py-1.5 bg-white/[0.03] rounded">{day}</div>
          ))}
          {generateCalendarDays().map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={index} className={`text-center py-1.5 rounded min-h-[52px] ${isCurrentMonth ? 'bg-white/[0.02]' : ''}`}>
                <span className={`inline-block text-[13px] ${
                  isToday
                    ? 'bg-[#22d3ee] text-[#0c0d10] rounded-full w-6 h-6 leading-6 font-semibold'
                    : isCurrentMonth ? 'text-[#e7eaee]' : 'text-[#4b515b]'
                }`}>
                  {date.getDate()}
                </span>

                {/* event-type badges */}
                {(() => {
                  const badges = dayEvents
                    .map((e: any) => ({ e, t: getEventType(e.eventType) }))
                    .filter((x: any) => x.t);
                  if (!badges.length) return null;
                  return (
                    <div className="flex flex-wrap justify-center gap-1 mt-0.5">
                      {badges.map(({ e, t }: any, i: number) => {
                        const href = t.link ? t.link(e) : null;
                        return (
                          <button
                            key={i}
                            title={`${t.label}: ${e.title}${href ? ` · open ${t.linkLabel || 'link'}` : ''}`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              if (href) window.open(href, '_blank', 'noopener');
                              else {
                                setSelectedEvent(e);
                                setIsEditing(false);
                                setEditedEvent(null);
                              }
                            }}
                            className="text-base leading-none rounded px-0.5 hover:scale-110 transition-transform"
                            style={{ filter: href ? 'none' : 'grayscale(0.4)' }}
                          >
                            {t.icon}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {dayEvents.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`text-[11px] rounded px-1.5 py-0.5 mt-1 truncate cursor-pointer border transition-colors ${
                      isCurrentMonth
                        ? 'bg-[#22d3ee]/12 text-[#7fe6f5] border-[#22d3ee]/25 hover:bg-[#22d3ee]/20'
                        : 'bg-white/[0.04] text-[#6b727d] border-white/[0.06]'
                    }`}
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsEditing(false);
                      setEditedEvent(null);
                    }}
                    title={`${event.time ? formatTime(event.time) + ' - ' : ''}${event.title}`}
                  >
                    {event.time && <span className="font-semibold">{formatTime(event.time)} </span>}
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {selectedEvent && (
        <div className='bg-cyan-950 text-white rounded-lg p-4 w-full'>
          {isEditing ? (
            // Edit mode
            <div>
              <h3 className='font-semibold underline text-center mb-4'>Edit Event</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={editedEvent?.title || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                    className="w-full border border-neutral-300 rounded-md px-2 py-1 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={editedEvent?.date || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                    className="w-full border border-neutral-300 rounded-md px-2 py-1 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={editedEvent?.time || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, time: e.target.value })}
                    className="w-full border border-neutral-300 rounded-md px-2 py-1 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editedEvent?.description || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                    className="w-full border border-neutral-300 rounded-md px-2 py-1 text-black resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={editedEvent?.location || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                    className="w-full border border-neutral-300 rounded-md px-2 py-1 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={editedEvent?.eventType || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, eventType: e.target.value })}
                    className="w-full border border-neutral-300 rounded-md px-2 py-1 text-black"
                  >
                    <option value="">No type</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                {getEventType(editedEvent?.eventType)?.fields?.map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1">{f.label}</label>
                    <input
                      type="text"
                      value={editedEvent?.[f.key] || ''}
                      onChange={(e) => setEditedEvent({ ...editedEvent, [f.key]: e.target.value })}
                      placeholder={f.placeholder || ''}
                      className="w-full border border-neutral-300 rounded-md px-2 py-1 text-black"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-4 space-x-2">
                <button
                  className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm'
                  onClick={handleSaveEvent}
                >
                  Save
                </button>
                <button
                  className='bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm'
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div>
              <h3 className='font-semibold underline text-center'>
                {getEventType(selectedEvent.eventType)?.icon} {selectedEvent.title}
              </h3>
              <p className="mt-2"><span className="font-medium">Date:</span> {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'No date'}</p>
              {selectedEvent.time && (
                <p className="mt-1"><span className="font-medium">Time:</span> {formatTime(selectedEvent.time)}</p>
              )}
              <p className="mt-1"><span className="font-medium">Location:</span> {selectedEvent.location || 'No location'}</p>
              <p className="mt-1"><span className="font-medium">Description:</span> {selectedEvent.description || 'No description'}</p>
              {(() => {
                const t = getEventType(selectedEvent.eventType);
                const href = t?.link ? t.link(selectedEvent) : null;
                if (!t) return null;
                return (
                  <p className="mt-1">
                    <span className="font-medium">{t.label}:</span>{' '}
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">
                        {t.linkLabel || 'open'} →
                      </a>
                    ) : (
                      <span className="text-white/60">no {t.linkLabel?.toLowerCase() || 'link'} set</span>
                    )}
                  </p>
                );
              })()}
              <div className="flex justify-center mt-4 space-x-2">
                <button
                  className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm'
                  onClick={handleEditEvent}
                >
                  Edit
                </button>
                <button
                  className='bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm'
                  onClick={() => {
                    setSelectedEvent(null);
                    setIsEditing(false);
                    setEditedEvent(null);
                  }}
                >
                  Close
                </button>
                <button
                  className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm'
                  onClick={handleDeleteEvent}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
