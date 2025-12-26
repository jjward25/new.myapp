"use client";

import { useEffect, useState } from "react";
import TaskListWrapList from './TaskClientWrapList';
import TaskClientWrapParent from './TaskClientWrapParent';

interface ListData {
    name: string;
    parent?: string | null;
}

const AvailableLists: React.FC = () => {
    const [availableLists, setAvailableLists] = useState<ListData[]>([]);
    const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

    const fetchAvailableLists = async () => {
        try {
            const response = await fetch("/api/lists");
            if (!response.ok) {
                throw new Error("Failed to fetch available lists");
            }
            const data = await response.json();
            setAvailableLists(data.lists.map((list: { name: string; parent?: string }) => ({ 
                name: list.name, 
                parent: list.parent || null 
            })));
        } catch (error) {
            console.error("Error fetching available lists:", error);
        }
    };

    useEffect(() => {
        fetchAvailableLists();
    }, []);

    const toggleParent = (parentName: string) => {
        setCollapsedParents(prev => ({
            ...prev,
            [parentName]: !prev[parentName]
        }));
    };

    const handleDeleteList = async (listName: string) => {
        if (!confirm(`Are you sure you want to delete the "${listName}" list and all its items?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/lists/items/delete?listName=${encodeURIComponent(listName)}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete list');
            }
            
            // Refresh the lists
            fetchAvailableLists();
        } catch (error) {
            console.error('Error deleting list:', error);
            alert('Failed to delete list. Please try again.');
        }
    };

    // Get parent lists (lists that have children)
    const getParentLists = () => {
        const parentNames = new Set(
            availableLists
                .filter(l => l.parent)
                .map(l => l.parent as string)
        );
        return availableLists.filter(l => parentNames.has(l.name));
    };

    // Get child lists for a parent
    const getChildLists = (parentName: string) => {
        return availableLists.filter(l => l.parent === parentName);
    };

    // Get orphan lists (no parent and not a parent themselves)
    const getOrphanLists = () => {
        const parentNames = new Set(
            availableLists
                .filter(l => l.parent)
                .map(l => l.parent as string)
        );
        return availableLists.filter(l => !l.parent && !parentNames.has(l.name));
    };

    const parentLists = getParentLists();
    const orphanLists = getOrphanLists();

    return (
        <div className="space-y-2">
            {/* Parent lists with their children */}
            {parentLists.map((parent) => {
                const children = getChildLists(parent.name);
                const isCollapsed = collapsedParents[parent.name] ?? true;
                
                return (
                    <div key={parent.name} className='flex flex-col w-full justify-start mb-2 h-fit'>
                        {/* Parent header - matching TaskClientWrapList styling */}
                        <div className={`${!isCollapsed ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} cursor-pointer relative w-full overflow-hidden h-full`}>
                            <div className={`${!isCollapsed ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} absolute -inset-3 bg-cyan-700 blur opacity-20`}></div>
                            <div className={`${!isCollapsed ? 'rounded-tr-lg rounded-tl-lg' : 'rounded-lg'} relative flex justify-between px-1 py-1 border-2 border-cyan-800 text-cyan-950 dark:text-cyan-500 hover:text-cyan-600`}>
                                <div className="flex items-center flex-1" onClick={() => toggleParent(parent.name)}>
                                    <p className="text-lg font-semibold pl-1 my-0 text-white opacity-90">
                                        {parent.name}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteList(parent.name);
                                        }}
                                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/30"
                                        title={`Delete ${parent.name} list`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <div onClick={() => toggleParent(parent.name)}>
                                        <svg
                                            className={`w-6 h-6 mt-1 transition-transform duration-300 transform rotate-180 ${!isCollapsed ? 'transform rotate-2' : ''}`}
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="currentColor"
                                        >
                                            <circle cx="12" cy="12" r="10" className="fill-cyan-950" />
                                            <path d="M8 12l4 4 4-4" className="stroke-current text-cyan-200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Parent's own list content */}
                        {!isCollapsed && (
                            <div className="px-0 bg-neutral-200 rounded-br-lg rounded-bl-lg pb-3 border-2 border-t-0 border-cyan-700">
                                <TaskClientWrapParent listName={parent.name} isOpen={false} hideHeader={true} />
                                
                                {/* Children */}
                                <div className="pl-4 space-y-1 pt-2">
                                    {children.map((child) => (
                                        <TaskListWrapList key={child.name} listName={child.name} isOpen={false} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {/* Orphan lists (no parent, not a parent) */}
            {orphanLists.map((list) => (
                <TaskListWrapList key={list.name} listName={list.name} isOpen={false} />
            ))}
        </div>
    );
};

export default AvailableLists;
