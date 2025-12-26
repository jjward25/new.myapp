"use client"
import React, { useState } from 'react';

export default function AddEventButton() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    location: '',
  });

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
          date: adjustedDate.toISOString(),
        };

        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventToAdd),
        });

        if (response.ok) {
          setNewEvent({ title: '', date: '', time: '', description: '', location: '' });
          setIsFormOpen(false);
          // Reload to refresh the calendar
          window.location.reload();
        } else {
          console.error('Failed to add event');
        }
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  return (
    <>
      {/* Add Event button */}
      <button 
        onClick={() => setIsFormOpen(true)}
        className="w-full py-2 px-4 mb-4 rounded-bl-xl rounded-br-xl bg-cyan-950 hover:text-cyan-200 border-r-2 border-cyan-950 border-l-2 border-cyan-950 text-white font-semibold "
      >
        Add Event
      </button>
      
      {/* Add Event Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Event</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleAddEvent}>
              <input 
                className='w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900' 
                type="text" 
                value={newEvent.title} 
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} 
                placeholder="Title" 
                required 
              />
              <input 
                className='w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900' 
                type="date" 
                value={newEvent.date} 
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} 
                required 
              />
              <input 
                className='w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900' 
                type="time" 
                value={newEvent.time} 
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} 
                placeholder="Time" 
              />
              <input 
                className='w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900' 
                type="text" 
                value={newEvent.description} 
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} 
                placeholder="Description" 
              />
              <input 
                className='w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900' 
                type="text" 
                value={newEvent.location} 
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} 
                placeholder="Location" 
              />
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className='px-4 py-2 bg-cyan-800 text-white rounded-md hover:bg-cyan-700'
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

