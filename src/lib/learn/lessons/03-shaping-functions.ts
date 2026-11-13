import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "shaping-functions",
  title: { ja: "関数で形を作る", en: "Shaping functions" },
  summary: {
    ja: "step・smoothstep・abs などで数の形を変え、線やグラフを描く",
    en: "Bend numbers with step, smoothstep and abs, and draw lines and graphs",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
