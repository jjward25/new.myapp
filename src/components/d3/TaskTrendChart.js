"use client"
// src/components/CompletedMissedTasksChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { processTaskData } from './TaskTrendData';

const CompletedMissedTasksChart = () => {
  const [data, setData] = useState({ completed: {}, missed: {} });
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/backlog');
        const tasks = await response.json();

        // Filter out tasks with null or undefined Due Dates
        const filteredTasks = tasks.filter(task => task.DueDate !== null);

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
    const margin = { top: 20, right: 20, bottom: 40, left: 40 }; // Adjusted margins
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom; // Increased height for better view

    // Ensure dates are in ascending order
    const xDomain = Object.keys(data.completed).sort((a, b) => new Date(a) - new Date(b));

    const x = d3.scaleBand()
      .domain(xDomain)
      .range([0, width])
      .padding(0.2);

    const yMax = Math.max(d3.max(Object.values(data.completed)), d3.max(Object.values(data.missed))) + 1;
    const y = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height, 0]);

    // Ensure y-axis only has whole-number ticks
    const yAxis = d3.axisLeft(y)
      .ticks(yMax) // Explicitly set the number of ticks
      .tickFormat(d => d); // Format as whole numbers

    // Draw X-axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},${height + margin.top})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('fill', 'white') // Set x-axis text color to white
      .style('font-size', '12px') // Increase font size for legibility
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');

    // Draw Y-axis
    const yAxisGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(yAxis);

    // Style Y-axis text
    yAxisGroup.selectAll('text')
      .style('fill', 'white') // Set y-axis text color to white
      .style('font-size', '12px'); // Increase font size for legibility

    // Style Y-axis line
    yAxisGroup.select('path')
      .style('stroke', 'slategray'); // Y-axis line color

    // Add horizontal grid lines for Y-axis tick marks
    svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y)
        .tickSize(-width) // Extend the ticks across the chart width
        .tickFormat(() => '') // Remove tick labels
        .ticks(yMax)) // Explicitly set the number of ticks
      .selectAll('line')
      .style('stroke', 'slategray') // Set the color of the lines
      .style('stroke-width', '1px'); // Set the width of the lines

    // Line generator for Completed Tasks
    const lineCompleted = d3.line()
      .x(d => x(d.date) + x.bandwidth() / 2)
      .y(d => y(d.completed));

    // Line generator for Missed Tasks
    const lineMissed = d3.line()
      .x(d => x(d.date) + x.bandwidth() / 2)
      .y(d => y(d.missed));

    // Combine data for proper line rendering
    const combinedData = xDomain.map(date => ({
      date,
      completed: data.completed[date] || 0,
      missed: data.missed[date] || 0
    }));

    // Draw lines for Completed Tasks
    svg.append('path')
      .data([combinedData])
      .attr('class', 'line completed')
      .attr('d', d => lineCompleted(d.map(d => ({ date: d.date, completed: d.completed }))))
      .attr('fill', 'none')
      .attr('stroke', 'cyan')
      .attr('stroke-width', 2);

    // Draw lines for Missed Tasks
    svg.append('path')
      .data([combinedData])
      .attr('class', 'line missed')
      .attr('d', d => lineMissed(d.map(d => ({ date: d.date, missed: d.missed }))))
      .attr('fill', 'none')
      .attr('stroke', 'fuchsia')
      .attr('stroke-width', 2);


  }, [data]);

  return (
    <div style={{ overflowX: 'auto', padding: '10px 10px', maxWidth: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 730 230" style={{ maxWidth: '100%' }}></svg>
    </div>
  );
};

export default CompletedMissedTasksChart;
