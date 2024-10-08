"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const TrueValuesBarChart = () => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/routines/");
        const result = await response.json();
        processAndSetData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const processAndSetData = (data) => {
    const fields = ["Job Search","Learning","Prof Dev","Workout","Creative","Language","Call","Events","PersonalPrj"];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    // Process the data to include descriptions and values
    const processedData = data.map((d) => {
      const entry = { Date: new Date(d.Date) };

      fields.forEach((field) => {
        switch (field) {
          case "Workout":
            entry[field] = {
              value: d[field], // true/false value
              description: "No description", // No description for Workout
            };
            break;
          case "Creative":
            entry[field] = {
              value: d[field], // true/false value
              description: d["Creative Desc"] || "No description", // Corresponding description
            };
            break;
          case "Language":
            entry[field] = {
              value: d[field], // true/false value
              description: "No description", // Corresponding description
            };
            break;
          case "Learning":
              entry[field] = {
                value: d[field], // true/false value
                description: d["LearningAndDev Desc"] || "No description", // Corresponding description
              };
              break;
          case "Prof Dev":
            entry[field] = {
              value: d[field], // true/false value
              description: d["LearningAndDev Desc"] || "No description", // Corresponding description
            };
            break;
          case "Job Search":
            entry[field] = {
              value: d[field], // true/false value
              description: "No description", // Corresponding description
            };
            break;
          case "Event":
            entry[field] = {
              value: d[field], // true/false value
              description: d["Events Desc"] || "No description", // Corresponding description
            };
            break;
          case "Call":
            entry[field] = {
              value: d[field], // true/false value
              description: d["Call Name"] || "No description", // Corresponding description
            };
            break;
          case "PersonalPrj":
            entry[field] = {
              value: d[field], // true/false value
              description: "No description", // Corresponding description
            };
            break;
          default:
            entry[field] = {
              value: d[field],
              description: "No description", // Default case
            };
        }
      });      

      return entry;
    }).filter(d => d.Date >= cutoffDate);

    processedData.sort((a, b) => a.Date - b.Date);

    setData(processedData);
  };

  useEffect(() => {
    if (data.length === 0) return;

    const fields = ["Job Search","Learning","Prof Dev","Workout","Creative","Language","Call","Events","PersonalPrj"];
    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 10, right: 15, bottom: 60, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    // Clear any previous content inside the svg
    d3.select("#barchart").selectAll("*").remove();

    const svg = d3
      .select("#barchart")
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

    const stack = d3.stack()
      .keys(fields)
      .value((d, key) => d[key].value === true ? 1 : 0) // Use value (true/false)
      .order(d3.stackOrderNone);

    const stackedData = stack(data);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.Date))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], (d) => d[1])])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(fields)
      .range([
        // Job Search
        "#74a892", // Soft green
        // Learning
        "#8e44ad", // Violet
        // Prof Dev 
        "#f8e1a6", // Light yellow
        // Workout
        "#f57f20", // Bright orange
        //Creative
        "#4c3b4d", // Dark purple
        //Language
        "#c7522a", // Deep orange
        // Call
        "#007b5f", // Rich teal
        // Events
        "#6a98c1",  // Muted blue
        //Personal Prj
        "#e5c185", // Beige
        
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
      .attr("x", (d) => x(d.data.Date))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        const field = d3.select(this.parentNode).datum().key; // Get the current field name (e.g., Creative)
        const fieldData = d.data[field]; // Access the value and description for the field
        const fullDate = d3.timeFormat('%b %d, %Y')(d.data.Date); // Format the date as YY-MM-DD
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

      svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) => {
            const date = new Date(d);
            // Display the month name on the first of each month
            return date.getDate() === 1 ? d3.timeFormat("%b")(date) : d3.timeFormat("%d")(date);
          })
      )
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"))
      .call((g) => g.selectAll(".tick text")
        .attr("fill", "white")
        .style("text-anchor", "end")   // Tilt text at an angle
        .attr("transform", "rotate(-45)")  // Apply a 45-degree tilt
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em"))
      .call((g) => g.select(".domain").attr("stroke", "#ddd"));
    

    const yAxis = d3
      .axisLeft(y)
      .tickValues(d3.range(0, Math.ceil(y.domain()[1]) + 1))
      .tickFormat((d) => d);

    svg
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"))
      .call((g) => g.selectAll(".tick text").attr("fill", "white"));

      const legend = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${150 - margin.bottom + 30})`);

    const legendItemWidth = 80; // Approximate width of each legend item
    const legendItemHeight = 15; // Height between each row of legend items

    let legendX = 0;
    let legendY = 0;

    legend
      .selectAll(".legend-item")
      .data(fields)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", function (d, i) {
        // Calculate x position (wrap around if exceeds width)
        if (legendX + legendItemWidth > width) {
          legendX = 0; // Reset x position
          legendY += legendItemHeight; // Move to next row
        }
        const transform = `translate(${legendX}, ${legendY})`;
        legendX += legendItemWidth; // Increment x for the next item
        return transform;
      })
      .each(function (d) {
        const item = d3.select(this);

        item
          .append("rect")
          .attr("x", 0)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color(d))
          .attr("stroke", "white")
          .attr("stroke-width", 1);

        item
          .append("text")
          .attr("x", 20)
          .attr("y", 10)
          .style("font-size", "8px")
          .style("fill", "white")
          .text(d);
      });

  }, [data]);

  return (
    <div style={{ overflowX: "none", padding: "10px 10px", maxWidth: "100%" }}>
      <svg id="barchart" ref={svgRef} width="100%" height="100%" style={{ maxWidth: "100%" }}></svg>
    </div>
  );
};

export default TrueValuesBarChart;
