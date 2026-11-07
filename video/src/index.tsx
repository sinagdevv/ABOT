import { Composition, registerRoot } from "remotion";
import { Film } from "./Film";

registerRoot(() => <Composition id="ABOTHackathonFilm" component={Film} durationInFrames={3600} fps={30} width={1920} height={1080} />);
