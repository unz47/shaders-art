import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "voronoi",
  title: { ja: "セルの模様(ボロノイ)", en: "Cellular patterns (Voronoi)" },
  summary: {
    ja: "近くの点までの距離で、細胞・ひび割れ・ステンドグラスの模様を作る",
    en: "Use the distance to nearby points for cells, cracks and stained glass",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
