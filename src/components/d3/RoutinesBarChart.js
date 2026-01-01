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
        "#10B981", // Mobility - Emerald
        "#F43F5E", // Exercise - Rose
        "#0EA5E9", // Language - Sky  
        "#8B5CF6", // Piano - Violet
        "#F59E0B", // ReadLearn - Amber
        "#14B8A6"  // Journal - Teal
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

  const getProgressColor = (current, target) => {
    // If 0, show gray (same as labels)
    if (current === 0) return 'text-slate-400';
    
    // Calculate days remaining in the week (Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Days left including today
    
    // Check if still possible to hit target
    const remaining = target - current;
    if (remaining <= daysRemaining) {
      return 'text-teal-400'; // On pace or ahead
    }
    
    return 'text-yellow-400'; // Behind pace but not 0
  };

  return (
    <div style={{ padding: "10px 10px", maxWidth: "100%" }}>
      {/* Weekly Summary */}
      {weeklyStats && (
        <div className="mb-4 p-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700">
          <h3 className="text-sm font-bold text-cyan-400 mb-2">This Week&apos;s Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Mobility:</span>
              <span className={getProgressColor(weeklyStats.mobility.current, weeklyStats.mobility.target)}>
                {weeklyStats.mobility.current}/{weeklyStats.mobility.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lift:</span>
              <span className={getProgressColor(weeklyStats.lift.current, weeklyStats.lift.target)}>
                {weeklyStats.lift.current}/{weeklyStats.lift.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cardio:</span>
              <span className={getProgressColor(weeklyStats.cardio.current, weeklyStats.cardio.target)}>
                {weeklyStats.cardio.current}/{weeklyStats.cardio.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Language:</span>
              <span className={getProgressColor(weeklyStats.language.current, weeklyStats.language.target)}>
                {weeklyStats.language.current}/{weeklyStats.language.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Piano:</span>
              <span className={getProgressColor(weeklyStats.piano.current, weeklyStats.piano.target)}>
                {weeklyStats.piano.current}/{weeklyStats.piano.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Read/Learn:</span>
              <span className={getProgressColor(weeklyStats.readLearn.current, weeklyStats.readLearn.target)}>
                {weeklyStats.readLearn.current}/{weeklyStats.readLearn.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Journal:</span>
              <span className={getProgressColor(weeklyStats.journal.current, weeklyStats.journal.target)}>
                {weeklyStats.journal.current}/{weeklyStats.journal.target}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Chart */}
      <svg id="barchart" ref={svgRef} width="100%" height="100%" style={{ maxWidth: "100%" }}></svg>
    </div>
  );
};

export default RoutinesBarChart;
