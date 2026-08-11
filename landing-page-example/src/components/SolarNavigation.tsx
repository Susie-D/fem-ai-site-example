import { bezierPoint, cities, solarPositions } from "../cities";

type Props = {
  progress: number;
  activeCity: number;
  onSelect: (index: number) => void;
};

const ARC = "M 52 106 Q 500 -76 948 106";

export function SolarNavigation({ progress, activeCity, onSelect }: Props) {
  const sun = bezierPoint(progress);

  return (
    <nav className="solar-nav" aria-label="Cities along the solar course">
      <svg className="solar-arc" viewBox="0 0 1000 126" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="arcGradient" x1="0" x2="1">
            <stop offset="0" stopColor="#f5b1bd" />
            <stop offset=".5" stopColor="#ffe2a0" />
            <stop offset="1" stopColor="#83d9dc" />
          </linearGradient>
          <filter id="sunGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="travelClip">
            <rect width={Math.max(0, progress * 1000)} height="126" />
          </clipPath>
        </defs>
        <path className="arc-base" d={ARC} />
        <path className="arc-travelled" d={ARC} clipPath="url(#travelClip)" />
        <circle className="moving-sun-glow" cx={sun.x} cy={sun.y} r="14" />
        <circle className="moving-sun" cx={sun.x} cy={sun.y} r="4.8" />
      </svg>

      {cities.map((city, index) => {
        const point = bezierPoint(solarPositions[index]);
        return (
          <button
            key={city.name}
            className={`solar-stop solar-stop-${index} ${index === activeCity ? "is-active" : ""}`}
            style={{ left: `${point.x / 10}%`, top: `${(point.y / 126) * 100}%` }}
            onClick={() => onSelect(index)}
            aria-label={`${city.name}, ${city.season}`}
            aria-current={index === activeCity ? "step" : undefined}
          >
            {index === 0 && <span className="horizon-sun sunrise" aria-hidden="true" />}
            {index === 2 && <span className="zenith-rays" aria-hidden="true" />}
            {index === 4 && <span className="horizon-sun sunset" aria-hidden="true" />}
            <span className="stop-dot" />
            <span className="stop-label">
              <span className="stop-city">{city.name}</span>
              <span className="stop-season">{city.season}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
