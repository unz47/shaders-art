import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "light-and-glow",
  title: { ja: "光と仕上げ", en: "Light and finishing" },
  summary: {
    ja: "光のにじみ・加算・トーンマッピング・ビネットで絵を仕上げる",
    en: "Finish images with glow, additive light, tone mapping and vignettes",
  },
  minutes: 50,
  goals: [
    {
      ja: "距離から光のにじみ(`k / d`、`exp(-d * k)`)を作り、強さと広がりを選べる",
      en: "Make glows from a distance (`k / d`, `exp(-d * k)`) and choose their strength and spread",
    },
    {
      ja: "光を足し合わせて、たくさんの光の粒が重なる場面を作れる",
      en: "Add lights together to build scenes full of overlapping points of light",
    },
    {
      ja: "1.0 を超える明るさを、トーンマッピング(`1.0 - exp(-x)`、Reinhard)で自然に収められる",
      en: "Bring brightness above 1.0 back into range naturally with tone mapping (`1.0 - exp(-x)`, Reinhard)",
    },
    {
      ja: "ガンマ補正・ビネット・フィルムグレイン・色収差で絵を仕上げ、その順番を説明できる",
      en: "Finish an image with gamma correction, a vignette, film grain and chromatic aberration, and explain their order",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "光はにじむ", en: "Light glows" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの図形は、縁がくっきりした「塗り」でした。でも、街灯やネオンや星のように **光っているもの** は、まわりにふわっと明るさがにじみます。光源に近いほど明るく、離れるほど暗くなる、というだけのことなので、[円と距離](/learn/circles-and-distance) の距離を使えばすぐに作れます。いちばん簡単なのは、距離で割ることです。",
        en: "The shapes so far have been crisp fills. But things that **give off light** — street lamps, neon, stars — spread a soft brightness around them. It is just \"brighter near the source, darker farther away\", so the distance from [Circles and distance](/learn/circles-and-distance) is all we need. The simplest version divides by the distance.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float d = length(p);
          float glow = 0.05 / d; //ja: 近いほど明るい //en: brighter when closer
          vec3 col = vec3(1.0, 0.6, 0.3) * glow;
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.05` を `0.1` にすると光が強く大きくなります。`0.05 / d` を `0.0025 / (d * d)` にすると、どう変わるでしょう?",
        en: "Change `0.05` to `0.1` for a stronger, bigger glow. What changes if you replace `0.05 / d` with `0.0025 / (d * d)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`0.05 / d` は、中心から 0.05 のところで 1.0、0.1 で 0.5、0.5 で 0.1 です。近づくほど急に明るくなり、遠くでもなかなか 0 になりません。この「すそが長い」ところが、空気の中でにじむ光らしさを出しています。中心では 0 で割るので値がとても大きくなりますが、画面では 1.0 で切り詰められるので、白くとんだ芯になります。",
        en: "`0.05 / d` is 1.0 at 0.05 from the center, 0.5 at 0.1, and 0.1 at 0.5. It gets bright quickly as you approach and never quite reaches 0 far away. That long tail is what makes it look like light diffusing through air. At the very center we divide by 0, so the value gets huge, but the screen clips it to 1.0, leaving a white-hot core.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "芯が白くなるのには、もう 1 つ理由があります。色 `(1.0, 0.6, 0.3)` に 3 をかけると `(3.0, 1.8, 0.9)` で、赤と緑が 1.0 で切られて黄色っぽくなります。10 をかければ 3 つとも 1.0 を超えて白です。明るい光の真ん中が白っぽく見えるのは、本物の写真でも同じです。",
        en: "There is another reason the core turns white. Multiply the color `(1.0, 0.6, 0.3)` by 3 and you get `(3.0, 1.8, 0.9)`: red and green clip at 1.0 and it looks yellowish. Multiply by 10 and all three pass 1.0 — white. Real photos do the same thing: the middle of a bright light looks white.",
      },
    },

    { type: "heading", text: { ja: "にじみ方を選ぶ", en: "Choosing how light falls off" } },
    {
      type: "paragraph",
      text: {
        ja: "距離から明るさを作る式(減衰の式)は、ほかにもあります。どれを選ぶかで光の印象が変わります。下では、左から順に 3 つの式で光を描いています。",
        en: "There are other formulas for turning distance into brightness (falloff formulas), and each gives light a different character. Below, three lights use three formulas, from left to right.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float d1 = length(p - vec2(-0.9, 0.0));
          float d2 = length(p);
          float d3 = length(p - vec2(0.9, 0.0));
          vec3 col = vec3(0.0);
          col += vec3(1.0, 0.5, 0.2) * 0.03 / d1;           // k / d
          col += vec3(0.3, 1.0, 0.5) * exp(-d2 * 12.0);      // exp(-d * k)
          col += vec3(0.3, 0.5, 1.0) * 0.002 / (d3 * d3);    // k / d²
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`12.0` を `4.0` にすると、真ん中の光が大きく広がります。左の光のすそが、真ん中の光のところまで届いているのに気づきましたか?",
        en: "Change `12.0` to `4.0` and the middle light spreads wide. Did you notice the tail of the left light reaching all the way to the middle one?",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`k / d` … 芯が鋭く、すそがとても長い。ぼんやり大きく光る。たくさん並べると、すそが積み重なって画面全体が明るくなる",
          en: "`k / d` … sharp core, very long tail; a big hazy glow. With many lights, the tails pile up and brighten the whole screen",
        },
        {
          ja: "`exp(-d * k)` … 中心でちょうど 1.0 で、0 で割ることがない。すそがすぐに消えるので、光の大きさを `k` で決めやすい",
          en: "`exp(-d * k)` … exactly 1.0 at the center, with no division by zero. The tail dies fast, so `k` sets the size of the light precisely",
        },
        {
          ja: "`k / (d * d)` … 本物の光と同じ「距離の 2 乗に反比例」。芯がとても強く、すぐに暗くなる。このあと出てくるガンマ補正と組み合わせると、ちょうどよく広がる",
          en: "`k / (d * d)` … the inverse-square falloff of real light. A very intense core that fades quickly. Combined with gamma correction, coming up later, it spreads out just right",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "光らせられるのは点だけではありません。[距離で描く](/learn/sdf-2d) の距離関数なら、どんな形でも光らせられます。図形の縁の線を光らせたいときは、縁までの距離 `abs(d)` を使います。これで **ネオンサイン** が作れます。",
        en: "It's not just points that can glow. Any distance function from [Drawing with distance](/learn/sdf-2d) can glow. To make an outline glow, use the distance to the edge, `abs(d)`. That gives you a **neon sign**.",
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
          float ring = abs(length(p) - 0.6); //ja: 円の縁までの距離 //en: distance to the circle's outline
          float bolt = sdSegment(p, vec2(0.15, 0.4), vec2(-0.12, 0.02));
          bolt = min(bolt, sdSegment(p, vec2(-0.12, 0.02), vec2(0.12, 0.02)));
          bolt = min(bolt, sdSegment(p, vec2(0.12, 0.02), vec2(-0.15, -0.4)));

          float flicker = 0.85 + 0.15 * step(0.5, fract(sin(floor(time * 12.0)) * 43758.5));
          vec3 col = vec3(0.02, 0.01, 0.04);
          col += vec3(1.0, 0.2, 0.6) * 0.012 / ring;
          col += vec3(0.2, 0.8, 1.0) * 0.012 / bolt * flicker;
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.012` を `0.004` にすると、細い管のネオンになります。`flicker` を `1.0` にすると、ちらつきが止まります",
        en: "Lower `0.012` to `0.004` for thin neon tubes. Set `flicker` to `1.0` to stop the flicker",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "管の真ん中が白く見えるのは、さっきと同じく、値が 1.0 を超えて 3 色とも切り詰められているからです。ピンク `(1.0, 0.2, 0.6)` でも、5 倍以上になれば緑まで 1.0 を超えます。`flicker` は、0.083 秒(1 ÷ 12)ごとに変わる昔ながらの乱数で、ときどき少し暗くなって古いネオンのようにまたたきます。",
        en: "The middle of each tube looks white for the same reason as before: the values pass 1.0 and all three channels get clipped. Even pink `(1.0, 0.2, 0.6)` pushes green over 1.0 once it is multiplied by 5 or more. `flicker` is an old-school random number that changes every 0.083 seconds (1 ÷ 12), dimming the sign now and then like aging neon.",
      },
    },

    { type: "heading", text: { ja: "光を足し合わせる", en: "Adding lights together" } },
    {
      type: "paragraph",
      text: {
        ja: "光には、**足し算で重なる** という性質があります。2 つの電球で照らせば、明るさは足し算です。だから、たくさんの光は、ループでひとつずつ明るさを足していけば描けます。[乱数をつくる](/learn/randomness) の `hash22` で光の場所と色を決め、ゆらゆら動かしてみます。",
        en: "Light has a handy property: it **adds up**. Two bulbs give you the sum of their brightness. So we can draw many lights by looping and adding each one's brightness in turn. Let's use `hash22` from [Making randomness](/learn/randomness) to pick each light's position and color, and let them drift.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        vec2 hash22(vec2 p) {
          vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
          a += dot(a, a + 34.45);
          return fract(vec2(a.x * a.y, a.y * a.z));
        }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = vec3(0.0);
          for (int i = 0; i < 24; i++) {
            float fi = float(i);
            vec2 h = hash22(vec2(fi, 3.7));
            vec2 pos = (h - 0.5) * vec2(2.6, 1.6);
            pos += 0.15 * vec2(sin(time * (0.5 + h.x) + fi), cos(time * (0.4 + h.y) + fi * 1.7));
            vec3 c = palette(fract(h.x * 5.0 + h.y), vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.15, 0.3));
            col += c * 0.01 / length(p - pos); //ja: 1 つぶんの光を足す //en: add one light's worth
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`i < 24` を `i < 48` にすると光が増え、画面全体がかすみます。`0.01` を `0.03` にすると、重なったところが白くとびます",
        en: "Change `i < 24` to `i < 48` for more lights; the whole screen gets hazy. Raise `0.01` to `0.03` and the overlaps blow out to white",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "光の重なったところは、色が足されて明るくなっています。ただ、明るくしすぎると、重なったところが真っ白な板のようになり、どの光が何色だったのかわからなくなります。これは、1.0 を超えた分が画面で **切り捨てられて** いるからです。次はこれを直します。",
        en: "Where lights overlap, their colors add up and get brighter. Push it too far, though, and the overlaps become flat white patches where you can no longer tell which light had which color. That's because everything above 1.0 is **cut off** on screen. Let's fix that next.",
      },
    },

    { type: "heading", text: { ja: "トーンマッピング", en: "Tone mapping" } },
    {
      type: "paragraph",
      text: {
        ja: "画面に出せる明るさは 0.0〜1.0 ですが、光を計算するときは、1.0 を超えても気にせず計算したほうが自然な絵になります。そして最後に、大きな値を 0〜1 に **なめらかに押し縮める**。これを **トーンマッピング** と呼びます。写真のカメラも、まぶしい空と暗い部屋を 1 枚に収めるために同じことをしています。",
        en: "A screen can only show 0.0 to 1.0, but light looks most natural when you compute it freely, past 1.0 if need be. Then, at the very end, **squeeze large values smoothly** into 0–1. That's **tone mapping**. Cameras do the same thing to fit a dazzling sky and a dark room into one photo.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "よく使う式が `1.0 - exp(-x)` です。`x` が 0 なら 0、0.5 で 0.39、1 で 0.63、2 で 0.86、4 で 0.98 と、大きくなるほど 1.0 に近づきますが、決して超えません。たとえば色 `(2.0, 1.2, 0.4)` は、切り捨てでは `(1.0, 1.0, 0.4)` の黄色になってしまいますが、`1.0 - exp(-x)` なら `(0.86, 0.70, 0.33)` で、もとのオレンジの感じが残ります。下では、わかりやすいように赤・緑・青の大きな光を 3 つ重ねた場面で、左右を比べます。",
        en: "A popular formula is `1.0 - exp(-x)`. It is 0 at `x` = 0, 0.39 at 0.5, 0.63 at 1, 0.86 at 2 and 0.98 at 4: approaching 1.0 as `x` grows, but never passing it. Take the color `(2.0, 1.2, 0.4)`. Clipping turns it into yellow `(1.0, 1.0, 0.4)`, but `1.0 - exp(-x)` gives `(0.86, 0.70, 0.33)`, which keeps the original orange feel. Below, to make the difference obvious, three big red, green and blue lights overlap, and we compare the two halves.",
      },
    },
    {
      type: "playground",
      source: `
        //ja: 赤・緑・青の大きな光を 3 つ重ねる
        //en: three big red, green and blue lights overlapping
        vec3 scene(vec2 p) {
          vec3 col = vec3(0.0);
          col += vec3(1.0, 0.15, 0.1) * 2.0 * exp(-2.5 * length(p - vec2(-0.35 + 0.1 * sin(time), -0.2)));
          col += vec3(0.1, 1.0, 0.25) * 2.0 * exp(-2.5 * length(p - vec2(0.35, -0.2 + 0.1 * cos(time))));
          col += vec3(0.15, 0.3, 1.0) * 2.0 * exp(-2.5 * length(p - vec2(0.0, 0.35)));
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = scene(p);
          vec3 mapped = 1.0 - exp(-col);   //ja: トーンマッピング //en: tone mapping
          // mapped = col / (1.0 + col);   //ja: Reinhard //en: Reinhard
          //ja: 左は切り捨てのまま、右はトーンマッピング
          //en: left: plain clipping; right: tone mapped
          col = uv.x < 0.5 ? col : mapped;
          col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.002, abs(uv.x - 0.5)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "左右を見比べましょう。右では白い板が消えて、光の色が最後まで残ります。`// mapped = col / (1.0 + col);` の `//` を消すと、Reinhard の式に変わります",
        en: "Compare the two halves. On the right the white patches are gone and every light keeps its color. Remove the `//` from `// mapped = col / (1.0 + col);` to switch to the Reinhard formula",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つの有名な式が、`x / (1.0 + x)`(考えた人の名前から **Reinhard**(ラインハルト)と呼ばれます)です。1 で 0.5、3 で 0.75、9 で 0.9 と、`1.0 - exp(-x)` よりもゆっくり 1.0 に近づくので、明るいところの差がよく残り、全体は少し落ち着いた感じになります。",
        en: "Another well-known formula is `x / (1.0 + x)`, called **Reinhard** after its inventor. It gives 0.5 at 1, 0.75 at 3 and 0.9 at 9. It approaches 1.0 more slowly than `1.0 - exp(-x)`, so differences among the bright parts survive better and the overall look is a little calmer.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "トーンマッピングをすると、暗いところや中くらいの明るさも少し暗くなります(0.5 が 0.39 に)。全体の明るさは、トーンマッピングの **前に** 数をかけて決めます。これを **露出** と呼びます。`col *= 1.5;` のあとにトーンマッピング、という順です。",
        en: "Tone mapping also darkens the dim and middle tones a bit (0.5 becomes 0.39). Set the overall brightness by multiplying **before** tone mapping. That multiplier is called **exposure**: `col *= 1.5;`, then tone map.",
      },
    },

    { type: "heading", text: { ja: "ガンマ補正", en: "Gamma correction" } },
    {
      type: "paragraph",
      text: {
        ja: "実は、画面の明るさは、数に比例していません。画面は値 `v` を、およそ `v` の 2.2 乗の **光の量** で表示します。値 0.5 なら、0.5 の 2.2 乗で約 0.22、つまり光は 1.0 のときの 5 分の 1 ほどしか出ていません。これは、人の目が暗いところの差に敏感なので、暗い側に細かく段階を割り当てるためのしくみです。",
        en: "Here's a surprise: screen brightness is not proportional to the numbers. A screen shows a value `v` as roughly `v` to the power of 2.2 **in actual light**. A value of 0.5 becomes 0.5 to the 2.2, about 0.22: only a fifth of the light of 1.0. The reason is that our eyes are more sensitive to differences in the dark, so screens spend more of their steps there.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この回でしてきたように、光を足したり、距離で弱めたりするのは「光の量」の計算です。それをそのまま画面に送ると、中くらいの明るさが暗くつぶれます。そこで、最後に `pow(col, vec3(1.0 / 2.2))` で 2.2 乗の逆をかけておくと、画面の 2.2 乗と打ち消し合って、計算どおりの光の量で見えます。これを **ガンマ補正** と呼びます。[色を混ぜる](/learn/mixing-colors) で軽くふれたのはこのことです。",
        en: "Adding lights and fading them with distance, as we have been doing, are calculations in amounts of light. Send those straight to the screen and the middle tones get crushed dark. So at the very end we apply the inverse of the power of 2.2, `pow(col, vec3(1.0 / 2.2))`. It cancels the screen's power of 2.2, and you see the amounts of light you computed. This is **gamma correction**, which we touched on in [Mixing colors](/learn/mixing-colors).",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          //ja: 赤から緑への混ぜ合わせと、青い光
          //en: a red-to-green blend and a blue light
          vec3 col = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), uv.x) * 0.7;
          float d = length(p);
          col += vec3(0.3, 0.5, 1.0) * 0.0015 / (d * d); //ja: 本物の光と同じ k / d² //en: k / d², like real light
          //ja: 下半分だけガンマ補正
          //en: gamma-correct the lower half only
          if (p.y < 0.0) {
            col = pow(col, vec3(1.0 / 2.2));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "上下で、混ぜ合わせの真ん中の色と、光の広がりを比べましょう。`2.2` を `1.0` にすると、上下が同じになります",
        en: "Compare the middle of the blend and the spread of the light between the top and bottom. Change `2.2` to `1.0` and the halves match",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "上半分(補正なし)では、赤と緑のまん中が暗いオリーブ色に沈み、光は芯のまわりだけに縮こまっています。下半分(補正あり)では、まん中が明るい黄色になり、光が大きくやわらかく広がります。たとえば赤と緑を半分ずつ混ぜた値 `(0.35, 0.35, 0.0)` は、補正で `(0.62, 0.62, 0.0)` になります。光には本物と同じ `k / (d * d)` を使っています。補正なしでは小さな点ですが、補正すると、最初に見た `k / d` のような自然なにじみ方になります。",
        en: "In the top half (uncorrected), the middle of the red-green blend sinks into a dark olive, and the light huddles around its core. In the bottom half (corrected), the middle turns bright yellow and the light spreads large and soft. For example, the half-and-half blend `(0.35, 0.35, 0.0)` becomes `(0.62, 0.62, 0.0)` after correction. The light uses `k / (d * d)`, just like real light. Uncorrected it is a small dot; corrected, it spreads naturally, much like the `k / d` glow we started with.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "ガンマ補正は、トーンマッピングの **あと**、色を返す直前に 1 回だけかけます。2 回かけると白っぽく色あせます。また `pow` は負の数を入れると結果が決まっていないので、色が負になるかもしれないときは、先に `max(col, 0.0)` で 0 以上にしておきます。",
        en: "Apply gamma correction once, **after** tone mapping, right before returning the color. Applying it twice makes everything washed out. Also, `pow` is undefined for negative inputs, so if a color might go negative, clamp it first with `max(col, 0.0)`.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ガンマ補正を入れると、暗い色が明るく持ち上がります。0.02 は 0.17 に、0.1 は 0.35 になります。暗い背景を保ちたいときは、補正の前の値をうんと小さくします(0.002 なら約 0.06)。同じ理由で `k / d` の長いすそも持ち上がり、画面がかすみやすくなるので、補正をする場面では `k / (d * d)` か `exp(-d * k)` を使いましょう。",
        en: "Gamma correction lifts dark colors: 0.02 becomes 0.17 and 0.1 becomes 0.35. To keep a background dark, make the value before correction much smaller (0.002 ends up around 0.06). For the same reason, the long tail of `k / d` gets lifted too and the screen turns hazy, so in gamma-corrected scenes use `k / (d * d)` or `exp(-d * k)`.",
      },
    },

    { type: "heading", text: { ja: "ビネットとフィルムグレイン", en: "Vignette and film grain" } },
    {
      type: "paragraph",
      text: {
        ja: "**ビネット** は、画面の四すみを少し暗くする効果です。古いカメラのレンズで写した写真のように、自然に目が中央へ向かいます。よく使われるのが、次の 1 行です。",
        en: "A **vignette** darkens the corners of the frame a little. Like a photo taken through an old lens, it naturally pulls the eye toward the middle. Here is a commonly used one-liner:",
      },
    },
    {
      type: "code",
      source: `
        col *= pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2);
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "`uv.x * (1.0 - uv.x)` は、左右の端で 0、真ん中(0.5)で 0.25 になります。上下も同じなので、4 つをかけると、端で 0、中央で 0.0625(16 分の 1)です。それを `16.0` 倍すると中央でちょうど 1.0 になります。最後の `pow(…, 0.2)` は、1.0 に近い値を引き上げて平らにするので、暗くなるのは端の近くだけになります。`0.2` を大きくするほど、ビネットは強くなります。",
        en: "`uv.x * (1.0 - uv.x)` is 0 at the left and right edges and 0.25 in the middle (0.5). The same goes vertically, so the product of all four is 0 at the edges and 0.0625 (one sixteenth) at the center. Multiplying by `16.0` makes it exactly 1.0 at the center. The final `pow(…, 0.2)` pulls values close to 1.0 up and flattens them, so only the area near the edges darkens. A larger exponent than `0.2` gives a stronger vignette.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "**フィルムグレイン** は、ピクセルごとに少しだけ明るさをばらつかせて、フィルム写真のざらつきを真似する効果です。コマごとに変わる乱数を、ほんの少し(±0.02 くらい)足します。のっぺりしたグラデーションに質感が出て、暗いグラデーションに出がちな段々(バンディング)も目立たなくなります。",
        en: "**Film grain** jiggles each pixel's brightness a tiny bit, imitating the texture of film. Add a random number that changes every frame, just a little (around ±0.02). It gives flat gradients some texture and hides the stair steps (banding) that dark gradients tend to show.",
      },
    },
    {
      type: "playground",
      source: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 夕暮れの空と、低い太陽
          //en: a dusk sky and a low sun
          vec3 col = mix(vec3(0.7, 0.15, 0.04), vec3(0.004, 0.006, 0.03), smoothstep(-0.6, 0.9, p.y));
          float d = length(p - vec2(0.0, -0.45));
          col += vec3(1.0, 0.6, 0.3) * 0.003 / (d * d);
          col = 1.0 - exp(-col * 1.2);

          col *= pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.2); //ja: ビネット //en: vignette
          col = pow(col, vec3(1.0 / 2.2));
          col += (hash21(p * 500.0 + fract(time) * 100.0) - 0.5) * 0.04;    //ja: グレイン //en: grain
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.2` を `0.6` にすると、ビネットが強くなります。`0.04` を `0.15` にすると、グレインの役割がよくわかります(わかったら戻しましょう)",
        en: "Raise `0.2` to `0.6` for a stronger vignette. Bump `0.04` up to `0.15` to see clearly what the grain does (then set it back)",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "グレインの乱数には `fract(time)` を混ぜているので、コマごとに模様が変わり、ざらつきがちらちら動いて見えます。グレインは、ガンマ補正の **あと** に足しています。補正の前に足すと、暗いところでは 2.2 乗の逆で大きく引きのばされて、ざらつきが目立ちすぎるからです。",
        en: "The grain's random number mixes in `fract(time)`, so the pattern changes every frame and the texture shimmers. We add the grain **after** gamma correction. Added before, it would be stretched a lot in the dark areas by the inverse power of 2.2 and look far too coarse there.",
      },
    },

    { type: "heading", text: { ja: "色収差", en: "Chromatic aberration" } },
    {
      type: "paragraph",
      text: {
        ja: "安いレンズで撮った写真では、明るいものの縁に赤や青のにじみが出ることがあります。光の色によって曲がり方が少し違うため、赤・緑・青がわずかにずれて写るのです。これを **色収差** といい、わざと少し入れると、レンズを通して見ているような雰囲気が出ます。",
        en: "Photos from cheap lenses sometimes show red and blue fringes around bright objects. Different colors of light bend by slightly different amounts, so red, green and blue land in slightly different places. This is **chromatic aberration**, and a little of it on purpose gives the feeling of looking through a lens.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーで真似するには、場面を `vec3 scene(vec2 p)` という関数にまとめ、少しずつ違う場所で 3 回呼んで、それぞれから赤・緑・青を 1 つずつ取ります。`p * 1.01` のように拡大でずらすと、ずれが画面の中心で 0、端ほど大きくなり、本物のレンズに似ます。",
        en: "To imitate it in a shader, put the scene in a function such as `vec3 scene(vec2 p)`, call it three times at slightly different spots, and take red from one, green from another and blue from the third. Shifting by scaling, as in `p * 1.01`, makes the offset zero at the center and larger toward the edges, just like a real lens.",
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

        vec3 scene(vec2 p) {
          float ring = abs(length(p) - 0.6);
          float bolt = sdSegment(p, vec2(0.15, 0.4), vec2(-0.12, 0.02));
          bolt = min(bolt, sdSegment(p, vec2(-0.12, 0.02), vec2(0.12, 0.02)));
          bolt = min(bolt, sdSegment(p, vec2(0.12, 0.02), vec2(-0.15, -0.4)));
          vec3 col = vec3(0.002, 0.001, 0.004);
          col += vec3(1.0, 0.85, 0.7) * 0.00006 / (ring * ring);
          col += vec3(0.8, 0.9, 1.0) * 0.00006 / (bolt * bolt);
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          float amount = 0.02; //ja: ずれの大きさ //en: how far the colors split
          vec3 col;
          col.r = scene(p * (1.0 + amount)).r;
          col.g = scene(p).g;
          col.b = scene(p * (1.0 - amount)).b;
          col = 1.0 - exp(-col);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`amount` を `0.0` にすると、白っぽいネオンに戻ります。`0.05` にすると、3D メガネで見たようにはっきり分かれます",
        en: "Set `amount` to `0.0` and the neon turns back to plain white. At `0.05` the colors split apart like in 3D glasses",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "色収差は場面を 3 回計算するので、重さも 3 倍です。場面が重いときは使わないか、ループの回数を減らしてから使いましょう。ずれも 0.01〜0.02 くらいの控えめが、品よく見えます。",
        en: "Chromatic aberration computes the scene three times, so it costs three times as much. Skip it for heavy scenes, or trim the loop counts first. Keep the offset modest, around 0.01–0.02, for a tasteful look.",
      },
    },

    { type: "heading", text: { ja: "仕上げの順番", en: "The order of finishing" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの仕上げは、かける順番で結果が変わります。迷ったら次の順にしておけば、まずまちがいありません。この先の 3D の回でも、最後はこの形で仕上げます。",
        en: "The order of these finishing steps changes the result. When in doubt, use the order below and you won't go far wrong. The 3D lessons ahead finish their images the same way.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: [
        {
          ja: "場面を「光の量」で計算する。光は足し算で、1.0 を超えてもかまわない(色収差を使うなら、ここで場面を 3 回呼ぶ)",
          en: "Compute the scene in amounts of light. Lights add up, and going over 1.0 is fine (for chromatic aberration, call the scene three times here)",
        },
        {
          ja: "露出: 全体に数をかけて明るさを決める",
          en: "Exposure: multiply everything to set the overall brightness",
        },
        {
          ja: "トーンマッピング: `1.0 - exp(-col)` などで 0〜1 に収める",
          en: "Tone mapping: squeeze into 0–1 with `1.0 - exp(-col)` or similar",
        },
        {
          ja: "ビネット: 収めたあとにかけると、端の暗さを思いどおりに決めやすい",
          en: "Vignette: applied after tone mapping, the darkening is easy to control",
        },
        {
          ja: "ガンマ補正: `pow(col, vec3(1.0 / 2.2))` を 1 回だけ",
          en: "Gamma correction: `pow(col, vec3(1.0 / 2.2))`, exactly once",
        },
        {
          ja: "グレイン: 画面に出る値に、ほんの少しの乱数を足す",
          en: "Grain: add a tiny bit of randomness to the final screen values",
        },
      ],
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

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
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: 1. 光の量で計算した場面: 夜空のグラデーションと、のぼっていく光の粒
        //en: 1. the scene in amounts of light: a night gradient and rising motes of light
        vec3 scene(vec2 p) {
          vec3 col = mix(vec3(0.004, 0.002, 0.008), vec3(0.0, 0.004, 0.015), p.y * 0.5 + 0.5);
          for (int i = 0; i < 20; i++) {
            float fi = float(i);
            vec2 h = hash22(vec2(fi, 9.1));
            vec2 pos = vec2((h.x - 0.5) * 2.8, fract(h.y + time * (0.03 + 0.05 * h.x)) * 2.4 - 1.2);
            pos.x += 0.1 * sin(time + fi);
            vec3 c = palette(0.55 + 0.3 * h.y, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
            float d = length(p - pos);
            col += c * 0.0006 / (d * d);
          }
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col;
          col.r = scene(p * 1.01).r;
          col.g = scene(p).g;
          col.b = scene(p * 0.99).b;
          col *= 1.4;                                                          //ja: 2. 露出 //en: 2. exposure
          col = 1.0 - exp(-col);                                               //ja: 3. トーンマッピング //en: 3. tone mapping
          col *= pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.25); //ja: 4. ビネット //en: 4. vignette
          col = pow(col, vec3(1.0 / 2.2));                                     //ja: 5. ガンマ補正 //en: 5. gamma
          col += (hash21(p * 500.0 + fract(time) * 100.0) - 0.5) * 0.03;      //ja: 6. グレイン //en: 6. grain
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "露出の `1.4` を `3.0` にしても、トーンマッピングのおかげで白くとびません。仕上げの行を 1 行ずつ `//` で止めて、それぞれの役割を確かめましょう",
        en: "Raise the exposure `1.4` to `3.0`: thanks to tone mapping, nothing blows out. Comment out the finishing lines one at a time with `//` to see what each does",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "光の計算と仕上げの組み合わせを、自分の手で試してみましょう。仕上げの順番は、上のリストを見ながらでかまいません。",
        en: "Try combining light and finishing by hand. Feel free to keep the list above open for the order of the finishing steps.",
      },
    },
    {
      type: "exercise",
      title: { ja: "ネオンの三角形", en: "A neon triangle" },
      prompt: {
        ja: "細い線で描いただけの三角形を、光るネオンサインにしてください。線のまわりに光がにじみ、芯は白っぽく、色はシアン(水色)にします。最後にトーンマッピングとガンマ補正をかけ、背景は暗いまま保ちます。",
        en: "Turn this thin line-drawn triangle into a glowing neon sign. Light should bloom around the lines with a whitish core, in cyan. Finish with tone mapping and gamma correction, keeping the background dark.",
      },
      starter: `
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 a = vec2(0.0, 0.6);
          vec2 b = vec2(-0.6, -0.45);
          vec2 c = vec2(0.6, -0.45);
          float d = min(sdSegment(p, a, b), min(sdSegment(p, b, c), sdSegment(p, c, a)));

          vec3 col = vec3(0.02, 0.02, 0.05);
          //ja: ここを光らせる
          //en: make this glow
          col = mix(col, vec3(0.2, 0.9, 1.0), 1.0 - smoothstep(0.0, 0.01, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 a = vec2(0.0, 0.6);
          vec2 b = vec2(-0.6, -0.45);
          vec2 c = vec2(0.6, -0.45);
          float d = min(sdSegment(p, a, b), min(sdSegment(p, b, c), sdSegment(p, c, a)));

          vec3 col = vec3(0.002, 0.002, 0.006); //ja: ガンマ補正で持ち上がるので、うんと暗く //en: very dark, since gamma lifts it
          float pulse = 0.85 + 0.15 * sin(time * 3.0);
          //ja: 本物の光と同じ k / d²。ガンマ補正のあとで、ちょうどよくにじむ
          //en: k / d², like real light; after gamma it blooms just right
          col += vec3(0.2, 0.9, 1.0) * 0.0002 / (d * d) * pulse;
          col = 1.0 - exp(-col);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "塗りの `mix` をやめて、距離 `d` から作った明るさを `col +=` で足します",
          en: "Drop the `mix` fill and instead add a brightness made from the distance `d` with `col +=`",
        },
        {
          ja: "あとでガンマ補正をするので、光には本物と同じ `k / (d * d)` を使います。`col += vec3(0.2, 0.9, 1.0) * 0.0002 / (d * d);` から始めて、`0.0002` を調整しましょう",
          en: "Since we gamma-correct at the end, use `k / (d * d)` like real light. Start with `col += vec3(0.2, 0.9, 1.0) * 0.0002 / (d * d);` and tune `0.0002`",
        },
        {
          ja: "最後に `col = 1.0 - exp(-col);` と `col = pow(col, vec3(1.0 / 2.2));` をこの順で書きます。背景が灰色っぽく持ち上がったら、背景の色を `vec3(0.002, 0.002, 0.006)` のように小さくします",
          en: "Finish with `col = 1.0 - exp(-col);` then `col = pow(col, vec3(1.0 / 2.2));`, in that order. If the background turns grayish, shrink its color to something like `vec3(0.002, 0.002, 0.006)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "回る光の輪", en: "A spinning ring of lights" },
      prompt: {
        ja: "12 個の光を円の上に等間隔に並べ、ゆっくり回してください。光は 1 つずつ色相を変えて虹色にし、重なりで白くとばないようにトーンマッピングします。",
        en: "Place 12 lights evenly around a circle and rotate them slowly. Give each light its own hue to make a rainbow, and tone map so the overlaps don't blow out.",
      },
      starter: `
        #define TAU 6.28318531

        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = vec3(0.0);
          //ja: 光は今 1 つだけ。ループで 12 個にする
          //en: just one light for now; loop to make 12
          vec2 pos = vec2(0.6, 0.0);
          float d = length(p - pos);
          col += hsv2rgb(vec3(0.0, 0.8, 1.0)) * 0.001 / (d * d);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = vec3(0.0);
          for (int i = 0; i < 12; i++) {
            float k = float(i) / 12.0;          //ja: 0〜1 の何番目か //en: which one, as 0–1
            float a = k * TAU + time * 0.4;     //ja: 円の上の角度 //en: its angle on the circle
            vec2 pos = 0.6 * vec2(cos(a), sin(a));
            float d = length(p - pos);
            col += hsv2rgb(vec3(k, 0.8, 1.0)) * 0.001 / (d * d);
          }
          //ja: 輪の中心にもうっすら光を
          //en: a faint light in the middle too
          col += vec3(0.3, 0.2, 0.5) * exp(-length(p) * 3.0) * 0.03;
          col = 1.0 - exp(-col * 1.2);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`for (int i = 0; i < 12; i++)` の中で、`float(i) / 12.0` を作ると、0〜1 で「何番目の光か」がわかります",
          en: "Inside `for (int i = 0; i < 12; i++)`, `float(i) / 12.0` tells you which light this is, as a value from 0 to 1",
        },
        {
          ja: "角度は `k * TAU + time * 0.4`、場所は `0.6 * vec2(cos(a), sin(a))` です([極座標](/learn/polar-coordinates) の円周の点と同じ)。色は `hsv2rgb(vec3(k, 0.8, 1.0))` で虹色になります",
          en: "The angle is `k * TAU + time * 0.4` and the position `0.6 * vec2(cos(a), sin(a))` (the same circle point as in [Polar coordinates](/learn/polar-coordinates)). `hsv2rgb(vec3(k, 0.8, 1.0))` gives the rainbow",
        },
        {
          ja: "ループのあとで `col = 1.0 - exp(-col);` と `col = pow(col, vec3(1.0 / 2.2));` をかけます。小さな点だった光が、ガンマ補正で大きくにじむのを確かめましょう",
          en: "After the loop, apply `col = 1.0 - exp(-col);` and then `col = pow(col, vec3(1.0 / 2.2));`. Watch the tiny dots bloom into soft lights once gamma is applied",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "仕上げ一式", en: "The full finishing pass" },
      prompt: {
        ja: "宇宙に浮かぶ惑星と、その向こうの恒星の場面があります。今は計算した値をそのまま返しているので、恒星のまわりが白くとび、全体が暗く沈んでいます。露出・トーンマッピング・ビネット・ガンマ補正・グレインを正しい順番で足して、写真のような 1 枚に仕上げてください。",
        en: "Here is a scene of a planet in space with a star behind it. Right now it returns the raw values, so the area around the star blows out and everything else sinks into darkness. Add exposure, tone mapping, a vignette, gamma correction and grain in the right order to finish it like a photograph.",
      },
      starter: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 scene(vec2 p) {
          vec3 col = vec3(0.0005, 0.0007, 0.002);
          vec2 star = vec2(0.55, 0.35);
          float ds = length(p - star);
          col += vec3(1.0, 0.75, 0.45) * 0.002 / (ds * ds);
          //ja: 惑星: 恒星のほうが明るい球
          //en: the planet: a ball lit from the star's side
          vec2 c = vec2(-0.3, -0.25);
          float d = length(p - c) - 0.5;
          vec2 n = (p - c) / 0.5;
          float light = clamp(dot(n, normalize(star - c)), 0.0, 1.0);
          vec3 planet = vec3(0.25, 0.45, 0.9) * light + vec3(0.001, 0.0015, 0.003);
          col = mix(col, planet, 1.0 - smoothstep(-0.004, 0.004, d));
          //ja: 大気の光る縁
          //en: the glowing rim of the atmosphere
          col += vec3(0.3, 0.6, 1.0) * 0.5 * exp(-abs(d) * 60.0) * (0.2 + light);
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = scene(p);
          //ja: ここに仕上げを足す
          //en: add the finishing steps here
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 scene(vec2 p) {
          vec3 col = vec3(0.0005, 0.0007, 0.002);
          vec2 star = vec2(0.55, 0.35);
          float ds = length(p - star);
          col += vec3(1.0, 0.75, 0.45) * 0.002 / (ds * ds);
          vec2 c = vec2(-0.3, -0.25);
          float d = length(p - c) - 0.5;
          vec2 n = (p - c) / 0.5;
          float light = clamp(dot(n, normalize(star - c)), 0.0, 1.0);
          vec3 planet = vec3(0.25, 0.45, 0.9) * light + vec3(0.001, 0.0015, 0.003);
          col = mix(col, planet, 1.0 - smoothstep(-0.004, 0.004, d));
          col += vec3(0.3, 0.6, 1.0) * 0.5 * exp(-abs(d) * 60.0) * (0.2 + light);
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = scene(p);
          col *= 1.6;                                                          //ja: 露出 //en: exposure
          col = 1.0 - exp(-col);                                               //ja: トーンマッピング //en: tone mapping
          col *= pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.25); //ja: ビネット //en: vignette
          col = pow(col, vec3(1.0 / 2.2));                                     //ja: ガンマ補正 //en: gamma
          col += (hash21(p * 500.0 + fract(time) * 100.0) - 0.5) * 0.03;      //ja: グレイン //en: grain
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "仕上げの順番は「露出 → トーンマッピング → ビネット → ガンマ補正 → グレイン」でした",
          en: "The order is exposure → tone mapping → vignette → gamma correction → grain",
        },
        {
          ja: "暗いところが見えるようになり、恒星の光が広がるのは、ガンマ補正のおかげです。0.01 のような小さな値も、補正すると 0.12 くらいになります",
          en: "Gamma correction is what lifts the dark areas into view and lets the starlight spread: a small value like 0.01 becomes about 0.12",
        },
        {
          ja: "`col *= 1.6;`、`col = 1.0 - exp(-col);`、ビネットの 1 行、`col = pow(col, vec3(1.0 / 2.2));`、グレインの 1 行を、この順に `return` の前に書きます",
          en: "Before `return`, write `col *= 1.6;`, `col = 1.0 - exp(-col);`, the vignette line, `col = pow(col, vec3(1.0 / 2.2));` and the grain line, in that order",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "光のにじみは距離から作る。`k / d` はすそが長く、`exp(-d * k)` は大きさを決めやすい",
          en: "Glow comes from distance: `k / d` has a long tail; `exp(-d * k)` makes the size easy to control",
        },
        {
          ja: "形の縁を光らせるには `abs(d)` を使う。光は足し算で重なる",
          en: "Use `abs(d)` to make an outline glow. Lights combine by adding",
        },
        {
          ja: "1.0 を超えた値は、切り捨てずにトーンマッピング(`1.0 - exp(-x)`、`x / (1.0 + x)`)で収める。明るさは前に露出で決める",
          en: "Don't clip values above 1.0; tone map them (`1.0 - exp(-x)`, `x / (1.0 + x)`), setting brightness with exposure beforehand",
        },
        {
          ja: "画面は値の 2.2 乗の光を出すので、最後に `pow(col, vec3(1.0 / 2.2))` で 1 回だけガンマ補正する",
          en: "Screens emit light at the value to the power of 2.2, so gamma-correct once at the end with `pow(col, vec3(1.0 / 2.2))`",
        },
        {
          ja: "ビネットで視線を中央に、グレインで質感を、色収差(場面を 3 回呼ぶ)でレンズの雰囲気を足す",
          en: "A vignette draws the eye in, grain adds texture, and chromatic aberration (three scene calls) adds a lens feel",
        },
        {
          ja: "順番は 場面 → 露出 → トーンマッピング → ビネット → ガンマ補正 → グレイン",
          en: "The order: scene → exposure → tone mapping → vignette → gamma → grain",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、見る人の操作に反応する作品を作ります。カーソルの位置 `mouse` と、Gallery でホバーされたときに上がる `attention` を使って、触ると応えてくれる絵にします。",
        en: "Next time we make works that respond to the viewer. Using the cursor position `mouse` and `attention`, which rises when someone hovers a work in the Gallery, we'll build images that react when touched.",
      },
    },
  ],
};

export default lesson;
