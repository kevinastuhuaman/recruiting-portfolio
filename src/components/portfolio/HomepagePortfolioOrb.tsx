import { useEffect, useRef, useState } from "react";
import PortfolioVoiceOrb from "./PortfolioVoiceOrb";

/**
 * A visual-only preview of the portfolio voice orb. It reuses the Ask-page
 * renderer without creating audio, microphone, or realtime resources.
 */
export default function HomepagePortfolioOrb() {
  const levelRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  return (
    <div className={`homepage-portfolio-orb${ready ? " is-ready" : ""}`}>
      <img
        className="homepage-portfolio-orb-fallback"
        src="/assets/portfolio-orb-static.png"
        width="600"
        height="602"
        loading="lazy"
        decoding="async"
        alt=""
      />
      <PortfolioVoiceOrb
        className="homepage-portfolio-orb-canvas"
        levelRef={levelRef}
        size={340}
        variant="intro"
      />
    </div>
  );
}
