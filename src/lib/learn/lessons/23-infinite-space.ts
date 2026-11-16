import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "infinite-space",
  title: { ja: "無限の空間と変形", en: "Infinite space and deformation" },
  summary: {
    ja: "空間のくり返し・ねじれ・曲げで、どこまでも続く景色を作る",
    en: "Build endless scenes with domain repetition, twists and bends",
  },
  minutes: 55,
  goals: [
    {
      ja: "`p - s * round(p / s)` で 3D の空間をくり返し、1 つの形を無限に並べられる",
      en: "Repeat 3D space with `p - s * round(p / s)` and line up one shape forever",
    },
    {
      ja: "くり返す向きと数を選び、`clamp` で決まった数だけ並べられる",
      en: "Choose which axes repeat, and use `clamp` to stop after a set number of copies",
    },
    {
      ja: "セルの番号と `hash21` で、1 つずつ違う高さや色を付けられる",
      en: "Give each copy its own height or color from its cell number and `hash21`",
    },
    {
      ja: "座標を回したり動かしたりして、形をねじる・曲げる・波打たせることができる",
      en: "Twist, bend and ripple shapes by rotating and shifting the coordinates",
    },
    {
      ja: "変形で距離が不正確になる理由がわかり、歩幅を縮めて穴を防げる",
      en: "Understand why deformations make the distance inaccurate, and prevent holes by shortening the step",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "1 つの形を、どこまでも", en: "One shape, forever" } },
    {
      type: "paragraph",
      text: {
        ja: "[くり返しとタイル](/learn/repetition) では、`fract` で平面をマス目に分け、1 つの模様を敷きつめました。同じことが 3D でもできます。しかも 3D では、もっと大きな効果があります。",
        en: "In [Repetition and tiles](/learn/repetition) we cut the plane into cells with `fract` and filled it with one pattern. The same idea works in 3D, and there it pays off even more.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "思い出してください。レイマーチングの `map(p)` は「点 `p` から、いちばん近い表面までの距離」を答える関数でした。もし `map` の中で、`p` を **1 つのマスの中の位置に直してから** 距離を測れば、どのマスにいる点も「自分のマスの真ん中にある形」までの距離を答えます。つまり、形は 1 つしか書いていないのに、空間のすべてのマスに同じ形があるように見えるのです。しかも計算の量は 1 つぶんのままです。",
        en: "Remember that in raymarching, `map(p)` answers \"how far is the nearest surface from point `p`?\". If, inside `map`, we first **turn `p` into a position inside one cell** and then measure, every point answers with the distance to \"the shape in the middle of its own cell\". We wrote the shape once, yet every cell in space seems to hold a copy — and the cost is still that of a single shape.",
      },
    },
    {
      type: "code",
      source: `
        vec3 q = p - s * round(p / s);
      `,
      caption: {
        ja: "s はくり返しの間隔。q は、いちばん近いマスの中心から見た位置",
        en: "s is the spacing; q is the position seen from the center of the nearest cell",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "1 つずつ読みます。`p / s` は、位置を「マス何個ぶんか」で測り直したもの。`round` はいちばん近い整数にするので、`round(p / s)` は **いちばん近いマスの番号** です。それに `s` をかけた `s * round(p / s)` はそのマスの中心の位置で、`p` から引くと「中心から見た位置」になります。`q` の各成分は、いつも `-s / 2` から `s / 2` の間に入ります。",
        en: "Let's read it piece by piece. `p / s` measures the position in units of cells. `round` snaps to the nearest whole number, so `round(p / s)` is **the number of the nearest cell**. Multiplying by `s` gives that cell's center, and subtracting it from `p` gives the position as seen from the center. Each component of `q` always lands between `-s / 2` and `s / 2`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめましょう。`s` が 2.0 で `p.x` が 4.7 のとき、`p.x / s` は 2.35、`round` で 2、中心は 4.0 なので `q.x` は 0.7 です。`p.x` が 5.2 なら、2.6 → 3 → 中心 6.0 で `q.x` は -0.8 です。4.7 と 5.2 は近い場所ですが、境目の 5.0 をまたいだので、別のマスの中心から測られています。",
        en: "Let's check with numbers. With `s` = 2.0 and `p.x` = 4.7, `p.x / s` is 2.35, `round` gives 2, the center is 4.0, so `q.x` is 0.7. With `p.x` = 5.2 we get 2.6 → 3 → center 6.0, so `q.x` is -0.8. The two points are close together, but they sit on either side of the border at 5.0, so they are measured from different centers.",
      },
    },
    {
      type: "playground",
      source: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float s = 2.0;                  //ja: くり返しの間隔 //en: spacing
          vec3 q = p - s * round(p / s);  //ja: いちばん近いマスの中心から見た位置 //en: position seen from the nearest cell center
          return sdSphere(q, 0.4);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(1.0, 1.0, time * 1.5);  //ja: 球のすき間を前へ進む //en: fly forward through the gaps
          vec3 ta = ro + vec3(0.4, 0.3, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 fog = vec3(0.05, 0.06, 0.14);
          vec3 col = fog;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.5, 0.8, -0.4));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = vec3(1.0, 0.55, 0.25) * dif + vec3(0.1, 0.15, 0.3) * amb;
            col = mix(col, fog, 1.0 - exp(-0.15 * t));  //ja: 遠くを霧に溶かす //en: fade into the fog with distance
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "間隔の `2.0` を `3.0` にすると? 球の半径 `0.4` を `0.8` にすると?",
        en: "What if the spacing `2.0` becomes `3.0`? What if the radius `0.4` becomes `0.8`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "球は 1 つしか書いていないのに、上下左右前後のすべてに並び、カメラがいくら進んでも終わりがありません。カメラは x と y が 1.0 の位置、つまり球と球のちょうど真ん中のすき間を通るように置いてあります。遠くの球は、[レイとカメラ](/learn/rays-and-camera) の床と同じように、距離に応じて霧の色に混ぜています(霧の式は [質感と空気](/learn/materials-and-atmosphere) でくわしく見ます)。",
        en: "We wrote a single sphere, yet copies fill every direction and the camera never reaches the end. The camera sits at x = 1.0 and y = 1.0, right in the gap between spheres. Distant spheres are blended into the fog color by distance, as with the floor in [Rays and cameras](/learn/rays-and-camera) (we look at the fog formula closely in [Materials and atmosphere](/learn/materials-and-atmosphere)).",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "形は、自分のマスの中に収まる大きさにします。`q` は `-s / 2` から `s / 2` の範囲しか動かないので、半径が `s / 2` より大きい球は、マスの壁でまっすぐ切られてしまいます。それぞれの点は自分のマスの形しか見ていないからです。間隔の半分より、少し小さめにしておきましょう。",
        en: "Keep the shape small enough to fit in its own cell. `q` only ranges from `-s / 2` to `s / 2`, so a sphere with a radius bigger than `s / 2` gets sliced flat at the cell walls — each point only ever looks at its own cell's shape. Stay a little under half the spacing.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`mod(p + 0.5 * s, s) - 0.5 * s` や `(fract(p / s + 0.5) - 0.5) * s` と書いても、同じ `q` になります。`round` を使う形は、マスの番号 `round(p / s)` が同じ式の中に見えているので、後でセルごとに変化を付けるときに便利です。",
        en: "`mod(p + 0.5 * s, s) - 0.5 * s` and `(fract(p / s + 0.5) - 0.5) * s` give exactly the same `q`. The `round` version keeps the cell number, `round(p / s)`, right there in the formula, which is handy when we vary each cell later.",
      },
    },

    { type: "heading", text: { ja: "くり返す向きを選ぶ", en: "Choosing which axes repeat" } },
    {
      type: "paragraph",
      text: {
        ja: "3 つの向きを全部くり返す必要はありません。床の上に柱を並べたいなら、くり返すのは横(x)と奥(z)だけで、高さ(y)はくり返しません。スウィズルを使って `q.xz` にだけ式を当てはめます。",
        en: "You do not have to repeat all three axes. To stand pillars on a floor, repeat only across (x) and into the distance (z), and leave height (y) alone. A swizzle applies the formula to `q.xz` only.",
      },
    },
    {
      type: "playground",
      source: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        float map(vec3 p) {
          float s = 3.0;
          vec3 q = p;
          q.xz = p.xz - s * round(p.xz / s);  //ja: x と z だけくり返す //en: repeat x and z only
          float pillar = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.35, 2.0);
          float ground = p.y;                 //ja: 床は 1 枚だけなので p を使う //en: there is only one floor, so use p
          return min(pillar, ground);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(1.5, 1.3, time);
          vec3 ta = ro + vec3(0.5, 0.0, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 30.0) break;
            t += d;
          }

          vec3 haze = vec3(0.95, 0.75, 0.6);
          vec3 col = mix(haze, vec3(0.35, 0.5, 0.8), clamp(rd.y * 2.0, 0.0, 1.0));
          if (t < 30.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(-0.6, 0.5, 0.4));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 albedo = pos.y < 0.01 ? vec3(0.55, 0.45, 0.4) : vec3(0.9, 0.85, 0.75);
            col = albedo * (dif * vec3(1.0, 0.85, 0.7) + amb * vec3(0.25, 0.3, 0.4));
            col = mix(col, haze, 1.0 - exp(-0.08 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`q.xz = …` の行を `q.z = p.z - s * round(p.z / s);` にすると、柱は 1 列だけになります。`3.0` を `2.0` にすると柱が密に",
        en: "Change the `q.xz = …` line to `q.z = p.z - s * round(p.z / s);` and only one row of pillars remains. Change `3.0` to `2.0` to pack the pillars closer",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "床の距離 `p.y` は、くり返した `q` ではなく元の `p` で測っています。床はもともと横にどこまでも続く 1 枚なので、くり返す必要がないからです。このように、`map` の中では「くり返す物」と「1 つだけの物」を混ぜて使えます。くり返した物は `q` で、1 つだけの物は `p` で測る、と覚えておきましょう。",
        en: "The floor distance `p.y` uses the original `p`, not the repeated `q`. The floor is already one endless sheet, so there is nothing to repeat. Inside `map` you can freely mix repeated things and one-off things: measure repeated objects with `q` and single objects with `p`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "どの物にどの色を塗るかは、当たった点の高さで分けています(`pos.y < 0.01` なら床)。物の数が増えると、この分け方では足りなくなります。物ごとに番号を付けるきちんとした方法は、[質感と空気](/learn/materials-and-atmosphere) で習います。",
        en: "We pick each object's color from the height of the hit point (`pos.y < 0.01` means floor). That trick stops working as scenes grow; the proper way, giving each object a number, comes in [Materials and atmosphere](/learn/materials-and-atmosphere).",
      },
    },

    { type: "heading", text: { ja: "並べる数を限る", en: "Limiting the count" } },
    {
      type: "paragraph",
      text: {
        ja: "どこまでも並ぶのではなく、5×5 のように決まった数だけ欲しいこともあります。そのときは、マスの番号 `round(p / s)` を `clamp` で範囲の中に押しこめます。",
        en: "Sometimes you want a fixed number, say a 5×5 grid, instead of an endless field. Then clamp the cell number `round(p / s)` into a range.",
      },
    },
    {
      type: "code",
      source: `
        q.xz = p.xz - s * clamp(round(p.xz / s), -n, n);
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "`n` が 2.0 なら、番号は -2 から 2 の 5 つだけになります。範囲の外の点は、いちばん端のマスの番号を使うので、端の箱までの正しい距離が出ます。たとえば `s` が 1.2 で `p.x` が 5.0 のとき、`p.x / s` は 4.17、`round` で 4 ですが、`clamp` で 2 に押さえられ、中心は 2.4、`q.x` は 2.6 です。箱の半分の幅が 0.4 なら、距離はおよそ 2.2 で、ちゃんと「右端の箱まで 2.2」と答えています。",
        en: "With `n` = 2.0 the cell numbers run from -2 to 2 — five in all. Points outside the range use the number of the last cell, so they get the correct distance to the end box. For example, with `s` = 1.2 and `p.x` = 5.0, `p.x / s` is 4.17 and `round` gives 4, but `clamp` holds it at 2. The center is 2.4 and `q.x` is 2.6. If the box is 0.4 wide on each side, the distance comes out at about 2.2 — exactly the distance to the right-hand box.",
      },
    },
    {
      type: "playground",
      source: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          float s = 1.2;
          vec2 n = vec2(2.0, 2.0);  //ja: 真ん中から両側に 2 つずつ → 5×5 //en: two on each side of the middle → 5×5
          vec3 q = p;
          q.xz = p.xz - s * clamp(round(p.xz / s), -n, n);
          float box = sdBox(q - vec3(0.0, 0.4, 0.0), vec3(0.35)) - 0.05;
          return min(box, p.y);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = time * 0.4;
          vec3 ro = vec3(4.5 * sin(a), 3.2, -4.5 * cos(a));  //ja: 周りを回るカメラ //en: a camera circling around
          vec3 ta = vec3(0.0, 0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 40.0) break;
            t += d;
          }

          vec3 haze = vec3(0.83, 0.75, 0.71);
          vec3 col = mix(haze, vec3(0.4, 0.5, 0.7), clamp(rd.y * 2.0, 0.0, 1.0));
          if (t < 40.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.5, 0.8, -0.3));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 albedo = pos.y < 0.01 ? vec3(0.75, 0.7, 0.65) : vec3(0.05, 0.45, 0.55);
            col = albedo * (dif * vec3(1.0, 0.9, 0.8) + amb * vec3(0.3, 0.35, 0.45));
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`n` を `vec2(3.0, 1.0)` にすると 7×3 に。`vec2(0.0, 2.0)` にすると?",
        en: "Set `n` to `vec2(3.0, 1.0)` for a 7×3 grid. What does `vec2(0.0, 2.0)` give?",
      },
    },

    { type: "heading", text: { ja: "1 つずつ違えて並べる", en: "Making each copy different" } },
    {
      type: "paragraph",
      text: {
        ja: "まったく同じ物がずらりと並ぶと、どうしても作り物っぽく見えます。そこで、マスの番号を使います。`round(p.xz / s)` はマスごとに違う 2 つの整数の組なので、[乱数をつくる](/learn/randomness) の `hash21` に渡せば、マスごとに決まった 0〜1 の乱数が手に入ります。これを高さ・色・回転・速さなどに使えば、1 つずつ違う物が並びます。",
        en: "A row of perfectly identical things always looks artificial. This is where the cell number comes in. `round(p.xz / s)` is a pair of whole numbers unique to each cell, so passing it to `hash21` from [Making randomness](/learn/randomness) gives each cell its own fixed random value from 0 to 1. Feed that into height, color, rotation or speed, and every copy becomes different.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の街では、マスごとの乱数で建物の高さを決めています。色も同じ乱数から [色を混ぜる](/learn/mixing-colors) の `palette` で選びます。`map` は距離しか返さないので、色を付けるときは、当たった点 `pos` からもう一度マスの番号 `round(pos.xz / s)` を計算します。当たった点は建物と同じマスにあるので、同じ番号になります。",
        en: "In the city below, each cell's random value sets its building height. The same value picks a color through `palette` from [Mixing colors](/learn/mixing-colors). Since `map` only returns a distance, we work the cell number out again from the hit point, `round(pos.xz / s)`, when coloring. The hit point is in the same cell as the building, so it gets the same number.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ただし、ここに落とし穴があります。それぞれの点は **自分のマスの建物しか見ていません**。自分のマスの建物が低く、隣のマスの建物が高いとしましょう。高さ 1.5 の点がマスの壁の近くにいると、自分の低い建物までの距離はたとえば 1.2 ですが、隣の高い建物の壁は横に 0.2 しか離れていません。`map` が 1.2 と答えるので、レイは 1.2 進み、隣の建物の中に入りこんで、そのまま通り抜けてしまいます。建物が斜めに切れたように見えるのはこのためです。",
        en: "There is a trap, though. Each point **only looks at the building in its own cell**. Suppose your cell's building is short and the neighbor's is tall. A point at height 1.5 near the cell wall might be 1.2 away from its own short building, while the neighbor's tall wall is only 0.2 away sideways. `map` answers 1.2, the ray jumps 1.2, lands inside the neighbor's building, and passes straight through it. That is why buildings look sliced at an angle.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "直し方は 1 行です。建物はどれもマスの壁から 0.2 以上内側にあるので、隣の建物までは、少なくとも「自分のマスの壁までの距離 + 0.2」あります。四角いマスの壁までの距離は `0.5 * s - max(abs(q.x), abs(q.z))` です。これと建物までの距離の小さいほうを使えば、どの建物も飛び越しません。",
        en: "The fix is one line. Every building stays at least 0.2 inside its cell walls, so a neighbor's building is at least \"the distance to my cell wall + 0.2\" away. The distance to the nearest wall of a square cell is `0.5 * s - max(abs(q.x), abs(q.z))`. Take the smaller of that and the distance to your own building, and the ray can never jump over a neighbor.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          float s = 1.0;
          vec2 id = round(p.xz / s);         //ja: マスの番号 //en: cell number
          vec3 q = p;
          q.xz -= s * id;
          float h = 0.1 + 1.2 * hash21(id);  //ja: マスごとの高さ(の半分) //en: per-cell height (half of it)
          float d = sdBox(q - vec3(0.0, h, 0.0), vec3(0.3, h, 0.3));
          d = min(d, p.y);
          d = min(d, 0.5 * s - max(abs(q.x), abs(q.z)) + 0.2);  //ja: 隣の建物までの最低の距離 //en: the least distance to a neighbor
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.5, 3.0, time * 0.8);
          vec3 ta = ro + vec3(0.3, -0.7, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 fog = vec3(0.85, 0.65, 0.6);
          vec3 col = fog;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float h = hash21(round(pos.xz));  //ja: 当たった点のマスの乱数 //en: the random value of the hit cell
            vec3 albedo = palette(h, vec3(0.5), vec3(0.35), vec3(1.0), vec3(0.0, 0.15, 0.3));
            if (pos.y < 0.01) albedo = vec3(0.12, 0.12, 0.16);
            vec3 l = normalize(vec3(0.6, 0.5, -0.3));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = albedo * (dif * vec3(1.3, 1.0, 0.75) + amb * vec3(0.15, 0.17, 0.3));
            col = mix(col, fog, 1.0 - exp(-0.08 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`d = min(d, 0.5 * s …` の行の先頭に `//` を付けて消すと、建物が斜めに切れます。`1.2`(高さの幅)を `3.0` にすると?",
        en: "Put `//` in front of the `d = min(d, 0.5 * s …` line and the buildings get sliced. What if the height range `1.2` becomes `3.0`?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "マスごとの変化が色や回転だけで、形の大きさが変わらないなら、この心配はいりません。大きさを変えるときは「形をマスの壁から離しておく」ことと「壁までの距離 + すき間で押さえる」ことを思い出してください。",
        en: "If the per-cell change is only color or rotation and the size stays the same, you do not need to worry about this. When sizes vary, remember: keep shapes away from the cell walls, and cap the distance with \"distance to the wall + the gap\".",
      },
    },

    { type: "heading", text: { ja: "ねじる", en: "Twisting" } },
    {
      type: "paragraph",
      text: {
        ja: "くり返しは「座標を折りたたむ」ことで形を増やしました。今度は、座標を場所ごとに少しずつ違う向きに動かして、形そのものを変形させます。まずはねじりです。",
        en: "Repetition multiplied shapes by folding the coordinates. Now we move the coordinates a little differently at every point to deform the shape itself. First up: twisting.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "[3D の形を組み立てる](/learn/shapes-3d) で、`q.xz = rot(a) * q.xz` と書くと、y 軸のまわりに回せることを見ました。このとき角度 `a` を一定にせず、**高さに比例させて** `q.y * k` にします。すると、高さごとに輪切りにした形が、それぞれ少しずつ違う角度で回ります。下の段から上の段へ、だんだん回る角度が増えていくので、ねじれた形になります。`k` は高さ 1 あたりに回る角度(ラジアン)で、`k` が 3.0 なら、高さ 1 で約 172 度回ります。",
        en: "In [Building 3D shapes](/learn/shapes-3d) we saw that `q.xz = rot(a) * q.xz` turns a shape around the y axis. Now, instead of a fixed angle `a`, make it **proportional to height**: `q.y * k`. Every horizontal slice of the shape turns by a slightly different angle, more and more as you go up, and the shape twists. `k` is the angle in radians per unit of height; with `k` = 3.0, one unit of height turns about 172 degrees.",
      },
    },
    {
      type: "playground",
      source: `
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

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          vec3 q = p;
          float k = 3.0;                //ja: ねじれの強さ //en: twist strength
          q.xz = rot(q.y * k) * q.xz;   //ja: 高さに比例した角度で回す //en: turn by an angle proportional to height
          return sdBox(q, vec3(0.7, 1.2, 0.12));
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.8, -3.6);
          vec3 ta = vec3(0.0, 0.0, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = mix(vec3(0.16, 0.12, 0.22), vec3(0.03, 0.03, 0.07), uv.y);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.6, 0.7, -0.5));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            float spe = pow(max(dot(n, normalize(l - rd)), 0.0), 32.0);
            col = vec3(1.0, 0.6, 0.3) * (dif + 0.25 * amb) + 0.5 * spe;
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "ふちの欠けやギザギザに注目してください。`k` を `1.0` にすると、ねじれがゆるくなり、欠けも消えます",
        en: "Look at the torn, jagged edges. Set `k` to `1.0`: the twist relaxes and the tears disappear",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "きれいにねじれたリボンになりましたが、`k` が 3.0 だと、ふちが欠けたり、ところどころ向こうが透けたりしています。式はまちがっていないのに、なぜでしょう。",
        en: "We get a nicely twisted ribbon, but at `k` = 3.0 the edges are torn and in places you can see right through it. The formula is not wrong — so what is going on?",
      },
    },

    { type: "heading", text: { ja: "変形すると距離が狂う", en: "Deformation breaks the distance" } },
    {
      type: "paragraph",
      text: {
        ja: "レイマーチングは、`map` の答えを信じて進みます。「距離 `d` の中には表面が無い」という約束があるから、`d` だけ一気に進めるのでした([レイマーチング](/learn/raymarching))。`sdBox` や `sdSphere` はこの約束を正確に守ります。言いかえると、点が 1 動いても、距離の値は 1 より大きくは変わりません。",
        en: "Raymarching trusts what `map` says. It can leap forward by `d` because of a promise: \"there is no surface within `d`\" ([Raymarching](/learn/raymarching)). `sdBox` and `sdSphere` keep this promise exactly. Put another way, when a point moves by 1, the distance value changes by at most 1.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ねじると、この約束が崩れます。`map` は、ねじる前のまっすぐな箱で距離を測っています。ところが実際の空間では、リボンの端(軸から 0.7)は、高さが 1 上がるあいだに横へ 0.7 × 3.0 = 2.1 も動きます。形は `map` が思っているよりずっと斜めに傾いていて、本当の表面は `map` の答えより近くにあるのです。だいたい半分くらいの近さになることもあります。`map` が 1.0 と答えても本当は 0.5 しか無ければ、レイは表面を越えて中に入りこみます。薄いリボンなら、そのまま反対側へ抜けて、穴があいたように見えます。[レイマーチング](/learn/raymarching) で見た「距離を大きく見積もりすぎると穴があく」が、ここで起きているのです。",
        en: "Twisting breaks the promise. `map` measures the distance in the straight, untwisted box. But in real space, the ribbon's edge, 0.7 from the axis, swings sideways by 0.7 × 3.0 = 2.1 for every 1 it rises. The shape leans far more than `map` thinks, so the real surface is closer than `map` says — sometimes only about half as far. If `map` says 1.0 when the surface is really 0.5 away, the ray steps past the surface into the shape. With a thin ribbon it can come out the other side, and you see a hole. This is exactly the \"overestimated distance makes holes\" problem from [Raymarching](/learn/raymarching).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "対策は、`map` の答えを少しだけ割り引いて進むことです。`t += d;` を `t += d * 0.6;` にすると、毎回 6 割だけ進みます。慎重に進むので越えにくくなり、表面の近くでは歩幅が自然に小さくなるので、ちゃんと表面にたどり着きます。",
        en: "The fix is to take `map`'s answer at a discount. Change `t += d;` to `t += d * 0.6;` and each step covers only 60% of the distance. Moving more carefully makes overshooting much less likely, and near the surface the steps shrink on their own, so the ray still arrives.",
      },
    },
    {
      type: "playground",
      source: `
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

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          vec3 q = p;
          float k = 3.0 * sin(time * 0.5);  //ja: ねじれの強さを時間で変える //en: animate the twist strength
          q.xz = rot(q.y * k) * q.xz;
          return sdBox(q, vec3(0.7, 1.2, 0.12));
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.8, -3.6);
          vec3 ta = vec3(0.0, 0.0, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d * 0.6;  //ja: 6 割だけ進む //en: go only 60% of the way
          }

          vec3 col = mix(vec3(0.16, 0.12, 0.22), vec3(0.03, 0.03, 0.07), uv.y);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.6, 0.7, -0.5));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            float spe = pow(max(dot(n, normalize(l - rd)), 0.0), 32.0);
            col = vec3(1.0, 0.6, 0.3) * (dif + 0.25 * amb) + 0.5 * spe;
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.6` を `1.0` に戻すと、強くねじれた瞬間に欠けが出ます。`0.2` にすると、ふちに黒いにじみが出ます(64 歩では表面までたどり着けない)",
        en: "Put `0.6` back to `1.0` and tears appear whenever the twist is strong. Try `0.2`: dark smudges appear along the edges, because 64 steps are no longer enough to reach the surface",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "割り引きすぎもよくありません。歩幅が小さいほど、同じ距離を進むのに多くの歩数がかかります。ループは 64 歩までなので、0.2 のように小さくすると、表面や遠くまでたどり着く前に歩数が尽きてしまいます。目安は **0.5〜0.8** です。1.0 から少しずつ下げて、欠けが消えたところで止めるのがいちばんです。",
        en: "Discounting too much is a problem too. Smaller steps mean more steps to cover the same distance, and the loop stops at 64. With something like 0.2, the ray runs out of steps before reaching the surface or the far parts of the scene. A good range is **0.5–0.8**. Start at 1.0, lower it bit by bit, and stop as soon as the tears are gone.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "変形が強いほど、割り引きも大きく必要になります。ねじりなら「軸からの距離 × `k`」が大きいほど要注意です。この回の前半で見た「隣のマス」の問題とあわせて、レイマーチングで絵が欠けたら、まず「`map` が距離を大きく言いすぎていないか」を疑いましょう。",
        en: "The stronger the deformation, the bigger the discount it needs. For a twist, watch out when \"distance from the axis × `k`\" gets large. Together with the neighbor-cell problem from earlier in this lesson, this gives you a rule of thumb: when a raymarched image has tears, first suspect that `map` is overstating the distance.",
      },
    },

    { type: "heading", text: { ja: "曲げる", en: "Bending" } },
    {
      type: "paragraph",
      text: {
        ja: "ねじりは「y で決まる角度で、xz 平面を回す」ものでした。回す平面を変えて「**x で決まる角度で、xy 平面を回す**」にすると、曲げになります。x が大きいほど大きく傾くので、x 方向にまっすぐ並んだものが、弓のように反り返ります。",
        en: "A twist was \"turn the xz plane by an angle set by y\". Change the plane and you get a bend: \"**turn the xy plane by an angle set by x**\". The farther along x, the more it tilts, so anything lined up straight along x curves like a bow.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の例では、まず空間を曲げてから、曲がった座標の上で薄い板を 11 枚くり返しています。曲げる前はまっすぐ立って並ぶ板ですが、曲げた空間に並べると、扇のように開きます。色は位置 `pos.x` からパレットで決めています。",
        en: "Below, we bend space first and then repeat 11 thin slabs along the bent coordinate. Before bending they would stand in a straight row; in bent space they fan out. The color comes from the position `pos.x` through a palette.",
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

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          vec3 q = p;
          float k = 0.6 * sin(time * 0.8);                  //ja: 曲げの強さ //en: bend strength
          q.xy = rot(q.x * k) * q.xy;                       //ja: x に比例した角度で xy 平面を回す //en: turn the xy plane by an angle that grows with x
          q.x -= 0.3 * clamp(round(q.x / 0.3), -5.0, 5.0);  //ja: 板を 11 枚並べる //en: line up 11 slabs
          return sdBox(q, vec3(0.06, 0.7, 0.3)) - 0.02;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = 0.4 + 0.3 * sin(time * 0.3);
          vec3 ro = vec3(3.6 * sin(a), 0.6, -3.6 * cos(a));
          vec3 ta = vec3(0.0, 0.1, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d * 0.7;
          }

          vec3 col = mix(vec3(0.95, 0.9, 0.85), vec3(0.7, 0.75, 0.85), uv.y);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.5, 0.8, -0.6));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 albedo = palette(pos.x * 0.25 + 0.5, vec3(0.5), vec3(0.45), vec3(1.0), vec3(0.0, 0.33, 0.67));
            col = albedo * (dif * vec3(1.0, 0.95, 0.9) + amb * vec3(0.35, 0.35, 0.45));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.6`(曲げの強さ)を `1.2` にすると、ぐるりと輪に近づきます。`rot(q.x * k)` を `rot(q.y * k)` にすると?",
        en: "Change the bend strength `0.6` to `1.2` and the fan curls almost into a ring. What happens with `rot(q.y * k)` instead of `rot(q.x * k)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "曲げも距離をゆがめるので、ここでも歩幅を `0.7` に割り引いています。曲げを強くするときは、この数も一緒に下げてください。",
        en: "Bending distorts distances too, so the step is discounted to `0.7` here as well. When you bend harder, lower this number along with it.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`q.x += sin(q.z * 0.5)` のように、回すのではなく位置をずらす変形もよく使います。まっすぐな通路が、ヘビのようにくねった道になります。[トンネルと飛行](/learn/tunnels) で、この道に沿ってカメラを飛ばします。",
        en: "Shifting instead of rotating, as in `q.x += sin(q.z * 0.5)`, is another common deformation. It turns a straight corridor into a snaking path; in [Tunnels and flight](/learn/tunnels) we fly the camera along one.",
      },
    },

    { type: "heading", text: { ja: "表面を波打たせる", en: "Rippling the surface" } },
    {
      type: "paragraph",
      text: {
        ja: "座標ではなく、**距離そのもの** に小さな値を足す方法もあります。距離に正の値を足したところは表面が内側へへこみ、負の値を足したところは外側へふくらみます。`sin` を 3 つかけた値を足すと、球の表面がでこぼこに波打ちます。",
        en: "You can also add a small value to **the distance itself** instead of moving the coordinates. Where you add a positive value, the surface sinks inward; where you add a negative value, it bulges outward. Add the product of three `sin` waves and the sphere's surface ripples.",
      },
    },
    {
      type: "playground",
      source: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float wave(vec3 p) {
          return sin(8.0 * p.x + time * 2.0) * sin(8.0 * p.y) * sin(8.0 * p.z);
        }

        float map(vec3 p) {
          float d = length(p) - 1.0;
          d += 0.05 * wave(p);  //ja: 表面を内と外へ少し動かす //en: push the surface in and out a little
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.6, -3.2);
          vec3 ta = vec3(0.0, 0.0, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d * 0.7;
          }

          vec3 col = mix(vec3(0.05, 0.08, 0.1), vec3(0.0, 0.02, 0.05), uv.y);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.6, 0.7, -0.5));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            float spe = pow(max(dot(n, normalize(l - rd)), 0.0), 48.0);
            //ja: へこみは深い青、ふくらみは明るい水色 //en: dents deep blue, bumps bright aqua
            vec3 albedo = mix(vec3(0.05, 0.2, 0.6), vec3(0.3, 0.9, 0.8), 0.5 - 0.5 * wave(pos));
            col = albedo * (dif + 0.3 * amb) + 0.6 * spe;
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`8.0` を 3 つとも `16.0` にすると細かいさざ波に。`0.05` を `0.15` にすると? (欠けたら `0.7` も下げる)",
        en: "Change all three `8.0`s to `16.0` for fine ripples. What about `0.05` → `0.15`? (If it tears, lower the `0.7` too)",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "これも距離を不正確にします。足した波の傾きは、大きさ × 細かさ、つまり 0.05 × 8.0 = 0.4 くらいまであります。点が 1 動くと距離の値が 1.4 くらいまで変わりうるので、1 ÷ 1.4 ≈ 0.7 に割り引けば足ります。波を大きく、細かくするほど、割り引きを大きくする必要があります。",
        en: "This also bends the truth about distance. The slope of the added wave is about size × frequency: 0.05 × 8.0 = 0.4. When a point moves by 1, the distance value can now change by up to about 1.4, so a discount of 1 ÷ 1.4 ≈ 0.7 is enough. Bigger or finer waves need a bigger discount.",
      },
    },

    { type: "heading", text: { ja: "どこまでも続く柱の森", en: "A forest of endless pillars" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの技を 1 つの場面にまとめます。柱を x と z でくり返し、マスごとの乱数でねじれの強さと向き、回る速さ、色を変えます。柱は上へどこまでも伸ばし(高さを 50 にしているだけです)、形の大きさはどのマスも同じなので、隣のマスの心配はありません。ねじれのぶん、歩幅は 0.7 に割り引きます。",
        en: "Let's combine everything into one scene. Pillars repeat in x and z, and each cell's random value sets its twist strength and direction, its spin speed and its color. The pillars rise forever (their height is simply 50). Every cell has the same size of shape, so the neighbor problem does not arise. The twist calls for a 0.7 step discount.",
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

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          float s = 3.0;
          vec2 id = round(p.xz / s);
          vec3 q = p;
          q.xz -= s * id;
          float h = hash21(id);
          float k = (h - 0.5) * 3.0;                         //ja: マスごとのねじれ(向きも) //en: per-cell twist, direction included
          q.xz = rot(q.y * k + time * (h - 0.5)) * q.xz;     //ja: ねじって、ゆっくり回す //en: twist, and spin slowly
          float pillar = sdBox(q, vec3(0.35, 50.0, 0.35)) - 0.05;
          return min(pillar, p.y);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(1.5, 1.2, time * 0.8);
          vec3 ta = ro + vec3(0.5, 0.25, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.3));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 25.0) break;
            t += d * 0.7;
          }

          vec3 fog = mix(vec3(1.0, 0.62, 0.45), vec3(0.28, 0.22, 0.5), clamp(rd.y * 1.5, 0.0, 1.0));
          vec3 col = fog;
          if (t < 25.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float h = hash21(round(pos.xz / 3.0));
            vec3 albedo = palette(h * 0.5, vec3(0.55), vec3(0.4), vec3(1.0), vec3(0.0, 0.15, 0.35));
            if (pos.y < 0.01) albedo = vec3(0.3, 0.25, 0.28);
            vec3 l = normalize(vec3(-0.5, 0.4, 0.8));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = albedo * (dif * vec3(1.3, 0.95, 0.7) + amb * vec3(0.2, 0.2, 0.4));
            col = mix(col, fog, 1.0 - exp(-0.12 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "柱の太さの `0.35` を 2 つとも `0.6` にすると? `(h - 0.5) * 3.0` の `3.0` を `6.0` にすると? (欠けたら `0.7` を下げる)",
        en: "What if both `0.35`s (the pillar thickness) become `0.6`? What about changing the `3.0` in `(h - 0.5) * 3.0` to `6.0`? (If it tears, lower the `0.7`)",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`round(p.xz / s)` … マスの番号。くり返しと乱数の両方に使う",
          en: "`round(p.xz / s)` … the cell number, used for both repetition and randomness",
        },
        {
          ja: "`rot(q.y * k + …)` … 高さで角度を変えてねじる。時間を足すと回り出す",
          en: "`rot(q.y * k + …)` … an angle that changes with height makes a twist; adding time makes it spin",
        },
        {
          ja: "`t += d * 0.7` … 変形で大きめに出た距離を割り引く",
          en: "`t += d * 0.7` … discounts the distance that the deformation overstated",
        },
        {
          ja: "`mix(col, fog, …)` … 遠くを霧に溶かして、終わりの無さを見せる",
          en: "`mix(col, fog, …)` … fades the distance into fog so the scene feels endless",
        },
      ],
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "くり返しと変形を、自分の手で組み合わせてみましょう。どれも土台のコードは動く状態から始まります。歩幅の割り引きが必要かどうかも、自分で確かめてください。",
        en: "Now combine repetition and deformation yourself. Each starter already runs. Check for yourself whether you need to discount the step.",
      },
    },
    {
      type: "exercise",
      title: { ja: "色とりどりの球", en: "Colorful spheres" },
      prompt: {
        ja: "どこまでも並ぶ球が、今は全部同じオレンジ色です。マスの番号を使って、球ごとに違う色(色相)にしてください。カメラが進んでも、同じ球は同じ色のままにします。",
        en: "The endless spheres are all the same orange. Use the cell number to give each sphere its own hue. A sphere must keep its color as the camera moves past it.",
      },
      starter: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float s = 2.0;
          vec3 q = p - s * round(p / s);
          return sdSphere(q, 0.4);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(1.0, 1.0, time * 1.5);
          vec3 ta = ro + vec3(0.4, 0.3, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 fog = vec3(0.05, 0.06, 0.14);
          vec3 col = fog;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 albedo = vec3(1.0, 0.55, 0.25);  //ja: ここを球ごとの色にする //en: make this a per-sphere color
            vec3 l = normalize(vec3(0.5, 0.8, -0.4));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = albedo * (dif + 0.3 * amb);
            col = mix(col, fog, 1.0 - exp(-0.15 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float s = 2.0;
          vec3 q = p - s * round(p / s);
          return sdSphere(q, 0.4);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(1.0, 1.0, time * 1.5);
          vec3 ta = ro + vec3(0.4, 0.3, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 fog = vec3(0.05, 0.06, 0.14);
          vec3 col = fog;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            //ja: 当たった点から、球のマスの番号(3 つの整数)をもう一度計算する
            //en: work out the sphere's cell number (three whole numbers) again from the hit point
            vec3 id = round(pos / 2.0);
            //ja: hash21 は vec2 を受け取るので、z を混ぜて 2 つにまとめる
            //en: hash21 takes a vec2, so fold z into the other two
            float h = hash21(id.xy + id.z * 17.0);
            vec3 albedo = hsv2rgb(vec3(h, 0.65, 1.0));
            vec3 l = normalize(vec3(0.5, 0.8, -0.4));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = albedo * (dif + 0.3 * amb);
            col = mix(col, fog, 1.0 - exp(-0.15 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "球のマスの番号は、当たった点 `pos` から `round(pos / s)` で求められます(`s` は 2.0)",
          en: "You can get the sphere's cell number from the hit point `pos` with `round(pos / s)` (`s` is 2.0)",
        },
        {
          ja: "番号は `vec3` ですが `hash21` は `vec2` を受け取ります。`id.xy + id.z * 17.0` のように 3 つを 2 つにまとめましょう",
          en: "The number is a `vec3`, but `hash21` takes a `vec2`. Squeeze three into two, for example `id.xy + id.z * 17.0`",
        },
        {
          ja: "`vec3 albedo = hsv2rgb(vec3(hash21(id.xy + id.z * 17.0), 0.65, 1.0));`",
          en: "`vec3 albedo = hsv2rgb(vec3(hash21(id.xy + id.z * 17.0), 0.65, 1.0));`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "3×3×3 のキューブ", en: "A 3×3×3 cube of cubes" },
      prompt: {
        ja: "真ん中に 1 つだけある小さな立方体を、縦・横・奥に 3 つずつ、全部で 27 個並べてください。全体はゆっくり回り、1 つずつの立方体もそれぞれ違う向き・速さで回るようにします。",
        en: "There is one small cube in the middle. Turn it into 27 cubes, three along each axis. The whole block turns slowly, and each cube also spins in its own direction at its own speed.",
      },
      starter: `
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

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          p.xz = rot(time * 0.3) * p.xz;  //ja: 全体をゆっくり回す //en: turn the whole block slowly
          vec3 q = p;                     //ja: ここでくり返す //en: repeat here
          return sdBox(q, vec3(0.2)) - 0.03;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(2.2, 2.0, -3.4);
          vec3 ta = vec3(0.0, 0.0, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = mix(vec3(0.1, 0.1, 0.16), vec3(0.02, 0.02, 0.05), uv.y);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(0.5, 0.8, -0.4));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = vec3(0.9, 0.85, 0.8) * (dif + 0.3 * amb);
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        //ja: 全体を回したあとの座標でのマスの番号(色を付けるときにも使う)
        //en: the cell number in the turned coordinates (also used for coloring)
        vec3 cellId(vec3 p) {
          return clamp(round(p / 0.9), -1.0, 1.0);
        }

        float map(vec3 p) {
          p.xz = rot(time * 0.3) * p.xz;
          vec3 id = cellId(p);
          vec3 q = p - 0.9 * id;  //ja: -1〜1 の 3 つずつに限ったくり返し //en: repetition limited to -1..1 on each axis
          float h = hash21(id.xy + id.z * 17.0);
          //ja: マスごとに違う速さで 2 つの平面を回す(回しても角がマスからはみ出ない大きさ)
          //en: spin two planes at a per-cell speed (the cube is small enough that its corners stay inside the cell)
          q.xy = rot(time * (h - 0.5) * 3.0) * q.xy;
          q.yz = rot(time * h) * q.yz;
          return sdBox(q, vec3(0.2)) - 0.03;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(2.2, 2.0, -3.4);
          vec3 ta = vec3(0.0, 0.0, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = mix(vec3(0.1, 0.1, 0.16), vec3(0.02, 0.02, 0.05), uv.y);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 pp = pos;
            pp.xz = rot(time * 0.3) * pp.xz;  //ja: map と同じように回してから番号を求める //en: turn it the same way as in map before finding the number
            vec3 id = cellId(pp);
            vec3 albedo = palette(hash21(id.xy + id.z * 17.0), vec3(0.6), vec3(0.4), vec3(1.0), vec3(0.0, 0.33, 0.67));
            vec3 l = normalize(vec3(0.5, 0.8, -0.4));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = albedo * (dif + 0.3 * amb);
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "3 つの向き全部を、-1〜1 の 3 つに限ってくり返します。`clamp(round(p / s), -1.0, 1.0)` がマスの番号です",
          en: "Repeat all three axes, limited to the three cells -1 to 1. `clamp(round(p / s), -1.0, 1.0)` is the cell number",
        },
        {
          ja: "立方体を回すと角がはみ出します。半分の大きさ 0.23 の立方体の角は中心から約 0.4 なので、間隔 `s` は 0.8 より大きく(0.9 など)します",
          en: "A spinning cube's corners stick out. A cube 0.23 on each side of its center reaches about 0.4 at the corners, so make the spacing `s` larger than 0.8 (0.9, say)",
        },
        {
          ja: "`float h = hash21(id.xy + id.z * 17.0);` を作り、`q.xy = rot(time * (h - 0.5) * 3.0) * q.xy;` のように、マスごとに違う速さで回します",
          en: "Make `float h = hash21(id.xy + id.z * 17.0);` and spin at a per-cell speed, as in `q.xy = rot(time * (h - 0.5) * 3.0) * q.xy;`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "どこまでも続く森", en: "An endless forest" },
      prompt: {
        ja: "1 本だけ立っている木を、どこまでも続く森にしてください。木はマスの真ん中にきっちり並ぶのではなく、少しずつ位置がずれ、大きさもばらばらにします。建物が切れたときと同じ問題が起きないように気をつけてください。",
        en: "Turn the single tree into an endless forest. The trees should not sit exactly in the middle of their cells: shift each one a little and vary their sizes. Watch out for the same problem that sliced the buildings.",
      },
      starter: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        vec2 hash22(vec2 p) {
          vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
          a += dot(a, a + 34.45);
          return fract(vec2(a.x * a.y, a.y * a.z));
        }

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float tree(vec3 q, float size) {
          float trunk = sdCylinder(q - vec3(0.0, 0.5 * size, 0.0), 0.08 * size, 0.5 * size);
          float leaves = sdSphere(q - vec3(0.0, 1.2 * size, 0.0), 0.5 * size);
          return smin(trunk, leaves, 0.1);
        }

        float map(vec3 p) {
          vec3 q = p;          //ja: ここでくり返す //en: repeat here
          float size = 1.0;    //ja: ここをマスごとに変える //en: vary this per cell
          return min(tree(q, size), p.y);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.5, time * 0.8 - 3.0);
          vec3 ta = ro + vec3(0.0, -0.6, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 fog = vec3(0.75, 0.85, 0.9);
          vec3 col = fog;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 albedo = pos.y > 0.7 ? vec3(0.25, 0.55, 0.2) : vec3(0.45, 0.3, 0.2);
            if (pos.y < 0.01) albedo = vec3(0.5, 0.45, 0.3);
            vec3 l = normalize(vec3(0.5, 0.8, -0.3));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = albedo * (dif * vec3(1.2, 1.1, 0.9) + amb * vec3(0.3, 0.35, 0.45));
            col = mix(col, fog, 1.0 - exp(-0.07 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        vec2 hash22(vec2 p) {
          vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
          a += dot(a, a + 34.45);
          return fract(vec2(a.x * a.y, a.y * a.z));
        }

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float tree(vec3 q, float size) {
          float trunk = sdCylinder(q - vec3(0.0, 0.5 * size, 0.0), 0.08 * size, 0.5 * size);
          float leaves = sdSphere(q - vec3(0.0, 1.2 * size, 0.0), 0.5 * size);
          return smin(trunk, leaves, 0.1);
        }

        float map(vec3 p) {
          float s = 2.0;
          vec2 id = round(p.xz / s);
          vec3 q = p;
          q.xz -= s * id;
          vec2 wall = q.xz;                      //ja: ずらす前の、マスの中の位置 //en: position in the cell, before the shift
          q.xz -= (hash22(id) - 0.5) * 0.6;      //ja: ±0.3 だけ位置をずらす //en: shift by up to ±0.3
          float size = 0.6 + 0.5 * hash21(id);   //ja: 0.6〜1.1 //en: 0.6 to 1.1
          float d = min(tree(q, size), p.y);
          //ja: 葉の端はマスの中心から最大 0.3 + 0.55 = 0.85。壁(1.0)まで 0.15 のすき間がある
          //en: the leaves reach at most 0.3 + 0.55 = 0.85 from the cell center, leaving a 0.15 gap to the wall at 1.0
          d = min(d, 0.5 * s - max(abs(wall.x), abs(wall.y)) + 0.15);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.5, time * 0.8 - 3.0);
          vec3 ta = ro + vec3(0.0, -0.6, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 fog = vec3(0.75, 0.85, 0.9);
          vec3 col = fog;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            //ja: 木の大きさに合わせて、幹と葉の境目の高さを決める
            //en: set the trunk/leaves boundary height to match the tree's size
            float size = 0.6 + 0.5 * hash21(round(pos.xz / 2.0));
            vec3 albedo = pos.y > 0.75 * size ? vec3(0.25, 0.55, 0.2) : vec3(0.45, 0.3, 0.2);
            if (pos.y < 0.01) albedo = vec3(0.5, 0.45, 0.3);
            vec3 l = normalize(vec3(0.5, 0.8, -0.3));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            col = albedo * (dif * vec3(1.2, 1.1, 0.9) + amb * vec3(0.3, 0.35, 0.45));
            col = mix(col, fog, 1.0 - exp(-0.07 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "柱と同じく x と z だけをくり返し、マスの番号 `id` を作ります。大きさは `hash21(id)`、ずらす量は `hash22(id) - 0.5` から作れます",
          en: "As with the pillars, repeat only x and z and keep the cell number `id`. Size can come from `hash21(id)` and the shift from `hash22(id) - 0.5`",
        },
        {
          ja: "大きさがばらばらなので、隣のマスの問題が起きます。木がマスの壁からどれだけ離れているか(すき間)を計算し、「壁までの距離 + すき間」で距離を押さえましょう。壁までの距離は、ずらす前の位置で測ります",
          en: "Varying sizes bring back the neighbor problem. Work out how far each tree stays from the cell wall (the gap) and cap the distance with \"distance to the wall + gap\". Measure the wall distance from the position before the shift",
        },
        {
          ja: "間隔 2.0・ずれ ±0.3・葉の半径 最大 0.55 なら、すき間は 1.0 - 0.85 = 0.15。`d = min(d, 0.5 * s - max(abs(wall.x), abs(wall.y)) + 0.15);`",
          en: "With spacing 2.0, a shift of ±0.3 and leaves up to 0.55 in radius, the gap is 1.0 - 0.85 = 0.15: `d = min(d, 0.5 * s - max(abs(wall.x), abs(wall.y)) + 0.15);`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`q = p - s * round(p / s)` で空間をくり返すと、1 つぶんの計算で無限に並ぶ。形はマスの半分より小さく",
          en: "`q = p - s * round(p / s)` repeats space: endless copies for the cost of one. Keep shapes under half the spacing",
        },
        {
          ja: "くり返す向きはスウィズルで選び、数は `clamp(round(p / s), -n, n)` で限る",
          en: "Pick the axes with a swizzle; limit the count with `clamp(round(p / s), -n, n)`",
        },
        {
          ja: "マスの番号を `hash21` に渡すと、1 つずつ違う物になる。大きさを変えるなら隣のマスに注意",
          en: "Pass the cell number to `hash21` to make every copy different; mind the neighbors when sizes vary",
        },
        {
          ja: "場所で変わる角度で回すと、ねじれ(y で xz を回す)や曲げ(x で xy を回す)になる。距離に波を足すと表面が波打つ",
          en: "Rotating by a position-dependent angle twists (xz by y) or bends (xy by x); adding a wave to the distance ripples the surface",
        },
        {
          ja: "変形すると `map` が距離を大きく言いすぎる。`t += d * 0.6` のように歩幅を割り引いて、欠けを防ぐ",
          en: "Deformations make `map` overstate the distance; discount the step, as in `t += d * 0.6`, to prevent tears",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "形はいくらでも増やせるようになりましたが、まだ物が地面から浮いて見えます。次の回では、光のほうへもう一度レイを飛ばして影を落とし、すき間の暗さ(アンビエントオクルージョン)で、場面に重さと奥行きを与えます。",
        en: "You can now multiply shapes without limit, but they still seem to float above the ground. Next time we cast a second ray toward the light to drop shadows, and darken the crevices with ambient occlusion, giving the scene weight and depth.",
      },
    },
  ],
};

export default lesson;
