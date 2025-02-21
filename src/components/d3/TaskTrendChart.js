"use client"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

const TaskBarChart = () => {
  const [data, setData] = useState([])
  const svgRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/backlog/")
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        const tasks = await response.json()
        const processedData = processData(tasks)
        setData(processedData)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const processData = (tasks) => {
    const tasksByDate = {}

    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      tasksByDate[dateStr] = {
        date: dateStr,
        completed: 0,
        incomplete: 0,
      }
    }

    tasks.forEach((task) => {
      const dueDate = task["Due Date"]
      if (!dueDate || !tasksByDate[dueDate]) return

      if (task["Complete Date"]) {
        tasksByDate[dueDate].completed++
      } else {
        tasksByDate[dueDate].incomplete++
      }
    })

    return Object.values(tasksByDate).sort((a, b) => a.date.localeCompare(b.date))
  }

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    const margin = { top: 20, right: 30, bottom: 70, left: 40 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 200 - margin.top - margin.bottom

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
      .domain([0, Math.ceil(d3.max(data, (d) => d.completed + d.incomplete))])
      .range([height, 0])

    const color = d3.scaleOrdinal().domain(["completed", "incomplete"]).range(["#74a892", "#7f694b"])

    const stack = d3.stack().keys(["completed", "incomplete"])

    const stackedData = stack(data)

    svg
      .selectAll("g")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.data.date))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d, i) => (i % 3 === 0 ? d3.timeFormat("%b %d")(new Date(d)) : "")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("fill", "white")

    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("fill", "white")

    const legendSpacing = 80
    const legend = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr("transform", `translate(0, ${height + 50})`)

    legend
      .selectAll("g")
      .data(color.domain().slice().reverse())
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(${i * legendSpacing}, 0)`)

    legend.selectAll("g").append("rect").attr("width", 15).attr("height", 15).attr("fill", color)

    legend
      .selectAll("g")
      .append("text")
      .attr("x", 20)
      .attr("y", 9)
      .attr("dy", "0.32em")
      .text((d) => d)
      .attr("fill", "white")

    const svgHeight = height + margin.top + margin.bottom // Added 40px for legend
    d3.select(svgRef.current).attr("height", svgHeight)
  }, [data])

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "220px" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
    </div>
  )
}

export default TaskBarChart

