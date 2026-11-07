import { Composition } from "remotion";
import { ABOTFilm } from "./ABOTFilm";

export const RemotionRoot = () => (
  <Composition
    id="ABOTCinematic"
    component={ABOTFilm}
    durationInFrames={3600}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{}}
  />
);
