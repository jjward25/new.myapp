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

    const margin = { top: 10, right: 10, bottom: 30, left: 30 }; // Increased bottom margin
    const width = 700 - margin.left - margin.right;
    const height = 140 - margin.top - margin.bottom;

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
      .x(d => x(d.date) + x.bandwidth() / 2 + margin.left)
      .y(d => y(d.completed) + margin.top);

    // Line generator for Missed Tasks
    const lineMissed = d3.line()
      .x(d => x(d.date) + x.bandwidth() / 2 + margin.left)
      .y(d => y(d.missed) + margin.top);

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

    // Add legend at the bottom
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left},${height + margin.top + 80})`); // Increased bottom translation

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 10)
      .attr('r', 6)
      .attr('fill', 'cyan');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 15)
      .attr('fill', 'white')
      .style('font-size', '10px') // Smaller font size
      .text('Completed Tasks');

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 30)
      .attr('r', 6)
      .attr('fill', 'fuchsia');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 35)
      .attr('fill', 'white')
      .style('font-size', '10px') // Smaller font size
      .text('Missed Tasks');

  }, [data]);

  return (
    <svg ref={svgRef} width="800" height="165" style={{ margin: '20px' }}></svg>
  );
};

export default CompletedMissedTasksChart;
