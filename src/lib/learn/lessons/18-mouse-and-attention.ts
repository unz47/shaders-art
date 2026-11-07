import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "mouse-and-attention",
  title: { ja: "触って動く", en: "Touch and response" },
  summary: {
    ja: "mouse と attention で、見る人の操作に反応する作品を作る",
    en: "Make works that respond to the viewer with mouse and attention",
  },
  minutes: 45,
  goals: [],
  blocks: [],
};

export default lesson;
