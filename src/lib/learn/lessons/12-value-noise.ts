import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "value-noise",
  title: { ja: "なめらかなノイズ", en: "Smooth noise" },
  summary: {
    ja: "乱数をなめらかにつないだノイズで、ゆらぐ形や地形の線を描く",
    en: "Interpolate random values into noise for wobbly shapes and terrain lines",
  },
  minutes: 50,
  goals: [
    {
      ja: "整数の点に置いた乱数を `mix` でつないで、1D のノイズを作れる",
      en: "Build 1D noise by placing random values at whole numbers and joining them with `mix`",
    },
    {
      ja: "直線でつなぐと角が立つ理由と、`f * f * (3.0 - 2.0 * f)` でなめらかになるしくみがわかる",
      en: "See why straight-line joins leave corners, and how `f * f * (3.0 - 2.0 * f)` smooths them out",
    },
    {
      ja: "2D の `noise` が、マスの 4 つの角の値を混ぜていることを説明できる",
      en: "Explain how the 2D `noise` function blends the values at a cell's four corners",
    },
    {
      ja: "ノイズの拡大・時間で流す・形をゆがめる、を使い分けられる",
      en: "Scale noise, make it flow over time, and use it to wobble shapes",
    },
    {
      ja: "ノイズで山のシルエットや、地図のような色分けを作れる",
      en: "Draw hill silhouettes and map-like color bands with noise",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "ばらばらから、なめらかへ", en: "From jumpy to smooth" } },
    {
      type: "paragraph",
      text: {
        ja: "[乱数をつくる](/learn/randomness) で作ったマスごとの乱数は、隣のマスとまったく関係がありません。モザイクや紙吹雪にはそれが合っていますが、雲の濃さや丘の高さはそうはいきません。自然のものは、**近くの場所どうしは似ていて、遠く離れると関係がなくなる** という性質を持っています。雲の中で 1 歩ずれても濃さはほとんど変わりませんが、10 km 離れれば晴れているかもしれません。",
        en: "The per-cell random numbers from [Making randomness](/learn/randomness) have nothing to do with their neighbors. That suits mosaics and confetti, but not the thickness of a cloud or the height of a hill. Natural things behave like this: **nearby places are similar, and faraway places are unrelated**. Step one pace inside a cloud and its density hardly changes, but ten kilometers away the sky might be clear.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この性質を持つ数を作るのが **ノイズ** です。作り方の考え方は単純で、乱数は整数の点にだけ置き、その間はなめらかにつないで埋めます。この回では、まず 1 本の線(1D)で作り方を確かめてから、平面(2D)に広げます。",
        en: "**Noise** is how we build numbers with that property. The idea is simple: put random values only at the whole numbers, and fill the gaps in between by joining them smoothly. In this lesson we first work it out along a single line (1D), then extend it to the plane (2D).",
      },
    },

    { type: "heading", text: { ja: "1D のノイズ: 点をつなぐ", en: "1D noise: connecting the dots" } },
    {
      type: "paragraph",
      text: {
        ja: "横軸を `x` として、手順は 3 つです。`floor(x)` で左の整数 `i` を、`fract(x)` で `i` からどれだけ進んだか `f`(0〜1)を求めます。次に、`i` と `i + 1.0` の 2 つの整数の点で乱数 `a` と `b` を作ります。最後に `mix(a, b, f)` で、`f` が 0 のときは `a`、1 のときは `b`、その間は 2 つを混ぜた値にします。`hash21` は数を 2 つ受け取るので、1D では `hash21(vec2(i, 0.0))` のように y を 0 にして使います。",
        en: "With `x` as the horizontal axis, there are three steps. `floor(x)` gives the whole number to the left, `i`, and `fract(x)` gives how far past it we are, `f` (0 to 1). Next, make random values `a` and `b` at the two whole numbers `i` and `i + 1.0`. Finally, `mix(a, b, f)` returns `a` when `f` is 0, `b` when it is 1, and a blend of the two in between. `hash21` takes two numbers, so in 1D we call it as `hash21(vec2(i, 0.0))`, with y fixed at 0.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下のプレビューは、こうして作った値をグラフにしたものです。オレンジの丸が整数の点に置いた乱数、白い線がその間をつないだ値です。グラフを描く部分は [関数で形を作る](/learn/shaping-functions) と同じ方法なので、`render` の最初の 7 行に注目してください。",
        en: "The preview below graphs the result. The orange dots are the random values at the whole numbers, and the white line is what fills the gaps. The drawing part uses the same approach as [Shaping functions](/learn/shaping-functions), so focus on the first seven lines of `render`.",
      },
    },
    {
      type: "playground",
      source: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float x = p.x * 2.5 + 4.0;             //ja: 横軸(画面に 6〜7 マスぶん) //en: the x axis (6–7 cells across the screen)
          float i = floor(x);
          float f = fract(x);
          float a = hash21(vec2(i, 0.0));        //ja: 左の整数の点の乱数 //en: random value at the whole number on the left
          float b = hash21(vec2(i + 1.0, 0.0));  //ja: 右の整数の点の乱数 //en: random value at the whole number on the right
          float u = f;
          float n = mix(a, b, u);

          //ja: 値 0〜1 を、画面の高さ -0.7〜0.7 に置いて線を引く
          //en: map values 0–1 to screen heights -0.7 to 0.7 and draw the line
          float y = n * 1.4 - 0.7;
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.05, 0.06, 0.12), vec3(0.1, 0.12, 0.24), uv.y);
          if (p.y < y) col = mix(col, vec3(0.1, 0.5, 0.6), 0.5);
          col = mix(col, vec3(0.92, 0.96, 1.0), 1.0 - smoothstep(px, 3.0 * px, abs(p.y - y)));

          //ja: 整数の点に置いた乱数を丸で示す
          //en: mark the random values at the whole numbers with dots
          float k = floor(x + 0.5);
          vec2 dotPos = vec2((k - 4.0) / 2.5, hash21(vec2(k, 0.0)) * 1.4 - 0.7);
          float dotMask = 1.0 - smoothstep(0.03 - px, 0.03 + px, length(p - dotPos));
          col = mix(col, vec3(1.0, 0.55, 0.2), dotMask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`float u = f;` を `float u = 0.0;` にすると? 線が階段になります。これが、前の回の「マスごとの乱数」そのままの姿です",
        en: "Change `float u = f;` to `float u = 0.0;` and the line turns into a staircase. That's exactly what the per-cell random numbers from last lesson look like",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`u = 0.0` の階段から `u = f` に戻すと、段と段がななめの線でつながりました。点と点を直線で結ぶこの混ぜ方を **線形補間** と呼びます(補間は「間を補う」という意味です)。値がとびとびではなくなったので、もう「近くの場所どうしは似ている」という性質を満たしています。",
        en: "Going from the `u = 0.0` staircase back to `u = f`, the steps get joined by sloping lines. Joining points with straight lines like this is called **linear interpolation** (interpolating means filling in between). The values no longer jump, so we now have the \"nearby places are similar\" property.",
      },
    },

    { type: "heading", text: { ja: "角を丸める", en: "Rounding the corners" } },
    {
      type: "paragraph",
      text: {
        ja: "ただ、グラフをよく見ると、整数の点のところで線がかくっと折れています。左の直線と右の直線の傾きが違うからです。雲や地形に使うと、この折れ目が筋になって見えてしまいます。そこで、`f` をそのまま使う代わりに、0 と 1 の近くでゆっくり動く曲線に通してから `mix` に渡します。",
        en: "Look closely at the graph, though, and the line kinks at every whole number, because the slope on the left differs from the slope on the right. In clouds or terrain those kinks show up as creases. So instead of passing `f` straight to `mix`, we first run it through a curve that moves slowly near 0 and 1.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "その曲線が `f * f * (3.0 - 2.0 * f)` です。数を入れてみると、`f` が 0.1 のとき 0.028、0.25 のとき 0.156、0.5 のとき 0.5、0.75 のとき 0.844 です。真ん中はそのままで、端に近いほど 0 や 1 にぴったり寄っています。この曲線は 0 と 1 で **傾きが 0**(真横)になるので、どの整数の点でも、左から来た線と右へ出ていく線が平らにつながり、折れ目が消えます。実はこれは `smoothstep(0.0, 1.0, f)` の中身と同じ式です。",
        en: "That curve is `f * f * (3.0 - 2.0 * f)`. Plug in some numbers: at `f` = 0.1 it gives 0.028, at 0.25 it gives 0.156, at 0.5 it gives 0.5, and at 0.75 it gives 0.844. The middle stays put, while the ends hug 0 and 1. The curve has **zero slope** (perfectly flat) at both 0 and 1, so at every whole number the line coming in from the left and the line leaving to the right meet flat, and the kink disappears. In fact, this is the very formula inside `smoothstep(0.0, 1.0, f)`.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p / 1.6 + 0.5;               //ja: 画面の中央を 0〜1 のグラフにする //en: turn the middle of the screen into a 0–1 graph
          float f = clamp(g.x, 0.0, 1.0);       //ja: 0〜1 の外は平らにのばす //en: hold flat outside 0–1
          float straight = f;
          float eased = f * f * (3.0 - 2.0 * f);

          float px = 2.0 / resolution.y / 1.6;
          vec3 col = vec3(0.06, 0.07, 0.12);
          if (abs(g.x - 0.5) < 0.5 && abs(g.y - 0.5) < 0.5) col = vec3(0.1, 0.11, 0.19);
          col = mix(col, vec3(0.5, 0.55, 0.7), 1.0 - smoothstep(px, 2.0 * px, abs(g.y - straight)));
          col = mix(col, vec3(1.0, 0.6, 0.25), 1.0 - smoothstep(px, 3.0 * px, abs(g.y - eased)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "灰色の直線は、0 と 1 のところでかくっと折れています。オレンジの曲線は、そこで平らにつながります。`eased` の式を `smoothstep(0.0, 1.0, f)` に書き換えても、同じ曲線になります",
        en: "The gray straight line kinks sharply at 0 and at 1, while the orange curve joins up flat there. Rewrite `eased` as `smoothstep(0.0, 1.0, f)` and you get the same curve",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この曲線を 1D のノイズに入れてみましょう。変わったのは `u` の 1 行だけです。",
        en: "Now let's put this curve into the 1D noise. Only the `u` line has changed.",
      },
    },
    {
      type: "playground",
      source: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float x = p.x * 2.5 + 4.0 + time * 0.5;
          float i = floor(x);
          float f = fract(x);
          float a = hash21(vec2(i, 0.0));
          float b = hash21(vec2(i + 1.0, 0.0));
          float u = f * f * (3.0 - 2.0 * f);     //ja: なめらかにつなぐ //en: join smoothly
          float n = mix(a, b, u);

          float y = n * 1.4 - 0.7;
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.05, 0.06, 0.12), vec3(0.1, 0.12, 0.24), uv.y);
          if (p.y < y) col = mix(col, vec3(0.1, 0.5, 0.6), 0.5);
          col = mix(col, vec3(0.92, 0.96, 1.0), 1.0 - smoothstep(px, 3.0 * px, abs(p.y - y)));

          float k = floor(x + 0.5);
          vec2 dotPos = vec2((k - 4.0 - time * 0.5) / 2.5, hash21(vec2(k, 0.0)) * 1.4 - 0.7);
          float dotMask = 1.0 - smoothstep(0.03 - px, 0.03 + px, length(p - dotPos));
          col = mix(col, vec3(1.0, 0.55, 0.2), dotMask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "なだらかな丘の連なりになりました。`x` に `time * 0.5` を足してあるので、グラフが左へ流れていきます。`2.5` を `8.0` にすると、波が細かくなります",
        en: "Now it's a row of gentle hills. Since `time * 0.5` is added to `x`, the graph scrolls to the left. Change `2.5` to `8.0` for a finer wave",
      },
    },

    { type: "heading", text: { ja: "2D のノイズ: 4 つの角を混ぜる", en: "2D noise: blending four corners" } },
    {
      type: "paragraph",
      text: {
        ja: "平面に広げるときは、乱数を **格子点**(マス目の線が交わる点、つまり x も y も整数の点)に置きます。ある点の値は、その点を囲むマスの 4 つの角の乱数を混ぜて決めます。これが、このコースで使う `noise` 関数です。",
        en: "To extend this to the plane, we put random values at the **lattice points**: the points where grid lines cross, where both x and y are whole numbers. The value at any point is a blend of the random values at the four corners of the cell around it. Here is the `noise` function we'll use throughout the course.",
      },
    },
    {
      type: "code",
      source: `
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
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`i = floor(p)` はマスの左下の角、`f = fract(p)` はマスの中の位置(x も y も 0〜1)です",
          en: "`i = floor(p)` is the cell's bottom-left corner, and `f = fract(p)` is the position inside the cell (both x and y from 0 to 1)",
        },
        {
          ja: "`u` は、x と y それぞれに、さっきのなめらかな曲線をかけたものです",
          en: "`u` applies the smooth curve from above to x and y separately",
        },
        {
          ja: "`a`・`b`・`c`・`d` は、左下・右下・左上・右上の 4 つの角の乱数です",
          en: "`a`, `b`, `c` and `d` are the random values at the bottom-left, bottom-right, top-left and top-right corners",
        },
        {
          ja: "最後の行では、まず下の辺で `a` と `b` を、上の辺で `c` と `d` を左右に混ぜ、その 2 つを上下に混ぜます",
          en: "The last line first blends `a` with `b` along the bottom edge and `c` with `d` along the top edge, then blends those two results from bottom to top",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "たとえばマスのちょうど真ん中では、`u` が (0.5, 0.5) なので、答えは 4 つの角の平均になります。角にぴったり重なる点では、その角の乱数そのものです。混ぜ合わせるので、答えは 0〜1 の範囲に収まりますが、0 や 1 のような端の値はめったに出ず、0.5 のまわりが多くなります。",
        en: "At the exact center of a cell, for example, `u` is (0.5, 0.5), so the answer is the average of the four corners. Right on a corner, it's that corner's random value. Because it's always a blend, the result stays within 0 to 1, but extreme values like 0 or 1 are rare, and values near 0.5 are common.",
      },
    },
    {
      type: "playground",
      source: `
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

        vec4 render(vec2 uv, vec2 p) {
          float s = 4.0;                    //ja: 拡大率 //en: scale
          float n = noise(p * s);
          vec3 col = mix(vec3(0.05, 0.1, 0.28), vec3(0.98, 0.86, 0.6), n);

          //ja: マスの境目に細い線を引く
          //en: draw thin lines along the cell borders
          vec2 g = abs(fract(p * s + 0.5) - 0.5);
          float px = 2.0 / resolution.y * s;
          float grid = 1.0 - smoothstep(0.0, 1.5 * px, min(g.x, g.y));
          col = mix(col, vec3(1.0, 0.4, 0.35), grid * 0.5);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "線の交わる点に乱数が置かれ、その間が混ぜられています。`grid * 0.5` を `grid * 0.0` にすると線が消えます。`noise` の中の `vec2 u = …` を `vec2 u = f;` にすると、格子に沿った星形のくせが出てきます",
        en: "Random values sit where the lines cross, and everything in between is blended. Change `grid * 0.5` to `grid * 0.0` to hide the lines. Inside `noise`, change `vec2 u = …` to `vec2 u = f;` and star-shaped artifacts appear along the grid",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "格子点に「値」を置くので、これを **バリューノイズ** と呼びます。格子点に「傾き」を置く **パーリンノイズ** や、三角形の格子を使う **シンプレックスノイズ** もあり、少し自然に見えますが、式が長くなります。このコースの作品には、バリューノイズで十分です。",
        en: "Because it places values at the lattice points, this is called **value noise**. There's also **Perlin noise**, which places slopes at the lattice points, and **simplex noise**, which uses a triangular grid. They look a bit more natural but take more code. Value noise is plenty for the works in this course.",
      },
    },

    { type: "heading", text: { ja: "拡大と流れ", en: "Zoom and flow" } },
    {
      type: "paragraph",
      text: {
        ja: "ノイズの見た目は、入れる座標で決まります。`noise(p * 2.0)` なら画面の高さに 4 マスぶんの大きなうねり、`noise(p * 10.0)` なら 20 マスぶんの細かなまだらになります。座標に `time` を足せば模様が流れ、x と y に違う倍率をかければ、片方向に伸びた模様になります。",
        en: "What noise looks like depends on the coordinates you feed it. `noise(p * 2.0)` gives big swells, about 4 cells across the screen's height; `noise(p * 10.0)` gives fine mottling, 20 cells across. Add `time` to the coordinates and the pattern flows; scale x and y differently and the pattern stretches in one direction.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "流れる向きには注意が要ります。`noise(p * 3.0 + vec2(time, 0.0))` では、模様は **左** へ流れます。点 `p` が見る場所が時間とともに右へずれていくので、画面の上では模様が左へ動いて見えるのです([座標を動かす](/learn/transforms) で、座標を動かすと図形は逆向きに動いたのと同じです)。また、`p * 3.0 + time` のように `vec2` に数 1 つを足すと、x と y の両方に足されるので、模様はななめに流れます。",
        en: "Watch the direction of the flow. With `noise(p * 3.0 + vec2(time, 0.0))`, the pattern moves **left**. The spot that each point `p` looks at slides to the right over time, so on screen the pattern appears to move left (just like in [Moving space](/learn/transforms), where moving the coordinates moved the shape the opposite way). And adding a single number to a `vec2`, as in `p * 3.0 + time`, adds it to both x and y, so the pattern drifts diagonally.",
      },
    },
    {
      type: "playground",
      source: `
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

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = p * 3.0 + vec2(time * 0.4, 0.0);  //ja: 模様が左へ流れる //en: the pattern flows left
          float n = noise(q);

          vec3 deep = vec3(0.02, 0.1, 0.28);
          vec3 shallow = vec3(0.15, 0.7, 0.8);
          vec3 col = mix(deep, shallow, smoothstep(0.2, 0.8, n));
          col += vec3(0.9, 1.0, 1.0) * smoothstep(0.7, 0.85, n) * 0.5;  //ja: 高いところを光らせる //en: light up the peaks
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`p * 3.0` を `p * vec2(1.0, 8.0)` にすると、横に長く伸びた、水面のような模様になります。`vec2(time * 0.4, 0.0)` を `vec2(0.0, -time * 0.4)` にすると、上へ流れます",
        en: "Change `p * 3.0` to `p * vec2(1.0, 8.0)` for a pattern stretched sideways, like a water surface. Change `vec2(time * 0.4, 0.0)` to `vec2(0.0, -time * 0.4)` and it flows upward",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`p * vec2(1.0, 8.0)` で横に伸びるのは、y 方向だけ 8 倍細かくなるからです。x 方向は 1 マスの幅が 1(画面の高さの半分)もあるのに、y 方向は 1/8 しかないので、横長の筋がたくさん重なった模様になります。",
        en: "`p * vec2(1.0, 8.0)` stretches the pattern sideways because only the y direction gets 8 times finer. In x a cell is a full unit wide (half the screen's height), but in y it's only 1/8 tall, so you get lots of long horizontal streaks stacked up.",
      },
    },

    { type: "heading", text: { ja: "ノイズで形をゆがめる", en: "Wobbling shapes with noise" } },
    {
      type: "paragraph",
      text: {
        ja: "ノイズは模様そのものだけでなく、形の「ゆらぎ」にも使えます。[円と距離](/learn/circles-and-distance) の円は `length(p) - r` でした。この半径 `r` を、方向によって少しずつ変えれば、ぷよぷよと形の変わる生き物のような形になります。",
        en: "Noise isn't just for textures; it's also great for making shapes wobble. The circle from [Circles and distance](/learn/circles-and-distance) was `length(p) - r`. Make the radius `r` vary a little with direction, and you get a squishy, shape-shifting blob that looks almost alive.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "方向ごとにノイズを変えるには、[極座標](/learn/polar-coordinates) の角度 `atan(p.y, p.x)` を使いたくなります。でもそれをそのままノイズに入れると、角度が -π から π に跳ぶ左側で値が合わず、切れ目ができます。そこで、`normalize(p)`(`p` と同じ向きで長さが 1 の矢印、つまり単位円の上の点)をノイズに入れます。ぐるりと一周すると同じ点に戻ってくるので、切れ目ができません。",
        en: "To vary noise by direction, you might reach for the angle `atan(p.y, p.x)` from [Polar coordinates](/learn/polar-coordinates). But feed that straight into noise and the values don't match up on the left, where the angle jumps from -π to π, leaving a seam. Instead, feed noise `normalize(p)`: an arrow pointing the same way as `p` but with length 1, in other words a point on the unit circle. Going all the way around brings you back to the same point, so there's no seam.",
      },
    },
    {
      type: "playground",
      source: `
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

        vec4 render(vec2 uv, vec2 p) {
          vec2 dir = normalize(p);                     //ja: 単位円の上の点 //en: a point on the unit circle
          float wobble = noise(dir * 1.5 + time * 0.5);
          float r = 0.55 + 0.3 * (wobble - 0.5);       //ja: 半径を 0.4〜0.7 くらいでゆらす //en: wobble the radius between about 0.4 and 0.7
          float d = length(p) - r;

          float px = 2.0 / resolution.y;
          float mask = 1.0 - smoothstep(-px, px, d);
          float glow = 1.0 - smoothstep(0.0, 0.35, d);

          vec3 col = mix(vec3(0.05, 0.02, 0.1), vec3(0.6, 0.1, 0.4), glow * glow * 0.6);
          vec3 inside = mix(vec3(1.0, 0.85, 0.4), vec3(1.0, 0.3, 0.45), length(p) / r);
          col = mix(col, inside, mask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`dir * 1.5` の `1.5` を `3.0` にすると、でこぼこが増えます。`noise(dir * 1.5 + time * 0.5)` を `noise(vec2(atan(p.y, p.x) * 2.0, time * 0.5))` にすると、左側に切れ目ができるのが見えます",
        en: "Change the `1.5` in `dir * 1.5` to `3.0` for more bumps. Replace `noise(dir * 1.5 + time * 0.5)` with `noise(vec2(atan(p.y, p.x) * 2.0, time * 0.5))` and you'll see a seam on the left",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`dir * 1.5` の `1.5` は、ノイズの中で描く円の半径です。円が大きいほど、一周の間にたくさんのマスを通るので、でこぼこが増えます。`+ time * 0.5` で円ごとノイズの中を移動させているので、形がゆっくり変わり続けます。",
        en: "The `1.5` in `dir * 1.5` is the radius of the circle we trace through the noise. A bigger circle passes through more cells on the way around, so you get more bumps. `+ time * 0.5` slides that whole circle through the noise, so the shape keeps slowly changing.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ゆがめた後の `length(p) - r` は、もう正確な「縁までの距離」ではありません。でもゆらぎが小さいうちは十分近いので、なめらかな縁やぼんやりした光にはそのまま使えます。",
        en: "After the wobble, `length(p) - r` is no longer the exact distance to the edge. But as long as the wobble is modest it's close enough, and works fine for smooth edges and soft glows.",
      },
    },

    { type: "heading", text: { ja: "山のシルエット", en: "Hill silhouettes" } },
    {
      type: "paragraph",
      text: {
        ja: "1D のノイズのグラフは、そのまま山の稜線(尾根の線)に見えます。`p.y` が稜線の高さより下なら山、上なら空です。2D の `noise` で 1D のノイズを作るには、y を決まった数にして、横 1 列だけを使います。y の数を変えれば別の列、つまり別の形の稜線になるので、遠くの山と近くの山で違う数を使います。",
        en: "A 1D noise graph already looks like a ridgeline. If `p.y` is below the ridge height, it's mountain; above, it's sky. To get 1D noise out of the 2D `noise`, fix y at some number and use just that one row. A different y gives a different row, and so a differently shaped ridge, so we use one number for the far hills and another for the near ones.",
      },
    },
    {
      type: "playground",
      source: `
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

        vec4 render(vec2 uv, vec2 p) {
          //ja: 夕焼けの空と太陽
          //en: sunset sky and sun
          vec3 col = mix(vec3(1.0, 0.6, 0.4), vec3(0.3, 0.22, 0.5), uv.y);
          float sun = 1.0 - smoothstep(0.2, 0.22, length(p - vec2(0.45, 0.2)));
          col = mix(col, vec3(1.0, 0.92, 0.65), sun);

          float px = 2.0 / resolution.y;
          //ja: 遠くの丘(ゆっくり流れる)
          //en: far hills (scroll slowly)
          float h1 = -0.05 + 0.4 * noise(vec2(p.x * 1.5 + time * 0.05, 1.0));
          col = mix(col, vec3(0.55, 0.3, 0.45), 1.0 - smoothstep(-px, px, p.y - h1));
          //ja: 近くの丘(速く流れる)
          //en: near hills (scroll faster)
          float h2 = -0.6 + 0.45 * noise(vec2(p.x * 2.5 + time * 0.15, 7.0));
          col = mix(col, vec3(0.2, 0.1, 0.22), 1.0 - smoothstep(-px, px, p.y - h2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`p.x * 2.5` を `p.x * 6.0` にすると、近くの丘が細かくなります。でも、どれだけ細かくしても丸い丘のままで、ごつごつした山にはなりません",
        en: "Change `p.x * 2.5` to `p.x * 6.0` and the near hills get narrower. But however fine you make them, they stay round hills; they never turn into rugged mountains",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "近くの丘ほど速く流れるようにしてあるので、横に動く窓から眺めているような奥行きが出ます(遠くのものほどゆっくり動いて見えるこの効果を **視差** と呼びます)。色も、遠くの丘は空の色に近く、近くの丘は暗くしてあります。遠くのものほど空気の層を通して見えるので、空の色に溶けていくからです。",
        en: "The nearer hills scroll faster, which gives a sense of depth, like watching from the window of a moving train. (Far things appearing to move more slowly is called **parallax**.) The colors help too: the far hills are close to the sky color and the near ones are dark, because the farther away something is, the more air you see it through, so it fades into the sky.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ただ、本物の山は、大きな山の形の上に、尾根や岩の小さなでこぼこが重なっています。1 つのノイズには 1 つの大きさのうねりしか無いので、どうしても丸い丘になります。大きさの違うノイズを重ねてこれを解決するのが、次の回の fBm です。",
        en: "Real mountains, though, have small ridges and rocky bumps layered on top of their big shapes. A single noise only has swells of one size, so it always gives round hills. Layering noise of different sizes solves this, and that's fBm, the topic of the next lesson.",
      },
    },

    { type: "heading", text: { ja: "ノイズで色を選ぶ", en: "Choosing colors with noise" } },
    {
      type: "paragraph",
      text: {
        ja: "ノイズの値を「高さ」と考えると、高さに応じて色を変えるだけで地図ができます。高さがある値より低ければ海、少し上なら砂浜、もっと上なら草地、岩、雪。`step(しきい値, h)` は `h` がしきい値以上なら 1 になるので、`mix` と組み合わせて、下の色から順に上書きしていきます。",
        en: "Think of the noise value as height, and coloring by height gives you a map. Below some level it's sea; a little higher, beach; higher still, grass, then rock, then snow. `step(threshold, h)` is 1 when `h` is at or above the threshold, so combined with `mix`, it lets you paint over the colors one level at a time, from the bottom up.",
      },
    },
    {
      type: "playground",
      source: `
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

        vec4 render(vec2 uv, vec2 p) {
          float h = noise(p * 2.5 + vec2(10.0, 4.0));  //ja: 高さ。+ vec2(…) は見る場所をずらしているだけ //en: height; the + vec2(…) just picks a nice spot
          float sea = 0.5;                             //ja: 海面の高さ //en: sea level

          vec3 col = mix(vec3(0.03, 0.12, 0.35), vec3(0.1, 0.5, 0.7), smoothstep(sea - 0.25, sea, h));
          col = mix(col, vec3(0.93, 0.86, 0.62), step(sea, h));         //ja: 砂浜 //en: beach
          col = mix(col, vec3(0.32, 0.6, 0.28), step(sea + 0.03, h));   //ja: 草地 //en: grass
          col = mix(col, vec3(0.2, 0.42, 0.2), step(sea + 0.12, h));    //ja: 森 //en: forest
          col = mix(col, vec3(0.5, 0.42, 0.35), step(sea + 0.27, h));   //ja: 岩 //en: rock
          col = mix(col, vec3(0.97), step(sea + 0.37, h));              //ja: 雪 //en: snow
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`sea` を `0.4` にすると陸が広がり、`0.6` にすると小さな島ばかりになります。ノイズは 0.5 のまわりの値が多く、端の値は少ないので、雪をかぶった山頂は少しだけです",
        en: "Set `sea` to `0.4` and the land spreads; set it to `0.6` and only small islands remain. Noise favors values near 0.5 over the extremes, so snowy peaks are rare",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つの方法は、[円と距離](/learn/circles-and-distance) で距離に使った **等高線** です。`h * 12.0` の小数の部分 `fract` は、高さが 1/12 上がるごとに 0 に戻ります。その戻る場所に線を引けば、地図の等高線になります。`floor(h * 12.0)` で高さを段に分けて色を付けると、段々畑のような色分けになります。",
        en: "Another approach is the **contour lines** you used for distances in [Circles and distance](/learn/circles-and-distance). The fractional part of `h * 12.0` wraps back to 0 every time the height rises by 1/12. Draw a line wherever it wraps and you have the contours of a map. Color by steps with `floor(h * 12.0)` and you get terraced bands, like rice paddies on a hillside.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "線の太さをそろえるために、ここで `fwidth` という関数を使います。`fwidth(k)` は、隣のピクセルに移ったときに `k` がどれだけ変わるかを返します。等高線からの距離をこれで割ると、距離が「何ピクセルぶんか」になるので、坂が急なところでもゆるやかなところでも、同じ太さの線が引けます。",
        en: "To keep the lines an even width, we use a function called `fwidth`. `fwidth(k)` tells you how much `k` changes when you step to the neighboring pixel. Dividing the distance to a contour by it turns that distance into pixels, so the lines come out the same width on steep and gentle slopes alike.",
      },
    },
    {
      type: "playground",
      source: `
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

        vec4 render(vec2 uv, vec2 p) {
          float h = noise(p * 1.5 + vec2(time * 0.1, 3.0));
          float k = h * 12.0;
          float band = floor(k) / 12.0;                 //ja: 高さを 12 段に分ける //en: split the height into 12 steps

          vec3 low = vec3(0.2, 0.45, 0.35);
          vec3 mid = vec3(0.95, 0.85, 0.55);
          vec3 high = vec3(0.65, 0.35, 0.25);
          vec3 col = mix(low, mid, smoothstep(0.2, 0.55, band));
          col = mix(col, high, smoothstep(0.55, 0.8, band));

          float d = abs(fract(k + 0.5) - 0.5) / max(fwidth(k), 0.0001);  //ja: 等高線までの距離(ピクセル) //en: distance to the nearest contour, in pixels
          float line = 1.0 - smoothstep(0.5, 1.5, d);
          col = mix(col, vec3(0.12, 0.08, 0.06), line * 0.7);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`12.0`(2 か所)を `24.0` にすると、等高線が細かくなります。`band` を `h` にすると、段の無いなめらかな色に変わります",
        en: "Change both `12.0`s to `24.0` for denser contours. Replace `band` with `h` in the two `smoothstep` calls and the colors become smooth instead of stepped",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "ノイズの「どこを読むか」を工夫するのがこの回のこつです。円の上を読む、横 1 列を読む、ずらして読む。それを思い出しながら取り組んでみましょう。",
        en: "The trick in this lesson is choosing where to read the noise: around a circle, along a single row, or at a shifted spot. Keep those in mind as you work through these.",
      },
    },
    {
      type: "exercise",
      title: { ja: "ゆらめくリング", en: "Wobbling rings" },
      prompt: {
        ja: "画面の中央に、細いリングが 1 本あります。このリングの半径を、方向によってノイズでゆらし、時間とともに形が変わり続けるようにしてください。できたら、シードと色を変えたリングを 3 本重ねて、光の輪が絡み合うような絵にしてみましょう。",
        en: "There's a thin ring in the middle of the screen. Make its radius wobble with noise depending on direction, so its shape keeps changing over time. If you can, layer three rings with different seeds and colors, so they look like glowing loops twisting around each other.",
      },
      starter: `
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

        vec4 render(vec2 uv, vec2 p) {
          float r = 0.6;                         //ja: ここを書き換える //en: change this
          float d = abs(length(p) - r) - 0.01;  //ja: 細いリング //en: a thin ring

          float px = 2.0 / resolution.y;
          float mask = 1.0 - smoothstep(-px, px, d);
          vec3 col = mix(vec3(0.03, 0.02, 0.08), vec3(1.0, 0.6, 0.3), mask);
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        //ja: 1 本のリングの明るさ。seed で別の形になる
        //en: brightness of one ring; seed gives it a different shape
        float ring(vec2 p, float seed) {
          vec2 dir = normalize(p);
          float r = 0.6 + 0.35 * (noise(dir * 1.2 + vec2(seed, time * 0.4)) - 0.5);
          float d = abs(length(p) - r);
          float px = 2.0 / resolution.y;
          float line = 1.0 - smoothstep(0.005 - px, 0.005 + px, d);
          float glow = 1.0 - smoothstep(0.0, 0.12, d);
          return line + glow * glow * 0.35;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = vec3(0.03, 0.02, 0.08);
          col += vec3(1.0, 0.55, 0.25) * ring(p, 0.0);
          col += vec3(0.3, 0.7, 1.0) * ring(p, 7.3);
          col += vec3(0.9, 0.3, 0.8) * ring(p, 15.1);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "方向は `normalize(p)` で表せます。これを `noise` に入れると、方向ごとに決まった値になります",
          en: "`normalize(p)` represents the direction. Pass it to `noise` to get a value for each direction",
        },
        {
          ja: "`noise(normalize(p) * 1.5 + time * 0.4)` は 0〜1 なので、`- 0.5` で -0.5〜0.5 にしてから、ゆらす幅をかけて 0.6 に足します",
          en: "`noise(normalize(p) * 1.5 + time * 0.4)` is between 0 and 1, so subtract `0.5` to center it, multiply by how much you want it to wobble, and add it to 0.6",
        },
        {
          ja: "3 本にするときは、リング 1 本ぶんを関数にして、`noise` に入れる座標に `vec2(seed, …)` のように別の数を足すと、それぞれ違う形になります。色は `col +=` で足し合わせます",
          en: "For three rings, wrap one ring in a function and add a different number to the noise input, as in `vec2(seed, …)`, so each ring gets its own shape. Add the colors together with `col +=`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "1 つの島", en: "A single island" },
      prompt: {
        ja: "starter は、ノイズの高さで色分けした地図です。いまは画面のあちこちに陸があります。画面の中央に 1 つの大きな島があり、まわりが海になるように変えてください。海岸線はノイズでぎざぎざのまま残しましょう。",
        en: "The starter is a map colored by noise height, and right now there's land all over the screen. Change it so there's one big island in the middle of the screen with sea all around it. Keep the coastline ragged from the noise.",
      },
      starter: `
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

        vec4 render(vec2 uv, vec2 p) {
          float h = noise(p * 2.5 + vec2(10.0, 4.0));  //ja: ここを書き換える //en: change this
          float sea = 0.5;

          vec3 col = mix(vec3(0.03, 0.12, 0.35), vec3(0.1, 0.5, 0.7), smoothstep(sea - 0.25, sea, h));
          col = mix(col, vec3(0.93, 0.86, 0.62), step(sea, h));
          col = mix(col, vec3(0.32, 0.6, 0.28), step(sea + 0.03, h));
          col = mix(col, vec3(0.2, 0.42, 0.2), step(sea + 0.12, h));
          col = mix(col, vec3(0.5, 0.42, 0.35), step(sea + 0.27, h));
          col = mix(col, vec3(0.97), step(sea + 0.37, h));
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        vec4 render(vec2 uv, vec2 p) {
          //ja: 中央ほど高く、外ほど低くなる山にノイズを足す
          //en: a mound that's high in the middle and low at the edges, plus noise
          float mound = 0.9 - length(p * vec2(0.7, 1.0)) * 0.55;
          float h = mound + (noise(p * 3.0 + vec2(10.0, 4.0)) - 0.5) * 0.35;
          float sea = 0.5;

          vec3 col = mix(vec3(0.03, 0.12, 0.35), vec3(0.1, 0.5, 0.7), smoothstep(sea - 0.25, sea, h));
          col = mix(col, vec3(0.93, 0.86, 0.62), step(sea, h));
          col = mix(col, vec3(0.32, 0.6, 0.28), step(sea + 0.03, h));
          col = mix(col, vec3(0.2, 0.42, 0.2), step(sea + 0.12, h));
          col = mix(col, vec3(0.5, 0.42, 0.35), step(sea + 0.27, h));
          col = mix(col, vec3(0.97), step(sea + 0.37, h));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "中央で高く、外へ行くほど低くなる「山の形」を作り、そこにノイズを足すと考えます",
          en: "Think of it as a mound that's high in the middle and slopes down toward the edges, with noise added on top",
        },
        {
          ja: "`0.85 - length(p) * 0.55` は、中央で 0.85、`p` の長さが 1 のところで 0.3 になります。海面 0.5 との差で、島の大きさが決まります",
          en: "`0.85 - length(p) * 0.55` is 0.85 in the middle and 0.3 where `p` has length 1. How it compares with the 0.5 sea level decides the island's size",
        },
        {
          ja: "`float h = 0.85 - length(p) * 0.55 + (noise(p * 3.0) - 0.5) * 0.35;` のように、ノイズは `- 0.5` で 0 のまわりにそろえてから足します",
          en: "Center the noise around 0 with `- 0.5` before adding it, as in `float h = 0.85 - length(p) * 0.55 + (noise(p * 3.0) - 0.5) * 0.35;`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "オーロラ", en: "Aurora" },
      prompt: {
        ja: "夜空に、まっすぐな緑の光の帯があります。この帯を、ノイズで左右にうねる形にして、時間とともにゆっくり形が変わるようにしてください。帯の下の縁ははっきりと、上に向かってはぼんやり消えていくと、オーロラのカーテンらしくなります。",
        en: "A straight band of green light hangs in the night sky. Make it undulate from side to side using noise, with its shape slowly changing over time. Give the band a crisp lower edge that fades out softly toward the top, and it will start to look like an aurora curtain.",
      },
      starter: `
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = mix(vec3(0.02, 0.05, 0.12), vec3(0.0, 0.0, 0.03), uv.y);

          float base = 0.0;                     //ja: 帯の下の縁の高さ。ここを書き換える //en: height of the band's lower edge; change this
          float dy = p.y - base;                //ja: 下の縁からの高さ //en: height above the lower edge
          float band = step(0.0, dy) * step(dy, 0.2);
          col += vec3(0.2, 1.0, 0.5) * band * 0.6;
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = mix(vec3(0.02, 0.05, 0.12), vec3(0.0, 0.0, 0.03), uv.y);

          //ja: 帯の下の縁を、横 1 列のノイズでうねらせる。y に time を足して形を変え続ける
          //en: bend the lower edge with a row of noise; adding time to y keeps reshaping it
          float base = -0.25 + 0.6 * (noise(vec2(p.x * 1.2 + time * 0.1, time * 0.15)) - 0.5);
          float dy = p.y - base;

          float bottom = smoothstep(-0.02, 0.0, dy);            //ja: 下の縁はくっきり //en: crisp lower edge
          float top = 1.0 - smoothstep(0.0, 0.9, dy);           //ja: 上へぼんやり消える //en: soft fade upward
          float rays = 0.5 + 0.5 * noise(vec2(p.x * 12.0, time * 0.3));  //ja: カーテンの縦の筋 //en: vertical folds in the curtain
          float light = bottom * top * rays;

          vec3 green = vec3(0.2, 1.0, 0.55);
          vec3 violet = vec3(0.6, 0.25, 0.9);
          col += mix(green, violet, smoothstep(0.05, 0.6, dy)) * light;

          //ja: 星を少し
          //en: a few stars
          vec2 id = floor(p * 40.0);
          float star = step(0.985, hash21(id)) * (1.0 - light);
          col += vec3(0.8) * star * step(length(fract(p * 40.0) - 0.5), 0.2);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`base` を `p.x` によって変わるノイズにします。横 1 列のノイズは `noise(vec2(p.x * 1.2, 0.0))` のように作れます",
          en: "Make `base` a noise value that depends on `p.x`. A single row of noise looks like `noise(vec2(p.x * 1.2, 0.0))`",
        },
        {
          ja: "y のほうに `time * 0.15` を入れると、少しずつ隣の列に移るので、形がゆっくり変わり続けます。x のほうに `time * 0.1` を足すと横に流れます",
          en: "Putting `time * 0.15` in the y slot slowly moves you to neighboring rows, so the shape keeps changing. Adding `time * 0.1` to x makes it drift sideways",
        },
        {
          ja: "`dy = p.y - base` として、下の縁は `smoothstep(-0.02, 0.0, dy)`、上は `1.0 - smoothstep(0.0, 0.9, dy)` をかけ合わせると、くっきりした下の縁と、ぼんやりした上が作れます",
          en: "With `dy = p.y - base`, multiply `smoothstep(-0.02, 0.0, dy)` for the crisp lower edge by `1.0 - smoothstep(0.0, 0.9, dy)` for the soft top",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "ノイズは、整数の点(2D では格子点)にだけ乱数を置き、その間をなめらかにつないだもの",
          en: "Noise puts random values only at whole numbers (lattice points in 2D) and joins them smoothly in between",
        },
        {
          ja: "直線でつなぐと角が立つ。`f * f * (3.0 - 2.0 * f)` は両端で傾きが 0 なので、平らにつながる",
          en: "Straight-line joins leave kinks. `f * f * (3.0 - 2.0 * f)` has zero slope at both ends, so the joins are flat",
        },
        {
          ja: "2D の `noise` は、マスの 4 つの角の乱数を、左右・上下の順に `mix` する。答えは 0〜1 で、0.5 のまわりが多い",
          en: "2D `noise` blends the four corner values with `mix`, left to right and then bottom to top. The result is 0 to 1, mostly near 0.5",
        },
        {
          ja: "座標にかける数で大きさ、足す `time` で流れが決まる。形をゆらすときは `normalize(p)` で円の上を読むと切れ目が出ない",
          en: "Multiplying the coordinates sets the size and adding `time` makes it flow. To wobble a shape without a seam, read the noise around a circle with `normalize(p)`",
        },
        {
          ja: "ノイズを高さと考えると、しきい値で地図に、`fract` で等高線になる",
          en: "Treat noise as height: thresholds turn it into a map, and `fract` turns it into contour lines",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、大きさの違うノイズを何層も重ねる **fBm** で、丸い丘をごつごつした山に、まだら模様をふわふわの雲に変えます。",
        en: "Next time we stack layers of noise at different sizes, a technique called **fBm**, to turn round hills into rugged mountains and blotches into fluffy clouds.",
      },
    },
  ],
};

export default lesson;
