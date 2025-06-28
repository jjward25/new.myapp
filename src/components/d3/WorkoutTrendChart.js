import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const WorkoutTrendChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Parse the date and set it to midnight local time
    const parsedData = data.map(d => ({
      ...d,
      date: d3.timeParse('%Y-%m-%d')(d.date)
    }));

    // Get today's date and calculate the date 30 days ago
    const today = new Date();
    const thirtyDaysAgo = d3.timeDay.offset(today, -30);

    // Create complete date range for the last 30 days
    const dateRange = d3.timeDay.range(thirtyDaysAgo, d3.timeDay.offset(today, 1));
    
    // Create data structure with all dates, filling missing dates with 0 counts
    const completeData = dateRange.map(date => {
      const dateStr = d3.timeFormat('%Y-%m-%d')(date);
      const existing = parsedData.find(d => d3.timeFormat('%Y-%m-%d')(d.date) === dateStr);
      
      return {
        date: date,
        dateStr: dateStr,
        morningCount: existing ? existing.morningCount : 0,
        eveningCount: existing ? existing.eveningCount : 0,
        day: existing ? existing.day : '',
        totalExercises: existing ? existing.totalExercises : 0
      };
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear the SVG before redrawing

    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 20, right: 20, bottom: 60, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Scales
    const x = d3.scaleBand()
      .domain(completeData.map(d => d.dateStr))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, 2])
      .range([height, 0]);

    // Color scale for morning/evening
    const colorScale = {
      morning: '#ff7300',
      evening: '#8884d8'
    };

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(x.domain().filter((d, i) => i % Math.ceil(x.domain().length / 10) === 0))
        .tickFormat(d => {
          const date = d3.timeParse('%Y-%m-%d')(d);
          return date.getDate() === 1 ? d3.timeFormat('%b %d')(date) : d3.timeFormat('%m/%d')(date);
        }))
      .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('fill', '#0097A7')
        .style('font-size', '10px');

    // Y-axis
    g.append('g')
      .call(d3.axisLeft(y)
        .tickValues([0, 1, 2]))
      .selectAll('text')
        .attr('fill', '#0097A7');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .ticks(3)
        .tickSize(-width)
        .tickFormat(''))
      .selectAll('line')
        .attr('stroke', '#0097A7')
        .attr('stroke-opacity', 0.1);

    // Create bars for each day
    const bars = g.selectAll('.day-group')
      .data(completeData)
      .enter()
      .append('g')
      .attr('class', 'day-group')
      .attr('transform', d => `translate(${x(d.dateStr)},0)`);

    // Morning bars (bottom stack)
    bars.append('rect')
      .attr('class', 'morning-bar')
      .attr('x', 0)
      .attr('y', d => y(d.morningCount))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.morningCount))
      .attr('fill', colorScale.morning)
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Evening bars (top stack)
    bars.append('rect')
      .attr('class', 'evening-bar')
      .attr('x', 0)
      .attr('y', d => y(d.morningCount + d.eveningCount))
      .attr('width', x.bandwidth())
      .attr('height', d => d.eveningCount > 0 ? y(d.morningCount) - y(d.morningCount + d.eveningCount) : 0)
      .attr('fill', colorScale.evening)
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Add tooltips
    bars.on('mouseover', function(event, d) {
      if (d.morningCount > 0 || d.eveningCount > 0) {
        const tooltip = d3.select('#workout-tooltip');
        const total = d.morningCount + d.eveningCount;
        let content = `Date: ${d3.timeFormat('%m/%d/%Y')(d.date)}<br>`;
        content += `Day ${d.day}<br>`;
        content += `Total Workouts: ${total}<br>`;
        if (d.morningCount > 0) content += `Morning: ${d.morningCount}<br>`;
        if (d.eveningCount > 0) content += `Evening: ${d.eveningCount}<br>`;
        content += `Exercises: ${d.totalExercises}`;
        
        tooltip
          .style('display', 'block')
          .html(content)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY + 5}px`);
      }
    })
    .on('mousemove', function(event) {
      const tooltip = d3.select('#workout-tooltip');
      tooltip
        .style('left', `${event.pageX + 5}px`)
        .style('top', `${event.pageY + 5}px`);
    })
    .on('mouseout', function() {
      d3.select('#workout-tooltip').style('display', 'none');
    });

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(0, ${height + 55})`);

    const legendItems = [
      { key: 'morning', label: 'Morning Workouts', color: colorScale.morning },
      { key: 'evening', label: 'Evening Workouts', color: colorScale.evening }
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(${i * 150}, 0)`);

      legendItem.append('rect')
        .attr('x', 0)
        .attr('y', -6)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', item.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1);

      legendItem.append('text')
        .attr('x', 18)
        .attr('y', 4)
        .style('font-size', '12px')
        .style('fill', '#0097A7')
        .text(item.label);
    });

  }, [data]);

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${svgRef.current?.clientWidth || 730} ${200}`} />
    </div>
  );
};

export default WorkoutTrendChart; 