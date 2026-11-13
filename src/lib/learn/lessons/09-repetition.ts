import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "repetition",
  title: { ja: "くり返しとタイル", en: "Repetition and tiles" },
  summary: {
    ja: "fract と floor で画面をマス目に分け、模様をくり返す",
    en: "Split the screen into cells with fract and floor, and repeat patterns",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
