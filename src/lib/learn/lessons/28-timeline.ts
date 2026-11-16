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

// 場面の関数(sceneRings など)は、第 28 回の playground の間で同じものを使う
const SCENES = `
  #define PI 3.14159265
  #define TAU 6.28318531

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
  }

  vec3 sceneRings(vec2 p, float t) {
    float r = length(p);
    float v = 0.5 + 0.5 * sin(r * 18.0 - t * 4.0);
    float fade = 1.0 - smoothstep(0.0, 1.6, r);
    return mix(vec3(0.06, 0.02, 0.1), vec3(1.0, 0.45, 0.2), v * fade);
  }

  vec3 sceneStripes(vec2 p, float t) {
    p = rot(t * 0.4) * p;
    float v = smoothstep(-0.15, 0.15, sin(p.x * 12.0 + sin(p.y * 3.0 + t)));
    return mix(vec3(0.03, 0.08, 0.18), vec3(0.35, 0.85, 1.0), v);
  }

  vec3 sceneDots(vec2 p, float t) {
    vec2 id = floor(p * 4.0);
    vec2 g = fract(p * 4.0) - 0.5;
    float r = 0.18 + 0.12 * sin(t * 3.0 + id.x * 0.7 + id.y * 1.3);
    float m = 1.0 - smoothstep(r, r + 0.03, length(g));
    return mix(vec3(0.12, 0.05, 0.02), vec3(1.0, 0.85, 0.35), m);
  }

  //ja: 番号で場面を選ぶ
  //en: pick a scene by number
  vec3 drawScene(float id, vec2 p, float t) {
    if (id < 0.5) return sceneRings(p, t);
    if (id < 1.5) return sceneStripes(p, t);
    return sceneDots(p, t);
  }
`;

const EASE_IN_OUT = `
  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - 4.0 * (1.0 - x) * (1.0 - x) * (1.0 - x);
  }
`;

// 第 28 回の課題 2(円のワイプ)の、2 つの場面
const SUNSET_AND_NIGHT = `
  #define TAU 6.28318531

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - 4.0 * (1.0 - x) * (1.0 - x) * (1.0 - x);
  }

  //ja: 夕日の場面
  //en: the sunset scene
  vec3 sceneSunset(vec2 p, float t) {
    vec3 col = mix(vec3(1.0, 0.55, 0.3), vec3(0.45, 0.15, 0.4), clamp(p.y * 0.6 + 0.5, 0.0, 1.0));
    vec2 c = vec2(0.0, 0.1 + 0.05 * sin(t));
    float d = length(p - c) - 0.5;
    float bands = step(0.0, sin(p.y * 40.0 + t * 3.0)) + step(0.25, p.y);
    float sun = (1.0 - smoothstep(0.0, 0.01, d)) * min(bands, 1.0);
    col = mix(col, vec3(1.0, 0.9, 0.5), sun);
    if (p.y < -0.45) col = vec3(0.2, 0.05, 0.2) + vec3(0.6, 0.25, 0.2) * step(0.97, fract(p.y * 12.0 - t));
    return col;
  }

  //ja: 星空の場面
  //en: the starry night scene
  vec3 sceneNight(vec2 p, float t) {
    vec3 col = mix(vec3(0.0, 0.02, 0.08), vec3(0.05, 0.1, 0.25), clamp(p.y * 0.5 + 0.5, 0.0, 1.0));
    vec2 g = p * 12.0;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 off = vec2(hash21(id), hash21(id + 7.0)) - 0.5;
    float star = 0.02 / length(f - off * 0.6);
    float tw = 0.5 + 0.5 * sin(t * 3.0 + hash21(id) * TAU);
    col += vec3(0.8, 0.9, 1.0) * star * star * tw * step(0.7, hash21(id + 3.0));
    float moon = length(p - vec2(0.7, 0.45)) - 0.2;
    float bite = length(p - vec2(0.78, 0.5)) - 0.18;
    col = mix(col, vec3(1.0, 0.95, 0.8), 1.0 - smoothstep(0.0, 0.01, max(moon, -bite)));
    return col;
  }
`;

// 第 28 回のループの例と課題 3 で使う、ノイズと色の関数
const NOISE_AND_PALETTE = `
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

  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
  }
`;

