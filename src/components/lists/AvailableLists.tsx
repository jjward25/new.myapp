"use client";

import { useEffect, useState } from "react";
import TaskListWrapList from './TaskClientWrapList';

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
                const isCollapsed = collapsedParents[parent.name] ?? false;
                
                return (
                    <div key={parent.name} className="border border-cyan-700 rounded-lg overflow-hidden">
                        {/* Parent header */}
                        <div 
                            className="flex items-center justify-between bg-cyan-900/50 px-3 py-2 cursor-pointer hover:bg-cyan-900/70"
                            onClick={() => toggleParent(parent.name)}
                        >
                            <span className="text-white font-semibold text-sm">{parent.name}</span>
                            <svg
                                className={`w-4 h-4 text-cyan-300 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        
                        {/* Parent's own list */}
                        {!isCollapsed && (
                            <div className="bg-cyan-950/30">
                                <TaskListWrapList listName={parent.name} isOpen={false} />
                                
                                {/* Children */}
                                <div className="pl-4 space-y-1 pb-2">
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
