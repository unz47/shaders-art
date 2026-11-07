import type { Lesson } from "../types";

// コードの断片をつないで 1 つのコードにする。断片ごとに前後の空行と共通の字下げを取り、空行 1 つをはさんで並べる
// (何度も出てくる補助の関数を 1 か所に書くため。できあがるコードはどれもそれだけで完結している)
function joinCode(...parts: string[]): string {
  return parts
    .map((part) => {
      const lines = part.split("\n");
      while (lines.length > 0 && (lines[0] ?? "").trim() === "") lines.shift();
      while (lines.length > 0 && (lines.at(-1) ?? "").trim() === "") lines.pop();
      const indents = lines.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length);
      const common = indents.length > 0 ? Math.min(...indents) : 0;
      return lines.map((line) => (line.trim() === "" ? "" : line.slice(common))).join("\n");
    })
    .join("\n\n");
}

// この回の playground で育てていく「月夜の湖」の共通部分
const LAKE_HEAD = `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  //ja: 奥行き k の山の稜線の高さ(k が大きいほど手前)
  //en: the ridge height of mountain layer k (larger k is closer)
  float ridge(float x, float k) {
    return 0.3 * noise(vec2(x * (1.2 + k) + k * 7.0, k)) + 0.06 * noise(vec2(x * 5.0 + k * 3.0, k + 2.0)) - k * 0.12 + k * 0.16 * smoothstep(0.3, 1.4, x);
  }
`;

const SEGMENT = `
  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }
`;

// 明暗を整えたあとの湖(第 2・3 の playground)
const LAKE_SCENE = `
  vec3 scene(vec2 p, vec2 moonPos, float horizon) {
    float px = 2.0 / resolution.y;
    vec3 col = mix(vec3(0.16, 0.2, 0.36), vec3(0.01, 0.015, 0.05), smoothstep(horizon, 1.0, p.y));
    vec2 g = p * 30.0;
    float st = step(0.97, hash21(floor(g))) * (1.0 - smoothstep(0.0, 0.12, length(fract(g) - 0.5)));
    col += vec3(0.8, 0.85, 1.0) * st * smoothstep(horizon + 0.2, 0.9, p.y);
    float md = length(p - moonPos);
    col += vec3(0.9, 0.85, 0.7) * exp(-md * 3.0) * 0.5;
    col = mix(col, vec3(1.0, 0.97, 0.88), 1.0 - smoothstep(0.12 - px, 0.12 + px, md));
    for (int i = 0; i < 3; i++) {
      float k = float(i);
      float h = horizon + 0.04 + ridge(p.x, k);
      vec3 mc = mix(vec3(0.1, 0.13, 0.25), vec3(0.005, 0.008, 0.02), k / 2.0);
      col = mix(col, mc, 1.0 - smoothstep(h - px, h + px, p.y));
    }
    return col;
  }
`;

const GRADE = `
  vec3 grade(vec3 col, vec2 uv) {
    //ja: 1. トーンマッピング(明るさを 0〜1 になめらかに収める)
    //en: 1. tone mapping: squeeze brightness smoothly into 0–1
    col = 1.0 - exp(-col * 1.4);
    //ja: 2. 彩度。1.0 より大きいと鮮やかに
    //en: 2. saturation: above 1.0 is more vivid
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, 1.3);
    //ja: 3. 暗いところを青く、明るいところを暖かく
    //en: 3. cool the shadows, warm the highlights
    col *= mix(vec3(0.85, 0.95, 1.2), vec3(1.15, 1.0, 0.8), smoothstep(0.0, 0.6, luma));
    //ja: 4. ビネット(画面の端を暗く)
    //en: 4. vignette: darken the edges
    col *= 1.0 - 0.7 * dot(uv - 0.5, uv - 0.5);
    //ja: 5. ガンマ補正
    //en: 5. gamma correction
    col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
    //ja: 6. コントラスト(S 字の曲線で、暗いところをより暗く、明るいところをより明るく)
    //en: 6. contrast: an S-curve that deepens darks and lifts lights
    col = mix(col, col * col * (3.0 - 2.0 * col), 0.6);
    //ja: 7. グレイン(ごく弱いざらつきで、色の段差を目立たなくする)
    //en: 7. grain: a faint noise that hides color banding
    col += (hash21(uv * 1000.0 + fract(time)) - 0.5) * 0.02;
    return col;
  }
`;

// 動きを足した湖(第 4・5 の playground)。AURORA の印のところに、第 5 の playground だけオーロラを入れる
function lakeSceneWithMotion(aurora: boolean): string {
  return `
    vec3 scene(vec2 p, vec2 moonPos, float horizon) {
      float px = 2.0 / resolution.y;
      vec3 col = mix(vec3(0.16, 0.2, 0.36), vec3(0.01, 0.015, 0.05), smoothstep(horizon, 1.0, p.y));
      vec2 g = p * 30.0;
      float st = step(0.97, hash21(floor(g))) * (1.0 - smoothstep(0.0, 0.12, length(fract(g) - 0.5)));
      //ja: 速く小さい動き: 星のまたたき
      //en: fast, small motion: twinkling stars
      float tw = 0.6 + 0.4 * sin(time * 5.0 + hash21(floor(g) + 3.0) * 6.2832);
      col += vec3(0.8, 0.85, 1.0) * st * tw * smoothstep(horizon + 0.2, 0.9, p.y);
      float md = length(p - moonPos);
      col += vec3(0.9, 0.85, 0.7) * exp(-md * 3.0) * 0.5;
      col = mix(col, vec3(1.0, 0.97, 0.88), 1.0 - smoothstep(0.12 - px, 0.12 + px, md));
      //ja: アクセント: 7 秒に 1 回、0.6 秒だけ流れ星
      //en: an accent: a shooting star for 0.6 seconds, once every 7 seconds
      float fly = mod(time - 4.0, 7.0) / 0.6;
      if (fly < 1.0) {
        float e = 1.0 - (1.0 - fly) * (1.0 - fly);
        vec2 a = vec2(0.1, 0.85);
        vec2 b = vec2(0.9, 0.5);
        float d = sdSegment(p, mix(a, b, max(e - 0.2, 0.0)), mix(a, b, e));
        col += vec3(1.0, 0.95, 0.85) * exp(-d * 250.0) * (1.0 - fly);
      }${
        aurora
          ? `
      //ja: attention: Gallery でホバーしている間だけ、オーロラが現れる
      //en: attention: an aurora appears only while hovered in the Gallery
      float ay = 0.55 + 0.08 * sin(p.x * 2.5 + time * 0.4) + 0.06 * noise(vec2(p.x * 3.0, time * 0.2));
      float curtain = exp(-max(p.y - ay, 0.0) * 5.0) * smoothstep(ay - 0.3, ay, p.y);
      curtain *= 0.5 + 0.5 * noise(vec2(p.x * 14.0, time * 0.6));
      vec3 aurora = mix(vec3(0.1, 1.0, 0.55), vec3(0.55, 0.3, 1.0), smoothstep(ay, ay + 0.3, p.y));
      col += aurora * curtain * 0.45 * attention;`
          : ""
      }
      for (int i = 0; i < 3; i++) {
        float k = float(i);
        float h = horizon + 0.04 + ridge(p.x, k);
        vec3 mc = mix(vec3(0.1, 0.13, 0.25), vec3(0.005, 0.008, 0.02), k / 2.0);
        col = mix(col, mc, 1.0 - smoothstep(h - px, h + px, p.y));
      }
      return col;
    }
  `;
}

// 第 4・5 の playground の render。fadeIn が true なら、始まりのフェードインを入れる
function lakeRenderWithMotion(fadeIn: boolean): string {
  return `
    vec4 render(vec2 uv, vec2 p) {
      float horizon = -0.35;
      vec2 moonPos = vec2(-0.45, 0.4);
      vec3 col;
      if (p.y > horizon) {
        col = scene(p, moonPos, horizon);
      } else {
        vec2 q = vec2(p.x, 2.0 * horizon - p.y);
        q.x += 0.01 * sin(p.y * 80.0 + time * 2.0) * (horizon - p.y);
        col = scene(q, moonPos, horizon) * 0.35;
        float path = exp(-abs(q.x - moonPos.x) * 9.0) * (0.5 + 0.5 * sin(p.y * 140.0 + time * 3.0));
        col += vec3(0.9, 0.85, 0.7) * path * 0.35 * smoothstep(-1.0, horizon, p.y);
      }
      //ja: ゆっくり大きな動き: 水面の上を流れるもや
      //en: slow, large motion: mist drifting over the water
      float mist = noise(vec2(p.x * 1.5 - time * 0.05, p.y * 5.0)) * exp(-abs(p.y - horizon - 0.03) * 10.0);
      col += vec3(0.25, 0.3, 0.45) * mist * 0.3;${
        fadeIn
          ? `
      //ja: 始まりのフェードイン。4 秒かけて明るくなる
      //en: an opening fade-in that takes 4 seconds
      col *= smoothstep(0.0, 4.0, time);`
          : ""
      }
      return vec4(grade(col, uv), 1.0);
    }
  `;
}

// 課題 1(サムネで映える 1 コマ)の共通部分
const FLOWER_HEAD = `
  #define PI 3.14159265
  #define TAU 6.28318531

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
  }

  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
  }
`;

