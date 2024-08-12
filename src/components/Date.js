// src/components/Date.js
"use client"
import React, { useState, useEffect } from 'react';

const DateUpdater = () => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // Function to format the current date
    const fetchDate = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const parts = formatter.formatToParts(now);
      const formattedDate = parts.map(({ value }) => value).join('');
      setFormattedDate(formattedDate);
    };

    fetchDate(); // Initial call
    const intervalId = setInterval(fetchDate, 60000); // Refresh every minute

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return <p className="text-neutral-400 mb-3">{formattedDate}</p>;
};

export default DateUpdater;


