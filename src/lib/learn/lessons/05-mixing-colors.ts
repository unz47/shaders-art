import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "mixing-colors",
  title: { ja: "色を混ぜる", en: "Mixing colors" },
  summary: {
    ja: "mix とパレットで色を設計し、図形を背景に重ねる",
    en: "Design color with mix and palettes, and layer shapes over a background",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
