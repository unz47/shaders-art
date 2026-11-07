import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "time-and-motion",
  title: { ja: "時間で動かす", en: "Time and motion" },
  summary: {
    ja: "time と sin で動きを作り、周期・速さ・イージングを操る",
    en: "Animate with time and sin, controlling period, speed and easing",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
