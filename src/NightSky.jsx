import { useMemo } from "react";
import "./NightSky.css";

export default function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        top: Math.random() * 70,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 4,
      })),
    []
  );

  const shootingStars = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => ({
        top: 5 + Math.random() * 30,
        left: Math.random() * 60,
        delay: i * 4 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="night-sky">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {shootingStars.map((s, i) => (
        <span
          key={`shoot-${i}`}
          className="shooting-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <svg
        className="mountains"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
      >
        <polygon
          points="0,200 0,120 150,40 300,110 420,60 550,130 650,80 800,140 800,200"
          fill="#1a2233"
        />
        <polygon
          points="0,200 0,160 200,100 380,150 500,110 650,160 800,120 800,200"
          fill="#0d1220"
        />
      </svg>
    </div>
  );
}