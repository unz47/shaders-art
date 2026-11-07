import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "polar-coordinates",
  title: { ja: "極座標", en: "Polar coordinates" },
  summary: {
    ja: "角度と距離で考え、放射状の模様・花・渦・万華鏡を描く",
    en: "Think in angle and distance to draw rays, flowers, spirals and kaleidoscopes",
  },
  minutes: 50,
  goals: [
    {
      ja: "`atan(y, x)` と `length` で、場所を「角度と距離」で表せる",
      en: "Describe a position as angle and distance with `atan(y, x)` and `length`",
    },
    {
      ja: "`#define` で `PI` と `TAU` を決め、角度を 0〜1 に直して色相の輪を描ける",
      en: "Define `PI` and `TAU` with `#define`, and map the angle to 0–1 to draw a color wheel",
    },
    {
      ja: "放射状のしま、花の形 `cos(a * n)`、渦巻きを作れる",
      en: "Make rays, flower shapes with `cos(a * n)`, and spirals",
    },
    {
      ja: "角度を `mod` でくり返して折り返し、万華鏡を作れる",
      en: "Repeat and fold the angle with `mod` to build a kaleidoscope",
    },
    {
      ja: "角度の ±π の継ぎ目で起きる問題に気づいて、直せる",
      en: "Spot and fix problems at the ±π seam of the angle",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "角度と距離で場所を表す", en: "Position as angle and distance" } },
    {
      type: "paragraph",
      text: {
        ja: "画面の上の点は、ふつう (x, y) の 2 つの数で表します。でも、同じ点を「**中心からどの向きに、どれだけ離れているか**」の 2 つの数で表すこともできます。この表し方を **極座標** と呼びます。中心から外へ広がる模様や、ぐるりと回る模様は、x と y より、角度と距離で考えたほうがずっと簡単に描けます。",
        en: "A point on the screen is usually described by two numbers, (x, y). But you can also describe the same point by two other numbers: **which direction it lies from the center, and how far away**. That's called **polar coordinates**. Patterns that spread out from the center or wrap around it are much easier to draw in terms of angle and distance than x and y.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "距離は、[円と距離](/learn/circles-and-distance) で使った `length(p)` です。角度は `atan(p.y, p.x)` で求めます。答えは右向き (1, 0) を 0 として、**反時計回り** に測ったラジアンです。上 (0, 1) は約 1.57、左 (-1, 0) は約 3.14(π)、下 (0, -1) は約 -1.57 になります。範囲は -π〜π で、左向きのところで π から -π へ飛びます。",
        en: "The distance is `length(p)`, from [Circles and distance](/learn/circles-and-distance). The angle comes from `atan(p.y, p.x)`. The answer is in radians, measured **counterclockwise** starting from 0 at the right-pointing (1, 0). Up, (0, 1), is about 1.57; left, (-1, 0), is about 3.14 (π); down, (0, -1), is about -1.57. The range is -π to π, and it jumps from π to -π at the left.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`atan(y, x)` は **y が先** です。また、`atan(p.y / p.x)` のように 1 つの数を渡す書き方もありますが、これは右半分と左半分の区別がつかず、答えも -π/2〜π/2 にしかなりません。角度を求めるときは、いつも 2 つの数を渡す `atan(p.y, p.x)` を使いましょう。",
        en: "`atan(y, x)` takes **y first**. There's also a one-argument form, `atan(p.y / p.x)`, but it can't tell the right half from the left half, and it only returns -π/2 to π/2. To get an angle, always use the two-argument `atan(p.y, p.x)`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "角度の計算では π をよく使いますが、GLSL には用意されていません。[関数で形を作る](/learn/shaping-functions) で `TAU` を決めたのと同じように、コードの先頭に `#define` で決めておきます。`#define PI 3.14159265` は「この後のコードの `PI` という文字を、コンパイルの前に `3.14159265` に置き換えて」という指示です。変数ではないので、型も `;` も書きません。`TAU` は π の 2 倍、つまり 1 周ぶんの角度です。",
        en: "Angle math uses π a lot, but GLSL doesn't provide it, so — just as we did for `TAU` in [Shaping functions](/learn/shaping-functions) — we define it at the top of the code with `#define`. `#define PI 3.14159265` means \"before compiling, replace the text `PI` with `3.14159265` in the code that follows\". It isn't a variable, so there's no type and no `;`. `TAU` is twice π: the angle of one full turn.",
      },
    },
    {
      type: "code",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "角度と距離を色にして見てみましょう。角度は `a / TAU + 0.5` で 0〜1 に直して赤に、距離をそのまま緑にしています。",
        en: "Let's look at angle and distance as colors. The angle is mapped to 0–1 with `a / TAU + 0.5` and shown in red; the distance goes straight into green.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531

        vec4 render(vec2 uv, vec2 p) {
          float a = atan(p.y, p.x);   //ja: 角度: -PI〜PI //en: angle: -PI to PI
          float r = length(p);        //ja: 中心からの距離 //en: distance from the center
          float u = a / TAU + 0.5;    //ja: 角度を 0〜1 に //en: angle mapped to 0–1
          return vec4(u, r, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "`vec4(u, r, 0.0, 1.0)` を `vec4(vec3(u), 1.0)` にすると角度だけ、`vec4(vec3(r), 1.0)` にすると距離だけが見えます",
        en: "Change `vec4(u, r, 0.0, 1.0)` to `vec4(vec3(u), 1.0)` to see only the angle, or `vec4(vec3(r), 1.0)` to see only the distance",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "赤(角度)は、左から反時計回りに、下 → 右 → 上と進むにつれて明るくなり、ふたたび左に戻ったところで、いちばん明るい 1 からいちばん暗い 0 へ急に変わります。この **左の継ぎ目** は、後で必ず問題になるので覚えておいてください。緑(距離)は中心から同心円状に明るくなります。",
        en: "Red (the angle) grows brighter going counterclockwise from the left — down, then right, then up — and when it comes back around to the left it snaps from the brightest 1 to the darkest 0. Remember this **seam on the left**; it will cause trouble later. Green (the distance) brightens in rings from the center outward.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "逆に、角度 a と距離 r から、ふつうの座標に戻すこともできます。`r * vec2(cos(a), sin(a))` です。[時間で動かす](/learn/time-and-motion) で、点を円の上で回したときに使った式と同じですね。この行き来は、この回の最後の万華鏡で使います。",
        en: "You can also go the other way, from angle a and distance r back to ordinary coordinates: `r * vec2(cos(a), sin(a))`. It's the same formula we used in [Time and motion](/learn/time-and-motion) to move a point around a circle. We'll use this round trip in the kaleidoscope at the end of the lesson.",
      },
    },

    { type: "heading", text: { ja: "角度で色を回す: 色相の輪", en: "Coloring by angle: a color wheel" } },
    {
      type: "paragraph",
      text: {
        ja: "0〜1 に直した角度 `u` は、[色を混ぜる](/learn/mixing-colors) で使った `hsv2rgb` の **色相** にぴったりです。色相は 0 と 1 が同じ赤で、輪のようにつながっているからです。距離を彩度に使うと、中心が白、外ほど鮮やかな、色選びの画面でよく見る輪ができます。",
        en: "The angle `u`, mapped to 0–1, fits perfectly as the **hue** for `hsv2rgb` from [Mixing colors](/learn/mixing-colors), because hue wraps around like a ring: 0 and 1 are the same red. Use the distance as saturation and you get the familiar color-picker wheel: white in the center, more vivid toward the rim.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          float u = a / TAU + 0.5;

          vec3 wheel = hsv2rgb(vec3(u + time * 0.05, r / 0.8, 1.0)); //ja: 色相 = 角度、彩度 = 距離 //en: hue = angle, saturation = distance
          vec3 col = vec3(0.12);
          col = mix(col, wheel, 1.0 - smoothstep(-px, px, r - 0.8));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`u` を `u * 2.0` にすると、1 周で虹が 2 回まわります。`u * 2.5` にすると、左に継ぎ目が出ます",
        en: "Use `u * 2.0` and the rainbow goes around twice per turn. With `u * 2.5`, a seam appears on the left",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "前の playground では左に継ぎ目がありましたが、色相の輪にはありません。`u` は左で 1 から 0 へ飛びますが、色相 1 と色相 0 はどちらも赤なので、色としてはつながっているからです。`u * 2.0` でも、2 と 0 が同じ色なのでつながります。ところが `u * 2.5` では、2.5(水色)と 0(赤)で色がちがうので、継ぎ目が見えてしまいます。",
        en: "The previous playground had a seam on the left, but the color wheel doesn't. `u` still jumps from 1 to 0 there, but hue 1 and hue 0 are both red, so the colors join up. With `u * 2.0`, 2 and 0 are also the same color, so it joins. With `u * 2.5`, though, 2.5 (cyan) and 0 (red) differ, and the seam shows.",
      },
    },

    { type: "heading", text: { ja: "±π の継ぎ目", en: "The seam at ±π" } },
    {
      type: "paragraph",
      text: {
        ja: "継ぎ目ができる理由をまとめておきます。`atan` の答えは、左向きのところで π から -π へ一気に 6.28 だけ飛びます。角度をそのまま明るさや位置に使うと、そこで値が急に変わって線が見えます。継ぎ目を出さないには、**角度が 1 周ぶん(TAU)変わっても同じ値になる** 式に角度を通します。",
        en: "Here's why the seam happens. On the left, `atan`'s answer leaps from π to -π, a jump of 6.28. Use the angle directly as a brightness or a position and the value changes abruptly there, leaving a visible line. To avoid the seam, run the angle through a formula **that gives the same value when the angle changes by a full turn (TAU)**.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`sin(a * n)` や `cos(a * n)`(n は整数)… 1 周で波がちょうど n 回くり返すので、継ぎ目でも値が同じ",
          en: "`sin(a * n)` or `cos(a * n)` with whole-number n … the wave repeats exactly n times per turn, so the values match at the seam",
        },
        {
          ja: "色相 … 0 と 1 が同じ色",
          en: "Hue … 0 and 1 are the same color",
        },
        {
          ja: "`abs(u * 2.0 - 1.0)` … 0〜1 の u を、0 と 1 で同じ値になる山の形にする(鏡にする)",
          en: "`abs(u * 2.0 - 1.0)` … turns the 0-to-1 u into a peak shape that has the same value at 0 and 1 (a mirror)",
        },
      ],
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        vec4 render(vec2 uv, vec2 p) {
          float a = atan(p.y, p.x);
          float u = a / TAU + 0.5;

          float g = u;                    //ja: 左に継ぎ目 //en: a seam on the left
          // g = abs(u * 2.0 - 1.0);      //ja: 鏡にして継ぎ目を消す //en: mirror it to hide the seam
          // g = 0.5 + 0.5 * cos(a);      //ja: 周期のある関数なら継ぎ目なし //en: a periodic function has no seam
          vec3 col = mix(vec3(0.1, 0.15, 0.4), vec3(1.0, 0.7, 0.3), g);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "行の先頭の `//` を 1 つずつ消して、継ぎ目が消えるのを確かめましょう。`cos(a)` を `cos(a * 3.0)` にすると?",
        en: "Remove the leading `//` on one line at a time and watch the seam disappear. What about `cos(a * 3.0)` instead of `cos(a)`?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "中心 (0, 0) では、向きが決まらないので、角度に意味がありません。中心の近くでは、角度で作ったしまがぎゅっと詰まって細くなり、ちらついて見えます。小さな円で中心を隠すか、中心ほど模様を薄くするのが定番の手です。",
        en: "At the center, (0, 0), there's no direction, so the angle means nothing. Near the center, stripes made from the angle crowd together until they flicker. Covering the center with a small circle, or fading the pattern toward the center, are the standard fixes.",
      },
    },

    { type: "heading", text: { ja: "放射状のしま", en: "Rays" } },
    {
      type: "paragraph",
      text: {
        ja: "`sin(a * n)` は、1 周するあいだに n 回、正と負をくり返します。正のところと負のところを色分けすれば、中心から放射状にのびる **しま** になります。n = 12 なら、正の 12 本と負の 12 本で、全部で 24 本のしまです。角度に `time` を足すと、しまが回ります。",
        en: "`sin(a * n)` swings positive and negative n times in one turn. Color the positive and negative parts differently and you get **rays** spreading out from the center. With n = 12, that's 12 positive and 12 negative, 24 rays in all. Add `time` to the angle and the rays rotate.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);

          float rays = sin(a * 12.0 + time * 0.5);   //ja: 1 周で 12 回 //en: 12 cycles per turn
          float k = smoothstep(-0.15, 0.15, rays);   //ja: 正と負の境目を少しなめらかに //en: soften the boundary between positive and negative
          vec3 col = mix(vec3(0.95, 0.45, 0.2), vec3(1.0, 0.75, 0.3), k);
          col *= 1.0 - 0.5 * smoothstep(0.3, 1.6, r); //ja: 外ほど暗く //en: darker toward the outside

          //ja: 中心の太陽(しまが詰まるところを隠す)
          //en: a sun in the center (hides where the rays crowd together)
          col = mix(col, vec3(1.0, 0.95, 0.75), 1.0 - smoothstep(-px, px, r - 0.22));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`12.0` を `12.5` にすると、左でしまが不自然に切れる継ぎ目ができます。`+ time * 0.5` を `- time * 0.5` にすると、回る向きが変わります",
        en: "Change `12.0` to `12.5` and the rays break off unnaturally at a seam on the left. Change `+ time * 0.5` to `- time * 0.5` to reverse the spin",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "角度に `time` を **足す** と、しまは時計回りに回ります。[時間で動かす](/learn/time-and-motion) の進む波と同じで、足すと負の向き(角度が減る向き = 時計回り)へ、引くと正の向き(反時計回り)へ進みます。しまの境目には `smoothstep(-0.15, 0.15, rays)` を使っています。`rays` は距離ではなく sin の値なので、`px` ではなく、見た目で選んだ幅にしています。",
        en: "**Adding** `time` to the angle makes the rays turn clockwise. Just like the traveling wave in [Time and motion](/learn/time-and-motion), adding moves things in the negative direction (decreasing angle, which is clockwise), and subtracting moves them in the positive direction (counterclockwise). The ray edges use `smoothstep(-0.15, 0.15, rays)`. Since `rays` is a sine value rather than a distance, the width is chosen by eye instead of using `px`.",
      },
    },

    { type: "heading", text: { ja: "花の形", en: "Flower shapes" } },
    {
      type: "paragraph",
      text: {
        ja: "円は「どの角度でも、縁までの半径が同じ」図形でした。この半径を **角度によって変える** と、いろいろな形が作れます。`edge = 0.5 + 0.15 * cos(a * 5.0)` は、cos が 1 になる 5 つの向きで半径 0.65、-1 になる向きで 0.35 になります。中心からの距離 `r` がこの `edge` より小さいところを塗れば、5 枚の花びらを持つ花になります。",
        en: "A circle is a shape whose edge is the same radius at every angle. **Let that radius depend on the angle** and you can make all sorts of shapes. `edge = 0.5 + 0.15 * cos(a * 5.0)` has a radius of 0.65 in the five directions where cos is 1, and 0.35 where it's -1. Fill wherever the distance `r` is less than `edge` and you get a flower with five petals.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめましょう。a = 0(右向き)なら cos(0) = 1 で、縁は 0.65。a = 0.628(π/5、36°)なら cos(π) = -1 で、縁は 0.35。72° ごとに花びらの先が来ます。`d = r - edge` は内側で負になるので、[図形を組み合わせる](/learn/combining-shapes) と同じ塗り方が使えます。",
        en: "Check with numbers: at a = 0 (pointing right), cos(0) = 1, so the edge is at 0.65. At a = 0.628 (π/5, 36°), cos(π) = -1, so the edge is at 0.35. A petal tip comes every 72°. `d = r - edge` is negative inside, so the fill from [Combining shapes](/learn/combining-shapes) works here too.",
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
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          vec3 col = mix(vec3(0.1, 0.2, 0.15), vec3(0.15, 0.3, 0.25), uv.y);

          float n = 5.0;                                    //ja: 花びらの数 //en: number of petals
          float edge = 0.5 + 0.15 * cos(a * n + time * 0.5); //ja: 角度ごとの縁までの半径 //en: the edge's radius at each angle
          float d = r - edge;
          vec3 petal = palette(r * 0.3 + 0.85, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col = mix(col, petal, 1.0 - smoothstep(-px, px, d));
          col = mix(col, vec3(1.0, 0.85, 0.3), 1.0 - smoothstep(-px, px, r - 0.12)); //ja: 花の中心 //en: the flower's center
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`n` を `3.0` や `8.0` にすると? `0.15` を `0.3` にすると花びらが深く切れこみます。`cos(a * n + time * 0.5)` を `abs(cos(a * 3.0))` にすると、丸い 6 枚の花びらに",
        en: "Try `n` = `3.0` or `8.0`. Change `0.15` to `0.3` for deeper cuts between the petals. Replace `cos(a * n + time * 0.5)` with `abs(cos(a * 3.0))` for six rounded petals",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`abs(cos(a * 3.0))` は、cos の負の山を折り返すので、1 周で山が 6 つになり、山と山の間がとがったくびれになります。花びららしい形を作るのに便利です。また、色はパレットに `r` を渡して、中心から外へ色が変わるようにしています。",
        en: "`abs(cos(a * 3.0))` folds the negative lobes of the cosine up, giving six bumps per turn with sharp pinches between them — handy for petal-like shapes. The color comes from passing `r` to the palette, so it changes from the center outward.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`r - edge` は、正確には「縁までの距離」ではありません(縁の向きが中心へ向いていないところでは、少しずれます)。花びらのくびれのあたりでは、なめらかな縁の幅が少し変わりますが、ほとんど気になりません。正確な距離の考え方は [距離で描く(2D SDF)](/learn/sdf-2d) で学びます。",
        en: "`r - edge` isn't exactly the distance to the edge (it's slightly off wherever the edge doesn't face the center). Around the pinches between petals the smooth edge width varies a little, but you'll hardly notice. Exact distances are covered in [Drawing with distance (2D SDF)](/learn/sdf-2d).",
      },
    },

    { type: "heading", text: { ja: "渦巻き", en: "Spirals" } },
    {
      type: "paragraph",
      text: {
        ja: "放射状のしま `sin(a * n)` に、**距離を足す** と渦巻きになります。`sin(a * 3.0 + r * 10.0)` の山(値が同じ線)は、`a * 3.0 + r * 10.0` が一定のところにあります。中心から 0.1 離れると、`r * 10.0` が 1 増えるので、同じ線の上にいるには角度が 1 / 3 だけ減らなければいけません。外へ行くほど角度がずれていくので、線は中心のまわりを巻きながら広がります。",
        en: "Take the rays `sin(a * n)` and **add the distance**, and you get a spiral. The crests of `sin(a * 3.0 + r * 10.0)` (lines of equal value) lie where `a * 3.0 + r * 10.0` stays constant. Move 0.1 further out and `r * 10.0` grows by 1, so to stay on the same line the angle must shrink by 1/3. The angle keeps shifting as you go outward, so the line winds around the center as it spreads.",
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
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);

          float s = sin(a * 3.0 + r * 10.0 - time * 2.0); //ja: 角度 + 距離 で渦 //en: angle + distance makes a spiral
          float k = smoothstep(-0.2, 0.2, s);
          vec3 arm = palette(r * 0.6 - time * 0.1, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
          vec3 col = mix(vec3(0.05, 0.03, 0.1), arm, k);
          col *= smoothstep(0.0, 0.25, r);                 //ja: 中心ほど暗くして、詰まったところを隠す //en: darken toward the center to hide the crowding
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`3.0` を `1.0` にすると腕が 1 本に。`r * 10.0` を `r * -10.0` にすると、巻く向きが逆になります。`r * 10.0` を `r * 25.0` にすると?",
        en: "Change `3.0` to `1.0` for a single arm. Change `r * 10.0` to `r * -10.0` to reverse the twist. What does `r * 25.0` do?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "角度にかける数 `3.0` が腕の本数で、ここは継ぎ目を出さないために整数にします。距離にかける数 `10.0` は巻きの強さで、大きいほどきつく巻きます。`- time * 2.0` で、渦は回りながら外へ流れていくように見えます。[時間で動かす](/learn/time-and-motion) で見たとおり、時間を引くと、値が同じところが正の向き(距離が増える外向き、角度が増える反時計回り)へ動くからです。",
        en: "The number multiplying the angle, `3.0`, is the number of arms, and it must be a whole number to avoid a seam. The number multiplying the distance, `10.0`, sets how tightly it winds: bigger is tighter. `- time * 2.0` makes the spiral seem to turn while flowing outward. As in [Time and motion](/learn/time-and-motion), subtracting time moves the places of equal value in the positive direction: outward in distance, counterclockwise in angle.",
      },
    },

    { type: "heading", text: { ja: "万華鏡", en: "Kaleidoscopes" } },
    {
      type: "paragraph",
      text: {
        ja: "[くり返しとタイル](/learn/repetition) では、`fract` で x と y をくり返しました。同じことを **角度** にすると、ピザを切るように画面を同じ形の切れに分けられます。1 切れの角度を `slice = TAU / n` とすると、`mod(a, slice)` は、どの切れの中でも 0〜slice になります。さらに `abs(a - slice * 0.5)` で切れの真ん中で折り返すと、隣どうしが鏡に映したように向かい合います。これが **万華鏡** です。",
        en: "In [Repetition and tiles](/learn/repetition) we repeated x and y with `fract`. Do the same with the **angle** and you cut the screen into identical slices, like a pizza. With one slice's angle as `slice = TAU / n`, `mod(a, slice)` runs from 0 to slice inside every slice. Then fold it at the middle of the slice with `abs(a - slice * 0.5)`, and neighbors face each other like mirror images. That's a **kaleidoscope**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "n = 6 なら、1 切れは約 1.047(60°)です。角度 2.5 の点は、`mod` で 2.5 - 1.047 × 2 = 約 0.41 になり、折り返して `abs(0.41 - 0.52)` = 約 0.12 になります。最後に、折り返した角度と元の距離から、`r * vec2(cos(a), sin(a))` でふつうの座標 `q` に戻します。あとは `q` で好きな絵を描けば、それが 12 枚の鏡に映ったように並びます。",
        en: "With n = 6, one slice is about 1.047 (60°). A point at angle 2.5 becomes 2.5 - 1.047 × 2 ≈ 0.41 after `mod`, and folding gives `abs(0.41 - 0.52)` ≈ 0.12. Finally, turn the folded angle and the original distance back into an ordinary coordinate `q` with `r * vec2(cos(a), sin(a))`. Draw anything you like in `q` and it appears as if reflected in 12 mirrors.",
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
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);

          float n = 6.0;                     //ja: 切れの数 //en: number of slices
          float slice = TAU / n;             //ja: 1 切れの角度 //en: the angle of one slice
          a = mod(a, slice);                 //ja: どの切れも 0〜slice に //en: every slice maps to 0..slice
          a = abs(a - slice * 0.5);          //ja: 切れの真ん中で折り返す(鏡) //en: fold at the slice's middle (a mirror)
          vec2 q = r * vec2(cos(a), sin(a)); //ja: ふつうの座標に戻す //en: back to ordinary coordinates

          vec3 pa = vec3(0.5), pb = vec3(0.5), pc = vec3(1.0), pd = vec3(0.0, 0.33, 0.67);
          vec3 col = palette(r * 0.5 - time * 0.1, pa, pb, pc, pd) * 0.12; //ja: うっすら色の付いた背景 //en: a faintly tinted background
          float d1 = sdCircle(q - vec2(0.45 + 0.2 * sin(time), 0.15), 0.1);
          float d2 = sdBox(rot(-time) * (q - vec2(0.85, 0.1)), vec2(0.08)) - 0.02;
          float d3 = abs(sdCircle(q, 0.25 + 0.05 * sin(time * 2.0))) - 0.015;
          col = mix(col, palette(0.0 + time * 0.05, pa, pb, pc, pd), 1.0 - smoothstep(-px, px, d1));
          col = mix(col, palette(0.4 + time * 0.05, pa, pb, pc, pd), 1.0 - smoothstep(-px, px, d2));
          col = mix(col, palette(0.7 + time * 0.05, pa, pb, pc, pd), 1.0 - smoothstep(-px, px, d3));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`n` を `8.0` や `3.0` にすると? `a = abs(…);` の行の先頭に `//` を付けると、鏡をやめて、同じ向きの写しが回転して並びます",
        en: "Try `n` = `8.0` or `3.0`. Put `//` in front of the `a = abs(…);` line to stop mirroring: you get rotated copies all facing the same way",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "描いているのは、動く円 1 つ、回る四角 1 つ、脈打つ輪 1 つだけです。それが角度のくり返しと折り返しで、何倍にも増えて見えます。`mod` は負の角度でも 0 以上の答えを返し、`TAU` が `slice` でちょうど割り切れるので、±π の継ぎ目でも模様がずれません。n を整数にしておけば、どこにも継ぎ目は出ません。",
        en: "All we draw is one moving circle, one spinning box and one pulsing ring. Repeating and folding the angle multiplies them many times over. `mod` returns a non-negative answer even for negative angles, and `TAU` divides evenly by `slice`, so the pattern lines up even across the ±π seam. Keep n a whole number and no seam appears anywhere.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "角度と距離を使って模様を作りましょう。継ぎ目が出たら、角度にかけている数が整数になっているか、1 周で値がつながる式になっているかを確かめてください。",
        en: "Use angle and distance to make patterns. If a seam shows up, check that the number multiplying the angle is a whole number and that your formula wraps around after a full turn.",
      },
    },
    {
      type: "exercise",
      title: { ja: "ダーツの的", en: "A dartboard" },
      prompt: {
        ja: "いまは同心円のしまだけの的を、ダーツの的のような **極座標の市松模様** にしてください。同心円の輪と、20 等分した扇形の両方で、色が交互に入れかわります。",
        en: "Right now the target has only concentric rings. Turn it into a **polar checkerboard** like a dartboard, where the color alternates both across the rings and across 20 equal wedges.",
      },
      starter: `
        #define TAU 6.28318531

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          float u = a / TAU + 0.5;

          float k = mod(floor(r * 6.0), 2.0); //ja: いまは輪だけ。ここを書き換える //en: rings only for now; change this
          vec3 board = mix(vec3(0.1, 0.1, 0.1), vec3(0.95, 0.9, 0.75), k);
          vec3 col = vec3(0.25, 0.2, 0.3);
          col = mix(col, board, 1.0 - smoothstep(-px, px, r - 0.85));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          float u = a / TAU + 0.5;

          //ja: 輪の番号と扇形の番号を足して、2 で割った余り(くり返しとタイルの市松模様と同じ)
          //en: ring index + wedge index, mod 2 (the same checkerboard as in Repetition and tiles)
          float ring = floor(r * 6.0);
          float wedge = floor(u * 20.0);
          float k = mod(ring + wedge, 2.0);
          //ja: 輪ごとに色の組を変える
          //en: change the color pair every other ring
          vec3 dark = mod(ring, 2.0) < 0.5 ? vec3(0.1, 0.1, 0.1) : vec3(0.8, 0.15, 0.15);
          vec3 light = mod(ring, 2.0) < 0.5 ? vec3(0.95, 0.9, 0.75) : vec3(0.15, 0.55, 0.3);
          vec3 board = mix(dark, light, k);
          board = mix(board, vec3(0.8, 0.15, 0.15), 1.0 - smoothstep(-px, px, r - 0.06)); //ja: まん中 //en: bullseye

          vec3 col = vec3(0.25, 0.2, 0.3);
          col = mix(col, board, 1.0 - smoothstep(-px, px, r - 0.85));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "[くり返しとタイル](/learn/repetition) の市松模様は、x の番号と y の番号の和を 2 で割った余りでした。ここでは「輪の番号」と「扇形の番号」を使います",
          en: "The checkerboard in [Repetition and tiles](/learn/repetition) was the sum of the x index and the y index, mod 2. Here, use the ring index and the wedge index",
        },
        {
          ja: "扇形の番号は、0〜1 の角度 `u` を 20 倍して切り捨てた `floor(u * 20.0)` です。20 は整数なので継ぎ目も出ません",
          en: "The wedge index is the 0-to-1 angle `u` times 20, rounded down: `floor(u * 20.0)`. 20 is a whole number, so there's no seam",
        },
        {
          ja: "`float k = mod(floor(r * 6.0) + floor(u * 20.0), 2.0);`",
          en: "`float k = mod(floor(r * 6.0) + floor(u * 20.0), 2.0);`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "咲く花", en: "A blooming flower" },
      prompt: {
        ja: "花びらが 6 枚の花が、ゆっくり開いては閉じるのをくり返すようにしてください。開ききったときと閉じきったときに少し止まると、生きているように見えます。余裕があれば、花びらの間から、色のちがう 2 段目の花びらをのぞかせましょう。",
        en: "Make a six-petaled flower that slowly opens and closes, over and over. A short pause when fully open and fully closed makes it feel alive. If you have time, add a second layer of petals in another color peeking out between the first.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          vec3 col = mix(vec3(0.15, 0.25, 0.2), vec3(0.3, 0.45, 0.35), uv.y);

          float b = 1.0; //ja: 開き具合(0〜1)。ここを時間で変える //en: how open it is (0 to 1); animate this
          float edge = b * (0.45 + 0.2 * cos(a * 5.0));
          col = mix(col, vec3(1.0, 0.5, 0.6), 1.0 - smoothstep(-px, px, r - edge));
          col = mix(col, vec3(1.0, 0.85, 0.3), 1.0 - smoothstep(-px, px, r - 0.1));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define PI 3.14159265

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          vec3 col = mix(vec3(0.15, 0.25, 0.2), vec3(0.3, 0.45, 0.35), uv.y);

          //ja: 4 秒で 0 → 1 → 0。smoothstep(0.1, 0.9, …) で両端に少し止まる
          //en: 0 → 1 → 0 every 4 seconds; smoothstep(0.1, 0.9, …) adds a pause at each end
          float tri = 1.0 - abs(fract(time * 0.25) * 2.0 - 1.0);
          float b = mix(0.25, 1.0, smoothstep(0.1, 0.9, tri));

          //ja: 2 段目: 半枚ぶん(PI / 6)ずらして、少し小さく
          //en: second layer: shifted by half a petal (PI / 6) and a bit smaller
          float back = b * 0.85 * (0.45 + 0.2 * abs(cos((a + b * 0.3 + PI / 6.0) * 3.0)));
          col = mix(col, vec3(0.75, 0.35, 0.65), 1.0 - smoothstep(-px, px, r - back));

          //ja: 1 段目: abs(cos(a * 3.0)) で丸い花びらが 6 枚。開くにつれて少し回る
          //en: first layer: abs(cos(a * 3.0)) gives six rounded petals; it turns a little as it opens
          float edge = b * (0.45 + 0.2 * abs(cos((a + b * 0.3) * 3.0)));
          vec3 petal = mix(vec3(1.0, 0.75, 0.8), vec3(1.0, 0.4, 0.55), smoothstep(0.0, 0.6, r));
          col = mix(col, petal, 1.0 - smoothstep(-px, px, r - edge));
          col = mix(col, vec3(1.0, 0.85, 0.3), 1.0 - smoothstep(-px, px, r - 0.1 * b));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "6 枚にするには、`cos(a * 6.0)` か、丸い花びらになる `abs(cos(a * 3.0))` を使います",
          en: "For six petals, use `cos(a * 6.0)`, or `abs(cos(a * 3.0))` for rounded petals",
        },
        {
          ja: "開いて閉じる動きは、[時間で動かす](/learn/time-and-motion) の三角の波 `1.0 - abs(fract(t) * 2.0 - 1.0)` と、止まる時間を作る `smoothstep(0.1, 0.9, …)` でした",
          en: "For opening and closing, use the triangle wave `1.0 - abs(fract(t) * 2.0 - 1.0)` from [Time and motion](/learn/time-and-motion), plus `smoothstep(0.1, 0.9, …)` to add pauses",
        },
        {
          ja: "`float b = mix(0.25, 1.0, smoothstep(0.1, 0.9, 1.0 - abs(fract(time * 0.25) * 2.0 - 1.0)));` で、閉じても小さなつぼみが残ります",
          en: "`float b = mix(0.25, 1.0, smoothstep(0.1, 0.9, 1.0 - abs(fract(time * 0.25) * 2.0 - 1.0)));` leaves a small bud even when closed",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "レーダー", en: "Radar" },
      prompt: {
        ja: "反時計回りに回るレーダーの光を作ってください。光の線のうしろには、だんだん暗くなる尾が続きます。左の ±π の継ぎ目で尾が途切れないようにするのがポイントです。余裕があれば、光が通ったときだけ明るく光る点(目標)も置いてみましょう。",
        en: "Make a radar sweep that turns counterclockwise, with a tail that fades out behind the bright line. The key is keeping the tail from breaking at the ±π seam on the left. If you have time, add a blip that lights up only when the sweep passes over it.",
      },
      starter: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          vec3 green = vec3(0.3, 1.0, 0.5);
          vec3 col = vec3(0.02, 0.05, 0.03);

          float screen = sdCircle(p, 0.85);
          float rings = (0.5 - abs(fract(r * 4.0) - 0.5)) / 4.0; //ja: 0.25 ごとの輪までの距離 //en: distance to rings spaced 0.25 apart
          float axes = min(abs(p.x), abs(p.y));
          float grid = 1.0 - smoothstep(0.0, 1.5 * px, min(rings, axes));
          col += green * 0.25 * grid * step(screen, 0.0);

          float trail = 0.0; //ja: 光の尾の明るさ(0〜1)。ここを書き換える //en: the tail's brightness (0 to 1); change this
          col += green * trail * step(screen, 0.0);
          col = mix(col, green * 0.6, 1.0 - smoothstep(-px, px, abs(screen) - 0.01));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = atan(p.y, p.x);
          float r = length(p);
          vec3 green = vec3(0.3, 1.0, 0.5);
          vec3 col = vec3(0.02, 0.05, 0.03);

          float screen = sdCircle(p, 0.85);
          float rings = (0.5 - abs(fract(r * 4.0) - 0.5)) / 4.0;
          float axes = min(abs(p.x), abs(p.y));
          float grid = 1.0 - smoothstep(0.0, 1.5 * px, min(rings, axes));
          col += green * 0.25 * grid * step(screen, 0.0);

          //ja: 光の線の角度は time(反時計回り)。「線が通りすぎてから何周の何割か」を fract で 0〜1 に。
          //en: the sweep's angle is time (counterclockwise); fract gives how far behind the sweep we are, 0 to 1.
          //ja: fract は 1 周の差を消すので、±π の継ぎ目でも途切れない
          //en: fract erases whole-turn differences, so the tail doesn't break at the ±π seam
          float behind = fract((time - a) / TAU);
          float trail = pow(1.0 - behind, 6.0);
          col += green * trail * step(screen, 0.0);

          //ja: 目標の点: その点の角度で同じ計算をして、通った直後だけ光らせる
          //en: a blip: the same calculation at the blip's angle, so it glows just after the sweep passes
          vec2 target = vec2(0.35, 0.45);
          float glow = pow(1.0 - fract((time - atan(target.y, target.x)) / TAU), 3.0);
          col += green * glow * (1.0 - smoothstep(-px, px, sdCircle(p - target, 0.03)));

          col = mix(col, green * 0.6, 1.0 - smoothstep(-px, px, abs(screen) - 0.01));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "光の線の角度を `time` とすると、ある点が「線から何ラジアン遅れているか」は `time - a` です。でも、これは継ぎ目で TAU だけ飛びます",
          en: "If the sweep's angle is `time`, then how many radians a point lags behind the line is `time - a`. But that jumps by TAU at the seam",
        },
        {
          ja: "TAU で割ると「何周ぶん遅れているか」になり、継ぎ目での飛びはちょうど 1 になります。`fract` で 0〜1 にすれば、1 の飛びは消えます",
          en: "Divide by TAU to get the lag in turns; the jump at the seam becomes exactly 1. Taking `fract` to get 0 to 1 makes that jump of 1 vanish",
        },
        {
          ja: "`float trail = pow(1.0 - fract((time - a) / TAU), 6.0);` で、線の直後が 1、遠いほど 0 に近くなります",
          en: "`float trail = pow(1.0 - fract((time - a) / TAU), 6.0);` is 1 right behind the line and fades toward 0 further back",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "距離は `length(p)`、角度は `atan(p.y, p.x)`(y が先。-π〜π、反時計回り)",
          en: "Distance is `length(p)`; angle is `atan(p.y, p.x)` (y first, -π to π, counterclockwise)",
        },
        {
          ja: "`#define PI 3.14159265` と `#define TAU 6.28318531` は自分で書く。`a / TAU + 0.5` で角度を 0〜1 に",
          en: "Write `#define PI 3.14159265` and `#define TAU 6.28318531` yourself; `a / TAU + 0.5` maps the angle to 0–1",
        },
        {
          ja: "角度は左で π から -π へ飛ぶ。整数倍の sin/cos、色相、鏡、`fract` の差で継ぎ目を消す",
          en: "The angle jumps from π to -π on the left; hide the seam with whole-number multiples in sin/cos, hue, mirroring, or `fract` of a difference",
        },
        {
          ja: "`sin(a * n)` で放射状のしま、`r - (0.5 + 0.15 * cos(a * n))` で花、角度 + 距離で渦",
          en: "`sin(a * n)` makes rays, `r - (0.5 + 0.15 * cos(a * n))` makes a flower, angle + distance makes a spiral",
        },
        {
          ja: "`mod(a, TAU / n)` でくり返し、`abs(a - slice * 0.5)` で折り返し、`r * vec2(cos(a), sin(a))` で戻すと万華鏡",
          en: "Repeat with `mod(a, TAU / n)`, fold with `abs(a - slice * 0.5)`, and convert back with `r * vec2(cos(a), sin(a))` for a kaleidoscope",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "これで第 1 部「はじめの一歩」はおしまいです。色・座標・図形・動き・くり返し・極座標と、シェーダーで絵を描く土台がそろいました。第 2 部では、[乱数をつくる](/learn/randomness) から始めて、規則正しい模様に「ばらつき」を加え、ノイズで雲や炎のような自然な模様を描いていきます。",
        en: "That wraps up Part 1, First steps. Color, coordinates, shapes, motion, repetition and polar coordinates — you now have the foundations for drawing with shaders. Part 2 begins with [Making randomness](/learn/randomness), adding variety to orderly patterns, and goes on to use noise for natural patterns like clouds and fire.",
      },
    },
  ],
};

export default lesson;
