import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "fractals",
  title: { ja: "フラクタル", en: "Fractals" },
  summary: {
    ja: "マンデルブロ集合・ジュリア集合・折りたたみで、どこまでも細かい形を作る",
    en: "Create endless detail with the Mandelbrot set, Julia sets and folding",
  },
  minutes: 55,
  goals: [
    {
      ja: "複素数を `vec2` で表し、かけ算と 2 乗を書ける",
      en: "Represent complex numbers as `vec2` and write their multiplication and squaring",
    },
    {
      ja: "マンデルブロ集合を「外へ逃げるまでの回数」で描き、回数をなめらかにして帯の無い色を付けられる",
      en: "Draw the Mandelbrot set by counting steps until escape, and smooth that count for band-free color",
    },
    {
      ja: "ズームのアニメーションと、`c` を動かすジュリア集合を作れる",
      en: "Animate a zoom, and make a Julia set with a moving `c`",
    },
    {
      ja: "abs と回転と拡大のくり返し(折りたたみ)で、2D の万華鏡のような模様を作れる",
      en: "Build kaleidoscopic 2D patterns by repeating abs, rotation and scaling (folding)",
    },
    {
      ja: "折りたたみを 3D の距離関数に使い、自己相似な立体をレイマーチできる",
      en: "Use folding in a 3D distance function and raymarch a self-similar solid",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "どこまでも細かい形", en: "Endless detail" } },
    {
      type: "paragraph",
      text: {
        ja: "ここから第 4 部「デモを作る」です。これまでに覚えた技を組み合わせて、見る人を引きこむ作品(デモ)を作るための題材を、1 回に 1 つずつ見ていきます。最初はフラクタルです。",
        en: "This is the start of Part 4, \"Making demos\". Each lesson now takes one theme for building pieces (demos) that pull viewers in, combining the techniques you have learned. First up: fractals.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "**フラクタル** は、一部を拡大すると全体と同じような形が現れる、どこまでも細かい形です。海岸線、木の枝分かれ、雪の結晶などに見られます。おどろくのは、こうした複雑な形が、**とても短い式のくり返し** から生まれることです。シェーダーは点ごとに同じ計算をくり返すのが得意なので、フラクタルととても相性がよいのです。",
        en: "A **fractal** is a shape with endless detail: zoom into a part and you find something like the whole again. You see them in coastlines, branching trees and snowflakes. The surprise is that such complex shapes come from **repeating a very short formula**. Shaders are great at repeating the same math for every pixel, so fractals suit them perfectly.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この回では、複素数という数の使い方から入り、マンデルブロ集合とジュリア集合を描きます。後半では、座標を「折りたたむ」もう 1 つの方法で、2D の模様と 3D の立体を作ります。",
        en: "In this lesson we start with a kind of number called a complex number and use it to draw the Mandelbrot and Julia sets. In the second half we use another approach, \"folding\" the coordinates, to make 2D patterns and a 3D solid.",
      },
    },
    { type: "heading", text: { ja: "複素数を vec2 で表す", en: "Complex numbers as vec2" } },
    {
      type: "paragraph",
      text: {
        ja: "**複素数** は、ふつうの数(実部)と、2 乗すると -1 になる数 `i` の何倍か(虚部)を組にした数で、`a + b i` と書きます。難しく考える必要はありません。シェーダーでは、2 つの数の組なので `vec2(a, b)` でそのまま表せます。つまり、画面の上の点 `p` は、そのまま 1 つの複素数だと思えます。",
        en: "A **complex number** pairs an ordinary number (the real part) with some multiple of `i`, a number whose square is -1 (the imaginary part). It is written `a + b i`. No need to overthink it: in a shader it is just a pair of numbers, so `vec2(a, b)` represents it directly. That means any point `p` on the screen can be read as a complex number.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "足し算は `vec2` の足し算と同じです。かけ算は、`i × i = -1` に気をつけて展開すると `(a + b i)(c + d i) = (ac - bd) + (ad + bc) i` になります。これを関数にしたのが `cmul` です。とくに 2 乗は `z × z = (x² - y²) + 2xy i` で、`vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y)` と書けます。",
        en: "Addition is just `vec2` addition. For multiplication, expand and remember that `i × i = -1`: `(a + b i)(c + d i) = (ac - bd) + (ad + bc) i`. That is the function `cmul`. Squaring in particular is `z × z = (x² - y²) + 2xy i`, which you can write as `vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y)`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "2 乗が何をしているかは、[極座標](/learn/polar-coordinates) で考えるとよくわかります。複素数を 2 乗すると、**原点からの角度が 2 倍** になり、**長さが 2 乗** になります。下の絵は、角度を色相に、長さを縞にしたものです。2 乗すると、色の輪が 2 周するようになります。",
        en: "Squaring makes the most sense in terms of [Polar coordinates](/learn/polar-coordinates). Squaring a complex number **doubles its angle** around the origin and **squares its length**. The picture below shows the angle as hue and the length as stripes. After squaring, the color wheel goes around twice.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265

        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        //ja: 複素数のかけ算 (a.x + a.y i)(b.x + b.y i)
        //en: complex multiplication (a.x + a.y i)(b.x + b.y i)
        vec2 cmul(vec2 a, vec2 b) {
          return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 z = p * 1.2;
          z = cmul(z, z);  //ja: 2 乗する(この行を消すと元の z) //en: square it (delete this line to see z itself)
          float angle = atan(z.y, z.x) / (2.0 * PI) + 0.5;  //ja: 角度を 0〜1 に //en: angle as 0 to 1
          float r = length(z);
          vec3 col = hsv2rgb(vec3(angle, 0.65, 1.0));         //ja: 角度で色相 //en: hue from the angle
          col *= 0.75 + 0.25 * cos(r * 2.0 * PI * 2.0);       //ja: 長さ 0.5 ごとの縞 //en: a stripe every 0.5 of length
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`z = cmul(z, z);` の行を消して元の `z` と比べましょう。`z = cmul(cmul(z, z), z);` にすると?",
        en: "Delete the `z = cmul(z, z);` line to compare with the original `z`. What does `z = cmul(cmul(z, z), z);` give?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "縞にも注目してください。元の `z` では長さ 0.5 ごとに等間隔ですが、2 乗すると、外へ行くほど縞の間隔が詰まります。長さ 1.5 の点は 2.25 に、2.0 の点は 4.0 にと、大きい数ほど大きく引き伸ばされるからです。この「1 より外は 2 乗でどんどん大きくなる」性質が、次のマンデルブロ集合の鍵になります。",
        en: "Look at the stripes too. For the original `z` they are evenly spaced every 0.5 of length, but after squaring they crowd together toward the outside. A point at length 1.5 moves to 2.25 and one at 2.0 to 4.0: the bigger the number, the more it is stretched. This \"beyond 1, squaring makes things grow fast\" behavior is the key to the Mandelbrot set.",
      },
    },
    { type: "heading", text: { ja: "マンデルブロ集合", en: "The Mandelbrot set" } },
    {
      type: "paragraph",
      text: {
        ja: "マンデルブロ集合の作り方は、驚くほど短いです。画面の点ごとに、その位置を複素数 `c` とします。`z` を 0 から始めて、**`z = z² + c` を何度もくり返します**。`z` が大きくなって外へ逃げていくなら、その点は集合の外。いつまでも小さいままなら、集合の中です。",
        en: "The recipe for the Mandelbrot set is astonishingly short. For each pixel, take its position as a complex number `c`. Start with `z` at 0 and **repeat `z = z² + c` over and over**. If `z` grows and escapes, the point is outside the set. If it stays small forever, the point is inside.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数で試してみましょう。`c` が 1 なら、`z` は 0 → 1 → 2 → 5 → 26 …と、すぐに大きくなります(外)。`c` が -1 なら、0 → -1 → 0 → -1 …と行き来するだけで、いつまでも小さいままです(中)。`c` が 0.5 なら、0 → 0.5 → 0.75 → 1.06 → 1.63 → 3.15 と、5 回目で 2 を超えます(外)。",
        en: "Let's try some numbers. With `c` = 1, `z` goes 0 → 1 → 2 → 5 → 26 … and quickly blows up (outside). With `c` = -1, it goes 0 → -1 → 0 → -1 … back and forth and stays small forever (inside). With `c` = 0.5, it goes 0 → 0.5 → 0.75 → 1.06 → 1.63 → 3.15, passing 2 on the fifth step (outside).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "「いつまでも」は確かめられないので、2 つの約束をします。1 つ目は、`z` の長さが 2 を超えたら、もう戻ってこないとわかっているので、そこで「逃げた」と決めること。比べるときは平方根を省いて `dot(z, z) > 4.0` と書きます。2 つ目は、64 回くり返しても逃げなければ「中」とみなすことです。そして、外の点は **何回目で逃げたか** で色を付けます。",
        en: "We can't check \"forever\", so we make two agreements. First, once the length of `z` passes 2 it is known never to come back, so we call it escaped right there; to skip the square root we test `dot(z, z) > 4.0`. Second, if it hasn't escaped after 64 steps, we treat it as inside. Points outside are colored by **how many steps it took to escape**.",
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
          vec2 c = p * 1.2 + vec2(-0.6, 0.0);  //ja: この点の c //en: this pixel's c
          vec2 z = vec2(0.0);
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;  //ja: z = z² + c //en: z = z² + c
            if (dot(z, z) > 4.0) break;                            //ja: |z| が 2 を超えたら外へ逃げる //en: once |z| passes 2, it escapes
            n += 1.0;
          }
          vec3 col = palette(n * 0.04, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
          if (n > 63.5) col = vec3(0.0);  //ja: 最後まで逃げなかった点は黒 //en: points that never escaped are black
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`1.2`(見える範囲)を `0.6` に、`vec2(-0.6, 0.0)` を `vec2(-0.75, 0.15)` にすると、ふちの近くを拡大できます",
        en: "Change `1.2` (the visible range) to `0.6` and `vec2(-0.6, 0.0)` to `vec2(-0.75, 0.15)` to zoom in near the edge",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "黒いところが集合の中です。外側の色の帯は「1 回で逃げた点」「2 回で逃げた点」…と、回数ごとに並んだものです。ふちに近い点ほど、逃げるまでに多くの回数がかかります。ふちには、どれだけ拡大しても細かい形が現れ続けます。",
        en: "The black region is the inside of the set. The colored bands outside are \"points that escaped in 1 step\", \"in 2 steps\", and so on, lined up by count. The closer a point is to the edge, the more steps it takes to escape. And the edge keeps revealing finer shapes no matter how far you zoom.",
      },
    },
    { type: "heading", text: { ja: "なめらかな色付け", en: "Smooth coloring" } },
    {
      type: "paragraph",
      text: {
        ja: "回数は整数なので、色が段々の帯になってしまいます。隣り合う 2 つの点が同じ 10 回目で逃げても、片方はぎりぎり 2 を超え、もう片方は大きく飛び出しているかもしれません。この「どれだけ飛び出したか」を使えば、回数の **端数** がわかります。",
        en: "The count is a whole number, so the colors come out in steps. Two neighboring points may both escape on step 10, but one may barely pass the line while the other leaps far past it. Using \"how far it leaped\", we can recover the **fraction** of a step.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "逃げた後の `z` は、1 回ごとにほぼ 2 乗で大きくなります。長さの対数は 1 回ごとに 2 倍になり、その対数 `log2(log2(|z|²))` は、1 回ごとにちょうど 1 ずつ増えます。だから回数 `n` からこれを引くと、回数がなめらかにつながります。たとえば 10 回目で `|z|²` が 70,000 だった点は `log2(log2(70000))` ≈ 4.01 で、なめらかな回数は 10 - 4.01 + 4 ≈ 9.99。同じ 10 回目でも `|z|²` が 40 億まで飛び出した点は ≈ 5.0 で、9.0 になります。こちらは「1 回ぶん早く逃げた」のと同じ、というわけです。",
        en: "After escaping, `z` roughly squares itself every step. The logarithm of its length doubles each step, so the log of that, `log2(log2(|z|²))`, grows by exactly 1 per step. Subtract it from the count `n` and the count becomes continuous. For example, a point whose `|z|²` was 70,000 on step 10 gives `log2(log2(70000))` ≈ 4.01, so its smooth count is 10 - 4.01 + 4 ≈ 9.99. Another point that leaped to 4 billion on that same step gives ≈ 5.0 and a smooth count of 9.0: as if it had escaped a whole step earlier.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この式が正確になるよう、逃げたと決める円を半径 2 から半径 256(`dot(z, z) > 65536.0`)に広げます。最後の `+ 4.0` は、ちょうど半径 256 で逃げた点の端数が 0 になるように合わせる数です(`log2(log2(65536))` が 4 だから)。",
        en: "For this to be accurate, we widen the escape circle from radius 2 to radius 256 (`dot(z, z) > 65536.0`). The final `+ 4.0` lines things up so a point escaping exactly at radius 256 gets a fraction of 0 (because `log2(log2(65536))` is 4).",
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
          vec2 c = p * 1.2 + vec2(-0.6, 0.0);

          vec2 z = vec2(0.0);
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 65536.0) break;  //ja: 大きめの円(半径 256)まで待つ //en: wait for a bigger circle (radius 256)
            n += 1.0;
          }
          vec3 col = vec3(0.0);
          if (n < 63.5) {
            float sn = n - log2(log2(dot(z, z))) + 4.0;  //ja: 回数の端数まで出す //en: recover the fraction of a step
            col = palette(sn * 0.04, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`sn * 0.04` を `n * 0.04` にすると、帯に戻ります。`0.04` を `0.15` にすると、色が何度も巡ります",
        en: "Change `sn * 0.04` to `n * 0.04` and the bands come back. Change `0.04` to `0.15` and the colors cycle many times",
      },
    },
    { type: "heading", text: { ja: "どこまでもズームする", en: "Zooming forever" } },
    {
      type: "paragraph",
      text: {
        ja: "フラクタルの醍醐味はズームです。`c = center + p * scale` の `scale` を時間で小さくすれば、`center` の点へ向かって拡大していきます。拡大は「同じ割合ずつ」続けると自然に見えるので、`pow(0.5, 11.0 * k)` のように、半分・半分…とかけ算で縮めます。`k` は `cos` で 0 → 1 → 0 と行き来させ、最大で 2048 倍まで寄ってから戻ってきます。",
        en: "Zooming is where fractals shine. Shrink `scale` in `c = center + p * scale` over time and you zoom toward the point `center`. A zoom looks natural when it keeps going \"by the same ratio\", so we shrink by repeated halving: `pow(0.5, 11.0 * k)`. `k` swings 0 → 1 → 0 using `cos`, so the view dives in to 2048 times and comes back out.",
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
          //ja: 0 → 1 → 0 と、ゆっくり行き来する(1 往復 約 31 秒)
          //en: goes 0 → 1 → 0 slowly (one round trip is about 31 seconds)
          float k = 0.5 - 0.5 * cos(time * 0.2);
          float scale = 1.2 * pow(0.5, 11.0 * k);  //ja: 最大で 2 の 11 乗 = 2048 倍 //en: up to 2 to the 11th = 2048 times
          vec2 center = vec2(-0.1011, 0.9563);      //ja: ズームしていく場所 //en: the point we zoom into
          vec2 c = center + p * scale;

          vec2 z = vec2(0.0);
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 65536.0) break;  //ja: 大きめの円(半径 256)まで待つ //en: wait for a bigger circle (radius 256)
            n += 1.0;
          }
          vec3 col = vec3(0.0);
          if (n < 63.5) {
            float sn = n - log2(log2(dot(z, z))) + 4.0;  //ja: 回数の端数まで出す //en: recover the fraction of a step
            col = palette(sn * 0.04, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`11.0` を `15.0` にすると、さらに深くまで潜ります(四角いブロックが見え始めたら、精度の限界です)",
        en: "Change `11.0` to `15.0` to dive even deeper (when blocky squares appear, you have hit the precision limit)",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "シェーダーの `float` は、だいたい 7 けたの精度しかありません。10 万倍くらいまで拡大すると、隣り合うピクセルの `c` が同じ値になってしまい、絵が四角いブロックに崩れます。とても深いズームの動画は、特別な計算の工夫で作られています。デモでは、精度の範囲で行き来させるのが手軽です。",
        en: "A shader `float` only has about 7 digits of precision. Zoom in around 100,000 times and neighboring pixels end up with the same `c`, so the picture breaks into square blocks. Videos of extremely deep zooms rely on special math tricks. For a demo, the easy route is to dive and return within the precision you have.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ズームの行き先は、集合のふち(色と黒の境目)に選びます。中(黒)や遠い外は、拡大しても何も現れません。ここで選んだ点 (-0.1011, 0.9563) は、ふちから枝のように伸びた部分で、64 回の反復でも細かい形がよく見えます。",
        en: "Pick a zoom target on the edge of the set, where color meets black. The inside (black) and the far outside show nothing new however far you zoom. The point used here, (-0.1011, 0.9563), sits on a branch growing out of the edge, where 64 iterations still show plenty of detail.",
      },
    },
    { type: "heading", text: { ja: "ジュリア集合", en: "Julia sets" } },
    {
      type: "paragraph",
      text: {
        ja: "マンデルブロ集合では、`z` を 0 から始め、`c` に点の位置を使いました。この 2 つの役目を入れかえて、**`z` を点の位置から始め、`c` をすべての点で同じ値にする** と、**ジュリア集合** になります。式は同じ `z = z² + c` です。",
        en: "In the Mandelbrot set, `z` starts at 0 and `c` is the pixel position. Swap those roles — **start `z` at the pixel position and use the same `c` for every pixel** — and you get a **Julia set**. The formula is the same `z = z² + c`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`c` の値ごとに、まったく違う形のジュリア集合ができます。`c` を時間で動かせば、形が生き物のように変わり続けます。ここでは、反復とその後のなめらかな回数の計算を `iterate(z, c)` という関数にまとめました。逃げなかったときは -1.0 を返します。",
        en: "Every value of `c` gives a completely different Julia set. Move `c` over time and the shape keeps morphing like a living thing. Here the iteration and the smooth count are wrapped in a function, `iterate(z, c)`, which returns -1.0 when the point never escapes.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: z を c で何回反復できるか(なめらかな回数)。逃げなければ -1.0
        //en: how many times z can be iterated with c (smooth count); -1.0 if it never escapes
        float iterate(vec2 z, vec2 c) {
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 65536.0) break;
            n += 1.0;
          }
          if (n > 63.5) return -1.0;
          return n - log2(log2(dot(z, z))) + 4.0;
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = time * 0.3 + 2.4;
          vec2 c = 0.7885 * vec2(cos(a), sin(a));  //ja: c を円の上で動かす //en: move c around a circle
          float sn = iterate(p * 1.3, c);          //ja: z の始まりが、この点の位置 //en: z starts at this pixel's position
          vec3 col = vec3(0.0);
          if (sn >= 0.0) col = palette(sn * 0.05, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.2, 0.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.7885` を `0.6` や `0.9` にして、形の変わり方を比べましょう。1 つにつながった塊になったり、ばらばらの粉になったりします",
        en: "Try `0.6` or `0.9` instead of `0.7885` and compare how the shape changes: sometimes it is one connected blob, sometimes scattered dust",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "マンデルブロ集合とジュリア集合には、きれいな関係があります。マンデルブロ集合は、**ジュリア集合の地図** なのです。`c` がマンデルブロ集合の中にあれば、その `c` のジュリア集合は 1 つにつながった形になり、外にあれば、ばらばらの粉になります。ふちのすぐ近くの `c` を選ぶと、いちばん複雑で美しい形になります。下の絵の左はマンデルブロ集合で、白い点がいまの `c` です。右がその `c` のジュリア集合です。",
        en: "The Mandelbrot and Julia sets are linked in a beautiful way: the Mandelbrot set is **a map of Julia sets**. If `c` is inside the Mandelbrot set, that `c`'s Julia set is one connected shape; if it is outside, the Julia set is scattered dust. Choose `c` right near the edge for the most intricate and beautiful shapes. On the left below is the Mandelbrot set, with the white dot marking the current `c`; on the right is the Julia set for that `c`.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: z を c で何回反復できるか(なめらかな回数)。逃げなければ -1.0
        //en: how many times z can be iterated with c (smooth count); -1.0 if it never escapes
        float iterate(vec2 z, vec2 c) {
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 65536.0) break;
            n += 1.0;
          }
          if (n > 63.5) return -1.0;
          return n - log2(log2(dot(z, z))) + 4.0;
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = time * 0.3 + 2.4;
          vec2 c = 0.7885 * vec2(cos(a), sin(a));
          float hw = resolution.x / resolution.y * 0.5;  //ja: 画面の横幅の 1/4(左右の半分ずつの中心) //en: a quarter of the width (center of each half)
          float sn;
          vec3 col = vec3(0.0);
          if (p.x < 0.0) {
            //ja: 左: マンデルブロ集合。z は 0 から、c はこの点の位置
            //en: left: the Mandelbrot set; z starts at 0, c is this pixel's position
            vec2 q = (p - vec2(-hw, 0.0)) * 1.4 + vec2(-0.7, 0.0);
            sn = iterate(vec2(0.0), q);
            if (sn >= 0.0) col = palette(sn * 0.05, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
            //ja: いまの c の位置に白い点 //en: a white dot at the current c
            float md = length(q - c) / 1.4;
            col = mix(col, vec3(0.0), 1.0 - smoothstep(0.05, 0.05 + px, md));
            col = mix(col, vec3(1.0), 1.0 - smoothstep(0.035, 0.035 + px, md));
          } else {
            //ja: 右: ジュリア集合。z はこの点の位置から、c は左の白い点
            //en: right: the Julia set; z starts at this pixel's position, c is the white dot on the left
            sn = iterate((p - vec2(hw, 0.0)) * 1.8, c);
            if (sn >= 0.0) col = palette(sn * 0.05, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.2, 0.2));
          }
          col = mix(col, vec3(0.6), 1.0 - smoothstep(0.0, px, abs(p.x)));  //ja: 真ん中の仕切り //en: the divider in the middle
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "白い点が黒い部分に入ると右の形がつながり、外へ出るとばらばらになるのを確かめましょう。`0.7885` を `0.4` にすると?",
        en: "Watch the right side connect when the white dot enters the black region, and break apart when it leaves. What happens if `0.7885` becomes `0.4`?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "左右の両方で同じ `iterate` を呼んでいます。違うのは `z` の始まりと `c` に何を渡すかだけです。1 つのピクセルはどちらか片方しか計算しないので、重さは 1 枚ぶんと変わりません。",
        en: "Both halves call the same `iterate`; they differ only in what they pass as the starting `z` and as `c`. Each pixel computes only one side, so the cost is the same as a single picture.",
      },
    },
    { type: "heading", text: { ja: "折りたたみ", en: "Folding" } },
    {
      type: "paragraph",
      text: {
        ja: "ここからは、もう 1 つのフラクタルの作り方です。[極座標](/learn/polar-coordinates) の万華鏡では、角度を折り返して模様を増やしました。もっと単純に、`abs` でも座標を折り返せます。`q = abs(q)` とすると、左右と上下が鏡に映され、画面の 4 つの区画が右上の 1 つに重ねられます。これを **折りたたみ** と呼びます。",
        en: "Now for another way to make fractals. In the kaleidoscope from [Polar coordinates](/learn/polar-coordinates), we folded the angle to multiply a pattern. `abs` folds coordinates even more simply. `q = abs(q)` mirrors left-right and top-bottom, stacking the four quarters of the screen onto the top-right one. This is called **folding**.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec2 q = p;
          q = abs(q);                  //ja: 折りたたむ: 左右と上下を鏡に映す //en: fold: mirror left-right and top-bottom
          q -= vec2(0.6, 0.35);        //ja: ずらす //en: shift
          float d = length(q) - 0.25;  //ja: 円 //en: a circle
          vec3 col = vec3(0.05, 0.05, 0.1);
          col = mix(col, vec3(0.3, 0.3, 0.45), 1.0 - smoothstep(0.0, px, min(abs(p.x), abs(p.y))));  //ja: 鏡の線 //en: the mirror lines
          col = mix(col, vec3(1.0, 0.6, 0.2), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`q = abs(q);` を `q.x = abs(q.x);` にすると左右だけ。行ごと消すと円は 1 つに戻ります",
        en: "Change `q = abs(q);` to `q.x = abs(q.x);` to mirror only left-right. Delete the line and you are back to one circle",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "右上に円を 1 つ置いただけなのに、4 つに増えました。では、折りたたんだ座標を **ずらして、回して、拡大して、また折りたたむ** とどうなるでしょう。1 回ごとに形は 4 倍に増え、しかも少しずつ小さく、少しずつ回った位置に並びます。5 回くり返せば 4 の 5 乗で 1024 個です。これが **KIFS**(Kaleidoscopic IFS、万華鏡のような反復関数系)と呼ばれる方法です。",
        en: "We placed one circle in the top-right, and it became four. So what happens if we **shift, rotate and scale the folded coordinates, then fold again**? Each round multiplies the shape by four, each copy a little smaller and turned a little more. Five rounds give 4 to the 5th: 1,024 copies. This method is called **KIFS** (a Kaleidoscopic Iterated Function System).",
      },
    },
    {
      type: "list",
      items: [
        { ja: "折りたたむ … `abs(q)` で 4 つの区画を 1 つに重ねる", en: "Fold … `abs(q)` stacks the four quarters into one" },
        { ja: "ずらす … 重ねた形を中心から離して、次に折りたたんだときに増えるようにする", en: "Shift … move the stacked shape away from the center so the next fold multiplies it" },
        { ja: "回す … 折り目の向きを変えて、まっすぐな格子にならないようにする", en: "Rotate … turn the fold lines so the result is not a plain grid" },
        { ja: "拡大する … 座標を 2 倍にすると形は半分の大きさになる。距離は最後に `s` で割って元の大きさに戻す", en: "Scale … doubling the coordinates halves the shapes; divide distances by `s` at the end to get back to original units" },
      ],
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec2 q = p * 1.3;
          float s = 1.0;                                 //ja: ここまでに拡大した倍率 //en: how much we have scaled up so far
          vec3 col = vec3(0.02, 0.02, 0.05);
          for (int i = 0; i < 5; i++) {
            q = abs(q) - vec2(1.0, 0.6);                 //ja: 折りたたんで、ずらす //en: fold, then shift
            q = rot(0.4 + 0.1 * sin(time * 0.3)) * q;    //ja: 回す //en: rotate
            q *= 2.0;                                    //ja: 座標を 2 倍(形は半分に) //en: double the coordinates (shapes halve)
            s *= 2.0;
            float d = abs(length(q) - 0.5) / s;          //ja: 輪までの距離を、元の大きさに戻す //en: distance to a ring, back in original units
            vec3 c = palette(float(i) / 5.0 + 0.05 * time, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
            col += c * (1.0 - smoothstep(0.0, px + 0.006 / s, d));  //ja: 何回目の輪かで色を変える //en: color by which round drew the ring
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "ループの `5` を `1`、`2`、`3` にして、1 回ごとに増えていく様子を見ましょう。`vec2(1.0, 0.6)` や回転の `0.4` を変えると、まったく違う模様に",
        en: "Change the loop's `5` to `1`, `2`, `3` to watch it grow round by round. Change `vec2(1.0, 0.6)` or the rotation `0.4` for a completely different pattern",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "距離を `s` で割っているのは、[座標を動かす](/learn/transforms) の拡大と同じ理由です。座標を 2 倍にした空間で測った距離は、元の空間では半分なので、5 回で 2 の 5 乗 = 32 倍にした空間の距離は 32 で割ります。こうすると、どの深さの輪も 1 ピクセルの幅でなめらかに描けます。",
        en: "We divide the distance by `s` for the same reason as scaling in [Moving space](/learn/transforms). A distance measured in space scaled up 2 times is half as long in the original space, so after five rounds (2 to the 5th = 32 times) we divide by 32. That way rings at every depth are drawn smoothly at a one-pixel width.",
      },
    },
    { type: "heading", text: { ja: "3D の折りたたみ", en: "Folding in 3D" } },
    {
      type: "paragraph",
      text: {
        ja: "折りたたみは 3D でもそのまま使えます。距離関数 `map` の中で座標を折りたたんでから形を置けば、形が何倍にも増えた立体をレイマーチで描けます。ここでは、斜めの面で折りたたむ例として、有名な **シェルピンスキーの四面体** を作ります。",
        en: "Folding works in 3D just the same. Fold the coordinates inside the distance function `map` before placing a shape, and you can raymarch a solid made of many copies. As an example of folding across slanted planes, let's build the famous **Sierpinski tetrahedron**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`if (p.x + p.y < 0.0) p.xy = -p.yx;` は、`x + y = 0` という斜めの面で折りたたむ書き方です。`x + y` が負の側にある点だけを、面の反対側へ鏡に映します。たとえば (x, y) = (-0.5, 0.2) は `x + y` が -0.3 なので、(-0.2, 0.5) に映されて正の側に来ます。3 つの斜めの面で折りたたむと、正四面体の 4 つの角のどこにいた点も、角 (1, 1, 1) の近くに集まります。そこで `p * 2.0 - vec3(1.0)` と、その角を中心に 2 倍に拡大します。",
        en: "`if (p.x + p.y < 0.0) p.xy = -p.yx;` folds across the slanted plane `x + y = 0`: only points on the negative side of `x + y` are mirrored to the other side. For example, (x, y) = (-0.5, 0.2) has `x + y` = -0.3, so it is mirrored to (-0.2, 0.5), on the positive side. Folding across three such planes gathers points from any of the tetrahedron's four corners near the corner (1, 1, 1). Then `p * 2.0 - vec3(1.0)` scales by 2 around that corner.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "1 回ごとに形は 4 倍になるので、5 回で 1024 個の球が四面体の形に並びます。最後に `s` で割って距離を元の大きさに戻すのは 2D と同じです。`map` の中に 5 回のループがあり、それを 64 歩のレイマーチの中で呼ぶので、計算はかなり重くなります。反復の回数は必要なだけにしぼりましょう。",
        en: "Each round makes four copies, so after five rounds 1,024 spheres line up in the shape of a tetrahedron. Dividing by `s` at the end to restore the distance works just as in 2D. Since `map` contains a 5-round loop and is called inside a 64-step raymarch, this is fairly heavy. Use only as many rounds as you need.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float map(vec3 p) {
          p.xz = rot(time * 0.3) * p.xz;            //ja: 全体をゆっくり回す //en: turn the whole thing slowly
          float s = 1.0;
          for (int i = 0; i < 5; i++) {
            //ja: 3 つの斜めの面で折りたたむ //en: fold across three diagonal planes
            if (p.x + p.y < 0.0) p.xy = -p.yx;
            if (p.x + p.z < 0.0) p.xz = -p.zx;
            if (p.y + p.z < 0.0) p.zy = -p.yz;
            p = p * 2.0 - vec3(1.0);                //ja: 角 (1, 1, 1) を中心に 2 倍 //en: scale 2x around the corner (1, 1, 1)
            s *= 2.0;
          }
          return (length(p) - 1.4) / s;             //ja: 最後に球を置き、距離を元に戻す //en: place a sphere, then undo the scaling
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(2.2, 0.4, -2.0);
          vec3 ta = vec3(0.0, -0.1, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.6));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 10.0) break;
            t += d;
          }

          vec3 col = mix(vec3(0.12, 0.1, 0.18), vec3(0.02, 0.02, 0.05), uv.y);
          if (t < 10.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float occ = calcAO(pos, n);
            vec3 l = normalize(vec3(0.6, 0.8, -0.4));
            float dif = max(dot(n, l), 0.0);
            float spe = pow(max(dot(n, normalize(l - rd)), 0.0), 32.0);
            vec3 albedo = palette(length(pos) * 0.6 + 0.1, vec3(0.5), vec3(0.45), vec3(1.0), vec3(0.0, 0.15, 0.3));
            col = albedo * (dif * vec3(1.2, 1.0, 0.9) + occ * (0.5 + 0.5 * n.y) * vec3(0.25, 0.3, 0.45));
            col += 0.3 * spe * dif;
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "ループの `5` を `3` や `6` に。最後の球の半径 `1.4` を `1.0` にすると、すき間が広がります。ループの中に `p.xy = rot(0.2) * p.xy;` を足すと?",
        en: "Change the loop's `5` to `3` or `6`. Change the final sphere radius `1.4` to `1.0` to open up the gaps. What happens if you add `p.xy = rot(0.2) * p.xy;` inside the loop?",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "折りたたみの反復は、ループの上限 64 よりずっと少なくてかまいません。拡大の倍率が 2 なら、6 回で 64 分の 1 の細かさになり、もう画面の 1 ピクセルより小さくなります。それ以上くり返しても見た目は変わらず、重くなるだけです。",
        en: "Folding needs far fewer rounds than the loop limit of 64. At a scale factor of 2, six rounds already reach 1/64 of the size, smaller than a pixel on screen. More rounds won't change the picture; they only cost time.",
      },
    },
    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "式を少し変えるだけで、まったく違うフラクタルが現れます。いろいろ試してみましょう。",
        en: "Changing the formula just a little brings out a completely different fractal. Experiment freely.",
      },
    },
    {
      type: "exercise",
      title: { ja: "3 乗のマンデルブロ", en: "A cubic Mandelbrot" },
      prompt: {
        ja: "`z = z² + c` を `z = z³ + c` に変えた「3 乗のマンデルブロ集合」を描いてください。形が原点のまわりで左右対称になるので、画面の真ん中に来るように位置も直します。",
        en: "Draw the \"cubic Mandelbrot set\" by changing `z = z² + c` to `z = z³ + c`. The shape becomes symmetric around the origin, so also fix the position so it sits in the middle of the screen.",
      },
      starter: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: 複素数のかけ算 (a.x + a.y i)(b.x + b.y i)
        //en: complex multiplication (a.x + a.y i)(b.x + b.y i)
        vec2 cmul(vec2 a, vec2 b) {
          return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 c = p * 1.2 + vec2(-0.6, 0.0);
          vec2 z = vec2(0.0);
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = cmul(z, z) + c;  //ja: ここを 3 乗に //en: make this a cube
            if (dot(z, z) > 65536.0) break;
            n += 1.0;
          }
          vec3 col = vec3(0.0);
          if (n < 63.5) {
            float sn = n - log2(log2(dot(z, z))) + 4.0;
            col = palette(sn * 0.04, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
          }
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: 複素数のかけ算 (a.x + a.y i)(b.x + b.y i)
        //en: complex multiplication (a.x + a.y i)(b.x + b.y i)
        vec2 cmul(vec2 a, vec2 b) {
          return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 c = p * 1.35;  //ja: 3 乗の形は原点を中心に左右対称なので、ずらさない //en: the cubic set is centered on the origin, so no shift
          vec2 z = vec2(0.0);
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = cmul(cmul(z, z), z) + c;  //ja: z³ + c //en: z³ + c
            if (dot(z, z) > 65536.0) break;
            n += 1.0;
          }
          vec3 col = vec3(0.0);
          if (n < 63.5) {
            //ja: 3 乗では log2(log2(|z|²)) が 1 回ごとに log2(3) ずつ増えるので、それで割る
            //en: with cubes, log2(log2(|z|²)) grows by log2(3) per step, so divide by it
            float sn = n - log2(log2(dot(z, z))) / log2(3.0) + 2.5;
            col = palette(sn * 0.06, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.6, 0.4, 0.2));
          }
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "3 乗は、2 乗にもう一度 `z` をかけたものです。`cmul` を 2 回使います",
          en: "A cube is the square times `z` once more. Use `cmul` twice",
        },
        {
          ja: "`z = cmul(cmul(z, z), z) + c;`。`c` の `+ vec2(-0.6, 0.0)` は消して、原点を中心にします",
          en: "`z = cmul(cmul(z, z), z) + c;`. Remove the `+ vec2(-0.6, 0.0)` from `c` to center it on the origin",
        },
        {
          ja: "なめらかな色付けもきちんと合わせるなら、3 乗では `log2(log2(|z|²))` が 1 回ごとに `log2(3.0)` ずつ増えるので、`sn = n - log2(log2(dot(z, z))) / log2(3.0) + 2.5;` にします",
          en: "To keep the smooth coloring exact, note that with cubes `log2(log2(|z|²))` grows by `log2(3.0)` per step, so use `sn = n - log2(log2(dot(z, z))) / log2(3.0) + 2.5;`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "マウスで選ぶジュリア集合", en: "A Julia set you steer with the mouse" },
      prompt: {
        ja: "今は `c` が決まった値です。カーソルが乗っているときはその位置で `c` を決め、乗っていないときは `c` が円を描いて動くようにしてください。カーソルを動かして、きれいな形を探しましょう。マウスで動くのはエディタ(/edit)と学習のプレビューだけで、作品ページや Gallery では `mouse` は (0, 0) のままです。カーソルが無くても見られる絵になるよう、乗っていないときの動きも大事にします。",
        en: "Right now `c` is fixed. When the cursor is over the canvas, set `c` from its position; when it isn't, move `c` around a circle. Then move the cursor around to hunt for beautiful shapes. The mouse only moves in the editor (/edit) and in lesson previews; on the work page and in the Gallery, `mouse` stays (0, 0). Make sure the piece still looks good with no cursor, so take care with the motion it has when the mouse is absent.",
      },
      starter: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: z を c で何回反復できるか(なめらかな回数)。逃げなければ -1.0
        //en: how many times z can be iterated with c (smooth count); -1.0 if it never escapes
        float iterate(vec2 z, vec2 c) {
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 65536.0) break;
            n += 1.0;
          }
          if (n > 63.5) return -1.0;
          return n - log2(log2(dot(z, z))) + 4.0;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 c = vec2(-0.8, 0.156);  //ja: ここをマウスで決める //en: let the mouse decide this
          float sn = iterate(p * 1.3, c);
          vec3 col = vec3(0.0);
          if (sn >= 0.0) col = palette(sn * 0.05, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.2, 0.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: z を c で何回反復できるか(なめらかな回数)。逃げなければ -1.0
        //en: how many times z can be iterated with c (smooth count); -1.0 if it never escapes
        float iterate(vec2 z, vec2 c) {
          float n = 0.0;
          for (int i = 0; i < 64; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 65536.0) break;
            n += 1.0;
          }
          if (n > 63.5) return -1.0;
          return n - log2(log2(dot(z, z))) + 4.0;
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: マウスが乗っていれば、その位置を c に。乗っていなければ (0, 0) なので、時間で円を描く
          //en: if the mouse is over the canvas, use its position as c; otherwise it is (0, 0), so circle with time
          float a = time * 0.3 + 2.4;
          vec2 c = 0.7885 * vec2(cos(a), sin(a));
          if (length(mouse) > 0.0) c = mouse * 0.7;
          float sn = iterate(p * 1.3, c);
          vec3 col = vec3(0.0);
          if (sn >= 0.0) col = palette(sn * 0.05, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.2, 0.2));
          //ja: 逃げなかった内側も、c の位置で少し色を付ける //en: tint the inside a little, depending on c
          else col = vec3(0.05, 0.02, 0.08) + 0.1 * vec3(c.x + 0.5, 0.2, c.y + 0.5);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`mouse` は `p` と同じ座標で、カーソルが乗っていなければ (0, 0) です([触って動く](/learn/mouse-and-attention))",
          en: "`mouse` uses the same coordinates as `p`, and it is (0, 0) when the cursor is not over the canvas ([Touch and response](/learn/mouse-and-attention))",
        },
        {
          ja: "`length(mouse) > 0.0` なら乗っている、と判断できます。`mouse` は横に ±1.7 くらいまで動くので、`0.7` をかけて `c` に向いた範囲にします",
          en: "`length(mouse) > 0.0` tells you the cursor is there. `mouse` reaches about ±1.7 horizontally, so multiply by `0.7` to keep `c` in a useful range",
        },
        {
          ja: "`vec2 c = 0.7885 * vec2(cos(time * 0.3), sin(time * 0.3)); if (length(mouse) > 0.0) c = mouse * 0.7;`",
          en: "`vec2 c = 0.7885 * vec2(cos(time * 0.3), sin(time * 0.3)); if (length(mouse) > 0.0) c = mouse * 0.7;`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "フラクタルの木", en: "A fractal tree" },
      prompt: {
        ja: "幹が 1 本だけあります。折りたたみをくり返して、枝が 2 本ずつに分かれながら細くなっていく木にしてください。枝の角度が時間でゆれて、風にそよぐようにします。",
        en: "There is a single trunk. Repeat a fold so the tree splits into two branches again and again, getting thinner each time. Let the branch angle sway with time, as if in the wind.",
      },
      starter: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec2 q = p - vec2(0.0, -0.95);                              //ja: 根元を画面の下に //en: put the root at the bottom of the screen
          float d = sdSegment(q, vec2(0.0), vec2(0.0, 0.5)) - 0.03;  //ja: 幹 //en: the trunk
          //ja: ここで枝分かれをくり返す //en: repeat the branching here
          vec3 bg = mix(vec3(0.95, 0.7, 0.5), vec3(0.3, 0.35, 0.6), uv.y);
          vec3 col = mix(bg, vec3(0.1, 0.06, 0.08), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec2 q = p - vec2(0.0, -0.95);
          float d = sdSegment(q, vec2(0.0), vec2(0.0, 0.5)) - 0.03;
          float s = 1.0;
          float sway = 0.08 * sin(time * 1.3);  //ja: 風で枝の角度が揺れる //en: the wind sways the branch angle
          for (int i = 0; i < 9; i++) {
            q.y -= 0.5;                         //ja: 1 つ前の枝の先へ移る //en: move to the tip of the previous branch
            q.x = abs(q.x);                     //ja: 左右に折りたたむ → 2 本に分かれる //en: fold left-right → it splits in two
            q = rot(0.45 + sway) * q;           //ja: 枝を外へ傾ける //en: tilt the branch outward
            q *= 1.35;                          //ja: 次の枝は 1 / 1.35 の大きさ //en: the next branch is 1 / 1.35 the size
            s *= 1.35;
            d = min(d, (sdSegment(q, vec2(0.0), vec2(0.0, 0.5)) - 0.03) / s);
          }
          vec3 bg = mix(vec3(0.95, 0.7, 0.5), vec3(0.3, 0.35, 0.6), uv.y);
          vec3 col = mix(bg, vec3(0.1, 0.06, 0.08), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "1 回の枝分かれは「幹の先へ移る → 左右に折りたたむ → 外へ傾ける → 縮める」の 4 つです。それをループで 8〜9 回くり返し、毎回同じ線分を描きます",
          en: "One branching is four steps: move to the tip of the trunk → fold left-right → tilt outward → shrink. Repeat it 8 or 9 times in a loop, drawing the same segment each time",
        },
        {
          ja: "先へ移るのは `q.y -= 0.5;`、左右に折りたたむのは `q.x = abs(q.x);`、傾けるのは `q = rot(0.45) * q;`、縮めるのは `q *= 1.35;` です。縮めた回数だけ距離を割るため `s` もかけていきます",
          en: "Moving to the tip is `q.y -= 0.5;`, the fold is `q.x = abs(q.x);`, the tilt is `q = rot(0.45) * q;`, and shrinking is `q *= 1.35;`. Keep multiplying `s` too, so you can divide the distance by it",
        },
        {
          ja: "ループの中の最後で `d = min(d, (sdSegment(q, vec2(0.0), vec2(0.0, 0.5)) - 0.03) / s);`。角度に `0.08 * sin(time * 1.3)` を足すと揺れます",
          en: "End the loop body with `d = min(d, (sdSegment(q, vec2(0.0), vec2(0.0, 0.5)) - 0.03) / s);`. Add `0.08 * sin(time * 1.3)` to the angle to make it sway",
        },
      ],
    },
    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        { ja: "複素数は `vec2`。2 乗は `vec2(x² - y², 2xy)` で、角度が 2 倍・長さが 2 乗になる", en: "A complex number is a `vec2`. Squaring is `vec2(x² - y², 2xy)`: the angle doubles and the length squares" },
        { ja: "マンデルブロ集合は、`z = 0` から `z = z² + c` をくり返し、`|z|` が 2 を超えるまでの回数で色を付ける", en: "The Mandelbrot set repeats `z = z² + c` from `z = 0` and colors by the number of steps until `|z|` passes 2" },
        { ja: "`n - log2(log2(dot(z, z))) + 4.0` で回数をなめらかにすると、色の帯が消える", en: "Smoothing the count with `n - log2(log2(dot(z, z))) + 4.0` removes the color bands" },
        { ja: "ズームは `pow` でかけ算的に。`float` の精度は 10 万倍くらいまで", en: "Zoom multiplicatively with `pow`; `float` precision lasts to about 100,000x" },
        { ja: "ジュリア集合は `z` と `c` の役目を入れかえたもの。マンデルブロ集合はその地図", en: "A Julia set swaps the roles of `z` and `c`; the Mandelbrot set is its map" },
        { ja: "折りたたみ(`abs` や斜めの面での鏡)→ ずらす → 回す → 拡大、をくり返すと、2D でも 3D でも自己相似な形になる。距離は最後に倍率で割る", en: "Fold (`abs` or a mirror across a slanted plane) → shift → rotate → scale, repeated, makes self-similar shapes in 2D and 3D; divide the distance by the total scale at the end" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回は「トンネルと飛行」です。画面の奥へ吸いこまれていくトンネルと、道に沿って進むカメラで、デモらしいスピード感を作ります。",
        en: "Next up is \"Tunnels and flight\": tunnels that pull you into the screen and a camera that follows a winding path, for that unmistakable demo sense of speed.",
      },
    },
  ],
};

export default lesson;
