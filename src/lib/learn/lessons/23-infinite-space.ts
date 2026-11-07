import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "infinite-space",
  title: { ja: "無限の空間と変形", en: "Infinite space and deformation" },
  summary: {
    ja: "空間のくり返し・ねじれ・曲げで、どこまでも続く景色を作る",
    en: "Build endless scenes with domain repetition, twists and bends",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
