import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "domain-warping",
  title: { ja: "空間をゆがめる", en: "Domain warping" },
  summary: {
    ja: "ノイズで座標そのものをゆがめ、煙・大理石・流れる液体を作る",
    en: "Warp the coordinates themselves with noise to make smoke, marble and flowing liquid",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
