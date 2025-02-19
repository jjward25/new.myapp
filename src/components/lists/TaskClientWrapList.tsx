'use client';

import React, { useState, useEffect } from 'react';

interface ListWrapProps {
  listName: string;
  isOpen?: boolean;
}

interface ListItemBase {
  name: string;
  done: boolean;
}

interface MovieItem extends ListItemBase {
  length?: string;
  rating?: number | null;
  notes?: string;
}

type ListItem = ListItemBase | MovieItem | string;

const ListWrap: React.FC<ListWrapProps> = ({
  listName,
  isOpen: initialIsOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [items, setItems] = useState<ListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      const updatedItem = {
        ...normalizedItem,
        done: !normalizedItem.done
      };
      
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

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  const filteredItems = hideCompleted 
    ? items.filter(item => !normalizeItem(item).done) 
    : items;

  return (
    <div className='flex flex-col w-full justify-start mb-2 h-fit'>
      <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} cursor-pointer relative w-full overflow-hidden h-full`} onClick={toggleOpen}>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} absolute -inset-3 bg-cyan-700 blur opacity-20`}></div>
        <div className={`${isOpen ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} relative flex justify-between px-1 py-1 border-2 border-cyan-800 text-cyan-950 dark:text-cyan-500 hover:text-cyan-600`}>
          <p className={`text-lg font-semibold pl-1 my-0`}>
            {listName}
          </p>
          
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

      <div className={`px-0 ${isOpen ? 'bg-neutral-200 rounded-br-lg rounded-bl-lg pb-3 border-2 border-t-0 border-cyan-700' : ''}`}>
        {isOpen && (
          <div className='mt-4 px-4'>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                <div className="flex justify-end mb-4 space-x-4">
                  <button
                    onClick={() => setHideCompleted(!hideCompleted)}
                    className="text-sm text-cyan-600 hover:text-cyan-800"
                  >
                    {hideCompleted ? 'Show Completed' : 'Hide Completed'}
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm text-cyan-600 hover:text-cyan-800"
                  >
                    {isEditing ? 'Done Editing' : 'Edit List'}
                  </button>
                </div>
                <ul className="space-y-2">
                  {filteredItems.map((item) => {
                    const normalizedItem = normalizeItem(item);
                    return (
                      <li key={normalizedItem.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={normalizedItem.done}
                            onChange={() => handleCheckboxChange(normalizedItem.name)}
                            className="checkbox"
                          />
                          <span className={`${normalizedItem.done ? 'line-through text-gray-500' : ''}`}>
                            {normalizedItem.name}
                          </span>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteItem(normalizedItem.name)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
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