// 課題 2(色の仕上げだけで夕方に)の、場面の部分
const DUNES_HEAD = `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  //ja: 奥行き k の砂丘の高さ
  //en: the height of dune layer k
  float dune(float x, float k) {
    return 0.05 - k * 0.2 + 0.12 * sin(x * (1.3 + k * 0.7) + k * 2.0 + time * 0.03) + 0.05 * noise(vec2(x * 3.0 + k * 5.0, k));
  }
`;

const DUNES_RENDER = `
  vec4 render(vec2 uv, vec2 p) {
    float px = 2.0 / resolution.y;
    vec3 col = mix(vec3(0.7, 0.8, 0.9), vec3(0.3, 0.5, 0.8), smoothstep(-0.2, 1.0, p.y));
    vec2 sunPos = vec2(0.55, 0.45);
    float sd = length(p - sunPos);
    col += vec3(1.0, 0.95, 0.85) * exp(-sd * 5.0) * 0.4;
    col = mix(col, vec3(1.0, 0.98, 0.92), 1.0 - smoothstep(0.09 - px, 0.09 + px, sd));
    for (int i = 0; i < 4; i++) {
      float k = float(i);
      float h = dune(p.x, k);
      //ja: 砂丘の傾きで、日の当たる面と影の面を分ける
      //en: use the slope to split the sunny side from the shady side
      float slope = (dune(p.x + 0.01, k) - h) / 0.01;
      float lit = smoothstep(-0.3, 0.3, -slope);
      vec3 sand = mix(vec3(0.45, 0.33, 0.22), vec3(0.85, 0.7, 0.5), lit);
      sand *= 0.7 + 0.3 * smoothstep(h - 0.4, h, p.y);
      sand = mix(sand, col, 0.35 * (3.0 - k) / 3.0);
      col = mix(col, sand, 1.0 - smoothstep(h - px, h + px, p.y));
    }
    return vec4(grade(col, uv), 1.0);
  }
`;

// 総まとめの課題の共通部分(補助の関数)
const CAPSTONE_HEAD = `
  #define PI 3.14159265
  #define TAU 6.28318531

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
  }

  mat3 camera(vec3 ro, vec3 ta) {
    vec3 f = normalize(ta - ro);
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 u = cross(f, r);
    return mat3(r, u, f);
  }

  float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
  }
`;

const CAPSTONE_NORMAL = `
  vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
      map(p + e.xyy) - map(p - e.xyy),
      map(p + e.yxy) - map(p - e.yxy),
      map(p + e.yyx) - map(p - e.yyx)));
  }
`;

