"use client";
// src/components/d3/TaskTrendChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { processTaskData } from './TaskTrendData';

// Convert date to EST
const normalizeDate = (dateStr) => {
  const date = new Date(dateStr);
  const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return estDate.toISOString().split('T')[0];
};

const CompletedMissedTasksChart = () => {
  const [data, setData] = useState({ completed: {}, missed: {} });
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/backlog');
        const tasks = await response.json();

        const filteredTasks = tasks.filter(task => task['Due Date'] !== null && task['Due Date'] !== '');

        const processedData = processTaskData(filteredTasks);
        setData(processedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (Object.keys(data.completed).length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 10, right: 15, bottom: 100, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Normalize and process dates
    const allDates = [
      ...Object.keys(data.completed),
      ...Object.keys(data.missed)
    ]
    .map(dateStr => new Date(dateStr)) 
    .sort((a, b) => a - b); 

    // Filter to only include dates within the last 30 days
    const now = new Date();
    const last30Days = d3.timeDay.offset(now, -30);
    const filteredDates = allDates.filter(date => date >= last30Days && date <= now);

    // Generate a continuous date range for the last 30 days
    const xDomainDates = d3.timeDays(d3.min(filteredDates), d3.max(filteredDates));

    const x = d3.scaleTime()
      .domain([d3.min(xDomainDates), d3.max(xDomainDates)])
      .range([0, width]);

    const yMax = Math.max(d3.max(Object.values(data.completed)), d3.max(Object.values(data.missed))) + 1;
    const y = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height, 0]);

    // Ensure y-axis only has whole-number ticks
    const yAxis = d3.axisLeft(y)
      .ticks(yMax)
      .tickFormat(d => d);

    // Draw X-axis with specific ticks
    svg.append('g')
      .attr('transform', `translate(${margin.left},${height + margin.top})`)
      .call(d3.axisBottom(x)
        .tickValues(xDomainDates) 
        .tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
      .style('fill', 'white')
      .style('font-size', '9px')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');

    // Draw Y-axis
    const yAxisGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(yAxis);

    yAxisGroup.selectAll('text')
      .style('fill', 'white')
      .style('font-size', '12px');

    yAxisGroup.select('path')
      .style('stroke', 'slategray');

    // Add horizontal grid lines for Y-axis tick marks
    svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
        .ticks(yMax))
      .selectAll('line')
      .style('stroke', 'slategray')
      .style('stroke-width', '1px');

    // Combine data for proper line rendering
    const combinedData = xDomainDates.map(date => ({
      date,
      completed: data.completed[normalizeDate(date)] || 0,
      missed: data.missed[normalizeDate(date)] || 0
    }));

    // Line generator for Completed Tasks
    const lineCompleted = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.completed));

    // Line generator for Missed Tasks
    const lineMissed = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.missed));

    // Draw lines for Completed Tasks
    svg.append('path')
      .data([combinedData])
      .attr('class', 'line completed')
      .attr('d', d => lineCompleted(d))
      .attr('fill', 'none')
      .attr('stroke', 'cyan')
      .attr('stroke-width', 2)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw lines for Missed Tasks
    svg.append('path')
      .data([combinedData])
      .attr('class', 'line missed')
      .attr('d', d => lineMissed(d))
      .attr('fill', 'none')
      .attr('stroke', 'fuchsia')
      .attr('stroke-width', 2)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  }, [data]);

  return (
    <div style={{ overflowX: 'none', padding: '10px 10px', maxWidth: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ maxWidth: '100%' }}></svg>
    </div>
  );
};

export default CompletedMissedTasksChart;
