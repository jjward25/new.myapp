"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const UpperTrend = () => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null); // Attach the ref to the container

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/workouts");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0 && svgRef.current) {
      drawChart(data);
    }
  }, [data]);

  const drawChart = (data) => {
    // Filter for Upper Compound workouts and prepare data for chart
    const filteredData = data
    .filter(workout => workout.Workout === "Upper Compounds") // Filter only the workout
    .flatMap(workout => {
        return Object.entries(workout.Exercises).flatMap(([exerciseName, exerciseData]) => {
        // Allow exercises where Starting Max is 0 as well
        const startingMax = exerciseData["Starting Max"] !== undefined ? exerciseData["Starting Max"] : null;
        return workout.Date && startingMax !== null
            ? [{ date: workout.Date, exercise: exerciseName, startingMax }]  // Ensure 0 values are kept
            : [];
        });
    });

  
    // Ensure svgRef.current is available and get its width
    const containerWidth = svgRef.current ? svgRef.current.clientWidth : 800; // Fallback width if ref is null
    const margin = { top: 20, right: 30, bottom: 10, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
  
    // Clear previous chart
    d3.select(svgRef.current).select("svg").remove();
  
    // Create SVG container
    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 60) // Extra height for the legend
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Parse the date
    const parseDate = d3.timeParse("%Y-%m-%d");
  
    // Set scales, ensuring "Dips" with `0` max is handled properly
    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => parseDate(d.date)))
      .range([0, width]);
  
      const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.startingMax)])  // Ensure min is 0
      .range([height, 0]);
    
  
    // Add axes
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")))
      .selectAll("text")
      .style("fill", "#6c757d")
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "12px");
  
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(6))
      .selectAll("text")
      .style("fill", "#6c757d")
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "12px");
  
    // Remove the top line of the y-axis (if visible)
    svg.select(".y-axis .domain").remove();
  
    // Add gridlines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#e5e5e5")
      .style("opacity", 0.7);
  
    svg.selectAll(".grid line")
      .filter((d, i, nodes) => +d === y.domain()[1])
      .remove();
  
    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeSet2);
  
    const exercises = Array.from(new Set(filteredData.map(d => d.exercise)));
  
    const tooltip = d3.select(svgRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#f8f9fa")
      .style("border-radius", "5px")
      .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.1)")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none");
  
    exercises.forEach(exercise => {
      const exerciseData = filteredData.filter(d => d.exercise === exercise);
      
      const line = d3.line()
        .x(d => x(parseDate(d.date)))
        .y(d => y(d.startingMax));
  
      svg.append("path")
        .datum(exerciseData)
        .attr("fill", "none")
        .attr("stroke", colorScale(exercise))
        .attr("stroke-width", 2)
        .attr("d", line);
  
      svg.selectAll(`.dot-${exercise}`)
        .data(exerciseData)
        .enter()
        .append("circle")
        .attr("class", `dot dot-${exercise}`)
        .attr("cx", d => x(parseDate(d.date)))
        .attr("cy", d => y(d.startingMax))
        .attr("r", 5)
        .attr("fill", colorScale(exercise))
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          const tooltipWidth = 100;
          const tooltipHeight = 40;
          const chartRect = svgRef.current.getBoundingClientRect();
          const mouseX = event.clientX - chartRect.left;
          const mouseY = event.clientY - chartRect.top;
          const adjustedX = Math.min(mouseX + 10, chartRect.width - tooltipWidth);
          const adjustedY = Math.max(mouseY - tooltipHeight, 0);
          tooltip.html(`<strong>${d.exercise}</strong>: ${d.startingMax}`)
            .style("left", `${adjustedX}px`)
            .style("top", `${adjustedY}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(300).style("opacity", 0);
        });
    });
  
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(0, ${height + 40})`);
  
    const legendItemWidth = 125;
    const availableWidth = containerWidth - margin.left - margin.right;
    const legendColumns = Math.floor(availableWidth / legendItemWidth);
  
    exercises.forEach((exercise, i) => {
      const row = Math.floor(i / legendColumns);
      const col = i % legendColumns;
      
      legend.append("rect")
        .attr("x", col * legendItemWidth)
        .attr("y", row * 25)
        .attr("width", 120)
        .attr("height", 18)
        .style("fill", colorScale(exercise));
  
      legend.append("text")
        .attr("x", col * legendItemWidth + 8)
        .attr("y", row * 25 + 14)
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "12px")
        .style('font-weight', 'bold')
        .style("fill", "#495057")
        .text(exercise);
    });
  };
  

  return <div id="upper-trend-chart" ref={svgRef}></div>; // Attach ref to the container div
};

export default UpperTrend;
