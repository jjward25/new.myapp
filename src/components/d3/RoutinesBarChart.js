"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { getWeekStartEST } from '@/utils/dateUtils';

const RoutinesBarChart = () => {
  const [data, setData] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState(null);
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
        
        // Calculate weekly stats
        const stats = calculateWeeklyStats(result);
        setWeeklyStats(stats);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const calculateWeeklyStats = (data) => {
    // Get start of current week (Monday) in EST
    const weekStart = getWeekStartEST();
    
    // Filter to this week's entries (Date is stored as YYYY-MM-DD string)
    const weekData = data.filter(d => d.Date >= weekStart);

    // Count completions - EXCLUDE "Pass" values (only count true completions)
    const mobility = weekData.filter(d => d.Mobility === true).length;
    const lift = weekData.filter(d => d.Exercise === 'Lift').length;
    const cardio = weekData.filter(d => d.Exercise === 'Cardio').length;
    const language = weekData.filter(d => d.Language === true).length;
    const piano = weekData.filter(d => d.Piano === true).length;
    const readLearn = weekData.filter(d => d.ReadLearn && Array.isArray(d.ReadLearn) && d.ReadLearn.length > 0).length;
    const journal = weekData.filter(d => d.Journal && typeof d.Journal === 'string' && d.Journal.trim() !== '' && d.Journal !== 'Pass').length;

    return {
      mobility: { current: mobility, target: 5 },
      lift: { current: lift, target: 2 },
      cardio: { current: cardio, target: 3 },
      language: { current: language, target: 5 },
      piano: { current: piano, target: 5 },
      readLearn: { current: readLearn, target: 7 },
      journal: { current: journal, target: 7 }
    };
  };

  const processData = (data) => {
    const fields = ["Mobility", "Exercise", "Language", "Piano", "ReadLearn", "Journal"];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  
    return data
      .map((d) => {
        const parsedDate = d3.timeParse("%Y-%m-%d")(d.Date);
        const entry = { Date: parsedDate };
  
        // Mobility - true counts as completed, "Pass" counts as addressed but not completed
        entry["Mobility"] = {
          value: d.Mobility === true, // Only true, not "Pass"
          passed: d.Mobility === 'Pass',
          description: d.Mobility === true ? "Mobility completed" : d.Mobility === 'Pass' ? "Mobility: Pass" : "No mobility"
        };

        // Exercise (Lift or Cardio) - "Pass" counts as addressed but not completed
        entry["Exercise"] = {
          value: d.Exercise === 'Lift' || d.Exercise === 'Cardio',
          passed: d.Exercise === 'Pass',
          description: d.Exercise && d.Exercise !== 'Pass' ? `Exercise: ${d.Exercise}` : d.Exercise === 'Pass' ? "Exercise: Pass" : "No exercise",
          type: d.Exercise
        };

        // Language - true counts as completed, "Pass" counts as addressed but not completed
        entry["Language"] = {
          value: d.Language === true,
          passed: d.Language === 'Pass',
          description: d.Language === true ? "Language study completed" : d.Language === 'Pass' ? "Language: Pass" : "No language study"
        };

        // Piano - true counts as completed, "Pass" counts as addressed but not completed
        entry["Piano"] = {
          value: d.Piano === true,
          passed: d.Piano === 'Pass',
          description: d.Piano === true ? "Piano practice completed" : d.Piano === 'Pass' ? "Piano: Pass" : "No piano practice"
        };

        // ReadLearn
        const readLearnItems = Array.isArray(d.ReadLearn) ? d.ReadLearn : [];
        entry["ReadLearn"] = {
          value: readLearnItems.length > 0,
          description: readLearnItems.length > 0 
            ? `Read/Learn: ${readLearnItems.map(item => item.text).join(", ")}`
            : "No reading/learning",
          items: readLearnItems
        };

        // Journal
        const hasJournal = d.Journal && typeof d.Journal === 'string' && d.Journal.trim() !== '' && d.Journal !== 'Pass';
        entry["Journal"] = {
          value: hasJournal,
          description: hasJournal 
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
    const fields = ["Mobility", "Exercise", "Language", "Piano", "ReadLearn", "Journal"];
    const stack = d3.stack().keys(fields).value((d, key) => (d[key].value ? 1 : 0));
    return stack(data);
  }, [data]);

  useEffect(() => {
    if (stackedData.length === 0) return;

    const fields = ["Mobility", "Exercise", "Language", "Piano", "ReadLearn", "Journal"];
    const containerWidth = svgRef.current.clientWidth;
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

    // Appended to <body>, outside the .mc-scoped tree -- var(--mc-*) wouldn't
    // resolve here, so these mirror home.css's tokens as literal hex.
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "#171a1f")
      .style("border", "1px solid rgba(255,255,255,0.16)")
      .style("color", "#e7eaee")
      .style("padding", "8px 10px")
      .style("border-radius", "8px")
      .style("opacity", 0)
      .style("max-width", "200px")
      .style("font-size", "11px")
      .style("line-height", "1.4")
      .style("font-family", "Archivo, system-ui, sans-serif");

    const x = d3.scaleBand()
      .domain(data.map(d => d3.timeFormat("%Y-%m-%d")(d.Date)))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData[stackedData.length - 1], (d) => d[1])])
      .nice()
      .range([height, 0]);

    // mc design tokens (home.css), hardcoded -- these bars are raw D3/SVG
    // attribute values, not CSS, so var(--mc-*) wouldn't resolve reliably.
    const color = d3.scaleOrdinal()
      .domain(fields)
      .range([
        "#22d3ee", // Mobility - signal cyan
        "#35c48b", // Exercise - done green
        "#f5a623", // Language - p1 amber
        "#a78bfa", // Piano - violet
        "#f0426a", // ReadLearn - p0 rose
        "#38bdf8"  // Journal - sky
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
      .attr("stroke", "#0c0d10")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        const field = d3.select(this.parentNode).datum().key;
        const fieldData = d.data[field];
        const fullDate = d3.timeFormat("%B %d, %Y")(d.data.Date);
        
        let tooltipContent = `<strong>${fullDate}</strong><br/>${fieldData.description}`;
        
        // Special handling for ReadLearn tooltip
        if (field === "ReadLearn" && fieldData.items && fieldData.items.length > 0) {
          tooltipContent = `<strong>${fullDate}</strong><br/>
            <strong>Read/Learn:</strong><br/>
            ${fieldData.items.map(item => `• ${item.text}`).join('<br/>')}`;
        }
        
        // Special handling for Exercise tooltip
        if (field === "Exercise" && fieldData.type) {
          tooltipContent = `<strong>${fullDate}</strong><br/>Exercise: ${fieldData.type}`;
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

    xAxis.selectAll(".tick text").attr("fill", "#c4c9d1").attr("font-family", "ui-monospace, SF Mono, Menlo, monospace");
    xAxis.select(".domain").attr("stroke", "rgba(255,255,255,0.16)");
    xAxis.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.16)");

    const yAxis = svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickValues(d3.range(0, Math.ceil(y.domain()[1]) + 1)).tickFormat((d) => d));

    yAxis.selectAll(".tick text").attr("fill", "#c4c9d1").attr("font-family", "ui-monospace, SF Mono, Menlo, monospace");
    yAxis.select(".domain").attr("stroke", "rgba(255,255,255,0.16)");
    yAxis.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.16)");

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
          .attr("width", 10)
          .attr("height", 10)
          .attr("rx", 2)
          .attr("fill", color(d));
        item.append("text")
          .attr("x", 16)
          .attr("y", 9)
          .style("font-size", "9px")
          .style("font-family", "ui-monospace, SF Mono, Menlo, monospace")
          .style("fill", "#c4c9d1")
          .text(d);
      });

    // Clean up tooltip on component unmount
    return () => {
      d3.selectAll("div").filter(function() {
        return d3.select(this).style("position") === "absolute" && 
               d3.select(this).style("background-color") === "rgb(23, 26, 31)";
      }).remove();
    };
  }, [stackedData, data]);

  const getProgressColor = (current, target) => {
    // mc semantic tokens: done green / p1 amber / ink-faint gray
    if (current === 0) return "text-[#c4c9d1]";

    // Calculate days remaining in the week (Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Days left including today

    // Check if still possible to hit target
    const remaining = target - current;
    if (remaining <= daysRemaining) {
      return "text-[#35c48b]"; // On pace or ahead
    }

    return "text-[#f5a623]"; // Behind pace but not 0
  };

  const summaryRows = weeklyStats && [
    ["Mobility", weeklyStats.mobility],
    ["Lift", weeklyStats.lift],
    ["Cardio", weeklyStats.cardio],
    ["Language", weeklyStats.language],
    ["Piano", weeklyStats.piano],
    ["Read/Learn", weeklyStats.readLearn],
    ["Journal", weeklyStats.journal],
  ];

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* Weekly Summary */}
      {summaryRows && (
        <div className="mb-4 mc-panel px-3 py-2.5">
          <div className="mc-label mb-2">This Week&apos;s Progress</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 mc-mono text-[11px]">
            {summaryRows.map(([label, stat]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[#c4c9d1]">{label}:</span>
                <span className={getProgressColor(stat.current, stat.target)}>
                  {stat.current}/{stat.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Chart */}
      <svg id="barchart" ref={svgRef} width="100%" height="100%" style={{ maxWidth: "100%" }}></svg>
    </div>
  );
};

export default RoutinesBarChart;
