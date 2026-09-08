"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/backlog", label: "Backlog" },
  { href: "/workouts", label: "Workouts" },
];

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true";

const conditionGlyph = (code: number): string => {
  if (code === 0 || code === 1) return "☀";
  if (code === 2 || code === 3 || code === 45) return "☁";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "☂";
  if ([71, 73, 75, 85, 86].includes(code)) return "❄";
  if (code === 95) return "⚡";
  return "·";
};

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useWeather() {
  const [w, setW] = useState<{ temp: number; glyph: string } | null>(null);
  useEffect(() => {
    let live = true;
    fetch(WEATHER_URL)
      .then((r) => r.json())
      .then((d) => {
        if (!live || !d?.current_weather) return;
        const f = Math.round((d.current_weather.temperature * 9) / 5 + 32);
        setW({ temp: f, glyph: conditionGlyph(d.current_weather.weathercode) });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return w;
}

const tempColor = (t: number) => {
  if (t < 40) return "#7dd3fc";
  if (t < 60) return "#22d3ee";
  if (t < 78) return "#4ade80";
  if (t < 86) return "#fde047";
  if (t < 92) return "#fdba74";
  return "#f87171";
};

export default function AppHeader() {
  const pathname = usePathname();
  const now = useClock();
  const weather = useWeather();

  const time = now
    ? now.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";
  const date = now
    ? now.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <nav id="app-nav" className="mc app-header sticky top-0 z-50">
      <div className="nav-blur" aria-hidden="true" />
      <div className="nav-bar">
        <Link href="/" className="app-header__mark">
          JOE&apos;S LIFE
        </Link>

        <div className="app-header__nav">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-header__link${active ? " is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="app-header__meta mc-mono">
          <span className="app-header__time">{time}</span>
          <span className="app-header__date">{date}</span>
          {weather && (
            <span className="app-header__wx" style={{ color: tempColor(weather.temp) }}>
              {weather.glyph} {weather.temp}°
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
