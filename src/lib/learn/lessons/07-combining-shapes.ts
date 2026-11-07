import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "combining-shapes",
  title: { ja: "図形を組み合わせる", en: "Combining shapes" },
  summary: {
    ja: "四角と線分を加え、和・積・差で図形を組み合わせて絵を作る",
    en: "Add boxes and segments, and combine shapes with union, intersection and subtraction",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
