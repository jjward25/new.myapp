"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CATEGORY_COLORS = {
  'Cardio': '#21bce3',      // Rose
  'Chest+Tris': '#712014',  // Blue
  'Shoulders': '#8B5CF6',   // Violet
  'Quads': '#F59E0B',       // Amber
  'Hamstrings': '#F97316',  // Orange
  'Hips': '#fb2be9', // Pink
  'Back+Bis': '#195c0e',    // Emerald
  'Core': '#3B82F6',        // Teal
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function DailyWorkoutChart() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resizeTick, setResizeTick] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/workouts/simple');
        const data = await response.json();
        setWorkouts(data);
      } catch (error) {
        console.error('Error fetching workout data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Redraw when the container's actual size changes, not just when data
  // does -- otherwise a CSS height change never reaches the SVG and it
  // overflows/underfills its box instead of resizing.
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => setResizeTick((t) => t + 1));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(120, container.clientHeight || 200); // fill the flex-1 area given by the shared grid row
    const margin = { top: 10, right: 10, bottom: 30, left: 30 };
    
    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Generate last 14 days
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    // Process data for stacking
    const dailyData = days.map(day => {
      const workout = workouts.find(w => w.Date === day);
      const counts = {};
      CATEGORIES.forEach(cat => { counts[cat] = 0; });
      
      if (workout && workout.Exercises) {
        workout.Exercises.forEach(ex => {
          if (ex.Category !== '1RM' && counts[ex.Category] !== undefined) {
            counts[ex.Category]++;
          }
        });
      }
      
      return { date: day, ...counts };
    });
    
    // X scale
    const xScale = d3.scaleBand()
      .domain(days)
      .range([margin.left, width - margin.right])
      .padding(0.2);
    
    // Calculate max stack height
    const maxHeight = d3.max(dailyData, d => 
      CATEGORIES.reduce((sum, cat) => sum + d[cat], 0)
    ) || 5;
    
    // Y scale
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(maxHeight, 5)])
      .range([height - margin.bottom, margin.top]);
    
    // Stack generator
    const stack = d3.stack()
      .keys(CATEGORIES)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
    
    const stackedData = stack(dailyData);
    
    // Draw stacked bars
    svg.selectAll('g.layer')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('fill', d => CATEGORY_COLORS[d.key])
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.data.date))
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('rx', 2);
    
    // X axis
    const formatDay = (dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
    };
    
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(formatDay)
        .tickSize(0))
      .attr('color', '#5b626d')
      .selectAll('text')
      .attr('font-size', '10px');

    // Y axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(3).tickFormat(d3.format('d')))
      .attr('color', '#5b626d');
    
  }, [workouts, resizeTick]);
  
  if (isLoading) {
    return (
      <div className="mc-panel p-4 h-full flex flex-col overflow-hidden" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
        <p className="mc-mono text-[11px] text-[#8a919c] text-center">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mc-panel p-4 h-full flex flex-col overflow-hidden" style={{ background: '#171a1f', borderColor: 'rgba(255,255,255,0.14)' }}>
      <span className="mc-label shrink-0">Daily Workouts (Last 14 Days)</span>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2 mb-3 shrink-0">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="mc-mono text-[9px] text-[#8a919c]">{category}</span>
          </div>
        ))}
      </div>

      {/* No CSS sizing on the svg itself -- width/height attrs are set
          directly from the measured container in the draw effect, and must
          be the sole source of the SVG's box (see TaskTrendChart.js for
          why a competing CSS height silently misplaces the drawn content). */}
      <div ref={containerRef} className="w-full flex-1 min-h-0 overflow-hidden">
        <svg ref={svgRef} style={{ display: "block" }} />
      </div>
    </div>
  );
}