const lesson: Lesson = {
  slug: "timeline",
  title: { ja: "時間で演出する", en: "Directing with time" },
  summary: {
    ja: "場面の切り替え・つなぎ・拍に合わせた動きで、デモの流れを作る",
    en: "Structure a demo with scenes, transitions and beat-synced motion",
  },
  minutes: 55,
  goals: [
    {
      ja: "`floor` と `mod` で時間を場面に分け、場面の中の経過時間を取り出せる",
      en: "Split time into scenes with `floor` and `mod`, and get the time elapsed inside each scene",
    },
    {
      ja: "フェードやワイプで、場面をなめらかにつなげる",
      en: "Join scenes smoothly with fades and wipes",
    },
    {
      ja: "イージングとキーフレームで、動きに「ため」と「止まり」をつけられる",
      en: "Give motion anticipation and rest with easing and keyframes",
    },
    {
      ja: "BPM から拍を計算し、拍に合わせて光らせたり、はねさせたりできる",
      en: "Compute beats from a BPM and make things flash or bounce on the beat",
    },
    {
      ja: "一周すると元に戻るループを作り、GIF や配信の背景にそのまま使える",
      en: "Make perfect loops that work as GIFs and stream backgrounds",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "時間を場面に分ける", en: "Splitting time into scenes" } },
    {
      type: "paragraph",
      text: {
        ja: "デモ(音楽に合わせて見せる、短いリアルタイムの映像作品)は、同じ絵がずっと続くのではなく、いくつかの **場面** が順に現れて流れを作ります。でもシェーダーには「次の場面へ」という命令はありません。あるのは、ずっと増え続ける `time` だけです。そこで `time` を区切って、「いまは何番目の場面の、何秒目か」を計算します。",
        en: "A demo (a short piece of real-time visuals, usually set to music) doesn't show the same picture all the way through; it moves through several **scenes** in sequence. Shaders have no \"go to the next scene\" command, though. All you have is `time`, which keeps going up. So we slice `time` up and work out which scene we're in and how many seconds into it.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`floor(time / len)` … 場面の番号。`len` 秒ごとに 1 ずつ増える",
          en: "`floor(time / len)` … the scene number, going up by 1 every `len` seconds",
        },
        {
          ja: "`mod(time, len)` … 場面の中の経過時間。0 から `len` まで進んで、0 に戻る",
          en: "`mod(time, len)` … the time inside the scene: runs from 0 up to `len`, then back to 0",
        },
        {
          ja: "`mod(time, len) / len` … 場面の中の進み具合。0〜1",
          en: "`mod(time, len) / len` … how far through the scene we are, from 0 to 1",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "たとえば `len` が 3.0 で `time` が 7.5 なら、場面の番号は `floor(2.5)` で 2、場面の中の時間は `mod(7.5, 3.0)` で 1.5 秒、進み具合は 0.5 です。番号をさらに `mod(番号, 3.0)` にすると、0, 1, 2, 0, 1, 2 … と 3 つの場面をくり返せます。",
        en: "For example, with `len` = 3.0 and `time` = 7.5, the scene number is `floor(2.5)` = 2, the time inside the scene is `mod(7.5, 3.0)` = 1.5 seconds, and the progress is 0.5. Take the number `mod 3.0` and you cycle 0, 1, 2, 0, 1, 2 … through three scenes.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float len = 3.0;             //ja: 1 場面の長さ(秒) //en: seconds per scene
          float n = floor(time / len); //ja: 場面の番号 0, 1, 2, … //en: scene number 0, 1, 2, …
          float st = mod(time, len);   //ja: 場面の中の時間 //en: time inside the scene
          float k = st / len;          //ja: 進み具合 0〜1 //en: progress, 0 to 1
          float id = mod(n, 3.0);      //ja: 0, 1, 2 をくり返す //en: cycles 0, 1, 2

          vec3 col = vec3(0.85, 0.3, 0.25);
          if (id > 0.5) col = vec3(0.2, 0.65, 0.45);
          if (id > 1.5) col = vec3(0.25, 0.4, 0.9);

          //ja: 場面ごとに 0 から大きくなる円
          //en: a circle that grows from zero in every scene
          float d = length(p) - k * 0.9;
          col = mix(col * 0.35, col, 1.0 - smoothstep(0.0, 0.01, d));

          //ja: 下の端に、場面の進み具合のバー
          //en: a progress bar for the scene along the bottom edge
          if (uv.y < 0.03) col = uv.x < k ? vec3(1.0) : vec3(0.15);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`len` を `1.0` にすると、せわしなく切り替わります。`mod(n, 3.0)` を `mod(n, 2.0)` にすると、青の場面が出てこなくなります",
        en: "Set `len` to `1.0` for hectic switching. Change `mod(n, 3.0)` to `mod(n, 2.0)` and the blue scene never shows up",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "場面の番号は小数(`float`)なので、`id == 1.0` のようにぴったり比べるより、`id > 0.5`・`id > 1.5` のように、整数の間の値と比べるほうが安全です。計算の誤差で 0.9999 のような値になっても、正しい場面に分けられます。",
        en: "Scene numbers are floats, so rather than testing exact equality like `id == 1.0`, compare against the values in between, like `id > 0.5` and `id > 1.5`. Even if rounding error turns a value into 0.9999, it still lands in the right scene.",
      },
    },

    { type: "heading", text: { ja: "場面を関数にする", en: "One function per scene" } },
    {
      type: "paragraph",
      text: {
        ja: "場面が増えてくると、全部を `render` の中に書いたのでは読めなくなります。場面ごとに `vec3 sceneRings(vec2 p, float t)` のような関数を作り、番号で場面を選ぶ関数 `drawScene` を 1 つ用意しておくと、場面の追加や入れ替えが楽になります。",
        en: "As scenes pile up, cramming them all into `render` becomes unreadable. Give each scene its own function, like `vec3 sceneRings(vec2 p, float t)`, plus one `drawScene` that picks a scene by number. Adding or reordering scenes becomes easy.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "それぞれの場面には、引数 `t` で **場面の中の時間** を渡します。どの場面も「自分の 0 秒目」から始まるので、ほかの場面のことを考えずに、その場面の中の動きを作れます。",
        en: "Each scene receives **its own local time** through the `t` argument. Every scene starts at its own second zero, so you can design one scene's motion without worrying about the others.",
      },
    },
    {
      type: "playground",
      source: joinCode(SCENES, `
        vec4 render(vec2 uv, vec2 p) {
          float len = 3.0;
          float n = floor(time / len);
          float st = mod(time, len);
          vec3 col = drawScene(mod(n, 3.0), p, st);
          return vec4(col, 1.0);
        }
      `),
      caption: {
        ja: "`drawScene` の中の 3 つの `return` の順番を入れ替えると、場面の順番が変わります。`drawScene(mod(n, 3.0), p, st)` の `st` を `time` にすると、場面が始まるたびに動きが最初に戻らなくなります",
        en: "Reorder the three `return` lines in `drawScene` to change the order of the scenes. Change `st` in `drawScene(mod(n, 3.0), p, st)` to `time` and the motion no longer restarts with each scene",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "関数と同じ名前の変数を作ると、その関数が呼べなくなります。たとえば場面の番号を `float scene` と名付けると、同じ名前の関数 `scene(…)` を呼んだところで「関数の名前が来るはず」(`function name expected`)というエラーになります。このコードで番号を `n`、関数を `drawScene` と、別の名前にしているのはそのためです。",
        en: "Declaring a variable with the same name as a function makes that function uncallable. Name the scene number `float scene`, for example, and calling a `scene(…)` function gives a `function name expected` error. That's why this code calls the number `n` and the function `drawScene`.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "3 つ目の場面だけを確かめたいのに、毎回 6 秒待つのは大変です。`floor(time / len)` と `mod(time, len)` の `time` を、いったん `(time + 6.0)` にすると、6 秒先(3 つ目の場面)から始まります。確かめ終わったら元に戻しましょう。",
        en: "Waiting six seconds every time you want to check the third scene gets old fast. Temporarily replace `time` with `(time + 6.0)` in `floor(time / len)` and `mod(time, len)` to start six seconds in, at the third scene. Change it back when you're done.",
      },
    },

    { type: "heading", text: { ja: "フェードでつなぐ", en: "Crossfades" } },
    {
      type: "paragraph",
      text: {
        ja: "パッと切り替わる **カット** も気持ちよいのですが、ゆったりした作品には、前の場面が次の場面にじわっと変わる **クロスフェード** が合います。場面の最後の `fade` 秒だけ次の場面も計算して、`mix` で混ぜます。",
        en: "A hard switch, a **cut**, can feel great, but calmer pieces suit a **crossfade**, where one scene slowly dissolves into the next. During the last `fade` seconds of a scene, compute the next scene as well and blend the two with `mix`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "次の場面に渡す時間は `st - len` にします。`fade` が 1 秒なら、混ぜている間は -1 から 0 へ進み、切り替わった瞬間に、次の場面の本当の 0 秒目へそのままつながります。もし 0 から渡すと、切り替わった瞬間に次の場面の時間が 1 秒ぶん戻って、動きがかくっと跳ねてしまいます。",
        en: "Pass `st - len` as the next scene's time. With a 1-second `fade`, it runs from -1 to 0 while blending and flows straight into the next scene's real second zero at the switch. If you started it at 0 instead, the next scene's clock would jump back a second at the switch and its motion would visibly snap.",
      },
    },
    {
      type: "playground",
      source: joinCode(SCENES, `
        vec4 render(vec2 uv, vec2 p) {
          float len = 4.0;
          float fade = 1.0;
          float n = floor(time / len);
          float st = mod(time, len);
          vec3 col = drawScene(mod(n, 3.0), p, st);
          //ja: 場面の最後の fade 秒で、次の場面へ混ぜていく
          //en: blend toward the next scene during the last fade seconds
          float m = smoothstep(len - fade, len, st);
          if (m > 0.0) {
            col = mix(col, drawScene(mod(n + 1.0, 3.0), p, st - len), m);
          }
          return vec4(col, 1.0);
        }
      `),
      caption: {
        ja: "`fade` を `0.2` にすると、すばやいつなぎになります。`3.0` にすると、ほとんどいつも 2 つの場面が混ざっている状態になります",
        en: "Set `fade` to `0.2` for a quick transition. At `3.0`, two scenes are blended almost all the time",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つよく使うのが、いったん黒くしてから次の場面を出す **黒を通したフェード** です。こちらは混ぜる必要がなく、場面の始めと終わりで明るさを下げるだけです。",
        en: "Another common choice is the **fade through black**: darken to black, then bring up the next scene. No blending needed; you just lower the brightness at the start and end of each scene.",
      },
    },
    {
      type: "code",
      source: `
        //ja: 始めの 0.5 秒で明るくなり、終わりの 0.5 秒で暗くなる
        //en: brighten over the first 0.5 seconds, darken over the last 0.5
        float k = smoothstep(0.0, 0.5, st) * (1.0 - smoothstep(len - 0.5, len, st));
        col *= k;
      `,
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`if (m > 0.0)` で囲んでいるのは重さのためです。混ぜている間しか次の場面を計算しないので、ふだんは 1 場面ぶんの計算で済みます。この `if` は時間だけで決まり、画面のどの点でも同じほうへ分かれるので、GPU にとってもほとんど負担になりません(重さについては [速く、小さく](/learn/performance-and-size) でくわしく扱います)。",
        en: "The `if (m > 0.0)` is there for speed: the next scene is only computed while blending, so most of the time you pay for one scene. The condition depends only on time, so every pixel takes the same branch, which costs the GPU next to nothing (more on speed in [Fast and small](/learn/performance-and-size)).",
      },
    },

    { type: "heading", text: { ja: "ワイプでつなぐ", en: "Wipes" } },
    {
      type: "paragraph",
      text: {
        ja: "**ワイプ** は、境目の線が画面を横切りながら、次の場面へ塗り替えていくつなぎ方です。境目の位置を進み具合で動かし、境目の片側を次の場面にします。フェードとの違いは、混ぜる割合が時間だけでなく **場所** で決まることです。",
        en: "A **wipe** replaces one scene with the next as a boundary line sweeps across the screen. Move the boundary with the transition progress, and show the next scene on one side of it. Unlike a fade, the blend depends on **position**, not just time.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "境目は `mix(-2.1, 2.1, m)` で動かします。`p.x` は横長の 16:9 の画面でも ±1.78 くらいまでなので、-2.1 から 2.1 まで動かせば、どの縦横比でも画面の外から外まで通り抜けます。測る量 `s` を `p.x` から `length(p)` に変えると、円が広がるワイプになります。",
        en: "Move the boundary with `mix(-2.1, 2.1, m)`. Even on a wide 16:9 screen `p.x` only reaches about ±1.78, so going from -2.1 to 2.1 sweeps from fully off-screen to fully off-screen at any aspect ratio. Change the measured quantity `s` from `p.x` to `length(p)` and you get a circle that grows outward.",
      },
    },
    {
      type: "playground",
      source: joinCode(SCENES, EASE_IN_OUT, `
        vec4 render(vec2 uv, vec2 p) {
          float len = 4.0;
          float wipe = 1.2;
          float n = floor(time / len);
          float st = mod(time, len);
          vec3 col = drawScene(mod(n, 3.0), p, st);
          float m = easeInOutCubic(smoothstep(len - wipe, len, st));
          if (m > 0.0) {
            float edge = mix(-2.1, 2.1, m);
            float s = p.x;
            // float s = length(p) * 2.0 - 2.0;
            // float s = (p.x + p.y) * 0.7;
            //ja: s が境目より小さい側を、次の場面にする
            //en: the side where s is smaller than the edge shows the next scene
            float mask = 1.0 - smoothstep(edge - 0.01, edge + 0.01, s);
            col = mix(col, drawScene(mod(n + 1.0, 3.0), p, st - len), mask);
            //ja: 境目の光の線
            //en: a line of light along the edge
            col += vec3(1.0, 0.9, 0.7) * exp(-abs(s - edge) * 30.0) * m * (1.0 - m) * 4.0;
          }
          return vec4(col, 1.0);
        }
      `),
      caption: {
        ja: "`float s = p.x;` の先頭に `//` を付け、その下の 2 行のどちらかの `//` を消すと、円や斜めのワイプになります。`wipe` を `0.4` にすると、すばやく横切ります",
        en: "Put `//` in front of `float s = p.x;` and remove the `//` from one of the two lines below it for a circular or diagonal wipe. Set `wipe` to `0.4` for a quick sweep",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "境目には、細い光の線を足しています。`exp(-abs(s - edge) * 30.0)` は、境目の上で 1、離れると急に 0 になる形です。さらに `m * (1.0 - m)` をかけて、ワイプの真ん中でいちばん明るくし、始めと終わりで線が急に現れたり消えたりしないようにしています。",
        en: "A thin line of light rides along the boundary. `exp(-abs(s - edge) * 30.0)` is 1 on the boundary and drops quickly to 0 away from it. Multiplying by `m * (1.0 - m)` makes it brightest mid-wipe, so the line doesn't pop in or out at the start and end.",
      },
    },

    { type: "heading", text: { ja: "イージングで動きに表情を", en: "Easing for expressive motion" } },
    {
      type: "paragraph",
      text: {
        ja: "[時間で動かす](/learn/time-and-motion) では、`smoothstep` や `pow` で加速・減速をつける **イージング** を少し使いました。演出では、イージングの選び方で動きの性格ががらりと変わります。やることは、0〜1 の進み具合 `k` を、形の違う 0〜1 の曲線に通すだけです。",
        en: "In [Time and motion](/learn/time-and-motion) we touched on **easing**: using `smoothstep` or `pow` to speed up and slow down. When directing, the easing you choose completely changes a movement's character. All it takes is passing the 0–1 progress `k` through a differently shaped 0–1 curve.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "そのまま(`k`)… 一定の速さ。機械的に見える", en: "Linear (`k` as is): constant speed, which feels mechanical" },
        {
          ja: "`smoothstep(0.0, 1.0, k)` … ゆっくり動き出して、ゆっくり止まる",
          en: "`smoothstep(0.0, 1.0, k)`: starts gently and stops gently",
        },
        {
          ja: "`easeInOutCubic` … もっと強い加速と減速。始めと終わりの「ため」が長い",
          en: "`easeInOutCubic`: stronger acceleration and braking, lingering longer at both ends",
        },
        {
          ja: "`easeOutBack` … 少し行きすぎてから戻る。勢いがある",
          en: "`easeOutBack`: overshoots a little, then settles back, full of energy",
        },
        {
          ja: "`easeOutElastic` … ばねのように揺れながら止まる",
          en: "`easeOutElastic`: wobbles like a spring before coming to rest",
        },
      ],
    },
    {
      type: "playground",
      source: joinCode(EASE_IN_OUT, `
        float easeOutBack(float x) {
          float y = x - 1.0;
          return 1.0 + 2.70158 * y * y * y + 1.70158 * y * y;
        }

        float easeOutElastic(float x) {
          return 1.0 - exp(-6.0 * x) * cos(x * 14.0);
        }

        //ja: 高さ y の線の上に、進み具合 e の位置のボールを描く
        //en: draw a ball at progress e along a track at height y
        vec3 drawBall(vec3 col, vec2 p, float y, float e, vec3 ballColor) {
          float track = 1.0 - smoothstep(0.0, 0.006, abs(p.y - y));
          col += vec3(0.06) * track * step(abs(p.x), 1.0);
          float ball = 1.0 - smoothstep(0.07, 0.08, length(p - vec2(mix(-1.0, 1.0, e), y)));
          return mix(col, ballColor, ball);
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 2 秒で動いて 0.5 秒止まる、をくり返す
          //en: move for 2 seconds, rest for 0.5, repeat
          float k = clamp(fract(time / 2.5) * 1.25, 0.0, 1.0);
          vec3 col = vec3(0.07, 0.07, 0.1);
          col = drawBall(col, p, 0.6, k, vec3(0.6));
          col = drawBall(col, p, 0.3, smoothstep(0.0, 1.0, k), vec3(0.3, 0.7, 1.0));
          col = drawBall(col, p, 0.0, easeInOutCubic(k), vec3(0.4, 0.9, 0.5));
          col = drawBall(col, p, -0.3, easeOutBack(k), vec3(1.0, 0.7, 0.2));
          col = drawBall(col, p, -0.6, easeOutElastic(k), vec3(1.0, 0.35, 0.45));
          return vec4(col, 1.0);
        }
      `),
      caption: {
        ja: "上から順に、そのまま・`smoothstep`・`easeInOutCubic`・`easeOutBack`・`easeOutElastic` です。`easeOutBack` の `2.70158` と `1.70158` を `2.0` と `1.0` にすると、行きすぎが小さくなります",
        en: "From top to bottom: linear, `smoothstep`, `easeInOutCubic`, `easeOutBack`, `easeOutElastic`. Change `2.70158` and `1.70158` in `easeOutBack` to `2.0` and `1.0` for a smaller overshoot",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "どの関数も、`k` が 0 のとき 0、1 のとき 1 を返すように作られています。だから、どれに差し替えても、動きの始まりと終わりの位置は変わらず、途中の進み方だけが変わります。`easeOutBack` は途中で 1 を少し超えるので、ボールが右端を少し通りすぎてから戻ってきます。",
        en: "Every one of these returns 0 when `k` is 0 and 1 when `k` is 1. So whichever you swap in, the start and end positions stay the same; only how it gets there changes. `easeOutBack` goes slightly above 1 along the way, which is why its ball overshoots the right end and comes back.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "イージングの式を自分で書くときは、`pow(x - 1.0, 3.0)` のように、**マイナスになりうる数を `pow` に入れない** でください。GLSL の `pow` は 1 つ目の数がマイナスのときの結果が決まっておらず、GPU によっては真っ黒(NaN)になります。3 乗なら `y * y * y` のようにかけ算で書きます。",
        en: "When writing easing formulas yourself, **never pass a number that might be negative to `pow`**, as in `pow(x - 1.0, 3.0)`. GLSL leaves `pow` undefined for a negative first argument, and some GPUs return black (NaN). Write a cube as a product, like `y * y * y`.",
      },
    },

    { type: "heading", text: { ja: "キーフレームで振り付ける", en: "Choreographing with keyframes" } },
    {
      type: "paragraph",
      text: {
        ja: "1 つの場面の中でも、「入ってくる、少し止まって回る、また止まって大きくなる」のように、いくつかの動きを順に並べたくなります。アニメーションの道具で **キーフレーム** と呼ばれるものです。シェーダーでは、時間 `t` が区間 a〜b のどこにいるかを 0〜1 で返す小さな関数を作ると、これが簡単に書けます。",
        en: "Even within one scene you'll often want several moves in sequence: slide in, pause, rotate, pause, grow. Animation tools call these **keyframes**. In a shader, a tiny function that returns where `t` is within the interval from a to b, as a 0–1 value, makes this easy.",
      },
    },
    {
      type: "code",
      source: `
        float seg(float t, float a, float b) {
          return clamp((t - a) / (b - a), 0.0, 1.0);
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "`seg(t, 1.2, 1.8)` は、`t` が 1.2 秒より前なら 0、1.8 秒より後なら 1、その間は 0 から 1 へまっすぐ進みます。`t` が 1.5 なら 0.5 です。これをイージングに通して、位置・角度・大きさに使えば、1 つ 1 つの動きが「いつ始まり、いつ終わるか」を秒で決められます。動きと動きの間に、わざと何も動かない時間を空けると、それぞれの動きがはっきり見えます。",
        en: "`seg(t, 1.2, 1.8)` is 0 before 1.2 seconds, 1 after 1.8 seconds, and runs straight from 0 to 1 in between: at `t` = 1.5 it is 0.5. Pass it through an easing and use it for position, angle or size, and you decide exactly when each move starts and ends, in seconds. Leaving deliberate pauses between moves makes each one read clearly.",
      },
    },
    {
      type: "playground",
      source: joinCode(`
        #define PI 3.14159265

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
      `, EASE_IN_OUT, `
        float easeOutBack(float x) {
          float y = x - 1.0;
          return 1.0 + 2.70158 * y * y * y + 1.70158 * y * y;
        }

        float easeOutElastic(float x) {
          return 1.0 - exp(-6.0 * x) * cos(x * 14.0);
        }

        float seg(float t, float a, float b) {
          return clamp((t - a) / (b - a), 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float t = mod(time, 5.0);
          //ja: 0〜0.8 秒で入る、1.2〜1.8 秒で回る、2.2〜3.2 秒で大きくなる、4.0〜4.6 秒で消える
          //en: slide in at 0–0.8 s, turn at 1.2–1.8 s, grow at 2.2–3.2 s, fade out at 4.0–4.6 s
          float x = mix(-2.0, 0.0, easeOutBack(seg(t, 0.0, 0.8)));
          float ang = PI * 0.5 * easeInOutCubic(seg(t, 1.2, 1.8));
          float s = 1.0 + 0.6 * easeOutElastic(seg(t, 2.2, 3.2));
          float fade = 1.0 - seg(t, 4.0, 4.6);

          vec2 q = rot(-ang) * (p - vec2(x, 0.0)) / s;
          float d = sdBox(q, vec2(0.32, 0.16)) * s - 0.03;
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.1, 0.12, 0.2), vec3(0.03, 0.03, 0.06), length(p) * 0.6);
          col += vec3(0.2, 0.3, 0.6) * exp(-max(d, 0.0) * 6.0) * 0.4 * fade;
          col = mix(col, vec3(1.0, 0.55, 0.25), (1.0 - smoothstep(-px, px, d)) * fade);
          return vec4(col, 1.0);
        }
      `),
      caption: {
        ja: "`seg(t, 1.2, 1.8)` を `seg(t, 0.4, 1.8)` にすると、入ってくる途中から回り始めます。`easeOutBack` を `easeInOutCubic` にすると、入り方がおとなしくなります",
        en: "Change `seg(t, 1.2, 1.8)` to `seg(t, 0.4, 1.8)` and it starts turning while still sliding in. Replace `easeOutBack` with `easeInOutCubic` for a calmer entrance",
      },
    },

    { type: "heading", text: { ja: "拍に合わせる", en: "On the beat" } },
    {
      type: "paragraph",
      text: {
        ja: "音楽に合わせた映像では、**BPM**(1 分間の拍の数)から拍を計算します。BPM が 120 なら 1 分に 120 拍、つまり 1 秒に 2 拍です。`time * bpm / 60.0` は、「いままでに何拍たったか」になります。",
        en: "For visuals that follow music, compute beats from the **BPM** (beats per minute). At 120 BPM there are 120 beats a minute, which is 2 per second. `time * bpm / 60.0` tells you how many beats have gone by.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "`floor(beat)` … 何拍目か", en: "`floor(beat)` … which beat we're on" },
        {
          ja: "`fract(beat)` … 拍の中の位置。拍の頭で 0、次の拍の直前で 1 に近い",
          en: "`fract(beat)` … the position within the beat: 0 right on the beat, close to 1 just before the next",
        },
        {
          ja: "`mod(floor(beat), 4.0)` … 小節(4 拍)の中の何拍目か。0 が小節の頭",
          en: "`mod(floor(beat), 4.0)` … which beat of the bar (4 beats) it is; 0 is the first beat",
        },
        { ja: "`floor(beat / 4.0)` … 何小節目か", en: "`floor(beat / 4.0)` … which bar we're in" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "拍に合わせた「ドン」という動きは、`exp(-fract(beat) * 8.0)` で作れます。拍の頭で 1、そこから急に小さくなる形で、太鼓をたたいた瞬間に大きく鳴って、すぐ消えていく音に似ています。`8.0` を大きくするほど、短く鋭くなります。さらに小節の頭だけを強くすると(**アクセント**)、4 拍ずつのまとまりが見えてきます。",
        en: "A punchy on-beat hit comes from `exp(-fract(beat) * 8.0)`. It's 1 right on the beat and drops off fast, much like a drum that's loud the instant it's struck and fades right away. A bigger `8.0` makes it shorter and sharper. Make the first beat of each bar stronger (an **accent**) and the four-beat groups start to come through.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float bpm = 120.0;
          float beat = time * bpm / 60.0;
          float b = floor(beat);
          float f = fract(beat);
          float inBar = mod(b, 4.0);
          float bar = floor(b / 4.0);

          float kick = exp(-f * 8.0);                  //ja: 拍の頭で 1、すぐ消える //en: 1 on the beat, then gone
          float accent = inBar < 0.5 ? 1.0 : 0.45;     //ja: 小節の頭を強く //en: stronger on the first beat

          //ja: 小節ごとに色を変える
          //en: a new color every bar
          vec3 tint = palette(bar * 0.23, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          float px = 2.0 / resolution.y;
          vec3 col = tint * 0.08 + tint * 0.25 * kick * accent * (1.0 - smoothstep(0.0, 1.5, length(p)));
          float r = 0.3 + 0.12 * kick * accent;
          float d = length(p - vec2(0.0, 0.1)) - r;
          col = mix(col, tint, 1.0 - smoothstep(-px, px, d));
          col += tint * exp(-max(d, 0.0) * 8.0) * 0.5 * kick;

          //ja: 下に 4 つの点。いまの拍だけ明るい
          //en: four dots at the bottom; only the current beat is lit
          for (int i = 0; i < 4; i++) {
            vec2 c = vec2(-0.45 + float(i) * 0.3, -0.72);
            float on = abs(float(i) - inBar) < 0.5 ? 1.0 : 0.2;
            float m = 1.0 - smoothstep(0.05 - px, 0.05 + px, length(p - c));
            col = mix(col, vec3(on), m);
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`bpm` を `90.0` や `174.0` にしてみましょう。`exp(-f * 8.0)` の `8.0` を `3.0` にすると、ふわっとした脈打ちになります",
        en: "Try `bpm` at `90.0` or `174.0`. Change the `8.0` in `exp(-f * 8.0)` to `3.0` for a soft, breathing pulse",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "このサイトの作品は、音を聞くことはできません。BPM を曲と同じにすれば **速さ** はそろいますが、拍の頭が曲の拍とぴったり重なるかどうかは、作品が動き出したタイミングしだいです。配信の背景などでは、拍の頭が少しずれていても気にならない、ゆるやかな脈打ちにしておくのも 1 つの手です。",
        en: "Works on this site can't hear audio. Matching the BPM to a song gets the **tempo** right, but whether the beats land exactly on the song's beats depends on when the work started playing. For stream backgrounds and the like, a gentle pulse that doesn't mind being slightly off-beat is one good option.",
      },
    },

    { type: "heading", text: { ja: "カメラを動かす", en: "Moving the camera" } },
    {
      type: "paragraph",
      text: {
        ja: "3D の場面では、カメラの動きがそのまま演出になります。映画のように、場面(**ショット**)ごとにカメラの置き方を変え、1 つのショットの中では 1 つの動きだけをゆっくり行うと、見ている人が迷いません。よく使う動きは次の 3 つです。",
        en: "In a 3D scene, camera movement is direction in itself. As in film, give each scene (each **shot**) its own camera setup, and within a shot make just one slow movement; viewers won't get lost. Three moves cover a lot:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "回り込み … 主役の周りを回る。全体の形を見せる",
          en: "Orbit: circle around the subject to show its whole shape",
        },
        {
          ja: "寄り(ドリー)… 主役へ近づく。注目させる",
          en: "Dolly in: move toward the subject to draw attention to it",
        },
        {
          ja: "上昇(クレーン)… 上へ上がって見下ろす。場所の広がりを見せる",
          en: "Crane up: rise and look down to reveal the space around it",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "どれも、[レイとカメラ](/learn/rays-and-camera) の `camera(ro, ta)` の `ro`(カメラの位置)を、ショットの進み具合 `k` とイージングで動かしているだけです。ショットの番号で `if` を分け、ショットとショットはカットでつなぎます。",
        en: "Each of these simply moves `ro` (the camera position) in `camera(ro, ta)` from [Rays and cameras](/learn/rays-and-camera), using the shot's progress `k` and an easing. An `if` on the shot number picks the setup, and shots are joined with cuts.",
      },
    },
    {
      type: "playground",
      source: joinCode(`
        #define PI 3.14159265
        #define TAU 6.28318531

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
      `, EASE_IN_OUT, `
        float map(vec3 p) {
          float ball = length(p - vec3(0.0, 0.6, 0.0)) - 0.6;
          float ring = sdTorus(p - vec3(0.0, 0.6, 0.0), vec2(1.1, 0.08));
          return min(min(ball, ring), p.y);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

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
          float len = 4.0;
          float shot = mod(floor(time / len), 3.0);
          float k = fract(time / len);
          vec3 ro;
          vec3 ta = vec3(0.0, 0.6, 0.0);
          if (shot < 0.5) {
            //ja: 回り込み
            //en: orbit
            float a = time * 0.3;
            ro = vec3(4.5 * sin(a), 1.6, 4.5 * cos(a));
          } else if (shot < 1.5) {
            //ja: 寄り
            //en: dolly in
            ro = vec3(0.6, 0.5, mix(5.0, 2.2, easeInOutCubic(k)));
          } else {
            //ja: 上昇
            //en: crane up
            ro = vec3(2.0, mix(0.4, 4.5, easeInOutCubic(k)), 2.0);
          }
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 30.0) break;
            t += d;
          }
          vec3 sky = mix(vec3(0.9, 0.6, 0.45), vec3(0.25, 0.35, 0.6), clamp(rd.y * 2.0 + 0.3, 0.0, 1.0));
          vec3 col = sky;
          if (t < 30.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(-0.6, 0.7, -0.4));
            vec3 base = vec3(0.9, 0.3, 0.18);
            if (sdTorus(pos - vec3(0.0, 0.6, 0.0), vec2(1.1, 0.08)) < 0.01) base = vec3(1.0, 0.75, 0.3);
            if (pos.y < 0.01) {
              float check = mod(floor(pos.x) + floor(pos.z), 2.0);
              base = mix(vec3(0.06, 0.07, 0.1), vec3(0.2, 0.22, 0.28), check);
            }
            float dif = max(dot(n, l), 0.0) * softShadow(pos + n * 0.01, l);
            col = base * (dif * vec3(1.2, 1.0, 0.85) + vec3(0.12, 0.15, 0.22));
            col = mix(col, sky, 1.0 - exp(-t * 0.04));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `),
      caption: {
        ja: "`len` を `6.0` にすると、ゆったりしたショットになります。2 つ目のショットの `mix(5.0, 2.2, …)` の `2.2` を `1.4` にすると、もっと寄ります",
        en: "Set `len` to `6.0` for slower, calmer shots. In the second shot, change the `2.2` in `mix(5.0, 2.2, …)` to `1.4` to move in closer",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "カメラの動きは、主役の動きより遅めにすると落ち着いて見えます。カメラも主役も速く動くと、何を見ればよいのかがわからなくなります。速さを出したい場面では、カメラを止めて主役を速く動かすか、その逆にします。",
        en: "Keep the camera slower than the subject and things look composed. If both the camera and the subject move fast, viewers can't tell what to look at. When you want speed, hold the camera still and move the subject fast, or the other way around.",
      },
    },

    { type: "heading", text: { ja: "つなぎ目の無いループ", en: "Seamless loops" } },
    {
      type: "paragraph",
      text: {
        ja: "作品を GIF に書き出したり、配信の背景として流し続けたりするなら、**ちょうど一周すると最初の絵に戻る** ループにしておくと便利です。GIF は最後のコマのあと最初のコマに戻るので、元に戻らない動きがあると、つなぎ目で絵がかくっと飛んでしまいます。",
        en: "If you'll export your work as a GIF or keep it running as a stream background, it helps to make it a loop that **comes back to exactly the first frame after one cycle**. A GIF jumps from its last frame back to its first, so anything that doesn't come back around visibly snaps at the seam.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "こつは、時間をそのまま使わずに、ループの長さ `LOOP` 秒で 0 から 2π まで進む角度 `ph = TAU * fract(time / LOOP)` を作り、**すべての動きを `ph` の整数倍で作る** ことです。`sin(ph)` も `sin(ph * 3.0)` も、`ph` が 2π 進むとちょうど元に戻ります。",
        en: "The trick is not to use time directly. Make an angle `ph = TAU * fract(time / LOOP)` that goes from 0 to 2π every `LOOP` seconds, and **build every motion from whole-number multiples of `ph`**. Both `sin(ph)` and `sin(ph * 3.0)` come back exactly to where they started when `ph` advances by 2π.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "揺れ・脈打ち … `sin(ph)` や `sin(ph * 2.0)`。`sin(ph * 1.5)` は一周で元に戻らない",
          en: "Swaying and pulsing: `sin(ph)` or `sin(ph * 2.0)`. `sin(ph * 1.5)` doesn't come back around",
        },
        {
          ja: "回転 … 1 ループで 1 回転なら `rot(ph)`。6 回対称の形なら、1/6 回転(`rot(ph / 6.0)`)でも元と同じに見える",
          en: "Rotation: one full turn per loop is `rot(ph)`. A shape with six-fold symmetry looks identical after a sixth of a turn, so `rot(ph / 6.0)` works too",
        },
        {
          ja: "流れるしまや波 … 1 ループでちょうど 1 周期(または整数の周期)ずらす",
          en: "Moving stripes and waves: shift by exactly one period (or a whole number of periods) per loop",
        },
        {
          ja: "ノイズ … まっすぐ流すと戻らないので、ノイズの中を **円を描いて** 動く(`p + vec2(cos(ph), sin(ph)) * 半径`)",
          en: "Noise: drifting in a straight line never returns, so travel through the noise **in a circle** (`p + vec2(cos(ph), sin(ph)) * radius`)",
        },
      ],
    },
    {
      type: "playground",
      source: joinCode(NOISE_AND_PALETTE, `
        #define LOOP 3.0

        vec4 render(vec2 uv, vec2 p) {
          float ph = TAU * fract(time / LOOP); //ja: 3 秒で 0 → 2π //en: 0 → 2π every 3 seconds
          //ja: 背景: ノイズの中を円を描いて動く
          //en: background: travel through the noise in a circle
          vec2 orbit = vec2(cos(ph), sin(ph)) * 0.6;
          float n = fbm(p * 1.5 + orbit);
          vec3 col = palette(n * 1.2 + 0.1, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.6, 0.7, 0.8)) * 0.35;

          //ja: 6 枚の花びら: 1 ループで 1/6 回転すれば元と同じ
          //en: six petals: a sixth of a turn per loop looks the same as the start
          vec2 q = rot(ph / 6.0) * p;
          float a = atan(q.y, q.x);
          float r = length(q);
          float petal = 0.45 + 0.15 * cos(a * 6.0) + 0.05 * sin(ph * 2.0);
          float px = 2.0 / resolution.y;
          float d = r - petal;
          vec3 flower = palette(r * 1.5 - ph / TAU, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
          col = mix(col, flower, 1.0 - smoothstep(-px, px, d));
          col += flower * exp(-abs(d) * 10.0) * 0.3;

          //ja: 広がる輪: 1 ループで 2 周期ずれる
          //en: expanding rings: they move two full periods per loop
          float rings = sin(r * 20.0 - ph * 2.0);
          col += vec3(0.08) * smoothstep(0.7, 1.0, rings) * step(0.0, d);
          return vec4(col, 1.0);
        }
      `),
      caption: {
        ja: "`LOOP` を `5.0` にすると、ゆっくりになり、5 秒の GIF にぴったりのループになります。`rot(ph / 6.0)` を `rot(ph / 5.0)` にすると、一周したときに花びらの向きがずれて、つなぎ目で絵が飛びます",
        en: "Set `LOOP` to `5.0` for a slower loop that fits a 5-second GIF perfectly. Change `rot(ph / 6.0)` to `rot(ph / 5.0)` and the petals end up at the wrong angle after one cycle, so the picture jumps at the seam",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`fract` を使って `ph` を 0〜2π の中に収めているので、一周するたびに `ph` は 2π から 0 に戻ります。それでも絵が飛ばないのは、どの動きも `ph` が 0 のときと 2π のときで同じ見た目になるように作ってあるからです。逆にいうと、1 か所でも `time` をそのまま使った動きが残っていると、そこだけ一周で戻らず、ループが崩れます。",
        en: "Because `fract` keeps `ph` between 0 and 2π, it drops from 2π back to 0 at the end of every cycle. The picture doesn't jump, because every motion was built to look the same at `ph` = 0 and at `ph` = 2π. Turn that around: if even one motion still uses `time` directly, that part won't come back around and the loop breaks.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "/edit の書き出しの GIF は、3 秒か 5 秒の長さから選べます(1 秒に 20 コマ)。ループの長さは、GIF の長さを割り切れる数にしておきましょう。3 秒の GIF なら 1・1.5・3 秒、5 秒の GIF なら 1・2.5・5 秒です。拍を使うなら、BPM 120 の 1 拍は 0.5 秒なので、6 拍でちょうど 3 秒、10 拍でちょうど 5 秒になります。GIF は「いまのコマから」書き出されますが、きちんとループしていれば、どこから始めてもつなぎ目は出ません。",
        en: "The GIF export in /edit offers 3-second and 5-second lengths (at 20 frames per second). Pick a loop length that divides the GIF length evenly: 1, 1.5 or 3 seconds for a 3-second GIF, or 1, 2.5 or 5 seconds for a 5-second one. If you work with beats, one beat at 120 BPM is 0.5 seconds, so 6 beats make exactly 3 seconds and 10 beats exactly 5. The GIF starts from the current frame, but a true loop has no seam wherever it starts.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "配信の背景(/stage)のように何時間も流すときにも、ループの形は役に立ちます。`time` は小数(`float`)なので、何時間もたって値が大きくなると細かい違いを表せなくなり、`sin(time * 50.0)` のような速い動きがカクカクしはじめます。乱数やノイズに時間で増える値を入れている場合はもっと深刻で、[乱数をつくる](/learn/randomness) で見たとおり、`hash21` の入力が大きくなりすぎると模様が崩れます(`hash21(floor(time))` や、時間で流れる座標の `noise` など)。長く流す作品は、時間を `fract(time / LOOP)` や `mod(time, 周期)` で包んで、いつも小さな範囲の値を使うようにしましょう。",
        en: "Loops also help when something runs for hours, like a stream background on /stage. `time` is a float, and as it grows over hours it loses fine detail, so fast motion like `sin(time * 50.0)` starts to stutter. It's worse when randomness or noise takes an input that grows with time: as you saw in [Making randomness](/learn/randomness), patterns fall apart once the input to `hash21` gets too large (think `hash21(floor(time))`, or `noise` on coordinates that drift with time). For works meant to run a long time, wrap time with `fract(time / LOOP)` or `mod(time, period)` so you always work with small values.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "拍・つなぎ・ループの 3 つを、それぞれ 1 つずつ試します。どれも、デモを仕上げるときにそのまま使える技です。",
        en: "One exercise each for beats, transitions and loops. All three are techniques you'll use directly when finishing a demo.",
      },
    },
    {
      type: "exercise",
      title: { ja: "拍ではねるボール", en: "A ball that bounces on the beat" },
      prompt: {
        ja: "BPM 128 の拍に合わせて、ボールが 1 拍に 1 回はねるようにしてください。床に着いた瞬間にボールが横に少しつぶれ、小節の頭(4 拍の 1 つ目)だけ床がピンクに光るようにします。影は、コードに書いてあるとおり、ボールが高いほど小さく薄くなります。",
        en: "Make the ball bounce once per beat at 128 BPM. When it lands it should squash a little sideways, and the floor should flash pink only on the first beat of each bar. The shadow code is already there: it shrinks and fades as the ball rises.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float bpm = 128.0;
          float beat = time * bpm / 60.0;
          float b = floor(beat);
          float f = fract(beat);
          float inBar = mod(b, 4.0);
          float px = 2.0 / resolution.y;
          float ground = -0.6;

          //ja: この 3 つを、拍に合わせて動くように書き換える
          //en: rewrite these three so they move with the beat
          float h = 0.0;          //ja: ボールの高さ 0〜1 //en: ball height, 0 to 1
          vec2 size = vec2(0.18); //ja: ボールの横と縦の大きさ //en: ball width and height
          float flash = 0.0;      //ja: 床の光 0〜1 //en: floor flash, 0 to 1

          vec2 c = vec2(0.0, ground + size.y + h * 0.9);
          vec3 col = mix(vec3(0.05, 0.04, 0.1), vec3(0.15, 0.1, 0.25), uv.y);
          if (p.y < ground) col = vec3(0.1, 0.08, 0.16) + vec3(1.0, 0.4, 0.6) * flash * 0.6;
          float sh = length((p - vec2(0.0, ground)) / vec2(0.25 * (1.0 - h * 0.4), 0.04));
          col *= 1.0 - 0.6 * (1.0 - smoothstep(0.6, 1.0, sh)) * (1.0 - h * 0.6);
          float d = length((p - c) / size) - 1.0;
          col = mix(col, vec3(1.0, 0.75, 0.3), 1.0 - smoothstep(-px * 6.0, px * 6.0, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          float bpm = 128.0;
          float beat = time * bpm / 60.0;
          float b = floor(beat);
          float f = fract(beat);
          float inBar = mod(b, 4.0);
          float px = 2.0 / resolution.y;
          float ground = -0.6;

          //ja: 1 拍に 1 回の放物線。f が 0 と 1 で床、0.5 でいちばん高い
          //en: one parabola per beat: on the floor at f = 0 and 1, highest at 0.5
          float h = 4.0 * f * (1.0 - f);
          //ja: 着地の直後に横へつぶれて、すぐ戻る
          //en: squash sideways right after landing, then spring back
          float squash = exp(-f * 12.0) * 0.35;
          vec2 size = vec2(0.18 * (1.0 + squash), 0.18 * (1.0 - squash));
          //ja: 小節の頭だけ床を光らせる
          //en: flash the floor on the first beat of each bar only
          float flash = inBar < 0.5 ? exp(-f * 5.0) : 0.0;

          vec2 c = vec2(0.0, ground + size.y + h * 0.9);
          vec3 col = mix(vec3(0.05, 0.04, 0.1), vec3(0.15, 0.1, 0.25), uv.y);
          if (p.y < ground) col = vec3(0.1, 0.08, 0.16) + vec3(1.0, 0.4, 0.6) * flash * 0.6;
          float sh = length((p - vec2(0.0, ground)) / vec2(0.25 * (1.0 - h * 0.4), 0.04));
          col *= 1.0 - 0.6 * (1.0 - smoothstep(0.6, 1.0, sh)) * (1.0 - h * 0.6);
          float d = length((p - c) / size) - 1.0;
          col = mix(col, vec3(1.0, 0.75, 0.3), 1.0 - smoothstep(-px * 6.0, px * 6.0, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "拍の中の位置 `f` が 0 と 1 で床、0.5 でいちばん高くなる形を考えます。`4.0 * f * (1.0 - f)` がまさにその形(放物線)です",
          en: "Think of a curve that's on the floor at `f` = 0 and 1 and highest at 0.5. `4.0 * f * (1.0 - f)` is exactly that shape (a parabola)",
        },
        {
          ja: "つぶれは、拍の頭で大きく、すぐ消える `exp(-f * 12.0)` で作れます。横を `1.0 + つぶれ` 倍、縦を `1.0 - つぶれ` 倍にします",
          en: "The squash is biggest on the beat and vanishes quickly: `exp(-f * 12.0)`. Scale the width by `1.0 + squash` and the height by `1.0 - squash`",
        },
        {
          ja: "`float squash = exp(-f * 12.0) * 0.35;` で `size = vec2(0.18 * (1.0 + squash), 0.18 * (1.0 - squash));`。光は `inBar < 0.5 ? exp(-f * 5.0) : 0.0` です",
          en: "`float squash = exp(-f * 12.0) * 0.35;` then `size = vec2(0.18 * (1.0 + squash), 0.18 * (1.0 - squash));`. The flash is `inBar < 0.5 ? exp(-f * 5.0) : 0.0`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "円のワイプ", en: "A circular wipe" },
      prompt: {
        ja: "3 秒ごとに夕日と星空がパッと切り替わる作品です。これを、場面の最後の 0.8 秒で、次の場面が画面の中心から円になって広がるつなぎ方に変えてください。円の縁は細く光らせ、広がり方にはイージングをかけます。",
        en: "This piece cuts between a sunset and a starry night every 3 seconds. Change it so that during the last 0.8 seconds of each scene, the next scene grows out of the center of the screen as a circle. Give the circle a thin glowing rim, and ease how it grows.",
      },
      starter: joinCode(SUNSET_AND_NIGHT, `
        vec4 render(vec2 uv, vec2 p) {
          float len = 3.0;
          float n = floor(time / len);
          float st = mod(time, len);
          //ja: いまは 3 秒ごとにパッと切り替わる
          //en: for now it simply cuts every 3 seconds
          vec3 col = mod(n, 2.0) < 0.5 ? sceneSunset(p, st) : sceneNight(p, st);
          return vec4(col, 1.0);
        }
      `),
      solution: joinCode(SUNSET_AND_NIGHT, `
        vec3 drawScene(float id, vec2 p, float t) {
          return mod(id, 2.0) < 0.5 ? sceneSunset(p, t) : sceneNight(p, t);
        }

        vec4 render(vec2 uv, vec2 p) {
          float len = 3.0;
          float wipe = 0.8;
          float n = floor(time / len);
          float st = mod(time, len);
          vec3 col = drawScene(n, p, st);
          //ja: 場面の最後の 0.8 秒で、次の場面が中心から円になって広がる
          //en: in the last 0.8 seconds, the next scene grows from the center as a circle
          float m = easeInOutCubic(smoothstep(len - wipe, len, st));
          if (m > 0.0) {
            float radius = m * 2.2;
            float r = length(p);
            float mask = 1.0 - smoothstep(radius - 0.01, radius + 0.01, r);
            col = mix(col, drawScene(n + 1.0, p, st - len), mask);
            //ja: 円の縁を光らせる。動き始めと終わりは消す
            //en: a glowing rim that fades out at the start and end of the wipe
            col += vec3(1.0, 0.85, 0.6) * exp(-abs(r - radius) * 25.0) * m * (1.0 - m) * 4.0;
          }
          return vec4(col, 1.0);
        }
      `),
      hints: [
        {
          ja: "番号で場面を選ぶ関数 `drawScene(id, p, t)` を作ると、いまの場面と次の場面(番号 `n + 1.0`)を両方呼べます",
          en: "Write a `drawScene(id, p, t)` that picks a scene by number, so you can call both the current scene and the next one (number `n + 1.0`)",
        },
        {
          ja: "進み具合は `easeInOutCubic(smoothstep(len - wipe, len, st))` です。円の半径をこれに比例させ、`length(p)` が半径より小さいところを次の場面にします",
          en: "The progress is `easeInOutCubic(smoothstep(len - wipe, len, st))`. Make the circle's radius proportional to it, and show the next scene wherever `length(p)` is smaller than the radius",
        },
        {
          ja: "半径を `m * 2.2` にすると、画面の角まで届きます。次の場面の時間は `st - len`。縁の光は `exp(-abs(r - radius) * 25.0) * m * (1.0 - m) * 4.0` です",
          en: "A radius of `m * 2.2` reaches the corners of the screen. The next scene's time is `st - len`. The rim glow is `exp(-abs(r - radius) * 25.0) * m * (1.0 - m) * 4.0`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "3 秒でループさせる", en: "Make it loop in 3 seconds" },
      prompt: {
        ja: "この作品は `time` でいろいろ動いていますが、最初の絵に戻りません。見た目と動きの速さはあまり変えずに、3 秒でぴったり一周するループにしてください。3 秒の GIF に書き出しても、つなぎ目がわからないようにします。",
        en: "This piece moves in several ways with `time`, but never returns to its first frame. Without changing the look or the speeds much, make it a loop that comes around exactly every 3 seconds, so that a 3-second GIF has no visible seam.",
      },
      starter: joinCode(NOISE_AND_PALETTE, `
        vec4 render(vec2 uv, vec2 p) {
          //ja: どれも time で動いているが、3 秒たっても最初の絵に戻らない
          //en: everything moves with time, but nothing is back to the start after 3 seconds
          float n = fbm(p * 1.5 + vec2(time * 0.3, 0.0));
          vec2 q = rot(time * 0.5) * p;
          float grid = cos(q.x * 10.0) * cos(q.y * 10.0);
          float wave = sin(length(p) * 8.0 - time * 2.0);
          float pulse = 0.5 + 0.5 * sin(time * 3.0);

          vec3 col = palette(n + 0.2, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.6, 0.7, 0.8)) * 0.4;
          float dots = smoothstep(0.6, 0.9, grid) * (0.5 + 0.5 * wave);
          col += vec3(1.0, 0.8, 0.5) * dots * (0.4 + 0.6 * pulse);
          return vec4(col, 1.0);
        }
      `),
      solution: joinCode(NOISE_AND_PALETTE, `
        #define LOOP 3.0

        vec4 render(vec2 uv, vec2 p) {
          //ja: ph は 3 秒で 0 から 2π まで進む。動きはすべて ph の整数倍で作る
          //en: ph goes from 0 to 2π every 3 seconds; every motion uses whole multiples of it
          float ph = TAU * fract(time / LOOP);
          //ja: ノイズの中を円を描いて動く。1 周で元の場所に戻る
          //en: circle through the noise, back at the start after one lap
          float n = fbm(p * 1.5 + vec2(cos(ph), sin(ph)) * 0.45);
          //ja: 格子は 90 度回すと元と同じなので、1 ループで 1/4 回転
          //en: the grid looks the same after a 90-degree turn, so turn a quarter per loop
          vec2 q = rot(ph / 4.0) * p;
          float grid = cos(q.x * 10.0) * cos(q.y * 10.0);
          float wave = sin(length(p) * 8.0 - ph);
          float pulse = 0.5 + 0.5 * sin(ph);

          vec3 col = palette(n + 0.2, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.6, 0.7, 0.8)) * 0.4;
          float dots = smoothstep(0.6, 0.9, grid) * (0.5 + 0.5 * wave);
          col += vec3(1.0, 0.8, 0.5) * dots * (0.4 + 0.6 * pulse);
          return vec4(col, 1.0);
        }
      `),
      hints: [
        {
          ja: "`float ph = TAU * fract(time / 3.0);` を作り、`time` を使っている 4 か所を、すべて `ph` を使う形に書き直します",
          en: "Make `float ph = TAU * fract(time / 3.0);` and rewrite all four places that use `time` in terms of `ph`",
        },
        {
          ja: "`ph` は 1 秒におよそ 2.1 進みます。`sin(time * 3.0)` は `sin(ph)` か `sin(ph * 2.0)` に。`ph * 1.5` のような整数でない倍は、一周で戻りません",
          en: "`ph` advances about 2.1 per second. Replace `sin(time * 3.0)` with `sin(ph)` or `sin(ph * 2.0)`; a non-whole multiple like `ph * 1.5` won't come back around",
        },
        {
          ja: "格子 `cos(q.x * 10.0) * cos(q.y * 10.0)` は 90 度回すと元と同じなので、回転は `rot(ph / 4.0)`(1 ループで 1/4 回転)。ノイズは `fbm(p * 1.5 + vec2(cos(ph), sin(ph)) * 0.45)` で円を描いて動かします",
          en: "The grid `cos(q.x * 10.0) * cos(q.y * 10.0)` looks the same after a 90-degree turn, so rotate with `rot(ph / 4.0)` (a quarter turn per loop). For the noise, circle through it with `fbm(p * 1.5 + vec2(cos(ph), sin(ph)) * 0.45)`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`floor(time / len)` で場面の番号、`mod(time, len)` で場面の中の時間",
          en: "`floor(time / len)` gives the scene number and `mod(time, len)` the time inside it",
        },
        {
          ja: "場面は関数にして、場面の中の時間を渡す。次の場面には `st - len` を渡すとなめらかにつながる",
          en: "Make each scene a function that takes local time; pass `st - len` to the next scene so it joins up smoothly",
        },
        {
          ja: "フェードは時間で混ぜ、ワイプは場所で塗り替える",
          en: "Fades blend over time; wipes replace by position",
        },
        {
          ja: "イージングで動きの性格を決め、`seg` で動きを秒単位で並べる",
          en: "Easing sets a move's character; `seg` lays moves out second by second",
        },
        {
          ja: "拍は `time * bpm / 60.0`。`fract` で拍の中の位置、`exp(-f * 8.0)` で「ドン」",
          en: "Beats are `time * bpm / 60.0`; `fract` gives the position within a beat and `exp(-f * 8.0)` the hit",
        },
        {
          ja: "ループは、`ph = TAU * fract(time / LOOP)` の整数倍だけで動かす。長さは GIF の 3 秒・5 秒を割り切れる数に",
          en: "Loops move only by whole multiples of `ph = TAU * fract(time / LOOP)`, with a length that divides the 3- or 5-second GIF",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、作品を速く、小さくする方法を学びます。重さがどこから来るのかを知り、/edit で測りながら、投稿チェックの 8 ms に収めます。",
        en: "Next time we learn to make works fast and small: where the cost comes from, how to measure it in /edit, and how to fit inside the 8 ms posting check.",
      },
    },
  ],
};

export default lesson;
