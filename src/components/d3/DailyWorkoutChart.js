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
  
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 180;
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
      .attr('color', '#94A3B8')
      .selectAll('text')
      .attr('font-size', '10px');
    
    // Y axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(3).tickFormat(d3.format('d')))
      .attr('color', '#94A3B8');
    
  }, [workouts]);
  
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <p className="text-slate-400 text-sm text-center">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-white mb-2">Daily Workouts (Last 14 Days)</h3>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-400">{category}</span>
          </div>
        ))}
      </div>
      
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}

