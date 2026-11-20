import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { AddCompany } from "./scenes/add-company";
import { Digest } from "./scenes/digest";
import { History } from "./scenes/history";
import { Intro } from "./scenes/intro";
import { Match } from "./scenes/match";
import { Outro } from "./scenes/outro";
import { C } from "./theme";

// Scene lengths in frames at 30 fps.
export const SCENES = { intro: 75, add: 140, history: 120, digest: 120, match: 150, outro: 80 } as const;
export const DEMO_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const Demo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Series>
      <Series.Sequence durationInFrames={SCENES.intro} premountFor={30}>
        <Intro />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.add} premountFor={30}>
        <AddCompany />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.history} premountFor={30}>
        <History />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.digest} premountFor={30}>
        <Digest />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.match} premountFor={30}>
        <Match />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.outro} premountFor={30}>
        <Outro />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
