import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, outfit, serif, shadow } from "./theme";

/** 0 -> 1 spring, optionally delayed (in frames). Smooth, no bounce by default. */
export const useIn = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame, fps, delay, config: { damping } });
};

/** Fades a whole scene in and out so cuts between scenes are soft. */
export const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** The one serif-italic accent word inside a headline. */
export const serifAccent: React.CSSProperties = { fontFamily: serif, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.01em", fontSize: "1.1em" };

export const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={serifAccent}>{children}</span>;

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.muted }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color }}>
    <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.orange }} />
    {children}
  </div>
);

export const Logo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <circle cx="12" cy="16" r="10" fill={C.orange} />
    <circle cx="20" cy="16" r="10" fill={C.indigo} style={{ mixBlendMode: "multiply" }} />
  </svg>
);

export const Avatar: React.FC<{ letter: string; bg: string; fg?: string; size?: number }> = ({ letter, bg, fg = C.ink, size = 44 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.32, background: bg, color: fg, display: "grid", placeItems: "center", fontWeight: 700, fontSize: size * 0.46, flex: "none" }}>
    {letter}
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; bg: string; fg: string; size?: number }> = ({ children, bg, fg, size = 15 }) => (
  <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, background: bg, color: fg, fontSize: size, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>
);

/** App-style browser window the mock UI lives in. */
export const Window: React.FC<{ children: React.ReactNode; height?: number; dark?: boolean }> = ({ children, height = 440, dark = false }) => {
  const p = useIn(6);
  return (
    <div
      style={{
        width: 660,
        height,
        borderRadius: 28,
        background: dark ? C.dark : C.surface,
        boxShadow: shadow,
        overflow: "hidden",
        transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + 0.04 * p})`,
        opacity: p,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 46, display: "flex", alignItems: "center", gap: 8, padding: "0 18px", background: dark ? "#1C1C1F" : C.surface2, flex: "none" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ marginLeft: 14, padding: "3px 16px", borderRadius: 999, background: dark ? "#2A2A2E" : "#fff", color: dark ? C.onDarkMuted : C.muted, fontSize: 14 }}>
          localhost:3010
        </div>
      </div>
      <div style={{ flex: 1, padding: 28, position: "relative" }}>{children}</div>
    </div>
  );
};

/** Two-column scene layout: step label + big headline on the left, a mock window on the right. */
export const SceneShell: React.FC<{
  step: string;
  label: string;
  title: React.ReactNode;
  sub: string;
  children: React.ReactNode;
}> = ({ step, label, title, sub, children }) => {
  const p = useIn(0);
  return (
    <SceneFade>
      <AbsoluteFill style={{ background: C.bg, fontFamily: outfit, flexDirection: "row", alignItems: "center", padding: "0 72px", gap: 52 }}>
        <div style={{ width: 430, flex: "none", transform: `translateY(${(1 - p) * 26}px)`, opacity: p }}>
          <Eyebrow>
            {step} / {label}
          </Eyebrow>
          <h1 style={{ fontSize: 78, lineHeight: 0.98, letterSpacing: "-0.04em", fontWeight: 600, margin: "24px 0 22px", color: C.ink }}>{title}</h1>
          <p style={{ fontSize: 26, lineHeight: 1.4, color: C.muted, margin: 0 }}>{sub}</p>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>{children}</div>
      </AbsoluteFill>
    </SceneFade>
  );
};
