import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MilestoneTrendChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    console.log('Data received by MilestoneTrendChart:', data);

    if (!data || data.length === 0) return;

    // Parse the date and set it to midnight local time
    const parsedData = data.map(d => ({
      ...d,
      date: d3.timeParse('%Y-%m-%d')(d.date.toISOString().split('T')[0])
    }));

    // Get today's date and calculate the date 30 days ago
    const today = new Date();
    const thirtyDaysAgo = d3.timeDay.offset(today, -30);

    // Filter the data to include only the last 30 days
    const filteredData = parsedData.filter(d => d.date >= thirtyDaysAgo && d.date <= today);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear the SVG before redrawing

    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 }; // Adjusted margins
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom; // Adjusted height for better view

    const x = d3.scaleTime()
      .domain([thirtyDaysAgo, today]) // Set domain from 30 days ago to today
      .range([0, width]); // Ensure x range starts at 0 and ends at width

    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.completed)]).nice()
      .range([height, 0]); // Ensure y range starts at height and ends at 0

    const xAxis = g => g
      .attr('transform', `translate(${margin.left},${height + margin.top})`)
      .call(d3.axisBottom(x).ticks(width / 80)
        .tickFormat(d => d.getDate() === 1 ? d3.timeFormat('%b')(d) : d3.timeFormat('%d')(d)) // Show month name for 1st, otherwise day
        .tickSizeOuter(0))
      .call(g => g.selectAll('.tick line').attr('stroke', '#0097A7'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'cyan')
        .attr('transform', 'rotate(-45)') // Rotate labels by 45 degrees
        .style('text-anchor', 'end') // Align text to the end for better visibility
      )
      .call(g => g.select('.domain').attr('stroke', '#0097A7'));

    const yAxis = g => g
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y).ticks(d3.max(filteredData, d => d.completed)).tickFormat(d3.format('d')))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#0097A7').clone()
        .attr('x2', width)
        .attr('stroke-opacity', 0.1))
      .call(g => g.selectAll('.tick text').attr('fill', '#0097A7'));

    svg.append('g')
      .attr('fill', 'cyan')
      .selectAll('circle')
      .data(filteredData)
      .join('circle')
        .attr('cx', d => x(d.date) + margin.left)
        .attr('cy', d => y(d.completed) + margin.top)
        .attr('r', 3);

    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
  }, [data]);

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${svgRef.current?.clientWidth || 730} ${200}`} />
    </div>
  );
};

export default MilestoneTrendChart;
