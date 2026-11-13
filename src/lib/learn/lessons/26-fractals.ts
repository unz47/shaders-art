import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "fractals",
  title: { ja: "フラクタル", en: "Fractals" },
  summary: {
    ja: "マンデルブロ集合・ジュリア集合・折りたたみで、どこまでも細かい形を作る",
    en: "Create endless detail with the Mandelbrot set, Julia sets and folding",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
