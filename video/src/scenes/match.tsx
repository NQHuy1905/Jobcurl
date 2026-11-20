import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Em, Eyebrow, Pill, SceneShell, Window, serifAccent, useIn } from "../components";
import { C, outfit } from "../theme";

type Job = { title: string; score: number; decision: string; scoredAt: number; from: number; to: number; tone: "high" | "mid" | "low" };

// `from` is the order jobs finish scoring in; `to` is the final rank (best score first).
const JOBS: Job[] = [
  { title: "Platform Engineer", score: 5, decision: "Borderline", scoredAt: 30, from: 0, to: 2, tone: "mid" },
  { title: "Senior Backend Engineer", score: 9, decision: "Strong shortlist", scoredAt: 40, from: 1, to: 0, tone: "high" },
  { title: "Data Analyst", score: 3, decision: "Reject", scoredAt: 50, from: 2, to: 3, tone: "low" },
  { title: "ML Engineer", score: 7, decision: "Shortlist", scoredAt: 60, from: 3, to: 1, tone: "mid" },
];

const TONE = {
  high: { bg: "#0E3B22", fg: "#4ADE80" },
  mid: { bg: "#3A2A07", fg: "#FBBF24" },
  low: { bg: "#3F1512", fg: "#FF8A80" },
};
const ROW_H = 66;
const GAP = 10;
const SORT_AT = 78;

const Row: React.FC<{ job: Job; index: number }> = ({ job, index }) => {
  const frame = useCurrentFrame();
  const appear = useIn(14 + index * 4);
  const sort = useIn(SORT_AT, 24);
  const y = interpolate(sort, [0, 1], [job.from, job.to]) * (ROW_H + GAP);
  const scored = frame >= job.scoredAt;
  const shown = Math.round(interpolate(frame, [job.scoredAt, job.scoredAt + 10], [0, job.score], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const tone = TONE[job.tone];
  const sorted = frame >= SORT_AT + 14;

  return (
    <div
      style={{
        position: "absolute", left: 0, right: 0, top: 0, height: ROW_H,
        transform: `translateY(${y}px)`, opacity: appear,
        display: "flex", alignItems: "center", gap: 14, padding: "0 16px",
        borderRadius: 20, background: C.darkRow, border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span style={{ width: 20, textAlign: "center", fontSize: 15, fontWeight: 600, color: C.onDarkMuted }}>{sorted ? job.to + 1 : ""}</span>
      <span style={{ minWidth: 68, textAlign: "center", padding: "4px 10px", borderRadius: 14, fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", background: scored ? tone.bg : "#151517", color: scored ? tone.fg : C.onDarkMuted }}>
        {scored ? shown : "–"}
        {scored && <span style={{ fontSize: 12, opacity: 0.8 }}>/10</span>}
      </span>
      <span style={{ flex: 1, fontSize: 21, fontWeight: 600, color: C.onDark }}>{job.title}</span>
      {scored && (
        <Pill bg={tone.bg} fg={tone.fg} size={14}>
          {job.decision}
        </Pill>
      )}
    </div>
  );
};

export const Match: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [26, 66], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scoring = frame >= 20 && frame < SORT_AT - 4;

  return (
    <SceneShell
      step="04"
      label="Resume match"
      title={
        <>
          Score your <Em>resume.</Em>
        </>
      }
      sub="Every new opening ranked, best match first."
    >
      <Window dark height={560}>
        <Eyebrow color={C.onDarkMuted}>Resume match</Eyebrow>
        <div style={{ fontFamily: outfit, fontSize: 46, fontWeight: 600, letterSpacing: "-0.04em", color: C.onDark, margin: "10px 0 16px", lineHeight: 1 }}>
          Best match, <span style={serifAccent}>first.</span>
        </div>
        <div style={{ position: "relative", height: 26, marginBottom: 16 }}>
          {scoring && (
            <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", background: "#151517", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(progress / 4) * 100}%`, background: C.orange, opacity: 0.55 }} />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 500, color: C.onDark }}>
                Scoring {Math.floor(progress)}/4…
              </div>
            </div>
          )}
        </div>
        <div style={{ position: "relative", height: 4 * ROW_H + 3 * GAP }}>
          {JOBS.map((job, i) => (
            <Row key={job.title} job={job} index={i} />
          ))}
        </div>
      </Window>
    </SceneShell>
  );
};
