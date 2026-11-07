import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "fbm",
  title: { ja: "重ねて自然に(fBm)", en: "Layering noise (fBm)" },
  summary: {
    ja: "ノイズを何層も重ねて、雲・山・炎のような自然の質感を作る",
    en: "Stack octaves of noise for natural textures like clouds, mountains and fire",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
