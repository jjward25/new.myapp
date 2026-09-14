"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const LIFT_COLORS = {
  'Bench': '#3B82F6',      // Blue
  'Squat': '#EF4444',      // Red
  'Deadlift': '#22C55E',   // Green
  'Pull-Ups': '#A855F7',   // Purple
  '5k': '#F59E0B',         // Amber
};

export default function OneRepMaxChart() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/workouts/simple');
        const workouts = await response.json();
        
        // Extract all 1RM entries
        const oneRmEntries = [];
        workouts.forEach(workout => {
          workout.Exercises?.forEach(ex => {
            if (ex.Category === '1RM') {
              oneRmEntries.push({
                date: workout.Date,
                exercise: ex.ExerciseName,
                value: ex.ExerciseName === '5k' ? ex.Time : ex.Weight,
              });
            }
          });
        });
        
        setData(oneRmEntries);
      } catch (error) {
        console.error('Error fetching 1RM data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 45 };
    
    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Group data by exercise
    const grouped = d3.group(data, d => d.exercise);
    
    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    const allDates = data.map(d => parseDate(d.date));
    
    // Filter out null dates
    const validDates = allDates.filter(d => d !== null);
    if (validDates.length === 0) return;
    
    // X scale (time)
    const xScale = d3.scaleTime()
      .domain(d3.extent(validDates))
      .range([margin.left, width - margin.right]);
    
    // Y scale (weight) - exclude 5k for weight scale
    const weightData = data.filter(d => d.exercise !== '5k');
    const maxWeight = weightData.length > 0 ? d3.max(weightData, d => d.value) : 100;
    
    const yScale = d3.scaleLinear()
      .domain([0, maxWeight * 1.1])
      .range([height - margin.bottom, margin.top]);
    
    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%b')))
      .attr('color', '#5b626d');

    // Y axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(5))
      .attr('color', '#5b626d');
    
    // Line generator
    const line = d3.line()
      .x(d => xScale(parseDate(d.date)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Draw lines for each exercise (excluding 5k which has different units)
    grouped.forEach((values, exercise) => {
      if (exercise === '5k') return; // Skip 5k for now (different scale)
      
      const sortedValues = values.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Draw line
      svg.append('path')
        .datum(sortedValues)
        .attr('fill', 'none')
        .attr('stroke', LIFT_COLORS[exercise] || '#6B7280')
        .attr('stroke-width', 2)
        .attr('d', line);
      
      // Draw dots
      svg.selectAll(`.dot-${exercise}`)
        .data(sortedValues)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(parseDate(d.date)))
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', LIFT_COLORS[exercise] || '#6B7280');
    });
    
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="mc-panel p-4" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
        <p className="mc-mono text-[11px] text-[#8a919c] text-center">Loading…</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="mc-panel p-4" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
        <span className="mc-label">1RM Progress</span>
        <p className="mc-mono text-[11px] text-[#8a919c] text-center mt-2">No 1RM data logged yet.</p>
      </div>
    );
  }

  return (
    <div className="mc-panel p-4" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
      <span className="mc-label">1RM Progress</span>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 mb-3">
        {Object.entries(LIFT_COLORS).map(([lift, color]) => (
          <div key={lift} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="mc-mono text-[10px] text-[#8a919c]">{lift}</span>
          </div>
        ))}
      </div>

      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}

