import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "circles-and-distance",
  title: { ja: "円と距離", en: "Circles and distance" },
  summary: {
    ja: "中心からの距離で円やリングを描き、縁をなめらかにする",
    en: "Draw circles and rings from the distance to a center, with smooth edges",
  },
  minutes: 50,
  goals: [
    {
      ja: "`length` と `distance` で、点からの距離を求められる",
      en: "Measure the distance from a point with `length` and `distance`",
    },
    {
      ja: "距離と `step`・`smoothstep` で円を描き、1 ピクセルの幅 `px = 2.0 / resolution.y` で縁をなめらかにできる",
      en: "Draw a circle from distance with `step` and `smoothstep`, smoothing its edge over one pixel, `px = 2.0 / resolution.y`",
    },
    {
      ja: "リング・中心をずらした円・楕円・いくつも重ねた円を描ける",
      en: "Draw rings, off-center circles, ellipses and several overlapping circles",
    },
    {
      ja: "距離を色や等高線で見て、どんな形の数なのか確かめられる",
      en: "Inspect a distance by turning it into colors and contour lines",
    },
    {
      ja: "`sdCircle`(内側がマイナスになる距離)の考え方と、塗りの式 `1.0 - smoothstep(-px, px, d)` がわかる",
      en: "Understand `sdCircle`, a distance that goes negative inside, and the fill formula `1.0 - smoothstep(-px, px, d)`",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "距離を測る", en: "Measuring distance" } },
    {
      type: "paragraph",
      text: {
        ja: "円とは「中心からの距離が同じ点の集まり」です。シェーダーで円を描くときも、まず **それぞれの点が、中心からどれだけ離れているか** を計算します。",
        en: "A circle is the set of points that are all the same distance from a center. So drawing a circle in a shader starts with working out **how far each pixel is from the center**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "点 `p` と原点 (0, 0) の距離は、三平方の定理で `sqrt(p.x * p.x + p.y * p.y)` です。GLSL では、これを `length(p)` と書けます。たとえば `p` が (0.3, 0.4) なら、`length(p)` は √(0.09 + 0.16) = √0.25 = 0.5 です。",
        en: "The distance from a point `p` to the origin (0, 0) is `sqrt(p.x * p.x + p.y * p.y)`, by Pythagoras. In GLSL you write it as `length(p)`. For example, if `p` is (0.3, 0.4), `length(p)` is √(0.09 + 0.16) = √0.25 = 0.5.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float d = length(p);  //ja: 中心からの距離 //en: distance from the center
          vec3 color = d * vec3(0.4, 0.6, 0.9);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "中心が黒く、外へ行くほど明るくなります。`d *` を `(1.0 - d) *` にすると? `length(p)` を `length(uv)` にすると、どこが中心になるでしょう?",
        en: "Black at the center, brighter further out. What if `d *` becomes `(1.0 - d) *`? With `length(uv)` instead of `length(p)`, where is the center?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この絵は、距離という数を明るさで見たものです。中心からどちらの向きに進んでも、同じだけ離れれば同じ明るさになるので、明るさの等しいところが同心円に並びます。`p` を使っているので、ちゃんと丸くなっています([座標を知る](/learn/coordinates) の縦横比の補正のおかげです)。",
        en: "This picture shows distance as brightness. Move the same amount from the center in any direction and you get the same brightness, so equal brightness forms concentric circles. Because we use `p`, they are truly round (thanks to the aspect correction from [Knowing where you are](/learn/coordinates)).",
      },
    },

    { type: "heading", text: { ja: "step で円を描く", en: "A circle with step" } },
    {
      type: "paragraph",
      text: {
        ja: "距離がわかれば、円は「距離が半径より小さいところ」です。[関数で形を作る](/learn/shaping-functions) の `step(r, d)` は、d が r より小さいところで 0、それ以外で 1 でした。円の内側を 1 にしたいので、1.0 から引いて裏返します。",
        en: "Once you have the distance, a circle is simply \"where the distance is less than the radius\". In [Shaping functions](/learn/shaping-functions), `step(r, d)` gave 0 where d is below r and 1 elsewhere. We want 1 inside the circle, so we flip it by subtracting from 1.0.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float d = length(p);
          float circle = 1.0 - step(0.5, d);  //ja: 内側が 1、外側が 0 //en: 1 inside, 0 outside
          vec3 color = vec3(0.08, 0.1, 0.2) + circle * vec3(0.95, 0.6, 0.25);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`0.5` を `0.2` や `0.9` にすると? `length(p)` を `length(uv - 0.5)` にすると円がつぶれるのは、なぜだったでしょう?",
        en: "Change `0.5` to `0.2` or `0.9`. And why does the circle get squashed with `length(uv - 0.5)` instead of `length(p)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`circle` は 0 か 1 の数です。これを色にかけて背景に足すと、円の中だけに色が乗ります。この「図形の内側で 1、外側で 0」の数を、このコースでは **マスク** と呼びます。",
        en: "`circle` is either 0 or 1. Multiply a color by it and add it to the background, and the color lands only inside the circle. In this course we call a number like this — 1 inside a shape, 0 outside — a **mask**.",
      },
    },

    { type: "heading", text: { ja: "中心をずらす", en: "Moving the center" } },
    {
      type: "paragraph",
      text: {
        ja: "中心を (0, 0) 以外の点 c に置くには、`p` から c を引いてから長さを測ります。`length(p - c)` は「点 p と点 c の距離」で、同じことを `distance(p, c)` とも書けます。p が c と同じ場所なら `p - c` は (0, 0) なので、距離は 0 です。[座標を知る](/learn/coordinates) で見た「座標から引くと、図形はその向きへ動く」と同じしくみです。",
        en: "To center the circle on some point c other than (0, 0), subtract c from `p` before measuring the length. `length(p - c)` is the distance between points p and c, and you can also write it as `distance(p, c)`. Where p is exactly at c, `p - c` is (0, 0) and the distance is 0. It is the same rule as in [Knowing where you are](/learn/coordinates): subtract from the coordinates, and the shape moves that way.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 c = vec2(0.6, 0.2);   //ja: 円の中心 //en: center of the circle
          float d = distance(p, c);  //ja: length(p - c) と同じ //en: same as length(p - c)
          float circle = 1.0 - step(0.3, d);
          vec3 color = vec3(0.08, 0.1, 0.2) + circle * vec3(0.3, 0.8, 0.7);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`c` を `vec2(-0.8, -0.5)` にすると? `vec2(sin(time), 0.0)` にすると、円が左右に行き来します",
        en: "Set `c` to `vec2(-0.8, -0.5)`. With `vec2(sin(time), 0.0)`, the circle swings left and right",
      },
    },

    { type: "heading", text: { ja: "縁をなめらかにする", en: "Smoothing the edge" } },
    {
      type: "paragraph",
      text: {
        ja: "よく見ると、円の縁がギザギザしています。ピクセルは「内側」か「外側」のどちらかの色にしかならないので、曲がった縁が階段のようになるのです。この階段を **ジャギー** と呼びます。",
        en: "Look closely and the circle's edge is jagged. Each pixel can only be the inside color or the outside color, so a curved edge turns into a staircase. Those steps are called **jaggies**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "直し方は、縁にまたがるピクセルを **中間の色** にすることです。`step` のかわりに `smoothstep` を使い、半径の前後のごく狭い幅で 0 から 1 へなめらかに変えます。",
        en: "The fix is to give pixels that straddle the edge **an in-between color**. Use `smoothstep` instead of `step`, so the value moves smoothly from 0 to 1 over a very narrow range around the radius.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "どのくらいの幅がよいでしょう。広すぎるとぼやけ、狭すぎるとギザギザが残ります。ちょうどよいのは **1 ピクセルぶん** です。[座標を知る](/learn/coordinates) で見たとおり、`p.y` は画面の縦 `resolution.y` ピクセルで -1 から 1 まで、2 進みます。だから 1 ピクセルの大きさは `2.0 / resolution.y` です。縦 450 ピクセルのプレビューなら約 0.0044 です。このコースでは、この値をいつも `px` という名前で使います。`smoothstep(r - px, r + px, d)` なら、縁の内側と外側の 1 ピクセルずつ、合わせて 2 ピクセルの幅でなめらかに変わります。",
        en: "How wide should that range be? Too wide and the edge blurs; too narrow and the jaggies stay. The sweet spot is **one pixel**. As you saw in [Knowing where you are](/learn/coordinates), `p.y` goes from -1 to 1 — 2 units — over the `resolution.y` pixels of the screen's height, so one pixel is `2.0 / resolution.y`. On a 450-pixel-tall preview that is about 0.0044. This course always calls this value `px`. With `smoothstep(r - px, r + px, d)`, the edge fades over one pixel inside and one outside: two pixels in total.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;  //ja: 1 ピクセルの大きさ //en: the size of one pixel
          float r = 0.55;
          float d1 = distance(p, vec2(-0.65, 0.0));
          float hard = 1.0 - step(r, d1);                     //ja: 左: くっきり(ギザギザ) //en: left: hard (jagged)
          float d2 = distance(p, vec2(0.65, 0.0));
          float soft = 1.0 - smoothstep(r - px, r + px, d2);  //ja: 右: なめらか //en: right: smooth
          vec3 color = vec3(0.08, 0.1, 0.2) + (hard + soft) * vec3(0.95, 0.6, 0.25);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "左右の縁を見比べてみましょう。`r - px` と `r + px` を `r - px * 20.0` と `r + px * 20.0` にすると、縁はどうなるでしょう?",
        en: "Compare the two edges. What happens if `r - px` and `r + px` become `r - px * 20.0` and `r + px * 20.0`?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`fwidth(d)` という関数でも、d が隣のピクセルとの間でどれだけ変わるかを求められ、px のかわりに使えます。このコースでは、意味がわかりやすい `2.0 / resolution.y` を使います。",
        en: "The `fwidth(d)` function also tells you how much d changes from one pixel to the next, and can stand in for px. This course sticks with `2.0 / resolution.y` because its meaning is easier to see.",
      },
    },

    { type: "heading", text: { ja: "リング", en: "Rings" } },
    {
      type: "paragraph",
      text: {
        ja: "円の **線** だけを描くには、「縁からどれだけ離れているか」を使います。`d - r` は、縁の上で 0、内側でマイナス、外側でプラスです。`abs(d - r)` にすると、縁から内側にも外側にも、離れるほど大きくなる数になります。[関数で形を作る](/learn/shaping-functions) でグラフの線を描いたときと同じ考え方です。これが w より小さいところを塗ると、太さ 2w のリングになります。",
        en: "To draw only the **outline** of a circle, use how far each point is from the rim. `d - r` is 0 on the rim, negative inside and positive outside. `abs(d - r)` grows the further you get from the rim in either direction — the same trick as drawing graph lines in [Shaping functions](/learn/shaping-functions). Fill wherever it is less than w and you get a ring 2w thick.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float d = length(p);
          float w = 0.02;  //ja: 線の太さの半分 //en: half the line thickness
          float ring = 1.0 - smoothstep(w - px, w + px, abs(d - 0.6));
          vec3 color = vec3(0.05, 0.06, 0.12) + ring * vec3(0.4, 0.9, 1.0);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`w` を `0.005` や `0.1` にすると? `abs(d - 0.6)` を `abs(d - 0.5 - 0.1 * sin(time * 3.0))` にすると?",
        en: "Set `w` to `0.005` or `0.1`. What about `abs(d - 0.5 - 0.1 * sin(time * 3.0))` instead of `abs(d - 0.6)`?",
      },
    },

    { type: "heading", text: { ja: "距離を色で見る(等高線)", en: "Seeing distance as contour lines" } },
    {
      type: "paragraph",
      text: {
        ja: "距離は、画面全体に広がった数の地図のようなものです。どんな形をしているか、もっとよく見てみましょう。`fract(d * 5.0)` は、距離が 0.2 増えるごとに 0〜1 をくり返します([関数で形を作る](/learn/shaping-functions) の `fract`)。くり返しの始まりに線を引くと、地図の **等高線** のように、同じ距離の点が線でつながって見えます。",
        en: "A distance is like a map of numbers spread across the screen. Let's look at its shape more closely. `fract(d * 5.0)` repeats 0 to 1 every time the distance grows by 0.2 (the `fract` from [Shaping functions](/learn/shaping-functions)). Draw a line where each repeat begins and, like **contour lines** on a map, points at the same distance link up.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float d = length(p - vec2(0.3, 0.0));
          float bands = fract(d * 5.0);                     //ja: 距離 0.2 ごとにくり返す //en: repeats every 0.2 of distance
          float lines = 1.0 - smoothstep(0.0, 0.15, bands);  //ja: くり返しの始まりを線に //en: a line where each repeat begins
          vec3 color = vec3(0.06, 0.07, 0.16) + bands * vec3(0.15, 0.22, 0.4);
          color += lines * vec3(1.0, 0.8, 0.4);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`5.0` を `15.0` にすると線の間隔は? `length(p - vec2(0.3, 0.0))` を `length(p * vec2(1.0, 2.0))` にすると、等高線はどんな形になるでしょう?",
        en: "Change `5.0` to `15.0`: how far apart are the lines now? With `length(p * vec2(1.0, 2.0))` in place of `length(p - vec2(0.3, 0.0))`, what shape do the contours take?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "等高線がきれいな同心円で、間隔が均等なら、その数は「ちゃんとした距離」です。`p * vec2(1.0, 2.0)` のように座標をゆがめると等高線もゆがみ、間隔も場所によって変わります。形がおかしいと思ったら、このように距離を色で見ると原因が見つかります。",
        en: "If the contours are neat concentric circles, evenly spaced, the number is a proper distance. Distort the coordinates, as with `p * vec2(1.0, 2.0)`, and the contours distort too, with uneven spacing. When a shape looks wrong, viewing its distance like this often reveals why.",
      },
    },

    { type: "heading", text: { ja: "sdCircle: 内側がマイナスの距離", en: "sdCircle: a distance that goes negative inside" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまで、円の内か外かを `d` と半径 `r` を比べて決めてきました。この 2 つを最初から引き算しておくと、もっと便利な数になります。",
        en: "So far we have compared `d` with the radius `r` to decide inside or outside. Subtract the two up front and you get an even more useful number.",
      },
    },
    {
      type: "code",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "`sdCircle(p, r)` は、点 p から、半径 r の円の **縁までの距離** を返します。ただし、外側ではプラス、縁の上でちょうど 0、内側ではマイナスです。r = 0.5 のとき、中心 (0, 0) では -0.5、(0.8, 0.0) では 0.3 になります。このように、内と外で符号(プラス・マイナス)が変わる距離を **符号付き距離**(signed distance)と呼びます。名前の sd は、その頭文字です。このコースでは、この名前・この中身の `sdCircle` を最後まで使います。",
        en: "`sdCircle(p, r)` returns the distance from point p **to the rim** of a circle of radius r — positive outside, exactly 0 on the rim and negative inside. With r = 0.5 it is -0.5 at the center (0, 0) and 0.3 at (0.8, 0.0). A distance whose sign flips between inside and outside is called a **signed distance**; that is what the sd stands for. This course uses `sdCircle`, with exactly this name and body, all the way to the end.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "符号付き距離 d が 1 つあれば、塗るのも線を引くのもかんたんです。",
        en: "With one signed distance d in hand, filling and outlining are both easy:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "塗る: `1.0 - smoothstep(-px, px, d)` … d がマイナス(内側)で 1。縁の前後 1 ピクセルずつでなめらかに変わる",
          en: "Fill: `1.0 - smoothstep(-px, px, d)` … 1 where d is negative (inside), fading over one pixel on each side of the rim",
        },
        {
          ja: "線を引く: `1.0 - smoothstep(w - px, w + px, abs(d))` … 縁から w 以内で 1",
          en: "Outline: `1.0 - smoothstep(w - px, w + px, abs(d))` … 1 within w of the rim",
        },
        {
          ja: "中心をずらす: `sdCircle(p - c, r)`",
          en: "Move the center: `sdCircle(p - c, r)`",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "塗りの式 `1.0 - smoothstep(-px, px, d)` は、このコースの最後まで何度も出てきます。-px < px なので、smoothstep の約束(a < b)もちゃんと守っています。下の playground は、符号付き距離を色で見たものです。外側は青、内側はオレンジで、しまの 1 本 1 本が距離 0.1 の差を表しています。",
        en: "The fill formula `1.0 - smoothstep(-px, px, d)` shows up again and again for the rest of the course. Since -px < px, it keeps smoothstep's rule (a < b). The playground below shows a signed distance as color: blue outside, orange inside, with each stripe marking a step of 0.1 in distance.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float d = sdCircle(p, 0.5);
          vec3 color = d > 0.0 ? vec3(0.35, 0.6, 0.9) : vec3(0.95, 0.6, 0.3);  //ja: 外は青、内はオレンジ //en: blue outside, orange inside
          color *= 0.75 + 0.25 * sin(d * 62.8);                                 //ja: 距離 0.1 ごとのしま //en: a stripe every 0.1
          color += 1.0 - smoothstep(0.0, 2.0 * px, abs(d));                     //ja: 縁(d = 0)に白い線 //en: a white line on the rim (d = 0)
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`0.5` を `0.2` にすると、色の分かれ目はどう動くでしょう? `sdCircle(p, 0.5)` を `sdCircle(p - vec2(0.5, 0.2), 0.5)` にすると?",
        en: "Change `0.5` to `0.2`: where does the color boundary go? What about `sdCircle(p - vec2(0.5, 0.2), 0.5)`?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "符号付き距離を色で見るこの方法は、[距離で描く](/learn/sdf-2d) の回で、四角や線分などほかの形にも広げます。",
        en: "This way of viewing a signed distance as color comes back in [Drawing with distance](/learn/sdf-2d), where we extend it to boxes, line segments and more.",
      },
    },

    { type: "heading", text: { ja: "楕円", en: "Ellipses" } },
    {
      type: "paragraph",
      text: {
        ja: "楕円は、円を片方の向きにだけ伸ばした形です。図形を伸ばすかわりに、**座標を縮めます**。`p.x` を 0.5 倍すると、`p.x` が 0.8 のところでも円の計算には 0.4 しか届かないので、円は横に 2 倍伸びて見えます。[座標を知る](/learn/coordinates) の「座標を 2 倍すると図形は半分」の逆です。",
        en: "An ellipse is a circle stretched in one direction only. Instead of stretching the shape, **shrink the coordinates**. Multiply `p.x` by 0.5 and, even where `p.x` is 0.8, the circle only sees 0.4, so the circle appears twice as wide. It is the reverse of \"double the coordinates and the shape halves\" from [Knowing where you are](/learn/coordinates).",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec2 q = p * vec2(0.5, 1.0);  //ja: x だけ半分に → 横に 2 倍伸びる //en: halve x only → twice as wide
          float d = sdCircle(q, 0.4);
          float fill = 1.0 - smoothstep(-px, px, d);
          vec3 color = vec3(0.08, 0.1, 0.2) + fill * vec3(0.5, 0.85, 0.4);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`vec2(0.5, 1.0)` を `vec2(1.0, 0.6)` にすると? `vec2(1.0, 0.8 + 0.2 * sin(time * 3.0))` にすると、ぷるぷる弾みます",
        en: "Try `vec2(1.0, 0.6)` instead of `vec2(0.5, 1.0)`. With `vec2(1.0, 0.8 + 0.2 * sin(time * 3.0))`, it wobbles like jelly",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "座標を縮めたり伸ばしたりすると、距離も同じ割合でずれます。x を 0.5 倍したこの楕円では、左右の端で `d` の変わり方が半分になるので、縁のぼかしの幅が 2 倍になります。少しなら目立ちませんが、大きく伸ばすほど縁がぼやけたり、逆にギザギザしたりします。正しい直し方は [座標を動かす](/learn/transforms) で扱います。",
        en: "Squashing or stretching the coordinates throws the distance off by the same factor. In this ellipse, with x halved, `d` changes half as fast at the left and right ends, so the edge blur there is twice as wide. A little is hard to notice, but the more you stretch, the blurrier (or more jagged) the edge gets. [Moving space](/learn/transforms) shows the proper fix.",
      },
    },

    { type: "heading", text: { ja: "円を重ねる", en: "Combining circles" } },
    {
      type: "paragraph",
      text: {
        ja: "円が 2 つ以上あるとき、重ね方は大きく 3 通りあります。",
        en: "With two or more circles, there are three main ways to combine them:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "色を **足す** … 重なったところが明るくなる。光を重ねる感じ",
          en: "**Add** the colors … overlaps get brighter, like overlapping lights",
        },
        {
          ja: "マスクを **max** でまとめる … どちらかの内側なら 1。重なっても明るさは変わらない",
          en: "Combine the masks with **max** … 1 if inside either one; overlaps are no brighter",
        },
        {
          ja: "距離を **min** でまとめる … 近いほうの距離。2 つを合わせた形の「距離」がそのまま手に入る",
          en: "Combine the distances with **min** … the nearer distance, giving you the distance to both shapes as one",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "まずは足し算です。赤・緑・青の円を少しずつずらして足すと、[はじめてのシェーダー](/learn/first-shader) で見た光の足し算がそのまま目に見えます。",
        en: "First, addition. Overlap a red, a green and a blue circle and add them, and you can see the light mixing from [Your first shader](/learn/first-shader) right on screen.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(-0.25, -0.15), 0.45));
          float b = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.25, -0.15), 0.45));
          float c = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.0, 0.28), 0.45));
          vec3 color = vec3(0.0);
          color += a * vec3(1.0, 0.0, 0.0);  //ja: 赤 //en: red
          color += b * vec3(0.0, 1.0, 0.0);  //ja: 緑 //en: green
          color += c * vec3(0.0, 0.0, 1.0);  //ja: 青 //en: blue
          // color = max(a, max(b, c)) * vec3(1.0, 0.8, 0.3);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "重なったところは黄・水色・赤紫に、3 つ全部では白になります。`return` の前の行の `//` を消すと、max でまとめた 1 つの形になります",
        en: "Overlaps turn yellow, cyan and magenta, and all three together make white. Remove the `//` on the line just before `return` to merge them into one shape with max",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "次は min です。`min(d1, d2)` は、各点で「近いほうの円までの距離」です。どちらかの内側ならマイナスになるので、塗ると 2 つの円を合わせた形になります。ここまでは max でまとめたマスクと同じ見た目です。違うのは、結果が **まだ距離** だということです。だから `abs(d - 0.06)` のように、2 つの円をひとまとめにした外側の線も引けます。マスクは 0 か 1 で、「どれだけ離れているか」が残っていないので、こうはいきません。",
        en: "Next, min. `min(d1, d2)` is, at every point, the distance to the nearer circle. It is negative inside either one, so filling it gives the two circles merged. So far that looks just like masks combined with max. The difference is that the result is **still a distance**, so you can draw an outline around both circles as a single shape, as with `abs(d - 0.06)`. A mask is just 0 or 1, with no memory of how far away anything is, so it can't do this.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float d1 = sdCircle(p - vec2(-0.3, 0.0), 0.45);
          float d2 = sdCircle(p - vec2(0.35, 0.1), 0.35);
          float d = min(d1, d2);  //ja: 2 つを合わせた形までの距離 //en: distance to the two shapes as one
          float fill = 1.0 - smoothstep(-px, px, d);
          float outline = 1.0 - smoothstep(0.015 - px, 0.015 + px, abs(d - 0.06));  //ja: 外側に 0.06 離した線 //en: a line 0.06 outside
          vec3 color = vec3(0.07, 0.08, 0.15);
          color += fill * vec3(0.95, 0.55, 0.3);
          color += outline * vec3(0.4, 0.8, 1.0);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`min(d1, d2)` を `max(d1, d2)` にすると、重なった部分だけが残ります([図形を組み合わせる](/learn/combining-shapes) で使います)。`0.06` を `0.0` にすると?",
        en: "Change `min(d1, d2)` to `max(d1, d2)` and only the overlap remains (we use this in [Combining shapes](/learn/combining-shapes)). What happens with `0.0` instead of `0.06`?",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "距離を使って、円からできる絵を描いてみましょう。縁はいつも `px` でなめらかにしておきます。",
        en: "Use distance to draw pictures made of circles. Always smooth the edges with `px`.",
      },
    },
    {
      type: "exercise",
      title: { ja: "3 つの泡", en: "Three bubbles" },
      prompt: {
        ja: "大きさも位置も色もちがう 3 つの泡を描いてください。泡は、中がうっすら色づき、縁に明るい輪があり、左上に小さな光の点がある円です。",
        en: "Draw three bubbles, each a different size, position and color. A bubble is a circle with a faint tint inside, a bright ring on its rim, and a small highlight in its upper left.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 color = vec3(0.05, 0.1, 0.2);
          float d = sdCircle(p - vec2(-0.5, 0.0), 0.3);
          color += (1.0 - smoothstep(-px, px, d)) * vec3(0.2, 0.4, 0.6);
          //ja: 縁の輪と光の点、残りの 2 つの泡を書き足す
          //en: add the rim, the highlight and the other two bubbles
          return vec4(color, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        //ja: 泡 1 つぶんの色(中心 c、半径 r、色 tint)
        //en: the color of one bubble (center c, radius r, color tint)
        vec3 bubble(vec2 p, vec2 c, float r, vec3 tint) {
          float px = 2.0 / resolution.y;
          float d = sdCircle(p - c, r);
          float fill = 1.0 - smoothstep(-px, px, d);
          float rim = 1.0 - smoothstep(0.012 - px, 0.012 + px, abs(d));                        //ja: 縁の輪 //en: the rim
          float shine = 1.0 - smoothstep(-px, px, sdCircle(p - c - vec2(-0.35, 0.35) * r, 0.15 * r));  //ja: 光の点 //en: the highlight
          return fill * tint * 0.35 + rim * tint + shine * 0.8;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 color = vec3(0.04, 0.08, 0.18) + uv.y * vec3(0.05, 0.1, 0.15);
          color += bubble(p, vec2(-0.6, -0.2), 0.35, vec3(0.4, 0.8, 1.0));
          color += bubble(p, vec2(0.2, 0.25), 0.5, vec3(0.9, 0.5, 1.0));
          color += bubble(p, vec2(0.85, -0.45), 0.22, vec3(0.5, 1.0, 0.7));
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "円 1 つぶんのコードを、中心と半径を変えて 3 回書けば 3 つになります",
          en: "Write the code for one circle three times, with a different center and radius each time",
        },
        {
          ja: "縁の輪は `abs(d)` が小さいところです。`1.0 - smoothstep(w - px, w + px, abs(d))`。光の点は、中心を左上へずらした小さな円です",
          en: "The rim is where `abs(d)` is small: `1.0 - smoothstep(w - px, w + px, abs(d))`. The highlight is a small circle shifted up and to the left",
        },
        {
          ja: "同じことを 3 回書くなら、[関数で形を作る](/learn/shaping-functions) の `plot` のように、`vec3 bubble(vec2 p, vec2 c, float r, vec3 tint)` という自分の関数にまとめると短くなります",
          en: "When you write the same thing three times, wrap it in your own function, like `plot` in [Shaping functions](/learn/shaping-functions): `vec3 bubble(vec2 p, vec2 c, float r, vec3 tint)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "波紋", en: "Ripples" },
      prompt: {
        ja: "水面に石を落としたときのように、1 点から外へ広がっていく同心円の波を作ってください。外へ行くほど波は弱くなり、画面の端では消えるようにします。",
        en: "Make concentric waves spreading outward from one point, like ripples after a stone hits water. The waves should weaken as they travel out and fade away before the edge of the screen.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float d = length(p);
          float wave = sin(d * 40.0) * 0.5 + 0.5;  //ja: 止まった同心円 //en: still, concentric rings
          vec3 color = vec3(0.02, 0.05, 0.12) + wave * vec3(0.2, 0.5, 0.8);
          return vec4(color, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          float d = length(p - vec2(0.0, -0.1));
          float wave = sin(d * 40.0 - time * 4.0) * 0.5 + 0.5;  //ja: - time で外へ進む //en: - time moves it outward
          wave = pow(wave, 3.0);                                  //ja: 波の山を細く //en: thinner crests
          float fade = 1.0 - smoothstep(0.0, 1.2, d);            //ja: 外ほど弱く //en: weaker further out
          vec3 color = vec3(0.02, 0.05, 0.12) + wave * fade * vec3(0.3, 0.7, 1.0);
          color += (1.0 - smoothstep(0.0, 0.08, d)) * vec3(0.8, 0.9, 1.0);  //ja: 中心の光 //en: a glow at the center
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "波を動かすには、sin の中で time を引きます。[関数で形を作る](/learn/shaping-functions) で流した波と同じです",
          en: "To move the waves, subtract time inside the sin, just like the flowing wave in [Shaping functions](/learn/shaping-functions)",
        },
        {
          ja: "外ほど弱くするには、距離が大きいほど 0 に近づく数をかけます。0 で 1、1.2 で 0 になる形は `1.0 - smoothstep(0.0, 1.2, d)` です",
          en: "To weaken them further out, multiply by something that heads to 0 as distance grows. `1.0 - smoothstep(0.0, 1.2, d)` is 1 at 0 and 0 at 1.2",
        },
        {
          ja: "`sin(d * 40.0 - time * 4.0) * 0.5 + 0.5` に `1.0 - smoothstep(0.0, 1.2, d)` をかけます",
          en: "Multiply `sin(d * 40.0 - time * 4.0) * 0.5 + 0.5` by `1.0 - smoothstep(0.0, 1.2, d)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "雪だるま", en: "A snowman" },
      prompt: {
        ja: "大小 2 つの円を `min` でつないで、雪だるまの形を作ってください。体は白く塗り、形の外側に青い輪郭線を 1 本引きます(2 つの円の重なりに線が出ないように)。目を 2 つ付けたら完成です。",
        en: "Join a big and a small circle with `min` to make a snowman. Fill the body white and draw one blue outline around the outside of the whole shape (with no line where the circles overlap). Add two eyes to finish.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float body = sdCircle(p - vec2(0.0, -0.35), 0.45);
          float d = body;  //ja: ここで頭とつなぐ //en: join the head here
          vec3 color = vec3(0.15, 0.2, 0.4);
          color += (1.0 - smoothstep(-px, px, d)) * vec3(0.8);
          return vec4(color, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float body = sdCircle(p - vec2(0.0, -0.35), 0.45);
          float head = sdCircle(p - vec2(0.0, 0.35), 0.3);
          float d = min(body, head);  //ja: 2 つの円を 1 つの形に //en: two circles, one shape

          vec3 color = vec3(0.15, 0.2, 0.4) + uv.y * vec3(0.1, 0.15, 0.2);                                //ja: 夜空 //en: night sky
          color += (1.0 - smoothstep(-px, px, d)) * vec3(0.8);                                             //ja: 体 //en: body
          color += (1.0 - smoothstep(0.01 - px, 0.01 + px, abs(d - 0.03))) * vec3(0.3, 0.6, 1.0);         //ja: 外側の輪郭線 //en: outline outside
          //ja: 目: 色を引いて暗くする
          //en: eyes: subtract color to darken
          float eyes = min(sdCircle(p - vec2(-0.1, 0.42), 0.035), sdCircle(p - vec2(0.1, 0.42), 0.035));
          color -= (1.0 - smoothstep(-px, px, eyes)) * vec3(0.9);
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "頭の円を作り、2 つの距離のうち近いほう(`min`)を使うと、2 つを合わせた形になります",
          en: "Make a circle for the head; taking the nearer of the two distances (`min`) gives the combined shape",
        },
        {
          ja: "輪郭線は `abs(d - 0.03)` が小さいところです。`min` でつないだ d から作れば、重なりの部分に線は出ません",
          en: "The outline is where `abs(d - 0.03)` is small. Build it from the d you joined with `min`, and no line appears in the overlap",
        },
        {
          ja: "`float d = min(body, head);`。目は 2 つの小さな円を同じように `min` でまとめ、その中の色を引いて暗くします",
          en: "`float d = min(body, head);`. Merge the two small eye circles with `min` the same way, then subtract color inside them to darken",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`length(p)` は原点からの距離、`distance(p, c)` = `length(p - c)` は点 c からの距離",
          en: "`length(p)` is the distance from the origin; `distance(p, c)`, or `length(p - c)`, is the distance from point c",
        },
        {
          ja: "円は「距離が半径より小さいところ」。マスクは内側で 1、外側で 0",
          en: "A circle is where the distance is less than the radius; a mask is 1 inside and 0 outside",
        },
        {
          ja: "縁は、1 ピクセルの幅 `px = 2.0 / resolution.y` で smoothstep するとなめらかになる",
          en: "Smooth an edge with smoothstep over one pixel, `px = 2.0 / resolution.y`",
        },
        {
          ja: "リングは `abs(d - r)`、楕円は座標を片方だけ縮める",
          en: "A ring uses `abs(d - r)`; an ellipse shrinks the coordinates in one direction",
        },
        {
          ja: "重ねるときは、色を足す・マスクを max・距離を min。min なら結果がまだ距離として使える",
          en: "Combine by adding colors, taking max of masks, or min of distances — and min keeps the result usable as a distance",
        },
        {
          ja: "`sdCircle(p, r) = length(p) - r` は内側がマイナスの距離。塗りは `1.0 - smoothstep(-px, px, d)`",
          en: "`sdCircle(p, r) = length(p) - r` is a distance that goes negative inside; fill it with `1.0 - smoothstep(-px, px, d)`",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、`mix` で色を混ぜ、配色(パレット)を作り、背景に図形を重ねて 1 枚の絵に仕上げます。",
        en: "Next time we blend colors with `mix`, build color palettes, and layer shapes over a background to finish a complete picture.",
      },
    },
  ],
};

export default lesson;
