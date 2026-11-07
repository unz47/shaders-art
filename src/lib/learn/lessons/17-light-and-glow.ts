import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "light-and-glow",
  title: { ja: "光と仕上げ", en: "Light and finishing" },
  summary: {
    ja: "光のにじみ・加算・トーンマッピング・ビネットで絵を仕上げる",
    en: "Finish images with glow, additive light, tone mapping and vignettes",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
