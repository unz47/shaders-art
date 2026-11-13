import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "transforms",
  title: { ja: "座標を動かす", en: "Moving space" },
  summary: {
    ja: "図形ではなく座標を動かして、移動・回転・拡大をする",
    en: "Move, rotate and scale by transforming the coordinates instead of the shapes",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
