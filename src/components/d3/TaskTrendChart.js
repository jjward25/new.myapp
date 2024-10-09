"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { processTaskData } from './TaskTrendData';
import { debounce } from 'lodash'; // You may need to install lodash

const normalizeDate = (dateStr) => {
  const date = new Date(dateStr);
  const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return estDate.toISOString().split('T')[0];
};

const CompletedMissedTasksChart = () => {
  const [data, setData] = useState({ completed: {}, missed: {} });
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const fetchData = debounce(async () => {
      const cacheKey = 'taskData';
      const cachedData = localStorage.getItem(cacheKey);
    
      if (cachedData) {
        setData(JSON.parse(cachedData));
        return;
      }
    
      try {
        const response = await fetch('/api/backlog');
        const tasks = await response.json();
        const filteredTasks = tasks.filter(task => task['Due Date'] !== null && task['Due Date'] !== '');
        const processedData = processTaskData(filteredTasks);
        setData(processedData);
        localStorage.setItem(cacheKey, JSON.stringify(processedData)); // Cache the data
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },300); // Adjust the debounce delay as necessary
  
    fetchData();
  
    // Cleanup function to cancel any pending debounced calls
    return () => {
      fetchData.cancel();
    };
  }, []);

  useEffect(() => {
    if (Object.keys(data.completed).length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 10, right: 15, bottom: 80, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const now = new Date();
    const last30Days = d3.timeDay.offset(now, -30);
    const xDomainDates = d3.timeDays(last30Days, now);

    const combinedData = xDomainDates.map(date => ({
      date,
      completed: data.completed[normalizeDate(date)] || 0,
      missed: data.missed[normalizeDate(date)] || 0,
    }));

    const x = d3.scaleTime()
      .domain(d3.extent(combinedData, d => d.date))
      .range([0, width]);

    const yMax = Math.max(d3.max(combinedData, d => d.completed), d3.max(combinedData, d => d.missed)) + 1;
    const y = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(${margin.left},${height + margin.top})`)
      .call(d3.axisBottom(x)
        .ticks(d3.timeDay.every(1))
        .tickFormat(d => {
          const date = new Date(d);
          return date.getDate() === 1 ? d3.timeFormat('%b')(date) : d3.timeFormat('%d')(date);
        }))
      .selectAll('text')
      .style('fill', 'white')
      .style('font-size', '10px')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');

    const yAxisGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y));

    yAxisGroup.selectAll('text')
      .style('fill', 'white')
      .style('font-size', '10px');

    yAxisGroup.select('path')
      .style('stroke', 'slategray');

    svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
        .ticks(yMax))
      .selectAll('line')
      .style('stroke', 'slategray')
      .style('stroke-width', '1px');

    const lineCompleted = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.completed));

    const lineMissed = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.missed));

    // Draw lines for Missed Tasks first
    svg.append('path')
      .data([combinedData])
      .attr('class', 'line missed')
      .attr('d', lineMissed)
      .attr('fill', 'none')
      .attr('stroke', '#7f694b')
      .attr('stroke-width', 1)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw lines for Completed Tasks above Missed Tasks
    svg.append('path')
      .data([combinedData])
      .attr('class', 'line completed')
      .attr('d', lineCompleted)
      .attr('fill', 'none')
      .attr('stroke', '#74a892')
      .attr('stroke-width', 1)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const tooltip = d3.select('body').append('div')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'rgba(0,0,0,0.7)')
      .style('color', 'white')
      .style('padding', '5px')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .attr('class', 'tooltip');

    // Draw dots for missed tasks
    svg.selectAll('.dot-missed')
      .data(combinedData)
      .enter().append('circle')
      .attr('class', 'dot-missed')
      .attr('cx', d => x(d.date) + margin.left)
      .attr('cy', d => y(d.missed) + margin.top)
      .attr('r', 5) // Increase dot size for visibility
      .attr('fill', '#7f694b')
      .on('mouseover', (event, d) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        tooltip.html(`${d3.timeFormat('%b %d, %Y')(d.date)}:<br>Missed ${d.missed}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 40) + 'px')
          .style("font-size", "10px");
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 40) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Draw dots for completed tasks last
    svg.selectAll('.dot-completed')
      .data(combinedData)
      .enter().append('circle')
      .attr('class', 'dot-completed')
      .attr('cx', d => x(d.date) + margin.left)
      .attr('cy', d => y(d.completed) + margin.top)
      .attr('r', 3)
      .attr('fill', '#2e9da2')
      .on('mouseover', (event, d) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        tooltip.html(`${d3.timeFormat('%b %d, %Y')(d.date)}:<br>Completed ${d.completed}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 40) + 'px')
          .style("font-size", "10px");
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 40) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

  }, [data]);

  return (
    <div style={{ overflowX: 'none', padding: '10px 10px', maxWidth: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ maxWidth: '100%' }}></svg>
    </div>
  );
};

export default CompletedMissedTasksChart;
