import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "transforms",
  title: { ja: "座標を動かす", en: "Moving space" },
  summary: {
    ja: "図形ではなく座標を動かして、移動・回転・拡大をする",
    en: "Move, rotate and scale by transforming the coordinates instead of the shapes",
  },
  minutes: 55,
  goals: [
    {
      ja: "図形ではなく座標を動かす考え方と、動きが逆向きになる理由がわかる",
      en: "Understand moving the coordinates instead of the shape, and why the motion comes out reversed",
    },
    {
      ja: "`rot(a)` と `mat2` で図形を回せる(図形を a だけ回すには `rot(-a) * p`)",
      en: "Rotate shapes with `rot(a)` and `mat2` (to turn a shape by a, use `rot(-a) * p`)",
    },
    {
      ja: "`p / s` で拡大縮小し、距離に `* s` をかけて補正できる",
      en: "Scale with `p / s` and correct the distance with `* s`",
    },
    {
      ja: "変換の順番と回転の中心を選んで、その場で回す・周りを回る・振り子を作れる",
      en: "Choose the order of transforms and the center of rotation to spin in place, orbit, or swing like a pendulum",
    },
    {
      ja: "複数の図形に、それぞれ別の動きを付けられる",
      en: "Give several shapes their own separate motions",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "図形ではなく、座標を動かす", en: "Move the coordinates, not the shape" } },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーには「この四角を右へ動かせ」という命令がありません。できるのは、[はじめてのシェーダー](/learn/first-shader) で見たように、点ごとに「この場所は何色?」に答えることだけです。では、どうやって図形を動かすのでしょう。答えは、**図形に聞く前に、座標のほうを変える** です。",
        en: "A shader has no command like \"move this box to the right\". As we saw in [Your first shader](/learn/first-shader), all it can do is answer \"what color is this spot?\" for each pixel. So how do we move a shape? The answer: **change the coordinates before asking the shape**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`sdBox(q, b)` は、いつも「原点に中心がある四角」の距離を答えます。そこで、画面の座標 `p` をそのまま渡す代わりに、`q = p - vec2(0.5, 0.2)` を渡します。画面の (0.5, 0.2) にある点では q が (0.0, 0.0) になるので、四角は「ここが私の中心だ」と答えます。つまり、四角の中心は画面の (0.5, 0.2) に現れます。**座標から c を引くと、図形は +c の位置に動く** のです。",
        en: "`sdBox(q, b)` always answers for a box centered at the origin. So instead of passing the screen coordinate `p` directly, we pass `q = p - vec2(0.5, 0.2)`. At the screen point (0.5, 0.2), q comes out as (0.0, 0.0), so the box says \"this is my center\". The box's center therefore shows up at (0.5, 0.2) on screen. **Subtract c from the coordinates and the shape moves to +c.**",
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
          vec3 col = vec3(0.1, 0.1, 0.14);
          float axes = min(abs(p.x), abs(p.y)); //ja: x 軸と y 軸 //en: the x and y axes
          col = mix(col, vec3(0.25, 0.25, 0.32), 1.0 - smoothstep(0.0, 2.0 * px, axes));

          //ja: 動かす前の位置(うすい線)
          //en: where it was before moving (faint outline)
          col = mix(col, vec3(0.35), 1.0 - smoothstep(0.0, 2.0 * px, abs(sdBox(p, vec2(0.3, 0.2)))));

          vec2 q = p - vec2(0.5, 0.2); //ja: 座標から (0.5, 0.2) を引く //en: subtract (0.5, 0.2) from the coordinates
          float d = sdBox(q, vec2(0.3, 0.2));
          col = mix(col, vec3(0.3, 0.75, 1.0), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`p - vec2(0.5, 0.2)` を `p + vec2(0.5, 0.2)` にすると、四角は左下へ動きます。`vec2(0.5 * sin(time), 0.0)` を引くと?",
        en: "Change `p - vec2(0.5, 0.2)` to `p + vec2(0.5, 0.2)` and the box moves down-left. What if you subtract `vec2(0.5 * sin(time), 0.0)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`q` は「四角から見た座標」です。四角の中心を原点とした、四角だけの座標系なので、**ローカル座標** と呼ばれます。四角を右へ 0.5 動かすと、画面のどの点も、四角から見れば 0.5 だけ左にあることになります。だから「図形を +c へ動かす」ことは「座標から c を引く」ことになり、**向きが逆** になるのです。[時間で動かす](/learn/time-and-motion) で、`sin(p.x * k - time)` の波が時間を引くと右へ進んだのも、同じ理由です。",
        en: "`q` is the coordinate as seen from the box: a coordinate system belonging to the box alone, with the box's center as the origin. This is called **local coordinates**. Move the box right by 0.5, and from the box's point of view every point on screen is now 0.5 further to the left. That's why moving the shape to +c means subtracting c from the coordinates — **the direction is reversed**. It's the same reason that, in [Time and motion](/learn/time-and-motion), the wave `sin(p.x * k - time)` moved right when time was subtracted.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この「逆にする」は、移動だけでなく、これから見る回転と拡大縮小にもあてはまります。先に表にしておきます。",
        en: "This reversal applies not just to moving but to rotating and scaling too, which we'll look at next. Here is the whole picture up front:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "図形を **c だけ動かす** → 座標は `p - c`(逆向きに動かす)",
          en: "**Move** the shape by c → use `p - c` (move the coordinates the opposite way)",
        },
        {
          ja: "図形を **a だけ反時計回りに回す** → 座標は `rot(-a) * p`(逆向きに回す)",
          en: "**Rotate** the shape counterclockwise by a → use `rot(-a) * p` (rotate the coordinates the opposite way)",
        },
        {
          ja: "図形を **s 倍に大きくする** → 座標は `p / s`(逆に縮める)",
          en: "**Scale** the shape up by s → use `p / s` (shrink the coordinates instead)",
        },
      ],
    },

    { type: "heading", text: { ja: "回転: rot(a) と mat2", en: "Rotation: rot(a) and mat2" } },
    {
      type: "paragraph",
      text: {
        ja: "回転には、数を 2 行 2 列に並べた **行列** `mat2` を使います。この講座では、次の `rot` 関数をいつも同じ形で使います。",
        en: "For rotation we use `mat2`, a **matrix**: numbers arranged in 2 rows and 2 columns. Throughout this course we use the following `rot` function, always in exactly this form.",
      },
    },
    {
      type: "code",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "`rot(a) * v` は、ベクトル v を原点のまわりに **a だけ反時計回りに回した** ものを返します。中では `(c * v.x - s * v.y, s * v.x + c * v.y)` を計算しています。確かめてみましょう。a = 1.57(90°)なら c = 0、s = 1 なので、右向きの v = (1.0, 0.0) は (0.0, 1.0)、つまり上向きになります。右から上へ、反時計回りに 90° 回りました。",
        en: "`rot(a) * v` returns the vector v **rotated counterclockwise by a** around the origin. Inside, it computes `(c * v.x - s * v.y, s * v.x + c * v.y)`. Let's check: for a = 1.57 (90°), c = 0 and s = 1, so v = (1.0, 0.0), pointing right, becomes (0.0, 1.0), pointing up. From right to up: a 90° counterclockwise turn.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "角度の単位は度ではなく **ラジアン** です。1 周が約 6.28(2π)、半周が約 3.14(π)、4 分の 1 周(90°)が約 1.57、45° が約 0.785 です。`0.5` は約 29° になります。",
        en: "Angles are in **radians**, not degrees. A full turn is about 6.28 (2π), half a turn about 3.14 (π), a quarter turn (90°) about 1.57, and 45° about 0.785. `0.5` is roughly 29°.",
      },
    },
    {
      type: "playground",
      source: `
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
          vec3 col = vec3(0.1, 0.1, 0.14);
          float axes = min(abs(p.x), abs(p.y));
          col = mix(col, vec3(0.25, 0.25, 0.32), 1.0 - smoothstep(0.0, 2.0 * px, axes));

          float a = 0.5;        //ja: 回す角度(ラジアン) //en: rotation angle (radians)
          vec2 q = rot(-a) * p; //ja: 図形が a だけ反時計回りに回る //en: the shape turns counterclockwise by a
          float d = sdBox(q, vec2(0.6, 0.15));
          col = mix(col, vec3(1.0, 0.55, 0.3), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`a` を `1.57` にすると縦向きに。`rot(-a)` を `rot(a)` にすると、時計回りに回ります。`a` を `time` にすると?",
        en: "Set `a` to `1.57` to stand it upright. Change `rot(-a)` to `rot(a)` and it turns clockwise. What about `a = time`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "なぜ `-a` なのか、移動と同じように考えます。四角を反時計回りに 90° 回したとしましょう。もともと右の端 (0.5, 0.0) にあった部分は、回ったあと上の (0.0, 0.5) に来ます。ということは、画面の (0.0, 0.5) の点は「四角の右の端」として色を決めなければいけません。`rot(-1.57) * (0.0, 0.5)` を計算すると、c = 0、s = -1 なので (0.5, 0.0) になり、確かに四角の右の端を指します。図形を回した向きとは **逆に座標を回す** と、ちょうど「回す前の図形のどこに当たるか」がわかるのです。",
        en: "Why `-a`? Think of it like moving. Suppose we rotate the box 90° counterclockwise. The part that used to be at the right end, (0.5, 0.0), ends up at the top, (0.0, 0.5). So the screen point (0.0, 0.5) has to be colored as \"the box's right end\". Compute `rot(-1.57) * (0.0, 0.5)`: c = 0 and s = -1, giving (0.5, 0.0) — the box's right end, as required. **Rotating the coordinates the opposite way** tells you exactly which part of the unrotated shape a pixel lands on.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "ほかの人のシェーダーでは、`p *= rot(a);` という書き方をよく見かけます。これは `p = p * rot(a)` のことで、ベクトルを **左から** かけると回る向きが逆になるため、`p = rot(-a) * p` と同じ意味です。この講座では、混乱しないよう、いつも `rot(-a) * p` の形で書きます。",
        en: "In other people's shaders you will often see `p *= rot(a);`. That means `p = p * rot(a)`, and multiplying with the vector **on the left** reverses the direction of rotation, so it's the same as `p = rot(-a) * p`. In this course we always write `rot(-a) * p` to avoid confusion.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`mat2(c, s, -s, c)` の 4 つの数は、**列ごと** に入ります。1 列目が (c, s)、2 列目が (-s, c) です。1 列目は「右向きの (1, 0) が回ったあとの向き」、2 列目は「上向きの (0, 1) が回ったあとの向き」になっています。",
        en: "The four numbers in `mat2(c, s, -s, c)` are filled in **column by column**: the first column is (c, s) and the second is (-s, c). The first column is where the right-pointing (1, 0) ends up after the turn; the second is where the up-pointing (0, 1) ends up.",
      },
    },

    { type: "heading", text: { ja: "回転の中心と、変換の順番", en: "The center of rotation and the order of transforms" } },
    {
      type: "paragraph",
      text: {
        ja: "`rot` は、いつも **原点 (0, 0) のまわり** に回します。原点から離れた場所にある図形を、その場でくるくる回したいときは、先に図形の中心を原点に持ってきて(`p - c`)、それから回します。順番を逆にすると、まったく違う動きになります。",
        en: "`rot` always rotates **around the origin (0, 0)**. To spin a shape that sits away from the origin in place, first bring its center to the origin (`p - c`), then rotate. Swap the order and you get a completely different motion.",
      },
    },
    {
      type: "playground",
      source: `
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
          vec3 col = vec3(0.1, 0.1, 0.14);
          float axes = min(abs(p.x), abs(p.y));
          col = mix(col, vec3(0.25, 0.25, 0.32), 1.0 - smoothstep(0.0, 2.0 * px, axes));

          vec2 q = p;
          q = q - vec2(0.7, 0.0); //ja: 先に動かす //en: move first
          q = rot(-time) * q;     //ja: 次に回す //en: then rotate
          float d = sdBox(q, vec2(0.25, 0.1));
          col = mix(col, vec3(0.5, 0.9, 0.5), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`q = q - vec2(0.7, 0.0);` と `q = rot(-time) * q;` の 2 行を入れ替えると、四角は画面の中心のまわりを回り出します",
        en: "Swap the lines `q = q - vec2(0.7, 0.0);` and `q = rot(-time) * q;` and the box starts orbiting the center of the screen",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "座標に対する操作は上から順に行われますが、**図形が受ける動きは、下から上の順** になります。いまのコードを下から読むと「四角を回す → (0.7, 0.0) へ動かす」です。原点で回してから運ぶので、運んだ先でその場で回って見えます。2 行を入れ替えると「(0.7, 0.0) へ動かす → 原点のまわりに回す」になり、離れた場所にある四角が原点のまわりを大きく回ります。",
        en: "The operations on the coordinates happen top to bottom, but **the shape experiences them bottom to top**. Read the code from the bottom up: \"rotate the box, then move it to (0.7, 0.0)\". It spins at the origin and then gets carried over, so it appears to spin in place where it lands. Swap the two lines and it reads \"move to (0.7, 0.0), then rotate around the origin\", so the box, now far from the origin, swings around it in a big circle.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "よく使う順番は「座標を、移動 → 回転 → 拡大縮小」です。下から読めば「図形の大きさを決めて、その場で回して、置きたい場所へ運ぶ」で、いちばん思いどおりに動かしやすい順番です。拡大縮小は次の節で説明します。",
        en: "The order you'll use most is \"translate, then rotate, then scale\" on the coordinates. Read bottom up, that's \"size the shape, spin it in place, then carry it where you want it\" — the easiest order to control.",
      },
    },
    {
      type: "code",
      source: `
        vec2 q = p - c;            //ja: 1. 置きたい場所を原点に //en: 1. bring the target position to the origin
        q = rot(-a) * q;           //ja: 2. 回す //en: 2. rotate
        q = q / s;                 //ja: 3. 大きさを変える //en: 3. scale
        float d = sdBox(q, b) * s; //ja: 距離を画面の大きさに戻す //en: bring the distance back to screen units
      `,
    },

    { type: "heading", text: { ja: "拡大と縮小", en: "Scaling" } },
    {
      type: "paragraph",
      text: {
        ja: "図形を s 倍に大きくするには、座標を s で **割り** ます。半径 0.3 の円を 2 倍にするとき、画面の (0.6, 0.0) の点は、`p / 2.0` で (0.3, 0.0) になり、ちょうど円の縁に当たります。つまり、画面の上では半径 0.6 の円に見えます。座標を縮めると、図形は大きく見えるのです。",
        en: "To make a shape s times bigger, **divide** the coordinates by s. Doubling a circle of radius 0.3: the screen point (0.6, 0.0) becomes (0.3, 0.0) after `p / 2.0`, right on the circle's edge. So on screen it looks like a circle of radius 0.6. Shrink the coordinates and the shape looks bigger.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ただし、このとき返ってくる距離は、縮めた座標で測った距離です。同じ例で画面の (0.8, 0.0) の点を考えると、`sdCircle(p / 2.0, 0.3)` は 0.4 - 0.3 = 0.1 を返します。でも、画面の上で見れば、半径 0.6 の縁から 0.2 離れています。正しい距離にするには、**答えに s をかけて** 0.1 × 2 = 0.2 に戻します。これを忘れると、`px` を使ったなめらかな縁や縁取りの太さが、図形の大きさにつられて変わってしまいます。",
        en: "But the distance you get back is measured in the shrunken coordinates. In the same example, take the screen point (0.8, 0.0): `sdCircle(p / 2.0, 0.3)` returns 0.4 - 0.3 = 0.1. On screen, though, that point is 0.2 from the radius-0.6 edge. To get the right distance, **multiply the answer by s**: 0.1 × 2 = 0.2. Forget this and the `px`-based smooth edge and outline width will stretch along with the shape.",
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
          vec3 col = vec3(0.1, 0.1, 0.14);

          float s = 1.0 + 0.5 * sin(time);               //ja: 0.5〜1.5 倍 //en: 0.5x to 1.5x
          vec2 q = p / s;                                //ja: 座標を s で割ると、図形は s 倍 //en: dividing by s makes the shape s times bigger
          float d = (sdBox(q, vec2(0.35, 0.2)) - 0.1) * s; //ja: 距離を画面の大きさに戻す //en: back to screen units

          col = mix(col, vec3(0.95, 0.75, 0.3), 1.0 - smoothstep(-px, px, d));
          col = mix(col, vec3(0.2, 0.1, 0.05), 1.0 - smoothstep(-px, px, abs(d) - 0.01)); //ja: 縁取り //en: outline
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`* s` を消して、`s` を `3.0` にすると、縁取りが太くぼやけます。`0.3` にすると、細くなりすぎて消えかけます",
        en: "Delete `* s` and set `s` to `3.0`: the outline turns thick and blurry. At `0.3` it gets so thin it almost vanishes",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "[円と距離](/learn/circles-and-distance) の楕円で、左右の端の縁がぼやけたのを覚えているでしょうか。あれも同じ理由で、縮めた座標で測った距離を、そのまま画面の距離として使っていたからです。ただし楕円は x と y を **別々の割合** で縮めているので、1 つの数 s をかけるだけでは直りません。x を 0.3 倍した楕円なら、左右の端では d の変わり方が 0.3 倍になって縁が約 3.3 倍に広がり、上下の端ではずれがありません。場所によってずれ方がちがうのです。",
        en: "Remember how the ellipse in [Circles and distance](/learn/circles-and-distance) had blurry edges at its left and right ends? Same cause: the distance measured in squashed coordinates was used as if it were a screen distance. But an ellipse squashes x and y by **different amounts**, so multiplying by a single s can't fix it. For an ellipse with x scaled by 0.3, d changes only 0.3 times as fast at the left and right ends, so the edge widens about 3.3 times there, while the top and bottom are unaffected. The error differs from place to place.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "そこで、距離を直す代わりに **縁の幅のほうを合わせ** ます。`fwidth(d)` は、d がとなりのピクセルとどれだけちがうかを返す関数です(GPU はピクセルを 2×2 の組にして計算しているので、となりの値がわかります)。これを `px` の代わりに `smoothstep` の幅に使えば、距離の変わり方が場所によってちがっても、縁はいつもほぼ 1 ピクセルぶんの幅になります。",
        en: "So instead of fixing the distance, **match the edge width to it**. `fwidth(d)` returns how much d differs from one pixel to the next (the GPU shades pixels in 2×2 groups, so it knows its neighbors' values). Use it instead of `px` as the `smoothstep` width, and the edge stays about one pixel wide even where the distance changes at different rates.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.08, 0.1, 0.2);

          float d = sdCircle(p * vec2(0.3, 1.0), 0.35); //ja: x だけ縮める → 横長の楕円 //en: squash x only → a wide ellipse
          float w = px;                                 //ja: 縁の幅: 左右の端がぼやける //en: edge width: the left and right ends blur
          // w = fwidth(d);                             //ja: d の 1 ピクセルあたりの変化を測る //en: measure how much d changes per pixel
          col = mix(col, vec3(0.5, 0.85, 0.4), 1.0 - smoothstep(-w, w, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "左右の端のぼやけた縁を見てから、`// w = fwidth(d);` の行の先頭の `//` を消すと、どこも同じくらいくっきりした縁になります",
        en: "Look at the blurry left and right ends, then remove the `//` at the start of the `// w = fwidth(d);` line: the edge becomes equally crisp all the way around",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`fwidth` で直るのは縁のぼかしの幅だけです。`abs(d) - 0.01` のような縁取りの太さは、伸ばした向きで太いままです。太さもそろえたいときは、x と y を同じ割合で拡大縮小して `* s` で戻すのがいちばん確かです。",
        en: "`fwidth` only fixes the width of the edge blur. An outline like `abs(d) - 0.01` stays thicker in the stretched direction. If you need even thickness too, the surest approach is to scale x and y by the same amount and correct with `* s`.",
      },
    },

    { type: "heading", text: { ja: "図形ごとに別の動きを付ける", en: "A separate motion for each shape" } },
    {
      type: "paragraph",
      text: {
        ja: "図形がいくつもあるときは、**`p` そのものは書き換えずに**、図形ごとに自分用の座標 `q1`、`q2`、… を作ります。そうすれば、1 つ目の図形のための回転が、2 つ目の図形に影響しません。",
        en: "When there are several shapes, **leave `p` itself alone** and build a coordinate for each shape: `q1`, `q2` and so on. That way the rotation meant for the first shape doesn't affect the second.",
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
          vec3 col = vec3(0.08, 0.07, 0.12);
          vec3 pa = vec3(0.5), pb = vec3(0.5), pc = vec3(1.0), pd = vec3(0.0, 0.33, 0.67);

          //ja: 左: その場で回る四角
          //en: left: a box spinning in place
          vec2 q1 = rot(-time) * (p - vec2(-0.9, 0.0));
          float d1 = sdBox(q1, vec2(0.2)) - 0.03;
          col = mix(col, palette(0.0, pa, pb, pc, pd), 1.0 - smoothstep(-px, px, d1));

          //ja: 中: 中心のまわりを回る円
          //en: middle: a circle orbiting the center
          vec2 q2 = rot(-time * 2.0) * p - vec2(0.3, 0.0);
          float d2 = sdCircle(q2, 0.1);
          col = mix(col, palette(0.33, pa, pb, pc, pd), 1.0 - smoothstep(-px, px, d2));

          //ja: 右: 脈打ちながら逆向きに回る十字
          //en: right: a cross that pulses and spins the other way
          float s = 1.0 + 0.3 * sin(time * 3.0);
          vec2 q3 = rot(time) * (p - vec2(0.9, 0.0)) / s;
          float d3 = min(sdBox(q3, vec2(0.25, 0.06)), sdBox(q3, vec2(0.06, 0.25))) * s;
          col = mix(col, palette(0.66, pa, pb, pc, pd), 1.0 - smoothstep(-px, px, d3));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`q1` の `rot(-time)` を `rot(-time * 4.0)` にしても、ほかの 2 つは変わりません。`q3` の `/ s` を消すと、十字が脈打たなくなります",
        en: "Change `rot(-time)` in `q1` to `rot(-time * 4.0)` and the other two are unaffected. Delete `/ s` from `q3` and the cross stops pulsing",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "真ん中の円の `rot(-time * 2.0) * p - vec2(0.3, 0.0)` は、前の節の「入れ替えた順番」です。回してから動かすので、原点のまわりを半径 0.3 で回ります。右の十字は、`rot(time)` なので時計回りです(`rot(-a)` の a が `-time`)。また、`p` を 1 回も書き換えていないことに注目してください。もし途中で `p = rot(-time) * p;` と書いてしまうと、そこから下の図形がすべて一緒に回ってしまいます。",
        en: "The middle circle's `rot(-time * 2.0) * p - vec2(0.3, 0.0)` is the swapped order from the previous section: rotate, then move, so it orbits the origin at radius 0.3. The cross on the right uses `rot(time)`, so it turns clockwise (the a in `rot(-a)` is `-time`). And notice that `p` is never reassigned. If you wrote `p = rot(-time) * p;` partway through, every shape below that line would rotate along with it.",
      },
    },

    { type: "heading", text: { ja: "支点で揺らす: 振り子", en: "Swinging from a pivot: a pendulum" } },
    {
      type: "paragraph",
      text: {
        ja: "回転の中心を図形の端に置くと、**揺れる** 動きが作れます。振り子なら、天井の支点を原点に持ってきてから(`p - pivot`)回し、ローカル座標では、ひもとおもりを原点から真下にのばして描きます。揺れる角度は、[時間で動かす](/learn/time-and-motion) の sin で決めます。",
        en: "Put the center of rotation at one end of a shape and you get a **swinging** motion. For a pendulum, bring the pivot on the ceiling to the origin (`p - pivot`), rotate, and in local coordinates draw the rod and weight hanging straight down from the origin. The swing angle comes from a sin, as in [Time and motion](/learn/time-and-motion).",
      },
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
        float sdCircle(vec2 p, float r) { return length(p) - r; }
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.95, 0.9, 0.82), vec3(0.85, 0.88, 0.95), uv.y);

          vec2 pivot = vec2(0.0, 0.8);
          float a = 0.6 * sin(time * 2.0);  //ja: -0.6〜0.6 で揺れる //en: swings between -0.6 and 0.6
          vec2 q = rot(-a) * (p - pivot);   //ja: 支点を原点にしてから回す //en: put the pivot at the origin, then rotate

          float rod = sdSegment(q, vec2(0.0), vec2(0.0, -1.1)) - 0.012;
          float bob = sdCircle(q - vec2(0.0, -1.2), 0.15);
          vec3 ink = vec3(0.2, 0.2, 0.25);
          col = mix(col, ink, 1.0 - smoothstep(-px, px, min(rod, sdCircle(p - pivot, 0.04))));
          col = mix(col, vec3(0.85, 0.3, 0.25), 1.0 - smoothstep(-px, px, bob));
          //ja: おもりのつや(おもりと一緒に揺れる)
          //en: a highlight on the weight (it swings along with it)
          col = mix(col, vec3(1.0, 0.7, 0.6), 1.0 - smoothstep(-px, px, sdCircle(q - vec2(-0.05, -1.15), 0.04)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.6` を `1.5` にすると大きく揺れます。`rot(-a) * (p - pivot)` を `rot(-a) * p - pivot` にすると、支点がずれて変な動きになります",
        en: "Change `0.6` to `1.5` for a wide swing. Replace `rot(-a) * (p - pivot)` with `rot(-a) * p - pivot` and the pivot drifts, giving a strange motion",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ひもとおもりは、ローカル座標では「原点から真下へ」というだけの、動かない絵です。動きはすべて `q` を作る 1 行にまとまっています。形を描く部分と、動かす部分が分かれているので、どちらも読みやすくなります。おもりのつやも同じ `q` で描いているので、一緒に揺れます。",
        en: "In local coordinates, the rod and weight are a still picture that simply hangs straight down from the origin. All the motion lives in the single line that builds `q`. Keeping the drawing separate from the movement makes both easier to read. The highlight on the weight is drawn with the same `q`, so it swings along too.",
      },
    },

    { type: "heading", text: { ja: "回した写しを並べる", en: "Laying out rotated copies" } },
    {
      type: "paragraph",
      text: {
        ja: "[時間で動かす](/learn/time-and-motion) で使った for ループと組み合わせると、同じ図形を少しずつ回して並べられます。i 番目の写しは、原点のまわりに `float(i) * TAU / 6.0`(6 分の 1 周ずつ)回します。原点から離れたところに置いた図形を回すので、花びらのように円形に並びます。",
        en: "Combine rotation with the for loop from [Time and motion](/learn/time-and-motion) and you can lay out copies of a shape, each turned a little more. Copy number i is rotated around the origin by `float(i) * TAU / 6.0`, a sixth of a turn at a time. Because the shape sits away from the origin, the copies fan out in a circle like petals.",
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
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.06, 0.05, 0.1);

          for (int i = 0; i < 6; i++) {
            float fi = float(i);
            float a = fi * TAU / 6.0 + time * 0.3;  //ja: 6 分の 1 周ずつ + ゆっくり全体を回す //en: a sixth of a turn each, plus a slow overall spin
            vec2 q = rot(-a) * p - vec2(0.45, 0.0); //ja: 回してから、右へ 0.45 //en: rotate, then 0.45 to the right
            q = rot(-time) * q;                     //ja: 写しそれぞれも、その場で回す //en: each copy also spins in place
            float d = sdBox(q, vec2(0.18, 0.05)) - 0.03;
            vec3 c = palette(fi / 6.0, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
            col = mix(col, c, 1.0 - smoothstep(-px, px, d));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`q = rot(-time) * q;` の行の先頭に `//` を付けると、写しは外を向いたまま並びます。3 か所の `6` を `12` に(`6.0` は `12.0` に)すると?",
        en: "Put `//` in front of the `q = rot(-time) * q;` line and the copies stay pointing outward. What if you change all three `6`s to `12` (and `6.0` to `12.0`)?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ループの 1 回分を下から読むと「四角をその場で回す → 右へ 0.45 運ぶ → 原点のまわりに a だけ回す」です。それぞれの段が別々の動きになっているので、自転しながら公転する、といった組み合わせも自由に作れます。円形に並べる方法は、[極座標](/learn/polar-coordinates) で、ループを使わないもっと軽いやり方も学びます。",
        en: "Read one pass of the loop from the bottom up: \"spin the box in place, carry it 0.45 to the right, then rotate it by a around the origin\". Each stage is its own motion, so you can freely combine things like spinning on an axis while orbiting. In [Polar coordinates](/learn/polar-coordinates) you'll also learn a lighter way to arrange things in a circle without a loop.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "座標を動かして、図形に動きを付けてみましょう。うまく動かないときは、座標のコードを **下から上へ** 読んで、図形がどう動くはずかを確かめてください。",
        en: "Give shapes some motion by transforming their coordinates. If something moves the wrong way, read the coordinate code **from the bottom up** to see how the shape should move.",
      },
    },
    {
      type: "exercise",
      title: { ja: "回るひし形", en: "A spinning diamond" },
      prompt: {
        ja: "正方形を 45° 回してひし形にし、画面の (0.5, 0.0) の位置で、その場でゆっくり回り続けるようにしてください。",
        en: "Turn a square by 45° to make a diamond, place it at (0.5, 0.0) on screen, and keep it slowly spinning in place.",
      },
      starter: `
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
          vec3 col = mix(vec3(0.1, 0.12, 0.2), vec3(0.2, 0.12, 0.25), uv.x);

          vec2 q = p; //ja: ここを書き換える //en: change this
          float d = sdBox(q, vec2(0.25));
          col = mix(col, vec3(0.4, 0.85, 1.0), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
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
          vec3 col = mix(vec3(0.1, 0.12, 0.2), vec3(0.2, 0.12, 0.25), uv.x);

          //ja: 先に (0.5, 0.0) を原点に持ってきてから回す。0.785 が 45°
          //en: bring (0.5, 0.0) to the origin first, then rotate; 0.785 is 45°
          vec2 q = rot(-(0.785 + time * 0.5)) * (p - vec2(0.5, 0.0));
          float d = sdBox(q, vec2(0.25));
          col = mix(col, vec3(0.4, 0.85, 1.0), 1.0 - smoothstep(-px, px, d));
          //ja: 内側にもう 1 本、縁取りの線
          //en: an extra outline just inside the edge
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, abs(d + 0.05) - 0.01));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "その場で回すには「先に動かして、次に回す」順番でした",
          en: "To spin in place, the order is \"move first, then rotate\"",
        },
        {
          ja: "45° は約 0.785 ラジアンです。回す角度は `0.785 + time * 0.5` のように、45° に時間を足します",
          en: "45° is about 0.785 radians. For the angle, add time to it: `0.785 + time * 0.5`",
        },
        {
          ja: "`vec2 q = rot(-(0.785 + time * 0.5)) * (p - vec2(0.5, 0.0));`",
          en: "`vec2 q = rot(-(0.785 + time * 0.5)) * (p - vec2(0.5, 0.0));`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "秒針の時計", en: "A clock with a second hand" },
      prompt: {
        ja: "時計の文字盤に、12 個の目盛りをループで並べてください。それから、秒針が **時計回り** に 60 秒で 1 周するようにします。余裕があれば、1 秒ごとにカチッと進むようにしてみましょう(小数を切り捨てる `floor` が使えます)。",
        en: "Use a loop to place 12 tick marks around the clock face. Then make the second hand go around **clockwise** once every 60 seconds. If you have time, make it jump forward once per second (`floor`, which rounds down, will help).",
      },
      starter: `
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
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 ink = vec3(0.15, 0.15, 0.2);
          vec3 col = vec3(0.3, 0.35, 0.45);
          float face = sdCircle(p, 0.75);
          col = mix(col, vec3(0.97, 0.95, 0.9), 1.0 - smoothstep(-px, px, face));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, abs(face) - 0.02));

          //ja: 目盛り: いまは 12 時の 1 本だけ
          //en: tick marks: just the one at 12 o'clock for now
          float ticks = sdBox(p - vec2(0.0, 0.62), vec2(0.015, 0.05));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, ticks));

          vec2 q = p; //ja: 秒針の座標。ここを書き換える //en: the second hand's coordinates; change this
          float hand = sdSegment(q, vec2(0.0, -0.1), vec2(0.0, 0.6)) - 0.008;
          col = mix(col, vec3(0.85, 0.2, 0.15), 1.0 - smoothstep(-px, px, min(hand, sdCircle(p, 0.03))));
          return vec4(col, 1.0);
        }
      `,
      solution: `
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
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 ink = vec3(0.15, 0.15, 0.2);
          vec3 col = vec3(0.3, 0.35, 0.45);
          float face = sdCircle(p, 0.75);
          col = mix(col, vec3(0.97, 0.95, 0.9), 1.0 - smoothstep(-px, px, face));
          col = mix(col, ink, 1.0 - smoothstep(-px, px, abs(face) - 0.02));

          //ja: 目盛り: 12 時の 1 本を、30° ずつ回して 12 本に
          //en: tick marks: the 12 o'clock one, rotated 30° at a time into 12
          float ticks = 1.0;
          for (int i = 0; i < 12; i++) {
            vec2 t = rot(-float(i) * TAU / 12.0) * p;
            ticks = min(ticks, sdBox(t - vec2(0.0, 0.62), vec2(0.015, 0.05)));
          }
          col = mix(col, ink, 1.0 - smoothstep(-px, px, ticks));

          //ja: 時針と分針: 10 時 10 分から始めて、ゆっくり進む
          //en: hour and minute hands: start at 10:10 and creep forward
          vec2 h = rot((10.0 + time / 3600.0) * TAU / 12.0) * p;
          vec2 m = rot((10.0 + time / 60.0) * TAU / 60.0) * p;
          float hands = min(sdSegment(h, vec2(0.0), vec2(0.0, 0.35)) - 0.025,
                            sdSegment(m, vec2(0.0), vec2(0.0, 0.52)) - 0.016);
          col = mix(col, ink, 1.0 - smoothstep(-px, px, hands));

          //ja: 秒針: floor で 1 秒ごとにカチッと進む。図形を -θ 回すので rot(θ)
          //en: second hand: floor makes it tick once a second; turning the shape by -θ means rot(θ)
          vec2 q = rot(floor(time) * TAU / 60.0) * p;
          float hand = sdSegment(q, vec2(0.0, -0.1), vec2(0.0, 0.6)) - 0.008;
          col = mix(col, vec3(0.85, 0.2, 0.15), 1.0 - smoothstep(-px, px, min(hand, sdCircle(p, 0.03))));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "目盛りは、ループの中で座標を `float(i) * TAU / 12.0` ずつ回し、そのたびに `min` で和をとります。`ticks` の最初の値は、どこも外側になる大きな数(`1.0` など)にしておきます",
          en: "For the ticks, rotate the coordinates by `float(i) * TAU / 12.0` inside the loop and take the union with `min` each time. Start `ticks` at a large number (like `1.0`) that counts as outside everywhere",
        },
        {
          ja: "時計回りは、反時計回りの逆なので、角度がマイナスです。図形を `-θ` 回すには `rot(-(-θ)) * p`、つまり `rot(θ) * p` です。60 秒で 1 周なら θ は `time * TAU / 60.0` です",
          en: "Clockwise is the reverse of counterclockwise, so the angle is negative. To turn the shape by `-θ`, use `rot(-(-θ)) * p`, which is `rot(θ) * p`. For one turn in 60 seconds, θ is `time * TAU / 60.0`",
        },
        {
          ja: "`vec2 q = rot(floor(time) * TAU / 60.0) * p;` で、1 秒ごとにカチッと進みます",
          en: "`vec2 q = rot(floor(time) * TAU / 60.0) * p;` makes it tick forward once a second",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "惑星と衛星", en: "A planet and its moon" },
      prompt: {
        ja: "太陽のまわりを、惑星が 8 秒で 1 周するようにしてください。さらに、惑星のまわりを衛星が 2 秒で 1 周するようにします。衛星は、惑星についていきながら、惑星のまわりを回ります。",
        en: "Make the planet orbit the sun once every 8 seconds. Then add a moon that orbits the planet once every 2 seconds, following the planet as it goes around.",
      },
      starter: `
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.03, 0.03, 0.08);

          col = mix(col, vec3(1.0, 0.8, 0.3), 1.0 - smoothstep(-px, px, sdCircle(p, 0.2)));

          vec2 qp = p - vec2(0.7, 0.0); //ja: 惑星の座標。ここを書き換える //en: the planet's coordinates; change this
          col = mix(col, vec3(0.3, 0.6, 1.0), 1.0 - smoothstep(-px, px, sdCircle(qp, 0.08)));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.03, 0.03, 0.08);

          //ja: 太陽と、その光のにじみ
          //en: the sun and its glow
          float sun = sdCircle(p, 0.2);
          col += vec3(0.5, 0.3, 0.1) * (1.0 - smoothstep(0.0, 0.4, sun));
          col = mix(col, vec3(1.0, 0.8, 0.3), 1.0 - smoothstep(-px, px, sun));

          //ja: 惑星: 回してから右へ 0.7(下から読むと「右へ置いて、原点のまわりに回す」)
          //en: planet: rotate, then 0.7 to the right (bottom up: "place it to the right, then rotate around the origin")
          vec2 qp = rot(-time * TAU / 8.0) * p - vec2(0.7, 0.0);
          //ja: 衛星: 惑星の座標 qp から同じように作る
          //en: moon: built the same way, starting from the planet's coordinates qp
          vec2 qm = rot(-time * TAU / 2.0) * qp - vec2(0.2, 0.0);

          //ja: 通り道のうすい輪
          //en: faint rings for the orbits
          float orbits = min(abs(sdCircle(p, 0.7)), abs(sdCircle(qp, 0.2))) - 0.002;
          col = mix(col, vec3(0.25, 0.25, 0.4), 1.0 - smoothstep(-px, px, orbits));

          col = mix(col, vec3(0.3, 0.6, 1.0), 1.0 - smoothstep(-px, px, sdCircle(qp, 0.08)));
          col = mix(col, vec3(0.8, 0.8, 0.85), 1.0 - smoothstep(-px, px, sdCircle(qm, 0.035)));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "惑星は、この回の「図形ごとに別の動き」の真ん中の円と同じ形です。回してから動かします",
          en: "The planet works just like the middle circle in \"A separate motion for each shape\": rotate, then move",
        },
        {
          ja: "衛星の座標は `p` からではなく、惑星の座標 `qp` から作ります。そうすると、惑星が原点の座標系の中で回ることになります",
          en: "Build the moon's coordinates from the planet's `qp`, not from `p`. Then the moon orbits in a coordinate system whose origin is the planet",
        },
        {
          ja: "`vec2 qp = rot(-time * TAU / 8.0) * p - vec2(0.7, 0.0);` と `vec2 qm = rot(-time * TAU / 2.0) * qp - vec2(0.2, 0.0);` です",
          en: "`vec2 qp = rot(-time * TAU / 8.0) * p - vec2(0.7, 0.0);` and `vec2 qm = rot(-time * TAU / 2.0) * qp - vec2(0.2, 0.0);`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "図形は動かせないので、座標を変えてから図形に聞く。座標の動きと図形の動きは逆向き",
          en: "You can't move shapes, so transform the coordinates before asking the shape; coordinates and shapes move in opposite directions",
        },
        {
          ja: "移動は `p - c`、回転は `rot(-a) * p`(図形が a だけ反時計回り)、拡大は `p / s` と距離に `* s`",
          en: "Move with `p - c`, rotate with `rot(-a) * p` (the shape turns counterclockwise by a), scale with `p / s` and multiply the distance by `s`",
        },
        {
          ja: "`rot` はいつも原点のまわりに回す。その場で回すなら、先に `p - c` してから回す",
          en: "`rot` always turns around the origin; to spin in place, apply `p - c` before rotating",
        },
        {
          ja: "座標のコードを下から読むと、図形が受ける動きの順番になる。定番は「移動 → 回転 → 拡大縮小」",
          en: "Reading the coordinate code bottom up gives the order the shape experiences; the usual recipe is translate, rotate, scale",
        },
        {
          ja: "`p` は書き換えず、図形ごとに `q1`、`q2` を作れば、別々に動かせる",
          en: "Leave `p` alone and build `q1`, `q2` and so on per shape to move them independently",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、座標を変える仕掛けをもう 1 つ学びます。`fract` で座標をくり返すと、1 つの図形を描くだけで、画面いっぱいにタイルのように並べられます。",
        en: "Next time we learn one more way to transform coordinates. Repeat them with `fract`, and by drawing just one shape you can tile it across the whole screen.",
      },
    },
  ],
};

export default lesson;
