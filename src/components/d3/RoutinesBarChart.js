"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TrueValuesBarChart = () => {
  const [data, setData] = useState([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/routines/');
        const result = await response.json();
        processAndSetData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const processAndSetData = (data) => {
  const fields = ["Workout", "Prof Dev", "Project Work", "Spanish", "Piano"];
  
  // Parse date strings and group by Date in EST timezone
  const groupedData = d3.rollup(
    data,
    v => fields.reduce((acc, field) => {
      acc[field] = v.filter(d => d[field] === true).length;
      return acc;
    }, {}),
    d => {
      const date = new Date(d.Date);
      const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      return estDate;
    }
  );

  // Transform groupedData into an array of objects for stacking
  let processedData = Array.from(groupedData, ([Date, values]) => ({
    Date,
    ...values
  }));

  // Sort processedData by Date in ascending order
  processedData.sort((a, b) => a.Date - b.Date);

  setData(processedData);
};

  

  const svgRef = useRef(null);

  // Draw chart
  useEffect(() => {
    if (data.length === 0) return;

    const fields = ["Workout", "Prof Dev", "Project Work", "Spanish", "Piano"];
    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 10, right: 15, bottom: 50, left: 30 }; // Increased bottom margin for legend
    const width = containerWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    const svg = d3.select('#barchart')
      .attr('width', containerWidth)
      .attr('height', 150) // Fixed height for SVG
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create a stack layout
    const stack = d3.stack().keys(fields).order(d3.stackOrderNone);
    const stackedData = stack(data);

    const x = d3.scaleBand()
      .domain(data.map(d => d.Date))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
      .nice()
      .range([height, 0]);

    // Define color scale
    const color = d3.scaleOrdinal()
      .domain(fields)
      .range(d3.schemeSet2); // Use a D3 color scheme for modern colors

    // Add bars
    svg.selectAll('.layer')
      .data(stackedData)
      .enter().append('g')
      .attr('class', 'layer')
      .attr('fill', d => color(d.key))
      .selectAll('rect')
      .data(d => d)
      .enter().append('rect')
      .attr('x', d => x(d.data.Date))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .attr('stroke', 'white') // Add stroke for better separation
      .attr('stroke-width', 0.5); // Thin stroke width for a clean look

    // Add X-axis
svg.append('g')
.attr('class', 'x-axis')
.attr('transform', `translate(0,${height})`)
.call(d3.axisBottom(x)
  .tickFormat(d => {
    const newDate = new Date(d); // Create a new date object
    newDate.setDate(newDate.getDate() + 1); // Add 1 day
    return d3.timeFormat("%b %d")(newDate); // Format the new date
  }))
.call(g => g.selectAll('.tick line').attr('stroke', '#ddd'))
.call(g => g.selectAll('.tick text').attr('fill', 'white'))
.call(g => g.select('.domain').attr('stroke', '#ddd'));

// Add Y-axis
const yAxis = d3.axisLeft(y)
  .tickValues(d3.range(0, Math.ceil(y.domain()[1]) + 1)) // Generate tick values from 0 to max Y value
  .tickFormat(d => d); // Ensure tick values are formatted as integers


    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#ddd'))
      .call(g => g.selectAll('.tick text').attr('fill', 'white'));

    // Add legend
    const legend = d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${150 - margin.bottom +30})`);

    legend.selectAll('.legend-item')
      .data(fields)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 80}, 0)`) // Adjust spacing as needed
      .each(function(d) {
        const item = d3.select(this);

        item.append('rect')
          .attr('x', 0)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', color(d))
          .attr('stroke', 'white') // Add stroke for better visibility
          .attr('stroke-width', 1); // Thin stroke width for a clean look

        item.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .style('font-size', '8px')
          .style('fill',"white")
          .text(d);
      });

  }, [data]);

  return (
    <div style={{ overflowX: 'none', padding: '10px 10px', maxWidth: '100%' }}>
      <svg id='barchart' ref={svgRef} width="100%" height="100%" style={{ maxWidth: '100%' }}></svg>
    </div>
  );
};

export default TrueValuesBarChart;
