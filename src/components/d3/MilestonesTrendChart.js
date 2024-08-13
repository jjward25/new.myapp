"use client"
import React, { useEffect, useState } from 'react';
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

  // Process data
  const processAndSetData = (data) => {
    const fields = ["Workout", "Prof Dev", "Project Work", "Spanish", "Piano"];

    // Group by Date and count true values for each field
    const groupedData = d3.rollup(
      data,
      v => fields.reduce((acc, field) => {
        acc[field] = v.filter(d => d[field] === true).length;
        return acc;
      }, {}),
      d => d.Date
    );

    // Transform groupedData into an array of objects for stacking
    const processedData = Array.from(groupedData, ([Date, values]) => ({
      Date,
      ...values
    }));

    setData(processedData);
  };

  // Draw chart
  useEffect(() => {
    if (data.length === 0) return;

    const fields = ["Workout", "Prof Dev", "Project Work", "Spanish", "Piano"];
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }; // Adjusted margins
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom; // Adjusted height for better view

    const svg = d3.select('#barchart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
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
      .range(['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1']); // Updated color scheme

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
      .attr('width', x.bandwidth());

    // Add X-axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => d))
      .call(g => g.selectAll('.tick line').attr('stroke', '#f7cac9'))
      .call(g => g.selectAll('.tick text').attr('fill', '#92a8d1'))
      .call(g => g.select('.domain').attr('stroke', '#f7cac9'));

    // Add Y-axis
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#f7cac9').clone()
        .attr('x2', width)
        .attr('stroke-opacity', 0.1))
      .call(g => g.selectAll('.tick text').attr('fill', '#f7cac9'));

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 30}, 0)`);

    legend.selectAll('.legend-item')
      .data(fields)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .each(function(d) {
        const item = d3.select(this);

        item.append('rect')
          .attr('x', 0)
          .attr('width', 20)
          .attr('height', 20)
          .attr('fill', color(d));

        item.append('text')
          .attr('x', 30)
          .attr('y', 15)
          .text(d);
      });

  }, [data]);

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <svg id="barchart" />
    </div>
  );
};

export default TrueValuesBarChart;
