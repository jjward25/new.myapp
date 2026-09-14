"use client"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

// Stable, project-agnostic palette (10 colors) -- assigned by project name
// order so a given project keeps its color across reloads/date-range changes.
const PALETTE = ["#22d3ee", "#35c48b", "#f5a623", "#f0426a", "#a78bfa", "#38bdf8", "#facc15", "#fb7185", "#34d399", "#818cf8"]

const TaskBarChart = () => {
  const [data, setData] = useState([])
  const [projectNames, setProjectNames] = useState([])
  const [resizeTick, setResizeTick] = useState(0)
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  // date|project -> [task names] -- keyed lookup for the hover tooltip, kept
  // out of React state since it's only read inside the D3 effect.
  const detailRef = useRef({})

  // The draw effect below only reruns on data changes -- it has no way to
  // know the *container* itself resized (e.g. a CSS height tweak, a window
  // resize, sidebar toggle). Without this, the SVG keeps whatever height it
  // last computed and visually overflows/underfills its box. Real bug hit
  // 2026-09-14: shrinking the homepage row's height didn't shrink the chart,
  // it just overflowed into the section below.
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => setResizeTick((t) => t + 1))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Linear-backed now (was Personal.Backlog) -- every project's
        // completions, not just one system. Same source as /work and the
        // homepage's Milestones lane.
        const response = await fetch("/api/projects")
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        const projects = await response.json()
        const names = (Array.isArray(projects) ? projects : []).map((p) => p["Project Name"])
        setProjectNames(names)
        setData(processData(projects, names))
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const processData = (projects, names) => {
    const tasksByDate = {}
    const detail = {}

    const today = new Date()

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const row = { date: dateStr }
      names.forEach((n) => { row[n] = 0 })
      tasksByDate[dateStr] = row
    }

    ;(Array.isArray(projects) ? projects : []).forEach((proj) => {
      const projectName = proj["Project Name"]
      Object.entries(proj.Milestones || {}).forEach(([taskName, m]) => {
        const completeDate = m["Complete Date"]
        if (!completeDate) return
        const dateStr = String(completeDate).slice(0, 10)
        if (!tasksByDate[dateStr]) return
        tasksByDate[dateStr][projectName] = (tasksByDate[dateStr][projectName] || 0) + 1
        const key = `${dateStr}|${projectName}`
        ;(detail[key] ||= []).push(taskName)
      })
    })

    detailRef.current = detail
    return Object.values(tasksByDate).sort((a, b) => a.date.localeCompare(b.date))
  }

  useEffect(() => {
    if (!data.length || !svgRef.current || !projectNames.length) return

    const margin = { top: 20, right: 30, bottom: 40, left: 40 }
    // containerRef (a plain div), not svgRef -- an <svg> with no CSS width
    // and no attr set yet reads its clientWidth as a browser-default ~300px,
    // not the real available space. The wrapping div has no such quirk.
    const width = (containerRef.current?.clientWidth || 300) - margin.left - margin.right

    // Fill the actual available height (set by the flex-1 container, itself
    // driven by the shared grid row height on the homepage) instead of a
    // fixed pixel height -- reserve space for the legend based on how many
    // rows it'll actually wrap to at this width, then give the rest to bars.
    const legendItemWidth = 110
    const legendItemHeight = 16
    const activeNamesForLayout = projectNames.filter((n) => data.some((d) => d[n] > 0))
    let legendRows = 1
    let rowX = 0
    activeNamesForLayout.forEach(() => {
      if (rowX + legendItemWidth > width) { rowX = 0; legendRows++ }
      rowX += legendItemWidth
    })
    const legendReserve = legendRows * legendItemHeight + 20
    const containerHeight = containerRef.current?.clientHeight || 220
    const height = Math.max(60, containerHeight - margin.top - margin.bottom - legendReserve)

    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.date))
      .range([0, width])
      .padding(0.1)

    const y = d3
      .scaleLinear()
      .domain([0, Math.max(1, d3.max(data, (d) => projectNames.reduce((sum, n) => sum + (d[n] || 0), 0)))])
      .range([height, 0])

    // Only color/legend projects that actually have a bar in this window.
    const activeNames = projectNames.filter((n) => data.some((d) => d[n] > 0))
    const color = d3.scaleOrdinal().domain(projectNames).range(PALETTE)

    const stack = d3.stack().keys(activeNames)
    const stackedData = stack(data)

    // Appended to <body>, outside the .mc-scoped tree -- mirrors home.css's
    // tokens as literal hex since var(--mc-*) wouldn't resolve here.
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "task-trend-tooltip")
      .style("position", "absolute")
      .style("background", "#171a1f")
      .style("border", "1px solid rgba(255,255,255,0.16)")
      .style("color", "#e7eaee")
      .style("padding", "8px 10px")
      .style("border-radius", "8px")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("max-width", "240px")
      .style("font-size", "11px")
      .style("line-height", "1.4")
      .style("font-family", "Archivo, system-ui, sans-serif")
      .style("z-index", 50)

    svg
      .selectAll("g.layer")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("class", "layer")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d.map((seg) => ({ ...seg, project: d.key })))
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.data.date))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
      .attr("width", x.bandwidth())
      .style("cursor", (d) => (d.data[d.project] > 0 ? "pointer" : "default"))
      .on("mouseover", function (event, d) {
        const count = d.data[d.project]
        if (!count) return
        const names = detailRef.current[`${d.data.date}|${d.project}`] || []
        const fullDate = d3.timeFormat("%B %d, %Y")(new Date(d.data.date + "T00:00:00"))
        const list = names.map((n) => `• ${n}`).join("<br/>")
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.project}</strong> — ${fullDate}<br/>${count} completed<br/>${list}`)
      })
      .on("mousemove", (event) => {
        tooltip.style("left", event.pageX + 12 + "px").style("top", event.pageY - 10 + "px")
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0)
      })

    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d, i) => (i % 3 === 0 ? d3.timeFormat("%b %d")(new Date(d)) : "")))
    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("fill", "#c4c9d1")
      .attr("font-family", "ui-monospace, SF Mono, Menlo, monospace")
      .attr("font-size", 10)
    xAxis.selectAll("line").attr("stroke", "rgba(255,255,255,0.2)")
    xAxis.select(".domain").attr("stroke", "rgba(255,255,255,0.2)")

    const yAxis = svg
      .append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d")))
    yAxis.selectAll("text")
      .attr("fill", "#c4c9d1")
      .attr("font-family", "ui-monospace, SF Mono, Menlo, monospace")
      .attr("font-size", 10)
    yAxis.selectAll("line").attr("stroke", "rgba(255,255,255,0.2)")
    yAxis.select(".domain").attr("stroke", "rgba(255,255,255,0.2)")

    // Legend -- wraps across rows since there can be up to ~10 projects.
    let legendX = 0
    let legendY = 0
    const legend = svg
      .append("g")
      .attr("font-family", "ui-monospace, SF Mono, Menlo, monospace")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr("transform", `translate(0, ${height + 50})`)

    activeNames.forEach((name) => {
      if (legendX + legendItemWidth > width) {
        legendX = 0
        legendY += legendItemHeight
      }
      const g = legend.append("g").attr("transform", `translate(${legendX}, ${legendY})`)
      g.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", color(name))
      g.append("text").attr("x", 16).attr("y", 9).attr("fill", "#c4c9d1").text(name)
      legendX += legendItemWidth
    })

    d3.select(svgRef.current).attr("height", containerHeight)

    // Clean up the body-appended tooltip when this effect reruns/unmounts.
    return () => {
      tooltip.remove()
    }
  }, [data, projectNames, resizeTick])

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden" style={{ width: "100%" }}>
      {/* No CSS height here on purpose -- the draw effect sets width/height
          attrs directly from the measured container size, and those attrs
          must be the SOLE source of the SVG's box. A competing CSS height
          (100% etc.) can win the rendered box while the axis/bars are still
          positioned using the JS-measured height, silently misplacing them
          outside the visible box the moment the two disagree. */}
      <svg ref={svgRef} style={{ display: "block" }}></svg>
    </div>
  )
}

export default TaskBarChart
