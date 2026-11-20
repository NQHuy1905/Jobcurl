import React from "react";
import { Avatar, Em, Pill, SceneShell, Window, useIn } from "../components";
import { C } from "../theme";

const Line: React.FC<{ delay: number; children: React.ReactNode; strong?: boolean }> = ({ delay, children, strong }) => {
  const p = useIn(delay);
  return (
    <div style={{ fontSize: strong ? 21 : 20, fontWeight: strong ? 600 : 400, color: strong ? C.ink : C.text, marginTop: strong ? 18 : 6, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
      {children}
    </div>
  );
};

export const Digest: React.FC = () => {
  const chip = useIn(70, 12);
  return (
    <SceneShell
      step="03"
      label="Weekly digest"
      title={
        <>
          Monday, in your <Em>inbox.</Em>
        </>
      }
      sub="One email, and only when something new has opened."
    >
      <Window>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar letter="J" bg={C.orange} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>Jobcurl</div>
            <div style={{ fontSize: 15, color: C.muted }}>to you@example.com</div>
          </div>
          <span style={{ transform: `scale(${chip})` }}>
            <Pill bg={C.ink} fg="#fff" size={16}>Mon 09:00</Pill>
          </span>
        </div>
        <div style={{ height: 1, background: C.line, margin: "20px 0 14px" }} />
        <Line delay={14} strong>
          New job openings: Northwind, Lumen
        </Line>
        <Line delay={26} strong>
          Northwind has open position:
        </Line>
        <Line delay={34}>– Senior Backend Engineer (Remote)</Line>
        <Line delay={42}>– Product Designer (Berlin)</Line>
        <Line delay={54} strong>
          Lumen has open position:
        </Line>
        <Line delay={62}>– Machine Learning Engineer (Hanoi)</Line>
      </Window>
    </SceneShell>
  );
};
