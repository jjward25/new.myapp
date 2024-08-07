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

    const width = 350;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 20 };

    const x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.completed)]).nice()
      .range([height - margin.bottom, margin.top]);

    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickFormat(d3.timeFormat('%m-%d-%y')).tickSizeOuter(0))
      .call(g => g.selectAll('.tick line').attr('stroke', 'fuchsia'))
      .call(g => g.selectAll('.tick text').attr('fill', 'cyan'))
      .call(g => g.select('.domain').attr('stroke', 'fuchsia'));

    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(d3.max(parsedData, d => d.completed)).tickFormat(d3.format('d')))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'fuchsia').clone()
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1))
      .call(g => g.selectAll('.tick text').attr('fill', 'fuchsia'));

    svg.append('g')
      .attr('fill', 'cyan')
      .selectAll('circle')
      .data(parsedData)
      .join('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.completed))
        .attr('r', 3);

    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
  }, [data]);

  return (
    <svg ref={svgRef} width="350" height="200"></svg>
  );
};

export default MilestoneTrendChart;
