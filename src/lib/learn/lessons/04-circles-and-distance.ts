import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "circles-and-distance",
  title: { ja: "円と距離", en: "Circles and distance" },
  summary: {
    ja: "中心からの距離で円やリングを描き、縁をなめらかにする",
    en: "Draw circles and rings from the distance to a center, with smooth edges",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
