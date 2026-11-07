import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "sdf-2d",
  title: { ja: "距離で描く(2D SDF)", en: "Drawing with distance (2D SDF)" },
  summary: {
    ja: "符号付き距離関数で図形を描き、なめらかな結合・縁取り・影を作る",
    en: "Draw with signed distance functions: smooth unions, outlines and shadows",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
