import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "normals-and-lighting",
  title: { ja: "法線と光", en: "Normals and lighting" },
  summary: {
    ja: "表面の向き(法線)を求め、拡散光・反射光・環境光で立体感を出す",
    en: "Find surface normals and shade with diffuse, specular and ambient light",
  },
  minutes: 55,
  goals: [
    {
      ja: "距離関数の傾きから表面の向き(法線)を求める `calcNormal` のしくみがわかり、法線を色で確かめられる",
      en: "Understand how `calcNormal` finds the surface direction (the normal) from the slope of the distance function, and check normals as colors",
    },
    {
      ja: "`dot(n, l)` の拡散光と、空からの半球の環境光で、形に立体感を出せる",
      en: "Give shapes depth with diffuse light from `dot(n, l)` and hemisphere ambient light from the sky",
    },
    {
      ja: "Blinn-Phong の鏡面反射(つや)とリムライト(ふちの光)を足せる",
      en: "Add Blinn-Phong specular highlights (shine) and a rim light (edge glow)",
    },
    {
      ja: "色のついた光を複数重ね、ガンマ補正で自然な明るさに仕上げられる",
      en: "Layer several colored lights and finish with gamma correction for natural brightness",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "表面の向き(法線)", en: "Which way does the surface face?" } },
    {
      type: "paragraph",
      text: {
        ja: "[レイマーチング](/learn/raymarching) で形は描けるようになりましたが、色は高さや距離で塗っただけで、どこか平らに見えました。本物の物が立体に見えるのは、**光の当たり方が場所ごとに違う** からです。光のほうを向いた面は明るく、そっぽを向いた面は暗くなります。",
        en: "With [Raymarching](/learn/raymarching) we could draw shapes, but coloring them by height or distance left them looking somewhat flat. Real objects look solid because **light falls differently on each part**. Surfaces facing the light are bright; surfaces turned away are dark.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "そのためには、当たった点で表面がどちらを向いているかを知る必要があります。表面にまっすぐ立てた、外向きで長さ 1 の矢印を **法線**(ほうせん、normal)と呼び、ふつう `n` と書きます。床なら真上 `(0, 1, 0)`、球なら「中心から当たった点へ」の向きです。",
        en: "For that, we need to know which way the surface faces at the hit point. An arrow of length 1, standing straight out from the surface, is called the **normal**, usually written `n`. For a floor it points straight up, `(0, 1, 0)`; for a sphere it points from the center toward the hit point.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "どんな形でも法線を求められる方法があります。距離関数は、表面から **まっすぐ離れる向き** に動くといちばん速く増え、表面に **沿って** 動くとほとんど変わりません。だから、当たった点から x・y・z の 3 つの向きに少しずつ動いてみて、距離がそれぞれどれだけ増えるかを測れば、「いちばん速く増える向き」がわかります。それが法線です。この「増え方の向き」を数学では **勾配**(こうばい)と呼びます。",
        en: "There is a way to find the normal for any shape. A distance function grows fastest when you move **straight away** from the surface, and barely changes when you move **along** it. So if we nudge the hit point a little along x, y and z and measure how much the distance grows each way, we learn the direction of fastest growth. That is the normal. Mathematicians call this direction of growth the **gradient**.",
      },
    },
    {
      type: "code",
      source: `
        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),  //ja: x に動かしたときの増え方 //en: growth along x
            map(p + e.yxy) - map(p - e.yxy),  //ja: y に動かしたときの増え方 //en: growth along y
            map(p + e.yyx) - map(p - e.yyx)));  //ja: z に動かしたときの増え方 //en: growth along z
        }
      `,
      caption: {
        ja: "`map` の後ろに置く(`map` を呼ぶので)",
        en: "Place it after `map`, since it calls `map`",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`e.xyy` は [座標を知る](/learn/coordinates) のスウィズルで、`(0.001, 0, 0)` のこと。`e.yxy` は `(0, 0.001, 0)`、`e.yyx` は `(0, 0, 0.001)`",
          en: "`e.xyy` is a swizzle, as in [Knowing where you are](/learn/coordinates): it means `(0.001, 0, 0)`. `e.yxy` is `(0, 0.001, 0)` and `e.yyx` is `(0, 0, 0.001)`",
        },
        {
          ja: "プラス側とマイナス側の両方で測って差をとるので、片側だけより正確になる(中心差分と呼ぶ)",
          en: "Measuring on both the plus and minus sides and taking the difference is more accurate than one side alone (this is called a central difference)",
        },
        {
          ja: "3 つの差はとても小さい数だが、`normalize` で長さを 1 にそろえるので、向きだけが残る",
          en: "The three differences are tiny numbers, but `normalize` scales the result to length 1, leaving only the direction",
        },
        {
          ja: "`map` を 6 回呼ぶが、当たった後に 1 回だけなので、64 歩のループに比べれば軽い",
          en: "It calls `map` six times, but only once per pixel after the hit, which is cheap next to the 64-step loop",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめます。原点にある半径 1 の球の、表面の点 `(0.6, 0, 0.8)` で測ると、x の差は約 0.0012、y の差は 0(左右対称なので)、z の差は約 0.0016 です。`(0.0012, 0, 0.0016)` を長さ 1 にすると `(0.6, 0, 0.8)`。中心から当たった点への向きと、ぴったり同じになりました。",
        en: "Let's check with numbers. On a radius-1 sphere at the origin, at the surface point `(0.6, 0, 0.8)`, the x difference is about 0.0012, the y difference is 0 (by symmetry), and the z difference is about 0.0016. Normalizing `(0.0012, 0, 0.0016)` gives `(0.6, 0, 0.8)`: exactly the direction from the center to the hit point.",
      },
    },

    { type: "heading", text: { ja: "法線を色で見る", en: "Normals as color" } },
    {
      type: "paragraph",
      text: {
        ja: "光を当てる前に、法線が正しく求まっているかを色で確かめます。[レイとカメラ](/learn/rays-and-camera) で `rd` を色にしたのと同じく、`n * 0.5 + 0.5` で -1〜1 を 0〜1 に直して、そのまま赤・緑・青にします。場面は、大きな球と小さな球を `smin` でなめらかにつないだものと床です。",
        en: "Before adding light, we check the normals with color. Just as we colored `rd` in [Rays and cameras](/learn/rays-and-camera), `n * 0.5 + 0.5` maps -1..1 to 0..1 for red, green and blue. The scene is a big ball and a small ball joined smoothly with `smin`, plus a floor.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.6, 0.7, -4.0);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.1, 0.1, 0.13);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            //ja: 法線の -1〜1 を 0〜1 の色に
            //en: normal's -1..1 as a 0..1 color
            col = n * 0.5 + 0.5;
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`col = n * 0.5 + 0.5;` を `col = vec3(n.y * 0.5 + 0.5);` にすると、上向きの度合いだけが白黒で見えます。`smin` の `0.35` を `0.01` にすると、つなぎ目の色の変わり方は?",
        en: "Change `col = n * 0.5 + 0.5;` to `col = vec3(n.y * 0.5 + 0.5);` to see just how much each part faces up, in grayscale. Change the `0.35` in `smin` to `0.01`: how does the color change at the seam?",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "床は全部、上向き `(0, 1, 0)` なので `(0.5, 1.0, 0.5)` の黄緑",
          en: "The whole floor faces up, `(0, 1, 0)`, so it is the light green `(0.5, 1.0, 0.5)`",
        },
        {
          ja: "球の右側は +x 向きで赤み、左側は -x 向きで赤が抜けて青緑",
          en: "The right side of a ball faces +x and turns reddish; the left side faces -x, loses its red and turns teal",
        },
        {
          ja: "こちらを向いた正面は -z 向きなので、青が抜けて `(0.5, 0.5, 0.0)` に近い黄土色",
          en: "The front, facing us, points along -z, so its blue drops out and it nears the olive `(0.5, 0.5, 0.0)`",
        },
        {
          ja: "`smin` のつなぎ目では、色が急に変わらず、なめらかに移り変わる。向きがなめらかにつながっている証拠",
          en: "At the `smin` seam the color shifts smoothly instead of jumping: proof that the surface direction blends smoothly too",
        },
      ],
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "法線の色の絵は、3D のデバッグでいちばん頼りになる道具です。光の当たり方がおかしいと思ったら、まずこの絵に戻りましょう。ざらざらした模様が出ていたら、`map` の距離が不正確か、レイが表面に届いていません。",
        en: "The normal-color view is the most trustworthy debugging tool in 3D. Whenever the lighting looks wrong, come back to it first. A grainy pattern means either `map` is inaccurate or the rays aren't reaching the surface.",
      },
    },

    { type: "heading", text: { ja: "拡散光", en: "Diffuse light" } },
    {
      type: "paragraph",
      text: {
        ja: "法線がわかったら、光を当てます。まずは太陽のように遠くから平行に届く光を考え、**光のほうへ向かう** 長さ 1 の矢印を `l` とします。表面が光をまっすぐ正面から受けるほど明るく、斜めに受けるほど暗くなります。懐中電灯で机を照らすとき、真上からなら小さく明るい丸、斜めからなら同じ光が細長く広がって暗くなるのと同じです。",
        en: "With normals in hand, we can add light. Start with light arriving in parallel from far away, like the sun, and call the length-1 arrow **pointing toward the light** `l`. A surface that faces the light head-on is brightest, and one that catches it at a slant is darker. Shine a flashlight straight down at a desk and you get a small bright circle; tilt it and the same light spreads into a long, dimmer oval.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この「正面からどれだけずれているか」は、[レイとカメラ](/learn/rays-and-camera) で習った `dot` そのものです。`dot(n, l)` は、光が真上から当たれば 1、60 度傾けば 0.5、真横からなら 0 になります。たとえば `n = (0, 1, 0)` の床に、斜め 45 度の `l ≈ (0.71, 0.71, 0)` から光が来れば、明るさは約 0.71 です。光の反対側を向いた面では負になるので、`max(…, 0.0)` で 0 に切り詰めます。この光を **拡散光**(ディフューズ)と呼びます。紙や粘土のような、つやの無い表面の見え方です。",
        en: "How far off head-on the light is: that is exactly the `dot` from [Rays and cameras](/learn/rays-and-camera). `dot(n, l)` is 1 when the light hits straight on, 0.5 when tilted 60 degrees, and 0 from the side. For example, a floor with `n = (0, 1, 0)` lit from 45 degrees, `l ≈ (0.71, 0.71, 0)`, has brightness about 0.71. On surfaces facing away from the light the value is negative, so `max(…, 0.0)` clamps it to 0. This is called **diffuse** light: the look of matte surfaces like paper or clay.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.6, 0.7, -4.0);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.1, 0.1, 0.13);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            //ja: 床なら 0、物なら 1
            //en: 0 for the floor, 1 for the objects
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.3), vec3(0.6), c), vec3(1.0, 0.45, 0.3), obj);

            //ja: 光のほうへ向かう矢印。時間で回る
            //en: arrow toward the light; it circles over time
            float a = time * 0.7;
            vec3 l = normalize(vec3(cos(a), 0.8, -sin(a)));
            float dif = max(dot(n, l), 0.0);
            col = albedo * dif;
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "光の向きの `0.8` を `0.1` にすると、低い夕日のように横から照らします。`cos(a)` と `-sin(a)` を両方 `0.0` にすると、真上からの光になります",
        en: "Change the `0.8` in the light direction to `0.1` for low, sideways light like a setting sun. Set both `cos(a)` and `-sin(a)` to `0.0` for light from straight overhead",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`albedo`(アルベド)は、その表面がもともと持つ色、つまり白い光を当てたときに返す色の割合です。最終的な色は「表面の色 × 届いた光」になります。床は、市松模様の灰色をアルベドにしています。どこが床かは、前の回と同じく当たった点の高さで決め、`obj` に 0 か 1 を入れて `mix` で切りかえています。",
        en: "`albedo` is the surface's own color: the fraction of white light it sends back. The final color is the surface color times the light that reaches it. The floor's albedo is a gray checkerboard. As in the last lesson, we tell the floor apart by the hit point's height, store 0 or 1 in `obj`, and switch with `mix`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "光の反対側は真っ黒です。でも、現実の世界で影の中が真っ黒になることはめったにありません。空そのものが、青い光で全体をうっすら照らしているからです。次はそれを足します。",
        en: "The side facing away from the light is pitch black. In the real world, though, shade is almost never pure black, because the sky itself softly lights everything with blue light. That is what we add next.",
      },
    },

    { type: "heading", text: { ja: "半球の環境光", en: "Hemisphere ambient light" } },
    {
      type: "paragraph",
      text: {
        ja: "空は頭の上に、半球のドームのように広がっています。だから上を向いた面ほど空がよく見えて、空の光をたくさん受けます。横を向いた面は空の半分だけ、下を向いた面は地面しか見えません。これを簡単に表すのが `0.5 + 0.5 * n.y` です。真上を向けば 1、真横なら 0.5、真下なら 0 になります。この光を **半球の環境光**(ヘミスフィア・アンビエント)と呼びます。",
        en: "The sky spreads overhead like a dome. So the more a surface faces up, the more sky it sees, and the more sky light it gets. A surface facing sideways sees half the sky; one facing down sees only the ground. A simple way to express this is `0.5 + 0.5 * n.y`: 1 facing straight up, 0.5 facing sideways, 0 facing straight down. This is called **hemisphere ambient** light.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "光にも色を付けます。太陽は少し黄色みのある白、空は青です。それぞれの明るさに光の色をかけて足し、最後に表面の色をかけます。光の当たらない側がうっすら青くなり、晴れた日の写真のような見え方になります。",
        en: "Lights get colors too: the sun a slightly warm white, the sky blue. Multiply each brightness by its light color, add them up, and finally multiply by the surface color. The unlit side picks up a faint blue tint, like a photo taken on a sunny day.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.6, 0.7, -4.0);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.1, 0.1, 0.13);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.3), vec3(0.6), c), vec3(1.0, 0.45, 0.3), obj);

            float a = time * 0.7;
            vec3 l = normalize(vec3(cos(a), 0.8, -sin(a)));
            float dif = max(dot(n, l), 0.0);
            //ja: 上を向くほど空の光を受ける
            //en: the more it faces up, the more sky light it gets
            float amb = 0.5 + 0.5 * n.y;

            vec3 sunCol = vec3(1.0, 0.9, 0.75);
            vec3 skyCol = vec3(0.25, 0.35, 0.55);
            col = albedo * (sunCol * dif + skyCol * amb);
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`skyCol` を `vec3(0.5, 0.2, 0.4)` にすると、影の色が紫になります。`sunCol * dif` を消して空の光だけにすると、曇りの日のような絵に",
        en: "Set `skyCol` to `vec3(0.5, 0.2, 0.4)` and the shadows turn purple. Remove `sunCol * dif` to keep only sky light, and it looks like an overcast day",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "球の下のほうは `n.y` が負なので空の光をほとんど受けず、暗いままです。現実には、地面に跳ね返った光が下からも少し照らします。`clamp(-n.y, 0.0, 1.0)` に地面の色をかけて少し足すと、この **照り返し** を真似できます。この回の最後の仕上げで使います。",
        en: "The underside of a ball has negative `n.y`, gets almost no sky light, and stays dark. In reality, light bouncing off the ground lights it a little from below. Adding a bit of `clamp(-n.y, 0.0, 1.0)` times the ground color imitates this **bounce light**. We use it in the final polish at the end of this lesson.",
      },
    },

    { type: "heading", text: { ja: "鏡面反射(つや)", en: "Specular highlights" } },
    {
      type: "paragraph",
      text: {
        ja: "プラスチックや陶器の球を見ると、光源が小さく白く映りこんだ **つや**(ハイライト)があります。これは、表面が鏡のように光をはね返して、それがちょうど目に飛びこむ所に出ます。表面の向きが「光のほうへの向き `l`」と「目のほうへの向き `-rd`」の **ちょうど真ん中** を向いていれば、入ってきた光はそのまま目へはね返ります。",
        en: "Look at a plastic or ceramic ball and you will see a small white reflection of the light source: a **highlight**. It appears where the surface bounces light like a mirror straight into your eye. If the surface faces **exactly halfway** between the direction to the light, `l`, and the direction to the eye, `-rd`, the incoming light bounces right into the eye.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この真ん中の向きを `h = normalize(l - rd)`(ハーフベクトル)と書きます。`l` と `-rd` を足して長さ 1 にしたものです。法線 `n` が `h` に近いほどつやが強く出ます。`dot(n, h)` を `pow` で何乗もすると、1 に近い所だけが残って小さな光の点になります。`dot(n, h)` が 0.95 の所なら、8 乗で約 0.66、32 乗で約 0.19、128 乗でほぼ 0 です。指数が大きいほど、つやは小さく鋭くなり、表面が硬く磨かれたように見えます。この方法を **Blinn-Phong**(ブリン・フォン)の鏡面反射と呼びます。",
        en: "We write this halfway direction as `h = normalize(l - rd)`, the half vector: `l` plus `-rd`, scaled to length 1. The closer the normal `n` is to `h`, the stronger the highlight. Raising `dot(n, h)` to a high power with `pow` keeps only the values near 1, leaving a small spot of light. Where `dot(n, h)` is 0.95, the 8th power is about 0.66, the 32nd about 0.19, and the 128th almost 0. The bigger the exponent, the smaller and sharper the highlight, and the harder and more polished the surface looks. This is **Blinn-Phong** specular reflection.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.6, 0.7, -4.0);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.1, 0.1, 0.13);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.3), vec3(0.6), c), vec3(1.0, 0.45, 0.3), obj);

            float a = time * 0.7;
            vec3 l = normalize(vec3(cos(a), 0.8, -sin(a)));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            //ja: 光と目のちょうど真ん中の向き
            //en: the direction exactly between the light and the eye
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), 32.0) * dif;

            vec3 sunCol = vec3(1.0, 0.9, 0.75);
            vec3 skyCol = vec3(0.25, 0.35, 0.55);
            col = albedo * (sunCol * dif + skyCol * amb);
            col += sunCol * spe * obj;  //ja: つやは物だけ //en: shine on the objects only
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`32.0` を `4.0` にするとゴムのようなぼんやりしたつや、`200.0` にすると磨いたビー玉のような鋭いつやになります",
        en: "Change `32.0` to `4.0` for a soft, rubbery sheen, or `200.0` for the sharp glint of a polished marble",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "つやの色は、表面の色ではなく **光の色** にしています。プラスチックのように、表面の上で光がはね返る素材は、つやが光源の色(ここではほぼ白)になるからです。また `* dif` をかけて、光の当たらない側につやが出ないようにしています。床は `* obj` で、つやを消しています。",
        en: "The highlight uses the **light's color**, not the surface color. On materials like plastic, light bounces off the very top of the surface, so the highlight takes the light source's color (nearly white here). Multiplying by `dif` keeps highlights off the unlit side, and multiplying by `obj` keeps the floor matte.",
      },
    },

    { type: "heading", text: { ja: "リムライト(ふちの光)", en: "Rim light" } },
    {
      type: "paragraph",
      text: {
        ja: "映画や写真では、人物の輪郭を後ろから細く光らせて、背景から浮かび上がらせることがよくあります。これを **リムライト** と呼びます。シェーダーでは、「表面がこちらを向いていない所ほど光る」という簡単な式で真似できます。",
        en: "Films and photos often light a subject's outline thinly from behind to lift it off the background. This is called a **rim light**. In a shader you can fake it with a simple rule: the less a surface faces the viewer, the more it glows.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`dot(n, -rd)` は、表面がどれだけこちらを向いているかです。球の真ん中ではまっすぐこちらを向いて 1、輪郭では真横を向いて 0 です。`1.0 - dot(n, -rd)` にすると逆に、真ん中で 0、輪郭で 1 になります。これを 3 乗すると、輪郭のすぐ近くだけが残ります。`dot(n, -rd)` が 0.5 の所は 0.125、0.1 の所は約 0.73 です。",
        en: "`dot(n, -rd)` tells how much a surface faces you: 1 at the center of a ball, which faces you squarely, and 0 at the outline, which faces sideways. `1.0 - dot(n, -rd)` flips that: 0 at the center, 1 at the outline. Cubing it keeps only the area right by the outline: where `dot(n, -rd)` is 0.5 you get 0.125, and where it is 0.1, about 0.73.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.6, 0.7, -4.0);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.1, 0.1, 0.13);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.3), vec3(0.6), c), vec3(1.0, 0.45, 0.3), obj);

            float a = time * 0.7;
            vec3 l = normalize(vec3(cos(a), 0.8, -sin(a)));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), 32.0) * dif;
            //ja: こちらを向いていない所(輪郭)ほど 1 に近い
            //en: closer to 1 where the surface faces away from us (the outline)
            float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

            vec3 sunCol = vec3(1.0, 0.9, 0.75);
            vec3 skyCol = vec3(0.25, 0.35, 0.55);
            col = albedo * (sunCol * dif + skyCol * amb);
            col += sunCol * spe * obj;
            col += vec3(0.4, 0.7, 1.0) * rim * 0.8 * obj;
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`3.0` を `1.0` にすると光る幅が広がり、`8.0` にすると細い線になります。`* obj` を消すと、遠くの床まで光ってしまうのはなぜでしょう?",
        en: "Change `3.0` to `1.0` to widen the glow, or `8.0` for a thin line. Remove `* obj`, and the distant floor lights up too. Why?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "リムライトは、物理的に正しい光というより、**見せ方のための演出** です。暗い背景の前に暗い物を置いたときでも、輪郭がはっきりします。実は現実でも、物の表面を浅い角度から見ると光をよく映すので(フレネル効果と呼びます)、ふちが明るく見えることは多く、自然な印象になります。",
        en: "A rim light is less physically accurate light than **staging for the viewer**. It keeps an outline crisp even when a dark object sits in front of a dark background. It also looks natural, because real surfaces reflect more light when you view them at a shallow angle (the Fresnel effect), so edges often do look brighter.",
      },
    },

    { type: "heading", text: { ja: "色のついた光を重ねる", en: "Layering colored lights" } },
    {
      type: "paragraph",
      text: {
        ja: "光は何個でも足せます。[はじめてのシェーダー](/learn/first-shader) で見たとおり、光は足すほど明るくなり、色も混ざります。光ごとに同じ計算(拡散光とつや)をするので、関数 `light` にまとめておくと便利です。オレンジの光と青い光を、反対の向きから当ててみましょう。",
        en: "You can add as many lights as you like. As we saw in [Your first shader](/learn/first-shader), light gets brighter the more you add, and the colors mix. Each light needs the same math (diffuse plus highlight), so it is handy to wrap it in a function, `light`. Let's shine an orange light and a blue light from opposite sides.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        //ja: 1 つの光が当たったときの色(拡散光 + つや)
        //en: the color one light contributes (diffuse + highlight)
        vec3 light(vec3 n, vec3 rd, vec3 l, vec3 lightCol, vec3 albedo, float shine) {
          float dif = max(dot(n, l), 0.0);
          vec3 h = normalize(l - rd);
          float spe = pow(max(dot(n, h), 0.0), 32.0) * dif;
          return lightCol * (albedo * dif + spe * shine);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.6, 0.7, -4.0);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.05, 0.05, 0.08);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.3), vec3(0.6), c), vec3(0.9, 0.9, 0.9), obj);

            //ja: 2 つの光を反対の向きから当てて、一緒に回す
            //en: two lights from opposite sides, circling together
            float a = time * 0.6;
            vec3 l1 = normalize(vec3(cos(a), 0.6, -sin(a)));
            vec3 l2 = normalize(vec3(-cos(a), 0.4, sin(a)));
            col = vec3(0.0);
            col += light(n, rd, l1, vec3(1.0, 0.55, 0.2), albedo, obj);
            col += light(n, rd, l2, vec3(0.2, 0.45, 1.0), albedo, obj);
            col += albedo * vec3(0.05, 0.05, 0.08) * (0.5 + 0.5 * n.y);
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "3 つ目の光 `col += light(n, rd, normalize(vec3(0.0, 1.0, 0.0)), vec3(0.6, 0.2, 0.5), albedo, obj);` を足すと、真上からピンクの光が加わります",
        en: "Add a third light, `col += light(n, rd, normalize(vec3(0.0, 1.0, 0.0)), vec3(0.6, 0.2, 0.5), albedo, obj);`, for pink light from straight above",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "物の色を白っぽくしておくと、光の色がそのまま見えます。2 つの光が両方当たる所では、オレンジと青が足されて白っぽくなります。舞台照明のように、光の色と向きだけで場面の雰囲気ががらりと変わることを確かめてください。写真の世界では、主役を照らす強い光を **キーライト**、反対側から影をやわらげる弱い光を **フィルライト** と呼びます。この 2 つにリムライトを足した「3 点照明」は、3D の場面作りでもよく使う組み合わせです。",
        en: "Making the objects nearly white lets the light colors show through as they are. Where both lights land, orange and blue add up toward white. Notice how, as with stage lighting, light color and direction alone transform the mood. Photographers call the strong light on the subject the **key light** and the weaker one softening shadows from the other side the **fill light**. Add a rim light to those two and you have \"three-point lighting\", a setup used constantly in 3D scenes too.",
      },
    },

    { type: "heading", text: { ja: "ガンマ補正で仕上げる", en: "Finishing with gamma correction" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの計算は、すべて「光の量」をそのまま扱ってきました。`dif` が 0.5 なら、光は半分です。ところが画面は、値をそのまま光の量として出してはくれません。[光と仕上げ](/learn/light-and-glow) で見たとおり、画面に 0.5 を渡すと、実際に出る光は 0.5 の 2.2 乗、約 0.22 しかありません。だから明るさの計算をした後には、最後に `pow(col, vec3(1.0 / 2.2))` で **ガンマ補正** をして、画面のくせを打ち消します。0.5 は約 0.73 に、0.2 は約 0.48 に持ち上がります。",
        en: "All our math so far has dealt directly in amounts of light: a `dif` of 0.5 means half the light. The screen, however, doesn't emit values as amounts of light. As we saw in [Light and finishing](/learn/light-and-glow), send 0.5 to the screen and the light it actually emits is 0.5 to the power 2.2, only about 0.22. So after the lighting math, we finish with **gamma correction**, `pow(col, vec3(1.0 / 2.2))`, to cancel out the screen's quirk. 0.5 rises to about 0.73, and 0.2 to about 0.48.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下のプレビューは、画面の右半分だけにガンマ補正をかけたものです。左半分は、光の当たる所から影へ急に暗くなり、影の中がつぶれています。右半分は、明るい所から暗い所へなめらかに移り変わり、ずっと本物らしく見えます。",
        en: "The preview below applies gamma correction to the right half of the screen only. On the left, brightness drops off abruptly from the lit side into shadow, and detail in the shade is crushed. On the right, light fades smoothly into dark and looks much more real.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.6, 0.7, -4.0);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.01, 0.01, 0.015);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.3), vec3(0.6), c), vec3(1.0, 0.45, 0.3), obj);

            vec3 l = normalize(vec3(0.8, 0.5, -0.4));
            float dif = max(dot(n, l), 0.0);
            col = albedo * vec3(1.0, 0.9, 0.75) * dif;
          }
          //ja: 右半分だけガンマ補正
          //en: gamma-correct the right half only
          if (p.x > 0.0) col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`if (p.x > 0.0)` を消して、画面全体にガンマ補正をかけてみましょう",
        en: "Delete `if (p.x > 0.0)` to apply gamma correction to the whole screen",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ガンマ補正をかけると全体が明るくなるので、色や光の強さは選び直す必要があります。ガンマ補正の前の値は「光の量」なので、表面の色は思っているより暗め・濃いめに、空の光は弱めにするのがこつです。最後に、ここまでの全部をまとめます。太陽のキーライト、空の環境光、地面からの照り返し、つや、リムライト、霧、そしてガンマ補正です。",
        en: "Gamma correction brightens everything, so colors and light strengths need choosing again. Before gamma, values are amounts of light, so the trick is to pick surface colors darker and more saturated than you'd expect, and keep the sky light weak. Finally, let's put everything together: the sun as key light, sky ambient, bounce light from the ground, highlights, rim light, fog, and gamma correction.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45 + 0.15 * sin(time * 1.5), -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          float ca = 0.3 * sin(time * 0.3);
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 ro = ta + vec3(4.0 * sin(ca), 1.0, -4.0 * cos(ca));
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          //ja: 空(ガンマ補正の前なので暗めの値)
          //en: the sky (dark-ish values, since gamma comes later)
          vec3 sky = mix(vec3(0.6, 0.45, 0.32), vec3(0.06, 0.14, 0.4), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.08), vec3(0.3), c), vec3(0.75, 0.15, 0.06), obj);

            vec3 l = normalize(vec3(0.8, 0.6, -0.5));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            float bou = clamp(-n.y, 0.0, 1.0);
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;
            float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

            vec3 lin = vec3(0.0);
            lin += vec3(1.3, 1.1, 0.9) * dif;   //ja: 太陽(キーライト) //en: sun (key light)
            lin += vec3(0.1, 0.18, 0.35) * amb; //ja: 空の光 //en: sky light
            lin += vec3(0.15, 0.1, 0.05) * bou; //ja: 地面の照り返し //en: bounce from the ground
            col = albedo * lin;
            col += vec3(1.3, 1.1, 0.9) * spe * obj;
            col += vec3(0.3, 0.5, 1.0) * rim * 0.4 * obj;

            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          col = pow(col, vec3(1.0 / 2.2));  //ja: ガンマ補正は最後に 1 回 //en: gamma correction, once, at the very end
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "球の色 `vec3(0.75, 0.15, 0.06)` を `vec3(0.05, 0.3, 0.7)` にすると青い球に。光の向きの `0.6` を `0.15` にすると、夕方の長い光になります",
        en: "Change the ball color `vec3(0.75, 0.15, 0.06)` to `vec3(0.05, 0.3, 0.7)` for a blue ball. Change the `0.6` in the light direction to `0.15` for long evening light",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "光の計算はすべて「光の量」のまま足し合わせ、ガンマ補正は **最後に 1 回だけ**。途中でかけると、足し算の結果が正しくなくなる",
          en: "Do all lighting as amounts of light and add them up, then apply gamma **once, at the very end**. Applying it midway makes the sums come out wrong",
        },
        {
          ja: "太陽の光を 1 より大きく(`1.3`)しても大丈夫。明るい光は明るい値で表してよい。1 を超えた所が白く飛ぶのが気になるときは、トーンマッピングをガンマ補正の前にかける。仕上げの順番は [光と仕上げ](/learn/light-and-glow) と同じく、場面 → 露出 → トーンマッピング → ビネット → ガンマ補正 → グレイン",
          en: "Sunlight above 1 (`1.3`) is fine; bright light can have bright values. If blown-out whites bother you, apply tone mapping before gamma. The finishing order is the same as in [Light and finishing](/learn/light-and-glow): scene, exposure, tone mapping, vignette, gamma correction, grain",
        },
        {
          ja: "霧の色(空の色)も同じ「光の量」の世界で混ぜてから、ガンマ補正する",
          en: "Mix in the fog (the sky color) in the same amount-of-light world, then gamma-correct",
        },
        {
          ja: "霧の量を `1.0 - exp(-t * t * 0.006)` のように `t * t` で決めると、近くは澄んだまま、遠くだけが霞む。`t` が 4 なら約 0.09、20 なら約 0.91",
          en: "Basing the fog on `t * t`, as in `1.0 - exp(-t * t * 0.006)`, keeps nearby things clear and hazes only the distance: about 0.09 at `t` = 4 and about 0.91 at 20",
        },
      ],
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "球が床から少し浮いて見えるのは、影が無いからです。光をさえぎる物があれば暗くなる「影」と、すき間や角の奥が暗くなる「アンビエントオクルージョン」は、[影と奥行き](/learn/shadows-and-ao) で足します。",
        en: "The balls look as if they float a little above the floor because there are no shadows yet. Shadows, where something blocks the light, and ambient occlusion, where gaps and corners darken, are added in [Shadows and depth](/learn/shadows-and-ao).",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "光の向き・色・強さを自分で決めて、場面を照らしてみましょう。どの課題も、最後の仕上げのコードが土台です。",
        en: "Choose the direction, color and strength of the lights yourself and light up some scenes. Every exercise builds on the final code from this lesson.",
      },
    },
    {
      type: "exercise",
      title: { ja: "マウスで光を動かす", en: "Light from the mouse" },
      prompt: {
        ja: "カーソルを動かすと、その方向から光が当たるようにしてください。カーソルが右にあれば右から、上にあれば上から照らします。カーソルが乗っていないとき(`mouse` が `(0, 0)`)は、正面の斜め上から照らすようにします。",
        en: "Make the light come from wherever the cursor is: from the right when the cursor is on the right, from above when it is near the top. When the cursor isn't over the preview (`mouse` is `(0, 0)`), light the scene from the front, slightly above.",
      },
      starter: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45, -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 ro = ta + vec3(0.0, 1.0, -4.0);
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
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.08), vec3(0.3), c), vec3(0.75, 0.15, 0.06), obj);

            vec3 l = normalize(vec3(0.8, 0.6, -0.5));  //ja: ここを mouse で決める //en: set this from mouse
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;

            col = albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb);
            col += vec3(1.3, 1.1, 0.9) * spe * obj;
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45, -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 ro = ta + vec3(0.0, 1.0, -4.0);
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
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.08), vec3(0.3), c), vec3(0.75, 0.15, 0.06), obj);

            //ja: カーソルの x を左右に、y を上下に。z は手前(カメラ側)から
            //en: cursor x sets left-right, y sets up-down; z comes from the camera side
            vec3 l = normalize(vec3(mouse.x * 2.0, 0.6 + mouse.y * 1.5, -0.8));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), 48.0) * dif;

            col = albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb);
            col += vec3(1.3, 1.1, 0.9) * spe * obj;
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`mouse` は `p` と同じ座標で、右が +x、上が +y です。光の向き `l` の x と y にそのまま使えます",
          en: "`mouse` uses the same coordinates as `p`: +x is right, +y is up. You can feed it straight into the x and y of the light direction `l`",
        },
        {
          ja: "z を負(カメラ側)にしておくと、カーソルが真ん中のときに正面から照らします。y に少し足しておくと、`(0, 0)` のときに斜め上からになります",
          en: "Keep z negative (toward the camera) so a centered cursor lights the scene from the front. Add a little to y so `(0, 0)` lights it from slightly above",
        },
        {
          ja: "`vec3 l = normalize(vec3(mouse.x * 2.0, 0.6 + mouse.y * 1.5, -0.8));`",
          en: "`vec3 l = normalize(vec3(mouse.x * 2.0, 0.6 + mouse.y * 1.5, -0.8));`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "3 つの質感", en: "Three materials" },
      prompt: {
        ja: "3 つの球を並べ、左から **粘土**(つやなし)、**プラスチック**(白く鋭いつや)、**金**(つやが金色で、拡散光は弱い)に見えるようにしてください。どの球に当たったかは、当たった点の `pos.x` で見分けます。",
        en: "Line up three balls and make them look, from left to right, like **clay** (no shine), **plastic** (a sharp white highlight) and **gold** (a gold-tinted highlight, weak diffuse). Tell which ball was hit by the hit point's `pos.x`.",
      },
      starter: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-1.3, -0.4, 0.0), 0.6);
          float b = sdSphere(p - vec3(0.0, -0.4, 0.0), 0.6);
          float c = sdSphere(p - vec3(1.3, -0.4, 0.0), 0.6);
          return min(min(min(a, b), c), p.y + 1.0);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.5, -3.4);
          vec3 rd = camera(ro, vec3(0.0, -0.45, 0.0)) * normalize(vec3(p, 1.5));

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
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);

            //ja: 3 つとも同じ質感。ここを球ごとに変える
            //en: all three share one material; vary these per ball
            vec3 albedo = vec3(0.5, 0.5, 0.5);
            vec3 speCol = vec3(1.0);
            float power = 32.0;
            if (obj < 0.5) {
              albedo = mix(vec3(0.08), vec3(0.3), c);
              speCol = vec3(0.0);
            }

            vec3 l = normalize(vec3(0.6, 0.7, -0.6));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), power) * dif;

            col = albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb);
            col += speCol * spe;
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-1.3, -0.4, 0.0), 0.6);
          float b = sdSphere(p - vec3(0.0, -0.4, 0.0), 0.6);
          float c = sdSphere(p - vec3(1.3, -0.4, 0.0), 0.6);
          return min(min(min(a, b), c), p.y + 1.0);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.5, -3.4);
          vec3 rd = camera(ro, vec3(0.0, -0.45, 0.0)) * normalize(vec3(p, 1.5));

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
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);

            //ja: 粘土: 色はやや明るく、つやは無し
            //en: clay: a fairly light color, no highlight
            vec3 albedo = vec3(0.45, 0.3, 0.2);
            vec3 speCol = vec3(0.0);
            float power = 8.0;
            if (pos.x > -0.65) {
              //ja: プラスチック: 濃い色に、白く鋭いつや
              //en: plastic: a deep color with a sharp white highlight
              albedo = vec3(0.02, 0.15, 0.5);
              speCol = vec3(1.5);
              power = 96.0;
            }
            if (pos.x > 0.65) {
              //ja: 金: 拡散光は少なく、つやに金の色を付ける
              //en: gold: little diffuse, and a gold-tinted highlight
              albedo = vec3(0.2, 0.11, 0.01);
              speCol = vec3(2.5, 1.6, 0.5);
              power = 16.0;
            }
            if (obj < 0.5) {
              albedo = mix(vec3(0.08), vec3(0.3), c);
              speCol = vec3(0.0);
            }

            vec3 l = normalize(vec3(0.6, 0.7, -0.6));
            float dif = max(dot(n, l), 0.0);
            float amb = 0.5 + 0.5 * n.y;
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), power) * dif;

            col = albedo * (vec3(1.3, 1.1, 0.9) * dif + vec3(0.1, 0.18, 0.35) * amb);
            col += speCol * spe;
            col = mix(col, sky, 1.0 - exp(-t * t * 0.006));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "球の中心は x = -1.3、0、1.3 です。`pos.x` が -0.65 より大きいか、0.65 より大きいかで 3 つに分けられます",
          en: "The ball centers are at x = -1.3, 0 and 1.3. Splitting on whether `pos.x` is above -0.65 and above 0.65 separates the three",
        },
        {
          ja: "質感の違いは、`albedo`(拡散光の色)、`speCol`(つやの色と強さ)、`power`(つやの鋭さ)の 3 つで作れます",
          en: "Three knobs make the materials: `albedo` (diffuse color), `speCol` (highlight color and strength) and `power` (highlight sharpness)",
        },
        {
          ja: "金属は、つやに表面の色が付き、拡散光は少なめです。金なら `albedo` を暗い茶色に、`speCol` を `vec3(2.5, 1.6, 0.5)` くらいにします",
          en: "Metals tint their highlights with the surface color and have little diffuse. For gold, set `albedo` to a dark brown and `speCol` to about `vec3(2.5, 1.6, 0.5)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "ランタンの光(点光源)", en: "Lantern light (a point light)" },
      prompt: {
        ja: "太陽のような遠くの光ではなく、場面の中を飛び回る小さな明かり(**点光源**)で照らしてください。光の向きは点ごとに違い(当たった点から明かりへの向き)、明かりから遠い所ほど暗くなります。明かりそのものも、小さく光る球として見えるようにします。",
        en: "Instead of a distant light like the sun, light the scene with a small lamp flying around inside it: a **point light**. The light direction differs at every point (from the hit point toward the lamp), and things get darker the farther they are from it. Make the lamp itself visible as a small glowing ball.",
      },
      starter: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45, -0.5), 0.55);
          float ground = p.y + 1.0;
          return min(smin(a, b, 0.35), ground);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 ro = ta + vec3(0.0, 1.2, -4.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.0);
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.08), vec3(0.3), c), vec3(0.6, 0.6, 0.65), obj);

            //ja: いまは遠くからの平行な光
            //en: for now, parallel light from far away
            vec3 l = normalize(vec3(0.8, 0.6, -0.5));
            float dif = max(dot(n, l), 0.0);
            col = albedo * (vec3(1.0, 0.6, 0.25) * dif + vec3(0.01, 0.015, 0.03));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        //ja: 明かりの位置(map と render の両方で使う)
        //en: the lamp's position (used by both map and render)
        vec3 lampPos() {
          return vec3(1.6 * cos(time), 0.2 + 0.4 * sin(time * 1.7), -1.6 * sin(time));
        }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.4, -0.05, 0.0), 0.95);
          float b = sdSphere(p - vec3(0.85, -0.45, -0.5), 0.55);
          float ground = p.y + 1.0;
          float lamp = sdSphere(p - lampPos(), 0.08);
          return min(min(smin(a, b, 0.35), ground), lamp);
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 ta = vec3(0.1, -0.3, 0.0);
          vec3 ro = ta + vec3(0.0, 1.2, -4.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.0);
          vec3 lp = lampPos();
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float obj = pos.y < -0.99 ? 0.0 : 1.0;
            float c = mod(floor(pos.x) + floor(pos.z), 2.0);
            vec3 albedo = mix(mix(vec3(0.08), vec3(0.3), c), vec3(0.6, 0.6, 0.65), obj);

            //ja: 当たった点から明かりへの向きと距離
            //en: direction and distance from the hit point to the lamp
            vec3 toLamp = lp - pos;
            float dist = length(toLamp);
            vec3 l = toLamp / dist;
            float dif = max(dot(n, l), 0.0);
            //ja: 遠いほど暗く(距離の 2 乗で弱まる)
            //en: darker with distance (falls off with distance squared)
            float fall = 1.0 / (1.0 + dist * dist);
            vec3 h = normalize(l - rd);
            float spe = pow(max(dot(n, h), 0.0), 32.0) * dif;

            vec3 lampCol = vec3(1.0, 0.6, 0.25) * 3.0;
            col = albedo * (lampCol * dif * fall + vec3(0.01, 0.015, 0.03));
            col += lampCol * spe * fall * obj;
            //ja: 明かりそのものに当たったら、明るく光らせる
            //en: if we hit the lamp itself, make it glow
            if (dist < 0.1) col = vec3(3.0, 2.2, 1.2);
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "明かりの位置 `lp` を時間で動かします。光の向きは、平行光と違って `normalize(lp - pos)` で点ごとに計算します",
          en: "Move the lamp position `lp` over time. Unlike parallel light, the direction is computed per point, as `normalize(lp - pos)`",
        },
        {
          ja: "明かりまでの距離 `dist` で `1.0 / (1.0 + dist * dist)` をかけると、遠い所ほど暗くなります。弱まったぶん、光の色を 3 倍くらいに強くします",
          en: "Multiplying by `1.0 / (1.0 + dist * dist)`, where `dist` is the distance to the lamp, darkens far-off points. Make the light color about 3 times stronger to compensate",
        },
        {
          ja: "明かりを見えるようにするには、`map` に小さな球 `sdSphere(p - lampPos(), 0.08)` を足し、当たった点が明かりの近く(`dist < 0.1`)なら明るい色にします。位置は `map` と `render` の両方で使うので、関数 `lampPos()` にまとめます",
          en: "To show the lamp, add a small ball `sdSphere(p - lampPos(), 0.08)` to `map`, and color hit points near the lamp (`dist < 0.1`) brightly. Both `map` and `render` need the position, so put it in a function, `lampPos()`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "法線は、`map` を x・y・z に少しずつ動かして測った距離の増え方の向き(`calcNormal`)。`n * 0.5 + 0.5` で色にして確かめる",
          en: "The normal is the direction in which `map` grows, measured by nudging along x, y and z (`calcNormal`). Check it as a color with `n * 0.5 + 0.5`",
        },
        {
          ja: "拡散光は `max(dot(n, l), 0.0)`。半球の環境光は `0.5 + 0.5 * n.y` に空の色をかける",
          en: "Diffuse light is `max(dot(n, l), 0.0)`. Hemisphere ambient is `0.5 + 0.5 * n.y` times the sky color",
        },
        {
          ja: "つやは `h = normalize(l - rd)` で `pow(max(dot(n, h), 0.0), 指数)`。指数が大きいほど鋭い",
          en: "Highlights use `h = normalize(l - rd)` and `pow(max(dot(n, h), 0.0), exponent)`; a bigger exponent means a sharper highlight",
        },
        {
          ja: "リムライトは `pow(1.0 - max(dot(n, -rd), 0.0), 3.0)`。輪郭を浮かび上がらせる演出",
          en: "Rim light is `pow(1.0 - max(dot(n, -rd), 0.0), 3.0)`, a staging trick that lifts outlines",
        },
        {
          ja: "色は「表面の色 × 光の合計」。光は何個でも足せる。ガンマ補正は最後に 1 回",
          en: "Color is surface color times the sum of the lights. Add as many lights as you like, and gamma-correct once at the end",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "これで、光の当たった立体が描けるようになりました。ここまでの場面は球と床だけでしたが、次の回の [3D の形を組み立てる](/learn/shapes-3d) では、箱・トーラス・円柱などの形を増やし、組み合わせて身近な物を作ります。",
        en: "You can now draw solid, lit objects. So far our scenes have been only balls and a floor. Next, in [Building 3D shapes](/learn/shapes-3d), we add boxes, tori, cylinders and more, and combine them into everyday objects.",
      },
    },
  ],
};

export default lesson;
