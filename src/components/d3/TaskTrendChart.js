"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const TaskBarChart = () => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/backlog/");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const tasks = await response.json();
        const processedData = processData(tasks);
        setData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const processData = (tasks) => {
    const tasksByDate = {};
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      tasksByDate[dateStr] = {
        date: dateStr,
        completed: 0,
        incomplete: 0
      };
    }

    tasks.forEach(task => {
      const dueDate = task["Due Date"];
      if (!dueDate || !tasksByDate[dueDate]) return;
      
      if (task["Complete Date"]) {
        tasksByDate[dueDate].completed++;
      } else {
        tasksByDate[dueDate].incomplete++;
      }
    });

    const result = Object.entries(tasksByDate)
      .map(([date, data]) => ({
        date,
        completed: data.completed || 0,
        incomplete: data.incomplete || 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  };

  useEffect(() => {
    if (!data.length) return;

    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 10, right: 15, bottom: 60, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    // Calculate dynamic bar width based on available space
    const minSpaceBetweenBars = 2; // Minimum spacing between bars
    const maxBarWidth = 20; // Maximum width for any bar
    const numBars = data.length;
    
    // Calculate the width taking spacing into account
    const calculatedBarWidth = (width / numBars) - minSpaceBetweenBars;
    // Use the smaller of calculated width or max width
    const barWidth = Math.min(calculatedBarWidth, maxBarWidth);

    d3.select("#taskbarchart").selectAll("*").remove();

    const svg = d3
      .select("#taskbarchart")
      .attr("width", containerWidth)
      .attr("height", 150)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("opacity", 0);

    const normalizedData = data.map(d => ({
      date: typeof d.date === 'string' ? d.date : d.date.toISOString().split('T')[0],
      completed: d.completed || 0,
      incomplete: d.incomplete || 0
    }));

    const x = d3.scaleBand()
      .domain(normalizedData.map(d => d.date))
      .range([0, width])
      .padding(0.3); // Adjust padding based on bar width

    const y = d3.scaleLinear()
      .domain([0, Math.ceil(d3.max(data, d => d.completed + d.incomplete))])
      .range([height, 0])
      .nice();

    const stack = d3.stack()
      .keys(["incomplete", "completed"])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(normalizedData);

    const color = d3.scaleOrdinal()
      .domain(["incomplete", "completed"])
      .range(["#7f694b", "#74a892"]);

    svg.selectAll("g.stack")
      .data(stackedData)
      .join("g")
      .attr("class", "stack")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.date) + (x.bandwidth() - barWidth) / 2) // Center the bar in its band
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", barWidth)
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        const completed = d.data.completed;
        const incomplete = d.data.incomplete;
        const total = completed + incomplete;
        const date = d.data.date;
        
        tooltip
          .style("opacity", 1)
          .html(`${date}<br>Completed: ${completed}<br>Incomplete: ${incomplete}<br>Total: ${total}`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px")
          .style("font-size", "10px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });

    const xAxis = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') {
          return '';
        }
        
        const [year, month, day] = dateStr.split('-');
        return day === '01' ? d3.timeFormat("%b")(new Date(year, month - 1, 1)) : day;
      }));

    xAxis.selectAll(".tick text")
      .attr("fill", "white")
      .style("font-size", "10px")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end");

    const yAxis = svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d")));

    yAxis.selectAll(".tick text")
      .attr("fill", "white")
      .style("font-size", "10px");
    yAxis.select(".domain").attr("stroke", "white");

    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, -5)`);

    ["Completed", "Incomplete"].forEach((text, i) => {
      const g = legend.append("g")
        .attr("transform", `translate(0, ${i * 15})`);

      g.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(text.toLowerCase()));

      g.append("text")
        .attr("x", 15)
        .attr("y", 9)
        .attr("fill", "white")
        .style("font-size", "10px")
        .text(text);
    });

  }, [data]);

  return (
    <div style={{ overflowX: "none", padding: "10px 10px", maxWidth: "100%" }}>
      <svg id="taskbarchart" ref={svgRef} width="100%" height="100%" style={{ maxWidth: "100%" }}></svg>
    </div>
  );
};

export default TaskBarChart;