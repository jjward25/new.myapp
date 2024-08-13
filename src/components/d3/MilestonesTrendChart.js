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

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear the SVG before redrawing

    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 20, right: 20, bottom: 25, left: 40 }; // Adjusted margins
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom; // Adjusted height for better view

    const x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([0, width]); // Ensure x range starts at 0 and ends at width

    const y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.completed)]).nice()
      .range([height, 0]); // Ensure y range starts at height and ends at 0

    const xAxis = g => g
      .attr('transform', `translate(${margin.left},${height + margin.top})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickFormat(d3.timeFormat('%m-%d-%y')).tickSizeOuter(0))
      .call(g => g.selectAll('.tick line').attr('stroke', 'fuchsia'))
      .call(g => g.selectAll('.tick text').attr('fill', 'cyan'))
      .call(g => g.select('.domain').attr('stroke', 'fuchsia'));

    const yAxis = g => g
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(y).ticks(d3.max(parsedData, d => d.completed)).tickFormat(d3.format('d')))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'fuchsia').clone()
        .attr('x2', width)
        .attr('stroke-opacity', 0.1))
      .call(g => g.selectAll('.tick text').attr('fill', 'fuchsia'));

    svg.append('g')
      .attr('fill', 'cyan')
      .selectAll('circle')
      .data(parsedData)
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