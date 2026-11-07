import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "materials-and-atmosphere",
  title: { ja: "質感と空気", en: "Materials and atmosphere" },
  summary: {
    ja: "素材ごとの色・反射・霧・空で、1 つの場面を仕上げる",
    en: "Finish a scene with per-material color, reflections, fog and sky",
  },
  minutes: 60,
  goals: [],
  blocks: [],
};

export default lesson;
