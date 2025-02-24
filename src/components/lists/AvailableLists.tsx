"use client"; // This component will be a Client Component

import { useEffect, useState } from "react";
import TaskListWrapList from './TaskClientWrapList'; // Adjust the import path as necessary

const AvailableLists: React.FC = () => {
    const [availableLists, setAvailableLists] = useState<string[]>([]);

    const fetchAvailableLists = async () => {
        try {
            const response = await fetch("/api/lists"); // Fetch all lists
            if (!response.ok) {
                throw new Error("Failed to fetch available lists");
            }
            const data = await response.json();
            setAvailableLists(data.lists.map((list: { name: string }) => list.name)); // Extract names
        } catch (error) {
            console.error("Error fetching available lists:", error);
        }
    };

    useEffect(() => {
        fetchAvailableLists(); // Fetch the available lists on component mount
    }, []);

    return (
        <>
            {availableLists.map((list) => (
                <TaskListWrapList key={list} listName={list} isOpen={false} />
            ))}
        </>
    );
};

export default AvailableLists;