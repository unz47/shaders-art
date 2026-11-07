import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "raymarching",
  title: { ja: "レイマーチング", en: "Raymarching" },
  summary: {
    ja: "距離関数を少しずつたどって、3D の形を描く",
    en: "Step along distance functions to draw 3D shapes",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
