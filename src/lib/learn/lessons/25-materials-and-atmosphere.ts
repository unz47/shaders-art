import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "materials-and-atmosphere",
  title: { ja: "質感と空気", en: "Materials and atmosphere" },
  summary: {
    ja: "素材ごとの色・反射・霧・空で、1 つの場面を仕上げる",
    en: "Finish a scene with per-material color, reflections, fog and sky",
  },
  minutes: 60,
  goals: [
    {
      ja: "`vec2 map(vec3 p)` で距離と素材の番号を一緒に返し、物ごとに色とつやを変えられる",
      en: "Return a distance and a material number together from `vec2 map(vec3 p)`, and give each object its own color and shine",
    },
    {
      ja: "床に市松模様を付け、1 回だけの反射で床や球に映りこみを足せる",
      en: "Put a checkerboard on the floor and add reflections with a single bounce",
    },
    {
      ja: "距離に応じた霧(`exp`)で、空気の遠近感を出せる",
      en: "Use distance fog (`exp`) to give the scene a sense of air and depth",
    },
    {
      ja: "空のグラデーションと太陽を描き、霧の色を空とつなげられる",
      en: "Paint a sky gradient and a sun, and tie the fog color to the sky",
    },
    {
      ja: "トーンマッピング・色の調整・ガンマの順で、1 枚の場面に仕上げられる",
      en: "Finish a complete scene with tone mapping, color grading and gamma, in that order",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "物ごとに番号を付ける", en: "Numbering your objects" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの `map` は、いちばん近い表面までの **距離** だけを返していました。でも、色を塗るときには「当たったのは床なのか、球なのか」も知りたくなります。これまでは、床かどうかを当たった点の高さで見分けたり、[3D の形を組み立てる](/learn/shapes-3d) のように部品ごとの距離を当たった点で測り直して、ほぼ 0 のものを選んだりしていました。でも測り直す方法では、同じ形の式を `map` と色を塗るところの 2 か所に書くことになり、物を動かすたびに両方を直さなければなりません。物が増えるほど、まちがいのもとになります。",
        en: "So far `map` has returned only the **distance** to the nearest surface. When it is time to color a pixel, though, you also want to know what you hit: the floor or the sphere? Until now we have either checked the height of the hit point to spot the floor, or, as in [Building 3D shapes](/learn/shapes-3d), measured each part's distance again at the hit point and picked the one near 0. But re-measuring means writing each shape's formula twice, once in `map` and once where you color, and every time you move an object you have to fix both. The more objects you have, the easier it is to slip up.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "そこで、`map` が `vec2` を返すように変えます。`x` には今までどおり距離を、`y` には **素材の番号**(床は 1、球は 2、…)を入れます。番号は自分で決めてかまいません。",
        en: "So we change `map` to return a `vec2`. `x` holds the distance as before, and `y` holds a **material number** (1 for the floor, 2 for the sphere, and so on). You choose the numbers.",
      },
    },
    {
      type: "code",
      source: `
        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);              //ja: まず床(距離, 番号) //en: start with the floor (distance, number)
          float d = sdSphere(p - vec3(0.0, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);      //ja: 球のほうが近ければ、球に入れかえる //en: if the sphere is closer, switch to the sphere
          return res;
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "和(いちばん近いものを選ぶ)を、`min` の代わりに `if (d < res.x) res = vec2(d, 番号);` で書いているのがポイントです。`min` は距離しか選べませんが、`if` なら、近いほうの距離と番号を **組で** 選べます。物を足すときは、この 2 行をくり返すだけです。",
        en: "The key is how the union (pick the nearest) is written: `if (d < res.x) res = vec2(d, number);` instead of `min`. `min` can only choose a distance, but the `if` chooses the nearer distance and its number **as a pair**. To add an object, just repeat those two lines.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`map` が `vec2` を返すようになったので、`map` を使っている関数も直します。距離が欲しいところでは `map(…).x` と書きます。レイマーチのループでは、距離で進みながら、最後に調べた点の番号 `h.y` を覚えておきます。",
        en: "Since `map` now returns a `vec2`, every function that uses it needs a small fix: wherever you want the distance, write `map(…).x`. In the raymarch loop, step by the distance and remember the number `h.y` of the last point checked.",
      },
    },
    {
      type: "code",
      source: `
        //ja: 法線: map(…) を map(…).x に
        //en: normal: map(…) becomes map(…).x
        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }
        //ja: softShadow の中: float h = map(ro + rd * t).x;
        //en: inside softShadow: float h = map(ro + rd * t).x;
        //ja: calcAO の中:     occ += (h - map(p + n * h).x) * w;
        //en: inside calcAO:     occ += (h - map(p + n * h).x) * w;

        //ja: レイマーチ: 距離で進み、番号を覚える
        //en: raymarch: step by the distance, remember the number
        float t = 0.0;
        float m = 0.0;
        for (int i = 0; i < 64; i++) {
          vec2 h = map(ro + rd * t);
          m = h.y;
          if (h.x < 0.001 || t > 40.0) break;
          t += h.x;
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "下の場面には、床・球・箱・柱の並木の 4 つの素材があります。柱は、[無限の空間と変形](/learn/infinite-space) のくり返しで奥へどこまでも並べ、[3D の形を組み立てる](/learn/shapes-3d) の対称と同じく `abs(q.x)` で左右に映して 2 列にしています。色は、番号 `m` を見て選んでいます。",
        en: "The scene below has four materials: floor, sphere, box and an avenue of pillars. The pillars repeat endlessly into the distance using the repetition from [Infinite space and deformation](/learn/infinite-space), and `abs(q.x)` mirrors them into two rows, just like the symmetry trick in [Building 3D shapes](/learn/shapes-3d). Each color is chosen by looking at the number `m`.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        //ja: 太陽の向き。あとで空にも使うので、関数の外に置く
        //en: the sun direction; it is used for the sky later, so it lives outside the functions
        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);                      //ja: 1: 床 //en: 1: floor
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);              //ja: 2: 球 //en: 2: sphere
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);              //ja: 3: 箱 //en: 3: box
          vec3 q = p;
          q.x = abs(q.x) - 3.0;                           //ja: 左右に映す //en: mirror left and right
          q.z -= 2.5 * round(q.z / 2.5);                  //ja: 奥へくり返す //en: repeat into the distance
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);              //ja: 4: 柱 //en: 4: pillars
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;                         //ja: 最後に調べた点の素材 //en: material of the last point checked
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }

          vec3 haze = vec3(0.7, 0.45, 0.35);
          vec3 col = mix(haze, vec3(0.1, 0.15, 0.35), sqrt(clamp(rd.y, 0.0, 1.0)));
          if (t < 40.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 albedo;
            if (m < 1.5) albedo = vec3(0.4);                    //ja: 床 //en: floor
            else if (m < 2.5) albedo = vec3(0.7, 0.08, 0.05);  //ja: 球 //en: sphere
            else if (m < 3.5) albedo = vec3(0.05, 0.4, 0.45);  //ja: 箱 //en: box
            else albedo = vec3(0.75, 0.72, 0.68);              //ja: 柱 //en: pillars
            float dif = max(dot(n, SUN), 0.0);
            float sky = 0.5 + 0.5 * n.y;
            col = albedo * (dif * vec3(1.6, 1.0, 0.6) + sky * vec3(0.3, 0.35, 0.5));
            col = mix(col, haze, 1.0 - exp(-0.03 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "球の色 `vec3(0.7, 0.08, 0.05)` を好きな色に。`map` の中の番号 `2.0` を `3.0` にすると、球が箱と同じ色になります",
        en: "Give the sphere `vec3(0.7, 0.08, 0.05)` a color you like. Change the number `2.0` in `map` to `3.0` and the sphere takes on the box's color",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "番号は `float` なので、比べるときは `m == 2.0` ではなく `m < 2.5` のように、番号と番号の **間** で区切ります。いまの書き方なら `==` でも動きますが、あとで `smin` で 2 つの物をなめらかにつなぐと、つなぎ目で番号が 2.3 のような半端な値になることがあり、`==` ではどれにも当たらなくなるからです。",
        en: "The number is a `float`, so compare it with a cut **between** numbers, as in `m < 2.5`, rather than `m == 2.0`. `==` would work for now, but if you later blend two objects with `smin`, the number can come out as something like 2.3 at the seam, and `==` would match nothing.",
      },
    },
    { type: "heading", text: { ja: "素材ごとの色とつや", en: "Color and shine per material" } },
    {
      type: "paragraph",
      text: {
        ja: "素材が違うと、色だけでなく **光り方** も違います。磨いた球はくっきりした白い光の点(ハイライト)を持ち、石の柱はほとんど光りません。そこで、番号から色とつやの強さをまとめて返す `material` 関数を作ります。色を `rgb` に、つやの強さを 4 つ目の `a` に入れた `vec4` です。",
        en: "Different materials differ not only in color but in **how they shine**. A polished sphere has a crisp white highlight; stone pillars barely shine at all. So we write a `material` function that returns color and shine strength together: a `vec4` with the color in `rgb` and the shine in the fourth slot, `a`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "あわせて、照明の計算を `shade` 関数にまとめます。中身は [影と奥行き](/learn/shadows-and-ao) で組み立てた太陽・空・照り返しの照明そのままで、つや(鏡面反射)に素材の `a` をかけるところだけが新しい部分です。関数にしておくと、この後の反射でも同じ計算を使い回せます。",
        en: "We also gather the lighting into a `shade` function. It is the same sun, sky and bounce lighting you built in [Shadows and depth](/learn/shadows-and-ao); the only new part is multiplying the shine (specular) by the material's `a`. Having it as a function lets us reuse it for reflections later.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        //ja: 素材の番号から、色(rgb)とつやの強さ(a)を決める
        //en: from the material number, pick a color (rgb) and a shine strength (a)
        vec4 material(vec3 pos, float m) {
          if (m < 1.5) return vec4(0.4, 0.4, 0.4, 0.2);    //ja: 床 //en: floor
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);  //ja: 球: よく光る //en: sphere: very shiny
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);  //ja: 箱: 少し光る //en: box: a little shiny
          return vec4(0.75, 0.72, 0.68, 0.05);             //ja: 柱: ほとんど光らない //en: pillars: hardly shiny
        }

        //ja: 1 つの点の明るさ。sha は影(反射の中では 1.0 を渡して省く)
        //en: the lit color of one point; sha is the shadow (pass 1.0 to skip it)
        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);  //ja: つやは素材ごと //en: shine depends on the material
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }

          vec3 haze = vec3(0.7, 0.45, 0.35);
          vec3 col = mix(haze, vec3(0.1, 0.15, 0.35), sqrt(clamp(rd.y, 0.0, 1.0)));
          if (t < 40.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);
            col = mix(col, haze, 1.0 - exp(-0.03 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`material` の球のつや `1.0` を `0.0` にすると、ゴムのような質感に。柱の `0.05` を `1.0` にすると?",
        en: "Set the sphere's shine `1.0` in `material` to `0.0` and it looks like rubber. What if the pillars' `0.05` becomes `1.0`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "太陽は画面の奥、左上にあるので、物は後ろから照らされています。手前の面は空の青と床の照り返しだけで照らされ、ふちに太陽の光が回りこみます。夕方の逆光の場面です。",
        en: "The sun is far ahead, up to the left, so the objects are lit from behind. The faces toward us get only the blue of the sky and the bounce from the floor, while sunlight wraps around the edges: an evening scene in backlight.",
      },
    },
    { type: "heading", text: { ja: "市松の床", en: "A checkered floor" } },
    {
      type: "paragraph",
      text: {
        ja: "床に模様を付けましょう。素材の色は、番号だけでなく **当たった位置** `pos` からも決められます。[くり返しとタイル](/learn/repetition) の市松模様と同じ考え方で、x と z を `floor` で整数にして足し、`mod(…, 2.0)` で 0 と 1 を交互にします。",
        en: "Let's add a pattern to the floor. A material's color can depend not only on the number but also on **where** it was hit, `pos`. It is the same idea as the checkerboard in [Repetition and tiles](/learn/repetition): round x and z down with `floor`, add them, and `mod(…, 2.0)` alternates between 0 and 1.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "たとえば `pos` が (2.3, 0, 5.8) なら、`floor` で 2 と 5、足して 7、`mod(7.0, 2.0)` で 1 なので明るいマスです。x が 1 増えて (3.3, 0, 5.8) になると 3 + 5 = 8 で 0、暗いマスになります。",
        en: "For example, if `pos` is (2.3, 0, 5.8), `floor` gives 2 and 5, which add to 7, and `mod(7.0, 2.0)` is 1: a light tile. Move x up by one to (3.3, 0, 5.8) and you get 3 + 5 = 8, which gives 0: a dark tile.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);  //ja: マスごとに 0 と 1 が交互 //en: alternates 0 and 1 from tile to tile
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }

          vec3 haze = vec3(0.7, 0.45, 0.35);
          vec3 col = mix(haze, vec3(0.1, 0.15, 0.35), sqrt(clamp(rd.y, 0.0, 1.0)));
          if (t < 40.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);
            col = mix(col, haze, 1.0 - exp(-0.03 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`floor(pos.x)` を `floor(pos.x * 2.0)` に、`floor(pos.z)` を `floor(pos.z * 2.0)` にすると、マスが半分の大きさに",
        en: "Change `floor(pos.x)` to `floor(pos.x * 2.0)` and `floor(pos.z)` to `floor(pos.z * 2.0)` to halve the tile size",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "遠くのマスは 1 ピクセルより小さくなり、ちらついたり、しま模様(モアレ)が出たりします。このあと足す霧と反射が、遠くの模様をやわらげてくれます。それでも気になるときは、距離に応じて 2 色の差を小さくしていくのが手軽な対策です。",
        en: "Far-away tiles shrink below a pixel and start to shimmer or form moiré stripes. The fog and reflections we add next soften the distant pattern. If it still bothers you, an easy fix is to shrink the difference between the two colors with distance.",
      },
    },
    { type: "heading", text: { ja: "1 回だけの反射", en: "One bounce of reflection" } },
    {
      type: "paragraph",
      text: {
        ja: "磨いた床や球には、周りの景色が映りこみます。映りこみの色は「その点から、鏡のように跳ね返った向きを見たときの色」です。跳ね返った向きは、GLSL の `reflect(rd, n)` で求められます。視線 `rd` を、法線 `n` を軸に折り返した向きです。",
        en: "Polished floors and spheres reflect their surroundings. The reflected color is \"the color you would see looking from that point in the mirrored direction\". GLSL gives you that direction with `reflect(rd, n)`: the view direction `rd` flipped around the normal `n`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "あとは、その向きに **もう一度レイマーチ** をして、当たった物を `shade` で照らすだけです。何にも当たらなければ空の色を使います。同じループを 2 回書かずにすむよう、レイマーチを `march` 関数にまとめ、進んだ距離と素材の番号を `vec2` で返すようにしました。出発点を表面から少し浮かせる(`pos + n * 0.01`)のは、影のレイと同じ理由です。",
        en: "Then **raymarch once more** in that direction and light whatever you hit with `shade`. If you hit nothing, use the sky color. So that we don't write the same loop twice, the raymarch now lives in a `march` function that returns the distance traveled and the material number as a `vec2`. Starting slightly off the surface (`pos + n * 0.01`) is for the same reason as with shadow rays.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "映りこみの強さ `refl` は素材ごとに決めます。磨いた床と球は映り、箱と石の柱は映りません。映らない素材では 2 回目のレイマーチそのものが要らないので、`if (refl > 0.0)` の中に入れて省いています。",
        en: "The reflection strength `refl` is set per material: the polished floor and sphere reflect, the box and the stone pillars do not. Materials that don't reflect don't need the second raymarch at all, so it lives inside `if (refl > 0.0)` and gets skipped.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          return mix(vec3(0.7, 0.45, 0.35), vec3(0.1, 0.15, 0.35), sqrt(clamp(rd.y, 0.0, 1.0)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 haze = vec3(0.7, 0.45, 0.35);
          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;                //ja: 映りこみの強さ(素材ごと) //en: reflection strength (per material)
            if (m < 1.5) refl = 0.25;        //ja: 床 //en: floor
            else if (m < 2.5) refl = 0.3;    //ja: 球 //en: sphere
            if (refl > 0.0) {                //ja: 映らない素材では省く //en: skip it for materials that don't reflect
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);  //ja: 斜めから見るほど強く映る //en: grazing angles reflect more
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);      //ja: 鏡のように跳ね返った向き //en: the mirrored direction
              vec3 ro2 = pos + n * 0.01;     //ja: 表面から少し浮かせて出発 //en: start a little off the surface
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);  //ja: 映りこみの中は影を省く //en: skip shadows inside the reflection
                rcol = mix(rcol, haze, 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, haze, 1.0 - exp(-0.03 * hit.x));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "床の `0.25` を `0.6` にすると、濡れた床のように。球の `0.3` を `0.9` にすると鏡の球になります",
        en: "Change the floor's `0.25` to `0.6` for a wet-looking floor. Change the sphere's `0.3` to `0.9` and it becomes a mirror ball",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`fre` は **フレネル** と呼ばれる効果です。水面を真上から見ると底が透けて見えるのに、遠くの水面は空を映して光って見えますね。どんな物も、斜めから見るほど強く映りこみます。`1.0 - dot(n, -rd)` は、正面から見ると 0、真横からかすめて見ると 1 に近づくので、それを 5 乗して映りこみの強さに足しています。正面(`dot` が 1)なら 0、`dot` が 0.2 の斜めなら 0.8 の 5 乗で約 0.33 が足されます。",
        en: "`fre` is the **Fresnel** effect. Look straight down at water and you see the bottom, but water in the distance mirrors the sky and shines. Everything reflects more strongly the more obliquely you look at it. `1.0 - dot(n, -rd)` is 0 when you look head-on and approaches 1 at a grazing angle, so we raise it to the fifth power and add it to the reflection strength. Head-on (`dot` = 1) adds 0; at a slant where `dot` is 0.2, it adds 0.8 to the fifth, about 0.33.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "反射の中でさらに反射させたくなりますが、GLSL の関数は自分自身を呼べません(再帰ができません)。2 回目の反射が欲しければ、ループを使って書きます。ただし反射 1 回ごとにレイマーチが 1 回増え、重さはその分ふえます。ここでは、映りこみの中の点には影を付けず(`sha` に 1.0 を渡す)、少しでも軽くしています。",
        en: "You may want reflections inside reflections, but GLSL functions cannot call themselves (no recursion). For a second bounce you would have to write it with a loop, and each bounce adds a whole raymarch to the cost. Here we also skip shadows for points seen in the reflection (passing 1.0 as `sha`) to keep it lighter.",
      },
    },
    { type: "heading", text: { ja: "霧", en: "Fog" } },
    {
      type: "paragraph",
      text: {
        ja: "遠くの景色は、青っぽく、うすくかすんで見えます。光が空気の中を進むあいだに、少しずつ散らばって弱まり、代わりに空気の色が混ざってくるからです。この **霧** は、物の大きさや並び方と並んで、遠近感を伝える大事な手がかりです。",
        en: "Distant scenery looks faded and bluish. As light travels through air it scatters and weakens little by little, and the color of the air mixes in instead. This **fog** is, alongside size and overlap, a key cue for distance.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "空気の中を 1 進むごとに、光は **同じ割合** で減っていきます。1 進むごとに 97% が残るなら、2 進めば 97% の 97%、t 進めば 97% の t 乗です。これを指数関数で書いたのが `exp(-k * t)` で、残る光の割合を表します。霧の濃さはその残り、`1.0 - exp(-k * t)` です。",
        en: "For every unit light travels through air, it loses **the same fraction**. If 97% survives each unit, then 97% of 97% survives two units, and 97% to the power t survives t units. Written with the exponential function, that is `exp(-k * t)`: the fraction of light that remains. The fog amount is the rest, `1.0 - exp(-k * t)`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`k` が 0.03 なら、距離 4 の箱では霧が 11%、距離 20 の柱では 45%、40 では 70% です。近くはくっきり、遠くほどなめらかに霧の色に近づきます。下の絵は、比べやすいように右半分だけに霧をかけています。左半分では、40 で打ち切った床の端が、空との境目にくっきり見えてしまいます。",
        en: "With `k` = 0.03, the box at distance 4 gets 11% fog, a pillar at 20 gets 45%, and 40 gets 70%. Near things stay crisp, and things fade smoothly toward the fog color with distance. For comparison, the picture below fogs only its right half. On the left half you can see the floor stop abruptly at 40, leaving a hard edge against the sky.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          return mix(vec3(0.7, 0.45, 0.35), vec3(0.1, 0.15, 0.35), sqrt(clamp(rd.y, 0.0, 1.0)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 haze = vec3(0.7, 0.45, 0.35);
          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.25;
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, haze, 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            float fog = 1.0 - exp(-0.03 * hit.x);  //ja: 霧の濃さ(0〜1) //en: fog amount (0 to 1)
            if (p.x > 0.0) col = mix(col, haze, fog);  //ja: 右半分だけ霧をかける //en: fog only on the right half
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`float fog = …` の行の `0.03` を `0.1` にすると濃い霧、`0.01` にするとうすい霧に。`if (p.x > 0.0)` を消して、画面全体にかけましょう",
        en: "In the `float fog = …` line, change `0.03` to `0.1` for thick fog or `0.01` for a light haze. Then delete `if (p.x > 0.0)` to fog the whole picture",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "霧は、映りこみの色(`rcol`)にもかけています。映りこみの中の物も、反射した点からさらに `hit2.x` だけ離れているからです。忘れると、映りこみの中の遠くの柱だけがくっきり浮いて見えます。",
        en: "We also fog the reflected color (`rcol`), because objects seen in a reflection are another `hit2.x` away from the reflecting point. Forget it and the distant pillars in the reflection stand out unnaturally sharp.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "[法線と光](/learn/normals-and-lighting) の仕上げでは、`1.0 - exp(-t * t * 0.006)` のように `t` の 2 乗を使いました。1 乗の `exp(-k * t)` は、すぐ手前から同じ割合で少しずつかすみます。2 乗にすると、近くはほとんど澄んだまま、ある距離を過ぎると急にかすみます。`0.006` の 2 乗版は `t` が 4 で 9%、20 で 91% です。1 乗(`k` = 0.03)の 11% と 45% と比べると、近くは同じくらいなのに、遠くは一気に霧に沈みます。空気全体がかすむ遠景には 1 乗、手前を澄ませて遠くだけ隠したいときは 2 乗、と使い分けましょう。上のプレビューの `exp(-0.03 * hit.x)` を `exp(-0.002 * hit.x * hit.x)` に書きかえると、違いを見比べられます。",
        en: "In the finish of [Normals and lighting](/learn/normals-and-lighting) we used `t` squared: `1.0 - exp(-t * t * 0.006)`. The plain `exp(-k * t)` hazes things by the same fraction step by step, starting right in front of you. Squaring keeps nearby things almost clear, then hazes quickly past a certain distance. The squared version with `0.006` gives 9% at `t` = 4 and 91% at 20. Compared with 11% and 45% for the plain version with `k` = 0.03, the two are about the same up close, but the squared one swallows the distance in fog. Use the plain version when the whole landscape should feel hazy, and the squared one to keep the foreground clear and hide only what is far away. In the preview above, change `exp(-0.03 * hit.x)` to `exp(-0.002 * hit.x * hit.x)` to compare.",
      },
    },
    { type: "heading", text: { ja: "空と太陽", en: "Sky and sun" } },
    {
      type: "paragraph",
      text: {
        ja: "背景の空も描きこみましょう。`sky(rd)` は、見ている向き `rd` から空の色を決める関数です。地平線(`rd.y` が 0)はオレンジ、真上(`rd.y` が 1)は濃い青で、その間を `mix` でつなぎます。`sqrt` を通すのは、地平線の近くで色が速く変わるほうが本物の空に近いからです。",
        en: "Let's paint the sky behind the scene. `sky(rd)` picks a sky color from the viewing direction `rd`. The horizon (`rd.y` = 0) is orange, straight up (`rd.y` = 1) is deep blue, and `mix` joins them. We pass it through `sqrt` because a real sky changes color faster near the horizon.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "太陽は、視線と太陽の向きの近さ `dot(rd, SUN)` で描きます。太陽の方向を見ると 1、離れるほど小さくなる値です。これを大きく累乗すると、太陽の方向だけが光ります。512 乗なら、太陽から 2 度ずれると 0.73、5 度で 0.14、10 度でほぼ 0 になり、小さな円盤になります。6 乗なら 30 度ずれても 0.42 残るので、大きく広がるにじみになります。",
        en: "The sun comes from how closely the view lines up with the sun direction, `dot(rd, SUN)`: 1 when looking right at the sun, smaller as you look away. Raise it to a high power and only the sun's direction lights up. To the 512th power, it is 0.73 at 2 degrees from the sun, 0.14 at 5 degrees and almost 0 at 10 degrees: a small disc. To the 6th power, 0.42 remains even at 30 degrees, giving a wide glow.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "そして、霧の色を一定の色ではなく、**その向きの空の色** `sky(rd)` にします。太陽のほうを向いた霧は明るいオレンジに、反対側の霧は落ち着いた色になり、遠くの物が空に自然に溶けこみます。物を照らす太陽の向き `SUN` と、空に描く太陽の向きが同じなので、影の向きや床の映りこみとも話が合います。",
        en: "Then make the fog color not a constant but **the sky color in that direction**, `sky(rd)`. Fog looking toward the sun glows bright orange, fog on the other side is calmer, and distant objects melt naturally into the sky. Since the sun that lights the objects and the sun painted in the sky share the same `SUN` direction, the shadows and reflections all agree.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          //ja: 地平線(オレンジ)から天頂(青)へ。sqrt で地平線の近くを速く変える
          //en: from the horizon (orange) up to the zenith (blue); sqrt makes it change faster near the horizon
          vec3 col = mix(vec3(0.7, 0.4, 0.3), vec3(0.08, 0.13, 0.32), sqrt(clamp(rd.y, 0.0, 1.0)));
          float s = max(dot(rd, SUN), 0.0);                    //ja: 太陽の方向なら 1 //en: 1 toward the sun
          col += vec3(1.0, 0.45, 0.15) * pow(s, 6.0) * 0.8;    //ja: 広い光のにじみ //en: a wide glow
          col += vec3(1.0, 0.9, 0.7) * pow(s, 512.0) * 6.0;    //ja: 太陽の円盤 //en: the sun's disc
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.25;
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, sky(rr), 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, sky(rd), 1.0 - exp(-0.03 * hit.x));  //ja: 霧の色は、その向きの空の色 //en: the fog takes the sky's color in that direction
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`SUN` の y の `0.25` を `0.05` にすると、太陽が地平線に近づき、影が長くなります。`512.0` を `64.0` にすると太陽が大きく",
        en: "Change the y of `SUN` from `0.25` to `0.05` to lower the sun toward the horizon and lengthen the shadows. Change `512.0` to `64.0` for a bigger sun",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "太陽の円盤は `6.0` 倍と、1.0 よりずっと明るくしてあります。このままだと 1.0 で切り詰められて白くつぶれますが、次の仕上げのトーンマッピングで、明るさの差を残したまま画面に収めます。",
        en: "The sun's disc is boosted to `6.0`, far brighter than 1.0. For now it is clipped at 1.0 and flattens into white, but the tone mapping in the next step squeezes it onto the screen while keeping the difference in brightness.",
      },
    },
    { type: "heading", text: { ja: "色を仕上げる", en: "Finishing the color" } },
    {
      type: "paragraph",
      text: {
        ja: "最後に、計算した明るさを画面の色に直す仕上げをします。[光と仕上げ](/learn/light-and-glow) で決めた「場面 → 露出 → トーンマッピング → ビネット → ガンマ補正 → グレイン」の順番に、トーンマッピングの後の **色の調整** を 1 段足します。順番を入れかえると結果が変わるので、いつも同じ順にしておくと迷いません。",
        en: "Finally, we turn the computed light into screen colors. We follow the order from [Light and finishing](/learn/light-and-glow) — scene → exposure → tone mapping → vignette → gamma correction → grain — and add one step, **color grading**, right after tone mapping. Changing the order changes the result, so keeping the same order every time saves a lot of guesswork.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "場面 … 照明と霧まで。値は 1.0 を超えてもよい", en: "Scene … lighting and fog; values may exceed 1.0" },
        { ja: "露出とトーンマッピング … `1.0 - exp(-col * 露出)` で、明るすぎる値を 1.0 未満に収める", en: "Exposure and tone mapping … `1.0 - exp(-col * exposure)` squeezes overly bright values below 1.0" },
        { ja: "色の調整 … コントラスト・彩度・色味。0〜1 に収まった値で行う", en: "Color grading … contrast, saturation and tint, done on values already in 0 to 1" },
        { ja: "ビネット … 画面のすみを少し暗くする", en: "Vignette … darken the corners a little" },
        { ja: "ガンマ補正 … `pow(col, vec3(1.0 / 2.2))`。グレインを足すなら、その後に", en: "Gamma correction … `pow(col, vec3(1.0 / 2.2))`; if you add grain, it comes after this" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "コントラストの `col * col * (3.0 - 2.0 * col)` は、`smoothstep` の中身と同じ S 字のカーブです。0.25 は 0.16 に下がり、0.75 は 0.84 に上がり、0.5 はそのままです。暗いところはより暗く、明るいところはより明るくなります。彩度は、色を灰色(明るさ `dot(col, vec3(0.299, 0.587, 0.114))`)から 1.2 倍遠ざけて強めています。1.0 を超える倍率は 0〜1 からはみ出すことがあるので、ガンマの前に `clamp` で収めます。",
        en: "The contrast step `col * col * (3.0 - 2.0 * col)` is the same S-curve as inside `smoothstep`: 0.25 drops to 0.16, 0.75 rises to 0.84, and 0.5 stays put. Darks get darker and lights get lighter. Saturation pushes the color 1.2 times farther from its gray (the brightness `dot(col, vec3(0.299, 0.587, 0.114))`). A factor above 1.0 can push values outside 0 to 1, so we `clamp` before gamma.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          vec3 col = mix(vec3(0.7, 0.4, 0.3), vec3(0.08, 0.13, 0.32), sqrt(clamp(rd.y, 0.0, 1.0)));
          float s = max(dot(rd, SUN), 0.0);
          col += vec3(1.0, 0.45, 0.15) * pow(s, 6.0) * 0.8;
          col += vec3(1.0, 0.9, 0.7) * pow(s, 512.0) * 6.0;
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.25;
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, sky(rr), 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, sky(rd), 1.0 - exp(-0.03 * hit.x));
          }
          col = 1.0 - exp(-col * 1.1);                                     //ja: トーンマッピング //en: tone mapping
          col = col * col * (3.0 - 2.0 * col);                             //ja: コントラスト(S 字) //en: contrast (S-curve)
          col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.2);  //ja: 彩度を上げる //en: boost saturation
          col *= vec3(1.05, 1.0, 0.92);                                    //ja: 少し暖かく //en: a little warmer
          col *= 0.5 + 0.5 * pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2);  //ja: ビネット //en: vignette
          col = clamp(col, 0.0, 1.0);
          col = pow(col, vec3(1.0 / 2.2));                                 //ja: ガンマ補正 //en: gamma correction
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "仕上げの行を 1 つずつ `//` で消して、違いを見比べましょう。露出の `1.1` を `2.0` にすると?",
        en: "Comment out the finishing lines one at a time with `//` and compare. What happens if the exposure `1.1` becomes `2.0`?",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "ガンマ補正の後に光を足したりかけたりすると、照明の計算と見た目が合わなくなります。光の計算はすべてガンマの前に済ませ、`pow(col, vec3(1.0 / 2.2))` は 1 回だけ、と決めておきましょう。ガンマの後に置くのは、画面の上のざらつきであるフィルムグレインくらいです。",
        en: "Adding or multiplying light after gamma makes the image disagree with your lighting math. Do all the light math before gamma, and apply `pow(col, vec3(1.0 / 2.2))` exactly once. About the only thing that belongs after gamma is film grain, a texture on top of the screen.",
      },
    },
    { type: "heading", text: { ja: "1 枚の場面にまとめる", en: "Putting it all together" } },
    {
      type: "paragraph",
      text: {
        ja: "全部がそろいました。最後に少しだけ動きを足します。球をゆっくり浮き沈みさせ、カメラを左右に揺らします。球が浮くと、床の影が離れ、映りこみも一緒に動きます。ここまでの技がそれぞれの役目を果たしているのを確かめてください。",
        en: "Everything is in place. As a last touch, add a little motion: the sphere bobs slowly up and down and the camera drifts side to side. As the sphere lifts, its shadow separates and its reflection moves with it. Check that each technique is doing its job.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.95 + 0.15 * sin(time * 1.2), 1.0), 0.7);  //ja: 球が浮き沈みする //en: the sphere bobs up and down
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          vec3 col = mix(vec3(0.7, 0.4, 0.3), vec3(0.08, 0.13, 0.32), sqrt(clamp(rd.y, 0.0, 1.0)));
          float s = max(dot(rd, SUN), 0.0);
          col += vec3(1.0, 0.45, 0.15) * pow(s, 6.0) * 0.8;
          col += vec3(1.0, 0.9, 0.7) * pow(s, 512.0) * 6.0;
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.8 * sin(time * 0.3), 1.3, -3.0);  //ja: カメラがゆっくり左右に揺れる //en: the camera drifts slowly side to side
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.25;
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, sky(rr), 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, sky(rd), 1.0 - exp(-0.03 * hit.x));
          }
          col = 1.0 - exp(-col * 1.1);
          col = col * col * (3.0 - 2.0 * col);
          col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.2);
          col *= vec3(1.05, 1.0, 0.92);
          col *= 0.5 + 0.5 * pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2);
          col = clamp(col, 0.0, 1.0);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "球の浮き沈みの `0.15` を `0.4` にすると? カメラの揺れ `0.8` を `2.0` にすると、柱の並木がよく見えます",
        en: "What if the bobbing `0.15` becomes `0.4`? Change the camera drift `0.8` to `2.0` for a better look at the avenue of pillars",
      },
    },
    {
      type: "list",
      items: [
        { ja: "`vec2 map` … 距離と素材の番号。物ごとの色とつやは `material` で", en: "`vec2 map` … distance plus material number; per-object color and shine come from `material`" },
        { ja: "`softShadow` と `calcAO` … 床に落ちる影と、すき間の暗さ", en: "`softShadow` and `calcAO` … the shadows on the floor and the darkness in the gaps" },
        { ja: "`reflect` と 2 回目の `march` … 床と球の映りこみ。フレネルで斜めほど強く", en: "`reflect` and a second `march` … reflections on the floor and sphere, stronger at grazing angles thanks to Fresnel" },
        { ja: "`sky(rd)` … 背景と、霧の色と、映りこみの空。太陽の向きは照明と同じ `SUN`", en: "`sky(rd)` … the background, the fog color and the sky in reflections, with the same `SUN` as the lighting" },
        { ja: "トーンマッピング → 色の調整 → ガンマ … 画面の色への仕上げ", en: "Tone mapping → color grading → gamma … the finish into screen colors" },
      ],
    },
    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "場面に素材を足したり、光り方や時間帯を変えたりしてみましょう。どの土台も、この回のプレビューのコードから始まります。",
        en: "Try adding materials, changing how things shine, and changing the time of day. Every starter comes from this lesson's previews.",
      },
    },
    {
      type: "exercise",
      title: { ja: "金の輪", en: "A golden ring" },
      prompt: {
        ja: "場面の奥(球と箱の間の後ろ)に、金色に光る立てた輪を置いてください。素材の番号は 5 にして、`material` で金色と強いつやを付けます。",
        en: "Stand a shining golden ring at the back of the scene, behind the gap between the sphere and the box. Give it material number 5, and use `material` to make it gold and very shiny.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          //ja: ここに 5 番の素材の物を足す
          //en: add an object with material 5 here
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);  //ja: 5 番の素材もここに足す //en: add material 5 here too
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }

          vec3 haze = vec3(0.7, 0.45, 0.35);
          vec3 col = mix(haze, vec3(0.1, 0.15, 0.35), sqrt(clamp(rd.y, 0.0, 1.0)));
          if (t < 40.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);
            col = mix(col, haze, 1.0 - exp(-0.03 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          vec3 r = p - vec3(0.2, 0.75, 2.4);
          d = sdTorus(r.xzy, vec2(0.55, 0.18));         //ja: 立てた輪 //en: a standing ring
          if (d < res.x) res = vec2(d, 5.0);            //ja: 5: 金 //en: 5: gold
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          if (m < 4.5) return vec4(0.75, 0.72, 0.68, 0.05);
          return vec4(1.0, 0.65, 0.2, 1.5);                  //ja: 金: 黄色く、強く光る //en: gold: yellow and very shiny
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }

          vec3 haze = vec3(0.7, 0.45, 0.35);
          vec3 col = mix(haze, vec3(0.1, 0.15, 0.35), sqrt(clamp(rd.y, 0.0, 1.0)));
          if (t < 40.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);
            col = mix(col, haze, 1.0 - exp(-0.03 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`map` に 2 行足します。距離を計算して、近ければ `res = vec2(d, 5.0);` に入れかえます",
          en: "Add two lines to `map`: compute the distance, and if it is closer, switch to `res = vec2(d, 5.0);`",
        },
        {
          ja: "輪は、[3D の形を組み立てる](/learn/shapes-3d) と同じく `sdTorus(r.xzy, vec2(0.55, 0.18))` と y と z を入れかえると立ちます。中心の高さを 0.55 + 0.18 = 0.73 くらいにすると床に乗ります",
          en: "As in [Building 3D shapes](/learn/shapes-3d), swap y and z with `sdTorus(r.xzy, vec2(0.55, 0.18))` to stand the ring up. Put its center at a height of about 0.55 + 0.18 = 0.73 so it rests on the floor",
        },
        {
          ja: "`material` の最後を `if (m < 4.5) return vec4(0.75, 0.72, 0.68, 0.05); return vec4(1.0, 0.65, 0.2, 1.5);` にします",
          en: "End `material` with `if (m < 4.5) return vec4(0.75, 0.72, 0.68, 0.05); return vec4(1.0, 0.65, 0.2, 1.5);`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "水に沈んだ神殿", en: "A flooded temple" },
      prompt: {
        ja: "床を、さざ波の立つ水面にしてください。床の形(`map`)は平らなままにして、当たった後の法線だけを時間で動く波で少し傾けます。床の映りこみも強くすると、夕日と柱の映りこみがゆらゆら揺れます。",
        en: "Turn the floor into rippling water. Keep the floor's shape in `map` flat; after the hit, tilt only its normal a little with waves that move over time. Make the floor reflect more strongly too, and the reflections of the sunset and the pillars will shimmer.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          vec3 col = mix(vec3(0.7, 0.4, 0.3), vec3(0.08, 0.13, 0.32), sqrt(clamp(rd.y, 0.0, 1.0)));
          float s = max(dot(rd, SUN), 0.0);
          col += vec3(1.0, 0.45, 0.15) * pow(s, 6.0) * 0.8;
          col += vec3(1.0, 0.9, 0.7) * pow(s, 512.0) * 6.0;
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.25;
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, sky(rr), 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, sky(rd), 1.0 - exp(-0.03 * hit.x));
          }
          col = 1.0 - exp(-col * 1.1);
          col = col * col * (3.0 - 2.0 * col);
          col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.2);
          col *= vec3(1.05, 1.0, 0.92);
          col *= 0.5 + 0.5 * pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2);
          col = clamp(col, 0.0, 1.0);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          vec3 col = mix(vec3(0.7, 0.4, 0.3), vec3(0.08, 0.13, 0.32), sqrt(clamp(rd.y, 0.0, 1.0)));
          float s = max(dot(rd, SUN), 0.0);
          col += vec3(1.0, 0.45, 0.15) * pow(s, 6.0) * 0.8;
          col += vec3(1.0, 0.9, 0.7) * pow(s, 512.0) * 6.0;
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            if (m < 1.5) {
              //ja: 床の形は平らなまま、法線だけを波で少し傾ける
              //en: keep the floor flat, but tilt its normal slightly with waves
              vec2 w = vec2(sin(pos.x * 6.0 + pos.z * 2.0 + time * 2.0), sin(pos.z * 7.0 - pos.x * 3.0 + time * 1.6));
              n = normalize(n + 0.04 * vec3(w.x, 0.0, w.y));
            }
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.6;         //ja: 水面はよく映る //en: water reflects strongly
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, sky(rr), 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, sky(rd), 1.0 - exp(-0.03 * hit.x));
          }
          col = 1.0 - exp(-col * 1.1);
          col = col * col * (3.0 - 2.0 * col);
          col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.2);
          col *= vec3(1.05, 1.0, 0.92);
          col *= 0.5 + 0.5 * pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2);
          col = clamp(col, 0.0, 1.0);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "形を変えずに見え方だけを変えるには、`map` ではなく、当たった後の法線 `n` を変えます。床(`m < 1.5`)のときだけ、`n` に小さな横向きの値を足して `normalize` し直します",
          en: "To change how something looks without changing its shape, change the normal `n` after the hit instead of `map`. Only for the floor (`m < 1.5`), add a small sideways vector to `n` and `normalize` it again",
        },
        {
          ja: "`sin(pos.x * 6.0 + time * 2.0)` のような、場所と時間で変わる波を法線の x と z に足します。大きさは 0.03〜0.05 くらい。映りこみの強さは、床の `0.25` を `0.6` くらいに",
          en: "Add waves that change with position and time, like `sin(pos.x * 6.0 + time * 2.0)`, to the x and z of the normal, about 0.03 to 0.05 in size. Raise the floor's reflection strength from `0.25` to about `0.6`",
        },
        {
          ja: "`if (m < 1.5) { vec2 w = vec2(sin(pos.x * 6.0 + pos.z * 2.0 + time * 2.0), sin(pos.z * 7.0 - pos.x * 3.0 + time * 1.6)); n = normalize(n + 0.04 * vec3(w.x, 0.0, w.y)); }`",
          en: "`if (m < 1.5) { vec2 w = vec2(sin(pos.x * 6.0 + pos.z * 2.0 + time * 2.0), sin(pos.z * 7.0 - pos.x * 3.0 + time * 1.6)); n = normalize(n + 0.04 * vec3(w.x, 0.0, w.y)); }`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "夕暮れから夜へ", en: "From dusk to night" },
      prompt: {
        ja: "太陽をゆっくり沈ませて、また昇らせてください。太陽が低くなるにつれて空と光は暗くなり、沈むと夜の紺色の空になります。霧と映りこみの色も、空に合わせて変わるようにします。",
        en: "Make the sun sink slowly and then rise again. As it gets lower, the sky and the light darken, and once it sets the sky turns night-time navy. The fog and reflections should follow the sky.",
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        const vec3 SUN = normalize(vec3(-0.4, 0.25, 1.0));  //ja: これを時間で動かしたい //en: we want this to move with time

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec4 mat = material(pos, m);
          float dif = max(dot(n, SUN), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(SUN - rd)), 0.0), 32.0) * dif;
          vec3 lin = dif * vec3(1.6, 1.0, 0.6);
          lin += sky * occ * vec3(0.15, 0.2, 0.35);
          lin += bou * occ * vec3(0.2, 0.12, 0.08);
          return mat.rgb * lin + mat.a * spe * vec3(1.6, 1.0, 0.6);
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          vec3 col = mix(vec3(0.7, 0.4, 0.3), vec3(0.08, 0.13, 0.32), sqrt(clamp(rd.y, 0.0, 1.0)));
          float s = max(dot(rd, SUN), 0.0);
          col += vec3(1.0, 0.45, 0.15) * pow(s, 6.0) * 0.8;
          col += vec3(1.0, 0.9, 0.7) * pow(s, 512.0) * 6.0;
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            float sha = dot(n, SUN) > 0.0 ? softShadow(pos, SUN) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.25;
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, sky(rr), 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, sky(rd), 1.0 - exp(-0.03 * hit.x));
          }
          col = 1.0 - exp(-col * 1.1);
          col = col * col * (3.0 - 2.0 * col);
          col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.2);
          col *= vec3(1.05, 1.0, 0.92);
          col *= 0.5 + 0.5 * pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2);
          col = clamp(col, 0.0, 1.0);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        //ja: time を使う値は const にできないので、関数にする
        //en: a value that uses time cannot be const, so make it a function
        vec3 sunDir() {
          float h = 0.1 + 0.3 * cos(time * 0.3);  //ja: 太陽の高さ: 0.4 〜 -0.2 //en: sun height: 0.4 down to -0.2
          return normalize(vec3(-0.4, h, 1.0));
        }

        //ja: 昼は 1、日が沈むと 0
        //en: 1 during the day, 0 once the sun has set
        float daylight() {
          return clamp(sunDir().y * 4.0 + 0.2, 0.0, 1.0);
        }

        vec2 map(vec3 p) {
          vec2 res = vec2(p.y, 1.0);
          float d = sdSphere(p - vec3(-0.7, 0.7, 1.0), 0.7);
          if (d < res.x) res = vec2(d, 2.0);
          vec3 b = p - vec3(0.9, 0.45, 0.4);
          b.xz = rot(0.5) * b.xz;
          d = sdBox(b, vec3(0.4)) - 0.05;
          if (d < res.x) res = vec2(d, 3.0);
          vec3 q = p;
          q.x = abs(q.x) - 3.0;
          q.z -= 2.5 * round(q.z / 2.5);
          d = sdCylinder(q - vec3(0.0, 2.0, 0.0), 0.3, 2.0);
          if (d < res.x) res = vec2(d, 4.0);
          return res;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy).x - map(p - e.xyy).x,
            map(p + e.yxy).x - map(p - e.yxy).x,
            map(p + e.yyx).x - map(p - e.yyx).x));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t).x;
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h).x) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 material(vec3 pos, float m) {
          if (m < 1.5) {
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            return vec4(mix(vec3(0.08), vec3(0.6), c), 0.2);
          }
          if (m < 2.5) return vec4(0.7, 0.08, 0.05, 1.0);
          if (m < 3.5) return vec4(0.05, 0.4, 0.45, 0.4);
          return vec4(0.75, 0.72, 0.68, 0.05);
        }

        vec3 shade(vec3 pos, vec3 n, vec3 rd, float m, float sha) {
          vec3 sun = sunDir();
          float day = daylight();
          vec4 mat = material(pos, m);
          float dif = max(dot(n, sun), 0.0) * sha;
          float occ = calcAO(pos, n);
          float sky = 0.5 + 0.5 * n.y;
          float bou = 0.5 - 0.5 * n.y;
          float spe = pow(max(dot(n, normalize(sun - rd)), 0.0), 32.0) * dif;
          vec3 sunCol = vec3(1.6, 1.0, 0.6) * day;
          vec3 lin = dif * sunCol;
          lin += sky * occ * mix(vec3(0.02, 0.03, 0.08), vec3(0.15, 0.2, 0.35), day);  //ja: 夜も少しだけ青い光 //en: a faint blue light even at night
          lin += bou * occ * vec3(0.2, 0.12, 0.08) * day;
          return mat.rgb * lin + mat.a * spe * sunCol;
        }

        vec2 march(vec3 ro, vec3 rd) {
          float t = 0.0;
          float m = 0.0;
          for (int i = 0; i < 64; i++) {
            vec2 h = map(ro + rd * t);
            m = h.y;
            if (h.x < 0.001 || t > 40.0) break;
            t += h.x;
          }
          return vec2(t, m);  //ja: 進んだ距離と、素材の番号 //en: distance traveled and material number
        }

        vec3 sky(vec3 rd) {
          vec3 sun = sunDir();
          float day = daylight();
          vec3 horizon = mix(vec3(0.03, 0.03, 0.08), vec3(0.7, 0.4, 0.3), day);    //ja: 夜は暗い紺 //en: dark navy at night
          vec3 zenith = mix(vec3(0.0, 0.0, 0.02), vec3(0.08, 0.13, 0.32), day);
          vec3 col = mix(horizon, zenith, sqrt(clamp(rd.y, 0.0, 1.0)));
          float s = max(dot(rd, sun), 0.0);
          col += vec3(1.0, 0.45, 0.15) * pow(s, 6.0) * 0.8 * day;
          col += vec3(1.0, 0.9, 0.7) * pow(s, 512.0) * 6.0 * step(0.0, sun.y);   //ja: 沈んだら円盤は見えない //en: no disc once it has set
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.3, -3.0);
          vec3 ta = vec3(0.0, 0.8, 1.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          vec3 col = sky(rd);
          vec2 hit = march(ro, rd);
          if (hit.x < 40.0) {
            vec3 pos = ro + rd * hit.x;
            vec3 n = calcNormal(pos);
            float m = hit.y;
            vec3 sun = sunDir();
            float sha = dot(n, sun) > 0.0 ? softShadow(pos, sun) : 0.0;
            col = shade(pos, n, rd, m, sha);

            float refl = 0.0;
            if (m < 1.5) refl = 0.25;
            else if (m < 2.5) refl = 0.3;
            if (refl > 0.0) {
              float fre = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
              refl += (1.0 - refl) * fre;
              vec3 rr = reflect(rd, n);
              vec3 ro2 = pos + n * 0.01;
              vec2 hit2 = march(ro2, rr);
              vec3 rcol = sky(rr);
              if (hit2.x < 40.0) {
                vec3 pos2 = ro2 + rr * hit2.x;
                rcol = shade(pos2, calcNormal(pos2), rr, hit2.y, 1.0);
                rcol = mix(rcol, sky(rr), 1.0 - exp(-0.03 * hit2.x));
              }
              col = mix(col, rcol, refl);
            }

            col = mix(col, sky(rd), 1.0 - exp(-0.03 * hit.x));
          }
          col = 1.0 - exp(-col * 1.1);
          col = col * col * (3.0 - 2.0 * col);
          col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.2);
          col *= vec3(1.05, 1.0, 0.92);
          col *= 0.5 + 0.5 * pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2);
          col = clamp(col, 0.0, 1.0);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`time` を使う値は `const` にできません。`SUN` を `vec3 sunDir()` という関数にして、`SUN` を使っているところを全部 `sunDir()` に置きかえます",
          en: "A value that uses `time` cannot be `const`. Turn `SUN` into a function, `vec3 sunDir()`, and replace every use of `SUN` with `sunDir()`",
        },
        {
          ja: "太陽の高さ(y)を `0.1 + 0.3 * cos(time * 0.3)` のように動かし、高さから「昼らしさ」`day` を 0〜1 で作ります。空の色・太陽の光・照り返しに `day` をかけたり、`mix` の割合に使ったりします",
          en: "Move the sun's height (y) with something like `0.1 + 0.3 * cos(time * 0.3)`, and derive a 0-to-1 \"daylight\" value `day` from the height. Multiply the sky colors, sunlight and bounce by `day`, or use it as a `mix` amount",
        },
        {
          ja: "`float day = clamp(sunDir().y * 4.0 + 0.2, 0.0, 1.0);` とし、空の地平線の色を `mix(vec3(0.03, 0.03, 0.08), vec3(0.7, 0.4, 0.3), day)` に。太陽の円盤は `step(0.0, sun.y)` で、沈んだら消します",
          en: "Use `float day = clamp(sunDir().y * 4.0 + 0.2, 0.0, 1.0);` and make the horizon color `mix(vec3(0.03, 0.03, 0.08), vec3(0.7, 0.4, 0.3), day)`. Hide the sun's disc after sunset with `step(0.0, sun.y)`",
        },
      ],
    },
    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        { ja: "`vec2 map` で距離と素材の番号を一緒に返す。和は `if (d < res.x) res = vec2(d, 番号);`、使うところでは `map(…).x`", en: "`vec2 map` returns a distance and a material number together. Union with `if (d < res.x) res = vec2(d, number);` and read `map(…).x` where you need the distance" },
        { ja: "番号は `m < 1.5` のように間で区切って比べる。色とつやは `material`、模様は当たった位置 `pos` から", en: "Compare numbers with cuts between them, like `m < 1.5`. Color and shine come from `material`; patterns come from the hit position `pos`" },
        { ja: "反射は `reflect(rd, n)` の向きにもう 1 回レイマーチ。フレネルで斜めほど強く。再帰はできず、1 回ごとに重くなる", en: "Reflection is one more raymarch along `reflect(rd, n)`, stronger at grazing angles with Fresnel. No recursion, and every bounce costs a full raymarch" },
        { ja: "霧は `mix(col, 霧の色, 1.0 - exp(-k * t))`。霧の色を `sky(rd)` にすると、遠くが空に溶けこむ", en: "Fog is `mix(col, fogColor, 1.0 - exp(-k * t))`. Use `sky(rd)` as the fog color and the distance melts into the sky" },
        { ja: "仕上げは、場面 → 露出とトーンマッピング → 色の調整 → ビネット → ガンマ の順([光と仕上げ](/learn/light-and-glow) の順番に色の調整を足したもの)", en: "Finish in this order: scene → exposure and tone mapping → color grading → vignette → gamma (the order from [Light and finishing](/learn/light-and-glow), plus color grading)" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "これで、光・影・質感・空気のそろった 3D の場面が描けるようになりました。次の回からは第 4 部「デモを作る」です。まずは、単純な式のくり返しから無限に細かい形が生まれる、フラクタルの世界に入ります。",
        en: "You can now draw a 3D scene with light, shadow, materials and air. The next lesson begins Part 4, \"Making demos\", where we enter the world of fractals: endlessly detailed shapes grown from a simple formula repeated over and over.",
      },
    },
  ],
};

export default lesson;
