import React from "react";
import { Avatar, Em, Pill, SceneShell, Window, useIn } from "../components";
import { C } from "../theme";

const Row: React.FC<{ title: string; place: string; delay: number; last?: boolean }> = ({ title, place, delay, last }) => {
  const p = useIn(delay);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "14px 20px", borderBottom: last ? "none" : `1px solid ${C.line}`, opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
      <span style={{ color: C.muted, fontSize: 22 }}>–</span>
      <span style={{ fontSize: 22, fontWeight: 600, color: C.ink }}>{title}</span>
      <span style={{ fontSize: 17, color: C.muted }}>{place}</span>
    </div>
  );
};

const Day: React.FC<{ date: string; count: string; delay: number; children: React.ReactNode }> = ({ date, count, delay, children }) => {
  const p = useIn(delay);
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, opacity: p }}>
        <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: C.ink }}>{date}</span>
        <Pill bg={C.successBg} fg={C.successFg}>{count}</Pill>
      </div>
      <div style={{ borderRadius: 20, background: C.surface, boxShadow: "0 10px 30px rgba(20,20,20,0.08)", overflow: "hidden" }}>{children}</div>
    </div>
  );
};

export const History: React.FC = () => (
  <SceneShell
    step="02"
    label="Update history"
    title={
      <>
        A history, <Em>day</Em> by day.
      </>
    }
    sub="Only newly posted roles are added, so you see exactly what changed."
  >
    <Window>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <Avatar letter="N" bg={C.teal} size={40} />
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", color: C.ink }}>Northwind</span>
      </div>
      <Day date="Thursday, Nov 19" count="2 new" delay={14}>
        <Row title="Senior Backend Engineer" place="Remote" delay={24} />
        <Row title="Product Designer" place="Berlin" delay={36} last />
      </Day>
      <Day date="Thursday, Nov 12" count="1 new" delay={52}>
        <Row title="Data Analyst" place="London" delay={62} last />
      </Day>
    </Window>
  </SceneShell>
);
