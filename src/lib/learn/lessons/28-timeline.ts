import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "timeline",
  title: { ja: "時間で演出する", en: "Directing with time" },
  summary: {
    ja: "場面の切り替え・つなぎ・拍に合わせた動きで、デモの流れを作る",
    en: "Structure a demo with scenes, transitions and beat-synced motion",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
