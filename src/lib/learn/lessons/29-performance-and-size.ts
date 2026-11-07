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

const CAMERA = `
  mat3 camera(vec3 ro, vec3 ta) {
    vec3 f = normalize(ta - ro);
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 u = cross(f, r);
    return mat3(r, u, f);
  }
`;

// 歩数などの 0〜1 の量を、青 → 緑 → 赤 の色で見せる
const HEAT = `
  //ja: 0〜1 の量を、青(少ない)→ 緑 → 赤(多い)で見せる
  //en: show a 0–1 amount as blue (little), green, then red (a lot)
  vec3 heat(float x) {
    vec3 c = mix(vec3(0.05, 0.1, 0.5), vec3(0.1, 0.85, 0.35), smoothstep(0.0, 0.5, x));
    return mix(c, vec3(1.0, 0.15, 0.1), smoothstep(0.5, 1.0, x));
  }
`;

const NORMAL = `
  vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
      map(p + e.xyy) - map(p - e.xyy),
      map(p + e.yxy) - map(p - e.yxy),
      map(p + e.yyx) - map(p - e.yyx)));
  }
`;

const SHADOW_AND_AO = `
  float softShadow(vec3 ro, vec3 rd) {
    float res = 1.0;
    float t = 0.02;
    for (int i = 0; i < 32; i++) {
      float h = map(ro + rd * t);
      res = min(res, 8.0 * h / t);
      t += clamp(h, 0.02, 0.2);
      if (res < 0.001 || t > 10.0) break;
    }
    return clamp(res, 0.0, 1.0);
  }

  float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float w = 1.0;
    for (int i = 0; i < 5; i++) {
      float h = 0.01 + 0.12 * float(i);
      occ += (h - map(p + n * h)) * w;
      w *= 0.9;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
  }
`;

const ROT = `
  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
  }
`;

const NOISE = `
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
`;

const FBM = `
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
      a *= 0.5;
    }
    return v;
  }
`;

// 課題 1 の柱の林(starter と solution で共通の部分)
const PILLARS = `
  float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
  }

  float pillars(vec3 p) {
    vec3 q = p;
    q.xz = mod(q.xz + 1.5, 3.0) - 1.5;
    return sdBox(q, vec3(0.3, 2.0, 0.3)) - 0.05;
  }

  float map(vec3 p) {
    return min(pillars(p), p.y);
  }
`;

