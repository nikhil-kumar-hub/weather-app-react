import { useMemo } from "react";
import "./WeatherBackground.css";

// condition: "rain" | "snow" | "clear" | "cloudy" | "thunderstorm"
export default function WeatherBackground({ condition = "clear" }) {
  const drops = useMemo(() => Array.from({ length: 60 }), []);
  const flakes = useMemo(() => Array.from({ length: 40 }), []);

  if (condition === "rain" || condition === "thunderstorm") {
    return (
      <div className={`weather-bg rain-bg ${condition === "thunderstorm" ? "thunder" : ""}`}>
        {drops.map((_, i) => (
          <span
            key={i}
            className="drop"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${0.4 + Math.random() * 0.5}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (condition === "snow") {
    return (
      <div className="weather-bg snow-bg">
        {flakes.map((_, i) => (
          <span
            key={i}
            className="flake"
            style={{
              left: `${Math.random() * 100}%`,
              fontSize: `${8 + Math.random() * 10}px`,
              animationDuration: `${4 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            ❄
          </span>
        ))}
      </div>
    );
  }

  if (condition === "cloudy") {
    const clouds = [
      { top: "10%", size: "180px", dur: "35s" },
      { top: "25%", size: "260px", dur: "50s" },
      { top: "5%", size: "140px", dur: "28s" },
      { top: "40%", size: "220px", dur: "45s" },
      { top: "18%", size: "300px", dur: "60s" },
    ];
    return (
      <div className="weather-bg cloudy-bg">
        {clouds.map((c, i) => (
          <span
            key={i}
            className="cloud"
            style={{
              "--top": c.top,
              "--size": c.size,
              "--dur": c.dur,
              animationDelay: `${i * -6}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // clear -> gradient only
  return <div className={`weather-bg ${condition}-bg`} />;
}