import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "combining-shapes",
  title: { ja: "図形を組み合わせる", en: "Combining shapes" },
  summary: {
    ja: "四角と線分を加え、和・積・差で図形を組み合わせて絵を作る",
    en: "Add boxes and segments, and combine shapes with union, intersection and subtraction",
  },
  minutes: 55,
  goals: [
    {
      ja: "図形を「境目までの距離(内側は負)」という 1 つの数で考えられる",
      en: "Think of a shape as a single number: the distance to its edge, negative inside",
    },
    {
      ja: "`sdBox` で四角(角丸も)を、`sdSegment` で太さのある線分を描ける",
      en: "Draw boxes (including rounded ones) with `sdBox` and thick line segments with `sdSegment`",
    },
    {
      ja: "`min`・`max` で、図形の和・積・差を作れる",
      en: "Build unions, intersections and subtractions of shapes with `min` and `max`",
    },
    {
      ja: "`abs(d) - w` で、どんな図形にも縁取りの線を付けられる",
      en: "Outline any shape with `abs(d) - w`",
    },
    {
      ja: "塗る順番を考えて、影や部品を重ね、簡単な絵やアイコンを組み立てられる",
      en: "Layer shadows and parts in the right order to build simple pictures and icons",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "図形を「距離」で考え直す", en: "Rethinking shapes as distances" } },
    {
      type: "paragraph",
      text: {
        ja: "[円と距離](/learn/circles-and-distance) で作った `sdCircle(p, r)` は、`length(p) - r` を返す関数でした。点が円の **内側なら負、ちょうど縁なら 0、外側なら正** の数になります。半径 0.5 の円で、点 (0.2, 0.0) なら 0.2 - 0.5 = -0.3(縁まであと 0.3 の内側)、点 (0.8, 0.0) なら 0.8 - 0.5 = 0.3(縁から 0.3 外側)です。",
        en: "The `sdCircle(p, r)` from [Circles and distance](/learn/circles-and-distance) returns `length(p) - r`. The result is **negative inside the circle, 0 exactly on the edge, and positive outside**. For a circle of radius 0.5, the point (0.2, 0.0) gives 0.2 - 0.5 = -0.3 (inside, 0.3 from the edge), and the point (0.8, 0.0) gives 0.8 - 0.5 = 0.3 (outside, 0.3 from the edge).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "このように、図形を「**境目までの距離。ただし内側は負**」という 1 つの数で表したものが **符号付き距離** でした。この形にしておくと、四角でも線でも、組み合わせた複雑な形でも、塗り方はいつも同じ `1.0 - smoothstep(-px, px, d)` です。この回では、距離で表せる図形を増やし、それを組み合わせる方法を学びます。まずは [円と距離](/learn/circles-and-distance) で見た「距離を色で見る」方法を、新しい図形を確かめる道具として用意しておきます。",
        en: "A single number like this — **the distance to the edge, negative on the inside** — is what we called a **signed distance**. Once a shape is in this form, whether it's a box, a line or a complicated combination, you fill it the same way every time: `1.0 - smoothstep(-px, px, d)`. In this lesson we add more shapes that can be written as distances, and learn how to combine them. First, let's set up the \"distance as color\" view from [Circles and distance](/learn/circles-and-distance) as a tool for checking new shapes.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float d = sdCircle(p, 0.5);

          vec3 col = d < 0.0 ? vec3(1.0, 0.6, 0.3) : vec3(0.35, 0.65, 1.0); //ja: 内側はオレンジ、外側は青 //en: orange inside, blue outside
          col *= 0.75 + 0.25 * sin(d * 60.0);                                 //ja: 等高線のようなしま //en: stripes like contour lines
          col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 2.0 * px, abs(d))); //ja: 境目(d = 0)を白く //en: the edge (d = 0) in white
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`sdCircle(p, 0.5)` を `sdCircle(p - vec2(0.5, 0.2), 0.3)` にすると? `60.0` を `20.0` にすると、しまの間隔が広がります",
        en: "Try `sdCircle(p - vec2(0.5, 0.2), 0.3)`. Change `60.0` to `20.0` and the stripes spread out",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "オレンジが内側(d が負)、青が外側(d が正)、白い線が d = 0 の境目です。しまは `sin(d * 60.0)` で、d が約 0.1 変わるごとに 1 本ずつ現れます([円と距離](/learn/circles-and-distance) の等高線と同じ考え方です)。しまが境目と同じ形で、同じ間隔で並んでいれば、その関数は「どこでも境目までの距離を正しく返している」とわかります。これからは、この **距離の地図** で新しい図形を確かめていきます。",
        en: "Orange is the inside (negative d), blue is the outside (positive d), and the white line is the edge where d = 0. The stripes come from `sin(d * 60.0)`: one appears for every change of about 0.1 in d (the same idea as the contour lines in [Circles and distance](/learn/circles-and-distance)). If the stripes follow the shape of the edge at even spacing, the function is returning the correct distance to the edge everywhere. From here on, we will check each new shape with this **distance map**.",
      },
    },

    { type: "heading", text: { ja: "四角: sdBox", en: "Boxes: sdBox" } },
    {
      type: "paragraph",
      text: {
        ja: "中心が原点の四角までの符号付き距離は、次の `sdBox` で求められます。`b` は四角の **半分の大きさ**(中心から右の辺までと、上の辺まで)です。`vec2(0.6, 0.3)` なら、幅 1.2、高さ 0.6 の四角になります。",
        en: "The signed distance to a box centered at the origin is given by `sdBox` below. `b` is **half the box's size**: the distance from the center to the right edge and to the top edge. `vec2(0.6, 0.3)` makes a box 1.2 wide and 0.6 tall.",
      },
    },
    {
      type: "code",
      source: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "1 行ずつ見ていきます。まず `abs(p)` で、x と y の符号を取ります。四角は上下左右に対称なので、左下の点 (-0.9, -0.1) も右上の点 (0.9, 0.1) と同じ距離です。abs で全部の点を **右上の 4 分の 1 に折りたたむ** と、右上の角のまわりだけを考えれば済みます。次の `d = abs(p) - b` は、「右の辺から x 方向にどれだけはみ出しているか」と「上の辺から y 方向にどれだけはみ出しているか」の 2 つです(負なら、まだ内側)。ここで場合が 3 つに分かれます。",
        en: "Let's go line by line. First, `abs(p)` drops the signs of x and y. A box is symmetric left-right and top-bottom, so the bottom-left point (-0.9, -0.1) is the same distance away as the top-right point (0.9, 0.1). Using abs to **fold every point into the top-right quarter** means we only have to think about the top-right corner. Next, `d = abs(p) - b` holds two numbers: how far the point sticks out past the right edge in x, and past the top edge in y (negative means still inside). Now there are three cases.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "**両方とも負**(四角の内側): いちばん近い辺までの距離は、d.x と d.y のうち 0 に近いほう、つまり `max(d.x, d.y)`。b = (0.6, 0.3) で p = (0.2, 0.1) なら、d = (-0.4, -0.2) で、答えは -0.2(上の辺まで 0.2)",
          en: "**Both negative** (inside the box): the nearest edge is whichever of d.x and d.y is closer to 0, i.e. `max(d.x, d.y)`. With b = (0.6, 0.3) and p = (0.2, 0.1), d = (-0.4, -0.2) and the answer is -0.2 (0.2 from the top edge)",
        },
        {
          ja: "**片方だけ正**(辺の横の外側): はみ出している向きの数がそのまま距離。p = (0.9, 0.1) なら d = (0.3, -0.2) で、答えは 0.3",
          en: "**Only one positive** (outside, beside an edge): the amount sticking out is the distance. With p = (0.9, 0.1), d = (0.3, -0.2) and the answer is 0.3",
        },
        {
          ja: "**両方とも正**(角の外側): いちばん近いのは角の点なので、距離は `length(d)`。p = (0.9, 0.7) なら d = (0.3, 0.4) で、答えは 0.5",
          en: "**Both positive** (outside, past a corner): the nearest point is the corner itself, so the distance is `length(d)`. With p = (0.9, 0.7), d = (0.3, 0.4) and the answer is 0.5",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "`max(d, 0.0)` は負の成分を 0 にするので、`length(max(d, 0.0))` は 2 番目と 3 番目の場合をまとめて計算し、内側では 0 になります。`min(max(d.x, d.y), 0.0)` は 1 番目の場合だけ負の値を出し、外側では 0 になります。この 2 つを足すと、どの場合でも正しい答えになる、というしくみです。距離の地図で確かめてみましょう。",
        en: "`max(d, 0.0)` sets negative components to 0, so `length(max(d, 0.0))` handles the second and third cases at once and is 0 inside. `min(max(d.x, d.y), 0.0)` gives a negative value only in the first case and is 0 outside. Adding the two gives the right answer in every case. Let's check it on the distance map.",
      },
    },
    {
      type: "playground",
      source: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float d = sdBox(p, vec2(0.6, 0.3)); //ja: 幅 1.2、高さ 0.6 //en: 1.2 wide, 0.6 tall

          vec3 col = d < 0.0 ? vec3(1.0, 0.6, 0.3) : vec3(0.35, 0.65, 1.0);
          col *= 0.75 + 0.25 * sin(d * 60.0);
          col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 2.0 * px, abs(d)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`vec2(0.6, 0.3)` を `vec2(0.3)` にすると正方形に。外側のしまが、角のまわりだけ丸くなっていることにも注目してください",
        en: "Use `vec2(0.3)` for a square. Notice that the outside stripes turn round near the corners",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "内側のしまは四角いまま縮み、外側のしまは角のまわりで丸くなります。外側の角の近くでは「いちばん近いのは角の点」になるので、角からの距離が一定の線、つまり円の一部になるからです。これが 3 番目の場合です。",
        en: "The stripes inside shrink as squares, while the stripes outside round off near the corners. Out there, the nearest point is the corner itself, so lines of equal distance are lines of equal distance from the corner — pieces of a circle. That's the third case.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この丸くなる性質を使うと、**角丸の四角** が作れます。距離から `r` を引くと、境目が外へ `r` だけ広がり、元の形から `r` 以内の点が全部「内側」になります。とがった角のまわりで `r` 以内の点は 4 分の 1 の円になるので、角が丸くなります。全体が `r` だけ大きくならないよう、先に `b - r` で小さくしておくのがこつです。",
        en: "This rounding gives us **rounded boxes**. Subtracting `r` from a distance pushes the edge outward by `r`: every point within `r` of the original shape now counts as inside. Near a sharp corner, the points within `r` form a quarter circle, so the corner becomes round. The trick is to shrink the box first with `b - r` so the overall size doesn't grow by `r`.",
      },
    },
    {
      type: "playground",
      source: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.93, 0.9, 0.85), vec3(0.85, 0.88, 0.95), uv.y);

          float r = 0.15;                              //ja: 角の丸み //en: corner radius
          float d = sdBox(p, vec2(0.7, 0.45) - r) - r; //ja: r だけ小さくしてから、r だけ太らせる //en: shrink by r, then fatten by r
          vec3 card = mix(vec3(0.95, 0.45, 0.35), vec3(0.98, 0.7, 0.3), uv.y);
          col = mix(col, card, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`r` を `0.0` にすると、とがった角に戻ります。`0.45` にすると、両端が半円のカプセルの形になります",
        en: "Set `r` to `0.0` for sharp corners again. At `0.45` it becomes a capsule with semicircular ends",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`sdBox` に渡す `b` は「半分の大きさ」です。幅 1.0 の四角がほしいときは `0.5` を渡します。また、`sdCircle` と同じように、四角を動かすときは `sdBox(p - vec2(0.5, 0.0), b)` のように `p` から中心を引きます。",
        en: "The `b` you pass to `sdBox` is half the size: for a box 1.0 wide, pass `0.5`. And just like `sdCircle`, to move a box, subtract its center from `p`: `sdBox(p - vec2(0.5, 0.0), b)`.",
      },
    },

    { type: "heading", text: { ja: "線分: sdSegment", en: "Line segments: sdSegment" } },
    {
      type: "paragraph",
      text: {
        ja: "点 `a` から点 `b` までの線分までの距離は、次の `sdSegment` で求めます。線分には太さが無いので、答えはいつも 0 以上です(内側がありません)。太さのある線にしたいときは、角丸と同じように **距離から太さを引き** ます。`sdSegment(p, a, b) - 0.05` は、線分から 0.05 以内、つまり太さ 0.1 の線になり、両端は自然に丸くなります。",
        en: "The distance to the line segment from point `a` to point `b` is given by `sdSegment` below. A segment has no thickness, so the answer is always 0 or more — there is no inside. To get a thick line, **subtract the thickness from the distance**, just as with rounded corners. `sdSegment(p, a, b) - 0.05` covers everything within 0.05 of the segment, a line 0.1 thick, with naturally rounded ends.",
      },
    },
    {
      type: "code",
      source: `
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "考え方は「線分の上で、いちばん近い点を探して、そこまでの長さを測る」です。`pa` は a から p への矢印、`ba` は a から b への矢印です。`dot(u, v)` は `u.x * v.x + u.y * v.y` を計算する関数(**内積**)で、`dot(pa, ba) / dot(ba, ba)` は「p を線の向きに映すと、a から b までの何割のところに来るか」を表します。これを `h` とします。h が 0 なら a の位置、1 なら b の位置です。",
        en: "The idea is: find the closest point on the segment, then measure the distance to it. `pa` is the arrow from a to p, and `ba` is the arrow from a to b. `dot(u, v)` computes `u.x * v.x + u.y * v.y` (the **dot product**), and `dot(pa, ba) / dot(ba, ba)` says how far along from a to b the point p lands when projected onto the line, as a fraction. Call it `h`: 0 means at a, 1 means at b.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "具体的に、a = (-0.5, 0.0)、b = (0.5, 0.0) の横向きの線分で考えます。p = (0.25, 0.3) なら pa = (0.75, 0.3)、ba = (1.0, 0.0) で、h = 0.75 ÷ 1.0 = 0.75。線分の上の a + ba × 0.75 = (0.25, 0.0) がいちばん近い点で、距離は 0.3 です。p = (1.0, 0.0) なら h = 1.5 ですが、線分は b で終わっているので、`clamp` で 1.0 に切り詰めます。いちばん近いのは端の b で、距離は 0.5 です。この切り詰めのおかげで、端のまわりは円の形になります。",
        en: "Take a concrete example: the horizontal segment from a = (-0.5, 0.0) to b = (0.5, 0.0). For p = (0.25, 0.3), pa = (0.75, 0.3) and ba = (1.0, 0.0), so h = 0.75 ÷ 1.0 = 0.75. The closest point on the segment is a + ba × 0.75 = (0.25, 0.0), at a distance of 0.3. For p = (1.0, 0.0), h comes out as 1.5, but the segment stops at b, so `clamp` cuts it to 1.0. The closest point is the end b, at a distance of 0.5. That clamping is why the area around each end is round.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.08, 0.08, 0.12);

          vec2 a = vec2(-0.6, -0.3);
          vec2 b = 0.6 * vec2(cos(time), sin(time)); //ja: b は円を描いて動く //en: b travels around a circle
          float d = sdSegment(p, a, b) - 0.05;        //ja: 0.05 だけ太らせる //en: fatten by 0.05
          col = mix(col, vec3(0.4, 0.9, 0.6), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.05` を `0.2` にすると太い線に。`a` を `b` と同じ値にすると、線分は点になり、ただの円になります",
        en: "Change `0.05` to `0.2` for a thick stroke. Make `a` equal to `b` and the segment shrinks to a point: just a circle",
      },
    },

    { type: "heading", text: { ja: "和・積・差", en: "Union, intersection and subtraction" } },
    {
      type: "paragraph",
      text: {
        ja: "[円と距離](/learn/circles-and-distance) では、`min(d1, d2)` で 2 つの円を合わせた形を作り、`max(d1, d2)` で重なった部分だけを残しました。この 2 つに「差」を加えた 3 つの組み合わせ方は、円だけでなく、距離で表せるどんな図形にも使えます。理由は「内側は負」という約束にあります。",
        en: "In [Circles and distance](/learn/circles-and-distance) you merged two circles with `min(d1, d2)` and kept only their overlap with `max(d1, d2)`. These two, plus subtraction, work for any shape written as a distance, not just circles. The reason lies in the rule that the inside is negative.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "**和** `min(d1, d2)` … どちらかの内側なら内側。どちらかが負なら、小さいほうをとれば負になる",
          en: "**Union** `min(d1, d2)` … inside if inside either. If either is negative, the smaller one is negative",
        },
        {
          ja: "**積** `max(d1, d2)` … 両方の内側のときだけ内側。大きいほうも負なら、両方とも負",
          en: "**Intersection** `max(d1, d2)` … inside only where both are. If even the larger one is negative, both are",
        },
        {
          ja: "**差** `max(d1, -d2)` … 1 つ目の内側で、2 つ目の外側。`-d2` は 2 つ目の内と外をひっくり返したもの",
          en: "**Subtraction** `max(d1, -d2)` … inside the first and outside the second. `-d2` flips the second shape inside out",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめてみます。ある点が円の内側(`dc = -0.2`)で、四角の外側(`db = 0.1`)にあるとします。和は min(-0.2, 0.1) = -0.2 で内側。積は max(-0.2, 0.1) = 0.1 で外側(両方には入っていない)。差は max(-0.2, -0.1) = -0.1 で内側(円に入っていて、四角には入っていない)。どれも思ったとおりの答えになります。",
        en: "Let's check with numbers. Say a point is inside the circle (`dc = -0.2`) and outside the box (`db = 0.1`). The union is min(-0.2, 0.1) = -0.2: inside. The intersection is max(-0.2, 0.1) = 0.1: outside, since it isn't in both. The subtraction is max(-0.2, -0.1) = -0.1: inside, since it's in the circle but not in the box. Every answer is what we'd expect.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float dc = sdCircle(p - vec2(-0.25, 0.0), 0.45);
          float db = sdBox(p - vec2(0.25, 0.0), vec2(0.4));

          float d = min(dc, db);   //ja: 和: どちらかの内側 //en: union: inside either
          // d = max(dc, db);      //ja: 積: 両方の内側 //en: intersection: inside both
          // d = max(dc, -db);     //ja: 差: 円から四角を引く //en: subtraction: circle minus box

          vec3 col = d < 0.0 ? vec3(1.0, 0.6, 0.3) : vec3(0.35, 0.65, 1.0);
          col *= 0.75 + 0.25 * sin(d * 60.0);
          col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 2.0 * px, abs(d)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "行の先頭の `//` を 1 つずつ消して、積と差を見比べましょう。`max(db, -dc)` にすると、四角から円を引きます",
        en: "Remove the leading `//` on one line at a time to compare intersection and subtraction. `max(db, -dc)` subtracts the circle from the box instead",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "[円と距離](/learn/circles-and-distance) で見たとおり、**マスク**(内側が 1.0、外側が 0.0)どうしを重ねるなら、和は `max` です。距離(内側が負)では逆に `min` が和になります。符号の向きが逆だからです。また、積や差の結果は、外側では正確な距離から少しずれることがあります。縁を描くには十分ですが、くわしくは [距離で描く(2D SDF)](/learn/sdf-2d) で扱います。",
        en: "As in [Circles and distance](/learn/circles-and-distance), if you combine **masks** (1.0 inside, 0.0 outside), the union is `max`. With distances (negative inside) it flips, and `min` is the union, because the sign runs the other way. Also, the result of an intersection or subtraction can drift slightly from the true distance outside the shape. It's plenty for drawing edges; we look at this closely in [Drawing with distance (2D SDF)](/learn/sdf-2d).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "差を使うと、円を円でかじって **三日月** が作れます。かじる側の円を少し動かすと、月が満ち欠けするように形が変わります。",
        en: "With subtraction, you can bite one circle out of another to make a **crescent moon**. Move the biting circle a little and the shape changes like the phases of the moon.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.02, 0.03, 0.1), vec3(0.1, 0.12, 0.3), uv.y);

          float moon = sdCircle(p, 0.5);
          float bite = sdCircle(p - vec2(0.25 + 0.1 * sin(time), 0.15), 0.45); //ja: かじる円が少し動く //en: the biting circle drifts a little
          float d = max(moon, -bite);                                         //ja: 月から引く //en: subtract it from the moon

          col += vec3(0.25, 0.22, 0.1) * (1.0 - smoothstep(0.0, 0.5, d));     //ja: ぼんやりした光 //en: a soft glow
          col = mix(col, vec3(1.0, 0.92, 0.6), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "かじる円の半径 `0.45` を `0.3` にすると? `max(moon, -bite)` を `max(moon, bite)` にすると、重なった部分だけが残ります",
        en: "What if the biting radius `0.45` becomes `0.3`? Change `max(moon, -bite)` to `max(moon, bite)` and only the overlap remains",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`p.y - 0.2` も立派な符号付き距離です。水平な線 y = 0.2 までの距離で、線より下が負になります。たとえば `max(d, p.y)` とすると、図形の y が 0 より下の部分だけが残ります。図形を半分に切りたいときに便利です。",
        en: "`p.y - 0.2` is a perfectly good signed distance too: the distance to the horizontal line y = 0.2, negative below it. For example, `max(d, p.y)` keeps only the part of a shape below y = 0. It's handy for cutting a shape in half.",
      },
    },

    { type: "heading", text: { ja: "縁取り: abs(d) - w", en: "Outlines: abs(d) - w" } },
    {
      type: "paragraph",
      text: {
        ja: "`abs(d)` は、内側でも外側でも「境目までの距離」を正の数で返します。そこから `w` を引いた `abs(d) - w` は、**境目から w 以内** のところだけが負になります。つまり、境目にそった太さ `2 * w` の帯、**縁取りの線** です。d がどんな図形の距離でも同じように使えるので、組み合わせた図形にもそのまま縁が付きます。",
        en: "`abs(d)` gives the distance to the edge as a positive number, inside or out. Subtract `w` and `abs(d) - w` is negative only **within w of the edge**: a band `2 * w` wide that follows the edge — an **outline**. It works the same no matter what shape d describes, so combined shapes get an outline for free.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.04, 0.03, 0.08);

          float d = min(sdBox(p - vec2(-0.3, -0.05), vec2(0.4, 0.3)), sdCircle(p - vec2(0.35, 0.1), 0.35));
          float line = abs(d) - 0.015;                                 //ja: 境目にそった細い帯 //en: a thin band along the edge
          vec3 neon = vec3(1.0, 0.3, 0.7);
          col += neon * 0.4 * (1.0 - smoothstep(0.0, 0.15, line));     //ja: にじむ光 //en: glow
          col = mix(col, vec3(1.0, 0.8, 0.95), 1.0 - smoothstep(-px, px, line));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.015` を `0.05` にすると太い線に。`abs(d) - 0.015` を `abs(abs(d) - 0.1) - 0.015` にすると、二重の線になります",
        en: "Change `0.015` to `0.05` for a thick line. Replace `abs(d) - 0.015` with `abs(abs(d) - 0.1) - 0.015` to get a double line",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "二重の線になるのは、`abs(d) - 0.1` が「境目から 0.1 離れたところ」を新しい境目とする距離だからです。その abs をもう一度とって縁取りにすると、内側に 0.1 と外側に 0.1 の 2 本の線になります。ネオンの光は、線までの距離が 0〜0.15 の範囲で `smoothstep` を使い、近いほど明るくしています。",
        en: "You get a double line because `abs(d) - 0.1` is a distance whose new edge sits 0.1 away from the original edge. Take abs of that again and outline it, and you get two lines: one 0.1 inside and one 0.1 outside. The neon glow uses `smoothstep` over distances of 0 to 0.15 from the line, brighter the closer you are.",
      },
    },

    { type: "heading", text: { ja: "重ねる順番と影", en: "Layering order and shadows" } },
    {
      type: "paragraph",
      text: {
        ja: "[色を混ぜる](/learn/mixing-colors) で見たとおり、`col = mix(col, shapeColor, mask)` を何回も書くと、**後に書いたものほど上に** 塗られます。絵を組み立てるときは「奥のものから順に」書きます。たとえば影は、同じ形を少しずらして、ぼかした暗い色で **先に** 塗っておきます。ぼかしは、`smoothstep` の幅を `px` より広くするだけです。",
        en: "As you saw in [Mixing colors](/learn/mixing-colors), when you write `col = mix(col, shapeColor, mask)` several times, **whatever comes later is painted on top**. When building a picture, write things from back to front. A shadow, for example, is the same shape shifted slightly and painted **first**, blurred and dark. Blurring is just a matter of making the `smoothstep` range wider than `px`.",
      },
    },
    {
      type: "playground",
      source: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.92, 0.93, 0.96);

          //ja: 1. 影: 同じ形を右下にずらし、ぼかして塗る
          //en: 1. shadow: the same shape shifted down-right, blurred
          float shadow = sdBox(p - vec2(0.04, -0.06), vec2(0.3)) - 0.15;
          col = mix(col, vec3(0.6, 0.62, 0.7), 1.0 - smoothstep(-0.08, 0.08, shadow));

          //ja: 2. アイコンの地(角丸の四角)
          //en: 2. the icon's base (a rounded box)
          float icon = sdBox(p, vec2(0.3)) - 0.15;
          vec3 base = mix(vec3(0.2, 0.75, 0.55), vec3(0.15, 0.55, 0.85), uv.y);
          col = mix(col, base, 1.0 - smoothstep(-px, px, icon));

          //ja: 3. チェックの印: 線分 2 本の和を太らせる
          //en: 3. the check mark: two segments joined, then fattened
          float check = min(sdSegment(p, vec2(-0.2, 0.0), vec2(-0.05, -0.15)),
                            sdSegment(p, vec2(-0.05, -0.15), vec2(0.22, 0.15))) - 0.05;
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, check));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "影の 2 行を、アイコンの地の 3 行より後ろに移すと、影がアイコンの上に乗ってしまいます。影の `-0.08, 0.08` を `-0.02, 0.02` にすると、くっきりした影に",
        en: "Move the two shadow lines below the three base lines and the shadow ends up on top of the icon. Change the shadow's `-0.08, 0.08` to `-0.02, 0.02` for a crisp shadow",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "アイコンの地は `sdBox(p, vec2(0.3)) - 0.15` で、半分の大きさ 0.3 の四角を 0.15 太らせた、角丸の正方形です(外の大きさは 0.45)。チェックの印は、短い線分と長い線分の `min`(和)を 0.05 だけ太らせたものです。2 本の線分のつなぎ目は、どちらも端が丸いので、自然につながります。",
        en: "The icon base is `sdBox(p, vec2(0.3)) - 0.15`: a box of half-size 0.3 fattened by 0.15, which makes a rounded square with an outer half-size of 0.45. The check mark is the `min` (union) of a short segment and a long one, fattened by 0.05. Both segments have round ends, so the joint between them looks seamless.",
      },
    },

    { type: "heading", text: { ja: "部品を組み立てて絵にする", en: "Assembling parts into a picture" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの道具を全部使って、ロボットの顔を組み立てます。やっていることは、部品ごとに「距離を作る → 和や差で組み合わせる → 奥から順に塗る」のくり返しだけです。コードは長く見えますが、1 つの部品が 2〜3 行のまとまりになっています。",
        en: "Let's use every tool so far to assemble a robot face. All it does is repeat the same steps for each part: build a distance, combine with union or subtraction, and paint from back to front. The code looks long, but each part is a little group of two or three lines.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 ink = vec3(0.22, 0.24, 0.32);
          vec3 col = mix(vec3(0.98, 0.85, 0.6), vec3(0.95, 0.6, 0.5), uv.y);

          //ja: アンテナ: 線分と、点滅する先の円
          //en: antenna: a segment and a blinking ball on top
          float stick = sdSegment(p, vec2(0.0, 0.35), vec2(0.0, 0.68)) - 0.02;
          col = mix(col, ink, 1.0 - smoothstep(-px, px, stick));
          vec3 lamp = mix(vec3(0.6, 0.1, 0.1), vec3(1.0, 0.3, 0.2), 0.5 + 0.5 * sin(time * 4.0));
          col = mix(col, lamp, 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.0, 0.72), 0.07)));

          //ja: 頭: 角丸の四角と、左右の耳の和。縁取りも付ける
          //en: head: a rounded box plus two ears, with an outline
          float head = sdBox(p, vec2(0.4, 0.3)) - 0.1;
          float ears = min(sdBox(p - vec2(-0.56, 0.0), vec2(0.07, 0.14)), sdBox(p - vec2(0.56, 0.0), vec2(0.07, 0.14)));
          float body = min(head, ears);
          col = mix(col, vec3(0.75, 0.82, 0.9), 1.0 - smoothstep(-px, px, body));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, abs(body) - 0.015));

          //ja: 目: 円 2 つと、光の点
          //en: eyes: two circles with highlights
          float eyes = min(sdCircle(p - vec2(-0.2, 0.08), 0.1), sdCircle(p - vec2(0.2, 0.08), 0.1));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, eyes));
          float shine = min(sdCircle(p - vec2(-0.17, 0.11), 0.03), sdCircle(p - vec2(0.23, 0.11), 0.03));
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, shine));

          //ja: 口: 角丸の四角から細い四角 2 本を引いて、歯のすき間にする
          //en: mouth: a rounded box minus two thin boxes, leaving gaps between the teeth
          float mouth = sdBox(p - vec2(0.0, -0.2), vec2(0.19, 0.04)) - 0.03;
          float gaps = min(sdBox(p - vec2(-0.07, -0.2), vec2(0.008, 0.1)), sdBox(p - vec2(0.07, -0.2), vec2(0.008, 0.1)));
          mouth = max(mouth, -gaps);
          col = mix(col, vec3(1.0, 0.96, 0.88), 1.0 - smoothstep(-px, px, mouth));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, abs(mouth) - 0.01));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`mouth = max(mouth, -gaps);` の行の先頭に `//` を付けると、歯のすき間が消えます。頭の `sdBox(p, vec2(0.4, 0.3)) - 0.1` を `sdBox(p, vec2(0.3, 0.2)) - 0.2` にすると、外の大きさは同じまま、丸っこいロボットになります",
        en: "Put `//` in front of the `mouth = max(mouth, -gaps);` line and the gaps between the teeth disappear. Change the head's `sdBox(p, vec2(0.4, 0.3)) - 0.1` to `sdBox(p, vec2(0.3, 0.2)) - 0.2` for a rounder robot of the same overall size",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "頭と耳は和でつないでから、まとめて塗りと縁取りをしています。別々に縁取りすると、頭と耳の重なったところに線が残ってしまいますが、先に和をとっておけば、外まわりにだけ線が付きます。口も同じで、歯のすき間を差で引いてから縁取りするので、1 本 1 本の歯のまわりに線が付きます。**組み合わせてから塗る** と、部品どうしがきれいにつながります。",
        en: "The head and ears are joined with a union first, then filled and outlined together. Outline them separately and a line would remain where they overlap; take the union first and only the outer contour gets a line. The mouth works the same way: the gaps are subtracted before outlining, so each tooth gets its own outline. **Combine first, then paint**, and the parts join cleanly.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "図形を組み合わせて、絵やアイコンを作ってみましょう。迷ったら、まず距離の地図(内側がオレンジ、外側が青)で形だけを確かめてから、色を塗ると進めやすくなります。",
        en: "Combine shapes to make pictures and icons. If you get stuck, check the shape alone on the distance map first (orange inside, blue outside), then add color.",
      },
    },
    {
      type: "exercise",
      title: { ja: "額縁", en: "A picture frame" },
      prompt: {
        ja: "四角から一回り小さい四角を **差** で引いて、木の色の額縁を作ってください。額縁の内側には、夕焼けのグラデーションと太陽の絵が見えるようにします。",
        en: "Use **subtraction** to cut a slightly smaller box out of a box, making a wooden picture frame. Inside the frame, show a picture: a sunset gradient with a sun.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.85, 0.82, 0.78); //ja: 壁 //en: the wall

          //ja: 絵: 夕焼けの空と太陽
          //en: the picture: a sunset sky and sun
          vec3 sky = mix(vec3(1.0, 0.55, 0.3), vec3(0.35, 0.2, 0.5), uv.y);
          sky = mix(sky, vec3(1.0, 0.9, 0.6), 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.0, -0.1), 0.2)));
          float inner = sdBox(p, vec2(0.65, 0.45));
          col = mix(col, sky, 1.0 - smoothstep(-px, px, inner));

          float frame = sdBox(p, vec2(0.8, 0.6)); //ja: ここで、内側の四角を引く //en: subtract the inner box here
          col = mix(col, vec3(0.55, 0.35, 0.2), 1.0 - smoothstep(-px, px, frame));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.85, 0.82, 0.78);

          //ja: 額縁の影を先に塗る
          //en: paint the frame's shadow first
          float shadow = sdBox(p - vec2(0.03, -0.05), vec2(0.8, 0.6));
          col = mix(col, vec3(0.6, 0.57, 0.55), 1.0 - smoothstep(-0.06, 0.06, shadow));

          vec3 sky = mix(vec3(1.0, 0.55, 0.3), vec3(0.35, 0.2, 0.5), uv.y);
          sky = mix(sky, vec3(1.0, 0.9, 0.6), 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.0, -0.1), 0.2)));
          float inner = sdBox(p, vec2(0.65, 0.45));
          col = mix(col, sky, 1.0 - smoothstep(-px, px, inner));

          //ja: 差: 外の四角の内側で、内の四角の外側
          //en: subtraction: inside the outer box, outside the inner one
          float frame = max(sdBox(p, vec2(0.8, 0.6)), -inner);
          vec3 wood = mix(vec3(0.45, 0.28, 0.15), vec3(0.65, 0.42, 0.25), uv.y);
          col = mix(col, wood, 1.0 - smoothstep(-px, px, frame));
          //ja: 額縁の中ほどに細い飾りの線
          //en: a thin decorative line along the middle of the frame
          float trim = abs(sdBox(p, vec2(0.725, 0.525))) - 0.006;
          col = mix(col, vec3(0.85, 0.7, 0.4), 1.0 - smoothstep(-px, px, trim));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "差は `max(d1, -d2)` でした。d1 が外の四角、d2 が内の四角です",
          en: "Subtraction is `max(d1, -d2)`, with d1 the outer box and d2 the inner box",
        },
        {
          ja: "内の四角の距離は、すでに `inner` という名前で計算してあります",
          en: "The inner box's distance is already computed under the name `inner`",
        },
        {
          ja: "`float frame = max(sdBox(p, vec2(0.8, 0.6)), -inner);` です",
          en: "`float frame = max(sdBox(p, vec2(0.8, 0.6)), -inner);`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "虫めがねのアイコン", en: "A magnifier icon" },
      prompt: {
        ja: "角丸の四角の上に、白い虫めがねの印を描いてください。レンズは円の **縁取り**、持ち手は右下へ斜めにのびる太い **線分** で、2 つを和でつなぎます。",
        en: "Draw a white magnifying-glass symbol on a rounded square. The lens is an **outlined** circle, the handle is a thick **segment** running down to the right, and the two are joined with a union.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.12, 0.12, 0.16);

          float icon = sdBox(p, vec2(0.3)) - 0.15;
          vec3 base = mix(vec3(0.95, 0.4, 0.4), vec3(0.6, 0.3, 0.9), uv.y);
          col = mix(col, base, 1.0 - smoothstep(-px, px, icon));

          float d = 1.0; //ja: ここに虫めがねの距離を書く //en: write the magnifier's distance here
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.12, 0.12, 0.16);

          float icon = sdBox(p, vec2(0.3)) - 0.15;
          vec3 base = mix(vec3(0.95, 0.4, 0.4), vec3(0.6, 0.3, 0.9), uv.y);
          col = mix(col, base, 1.0 - smoothstep(-px, px, icon));

          vec2 c = vec2(-0.07, 0.07);
          //ja: レンズのガラス: うっすら明るく
          //en: the lens glass: slightly brighter
          col = mix(col, vec3(1.0), 0.2 * (1.0 - smoothstep(-px, px, sdCircle(p - c, 0.2))));

          float lens = abs(sdCircle(p - c, 0.2)) - 0.04;                      //ja: 円の縁取り //en: an outlined circle
          float handle = sdSegment(p, vec2(0.09, -0.09), vec2(0.27, -0.27)) - 0.06; //ja: 太い線分 //en: a thick segment
          float d = min(lens, handle);                                        //ja: 和 //en: union
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "レンズは `abs(sdCircle(…)) - 太さ`、持ち手は `sdSegment(…) - 太さ` です",
          en: "The lens is `abs(sdCircle(…)) - thickness`; the handle is `sdSegment(…) - thickness`",
        },
        {
          ja: "持ち手は、レンズの右下の縁あたりから始めると、自然につながります。中心が (-0.07, 0.07)、半径 0.2 のレンズなら、右下の縁は (0.07, -0.07) あたりです",
          en: "Start the handle near the lower-right edge of the lens so they connect naturally. For a lens centered at (-0.07, 0.07) with radius 0.2, that edge is around (0.07, -0.07)",
        },
        {
          ja: "`float d = min(abs(sdCircle(p - vec2(-0.07, 0.07), 0.2)) - 0.04, sdSegment(p, vec2(0.09, -0.09), vec2(0.27, -0.27)) - 0.06);`",
          en: "`float d = min(abs(sdCircle(p - vec2(-0.07, 0.07), 0.2)) - 0.04, sdSegment(p, vec2(0.09, -0.09), vec2(0.27, -0.27)) - 0.06);`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "にっこり顔", en: "A smiley face" },
      prompt: {
        ja: "黄色い顔に、目と、にっこり笑った口を描いてください。口は、円の縁取りの **下半分だけ** を残したものです。余裕があれば、ほおに赤みを足しましょう。",
        en: "Give the yellow face two eyes and a smiling mouth. The mouth is an outlined circle with **only its lower part** kept. If you have time, add some blush to the cheeks.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 ink = vec3(0.3, 0.2, 0.1);
          vec3 col = mix(vec3(0.6, 0.85, 0.95), vec3(0.85, 0.95, 1.0), uv.y);

          float face = sdCircle(p, 0.6);
          col = mix(col, vec3(1.0, 0.85, 0.3), 1.0 - smoothstep(-px, px, face));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, abs(face) - 0.015));

          float eyes = 1.0;  //ja: ここに 2 つの目 //en: two eyes go here
          float mouth = 1.0; //ja: ここに口 //en: the mouth goes here
          col = mix(col, ink, 1.0 - smoothstep(-px, px, min(eyes, mouth)));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 ink = vec3(0.3, 0.2, 0.1);
          vec3 col = mix(vec3(0.6, 0.85, 0.95), vec3(0.85, 0.95, 1.0), uv.y);

          float face = sdCircle(p, 0.6);
          col = mix(col, vec3(1.0, 0.85, 0.3), 1.0 - smoothstep(-px, px, face));

          //ja: ほお: ぼかした赤い円
          //en: cheeks: blurred red circles
          float cheeks = min(sdCircle(p - vec2(-0.4, -0.1), 0.09), sdCircle(p - vec2(0.4, -0.1), 0.09));
          col = mix(col, vec3(1.0, 0.5, 0.4), 0.6 * (1.0 - smoothstep(-0.06, 0.06, cheeks)));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, abs(face) - 0.015));

          float eyes = min(sdCircle(p - vec2(-0.2, 0.15), 0.07), sdCircle(p - vec2(0.2, 0.15), 0.07));
          //ja: 口: 円の縁取りのうち、y が -0.05 より下だけを残す(積)
          //en: mouth: keep the part of an outlined circle below y = -0.05 (intersection)
          float ring = abs(sdCircle(p - vec2(0.0, 0.05), 0.35)) - 0.03;
          float mouth = max(ring, p.y + 0.05);
          col = mix(col, ink, 1.0 - smoothstep(-px, px, min(eyes, mouth)));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "目は円 2 つの `min`(和)です",
          en: "The eyes are the `min` (union) of two circles",
        },
        {
          ja: "口は 2 段階です。まず `abs(sdCircle(…)) - 太さ` で輪を作り、次に水平な線より下だけを積で残します。`p.y + 0.05` は、y = -0.05 の線より下で負になる距離です",
          en: "The mouth takes two steps. First make a ring with `abs(sdCircle(…)) - thickness`, then keep only the part below a horizontal line with an intersection. `p.y + 0.05` is a distance that is negative below the line y = -0.05",
        },
        {
          ja: "`float mouth = max(abs(sdCircle(p - vec2(0.0, 0.05), 0.35)) - 0.03, p.y + 0.05);`",
          en: "`float mouth = max(abs(sdCircle(p - vec2(0.0, 0.05), 0.35)) - 0.03, p.y + 0.05);`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "図形を「境目までの距離、内側は負」の 1 つの数で表すと、塗り方はいつも `1.0 - smoothstep(-px, px, d)`",
          en: "Describe a shape as one number — the distance to its edge, negative inside — and you always fill it with `1.0 - smoothstep(-px, px, d)`",
        },
        {
          ja: "`sdBox(p, b)` の `b` は半分の大きさ。`sdBox(p, b - r) - r` で角丸",
          en: "In `sdBox(p, b)`, `b` is half the size; `sdBox(p, b - r) - r` rounds the corners",
        },
        {
          ja: "`sdSegment(p, a, b) - w` で、両端の丸い太さ `2 * w` の線",
          en: "`sdSegment(p, a, b) - w` draws a line `2 * w` thick with round ends",
        },
        {
          ja: "和は `min(d1, d2)`、積は `max(d1, d2)`、差は `max(d1, -d2)`",
          en: "Union is `min(d1, d2)`, intersection is `max(d1, d2)`, subtraction is `max(d1, -d2)`",
        },
        {
          ja: "`abs(d) - w` で縁取り。組み合わせてから縁取ると、外まわりにだけ線が付く",
          en: "`abs(d) - w` makes an outline; combine first, then outline, to get a line only around the outside",
        },
        {
          ja: "`mix` は後に書いたものが上。影は先に、ずらしてぼかして塗る",
          en: "With `mix`, later layers go on top; paint shadows first, shifted and blurred",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "ここまでは、図形の位置を `p - vec2(…)` で決めてきました。次の回では、この「座標から引く」という操作を広げて、図形を回したり、大きくしたり、時間で動かしたりする方法を学びます。",
        en: "So far we've placed shapes with `p - vec2(…)`. Next time we extend this idea of transforming the coordinates to rotate shapes, scale them and animate them over time.",
      },
    },
  ],
};

export default lesson;
