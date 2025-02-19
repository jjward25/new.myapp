"use client"
import React, { useState, useEffect } from 'react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    description: '',
    location: '',
  });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

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

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newEvent.title && newEvent.date) {
      try {
        // Adjust the newEvent date to remove timezone offset
        const selectedDate = new Date(newEvent.date);
        const adjustedDate = new Date(
          selectedDate.getUTCFullYear(),
          selectedDate.getUTCMonth(),
          selectedDate.getUTCDate()
        );

        const eventToAdd = {
          ...newEvent,
          date: adjustedDate.toISOString(), // Store date as ISO string
        };

        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventToAdd),
        });

        if (response.ok) {
          const addedEvent = await response.json();
          setEvents([...events, addedEvent]);
          setNewEvent({ title: '', date: '', description: '', location: '' });
        } else {
          console.error('Failed to add event');
        }
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

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

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getUTCDate() === date.getDate() &&
          eventDate.getUTCMonth() === date.getMonth() &&
          eventDate.getUTCFullYear() === date.getFullYear()
        );
      }
    );
  };

  return (
    <div className="w-full mx-auto flex flex-col md:flex-row">
      <div className="bg-black shadow overflow-hidden rounded-md">
        <div className="flex items-center justify-between px-6 py-4 bg-cyan-950 border-b-2 border-cyan-500 rounded-tr-lg rounded-tl-lg">
          <button onClick={handlePrevMonth} className="text-white hover:text-cyan-400">Prev</button>
          <h2 className='font-semibold text-white'>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={handleNextMonth} className="text-white hover:text-cyan-400">Next</button>
        </div>
        <div className="grid grid-cols-7 gap-1 p-4 border-2 border-cyan-950 rounded-br-lg rounded-bl-lg text-cyan-100 opacity-80">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-cyan-500">{day}</div>
          ))}
          {[...Array(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay())].map((_, i) => (
            <div key={`prev-${i}`} className="text-center py-2 text-gray-400"></div>
          ))}
          {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((day) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEvents = getEventsForDate(date);
            return (
              <div key={day} className="text-center py-2">
                <span>{day}</span>
                {dayEvents.map((event, index) => (
                  <div
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 rounded px-1 mt-1 truncate cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-neutral-100 w-full md:w-1/4 my-auto">
        <form className='pl-4 w-full mx-auto flex flex-wrap justify-center items-center' onSubmit={handleAddEvent}>
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Title" required />
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} required />
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="text" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Description" />
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="text" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Location" />
          <button type="submit" className='mt-2 w-1/3 bg-neutral-200 rounded-md hover:bg-cyan-950 hover:text-white dark:bg-cyan-950 dark:text-white dark:hover:text-cyan-200'>Add Event</button>
        </form>
      </div>
      {selectedEvent && (
        <div className='bg-cyan-950 text-white rounded-lg p-4 w-full'>
          <h3 className='font-semibold underline text-center'>{selectedEvent.title}</h3>
          <p>{selectedEvent.description}</p>
          <p>Location: {selectedEvent.location}</p>
          <div className="flex justify-center mt-4">
            <button className='mr-4 text-neutral-500 text-sm text-center hover:text-white cursor-pointer' onClick={() => setSelectedEvent(null)}>Close</button>
            <button className='text-red-500 text-sm hover:text-white cursor-pointer' onClick={() => handleDeleteEvent()}>Delete Event</button>
          </div>
        </div>
      )}
    </div>
  );
}
