import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "tunnels",
  title: { ja: "トンネルと飛行", en: "Tunnels and flight" },
  summary: {
    ja: "2D と 3D のトンネルで、どこまでも進んでいく映像を作る",
    en: "Build endless flights with 2D and 3D tunnels",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
