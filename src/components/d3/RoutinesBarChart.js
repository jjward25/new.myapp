"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";

const TrueValuesBarChart = () => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/routines/");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();

        const processedData = processData(result);
        setData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const processData = (data) => {
    const fields = ["6am Wakeup","Done by 730","Job Search", "Mobility", "Reading", "Workout", "Piano", "Language", "Call", "Events", "Tasks"];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  
    return data
      .map((d) => {
        const parsedDate = d3.timeParse("%Y-%m-%d")(d.Date);
        const entry = { Date: parsedDate };
  
        fields.forEach((field) => {
          let description = d[field + " Desc"]; // Default to the description from the data if available
  
          // If the description is missing, provide a unique fallback for each field
          switch (field) {
            case "6am Wakeup":
              description =  "6am Wakeup.";
              break;
            case "Done by 730":
              description =  "Good start.";
              break;
            case "Job Search":
              description =  "Job search activities.";
              break;
            case "Mobility":
              description =  "Mobility work.";
              break;
            case "Reading":
              description =  d["Reading Desc"] || "Daily reading.";
              break;
            case "Workout":
              description =  "Workout";
              break;
            case "Piano":
              description = "Piano practice.";
              break;
            case "Language":
              description =  "Language practice.";
              break;
            case "Call":
              description =  d["Call Name"] || "Phone call.";
              break;
            case "Events":
              description = d["Events Desc"] || "Events.";
              break;
            case "Tasks":
              description =  "Tasks";
              break;
            default:
              description = "No description available."; // Fallback for any unexpected fields
          }
  
          entry[field] = {
            value: d[field],
            description: description,
          };
        });
  
        return entry;
      })
      .filter((d) => d.Date instanceof Date && !isNaN(d.Date) && d.Date >= cutoffDate)
      .sort((a, b) => a.Date - b.Date);
  };
  

  const stackedData = useMemo(() => {
    if (data.length === 0) return [];
    const fields = ["6am Wakeup","Done by 730","Job Search", "Mobility", "Reading", "Workout", "Piano", "Language", "Call", "Events", "Tasks"];
    const stack = d3.stack().keys(fields).value((d, key) => (d[key].value ? 1 : 0));
    return stack(data);
  }, [data]);

  useEffect(() => {
    if (stackedData.length === 0) return;

    const fields = ["6am Wakeup","Done by 730","Job Search", "Mobility", "Reading", "Workout", "Piano", "Language", "Call", "Events", "Tasks"];
    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = svgRef.current.clientHeight;
    const margin = { top: 10, right: 15, bottom: 120, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    d3.select("#barchart").selectAll("*").remove();

    const svg = d3
      .select("#barchart")
      .attr("width", containerWidth)
      .attr("height", 200)
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

    const x = d3.scaleBand()
      .domain(data.map(d => d3.timeFormat("%Y-%m-%d")(d.Date))) // Use formatted date strings for x-axis labels
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], (d) => d[1])])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(fields)
      .range([
        "#E74C3C", // 6am Wakeup
        "#C0392B ", //Done by 730
        "#4A90E2", // Mobility (blue)
        "#5DADE2", // Workout (blue)
        "#8E44AD", // Language (purple)
        "#9B59B6", // Piano (purple)
        "#AF7AC5", // Reading (purple)
        "#E67E22", // Job Search (orange)
        "#F39C12", // Tasks (amber)
        "#27AE60", // Events (green)
        "#2ECC71"  // Call (green)
      ]);

    svg
      .selectAll(".layer")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("class", "layer")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d3.timeFormat("%Y-%m-%d")(d.data.Date))) // Use formatted date string for x position
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        const field = d3.select(this.parentNode).datum().key; // Get the current field name
        const fieldData = d.data[field]; // Access the value and description for the field
        const fullDate = d3.timeFormat("%B %d, %Y")(d.data.Date); // Format the date
        tooltip
          .style("opacity", 1)
          .html(`${fullDate}: ${fieldData.description}`) // Show formatted date and description
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px")
          .style("font-size", "10px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    const xAxis = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => {
        const date = d3.timeParse("%Y-%m-%d")(d); // Parse the string back to a Date object
        return date.getDate() === 1 ? d3.timeFormat("%b")(date) : d3.timeFormat("%d")(date); // Show month if first day, else day
      }));

    xAxis.selectAll(".tick text").attr("fill", "white");
    xAxis.select(".domain").attr("stroke", "white");

    const yAxis = svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickValues(d3.range(0, Math.ceil(y.domain()[1]) + 1)).tickFormat((d) => d));

    yAxis.selectAll(".tick text").attr("fill", "white");
    yAxis.select(".domain").attr("stroke", "white");

    // Legend
    const legend = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${200 - margin.bottom + 80})`);

    const legendItemWidth = 80;
    const legendItemHeight = 15;

    let legendX = 0;
    let legendY = 0;

    legend
      .selectAll(".legend-item")
      .data(fields)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", function (d, i) {
        if (legendX + legendItemWidth > width) {
          legendX = 0;
          legendY += legendItemHeight;
        }
        const transform = `translate(${legendX}, ${legendY})`;
        legendX += legendItemWidth;
        return transform;
      })
      .each(function (d) {
        const item = d3.select(this);
        item.append("rect")
          .attr("x", 0)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color(d))
          .attr("stroke", "white")
          .attr("stroke-width", 1);
        item.append("text")
          .attr("x", 20)
          .attr("y", 10)
          .style("font-size", "8px")
          .style("fill", "white")
          .text(d);
      });
  }, [stackedData,data]);

  return (
    <div style={{ overflowX: "none", padding: "10px 10px", maxWidth: "100%" }}>
      <svg id="barchart" ref={svgRef} width="100%" height="100%" style={{ maxWidth: "100%" }}></svg>
    </div>
  );
};

export default TrueValuesBarChart;
