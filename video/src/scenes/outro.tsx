import React from "react";
import { AbsoluteFill } from "remotion";
import { Em, Eyebrow, Logo, SceneFade, useIn } from "../components";
import { C, outfit } from "../theme";

export const Outro: React.FC = () => {
  const a = useIn(2);
  const b = useIn(14);
  const c = useIn(26);
  return (
    <SceneFade>
      <AbsoluteFill
        style={{
          fontFamily: outfit,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: C.onDark,
          background: `radial-gradient(60% 90% at 50% 125%, rgba(255,122,26,0.42), transparent 70%), ${C.dark}`,
        }}
      >
        <div style={{ opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
          <Eyebrow color={C.onDarkMuted}>Weekly digest</Eyebrow>
        </div>
        <h1 style={{ fontSize: 128, lineHeight: 0.98, letterSpacing: "-0.045em", fontWeight: 600, margin: "26px 0 22px", opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>
          Never miss an <Em>opening.</Em>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: c, transform: `translateY(${(1 - c) * 20}px)` }}>
          <Logo size={40} />
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.04em" }}>jobcurl</span>
          <span style={{ fontSize: 26, color: C.onDarkMuted, marginLeft: 12 }}>Paste · Track · Match</span>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};