const lesson: Lesson = {
  slug: "your-demo",
  title: { ja: "デモを仕上げて発表する", en: "Finish and share your demo" },
  summary: {
    ja: "構図・色・動きを整え、作品として投稿・書き出しする",
    en: "Polish composition, color and motion, then publish and export your work",
  },
  minutes: 60,
  goals: [
    {
      ja: "主役・明暗・余白を考えて、構図を決められる",
      en: "Plan a composition around a hero, light and dark, and empty space",
    },
    {
      ja: "色の仕上げ(トーン・彩度・色温度・ビネット)で、作品全体の雰囲気をそろえられる",
      en: "Unify a work's mood with a color finish: tone, saturation, temperature and vignette",
    },
    {
      ja: "速い・遅い・止まる、を組み合わせて、動きにリズムをつけられる",
      en: "Give motion rhythm by mixing fast, slow and still",
    },
    {
      ja: "静止サムネ(time = 2・attention = 0・mouse = (0, 0))と、ホバー中の attention を意識して仕上げられる",
      en: "Finish with the still thumbnail (time = 2, attention = 0, mouse = (0, 0)) and the hover state in mind",
    },
    {
      ja: "/edit から投稿・書き出しをして、作品を人に見せられる",
      en: "Post and export from /edit, and share your work with others",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "仕上げとは", en: "What finishing means" } },
    {
      type: "paragraph",
      text: {
        ja: "いよいよ最終回です。ここまでで、色・形・ノイズ・光・3D・時間の演出と、作品を作るための道具はひととおりそろいました。でも、技を並べただけでは、まだ「作品」にはなりません。見た人の目がどこへ行き、何を感じるか。それを整えるのが **仕上げ** です。",
        en: "This is the final lesson. By now you have the whole toolkit: color, shape, noise, light, 3D and directing with time. But lining up techniques doesn't make a piece of art yet. Where does the viewer's eye go, and what do they feel? Shaping that is what **finishing** is about.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "作品づくりは、だいたい次の順に進めると迷いにくくなります。後ろのほうの段階ほど細かい調整なので、前の段階が決まる前に手を出しすぎないのがこつです。",
        en: "Making a work goes more smoothly in roughly this order. Later stages are finer adjustments, so the trick is not to fuss over them before the earlier stages are settled.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: [
        { ja: "アイデア … 1 つの絵、1 つの気分に絞る", en: "Idea: narrow it down to one picture and one mood" },
        { ja: "下書き … 形と動きを、灰色や仮の色で置く", en: "Blockout: place shapes and motion in gray or placeholder colors" },
        { ja: "構図と明暗 … 主役を決め、目の通り道を作る", en: "Composition and value: pick the hero and lay out a path for the eye" },
        { ja: "色と光 … 色の数を絞り、仕上げの色をかける", en: "Color and light: limit the palette and apply a color finish" },
        { ja: "動き … 速さに強弱をつけ、見せ場を作る", en: "Motion: vary the speeds and build a highlight" },
        { ja: "確認 … サムネ・重さ・画面の大きさを確かめて、投稿する", en: "Checks: thumbnail, cost and screen sizes, then post" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "この回では、「月夜の湖」の 2D の絵を、構図・明暗・色・動きの順に育てながら、それぞれの考え方を見ていきます。最後に、総まとめの課題として 3D のデモを 1 本作ります。",
        en: "In this lesson we grow a 2D \"moonlit lake\" step by step, through composition, value, color and motion, looking at the thinking behind each. At the end, the capstone exercise has you build a complete 3D demo.",
      },
    },

    { type: "heading", text: { ja: "構図: 主役を決める", en: "Composition: choose a hero" } },
    {
      type: "paragraph",
      text: {
        ja: "まず、絵の **主役** を 1 つ決めます。この絵なら月です。主役が決まったら、それをどこに置くかを考えます。真ん中に置くと安定しますが、動きのない、記念写真のような絵になりがちです。そこで写真や絵でよく使われるのが **三分割** です。画面を縦と横に 3 等分する線を引き、その線や交点の近くに主役や水平線を置きます。",
        en: "First, choose the picture's **hero**. Here it's the moon. Then decide where it goes. Dead center is stable, but tends to look static, like a snapshot. That's why photographers and painters often use the **rule of thirds**: divide the frame into thirds horizontally and vertically, and place the hero and the horizon on or near those lines and their crossings.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`p` の座標で考えると、横の 1/3 の線は `p.x` がおよそ ±0.44(4:3 の画面)〜 ±0.59(16:9 の画面)、縦の 1/3 の線は `p.y` が ±0.33 です。下の例では、水平線が画面の真ん中(`horizon = 0.0`)、月も真ん中にあります。数を変えて、絵の感じがどう変わるか比べてみてください。",
        en: "In `p` coordinates, the vertical third lines are at roughly `p.x` = ±0.44 (on a 4:3 screen) to ±0.59 (on 16:9), and the horizontal third lines at `p.y` = ±0.33. In the example below the horizon sits in the middle (`horizon = 0.0`) and so does the moon. Change the numbers and compare how the picture feels.",
      },
    },
    {
      type: "playground",
      source: joinCode(
        LAKE_HEAD,
        `
          vec3 scene(vec2 p, vec2 moonPos, float horizon) {
            float px = 2.0 / resolution.y;
            vec3 col = mix(vec3(0.25, 0.3, 0.5), vec3(0.06, 0.08, 0.2), smoothstep(horizon, 1.0, p.y));
            vec2 g = p * 30.0;
            float st = step(0.97, hash21(floor(g))) * (1.0 - smoothstep(0.0, 0.12, length(fract(g) - 0.5)));
            col += vec3(0.8, 0.85, 1.0) * st * smoothstep(horizon + 0.2, 0.9, p.y);
            float md = length(p - moonPos);
            col += vec3(0.9, 0.85, 0.7) * exp(-md * 4.0) * 0.3;
            col = mix(col, vec3(1.0, 0.97, 0.88), 1.0 - smoothstep(0.12 - px, 0.12 + px, md));
            for (int i = 0; i < 3; i++) {
              float k = float(i);
              float h = horizon + 0.04 + ridge(p.x, k);
              vec3 mc = mix(vec3(0.2, 0.24, 0.38), vec3(0.1, 0.12, 0.2), k / 2.0);
              col = mix(col, mc, 1.0 - smoothstep(h - px, h + px, p.y));
            }
            return col;
          }

          vec4 render(vec2 uv, vec2 p) {
            float horizon = 0.0;          //ja: 水平線の高さ //en: height of the horizon
            vec2 moonPos = vec2(0.0, 0.5); //ja: 月の位置 //en: where the moon is
            vec3 col;
            if (p.y > horizon) {
              col = scene(p, moonPos, horizon);
            } else {
              //ja: 水面: 水平線で上下を折り返して、さざ波でゆらす
              //en: water: mirror the scene at the horizon and ripple it
              vec2 q = vec2(p.x, 2.0 * horizon - p.y);
              q.x += 0.01 * sin(p.y * 80.0 + time * 2.0) * (horizon - p.y);
              col = scene(q, moonPos, horizon) * 0.7;
            }
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      caption: {
        ja: "`horizon` を `-0.35`、`moonPos` を `vec2(-0.45, 0.4)` にしてみましょう。水平線が下の 1/3、月が左の 1/3 に来て、右の山とのつり合いが生まれます",
        en: "Try `horizon` at `-0.35` and `moonPos` at `vec2(-0.45, 0.4)`. The horizon moves to the lower third and the moon to the left third, balanced by the hills on the right",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "水平線を真ん中に置くと、空と水が同じ広さで張り合って、どちらが大事なのかがわからなくなります。下の 1/3 に下げると、空が主役の舞台になります。月を左に寄せたら、右側の手前の山を高くして、重さのつり合いをとります。何も無い空の広がり(**余白**)も、主役を引き立てる大事な部分です。",
        en: "With the horizon in the middle, sky and water compete for the same space and it's unclear which matters. Drop it to the lower third and the sky becomes the hero's stage. Move the moon to the left, and the taller hills in the right foreground balance the weight. The stretch of empty sky (the **negative space**) is an important part too: it makes the hero stand out.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "作品が表示される画面の縦横比はいろいろです。大事なものは `|p.x| < 1.3`・`|p.y| < 1` に収めましょう。4:3 の画面では `p.x` は ±1.33 までしか見えません。書き出しでスマホの壁紙(縦長の 1080×1920)を作るときは、`p.x` が ±0.56 くらいまでしか見えないので、主役は真ん中寄りに置く必要があります。",
        en: "Works are shown at many aspect ratios. Keep important things within `|p.x| < 1.3` and `|p.y| < 1`. On a 4:3 screen, `p.x` only reaches ±1.33. If you export a phone wallpaper (portrait 1080×1920), only about ±0.56 of `p.x` is visible, so the hero needs to sit near the center.",
      },
    },

    { type: "heading", text: { ja: "明暗で目を導く", en: "Guiding the eye with light and dark" } },
    {
      type: "paragraph",
      text: {
        ja: "人の目は、まず **いちばん明るいところ** と、明暗の差がいちばん大きいところへ向かいます。だから、主役をいちばん明るくし、そのまわりとの差をはっきりさせると、目が自然に主役へ行きます。逆に、主役と同じくらい明るいものが画面のあちこちにあると、目が迷います。",
        en: "The eye goes first to the **brightest spot** and to where light and dark contrast most. So make the hero the brightest thing and give it clear contrast with its surroundings, and the eye goes there naturally. If other things around the frame are as bright as the hero, the eye wanders.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "明暗がうまくいっているかは、**色を消して** 確かめるのがいちばんです。画家が目を細めて絵を見るのと同じで、色にまどわされずに明るさだけを見られます。下の例では、空の上を暗く、手前の山をほとんど黒にして、月とその光の道を水面に足しました。`return` のすぐ上の行の `//` を消すと、白黒で見られます。",
        en: "The best way to check value is to **remove the color**. It's like a painter squinting at a canvas: you see only brightness, undistracted by hue. In the example below, the upper sky is darker, the nearest hills are almost black, and the moon's path of light now shines on the water. Remove the `//` on the line just above `return` to view it in black and white.",
      },
    },
    {
      type: "playground",
      source: joinCode(
        LAKE_HEAD,
        LAKE_SCENE,
        `
          vec4 render(vec2 uv, vec2 p) {
            float horizon = -0.35;
            vec2 moonPos = vec2(-0.45, 0.4);
            vec3 col;
            if (p.y > horizon) {
              col = scene(p, moonPos, horizon);
            } else {
              vec2 q = vec2(p.x, 2.0 * horizon - p.y);
              q.x += 0.01 * sin(p.y * 80.0 + time * 2.0) * (horizon - p.y);
              col = scene(q, moonPos, horizon) * 0.35;
              //ja: 月の光の道。月の真下ほど明るく、さざ波で切れる
              //en: the moon's path of light: brightest straight below the moon, broken up by ripples
              float path = exp(-abs(q.x - moonPos.x) * 9.0) * (0.5 + 0.5 * sin(p.y * 140.0 + time * 3.0));
              col += vec3(0.9, 0.85, 0.7) * path * 0.35 * smoothstep(-1.0, horizon, p.y);
            }
            // col = vec3(dot(col, vec3(0.299, 0.587, 0.114)));
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      caption: {
        ja: "白黒にして見ると、月 → 光の道 → 手前の黒い山、と明暗の差が大きいところを目がたどります。`scene` の中の `exp(-md * 3.0) * 0.5` の `0.5` を `1.5` にすると、月のまわりが明るくなりすぎて、輪郭がぼやけます",
        en: "In black and white, your eye follows the strongest contrasts: moon, path of light, dark foreground hills. Change the `0.5` in `exp(-md * 3.0) * 0.5` inside `scene` to `1.5` and the glow around the moon gets too bright, blurring its edge",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`dot(col, vec3(0.299, 0.587, 0.114))` は、色を人の目が感じる明るさ(**輝度**)に直す式です。緑がいちばん明るく、青がいちばん暗く感じられるので、3 つの数がちがいます。手前ほど暗く、遠くほど空の色に近づけたのも明暗の工夫で、遠くのものが空気でかすんで見える **空気遠近** を表しています。",
        en: "`dot(col, vec3(0.299, 0.587, 0.114))` turns a color into the brightness the eye perceives (its **luminance**). We see green as brightest and blue as darkest, hence the three different weights. Making near things darker and far things closer to the sky color is also a value choice: it shows **aerial perspective**, the way distant things fade into the haze.",
      },
    },

    { type: "heading", text: { ja: "色を整える", en: "Color grading" } },
    {
      type: "paragraph",
      text: {
        ja: "映画やゲームでは、撮った絵の色を最後にまとめて調整します(**カラーグレーディング**)。シェーダーでも、`render` の最後に色の仕上げの関数 `grade` を 1 つ通すと、絵全体の雰囲気をそろえられます。中身は、[光と仕上げ](/learn/light-and-glow) で決めた仕上げの順番(露出 → トーンマッピング → ビネット → ガンマ補正 → グレイン)に、3 つを足したものです。彩度と色温度は、トーンマッピングで明るさが 0〜1 に収まってから調整します。コントラストは、画面に出す明るさで見て決めたいので、ガンマ補正のあとに入れます。",
        en: "In film and games, the colors of the finished picture are adjusted together at the very end (**color grading**). In a shader, passing everything through one `grade` function at the end of `render` unifies the mood of the whole picture. It follows the finishing order set in [Light and finishing](/learn/light-and-glow) (exposure, tone mapping, vignette, gamma correction, grain) with three additions. Saturation and color temperature come after tone mapping, once brightness is inside 0–1. Contrast comes after gamma correction, because you want to judge it in the brightness actually shown on screen.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "トーンマッピング … 明るすぎる値を 0〜1 になめらかに収める",
          en: "Tone mapping: squeeze over-bright values smoothly into 0–1",
        },
        {
          ja: "彩度 … 輝度(白黒)の色から離すほど鮮やかになる。`mix(vec3(輝度), col, 1.3)` は 1.3 倍",
          en: "Saturation: the further from the luminance (gray) color, the more vivid; `mix(vec3(luma), col, 1.3)` means 1.3×",
        },
        {
          ja: "色温度 … 暗いところを青く、明るいところを暖かくすると、夜や夕方らしい奥行きが出る(スプリットトーン)",
          en: "Color temperature: cool shadows and warm highlights add depth and an evening or night feel (split toning)",
        },
        {
          ja: "ビネット … 画面の端を少し暗くして、目を中へ導く",
          en: "Vignette: darken the edges a little to lead the eye inward",
        },
        {
          ja: "ガンマ補正とコントラスト … 画面に出す明るさに直し、S 字の曲線で締める",
          en: "Gamma and contrast: convert to display brightness, then firm it up with an S-curve",
        },
        {
          ja: "グレイン … ごく弱いざらつきで、なめらかなグラデーションの色の段差(バンディング)を目立たなくする",
          en: "Grain: a very faint noise that hides the steps (banding) in smooth gradients",
        },
      ],
    },
    {
      type: "playground",
      source: joinCode(
        LAKE_HEAD,
        LAKE_SCENE,
        GRADE,
        `
          vec4 render(vec2 uv, vec2 p) {
            float horizon = -0.35;
            vec2 moonPos = vec2(-0.45, 0.4);
            vec3 col;
            if (p.y > horizon) {
              col = scene(p, moonPos, horizon);
            } else {
              vec2 q = vec2(p.x, 2.0 * horizon - p.y);
              q.x += 0.01 * sin(p.y * 80.0 + time * 2.0) * (horizon - p.y);
              col = scene(q, moonPos, horizon) * 0.35;
              float path = exp(-abs(q.x - moonPos.x) * 9.0) * (0.5 + 0.5 * sin(p.y * 140.0 + time * 3.0));
              col += vec3(0.9, 0.85, 0.7) * path * 0.35 * smoothstep(-1.0, horizon, p.y);
            }
            return vec4(grade(col, uv), 1.0);
          }
        `,
      ),
      caption: {
        ja: "`grade` の 3 の行の 2 つの色を入れかえると、暖かい影と冷たい光になって、雰囲気がまるで変わります。2 の `1.3` を `0.5` にすると、色の薄い、古い写真のような絵になります",
        en: "Swap the two colors on the line for step 3 in `grade` and you get warm shadows with cool light: a completely different mood. Change the `1.3` in step 2 to `0.5` for a washed-out, old-photo look",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "色は数を絞るほどまとまります。1 つの作品で使う色相(色合い)は 2〜3 つにして、主役にだけ反対の色(青に対するオレンジなど)を少し使うと、主役が引き立ちます。この湖なら、全体の青に対して、月だけが暖かい色です。",
        en: "The fewer colors, the more unified the picture. Stick to two or three hues per work, and give only the hero a touch of the opposite color (orange against blue, say) to make it pop. In this lake, everything is blue except the warm moon.",
      },
    },

    { type: "heading", text: { ja: "動きのリズム", en: "Rhythm in motion" } },
    {
      type: "paragraph",
      text: {
        ja: "動きも、全部が同じ速さだと単調になります。音楽にゆったりしたベースと細かいリズムと決めの一打があるように、動きにも層を作ります。",
        en: "If everything moves at the same speed, motion turns monotonous. Just as music has a slow bass line, a busy rhythm and the occasional big hit, give motion layers too:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "ゆっくり大きな動き … 背景や広い面(もや、雲、空の色)。気づくか気づかないかくらいの速さ",
          en: "Slow, large motion: backgrounds and broad areas (mist, clouds, sky color), barely noticeable",
        },
        {
          ja: "速く小さな動き … 細部(星のまたたき、水面のきらめき)。画面に生きている感じを足す",
          en: "Fast, small motion: details (twinkling stars, glints on water) that make the frame feel alive",
        },
        {
          ja: "止まっているもの … 主役や地面。動くものの中で、目の休む場所になる",
          en: "Stillness: the hero or the ground, a resting place for the eye among the moving parts",
        },
        {
          ja: "アクセント … たまに起きる短い出来事(流れ星、閃光)。[時間で演出する](/learn/timeline) の場面の考え方で、いつ起きるかを決める",
          en: "Accents: short, occasional events (a shooting star, a flash), timed with the scene thinking from [Directing with time](/learn/timeline)",
        },
      ],
    },
    {
      type: "playground",
      source: joinCode(
        LAKE_HEAD,
        SEGMENT,
        lakeSceneWithMotion(false),
        GRADE,
        lakeRenderWithMotion(false),
      ),
      caption: {
        ja: "流れ星は 4 秒ごろに 1 回目、そのあと 7 秒おきに流れます。`mod(time - 4.0, 7.0)` の `7.0` を `2.0` にすると、ひっきりなしに流れて、特別な感じがなくなります",
        en: "The first shooting star comes at about 4 seconds, then every 7 seconds. Change the `7.0` in `mod(time - 4.0, 7.0)` to `2.0` and they stream constantly, so they stop feeling special",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "アクセントは、まれだからこそ効きます。見ている人が「あ、また来た」と待つくらいの間隔が目安です。月は動かさずに、絵の錨(いかり)にしています。動きを足すときは、「止まっているもの」を残すことも忘れないでください。",
        en: "Accents work precisely because they're rare. Aim for a gap long enough that viewers start waiting for the next one. The moon stays put as the picture's anchor. Whenever you add motion, remember to keep something still.",
      },
    },

    { type: "heading", text: { ja: "静止サムネと attention", en: "The still thumbnail and attention" } },
    {
      type: "paragraph",
      text: {
        ja: "Gallery の一覧で最初に見えるのは、動いている作品ではなく、**静止したサムネ** です。サムネは `time = 2`・`attention = 0`・`mouse = (0, 0)` の 1 コマで描かれます。どんなに良い作品でも、2 秒の時点が真っ暗だったり、主役がまだ出てきていなかったりすると、一覧の中で素通りされてしまいます。",
        en: "What people see first in the Gallery is not your work in motion but a **still thumbnail**. It's drawn as a single frame with `time = 2`, `attention = 0` and `mouse = (0, 0)`. However good the work, if it's still dark at 2 seconds or the hero hasn't appeared yet, people scroll right past it.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "見る人が一覧でカードにカーソルを乗せると、作品が動き出し、`attention` がすばやく 1 へ上がります([触って動く](/learn/mouse-and-attention))。これを使って、ホバーしたときだけのごほうびを用意できます。ただし `attention` が 0 でも 1 でも、どちらの絵もきれいに見えるようにします。作品のページやエディタでは `attention` は 0 のままです。",
        en: "When a viewer hovers over a card in the Gallery, the work starts moving and `attention` rises quickly to 1 ([Touch and response](/learn/mouse-and-attention)). You can use that for a little reward that only appears on hover. Just make sure the picture looks good at both `attention` 0 and 1. On the work page and in the editor, `attention` stays at 0.",
      },
    },
    {
      type: "playground",
      attentionSlider: true,
      source: joinCode(
        LAKE_HEAD,
        SEGMENT,
        lakeSceneWithMotion(true),
        GRADE,
        lakeRenderWithMotion(true),
      ),
      caption: {
        ja: "この例は 4 秒かけて明るくなるので、`time = 2` のサムネは暗くなってしまいます。最後のほうの `smoothstep(0.0, 4.0, time)` の `4.0` を `1.0` にすると、2 秒の時点ではもう明るくなります。下のスライダーで `attention` を上げると、オーロラが現れます",
        en: "This example takes 4 seconds to brighten, so the thumbnail at `time = 2` comes out dark. Change the `4.0` in `smoothstep(0.0, 4.0, time)` near the end to `1.0`, and it's fully lit by 2 seconds. Raise `attention` with the slider below to make an aurora appear",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "始まりの演出(フェードイン、主役の登場)は、2 秒より前に終える。または、見せたい瞬間が 2 秒に来るよう、`float t = time + 5.0;` のように時間をずらす",
          en: "Finish any opening effect (fade-ins, the hero's entrance) before 2 seconds, or shift time, as in `float t = time + 5.0;`, so your best moment lands at 2 seconds",
        },
        {
          ja: "作品のページと Gallery では、`mouse` はいつも `(0, 0)`(画面の真ん中)です。マウスが動くのは /edit や学習のプレビュー、/stage、書き出した HTML だけなので、マウスに反応する作品も、`mouse` が `(0, 0)` のままで成り立つようにする。カーソルに追従するものが、真ん中で主役を隠さないかも確かめる",
          en: "On the work page and in the Gallery, `mouse` is always `(0, 0)` (the center of the screen). The mouse only moves in /edit, the lesson previews, /stage and exported HTML, so even a mouse-driven work should hold up with `mouse` stuck at `(0, 0)`. Also check that anything following the cursor doesn't cover the hero in the middle",
        },
        {
          ja: "`attention` で見せるものは「足し算」にする。1 で何かが増える・速くなる・現れる。0 の絵から何かを欠けさせない",
          en: "Make `attention` additive: at 1, something grows, speeds up or appears; nothing should be missing from the 0 picture",
        },
      ],
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "/edit でサムネの 1 コマを確かめるには、プレビューの下の「先頭へ」を押してから、経過秒数の表示を見て 2 秒のあたりで「一時停止」します。書き出しの画像(PNG)も、このとき止まっているコマで描かれます。",
        en: "To check the thumbnail frame in /edit, press \"Restart\" under the preview, watch the elapsed-time display, and press \"Pause\" at around 2 seconds. Image (PNG) exports are drawn at whatever frame is paused, too.",
      },
    },

    { type: "heading", text: { ja: "仕上げのチェックリスト", en: "A finishing checklist" } },
    {
      type: "paragraph",
      text: {
        ja: "投稿する前に、次のことを 1 つずつ確かめましょう。全部に「はい」と言えたら、自信を持って公開できます。",
        en: "Before posting, go through these one at a time. If you can say yes to all of them, publish with confidence.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "主役は 1 つで、目が最初にそこへ行く", en: "There's one hero, and the eye goes there first" },
        { ja: "白黒にしても、形と主役がわかる", en: "In black and white, the shapes and the hero still read" },
        {
          ja: "4:3 でも 16:9(全画面)でも、大事なものが切れていない",
          en: "Nothing important is cut off at either 4:3 or 16:9 (full screen)",
        },
        {
          ja: "`time = 2` の 1 コマがきれい(暗すぎない、主役がいる)",
          en: "The frame at `time = 2` looks good (not too dark, the hero is there)",
        },
        {
          ja: "`attention` が 0 でも 1 でもきれい。`mouse` が `(0, 0)` でも成り立つ",
          en: "It looks good at `attention` 0 and 1, and still works with `mouse` at `(0, 0)`",
        },
        {
          ja: "細い線や細かい模様がちらつかない(1 ピクセルより細いものは、ぼかすか太くする)",
          en: "Thin lines and fine patterns don't flicker (anything thinner than a pixel gets blurred or thickened)",
        },
        {
          ja: "長く流しても崩れない(ためしに `time` を `time + 3600.0` にして、1 時間後の絵を見る)。配信の背景にするなら、乱数やノイズに入る値が時間とともに大きくなり続けないか確かめる([時間で演出する](/learn/timeline) の「つなぎ目の無いループ」)",
          en: "It holds up over long runs (try replacing `time` with `time + 3600.0` to see the picture an hour in). For stream backgrounds, check that nothing fed into randomness or noise keeps growing with time (see \"Seamless loops\" in [Directing with time](/learn/timeline))",
        },
        {
          ja: "Pre-publish checks が 5 / 5 passed で、Frame time に余裕がある",
          en: "Pre-publish checks show 5 / 5 passed, with room to spare on Frame time",
        },
        {
          ja: "コードの名前とコメントが、リミックスする人にも読める",
          en: "Names and comments in the code make sense to someone remixing it",
        },
      ],
    },

    { type: "heading", text: { ja: "投稿する", en: "Posting" } },
    {
      type: "paragraph",
      text: {
        ja: "作品は [/edit](/edit) で投稿します。この学習の playground のコードも、「/edit で開く」でそのまま持っていけます(それまでの /edit の下書きは「元に戻す」で戻せます)。/edit で書いたコードは、このブラウザに下書きとして自動で保存されます。投稿にはログインが必要ですが、ログインしていなくても下書きは残ります。手順は次のとおりです。",
        en: "You post works from [/edit](/edit). Any playground in these lessons can go straight there with \"Open in /edit\" (your previous /edit draft comes back with Undo). Code written in /edit is saved automatically as a draft in this browser. Posting requires signing in, but your draft is kept even if you aren't signed in. Here are the steps:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: [
        {
          ja: "上の「作品のタイトル」の欄に名前を付ける",
          en: "Give the work a name in the \"Title of the work\" field at the top",
        },
        {
          ja: "プレビューの下の「Pre-publish checks」が 5 つとも通っていることを確かめる",
          en: "Check that all five \"Pre-publish checks\" under the preview pass",
        },
        {
          ja: "「Submitへ進む」を押す(ログインしていなければ「ログインして投稿」)",
          en: "Press \"Continue to Submit\" (or \"Sign in to post\" if you aren't signed in)",
        },
        {
          ja: "開いた「作品を登録する」の画面で、タイトル(60 文字まで)と、表示する名前(任意、40 文字まで。空なら Anonymous)を入れる",
          en: "In the \"Post your work\" dialog, enter the title (up to 60 characters) and the name to display (optional, up to 40; blank means Anonymous)",
        },
        {
          ja: "「ほかの人の使い方」(ライセンス)と「公開範囲」を選ぶ(次の段落でくわしく)",
          en: "Choose \"How others can use it\" (the license) and \"Visibility\" (details below)",
        },
        {
          ja: "タグ(カンマ区切りで 5 つまで。英小文字・数字・ハイフンで 24 文字まで)と、説明(280 文字まで)を入れる。どちらも任意",
          en: "Add tags (up to 5, comma-separated; lowercase letters, digits and hyphens, up to 24 characters each) and a description (up to 280 characters). Both are optional",
        },
        {
          ja: "「公開する」(または「非公開で登録」)を押す",
          en: "Press \"Publish\" (or \"Save as private\")",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "「ほかの人の使い方」は 2 つから選びます。**「サイトの中でだけ使ってよい」**(ライセンスの名前は「shaders.art 標準」で、こちらが最初から選ばれています)は、ほかの人ができるのは、見ること・配信の背景や埋め込みに使うこと・このサイトの中でリミックスすることまでです。コードをサイトの外で使うには、あなたの許可が要ります。**「名前を出せば、どこでも自由に使ってよい」**(CC BY 4.0)は、使う人があなたの名前を表示すれば、サイトの外でも、改変や販売を含めて自由に使えます。CC BY は、**あとから取り消せません**。迷ったら標準にしておきましょう。",
        en: "For \"How others can use it\" there are two choices. **\"Only on this site\"** (the license is called \"shaders.art Standard\", and it's selected by default) lets others view the work, use it as a stream background or embed, and remix it on this site; using the code anywhere else needs your permission. **\"Anywhere, with credit\"** (CC BY 4.0) lets people use it anywhere, including changing or selling it, as long as they credit you. CC BY **can't be undone** later. If in doubt, stay with Standard.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "「公開範囲」は、「公開」なら作品のページが Gallery に並び、誰でも見られます。「非公開」なら、作品のページを見られるのはあなただけで、Gallery にも出ません。まず非公開で登録して、作品のページでの見え方を確かめてから公開する、という使い方もできます。",
        en: "For \"Visibility\", Public puts the work page in the Gallery for anyone to see. Private means only you can see the work page, and it doesn't appear in the Gallery. You can also save as private first, check how the work page looks, and publish later.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "タグは、見る人が作品を探す手がかりになります。`raymarching`・`noise`・`loop`・`tiny` のように、技法や特徴を表す短い英語にしておくと見つけてもらいやすくなります。説明には、見どころやホバーしたときに起きることを一言書いておくと親切です。",
        en: "Tags help people find your work. Short English words for the technique or character, like `raymarching`, `noise`, `loop` or `tiny`, make it easier to discover. In the description, a line about the highlight or what happens on hover is a nice touch.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "/edit の「AI と作る」の欄では、コードをどう変えたいかを言葉で頼めます(ログインが必要です)。提案は差分で確かめてから適用できるので、行き詰まったときの相談相手として使えます。ただ、ここまで学んだあなたなら、提案のどこが良くてどこが違うのかを、自分で判断できるはずです。",
        en: "The \"Make with AI\" panel in /edit lets you describe in words how you'd like the code to change (sign-in required). Suggestions are shown as a diff you can review before applying, which makes it a handy sounding board when you're stuck. Having come this far, though, you can judge for yourself what's good about a suggestion and what's off.",
      },
    },

    { type: "heading", text: { ja: "書き出す", en: "Exporting" } },
    {
      type: "paragraph",
      text: {
        ja: "/edit のプレビューの下の「書き出し」から、作品をいろいろな形で持ち出せます。投稿していなくても使えます。",
        en: "The \"Export\" menu under the /edit preview lets you take your work out in several forms, even without posting it:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "画像(PNG・いまのコマ)… 1920×1080・3840×2160(4K)・1080×1920(縦、スマホの壁紙)・1080×1080(正方形、SNS)。プレビューのいまの時刻のコマを描くので、一時停止して良いコマを選ぶ",
          en: "Image (PNG, current frame): 1920×1080, 3840×2160 (4K), 1080×1920 (portrait, phone wallpaper) or 1080×1080 (square, social). It draws the preview's current moment, so pause on a good frame first",
        },
        {
          ja: "GIF(ループ・いまのコマから)… 3 秒・480×270、5 秒・640×360、5 秒・480×480。[時間で演出する](/learn/timeline) のループにしておくと、つなぎ目が出ない",
          en: "GIF (loop, from the current frame): 3 s at 480×270, 5 s at 640×360, or 5 s at 480×480. Build it as a loop from [Directing with time](/learn/timeline) and there's no seam",
        },
        {
          ja: "コード … 「単体で動く HTML ファイル」(ブラウザで開くだけで動く)と、「Shadertoy 用にコピー」",
          en: "Code: a \"Standalone HTML file\" that runs when opened in a browser, and \"Copy for Shadertoy\"",
        },
        {
          ja: "配信背景・埋め込み … 配信背景用の URL(/stage)と、ブログなどに貼る埋め込みコード。OBS なら「ブラウザ」のソースに URL を貼り、幅 1920・高さ 1080 にする",
          en: "Stream background & embed: a /stage URL for stream backgrounds and an embed code for blogs and sites. In OBS, add a Browser source with the URL at 1920 × 1080",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "/stage の URL には、見た目の調整を付けられます。URL に `?speed=0.5` を付けると半分の速さ(0.1〜4 倍)、`?attention=1` を付けると、ホバーしたときの姿のまま流せます(両方なら `?speed=0.5&attention=1`)。投稿していない作品の URL のように `#` があるときは、`#` の前に入れます。配信で何時間も流すなら、[時間で演出する](/learn/timeline) の「つなぎ目の無いループ」の注意も思い出してください。",
        en: "You can tune how a /stage URL looks. Add `?speed=0.5` for half speed (anywhere from 0.1× to 4×), or `?attention=1` to run it in its hovered look (both together: `?speed=0.5&attention=1`). If the URL has a `#`, as URLs for unposted works do, put these before the `#`. If it'll run for hours on stream, remember the advice from \"Seamless loops\" in [Directing with time](/learn/timeline).",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "書き出したものをどう使えるかは、その作品のライセンスしだいです。自分の作品なら自由ですが、ほかの人の作品をリミックスしたものは、元の作品のライセンス(作品のページに出ています)を確かめてから使いましょう。",
        en: "How you may use an export depends on the work's license. Your own work is yours to use, but if you remixed someone else's, check the original's license (shown on its work page) first.",
      },
    },

    { type: "heading", text: { ja: "総まとめの課題", en: "Final exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "最初の 2 つで仕上げの技を 1 つずつ試し、3 つ目で、これまでの技を組み合わせた 1 本のデモ「夕暮れの天球儀」を作ります。3 つ目は、次の手順で、少しずつ育ててください。手順ごとにプレビューを確かめ、うまくいったら次へ進みます。",
        en: "The first two exercises each try one finishing technique. The third has you build a complete demo, \"Armillary at dusk\", combining what you've learned. Grow it step by step as below, checking the preview after each step before moving on.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: [
        {
          ja: "舞台 … 空を夕焼けのグラデーションにし、地平線の近くに太陽、遠くに山の影、上のほうに星を置く([質感と空気](/learn/materials-and-atmosphere)・[なめらかなノイズ](/learn/value-noise))",
          en: "Stage: make the sky a sunset gradient with the sun near the horizon, distant mountain silhouettes and stars up high ([Materials and atmosphere](/learn/materials-and-atmosphere), [Smooth noise](/learn/value-noise))",
        },
        {
          ja: "主役 … 球を、違う軸で回る 3 つの細い輪(`sdTorus`)と、真ん中の光る核に変える。回転の行列は `render` で 1 回だけ作る([3D の形を組み立てる](/learn/shapes-3d)・[速く、小さく](/learn/performance-and-size))",
          en: "Hero: replace the sphere with three thin rings (`sdTorus`) turning on different axes and a glowing core in the middle; build the rotation matrices once in `render` ([Building 3D shapes](/learn/shapes-3d), [Fast and small](/learn/performance-and-size))",
        },
        {
          ja: "光 … 輪を、空を映す金色の金属にして、核の光で内側を照らす。核のまわりのにじみは、レイを進めながらためる([法線と光](/learn/normals-and-lighting)・[トンネルと飛行](/learn/tunnels))",
          en: "Light: make the rings gold metal that mirrors the sky, lit from inside by the core; gather the glow around the core while marching ([Normals and lighting](/learn/normals-and-lighting), [Tunnels and flight](/learn/tunnels))",
        },
        {
          ja: "水面 … 式で解いた平面(y = 0)を水にして、ノイズで傾けた法線で空を映す。核の光の映りこみも足す([レイとカメラ](/learn/rays-and-camera))",
          en: "Water: turn a plane solved by formula (y = 0) into water that mirrors the sky through noise-tilted normals; add the core's reflection too ([Rays and cameras](/learn/rays-and-camera))",
        },
        {
          ja: "時間 … BPM 80 で核を脈打たせ、カメラをゆっくり揺らし、`attention` で輪を速く回す([時間で演出する](/learn/timeline)・[触って動く](/learn/mouse-and-attention))",
          en: "Time: pulse the core at 80 BPM, sway the camera slowly, and spin the rings faster with `attention` ([Directing with time](/learn/timeline), [Touch and response](/learn/mouse-and-attention))",
        },
        {
          ja: "仕上げ … この回の `grade` で色をそろえ、`time = 2` の 1 コマと Frame time を確かめる",
          en: "Finish: unify the colors with this lesson's `grade`, then check the frame at `time = 2` and the Frame time",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "サムネで映える 1 コマに", en: "A thumbnail that shines" },
      attentionSlider: true,
      prompt: {
        ja: "花が開く作品ですが、いまは 5 秒かけて開き、画面も 3 秒かけて明るくなるので、`time = 2` のサムネでは、小さく暗い花しか写りません。2 秒の時点で花が開ききって明るく見えるように直してください。開く瞬間は、少し行きすぎて戻る動きにします。さらに、`attention` が 1 のときは花が速く回り、強く光り、外側に光の粒の輪が現れるようにします。",
        en: "A flower opens, but right now it takes 5 seconds to open and the screen takes 3 seconds to brighten, so the thumbnail at `time = 2` shows only a small, dim flower. Fix it so the flower is fully open and bright by 2 seconds, with a little overshoot as it opens. Then, when `attention` is 1, make the flower spin faster, glow brighter and show a ring of sparkles around it.",
      },
      starter: joinCode(
        FLOWER_HEAD,
        `
          vec4 render(vec2 uv, vec2 p) {
            //ja: 花の開き具合。いまは 5 秒かけて開く
            //en: how open the flower is; for now it takes 5 seconds to open
            float bloom = smoothstep(0.0, 5.0, time);
            float spin = 0.2;
            float shine = 0.3;

            vec2 q = rot(-time * spin) * p;
            float a = atan(q.y, q.x);
            float r = length(q);
            float petals = 0.12 + 0.45 * bloom * (0.6 + 0.4 * cos(a * 7.0));
            float d = r - petals;
            float px = 2.0 / resolution.y;
            vec3 bg = mix(vec3(0.04, 0.03, 0.08), vec3(0.12, 0.06, 0.16), uv.y);
            vec3 flower = palette(r * 1.3 + 0.05, vec3(0.6, 0.45, 0.5), vec3(0.4, 0.35, 0.3), vec3(1.0), vec3(0.0, 0.1, 0.2));
            vec3 col = mix(bg, flower, 1.0 - smoothstep(-px, px, d));
            col += flower * exp(-max(d, 0.0) * 8.0) * shine;
            col = mix(col, vec3(1.0, 0.9, 0.5), 1.0 - smoothstep(0.08 - px, 0.08 + px, r));

            //ja: 画面全体のフェードイン(3 秒)
            //en: a fade-in for the whole screen (3 seconds)
            col *= smoothstep(0.0, 3.0, time);
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      solution: joinCode(
        FLOWER_HEAD,
        `
          vec4 render(vec2 uv, vec2 p) {
            //ja: 1.2 秒で開ききる。少し行きすぎて戻る動き(easeOutBack)で、開く瞬間を気持ちよく
            //en: fully open by 1.2 seconds, with a slight overshoot (easeOutBack) to make the moment pop
            float k = clamp(time / 1.2, 0.0, 1.0);
            float y = k - 1.0;
            float bloom = 1.0 + 2.70158 * y * y * y + 1.70158 * y * y;
            //ja: attention: ホバー中は速く回って、強く光る
            //en: attention: spin faster and glow brighter while hovered
            float spin = 0.2 + 0.8 * attention;
            float shine = 0.3 + 0.7 * attention;

            vec2 q = rot(-time * spin) * p;
            float a = atan(q.y, q.x);
            float r = length(q);
            float petals = 0.12 + 0.45 * bloom * (0.6 + 0.4 * cos(a * 7.0));
            float d = r - petals;
            float px = 2.0 / resolution.y;
            vec3 bg = mix(vec3(0.04, 0.03, 0.08), vec3(0.12, 0.06, 0.16), uv.y);
            vec3 flower = palette(r * 1.3 + 0.05, vec3(0.6, 0.45, 0.5), vec3(0.4, 0.35, 0.3), vec3(1.0), vec3(0.0, 0.1, 0.2));
            vec3 col = mix(bg, flower, 1.0 - smoothstep(-px, px, d));
            col += flower * exp(-max(d, 0.0) * 8.0) * shine;
            col = mix(col, vec3(1.0, 0.9, 0.5), 1.0 - smoothstep(0.08 - px, 0.08 + px, r));
            //ja: ホバー中だけ、外側に光の粒の輪
            //en: a ring of sparkles that only appears while hovered
            float sa = atan(p.y, p.x) + time * 0.5;
            float sparks = pow(0.5 + 0.5 * cos(sa * 24.0), 20.0) * exp(-abs(length(p) - 0.8) * 40.0);
            col += vec3(1.0, 0.85, 0.6) * sparks * attention;

            //ja: フェードインは 1 秒で終える(time = 2 のサムネでは明るい)
            //en: finish the fade-in within 1 second, so the thumbnail at time = 2 is fully lit
            col *= smoothstep(0.0, 1.0, time);
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      hints: [
        {
          ja: "「何秒かけるか」を決めている数は 2 つ、`smoothstep(0.0, 5.0, time)` の `5.0` と、`smoothstep(0.0, 3.0, time)` の `3.0` です。どちらも 2 秒より前に終わるようにします",
          en: "Two numbers set how long things take: the `5.0` in `smoothstep(0.0, 5.0, time)` and the `3.0` in `smoothstep(0.0, 3.0, time)`. Both need to finish before 2 seconds",
        },
        {
          ja: "行きすぎて戻る動きは、[時間で演出する](/learn/timeline) の `easeOutBack` です。`k = clamp(time / 1.2, 0.0, 1.0)` を入れれば、1.2 秒で開ききります",
          en: "The overshoot is `easeOutBack` from [Directing with time](/learn/timeline). Feed it `k = clamp(time / 1.2, 0.0, 1.0)` and the flower is fully open at 1.2 seconds",
        },
        {
          ja: "`spin` と `shine` に `attention` を足し(`0.2 + 0.8 * attention` など)、粒の輪は `pow(0.5 + 0.5 * cos(角度 * 24.0), 20.0) * exp(-abs(length(p) - 0.8) * 40.0)` に `attention` をかけて足します",
          en: "Add `attention` into `spin` and `shine` (e.g. `0.2 + 0.8 * attention`), and for the sparkle ring add `pow(0.5 + 0.5 * cos(angle * 24.0), 20.0) * exp(-abs(length(p) - 0.8) * 40.0)` times `attention`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "色の仕上げだけで夕方に", en: "Evening, with color alone" },
      prompt: {
        ja: "昼の砂丘の絵です。場面の計算(`render` と `dune`)には手を付けずに、色の仕上げの関数 `grade` だけを書き換えて、夕方の絵にしてください。全体を少し暗くし、明るいところはオレンジに、影は紫に寄せ、画面の端を暗くして、コントラストを強めます。",
        en: "This is a picture of dunes at midday. Without touching the scene code (`render` and `dune`), rewrite only the color-finishing function `grade` to turn it into evening: darken it a little overall, push highlights toward orange and shadows toward purple, darken the edges and boost the contrast.",
      },
      starter: joinCode(
        DUNES_HEAD,
        `
          //ja: 色の仕上げ。この関数だけを書き換える
          //en: the color finish: change only this function
          vec3 grade(vec3 col, vec2 uv) {
            return pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
          }
        `,
        DUNES_RENDER,
      ),
      solution: joinCode(
        DUNES_HEAD,
        `
          vec3 grade(vec3 col, vec2 uv) {
            //ja: 1. 露出を下げる(夕方は暗い)
            //en: 1. lower the exposure: evenings are darker
            col *= 0.75;
            //ja: 2. 明るさで色を付け直す。暗いところは紫、明るいところはオレンジ
            //en: 2. recolor by brightness: purple in the shadows, orange in the highlights
            float luma = dot(col, vec3(0.299, 0.587, 0.114));
            vec3 tone = mix(vec3(0.3, 0.12, 0.45), vec3(1.0, 0.55, 0.3), smoothstep(0.05, 0.7, luma));
            col = mix(col, tone * luma * 1.9, 0.8);
            //ja: 3. ビネット
            //en: 3. vignette
            col *= 1.0 - 0.8 * dot(uv - 0.5, uv - 0.5);
            //ja: 4. ガンマ補正と、S 字のコントラスト
            //en: 4. gamma correction and an S-curve for contrast
            col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
            col = mix(col, col * col * (3.0 - 2.0 * col), 0.5);
            return col;
          }
        `,
        DUNES_RENDER,
      ),
      hints: [
        {
          ja: "まず `col *= 0.75;` で全体を暗くします。夕方らしさは、明るさよりも色の偏りで決まります",
          en: "Start by darkening everything with `col *= 0.75;`. What says \"evening\" is less the brightness than the color cast",
        },
        {
          ja: "輝度 `luma` を求めて、`mix(紫, オレンジ, smoothstep(0.05, 0.7, luma))` で明るさに応じた色を作り、それに `luma` をかけたものへ `col` を寄せます",
          en: "Compute the luminance `luma`, build a color by brightness with `mix(purple, orange, smoothstep(0.05, 0.7, luma))`, multiply it by `luma`, and pull `col` toward the result",
        },
        {
          ja: "最後に、この回の湖の `grade` と同じく、ビネット・ガンマ補正・S 字のコントラスト(`col * col * (3.0 - 2.0 * col)` と混ぜる)の順にかけます",
          en: "Finish as in this lesson's lake `grade`: vignette, gamma correction, then an S-curve for contrast (mix with `col * col * (3.0 - 2.0 * col)`)",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "夕暮れの天球儀", en: "Armillary at dusk" },
      attentionSlider: true,
      prompt: {
        ja: "上の 6 つの手順にそって、夕暮れの海の上に浮かぶ天球儀のデモを作ってください。土台には、2 色の空と、球が 1 つあるだけの場面が用意してあります。できあがりは、地平線の近くに沈む太陽、星の出はじめた空、遠くの山影、空を映して揺れる水面、そして左 1/3 に浮かぶ 3 重の金色の輪と、拍に合わせて脈打つ光の核です。ホバー(`attention`)で輪が速く回り、核の光が強くなります。",
        en: "Following the six steps above, build a demo of an armillary sphere floating over the sea at dusk. The starting code has just a two-color sky and a single sphere. The finished piece has a sun setting near the horizon, the first stars in the sky, distant mountain silhouettes, rippling water that mirrors the sky, and, on the left third, three nested golden rings around a core of light that pulses with the beat. On hover (`attention`), the rings spin faster and the core glows brighter.",
      },
      starter: joinCode(
        CAPSTONE_HEAD,
        `
          //ja: 手順 1: 空(いまは 2 色のグラデーションだけ)
          //en: step 1: the sky (just a two-color gradient for now)
          vec3 sky(vec3 rd) {
            return mix(vec3(0.9, 0.5, 0.3), vec3(0.05, 0.07, 0.2), clamp(rd.y * 3.0, 0.0, 1.0));
          }

          //ja: 手順 2: 主役(いまは球が 1 つ)
          //en: step 2: the hero (a single sphere for now)
          float map(vec3 p) {
            return length(p - vec3(0.0, 1.35, 0.0)) - 0.5;
          }
        `,
        CAPSTONE_NORMAL,
        `
          vec4 render(vec2 uv, vec2 p) {
            //ja: 主役が左 1/3 に来るよう、カメラは少し右から見る
            //en: the camera looks from slightly to the right, so the hero lands on the left third
            vec3 ro = vec3(0.9, 0.55, -4.5);
            vec3 ta = vec3(0.9, 1.15, 0.0);
            vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.8));

            float t = 0.0;
            bool hit = false;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              if (d < 0.001 * t) {
                hit = true;
                break;
              }
              t += d;
              if (t > 12.0) break;
            }

            vec3 col = sky(rd);
            if (hit) {
              vec3 n = calcNormal(ro + rd * t);
              col = vec3(0.8, 0.6, 0.4) * (0.3 + 0.7 * max(dot(n, normalize(vec3(-0.5, 0.6, -0.6))), 0.0));
            }
            //ja: 手順 3〜6: 光・水面・時間・仕上げを足していく
            //en: steps 3 to 6: add light, water, time and the finish
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      solution: joinCode(
        `
          #define BPM 80.0
        `,
        CAPSTONE_HEAD,
        `
          //ja: render で 1 コマに 1 回だけ作り、map の中で使い回す値
          //en: values built once per frame in render and reused inside map
          mat2 r1;
          mat2 r2;
          mat2 r3;
          vec3 center;
          vec3 sunDir;

          //ja: 手順 2: 違う軸で回る 3 つの輪。遠いうちは包む球の距離を返す
          //en: step 2: three rings turning on different axes; return the bounding sphere's distance while far away
          float rings(vec3 p) {
            vec3 q = p - center;
            float bound = length(q) - 1.1;
            if (bound > 0.3) return bound;
            vec3 a = q;
            a.yz = r1 * a.yz;
            float d1 = sdTorus(a, vec2(1.0, 0.035));
            vec3 b = q;
            b.xy = r2 * b.xy;
            b.yz = r1 * b.yz;
            float d2 = sdTorus(b.yxz, vec2(0.78, 0.03));
            vec3 c = q;
            c.xz = r3 * c.xz;
            c.xy = r2 * c.xy;
            float d3 = sdTorus(c.xzy, vec2(0.56, 0.025));
            return min(d1, min(d2, d3));
          }

          float map(vec3 p) {
            return min(rings(p), length(p - center) - 0.2);
          }
        `,
        CAPSTONE_NORMAL,
        `
          //ja: 手順 1: 夕焼けの空・星・太陽・遠くの山
          //en: step 1: sunset sky, stars, sun and distant mountains
          vec3 sky(vec3 rd) {
            float h = rd.y;
            vec3 col = mix(vec3(1.0, 0.42, 0.18), vec3(0.22, 0.12, 0.3), smoothstep(-0.02, 0.18, h));
            col = mix(col, vec3(0.03, 0.05, 0.16), smoothstep(0.12, 0.45, h));
            vec2 sp = vec2(atan(rd.x, rd.z), h) * 50.0;
            float star = step(0.96, hash21(floor(sp))) * (1.0 - smoothstep(0.0, 0.08, length(fract(sp) - 0.5)));
            col += vec3(0.9, 0.95, 1.0) * star * smoothstep(0.15, 0.4, h);
            float sd = max(dot(rd, sunDir), 0.0);
            col += vec3(1.0, 0.45, 0.15) * pow(sd, 6.0) * 0.6;
            col += vec3(1.0, 0.8, 0.5) * pow(sd, 300.0) * 6.0;
            float ang = atan(rd.x, rd.z);
            float ridge = 0.02 + 0.045 * noise(vec2(ang * 2.5, 0.0)) + 0.015 * noise(vec2(ang * 9.0, 4.0));
            float m = (1.0 - smoothstep(ridge - 0.002, ridge + 0.002, h)) * step(0.0, h);
            col = mix(col, vec3(0.07, 0.04, 0.08) + vec3(0.45, 0.18, 0.08) * pow(sd, 4.0), m);
            return col;
          }

          //ja: 手順 6: 色の仕上げ
          //en: step 6: the color finish
          vec3 grade(vec3 col, vec2 uv) {
            col = 1.0 - exp(-col * 1.4);
            float luma = dot(col, vec3(0.299, 0.587, 0.114));
            col = mix(vec3(luma), col, 1.2);
            col *= mix(vec3(0.8, 0.9, 1.15), vec3(1.1, 1.0, 0.85), smoothstep(0.0, 0.7, luma));
            col *= 1.0 - 0.5 * dot(uv - 0.5, uv - 0.5);
            col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
            col += (hash21(uv * 1000.0 + fract(time)) - 0.5) * 0.015;
            return col;
          }

          vec4 render(vec2 uv, vec2 p) {
            //ja: 手順 5: 時間。ホバー中は輪が速く回る
            //en: step 5: time; the rings spin faster while hovered
            float speed = 1.0 + attention * 2.5;
            r1 = rot(time * 0.5 * speed);
            r2 = rot(time * 0.37 * speed + 1.0);
            r3 = rot(time * 0.23 * speed + 2.0);
            center = vec3(0.0, 1.35 + 0.06 * sin(time * 0.9), 0.0);
            sunDir = normalize(vec3(0.5, 0.08, 1.0));
            float pulse = exp(-fract(time * BPM / 60.0) * 3.0);
            vec3 coreCol = palette(0.05 + 0.04 * sin(time * 0.2), vec3(0.6, 0.45, 0.4), vec3(0.4, 0.35, 0.3), vec3(1.0), vec3(0.0, 0.1, 0.2));

            //ja: 主役を左 1/3、太陽を右に置く構図。カメラはゆっくり揺れるだけ
            //en: hero on the left third, sun on the right; the camera only sways slowly
            float sway = 0.25 * sin(time * 0.12);
            vec3 ro = vec3(4.5 * sin(sway) + 0.9, 0.55, -4.5 * cos(sway));
            vec3 ta = vec3(0.9, 1.15, 0.0);
            vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.8));

            //ja: 手順 3: レイを進めながら、核のまわりのにじみをためる
            //en: step 3: gather the glow around the core while marching
            float t = 0.0;
            float glow = 0.0;
            bool hit = false;
            for (int i = 0; i < 64; i++) {
              vec3 pos = ro + rd * t;
              float d = map(pos);
              glow += exp(-length(pos - center) * 4.0) * min(d, 0.3);
              if (d < 0.001 * t) {
                hit = true;
                break;
              }
              t += d;
              if (t > 12.0) break;
            }

            vec3 col;
            float tFloor = rd.y < 0.0 ? -ro.y / rd.y : 1000.0;
            if (hit && t < tFloor) {
              vec3 pos = ro + rd * t;
              vec3 n = calcNormal(pos);
              if (length(pos - center) < 0.21) {
                //ja: 光る核
                //en: the glowing core
                col = coreCol * (2.0 + 2.0 * pulse);
              } else {
                //ja: 金色の輪: 空を映し、縁ほど強く映す。内側は核に照らされる
                //en: gold rings: they mirror the sky, more strongly at the edges, and the core lights them from inside
                vec3 rr = reflect(rd, n);
                float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.0);
                vec3 gold = vec3(1.0, 0.7, 0.35);
                col = gold * sky(rr) * (0.4 + 0.6 * fres);
                col += gold * coreCol * max(dot(n, normalize(center - pos)), 0.0) * (0.6 + 0.8 * pulse) * 0.6;
                col += vec3(1.0, 0.8, 0.6) * pow(max(dot(rr, sunDir), 0.0), 40.0) * 2.0;
              }
            } else if (tFloor < 1000.0) {
              //ja: 手順 4: 水面。式で解いた平面に、ノイズの波で揺れる反射
              //en: step 4: water, a plane solved by formula, with reflections rippled by noise
              vec3 pos = ro + rd * tFloor;
              vec2 w = pos.xz * 2.0 + vec2(time * 0.25, time * 0.15);
              vec3 n = normalize(vec3((noise(w) - 0.5) * 0.12, 1.0, (noise(w * 1.3 + 5.3) - 0.5) * 0.12));
              vec3 rr = reflect(rd, n);
              float fres = 0.02 + 0.45 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              col = vec3(0.004, 0.01, 0.03) + sky(rr) * fres * vec3(0.75, 0.85, 1.0);
              //ja: 核の光の映りこみ: 反射したレイが核の近くを通るほど明るい
              //en: the core's reflection: brighter the closer the reflected ray passes to the core
              vec3 toC = center - pos;
              float miss = length(toC - rr * max(dot(toC, rr), 0.0));
              col += coreCol * exp(-miss * 6.0) * (0.5 + 0.8 * pulse) * 0.6;
              col = mix(col, sky(rd), 1.0 - exp(-tFloor * 0.015));
            } else {
              col = sky(rd);
            }
            col += coreCol * glow * (1.2 + 1.5 * pulse) * (1.0 + attention);
            return vec4(grade(col, uv), 1.0);
          }
        `,
      ),
      hints: [
        {
          ja: "手順 1・2: 星は、向き `rd` を `vec2(atan(rd.x, rd.z), rd.y)` の 2D の座標にして、マスごとの乱数で置きます。山も同じ角度を `noise` に入れて高さを作ります。輪は、`sdTorus` に渡す前に座標を回し、2 つ目・3 つ目は `.yxz`・`.xzy` で軸を入れかえます。核は半径 0.2 の球です",
          en: "Steps 1–2: for stars, turn the direction `rd` into 2D coordinates `vec2(atan(rd.x, rd.z), rd.y)` and place one by per-cell randomness. Mountains feed the same angle into `noise` for a height. For the rings, rotate the coordinates before calling `sdTorus`, and swap axes for the second and third with `.yxz` and `.xzy`. The core is a sphere of radius 0.2",
        },
        {
          ja: "手順 3・4: 金属は `sky(reflect(rd, n))` に金色をかけ、縁ほど強くします(フレネル)。水面は `tFloor = -ro.y / rd.y` で、輪より手前なら水を描きます。法線を `noise` で少し傾けてから `reflect` し、核の映りこみは、反射したレイが核の中心からどれだけ離れて通るか(`miss`)で決めます",
          en: "Steps 3–4: metal is `sky(reflect(rd, n))` tinted gold, stronger at the edges (Fresnel). For water, `tFloor = -ro.y / rd.y`; if it's closer than the rings, draw water. Tilt the normal slightly with `noise` before `reflect`, and base the core's reflection on how far the reflected ray passes from the core's center (`miss`)",
        },
        {
          ja: "手順 5・6: 脈打ちは `exp(-fract(time * BPM / 60.0) * 3.0)`。にじみは、ループの中で `exp(-核までの距離 * 4.0) * min(d, 0.3)` をためます。回転の行列と核の位置は `render` の最初で 1 回だけ作ってグローバル変数に入れ、最後に `grade` を通します",
          en: "Steps 5–6: the pulse is `exp(-fract(time * BPM / 60.0) * 3.0)`. For the glow, accumulate `exp(-distance to core * 4.0) * min(d, 0.3)` inside the loop. Build the rotation matrices and core position once at the start of `render` in global variables, and pass the result through `grade` at the end",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "主役を 1 つ決め、三分割と余白で置き場所を決める。大事なものは `|p.x| < 1.3` に",
          en: "Pick one hero and place it with the rule of thirds and negative space; keep what matters within `|p.x| < 1.3`",
        },
        {
          ja: "主役をいちばん明るく。白黒にして明暗を確かめる",
          en: "Make the hero the brightest thing, and check the values in black and white",
        },
        {
          ja: "`grade` で色をそろえる。色相は 2〜3 つ、主役にだけ反対の色",
          en: "Unify color with `grade`: two or three hues, with the opposite color saved for the hero",
        },
        {
          ja: "ゆっくり大きく・速く小さく・止まる・たまのアクセント、で動きにリズムを",
          en: "Rhythm comes from slow and large, fast and small, still, and the occasional accent",
        },
        {
          ja: "サムネは `time = 2`・`attention = 0`・`mouse = (0, 0)`。`attention` は足し算のごほうびに",
          en: "The thumbnail is `time = 2`, `attention = 0`, `mouse = (0, 0)`; use `attention` for an additive reward",
        },
        {
          ja: "/edit で投稿(ライセンスは標準か CC BY)し、PNG・GIF・HTML・/stage で書き出す",
          en: "Post from /edit (Standard or CC BY license) and export as PNG, GIF, HTML or a /stage URL",
        },
      ],
    },

    { type: "heading", text: { ja: "これから", en: "Where to go next" } },
    {
      type: "paragraph",
      text: {
        ja: "全 30 回、おつかれさまでした。最初の回で画面を 1 色に塗ったところから、ノイズで雲を作り、光で輝かせ、3D の世界を飛び、時間で物語を組み立てるところまで来ました。どれも「この点は何色?」という同じ問いへの答え方の工夫だったことを、思い出してみてください。",
        en: "That's all 30 lessons. Congratulations, and thank you for coming this far. You started by painting the screen a single color, and went on to build clouds from noise, make things shine, fly through 3D worlds and tell stories with time. Every bit of it was a new way to answer the same question: \"what color is this pixel?\"",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ここから先は、作って、見て、また作ることのくり返しです。[Gallery](/) には、いろいろな人の作品が並んでいます。気になった作品は「エディタで開く」で中を読み、数を 1 つ変えてみてください。それがいちばんの勉強になります。そして、あなたの作品もぜひ [/edit](/edit) から投稿してください。小さな作品でも、誰かにとっての「こんなこともできるんだ」になります。",
        en: "From here on, it's make, look, and make again. The [Gallery](/) is full of other people's works. When one catches your eye, use \"Open in editor\" to read how it works, and change a number. That's the best teacher there is. And please post your own work from [/edit](/edit). Even a small piece can be someone else's \"oh, you can do that?\"",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "わからないことが出てきたら、いつでもこのコースの好きな回に戻ってきてください。あなたの次の作品を、Gallery で見られるのを楽しみにしています。",
        en: "Whenever you get stuck, come back to any lesson in this course. We look forward to seeing your next work in the Gallery.",
      },
    },
  ],
};

export default lesson;
