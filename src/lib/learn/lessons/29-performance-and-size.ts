import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "performance-and-size",
  title: { ja: "速く、小さく", en: "Fast and small" },
  summary: {
    ja: "重くなる理由を知って速くし、短く書くコツと読みやすさの釣り合いを学ぶ",
    en: "Learn what makes shaders slow, speed them up, and balance brevity with clarity",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
