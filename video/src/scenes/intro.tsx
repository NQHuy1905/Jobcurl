import React from "react";
import { AbsoluteFill } from "remotion";
import { Em, Eyebrow, Logo, SceneFade, useIn } from "../components";
import { C, outfit } from "../theme";

// Original abstract shapes that spring in around the title.
const Shape: React.FC<{ style: React.CSSProperties; delay: number }> = ({ style, delay }) => {
  const p = useIn(delay, 14);
  return <div style={{ position: "absolute", transform: `scale(${p})`, ...style }} />;
};

export const Intro: React.FC = () => {
  const logo = useIn(0);
  const title = useIn(8);
  const sub = useIn(22);
  return (
    <SceneFade>
      <AbsoluteFill style={{ background: C.bg, fontFamily: outfit, alignItems: "center", justifyContent: "center" }}>
        <Shape delay={4} style={{ left: 90, top: 110, width: 120, height: 120, borderRadius: "50%", background: C.pink }} />
        <Shape delay={10} style={{ right: 110, top: 80, width: 190, height: 190, borderRadius: "50%", background: C.teal }} />
        <Shape delay={14} style={{ left: 70, bottom: 0, width: 170, height: 96, borderRadius: "85px 85px 0 0", background: C.yellow }} />
        <Shape delay={18} style={{ right: 80, bottom: 0, width: 120, height: 120, borderRadius: "100% 0 0 0", background: C.indigo }} />
        <Shape delay={22} style={{ right: 250, bottom: 40, width: 56, height: 56, borderRadius: "50%", background: C.orange }} />

        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, transform: `scale(${logo})`, opacity: logo }}>
            <Logo size={56} />
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.04em", color: C.ink }}>jobcurl</span>
          </div>
          <div style={{ marginTop: 34, display: "flex", justifyContent: "center", opacity: title }}>
            <Eyebrow>Job watch for job seekers</Eyebrow>
          </div>
          <h1 style={{ fontSize: 132, lineHeight: 0.96, letterSpacing: "-0.045em", fontWeight: 600, color: C.ink, margin: "20px 0 26px", opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
            Every opening.
            <br />
            <Em>Tracked.</Em>
          </h1>
          <p style={{ fontSize: 30, color: C.muted, margin: 0, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
            Watch careers pages · Get a Monday digest · Score your resume
          </p>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};
