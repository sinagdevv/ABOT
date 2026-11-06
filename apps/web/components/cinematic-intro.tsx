"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand, BrandMark } from "./brand";

const COMPLETE_KEY = "abot_intro_complete";

export function CinematicIntro() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const replay = () => {
      setPhase(0);
      setVisible(true);
      window.setTimeout(() => setPhase(4), 80);
    };
    window.addEventListener("abot-replay-intro", replay);
    if (!reduce && window.localStorage.getItem(COMPLETE_KEY) !== "1") {
      setVisible(true);
      const timers = [
        window.setTimeout(() => setPhase(1), 280),
        window.setTimeout(() => setPhase(2), 820),
        window.setTimeout(() => setPhase(3), 1480),
        window.setTimeout(() => setPhase(4), 2240),
        window.setTimeout(() => finish(), 3300),
      ];
      return () => { timers.forEach(window.clearTimeout); window.removeEventListener("abot-replay-intro", replay); };
    }
    return () => window.removeEventListener("abot-replay-intro", replay);
  }, []);

  function finish() {
    window.localStorage.setItem(COMPLETE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;
  return <div className={`cinematic-intro cinematic-phase-${phase}`} role="presentation">
    <button type="button" onClick={finish} className="cinematic-skip" aria-label="Skip ABOT introduction">Skip intro <ArrowUpRight size={14} /></button>
    <div className="cinematic-field" aria-hidden="true"><span className="cinematic-ring ring-one" /><span className="cinematic-ring ring-two" /><span className="cinematic-path path-one" /><span className="cinematic-path path-two" /><span className="cinematic-path path-three" /><i className="cinematic-node node-origin" /><i className="cinematic-node node-agent" /><i className="cinematic-node node-policy" /><i className="cinematic-node node-arrival" /><span className="cinematic-signal signal-one" /><span className="cinematic-signal signal-two" /></div>
    <div className="cinematic-lockup"><BrandMark tone="mint" size="lg" className="cinematic-mark" /><div className="cinematic-wordmark"><Brand tone="warm" /><p>Making every peso reach its purpose.</p></div></div>
    <p className="cinematic-caption">Connection <span>→</span> Authorization <span>→</span> Arrival</p>
  </div>;
}
