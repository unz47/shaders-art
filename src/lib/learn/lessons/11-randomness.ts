import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "randomness",
  title: { ja: "乱数をつくる", en: "Making randomness" },
  summary: {
    ja: "ハッシュ関数で疑似乱数を作り、マスごとのばらつきやトルシェ模様を描く",
    en: "Build pseudo-random numbers with hash functions for per-cell variety and Truchet tiles",
  },
  minutes: 50,
  goals: [],
  blocks: [],
};

export default lesson;
