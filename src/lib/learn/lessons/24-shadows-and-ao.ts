import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "shadows-and-ao",
  title: { ja: "影と奥行き", en: "Shadows and depth" },
  summary: {
    ja: "やわらかい影とアンビエントオクルージョンで、形を地面に落ち着かせる",
    en: "Ground your shapes with soft shadows and ambient occlusion",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