const lesson: Lesson = {
  slug: "performance-and-size",
  title: { ja: "速く、小さく", en: "Fast and small" },
  summary: {
    ja: "重くなる理由を知って速くし、短く書くコツと読みやすさの釣り合いを学ぶ",
    en: "Learn what makes shaders slow, speed them up, and balance brevity with clarity",
  },
  minutes: 50,
  goals: [
    {
      ja: "シェーダーの重さが「点の数 × 1 点の計算 × くり返し」のかけ算で決まることがわかる",
      en: "Understand that a shader's cost is the product of pixels × work per pixel × repetitions",
    },
    {
      ja: "/edit の Frame time と、歩数を色で見る方法で、重さを測って比べられる",
      en: "Measure and compare cost with Frame time in /edit and by coloring the step count",
    },
    {
      ja: "早く抜ける・包んで省く・遠くを粗くする・ループの外に出す、の 4 つで速くできる",
      en: "Speed things up by exiting early, skipping work with bounds, coarsening the distance and hoisting work out of loops",
    },
    {
      ja: "投稿チェック(8 ms・12 KB・ループ 64・`gl_FragCoord` 無し)を満たす書き方がわかる",
      en: "Know how to pass the posting checks (8 ms, 12 KB, loops up to 64, no `gl_FragCoord`)",
    },
    {
      ja: "`#define` や短い名前で小さく書くコツと、読みやすさとの釣り合いを判断できる",
      en: "Write small code with `#define` and short names, and judge the balance with readability",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "重さはかけ算で決まる", en: "Cost is a multiplication" } },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーは、画面の全部の点で同じ関数を動かします。だから 1 コマを描く重さは、おおまかに **点の数 × 1 点あたりの計算 × くり返しの回数** というかけ算で決まります。どれか 1 つを半分にすれば、全体も半分になります。速くするときは、この 3 つのどれを減らせるかを考えるのが基本です。",
        en: "A shader runs the same function for every pixel on the screen. So the cost of one frame is roughly a multiplication: **number of pixels × work per pixel × number of repetitions**. Halve any one of them and the whole thing halves. When speeding things up, the basic question is which of the three you can shrink.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数字で見てみましょう。1920×1080 の全画面は、およそ 207 万点です。レイマーチングの作品なら、1 点ごとに `map` を呼ぶ回数は、歩くので最大 64 回、法線で 6 回、影で最大 32 回、AO で 5 回。合わせて 100 回を超えることもあります。",
        en: "Let's put numbers on it. A 1920×1080 full screen has about 2.07 million pixels. In a raymarched work, each pixel calls `map` up to 64 times for marching, 6 times for the normal, up to 32 times for the shadow and 5 times for AO: more than 100 calls in total.",
      },
    },
    {
      type: "code",
      source: `
        //ja: 1 コマあたりの map の回数(全画面・レイマーチの作品の、多めの見積もり)
        //en: map calls per frame (full screen, raymarched work, a generous estimate)
        //   2,073,600 pixels × (64 + 6 + 32 + 5) calls ≈ 220,000,000
        //ja: map の中に fBm(5 層)があれば、noise はその 5 倍、hash はさらに 4 倍
        //en: with a 5-layer fBm inside map, that's 5× as many noise calls, and 4× more hashes
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "GPU はとても速いのですが、それでも 1 秒に 60 コマ描くなら、1 コマに使える時間は約 16.7 ms です。このサイトの投稿チェックが 1 コマ **8 ms** を目安にしているのは、その半分に収めて、ページのほかの処理や、もっと遅い端末のための余裕を残すためです。全画面にすると重くなるのも、このかけ算のうち「点の数」が増えるからです。",
        en: "GPUs are very fast, but at 60 frames per second you only have about 16.7 ms per frame. This site's posting check aims for **8 ms** per frame, half of that, to leave room for the rest of the page and for slower devices. Going full screen makes a work heavier for the same reason: the \"number of pixels\" factor grows.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の例は、光る粒をループで足し合わせています。粒の数 `COUNT` が、そのまま「くり返しの回数」です。16 から 64 にすると、絵はにぎやかになりますが、計算も 4 倍になります。",
        en: "The example below adds up glowing particles in a loop. The particle count `COUNT` is the \"number of repetitions\" directly. Going from 16 to 64 makes the picture busier, but it also quadruples the work.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531
        #define COUNT 16

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = vec3(0.01, 0.015, 0.04);
          for (int i = 0; i < 64; i++) {
            if (i >= COUNT) break; //ja: COUNT 個で止める //en: stop after COUNT particles
            float fi = float(i);
            float h = hash21(vec2(fi, 3.7));
            vec2 c = vec2(sin(time * (0.3 + h * 0.5) + fi * 1.7), cos(time * (0.25 + h * 0.4) + fi * 2.3)) * vec2(1.1, 0.75);
            float d = length(p - c);
            vec3 tint = palette(h * 0.3, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
            col += tint * 0.0006 / (d * d + 0.0002);
          }
          col = 1.0 - exp(-col);
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`COUNT` を `64` にすると、粒が 4 倍になります。下の「/edit で開く」で /edit に持っていき、16 と 64 で Frame time を比べてみましょう",
        en: "Set `COUNT` to `64` for four times the particles. Use \"Open in /edit\" below to take it to /edit, and compare the Frame time at 16 and at 64",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`for` の上限は数値で書く決まりなので、数を変えたいときは、上限を大きめの数値(ここでは 64)にして、`if (i >= COUNT) break;` で途中で抜けます。`COUNT` のように `#define` で名前を付けた数は、コンパイルの前に数値に置きかわります。",
        en: "Loop limits must be written as numbers, so when you want an adjustable count, give the loop a generous numeric limit (64 here) and leave early with `if (i >= COUNT) break;`. A `#define` name like `COUNT` is replaced by its number before compiling.",
      },
    },

    { type: "heading", text: { ja: "/edit で測る", en: "Measuring in /edit" } },
    {
      type: "paragraph",
      text: {
        ja: "この学習のページのプレビューには、重さは出ません。測るときは、playground の下の「/edit で開く」を押して、コードを /edit に持っていきます。/edit のプレビューの下には、コードの大きさ(bytes)・1 秒に描けたコマの数(fps)・経過時間が出ていて、その下の「Pre-publish checks」を開くと、投稿前の 5 つの確認が並んでいます。",
        en: "The previews on these lesson pages don't show cost. To measure, press \"Open in /edit\" under a playground to take the code to /edit. Under the /edit preview you'll see the code size (bytes), frames drawn per second (fps) and the elapsed time, and opening \"Pre-publish checks\" below that shows the five checks run before posting.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "Compiles … コンパイルが通るか", en: "Compiles … the code compiles" },
        {
          ja: "Size … コードの大きさが 12 KB 以内か。コメントも数えます",
          en: "Size … the code is 12 KB or less, comments included",
        },
        {
          ja: "Frame time … 1 コマを描くのにかかった時間が 8 ms 以内か。「3.2 ms / 8 ms budget」のように出ます",
          en: "Frame time … one frame takes 8 ms or less, shown like \"3.2 ms / 8 ms budget\"",
        },
        {
          ja: "No gl_FragCoord … `gl_FragCoord` を使っていないか(場所は `uv` と `p` で受け取ります)",
          en: "No gl_FragCoord … the code doesn't use `gl_FragCoord` (positions come in as `uv` and `p`)",
        },
        {
          ja: "Loops bounded … `for` の上限が数値で、64 以下か",
          en: "Loops bounded … every `for` has a numeric limit of 64 or less",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "5 つすべてに通ると、「Submitへ進む」で投稿に進めます。Frame time は描いている間ずっと測り直されるので、次のことに気をつけて読みましょう。",
        en: "Once all five pass, \"Continue to Submit\" lets you post. Frame time is re-measured continuously while the preview runs, so keep these in mind when reading it:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "数字はコマごとに少し揺れる。数秒見て、だいたいの値を読む",
          en: "The number wobbles from frame to frame; watch for a few seconds and read the typical value",
        },
        {
          ja: "動きの全体を見る。カメラが重いところを向く瞬間だけ重くなることがある",
          en: "Watch the whole animation; it may get heavy only when the camera faces an expensive part",
        },
        {
          ja: "1 か所ずつ変えて比べる。何が効いたのかがわかる",
          en: "Change one thing at a time and compare, so you know what actually helped",
        },
        {
          ja: "プレビューの大きさで変わる。全画面にすると点の数が増えて重くなる",
          en: "It depends on the preview size; full screen means more pixels and more cost",
        },
        {
          ja: "fps も合わせて見る。画面の書き換えの速さ(多くの画面で 60)より大きく下がっていたら、重すぎるしるし",
          en: "Watch fps as well: if it drops well below your screen's refresh rate (60 on most screens), the work is too heavy",
        },
      ],
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "速さは GPU によって何倍も違います。Frame time は、あなたの端末で測った値です。手元の PC が速いなら、ノート PC やスマホで見る人のために、8 ms よりずっと下(たとえば半分くらい)を目指しておくと安心です。",
        en: "Speed varies many times over between GPUs, and Frame time is measured on your device. If your computer is fast, aim well under 8 ms (say, about half) so the work still runs smoothly for people on laptops and phones.",
      },
    },

    { type: "heading", text: { ja: "歩数を見る", en: "Seeing the steps" } },
    {
      type: "paragraph",
      text: {
        ja: "レイマーチングの作品で「くり返しの回数」にあたるのが、レイが当たるまでに歩いた **歩数** です。[レイマーチング](/learn/raymarching) でやったように、歩数を色にすると、どこに時間がかかっているのかが一目でわかります。下は、青が少ない歩数、赤が上限の 64 歩です。",
        en: "In a raymarched work, the \"number of repetitions\" is the number of **steps** a ray takes before it hits something. As in [Raymarching](/learn/raymarching), coloring the step count shows at a glance where the time goes. Below, blue means few steps and red means the 64-step limit.",
      },
    },
    {
      type: "playground",
      source: joinCode(
        CAMERA,
        `
          float map(vec3 p) {
            float s1 = length(p - vec3(-1.2, 0.5, 0.0)) - 0.5;
            float s2 = length(p - vec3(0.0, 0.7, 0.4)) - 0.7;
            float s3 = length(p - vec3(1.3, 0.4, -0.3)) - 0.4;
            return min(min(min(s1, s2), s3), p.y);
          }
        `,
        HEAT,
        `
          vec4 render(vec2 uv, vec2 p) {
            float a = time * 0.2;
            vec3 ro = vec3(4.0 * sin(a), 1.5, 4.0 * cos(a));
            vec3 rd = camera(ro, vec3(0.0, 0.4, 0.0)) * normalize(vec3(p, 1.5));
            float t = 0.0;
            float steps = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              if (d < 0.001) break; //ja: 当たったときしか抜けない //en: only leaves when it hits
              t += d;
              steps += 1.0;
            }
            vec3 col = heat(steps / 64.0);
            return vec4(col, 1.0);
          }
        `,
      ),
      caption: {
        ja: "空(上半分)が真っ赤です。どこにも当たらないレイが、毎回 64 歩全部を歩いているからです。球のふちや、地面の遠くの帯も赤くなっています",
        en: "The sky (top half) is solid red: rays that hit nothing walk all 64 steps every time. The rims of the spheres and a distant band of ground are red too",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "赤いところは 2 種類あります。1 つは空で、何にも当たらないので上限まで歩き続けています。もう 1 つは、物のふちや遠くの地面のように、レイが物の **すれすれ** を通るところです。すれすれでは距離関数の値が小さいので、少しずつしか進めず、歩数がかさみます。",
        en: "There are two kinds of red. One is the sky: nothing is ever hit, so rays keep walking to the limit. The other is where rays **graze** a surface, like the rims of objects or the distant ground. When grazing, the distance function returns small values, so the ray can only creep forward and the steps pile up.",
      },
    },

    { type: "heading", text: { ja: "早く抜ける", en: "Exiting early" } },
    {
      type: "paragraph",
      text: {
        ja: "歩数を減らすいちばん手軽な方法は、ループを早く抜けることです。条件は 2 つです。",
        en: "The easiest way to cut steps is to leave the loop early. There are two conditions:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "遠くへ行きすぎたら抜ける(`t > 20.0`)。霧で見えないほど遠くまで歩いても、むだになるだけ",
          en: "Stop when the ray has gone too far (`t > 20.0`). Walking further than the fog lets anyone see is wasted work",
        },
        {
          ja: "「当たった」の判定を、遠いほどゆるくする(`d < 0.001 * t`)。遠くの物は画面の上で小さいので、1 ピクセルより細かく合わせても見た目は変わらない",
          en: "Loosen the \"hit\" test with distance (`d < 0.001 * t`). Distant things are small on screen, so precision finer than a pixel changes nothing you can see",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "下の例は、画面の左半分が前の例と同じ条件、右半分が 2 つの条件を足したものです。色はどちらも歩数です。",
        en: "In the example below, the left half uses the same condition as before and the right half adds both conditions. Both halves show the step count as color.",
      },
    },
    {
      type: "playground",
      source: joinCode(
        CAMERA,
        `
          float map(vec3 p) {
            float s1 = length(p - vec3(-1.2, 0.5, 0.0)) - 0.5;
            float s2 = length(p - vec3(0.0, 0.7, 0.4)) - 0.7;
            float s3 = length(p - vec3(1.3, 0.4, -0.3)) - 0.4;
            return min(min(min(s1, s2), s3), p.y);
          }
        `,
        HEAT,
        `
          vec4 render(vec2 uv, vec2 p) {
            float a = time * 0.2;
            vec3 ro = vec3(4.0 * sin(a), 1.5, 4.0 * cos(a));
            vec3 rd = camera(ro, vec3(0.0, 0.4, 0.0)) * normalize(vec3(p, 1.5));
            bool early = p.x > 0.0; //ja: 右半分だけ早く抜ける //en: only the right half exits early
            float t = 0.0;
            float steps = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              if (early) {
                if (d < 0.001 * t || t > 20.0) break;
              } else {
                if (d < 0.001) break;
              }
              t += d;
              steps += 1.0;
            }
            vec3 col = heat(steps / 64.0);
            col *= smoothstep(0.0, 0.01, abs(p.x)); //ja: 真ん中の区切り線 //en: the dividing line
            return vec4(col, 1.0);
          }
        `,
      ),
      caption: {
        ja: "右半分の空は青くなりました。数歩で 20 を超えて抜けるからです。`t > 20.0` を `t > 8.0` にすると、遠くの地面まで青くなりますが、そのぶん見える範囲も狭くなります",
        en: "The sky on the right is now blue: it passes 20 within a few steps and leaves. Change `t > 20.0` to `t > 8.0` and even the distant ground turns blue, though you also see less of the world",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "地面すれすれの帯は、右半分でも赤いままです。ここは本当に、少しずつしか進めないところです。こうした帯は霧で隠れることが多いので、霧が濃くなるあたりで打ち切る距離を決めると、むだが減ります。",
        en: "The band of grazing ground stays red even on the right. Rays there really can only creep forward. Such bands are often hidden in fog anyway, so choosing the cut-off distance where the fog gets thick trims the waste.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "GPU は、となり合ういくつもの点をまとめて、同じ命令で同時に動かしています。まとまりの中で 1 つの点だけが長くループを回ると、ほかの点もそれを待つことになります。早く抜ける工夫がよく効くのは、空のように広い範囲がそろって早く抜けるときです。",
        en: "A GPU runs groups of neighboring pixels together, in lockstep. If one pixel in a group keeps looping, the others wait for it. Early exits pay off best when a large area, like the sky, can leave early all together.",
      },
    },

    { type: "heading", text: { ja: "包んで省く", en: "Skipping work with bounds" } },
    {
      type: "paragraph",
      text: {
        ja: "距離関数の中に、細かいでこぼこのような重い計算があるとします。でも、その物から遠く離れた点では、細かいでこぼこはまったく関係ありません。そこで、物をすっぽり包む **単純な形**(たとえば球)までの距離を先に測り、遠いうちはその距離を返してしまいます。包む球は中身より大きいので、その距離ぶん進んでも、中身を突き抜けることはありません。",
        en: "Say your distance function contains something expensive, like fine bumps. At points far from the object, those bumps don't matter at all. So first measure the distance to a **simple shape** that fully encloses the object (a sphere, say), and while that's far, just return it. The enclosing sphere is bigger than what's inside, so stepping that far can never pass through the object.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の例では、重い計算 `detail` を呼んだ回数を数えて、色にしています。左半分は包まない場合、右半分は包む球を使った場合です。",
        en: "The example below counts how many times the expensive `detail` function is called and shows it as color. The left half doesn't use a bound; the right half does.",
      },
    },
    {
      type: "playground",
      source: joinCode(
        CAMERA,
        `
          float calls = 0.0;     //ja: detail を呼んだ回数 //en: how many times detail was called
          bool useBound = false;

          //ja: 重い計算の代わり。6 層の波のでこぼこ
          //en: a stand-in for something expensive: six layers of wavy bumps
          float detail(vec3 p) {
            float v = 0.0;
            float a = 0.06;
            for (int i = 0; i < 6; i++) {
              v += a * sin(p.x * 7.0) * sin(p.y * 7.0 + 1.3) * sin(p.z * 7.0 + 2.1);
              p = p.yzx * 1.9 + vec3(0.7, 1.3, 0.4);
              a *= 0.55;
            }
            return v;
          }

          float blob(vec3 p) {
            vec3 q = p - vec3(0.0, 1.0, 0.0);
            if (useBound) {
              //ja: でこぼこごと包む、半径 1.2 の球。遠いうちはその距離を返す
              //en: a radius-1.2 sphere that encloses the bumps; return its distance while far away
              float bound = length(q) - 1.2;
              if (bound > 0.1) return bound;
            }
            calls += 1.0;
            return length(q) - 1.0 + detail(q);
          }

          float map(vec3 p) {
            return min(blob(p), p.y);
          }
        `,
        HEAT,
        `
          vec4 render(vec2 uv, vec2 p) {
            useBound = p.x > 0.0;
            float a = time * 0.2;
            vec3 ro = vec3(4.0 * sin(a), 2.0, 4.0 * cos(a));
            vec3 rd = camera(ro, vec3(0.0, 0.8, 0.0)) * normalize(vec3(p, 1.5));
            float t = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              if (d < 0.001 * t || t > 20.0) break;
              t += d * 0.8;
            }
            vec3 col = heat(calls / 64.0);
            col *= smoothstep(0.0, 0.01, abs(p.x));
            return vec4(col, 1.0);
          }
        `,
      ),
      caption: {
        ja: "左半分では、地面や空を見ているレイまで、1 歩ごとに `detail` を呼んでいます。右半分で呼んでいるのは、球のすぐ近くを通ったレイだけです。`1.2` を `1.0` にすると、包む球がでこぼこより小さくなり、正しくない(穴があく)ことがあります",
        en: "On the left, even rays looking at the ground or sky call `detail` at every step. On the right, only rays passing right by the sphere call it. Change `1.2` to `1.0` and the bound becomes smaller than the bumps, which is incorrect and can leave holes",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "包む形の距離は、本当の距離より小さめになります。レイを進めるぶんには安全ですが、[影と奥行き](/learn/shadows-and-ao) のやわらかい影や AO は距離の値そのものを使うので、包む形を使うと影の広がりや暗さが少し変わることがあります。見た目が変わったときは、影と AO だけ包まない `map` を使うか、包む形を中身にぴったり近づけます。",
        en: "A bounding shape's distance is smaller than the true distance. That's safe for marching, but the soft shadows and AO from [Shadows and depth](/learn/shadows-and-ao) use the distance values themselves, so a bound can slightly change how wide or dark they look. If the look changes, give shadows and AO a `map` without the bound, or fit the bound more tightly.",
      },
    },

    { type: "heading", text: { ja: "遠くは粗く", en: "Coarser far away" } },
    {
      type: "paragraph",
      text: {
        ja: "遠くの物は画面の上で小さいので、細かい模様を描いても 1 ピクセルの中につぶれてしまいます。それなら、遠くでは細かい計算をやめてもかまいません。この考え方を **LOD**(Level of Detail、細かさの段階)と呼びます。",
        en: "Distant things are small on screen, so fine detail there gets squashed into single pixels. In that case you may as well skip the fine work far away. This idea is called **LOD** (level of detail).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の山並みは、[重ねて自然に(fBm)](/learn/fbm) のようにノイズを重ねて高さを作っています。カメラから 5 より近いところでは 6 層、12 までは 4 層、それより遠くでは 2 層だけ重ねます。`map` の中でカメラまでの距離を知るために、カメラの位置をグローバル変数(関数の外で宣言した変数)`camPos` に入れて、`render` の最初で 1 回だけ書きこんでいます。",
        en: "The mountains below build their height by layering noise as in [Layering noise (fBm)](/learn/fbm). Within 5 units of the camera they use 6 layers, up to 12 units 4 layers, and beyond that only 2. So that `map` knows the distance to the camera, the camera position goes into a global variable (one declared outside any function), `camPos`, written once at the start of `render`.",
      },
    },
    {
      type: "playground",
      source: joinCode(
        `
          #define TAU 6.28318531
        `,
        ROT,
        CAMERA,
        NOISE,
        `
          vec3 camPos; //ja: render で 1 回だけ書きこむ //en: written once in render

          //ja: octaves 層だけ重ねた高さ
          //en: a height made of the given number of layers
          float terrain(vec2 x, int octaves) {
            float h = 0.0;
            float a = 0.5;
            for (int i = 0; i < 6; i++) {
              if (i >= octaves) break;
              h += a * noise(x);
              x = rot(0.5) * x * 2.0 + vec2(17.0, 9.0);
              a *= 0.5;
            }
            return h;
          }

          float map(vec3 p) {
            float dist = length(p - camPos);
            //ja: 近いほど細かく、遠いほど粗く
            //en: finer up close, coarser in the distance
            int octaves = dist < 5.0 ? 6 : (dist < 12.0 ? 4 : 2);
            return p.y - terrain(p.xz * 0.35, octaves) * 3.0;
          }
        `,
        NORMAL,
        `
          vec4 render(vec2 uv, vec2 p) {
            camPos = vec3(time * 0.6, 2.6, time * 0.8);
            vec3 ta = camPos + vec3(0.6, -0.6, 2.0);
            vec3 rd = camera(camPos, ta) * normalize(vec3(p, 1.6));
            vec3 sunDir = normalize(vec3(0.8, 0.3, 0.6));
            vec3 sky = mix(vec3(0.95, 0.55, 0.35), vec3(0.15, 0.2, 0.45), smoothstep(-0.05, 0.4, rd.y));
            sky += vec3(1.0, 0.7, 0.4) * pow(max(dot(rd, sunDir), 0.0), 12.0) * 0.6;
            float t = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(camPos + rd * t);
              if (d < 0.002 * t || t > 30.0) break;
              t += d * 0.6;
            }
            vec3 col = sky;
            if (t < 30.0) {
              vec3 pos = camPos + rd * t;
              vec3 n = calcNormal(pos);
              float dif = max(dot(n, sunDir), 0.0);
              vec3 rock = vec3(0.22, 0.17, 0.15);
              vec3 grass = vec3(0.1, 0.17, 0.06);
              vec3 base = mix(rock, grass, smoothstep(0.7, 0.9, n.y));
              base = mix(base, vec3(0.9), smoothstep(2.2, 2.5, pos.y + n.y * 0.3));
              col = base * (dif * vec3(2.2, 1.6, 1.1) + vec3(0.12, 0.15, 0.25) * (0.5 + 0.5 * n.y));
              col = mix(col, sky, 1.0 - exp(-t * 0.05));
            }
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      caption: {
        ja: "`dist < 5.0 ? 6 : (dist < 12.0 ? 4 : 2)` の `4` と `2` を `6` にすると、遠くまで 6 層になります。見た目はほとんど変わらないのに、計算はずっと増えます。/edit で Frame time を比べてみましょう",
        en: "Change the `4` and `2` in `dist < 5.0 ? 6 : (dist < 12.0 ? 4 : 2)` to `6` to use 6 layers all the way out. It hardly looks different, but the work grows a lot. Compare the Frame time in /edit",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "層の数がぱっと変わる距離で、山の形が少し変わることがあります(ポップと呼ばれる現象です)。気になるときは、変わる距離を霧の濃いところへ遠ざけるか、最後の層の重みを距離に合わせてなめらかに 0 へ減らします。",
        en: "Where the layer count switches, the shape of the mountains can change slightly (an effect called popping). If it bothers you, push the switch distance back into the thick fog, or fade the last layer's weight smoothly to 0 with distance.",
      },
    },

    { type: "heading", text: { ja: "ループの外に出す", en: "Hoisting work out of loops" } },
    {
      type: "paragraph",
      text: {
        ja: "`map` は 1 点につき 100 回近く呼ばれます。その中に、呼ぶたびに同じ答えになる計算があると、同じことを 100 回くり返すことになります。たとえば `rot(time * 0.7)` は、`time` がそのコマの間は変わらないので、何回計算しても同じ行列です。こうした計算は `render` で 1 回だけ行い、グローバル変数に入れて使い回します。これを、ループの外に出す(**巻き上げ**)と言います。",
        en: "`map` gets called close to 100 times per pixel. If it contains a calculation that gives the same answer every call, you're repeating the same work 100 times. For example, `rot(time * 0.7)` is the same matrix however often you compute it, because `time` doesn't change during a frame. Do such work once in `render`, store it in a global variable, and reuse it. This is called **hoisting** it out of the loop.",
      },
    },
    {
      type: "code",
      source: `
        //ja: 前: map を呼ぶたびに cos と sin を 4 回ずつ
        //en: before: four cos and sin calls on every map call
        float map(vec3 p) {
          vec3 q = p;
          q.xz = rot(time * 0.7) * q.xz;
          q.xy = rot(time * 0.4) * q.xy;
          return sdBox(q, vec3(0.35));
        }

        //ja: 後: render で 1 回だけ作り、map では使うだけ
        //en: after: build them once in render, and only use them in map
        mat2 spinA;
        mat2 spinB;
        float map(vec3 p) {
          vec3 q = p;
          q.xz = spinA * q.xz;
          q.xy = spinB * q.xy;
          return sdBox(q, vec3(0.35));
        }
        //ja: render の最初で: spinA = rot(time * 0.7); spinB = rot(time * 0.4);
        //en: at the start of render: spinA = rot(time * 0.7); spinB = rot(time * 0.4);
      `,
    },
    {
      type: "playground",
      source: joinCode(
        `
          #define TAU 6.28318531
        `,
        ROT,
        CAMERA,
        `
          float sdBox(vec3 p, vec3 b) {
            vec3 d = abs(p) - b;
            return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
          }

          vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
            return a + b * cos(TAU * (c * t + d));
          }

          //ja: 1 点につき 1 回だけ作り、map の中で何度も使う
          //en: built once per pixel, used in every map call
          mat2 spinA;
          mat2 spinB;

          float boxes(vec3 p) {
            vec3 q = p - vec3(0.0, 0.6, 0.0);
            q.x -= 1.4 * clamp(floor(q.x / 1.4 + 0.5), -2.0, 2.0);
            q.xz = spinA * q.xz;
            q.xy = spinB * q.xy;
            return sdBox(q, vec3(0.35)) - 0.05;
          }

          float map(vec3 p) {
            return min(boxes(p), p.y);
          }
        `,
        NORMAL,
        `
          float softShadow(vec3 ro, vec3 rd) {
            float res = 1.0;
            float t = 0.02;
            for (int i = 0; i < 32; i++) {
              float h = map(ro + rd * t);
              res = min(res, 8.0 * h / t);
              t += clamp(h, 0.02, 0.2);
              if (res < 0.001 || t > 10.0) break;
            }
            return clamp(res, 0.0, 1.0);
          }

          vec4 render(vec2 uv, vec2 p) {
            spinA = rot(time * 0.7);
            spinB = rot(time * 0.4);
            vec3 light = normalize(vec3(-0.5, 0.8, -0.4)); //ja: これも 1 回だけ //en: also just once

            vec3 ro = vec3(0.6, 1.7, -3.8);
            vec3 rd = camera(ro, vec3(0.0, 0.4, 0.0)) * normalize(vec3(p, 1.6));
            float t = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              if (d < 0.001 * t || t > 20.0) break;
              t += d;
            }
            vec3 sky = mix(vec3(0.6, 0.65, 0.75), vec3(0.25, 0.35, 0.6), clamp(rd.y * 2.0, 0.0, 1.0));
            vec3 col = sky;
            if (t < 20.0) {
              vec3 pos = ro + rd * t;
              vec3 n = calcNormal(pos);
              float cell = clamp(floor(pos.x / 1.4 + 0.5), -2.0, 2.0);
              vec3 base = palette(cell * 0.15, vec3(0.5), vec3(0.4), vec3(1.0), vec3(0.0, 0.2, 0.4));
              if (pos.y < boxes(pos)) base = vec3(0.3);
              float dif = max(dot(n, light), 0.0) * softShadow(pos + n * 0.01, light);
              col = base * (dif * vec3(1.2, 1.1, 1.0) + vec3(0.2, 0.25, 0.35) * (0.5 + 0.5 * n.y));
              col = mix(col, sky, 1.0 - exp(-t * 0.03));
            }
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      caption: {
        ja: "`rot(time * 0.7)` の `0.7` を `2.0` にすると、速く回ります。ためしに `q.xz = spinA * q.xz;` を `q.xz = rot(time * 0.7) * q.xz;` に戻して、/edit で Frame time を比べてみましょう",
        en: "Change the `0.7` in `rot(time * 0.7)` to `2.0` for a faster spin. As an experiment, change `q.xz = spinA * q.xz;` back to `q.xz = rot(time * 0.7) * q.xz;` and compare the Frame time in /edit",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ほかにも、ループの中で毎回同じになるものは外に出せます。光の向きの `normalize`、色の表の計算、時間だけで決まるカメラの位置などです。逆に、`p` によって答えが変わる計算(場所ごとに違う回転など)は、外に出せません。「この値は、点によって、また 1 歩ごとに変わるか?」と自分に聞いてみるのがこつです。",
        en: "Anything else that's the same on every pass can come out too: `normalize` on a light direction, color table calculations, a camera position that depends only on time. Calculations whose answer depends on `p` (like a rotation that differs from place to place) can't come out. The trick is to ask yourself: does this value change from pixel to pixel, or from step to step?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "小さな工夫もいくつかあります。2 乗は `pow(x, 2.0)` より `x * x` のほうが速く、大小を比べるだけなら `length(v)` の代わりに `dot(v, v)`(長さの 2 乗)で足ります。ただ、効き目が大きいのは、ここまでの「回数を減らす」工夫のほうです。まずは歩数と回数を見直しましょう。",
        en: "There are small tricks too: `x * x` is faster than `pow(x, 2.0)`, and if you only need to compare lengths, `dot(v, v)` (the squared length) can replace `length(v)`. But the big wins come from cutting how many times things run, as in the sections above. Look at steps and counts first.",
      },
    },

    { type: "heading", text: { ja: "小さく書く", en: "Writing small" } },
    {
      type: "paragraph",
      text: {
        ja: "こんどはコードの大きさです。投稿できるコードは 12 KB(12,288 バイト)までで、コメントも数えます。英数字は 1 文字 1 バイトですが、日本語は 1 文字 3 バイトなので、日本語のコメントが多いと早く大きくなります。とはいえ 12 KB はかなり大きく、ふつうの作品なら気にする必要はありません。",
        en: "Now for code size. Posted code can be up to 12 KB (12,288 bytes), comments included. Letters and digits are 1 byte each, but Japanese characters take 3 bytes, so lots of Japanese comments add up quickly. Still, 12 KB is plenty, and most works never need to worry.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "それでも、短いコードで美しい絵を出すのは、シェーダーの楽しみ方の 1 つです。Gallery の「[コードが短い順](/works?sort=short)」には、そうした作品が並びます。短く書くこつは次のとおりです。",
        en: "Even so, getting a beautiful picture out of very little code is one of the joys of shaders. The Gallery's \"[Shortest code](/works?sort=short)\" sort lists such works. Here are the tricks for writing short:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "使っていない関数や、試しに書いて止めたコードを消す(いちばん効く)",
          en: "Delete unused functions and code you commented out while experimenting (this helps most)",
        },
        {
          ja: "何度も出てくる形に `#define` で名前を付ける。`#define R(a) mat2(cos(a), sin(a), -sin(a), cos(a))` のように引数も取れる",
          en: "Name repeated patterns with `#define`; it can even take arguments, as in `#define R(a) mat2(cos(a), sin(a), -sin(a), cos(a))`",
        },
        {
          ja: "名前を短くする(`color` → `c`)。宣言をまとめる(`float r = length(p), a = atan(p.y, p.x);`)",
          en: "Shorten names (`color` → `c`) and combine declarations (`float r = length(p), a = atan(p.y, p.x);`)",
        },
        {
          ja: "数を短く書く。`0.5` は `.5`、`2.0` は `2.` と書ける。`vec3(…)` などの中なら整数の `0` や `1` でもよい",
          en: "Write numbers short: `0.5` can be `.5` and `2.0` can be `2.`; inside constructors like `vec3(…)`, plain integers like `0` and `1` are fine",
        },
        {
          ja: "空白・改行・コメントを減らす",
          en: "Trim spaces, line breaks and comments",
        },
      ],
    },
    {
      type: "code",
      source: `
        //ja: 読みやすく(107 バイト)
        //en: readable (107 bytes)
        float glow = 0.02 / abs(length(p) - 0.5);
        vec3 color = vec3(1.0, 0.6, 0.3) * glow;
        return vec4(color, 1.0);

        //ja: 短く(51 バイト)
        //en: short (51 bytes)
        return vec4(vec3(1,.6,.3)*.02/abs(length(p)-.5),1);
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "下は、`#define` と短い名前で書いた、全部で 230 バイトほどの作品です。座標を折りたたんでは回すことを 8 回くり返し([フラクタル](/learn/fractals) の折りたたみと同じ考え方)、そのたびに光る輪を足しています。",
        en: "Below is a whole work of about 230 bytes, written with `#define` and short names. It folds and rotates the coordinates 8 times (the same folding idea as in [Fractals](/learn/fractals)) and adds a glowing ring each time.",
      },
    },
    {
      type: "playground",
      source: `
        #define R(a) mat2(cos(a),sin(a),-sin(a),cos(a))
        vec4 render(vec2 u,vec2 p){
        vec3 c=vec3(0);
        for(int i=0;i<8;i++){
        p=abs(p*R(time*.1))-.4;
        c+=.003/abs(length(p)-.2)*(.5+.5*cos(float(i)*.6+time+vec3(0,2,4)));
        }
        return vec4(c,1);
        }
      `,
      caption: {
        ja: "`-.4` を `-.3` に、`.2` を `.15` にすると、模様ががらりと変わります。`i<8` を `i<5` にすると、折りたたみが減って、模様が大きくなります",
        en: "Change `-.4` to `-.3` and `.2` to `.15` and the pattern changes completely. Change `i<8` to `i<5` for fewer folds and a larger pattern",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`#define` は、名前を中身の文字にそのまま置きかえるだけです。`#define W(x) .5+.5*cos(x)` のようにかっこで囲まないと、`2.*W(a)` が `2.*.5+.5*cos(a)` になって、思った計算になりません。式の `#define` は、全体を `(…)` で囲んでおきましょう。",
        en: "`#define` simply pastes in its text. Without surrounding parentheses, as in `#define W(x) .5+.5*cos(x)`, `2.*W(a)` turns into `2.*.5+.5*cos(a)`, which isn't what you meant. Wrap expression macros in `(…)`.",
      },
    },

    { type: "heading", text: { ja: "読みやすさとの釣り合い", en: "Balancing size and readability" } },
    {
      type: "paragraph",
      text: {
        ja: "短いコードは、あとから読むのが大変です。このサイトでは、コードは作品ページにそのまま載り、ほかの人が「エディタで開く」からリミックスします。それに、何週間かたってから自分で直すときに、`c`・`q`・`k` ばかりのコードは読めません。どこまで縮めるかは、作品の目的で決めましょう。",
        en: "Short code is hard to read later. On this site, your code appears on the work page as is, and others remix it with \"Open in editor\". And when you come back to fix something weeks later, code full of `c`, `q` and `k` is unreadable. Decide how far to shrink based on what the work is for.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "ふつうの作品は、読みやすさを優先する。12 KB に近づいたら、まず使っていない関数とコメントから削る",
          en: "For most works, favor readability. If you near 12 KB, trim unused functions and comments first",
        },
        {
          ja: "調整する数(歩数・焦点距離・色など)は、`#define` で先頭にまとめる。短くもなり、読みやすくもなる",
          en: "Gather tuning numbers (steps, focal length, colors) as `#define`s at the top: shorter and clearer at once",
        },
        {
          ja: "`p`・`d`・`t`・`col` のように、シェーダーでよく使う短い名前は、そのままで十分読める",
          en: "Short names that shaders use everywhere, like `p`, `d`, `t` and `col`, are perfectly readable as they are",
        },
        {
          ja: "「小ささ」そのものを見せる作品なら、思いきり縮めるのも楽しい。そのときは、読みやすい版を手元に残しておく",
          en: "If smallness is the point of the work, go all out; just keep a readable version for yourself",
        },
      ],
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "2 つ目の課題が、この回の中心です。見た目を変えずに速くするには、「どこで、何回、同じことをしているか」を探します。/edit で Frame time を測りながら進めると、効き目がよくわかります。",
        en: "The second exercise is the heart of this lesson. To speed something up without changing how it looks, hunt for where the same work is done, and how many times. Measuring the Frame time in /edit as you go shows you what each change buys.",
      },
    },
    {
      type: "exercise",
      title: { ja: "早く抜けるレイマーチ", en: "A raymarch that exits early" },
      prompt: {
        ja: "柱の林を進む作品です。いまはループに抜ける条件が無く、どの点でも毎回 64 歩を歩いています。見た目を変えずに、当たったら抜ける・遠くへ行きすぎたら抜ける、の 2 つの条件を足してください。`return` のすぐ上の `// col = heat(steps / 64.0);` の `//` を消すと、歩数を色で確かめられます。",
        en: "This work moves through a forest of pillars. The loop has no exit condition, so every pixel walks all 64 steps every time. Without changing the look, add two conditions: leave when the ray hits, and leave when it has gone too far. Remove the `//` from `// col = heat(steps / 64.0);` just above `return` to check the step count as color.",
      },
      starter: joinCode(
        CAMERA,
        PILLARS,
        NORMAL,
        HEAT,
        `
          vec4 render(vec2 uv, vec2 p) {
            vec3 ro = vec3(0.0, 1.2, time * 0.8);
            vec3 rd = camera(ro, ro + vec3(sin(time * 0.2), -0.15, 1.0)) * normalize(vec3(p, 1.4));
            float t = 0.0;
            float steps = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              //ja: ここに、ループを早く抜ける条件を書く
              //en: add the conditions for leaving the loop early here
              t += d;
              steps += 1.0;
            }
            vec3 sky = mix(vec3(0.85, 0.6, 0.45), vec3(0.3, 0.4, 0.65), clamp(rd.y * 2.0 + 0.3, 0.0, 1.0));
            vec3 col = sky;
            if (t < 25.0) {
              vec3 pos = ro + rd * t;
              vec3 n = calcNormal(pos);
              float dif = max(dot(n, normalize(vec3(0.5, 0.8, -0.3))), 0.0);
              vec3 base = pos.y < pillars(pos) ? vec3(0.2, 0.22, 0.28) : vec3(0.9, 0.55, 0.35);
              col = base * (0.25 + 0.75 * dif);
              col = mix(col, sky, 1.0 - exp(-t * 0.08));
            }
            // col = heat(steps / 64.0);
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      solution: joinCode(
        CAMERA,
        PILLARS,
        NORMAL,
        HEAT,
        `
          vec4 render(vec2 uv, vec2 p) {
            vec3 ro = vec3(0.0, 1.2, time * 0.8);
            vec3 rd = camera(ro, ro + vec3(sin(time * 0.2), -0.15, 1.0)) * normalize(vec3(p, 1.4));
            float t = 0.0;
            float steps = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              //ja: 十分近づいた(遠いほどゆるく)か、遠くへ行きすぎたら抜ける
              //en: leave when close enough (looser further away) or when too far
              if (d < 0.001 * t || t > 25.0) break;
              t += d;
              steps += 1.0;
            }
            vec3 sky = mix(vec3(0.85, 0.6, 0.45), vec3(0.3, 0.4, 0.65), clamp(rd.y * 2.0 + 0.3, 0.0, 1.0));
            vec3 col = sky;
            if (t < 25.0) {
              vec3 pos = ro + rd * t;
              vec3 n = calcNormal(pos);
              float dif = max(dot(n, normalize(vec3(0.5, 0.8, -0.3))), 0.0);
              vec3 base = pos.y < pillars(pos) ? vec3(0.2, 0.22, 0.28) : vec3(0.9, 0.55, 0.35);
              col = base * (0.25 + 0.75 * dif);
              col = mix(col, sky, 1.0 - exp(-t * 0.08));
            }
            // col = heat(steps / 64.0);
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      hints: [
        {
          ja: "抜ける場所は、`map` で距離 `d` を測った直後、`t += d;` の前です",
          en: "The place to leave is right after measuring the distance `d` with `map`, before `t += d;`",
        },
        {
          ja: "あとで色を決めるところでは、`t < 25.0` かどうかで当たったかを見ています。遠くの打ち切りも同じ 25 にそろえると、見た目が変わりません",
          en: "Later, the shading checks `t < 25.0` to decide whether something was hit. Cut off at the same 25 and the look stays the same",
        },
        {
          ja: "`if (d < 0.001 * t || t > 25.0) break;` です。歩数の色で、空が青くなったことを確かめましょう",
          en: "`if (d < 0.001 * t || t > 25.0) break;`. Use the step-count colors to confirm the sky has turned blue",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "重いシェーダーを軽くする", en: "Lighten a heavy shader" },
      prompt: {
        ja: "でこぼこの星が浮かぶ作品です。投稿のルールは守っていますが、むだな計算が 3 種類かくれていて重くなっています。見た目を変えずに、それを見つけて直してください。/edit で開いて、直す前と後の Frame time を比べましょう(手元の環境にもよりますが、空の広い場面ではっきり差が出ます)。",
        en: "A bumpy planet floats over the ground. The code follows the posting rules, but three kinds of wasted work are hiding in it and slowing it down. Find and fix them without changing the look. Open it in /edit and compare the Frame time before and after (results depend on your device, but the difference is clear where there's lots of sky).",
      },
      starter: joinCode(
        `
          #define PI 3.14159265
          #define TAU 6.28318531
        `,
        ROT,
        CAMERA,
        NOISE,
        FBM,
        `
          float planet(vec3 p) {
            vec3 q = p - vec3(0.0, 1.2, 0.0);
            q.xz = rot(time * 0.3) * q.xz;
            float d = length(q) - 1.0;
            d += 0.08 * sin(q.x * 6.0) * sin(q.y * 6.0) * sin(q.z * 6.0);
            d += 0.03 * sin(q.x * 15.0 + 1.0) * sin(q.y * 13.0) * sin(q.z * 14.0);
            d += 0.015 * sin(q.x * 31.0) * sin(q.y * 29.0 + 2.0) * sin(q.z * 33.0);
            return d;
          }

          float map(vec3 p) {
            return min(planet(p), p.y);
          }
        `,
        NORMAL,
        SHADOW_AND_AO,
        `
          vec4 render(vec2 uv, vec2 p) {
            float a = time * 0.15;
            vec3 ro = vec3(4.5 * sin(a), 2.0, 4.5 * cos(a));
            vec3 rd = camera(ro, vec3(0.0, 1.0, 0.0)) * normalize(vec3(p, 1.5));

            float t = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              if (d < 0.0001) break;
              t += d * 0.8;
            }

            vec3 sky = mix(vec3(0.9, 0.6, 0.45), vec3(0.15, 0.25, 0.55), clamp(rd.y * 1.5 + 0.2, 0.0, 1.0));
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.6, 0.7, -0.4));
            float sh = softShadow(pos + n * 0.01, l);
            float ao = calcAO(pos, n);
            vec3 base = vec3(0.85, 0.4, 0.25);
            if (pos.y < planet(pos)) {
              float tex = fbm(pos.xz * 2.0);
              base = mix(vec3(0.1, 0.11, 0.14), vec3(0.35, 0.3, 0.27), tex);
            }
            float dif = max(dot(n, l), 0.0) * sh;
            vec3 lit = base * (dif * vec3(1.3, 1.15, 1.0) + vec3(0.25, 0.3, 0.4) * ao);
            float hit = t < 20.0 ? 1.0 : 0.0;
            vec3 col = mix(sky, lit, hit * exp(-t * 0.045));
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      solution: joinCode(
        `
          #define PI 3.14159265
          #define TAU 6.28318531
        `,
        ROT,
        CAMERA,
        NOISE,
        FBM,
        `
          //ja: 1. 回転の行列は render で 1 回だけ作る
          //en: 1. build the rotation matrix just once, in render
          mat2 spin;

          float planet(vec3 p) {
            vec3 q = p - vec3(0.0, 1.2, 0.0);
            q.xz = spin * q.xz;
            float d = length(q) - 1.0;
            d += 0.08 * sin(q.x * 6.0) * sin(q.y * 6.0) * sin(q.z * 6.0);
            d += 0.03 * sin(q.x * 15.0 + 1.0) * sin(q.y * 13.0) * sin(q.z * 14.0);
            d += 0.015 * sin(q.x * 31.0) * sin(q.y * 29.0 + 2.0) * sin(q.z * 33.0);
            return d;
          }

          float map(vec3 p) {
            return min(planet(p), p.y);
          }
        `,
        NORMAL,
        SHADOW_AND_AO,
        `
          vec4 render(vec2 uv, vec2 p) {
            spin = rot(time * 0.3);
            float a = time * 0.15;
            vec3 ro = vec3(4.5 * sin(a), 2.0, 4.5 * cos(a));
            vec3 rd = camera(ro, vec3(0.0, 1.0, 0.0)) * normalize(vec3(p, 1.5));

            float t = 0.0;
            for (int i = 0; i < 64; i++) {
              float d = map(ro + rd * t);
              //ja: 2. 遠いほどゆるい当たりの判定と、遠くの打ち切り
              //en: 2. a hit test that loosens with distance, plus a far cut-off
              if (d < 0.001 * t || t > 20.0) break;
              t += d * 0.8;
            }

            vec3 sky = mix(vec3(0.9, 0.6, 0.45), vec3(0.15, 0.25, 0.55), clamp(rd.y * 1.5 + 0.2, 0.0, 1.0));
            //ja: 3. 何にも当たらなかった点は、法線・影・AO を計算せずに空を返す
            //en: 3. if nothing was hit, return the sky without computing normal, shadow or AO
            if (t > 20.0) return vec4(pow(sky, vec3(1.0 / 2.2)), 1.0);

            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.6, 0.7, -0.4));
            float sh = softShadow(pos + n * 0.01, l);
            float ao = calcAO(pos, n);
            vec3 base = vec3(0.85, 0.4, 0.25);
            if (pos.y < planet(pos)) {
              float tex = fbm(pos.xz * 2.0);
              base = mix(vec3(0.1, 0.11, 0.14), vec3(0.35, 0.3, 0.27), tex);
            }
            float dif = max(dot(n, l), 0.0) * sh;
            vec3 lit = base * (dif * vec3(1.3, 1.15, 1.0) + vec3(0.25, 0.3, 0.4) * ao);
            vec3 col = mix(sky, lit, exp(-t * 0.045));
            return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
          }
        `,
      ),
      hints: [
        {
          ja: "`map` の中を見ましょう。呼ぶたびに同じ答えになる計算がありませんか? `map` は 1 点で 100 回近く呼ばれます",
          en: "Look inside `map`. Is there a calculation that gives the same answer on every call? `map` runs close to 100 times per pixel",
        },
        {
          ja: "レイを進めるループには、遠くでの打ち切りがありません。それに、空を見ている点でも、法線・影・AO を全部計算してから捨てています",
          en: "The marching loop has no far cut-off. And pixels looking at the sky still compute the normal, shadow and AO, only to throw them away",
        },
        {
          ja: "直すのは 3 つ。`rot(time * 0.3)` をグローバル変数に出す、`if (d < 0.001 * t || t > 20.0) break;` にする、ループの後で `t > 20.0` なら空の色をすぐ返す、です",
          en: "Three fixes: move `rot(time * 0.3)` into a global variable, use `if (d < 0.001 * t || t > 20.0) break;`, and right after the loop return the sky color if `t > 20.0`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "半分の大きさにする", en: "Half the size" },
      prompt: {
        ja: "光の筋と輪が広がる作品を、見た目を変えずに、コードの大きさ(バイト数)が半分以下になるように書き直してください。ただし、1 行に詰めこまず、改行と字下げは残して、ある程度は読めるようにします。大きさは /edit で開くと、プレビューの下に bytes で出ます。",
        en: "Rewrite this work of spreading rays and rings so the code is half its size in bytes or less, without changing the look. Don't cram it onto one line, though: keep line breaks and indentation so it stays reasonably readable. Open it in /edit to see the size in bytes under the preview.",
      },
      starter: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 中心からの距離と角度
          //en: distance and angle from the center
          float radius = length(p);
          float angle = atan(p.y, p.x);
          //ja: 角度で 12 本の光の筋
          //en: twelve rays around the center
          float rays = 0.5 + 0.5 * cos(angle * 12.0 + time);
          //ja: 外へ流れていく輪
          //en: rings flowing outward
          float rings = 0.5 + 0.5 * cos(radius * 20.0 - time * 3.0);
          //ja: 色は距離と時間で選ぶ
          //en: pick the color by distance and time
          vec3 color = palette(radius * 0.5 + time * 0.1, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          //ja: 筋と輪をかけ合わせて、中心ほど明るくする
          //en: multiply rays and rings, brighter toward the center
          float brightness = rays * rings / (radius + 0.3);
          color *= brightness;
          return vec4(color, 1.0);
        }
      `,
      solution: `
        //ja: 3 回出てくる「0.5 + 0.5 * cos(…)」に名前を付ける
        //en: name the "0.5 + 0.5 * cos(…)" that appears three times
        #define W(x) (.5 + .5 * cos(x))

        vec4 render(vec2 u, vec2 p) {
          float r = length(p), a = atan(p.y, p.x);
          vec3 c = W(6.2832 * (r * .5 + time * .1 + vec3(0, .33, .67)));
          c *= W(a * 12. + time) * W(r * 20. - time * 3.) / (r + .3);
          return vec4(c, 1);
        }
      `,
      hints: [
        {
          ja: "`palette` の a と b が両方 0.5、c が 1.0 なので、`0.5 + 0.5 * cos(TAU * (t + d))` と同じです。光の筋や輪と同じ形になります",
          en: "With a and b both 0.5 and c at 1.0, `palette` is just `0.5 + 0.5 * cos(TAU * (t + d))`, the same shape as the rays and rings",
        },
        {
          ja: "同じ形が 3 回出てくるので、`#define W(x) (.5 + .5 * cos(x))` のように名前を付けます。`cos` は `vec3` にもそのまま使えます",
          en: "That shape shows up three times, so name it, e.g. `#define W(x) (.5 + .5 * cos(x))`. `cos` works on a `vec3` as is",
        },
        {
          ja: "途中の変数をやめて式をつなぎ、名前を 1 文字に、数を `.5` や `12.` のように短くします。コメントを消すのも大きく効きます",
          en: "Drop the in-between variables and chain the expressions, use one-letter names, and shorten numbers to `.5` or `12.`. Removing the comments helps a lot too",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "重さは「点の数 × 1 点の計算 × くり返し」。どれか 1 つを減らせば全体が減る",
          en: "Cost is pixels × work per pixel × repetitions; shrink any one and the total shrinks",
        },
        {
          ja: "/edit の Pre-publish checks で、Frame time(8 ms まで)と Size(12 KB まで)を確かめる",
          en: "Check Frame time (up to 8 ms) and Size (up to 12 KB) in /edit's Pre-publish checks",
        },
        {
          ja: "歩数を色で見ると、時間のかかるところがわかる(空と、すれすれのところ)",
          en: "Coloring the step count reveals where time goes: the sky and grazing angles",
        },
        {
          ja: "早く抜ける(`d < 0.001 * t || t > 最大`)、包んで省く、遠くは粗く、同じ計算はループの外へ",
          en: "Exit early (`d < 0.001 * t || t > max`), skip work with bounds, coarsen the distance, hoist repeated work",
        },
        {
          ja: "小さく書くなら、まず使っていない関数とコメント。`#define` は `(…)` で囲む",
          en: "To write small, start with unused functions and comments; wrap `#define` expressions in `(…)`",
        },
        {
          ja: "ふつうは読みやすさを優先。コードは作品ページに載り、リミックスされる",
          en: "Usually favor readability: your code is shown on the work page and gets remixed",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回はいよいよ最終回です。構図・色・動きを整えて 1 本のデモを仕上げ、投稿と書き出しをして、作品を人に見せられるようにします。",
        en: "Next is the final lesson. We'll polish composition, color and motion into a finished demo, then post and export it so you can share your work.",
      },
    },
  ],
};

export default lesson;
