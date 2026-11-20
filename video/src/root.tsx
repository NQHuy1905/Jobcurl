import React from "react";
import { Composition } from "remotion";
import { DEMO_DURATION, Demo } from "./demo";

export const RemotionRoot: React.FC = () => (
  <Composition id="JobcurlDemo" component={Demo} durationInFrames={DEMO_DURATION} fps={30} width={1280} height={720} />
);
