import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "rays-and-camera",
  title: { ja: "レイとカメラ", en: "Rays and cameras" },
  summary: {
    ja: "点ごとに視線(レイ)を飛ばし、床や球を計算で描いてカメラを動かす",
    en: "Cast a ray per pixel, hit floors and spheres with math, and move a camera",
  },
  minutes: 55,
  goals: [
    {
      ja: "画面の 1 点ごとに、目から視線(レイ)を飛ばして色を決める考え方がわかる",
      en: "Understand the idea of shooting a ray from the eye through each pixel to decide its color",
    },
    {
      ja: "`ro` と `rd = normalize(vec3(p, 1.5))` でレイを作り、その向きを色で確かめられる",
      en: "Build a ray from `ro` and `rd = normalize(vec3(p, 1.5))`, and check its direction as a color",
    },
    {
      ja: "床(平面)と球との交点を式で求め、市松の床と球を描ける。遠くを霧でぼかせる",
      en: "Solve for where a ray meets a floor (a plane) and a sphere, draw a checkered floor and a ball, and fade the distance with fog",
    },
    {
      ja: "焦点距離と画角の関係がわかり、`camera(ro, ta)` でカメラを好きな場所から好きな向きに向けられる",
      en: "Relate focal length to field of view, and use `camera(ro, ta)` to place and aim the camera anywhere",
    },
    {
      ja: "時間やマウスでカメラを回して、場面を立体的に見せられる",
      en: "Orbit the camera with time or the mouse to show a scene in depth",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "2D から 3D へ", en: "From 2D to 3D" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの 18 回で描いてきたのは、すべて平らな画面の上の絵でした。この回から 3D に入ります。といっても、シェーダーの仕組みは何も変わりません。相変わらず、全部の点がそれぞれ「この場所は何色?」に答えます。変わるのは、その **答え方** です。",
        en: "Everything you have drawn in the last 18 lessons lived on a flat screen. This lesson takes us into 3D. The machinery of a shader does not change at all, though. Every pixel still answers \"what color am I?\" on its own. What changes is **how it works out the answer**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "カメラで写真を撮るところを想像してください。目(カメラ)の少し前に、窓ガラスのような画面が 1 枚立っています。画面の 1 つの点の色は、**目からその点を通ってまっすぐ進んだ視線が、最初に何に当たるか** で決まります。窓の向こうの木に当たれば木の色、何にも当たらなければ空の色です。この視線を **レイ**(ray、光線)と呼びます。",
        en: "Picture taking a photo. A little in front of your eye (the camera) stands the screen, like a pane of glass. The color of one point on that screen is decided by **what the line of sight from your eye through that point hits first**. If it hits a tree beyond the window, the point is the tree's color; if it hits nothing, it is the sky's color. That line of sight is called a **ray**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "レイは「出発点」と「向き」の 2 つで表せます。出発点を `ro`(ray origin)、向きを `rd`(ray direction)と書くのが習慣です。どちらも 3 つの数の組 `vec3` です。出発点から向きに沿って距離 `t` だけ進んだ点は `ro + rd * t` と書けます。`t` が 0 なら目の位置、`t` が 5 なら 5 だけ先の点です。",
        en: "A ray is described by two things: where it starts and which way it points. By convention we call the start `ro` (ray origin) and the direction `rd` (ray direction). Both are `vec3`s, groups of three numbers. The point you reach after traveling a distance `t` along the ray is `ro + rd * t`. With `t` at 0 you are at the eye; with `t` at 5 you are 5 units down the line.",
      },
    },
    {
      type: "code",
      source: `
        vec3 ro = vec3(0.0, 1.0, -3.0);     //ja: 目の位置 //en: where the eye is
        vec3 rd = normalize(vec3(p, 1.5));  //ja: この点を通る向き //en: the direction through this pixel
        //ja: レイの上の点は ro + rd * t(t は進んだ距離)
        //en: points on the ray are ro + rd * t (t is the distance traveled)
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "3D の座標は、x が右、y が上、z が奥(画面の向こう)とします。目が原点にいて、奥に向かって距離 1.5 のところに画面が立っていると考えると、画面の上の点 `p` は 3D では `vec3(p.x, p.y, 1.5)` の場所にあります。目からその点へ向かう矢印が、そのままレイの向きです。これを短く書いたのが `vec3(p, 1.5)` です。",
        en: "In 3D we take x to point right, y up, and z into the scene (away from you, through the screen). If the eye sits at the origin and the screen stands 1.5 units in front of it, a screen point `p` is at `vec3(p.x, p.y, 1.5)` in 3D. The arrow from the eye to that point is exactly the ray's direction. `vec3(p, 1.5)` is the short way to write it.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "具体的な数で見てみましょう。`p = (0.5, 0.2)` の点なら、矢印は `(0.5, 0.2, 1.5)` です。`normalize` は、向きはそのままで長さを 1 にそろえる関数です。この矢印の長さは √(0.25 + 0.04 + 2.25) ≈ 1.59 なので、3 つの数をそれで割って `rd ≈ (0.31, 0.13, 0.94)` になります。長さを 1 にしておくと、`t` がそのまま「進んだ距離」になり、この後の計算がぐっと楽になります。",
        en: "Let's put in numbers. For the pixel at `p = (0.5, 0.2)`, the arrow is `(0.5, 0.2, 1.5)`. `normalize` keeps a vector's direction but scales it to length 1. This arrow's length is √(0.25 + 0.04 + 2.25) ≈ 1.59, so dividing all three numbers by it gives `rd ≈ (0.31, 0.13, 0.94)`. With a length of 1, `t` really is the distance traveled, which makes the math that follows much easier.",
      },
    },

    { type: "heading", text: { ja: "レイの向きを色で見る", en: "Seeing ray directions as color" } },
    {
      type: "paragraph",
      text: {
        ja: "3D で迷ったら、まず途中の値を色にして見る。[座標を知る](/learn/coordinates) で覚えたデバッグの考え方が、ここでいちばん役に立ちます。`rd` の 3 つの数は -1〜1 なので、`* 0.5 + 0.5` で 0〜1 に直して、そのまま赤・緑・青にしてみます。",
        en: "When 3D gets confusing, start by turning intermediate values into color. The debugging habit from [Knowing where you are](/learn/coordinates) pays off most here. Each component of `rd` runs from -1 to 1, so we map it to 0–1 with `* 0.5 + 0.5` and use it directly as red, green and blue.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 rd = normalize(vec3(p, 1.5));
          //ja: -1〜1 の向きを 0〜1 の色に直して見る
          //en: turn the -1..1 direction into a 0..1 color
          return vec4(rd * 0.5 + 0.5, 1.0);
        }
      `,
      caption: {
        ja: "`1.5` を `0.5` にすると色の変化が大きくなり、`5.0` にするとほとんど一色になります。なぜでしょう?",
        en: "Change `1.5` to `0.5` and the colors spread much more; at `5.0` the screen is nearly one color. Why?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "真ん中の点は `p = (0, 0)` なので、`rd = (0, 0, 1)`、まっすぐ奥です。色にすると `(0.5, 0.5, 1.0)` のうすい青紫になります。右へ行くほど `rd.x` が増えて赤みが、上へ行くほど `rd.y` が増えて緑みが増します。端のほうで青が少し弱まるのは、レイが横を向くぶん奥へ進む成分 `rd.z` が減るからです。",
        en: "The center pixel has `p = (0, 0)`, so `rd = (0, 0, 1)`: straight ahead. As a color that is `(0.5, 0.5, 1.0)`, a pale blue-violet. Moving right, `rd.x` grows and red comes in; moving up, `rd.y` grows and green comes in. The blue fades a little near the edges because a ray that tilts sideways has less left over for `rd.z`, its forward part.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "向きがわかれば、もう空が描けます。上を向いたレイ(`rd.y` が大きい)ほど濃い青、水平に近いレイほど明るい色にします。`rd.y` が負のレイは下を向いているので、地面の色にします。空と地面の境目、つまり **地平線** は `rd.y = 0` の所、画面のちょうど真ん中の高さに現れます。",
        en: "Knowing the directions is enough to draw a sky. Rays that point up (large `rd.y`) get a deep blue, and rays close to horizontal get a lighter color. A ray with negative `rd.y` points down, so it gets the ground color. The boundary between the two, the **horizon**, appears where `rd.y = 0`: exactly halfway up the screen.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "太陽も足しましょう。ここで新しい関数 `dot`(内積)を使います。`dot(a, b)` は `a.x * b.x + a.y * b.y + a.z * b.z` という計算で、**長さ 1 の矢印どうしなら、2 つの向きがどれだけそろっているか** を表します。同じ向きなら 1.0、直角なら 0.0、正反対なら -1.0 です。角度が 10 度ずれていれば約 0.985、4 度なら約 0.998 です。太陽の向き `sunDir` とレイの向きの `dot` が 1 に近い所ほど、太陽に近い所です。",
        en: "Let's add a sun. This calls for a new function, `dot` (the dot product). `dot(a, b)` computes `a.x * b.x + a.y * b.y + a.z * b.z`, and **for two arrows of length 1 it tells you how closely their directions agree**: 1.0 for the same direction, 0.0 for a right angle, -1.0 for opposite directions. Ten degrees apart gives about 0.985; four degrees gives about 0.998. The closer `dot` of the ray and the sun direction `sunDir` is to 1, the closer that pixel is to the sun.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 rd = normalize(vec3(p, 1.5));

          //ja: 上を向いたレイほど濃い青
          //en: the more a ray points up, the deeper the blue
          vec3 col = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          //ja: 下を向いたレイは地面の色
          //en: rays that point down see the ground
          if (rd.y < 0.0) col = vec3(0.35, 0.3, 0.27);

          //ja: レイが太陽の向きとどれだけそろっているか
          //en: how closely the ray lines up with the sun
          vec3 sunDir = normalize(vec3(0.5, 0.2, 1.0));
          float s = max(dot(rd, sunDir), 0.0);
          col += vec3(1.0, 0.6, 0.3) * pow(s, 24.0) * 0.6;              //ja: まわりの光 //en: the glow
          col = mix(col, vec3(1.0, 0.95, 0.8), smoothstep(0.997, 0.998, s));  //ja: 太陽の円 //en: the disk
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`sunDir` の `0.2` を `0.02` にすると太陽が地平線へ沈みます。`24.0` を `4.0` にすると光が大きく広がります",
        en: "Change the `0.2` in `sunDir` to `0.02` to set the sun on the horizon. Change `24.0` to `4.0` and the glow spreads wide",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`pow(s, 24.0)` は、1 に近い `s` だけを残して、それ以外を急に 0 へ近づけます。`s` が 0.99 なら約 0.79、0.9 なら約 0.08 です。指数を大きくするほど光の輪は小さくなります。[関数で形を作る](/learn/shaping-functions) の `pow` と同じ使い方です。",
        en: "`pow(s, 24.0)` keeps only the values of `s` that are close to 1 and pushes everything else quickly toward 0. At `s` = 0.99 you get about 0.79; at 0.9, about 0.08. The bigger the exponent, the tighter the glow. It is the same use of `pow` as in [Shaping functions](/learn/shaping-functions).",
      },
    },

    { type: "heading", text: { ja: "床との交点を式で解く", en: "Hitting the floor with algebra" } },
    {
      type: "paragraph",
      text: {
        ja: "次は、地面をただの一色ではなく、本物の床にします。床は高さ 0 の平らな面(平面)、つまり **y が 0 の点の集まり** だとします。目は高さ 1 の所 `ro = (0, 1, 0)` に置きます。知りたいのは「レイを何だけ進めると、高さが 0 になるか」です。",
        en: "Next, let's turn the plain ground color into a real floor. Say the floor is a flat surface (a plane) at height 0: **the set of all points whose y is 0**. We put the eye at height 1, `ro = (0, 1, 0)`. What we want to know is how far the ray must travel before its height reaches 0.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "レイの上の点の高さは `ro.y + rd.y * t` です。これが 0 になる `t` は、式を変形して `t = -ro.y / rd.y` です。たとえば `rd.y = -0.25`(少し下向き)なら `t = -1 / -0.25 = 4`、4 だけ先で床に当たります。`rd.y = -0.05`(ほぼ水平)なら `t = 20` で、ずっと遠くです。`rd.y` が 0 に近づくほど `t` はどこまでも大きくなり、地平線で無限の遠さになります。`rd.y` が正のレイは上を向いているので、床には当たりません(`t` が負になります)。",
        en: "The height of a point on the ray is `ro.y + rd.y * t`. Rearranging, the `t` that makes it 0 is `t = -ro.y / rd.y`. For `rd.y = -0.25` (tilted slightly down), `t = -1 / -0.25 = 4`: the ray hits the floor 4 units out. For `rd.y = -0.05` (almost level), `t = 20`, much farther. As `rd.y` approaches 0, `t` grows without limit, and the horizon is infinitely far away. A ray with positive `rd.y` points up and never meets the floor (its `t` would come out negative).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "当たった点 `pos = ro + rd * t` がわかれば、その `pos.x` と `pos.z` は床の上の 2D の座標です。そこに [くり返しとタイル](/learn/repetition) で作った市松模様をそのまま描きます。",
        en: "Once you have the hit point `pos = ro + rd * t`, its `pos.x` and `pos.z` are 2D coordinates on the floor. Draw the checkerboard from [Repetition and tiles](/learn/repetition) on them, just as before.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, 0.0);
          vec3 rd = normalize(vec3(p, 1.5));

          vec3 col = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));

          if (rd.y < 0.0) {
            //ja: 高さ ro.y + rd.y * t が 0 になる t
            //en: the t where the height ro.y + rd.y * t becomes 0
            float t = -ro.y / rd.y;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`ro` を `vec3(0.0, 3.0, 0.0)` にすると目が高くなり、マス目が小さく見えます。`vec3(0.0, 1.0, time)` にすると床の上を前へ進みます",
        en: "Set `ro` to `vec3(0.0, 3.0, 0.0)` to raise the eye and watch the squares shrink. Set it to `vec3(0.0, 1.0, time)` to glide forward over the floor",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "平らな絵なのに、ちゃんと奥へ続く床に見えます。手前のマスは大きく、遠くのマスは小さく、地平線に向かって細くなっていきます。これが **遠近法**(パース)です。私たちは遠近法を描いたのではなく、レイを飛ばしただけです。遠くのものが小さく見えるのは、同じ幅のマスでも、遠いほど少ない数のレイしか当たらないからです。",
        en: "It is a flat picture, yet it reads as a floor stretching away. Near squares are big, far ones small, squeezing toward the horizon. That is **perspective**. We never drew perspective; we only shot rays. Distant things look small because a square of the same width catches fewer and fewer rays the farther away it is.",
      },
    },

    { type: "heading", text: { ja: "遠くを霧でぼかす", en: "Fog in the distance" } },
    {
      type: "paragraph",
      text: {
        ja: "前のプレビューの地平線の近くを見ると、模様がざらざらとちらついています。遠くのマスが 1 ピクセルより小さくなり、1 本のレイが当たる場所がマスの白か黒かを偶然で決めてしまうからです(**エイリアシング** と呼びます)。",
        en: "Look near the horizon in the last preview: the pattern is grainy and shimmery. Far-off squares are smaller than a pixel, so whether a ray lands on a light or dark square comes down to chance. This is called **aliasing**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "いちばん簡単できれいな対策は **霧** です。本物の空気でも、遠くの山ほど白っぽく霞んで見えます。当たるまでの距離 `t` が大きいほど、色を空の色に近づけましょう。[光と仕上げ](/learn/light-and-glow) で光のにじみに使った `exp` がここでも活躍します。`1.0 - exp(-t * 0.08)` は、`t` が 4 なら約 0.27、20 なら約 0.8、50 なら約 0.98 で、遠いほど 1 に近づきます。",
        en: "The simplest and prettiest fix is **fog**. In real air, too, distant mountains look pale and hazy. The larger the distance `t` to the hit, the closer we push the color toward the sky color. The `exp` you used for glow in [Light and finishing](/learn/light-and-glow) does the job again. `1.0 - exp(-t * 0.08)` is about 0.27 at `t` = 4, about 0.8 at 20 and about 0.98 at 50: the farther away, the closer to 1.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, time * 2.0);
          vec3 rd = normalize(vec3(p, 1.5));

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;

          if (rd.y < 0.0) {
            float t = -ro.y / rd.y;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            //ja: 遠いほど空の色に近づける
            //en: the farther away, the closer to the sky color
            float fog = 1.0 - exp(-t * 0.08);
            col = mix(col, sky, fog);
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.08` を `0.3` にすると濃い霧、`0.02` にすると晴れた日になります。`time * 2.0` を `time * 8.0` にすると速く走ります",
        en: "Change `0.08` to `0.3` for thick fog, or `0.02` for a clear day. Change `time * 2.0` to `time * 8.0` to race along",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下を向いたレイの空の色は、`clamp` のおかげで地平線の色 `(0.95, 0.8, 0.65)` になります。だから霧の色と空のいちばん下の色がぴったり一致して、床が空へ溶け込むように見えます。霧の色を空と合わせるのは、3D の場面をきれいに見せるいちばん安上がりなコツです。",
        en: "For rays pointing down, `clamp` makes the sky color the horizon color `(0.95, 0.8, 0.65)`. So the fog color matches the bottom of the sky exactly, and the floor seems to melt into it. Matching the fog to the sky is the cheapest trick there is for making a 3D scene look good.",
      },
    },

    { type: "heading", text: { ja: "球との交点を式で解く", en: "Hitting a sphere with algebra" } },
    {
      type: "paragraph",
      text: {
        ja: "床の次は球です。球の表面は「中心 `ce` からの距離が、ちょうど半径 `ra` の点」の集まりです。レイの上の点 `ro + rd * t` がそうなる `t` を探します。",
        en: "After the floor, a sphere. A sphere's surface is the set of points whose distance from the center `ce` is exactly the radius `ra`. We look for the `t` that puts the ray point `ro + rd * t` on it.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`oc = ro - ce`(中心から目への矢印)と置くと、レイの上の点から中心への距離の 2 乗は `dot(oc + rd * t, oc + rd * t)` です。これが `ra * ra` に等しくなる、という式を展開すると、`rd` の長さが 1 なので `t * t + 2.0 * b * t + c = 0` という形になります。ここで `b = dot(oc, rd)`、`c = dot(oc, oc) - ra * ra` です。これは 2 次方程式で、答えは `t = -b ± sqrt(b * b - c)` です。",
        en: "Write `oc = ro - ce` (the arrow from the center to the eye). The squared distance from a ray point to the center is `dot(oc + rd * t, oc + rd * t)`. Set it equal to `ra * ra` and expand, and because `rd` has length 1 you get `t * t + 2.0 * b * t + c = 0`, where `b = dot(oc, rd)` and `c = dot(oc, oc) - ra * ra`. That is a quadratic equation, and its solutions are `t = -b ± sqrt(b * b - c)`.",
      },
    },
    {
      type: "code",
      source: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;  //ja: 当たらない //en: a miss
          return -b - sqrt(h);       //ja: 手前の交点 //en: the near hit
        }
      `,
      caption: {
        ja: "当たればそこまでの距離 `t` を、外れれば -1.0 を返す",
        en: "Returns the distance `t` to the hit, or -1.0 for a miss",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`h = b * b - c` が負なら、`sqrt` の中が負で答えが無い。レイは球の横を素通りする",
          en: "If `h = b * b - c` is negative, there is no square root and no answer: the ray passes the sphere by",
        },
        {
          ja: "答えは 2 つある。レイが球に入る点(手前)と出る点(奥)。見えるのは手前なので、小さいほうの `-b - sqrt(h)` を使う",
          en: "There are two answers: where the ray enters the sphere (near) and where it leaves (far). We see the near one, so we take the smaller, `-b - sqrt(h)`",
        },
        {
          ja: "`t` が負なら、球は目の後ろにある。使うときは `t > 0.0` を確かめる",
          en: "A negative `t` means the sphere is behind the eye, so check `t > 0.0` before using it",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめます。目が `ro = (0, 1, -3)`、球の中心が `ce = (0, 1, 0)`、半径 1。まっすぐ奥へ向かうレイ `rd = (0, 0, 1)` なら、`oc = (0, 0, -3)`、`b = -3`、`c = 9 - 1 = 8`、`h = 9 - 8 = 1` です。`t = 3 - 1 = 2` なので、2 だけ進んだ `z = -1` の所、つまり球の手前の面に当たります。正しいですね。もう 1 つの答え `t = 3 + 1 = 4` は球の奥の面です。",
        en: "Let's check with numbers. Eye at `ro = (0, 1, -3)`, sphere center `ce = (0, 1, 0)`, radius 1. For the straight-ahead ray `rd = (0, 0, 1)`: `oc = (0, 0, -3)`, `b = -3`, `c = 9 - 1 = 8`, `h = 9 - 8 = 1`. So `t = 3 - 1 = 2`: two units out, at `z = -1`, the front of the sphere. Correct. The other answer, `t = 3 + 1 = 4`, is the back.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "式の変形を全部追えなくても大丈夫です。「`h` が負なら外れ、そうでなければ `-b - sqrt(h)` が距離」という使い方さえわかれば、先へ進めます。そして次の回では、こうした式をまったく使わずに形を描く方法を習います。",
        en: "Don't worry if you can't follow every step of the algebra. If you know how to use it, \"if `h` is negative it's a miss, otherwise `-b - sqrt(h)` is the distance\", you can keep going. And next lesson you will learn a way to draw shapes with no equations like this at all.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "まずは球だけを描きます。当たった所は、近いほど明るくしてみます。球の真ん中に当たるレイは `t = 2`、球のふちをかすめるレイは `t` が約 2.83 なので、`1.0 - (t - 2.0)` で真ん中が 1、ふちが約 0.17 になります。距離の違いだけで、丸みが見えてきます。",
        en: "First, just the sphere. Where a ray hits, we make it brighter the nearer the hit is. A ray hitting the middle has `t = 2`, and a ray grazing the rim has `t` of about 2.83, so `1.0 - (t - 2.0)` gives 1 in the middle and about 0.17 at the rim. Distance alone is enough to suggest roundness.",
      },
    },
    {
      type: "playground",
      source: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, -3.0);
          vec3 rd = normalize(vec3(p, 1.5));
          vec3 col = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));

          float t = hitSphere(ro, rd, vec3(0.0, 1.0, 0.0), 1.0);
          if (t > 0.0) {
            //ja: 近い(t が小さい)ほど明るく
            //en: nearer (smaller t) means brighter
            float shade = clamp(1.0 - (t - 2.0), 0.0, 1.0);
            col = vec3(1.0, 0.45, 0.3) * shade;
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "中心を `vec3(sin(time), 1.0, 0.0)` にすると左右に動きます。半径の `1.0` を `0.5` にすると?",
        en: "Make the center `vec3(sin(time), 1.0, 0.0)` and it slides side to side. What if the radius `1.0` becomes `0.5`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "では、床と球を同じ場面に置きます。1 本のレイが床にも球にも当たることがあります。そのときは **近いほうが見える**。手前のものが奥のものを隠す、というあたりまえのことを、距離 `t` を比べて決めます。`t` に「いままで見つかったいちばん近い当たり」を覚えておき、もっと近いものが見つかったら色ごと上書きします。何にも当たらなかったときのために、最初は大きな値(ここでは 100)を入れておきます。",
        en: "Now put the floor and the sphere in the same scene. A single ray can hit both. When it does, **the nearer one is what you see**. That everyday fact, near things hiding far things, is decided by comparing the distances `t`. We keep the nearest hit found so far in `t`, and whenever something nearer turns up, we overwrite it along with the color. To handle rays that hit nothing, `t` starts out at a large value (100 here).",
      },
    },
    {
      type: "playground",
      source: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, -3.0);
          vec3 rd = normalize(vec3(p, 1.5));
          vec3 ce = vec3(0.0, 1.0, 0.0);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;  //ja: いちばん近い当たり(まだ無し) //en: nearest hit so far (none yet)

          //ja: 床
          //en: the floor
          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            //ja: 球の真下を暗く(影もどき。本物の影は第 24 回)
            //en: darken below the ball (a fake shadow; real ones come in lesson 24)
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
          }

          //ja: 球。床より近ければ上書きする
          //en: the ball: overwrite if it is nearer than the floor
          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            //ja: 上の面ほど明るく
            //en: brighter toward the top
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`ce` を `vec3(0.0, 1.0 + abs(sin(time * 2.0)), 0.0)` にすると球がはずみます。床と球の `if` の順番を入れ替えても絵は変わりません。なぜでしょう?",
        en: "Set `ce` to `vec3(0.0, 1.0 + abs(sin(time * 2.0)), 0.0)` to make the ball bounce. Swapping the order of the floor and ball `if`s does not change the picture. Why not?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "最後の `mix` で、場面全体に霧をかけています。空のピクセルは `t` が 100 のままなので、霧の量がほぼ 1 になり、空の色そのものになります。床も球も空も、同じ 1 行で正しく扱えるのが、`t` を 1 つの変数にまとめたうれしいところです。",
        en: "The final `mix` adds fog to the whole scene. Sky pixels still have `t` at 100, so the fog amount is almost 1 and they come out as the sky color itself. Keeping `t` in one variable means a single line handles floor, ball and sky correctly.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "球の明るさに使った `pos.y - ce.y` は、当たった点が球の中心よりどれだけ上にあるか(-1〜1)です。表面が上を向いている所ほど明るい、という手抜きの陰です。表面の向きをきちんと求めて光を当てる方法は、[法線と光](/learn/normals-and-lighting) で習います。",
        en: "The ball's brightness uses `pos.y - ce.y`, how far above the center the hit point is (-1 to 1). It is a lazy shade that says \"surfaces facing up are brighter\". You will learn to find the surface direction properly and light it in [Normals and lighting](/learn/normals-and-lighting).",
      },
    },

    { type: "heading", text: { ja: "焦点距離と画角", en: "Focal length and field of view" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでずっと `vec3(p, 1.5)` の `1.5` を使ってきました。これは目から画面までの距離で、カメラでいう **焦点距離** にあたります。この数を変えると、どれだけ広い範囲が写るか(**画角**)が変わります。",
        en: "We have used the `1.5` in `vec3(p, 1.5)` all along. It is the distance from the eye to the screen, the camera's **focal length**. Changing it changes how wide a slice of the world you see: the **field of view**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "画面のいちばん上の点は `p.y = 1` です。焦点距離が 1.5 なら、そこを通るレイは「奥へ 1.5 進む間に上へ 1 上がる」向きで、水平から約 34 度上を向いています。下も同じなので、上下の画角は約 67 度です。焦点距離を 1.0 にすると 45 度ずつで画角 90 度(広角)、3.0 にすると約 18 度ずつで画角 37 度(望遠)です。逆に、画角を 60 度にしたいなら、焦点距離は 1 ÷ tan(30 度) ≈ 1.73 です。",
        en: "The top of the screen is at `p.y = 1`. With a focal length of 1.5, the ray through it rises 1 for every 1.5 it goes forward, which tilts it about 34 degrees above level. The bottom is the same, so the vertical field of view is about 67 degrees. A focal length of 1.0 gives 45 degrees each way, a 90-degree view (wide angle); 3.0 gives about 18 degrees each way, a 37-degree view (telephoto). Going the other way, if you want a 60-degree view, the focal length is 1 ÷ tan(30°) ≈ 1.73.",
      },
    },
    {
      type: "playground",
      source: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 焦点距離を 0.8〜3.0 の間で行き来させる
          //en: swing the focal length between 0.8 and 3.0
          float focal = 1.9 + 1.1 * sin(time * 0.7);
          vec3 ro = vec3(0.0, 1.0, -4.0);
          vec3 rd = normalize(vec3(p, focal));
          vec3 ce = vec3(0.0, 1.0, 0.0);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;

          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
          }

          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`focal` を `0.6` に固定すると魚眼のような広角に、`4.0` にすると球が画面からはみ出します。そのとき `ro` の `-4.0` を `-10.0` にすると?",
        en: "Fix `focal` at `0.6` for a near-fisheye wide angle, or at `4.0` and the ball overflows the screen. Then what happens if you change the `-4.0` in `ro` to `-10.0`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "焦点距離を変えるのは、ズームレンズを回すのと同じです。目の位置は動かないので、写る範囲だけが広がったり狭まったりします。一方、目を近づける・遠ざけるのは、自分が歩いて動くことです。広角で近くから撮ると手前が大きく奥が小さい、遠近感の強い絵に、望遠で遠くから撮ると奥行きが詰まった平らな絵になります。課題の 3 つ目で、この 2 つの違いを使った映画の技を作ります。",
        en: "Changing the focal length is like turning a zoom lens. The eye stays put; only the framing widens or narrows. Moving the eye closer or farther is like walking. Shoot wide from up close and you get strong perspective, with near things big and far things small; shoot telephoto from far away and depth gets compressed into a flat-looking picture. In the third exercise you will use that difference for a famous movie trick.",
      },
    },

    { type: "heading", text: { ja: "カメラを向ける", en: "Aiming the camera" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでのカメラは、いつもまっすぐ奥(+z の向き)を見ていました。上から見下ろしたり、横から回り込んだりするには、カメラの向きを変える必要があります。そこで、目の位置 `ro` と、見たい点 `ta`(target)から、カメラの向きを作る関数 `camera` を用意します。",
        en: "So far the camera has always looked straight ahead, along +z. To look down from above or circle around to the side, we need to turn it. So we write a function, `camera`, that builds the camera's orientation from the eye position `ro` and the point we want to look at, `ta` (the target).",
      },
    },
    {
      type: "code",
      source: `
        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);                       //ja: 前 //en: forward
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f)); //ja: 右 //en: right
          vec3 u = cross(f, r);                              //ja: 上 //en: up
          return mat3(r, u, f);
        }

        //ja: 使い方。1.5 が焦点距離
        //en: how to use it; 1.5 is the focal length
        vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`f`(前)は、目から見たい点への向き。`ta - ro` を長さ 1 にしたもの",
          en: "`f` (forward) is the direction from the eye to the target: `ta - ro` scaled to length 1",
        },
        {
          ja: "`r`(右)は、真上 `(0, 1, 0)` と前の両方に直角な向き。`cross`(外積)は、2 つの矢印の両方に直角な矢印を返す関数",
          en: "`r` (right) is at right angles to both straight up `(0, 1, 0)` and forward. `cross` (the cross product) returns an arrow perpendicular to both of its inputs",
        },
        {
          ja: "`u`(上)は、前と右の両方に直角な向き。カメラにとっての「上」",
          en: "`u` (up) is perpendicular to both forward and right: \"up\" as the camera sees it",
        },
        {
          ja: "`mat3(r, u, f)` は、この 3 本を列に並べた 3x3 の表。[座標を動かす](/learn/transforms) の `mat2` の 3D 版",
          en: "`mat3(r, u, f)` is a 3x3 table with these three as its columns, the 3D version of the `mat2` from [Moving space](/learn/transforms)",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "行列と矢印のかけ算 `mat3(r, u, f) * v` は、`r * v.x + u * v.y + f * v.z` と同じです。つまり `camera(ro, ta) * vec3(p, 1.5)` は「カメラの右へ `p.x`、カメラの上へ `p.y`、カメラの前へ 1.5」進む向きです。これまでの「x へ `p.x`、y へ `p.y`、z へ 1.5」を、カメラの 3 本の向きに置きかえただけです。まっすぐ奥を見ているときは `r = (1, 0, 0)`、`u = (0, 1, 0)`、`f = (0, 0, 1)` になり、前と同じ結果になります。",
        en: "Multiplying a vector by the matrix, `mat3(r, u, f) * v`, is the same as `r * v.x + u * v.y + f * v.z`. So `camera(ro, ta) * vec3(p, 1.5)` means \"go `p.x` along the camera's right, `p.y` along the camera's up, and 1.5 along the camera's forward\". It is the old \"`p.x` along x, `p.y` along y, 1.5 along z\" with the axes swapped for the camera's own three directions. When the camera looks straight ahead, `r = (1, 0, 0)`, `u = (0, 1, 0)` and `f = (0, 0, 1)`, and you get exactly what you had before.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数で見てみます。`ro = (0, 2.5, -4)` から `ta = (0, 0.8, 0)` を見ると、`ta - ro = (0, -1.7, 4)` で、長さ 1 にすると `f ≈ (0, -0.39, 0.92)`、少し下向きです。`r` は `(1, 0, 0)` のまま、`u ≈ (0, 0.92, 0.39)` で、カメラの「上」は少し前に傾きます。3 本はたがいに直角で、どれも長さ 1 です。",
        en: "In numbers: looking from `ro = (0, 2.5, -4)` at `ta = (0, 0.8, 0)` gives `ta - ro = (0, -1.7, 4)`, which normalizes to `f ≈ (0, -0.39, 0.92)`, pointing a little down. `r` stays `(1, 0, 0)`, and `u ≈ (0, 0.92, 0.39)`, so the camera's \"up\" leans slightly forward. All three are at right angles to each other and all have length 1.",
      },
    },
    {
      type: "playground",
      source: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.5, -4.0);  //ja: 目の位置 //en: eye position
          vec3 ta = vec3(0.0, 0.8, 0.0);   //ja: 見たい点 //en: look-at point
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));
          vec3 ce = vec3(0.0, 1.0, 0.0);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;

          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
          }

          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`ro` を `vec3(0.0, 6.0, -3.0)` にすると見下ろす視点に。`ta` を `vec3(3.0, 0.0, 0.0)` にすると、球を外して右のほうを見ます",
        en: "Set `ro` to `vec3(0.0, 6.0, -3.0)` for a bird's-eye view. Set `ta` to `vec3(3.0, 0.0, 0.0)` to look off to the right, past the ball",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`ta` を `ro` の真上や真下に置くと、前の向きが `(0, 1, 0)` と同じ線の上に来て、`cross` の答えが長さ 0 になります。長さ 0 の矢印は `normalize` できず、画面が真っ黒になったり、ちらついたりします。真上から見下ろしたいときは、`ta` を少しだけ横にずらしてください。",
        en: "If `ta` sits directly above or below `ro`, forward lines up with `(0, 1, 0)` and `cross` returns an arrow of length 0. A zero-length arrow cannot be normalized, and the screen goes black or flickers. To look straight down, nudge `ta` slightly to one side.",
      },
    },

    { type: "heading", text: { ja: "カメラを回す", en: "Orbiting the camera" } },
    {
      type: "paragraph",
      text: {
        ja: "`camera` があれば、カメラを動かしても見たい点を見続けられます。[時間で動かす](/learn/time-and-motion) で円周の上を回したのと同じように、目の位置を `sin` と `cos` で xz の面(床と平行な面)の円の上に置けば、球のまわりをぐるりと回る映像になります。角度 `a` が 0 のとき、目は見たい点から `(0, 1.5, -4)` だけ離れた所、つまりこれまでと同じ手前の位置です。",
        en: "With `camera`, you can move the camera and still keep it pointed at what you care about. Just as you moved a point around a circle in [Time and motion](/learn/time-and-motion), place the eye on a circle in the xz plane (the plane parallel to the floor) with `sin` and `cos`, and the camera orbits the ball. At angle `a` = 0, the eye is at `(0, 1.5, -4)` relative to the target, the same front view as before.",
      },
    },
    {
      type: "playground",
      source: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = time * 0.3;
          vec3 ta = vec3(0.0, 0.8, 0.0);
          //ja: 見たい点のまわりの、半径 4 の円の上
          //en: on a circle of radius 4 around the target
          vec3 ro = ta + vec3(4.0 * sin(a), 1.5, -4.0 * cos(a));
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));
          vec3 ce = vec3(0.0, 1.0, 0.0);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;

          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
          }

          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`time * 0.3` を `mouse.x * 2.0` にすると、カーソルを左右に動かして回せます。円の半径 `4.0` を両方 `2.5` にすると近づきます",
        en: "Replace `time * 0.3` with `mouse.x * 2.0` to orbit by moving the cursor left and right. Change both radii of `4.0` to `2.5` to move in closer",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "球は 1 つで、場面は何も動いていません。それでも、床のマス目が流れていくので、カメラが回っていることがはっきりわかります。3D のおもしろさは、同じ場面をどこから見るかを自由に選べるところにあります。この回で作った `camera(ro, ta)` は、第 3 部のこの先すべての回で使います。",
        en: "There is one ball and nothing in the scene moves. Yet the checkered floor sliding by makes it obvious that the camera is circling. Much of the fun of 3D is that you can choose freely where to view the same scene from. The `camera(ro, ta)` you built here is used in every remaining lesson of Part 3.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "レイを飛ばして当たりを調べる、という流れを自分の手で組み立ててみましょう。詰まったらヒントを 1 つずつ開けてください。",
        en: "Put the cast-a-ray-and-find-the-hit routine together with your own hands. If you get stuck, open the hints one at a time.",
      },
    },
    {
      type: "exercise",
      title: { ja: "2 つ目の球", en: "A second ball" },
      prompt: {
        ja: "回るカメラの場面に、もう 1 つ小さな青い球(中心 `(1.6, 0.4, 0.6)`、半径 0.4)を置いてください。大きい球と重なって見える角度でも、手前の球が奥の球を正しく隠すようにします。床には小さな球の影もどきも付けましょう。",
        en: "Add a second, smaller blue ball (center `(1.6, 0.4, 0.6)`, radius 0.4) to the orbiting scene. Even at angles where it overlaps the big ball, the nearer ball must correctly hide the farther one. Give the small ball its own fake shadow on the floor, too.",
      },
      starter: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = time * 0.3;
          vec3 ta = vec3(0.0, 0.8, 0.0);
          vec3 ro = ta + vec3(4.0 * sin(a), 1.5, -4.0 * cos(a));
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));
          vec3 ce = vec3(0.0, 1.0, 0.0);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;

          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
          }

          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          //ja: ここに 2 つ目の球を足す
          //en: add the second ball here

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = time * 0.3;
          vec3 ta = vec3(0.0, 0.8, 0.0);
          vec3 ro = ta + vec3(4.0 * sin(a), 1.5, -4.0 * cos(a));
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));
          vec3 ce = vec3(0.0, 1.0, 0.0);
          vec3 ce2 = vec3(1.6, 0.4, 0.6);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;

          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
            //ja: 小さい球の影もどき。半径に合わせて範囲も小さく
            //en: the small ball's fake shadow, sized to its radius
            col *= 0.5 + 0.5 * smoothstep(0.0, 0.55, length(pos.xz - ce2.xz));
          }

          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          //ja: 2 つ目の球も「いままでより近ければ上書き」
          //en: the second ball also overwrites only if it is nearer
          float ts2 = hitSphere(ro, rd, ce2, 0.4);
          if (ts2 > 0.0 && ts2 < t) {
            t = ts2;
            vec3 pos = ro + rd * t;
            //ja: 半径 0.4 で割って -1〜1 にそろえる
            //en: divide by the radius 0.4 to get -1..1
            col = vec3(0.3, 0.55, 1.0) * (0.55 + 0.45 * (pos.y - ce2.y) / 0.4);
          }

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "大きい球と同じ 3 つの手順(`hitSphere` を呼ぶ・`t` と比べる・近ければ `t` と `col` を上書き)を、もう一度書きます",
          en: "Repeat the same three steps as for the big ball: call `hitSphere`, compare with `t`, and if nearer, overwrite `t` and `col`",
        },
        {
          ja: "上が明るい陰の `pos.y - ce.y` は、半径 1 のときに -1〜1 でした。半径 0.4 なら `0.4` で割ります",
          en: "The top-lit shade `pos.y - ce.y` ran from -1 to 1 for radius 1. For radius 0.4, divide it by `0.4`",
        },
        {
          ja: "影もどきは床の `if` の中に `col *= 0.5 + 0.5 * smoothstep(0.0, 0.55, length(pos.xz - ce2.xz));` を足します",
          en: "For the fake shadow, add `col *= 0.5 + 0.5 * smoothstep(0.0, 0.55, length(pos.xz - ce2.xz));` inside the floor's `if`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "夕暮れの霧", en: "Sunset haze" },
      prompt: {
        ja: "床の上を進む場面を、夕暮れにしてください。太陽は地平線のすぐ上の正面に置き、空はオレンジから紺へのグラデーションにします。さらに、霧の色を **太陽の方向ほどオレンジに** すると、遠くの床が夕日に照らされたように光ります。",
        en: "Turn the scene of gliding over the floor into a sunset. Put the sun straight ahead, just above the horizon, and make the sky a gradient from orange to deep blue. Then make the fog color **more orange toward the sun**, so the distant floor glows as if lit by the setting sun.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, time * 2.0);
          vec3 rd = normalize(vec3(p, 1.5));

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;

          if (rd.y < 0.0) {
            float t = -ro.y / rd.y;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            float fog = 1.0 - exp(-t * 0.08);
            col = mix(col, sky, fog);
          }
          return vec4(col, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, time * 2.0);
          vec3 rd = normalize(vec3(p, 1.5));

          vec3 sunDir = normalize(vec3(0.0, 0.08, 1.0));
          float s = max(dot(rd, sunDir), 0.0);

          //ja: 地平線はオレンジ、上は紺
          //en: orange at the horizon, deep blue above
          vec3 sky = mix(vec3(1.0, 0.5, 0.25), vec3(0.1, 0.12, 0.35), clamp(rd.y * 2.5, 0.0, 1.0));
          //ja: 霧の色: 太陽の方向ほど明るいオレンジ
          //en: fog color: brighter orange toward the sun
          vec3 fogCol = mix(vec3(0.45, 0.3, 0.4), vec3(1.0, 0.6, 0.3), pow(s, 8.0));
          vec3 col = mix(sky, fogCol, 0.5);
          col += vec3(1.0, 0.5, 0.2) * pow(s, 32.0) * 0.6;
          col = mix(col, vec3(1.0, 0.9, 0.7), smoothstep(0.997, 0.998, s));

          if (rd.y < 0.0) {
            float t = -ro.y / rd.y;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.08, 0.06, 0.12), vec3(0.45, 0.3, 0.3), c);
            float fog = 1.0 - exp(-t * 0.08);
            col = mix(col, fogCol, fog);
          }
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "太陽の向き `sunDir` は、y を小さく(0.05〜0.1)して z を 1.0 にすると、正面の地平線のすぐ上に来ます",
          en: "For the sun direction `sunDir`, a small y (0.05 to 0.1) and a z of 1.0 puts it straight ahead, just above the horizon",
        },
        {
          ja: "`dot(rd, sunDir)` が 1 に近いほど太陽の方向です。`pow(s, 8.0)` のように少し小さめの指数にすると、広い範囲がほんのり色づきます",
          en: "The closer `dot(rd, sunDir)` is to 1, the closer to the sun. A smallish exponent, like `pow(s, 8.0)`, tints a broad area softly",
        },
        {
          ja: "`vec3 fogCol = mix(紫がかった灰色, オレンジ, pow(s, 8.0));` を作って、床の霧の `mix(col, sky, fog)` の `sky` を `fogCol` に変えます",
          en: "Make `vec3 fogCol = mix(purplish gray, orange, pow(s, 8.0));` and replace `sky` with `fogCol` in the floor's `mix(col, sky, fog)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "ドリーズーム", en: "The dolly zoom" },
      prompt: {
        ja: "カメラが球から遠ざかったり近づいたりしています。焦点距離も一緒に変えて、**球の大きさは画面の上で変わらないのに、まわりの床の奥行きだけがぐにゃりと伸び縮みする** 映像にしてください。映画で緊張の瞬間に使われる「ドリーズーム」という技です。",
        en: "The camera is moving toward and away from the ball. Change the focal length along with it, so that **the ball stays the same size on screen while the floor's depth stretches and squashes around it**. This is the \"dolly zoom\", a trick films use for moments of shock.",
      },
      starter: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 球の中心までの距離(3〜6 を行き来する)
          //en: distance to the ball's center (swings between 3 and 6)
          float dist = 4.5 + 1.5 * sin(time);
          float focal = 1.5;  //ja: ここを dist を使って書き換える //en: rewrite this using dist
          vec3 ro = vec3(0.0, 1.0, -dist);
          vec3 rd = normalize(vec3(p, focal));
          vec3 ce = vec3(0.0, 1.0, 0.0);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;

          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
          }

          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float hitSphere(vec3 ro, vec3 rd, vec3 ce, float ra) {
          vec3 oc = ro - ce;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - ra * ra;
          float h = b * b - c;
          if (h < 0.0) return -1.0;
          return -b - sqrt(h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float dist = 4.5 + 1.5 * sin(time);
          //ja: 画面での大きさは focal / dist にだいたい比例する。
          //en: on-screen size is roughly proportional to focal / dist,
          //ja: 比を一定にすれば、球の大きさはほぼ変わらない
          //en: so keeping the ratio fixed keeps the ball's size nearly constant
          float focal = dist * 0.4;
          vec3 ro = vec3(0.0, 1.0, -dist);
          vec3 rd = normalize(vec3(p, focal));
          vec3 ce = vec3(0.0, 1.0, 0.0);

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          float t = 100.0;

          float tf = -ro.y / rd.y;
          if (rd.y < 0.0 && tf < t) {
            t = tf;
            vec3 pos = ro + rd * t;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            col *= 0.5 + 0.5 * smoothstep(0.0, 1.3, length(pos.xz - ce.xz));
          }

          float ts = hitSphere(ro, rd, ce, 1.0);
          if (ts > 0.0 && ts < t) {
            t = ts;
            vec3 pos = ro + rd * t;
            col = vec3(1.0, 0.45, 0.3) * (0.55 + 0.45 * (pos.y - ce.y));
          }

          col = mix(col, sky, 1.0 - exp(-t * 0.08));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "遠ざかると球は小さく見えます。小さくなったぶん、焦点距離を大きくして(望遠にして)拡大すればよいはずです",
          en: "Moving away makes the ball look smaller. Make up for it by raising the focal length (zooming in) by the same amount",
        },
        {
          ja: "画面での大きさは、だいたい「焦点距離 ÷ 距離」に比例します。この比が変わらないようにするには?",
          en: "The on-screen size is roughly proportional to focal length divided by distance. How do you keep that ratio fixed?",
        },
        {
          ja: "`float focal = dist * 0.4;` にすると、`dist` が 2 倍になれば `focal` も 2 倍になります",
          en: "With `float focal = dist * 0.4;`, doubling `dist` doubles `focal` too",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "3D では、点ごとに目からレイを飛ばし、最初に当たったものの色にする。レイの上の点は `ro + rd * t`",
          en: "In 3D, each pixel shoots a ray from the eye and takes the color of the first thing it hits. Points on the ray are `ro + rd * t`",
        },
        {
          ja: "`rd = normalize(vec3(p, 1.5))`。`1.5` は焦点距離で、大きいほど画角が狭い(望遠)",
          en: "`rd = normalize(vec3(p, 1.5))`. The `1.5` is the focal length; bigger means a narrower view (telephoto)",
        },
        {
          ja: "`dot` は 2 つの向きのそろい具合。同じ向きで 1、直角で 0",
          en: "`dot` measures how closely two directions agree: 1 when they match, 0 at right angles",
        },
        {
          ja: "床は `t = -ro.y / rd.y`、球は 2 次方程式で、当たる距離 `t` を求められる。複数あるときは `t` が小さいほうが見える",
          en: "For a floor, `t = -ro.y / rd.y`; for a sphere, a quadratic gives `t`. When several things are hit, the smallest `t` wins",
        },
        {
          ja: "`1.0 - exp(-t * k)` で遠くを空の色に近づけると、ちらつきが消えて奥行きが出る",
          en: "Blending toward the sky color by `1.0 - exp(-t * k)` removes the shimmer and adds depth",
        },
        {
          ja: "`camera(ro, ta)` で、目の位置と見たい点からカメラの向きを作る。目を円の上で動かせば、まわりを回れる",
          en: "`camera(ro, ta)` builds the camera's orientation from the eye position and the target. Move the eye on a circle to orbit",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "床と球は、式で当たりを解けるからこそ描けました。でも、トーラスや、なめらかにつながった形には、そんな便利な式がありません。次の回の [レイマーチング](/learn/raymarching) では、[距離で描く](/learn/sdf-2d) で使った距離関数を 3D に広げて、どんな形でも同じやり方で描く方法を習います。",
        en: "We could draw the floor and the sphere because their hits can be solved with algebra. Doughnut shapes and smoothly blended forms have no such handy formula. Next, in [Raymarching](/learn/raymarching), you will extend the distance functions from [Drawing with distance](/learn/sdf-2d) into 3D and learn one method that draws any shape the same way.",
      },
    },
  ],
};

export default lesson;
