import { useCallback, useRef, useState } from "react";
import PortfolioVoiceOrb from "./PortfolioVoiceOrb";

/**
 * A visual-only preview of the portfolio voice orb. It reuses the Ask-page
 * renderer without creating audio, microphone, or realtime resources.
 */
export default function HomepagePortfolioOrb() {
  const levelRef = useRef(0);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  return (
    <div className={`homepage-portfolio-orb${ready ? " is-ready" : ""}`}>
      <span
        className="homepage-portfolio-orb-fallback"
        aria-hidden="true"
      />
      <PortfolioVoiceOrb
        className="homepage-portfolio-orb-canvas"
        levelRef={levelRef}
        size={340}
        variant="intro"
        onReady={markReady}
      />
    </div>
  );
}
