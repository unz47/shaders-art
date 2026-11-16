import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "sdf-2d",
  title: { ja: "距離で描く(2D SDF)", en: "Drawing with distance (2D SDF)" },
  summary: {
    ja: "符号付き距離関数で図形を描き、なめらかな結合・縁取り・影を作る",
    en: "Draw with signed distance functions: smooth unions, outlines and shadows",
  },
  minutes: 55,
  goals: [
    {
      ja: "符号付き距離(外は正、中は負、縁で 0)の意味がわかり、等高線で見える化できる",
      en: "Understand signed distance (positive outside, negative inside, zero on the edge) and visualize it with contour lines",
    },
    {
      ja: "`sdBox` と `sdSegment` のしくみを説明でき、角丸・縁取り・和・積・差がなぜそうなるか、どこまで正確かを等高線で確かめられる",
      en: "Explain how `sdBox` and `sdSegment` work, and use contours to see why rounding, outlines, union, intersection and subtraction work — and how exact they are",
    },
    {
      ja: "和・積・差に加えて、`smin` で図形をなめらかにつなぎ、メタボールを作れる",
      en: "Combine shapes with union, intersection and subtraction, merge them smoothly with `smin`, and build metaballs",
    },
    {
      ja: "1 つの距離から、1 ピクセルのなめらかな縁・輪郭線・影・グローを作り分けられる",
      en: "Get a smooth one-pixel edge, an outline, a shadow and a glow, all from one distance",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "符号付き距離とは", en: "What signed distance means" } },
    {
      type: "paragraph",
      text: {
        ja: "[円と距離](/learn/circles-and-distance) では、`sdCircle` を「内側がマイナスになる距離」として使い、`1.0 - smoothstep(-px, px, d)` で **マスク**(図形の内側で 1、外側で 0 の数)を作りました。[図形を組み合わせる](/learn/combining-shapes) では `sdBox` と `sdSegment` が加わり、角丸・縁取り・和・積・差も作りました。この回では、その土台にある「符号付き距離」をきちんと定義し直し、距離が正しいかを目で確かめる方法、図形のなめらかなつなぎ方、距離から作る影や光へと進みます。3D の回でも、まったく同じ考え方を使います。",
        en: "In [Circles and distance](/learn/circles-and-distance) we used `sdCircle` as a distance that goes negative inside, and built a **mask** (a number that is 1 inside a shape and 0 outside) with `1.0 - smoothstep(-px, px, d)`. [Combining shapes](/learn/combining-shapes) added `sdBox` and `sdSegment`, along with rounding, outlines, union, intersection and subtraction. This lesson pins down the idea underneath all of that — signed distance — and then moves on: a way to check by eye whether a distance is right, smooth ways to join shapes, and shadows and light made from distance. The 3D lessons later use exactly the same idea.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "あらためて定義しておきます。**符号付き距離関数**(Signed Distance Function、略して **SDF**)は、どの場所 `p` についても「図形の縁まで、いちばん近くてどれだけ離れているか」を返す関数です。ただし、図形の **外なら正、中なら負** の数で返します。縁の上はちょうど 0 です。",
        en: "Let's define it properly. A **signed distance function** (**SDF**) takes any point `p` and returns how far it is from the nearest edge of a shape. The twist is the sign: the number is **positive outside and negative inside**. Right on the edge it is exactly 0.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`sdCircle(p, 0.5)` で `p` が `(1.0, 0.0)` のとき … `1.0 - 0.5 = 0.5`。外にいて、縁まで 0.5",
          en: "`sdCircle(p, 0.5)` at `p = (1.0, 0.0)` … `1.0 - 0.5 = 0.5`: outside, 0.5 from the edge",
        },
        {
          ja: "`p` が `(0.5, 0.0)` のとき … `0.0`。ちょうど縁の上",
          en: "At `p = (0.5, 0.0)` … `0.0`: right on the edge",
        },
        {
          ja: "`p` が `(0.2, 0.0)` のとき … `-0.3`。中にいて、縁まで 0.3",
          en: "At `p = (0.2, 0.0)` … `-0.3`: inside, 0.3 from the edge",
        },
        {
          ja: "`p` が中心 `(0.0, 0.0)` のとき … `-0.5`。いちばん深いところ",
          en: "At the center `(0.0, 0.0)` … `-0.5`: the deepest point",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "符号があると、1 つの数で 2 つのことがわかります。符号を見れば **中か外か**、大きさを見れば **縁からどれだけ離れているか** です。中か外かでマスク(塗り)が、縁からの距離で縁取り・影・光のにじみが作れます。下の playground では、外をオレンジ、中を青にして、縁に近いほど暗くしています。",
        en: "The sign means one number tells you two things: the sign says **inside or outside**, and the size says **how far from the edge**. Inside-or-outside gives you the mask (the fill); distance from the edge gives you outlines, shadows and glows. In the playground below, outside is orange, inside is blue, and both get darker near the edge.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float d = sdCircle(p, 0.5);
          //ja: 外(d > 0)はオレンジ、中(d < 0)は青
          //en: outside (d > 0) is orange, inside (d < 0) is blue
          vec3 col = d > 0.0 ? vec3(0.95, 0.6, 0.3) : vec3(0.35, 0.65, 0.95);
          col *= 1.0 - exp(-5.0 * abs(d)); //ja: 縁に近いほど暗く //en: darker near the edge
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`d > 0.0` を `d > 0.2` にすると、色の境目が「縁から 0.2 外」に移ります。`-5.0` を `-20.0` にすると、暗いところが縁のまわりだけになります",
        en: "Change `d > 0.0` to `d > 0.2` and the color boundary moves to 0.2 outside the edge. Change `-5.0` to `-20.0` to keep the darkness close to the edge",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`exp(-5.0 * abs(d))` は、縁(`d` が 0)で 1、離れるほど 0 に近づく数です。`1.0 -` で反転しているので、縁で黒く、離れるほど明るくなります。たとえば縁から 0.1 のところでは `1.0 - exp(-0.5)` で約 0.39、0.5 離れると約 0.92 です。",
        en: "`exp(-5.0 * abs(d))` is 1 on the edge (where `d` is 0) and fades toward 0 as you move away. The `1.0 -` flips it, so the edge is black and it brightens with distance. At 0.1 from the edge you get `1.0 - exp(-0.5)`, about 0.39; at 0.5 away, about 0.92.",
      },
    },

    { type: "heading", text: { ja: "等高線で距離を見る", en: "Seeing distance with contour lines" } },
    {
      type: "paragraph",
      text: {
        ja: "距離の値をもっとよく見るために、地図の等高線のような線を足します。`cos(120.0 * d)` は `d` が 2π ÷ 120、つまり約 0.052 増えるごとに 1 周するので、距離 0.052 ごとに明るい線と暗い線がくり返します。縁(`d` が 0)には白い線を引きます。",
        en: "To read the distance more clearly, let's add lines like the contour lines on a map. `cos(120.0 * d)` completes one cycle every time `d` grows by 2π ÷ 120, about 0.052, so light and dark lines repeat every 0.052 units of distance. On the edge itself (`d` = 0) we draw a white line.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec3 distanceColor(float d) {
          vec3 col = d > 0.0 ? vec3(0.95, 0.6, 0.3) : vec3(0.35, 0.65, 0.95);
          col *= 1.0 - exp(-5.0 * abs(d));
          col *= 0.8 + 0.2 * cos(120.0 * d); //ja: 等高線 //en: contour lines
          return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.012, abs(d))); //ja: 縁の白い線 //en: white line on the edge
        }

        vec4 render(vec2 uv, vec2 p) {
          float d = sdCircle(p - vec2(0.3 * sin(time), 0.0), 0.5);
          return vec4(distanceColor(d), 1.0);
        }
      `,
      caption: {
        ja: "`120.0` を `40.0` にすると線の間が広がります。`sdCircle(…, 0.5)` を `abs(p.y) - 0.3`(横の帯)に置きかえると、等高線はどんな形になるでしょう?",
        en: "Change `120.0` to `40.0` to spread the lines out. What do the contours look like if you replace `sdCircle(…, 0.5)` with `abs(p.y) - 0.3` (a horizontal band)?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "等高線が **どこでも同じ間隔** で、図形の縁と平行に並んでいるのがわかります。池に石を投げたときの波紋のようです。これは、関数が本当の距離を返している証拠です。逆に言うと、等高線の間隔がつまったり広がったりしているところでは、その関数は正確な距離を返していません。この回の後半で、その例も見ます。",
        en: "Notice that the contour lines are **evenly spaced everywhere** and run parallel to the edge, like ripples around a stone dropped in a pond. That is the sign of a function returning a true distance. Turn it around: wherever the lines bunch up or spread apart, the function is not returning an exact distance. We will see examples later in this lesson.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "この見せ方は、自分で作った距離関数が正しく動いているかを確かめるのに便利です。`distanceColor` は、この回の多くの playground で使います。",
        en: "This view is handy for checking whether a distance function you wrote behaves correctly. We use `distanceColor` in many playgrounds in this lesson.",
      },
    },

    { type: "heading", text: { ja: "四角と線分のしくみ", en: "How the box and segment work" } },
    {
      type: "paragraph",
      text: {
        ja: "円の距離は `length(p) - r` で簡単でした。四角の距離 `sdBox` は少し複雑です。1 行ずつ読んでいきましょう。`b` は四角の **半分** の幅と高さです。",
        en: "The circle's distance, `length(p) - r`, was simple. The box's, `sdBox`, takes a bit more. Let's read it line by line. `b` is **half** the width and height of the box.",
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
      type: "list",
      items: [
        {
          ja: "`abs(p)` … 四角は上下左右に対称なので、左や下にいる点を右上に折りたたみます。これで右上の角 1 つだけを考えれば済みます",
          en: "`abs(p)` … the box is symmetric, so this folds points on the left or bottom into the upper right. Now we only have to think about one corner",
        },
        {
          ja: "`d = abs(p) - b` … 右の辺・上の辺から、それぞれどれだけはみ出しているか。`d.x` が正なら右の辺より外、負なら内側です",
          en: "`d = abs(p) - b` … how far past the right edge and the top edge we are. A positive `d.x` means outside the right edge; negative means inside",
        },
        {
          ja: "`length(max(d, 0.0))` … 外側の距離。負の成分を 0 にしてから長さを測ります。右にだけはみ出していれば `d.x`、上にだけなら `d.y`、斜めなら角までの距離になり、3 つの場合を 1 つの式でまかなえます",
          en: "`length(max(d, 0.0))` … the outside distance. Zero out the negative parts, then measure the length. Past only the right edge it gives `d.x`, past only the top it gives `d.y`, and diagonally out it gives the distance to the corner — three cases in one expression",
        },
        {
          ja: "`min(max(d.x, d.y), 0.0)` … 内側の距離。中にいるとき `d.x` も `d.y` も負で、0 に近いほう(`max`)が近い辺です。外にいるときは `min(…, 0.0)` で 0 になり、じゃまをしません",
          en: "`min(max(d.x, d.y), 0.0)` … the inside distance. Inside, both `d.x` and `d.y` are negative, and the one closer to 0 (`max`) belongs to the nearest edge. Outside, `min(…, 0.0)` makes it 0 so it stays out of the way",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめます。`b = (0.6, 0.3)` のとき、`p = (1.0, 0.0)` なら `d = (0.4, -0.3)` で、外側の距離は 0.4。`p = (0.9, 0.7)` なら `d = (0.3, 0.4)` で、角までの距離は `length` で 0.5。`p = (0.2, 0.1)` なら `d = (-0.4, -0.2)` で、内側の距離は -0.2(上の辺まで 0.2)です。",
        en: "Let's check with numbers, using `b = (0.6, 0.3)`. At `p = (1.0, 0.0)`, `d = (0.4, -0.3)` and the outside distance is 0.4. At `p = (0.9, 0.7)`, `d = (0.3, 0.4)`, and the distance to the corner is `length` = 0.5. At `p = (0.2, 0.1)`, `d = (-0.4, -0.2)`, giving -0.2 inside (0.2 from the top edge).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の playground では、カーソルの位置(`mouse`)を中心に、その場所の距離 `|d|` を半径にした黄色い円を描いています。`mouse` はカーソルの位置で、`p` と同じ座標です(くわしくは [触って動く](/learn/mouse-and-attention) で扱います。カーソルを乗せる前は `(0, 0)` です)。円がいつも四角の縁に **ちょうど 1 点で触れる** ことを確かめてください。それが「いちばん近い縁までの距離」という意味です。",
        en: "In the playground below, a yellow circle is drawn around the cursor position (`mouse`), with the distance `|d|` at that spot as its radius. `mouse` is the cursor position in the same coordinates as `p` (more in [Touch and response](/learn/mouse-and-attention); before you hover, it is `(0, 0)`). Check that the circle always **just touches the box's edge at one point**. That is what \"distance to the nearest edge\" means.",
      },
    },
    {
      type: "playground",
      source: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec3 distanceColor(float d) {
          vec3 col = d > 0.0 ? vec3(0.95, 0.6, 0.3) : vec3(0.35, 0.65, 0.95);
          col *= 1.0 - exp(-5.0 * abs(d));
          col *= 0.8 + 0.2 * cos(120.0 * d);
          return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.012, abs(d)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 b = vec2(0.6, 0.3);
          vec3 col = distanceColor(sdBox(p, b));

          //ja: カーソルの場所の距離を半径にした円
          //en: a circle around the cursor whose radius is the distance there
          float dm = sdBox(mouse, b);
          float ring = abs(length(p - mouse) - abs(dm));
          col = mix(col, vec3(1.0, 0.9, 0.2), 1.0 - smoothstep(0.004, 0.012, ring));
          col = mix(col, vec3(1.0, 0.9, 0.2), 1.0 - smoothstep(0.015, 0.025, length(p - mouse)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "カーソルを四角の角の外側に持っていくと、円は角の点に触れます。`vec2(0.6, 0.3)` を `vec2(0.3)` にすると正方形になります",
        en: "Move the cursor diagonally out past a corner: the circle touches the corner point. Change `vec2(0.6, 0.3)` to `vec2(0.3)` for a square",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "等高線の形にも注目してください。外側の線は角のところで丸くなっています(角までの距離を測っているからです)。内側の線は、角から中心へ向かう斜めの折れ目でかくっと曲がっています。この「外側は丸い」ことが、次の角丸の秘密です。",
        en: "Look at the contour shapes too. Outside, the lines round off at the corners (because there we measure the distance to the corner point). Inside, they bend sharply along diagonal creases running from the corners toward the center. That \"rounded outside\" is the secret behind rounded corners, coming up next.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "線分の距離 `sdSegment(p, a, b)` は、`a` から `b` への線の上で `p` にいちばん近い点を探し、そこまでの長さを測ります。`h` は線の上での位置で、`a` で 0、`b` で 1 です。`dot(pa, ba) / dot(ba, ba)` で `p` を線に投影し、`clamp` で 0〜1 に収めて線からはみ出さないようにしています。線分には太さが無いので「中」がありませんが、`- r` で太さを与えると、中のある **カプセル** 形になります。",
        en: "The segment distance `sdSegment(p, a, b)` finds the point on the line from `a` to `b` closest to `p` and measures the length to it. `h` is the position along the line: 0 at `a`, 1 at `b`. `dot(pa, ba) / dot(ba, ba)` projects `p` onto the line, and `clamp` keeps it within 0–1 so it never runs past the ends. A segment has no thickness and so no inside, but subtracting `r` gives it thickness, turning it into a **capsule** with a proper inside.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); //ja: 線の上の位置 0〜1 //en: position along the line, 0–1
          return length(pa - ba * h);
        }

        vec3 distanceColor(float d) {
          vec3 col = d > 0.0 ? vec3(0.95, 0.6, 0.3) : vec3(0.35, 0.65, 0.95);
          col *= 1.0 - exp(-5.0 * abs(d));
          col *= 0.8 + 0.2 * cos(120.0 * d);
          return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.012, abs(d)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 a = vec2(-0.6, -0.2);
          vec2 b = vec2(0.5 * cos(time), 0.5 * sin(time));
          float d = sdSegment(p, a, b) - 0.15; //ja: 太さ 0.15 のカプセル //en: a capsule of radius 0.15
          return vec4(distanceColor(d), 1.0);
        }
      `,
      caption: {
        ja: "`- 0.15` を消すと、太さの無い線分の距離が見えます(どこも正なので全部オレンジ)。`- 0.15` を `- 0.3` にすると太くなります",
        en: "Remove `- 0.15` to see the plain segment distance (positive everywhere, so all orange). Change it to `- 0.3` for a fatter capsule",
      },
    },

    { type: "heading", text: { ja: "おさらい: 丸め・縁取り・和・積・差", en: "Review: rounding, outlines and combining" } },
    {
      type: "paragraph",
      text: {
        ja: "[図形を組み合わせる](/learn/combining-shapes) で作った角丸 `sdBox(p, b - r) - r`、縁取り `abs(d) - w`、和 `min`・積 `max`・差 `max(a, -b)` を、等高線で見直します。式は同じですが、等高線で見ると「なぜそうなるか」と「どこまで正確か」がわかります。",
        en: "Let's revisit what we built in [Combining shapes](/learn/combining-shapes) — the rounded box `sdBox(p, b - r) - r`, the outline `abs(d) - w`, and union `min`, intersection `max` and subtraction `max(a, -b)` — through contour lines. The formulas are the same, but contours show why they work and how exact they are.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`d - r` が 0 になるのは、もとの縁から `r` だけ外の等高線の上です。さっき見たとおり、四角の外側の等高線は角が丸いので、押し広げた形も角が丸くなります。これが角丸のしくみです。`abs(d)` は中も外も「縁の線までの距離」にするので、`abs(d) - w` は縁を中心にした太さ `2w` の帯になります。どちらも結果がまた距離なので、等高線はきれいなままです。",
        en: "`d - r` is 0 on the contour line `r` outside the old edge. As we just saw, the box's outside contours have rounded corners, so the pushed-out shape does too — that's why rounding works. `abs(d)` turns both sides into the distance to the edge line, so `abs(d) - w` is a band of thickness `2w` centered on the edge. Both results are still distances, so their contours stay clean.",
      },
    },
    {
      type: "playground",
      source: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec3 distanceColor(float d) {
          vec3 col = d > 0.0 ? vec3(0.95, 0.6, 0.3) : vec3(0.35, 0.65, 0.95);
          col *= 1.0 - exp(-5.0 * abs(d));
          col *= 0.8 + 0.2 * cos(120.0 * d);
          return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.012, abs(d)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = 0.15 + 0.12 * sin(time); //ja: 角の丸み //en: corner radius
          float d = sdBox(p, vec2(0.6, 0.3) - r) - r;
          // d = abs(d) - 0.05;
          // d = abs(abs(d) - 0.12) - 0.03;
          return vec4(distanceColor(d), 1.0);
        }
      `,
      caption: {
        ja: "`// d = abs(d) - 0.05;` の `//` を消すと、中を抜いた枠になります。その次の行も試すと二重の枠に。`vec2(0.6, 0.3) - r` を `vec2(0.6, 0.3)` にすると、丸めるたびに大きくなるのがわかります",
        en: "Remove the `//` from `// d = abs(d) - 0.05;` to hollow it into a frame; try the next line too for a double frame. Change `vec2(0.6, 0.3) - r` to `vec2(0.6, 0.3)` to see the box grow as it rounds",
      },
    },

    {
      type: "paragraph",
      text: {
        ja: "和・積・差は、符号の意味から説明できます。`min(a, b)` は「どちらかの中なら負」、`max(a, b)` は「両方の中なら負」です。`-b` は `b` の中と外を入れかえるので、`max(a, -b)` は「`a` の中で、`b` の外」、つまり `a` から `b` をくり抜いた形です。",
        en: "The sign explains union, intersection and subtraction. `min(a, b)` is negative when inside either shape; `max(a, b)` only when inside both. `-b` swaps the inside and outside of `b`, so `max(a, -b)` means \"inside `a` and outside `b`\": `b` cut out of `a`.",
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

        vec3 distanceColor(float d) {
          vec3 col = d > 0.0 ? vec3(0.95, 0.6, 0.3) : vec3(0.35, 0.65, 0.95);
          col *= 1.0 - exp(-5.0 * abs(d));
          col *= 0.8 + 0.2 * cos(120.0 * d);
          return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.012, abs(d)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = sdCircle(p - vec2(-0.25, 0.0), 0.45);
          float b = sdBox(p - vec2(0.25 + 0.2 * sin(time), 0.0), vec2(0.4, 0.3));
          float d = min(a, b);    //ja: 和 //en: union
          // d = max(a, b);       //ja: 積 //en: intersection
          // d = max(a, -b);      //ja: 差(円 - 四角) //en: subtraction (circle minus box)
          // d = max(-a, b);      //ja: 差(四角 - 円) //en: subtraction (box minus circle)
          return vec4(distanceColor(d), 1.0);
        }
      `,
      caption: {
        ja: "`//` を 1 行ずつ外して、和・積・差を見比べましょう。等高線がかくっと折れたり、間隔がそろわなくなったりする場所を探してみてください",
        en: "Uncomment one line at a time to compare union, intersection and subtraction. Look for places where the contours kink or stop being evenly spaced",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "縁の位置(白い線)はどれも正しいのですが、等高線をよく見ると、和では図形の **中**、積と差では図形の **外** で、線が折れて間隔が乱れているところがあります。そこでは値が本当の距離にならず、**本当の距離以下の小さめの値** になっています。塗りや細い縁取りには問題ありません。太い縁取りやグローでは形が少しゆがむことがあるので、気になったら等高線で確かめましょう。なお「小さめ」で済んでいることが、3D の [レイマーチング](/learn/raymarching) では大事になります。",
        en: "The edge (the white line) is right every time, but look closely at the contours: for the union they kink and go uneven **inside** the shape, and for intersection and subtraction **outside**. There the value is not the true distance but **something smaller than or equal to it**. That is fine for fills and thin outlines. Thick outlines or glows can come out slightly distorted, so check with contours if something looks off. The fact that the error only ever makes the value smaller turns out to matter a lot for [Raymarching](/learn/raymarching) in 3D.",
      },
    },

    { type: "heading", text: { ja: "なめらかにつなぐ smin", en: "Joining smoothly with smin" } },
    {
      type: "paragraph",
      text: {
        ja: "`min` でつなぐと、2 つの図形の継ぎ目に鋭い谷ができます。粘土や水滴のように、継ぎ目をなめらかに埋めたいときに使うのが **smin**(なめらかな min)です。3D でもまったく同じ関数を使います。",
        en: "Joining with `min` leaves a sharp valley where two shapes meet. When you want the seam filled in smoothly, like clay or droplets, use **smin**, the smooth minimum. We use exactly the same function in 3D.",
      },
    },
    {
      type: "code",
      source: `
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`k` は、なめらかにする幅です。2 つの距離の差が `k` 以上あるところでは、ふつうの `min` と同じになります",
          en: "`k` is the width of the blend. Wherever the two distances differ by `k` or more, the result is just `min`",
        },
        {
          ja: "`h` は「`a` をどれだけ使うか」で 0〜1。`a` が `k` 以上小さければ 1(`a` だけ)、`b` が `k` 以上小さければ 0(`b` だけ)、等しければ 0.5 です",
          en: "`h` says how much of `a` to use, from 0 to 1: 1 (all `a`) if `a` is smaller by `k` or more, 0 (all `b`) if `b` is, and 0.5 if they are equal",
        },
        {
          ja: "`- k * h * (1.0 - h)` で、継ぎ目の値を少しだけ小さくします。値が小さくなる(中に近づく)ので、図形どうしのすき間が埋まります。いちばん大きく引くのは `h` が 0.5 のときで、`k * 0.25` です",
          en: "`- k * h * (1.0 - h)` lowers the value around the seam a little. Lower means closer to inside, so the gap between the shapes fills in. The largest dip is at `h` = 0.5: `k * 0.25`",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "数で見ると、`a = b = 0.1`、`k = 0.2` のとき、`h` は 0.5 で、結果は `0.1 - 0.2 × 0.25 = 0.05` です。どちらの図形からも 0.1 離れたすき間の場所が、0.05 まで「図形に近い」ことになり、少しふくらんでつながります。",
        en: "In numbers: with `a = b = 0.1` and `k = 0.2`, `h` is 0.5 and the result is `0.1 - 0.2 × 0.25 = 0.05`. A spot in the gap, 0.1 from both shapes, now counts as only 0.05 away, so the shapes swell slightly and join.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        vec3 distanceColor(float d) {
          vec3 col = d > 0.0 ? vec3(0.95, 0.6, 0.3) : vec3(0.35, 0.65, 0.95);
          col *= 1.0 - exp(-5.0 * abs(d));
          col *= 0.8 + 0.2 * cos(120.0 * d);
          return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.012, abs(d)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float x = 0.45 + 0.3 * cos(time);
          float a = sdCircle(p - vec2(-x, 0.0), 0.3);
          float b = sdCircle(p - vec2(x, 0.1), 0.25);
          float d = smin(a, b, 0.25);
          // d = min(a, b);
          return vec4(distanceColor(d), 1.0);
        }
      `,
      caption: {
        ja: "`0.25`(`k`)を `0.5` にすると、離れていても糸を引くようにつながります。`// d = min(a, b);` を有効にして比べてみましょう",
        en: "Raise `k` (`0.25`) to `0.5` and the circles reach for each other even from afar. Enable `// d = min(a, b);` to compare",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`k` を `0.0` にすると、`(b - a) / k` が 0 での割り算になり、結果がおかしくなります。継ぎ目を鋭くしたいときは、`k` を小さな数(`0.001` など)にするか、`min` に戻しましょう。",
        en: "Setting `k` to `0.0` makes `(b - a) / k` a division by zero, and the result breaks. For a sharp seam, use a tiny `k` such as `0.001`, or go back to `min`.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`-smin(-a, -b, k)` は、なめらかな `max`(積)になります。なめらかな差は `-smin(-a, b, k)` です。中と外を入れかえてから `smin` を使い、もう一度入れかえているのです。",
        en: "`-smin(-a, -b, k)` gives a smooth `max` (intersection), and `-smin(-a, b, k)` a smooth subtraction. They swap inside and outside, apply `smin`, and swap back.",
      },
    },

    { type: "heading", text: { ja: "メタボール", en: "Metaballs" } },
    {
      type: "paragraph",
      text: {
        ja: "`smin` で円をいくつもつなぐと、くっついたり離れたりする水銀の玉や、溶岩ランプのような **メタボール** ができます。ループで円を 1 つずつ足し、そのたびに `smin` でつないでいきます。最初の `d = 8.0` は「どの図形からもうんと遠い」という意味の大きな数で、1 つ目の円と `smin` すると、その円の距離がそのまま残ります。",
        en: "Join many circles with `smin` and you get **metaballs**: blobs that merge and split like beads of mercury or a lava lamp. A loop adds one circle at a time, joining each with `smin`. The starting `d = 8.0` is a big number meaning \"far from everything\"; `smin` with the first circle simply leaves that circle's distance.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ここからは、距離を見える化するのではなく、作品として色を付けます。中は `d` を使ったグラデーションで、外には縁から広がる光を少し足します。塗りは [円と距離](/learn/circles-and-distance) と同じマスク `1.0 - smoothstep(-px, px, d)` です。",
        en: "From here on, instead of visualizing the distance, we color it as artwork. Inside gets a gradient based on `d`, and outside gets a little light spreading from the edge. The fill uses the same mask as in [Circles and distance](/learn/circles-and-distance): `1.0 - smoothstep(-px, px, d)`.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float d = 8.0;
          for (int i = 0; i < 7; i++) {
            float fi = float(i);
            //ja: 玉ごとに違う速さと位相で動かす
            //en: each ball moves with its own speed and phase
            vec2 c = vec2(0.75 * sin(time * (0.3 + 0.07 * fi) + fi * 2.1),
                          0.45 * cos(time * (0.4 + 0.05 * fi) + fi * 1.3));
            float r = 0.18 + 0.05 * sin(fi * 1.7);
            d = smin(d, sdCircle(p - c, r), 0.35);
          }

          vec3 col = mix(vec3(0.06, 0.02, 0.12), vec3(0.15, 0.05, 0.2), uv.y); //ja: 背景 //en: background
          col += vec3(1.0, 0.35, 0.5) * 0.35 * exp(-10.0 * max(d, 0.0));        //ja: 外の光 //en: outer glow
          vec3 inner = mix(vec3(1.0, 0.75, 0.3), vec3(1.0, 0.2, 0.4), clamp(-d * 5.0, 0.0, 1.0));
          col = mix(col, inner, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`smin(…, 0.35)` の `0.35` を `0.05` にすると、玉がほとんどくっつかなくなります。`i < 7` を `i < 12` にすると玉が増えます",
        en: "Change the `0.35` in `smin(…, 0.35)` to `0.05` and the balls barely merge. Change `i < 7` to `i < 12` for more balls",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "中のグラデーションは `clamp(-d * 5.0, 0.0, 1.0)` で、縁で 0、縁から 0.2 内側で 1 になる数です。玉がくっつくと、その部分も縁から遠くなるので色が深くなり、一体になったように見えます。",
        en: "The inner gradient uses `clamp(-d * 5.0, 0.0, 1.0)`, which is 0 on the edge and 1 at 0.2 inside it. When balls merge, the joined area is farther from the edge too, so the color deepens there and they read as one body.",
      },
    },

    { type: "heading", text: { ja: "くり返しと組み合わせる", en: "Repeating shapes" } },
    {
      type: "paragraph",
      text: {
        ja: "[くり返しとタイル](/learn/repetition) のマス目と組み合わせると、1 つの距離関数で画面いっぱいの模様が作れます。`fract(g) - 0.5` でマスの中心を原点にして、その中で図形の距離を測ります。",
        en: "Combine distance with the grid from [Repetition and tiles](/learn/repetition), and a single distance function fills the screen with a pattern. `fract(g) - 0.5` puts the origin at the middle of each cell, and we measure the shape's distance in there.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "1 つ気をつけることがあります。`g = p * 5.0` のようにマスの座標は 5 倍に拡大されているので、その中で測った距離も 5 倍の大きさになっています。[座標を動かす](/learn/transforms) の拡大縮小と同じで、**最後に 5.0 で割って `p` の単位に戻します**。こうしておけば、`px` を使った縁やグローの幅が、くり返しの細かさに関係なく正しくなります。",
        en: "One thing to watch: with `g = p * 5.0`, the cell coordinates are scaled up 5×, so any distance measured inside them is 5× too large. Just like scaling in [Moving space](/learn/transforms), **divide by 5.0 at the end to get back to `p` units**. Then edges and glows built with `px` keep the right width however fine the repetition is.",
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
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float n = 5.0;
          vec2 g = p * n;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5; //ja: マスの中心が原点 //en: origin at the middle of the cell

          //ja: 中心からの波で、マスごとに大きさと角度を変える
          //en: a wave from the center sets each cell's size and angle
          float w = 0.5 + 0.5 * sin(length(id + 0.5) * 1.2 - time * 2.0);
          q = rot(-w * TAU * 0.25) * q; //ja: 図形を w × 90° 回す //en: turn the shape by w × 90°
          float s = 0.08 + 0.17 * w;
          float d = sdBox(q, vec2(s - 0.06)) - 0.06;
          d /= n; //ja: マスの単位から p の単位へ戻す //en: back from cell units to p units

          vec3 tint = mix(vec3(0.25, 0.35, 1.0), vec3(1.0, 0.45, 0.35), w); //ja: 小さいと青、大きいと赤 //en: blue when small, red when large
          vec3 col = vec3(0.03, 0.03, 0.06);
          col += tint * 0.25 * exp(-40.0 * max(d, 0.0));
          col = mix(col, tint, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`d /= n;` を消すと、縁がギザギザになり、光も小さくなります(距離が 5 倍のままだから)。`float n = 5.0;` を `8.0` にしても、縁の鋭さは変わりません",
        en: "Delete `d /= n;` and the edges turn jagged while the glow shrinks (the distance stays 5× too big). Set `n` to `8.0` and the edges stay just as crisp",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "マスの中の図形は、マスからはみ出さない大きさにしておきます。それぞれのマスは自分の図形しか知らないので、はみ出した部分は、となりのマスの中では描かれず、まっすぐ切れて見えます。[セルの模様](/learn/voronoi) で点をマスの中に収めたのと同じ理由です。どうしてもはみ出させたいときは、その回の 3x3 の探索と同じように、となりのマスの図形も調べて距離の `min` を取ります。",
        en: "Keep each shape small enough to stay inside its cell. A cell only knows about its own shape, so anything that sticks out is not drawn in the neighboring cell and gets cut off in a straight line. It's the same reason we kept the points inside their cells in [Cellular patterns](/learn/voronoi). If a shape must stick out, check the neighboring cells too, as in that lesson's 3×3 search, and take the `min` of their distances.",
      },
    },

    { type: "heading", text: { ja: "1 つの距離から塗り・縁・影・光", en: "Fill, outline, shadow and glow from one distance" } },
    {
      type: "paragraph",
      text: {
        ja: "距離で描くいちばんの良さは、**1 つの距離から、いろいろな効果が作れる** ことです。図形を `float scene(vec2 p)` という関数にまとめておけば、次のものが全部その距離から作れます。",
        en: "The best thing about drawing with distance is that **one distance gives you many effects**. Put your shape in a function such as `float scene(vec2 p)`, and all of these come from it:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "塗り … おなじみのマスク `1.0 - smoothstep(-px, px, d)`。縁の前後 1 ピクセルずつでなめらかに切りかわる",
          en: "Fill … the familiar mask `1.0 - smoothstep(-px, px, d)`, switching smoothly within one pixel either side of the edge",
        },
        {
          ja: "輪郭線 … 少し太らせた `d - w` を先に別の色で塗ると、幅 `w` の縁取りになる。線だけなら `abs(d) - w`",
          en: "Outline … paint the slightly fattened `d - w` in another color first for a border of width `w`; for just a line, use `abs(d) - w`",
        },
        {
          ja: "影 … 場所をずらして `scene(p - offset)` をもう一度呼び、ぼかした塗りを暗さとして使う",
          en: "Shadow … call `scene(p - offset)` again at a shifted position, and use a blurred fill of it as darkness",
        },
        {
          ja: "光のにじみ … 外側で `exp(-k * d)` のように、縁から離れるほど弱くなる明るさを足す",
          en: "Glow … add brightness that fades away from the edge outside, such as `exp(-k * d)`",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "ここで、マスクの `px = 2.0 / resolution.y` をもう一度見ておきます。`p.y` は画面の下から上までで -1〜1、つまり 2 の幅を `resolution.y` 個のピクセルで割ったものが 1 ピクセルの大きさです。高さ 500 ピクセルの画面なら `px` は 0.004 です。このマスクが図形の大きさに関係なく、いつも縁の 1 ピクセルぶんだけをなめらかにできるのは、`d` が `p` の単位の **本当の距離** だからです。くり返しで距離を割り戻したのも、このためでした。",
        en: "Let's take another look at the mask's `px = 2.0 / resolution.y`. `p.y` runs from -1 to 1 bottom to top, so a span of 2 split across `resolution.y` pixels is the size of one pixel. On a screen 500 pixels tall, `px` is 0.004. The mask softens just the pixel or so along the edge whatever the size of the shape, because `d` is a **true distance** in `p` units. That is also why we divided the distance back down in the repeating pattern.",
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
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        //ja: 吹き出しの形
        //en: a speech bubble
        float scene(vec2 p) {
          float body = sdBox(p, vec2(0.55, 0.3) - 0.2) - 0.2;
          float tail = sdSegment(p, vec2(-0.2, -0.15), vec2(-0.45, -0.55)) - 0.05;
          float d = smin(body, tail, 0.12);
          //ja: 「…」の 3 つの点をくり抜く
          //en: cut out the three dots of an ellipsis
          float dots = min(sdCircle(p - vec2(-0.25, 0.0), 0.06), sdCircle(p, 0.06));
          dots = min(dots, sdCircle(p - vec2(0.25, 0.0), 0.06));
          return max(d, -dots);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float bob = 0.03 * sin(time * 2.0);
          vec2 q = p - vec2(0.0, bob);
          float d = scene(q);

          vec3 col = mix(vec3(0.98, 0.85, 0.6), vec3(0.95, 0.6, 0.55), uv.y); //ja: 背景 //en: background

          //ja: 影: 右下にずらした場所の距離を、ぼかして塗る
          //en: shadow: a blurred fill of the distance at a spot shifted down-right
          float ds = scene(q - vec2(0.06, -0.08 - bob));
          col *= 1.0 - 0.35 * (1.0 - smoothstep(-0.05, 0.08, ds));

          //ja: 光のにじみ
          //en: glow
          col += vec3(1.0, 0.9, 0.5) * 0.25 * exp(-12.0 * max(d - 0.04, 0.0));

          //ja: 白い縁取り(少し太らせた形)→ 中の色
          //en: white border (the fattened shape), then the inner color
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, d - 0.04));
          vec3 fill = mix(vec3(0.2, 0.45, 0.95), vec3(0.45, 0.25, 0.85), q.y + 0.5);
          col = mix(col, fill, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`d - 0.04` の `0.04` を `0.08` にすると縁取りが太くなります。影の `vec2(0.06, -0.08 - bob)` を変えると、光の向きが変わったように見えます",
        en: "Change the `0.04` in `d - 0.04` to `0.08` for a thicker border. Change the shadow's `vec2(0.06, -0.08 - bob)` and the light seems to come from another direction",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "影は、図形をずらしてもう一度距離を測るだけで作れます。`smoothstep(-0.05, 0.08, ds)` は幅が広いので、ふちがぼやけたやわらかい影になります。縁取りは、0.04 だけ太らせた形を先に白で塗り、その上にもとの形を色で塗ると、白い部分が外側にだけ残ります。どれも同じ `scene` 関数を使っているので、図形を変えれば影も縁取りも光も自動でついてきます。",
        en: "The shadow is just the distance measured again at a shifted position. `smoothstep(-0.05, 0.08, ds)` is wide, so the shadow comes out soft and blurry. For the border, paint the shape fattened by 0.04 in white first, then the original shape in color on top, so only an outer ring of white remains. Everything uses the same `scene` function, so change the shape and the shadow, border and glow all follow automatically.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "距離を拡大やゆがみで正しく直せないときは、`px` の代わりに `fwidth(d)` を使えます。`fwidth(d)` は、となりのピクセルとの間で `d` がどれだけ変わるかを返すので、`1.0 - smoothstep(-fwidth(d), fwidth(d), d)` でも 1 ピクセルの縁になります。",
        en: "When a scale or distortion leaves the distance impossible to correct, use `fwidth(d)` instead of `px`. `fwidth(d)` returns how much `d` changes from one pixel to the next, so `1.0 - smoothstep(-fwidth(d), fwidth(d), d)` also gives a one-pixel edge.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "どの課題も、まず形の距離を作り、それから塗り・縁・影・光を足す、という順で考えると進めやすくなります。形に自信が無いときは、`distanceColor` で等高線を見て確かめましょう。",
        en: "For every exercise, it helps to build the shape's distance first, then add fill, border, shadow and light. If you are unsure about a shape, check its contours with `distanceColor`.",
      },
    },
    {
      type: "exercise",
      title: { ja: "カプセル形のボタン", en: "A pill-shaped button" },
      prompt: {
        ja: "角の四角を、両端がまるいカプセル形(丸みの半径が高さの半分)のボタンにしてください。濃い色の縁取りと、下にずらしたやわらかい影も付けます。",
        en: "Turn the sharp box into a pill-shaped button whose ends are fully round (corner radius equal to half the height). Add a darker border and a soft shadow offset below it.",
      },
      starter: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec2 b = vec2(0.7, 0.22);
          float d = sdBox(p, b); //ja: ここを角丸に //en: round this

          vec3 col = vec3(0.92, 0.93, 0.96);
          col = mix(col, vec3(0.3, 0.55, 1.0), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec2 b = vec2(0.7, 0.22);
          float r = b.y; //ja: 半径 = 高さの半分で、両端が半円に //en: radius = half the height makes the ends semicircles
          float d = sdBox(p, b - r) - r;

          vec3 col = vec3(0.92, 0.93, 0.96);
          //ja: 影: 下にずらした距離を広くぼかす
          //en: shadow: the distance shifted down, blurred widely
          float ds = sdBox(p - vec2(0.0, -0.06), b - r) - r;
          col *= 1.0 - 0.3 * (1.0 - smoothstep(-0.06, 0.1, ds));
          //ja: 縁取り → 中の色(上ほど明るい)
          //en: border, then the fill (lighter toward the top)
          col = mix(col, vec3(0.12, 0.25, 0.6), 1.0 - smoothstep(-px, px, d));
          vec3 fill = mix(vec3(0.25, 0.45, 0.95), vec3(0.45, 0.7, 1.0), smoothstep(-0.2, 0.2, p.y));
          col = mix(col, fill, 1.0 - smoothstep(-px, px, d + 0.025));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "角丸は `sdBox(p, b - r) - r` でした。両端を半円にするには、`r` をどんな大きさにすればよいでしょう?",
          en: "A rounded box is `sdBox(p, b - r) - r`. How big must `r` be for the ends to become semicircles?",
        },
        {
          ja: "`r = b.y`(高さの半分)にします。影は、`p - vec2(0.0, -0.06)` で測った距離を `smoothstep(-0.06, 0.1, ds)` のように広くぼかして、暗さに使います",
          en: "Use `r = b.y` (half the height). For the shadow, measure the distance at `p - vec2(0.0, -0.06)` and blur it widely with `smoothstep(-0.06, 0.1, ds)` to use as darkness",
        },
        {
          ja: "縁取りは、まず `d` を濃い色で塗り、次に少し細らせた `d + 0.025` を明るい色で塗ります",
          en: "For the border, paint `d` in a dark color first, then the slightly thinner `d + 0.025` in a bright color",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "ふわふわの雲", en: "A fluffy cloud" },
      prompt: {
        ja: "円を `min` で並べただけのごつごつした形を、`smin` でなめらかにつないで、底が平らな雲にしてください。空のグラデーションの上に、白い雲とうっすらした影を描きます。",
        en: "Join the lumpy circles (now merged with `min`) smoothly with `smin` to make a cloud with a flat bottom. Draw a white cloud with a faint shadow over a sky gradient.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float cloud(vec2 p) {
          float d = sdCircle(p - vec2(-0.45, -0.05), 0.25);
          d = min(d, sdCircle(p - vec2(-0.1, 0.12), 0.35));
          d = min(d, sdCircle(p - vec2(0.3, 0.02), 0.28));
          d = min(d, sdCircle(p - vec2(0.6, -0.1), 0.18));
          return d;
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.45, 0.7, 0.95), vec3(0.15, 0.4, 0.85), uv.y);
          float d = cloud(p);
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float cloud(vec2 p) {
          float d = sdCircle(p - vec2(-0.45, -0.05), 0.25);
          d = smin(d, sdCircle(p - vec2(-0.1, 0.12), 0.35), 0.15);
          d = smin(d, sdCircle(p - vec2(0.3, 0.02), 0.28), 0.15);
          d = smin(d, sdCircle(p - vec2(0.6, -0.1), 0.18), 0.15);
          //ja: 底を平らに: 「y > -0.2 の側」との積
          //en: flatten the bottom: intersect with "the side where y > -0.2"
          d = max(d, -(p.y + 0.2));
          return d;
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.45, 0.7, 0.95), vec3(0.15, 0.4, 0.85), uv.y);
          vec2 q = p - vec2(0.15 * sin(time * 0.3), 0.0); //ja: ゆっくり流れる //en: drifting slowly
          float d = cloud(q);
          //ja: 影は下に大きくずらしてぼかす
          //en: the shadow, shifted well down and blurred
          float ds = cloud(q - vec2(0.05, -0.12));
          col *= 1.0 - 0.15 * (1.0 - smoothstep(-0.1, 0.15, ds));
          //ja: 雲の中は、下ほど少し灰色に
          //en: inside, a little grayer toward the bottom
          vec3 white = mix(vec3(0.82, 0.86, 0.93), vec3(1.0), smoothstep(-0.2, 0.3, q.y));
          col = mix(col, white, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`min` を `smin(…, …, 0.15)` に置きかえると、円どうしの継ぎ目が埋まります",
          en: "Replace each `min` with `smin(…, …, 0.15)` to fill in the seams between the circles",
        },
        {
          ja: "底を平らにするには、「ある高さより上」という形との積(`max`)を取ります。[図形を組み合わせる](/learn/combining-shapes) の半平面 `p.y - h` は、`y = h` より上が外(正)でした。上を中にするには、符号を反転させます",
          en: "To flatten the bottom, intersect (`max`) with \"everything above a certain height\". The half-plane `p.y - h` from [Combining shapes](/learn/combining-shapes) is outside (positive) above `y = h`. Flip its sign to make the upper side the inside",
        },
        {
          ja: "`d = max(d, -(p.y + 0.2));` を `cloud` の最後に足します。影は `cloud(q - vec2(0.05, -0.12))` を `smoothstep(-0.1, 0.15, ds)` でぼかして使います",
          en: "Add `d = max(d, -(p.y + 0.2));` at the end of `cloud`. For the shadow, blur `cloud(q - vec2(0.05, -0.12))` with `smoothstep(-0.1, 0.15, ds)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "満ち欠けする月", en: "A waxing and waning moon" },
      prompt: {
        ja: "夜空に丸い月が浮かんでいます。月から、横に動くもう 1 つの円をくり抜いて(差)、満ちたり欠けたりする三日月にしてください。月のまわりには、ぼんやりした光も付けます。",
        en: "A round moon hangs in the night sky. Subtract a second circle that slides sideways, so the moon waxes and wanes into a crescent. Give it a soft halo of light too.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.02, 0.03, 0.1), vec3(0.08, 0.1, 0.25), uv.y);
          float moon = sdCircle(p, 0.45);
          float d = moon; //ja: ここで、もう 1 つの円をくり抜く //en: subtract a second circle here
          col = mix(col, vec3(1.0, 0.95, 0.8), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.02, 0.03, 0.1), vec3(0.08, 0.1, 0.25), uv.y);
          float moon = sdCircle(p, 0.45);
          //ja: 影の円を左右に往復させる
          //en: slide the shadow circle back and forth
          float shadow = sdCircle(p - vec2(0.9 * sin(time * 0.4) + 0.05, 0.08), 0.43);
          float d = max(moon, -shadow); //ja: 差 //en: subtraction
          //ja: 光のにじみ。月の外側だけ
          //en: the halo, outside the moon only
          col += vec3(0.6, 0.65, 0.9) * 0.35 * exp(-6.0 * max(d, 0.0));
          vec3 surface = mix(vec3(0.95, 0.85, 0.65), vec3(1.0, 0.98, 0.9), smoothstep(-0.3, 0.0, d));
          col = mix(col, surface, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "くり抜きは差 `max(a, -b)` でした。`a` が月、`b` がもう 1 つの円です",
          en: "Cutting out is subtraction, `max(a, -b)`, with `a` the moon and `b` the other circle",
        },
        {
          ja: "もう 1 つの円の中心を `vec2(0.9 * sin(time * 0.4), 0.08)` のように左右に動かすと、満ち欠けします。半径は月より少し小さくすると、三日月の先が細くとがります",
          en: "Move the other circle's center sideways, e.g. `vec2(0.9 * sin(time * 0.4), 0.08)`, to make the phases. A radius slightly smaller than the moon's gives the crescent sharp tips",
        },
        {
          ja: "光は `exp(-6.0 * max(d, 0.0))` を足します。`max(d, 0.0)` で中を 0 にしているので、光は外側にだけ広がります",
          en: "For the halo, add `exp(-6.0 * max(d, 0.0))`. `max(d, 0.0)` zeroes the inside, so the light spreads only outward",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "SDF は縁までの距離を返す関数。外は正、中は負、縁で 0。等高線が等間隔なら正確な距離",
          en: "An SDF returns the distance to the edge: positive outside, negative inside, zero on the edge. Evenly spaced contours mean an exact distance",
        },
        {
          ja: "`sdBox` は `abs` で 1 つの角に折りたたみ、外と中の距離を別々に測って足している",
          en: "`sdBox` folds space into one corner with `abs`, then measures the outside and inside distances separately and adds them",
        },
        {
          ja: "`d - r` で角丸、`abs(d) - w` で縁取り。和・積・差の結果は、反対側で本当の距離より小さめになる",
          en: "`d - r` rounds and `abs(d) - w` outlines. Union, intersection and subtraction come out smaller than the true distance on one side",
        },
        {
          ja: "和は `min`、積は `max`、差は `max(a, -b)`。`smin` で継ぎ目をなめらかに、`k` がその幅",
          en: "Union is `min`, intersection `max`, subtraction `max(a, -b)`. `smin` smooths the seam, with `k` as its width",
        },
        {
          ja: "くり返しで拡大した距離は、拡大した倍率で割って `p` の単位に戻す",
          en: "Distances measured in a scaled-up grid must be divided by the scale to get back to `p` units",
        },
        {
          ja: "1 つの距離から、塗り(`px` の縁)・縁取り・ずらした影・グローが作れる",
          en: "One distance gives you the fill (with a `px` edge), outlines, offset shadows and glow",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、この回で少しだけ使った光のにじみをくわしく扱います。明るい光を重ねたときの色の扱い方と、ビネットやフィルムグレインなどの仕上げで、絵をぐっと見ばえよくします。",
        en: "Next time we dig into the glow we only touched on here. We'll handle color when bright lights pile up, and use finishing touches like vignettes and film grain to make images look far more polished.",
      },
    },
  ],
};

export default lesson;
