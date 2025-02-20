'use client';

import React, { useState, useRef, useEffect } from 'react';

// Define available lists as a const array
const AVAILABLE_LISTS = ['Movies', 'Books', 'Shopping','TV Shows'] as const;
// Create a type from the array values
type ListName = typeof AVAILABLE_LISTS[number];

interface ListItemBase {
  name: string;
  done: boolean;
}

interface MovieItem extends ListItemBase {
  length?: string;
  rating?: number | null;
  notes?: string;
}

type ListItem = ListItemBase | MovieItem;

const AddListItemButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ListName | ''>('');
  const [newListName, setNewListName] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const [itemData, setItemData] = useState<Partial<MovieItem>>({
    name: '',
    done: false,
    length: '',
    rating: null,
    notes: ''
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedList('');
        setNewListName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newListName,
          list: []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create list');
      }

      // Reset form and refresh page
      setNewListName('');
      window.location.reload();
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = '/api/lists/items';
      const payload = {
        listName: selectedList,
        item: {
          name: itemData.name,
          done: false,
          ...(selectedList === 'Movies' && {
            length: itemData.length || '',
            rating: itemData.rating || null,
            notes: itemData.notes || ''
          })
        }
      };

      console.log('Making request to:', url);
      console.log('With payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item');
      }

      // Reset form
      setItemData({
        name: '',
        done: false,
        length: '',
        rating: null,
        notes: ''
      });
      setIsOpen(false);
      setSelectedList('');

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error adding item:', error);
      alert(error instanceof Error ? error.message : 'Failed to add item');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="btn text-sm mx-0 hover:border-yellow-500 bg-cyan-950  border-cyan-200 text-white btn-secondary hover:bg-cyan-950 hover:text-cyan-300 w-full max-w-[1000px] min-h-0 h-10 mb-2"
      >
        Add List Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Add New List</h2>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    List Name
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      required
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
                >
                  Create List
                </button>
              </form>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold mb-4">Add New Item</h2>
              
              {!selectedList ? (
                <div>
                  <h3 className="mb-3">Select List:</h3>
                  <div className="space-y-2">
                    {AVAILABLE_LISTS.map((list) => (
                      <button
                        key={list}
                        onClick={() => setSelectedList(list)}
                        className="block w-full text-left px-4 py-2 hover:bg-cyan-100 rounded"
                      >
                        {list}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                      <input
                        type="text"
                        value={itemData.name}
                        onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                        required
                      />
                    </label>
                  </div>

                  {selectedList === 'Movies' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Length
                          <input
                            type="text"
                            value={itemData.length}
                            onChange={(e) => setItemData({ ...itemData, length: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            placeholder="2h15m"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rating
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={itemData.rating || ''}
                            onChange={(e) => setItemData({ ...itemData, rating: e.target.value ? Number(e.target.value) : null })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                          />
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Notes
                          <textarea
                            value={itemData.notes}
                            onChange={(e) => setItemData({ ...itemData, notes: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                          />
                        </label>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setSelectedList('');
                      }}
                      className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
                    >
                      Add Item
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddListItemButton; 