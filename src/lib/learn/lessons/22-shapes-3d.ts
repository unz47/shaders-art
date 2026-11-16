import type { Lesson } from "../types";

// この回の playground は同じ土台(map・calcNormal・camera・shade・render)を使い、map だけを書きかえていく。

const lesson: Lesson = {
  slug: "shapes-3d",
  title: { ja: "3D の形を組み立てる", en: "Building 3D shapes" },
  summary: {
    ja: "箱・トーラス・円柱を組み合わせ、なめらかにつないで物を作る",
    en: "Combine boxes, tori and cylinders, and blend them smoothly into objects",
  },
  minutes: 55,
  goals: [
    {
      ja: "3D の箱 `sdBox`・トーラス `sdTorus`・円柱 `sdCylinder`・カプセルを置いて、大きさや向きを変えられる",
      en: "Place 3D boxes (`sdBox`), tori (`sdTorus`), cylinders (`sdCylinder`) and capsules, and change their size and orientation",
    },
    {
      ja: "`q.xz = rot(-a) * q.xz` のように平面ごとに回して、3D の物を好きな向きに回せる",
      en: "Rotate objects in 3D by rotating one plane at a time, as in `q.xz = rot(-a) * q.xz`",
    },
    {
      ja: "和(`min`)・積(`max`)・差(`max(a, -b)`)と `smin` で、形を組み合わせたり、なめらかにつないだりできる",
      en: "Combine shapes with union (`min`), intersection (`max`) and subtraction (`max(a, -b)`), and blend them with `smin`",
    },
    {
      ja: "部品を組み立てて、雪だるまやテーブルのような身近な物を作り、部品ごとに色を変えられる",
      en: "Assemble parts into everyday objects like a snowman or a table, and color each part differently",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "3D の工作の土台", en: "A workbench for 3D" } },
    {
      type: "paragraph",
      text: {
        ja: "[レイとカメラ](/learn/rays-and-camera)・[レイマーチング](/learn/raymarching)・[法線と光](/learn/normals-and-lighting) の 3 回で、3D の場面を描く道具がひととおりそろいました。この回は、その道具を使った **工作** の回です。球と床しかなかった場面に、箱・ドーナツ・円柱・棒を加え、組み合わせて物を作ります。",
        en: "Across [Rays and cameras](/learn/rays-and-camera), [Raymarching](/learn/raymarching) and [Normals and lighting](/learn/normals-and-lighting), we have collected every tool needed to draw a 3D scene. This lesson is about **building things** with those tools. Our scenes have had only balls and a floor; now we add boxes, doughnuts, cylinders and rods, and combine them into objects.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この回の playground は、どれも同じ土台のコードを使います。前の回の仕上げの照明を `shade` という関数にまとめたので、書きかえるのはほとんど `map` だけです。",
        en: "Every playground in this lesson shares the same base code. The final lighting from last lesson is wrapped up in a function called `shade`, so `map` is almost the only thing you will change.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`map(p)` … 場面の形。この回の主役",
          en: "`map(p)` … the shapes in the scene; the star of this lesson",
        },
        {
          ja: "`calcNormal(p)` と `camera(ro, ta)` … 前の 2 回と同じ",
          en: "`calcNormal(p)` and `camera(ro, ta)` … the same as in the last two lessons",
        },
        {
          ja: "`shade(n, rd, albedo)` … 太陽の拡散光・空の環境光・つやで、表面の色 `albedo` を照らした色を返す",
          en: "`shade(n, rd, albedo)` … returns the surface color `albedo` lit by sun diffuse, sky ambient and a highlight",
        },
        {
          ja: "`render` … 64 歩のレイマーチ、色選び、霧、ガンマ補正",
          en: "`render` … the 64-step raymarch, color choice, fog and gamma correction",
        },
      ],
    },

    { type: "heading", text: { ja: "箱", en: "Boxes" } },
    {
      type: "paragraph",
      text: {
        ja: "3D の箱の距離関数は、[距離で描く](/learn/sdf-2d) の 2D の四角 `sdBox` に、z をもう 1 つ足しただけです。名前も同じ `sdBox` ですが、GLSL は引数の型(`vec2` か `vec3` か)で、どちらを使うかを自分で選んでくれます。",
        en: "The 3D box's distance function is the 2D `sdBox` from [Drawing with distance](/learn/sdf-2d) with one more axis, z. It even keeps the name `sdBox`: GLSL picks the right version by the argument types (`vec2` or `vec3`) on its own.",
      },
    },
    {
      type: "code",
      source: `
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`b` は箱の大きさの **半分**。`vec3(0.8, 0.5, 0.5)` なら、幅 1.6、高さ 1.0、奥行き 1.0 の箱",
          en: "`b` is **half** the box's size. `vec3(0.8, 0.5, 0.5)` makes a box 1.6 wide, 1.0 tall and 1.0 deep",
        },
        {
          ja: "`abs(p)` で、8 つの角のどこにいても、+x・+y・+z の 1 つの角の問題に折りたたむ(箱は上下・左右・前後に対称なので)",
          en: "`abs(p)` folds every point into the one corner at +x, +y, +z, since the box is symmetric in all three directions",
        },
        {
          ja: "`d` の各成分は、その向きの面からどれだけ外に出ているか。たとえば `p = (1.0, 0, 0)` なら `d = (0.2, -0.5, -0.5)` で、x の面から 0.2 だけ外。距離は 0.2",
          en: "Each component of `d` says how far outside the face in that direction you are. At `p = (1.0, 0, 0)`, `d = (0.2, -0.5, -0.5)`: 0.2 outside the x face, so the distance is 0.2",
        },
        {
          ja: "`p = (1.0, 0.7, 0)` なら `d = (0.2, 0.2, -0.5)` で、角の近く。外に出ている 2 つの成分の長さ √(0.04 + 0.04) ≈ 0.28 が距離",
          en: "At `p = (1.0, 0.7, 0)`, `d = (0.2, 0.2, -0.5)`: near an edge. The distance is the length of the two outside components, √(0.04 + 0.04) ≈ 0.28",
        },
        {
          ja: "中心 `p = (0, 0, 0)` では `d = (-0.8, -0.5, -0.5)` で全部負(内側)。後半の `max` がいちばん近い面までの -0.5 を返す",
          en: "At the center, `p = (0, 0, 0)`, `d = (-0.8, -0.5, -0.5)` is all negative (inside). The `max` part returns -0.5, the distance to the nearest face",
        },
      ],
    },
    {
      type: "playground",
      source: `
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          float box = sdBox(p - vec3(0.0, -0.5, 0.0), vec3(0.8, 0.5, 0.5));
          return min(box, p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.3, 0.0);
          vec3 ro = ta + vec3(1.55, 1.05, -2.25);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = pos.y < -0.99 ? mix(vec3(0.08), vec3(0.3), c) : vec3(0.7, 0.3, 0.08);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "大きさを `vec3(0.3, 0.5, 1.2)` にすると奥に長い箱に。`sdBox(…, vec3(0.7, 0.4, 0.4)) - 0.1` にすると角が丸くなります(2D と同じ角丸)",
        en: "Make the size `vec3(0.3, 0.5, 1.2)` for a box that runs away from you. Try `sdBox(…, vec3(0.7, 0.4, 0.4)) - 0.1` to round the corners, just like in 2D",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "角丸は 2D と同じく、箱を `r` だけ小さくしてから、距離から `r` を引きます。距離が `r` の所まで表面がふくらむので、角が半径 `r` で丸くなります。本物の物の角は少しだけ丸いことが多いので、`0.02` くらいの小さな角丸を付けると、ぐっと本物らしくなります。角の丸みにつやが乗るからです。",
        en: "Rounding works just as in 2D: shrink the box by `r`, then subtract `r` from the distance. The surface swells out to distance `r`, so the edges round off with radius `r`. Real objects usually have slightly rounded edges, so a tiny rounding of about `0.02` makes things look much more real, because highlights catch on the rounded edges.",
      },
    },

    { type: "heading", text: { ja: "3D で回す", en: "Rotating in 3D" } },
    {
      type: "paragraph",
      text: {
        ja: "2D の [座標を動かす](/learn/transforms) では、`p = rot(-a) * p` で形を `a` だけ回しました。3D でも同じ `rot` を、同じ形で使います。3 つの座標のうち **2 つを選んで、その平面の中で回す** のです。選ばなかった 1 つの軸は動かないので、それが回転の軸になります。",
        en: "In 2D, [Moving space](/learn/transforms) turned a shape by `a` with `p = rot(-a) * p`. 3D uses the very same `rot`, in the same form: **pick two of the three coordinates and rotate within that plane**. The axis you didn't pick stays put and becomes the axis of rotation.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`q.xz = rot(-a) * q.xz;` … y はそのまま。たて軸のまわりに `a` だけ回る(コマのように)",
          en: "`q.xz = rot(-a) * q.xz;` … y is untouched: a turn of `a` around the vertical axis, like a top",
        },
        {
          ja: "`q.yz = rot(-a) * q.yz;` … x はそのまま。横軸のまわりに前後へ `a` だけ傾く(うなずくように)",
          en: "`q.yz = rot(-a) * q.yz;` … x is untouched: a tip of `a` forward or back around the side-to-side axis, like a nod",
        },
        {
          ja: "`q.xy = rot(-a) * q.xy;` … z はそのまま。奥行きの軸のまわりに `a` だけ回る(ハンドルのように)",
          en: "`q.xy = rot(-a) * q.xy;` … z is untouched: a turn of `a` around the depth axis, like a steering wheel",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "2D のときと同じ注意が 2 つあります。1 つ目は、**先にずらしてから回す** こと。`q = p - 中心` で回したい物の中心を原点に持ってきてから回さないと、物は原点のまわりを大きく振り回されます。2 つ目は、座標を回すと形は逆向きに回るので、形を `a` だけ回したいときは座標を `rot(-a)` で回すこと。上の一覧も、この playground も、この形で書いています。時間で回し続けるだけなら、向きはあまり気にしなくてかまいません。",
        en: "Two cautions carry over from 2D. First, **shift, then rotate**. Use `q = p - center` to bring the object's center to the origin before rotating, or the object will swing in a wide arc around the origin. Second, rotating the coordinates turns the shape the opposite way, so to turn a shape by `a`, rotate the coordinates by `rot(-a)`. The list above and this playground are both written that way. If you are just spinning things over time, the direction hardly matters.",
      },
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          vec3 q = p - vec3(0.0, -0.1, 0.0);  //ja: 回転の中心を原点へ //en: move the pivot to the origin
          q.xz = rot(-time * 0.7) * q.xz;      //ja: たて軸のまわり //en: around the vertical axis
          q.xy = rot(-time * 0.4) * q.xy;      //ja: 奥行きの軸のまわり //en: around the depth axis
          float box = sdBox(q, vec3(0.45)) - 0.08;
          return min(box, p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.3, 0.0);
          vec3 ro = ta + vec3(1.55, 1.05, -2.25);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = pos.y < -0.99 ? mix(vec3(0.08), vec3(0.3), c) : vec3(0.1, 0.35, 0.6);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`q.xy` の行を消すと、コマのように回るだけになります。`q.xz` と `q.xy` の 2 行を入れかえると、回り方はどう変わるでしょう?",
        en: "Delete the `q.xy` line and it just spins like a top. What happens to the motion if you swap the `q.xz` and `q.xy` lines?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "回転は形の大きさを変えないので、距離は正確なまま保たれます。[座標を動かす](/learn/transforms) の拡大縮小のように、距離を直す必要はありません。",
        en: "Rotation doesn't change a shape's size, so the distance stays exact. Unlike scaling in [Moving space](/learn/transforms), there is no distance to correct.",
      },
    },

    { type: "heading", text: { ja: "トーラス・円柱・カプセル", en: "Tori, cylinders and capsules" } },
    {
      type: "paragraph",
      text: {
        ja: "ドーナツ形の **トーラス** と **円柱** は、どちらも「2D の形を、たて軸のまわりにぐるりと回した形」です。トーラスは円を、円柱は四角を回したものです。だから距離関数も、3D の点をいったん 2D の断面の上の点に直して、2D の距離関数を使います。",
        en: "The doughnut-shaped **torus** and the **cylinder** are both a 2D shape swept all the way around the vertical axis: a circle for the torus, a rectangle for the cylinder. So their distance functions first turn the 3D point into a point on a 2D cross-section, then use a 2D distance function.",
      },
    },
    {
      type: "code",
      source: `
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);  //ja: 断面の上の点 //en: the point on the cross-section
          return length(q) - t.y;                  //ja: 断面の円までの距離 //en: distance to the cross-section circle
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);  //ja: 断面の四角(2D の sdBox) //en: the cross-section rectangle (2D sdBox)
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`length(p.xz)` は、たて軸(y 軸)からの水平な距離。どの向きに回っても同じなので、「回した形」になる",
          en: "`length(p.xz)` is the horizontal distance from the vertical (y) axis. It is the same in every direction around the axis, which is what makes the shape a sweep",
        },
        {
          ja: "トーラスの `t.x` は輪の半径、`t.y` は管の太さ(半径)。`t = (1.0, 0.25)` のとき、点 `(1, 0, 0)` は管の真ん中で `q = (0, 0)`、距離 -0.25。輪の中心 `(0, 0, 0)` では `q = (-1, 0)` で、距離は 1 - 0.25 = 0.75",
          en: "For the torus, `t.x` is the ring radius and `t.y` the tube radius. With `t = (1.0, 0.25)`, the point `(1, 0, 0)` is in the middle of the tube: `q = (0, 0)`, distance -0.25. At the ring's center, `(0, 0, 0)`, `q = (-1, 0)` and the distance is 1 - 0.25 = 0.75",
        },
        {
          ja: "円柱の `r` は半径、`h` は高さの **半分**。`r = 0.5`、`h = 1.0` なら、太さ 1、高さ 2 の円柱",
          en: "For the cylinder, `r` is the radius and `h` is **half** the height. `r = 0.5`, `h = 1.0` gives a cylinder 1 wide and 2 tall",
        },
        {
          ja: "どちらも y 軸のまわりの形。向きを変えたいときは `sdTorus(q.xzy, …)` のようにスウィズルで軸を入れかえる。`q.xzy` は y と z を入れかえるので、寝ていたドーナツが立ち上がる",
          en: "Both are built around the y axis. To reorient one, swap axes with a swizzle, as in `sdTorus(q.xzy, …)`. `q.xzy` swaps y and z, so a doughnut lying flat stands up on its edge",
        },
      ],
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        float map(vec3 p) {
          //ja: 左: 立てたトーラス(q.xzy で y と z を入れかえる)
          //en: left: a standing torus (q.xzy swaps y and z)
          vec3 q = p - vec3(-0.9, -0.2, 0.0);
          q.xz = rot(-time * 0.6) * q.xz;
          float torus = sdTorus(q.xzy, vec2(0.6, 0.2));
          //ja: 右: 円柱
          //en: right: a cylinder
          float cyl = sdCylinder(p - vec3(0.9, -0.4, 0.0), 0.45, 0.6);
          return min(min(torus, cyl), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.3, 0.0);
          vec3 ro = ta + vec3(1.1, 1.05, -2.5);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            //ja: 左の物は金色、右の物は青緑
            //en: gold on the left, teal on the right
            vec3 albedo = pos.x < 0.0 ? vec3(0.6, 0.35, 0.05) : vec3(0.03, 0.35, 0.3);
            if (pos.y < -0.99) albedo = mix(vec3(0.08), vec3(0.3), c);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`sdTorus(q.xzy, …)` を `sdTorus(q, …)` にすると、トーラスが寝ます。円柱の `0.45, 0.6` を `0.8, 0.05` にすると、薄い円盤になります",
        en: "Change `sdTorus(q.xzy, …)` to `sdTorus(q, …)` and the torus lies down. Change the cylinder's `0.45, 0.6` to `0.8, 0.05` for a thin disk",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つ、とても便利な形が **カプセル** です。[図形を組み合わせる](/learn/combining-shapes) の線分の距離関数 `sdSegment` を `vec3` で書き、太さ `r` を引いたものです。2 点 `a` と `b` を結ぶ、両端の丸い棒になります。腕や脚、枝、文字の線など、「どこからどこまで」で決めたい形に向いています。",
        en: "One more very handy shape is the **capsule**. It is the segment distance function `sdSegment` from [Combining shapes](/learn/combining-shapes), written for `vec3`, with a thickness `r` subtracted. The result is a rod with rounded ends joining two points `a` and `b`. It suits any shape you'd describe as going from here to there: arms, legs, branches, the strokes of letters.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
          vec3 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h) - r;
        }

        float map(vec3 p) {
          //ja: 根もと・ひじ・手先の 3 点を決めて、カプセルでつなぐ
          //en: pick a base, an elbow and a tip, and join them with capsules
          vec3 a = vec3(-0.8, -1.0, 0.0);
          vec3 b = vec3(-0.5, 0.1, 0.0);
          float swing = 0.6 * sin(time * 1.5);
          vec3 c = b + vec3(0.9 * cos(swing), 0.9 * sin(swing), 0.0);
          float upper = sdCapsule(p, a, b, 0.14);
          float lower = sdCapsule(p, b, c, 0.1);
          float ball = sdSphere(p - c, 0.22);
          return min(min(min(upper, lower), ball), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(0.85, 0.7, -2.65);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = pos.y < -0.99 ? mix(vec3(0.08), vec3(0.3), c) : vec3(0.55, 0.12, 0.25);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "ひじの `b` を `vec3(-0.5, 0.1, 0.5 * sin(time))` にすると、腕が前後にも動きます。`0.14` と `0.1` を同じにすると、太さのそろった針金のように",
        en: "Set the elbow `b` to `vec3(-0.5, 0.1, 0.5 * sin(time))` and the arm sways back and forth too. Make `0.14` and `0.1` equal for an even, wire-like thickness",
      },
    },

    { type: "heading", text: { ja: "和・積・差", en: "Union, intersection, subtraction" } },
    {
      type: "paragraph",
      text: {
        ja: "2D の [図形を組み合わせる](/learn/combining-shapes) で習った 3 つの組み合わせ方は、3D でもそのまま使えます。和は `min(a, b)`(どちらかの中)、積は `max(a, b)`(両方の中)、差は `max(a, -b)`(`a` の中で、かつ `b` の外)です。`-b` は `b` の内と外を入れかえた形なので、「`b` の外」を表します。",
        en: "The three ways of combining shapes from [Combining shapes](/learn/combining-shapes) in 2D work unchanged in 3D. Union is `min(a, b)` (inside either), intersection is `max(a, b)` (inside both), and subtraction is `max(a, -b)` (inside `a` and outside `b`). `-b` is `b` with inside and outside swapped, so it stands for \"outside `b`\".",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下は、3D の形の組み合わせの例として昔からよく使われる形です。箱と球の **積** で角を丸く削り、そこから x・y・z の 3 方向の円柱を **差** として引いて、穴を通します。y 向きの円柱をスウィズルで横に寝かせて、3 方向の円柱を作っているところに注目してください。",
        en: "Below is a classic example of combining 3D shapes. The **intersection** of a box and a sphere trims the box's corners into curves, then three cylinders along x, y and z are **subtracted** to bore holes through it. Notice how swizzles lay the y-axis cylinder on its side to make the other two directions.",
      },
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
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

        float map(vec3 p) {
          vec3 q = p - vec3(0.0, -0.05, 0.0);
          q.xz = rot(-time * 0.5) * q.xz;
          q.yz = rot(-time * 0.3) * q.yz;

          float box = sdBox(q, vec3(0.7));
          float ball = sdSphere(q, 0.92);
          float body = max(box, ball);  //ja: 積: 箱の角を球で削る //en: intersection: the sphere trims the box's corners

          float cy = sdCylinder(q, 0.38, 2.0);      //ja: y 向き //en: along y
          float cx = sdCylinder(q.yxz, 0.38, 2.0);  //ja: x 向き //en: along x
          float cz = sdCylinder(q.xzy, 0.38, 2.0);  //ja: z 向き //en: along z
          float holes = min(cy, min(cx, cz));

          return min(max(body, -holes), p.y + 1.0);  //ja: 差: 穴を通す //en: subtraction: bore the holes
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(1.4, 1.0, -2.1);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = pos.y < -0.99 ? mix(vec3(0.08), vec3(0.3), c) : vec3(0.65, 0.2, 0.05);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`max(body, -holes)` を `max(box, -holes)` や `max(ball, -holes)` にして、積の効果を確かめましょう。`min(body, holes)` にすると、穴が逆に突き出します",
        en: "Change `max(body, -holes)` to `max(box, -holes)` or `max(ball, -holes)` to see what the intersection does. `min(body, holes)` makes the holes stick out instead",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "積や差で作った形の距離は、本当の距離より小さめになる所があります。[レイマーチング](/learn/raymarching) で見たとおり、小さいぶんには歩数が少し増えるだけで安全です。ただ、差で削った細い所は、歩数が足りないと穴があきやすくなります。おかしいと思ったら熱の地図で確かめましょう。",
        en: "Shapes made with intersection or subtraction report distances that are smaller than the truth in places. As we saw in [Raymarching](/learn/raymarching), too small is safe; it just costs a few more steps. Thin areas carved by subtraction are prone to holes if steps run short, though. If something looks off, check the heat map.",
      },
    },

    { type: "heading", text: { ja: "なめらかにつなぐ", en: "Smooth blending" } },
    {
      type: "paragraph",
      text: {
        ja: "[距離で描く](/learn/sdf-2d) の `smin` は 3D でもまったく同じに使えます。`min` の代わりに `smin(a, b, k)` を使うと、2 つの形のつなぎ目が、粘土を指でならしたようになめらかになります。`k` はなめらかにする範囲の広さで、形どうしの距離が `k` より近くなった所からくっつき始めます。",
        en: "The `smin` from [Drawing with distance](/learn/sdf-2d) works exactly the same in 3D. Use `smin(a, b, k)` instead of `min`, and the seam between two shapes smooths out as if you'd pressed clay together with your thumb. `k` is the width of the blend: shapes begin to merge once they come within `k` of each other.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          vec3 q = p - vec3(0.0, -0.1, 0.0);
          //ja: 立てた輪と、その穴を前後にくぐり抜ける球
          //en: a standing ring, and a ball that passes back and forth through its hole
          float ring = sdTorus(q.xzy, vec2(0.7, 0.18));
          float ball = sdSphere(q - vec3(0.0, 0.0, 1.3 * sin(time)), 0.38);
          float d = smin(ring, ball, 0.3);
          return min(d, p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(1.8, 0.85, -1.95);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = pos.y < -0.99 ? mix(vec3(0.08), vec3(0.3), c) : vec3(0.15, 0.5, 0.1);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`0.3` を `0.05` にするとほとんどくっつかず、`0.6` にすると遠くからとろりと伸びてつながります。床とも `smin` でつないでみると?",
        en: "At `0.05` they barely stick; at `0.6` they reach out and melt together from far apart. What if you also join the floor with `smin`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "積と差にも、なめらかな版があります。`max(a, b)` は `-min(-a, -b)` と同じなので、`min` を `smin` にかえれば「なめらかな `max`」が作れます。これで、削った穴のふちを丸めたり、2 つの形の重なりをやわらかく切り取ったりできます。",
        en: "Intersection and subtraction have smooth versions too. `max(a, b)` equals `-min(-a, -b)`, so swapping in `smin` gives a smooth `max`. With it you can round the rims of carved holes, or soften the cut where two shapes overlap.",
      },
    },
    {
      type: "code",
      source: `
        float smax(float a, float b, float k) { return -smin(-a, -b, k); }

        float d1 = smax(box, ball, 0.1);    //ja: なめらかな積 //en: smooth intersection
        float d2 = smax(box, -hole, 0.1);   //ja: なめらかな差(穴のふちが丸くなる) //en: smooth subtraction (rounded hole rims)
      `,
    },

    { type: "heading", text: { ja: "物を組み立てる", en: "Assembling an object" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの部品で、物を 1 つ組み立ててみましょう。雪だるまです。体は 3 つの球を `smin` で少しだけなじませ、帽子は 2 つの円柱、鼻と腕はカプセル、目とボタンは小さな球です。部品ごとに距離関数を分けて書いておくと、`map` は部品を `min` で並べるだけの、読みやすい形になります。",
        en: "Let's put the parts together into an object: a snowman. The body is three spheres blended slightly with `smin`, the hat two cylinders, the nose and arms capsules, and the eyes and buttons small spheres. Writing a separate distance function per part keeps `map` readable: it just lines the parts up with `min`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "部品ごとに色を変えるには、レイが当たった点 `pos` で、部品ごとの距離をもう一度測ります。当たった点は、当たった部品の表面の上にあるので、その部品の距離だけがほぼ 0 になります。たとえば `hat(pos) < 0.01` なら帽子です。もっとすっきりした方法(`map` から部品の番号も返す)は、[質感と空気](/learn/materials-and-atmosphere) で習います。",
        en: "To color each part differently, measure each part's distance again at the hit point `pos`. The hit point lies on the surface of the part that was hit, so only that part's distance is close to 0. For example, if `hat(pos) < 0.01`, we hit the hat. A tidier method, returning a part number from `map` itself, comes in [Materials and atmosphere](/learn/materials-and-atmosphere).",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }
        float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
          vec3 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h) - r;
        }
        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        //ja: 部品ごとの距離関数
        //en: one distance function per part
        float body(vec3 p) {
          float a = sdSphere(p - vec3(0.0, -0.45, 0.0), 0.6);
          float b = sdSphere(p - vec3(0.0, 0.35, 0.0), 0.42);
          float c = sdSphere(p - vec3(0.0, 0.95, 0.0), 0.3);
          return smin(smin(a, b, 0.1), c, 0.08);
        }
        float hat(vec3 p) {
          float brim = sdCylinder(p - vec3(0.0, 1.2, 0.0), 0.32, 0.02);
          float top = sdCylinder(p - vec3(0.0, 1.38, 0.0), 0.2, 0.18);
          return min(brim, top);
        }
        float nose(vec3 p) {
          return sdCapsule(p, vec3(0.0, 0.95, -0.2), vec3(0.0, 0.92, -0.55), 0.04);
        }
        float coal(vec3 p) {
          float eyes = min(sdSphere(p - vec3(-0.1, 1.03, -0.26), 0.04), sdSphere(p - vec3(0.1, 1.03, -0.26), 0.04));
          float buttons = min(sdSphere(p - vec3(0.0, 0.45, -0.4), 0.045), sdSphere(p - vec3(0.0, 0.22, -0.41), 0.045));
          return min(eyes, buttons);
        }
        float arms(vec3 p) {
          float l = sdCapsule(p, vec3(-0.35, 0.4, 0.0), vec3(-0.85, 0.75, 0.0), 0.025);
          float r = sdCapsule(p, vec3(0.35, 0.4, 0.0), vec3(0.85, 0.8 + 0.1 * sin(time * 4.0), 0.0), 0.025);
          return min(l, r);
        }

        float map(vec3 p) {
          float d = min(min(body(p), hat(p)), min(nose(p), coal(p)));
          d = min(d, arms(p));
          return min(d, p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = 0.5 * sin(time * 0.4);
          vec3 ta = vec3(0.0, 0.2, 0.0);
          vec3 ro = ta + vec3(3.0 * sin(a), 0.6, -3.0 * cos(a));
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.55, 0.45, 0.45), vec3(0.04, 0.08, 0.3), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            //ja: 当たった点で、どの部品の距離がほぼ 0 かを調べる
            //en: at the hit point, find which part's distance is nearly 0
            vec3 albedo = vec3(0.75, 0.8, 0.85);                           //ja: 雪 //en: snow
            if (pos.y < -0.99) albedo = vec3(0.3, 0.35, 0.45);              //ja: 雪原 //en: snowfield
            else if (hat(pos) < 0.01 || coal(pos) < 0.01) albedo = vec3(0.02);
            else if (nose(pos) < 0.01) albedo = vec3(0.8, 0.2, 0.02);
            else if (arms(pos) < 0.01) albedo = vec3(0.12, 0.05, 0.02);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "帽子の色を `hat(pos) < 0.01` だけ別にして、赤い帽子にしてみましょう。体の `smin` の `0.1` を `0.3` にすると、雪だるまが溶けかけます",
        en: "Split `hat(pos) < 0.01` into its own branch and give the snowman a red hat. Change the body's `smin` from `0.1` to `0.3` and the snowman starts to melt",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "部品の数が増えると、`map` は重くなります。`map` は 1 ピクセルあたり、ループで最大 64 回、法線で 6 回呼ばれるからです。この雪だるまくらいなら問題ありませんが、部品が何十個にもなるときは、くり返し([無限の空間と変形](/learn/infinite-space))や、次の節の対称の工夫で、計算する部品を減らします。",
        en: "More parts make `map` heavier, since it runs up to 64 times per pixel in the loop plus 6 more for the normal. A snowman like this is fine, but once you have dozens of parts, cut down the work with repetition ([Infinite space and deformation](/learn/infinite-space)) or with the symmetry trick in the next section.",
      },
    },

    { type: "heading", text: { ja: "対称は abs で", en: "Symmetry with abs" } },
    {
      type: "paragraph",
      text: {
        ja: "テーブルの脚は 4 本ですが、4 本とも同じ形で、左右と前後に対称に並んでいます。こういうときは、脚を 4 本書く代わりに、座標を `abs` で折りたたみます。`q.xz = abs(q.xz)` とすると、x が負の場所も正の場所と同じ座標になり、z も同じです。つまり、+x・+z の 1 か所に置いた脚 1 本が、鏡に映ったように 4 か所に現れます。[くり返しとタイル](/learn/repetition) の鏡のくり返しと同じ考え方です。",
        en: "A table has four legs, all the same shape, arranged symmetrically left-right and front-back. Rather than writing four legs, fold the coordinates with `abs`. After `q.xz = abs(q.xz)`, a point with negative x gets the same coordinates as its positive twin, and the same goes for z. So one leg placed at +x, +z shows up in all four spots, as if reflected in mirrors. It is the same idea as the mirrored repetition in [Repetition and tiles](/learn/repetition).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "具体的には、`abs(q.xz) - vec2(0.95, 0.55)` で、折りたたんだ後に脚の位置 `(0.95, 0.55)` を原点へずらしてから、円柱を置きます。テーブルの上には、円柱から少し小さな円柱を **差** で引いたコップを置きました。内側の円柱を少し上にずらしているので、底が残り、上は開いています。",
        en: "Concretely, `abs(q.xz) - vec2(0.95, 0.55)` folds the space and then shifts the leg position `(0.95, 0.55)` to the origin, where we place a cylinder. On the table sits a cup: a cylinder with a slightly smaller cylinder **subtracted**. The inner cylinder is shifted up a little, which leaves a bottom and an open top.",
      },
    },
    {
      type: "playground",
      source: `
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        float sdCylinder(vec3 p, float r, float h) {
          vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
        }

        float table(vec3 p) {
          float top = sdBox(p, vec3(1.1, 0.05, 0.7)) - 0.02;
          //ja: 折りたたんで、脚 1 本を 4 か所に
          //en: fold space so one leg appears in four places
          vec3 q = p;
          q.xz = abs(q.xz) - vec2(0.95, 0.55);
          float leg = sdCylinder(q - vec3(0.0, -0.5, 0.0), 0.06, 0.5);
          return min(top, leg);
        }
        float cup(vec3 p) {
          vec3 q = p - vec3(0.3, 0.24, 0.1);
          float outer = sdCylinder(q, 0.15, 0.17);
          float inner = sdCylinder(q - vec3(0.0, 0.05, 0.0), 0.12, 0.17);
          return max(outer, -inner);
        }

        float map(vec3 p) {
          return min(min(table(p), cup(p)), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = time * 0.25;
          vec3 ta = vec3(0.0, -0.3, 0.0);
          vec3 ro = ta + vec3(2.6 * sin(a), 1.3, -2.6 * cos(a));
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = vec3(0.35, 0.15, 0.05);                          //ja: 木 //en: wood
            if (pos.y < -0.99) albedo = mix(vec3(0.08), vec3(0.3), c);
            else if (cup(pos) < 0.01) albedo = vec3(0.7, 0.75, 0.8);       //ja: コップ //en: the cup
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`vec2(0.95, 0.55)` を `vec2(0.5, 0.3)` にすると、脚が内側に寄ります。`abs(q.xz)` を `vec2(abs(q.x), q.z)` にして x だけを折りたたむと、脚は何本になるでしょう?",
        en: "Change `vec2(0.95, 0.55)` to `vec2(0.5, 0.3)` to pull the legs inward. Replace `abs(q.xz)` with `vec2(abs(q.x), q.z)` to fold only x: how many legs are left?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`abs` で折りたたむと、計算するのは脚 1 本ぶんだけです。4 本を `min` で並べるより軽く、コードも短くなります。左右対称の顔や、上下左右に同じ部品が並ぶ機械など、対称なものを見つけたら、まず `abs` を思い出しましょう。",
        en: "Folding with `abs` means only one leg is ever computed. It is lighter than combining four with `min`, and the code is shorter. Whenever you spot symmetry, like a left-right symmetric face or a machine with matching parts on every side, think of `abs` first.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "部品を選んで、組み合わせて、色を付ける。この回の流れを使って、物を作ってみましょう。",
        en: "Pick parts, combine them, color them: use this lesson's workflow to build some objects of your own.",
      },
    },
    {
      type: "exercise",
      title: { ja: "宝石の指輪", en: "A jeweled ring" },
      prompt: {
        ja: "金色の細い輪を立てて、たて軸のまわりにゆっくり回し、輪のてっぺんに赤い宝石(球)を載せてください。宝石は輪と一緒に回ります。",
        en: "Stand a thin gold ring on its edge, spin it slowly around the vertical axis, and set a red gem (a sphere) on top. The gem turns together with the ring.",
      },
      starter: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float ring(vec3 p) {
          //ja: いまは床に寝た輪。立てて、回す
          //en: for now the ring lies flat; stand it up and spin it
          return sdTorus(p - vec3(0.0, -0.9, 0.0), vec2(0.6, 0.08));
        }
        float gem(vec3 p) {
          return 100.0;  //ja: ここに宝石を書く //en: write the gem here
        }

        float map(vec3 p) {
          return min(min(ring(p), gem(p)), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(0.6, 0.6, -2.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.3, 0.25, 0.3), vec3(0.02, 0.03, 0.1), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 albedo = vec3(0.6, 0.35, 0.05);  //ja: 金 //en: gold
            if (pos.y < -0.99) albedo = vec3(0.1, 0.08, 0.1);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      solution: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        //ja: 輪と宝石が同じように回るよう、座標の変換を 1 つの関数にまとめる
        //en: one function for the transform, so the ring and the gem turn together
        vec3 ringSpace(vec3 p) {
          vec3 q = p - vec3(0.0, -0.3, 0.0);
          q.xz = rot(-time * 0.8) * q.xz;
          return q;
        }
        float ring(vec3 p) {
          vec3 q = ringSpace(p);
          return sdTorus(q.xzy, vec2(0.6, 0.08));  //ja: xzy で立てる //en: xzy stands it up
        }
        float gem(vec3 p) {
          vec3 q = ringSpace(p);
          return sdSphere(q - vec3(0.0, 0.76, 0.0), 0.16);  //ja: 輪のてっぺん //en: the top of the ring
        }

        float map(vec3 p) {
          return min(min(ring(p), gem(p)), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(0.6, 0.6, -2.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.3, 0.25, 0.3), vec3(0.02, 0.03, 0.1), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 albedo = vec3(0.6, 0.35, 0.05);
            if (pos.y < -0.99) albedo = vec3(0.1, 0.08, 0.1);
            else if (gem(pos) < 0.01) albedo = vec3(0.6, 0.0, 0.03);  //ja: 宝石 //en: the gem
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      hints: [
        {
          ja: "輪を立てるには `sdTorus(q.xzy, …)`、回すには `q.xz = rot(-time) * q.xz` です。先に輪の中心を原点へずらしておきます",
          en: "Stand the ring up with `sdTorus(q.xzy, …)` and spin it with `q.xz = rot(-time) * q.xz`. Shift the ring's center to the origin first",
        },
        {
          ja: "立てた輪のてっぺんは、輪の中心から真上に `t.x` だけ上の所です。宝石も同じ回転をかけた座標で置くと、一緒に回ります",
          en: "The top of the standing ring is `t.x` straight above its center. Place the gem in the same rotated coordinates and it turns along with the ring",
        },
        {
          ja: "ずらしと回転を `vec3 ringSpace(vec3 p)` という関数にまとめ、`ring` と `gem` の両方で使います。色は `gem(pos) < 0.01` で見分けます",
          en: "Put the shift and rotation in a function, `vec3 ringSpace(vec3 p)`, and use it in both `ring` and `gem`. Pick the color with `gem(pos) < 0.01`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "きのこ", en: "A mushroom" },
      prompt: {
        ja: "クリーム色の柄(え)の上に、赤い半球のかさを載せたきのこを作ってください。柄とかさのつなぎ目は `smin` でなめらかにし、全体を少し傾けます。",
        en: "Build a mushroom: a red half-dome cap on a cream-colored stalk. Smooth the joint between stalk and cap with `smin`, and tilt the whole thing a little.",
      },
      starter: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
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

        float stalk(vec3 p) {
          return sdCylinder(p - vec3(0.0, -0.5, 0.0), 0.2, 0.5) - 0.03;
        }
        float cap(vec3 p) {
          return 100.0;  //ja: ここにかさを書く //en: write the cap here
        }

        float map(vec3 p) {
          return min(min(stalk(p), cap(p)), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(1.05, 0.85, -2.1);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 albedo = vec3(0.7, 0.6, 0.45);  //ja: 柄 //en: stalk
            if (pos.y < -0.99) albedo = vec3(0.1, 0.2, 0.05);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      solution: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
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

        //ja: 根もとを中心に、全体を少し傾けてゆらす
        //en: tilt and sway the whole mushroom around its base
        vec3 tilt(vec3 p) {
          vec3 q = p - vec3(0.0, -1.0, 0.0);
          q.xy = rot(-0.15 - 0.05 * sin(time * 2.0)) * q.xy;
          return q + vec3(0.0, -1.0, 0.0);
        }
        float stalk(vec3 p) {
          vec3 q = tilt(p);
          return sdCylinder(q - vec3(0.0, -0.5, 0.0), 0.2, 0.5) - 0.03;
        }
        float cap(vec3 p) {
          vec3 q = tilt(p) - vec3(0.0, -0.05, 0.0);
          //ja: 球と「y が 0 より上」の積で、上半分だけ残す
          //en: intersect a sphere with "y above 0" to keep only the top half
          return max(sdSphere(q, 0.75), -q.y);
        }

        float map(vec3 p) {
          return min(smin(stalk(p), cap(p), 0.1), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(1.05, 0.85, -2.1);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 albedo = vec3(0.7, 0.6, 0.45);
            if (pos.y < -0.99) albedo = vec3(0.1, 0.2, 0.05);
            //ja: かさの表面(下の平らな面は柄の色のまま)
            //en: the cap's dome (its flat underside keeps the stalk color)
            else if (cap(pos) < 0.01 && n.y > -0.5) albedo = vec3(0.6, 0.03, 0.02);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      hints: [
        {
          ja: "半球は「球」と「平面の上側」の **積** です。高さ 0 より上を表す距離は `-q.y` なので、`max(sdSphere(q, r), -q.y)` で上半分だけが残ります",
          en: "A half-dome is the **intersection** of a sphere and the space above a plane. The distance for \"above height 0\" is `-q.y`, so `max(sdSphere(q, r), -q.y)` keeps only the top half",
        },
        {
          ja: "柄とかさは `map` の中で `smin(stalk(p), cap(p), 0.1)` にします。かさの色は `cap(pos) < 0.01` で見分けます",
          en: "Join them in `map` with `smin(stalk(p), cap(p), 0.1)`. Pick the cap's color with `cap(pos) < 0.01`",
        },
        {
          ja: "傾けるには、根もと `(0, -1, 0)` を原点へずらして `q.xy = rot(-0.15) * q.xy` で回し、ずらしたぶんを戻します。この変換を関数にして、柄とかさの両方で使います",
          en: "To tilt, shift the base `(0, -1, 0)` to the origin, rotate with `q.xy = rot(-0.15) * q.xy`, then shift back. Make that a function and use it for both the stalk and the cap",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "サイコロ", en: "A die" },
      prompt: {
        ja: "角の丸い白い箱を、本物のサイコロにしてください。見えている 3 つの面に、上は 1 つ、手前は 2 つ、右は 3 つの、丸くくぼんだ黒い目を **差** で彫ります。サイコロはゆっくりゆれます。",
        en: "Turn a white rounded box into a real die. On the three visible faces, carve round, dark dimples by **subtraction**: one on top, two on the front, three on the right. The die rocks gently.",
      },
      starter: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        //ja: サイコロの座標(中心へずらして、少しゆらす)
        //en: the die's coordinates (shifted to its center, gently rocking)
        vec3 dieSpace(vec3 p) {
          vec3 q = p - vec3(0.0, -0.3, 0.0);
          q.xz = rot(-0.15 * sin(time)) * q.xz;
          q.yz = rot(-0.1 * sin(time * 0.7)) * q.yz;
          return q;
        }
        float pips(vec3 q) {
          return 100.0;  //ja: ここに目を書く //en: write the pips here
        }
        float die(vec3 p) {
          vec3 q = dieSpace(p);
          return sdBox(q, vec3(0.42)) - 0.08;
        }

        float map(vec3 p) {
          return min(die(p), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.35, 0.0);
          vec3 ro = ta + vec3(1.55, 1.2, -1.5);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = vec3(0.8, 0.78, 0.72);
            if (pos.y < -0.99) albedo = mix(vec3(0.03, 0.12, 0.05), vec3(0.05, 0.2, 0.08), c);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      solution: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        vec3 dieSpace(vec3 p) {
          vec3 q = p - vec3(0.0, -0.3, 0.0);
          q.xz = rot(-0.15 * sin(time)) * q.xz;
          q.yz = rot(-0.1 * sin(time * 0.7)) * q.yz;
          return q;
        }
        //ja: 面は中心から 0.5 の所。目の球の中心を少し外(0.56)に置き、浅くくぼませる
        //en: faces sit 0.5 from the center; put each pip sphere slightly outside (0.56) for a shallow dimple
        float pips(vec3 q) {
          float r = 0.11;
          float top = sdSphere(q - vec3(0.0, 0.56, 0.0), r);
          float front = min(sdSphere(q - vec3(-0.2, 0.2, -0.56), r), sdSphere(q - vec3(0.2, -0.2, -0.56), r));
          float right = sdSphere(q - vec3(0.56, 0.0, 0.0), r);
          right = min(right, sdSphere(q - vec3(0.56, 0.24, -0.24), r));
          right = min(right, sdSphere(q - vec3(0.56, -0.24, 0.24), r));
          return min(top, min(front, right));
        }
        float die(vec3 p) {
          vec3 q = dieSpace(p);
          float box = sdBox(q, vec3(0.42)) - 0.08;
          return max(box, -pips(q));  //ja: 差で目を彫る //en: carve the pips by subtraction
        }

        float map(vec3 p) {
          return min(die(p), p.y + 1.0);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 shade(vec3 n, vec3 rd, vec3 albedo) {
          vec3 l = normalize(vec3(0.8, 0.6, -0.5));
          float dif = max(dot(n, l), 0.0);
          float amb = 0.5 + 0.5 * n.y;
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
          return albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb) + vec3(0.4) * spe;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.0, -0.35, 0.0);
          vec3 ro = ta + vec3(1.55, 1.2, -1.5);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = vec3(0.8, 0.78, 0.72);
            if (pos.y < -0.99) albedo = mix(vec3(0.03, 0.12, 0.05), vec3(0.05, 0.2, 0.08), c);
            //ja: くぼみの中(目の球の表面の上)なら黒
            //en: inside a dimple (on a pip sphere's surface) means black
            else if (abs(pips(dieSpace(pos))) < 0.01) albedo = vec3(0.02);
            col = shade(n, rd, albedo);
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      hints: [
        {
          ja: "目 1 つは小さな球です。箱から球を **差** で引くと、球の形のくぼみができます。球の中心を面の少し外に置くと、浅いくぼみになります",
          en: "Each pip is a small sphere. **Subtracting** a sphere from the box leaves a sphere-shaped dent. Put the sphere's center slightly outside the face for a shallow dent",
        },
        {
          ja: "面は中心から 0.5 の所にあります(箱の 0.42 + 角丸 0.08)。上の面の目は `(0, 0.56, 0)`、手前の面は z が -0.56、右の面は x が 0.56 の所に並べます",
          en: "The faces are 0.5 from the center (0.42 for the box plus 0.08 rounding). Put the top pip at `(0, 0.56, 0)`, the front pips at z = -0.56, and the right pips at x = 0.56",
        },
        {
          ja: "`die` を `max(box, -pips(q))` にします。目を黒くするには、当たった点で `abs(pips(dieSpace(pos))) < 0.01` を調べます(くぼみの表面では、目の球の距離がほぼ 0)",
          en: "Make `die` return `max(box, -pips(q))`. To color the pips black, test `abs(pips(dieSpace(pos))) < 0.01` at the hit point (on a dimple's surface, the pip sphere's distance is about 0)",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "3D の `sdBox` は 2D の四角に z を足したもの。`b` は大きさの半分。角丸は `sdBox(p, b - r) - r`",
          en: "The 3D `sdBox` is the 2D box plus z; `b` is half the size. Round it with `sdBox(p, b - r) - r`",
        },
        {
          ja: "トーラスと円柱は、2D の円と四角を y 軸のまわりに回した形。`length(p.xz)` で断面の上の点に直す。向きは `q.xzy` などのスウィズルで変える",
          en: "Tori and cylinders are a 2D circle and rectangle swept around the y axis; `length(p.xz)` turns the point into a cross-section point. Reorient them with swizzles like `q.xzy`",
        },
        {
          ja: "カプセルは 3D の線分までの距離 - 太さ。2 点を結ぶ棒に使う",
          en: "A capsule is the distance to a 3D segment minus a thickness: a rod between two points",
        },
        {
          ja: "3D の回転は、2 つの座標を選んで `q.xz = rot(-a) * q.xz` のように回す(形が `a` だけ回る)。先にずらしてから回す",
          en: "Rotate in 3D by picking two coordinates, as in `q.xz = rot(-a) * q.xz` (the shape turns by `a`). Shift first, then rotate",
        },
        {
          ja: "和 `min`・積 `max`・差 `max(a, -b)`・なめらかな和 `smin`。対称な物は `abs` で折りたたむ",
          en: "Union `min`, intersection `max`, subtraction `max(a, -b)`, smooth union `smin`. Fold symmetric objects with `abs`",
        },
        {
          ja: "部品ごとの色は、当たった点で部品の距離を測り直して、ほぼ 0 のものを選ぶ",
          en: "To color by part, re-measure each part's distance at the hit point and pick the one that is nearly 0",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "1 つの物は作れるようになりました。次の回の [無限の空間と変形](/learn/infinite-space) では、空間そのものをくり返して物を無限に並べたり、ねじったり曲げたりして、1 つの距離関数から景色を作ります。",
        en: "You can build a single object now. Next, in [Infinite space and deformation](/learn/infinite-space), we repeat space itself to line objects up forever, and twist and bend it, turning one distance function into a whole landscape.",
      },
    },
  ],
};

export default lesson;
