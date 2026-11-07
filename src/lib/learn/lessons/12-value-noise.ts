import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "value-noise",
  title: { ja: "なめらかなノイズ", en: "Smooth noise" },
  summary: {
    ja: "乱数をなめらかにつないだノイズで、ゆらぐ形や地形の線を描く",
    en: "Interpolate random values into noise for wobbly shapes and terrain lines",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
