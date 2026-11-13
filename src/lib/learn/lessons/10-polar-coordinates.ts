import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "polar-coordinates",
  title: { ja: "極座標", en: "Polar coordinates" },
  summary: {
    ja: "角度と距離で考え、放射状の模様・花・渦・万華鏡を描く",
    en: "Think in angle and distance to draw rays, flowers, spirals and kaleidoscopes",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
