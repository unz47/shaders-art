import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "your-demo",
  title: { ja: "デモを仕上げて発表する", en: "Finish and share your demo" },
  summary: {
    ja: "構図・色・動きを整え、作品として投稿・書き出しする",
    en: "Polish composition, color and motion, then publish and export your work",
  },
  minutes: 60,
  goals: [],
  blocks: [],
};

export default lesson;
