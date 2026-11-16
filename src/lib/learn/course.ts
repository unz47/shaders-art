import type { CoursePart, Lesson } from "./types";
import firstShader from "./lessons/01-first-shader";
import coordinates from "./lessons/02-coordinates";
import shapingFunctions from "./lessons/03-shaping-functions";
import circlesAndDistance from "./lessons/04-circles-and-distance";
import mixingColors from "./lessons/05-mixing-colors";
import timeAndMotion from "./lessons/06-time-and-motion";
import combiningShapes from "./lessons/07-combining-shapes";
import transforms from "./lessons/08-transforms";
import repetition from "./lessons/09-repetition";
import polarCoordinates from "./lessons/10-polar-coordinates";
import randomness from "./lessons/11-randomness";
import valueNoise from "./lessons/12-value-noise";
import fbm from "./lessons/13-fbm";
import domainWarping from "./lessons/14-domain-warping";
import voronoi from "./lessons/15-voronoi";
import sdf2d from "./lessons/16-sdf-2d";
import lightAndGlow from "./lessons/17-light-and-glow";
import mouseAndAttention from "./lessons/18-mouse-and-attention";
import raysAndCamera from "./lessons/19-rays-and-camera";
import raymarching from "./lessons/20-raymarching";
import normalsAndLighting from "./lessons/21-normals-and-lighting";
import shapes3d from "./lessons/22-shapes-3d";
import infiniteSpace from "./lessons/23-infinite-space";
import shadowsAndAo from "./lessons/24-shadows-and-ao";
import materialsAndAtmosphere from "./lessons/25-materials-and-atmosphere";
import fractals from "./lessons/26-fractals";
import tunnels from "./lessons/27-tunnels";
import timeline from "./lessons/28-timeline";
import performanceAndSize from "./lessons/29-performance-and-size";
import yourDemo from "./lessons/30-your-demo";

// 学習(/learn)のコース。0 から始めて、レイマーチングのデモを作って投稿できるところまでの 30 回。
// 1 回は 30〜60 分(読む・試す・課題を含めて)。回の番号はここでの並び順で決まる(ファイル名の番号と合わせておく)。
// レッスンのデータはサーバーだけで読み、見る人の言語に絞ってからブラウザに渡す(全部をブラウザに送らない)。

export const COURSE: CoursePart[] = [
  {
    id: "basics",
    title: { ja: "はじめの一歩", en: "First steps" },
    description: {
      ja: "色・座標・図形・動き。シェーダーの考え方の土台を作る",
      en: "Color, coordinates, shapes and motion: the foundations of thinking in shaders",
    },
    lessons: [
      firstShader,
      coordinates,
      shapingFunctions,
      circlesAndDistance,
      mixingColors,
      timeAndMotion,
      combiningShapes,
      transforms,
      repetition,
      polarCoordinates,
    ],
  },
  {
    id: "patterns",
    title: { ja: "模様とノイズ", en: "Patterns and noise" },
    description: {
      ja: "乱数・ノイズ・距離関数・光で、自然な質感と豊かな模様を作る",
      en: "Randomness, noise, distance functions and light for natural textures and rich patterns",
    },
    lessons: [randomness, valueNoise, fbm, domainWarping, voronoi, sdf2d, lightAndGlow, mouseAndAttention],
  },
  {
    id: "three-d",
    title: { ja: "3D の世界", en: "Into 3D" },
    description: {
      ja: "レイマーチングで、光と影のある 3D の場面を描く",
      en: "Draw lit, shadowed 3D scenes with raymarching",
    },
    lessons: [
      raysAndCamera,
      raymarching,
      normalsAndLighting,
      shapes3d,
      infiniteSpace,
      shadowsAndAo,
      materialsAndAtmosphere,
    ],
  },
  {
    id: "demos",
    title: { ja: "デモを作る", en: "Making demos" },
    description: {
      ja: "フラクタル・トンネル・演出・最適化を学び、自分のデモを仕上げる",
      en: "Fractals, tunnels, direction and optimization — then finish your own demo",
    },
    lessons: [fractals, tunnels, timeline, performanceAndSize, yourDemo],
  },
];

export const LESSONS: Lesson[] = COURSE.flatMap((part) => part.lessons);

/** 回の番号(1 から)と、その回が入っている部 */
export function findLesson(slug: string): { lesson: Lesson; number: number; part: CoursePart } | null {
  const index = LESSONS.findIndex((lesson) => lesson.slug === slug);
  const lesson = LESSONS[index];
  if (!lesson) return null;
  const part = COURSE.find((p) => p.lessons.includes(lesson));
  if (!part) return null;
  return { lesson, number: index + 1, part };
}
