// maps Open-Meteo "weathercode" -> condition string used by WeatherBackground
export function getConditionFromCode(code) {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "cloudy";
  if ([45, 48].includes(code)) return "cloudy"; // fog -> treat as cloudy
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "clear";
}