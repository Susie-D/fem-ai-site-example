import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cities } from "./cities";
import { SolarNavigation } from "./components/SolarNavigation";
import { WorldScene } from "./components/WorldScene";

const CITY_STATES = 5;
const TOTAL_STATES = cities.length * CITY_STATES;

export default function App() {
  const journeyRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeCity, setActiveCity] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const journey = journeyRef.current;
      if (!journey) return;
      const max = journey.offsetHeight - window.innerHeight;
      const next = Math.min(1, Math.max(0, -journey.getBoundingClientRect().top / Math.max(1, max)));
      setProgress(next);
      setActiveCity(Math.min(cities.length - 1, Math.floor(next * cities.length)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  const goToCity = useCallback((index: number) => {
    const journey = journeyRef.current;
    if (!journey) return;
    const range = journey.offsetHeight - window.innerHeight;
    const inset = 0.006;
    const targetProgress = Math.min(1, index / cities.length + inset);
    scrollTo({
      top: journey.offsetTop + range * targetProgress,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, []);

  const localProgress = Math.min(0.999, (progress * cities.length) % 1);

  return (
    <main>
      <section
        id="journey"
        ref={journeyRef}
        className="journey"
        style={{ height: `${TOTAL_STATES * 100}vh` }}
        aria-label="One day and one year across five cities"
      >
        <div className="stage" style={{ "--accent": cities[activeCity].accent } as React.CSSProperties}>
          <WorldScene
            activeCity={activeCity}
            cityProgress={localProgress}
            journeyProgress={progress}
            onCitySelect={goToCity}
            reducedMotion={Boolean(reducedMotion)}
          />

          <header className="masthead">
            <a className="wordmark" href="#journey" aria-label="One Turning World, return to beginning">
              <span>ONE</span>
              <span>TURNING</span>
              <span>WORLD</span>
            </a>
            <p className="coordinates" aria-hidden="true">
              {Math.abs(cities[activeCity].lat).toFixed(2)}°{cities[activeCity].lat >= 0 ? "N" : "S"}
              <span />
              {Math.abs(cities[activeCity].lng).toFixed(2)}°{cities[activeCity].lng >= 0 ? "E" : "W"}
            </p>
          </header>

          <div className="editorial-copy" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={cities[activeCity].name}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="city-kicker">{cities[activeCity].country}</p>
                <h1>{cities[activeCity].name}</h1>
                <p className="city-copy">{cities[activeCity].copy}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="drag-note">Drag the world</p>

          <SolarNavigation progress={progress} activeCity={activeCity} onSelect={goToCity} />
          <div className="edge-progress" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </section>
    </main>
  );
}
