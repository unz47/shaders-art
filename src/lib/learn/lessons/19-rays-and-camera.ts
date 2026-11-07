import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "rays-and-camera",
  title: { ja: "レイとカメラ", en: "Rays and cameras" },
  summary: {
    ja: "点ごとに視線(レイ)を飛ばし、床や球を計算で描いてカメラを動かす",
    en: "Cast a ray per pixel, hit floors and spheres with math, and move a camera",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
