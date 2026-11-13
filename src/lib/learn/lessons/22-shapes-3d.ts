import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "shapes-3d",
  title: { ja: "3D の形を組み立てる", en: "Building 3D shapes" },
  summary: {
    ja: "箱・トーラス・円柱を組み合わせ、なめらかにつないで物を作る",
    en: "Combine boxes, tori and cylinders, and blend them smoothly into objects",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
