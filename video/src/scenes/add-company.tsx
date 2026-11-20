import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Avatar, Em, Pill, SceneShell, Window, useIn } from "../components";
import { C } from "../theme";

const URL_TEXT = "https://northwind.example/careers";

export const AddCompany: React.FC = () => {
  const frame = useCurrentFrame();

  const typed = Math.floor(interpolate(frame, [20, 80], [0, URL_TEXT.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typing = frame >= 20 && frame < 84;
  const cursorOn = typing && Math.floor(frame / 8) % 2 === 0;
  const press = interpolate(frame, [88, 92, 98], [1, 0.93, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const row = useIn(100);
  const done = frame >= 124;
  const doneIn = useIn(124, 14);

  return (
    <SceneShell
      step="01"
      label="Add a company"
      title={
        <>
          Paste a <Em>careers</Em> page.
        </>
      }
      sub="Drop in any company website. Jobcurl finds every open role."
    >
      <Window>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Website or careers page</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, height: 52, borderRadius: 16, background: C.surface2, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 20, color: C.text, overflow: "hidden", whiteSpace: "nowrap" }}>
            {URL_TEXT.slice(0, typed)}
            <span style={{ width: 2, height: 24, background: cursorOn ? C.ink : "transparent", marginLeft: 2 }} />
          </div>
          <div style={{ height: 52, padding: "0 24px", borderRadius: 999, background: C.ink, color: "#fff", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 500, transform: `scale(${press})`, flex: "none" }}>
            Add and scan
          </div>
        </div>

        <div style={{ marginTop: 36, opacity: row, transform: `translateY(${(1 - row) * 24}px)` }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Companies</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 20, background: C.surface, boxShadow: "0 10px 30px rgba(20,20,20,0.10)" }}>
            <Avatar letter="N" bg={C.teal} />
            <div style={{ flex: 1, fontSize: 22, fontWeight: 600, color: C.ink }}>Northwind</div>
            {done ? (
              <span style={{ transform: `scale(${doneIn})` }}>
                <Pill bg={C.surface2} fg={C.muted} size={16}>9</Pill>
              </span>
            ) : (
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `3px solid ${C.line}`, borderTopColor: C.ink, transform: `rotate(${frame * 14}deg)` }} />
            )}
          </div>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, fontSize: 18, color: C.muted, opacity: done ? doneIn : 0 }}>
            First scan complete <Pill bg={C.successBg} fg={C.successFg}>9 new</Pill>
          </div>
        </div>
      </Window>
    </SceneShell>
  );
};
