import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "repetition",
  title: { ja: "くり返しとタイル", en: "Repetition and tiles" },
  summary: {
    ja: "fract と floor で画面をマス目に分け、模様をくり返す",
    en: "Split the screen into cells with fract and floor, and repeat patterns",
  },
  minutes: 50,
  goals: [
    {
      ja: "`fract(p * n) - 0.5` で画面をマス目に分け、マスごとの座標を作れる",
      en: "Split the screen into cells with `fract(p * n) - 0.5` and get a coordinate inside each cell",
    },
    {
      ja: "`floor(p * n)` でマスの番号を取り出し、マスごとに色や大きさや動きを変えられる",
      en: "Get each cell's index with `floor(p * n)` and vary color, size or motion per cell",
    },
    {
      ja: "市松模様・レンガ積み・鏡のくり返しを作れる",
      en: "Make checkerboards, brickwork and mirrored repeats",
    },
    {
      ja: "格子の線を、太さをそろえてなめらかに描ける",
      en: "Draw smooth grid lines of even thickness",
    },
    {
      ja: "くり返しの中で図形を回したり動かしたりできる",
      en: "Rotate and move shapes inside a repeated pattern",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "fract で画面をマス目にする", en: "Turning the screen into a grid with fract" } },
    {
      type: "paragraph",
      text: {
        ja: "[時間で動かす](/learn/time-and-motion) では、`fract(time)` で時間をくり返しました。`fract` は小数の部分だけを取り出すので、どんなに大きな数を入れても答えは 0〜1 に収まり、1 進むごとに 0 に戻ります。これを時間ではなく **座標** に使うと、空間がくり返されます。",
        en: "In [Time and motion](/learn/time-and-motion) we used `fract(time)` to repeat time. `fract` keeps only the fractional part, so whatever you feed it, the answer stays between 0 and 1 and wraps back to 0 every time the input advances by 1. Apply it to **coordinates** instead of time and you repeat space.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 g = fract(p * 2.0); //ja: 0〜1 をくり返す //en: repeats 0 to 1
          return vec4(g, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "`2.0` を `5.0` にすると、マスが細かくなります。`vec2(4.0, 1.0)` にすると?",
        en: "Change `2.0` to `5.0` for smaller cells. What about `vec2(4.0, 1.0)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`p * 2.0` は、y が -2〜2 の範囲になります。そこから `fract` をとると、整数をまたぐたびに 0 に戻るので、縦に 4 つのマスに分かれます。1 つのマスの大きさは、`p` の単位で 1 ÷ 2 = 0.5 です。どのマスの中でも、左下が黒 (0, 0)、右へ行くほど赤、上へ行くほど緑で、[座標を知る](/learn/coordinates) で見た `uv` と同じ形をしています。**マスの 1 つ 1 つが、小さな画面になった** と考えられます。",
        en: "`p * 2.0` puts y in the range -2 to 2. Take `fract` of that and it wraps to 0 every time it crosses a whole number, splitting the screen into four rows of cells. Each cell is 1 ÷ 2 = 0.5 wide in `p` units. Inside every cell, the bottom-left is black (0, 0), red grows to the right and green grows upward — the same as `uv` in [Knowing where you are](/learn/coordinates). You can think of **each cell as a tiny screen of its own**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "負の数でも、くり返しはきちんとつながります。`fract(x)` は `x - floor(x)`(x から、x 以下でいちばん大きい整数を引いたもの)なので、`fract(-0.6)` は -0.6 - (-1.0) = 0.4 です。p = (0.8, -0.3) なら、`p * 2.0` = (1.6, -0.6) で、`fract` は (0.6, 0.4) になります。",
        en: "The repetition stays seamless for negative numbers too. `fract(x)` is `x - floor(x)` (x minus the largest whole number not greater than x), so `fract(-0.6)` is -0.6 - (-1.0) = 0.4. For p = (0.8, -0.3), `p * 2.0` = (1.6, -0.6), and `fract` gives (0.6, 0.4).",
      },
    },

    { type: "heading", text: { ja: "マスの中心を原点にする", en: "Putting the origin at each cell's center" } },
    {
      type: "paragraph",
      text: {
        ja: "図形を描くときは、[座標を知る](/learn/coordinates) で `uv` から `p` を作ったように、中心を原点にしたほうが便利です。`fract(p * n) - 0.5` にすると、どのマスの中でも -0.5〜0.5 になり、マスの中心が (0, 0) になります。あとは、その座標で円を 1 つ描くだけで、全部のマスに円が並びます。",
        en: "For drawing shapes, it's handier to have the origin at the center, just as we built `p` from `uv` in [Knowing where you are](/learn/coordinates). `fract(p * n) - 0.5` runs from -0.5 to 0.5 inside every cell, with the cell's center at (0, 0). Draw one circle in that coordinate and every cell gets a circle.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.08, 0.08, 0.12);

          float n = 3.0;                  //ja: 長さ 1 あたりのマスの数 //en: cells per unit of length
          vec2 q = fract(p * n) - 0.5;    //ja: マスの中心が原点 //en: origin at each cell's center
          float d = sdCircle(q, 0.3) / n; //ja: マスの大きさから画面の大きさへ //en: from cell units back to screen units
          col = mix(col, vec3(1.0, 0.55, 0.35), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`n` を `6.0` にすると、円が小さく、数が増えます。半径の `0.3` を `0.5` にすると円どうしが接し、`0.6` にすると?",
        en: "Set `n` to `6.0` for more, smaller circles. At a radius of `0.5` instead of `0.3` the circles touch. What happens at `0.6`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`/ n` は、[座標を動かす](/learn/transforms) の拡大縮小で、距離に `* s` をかけたのと同じ補正です。`p * n` は `p / (1 / n)` なので、図形は `1 / n` 倍に縮んでいます。だから距離には `1 / n` をかける、つまり `n` で割ります。n = 3 のとき、マスは画面の上で約 0.333 の大きさで、マスの単位で半径 0.3 の円は、画面の上では半径 0.1 になります。",
        en: "`/ n` is the same correction as the `* s` from scaling in [Moving space](/learn/transforms). `p * n` equals `p / (1 / n)`, so the shape has been shrunk to `1 / n` of its size, and the distance must be multiplied by `1 / n` — that is, divided by `n`. With n = 3 a cell is about 0.333 across on screen, and a circle of radius 0.3 in cell units has a radius of 0.1 on screen.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "マスからはみ出す大きさの図形は、マスの境目で切れてしまいます。それぞれのマスは、自分の中の 1 つの図形のことしか知らないからです。図形はマスの中(中心から 0.5 以内)に収めましょう。隣のマスまで調べてはみ出しを描く方法は、[セルの模様(ボロノイ)](/learn/voronoi) で扱います。",
        en: "A shape too big for its cell gets sliced off at the cell border, because each cell only knows about the one shape inside it. Keep shapes within the cell (within 0.5 of its center). A way to check neighboring cells and draw shapes that spill over comes up in [Cellular patterns (Voronoi)](/learn/voronoi).",
      },
    },

    { type: "heading", text: { ja: "floor でマスの番号を知る", en: "Finding the cell's index with floor" } },
    {
      type: "paragraph",
      text: {
        ja: "`fract` が「マスの中のどこか」を教えてくれるのに対して、`floor` は「**どのマスか**」を教えてくれます。`floor(x)` は x を切り捨てた整数(の値を持つ float)で、`floor(2.7)` は `2.0`、`floor(-0.4)` は `-1.0` です。`p * n` が (2.7, -0.4) なら、`floor` は (2.0, -1.0)、`fract` は (0.7, 0.6) で、いつも **`p * n` = 番号 + マスの中の位置** になっています。",
        en: "While `fract` tells you where you are inside a cell, `floor` tells you **which cell** you're in. `floor(x)` rounds x down to a whole number (as a float): `floor(2.7)` is `2.0` and `floor(-0.4)` is `-1.0`. If `p * n` is (2.7, -0.4), `floor` gives (2.0, -1.0) and `fract` gives (0.7, 0.6). It's always true that **`p * n` = index + position inside the cell**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "同じマスの中の点は、全部同じ番号を持ちます。だから番号を使って計算した値は、マスの中では一定で、マスごとに変わります。色や大きさをマスごとに変えるのにぴったりです。",
        en: "Every point in the same cell shares the same index. So anything you compute from the index stays constant inside a cell and changes from cell to cell — perfect for varying color or size per cell.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.08, 0.08, 0.12);

          float n = 3.0;
          vec2 id = floor(p * n);      //ja: マスの番号 //en: the cell's index
          vec2 q = fract(p * n) - 0.5;
          vec3 c = palette(id.x * 0.1 + id.y * 0.25, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          float r = 0.3;
          float d = sdCircle(q, r) / n;
          col = mix(col, c, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`r` を `0.25 + 0.15 * sin(id.x + id.y * 2.0 + time * 2.0)` にすると、マスごとに違う大きさで脈打ちます。`id.y * 0.25` を `0.0` にすると?",
        en: "Set `r` to `0.25 + 0.15 * sin(id.x + id.y * 2.0 + time * 2.0)` and each cell pulses at its own size. What if `id.y * 0.25` becomes `0.0`?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ここでは番号を sin やパレットに入れて「マスごとのちがい」を作りました。でも、規則正しい変化なので、斜めの縞のような並びが見えます。ばらばらに見える変化には乱数が必要です。それは [乱数をつくる](/learn/randomness) で作ります。",
        en: "Here we fed the index into sin and the palette to make each cell different. But the variation is regular, so you can see diagonal bands in it. For variation that looks scattered, you need random numbers, which we build in [Making randomness](/learn/randomness).",
      },
    },

    { type: "heading", text: { ja: "市松模様", en: "Checkerboards" } },
    {
      type: "paragraph",
      text: {
        ja: "番号を使った模様の代表が **市松模様** です。`mod(id.x + id.y, 2.0)` は、番号の和を 2 で割った余りで、0 か 1 になります。右か上へ 1 マス進むと、和が 1 増えるので、余りが 0 と 1 で入れ替わります。`mod(3.0, 2.0)` は 1、`mod(4.0, 2.0)` は 0 です。GLSL の `mod` は、負の数でも答えが 0 以上になるので(`mod(-1.0, 2.0)` は 1)、画面の左下でも模様がずれません。",
        en: "The classic index-based pattern is the **checkerboard**. `mod(id.x + id.y, 2.0)` is the remainder when the sum of the indices is divided by 2, so it's either 0 or 1. Step one cell right or up and the sum grows by 1, flipping the remainder between 0 and 1. `mod(3.0, 2.0)` is 1 and `mod(4.0, 2.0)` is 0. GLSL's `mod` stays non-negative even for negative numbers (`mod(-1.0, 2.0)` is 1), so the pattern doesn't break in the lower-left of the screen.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 id = floor(p * 4.0);
          float k = mod(id.x + id.y, 2.0); //ja: 0 と 1 が交互に //en: alternates between 0 and 1
          vec3 col = mix(vec3(0.95, 0.9, 0.8), vec3(0.2, 0.3, 0.45), k);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`id.x + id.y` を `id.x` だけにすると、縦のしまになります。`p * 4.0` を `(p + vec2(time * 0.2, 0.0)) * 4.0` にすると、どちらへ流れるでしょう?",
        en: "Use only `id.x` instead of `id.x + id.y` for vertical stripes. Change `p * 4.0` to `(p + vec2(time * 0.2, 0.0)) * 4.0` — which way does it flow?",
      },
    },

    { type: "heading", text: { ja: "行ごとにずらす: レンガ積み", en: "Shifting rows: brickwork" } },
    {
      type: "paragraph",
      text: {
        ja: "レンガの壁は、1 段ごとにレンガが半分ずれています。これは、`fract` や `floor` で x を区切る **前に**、奇数の行だけ x に 0.5 を足せば作れます。行の番号は `floor(g.y)`、それが奇数かどうかは `mod(floor(g.y), 2.0)` でわかります(偶数の行で 0、奇数の行で 1)。",
        en: "In a brick wall, each course is shifted by half a brick. You can make this by adding 0.5 to x in odd rows **before** dividing x into cells with `fract` and `floor`. The row index is `floor(g.y)`, and `mod(floor(g.y), 2.0)` tells you whether it's odd (0 in even rows, 1 in odd rows).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "レンガは横長なので、マスも横長にします。`p / size` で、レンガ 1 個ぶんが 1 マスになるように座標を割ります。そしてマスの中の座標に `size` をかけ直すと、画面の大きさに戻るので、`sdBox` の距離もそのまま画面の大きさで使えます。",
        en: "Bricks are wide, so the cells should be too. Dividing by `size` in `p / size` makes one brick fill one cell. Multiplying the in-cell coordinate by `size` again brings it back to screen units, so the `sdBox` distance comes out in screen units as well.",
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
          vec2 size = vec2(0.4, 0.2);            //ja: レンガ 1 個ぶんの大きさ //en: the size of one brick
          vec2 g = p / size;                     //ja: レンガ 1 個が 1 マス //en: one brick per cell
          g.x += 0.5 * mod(floor(g.y), 2.0);     //ja: 奇数の行だけ半分ずらす //en: shift odd rows by half a brick
          vec2 id = floor(g);
          vec2 q = (fract(g) - 0.5) * size;      //ja: マスの中の座標を画面の大きさに //en: in-cell coordinate in screen units
          float d = sdBox(q, size * 0.5 - 0.025) - 0.01;

          float shade = 0.85 + 0.15 * sin(id.x * 3.7 + id.y * 5.3); //ja: レンガごとに明るさを少し変える //en: vary each brick's brightness a little
          vec3 col = vec3(0.82, 0.78, 0.72);     //ja: 目地 //en: mortar
          col = mix(col, vec3(0.75, 0.33, 0.2) * shade, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.5 *` を `0.25 *` にすると、階段のようなずれ方に。`size` を `vec2(0.2)` にすると正方形のタイルになります",
        en: "Change `0.5 *` to `0.25 *` for a staircase-like offset. Set `size` to `vec2(0.2)` for square tiles",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`g.x += …` の行が `id` を作るより前にあることが大事です。ずらしたあとの x で番号を決めるので、ずれたレンガ 1 個 1 個に、ちゃんと別の番号が付きます。目地(レンガのすき間)は、`sdBox` の大きさを `size * 0.5` より少し小さくして作っています。",
        en: "It matters that the `g.x += …` line comes before `id` is computed. The index is taken from the shifted x, so each shifted brick gets its own proper index. The mortar (the gaps between bricks) comes from making the `sdBox` slightly smaller than `size * 0.5`.",
      },
    },

    { type: "heading", text: { ja: "鏡のくり返し", en: "Mirrored repetition" } },
    {
      type: "paragraph",
      text: {
        ja: "左右対称でない図形をくり返すと、マスの境目で模様が途切れます。そこで、奇数の列ではマスの中の x を、奇数の行では y を **裏返す** と、隣どうしが鏡に映したように向かい合い、境目がぴったりつながります。`mix(f, 1.0 - f, mod(id, 2.0))` は、`mod(id, 2.0)` が 0 の向きはそのまま、1 の向きは `1.0 - f`(裏返し)を選びます。[色を混ぜる](/learn/mixing-colors) の `mix` は、このように x と y で別々の割合も使えます。",
        en: "Repeat a shape that isn't symmetric and the pattern breaks at the cell borders. Instead, **flip** the in-cell x in odd columns and the in-cell y in odd rows: neighbors then face each other like mirror images and the borders join perfectly. `mix(f, 1.0 - f, mod(id, 2.0))` keeps the axes where `mod(id, 2.0)` is 0 and takes `1.0 - f` (flipped) where it's 1. As this shows, the `mix` from [Mixing colors](/learn/mixing-colors) also accepts separate amounts for x and y.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float n = 2.5;
          vec2 g = p * n;
          vec2 id = floor(g);
          vec2 f = fract(g);
          f = mix(f, 1.0 - f, mod(id, 2.0));             //ja: 奇数の列は左右、奇数の行は上下を裏返す //en: flip x in odd columns and y in odd rows
          float d = (abs(length(f) - 1.0) - 0.08) / n;   //ja: マスの左下の角を中心にした輪 //en: a ring centered on the cell's lower-left corner

          vec3 col = mix(vec3(0.1, 0.12, 0.25), vec3(0.2, 0.1, 0.25), uv.x);
          col = mix(col, vec3(0.95, 0.75, 0.4), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`f = mix(…);` の行の先頭に `//` を付けると、裏返しをやめた模様になり、境目で線が途切れます。`length(f) - 1.0` の `1.0` を `0.5` にすると?",
        en: "Put `//` in front of the `f = mix(…);` line to stop the flipping: the lines break at the cell borders. What if the `1.0` in `length(f) - 1.0` becomes `0.5`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "どのマスにも描いているのは「左下の角を中心にした、4 分の 1 の輪」だけです。あるマスの左下の角は、左隣のマスにとっては右下の角です。裏返しによって、左隣のマスもその同じ角を中心に輪を描くので(上下も同じです)、角を囲む 4 つのマスの 4 分の 1 ずつがそろって、1 つの完全な円になります。少ない部品から、つながった大きな模様が作れるのが鏡のくり返しの良いところです。",
        en: "Every cell draws only a quarter ring centered on its lower-left corner. A cell's lower-left corner is its left neighbor's lower-right corner. Flipping makes the neighbor draw its ring around that very same corner (and likewise up and down), so the four cells around a corner each contribute a quarter and together form one complete circle. Mirrored repetition lets a single small piece grow into a large, connected pattern.",
      },
    },

    { type: "heading", text: { ja: "格子の線", en: "Grid lines" } },
    {
      type: "paragraph",
      text: {
        ja: "方眼紙のような線を引くには、「いちばん近い格子の線までの距離」を求めます。`abs(fract(g) - 0.5)` は、マスの中心から x と y それぞれの方向にどれだけ離れているか(0〜0.5)です。マスの端(線)までの距離は `0.5` からそれを引いたもので、近いほうの線を選ぶと `0.5 - max(a.x, a.y)` になります。最後に `/ n` で画面の大きさに直せば、どこでも同じ太さの線が引けます。",
        en: "To draw graph-paper lines, compute the distance to the nearest grid line. `abs(fract(g) - 0.5)` is how far you are from the cell center along x and along y (0 to 0.5). The distance to the cell's edge — the line — is `0.5` minus that, and picking the nearer line gives `0.5 - max(a.x, a.y)`. Divide by `n` to get screen units, and the lines come out the same thickness everywhere.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "n = 10 のとき、マスは 0.1 の大きさです。p.x = 0.23 なら、`p.x * n` = 2.3、`fract` で 0.3、中心からは 0.2 離れていて、線までは 0.5 - 0.2 = 0.3 マス、画面の大きさで 0.03 です。確かに、いちばん近い縦の線 x = 0.2 から 0.03 の距離です。",
        en: "With n = 10, each cell is 0.1 across. For p.x = 0.23, `p.x * n` = 2.3, `fract` gives 0.3, which is 0.2 from the center, so the line is 0.5 - 0.2 = 0.3 cells away — 0.03 in screen units. Sure enough, the nearest vertical line, x = 0.2, is 0.03 away.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        float grid(vec2 p, float n) {
          vec2 a = abs(fract(p * n) - 0.5); //ja: マスの中心からの距離(0〜0.5) //en: distance from the cell center (0 to 0.5)
          return (0.5 - max(a.x, a.y)) / n; //ja: いちばん近い線までの距離 //en: distance to the nearest line
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.08, 0.22, 0.45), vec3(0.12, 0.3, 0.55), uv.y); //ja: 青焼きの紙 //en: blueprint paper
          col = mix(col, vec3(0.25, 0.45, 0.75), 1.0 - smoothstep(0.0, px, grid(p, 10.0)));                //ja: 細かい線 //en: fine lines
          col = mix(col, vec3(0.6, 0.78, 1.0), 1.0 - smoothstep(0.0, 1.5 * px, grid(p, 2.0) - 0.002));    //ja: 太い線 //en: bold lines

          //ja: 図面らしく、円の輪郭を白で
          //en: a white circle outline, like a technical drawing
          float ring = abs(sdCircle(p - vec2(0.1 * sin(time), 0.0), 0.6)) - 0.004;
          col = mix(col, vec3(1.0), 1.0 - smoothstep(-px, px, ring));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`grid(p, 10.0)` を `grid(p, 20.0)` にすると、さらに細かい方眼に。`- 0.002` を `- 0.01` にすると、太い線がもっと太くなります",
        en: "Change `grid(p, 10.0)` to `grid(p, 20.0)` for a finer grid. Change `- 0.002` to `- 0.01` to make the bold lines bolder",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ほかの人のコードでは、`mod(p, 0.5) - 0.25` のように `mod` でくり返しを書くこともあります。`mod(p, s)` は `fract(p / s) * s` と同じで、マスの大きさ s をそのまま画面の大きさで書ける形です。どちらを使っても結果は同じです。",
        en: "In other people's code you'll also see repetition written with `mod`, like `mod(p, 0.5) - 0.25`. `mod(p, s)` equals `fract(p / s) * s`: a form where the cell size s is written directly in screen units. Either way gives the same result.",
      },
    },

    { type: "heading", text: { ja: "くり返しの中で回す・動かす", en: "Rotating and moving inside the repeat" } },
    {
      type: "paragraph",
      text: {
        ja: "マスの中の座標 `q` は、ふつうの座標と同じように [座標を動かす](/learn/transforms) の変換が使えます。`rot(-a) * q` で回せば、全部のマスの図形が回ります。そこで、回す角度にマスの番号を混ぜると、[時間で動かす](/learn/time-and-motion) の「位相をずらして並べる」と同じように、動きが少しずつずれて波のように伝わります。",
        en: "The in-cell coordinate `q` works with the transforms from [Moving space](/learn/transforms) just like any other coordinate. Rotate it with `rot(-a) * q` and the shape in every cell turns. Mix the cell's index into the angle and, just like staggering the phase in [Time and motion](/learn/time-and-motion), the motion shifts slightly from cell to cell and ripples across like a wave.",
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
          vec3 col = vec3(0.06, 0.06, 0.1);

          float n = 3.0;
          vec2 id = floor(p * n);
          vec2 q = fract(p * n) - 0.5;
          float a = time + (id.x + id.y) * 0.3; //ja: マスの番号で角度をずらす //en: offset the angle by the cell index
          q = rot(-a) * q;
          float d = (sdBox(q, vec2(0.22)) - 0.06) / n;
          vec3 c = palette((id.x + id.y) * 0.08 + time * 0.1, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col = mix(col, c, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.3` を `0.0` にすると、全部そろって回ります。`vec2(0.22)` を `vec2(0.35)` にすると、回ったときに角がマスの境目で切れてしまいます",
        en: "Set `0.3` to `0.0` and they all turn together. Change `vec2(0.22)` to `vec2(0.35)` and the corners get clipped at the cell borders as they turn",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`id.x + id.y` は、右上がりの斜めの列にそって同じ値になるので、回転の波は斜めに伝わります。四角の角は、回ると中心から遠くまで届きます。半分の大きさ 0.22 に角丸 0.06 を足した四角の角は、中心から約 0.37 のところまで届き、マスの半分 0.5 に収まるので切れません。くり返しの中で回すときは、**いちばん遠くまで届くところ** がマスに収まるかを確かめましょう。",
        en: "`id.x + id.y` stays constant along diagonals running up and to the right, so the rotation wave travels diagonally. A box's corners reach farther from the center as it turns. With a half-size of 0.22 plus 0.06 of rounding, the corners reach about 0.37 from the center, which fits within the cell's half-width of 0.5, so nothing is clipped. When rotating inside a repeat, check that **the farthest-reaching point** still fits in the cell.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "回すだけでなく、ずらすこともできます。下の例では、列の番号 `id.x` で位相をずらしながら、`fract` をとる **前** の y に sin を足しています。列ごとに丸ごと上下するので、図形は切れずに、水玉の列が波打ちます。",
        en: "You can shift as well as rotate. In the example below, a sin is added to y **before** taking `fract`, with its phase offset by the column index `id.x`. Whole columns slide up and down together, so nothing is clipped and the columns of dots ripple.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.98, 0.95, 0.9);

          float n = 4.0;
          vec2 g = p * n;
          float column = floor(g.x);                      //ja: 列の番号 //en: the column index
          g.y += 0.5 * sin(time * 2.0 - column * 0.6);    //ja: 列ごとに、位相をずらして上下 //en: slide each column up and down, phase-shifted
          vec2 q = fract(g) - 0.5;
          float d = sdCircle(q, 0.3) / n;
          vec3 c = palette(column * 0.07, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col = mix(col, c, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`column * 0.6` を `column * 0.0` にすると全部そろって上下します。`g.y += …` を `g.x += …` にして、`column` を `floor(g.y)` にすると、行ごとに左右に動きます",
        en: "Change `column * 0.6` to `column * 0.0` and everything moves in unison. Turn `g.y += …` into `g.x += …` and set `column` to `floor(g.y)` to make each row slide sideways instead",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "ずらす量は、ずらす向きと **別の軸** の番号だけで決めましょう。y をずらす量に、y の位置や y の番号を使うと、マスの中で量が変わってしまい、図形がゆがんだり、境目で切れたりします。",
        en: "Base the amount of shift only on the index of the **other axis**. If the amount you shift y by depends on the y position or the y index, it varies inside a cell, and shapes get distorted or clipped at the borders.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "マス目を使って模様を作ってみましょう。まず `fract` と `floor` の値を色で表示して、マス目が思いどおりに分かれているか確かめてから進めると安心です。",
        en: "Use grids to make patterns. It's reassuring to first display the `fract` and `floor` values as colors and check that the cells are split the way you expect.",
      },
    },
    {
      type: "exercise",
      title: { ja: "ギンガムチェック", en: "Gingham" },
      prompt: {
        ja: "ピクニックの布のような **ギンガムチェック** を作ってください。縦のしまと横のしまが重なったところがいちばん濃く、片方だけのところは中くらい、どちらでもないところは白くなる、3 段階の模様です。",
        en: "Make a **gingham** pattern like a picnic cloth. Where the vertical and horizontal stripes overlap it's darkest, where only one passes it's medium, and where neither passes it's white: three levels in all.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 id = floor(p * 5.0);
          float k = mod(id.x + id.y, 2.0); //ja: いまは市松模様。ここを書き換える //en: a checkerboard for now; change this
          vec3 col = mix(vec3(1.0, 0.98, 0.95), vec3(0.8, 0.15, 0.2), k);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 id = floor(p * 5.0);
          //ja: 縦のしま(0 か 1)と横のしま(0 か 1)を足して半分に: 0、0.5、1 の 3 段階
          //en: add the vertical stripe (0 or 1) and the horizontal stripe (0 or 1), then halve: 0, 0.5 or 1
          float k = (mod(id.x, 2.0) + mod(id.y, 2.0)) * 0.5;
          vec3 col = mix(vec3(1.0, 0.98, 0.95), vec3(0.8, 0.15, 0.2), k);
          //ja: 布の織り目のような細かい線を少しだけ
          //en: a hint of fine lines, like the weave of the cloth
          col *= 0.95 + 0.05 * sin(p.x * 120.0) * sin(p.y * 120.0);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`mod(id.x, 2.0)` だけなら縦のしま、`mod(id.y, 2.0)` だけなら横のしまです",
          en: "`mod(id.x, 2.0)` alone gives vertical stripes; `mod(id.y, 2.0)` alone gives horizontal stripes",
        },
        {
          ja: "2 つを足すと 0、1、2 のどれかになります。`mix` に使うには 0〜1 にしたいので、半分にします",
          en: "Adding them gives 0, 1 or 2. `mix` wants 0 to 1, so halve it",
        },
        {
          ja: "`float k = (mod(id.x, 2.0) + mod(id.y, 2.0)) * 0.5;`",
          en: "`float k = (mod(id.x, 2.0) + mod(id.y, 2.0)) * 0.5;`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "交互に流れる行", en: "Rows flowing both ways" },
      prompt: {
        ja: "角丸の四角が横に並んだ行が、1 行ごとに **逆向き** に流れるようにしてください。偶数の行は右へ、奇数の行は左へ流れます。",
        en: "Make rows of rounded boxes flow sideways, with every other row going **the opposite way**: even rows flow right, odd rows flow left.",
      },
      starter: `
        #define TAU 6.28318531

        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.1, 0.1, 0.13);

          float n = 3.0;
          vec2 g = p * n;
          float row = floor(g.y);
          //ja: ここで g.x をずらす
          //en: shift g.x here
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          float d = (sdBox(q, vec2(0.3, 0.2)) - 0.08) / n;
          vec3 c = palette(id.x * 0.05 + row * 0.3, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col = mix(col, c, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.1, 0.1, 0.13);

          float n = 3.0;
          vec2 g = p * n;
          float row = floor(g.y);
          //ja: 偶数の行は -1(右へ流れる)、奇数の行は +1(左へ流れる)
          //en: -1 in even rows (flows right), +1 in odd rows (flows left)
          float dir = mod(row, 2.0) * 2.0 - 1.0;
          g.x += dir * time * 0.8;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          float d = (sdBox(q, vec2(0.3, 0.2)) - 0.08) / n;
          vec3 c = palette(id.x * 0.05 + row * 0.3, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col = mix(col, c, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "座標に足すと、模様は負の向きへ動くのでした。`g.x += time` なら左へ、`g.x -= time` なら右へ流れます",
          en: "Adding to the coordinate moves the pattern in the negative direction: `g.x += time` flows left, `g.x -= time` flows right",
        },
        {
          ja: "`mod(row, 2.0)` は偶数の行で 0、奇数の行で 1 です。`* 2.0 - 1.0` で -1 と 1 に直せます",
          en: "`mod(row, 2.0)` is 0 in even rows and 1 in odd rows. `* 2.0 - 1.0` turns that into -1 and 1",
        },
        {
          ja: "`g.x += (mod(row, 2.0) * 2.0 - 1.0) * time * 0.8;` を、`id` を作る前に書きます",
          en: "Write `g.x += (mod(row, 2.0) * 2.0 - 1.0) * time * 0.8;` before `id` is computed",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "ハーフトーン", en: "Halftone" },
      prompt: {
        ja: "新聞の写真のような **ハーフトーン** を作ってください。水玉の大きさが、画面の中心から広がる波にしたがって変わり、遠くから見ると、点の集まりが同心円の波もようになって流れます。",
        en: "Make a **halftone** like a newspaper photo. The size of each dot follows a wave spreading out from the center of the screen, so from a distance the dots form concentric rings that flow outward.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.97, 0.94, 0.88);

          float n = 10.0;
          vec2 id = floor(p * n);
          vec2 q = fract(p * n) - 0.5;
          float r = 0.3; //ja: ここを、マスの場所の波で変える //en: make this follow a wave at the cell's position
          float d = sdCircle(q, r) / n;
          col = mix(col, vec3(0.12, 0.15, 0.3), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.97, 0.94, 0.88);

          float n = 10.0;
          vec2 id = floor(p * n);
          vec2 q = fract(p * n) - 0.5;
          //ja: マスの中心の、画面の上での座標
          //en: the cell center's position on screen
          vec2 center = (id + 0.5) / n;
          //ja: 中心から外へ進む波(0〜1)。マスの中では一定なので、点は丸いまま
          //en: a wave moving outward from the center (0 to 1); constant within a cell, so dots stay round
          float v = 0.5 + 0.5 * sin(length(center) * 8.0 - time * 2.0);
          float r = 0.05 + 0.4 * v;
          float d = sdCircle(q, r) / n;
          vec3 ink = mix(vec3(0.85, 0.2, 0.3), vec3(0.12, 0.15, 0.3), v);
          col = mix(col, ink, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "点を丸いままにするには、半径がマスの中で一定でなければいけません。マスの番号 `id` から計算しましょう",
          en: "To keep each dot round, its radius must be constant within a cell. Compute it from the cell index `id`",
        },
        {
          ja: "`p * n` = 番号 + マスの中の位置 なので、マスの中心の画面の座標は `(id + 0.5) / n` です。その点の、中心からの距離で波を作ります",
          en: "Since `p * n` = index + position in the cell, the cell center's screen position is `(id + 0.5) / n`. Build the wave from that point's distance to the center",
        },
        {
          ja: "`float v = 0.5 + 0.5 * sin(length((id + 0.5) / n) * 8.0 - time * 2.0);` として、`r = 0.05 + 0.4 * v;` にします",
          en: "Use `float v = 0.5 + 0.5 * sin(length((id + 0.5) / n) * 8.0 - time * 2.0);` and then `r = 0.05 + 0.4 * v;`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`fract(p * n) - 0.5` で、マスごとの中心が原点の座標。距離は `/ n` で画面の大きさに戻す",
          en: "`fract(p * n) - 0.5` gives a coordinate centered in each cell; divide distances by `n` to get back to screen units",
        },
        {
          ja: "`floor(p * n)` でマスの番号。番号から作った値はマスの中で一定",
          en: "`floor(p * n)` gives the cell index; anything computed from it is constant within a cell",
        },
        {
          ja: "`mod(id.x + id.y, 2.0)` で市松模様。`fract` の前に行ごとにずらすとレンガ積み",
          en: "`mod(id.x + id.y, 2.0)` makes a checkerboard; shifting rows before `fract` makes brickwork",
        },
        {
          ja: "`mix(f, 1.0 - f, mod(id, 2.0))` で鏡のくり返し。境目がつながる",
          en: "`mix(f, 1.0 - f, mod(id, 2.0))` mirrors the repeat so the borders join",
        },
        {
          ja: "図形はマスに収める。はみ出すと境目で切れる",
          en: "Keep shapes inside their cells; anything that spills over gets clipped",
        },
        {
          ja: "マスの中でも回転や移動が使える。番号で位相をずらすと波のように伝わる",
          en: "Rotations and shifts work inside cells too; offsetting the phase by index makes motion ripple across",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "マス目は x と y で画面を区切りました。次の回では、**角度と距離** で画面を見る極座標を学びます。くり返しを角度に使うと、放射状の模様や花、万華鏡が作れます。",
        en: "Grids divide the screen by x and y. Next time we look at the screen in terms of **angle and distance** with polar coordinates. Apply repetition to the angle and you get rays, flowers and kaleidoscopes.",
      },
    },
  ],
};

export default lesson;
