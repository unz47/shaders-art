import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "domain-warping",
  title: { ja: "空間をゆがめる", en: "Domain warping" },
  summary: {
    ja: "ノイズで座標そのものをゆがめ、煙・大理石・流れる液体を作る",
    en: "Warp the coordinates themselves with noise to make smoke, marble and flowing liquid",
  },
  minutes: 55,
  goals: [
    {
      ja: "座標にノイズを足すと絵がどうゆがむか、ドメインワーピングの考え方がわかる",
      en: "Understand domain warping: what happens to a picture when you add noise to its coordinates",
    },
    {
      ja: "`fbm(p + fbm(p))` の形と、Inigo Quilez さんの 2 段のワープを書ける",
      en: "Write the `fbm(p + fbm(p))` pattern and Inigo Quilez's two-level warp",
    },
    {
      ja: "ワープの途中の値 `q`・`r` を使って、豊かな色を付けられる",
      en: "Use the in-between values `q` and `r` to color the result richly",
    },
    {
      ja: "時間をどこに足すかで、流れ方を調整できる",
      en: "Control how the pattern flows by choosing where to add time",
    },
    {
      ja: "大理石・煙・溶岩ランプ・墨流しのような模様を作れる",
      en: "Create patterns like marble, smoke, lava lamps and ink marbling",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "色ではなく、座標をゆがめる", en: "Warp the coordinates, not the colors" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの回では、ノイズは「色」を決めていました。明るさ、雲の濃さ、山の高さ。この回では、ノイズで「**どこを見るか**」を決めます。絵を描く式に `p` を渡す前に、`p` にノイズを足して少しずらすのです。ゆがんだガラス越しに景色を見たときや、揺れる水の底をのぞいたときのように、元の絵がぐにゃりと曲がります。",
        en: "In the lessons so far, noise decided colors: brightness, cloud density, mountain height. In this lesson, noise decides **where to look**. Before passing `p` to the formula that draws the picture, we nudge `p` by adding noise to it. The picture bends and warps, like a view through rippled glass or the bottom of a swimming pool.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "関数に入れる値の範囲を、数学では **定義域**(英語で domain)と呼びます。その入力のほうをゆがめるので、この技法を **ドメインワーピング** と呼びます。式の形はとても単純で、`picture(p)` の代わりに `picture(p + ずれ)` と書くだけです。",
        en: "In mathematics, the set of values a function accepts is called its **domain**. Because we bend the input side, the technique is called **domain warping**. The formula is very simple: instead of `picture(p)`, you write `picture(p + offset)`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ずれは x と y の 2 つが要るので、ノイズを 2 回呼んで `vec2` にします。2 回目は `+ vec2(5.2, 1.3)` でノイズの別の場所を読み、x のずれと y のずれが関係なく動くようにします。ノイズは 0〜1 なので、`- 0.5` で -0.5〜0.5 にそろえます。そうしないと、絵全体が右上へ 0.5 ずれてしまいます。",
        en: "The offset needs both an x and a y part, so we call noise twice and build a `vec2`. The second call adds `vec2(5.2, 1.3)` to read a different part of the noise, so the x and y offsets move independently. Noise runs from 0 to 1, so `- 0.5` centers it on -0.5 to 0.5; otherwise the whole picture would shift 0.5 up and to the right.",
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

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float amount = 0.3;                                                         //ja: ゆがみの強さ //en: warp strength
          vec2 offset = vec2(noise(p * 2.0), noise(p * 2.0 + vec2(5.2, 1.3))) - 0.5;  //ja: -0.5〜0.5 のずれ //en: an offset from -0.5 to 0.5
          vec2 q = p + amount * offset;                                               //ja: ずらした座標 //en: the warped coordinates

          float stripes = 0.5 + 0.5 * sin(q.x * 20.0);
          vec3 col = mix(vec3(0.1, 0.12, 0.3), vec3(1.0, 0.85, 0.55), stripes);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`amount` を `0.0` にすると、まっすぐなしまに戻ります。`1.0`、`3.0` と大きくすると? `p * 2.0`(2 か所)を `p * 6.0` にすると、細かくちりめんのようにゆがみます",
        en: "Set `amount` to `0.0` and the stripes go straight again. What about `1.0`, then `3.0`? Change both `p * 2.0` to `p * 6.0` for fine, crinkly ripples",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`amount` が `0.3` なら、どの点も上下左右に最大 0.15 しか動きません。それでも、しまの間隔 0.31(`sin(q.x * 20.0)` の 1 周ぶん)と比べると半分くらいあるので、しまがはっきり波打ちます。ゆがみの強さは、「元の絵の模様の大きさ」と比べて決まるのです。",
        en: "With `amount` at `0.3`, no point moves more than 0.15 in any direction. But that's about half the stripe spacing of 0.31 (one cycle of `sin(q.x * 20.0)`), so the stripes clearly ripple. How strong a warp looks depends on how big it is compared to the features of the original picture.",
      },
    },

    { type: "heading", text: { ja: "どんな絵でもゆがめられる", en: "Any picture can be warped" } },
    {
      type: "paragraph",
      text: {
        ja: "ゆがめる前の絵を `scene(p)` のような関数にまとめておくと、`scene(p + ずれ)` と書くだけで、どんな絵でもゆがめられます。下の例では、[くり返しとタイル](/learn/repetition) の市松模様をゆがめています。ずれのノイズを時間で上下逆向きに流すと、プールの底のタイルのように揺れ続けます。",
        en: "If you wrap the unwarped picture in a function like `scene(p)`, you can warp any picture just by writing `scene(p + offset)`. The example below warps the checkerboard from [Repetition and tiles](/learn/repetition). Scrolling the two offset noises in opposite directions over time keeps it rippling, like tiles at the bottom of a pool.",
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

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        //ja: ゆがめる前の絵(市松模様)
        //en: the picture before warping (a checkerboard)
        vec3 scene(vec2 p) {
          float c = mod(floor(p.x * 4.0) + floor(p.y * 4.0), 2.0);
          return mix(vec3(0.1, 0.45, 0.65), vec3(0.85, 0.95, 1.0), c);
        }

        vec4 render(vec2 uv, vec2 p) {
          float t = time * 0.5;
          vec2 offset = vec2(noise(p * 3.0 + vec2(0.0, t)), noise(p * 3.0 + vec2(5.2, 1.3) - vec2(0.0, t))) - 0.5;
          vec3 col = scene(p + 0.25 * offset);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.25` を `0.05` にすると、さざ波くらいの小さな揺れになります。`scene` の中身を、これまでの回で作った好きな絵に入れ替えてみましょう",
        en: "Change `0.25` to `0.05` for a gentle shimmer. Try replacing the inside of `scene` with any picture you made in earlier lessons",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ゆがめるのは座標だけなので、`scene` の中身は何も変えなくてかまいません。図形を描く式を 1 つずつ曲げる必要はなく、入り口の `p` を 1 か所ずらすだけで、絵の全部がまとめてゆがみます。",
        en: "Since only the coordinates are warped, you don't have to change anything inside `scene`. There's no need to bend each shape's formula one by one: shift `p` once at the entrance and the whole picture warps together.",
      },
    },

    { type: "heading", text: { ja: "大理石", en: "Marble" } },
    {
      type: "paragraph",
      text: {
        ja: "ドメインワーピングの古典的な使い道が大理石です。まず、ななめのしま `sin((p.x + p.y * 0.6) * 5.0)` を用意します。その `sin` の中に fBm を足すと、しまの位置が場所ごとに前後にずれて、うねる模様になります。しまの式の中に足すのは、座標をしまに直角な向きにずらすのと同じことなので、これも立派なドメインワーピングです。",
        en: "Marble is a classic use of domain warping. Start with diagonal stripes, `sin((p.x + p.y * 0.6) * 5.0)`. Add fBm inside that `sin`, and each stripe gets pushed back and forth from place to place into a meandering pattern. Adding inside the stripe formula is the same as shifting the coordinates across the stripes, so this is domain warping too.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "大理石の筋は細い線なので、しまをそのまま使わずに `1.0 - abs(v)` にします。`v` が 0 になるところ(しまの境目)で 1、そこから離れると急に小さくなる値です。さらに `pow(…, 6.0)` で 6 乗すると、1 に近いところだけが残り、細い筋になります。",
        en: "Marble veins are thin lines, so instead of using the stripes as they are, we take `1.0 - abs(v)`. That's 1 where `v` is 0 (the boundary between stripes) and falls off quickly away from it. Raising it to the 6th power with `pow(…, 6.0)` keeps only the values close to 1, which leaves thin veins.",
      },
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = fbm(p * 2.0);
          float warp = 6.0;                                       //ja: しまをずらす強さ //en: how far the stripes get pushed
          float v = sin((p.x + p.y * 0.6) * 5.0 + n * warp);
          float vein = pow(1.0 - abs(v), 6.0);                    //ja: しまの境目だけを細い筋に //en: thin veins at the stripe boundaries

          vec3 col = mix(vec3(0.96, 0.95, 0.92), vec3(0.82, 0.83, 0.86), n);  //ja: 地の白に、うっすらむらを付ける //en: faint mottling in the white base
          col = mix(col, vec3(0.3, 0.33, 0.42), vein * 0.8);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`warp` を `0.0` にすると、ただのななめのしまです。`2.0` や `12.0` にすると? `(p.x + p.y * 0.6) * 5.0` を `length(p) * 20.0` にすると、木目のような年輪になります",
        en: "With `warp` at `0.0` it's just diagonal stripes. What about `2.0` or `12.0`? Replace `(p.x + p.y * 0.6) * 5.0` with `length(p) * 20.0` for tree rings, like wood grain",
      },
    },

    { type: "heading", text: { ja: "fBm に fBm を入れる", en: "Feeding fBm into fBm" } },
    {
      type: "paragraph",
      text: {
        ja: "ゆがめる元の絵に、fBm そのものを使ってみましょう。ずれも fBm で作ります。式にすると `fbm(p + 4.0 * q)` で、`q` は fBm を 2 回呼んで作った `vec2` です。[重ねて自然に(fBm)](/learn/fbm) の雲のような模様が、引き伸ばされ、巻き込まれ、煙や渦を巻く液体のような模様に変わります。",
        en: "Now let's warp fBm itself, with an offset that's also made from fBm. As a formula it's `fbm(p + 4.0 * q)`, where `q` is a `vec2` from two fBm calls. The cloudy pattern from [Layering noise (fBm)](/learn/fbm) gets stretched and swirled into something like smoke or churning liquid.",
      },
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 s = p * 1.5;
          vec2 q = vec2(fbm(s), fbm(s + vec2(5.2, 1.3)));  //ja: ずれ(fBm 2 回) //en: the offset (two fBm calls)
          float f = fbm(s + 4.0 * q);                       //ja: ずらした場所の fBm //en: fBm at the shifted spot

          vec3 col = mix(vec3(0.05, 0.1, 0.25), vec3(1.0, 0.85, 0.6), smoothstep(0.2, 0.8, f));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`4.0 * q` の `4.0` を `0.0` にすると、ふつうの fBm(雲)に戻ります。`1.0`、`8.0` にすると、ゆがみの強さが変わります",
        en: "Change the `4.0` in `4.0 * q` to `0.0` and you're back to plain fBm clouds. Try `1.0` and `8.0` to change the warp strength",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ここでは `q` から 0.5 を引いていません。引かないと全体が少しずれますが、もともと模様がどこにあるかに意味は無いので、ゆがみ方には関係がありません。大事なのは、`q` が場所によってなめらかに変わることです。隣り合う点はほぼ同じだけずれるので模様はちぎれず、少し離れた点は違う向きにずれるので、模様が引き伸ばされたり、巻き込まれたりします。",
        en: "Here we don't subtract 0.5 from `q`. Skipping it shifts everything a little, but the pattern's exact position never meant anything, so it doesn't affect the warp. What matters is that `q` changes smoothly from place to place. Neighboring points move by almost the same amount, so the pattern never tears; points a little farther apart move in different directions, so the pattern gets stretched and curled.",
      },
    },

    { type: "heading", text: { ja: "2 段のワープ", en: "Two levels of warping" } },
    {
      type: "paragraph",
      text: {
        ja: "ゆがみを、さらにゆがめることもできます。シェーダーの世界で有名な Inigo Quilez さんが [記事](https://iquilezles.org/articles/warp/) で紹介した、2 段のワープです。1 段目の `q` でずらした場所で 2 段目のずれ `r` を作り、`r` でずらした場所で最後の fBm を読みます。",
        en: "You can also warp the warp. This is the two-level warp described by Inigo Quilez, well known in the shader world, in his [article](https://iquilezles.org/articles/warp/). The first-level offset `q` shifts where we compute the second-level offset `r`, and `r` shifts where we read the final fBm.",
      },
    },
    {
      type: "code",
      source: `
        vec2 q = vec2(fbm(s), fbm(s + vec2(5.2, 1.3)));
        vec2 r = vec2(fbm(s + 4.0 * q + vec2(1.7, 9.2)), fbm(s + 4.0 * q + vec2(8.3, 2.8)));
        float f = fbm(s + 4.0 * r);
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "`vec2(5.2, 1.3)` や `vec2(1.7, 9.2)`、`vec2(8.3, 2.8)` に特別な意味はありません。4 つの fBm がそれぞれ別の場所を読み、関係なく動くようにするための、ばらばらの数です。",
        en: "There's nothing special about `vec2(5.2, 1.3)`, `vec2(1.7, 9.2)` or `vec2(8.3, 2.8)`. They're just arbitrary numbers that make each of the four fBm calls read a different place, so they vary independently.",
      },
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 s = p * 1.5;
          vec2 q = vec2(fbm(s), fbm(s + vec2(5.2, 1.3)));                                         //ja: 1 段目 //en: level 1
          vec2 r = vec2(fbm(s + 4.0 * q + vec2(1.7, 9.2)), fbm(s + 4.0 * q + vec2(8.3, 2.8)));  //ja: 2 段目 //en: level 2
          float f = fbm(s + 4.0 * r);

          vec3 col = mix(vec3(0.05, 0.1, 0.25), vec3(1.0, 0.85, 0.6), smoothstep(0.2, 0.8, f));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`fbm(s + 4.0 * r)` を `fbm(s + 4.0 * q)` にすると、1 段のワープに戻ります。見比べると、2 段のほうが渦が細かく、何重にも巻いています",
        en: "Change `fbm(s + 4.0 * r)` to `fbm(s + 4.0 * q)` to go back to a single warp. Side by side, the two-level version has finer swirls wound over and over",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "2 段のワープは、1 つの点で `fbm` を 5 回呼びます。5 層の fBm なら `noise` 25 回、`hash21` 100 回です。このくらいが、作品の投稿チェック(1 コマ 8 ms)に気持ちよく収まる上限の目安です。3 段目を足すと重くなるわりに、見た目はあまり変わりません。ワープは 2 段までにしておきましょう。",
        en: "The two-level warp calls `fbm` five times per pixel. With five-layer fBm that's 25 `noise` calls and 100 `hash21` calls. That's about as far as you can comfortably go within the publishing check of 8 ms per frame. A third level costs a lot more without looking much different, so stop at two levels.",
      },
    },

    { type: "heading", text: { ja: "途中の値で色を付ける", en: "Coloring with the in-between values" } },
    {
      type: "paragraph",
      text: {
        ja: "2 段のワープでは、最後の `f` のほかに、途中で作った `q` と `r` も手元に残っています。これらは場所ごとに違う値を持ち、`f` とは違う形の模様になっています。それぞれを別の色の「混ぜる量」に使うと、1 つの値だけで色を付けるより、ずっと奥行きのある色になります。",
        en: "With the two-level warp, besides the final `f`, you still have the in-between values `q` and `r`. They vary from place to place too, in patterns shaped differently from `f`. Using each one as the mix amount for a different color gives far more depth than coloring by a single value.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`f` で、暗い紺から青緑への土台の色を決めます",
          en: "`f` sets the base color, from dark navy to teal",
        },
        {
          ja: "`r.x` が大きいところに、金色の筋を混ぜます",
          en: "Where `r.x` is large, blend in golden streaks",
        },
        {
          ja: "`length(q)` が大きいところ(1 段目で大きくずれたところ)を暗くして、影を付けます",
          en: "Darken where `length(q)` is large (where the first level shifted things a lot) to add shadows",
        },
        {
          ja: "`f` がとくに大きいところに、白い光を足します",
          en: "Add white highlights where `f` is especially high",
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

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 s = p * 1.5;
          vec2 q = vec2(fbm(s), fbm(s + vec2(5.2, 1.3)));
          vec2 r = vec2(fbm(s + 4.0 * q + vec2(1.7, 9.2)), fbm(s + 4.0 * q + vec2(8.3, 2.8)));
          float f = fbm(s + 4.0 * r);

          vec3 col = mix(vec3(0.02, 0.05, 0.15), vec3(0.1, 0.55, 0.6), smoothstep(0.2, 0.7, f));  //ja: 土台 //en: base
          col = mix(col, vec3(1.0, 0.75, 0.35), smoothstep(0.5, 0.9, r.x));                       //ja: 金色の筋 //en: golden streaks
          col = mix(col, vec3(0.05, 0.02, 0.1), smoothstep(0.6, 1.0, length(q)) * 0.7);          //ja: 影 //en: shadows
          col += vec3(1.0, 0.95, 0.9) * smoothstep(0.7, 0.9, f) * 0.6;                            //ja: 白い光 //en: white highlights
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "4 行の色の行を 1 行ずつ `//` で止めて、それぞれがどこに効いているかを確かめましょう。`r.x` を `r.y` にすると、金色の筋の場所が変わります",
        en: "Switch off the four color lines one at a time with `//` to see where each one shows up. Change `r.x` to `r.y` and the golden streaks move",
      },
    },

    { type: "heading", text: { ja: "ゆっくり流す", en: "Letting it flow" } },
    {
      type: "paragraph",
      text: {
        ja: "ワープに時間を入れると、模様が液体のように流れ出します。どこに `time` を足すかで、動き方が変わります。",
        en: "Put time into the warp and the pattern starts to flow like liquid. Where you add `time` changes how it moves.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "1 段目の `q` に足すと、ずれ全体がゆっくり変わり、大きな流れが生まれます",
          en: "Add it to the first level, `q`, and the whole offset slowly changes, creating large-scale currents",
        },
        {
          ja: "2 段目の `r` に足すと、細かな渦が巻き込みながら動きます",
          en: "Add it to the second level, `r`, and the small swirls churn as they move",
        },
        {
          ja: "最後の `fbm(s + 4.0 * r)` に足すと、模様そのものが横に流れていきます",
          en: "Add it to the final `fbm(s + 4.0 * r)`, and the pattern itself drifts across the screen",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "速さはごく小さな数にするのがこつです。ワープは座標を 4 倍に引き伸ばしてから使うので、元の動きも大きく増やされます。`time * 0.05` くらいで、ようやくゆったりした流れになります。",
        en: "The trick is to use very small speeds. The warp scales its offsets up by 4 before using them, which magnifies any movement too. Around `time * 0.05` is where it finally settles into a calm flow.",
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

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 s = p * 1.5;
          vec2 q = vec2(fbm(s + vec2(0.0, time * 0.05)), fbm(s + vec2(5.2, 1.3)));                 //ja: 大きな流れ //en: large currents
          vec2 r = vec2(fbm(s + 4.0 * q + vec2(1.7, 9.2) + time * 0.1), fbm(s + 4.0 * q + vec2(8.3, 2.8)));  //ja: 渦の動き //en: churning swirls
          float f = fbm(s + 4.0 * r);

          vec3 col = palette(f + r.x * 0.5, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
          col *= 0.3 + 0.9 * smoothstep(0.1, 0.8, f);
          col = mix(col, vec3(0.02, 0.02, 0.06), clamp(length(q) - 0.5, 0.0, 1.0));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.05` と `0.1` をそれぞれ 10 倍にすると、ぐつぐつ煮立つような速さになります。`palette` の最後の `vec3(0.0, 0.1, 0.2)` を `vec3(0.5, 0.2, 0.25)` にすると、色合いががらりと変わります",
        en: "Multiply `0.05` and `0.1` by 10 and it boils furiously. Change the last argument to `palette`, `vec3(0.0, 0.1, 0.2)`, to `vec3(0.5, 0.2, 0.25)` for a completely different color scheme",
      },
    },

    { type: "heading", text: { ja: "煙と溶岩ランプ", en: "Smoke and lava lamps" } },
    {
      type: "paragraph",
      text: {
        ja: "ワープした fBm に「形」を与えると、具体的なものが描けます。煙なら、模様を上へ流し(座標の y から時間を引く)、下で細く上で広がる柱の形をかけ、上へ行くほど薄くします。柱を左右に揺らすのに、1 段目のずれ `q.x` をもう一度使っているのがポイントです。ゆがみと同じ値で揺れるので、柱の曲がり方と煙の渦がそろって見えます。",
        en: "Give a warped fBm a shape and it becomes a specific thing. For smoke, flow the pattern upward (subtract time from y), multiply by a column that's narrow at the bottom and spreads toward the top, and fade it out as it rises. The key detail is reusing the first-level offset `q.x` to sway the column from side to side. Since the sway comes from the same value as the warp, the bending of the column matches the swirls in the smoke.",
      },
    },
    {
      type: "playground",
      source: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = mix(vec3(0.03, 0.03, 0.05), vec3(0.1, 0.09, 0.14), uv.y);

          vec2 s = p * vec2(1.2, 0.9) - vec2(0.0, time * 0.3);     //ja: 模様を上へ流す //en: flow the pattern upward
          vec2 q = vec2(fbm(s), fbm(s + vec2(5.2, 1.3)));
          float d = fbm(s + 3.0 * q);

          float y = p.y + 1.0;                                     //ja: 画面の下からの高さ //en: height above the bottom
          float sway = (q.x - 0.5) * 1.5 * y;                      //ja: 上ほど大きく揺れる //en: sways more higher up
          float column = 1.0 - smoothstep(0.0, 0.25 + 0.7 * y, abs(p.x + 0.3 + sway));
          float density = smoothstep(0.25, 0.65, d) * column * (1.0 - smoothstep(1.3, 2.0, y));

          vec3 smoke = mix(vec3(0.4, 0.43, 0.56), vec3(0.95, 0.95, 1.0), smoothstep(0.4, 0.8, d));
          col = mix(col, smoke, density);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`1.5 * y` の `1.5` を `0.0` にすると、まっすぐ立ちのぼる煙に、`3.0` にすると風にあおられた煙になります。`smoothstep(0.25, 0.65, d)` の `0.25` を `0.1` にすると、煙が濃くなります",
        en: "Change the `1.5` in `1.5 * y` to `0.0` for smoke rising straight up, or `3.0` for smoke tossed by the wind. Change the `0.25` in `smoothstep(0.25, 0.65, d)` to `0.1` for thicker smoke",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ワープは、fBm だけでなく、くっきりした図形にも使えます。溶岩ランプの蝋(ろう)のかたまりは、実はただの円です。[円と距離](/learn/circles-and-distance) の円を 5 つ、`fract` で下から上へくり返し昇らせ、底にたまった蝋は水平な線 `q.y + 0.72` で表します。距離を測る前に、座標をノイズで少しずらすだけで、まん丸の円が、とろりと溶けて形を変える蝋のかたまりに見えてきます。",
        en: "Warping isn't just for fBm; it works on crisp shapes too. The wax blobs in a lava lamp are really just circles. Five circles from [Circles and distance](/learn/circles-and-distance) rise from bottom to top over and over using `fract`, and the wax pooled at the bottom is the horizontal line `q.y + 0.72`. Just nudging the coordinates with noise before measuring distances turns perfect circles into molten, shape-shifting blobs of wax.",
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

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = mix(vec3(0.1, 0.02, 0.15), vec3(0.02, 0.0, 0.05), uv.y);

          //ja: 座標をノイズでゆがめる
          //en: warp the coordinates with noise
          float t = time * 0.3;
          vec2 warp = vec2(noise(p * 3.0 + vec2(0.0, t)), noise(p * 3.0 + vec2(5.2, 1.3) - vec2(0.0, t))) - 0.5;
          vec2 q = p + warp * 0.25;

          float d = q.y + 0.72;                                   //ja: 底にたまった蝋 //en: wax pooled at the bottom
          for (int i = 0; i < 5; i++) {
            float fi = float(i);
            float y = fract(time * (0.04 + 0.015 * fi) + fi * 0.23) * 2.4 - 1.2;  //ja: 下から上へくり返し昇る //en: rises from bottom to top, again and again
            vec2 c = vec2(sin(fi * 2.3 + time * 0.2) * 0.18, y);
            d = min(d, length(q - c) - (0.1 + 0.03 * fi));
          }

          float px = 2.0 / resolution.y;
          float blob = 1.0 - smoothstep(-px, px, d);
          vec3 wax = mix(vec3(1.0, 0.25, 0.4), vec3(1.0, 0.7, 0.2), uv.y);
          vec3 liquid = mix(vec3(0.4, 0.06, 0.45), vec3(0.12, 0.02, 0.22), uv.y);
          vec3 inner = mix(liquid, wax, blob);
          inner += wax * (1.0 - smoothstep(0.0, 0.15, d)) * 0.35 * (1.0 - blob);  //ja: 蝋のまわりのにじんだ光 //en: soft glow around the wax

          float lamp = sdBox(p, vec2(0.38, 0.78)) - 0.12;         //ja: ランプのガラス //en: the lamp's glass
          float inside = 1.0 - smoothstep(-px, px, lamp);
          col = mix(col, inner, inside);
          col += vec3(0.6, 0.15, 0.4) * (1.0 - smoothstep(0.0, 0.4, lamp)) * (1.0 - inside) * 0.4;
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`warp * 0.25` を `warp * 0.0` にすると、まん丸の円に戻ります。`0.5` にすると、もっとどろどろに溶けます",
        en: "Change `warp * 0.25` to `warp * 0.0` and you're back to perfect circles. Try `0.5` for an even more molten look",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "どの課題も、絵そのものは変えずに、`p` をずらすだけで仕上がります。ずれの大きさ、細かさ、流れる向きを考えながら取り組んでみましょう。",
        en: "Each exercise is finished by shifting `p`, without changing the picture itself. Think about how large, how fine and which way the offset should flow.",
      },
    },
    {
      type: "exercise",
      title: { ja: "かげろう", en: "Heat haze" },
      prompt: {
        ja: "暑い日の道路の上で、景色がゆらゆら揺れて見える「かげろう」を作ります。starter の `scene` は、砂漠の夕暮れの道です。`scene` に渡す座標をノイズでずらして、細かい揺れが下から上へ立ちのぼるようにしてください。揺れは地平線のあたりでいちばん強く、そこから離れるほど弱くすると本物らしくなります。",
        en: "On a hot day, the view above a road seems to shimmer: that's heat haze. The `scene` in the starter is a desert road at dusk. Shift the coordinates passed to `scene` with noise, so that fine ripples rise from the bottom up. Make the shimmer strongest around the horizon and weaker farther from it for a realistic effect.",
      },
      starter: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        //ja: 砂漠の夕暮れの道
        //en: a desert road at dusk
        vec3 scene(vec2 p) {
          vec3 col = mix(vec3(1.0, 0.55, 0.3), vec3(0.35, 0.25, 0.55), smoothstep(-0.1, 0.9, p.y));
          float sun = 1.0 - smoothstep(0.24, 0.25, length(p - vec2(0.0, 0.05)));
          col = mix(col, vec3(1.0, 0.88, 0.55), sun);
          if (p.y < -0.1) {
            float depth = -0.1 - p.y;                           //ja: 地平線からの深さ //en: depth below the horizon
            col = mix(vec3(0.7, 0.4, 0.25), vec3(0.45, 0.22, 0.15), smoothstep(0.0, 0.8, depth));
            float road = step(abs(p.x), depth * 0.9);
            col = mix(col, vec3(0.18, 0.16, 0.18), road);
            float dash = step(abs(p.x), depth * 0.04) * step(0.5, fract(1.0 / (depth + 0.05)));
            col = mix(col, vec3(0.95, 0.85, 0.5), dash);
          }
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 offset = vec2(0.0);                              //ja: ここを書き換える //en: change this
          vec3 col = scene(p + offset);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        vec3 scene(vec2 p) {
          vec3 col = mix(vec3(1.0, 0.55, 0.3), vec3(0.35, 0.25, 0.55), smoothstep(-0.1, 0.9, p.y));
          float sun = 1.0 - smoothstep(0.24, 0.25, length(p - vec2(0.0, 0.05)));
          col = mix(col, vec3(1.0, 0.88, 0.55), sun);
          if (p.y < -0.1) {
            float depth = -0.1 - p.y;
            col = mix(vec3(0.7, 0.4, 0.25), vec3(0.45, 0.22, 0.15), smoothstep(0.0, 0.8, depth));
            float road = step(abs(p.x), depth * 0.9);
            col = mix(col, vec3(0.18, 0.16, 0.18), road);
            float dash = step(abs(p.x), depth * 0.04) * step(0.5, fract(1.0 / (depth + 0.05)));
            col = mix(col, vec3(0.95, 0.85, 0.5), dash);
          }
          return col;
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 縦に細かいノイズを、上へ速く流す
          //en: vertically fine noise, flowing quickly upward
          vec2 g = p * vec2(6.0, 14.0) - vec2(0.0, time * 3.0);
          vec2 wobble = vec2(noise(g), noise(g + vec2(5.2, 1.3))) - 0.5;
          //ja: 地平線(y = -0.1)のあたりでいちばん強く
          //en: strongest around the horizon (y = -0.1)
          float strength = 1.0 - smoothstep(0.0, 0.4, abs(p.y + 0.1));
          vec2 offset = wobble * 0.035 * strength;
          vec3 col = scene(p + offset);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "まずは、このレッスンの最初と同じ `vec2(noise(p * 4.0), noise(p * 4.0 + vec2(5.2, 1.3))) - 0.5` に小さな数(`0.03` くらい)をかけて、`offset` にしてみましょう",
          en: "Start with the same offset as at the beginning of this lesson, `vec2(noise(p * 4.0), noise(p * 4.0 + vec2(5.2, 1.3))) - 0.5`, multiplied by something small (around `0.03`)",
        },
        {
          ja: "立ちのぼる揺れにするには、ノイズに入れる座標の y から時間を引きます。`p * vec2(6.0, 14.0)` のように縦を細かくすると、かげろうらしい細かい揺れになります",
          en: "To make the shimmer rise, subtract time from the y of the noise input. Making it finer vertically, as in `p * vec2(6.0, 14.0)`, gives the fine ripple of heat haze",
        },
        {
          ja: "地平線は `p.y = -0.1` です。`1.0 - smoothstep(0.0, 0.4, abs(p.y + 0.1))` をずれにかけると、地平線の近くだけが強く揺れます",
          en: "The horizon is at `p.y = -0.1`. Multiply the offset by `1.0 - smoothstep(0.0, 0.4, abs(p.y + 0.1))` so it's strongest near the horizon",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "墨流し", en: "Suminagashi" },
      prompt: {
        ja: "墨流し(すみながし)は、水面に墨を落として輪を広げ、そっと息を吹きかけて模様をゆらし、紙に写し取る日本の伝統的な技法です。starter には、墨を落とした点を中心にした同心円があります。距離を測る前の座標を fBm でゆがめて、墨流しのような模様にしてください。余裕があれば、輪ごとに藍色と朱色を交互にしてみましょう。",
        en: "Suminagashi is a traditional Japanese technique: drops of ink spread into rings on water, a gentle breath sets them swirling, and the pattern is transferred to paper. The starter has concentric rings around the spot where the ink was dropped. Warp the coordinates with fBm before measuring the distance to get a suminagashi pattern. If you have time, alternate indigo and vermilion from ring to ring.",
      },
      starter: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = p;                                  //ja: ここを書き換える //en: change this
          float d = length(q - vec2(0.3, 0.1));        //ja: 墨を落とした点からの距離 //en: distance from where the ink was dropped
          float rings = sin(d * 30.0);

          vec3 paper = vec3(0.96, 0.93, 0.86);
          vec3 indigo = vec3(0.1, 0.15, 0.35);
          float ink = smoothstep(-0.1, 0.25, rings);
          vec3 col = mix(paper, indigo, ink * 0.85);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: fBm 2 回でずれを作り、ごくゆっくり流す
          //en: build the offset from two fBm calls, drifting very slowly
          vec2 warp = vec2(fbm(p * 1.2 + vec2(0.0, time * 0.03)), fbm(p * 1.2 + vec2(5.2, 1.3))) - 0.5;
          vec2 q = p + warp * 1.0;
          float d = length(q - vec2(0.3, 0.1));
          float rings = sin(d * 30.0);

          //ja: 何番目の輪かで、藍と朱を交互に
          //en: alternate indigo and vermilion by ring number
          float ring = floor(d * 30.0 / TAU);
          vec3 indigo = vec3(0.1, 0.15, 0.35);
          vec3 vermilion = vec3(0.75, 0.25, 0.15);
          vec3 inkColor = mix(indigo, vermilion, mod(ring, 2.0));

          vec3 paper = vec3(0.96, 0.93, 0.86);
          float ink = smoothstep(-0.1, 0.25, rings);
          vec3 col = mix(paper, inkColor, ink * 0.85);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "大理石と同じく、`q = p + ずれ` の形にします。ずれは `vec2(fbm(p * 1.2), fbm(p * 1.2 + vec2(5.2, 1.3))) - 0.5` で作れます",
          en: "As with marble, use the form `q = p + offset`. You can make the offset with `vec2(fbm(p * 1.2), fbm(p * 1.2 + vec2(5.2, 1.3))) - 0.5`",
        },
        {
          ja: "ずれにかける数を `0.3`、`1.0`、`2.0` と変えて、輪がちょうどよく崩れる強さを探しましょう",
          en: "Try multiplying the offset by `0.3`, `1.0` and `2.0` to find the strength where the rings break up just right",
        },
        {
          ja: "`sin(d * 30.0)` は、`d` が `TAU / 30.0` 増えるごとに 1 周します。`floor(d * 30.0 / TAU)` が輪の番号になるので、`mod(輪の番号, 2.0)` で 2 色を交互にできます",
          en: "`sin(d * 30.0)` completes one cycle every time `d` grows by `TAU / 30.0`. So `floor(d * 30.0 / TAU)` is the ring number, and `mod(ringNumber, 2.0)` alternates between two colors",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "星雲", en: "Nebula" },
      prompt: {
        ja: "星空に、ガスの雲(星雲)を浮かべます。starter のガスは、ふつうの fBm を灰色で塗っただけです。2 段のワープに書き換え、`q` や `r` を使って紫・青緑・赤みのような色を混ぜ、ごくゆっくり流れるようにしてください。ガスの薄いところからは、後ろの星が透けて見えるようにします。",
        en: "Let's float a cloud of gas, a nebula, in a starry sky. In the starter the gas is just plain fBm painted gray. Rewrite it as a two-level warp, mix colors like violet, teal and a reddish tint using `q` and `r`, and make it drift very slowly. Let the stars behind show through where the gas is thin.",
      },
      starter: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
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

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = vec3(0.0, 0.0, 0.02);

          //ja: 星([乱数をつくる] の星空と同じ考え方)
          //en: stars (the same idea as the starry sky in Making randomness)
          vec2 g = p * 30.0;
          vec2 id = floor(g);
          vec2 off = hash22(id) - 0.5;
          float star = 1.0 - smoothstep(0.0, 0.1, length(fract(g) - 0.5 - off * 0.7));
          col += vec3(0.9) * star * step(0.75, hash21(id + 0.5));

          //ja: ガス。ここを書き換える
          //en: the gas; change this
          vec2 s = p * 1.2;
          float f = fbm(s);
          float gas = smoothstep(0.25, 0.85, f);
          vec3 neb = vec3(0.6);
          col = col * (1.0 - gas) + neb * gas;
          return vec4(col, 1.0);
        }
      `,
      solution: `
        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
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

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = vec3(0.0, 0.0, 0.02);

          vec2 g = p * 30.0;
          vec2 id = floor(g);
          vec2 off = hash22(id) - 0.5;
          float star = 1.0 - smoothstep(0.0, 0.1, length(fract(g) - 0.5 - off * 0.7));
          col += vec3(0.9) * star * step(0.75, hash21(id + 0.5));

          //ja: 2 段のワープ。q と r にごく小さく時間を足す
          //en: two-level warp, with a tiny bit of time in q and r
          vec2 s = p * 1.2;
          vec2 q = vec2(fbm(s + vec2(0.0, time * 0.02)), fbm(s + vec2(5.2, 1.3)));
          vec2 r = vec2(fbm(s + 4.0 * q + vec2(1.7, 9.2) + time * 0.03), fbm(s + 4.0 * q + vec2(8.3, 2.8)));
          float f = fbm(s + 4.0 * r);

          //ja: r.y で紫と青緑を、length(q) で赤みを混ぜる
          //en: r.y blends violet and teal; length(q) adds a reddish tint
          float gas = smoothstep(0.25, 0.85, f);
          vec3 neb = mix(vec3(0.55, 0.15, 0.75), vec3(0.15, 0.7, 0.9), smoothstep(0.3, 0.8, r.y));
          neb = mix(neb, vec3(1.0, 0.55, 0.45), smoothstep(0.7, 1.1, length(q)));
          col = col * (1.0 - gas) + neb * gas * 1.3;  //ja: 濃いところほど星を隠す //en: thicker gas hides more stars
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "「2 段のワープ」の 3 行(`q`・`r`・`f`)を、そのまま `float f = fbm(s);` の代わりに入れてみましょう",
          en: "Drop the three lines of the two-level warp (`q`, `r`, `f`) in place of `float f = fbm(s);`",
        },
        {
          ja: "色は `neb = mix(紫, 青緑, smoothstep(0.3, 0.8, r.y))` のように、途中の値で混ぜます。さらに `length(q)` で 3 つ目の色を重ねると深みが出ます",
          en: "Mix colors by an in-between value, as in `neb = mix(violet, teal, smoothstep(0.3, 0.8, r.y))`. Layering a third color by `length(q)` adds depth",
        },
        {
          ja: "流れは `fbm(s + vec2(0.0, time * 0.02))` のように、`q` と `r` の中にごく小さく時間を足します。`col * (1.0 - gas)` の部分が、濃いガスの後ろの星を隠しています",
          en: "For the flow, add a tiny amount of time inside `q` and `r`, as in `fbm(s + vec2(0.0, time * 0.02))`. The `col * (1.0 - gas)` part is what hides stars behind thick gas",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "ドメインワーピングは、絵の式に渡す前の座標をノイズでずらす技法。`picture(p)` を `picture(p + ずれ)` にするだけ",
          en: "Domain warping shifts the coordinates with noise before they reach the picture's formula: `picture(p)` becomes `picture(p + offset)`",
        },
        {
          ja: "ずれは x と y の 2 つ。ノイズを 2 回、別の場所で読んで `vec2` にする",
          en: "The offset needs an x and a y, so read noise twice, at different places, to build a `vec2`",
        },
        {
          ja: "`fbm(p + 4.0 * q)` で煙のような渦、さらに 2 段にすると細かく巻いた模様になる。ワープは 2 段まで(`fbm` 5 回)",
          en: "`fbm(p + 4.0 * q)` gives smoky swirls, and a second level winds them finer. Stop at two levels (five `fbm` calls)",
        },
        {
          ja: "途中の値 `q`・`r` を色を混ぜる量に使うと、深みのある色になる",
          en: "Using the in-between values `q` and `r` as color mix amounts gives rich, deep color",
        },
        {
          ja: "時間は `q` や `r` にごく小さく足す。くっきりした図形をゆがめれば、溶けたような形にもなる",
          en: "Add time to `q` or `r` in very small amounts. Warping crisp shapes makes them look molten",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、[乱数をつくる](/learn/randomness) の「マスごとに 1 つの点」に戻り、点と点の距離から、細胞やひび割れ、ステンドグラスのような **ボロノイ模様** を作ります。",
        en: "Next time we return to the one-point-per-cell idea from [Making randomness](/learn/randomness) and use the distances between points to build **Voronoi patterns**: cells, cracks and stained glass.",
      },
    },
  ],
};

export default lesson;
