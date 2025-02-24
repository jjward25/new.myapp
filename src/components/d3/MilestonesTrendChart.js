import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const MilestoneTrendChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    //console.log('Data received by MilestoneTrendChart:', data);

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
    const margin = { top: 20, right: 20, bottom: 60, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Create a color scale based on project names
    const colorScale = d3.scaleOrdinal()
      .domain([...new Set(filteredData.map(d => d.projectName))]) // Unique project names
      .range(d3.schemeCategory10); // Use a D3 color scheme

    const x = d3.scaleTime()
      .domain([thirtyDaysAgo, today])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.completed)]).nice()
      .range([height, 0]);

    const xAxis = g => g
      .attr('transform', `translate(${margin.left},${height + margin.top})`)
      .call(d3.axisBottom(x).ticks(width / 80)
        .tickFormat(d => d.getDate() === 1 ? d3.timeFormat('%b')(d) : d3.timeFormat('%d')(d))
        .tickSizeOuter(0))
      .call(g => g.selectAll('.tick line').attr('stroke', '#0097A7'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'black')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end'))
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
      .selectAll('circle')
      .data(filteredData)
      .join('circle')
        .attr('cx', d => x(d.date) + margin.left)
        .attr('cy', d => y(d.completed) + margin.top)
        .attr('r', 3)
        .attr('fill', d => colorScale(d.projectName))
        .on('mouseover', function(event, d) {
          const tooltip = d3.select('#tooltip');
          tooltip
            .style('display', 'block')
            .html(`Project: ${d.projectName}<br>Milestone: ${d.name}`)
            .style('left', `${event.pageX + 5}px`) // Adjust tooltip position
            .style('top', `${event.pageY + 5}px`); // Adjust tooltip position
        })
        .on('mousemove', function(event) {
          const tooltip = d3.select('#tooltip');
          tooltip
            .style('left', `${event.pageX + 5}px`)
            .style('top', `${event.pageY + 5}px`);
        })
        .on('mouseout', function() {
          d3.select('#tooltip').style('display', 'none'); // Hide tooltip
        });

    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${height + margin.top + 40})`);

    const legendItemWidth = 140;
    const legendItemHeight = 15;
    const legendPadding = 10; // Space between legend items

    let legendX = 0;
    let legendY = 0;

    const uniqueProjectNames = [...new Set(filteredData.map(d => d.projectName))];

    const legendItems = legend.selectAll('.legend-item')
      .data(uniqueProjectNames)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', function (d, i) {
        // Check if the current item exceeds the width
        if (legendX + legendItemWidth > width) {
          legendX = 0; // Reset to start of new line
          legendY += legendItemHeight + legendPadding; // Move down for new line
        }
        
        const transform = `translate(${legendX}, ${legendY})`;
        legendX += legendItemWidth + legendPadding; // Move x position for next item
        return transform;
      })
      .each(function (d) {
        const item = d3.select(this);
        item.append('rect')
          .attr('x', 0)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', colorScale(d))
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
        item.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .style('font-size', '10px')
          .style('fill', '#0097A7') // Change color to match your chart theme
          .text(d);
      });

  }, [data]);

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${svgRef.current?.clientWidth || 730} ${200}`} />
    </div>
  );
};

export default MilestoneTrendChart;
