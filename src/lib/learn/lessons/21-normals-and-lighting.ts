import type { Lesson } from "../types";

// まだ本文の無い回(目次に「準備中」と出る)
const lesson: Lesson = {
  slug: "normals-and-lighting",
  title: { ja: "法線と光", en: "Normals and lighting" },
  summary: {
    ja: "表面の向き(法線)を求め、拡散光・反射光・環境光で立体感を出す",
    en: "Find surface normals and shade with diffuse, specular and ambient light",
  },
  minutes: 55,
  goals: [],
  blocks: [],
};

export default lesson;
