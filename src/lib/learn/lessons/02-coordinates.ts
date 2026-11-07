import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "coordinates",
  title: { ja: "座標を知る", en: "Knowing where you are" },
  summary: {
    ja: "uv と p の 2 つの座標で、画面の上の場所を自由に扱う",
    en: "Work freely with positions on the screen using the two coordinates, uv and p",
  },
  minutes: 45,
  goals: [],
  blocks: [],
};

export default lesson;
