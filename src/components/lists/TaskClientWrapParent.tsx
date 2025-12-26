'use client';

import React, { useState, useEffect } from 'react';

interface ListWrapProps {
  listName: string;
  isOpen?: boolean;
  hideHeader?: boolean;
}

interface ListItemBase {
  name: string;
  done: boolean;
  lastContactedDate?: string;
}

interface MovieItem extends ListItemBase {
  length?: string;
  rating?: number | null;
  notes?: string;
}

interface TravelDestinationItem extends ListItemBase {
  country?: string;
  description?: string;
  links?: { text: string; url: string }[];
}

type ListItem = ListItemBase | MovieItem | TravelDestinationItem | string;

const ListWrap: React.FC<ListWrapProps> = ({
  listName,
  isOpen: initialIsOpen = false,
  hideHeader = false,
}) => {
  const [isOpen, setIsOpen] = useState(hideHeader ? true : initialIsOpen);
  const [items, setItems] = useState<ListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<MovieItem | null>(null);
  const [sortBy, setSortBy] = useState<'none' | 'rating-asc' | 'rating-desc'>('none');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState<Partial<MovieItem>>({
    name: '',
    done: false,
    length: '',
    rating: null,
    notes: ''
  });

  // Convert string items to proper format
  const normalizeItem = (item: ListItem): ListItemBase => {
    if (typeof item === 'string') {
      return {
        name: item,
        done: false
      };
    }
    return item as ListItemBase;
  };

  useEffect(() => {
    const fetchList = async () => {
      try {
        const url = `/api/lists?name=${encodeURIComponent(listName)}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.list) {
          throw new Error('Invalid list data received');
        }
        
        // Normalize the items when setting state
        const normalizedItems = data.list.map(normalizeItem);
        setItems(normalizedItems);
        setError(null);
      } catch (error) {
        console.error('Error fetching list:', error);
        setError(error instanceof Error ? error.message : 'Failed to load list items');
      }
    };

    if (isOpen) {
      fetchList();
    }
  }, [isOpen, listName]);

  const handleCheckboxChange = async (itemName: string) => {
    try {
      const itemToUpdate = items.find(item => 
        typeof item === 'string' ? item === itemName : item.name === itemName
      );
      if (!itemToUpdate) return;

      const normalizedItem = normalizeItem(itemToUpdate);
      const newDoneState = !normalizedItem.done;
      
      const updatedItem: ListItemBase = {
        ...normalizedItem,
        done: newDoneState
      };
      
      // For Call list, set lastContactedDate when marking as done
      if (listName === 'Call' && newDoneState) {
        updatedItem.lastContactedDate = new Date().toISOString().split('T')[0];
      }
      
      const response = await fetch('/api/lists/items/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listName,
          itemName,
          updates: updatedItem
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      // Update local state
      setItems(items.map(item => 
        (typeof item === 'string' ? item === itemName : item.name === itemName)
          ? updatedItem 
          : normalizeItem(item)
      ));
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemName: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch('/api/lists/items/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listName,
          itemName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Update local state
      setItems(items.filter(item => 
        typeof item === 'string' ? item !== itemName : item.name !== itemName
      ));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleMovieClick = (item: ListItem) => {
    if (listName !== 'Movies') return;
    
    const normalizedItem = normalizeItem(item);
    const movieItem = item as MovieItem;
    
    if (expandedItem === normalizedItem.name) {
      // Close if already expanded
      setExpandedItem(null);
      setEditingMovie(null);
    } else {
      // Expand and set up editing
      setExpandedItem(normalizedItem.name);
      setEditingMovie({
        ...normalizedItem,
        length: movieItem.length || '',
        rating: movieItem.rating || null,
        notes: movieItem.notes || ''
      });
    }
  };

  const handleSaveMovie = async () => {
    if (!editingMovie) return;

    try {
      const response = await fetch('/api/lists/items/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listName,
          itemName: editingMovie.name,
          updates: editingMovie
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update movie');
      }

      // Update local state
      setItems(items.map(item => {
        const normalizedItem = normalizeItem(item);
        return normalizedItem.name === editingMovie.name ? editingMovie : item;
      }));
      
      setExpandedItem(null);
      setEditingMovie(null);
      alert('Movie updated successfully!');
    } catch (error) {
      console.error('Error updating movie:', error);
      alert('Failed to update movie');
    }
  };

  const handleCancelMovieEdit = () => {
    setExpandedItem(null);
    setEditingMovie(null);
  };

  const handleQuickAdd = async () => {
    if (!quickAddItem.name?.trim()) {
      alert('Please enter an item name');
      return;
    }

    try {
      const itemToAdd = listName === 'Movies' 
        ? quickAddItem
        : { name: quickAddItem.name, done: false };

      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addItems',
          listName,
          items: [itemToAdd]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item');
      }

      // Add to local state
      setItems([...items, itemToAdd as ListItem]);
      
      // Reset form
      setQuickAddItem({
        name: '',
        done: false,
        length: '',
        rating: null,
        notes: ''
      });
      setShowQuickAdd(false);
      
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleCancelQuickAdd = () => {
    setQuickAddItem({
      name: '',
      done: false,
      length: '',
      rating: null,
      notes: ''
    });
    setShowQuickAdd(false);
  };

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };
  
  const handleDeleteList = async () => {
    if (!confirm(`Are you sure you want to delete the "${listName}" list? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/lists', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listName }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
    }
  };

  const handleSortToggle = () => {
    if (sortBy === 'none') {
      setSortBy('rating-desc');
    } else if (sortBy === 'rating-desc') {
      setSortBy('rating-asc');
    } else {
      setSortBy('none');
    }
  };

  const getSortedItems = (itemsToSort: ListItem[]) => {
    if (listName !== 'Movies' || sortBy === 'none') {
      return itemsToSort;
    }

    return [...itemsToSort].sort((a, b) => {
      const movieA = a as MovieItem;
      const movieB = b as MovieItem;
      
      const ratingA = movieA.rating || 0;
      const ratingB = movieB.rating || 0;
      
      if (sortBy === 'rating-desc') {
        return ratingB - ratingA;
      } else {
        return ratingA - ratingB;
      }
    });
  };

  const filteredItems = getSortedItems(
    hideCompleted 
      ? items.filter(item => !normalizeItem(item).done) 
      : items
  );

  return (
    <div className={`flex flex-col w-full justify-start ${hideHeader ? '' : 'mb-2'} h-fit`}>
      {/* Only show header if hideHeader is false */}
      {!hideHeader && (
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} cursor-pointer relative w-full overflow-hidden h-full`}>
          <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} absolute -inset-3 bg-cyan-700 blur opacity-20`}></div>
          <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} relative flex justify-between px-1 py-1 border-2 border-cyan-800 text-cyan-950 dark:text-cyan-500 hover:text-cyan-600`}>
         
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteList();
                }}
                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30"
                title={`Delete ${listName} list`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div onClick={toggleOpen}>
                <svg
                  className={`w-6 h-6 mt-1 transition-transform duration-300 transform rotate-180 ${isOpen ? 'transform rotate-2' : ''}`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" className={`fill-cyan-950`} />
                  <path d="M8 12l4 4 4-4" className="stroke-current text-cyan-200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`px-0 ${isOpen && !hideHeader ? 'bg-neutral-200 rounded-br-lg rounded-bl-lg pb-3 border-2 border-t-0 border-cyan-700' : ''}`}>
        {isOpen && (
          <div className='mt-4 px-4'>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                <div className="flex justify-between mb-4 space-x-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setHideCompleted(!hideCompleted)}
                      className="text-sm text-cyan-600 hover:text-cyan-800"
                    >
                      {hideCompleted ? 'Show Completed' : 'Hide Completed'}
                    </button>
                    {listName === 'Movies' && (
                      <button
                        onClick={handleSortToggle}
                        className="text-sm text-cyan-600 hover:text-cyan-800"
                      >
                        Sort: {sortBy === 'none' ? 'None' : sortBy === 'rating-desc' ? 'Rating ↓' : 'Rating ↑'}
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowQuickAdd(!showQuickAdd)}
                      className="text-sm text-cyan-600 hover:text-cyan-800 font-bold"
                      title="Add item to this list"
                    >
                      + Add Item
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-sm text-cyan-600 hover:text-cyan-800"
                    >
                      {isEditing ? 'Done Editing' : 'Edit List'}
                    </button>
                  </div>
                </div>

                {showQuickAdd && (
                  <div className="mb-4 p-4 border border-cyan-200 rounded-lg bg-cyan-50">
                    <h4 className="font-semibold mb-3">Add New Item</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={quickAddItem.name}
                          onChange={(e) => setQuickAddItem({...quickAddItem, name: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                          placeholder="Enter item name"
                          onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                        />
                      </div>
                      
                      {listName === 'Movies' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Length
                            </label>
                            <input
                              type="text"
                              value={quickAddItem.length || ''}
                              onChange={(e) => setQuickAddItem({...quickAddItem, length: e.target.value})}
                              placeholder="e.g., 2h15m"
                              className="w-full border border-gray-300 rounded-md px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rating (0-5)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={quickAddItem.rating || ''}
                              onChange={(e) => setQuickAddItem({...quickAddItem, rating: e.target.value ? Number(e.target.value) : null})}
                              className="w-full border border-gray-300 rounded-md px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={quickAddItem.notes || ''}
                              onChange={(e) => setQuickAddItem({...quickAddItem, notes: e.target.value})}
                              rows={2}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 resize-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={handleCancelQuickAdd}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleQuickAdd}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                )}

                <ul className="space-y-2">
                  {filteredItems.map((item) => {
                    const normalizedItem = normalizeItem(item);
                    const isMovieList = listName === 'Movies';
                    const isExpanded = expandedItem === normalizedItem.name;
                    
                    return (
                      <li key={normalizedItem.name} className="border rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="checkbox"
                              checked={normalizedItem.done}
                              onChange={() => handleCheckboxChange(normalizedItem.name)}
                              className="checkbox"
                            />
                            <span 
                              className={`${normalizedItem.done ? 'line-through text-gray-500' : ''} ${
                                isMovieList ? 'cursor-pointer hover:text-cyan-600' : ''
                              }`}
                              onClick={() => isMovieList && handleMovieClick(item)}
                            >
                              {normalizedItem.name}
                            </span>
                            {/* Show last contacted date for Call list */}
                            {listName === 'Call' && normalizedItem.lastContactedDate && (
                              <span className="text-xs text-gray-400 ml-2">
                                (Last: {normalizedItem.lastContactedDate})
                              </span>
                            )}
                            {/* Show Travel Destinations info */}
                            {listName === 'Travel Destinations' && (
                              <span className="text-xs text-gray-500 ml-2">
                                {(item as TravelDestinationItem).country && `${(item as TravelDestinationItem).country}`}
                              </span>
                            )}
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleDeleteItem(normalizedItem.name)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        
                        {isMovieList && isExpanded && editingMovie && (
                          <div className="mt-4 p-4 bg-gray-50 rounded border-t">
                            <h4 className="font-semibold mb-3">Edit Movie Details</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={editingMovie.name}
                                  onChange={(e) => setEditingMovie({...editingMovie, name: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-2 py-1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Length
                                </label>
                                <input
                                  type="text"
                                  value={editingMovie.length || ''}
                                  onChange={(e) => setEditingMovie({...editingMovie, length: e.target.value})}
                                  placeholder="e.g., 2h15m"
                                  className="w-full border border-gray-300 rounded-md px-2 py-1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Rating (0-5)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.5"
                                  value={editingMovie.rating || ''}
                                  onChange={(e) => setEditingMovie({...editingMovie, rating: e.target.value ? Number(e.target.value) : null})}
                                  className="w-full border border-gray-300 rounded-md px-2 py-1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Notes
                                </label>
                                <textarea
                                  value={editingMovie.notes || ''}
                                  onChange={(e) => setEditingMovie({...editingMovie, notes: e.target.value})}
                                  rows={3}
                                  className="w-full border border-gray-300 rounded-md px-2 py-1 resize-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                              <button
                                onClick={handleCancelMovieEdit}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveMovie}
                                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Travel Destinations expanded view */}
                        {listName === 'Travel Destinations' && (
                          <div className="mt-2 pl-6 text-sm">
                            {(item as TravelDestinationItem).description && (
                              <p className="text-gray-600 mb-1">{(item as TravelDestinationItem).description}</p>
                            )}
                            {(item as TravelDestinationItem).links && (item as TravelDestinationItem).links!.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {(item as TravelDestinationItem).links!.map((link, idx) => (
                                  <a 
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-600 hover:text-cyan-800 hover:underline"
                                  >
                                    {link.text}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListWrap;