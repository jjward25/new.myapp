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
    const fields = ["Workout", "Creative", "Skill Dev", "Job Search", "Social Activities"];

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
          case "Skill Dev":
            entry[field] = {
              value: d[field], // true/false value
              description: d["Skill Desc"] || "No description", // Corresponding description
            };
            break;
          case "Job Search":
            entry[field] = {
              value: d[field], // true/false value
              description: d["Job Search Desc"] || "No description", // Corresponding description
            };
            break;
          case "Social Activities":
            entry[field] = {
              value: d[field], // true/false value
              description: d["Social Desc"] || "No description", // Corresponding description
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

    const fields = ["Workout", "Creative", "Skill Dev", "Job Search", "Social Activities"];
    const containerWidth = svgRef.current.clientWidth;
    const margin = { top: 10, right: 15, bottom: 50, left: 30 };
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
      .range(["#c7522a", "#e5c185", "#fbf2c4", "#74a892", "#008585"]); // Cyan, Fuchsia/purple, amber, teal, 

      //.range(["#121b3b", "#c05bb6", "#1a65bc", "#0fb2eb", "#f0d6ec"]); // Cyan, Fuchsia/purple, amber, teal, 

      //.range(["#00ACC1", "#9370Db", "#ffb300", "#008080", "white"]); // Cyan, Fuchsia/purple, amber, teal, 


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

        tooltip
          .style("opacity", 1)
          .html(fieldData.description) // Show the description
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
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
          .tickFormat((d) => d3.timeFormat("%b %d")(new Date(d)))
      )
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"))
      .call((g) => g.selectAll(".tick text").attr("fill", "white"))
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

    legend
      .selectAll(".legend-item")
      .data(fields)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(${i * 80}, 0)`)
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
