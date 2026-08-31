import { useState, useEffect, useCallback } from "react";
import "./index.css";

const WEATHER_CODES = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  61: ["Slight rain", "🌧️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Slight snow", "🌨️"],
  73: ["Moderate snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Moderate showers", "🌧️"],
  82: ["Violent showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm + hail", "⛈️"],
  99: ["Severe thunderstorm", "⛈️"],
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || ["Unknown", "🌡️"];
}

function cToF(c) {
  return (c * 9) / 5 + 32;
}

function getAqiLabel(aqi) {
  if (aqi == null) return "-";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (sensitive)";
  return "Unhealthy";
}

function WeeklyChart({ daily }) {
  const chartHeight = 120;
  const barWidth = 24;
  const gap = 16;

  const maxTemps = daily.temperature_2m_max;
  const overallMax = Math.max(...maxTemps);
  const overallMin = Math.min(...daily.temperature_2m_min);

  return (
    <svg
      viewBox={`0 -15 ${maxTemps.length * (barWidth + gap)} ${chartHeight + 45}`}
      className="weekly-chart"
    >
      {daily.time.map((t, i) => {
        const temp = maxTemps[i];
        const barHeight =
          ((temp - overallMin) / (overallMax - overallMin)) * chartHeight;
        const x = i * (barWidth + gap);
        const y = chartHeight - barHeight;
        const dayName =
          i === 0 ? "Today" : DAY_NAMES[new Date(t).getDay()];

        return (
          <g key={t}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="orange"
              rx="4"
            />
            <text
              x={x + barWidth / 2}
              y={chartHeight + 20}
              fontSize="10"
              textAnchor="middle"
              fill="currentColor"
            >
              {dayName}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - 4}
              fontSize="10"
              textAnchor="middle"
              fill="currentColor"
            >
              {Math.round(temp)}°
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function getAlert(code, maxTemp) {
  const stormCodes = [65, 82, 95, 96, 99];
  if (stormCodes.includes(code)) return "⚠️ Storm/Heavy rain warning";
  if (maxTemp > 40) return "🌡️ Extreme heat alert";
  return null;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState(null);
  const [place, setPlace] = useState(null);
  const [unit, setUnit] = useState("C");
  const [theme, setTheme] = useState("light");
  const [recent, setRecent] = useState([]);
  const [now, setNow] = useState(new Date());
  const [airQuality, setAirQuality] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("weather-theme");
    if (savedTheme) setTheme(savedTheme);

    const savedRecent = localStorage.getItem("weather-recent");
    if (savedRecent) {
      try {
        setRecent(JSON.parse(savedRecent));
      } catch {
        /* ignore */
      }
    }

    fetchWeatherByCoords(28.6139, 77.209, { name: "Delhi", country: "India" });
    fetchAirQuality(28.6139, 77.209);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("weather-theme", theme);
  }, [theme]);

  const saveRecent = (label) => {
    setRecent((prev) => {
      const updated = [label, ...prev.filter((c) => c !== label)].slice(0, 5);
      localStorage.setItem("weather-recent", JSON.stringify(updated));
      return updated;
    });
  };

  async function fetchWeatherByCoords(lat, lon, placeInfo) {
    setLoading(true);
    setError("");
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset` +
        `&timezone=auto&forecast_days=6`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setWeather(data);
      setPlace(placeInfo);
      const label = `${placeInfo.name}${placeInfo.country ? ", " + placeInfo.country : ""}`;
      saveRecent(label);
    } catch (err) {
      setError("Couldn't load weather. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAirQuality(lat, lon) {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
      const res = await fetch(url);
      const data = await res.json();
      setAirQuality(data.current.us_aqi);
    } catch {
      setAirQuality(null);
    }
  }

  async function searchCity(cityName) {
    const name = (cityName ?? query).trim();
    if (!name) return;
    setLoading(true);
    setError("");
    setSuggestions([]);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        name
      )}&count=1&language=en&country=IN`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found. Check the spelling.");
        setLoading(false);
        return;
      }
      const p = geoData.results[0];
      await fetchWeatherByCoords(p.latitude, p.longitude, {
        name: p.name,
        country: p.country,
      });
      await fetchAirQuality(p.latitude, p.longitude);
      setQuery("");
    } catch (err) {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  const handleInputChange = useCallback(async (val) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        val
      )}&count=5&language=en&country=IN`;
      const res = await fetch(geoUrl);
      const data = await res.json();
      setSuggestions(data.results || []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, {
          name: "Your Location",
          country: "",
        });
        fetchAirQuality(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("Location access denied.");
        setLoading(false);
      }
    );
  }

  const displayTemp = (celsius) => {
    const val = unit === "C" ? celsius : cToF(celsius);
    return `${Math.round(val)}°${unit}`;
  };

  const alertMsg = weather
    ? getAlert(weather.current.weather_code, weather.daily.temperature_2m_max[0])
    : null;

  return (
    <div className="app">
      {alertMsg && <div className="alert-banner">{alertMsg}</div>}

      <header className="topbar">
        <h1>🌦️ Weather</h1>
        <span className="live-clock">
          {now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
        <div className="topbar-actions">
          <button
            className="pill-btn"
            onClick={() => setUnit(unit === "C" ? "F" : "C")}
          >
            °{unit === "C" ? "F" : "C"}
          </button>
          <button
            className="pill-btn"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <div className="search-wrap">
        <div className="search-box">
          <input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchCity()}
            placeholder="Search city..."
          />
          <button onClick={() => searchCity()}>Search</button>
          <button className="icon-btn" onClick={useMyLocation} title="My location">
            📍
          </button>
        </div>

        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s) => (
              <li
                key={`${s.latitude}-${s.longitude}`}
                onClick={() => searchCity(s.name)}
              >
                {s.name}, {s.admin1 ? s.admin1 + ", " : ""}
                {s.country}
              </li>
            ))}
          </ul>
        )}

        {recent.length > 0 && (
          <div className="recent-chips">
            {recent.map((r) => (
              <button key={r} onClick={() => searchCity(r.split(",")[0])}>
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="status">Loading...</div>}
      {error && <div className="status error">{error}</div>}

      {!loading && !error && weather && place && (
        <>
          <section className="current-card">
            <h2>
              {place.name}
              {place.country ? `, ${place.country}` : ""}
            </h2>
            <p className="datetime">
              {new Date().toLocaleString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="temp-row">
              <span className="icon-big">
                {getWeatherInfo(weather.current.weather_code)[1]}
              </span>
              <span className="temp-big">
                {displayTemp(weather.current.temperature_2m)}
              </span>
            </div>
            <p className="desc">{getWeatherInfo(weather.current.weather_code)[0]}</p>

            <div className="details-grid">
              <div className="detail">
                <span>Feels like</span>
                <strong>{displayTemp(weather.current.apparent_temperature)}</strong>
              </div>
              <div className="detail">
                <span>Humidity</span>
                <strong>{weather.current.relative_humidity_2m}%</strong>
              </div>
              <div className="detail">
                <span>Wind</span>
                <strong>{weather.current.wind_speed_10m} km/h</strong>
              </div>
              <div className="detail">
                <span>UV Index</span>
                <strong>{weather.current.uv_index ?? "-"}</strong>
              </div>
              <div className="detail">
                <span>Sunrise</span>
                <strong>
                  {new Date(weather.daily.sunrise[0]).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
              <div className="detail">
                <span>Sunset</span>
                <strong>
                  {new Date(weather.daily.sunset[0]).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
              <div className="detail">
                <span>Air Quality</span>
                <strong>
                  {airQuality ?? "-"} ({getAqiLabel(airQuality)})
                </strong>
              </div>
            </div>
          </section>

          <section className="hourly-section">
            <h3>Next 24 Hours</h3>
            <div className="hourly-scroll">
              {weather.hourly.time.slice(0, 24).map((t, i) => (
                <div className="hour-item" key={t}>
                  <span>
                    {new Date(t).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                    })}
                  </span>
                  <span className="hour-icon">
                    {getWeatherInfo(weather.hourly.weather_code[i])[1]}
                  </span>
                  <span>{displayTemp(weather.hourly.temperature_2m[i])}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="forecast-section">
            <h3>Weekly Trend</h3>
            <WeeklyChart daily={weather.daily} />
          </section>

          <section className="forecast-section">
            <h3>6-Day Forecast</h3>
            <div className="forecast-list">
              {weather.daily.time.map((t, i) => {
                const dayName =
                  i === 0 ? "Today" : DAY_NAMES[new Date(t).getDay()];
                return (
                  <div className="forecast-item" key={t}>
                    <span className="fday">{dayName}</span>
                    <span className="ficon">
                      {getWeatherInfo(weather.daily.weather_code[i])[1]}
                    </span>
                    <span className="frange">
                      {displayTemp(weather.daily.temperature_2m_min[i])} /{" "}
                      {displayTemp(weather.daily.temperature_2m_max[i])}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <footer>Data by Open-Meteo</footer>
    </div>
  );
}