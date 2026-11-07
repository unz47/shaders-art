import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "shadows-and-ao",
  title: { ja: "影と奥行き", en: "Shadows and depth" },
  summary: {
    ja: "やわらかい影とアンビエントオクルージョンで、形を地面に落ち着かせる",
    en: "Ground your shapes with soft shadows and ambient occlusion",
  },
  minutes: 55,
  goals: [
    {
      ja: "当たった点から光のほうへもう一度レイを飛ばして、影を付けられる",
      en: "Add shadows by casting a second ray from the hit point toward the light",
    },
    {
      ja: "影のレイを少し離れたところから始める理由がわかる",
      en: "Understand why the shadow ray starts a little away from the surface",
    },
    {
      ja: "`softShadow` のしくみがわかり、影のぼけ具合を調整できる",
      en: "Understand how `softShadow` works and tune how soft the shadows are",
    },
    {
      ja: "`calcAO` で、すき間やくぼみを暗くして奥行きを出せる",
      en: "Use `calcAO` to darken gaps and crevices for a sense of depth",
    },
    {
      ja: "太陽・空・照り返しを組み合わせた照明を組み立て、ループの数と重さの釣り合いを考えられる",
      en: "Build lighting from sun, sky and bounce light, and balance loop counts against cost",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "影が無いと、物は浮く", en: "Without shadows, things float" } },
    {
      type: "paragraph",
      text: {
        ja: "[法線と光](/learn/normals-and-lighting) で、面の向きから明るさを決められるようになりました。でも、まだ足りないものがあります。下の絵には球が 2 つあります。片方は床に乗っていて、もう片方は少し浮いています。絵だけを見て、どちらが浮いているかわかるでしょうか。",
        en: "In [Normals and lighting](/learn/normals-and-lighting) you learned to shade a surface by the way it faces. Something is still missing, though. The picture below has two spheres. One rests on the floor; the other floats a little above it. Can you tell which one floats just by looking?",
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
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-0.8, 0.5, 0.0), 0.5));
          d = min(d, sdSphere(p - vec3(0.8, 0.85, 0.7), 0.5));
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
          vec3 ro = vec3(0.0, 2.4, -2.0);
          vec3 ta = vec3(0.0, 0.5, 0.3);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 haze = vec3(0.62, 0.55, 0.5);
          vec3 col = mix(haze, vec3(0.35, 0.5, 0.8), clamp(rd.y * 2.0, 0.0, 1.0));
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(-0.8, 0.5, -0.1));
            float dif = max(dot(n, l), 0.0);
            float sky = 0.5 + 0.5 * n.y;
            vec3 albedo = pos.y < 0.01 ? vec3(0.6, 0.55, 0.5) : vec3(0.85, 0.35, 0.2);
            col = albedo * (dif * vec3(1.4, 1.1, 0.8) + sky * vec3(0.2, 0.28, 0.45));
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`map` を見ると答えがわかります。右の球の高さ `0.85` を `0.5` にしても、絵の印象はあまり変わりません",
        en: "`map` gives away the answer. Change the right sphere's height `0.85` to `0.5` and the picture barely changes",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "右の球は床から 0.35 浮いていますが、絵では「少し奥にある」のか「浮いている」のか区別がつきません。私たちは、物の **影** を見て、物と床の関係を読み取っています。影が足元にくっついていれば乗っている、離れていれば浮いている、とわかるのです。影は奥行きと重さを伝える、いちばん強い手がかりです。",
        en: "The right sphere floats 0.35 above the floor, but in the picture you cannot tell whether it is floating or just farther back. We read how objects relate to the ground from their **shadows**: a shadow touching the object means it rests there, a shadow set apart means it floats. Shadows are the strongest cue for depth and weight.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この回は、床がずっと遠くまで続くので、レイの打ち切りを 50.0 にしています。遠くの床は霧の色 `haze` に混ぜて、空との境目をなじませています。",
        en: "In this lesson the floor stretches far away, so rays give up at 50.0 instead of 20.0. The distant floor is blended into the haze color `haze` so it melts into the sky.",
      },
    },

    { type: "heading", text: { ja: "光のほうへ、もう一度レイを飛ばす", en: "Casting a second ray toward the light" } },
    {
      type: "paragraph",
      text: {
        ja: "ある点が影の中にあるかどうかは、「その点から光が見えるか」と言いかえられます。見えるかどうかを調べる方法は、もう知っています。**その点から光の向き `l` へ、もう一度レイマーチをする** のです。途中で何かに当たれば光はさえぎられていて影、何にも当たらずに遠くまで行ければ日なたです。",
        en: "Whether a point is in shadow is the same question as \"can this point see the light?\". And you already know how to check whether something can be seen: **raymarch again, from the point toward the light direction `l`**. If the ray hits something on the way, the light is blocked and the point is in shadow. If it travels far without hitting anything, the point is in the sun.",
      },
    },
    {
      type: "code",
      source: `
        float hardShadow(vec3 ro, vec3 rd) {
          float t = 0.02;                //ja: 表面から少し離れて始める //en: start a little away from the surface
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
            if (h < 0.001) return 0.0;   //ja: 何かに当たった → 影 //en: hit something → shadow
            t += h;
            if (t > 10.0) break;         //ja: じゅうぶん遠くまで行けた //en: got far enough
          }
          return 1.0;                    //ja: 光まで何も無い → 日なた //en: nothing in the way → lit
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "最初のレイマーチとほとんど同じです。違うのは、当たったかどうかだけを 0.0(影)か 1.0(日なた)で返すことです。使うときは、当たった点 `pos` から光の向き `l` へ飛ばし、返ってきた値を拡散光 `dif` にかけます。影の中では、太陽の光だけが消えて、空からの光は残ります。",
        en: "It is almost the same as the main raymarch. The only difference is that it returns just whether it hit: 0.0 for shadow, 1.0 for light. To use it, cast from the hit point `pos` toward the light `l` and multiply the diffuse term `dif` by the result. In shadow only the sunlight disappears; the light from the sky remains.",
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
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-0.8, 0.5, 0.0), 0.5));
          d = min(d, sdSphere(p - vec3(0.8, 0.85, 0.7), 0.5));
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float hardShadow(vec3 ro, vec3 rd) {
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
            if (h < 0.001) return 0.0;
            t += h;
            if (t > 10.0) break;
          }
          return 1.0;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.4, -2.0);
          vec3 ta = vec3(0.0, 0.5, 0.3);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 haze = vec3(0.62, 0.55, 0.5);
          vec3 col = mix(haze, vec3(0.35, 0.5, 0.8), clamp(rd.y * 2.0, 0.0, 1.0));
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(-0.8, 0.5, -0.1));
            float dif = max(dot(n, l), 0.0);
            float sha = hardShadow(pos, l);  //ja: 光が見えるか //en: can we see the light?
            float sky = 0.5 + 0.5 * n.y;
            vec3 albedo = pos.y < 0.01 ? vec3(0.6, 0.55, 0.5) : vec3(0.85, 0.35, 0.2);
            col = albedo * (dif * sha * vec3(1.4, 1.1, 0.8) + sky * vec3(0.2, 0.28, 0.45));
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "右の球の影が足元から離れて、浮いているのがわかります。`hardShadow` の中の `float t = 0.02;` を `0.0` にすると?",
        en: "The right sphere's shadow sits apart from it, so now you can see it floats. What happens if `float t = 0.02;` inside `hardShadow` becomes `0.0`?",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "影のレイは、表面から少し離れたところ(`t = 0.02`)から始めます。当たった点 `pos` は、`map` が 0.001 より小さくなったところでした。そこから `t = 0.0` で始めると、最初の 1 歩で「何かに当たった」と判定されてしまい、光の当たっている面まで全部が影になります。表面の凹凸でまだらになることもあり、「影のにきび(shadow acne)」と呼ばれます。",
        en: "The shadow ray starts a little away from the surface (`t = 0.02`). The hit point `pos` is where `map` dropped below 0.001, so starting at `t = 0.0` makes the very first step report \"hit something\", and every surface — even ones facing the light — turns to shadow. Sometimes it shows up as blotchy speckles instead; this is called **shadow acne**.",
      },
    },

    { type: "heading", text: { ja: "やわらかい影", en: "Soft shadows" } },
    {
      type: "paragraph",
      text: {
        ja: "影が付きましたが、ふちがくっきりしすぎて、切り紙のように見えます。本物の太陽は点ではなく少し大きさがあるので、影のふちには、太陽の一部だけが隠れた「半影(はんえい)」ができます。半影は、物のすぐ近くでは細く、物から遠いところほど広くぼけます。",
        en: "We have shadows now, but their edges are razor sharp, like paper cutouts. The real sun is not a point; it has a small size, so the edge of a shadow has a **penumbra** where only part of the sun is hidden. The penumbra is thin right next to the object and gets wider and blurrier farther away.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "距離関数を使うと、この半影をほぼただで作れます。影のレイが進むあいだ、各点で `map` が返す値 `h` は「そこから一番近い物までの距離」です。レイが物のふちを **かすめた** なら、そのときの `h` は小さくなります。そこで、進んだ距離 `t` に対する `h` の割合 `h / t` を、レイ全体での一番小さい値として覚えておきます。`h / t` は、出発点から見た「物とのすき間の角度」のようなもので、これが小さいほど太陽が多く隠れています。",
        en: "With distance functions you get this penumbra almost for free. As the shadow ray travels, the value `h` that `map` returns at each point is \"the distance to the nearest object from here\". If the ray **grazes** an object's edge, `h` gets small there. So we track the smallest value of `h / t` — the clearance `h` relative to the distance traveled `t` — along the whole ray. `h / t` is roughly the angle of the gap as seen from the starting point; the smaller it is, the more of the sun is hidden.",
      },
    },
    {
      type: "code",
      source: `
        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
            res = min(res, 8.0 * h / t);   //ja: かすめ具合の一番小さい値 //en: the closest graze so far
            t += clamp(h, 0.02, 0.2);      //ja: 0.02〜0.2 の歩幅で進む //en: step between 0.02 and 0.2
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`res` … 1.0 で日なた、0.0 で真っ暗な影。途中の値が半影になる",
          en: "`res` … 1.0 is full light, 0.0 is full shadow, values in between are penumbra",
        },
        {
          ja: "`8.0 * h / t` … `8.0` が影の硬さ。大きいほどくっきり、小さいほどやわらかい",
          en: "`8.0 * h / t` … `8.0` sets the hardness: larger is sharper, smaller is softer",
        },
        {
          ja: "`clamp(h, 0.02, 0.2)` … 大きく跳びすぎると、かすめた瞬間を見逃すので 0.2 まで。かすめているあいだも止まらないよう、最低 0.02 は進む",
          en: "`clamp(h, 0.02, 0.2)` … jumping too far could skip the moment of grazing, so at most 0.2; and at least 0.02 so the ray keeps moving while it grazes",
        },
        {
          ja: "`res < 0.001` … もう真っ暗と決まったら、残りは調べずに抜ける",
          en: "`res < 0.001` … once it is fully dark, stop early instead of checking the rest",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "なぜ遠いほどぼけるのか、数で確かめましょう。`8.0 * h / t` が 1 より小さくなる、つまり少しでも暗くなるのは、`h` が `t / 8` より小さいときです。物のすぐ近くの床(物まで `t` = 0.4)なら、`h` が 0.05 より小さいところだけが半影で、ふちはくっきりします。物から離れた床(`t` = 3.2)なら、`h` が 0.4 より小さいところまで半影になり、広くぼけます。本物の影と同じ性質が、この 1 行から出てくるのです。",
        en: "Let's check with numbers why it blurs with distance. `8.0 * h / t` drops below 1 — the point darkens at all — when `h` is less than `t / 8`. On the floor right next to an object (the object is `t` = 0.4 away), only the region with `h` below 0.05 is penumbra, so the edge is crisp. On the floor far from the object (`t` = 3.2), everything with `h` below 0.4 is penumbra, so the edge spreads wide. The same behavior as real shadows falls out of this one line.",
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
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float map(vec3 p) {
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-1.1, 0.5, 0.3), 0.5));
          vec3 q = p - vec3(0.15, 0.61, 0.0);
          d = min(d, sdTorus(q.xzy, vec2(0.45, 0.16)));  //ja: 立てた輪 //en: a ring standing up
          vec3 b = p - vec3(1.25, 0.37, 0.5);
          b.xz = rot(0.6) * b.xz;
          d = min(d, sdBox(b, vec3(0.35)) - 0.02);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            if (res < 0.001 || t > 10.0) break;
          }
          return clamp(res, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.3, 2.4, -2.0);
          vec3 ta = vec3(0.1, 0.5, 0.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 haze = vec3(0.62, 0.55, 0.5);
          vec3 col = mix(haze, vec3(0.35, 0.5, 0.8), clamp(rd.y * 2.0, 0.0, 1.0));
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(-0.8, 0.5, -0.1));
            float dif = max(dot(n, l), 0.0);
            float sha = softShadow(pos, l);
            float sky = 0.5 + 0.5 * n.y;
            vec3 albedo = pos.y < 0.01 ? vec3(0.6, 0.55, 0.5) : vec3(0.85, 0.82, 0.78);
            col = albedo * (dif * sha * vec3(1.4, 1.1, 0.8) + sky * vec3(0.2, 0.28, 0.45));
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`softShadow` の `8.0` を `2.0` にするとやわらかく、`32.0` にするとくっきりします。最大の歩幅 `0.2` を `0.03` にすると、影が途中で切れます",
        en: "Change `8.0` in `softShadow` to `2.0` for very soft shadows, or `32.0` for crisp ones. Set the largest step `0.2` to `0.03` and the shadows get cut short",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "最後の試しで影が切れるのは、影のレイが届く距離に限りがあるからです。歩幅は最大 0.2、歩数は最大 32 なので、影のレイはどんなに進んでも 32 × 0.2 = 6.4 までしか届きません。0.03 にすると 32 × 0.03 ≈ 1.0 になり、物から 1.0 以上離れた床には影が落ちなくなります。場面の大きさに合わせて、この 2 つの数を選びます。",
        en: "The shadows get cut in that last experiment because a shadow ray has a limited reach. With a largest step of 0.2 and at most 32 steps, it can never get past 32 × 0.2 = 6.4. With 0.03 the reach is 32 × 0.03 ≈ 1.0, so floor more than 1.0 away from an object gets no shadow. Choose these two numbers to suit the size of your scene.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "立てた輪の `sdTorus(q.xzy, …)` は、[3D の形を組み立てる](/learn/shapes-3d) で見た、y と z を入れかえて寝ていたドーナツを立てる書き方です。",
        en: "The standing ring, `sdTorus(q.xzy, …)`, is the trick from [Building 3D shapes](/learn/shapes-3d): swapping y and z stands the lying doughnut up.",
      },
    },

    { type: "heading", text: { ja: "すき間の暗さ(アンビエントオクルージョン)", en: "Darkness in the gaps (ambient occlusion)" } },
    {
      type: "paragraph",
      text: {
        ja: "影は太陽の光についての話でした。一方、空からの光(環境光)は、あらゆる向きから少しずつ届きます。部屋のすみや、物と床のすき間のような場所は、空の大部分が周りの物で隠れているので、空からの光が少ししか届かず、ほんのり暗くなります。これを **アンビエントオクルージョン**(環境光の遮蔽、略して AO)と呼びます。",
        en: "Shadows were about sunlight. Light from the sky, the ambient light, arrives a little from every direction. In places like the corner of a room or the gap under an object, most of the sky is hidden by nearby things, so less sky light gets in and they turn a little darker. This is called **ambient occlusion** (AO).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "本物どおりに計算するには、あらゆる向きにレイを飛ばす必要があり、とても重くなります。そこで距離関数を使った近道をします。表面から法線の向きに、少しずつ離れた 5 つの点で `map` を調べるのです。周りに何も無ければ、表面から `h` 離れた点の距離はちょうど `h` です。近くに壁や物があれば、`map` は `h` より小さくなります。その **差** を足し合わせたものが、どれだけ囲まれているかの目安になります。",
        en: "Doing it for real would mean casting rays in every direction, which is far too expensive. Distance functions offer a shortcut: step away from the surface along the normal and check `map` at five points. If nothing is around, a point `h` away from the surface is exactly `h` from the nearest surface. If a wall or object is nearby, `map` comes out smaller than `h`. Adding up those **differences** tells you how enclosed the point is.",
      },
    },
    {
      type: "code",
      source: `
        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);  //ja: 0.01, 0.13, 0.25, 0.37, 0.49 //en: 0.01, 0.13, 0.25, 0.37, 0.49
            occ += (h - map(p + n * h)) * w;   //ja: 期待より近い分だけ足す //en: add how much closer than expected
            w *= 0.9;                          //ja: 遠い点ほど軽く数える //en: farther samples count less
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめます。広い床の真ん中では、5 つの点とも `map` が `h` に等しいので、差は 0 で `occ` も 0、AO は 1.0(まったく暗くならない)です。球の根元の床では、上に球が覆いかぶさっているので、たとえば `h` = 0.37 の点で `map` が 0.2 しかなく、差は 0.17 です。こうした差を重みつきで足して `occ` が 0.25 になったとすると、AO は 1.0 - 3.0 × 0.25 = 0.25 で、かなり暗くなります。`map` を 5 回呼ぶだけなので、影よりずっと軽い計算です。",
        en: "Let's check with numbers. In the middle of an open floor, `map` equals `h` at all five points, so the differences are 0, `occ` is 0, and AO is 1.0 — no darkening at all. On the floor at the foot of a sphere, the sphere overhangs, so at `h` = 0.37 `map` might be only 0.2, a difference of 0.17. If the weighted differences add up to an `occ` of 0.25, AO is 1.0 - 3.0 × 0.25 = 0.25: quite dark. It is only five calls to `map`, much cheaper than a shadow.",
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
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float map(vec3 p) {
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-1.1, 0.5, 0.3), 0.5));
          vec3 q = p - vec3(0.15, 0.61, 0.0);
          d = min(d, sdTorus(q.xzy, vec2(0.45, 0.16)));
          vec3 b = p - vec3(1.25, 0.37, 0.5);
          b.xz = rot(0.6) * b.xz;
          d = min(d, sdBox(b, vec3(0.35)) - 0.02);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float calcAO(vec3 p, vec3 n) {
          float occ = 0.0;
          float w = 1.0;
          for (int i = 0; i < 5; i++) {
            float h = 0.01 + 0.12 * float(i);
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.3, 2.4, -2.0);
          vec3 ta = vec3(0.1, 0.5, 0.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 col = vec3(1.0);
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float occ = calcAO(pos, n);
            col = vec3(occ);  //ja: AO だけを白黒で見る //en: look at AO alone, in black and white
            col = mix(col, vec3(1.0), 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`calcAO` の最後の `3.0` を `6.0` にすると暗さが強まります。`0.12` を `0.3` にすると、もっと広い範囲の囲まれ方を拾います",
        en: "Change the final `3.0` in `calcAO` to `6.0` for stronger darkening. Change `0.12` to `0.3` to pick up enclosure over a wider area",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "光を使わず AO だけを白黒で見ると、物の根元・輪の内側・箱と床の角が、ふんわり暗くなっているのがわかります。影とちがって光の向きに関係なく、「囲まれている場所」が暗くなります。これを環境光にかけると、物がぐっと床に落ち着きます。",
        en: "Looking at AO alone in black and white, you can see soft darkening at the base of each object, inside the ring, and where the box meets the floor. Unlike shadows, it does not depend on the light direction; it darkens wherever things are enclosed. Multiply it into the ambient light and the objects settle firmly onto the floor.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "この AO は、法線の向きの 1 本の線の上しか調べていない「それらしい近似」です。正確ではありませんが、軽くて見た目の効果が大きいので、レイマーチングのデモではとてもよく使われます。",
        en: "This AO only samples along one line, the normal, so it is a plausible approximation rather than the real thing. It is not accurate, but it is cheap and looks great, which is why raymarching demos use it everywhere.",
      },
    },

    { type: "heading", text: { ja: "光を組み立てる", en: "Building up the lighting" } },
    {
      type: "paragraph",
      text: {
        ja: "影と AO がそろったので、照明を組み立て直します。1 つの点に届く光を、出どころごとに分けて足し合わせるのがコツです。それぞれに、何をかけるかが決まっています。",
        en: "With shadows and AO in hand, let's rebuild the lighting. The trick is to split the light reaching a point by where it comes from and add the parts together. Each part has its own multiplier.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "太陽(直接光)… `dif × 影`。太陽が見えるかどうかは影で決まる。色は暖かいオレンジ",
          en: "Sun (direct light) … `dif × shadow`. The shadow decides whether the sun is visible. Warm orange",
        },
        {
          ja: "空(環境光)… `(0.5 + 0.5 * n.y) × AO`。上を向いた面ほど空が見える。空がどれだけ見えるかは AO で決まる。色は青",
          en: "Sky (ambient light) … `(0.5 + 0.5 * n.y) × AO`. Faces pointing up see more sky, and AO decides how much of it is visible. Blue",
        },
        {
          ja: "照り返し … `(0.5 - 0.5 * n.y) × AO`。日の当たった床が下から照らす光。下を向いた面ほど受ける。色は床の色に近い暖色",
          en: "Bounce … `(0.5 - 0.5 * n.y) × AO`. The sunlit floor lights things from below, so faces pointing down receive more. A warm color close to the floor's",
        },
        {
          ja: "つや(鏡面反射)… `spe × 影`。太陽の映りこみなので、影の中では消す",
          en: "Shine (specular) … `spe × shadow`. It is a reflection of the sun, so it vanishes in shadow",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "影は「太陽が見えるか」、AO は「空が見えるか」なので、影は太陽の光にだけ、AO は空と照り返しにだけかけます。影を全部の光にかけると、影の中が真っ黒になって不自然です。影の中が空の青で少し照らされるから、本物らしく見えるのです。",
        en: "Shadow means \"can I see the sun?\" and AO means \"can I see the sky?\", so the shadow multiplies only sunlight and AO only the sky and bounce light. If you multiply everything by the shadow, shadowed areas turn pitch black and look wrong. It is the faint blue sky light filling the shadows that makes them believable.",
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
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float map(vec3 p) {
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-1.1, 0.5, 0.3), 0.5));
          vec3 q = p - vec3(0.15, 0.61, 0.0);
          d = min(d, sdTorus(q.xzy, vec2(0.45, 0.16)));
          vec3 b = p - vec3(1.25, 0.37, 0.5);
          b.xz = rot(0.6) * b.xz;
          d = min(d, sdBox(b, vec3(0.35)) - 0.02);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.3, 2.4, -2.0);
          vec3 ta = vec3(0.1, 0.5, 0.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 haze = vec3(0.62, 0.55, 0.5);
          vec3 col = mix(haze, vec3(0.35, 0.5, 0.8), clamp(rd.y * 2.0, 0.0, 1.0));
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(-0.8, 0.5, -0.1));
            float dif = max(dot(n, l), 0.0);
            float sha = dif > 0.0 ? softShadow(pos, l) : 0.0;
            float occ = calcAO(pos, n);
            float sky = 0.5 + 0.5 * n.y;
            float bou = 0.5 - 0.5 * n.y;
            float spe = pow(max(dot(n, normalize(l - rd)), 0.0), 32.0);
            vec3 albedo = pos.y < 0.01 ? vec3(0.6, 0.55, 0.5) : vec3(0.85, 0.82, 0.78);

            vec3 lin = vec3(0.0);
            lin += dif * sha * vec3(1.4, 1.1, 0.8);    //ja: 太陽 //en: sun
            lin += sky * occ * vec3(0.2, 0.28, 0.45);  //ja: 空 //en: sky
            lin += bou * occ * vec3(0.25, 0.17, 0.1);  //ja: 床からの照り返し //en: bounce from the floor
            col = albedo * lin;
            col += spe * dif * sha * vec3(1.4, 1.1, 0.8) * 0.4;  //ja: つや //en: shine
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`lin +=` の行を 1 つずつ `//` で消して、それぞれの光の役目を確かめましょう。空の行の `occ` を消すと、すき間の暗さが無くなります",
        en: "Comment out the `lin +=` lines one at a time with `//` to see what each light does. Remove `occ` from the sky line and the darkness in the gaps disappears",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`dif > 0.0 ? softShadow(pos, l) : 0.0` の部分にも注目してください。光に背を向けている面(`dif` が 0)は、影を調べるまでもなく太陽の光が当たりません。そういう点では `softShadow` を呼ばずにすませて、計算を省いています。",
        en: "Note the `dif > 0.0 ? softShadow(pos, l) : 0.0` part as well. A face turned away from the light (`dif` is 0) gets no sunlight whether or not something blocks it. For those points we skip `softShadow` entirely and save the work.",
      },
    },

    { type: "heading", text: { ja: "重さを数える", en: "Counting the cost" } },
    {
      type: "paragraph",
      text: {
        ja: "影と AO で絵はぐっとよくなりましたが、計算は増えています。1 つの点でいちばん多いとき、`map` を何回呼ぶか数えてみましょう。最初のレイマーチで 64 回、法線で 6 回、影で 32 回、AO で 5 回、合わせて 107 回です。フル HD の画面は約 200 万点なので、1 コマで 2 億回を超えます。これを 1 秒に 60 回くり返すのです。",
        en: "Shadows and AO make the picture much better, but they add work. Let's count, in the worst case, how many times one pixel calls `map`: 64 in the main raymarch, 6 for the normal, 32 for the shadow, 5 for AO — 107 in all. A Full HD screen has about two million pixels, so that is over 200 million calls per frame, repeated 60 times a second.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "このサイトの投稿チェックでは、1 コマを 8 ms 以内に描けることを求めています。ループの上限(レイマーチ 64・影 32・AO 5)を守るのは、この時間に収めるためです。実際には、ほとんどの点はもっと早くループを抜けます。下の絵は、1 つの点で最初のレイマーチと影のループが何歩かかったかを色で表したものです。青は軽く、黄色・赤は重い点です。",
        en: "This site's publishing check requires each frame to render within 8 ms. The loop limits (64 for the raymarch, 32 for shadows, 5 for AO) exist to stay inside that budget. In practice most pixels leave their loops much earlier. The picture below colors each pixel by how many steps the main raymarch and the shadow loop took together: blue is cheap, yellow and red are expensive.",
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
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float map(vec3 p) {
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-1.1, 0.5, 0.3), 0.5));
          vec3 q = p - vec3(0.15, 0.61, 0.0);
          d = min(d, sdTorus(q.xzy, vec2(0.45, 0.16)));
          vec3 b = p - vec3(1.25, 0.37, 0.5);
          b.xz = rot(0.6) * b.xz;
          d = min(d, sdBox(b, vec3(0.35)) - 0.02);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        //ja: softShadow と同じ歩き方で、何歩かかったかを返す
        //en: walks exactly like softShadow, but returns how many steps it took
        float shadowSteps(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          float steps = 0.0;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
            res = min(res, 8.0 * h / t);
            t += clamp(h, 0.02, 0.2);
            steps += 1.0;
            if (res < 0.001 || t > 10.0) break;
          }
          return steps;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.3, 2.4, -2.0);
          vec3 ta = vec3(0.1, 0.5, 0.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          float steps = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
            steps += 1.0;
          }

          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            vec3 l = normalize(vec3(-0.8, 0.5, -0.1));
            float dif = max(dot(n, l), 0.0);
            steps += dif > 0.0 ? shadowSteps(pos, l) : 0.0;
          }

          float x = steps / 96.0;  //ja: 64 + 32 歩を 1.0 とする //en: 64 + 32 steps counts as 1.0
          vec3 col = mix(vec3(0.05, 0.1, 0.4), vec3(1.0, 0.85, 0.2), smoothstep(0.0, 0.5, x));
          col = mix(col, vec3(0.9, 0.1, 0.1), smoothstep(0.5, 1.0, x));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`dif > 0.0 ? shadowSteps(pos, l) : 0.0` を `shadowSteps(pos, l)` にすると、光の当たらない面まで重くなります。`0.2`(最大の歩幅)を `0.1` にすると?",
        en: "Replace `dif > 0.0 ? shadowSteps(pos, l) : 0.0` with just `shadowSteps(pos, l)` and faces in the dark get expensive too. What happens if the largest step `0.2` becomes `0.1`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "重いのは、レイが物のふちをかすめる場所です。物の輪郭のすぐ外では最初のレイマーチが、影のふちでは影のレイが、小さな歩幅でじわじわ進むからです。一方、空(何にも当たらず遠くへ行く)や、影の中心(すぐに真っ暗と決まって抜ける)は軽くすみます。重さを抑えるには、次のような工夫があります。",
        en: "The expensive places are where rays graze an object's edge: just outside an object's outline for the main raymarch, and along shadow edges for the shadow ray, because both creep forward in tiny steps. The sky (rays fly off into the distance) and the middle of a shadow (it quickly turns fully dark and exits) stay cheap. Here are ways to keep the cost down:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "光に背を向けた面では影を調べない(`dif > 0.0 ? … : 0.0`)",
          en: "Skip the shadow on faces turned away from the light (`dif > 0.0 ? … : 0.0`)",
        },
        {
          ja: "影のレイの届く距離(`t > 10.0`)と最大の歩幅を、場面の大きさに合わせて小さくする",
          en: "Shrink the shadow ray's reach (`t > 10.0`) and largest step to fit the size of your scene",
        },
        {
          ja: "`map` そのものを軽くする。複雑な形は、遠いときは大きな箱などで代わりに距離を答える",
          en: "Make `map` itself cheaper; for a complex shape, answer with a simple bounding box while the point is far away",
        },
        {
          ja: "光を増やすと、影のループも光の数だけ増える。影を付ける光は 1〜2 個にしぼる",
          en: "Every extra light adds another shadow loop, so give shadows to only one or two lights",
        },
      ],
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "実際の重さは、エディタ(/edit)に出る 1 コマの時間で確かめられます。どこを削ると速くなるかは [速く、小さく](/learn/performance-and-size) でくわしく扱います。",
        en: "You can check the real cost with the frame time shown in the editor (/edit). [Fast and small](/learn/performance-and-size) goes deeper into what to trim to make things faster.",
      },
    },

    { type: "heading", text: { ja: "太陽を動かす", en: "Moving the sun" } },
    {
      type: "paragraph",
      text: {
        ja: "最後に、太陽をゆっくり回して、影が床の上をめぐる場面にします。照明の組み立ては前と同じで、光の向き `l` を時間で回しているだけです。影の形、半影の広がり、すき間の暗さが、光の向きにつれてどう変わるかを見てください。",
        en: "Finally, let's turn the sun slowly so the shadows sweep across the floor. The lighting is built the same way as before; only the light direction `l` rotates with time. Watch how the shadow shapes, the penumbra and the darkness in the gaps change with the light.",
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
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float map(vec3 p) {
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-1.1, 0.5, 0.3), 0.5));
          vec3 q = p - vec3(0.15, 0.61, 0.0);
          d = min(d, sdTorus(q.xzy, vec2(0.45, 0.16)));
          vec3 b = p - vec3(1.25, 0.37, 0.5);
          b.xz = rot(0.6) * b.xz;
          d = min(d, sdBox(b, vec3(0.35)) - 0.02);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.3, 2.4, -2.0);
          vec3 ta = vec3(0.1, 0.5, 0.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          float a = time * 0.4;
          vec3 l = normalize(vec3(cos(a), 0.45, sin(a)));  //ja: 太陽がまわる //en: the sun circles around
          vec3 sunCol = vec3(1.5, 1.05, 0.7);
          vec3 haze = vec3(0.7, 0.55, 0.5);
          vec3 col = mix(haze, vec3(0.3, 0.42, 0.75), clamp(rd.y * 2.0, 0.0, 1.0));
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float dif = max(dot(n, l), 0.0);
            float sha = dif > 0.0 ? softShadow(pos, l) : 0.0;
            float occ = calcAO(pos, n);
            float sky = 0.5 + 0.5 * n.y;
            float bou = 0.5 - 0.5 * n.y;
            float spe = pow(max(dot(n, normalize(l - rd)), 0.0), 32.0);
            vec3 albedo = pos.y < 0.01 ? vec3(0.62, 0.5, 0.42) : vec3(0.9, 0.86, 0.8);

            vec3 lin = vec3(0.0);
            lin += dif * sha * sunCol;
            lin += sky * occ * vec3(0.18, 0.25, 0.45);
            lin += bou * occ * vec3(0.3, 0.18, 0.1);
            col = albedo * lin + spe * dif * sha * sunCol * 0.4;
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "太陽の高さ `0.45` を `0.15` にすると夕方のような長い影に、`1.5` にすると真昼の短い影になります",
        en: "Lower the sun's height `0.45` to `0.15` for long evening shadows, or raise it to `1.5` for short midday ones",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "影と AO を使って、光が主役の場面を作ってみましょう。`softShadow` と `calcAO` は、どれも土台のコードに入っています。",
        en: "Use shadows and AO to build scenes where light is the star. `softShadow` and `calcAO` are already in every starter.",
      },
    },
    {
      type: "exercise",
      title: { ja: "日時計", en: "Sundial" },
      prompt: {
        ja: "床に立てた細い棒と、まわりの輪があります。太陽を 12 秒で 1 周させ、棒の影が時計の針のように輪の上をぐるりと回るようにしてください。影の先が輪まで届く高さに太陽を置きます。",
        en: "There is a thin pole standing on the floor with a ring around it. Make the sun go around once every 12 seconds so the pole's shadow sweeps over the ring like a clock hand. Keep the sun low enough that the tip of the shadow reaches the ring.",
      },
      starter: `
        #define TAU 6.28318531

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
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
          float d = p.y;
          d = min(d, sdCylinder(p - vec3(0.0, 0.4, 0.0), 0.04, 0.4));  //ja: 棒 //en: the pole
          d = min(d, sdTorus(p, vec2(1.2, 0.03)));                     //ja: 輪 //en: the ring
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.6, -2.4);
          vec3 ta = vec3(0.0, 0.0, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 l = normalize(vec3(0.5, 0.8, -0.3));  //ja: ここを時間で回す //en: rotate this with time
          vec3 haze = vec3(0.7, 0.6, 0.5);
          vec3 col = haze;
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float dif = max(dot(n, l), 0.0);
            float sha = dif > 0.0 ? softShadow(pos, l) : 0.0;
            float occ = calcAO(pos, n);
            float sky = 0.5 + 0.5 * n.y;
            vec3 albedo = vec3(0.75, 0.65, 0.55);
            col = albedo * (dif * sha * vec3(1.4, 1.1, 0.8) + sky * occ * vec3(0.2, 0.25, 0.4));
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
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
          float d = p.y;
          d = min(d, sdCylinder(p - vec3(0.0, 0.4, 0.0), 0.04, 0.4));
          d = min(d, sdTorus(p, vec2(1.2, 0.03)));
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.6, -2.4);
          vec3 ta = vec3(0.0, 0.0, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          //ja: 12 秒で 1 周(TAU ラジアン)。高さ 0.6 なら仰角は約 31 度で、
          //en: one turn (TAU radians) every 12 seconds. A height of 0.6 puts the sun about 31 degrees up,
          //ja: 高さ 0.8 の棒の影は約 1.3 まで伸び、半径 1.2 の輪に届く
          //en: so the 0.8-tall pole casts a shadow about 1.3 long, reaching the ring at radius 1.2
          float a = time * TAU / 12.0;
          vec3 l = normalize(vec3(cos(a), 0.6, sin(a)));
          vec3 haze = vec3(0.7, 0.6, 0.5);
          vec3 col = haze;
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float dif = max(dot(n, l), 0.0);
            float sha = dif > 0.0 ? softShadow(pos, l) : 0.0;
            float occ = calcAO(pos, n);
            float sky = 0.5 + 0.5 * n.y;
            vec3 albedo = vec3(0.75, 0.65, 0.55);
            col = albedo * (dif * sha * vec3(1.4, 1.1, 0.8) + sky * occ * vec3(0.2, 0.25, 0.4));
            col = mix(col, haze, 1.0 - exp(-0.05 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "太陽の向き `l` の x と z を、円周の上で回します([時間で動かす](/learn/time-and-motion) の「円周上を回す」と同じ)",
          en: "Move the x and z of the light direction `l` around a circle, just like moving a point around a circle in [Time and motion](/learn/time-and-motion)",
        },
        {
          ja: "12 秒で 1 周なら、角度は `time * TAU / 12.0`。y を小さくするほど太陽が低くなり、影が長くなります",
          en: "One turn every 12 seconds means an angle of `time * TAU / 12.0`. The smaller the y, the lower the sun and the longer the shadow",
        },
        {
          ja: "`float a = time * TAU / 12.0; vec3 l = normalize(vec3(cos(a), 0.6, sin(a)));`",
          en: "`float a = time * TAU / 12.0; vec3 l = normalize(vec3(cos(a), 0.6, sin(a)));`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "2 つの色の光", en: "Two colored lights" },
      prompt: {
        ja: "暖かいオレンジの光 1 つで照らされた場面に、反対側から青い光をもう 1 つ足してください。それぞれの光に影を付けると、片方の光だけがさえぎられた場所に、もう片方の色の影ができます。舞台の照明のような、2 色の影を作りましょう。",
        en: "The scene is lit by one warm orange light. Add a second, blue light from the other side. Give each light its own shadow: where only one light is blocked, the shadow takes on the other light's color. Aim for two-colored shadows, like stage lighting.",
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
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float map(vec3 p) {
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-1.1, 0.5, 0.3), 0.5));
          vec3 q = p - vec3(0.15, 0.61, 0.0);
          d = min(d, sdTorus(q.xzy, vec2(0.45, 0.16)));
          vec3 b = p - vec3(1.25, 0.37, 0.5);
          b.xz = rot(0.6) * b.xz;
          d = min(d, sdBox(b, vec3(0.35)) - 0.02);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.3, 2.4, -2.0);
          vec3 ta = vec3(0.1, 0.5, 0.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 col = vec3(0.08, 0.08, 0.1);
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float occ = calcAO(pos, n);
            vec3 albedo = vec3(0.85, 0.85, 0.85);

            vec3 l1 = normalize(vec3(-0.8, 0.5, -0.1));  //ja: オレンジの光 //en: the orange light
            float dif1 = max(dot(n, l1), 0.0);
            float sha1 = dif1 > 0.0 ? softShadow(pos, l1) : 0.0;

            vec3 lin = vec3(0.0);
            lin += dif1 * sha1 * vec3(1.6, 0.8, 0.3);
            lin += occ * vec3(0.05);
            col = albedo * lin;
            col = mix(col, vec3(0.08, 0.08, 0.1), 1.0 - exp(-0.08 * t));
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
        float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
        }

        float map(vec3 p) {
          float d = p.y;
          d = min(d, sdSphere(p - vec3(-1.1, 0.5, 0.3), 0.5));
          vec3 q = p - vec3(0.15, 0.61, 0.0);
          d = min(d, sdTorus(q.xzy, vec2(0.45, 0.16)));
          vec3 b = p - vec3(1.25, 0.37, 0.5);
          b.xz = rot(0.6) * b.xz;
          d = min(d, sdBox(b, vec3(0.35)) - 0.02);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.3, 2.4, -2.0);
          vec3 ta = vec3(0.1, 0.5, 0.2);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 col = vec3(0.08, 0.08, 0.1);
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float occ = calcAO(pos, n);
            vec3 albedo = vec3(0.85, 0.85, 0.85);

            vec3 l1 = normalize(vec3(-0.8, 0.5, -0.1));
            float dif1 = max(dot(n, l1), 0.0);
            float sha1 = dif1 > 0.0 ? softShadow(pos, l1) : 0.0;

            //ja: 2 つ目の光は右の奥から。影も別に調べる(影のループが 2 回ぶんになる)
            //en: the second light comes from the back right, with its own shadow (two shadow loops now)
            vec3 l2 = normalize(vec3(0.7, 0.5, 0.6));
            float dif2 = max(dot(n, l2), 0.0);
            float sha2 = dif2 > 0.0 ? softShadow(pos, l2) : 0.0;

            vec3 lin = vec3(0.0);
            lin += dif1 * sha1 * vec3(1.6, 0.8, 0.3);
            lin += dif2 * sha2 * vec3(0.3, 0.6, 1.6);
            lin += occ * vec3(0.05);
            col = albedo * lin;
            col = mix(col, vec3(0.08, 0.08, 0.1), 1.0 - exp(-0.08 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "光ごとに、向き `l`・拡散光 `dif`・影 `sha` の 3 つをそろえます。1 つ目の光の 3 行をまねしましょう",
          en: "Each light needs its own direction `l`, diffuse `dif` and shadow `sha`. Copy the three lines of the first light",
        },
        {
          ja: "2 つ目の光は、1 つ目とは反対の右の奥から当てると、影が 2 方向に伸びます。色は `vec3(0.3, 0.6, 1.6)` のような青に",
          en: "Put the second light at the back right, opposite the first, and the shadows stretch two ways. Use a blue like `vec3(0.3, 0.6, 1.6)`",
        },
        {
          ja: "`vec3 l2 = normalize(vec3(0.7, 0.5, 0.6)); float dif2 = max(dot(n, l2), 0.0); float sha2 = dif2 > 0.0 ? softShadow(pos, l2) : 0.0;` を作り、`lin += dif2 * sha2 * vec3(0.3, 0.6, 1.6);`",
          en: "Write `vec3 l2 = normalize(vec3(0.7, 0.5, 0.6)); float dif2 = max(dot(n, l2), 0.0); float sha2 = dif2 > 0.0 ? softShadow(pos, l2) : 0.0;` and then `lin += dif2 * sha2 * vec3(0.3, 0.6, 1.6);`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "格子窓の光", en: "Light through a lattice window" },
      prompt: {
        ja: "奥に壁が立っていて、太陽は壁の向こう側にあります。今は手前の床が全部壁の影に入っています。壁に小さな四角い窓を横 7 つ・縦 3 つ開けて、窓を通った光が床に四角い日だまりを並べるようにしてください。",
        en: "A wall stands at the back, and the sun is on the far side of it, so the floor in front is entirely in the wall's shadow. Cut small square windows in the wall, 7 across and 3 high, so the light coming through lays a row of square sunny patches on the floor.",
      },
      starter: `
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
          float wall = sdBox(p - vec3(0.0, 1.0, 1.0), vec3(2.0, 1.0, 0.05));
          //ja: ここで窓を開ける //en: cut the windows here
          return min(p.y, wall);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.6, -2.6);
          vec3 ta = vec3(0.0, 0.4, 0.5);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 l = normalize(vec3(0.3, 0.85, 1.0));  //ja: 太陽は壁の向こう //en: the sun is behind the wall
          vec3 skyCol = vec3(1.0, 0.85, 0.65);
          vec3 col = skyCol;
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float dif = max(dot(n, l), 0.0);
            float sha = dif > 0.0 ? softShadow(pos, l) : 0.0;
            float occ = calcAO(pos, n);
            float sky = 0.5 + 0.5 * n.y;
            vec3 albedo = pos.y < 0.01 ? vec3(0.55, 0.4, 0.3) : vec3(0.8, 0.78, 0.75);
            col = albedo * (dif * sha * vec3(1.8, 1.4, 1.0) + sky * occ * vec3(0.12, 0.14, 0.2));
            col = mix(col, skyCol, 1.0 - exp(-0.03 * t));
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

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        float map(vec3 p) {
          float wall = sdBox(p - vec3(0.0, 1.0, 1.0), vec3(2.0, 1.0, 0.05));
          //ja: 窓の位置: 中心 (0, 1.1, 1.0) から、0.5 間隔で横 -3〜3・縦 -1〜1 にくり返す
          //en: window layout: from the center (0, 1.1, 1.0), repeat every 0.5, -3..3 across and -1..1 up
          vec3 q = p - vec3(0.0, 1.1, 1.0);
          q.xy -= 0.5 * clamp(round(q.xy / 0.5), vec2(-3.0, -1.0), vec2(3.0, 1.0));
          float windows = sdBox(q, vec3(0.18, 0.18, 0.2));  //ja: 壁より厚い箱でくりぬく //en: carve with boxes thicker than the wall
          wall = max(wall, -windows);                        //ja: 差: 壁から窓を引く //en: difference: wall minus windows
          return min(p.y, wall);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        float softShadow(vec3 ro, vec3 rd) {
          float res = 1.0;
          float t = 0.02;
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
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
            occ += (h - map(p + n * h)) * w;
            w *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.6, -2.6);
          vec3 ta = vec3(0.0, 0.4, 0.5);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 50.0) break;
            t += d;
          }

          vec3 l = normalize(vec3(0.3, 0.85, 1.0));
          vec3 skyCol = vec3(1.0, 0.85, 0.65);
          vec3 col = skyCol;
          if (t < 50.0) {
            vec3 pos = ro + rd * t;
            vec3 n = calcNormal(pos);
            float dif = max(dot(n, l), 0.0);
            float sha = dif > 0.0 ? softShadow(pos, l) : 0.0;
            float occ = calcAO(pos, n);
            float sky = 0.5 + 0.5 * n.y;
            vec3 albedo = pos.y < 0.01 ? vec3(0.55, 0.4, 0.3) : vec3(0.8, 0.78, 0.75);
            col = albedo * (dif * sha * vec3(1.8, 1.4, 1.0) + sky * occ * vec3(0.12, 0.14, 0.2));
            col = mix(col, skyCol, 1.0 - exp(-0.03 * t));
          }
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "窓は「壁から箱を引いた穴」です。[3D の形を組み立てる](/learn/shapes-3d) の差 `max(a, -b)` を使います",
          en: "A window is a box subtracted from the wall. Use the difference `max(a, -b)` from [Building 3D shapes](/learn/shapes-3d)",
        },
        {
          ja: "21 個の窓を 1 つずつ書く代わりに、[無限の空間と変形](/learn/infinite-space) の「並べる数を限る」くり返しを、壁の面(x と y)に使います",
          en: "Instead of writing 21 windows by hand, use limited repetition from [Infinite space and deformation](/learn/infinite-space) on the wall's plane (x and y)",
        },
        {
          ja: "`vec3 q = p - vec3(0.0, 1.1, 1.0); q.xy -= 0.5 * clamp(round(q.xy / 0.5), vec2(-3.0, -1.0), vec2(3.0, 1.0)); wall = max(wall, -sdBox(q, vec3(0.18, 0.18, 0.2)));`",
          en: "`vec3 q = p - vec3(0.0, 1.1, 1.0); q.xy -= 0.5 * clamp(round(q.xy / 0.5), vec2(-3.0, -1.0), vec2(3.0, 1.0)); wall = max(wall, -sdBox(q, vec3(0.18, 0.18, 0.2)));`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "影は、当たった点から光の向きへもう一度レイマーチして、途中で当たるかで決まる",
          en: "A shadow is decided by raymarching again from the hit point toward the light and seeing whether anything gets in the way",
        },
        {
          ja: "影のレイは表面から少し離れて(`t = 0.02`)始める。でないと全部が影になる(影のにきび)",
          en: "Start the shadow ray a little off the surface (`t = 0.02`), or everything turns to shadow (shadow acne)",
        },
        {
          ja: "`softShadow` は、レイが物をかすめた具合 `h / t` から半影を作る。`8.0` で硬さ、歩幅 × 歩数で届く距離が決まる",
          en: "`softShadow` builds a penumbra from how closely the ray grazes, `h / t`. `8.0` sets the hardness; step size × step count sets the reach",
        },
        {
          ja: "`calcAO` は、法線の向きの 5 点で「期待より近い分」を足して、すき間を暗くする",
          en: "`calcAO` adds up \"how much closer than expected\" at five points along the normal to darken the gaps",
        },
        {
          ja: "影は太陽に、AO は空と照り返しにかける。背を向けた面では影を調べず、ループの上限で重さを抑える",
          en: "Shadows multiply the sun; AO multiplies the sky and bounce. Skip shadows on faces turned away, and let loop limits cap the cost",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "光と影がそろい、形に重さが出てきました。次の回では、物ごとに違う色と質感を付け、床に映りこみを足し、霧と空で空気を描いて、1 枚の場面として仕上げます。",
        en: "With light and shadow in place, your shapes now have weight. Next time we give each object its own color and material, add reflections on the floor, and paint the air with fog and sky to finish a complete scene.",
      },
    },
  ],
};

export default lesson;
