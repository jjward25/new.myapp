"use client"
import React, { useState, useEffect } from 'react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    location: '',
  });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
          setNewEvent({ title: '', date: '', time: '', description: '', location: '' });
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

        const eventToUpdate = {
          ...editedEvent,
          date: adjustedDate.toISOString(),
        };

        const response = await fetch('/api/calendar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editedEvent._id,
            updatedItem: {
              title: eventToUpdate.title,
              date: eventToUpdate.date,
              time: eventToUpdate.time,
              description: eventToUpdate.description,
              location: eventToUpdate.location,
            }
          }),
        });

        if (response.ok) {
          const updatedEvent = await response.json();
          // Update the event in the local state
          setEvents(events.map(event => 
            event._id === updatedEvent._id ? updatedEvent : event
          ));
          setSelectedEvent(updatedEvent);
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
      <div className="bg-transparent shadow md:rounded-bl-none md:rounded-br-none h-full">
        <div className="flex items-center justify-between px-6 pt-4 bg-cyan-950 rounded-tr-lg rounded-tl-lg">
          <button onClick={handlePrevMonth} className="text-white hover:text-cyan-400">Prev</button>
          <h2 className='font-semibold text-white'>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={handleNextMonth} className="text-white hover:text-cyan-400">Next</button>
        </div>
        <div className="grid grid-cols-7 gap-1 p-4 border-2 border-cyan-950 text-black md:border-b-0 h-full">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-cyan-950 bg-neutral-300 rounded-md">{day}</div>
          ))}
          {generateCalendarDays().map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className="text-center py-2">
                <span className={`${
                  isCurrentMonth 
                    ? (isToday ? 'bg-cyan-600 text-white rounded-full px-2 py-1' : 'text-black') 
                    : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </span>
                {dayEvents.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`text-xs rounded px-1 mt-1 truncate cursor-pointer ${
                      isCurrentMonth 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
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
      <div className="bg-neutral-100 w-full md:w-1/4 my-8 md:my-auto h-full">
        {/* Mobile toggle button */}
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="md:hidden w-full py-2 bg-cyan-800 text-white font-semibold rounded-md mb-2"
        >
          {isFormOpen ? 'Hide Form' : 'Add Event'}
        </button>
        
        {/* Form - always visible on desktop, toggle on mobile */}
        <form className={`${isFormOpen ? 'block' : 'hidden'} md:block pl-4 w-full mx-auto flex flex-wrap justify-center items-center`} onSubmit={handleAddEvent}>
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Title" required />
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} required />
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} placeholder="Time" />
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="text" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Description" />
          <input className='w-full border border-neutral-200 m-1 rounded-md px-1' type="text" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Location" />
          <button type="submit" className='mt-2 w-2/3 bg-neutral-200 rounded-md hover:bg-cyan-950 hover:text-white dark:bg-cyan-950 dark:text-white dark:hover:text-cyan-200'>Add Event</button>
        </form>
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
              <h3 className='font-semibold underline text-center'>{selectedEvent.title}</h3>
              <p className="mt-2"><span className="font-medium">Date:</span> {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'No date'}</p>
              {selectedEvent.time && (
                <p className="mt-1"><span className="font-medium">Time:</span> {formatTime(selectedEvent.time)}</p>
              )}
              <p className="mt-1"><span className="font-medium">Location:</span> {selectedEvent.location || 'No location'}</p>
              <p className="mt-1"><span className="font-medium">Description:</span> {selectedEvent.description || 'No description'}</p>
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
