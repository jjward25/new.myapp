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
    const mainFields = ["Morning Exercise", "Evening Exercise", "Applications", "Fresh Air"];
    const bonusFields = ["Language", "Piano", "Reading", "Writing", "Social", "Cook/Meal Prep", "Coding", "Prof Dev"];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  
    return data
      .map((d) => {
        const parsedDate = d3.timeParse("%Y-%m-%d")(d.Date);
        const entry = { Date: parsedDate };
  
        // Process main fields
        mainFields.forEach((field) => {
          let description = "";
          switch (field) {
            case "Morning Exercise":
              description = "Morning Exercise completed";
              break;
            case "Evening Exercise":
              description = "Evening Exercise completed";
              break;
            case "Applications":
              description = "Job applications submitted";
              break;
            case "Fresh Air":
              description = "Fresh air/outdoor time";
              break;
            default:
              description = `${field} completed`;
          }
  
          entry[field] = {
            value: d[field] || false,
            description: description,
          };
        });

        // Process bonus activities as a combined category
        const completedBonusActivities = bonusFields.filter(field => d[field]);
        const hasBonusActivities = completedBonusActivities.length > 0;
        
        entry["Bonus"] = {
          value: hasBonusActivities,
          description: hasBonusActivities 
            ? `Bonus: ${completedBonusActivities.join(", ")}`
            : "No bonus activities",
          completedActivities: completedBonusActivities
        };

        // Journal field
        entry["Journal"] = {
          value: d.Journal && d.Journal.trim() !== "",
          description: d.Journal && d.Journal.trim() !== "" 
            ? `Journal: "${d.Journal.substring(0, 50)}${d.Journal.length > 50 ? '...' : ''}"`
            : "No journal entry"
        };
  
        return entry;
      })
      .filter((d) => d.Date instanceof Date && !isNaN(d.Date) && d.Date >= cutoffDate)
      .sort((a, b) => a.Date - b.Date);
  };
  

  const stackedData = useMemo(() => {
    if (data.length === 0) return [];
    const fields = ["Morning Exercise", "Evening Exercise", "Applications", "Fresh Air", "Bonus", "Journal"];
    const stack = d3.stack().keys(fields).value((d, key) => (d[key].value ? 1 : 0));
    return stack(data);
  }, [data]);

  useEffect(() => {
    if (stackedData.length === 0) return;

    const fields = ["Morning Exercise", "Evening Exercise", "Applications", "Fresh Air", "Bonus", "Journal"];
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
      .style("padding", "8px")
      .style("border-radius", "5px")
      .style("opacity", 0)
      .style("max-width", "200px")
      .style("font-size", "11px")
      .style("line-height", "1.3");

    const x = d3.scaleBand()
      .domain(data.map(d => d3.timeFormat("%Y-%m-%d")(d.Date)))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], (d) => d[1])])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(fields)
      .range([
        "#E74C3C", // Morning Exercise - Red
        "#3498DB", // Evening Exercise - Blue  
        "#E67E22", // Applications - Orange
        "#27AE60", // Fresh Air - Green
        "#9B59B6", // Bonus - Purple
        "#F39C12"  // Journal - Amber
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
      .attr("x", (d) => x(d3.timeFormat("%Y-%m-%d")(d.data.Date)))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        const field = d3.select(this.parentNode).datum().key;
        const fieldData = d.data[field];
        const fullDate = d3.timeFormat("%B %d, %Y")(d.data.Date);
        
        let tooltipContent = `<strong>${fullDate}</strong><br/>${fieldData.description}`;
        
        // Special handling for Bonus tooltip
        if (field === "Bonus" && fieldData.completedActivities && fieldData.completedActivities.length > 0) {
          tooltipContent = `<strong>${fullDate}</strong><br/>
            <strong>Bonus Activities:</strong><br/>
            ${fieldData.completedActivities.map(activity => `• ${activity}`).join('<br/>')}`;
        }
        
        tooltip
          .style("opacity", 1)
          .html(tooltipContent)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    const xAxis = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => {
        const date = d3.timeParse("%Y-%m-%d")(d);
        return date.getDate() === 1 ? d3.timeFormat("%b")(date) : d3.timeFormat("%d")(date);
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

    const legendItemWidth = 90;
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
          .style("font-size", "9px")
          .style("fill", "white")
          .text(d);
      });

    // Clean up tooltip on component unmount
    return () => {
      d3.selectAll("div").filter(function() {
        return d3.select(this).style("position") === "absolute" && 
               d3.select(this).style("background-color") === "rgb(51, 51, 51)";
      }).remove();
    };
  }, [stackedData, data]);

  return (
    <div style={{ overflowX: "none", padding: "10px 10px", maxWidth: "100%" }}>
      <svg id="barchart" ref={svgRef} width="100%" height="100%" style={{ maxWidth: "100%" }}></svg>
    </div>
  );
};

export default TrueValuesBarChart;
