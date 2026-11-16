import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "mouse-and-attention",
  title: { ja: "触って動く", en: "Touch and response" },
  summary: {
    ja: "mouse と attention で、見る人の操作に反応する作品を作る",
    en: "Make works that respond to the viewer with mouse and attention",
  },
  minutes: 45,
  goals: [
    {
      ja: "`mouse` が `p` と同じ座標のカーソル位置だとわかり、カーソルからの距離で絵を変えられる",
      en: "Know that `mouse` is the cursor position in the same coordinates as `p`, and change the image by distance from the cursor",
    },
    {
      ja: "カーソルのまわりに波紋を立てたり、空間を引き寄せたり押しのけたりできる",
      en: "Send ripples out from the cursor, and pull or push space around it",
    },
    {
      ja: "`attention` で、Gallery でホバーされたときだけ演出を強められ、絵が飛ばない使い方がわかる",
      en: "Use `attention` to heighten a work only while it is hovered in the Gallery, without making the image jump",
    },
    {
      ja: "静止サムネ(`time` 2・`attention` 0・`mouse` (0, 0))でも、きれいに見える作品に仕上げられる",
      en: "Finish works that also look good in the still thumbnail (`time` 2, `attention` 0, `mouse` (0, 0))",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "mouse はカーソルの位置", en: "mouse is the cursor position" } },
    {
      type: "paragraph",
      text: {
        ja: "このサイトで使える 4 つの uniform のうち、ここまで `time` と `resolution` を使ってきました。この回では残りの 2 つ、見る人の操作を伝える `mouse` と `attention` を使います。まずは `mouse` です。",
        en: "Of the four uniforms this site provides, we have used `time` and `resolution` so far. This lesson covers the other two, which carry what the viewer is doing: `mouse` and `attention`. First, `mouse`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`mouse` は、プレビューの上のカーソルの位置を表す `vec2` です。うれしいことに、**`p` と同じ座標** で渡されます。画面の中心が `(0, 0)`、上の端で y が 1、下の端で -1、x は縦横比をかけた範囲(横長の画面なら右端で 1.33〜1.78 くらい)です。だから、`p - mouse` と書くだけで「カーソルから見た位置」になります。カーソルをまだ乗せていないときは `(0, 0)`、つまり画面の中心です。",
        en: "`mouse` is a `vec2` holding the cursor's position over the preview. Conveniently, it comes in **the same coordinates as `p`**: `(0, 0)` at the center, y = 1 at the top edge and -1 at the bottom, and x scaled by the aspect ratio (around 1.33–1.78 at the right edge of a wide screen). So simply writing `p - mouse` gives you \"the position as seen from the cursor\". Before the cursor has been over the preview, `mouse` is `(0, 0)`: the center of the screen.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.06, 0.07, 0.12);
          //ja: 原点を通るうすい軸
          //en: faint axes through the origin
          col += vec3(0.08) * (1.0 - smoothstep(0.0, px, min(abs(p.x), abs(p.y))));
          //ja: カーソルを通る十字
          //en: a crosshair through the cursor
          vec2 m = abs(p - mouse);
          col = mix(col, vec3(0.3, 0.6, 1.0), 0.6 * (1.0 - smoothstep(0.0, px * 1.5, min(m.x, m.y))));
          //ja: カーソルの位置に丸
          //en: a dot at the cursor
          float d = length(p - mouse);
          col = mix(col, vec3(1.0, 0.55, 0.3), 1.0 - smoothstep(0.06 - px, 0.06 + px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "プレビューの上でカーソルを動かしてみましょう。`p - mouse` を `p + mouse` にすると、丸はどこへ行くでしょう?",
        en: "Move the cursor over the preview. Where does the dot go if you change `p - mouse` to `p + mouse`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "丸を描く式は、[円と距離](/learn/circles-and-distance) で中心をずらしたときの `length(p - center)` と同じです。中心の代わりに `mouse` を入れただけで、図形がカーソルについてきます。[座標を動かす](/learn/transforms) で見たとおり、`p - mouse` は「座標を `mouse` だけずらす」ことなので、ずらした座標で描いたものは何でも、カーソルについてきます。",
        en: "The dot's formula is the same `length(p - center)` we used to move circles in [Circles and distance](/learn/circles-and-distance); swapping `mouse` in for the center makes the shape follow the cursor. As we saw in [Moving space](/learn/transforms), `p - mouse` shifts the coordinates by `mouse`, so anything drawn in the shifted coordinates follows the cursor.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "スマートフォンやタブレットなど、タッチで操作する端末にはカーソルがありません。指でなぞっても `mouse` が動かないことが多いので、`mouse` が動かなくても作品として成り立つようにしておきましょう。この回の最後でくわしく考えます。",
        en: "Touch devices like phones and tablets have no cursor. Dragging a finger often won't move `mouse` at all, so make sure your work still stands on its own without it. We look at this closely at the end of the lesson.",
      },
    },

    { type: "heading", text: { ja: "カーソルからの距離で変える", en: "Changing things by distance from the cursor" } },
    {
      type: "paragraph",
      text: {
        ja: "カーソルからの距離 `length(p - mouse)` を使うと、「カーソルに近いところだけ」何かを変えられます。まずは懐中電灯です。暗闇に隠れた模様を、カーソルのまわりだけ照らします。",
        en: "With the distance from the cursor, `length(p - mouse)`, you can change things only near the cursor. Let's start with a flashlight: a pattern hidden in darkness, lit only around the cursor.",
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
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 隠れている模様: マスごとに色の違う丸
          //en: the hidden pattern: a dot of a different color in each cell
          vec2 g = p * 5.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          float dotMask = 1.0 - smoothstep(0.28, 0.3, length(q));
          vec3 pattern = mix(vec3(0.05, 0.05, 0.08), hsv2rgb(vec3(hash21(id), 0.6, 1.0)), dotMask);

          //ja: カーソルのまわりだけ照らす
          //en: light only around the cursor
          float d = length(p - mouse);
          float light = exp(-d * d * 6.0);
          vec3 col = pattern * (0.08 + 1.2 * light);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`6.0` を `20.0` にすると、照らす範囲が小さくなります。`0.08` を `0.0` にすると、照らされていないところは真っ暗です",
        en: "Change `6.0` to `20.0` for a smaller beam. Set `0.08` to `0.0` and everything outside the beam goes pitch black",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`exp(-d * d * 6.0)` は、釣り鐘のような形の曲線です。カーソルの上で 1、0.3 離れると約 0.58、0.6 離れると約 0.12 と、なめらかに 0 へ近づきます。[光と仕上げ](/learn/light-and-glow) の `exp(-d * k)` と違って `d` を 2 乗しているので、真ん中が平らで、ふちがやわらかい光の輪になります。",
        en: "`exp(-d * d * 6.0)` is a bell-shaped curve: 1 at the cursor, about 0.58 at 0.3 away and about 0.12 at 0.6 away, easing smoothly toward 0. Unlike `exp(-d * k)` from [Light and finishing](/learn/light-and-glow), it squares `d`, which gives a pool of light that is flat in the middle with soft edges.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "距離で変えられるのは明るさだけではありません。下では、カーソルに近いマスほど丸を大きくしています。ここで大事なのは、ピクセルの場所 `p` ではなく、**マスの中心** からカーソルまでの距離を測っていることです。マスの中のどのピクセルも同じ距離を使うので、丸はゆがまずに、丸のまま大きくなります。",
        en: "Brightness isn't the only thing distance can drive. Below, dots grow larger in cells closer to the cursor. The important part is that we measure the distance from **the cell's center** to the cursor, not from the pixel position `p`. Every pixel in a cell uses the same distance, so the dot grows while staying perfectly round.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 6.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          vec2 center = (id + 0.5) / 6.0; //ja: このマスの中心(p の座標) //en: this cell's center, in p coordinates

          float near = exp(-length(center - mouse) * 3.0); //ja: カーソルに近いほど 1 //en: 1 near the cursor
          float r = 0.08 + 0.32 * near;
          float d = length(q) - r;
          vec3 c = mix(vec3(0.25, 0.3, 0.6), vec3(1.0, 0.5, 0.35), near);
          vec3 col = mix(vec3(0.04, 0.04, 0.07), c, 1.0 - smoothstep(-0.03, 0.03, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`length(center - mouse)` の `center` を `p` にすると、丸がカーソルのほうへ卵形にゆがみます。`3.0` を `1.0` にすると、遠くのマスまで大きくなります",
        en: "Replace `center` in `length(center - mouse)` with `p` and the dots warp into eggs leaning toward the cursor. Change `3.0` to `1.0` so distant cells grow too",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`(id + 0.5) / 6.0` は、マスの番号を `p` の座標に戻しています。`g = p * 6.0` で 6 倍に拡大したので、6.0 で割ると戻ります。`+ 0.5` は、マスの左下の角ではなく真ん中を指すためです。",
        en: "`(id + 0.5) / 6.0` turns the cell index back into `p` coordinates. We scaled up by 6 with `g = p * 6.0`, so dividing by 6.0 undoes it. The `+ 0.5` points at the middle of the cell rather than its lower-left corner.",
      },
    },

    { type: "heading", text: { ja: "波紋", en: "Ripples" } },
    {
      type: "paragraph",
      text: {
        ja: "水面にカーソルを置くと、そこから波紋が広がる絵を作ります。[時間で動かす](/learn/time-and-motion) の進む波 `sin(d * k - time * s)` を、カーソルからの距離 `d` で使えば、カーソルを中心に外へ広がる輪になります。遠くほど波を弱めるため、`exp(-d * 2.0)` をかけます。",
        en: "Let's make ripples spread across water from the cursor. The traveling wave `sin(d * k - time * s)` from [Time and motion](/learn/time-and-motion), fed with the distance `d` from the cursor, becomes rings moving outward around it. Multiplying by `exp(-d * 2.0)` weakens the waves with distance.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "波そのものを描くだけでなく、波で **底の模様の見える場所をずらす** と、ぐっと水らしくなります。本物の水面でも、波で光が曲がって、プールの底のタイルがゆらいで見えます(屈折)。ここでは、カーソルから外向きの方向に、波の高さに比例して座標をずらしています。",
        en: "Rather than only drawing the waves, use them to **shift where the floor pattern shows through**, and it looks much more like water. On a real pool, waves bend the light so the tiles on the bottom wobble (refraction). Here we shift the coordinates outward from the cursor, in proportion to the wave height.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 dir = p - mouse;
          float d = length(dir);
          float wave = sin(d * 25.0 - time * 5.0) * exp(-d * 2.0);

          //ja: 波で、底のタイルが見える場所をずらす
          //en: the wave shifts where the floor tiles show through
          vec2 q = p + dir / max(d, 0.001) * wave * 0.03;
          vec2 tile = abs(fract(q * 4.0) - 0.5);
          float line = smoothstep(0.44, 0.48, max(tile.x, tile.y));
          vec3 col = mix(vec3(0.1, 0.55, 0.75), vec3(0.75, 0.95, 1.0), line * 0.6);

          col += vec3(0.8, 0.95, 1.0) * pow(max(wave, 0.0), 3.0) * 0.5; //ja: 波の山のきらめき //en: glints on the crests
          col *= 0.75 + 0.25 * uv.y;
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`wave * 0.03` の `0.03` を `0.0` にすると、ゆらぎが消えます。`time * 5.0` を `time * -5.0` にすると、波が外からカーソルへ集まってきます",
        en: "Set the `0.03` in `wave * 0.03` to `0.0` and the wobble disappears. Change `time * 5.0` to `time * -5.0` and the waves flow inward to the cursor",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`dir / max(d, 0.001)` は、カーソルから外向きの長さ 1 の向きです(`normalize(dir)` と同じですが、カーソルの真上で 0 で割らないように `max` を入れています)。`pow(max(wave, 0.0), 3.0)` は、波の高いところだけを強く残すので、山の頂上にだけ光が乗ります。",
        en: "`dir / max(d, 0.001)` is the unit direction pointing away from the cursor (the same as `normalize(dir)`, with `max` to avoid dividing by 0 right under the cursor). `pow(max(wave, 0.0), 3.0)` keeps only the highest parts of the wave, so light sits just on the crests.",
      },
    },

    { type: "heading", text: { ja: "空間を引き寄せる・押しのける", en: "Pulling and pushing space" } },
    {
      type: "paragraph",
      text: {
        ja: "波紋では、座標を少しずらして模様をゆがめました。これを大きくすると、カーソルの下だけ模様を **虫めがねのように拡大** したり、逆に **吸いこむように縮めた** りできます。模様の場所を、カーソルからの距離に応じて、カーソルのほうへ寄せたり遠ざけたりして読むのです。",
        en: "The ripples shifted coordinates a little to warp the pattern. Shift them more and you can **magnify** the pattern under the cursor like a lens, or **shrink** it as if sucked in. The trick is to read the pattern from a spot moved toward or away from the cursor, depending on the distance.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float strength = 0.5; //ja: 正で拡大、負で縮小 //en: positive magnifies, negative pinches
          vec2 dir = p - mouse;
          float d = length(dir);
          vec2 q = mouse + dir * (1.0 - strength * exp(-d * d * 8.0));

          //ja: q の場所の模様(点の格子)を描く
          //en: draw the pattern (a grid of dots) at q
          vec2 g = fract(q * 6.0) - 0.5;
          float dotMask = 1.0 - smoothstep(0.15, 0.2, length(g));
          vec3 col = mix(vec3(0.95, 0.93, 0.88), vec3(0.15, 0.2, 0.45), dotMask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`strength` を `-0.8` にすると、点がカーソルへ吸いこまれます。`0.9` にすると、カーソルの下だけ大きく拡大されます",
        en: "Set `strength` to `-0.8` and the dots get sucked toward the cursor. At `0.9` the spot under the cursor is hugely magnified",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`mouse + dir * f` は、カーソルからの向きはそのままで、距離だけを `f` 倍にした場所です。カーソルの真上では `f = 1.0 - 0.5 = 0.5` なので、本来の半分の距離の模様を読みます。カーソルの近くの模様が 2 倍に引きのばされて見えるので、**拡大** です。0.5 離れると `exp(-2.0)` が約 0.14 なので `f` は約 0.93 で、ほとんど元のままです。`strength` を負にすると `f` が 1 より大きくなり、遠くの模様が近くに詰めこまれて **縮小** になります。",
        en: "`mouse + dir * f` keeps the direction from the cursor but scales the distance by `f`. Right under the cursor, `f = 1.0 - 0.5 = 0.5`, so we read the pattern at half the real distance. The pattern near the cursor is stretched to twice its size: **magnification**. At 0.5 away, `exp(-2.0)` is about 0.14, so `f` is about 0.93 — nearly unchanged. A negative `strength` makes `f` larger than 1, packing distant parts of the pattern in close: **pinching**.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "シェーダーは 1 コマごとに最初から計算し直すので、前のコマのことを覚えていません。カーソルに遅れてついてくる動き、カーソルが通った跡、クリックした場所から広がる波紋のように「過去」が必要な表現はできません。`mouse` が教えてくれるのは「今カーソルがどこにあるか」だけです。",
        en: "A shader recomputes everything from scratch each frame and remembers nothing about the previous one. Effects that need the past — motion that trails behind the cursor, a trail where it has been, ripples from the spot you clicked — are not possible. `mouse` only tells you where the cursor is right now.",
      },
    },

    { type: "heading", text: { ja: "attention とは", en: "What attention is" } },
    {
      type: "paragraph",
      text: {
        ja: "`attention` は、このサイトならではの uniform です。Gallery の一覧で、見る人がその作品のカードにカーソルを乗せる(ホバーする)と、静止画が動き出し、`attention` が 0 から **0.3 秒ほどですばやく 1 近くまで** 上がります。カーソルが離れると、同じくらいの速さで 0 に戻ります。「いま見られている」ことを作品に伝える値です。",
        en: "`attention` is a uniform unique to this site. When a viewer hovers over a work's card in the Gallery, the still image starts moving and `attention` rises from 0 **to nearly 1 in about 0.3 seconds**. When the cursor leaves, it falls back to 0 just as fast. It tells the work \"someone is looking at you right now\".",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "Gallery の一覧 … ホバーしている間だけ 1 へ上がる。ホバーで変わるのは `attention` で、`mouse` は (0, 0) のまま",
          en: "Gallery … rises to 1 only while hovered. Hovering changes `attention`; `mouse` stays at (0, 0)",
        },
        {
          ja: "作品ページとエディタ … いつも 0",
          en: "Work page and editor … always 0",
        },
        {
          ja: "このコースのプレビュー … `attention` を使う playground では、下のスライダーで 0〜1 を自分で動かせる",
          en: "This course's previews … playgrounds that use `attention` show a slider below so you can set 0–1 yourself",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "いちばん素直な使い方は、`mix(ふだんの見た目, ホバー中の見た目, attention)` です。下では、ふだんは落ち着いた青紫の輪が、`attention` が上がると色づいて、うねり出します。スライダーを動かしてみてください。",
        en: "The most straightforward use is `mix(resting look, hovered look, attention)`. Below, calm blue-violet rings come alive with color and start to undulate as `attention` rises. Move the slider to try it.",
      },
    },
    {
      type: "playground",
      attentionSlider: true,
      source: `
        #define TAU 6.28318531

        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = length(p);
          float a = atan(p.y, p.x);
          //ja: attention が上がるほど、輪がうねる
          //en: the higher attention goes, the more the rings undulate
          float rings = 0.5 + 0.5 * sin(r * 18.0 - time * 1.5 + sin(a * 3.0 + time) * attention * 2.0);

          vec3 calm = vec3(0.22, 0.24, 0.42) * (0.5 + 0.5 * rings);
          vec3 vivid = hsv2rgb(vec3(fract(r * 0.5 + a / TAU + time * 0.1), 0.6, 0.55 + 0.45 * rings));
          vec3 col = mix(calm, vivid, attention);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "スライダーを 0 と 1 の間で動かしましょう。`mix(calm, vivid, attention)` を `mix(calm, vivid, attention * attention)` にすると、色づき始めが遅くなります",
        en: "Slide between 0 and 1. Change `mix(calm, vivid, attention)` to `mix(calm, vivid, attention * attention)` to make the color arrive later",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`attention` は、サイトの側でなめらかに 0〜1 を動いてくれるので、イージングの効いた「進み具合」としてそのまま使えます。`attention * attention` や `smoothstep(0.0, 1.0, attention)` のように形を変えれば、[時間で動かす](/learn/time-and-motion) のイージングと同じように、変わり方の印象を調整できます。",
        en: "The site already moves `attention` smoothly between 0 and 1, so you can use it directly as an eased progress value. Reshape it with `attention * attention` or `smoothstep(0.0, 1.0, attention)` to tune how the change feels, just like the easing in [Time and motion](/learn/time-and-motion).",
      },
    },

    { type: "heading", text: { ja: "attention の上手な使い方", en: "Using attention well" } },
    {
      type: "paragraph",
      text: {
        ja: "「ホバーしたら動きを速くしたい」と思ったとき、つい `time * mix(0.5, 3.0, attention)` と書きたくなります。でもこれは、絵が大きく **飛ぶ** 書き方です。`time` が 60 秒のとき、速さが 0.5 から 3.0 に変わると、`time * 速さ` は 30 から 180 へ一気に変わります。150 秒ぶんの動きを、`attention` が上がる 0.3 秒の間に早送りしてしまうのです。",
        en: "When you want \"move faster on hover\", it's tempting to write `time * mix(0.5, 3.0, attention)`. But this makes the image **jump**. At `time` = 60 seconds, changing the speed from 0.5 to 3.0 takes `time * speed` from 30 straight to 180. That fast-forwards 150 seconds of motion into the 0.3 seconds `attention` takes to rise.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`attention` で変えるのは、**強さ・色・大きさ・混ぜる割合** のように、時間とともに積み重ならないものにしましょう。速さを変えたいときは、ゆっくりの動きと速い動きを別々に作り、`attention` で混ぜたり足したりします。どちらの動きも `time` に決まった数をかけているだけなので、`attention` がどう変わっても絵は飛びません。",
        en: "Use `attention` for things that don't accumulate over time: **strength, color, size, blend amounts**. To change speed, build a slow motion and a fast motion separately, then blend or add them with `attention`. Each one only multiplies `time` by a fixed number, so the image never jumps however `attention` changes.",
      },
    },
    {
      type: "playground",
      attentionSlider: true,
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float slow = 0.3 * sin(p.x * 4.0 - time * 0.5);  //ja: いつもの動き //en: the usual motion
          float fast = 0.12 * sin(p.x * 11.0 - time * 4.0); //ja: ホバー中に足す速い動き //en: a fast motion added on hover
          float y = slow + fast * attention;
          // y = 0.3 * sin(p.x * 4.0 - time * mix(0.5, 3.0, attention)); //ja: よくない例 //en: the bad way

          float d = abs(p.y - y);
          vec3 col = mix(vec3(0.03, 0.04, 0.09), vec3(0.08, 0.05, 0.14), uv.y);
          col += mix(vec3(0.3, 0.6, 1.0), vec3(1.0, 0.4, 0.6), attention) * 0.006 / d;
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "スライダーを動かすと、細かく速い波がなめらかに加わります。`// y = …` の `//` を消してからスライダーを動かすと、波がぐるぐる早送りされるのがわかります",
        en: "Move the slider and a fine, fast wave blends in smoothly. Remove the `//` from `// y = …`, then move the slider: the wave spins through a fast-forward",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つの工夫が、**時間差** です。`attention` は 0.3 秒ほどで上がりきってしまいますが、`smoothstep(0.0, 0.5, attention)` と `smoothstep(0.5, 1.0, attention)` のように受け持つ範囲を分けると、「まずこれ、次にあれ」と順番に変化させられます。下では、マスごとに中心からの距離で範囲をずらして、中央から外へ波のように開いていくようにしています。",
        en: "Another trick is **staggering**. `attention` finishes rising in about 0.3 seconds, but if you split its range, as in `smoothstep(0.0, 0.5, attention)` and `smoothstep(0.5, 1.0, attention)`, things change in sequence: first this, then that. Below, each cell's range is offset by its distance from the center, so the tiles open in a wave from the middle outward.",
      },
    },
    {
      type: "playground",
      attentionSlider: true,
      source: `
        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 5.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          float r = min(length((id + 0.5) / 5.0) / 1.8, 1.0); //ja: 中心で 0、すみで 1 //en: 0 in the middle, 1 in the corners

          //ja: マスごとに、attention の受け持ちをずらす
          //en: each cell gets its own slice of attention
          float k = smoothstep(r * 0.6, r * 0.6 + 0.4, attention);

          float s = mix(0.12, 0.42, k);
          float d = sdBox(q, vec2(s - 0.1)) - 0.1;
          vec3 off = vec3(0.2, 0.22, 0.38);
          vec3 on = hsv2rgb(vec3(0.55 + 0.35 * r + 0.03 * time, 0.6, 0.95));
          vec3 col = mix(vec3(0.05, 0.05, 0.08), mix(off, on, k), 1.0 - smoothstep(-0.02, 0.02, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "スライダーをゆっくり右へ動かすと、中央から順に開きます。`r * 0.6` の `0.6` を `0.0` にすると、全部のマスが同時に開きます",
        en: "Slide slowly to the right and the tiles open from the middle out. Set the `0.6` in `r * 0.6` to `0.0` and every tile opens at once",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`mouse` と同じく、`attention` にも過去はありません。「ホバーしてから何秒たったか」はわからないので、長い演出は作れません。`attention` は 0.3 秒ほどの短い切りかえとして使い、長い動きは `time` に任せましょう。",
        en: "Like `mouse`, `attention` has no memory. You can't tell how many seconds have passed since the hover began, so long sequences are out. Use `attention` for short transitions of about 0.3 seconds, and leave longer motion to `time`.",
      },
    },

    { type: "heading", text: { ja: "どの状態でもきれいに", en: "Beautiful in every state" } },
    {
      type: "paragraph",
      text: {
        ja: "見る人がいつも `mouse` や `attention` を動かしてくれるとは限りません。むしろ、作品がいちばん多く見られるのは、何も操作されていない状態です。とくに Gallery では、まず **静止サムネ** が並びます。これは作品のコードから 1 コマだけ描いたもので、そのときの値は次のとおりです。",
        en: "Viewers won't always move `mouse` or change `attention`. In fact, a work is seen most often with no interaction at all. In the Gallery especially, what appears first is the **still thumbnail**: a single frame drawn from your code, with these values:",
      },
    },
    {
      type: "list",
      items: [
        { ja: "`time` = 2(動き出して 2 秒のコマ)", en: "`time` = 2 (the frame 2 seconds in)" },
        { ja: "`attention` = 0", en: "`attention` = 0" },
        { ja: "`mouse` = (0, 0)(画面の中心)", en: "`mouse` = (0, 0) (the center of the screen)" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "ホバーすると、その同じ `time` = 2 のコマから動き出し、`attention` が上がります。つまり、`attention` が 0 で `mouse` が中心のときの絵が、作品の **顔** です。`mouse` や `attention` での変化は「おまけ」と考え、それが無くても作品として成り立つようにしましょう。確かめ方のこつは次のとおりです。",
        en: "On hover, the animation starts from that same `time` = 2 frame and `attention` rises. So the picture with `attention` at 0 and `mouse` at the center is the **face** of your work. Think of what `mouse` and `attention` change as a bonus, and make the work stand on its own without them. Some tips for checking:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "カーソルを乗せないまま見て、`mouse` が中心にあるときの絵を確かめる。カーソルで照らす作品なら、中心が照らされた構図として自然か",
          en: "Look without hovering to see the picture with `mouse` at the center. If the cursor acts as a light, does a lit center make a natural composition?",
        },
        {
          ja: "`attention` が 0 のとき、暗すぎたり、何も描かれていなかったりしないか。ホバーで「隠れたものが現れる」作品でも、ふだんの状態に見どころを残す",
          en: "With `attention` at 0, is it too dark, or empty? Even if hovering reveals something hidden, leave something worth seeing in the resting state",
        },
        {
          ja: "`time` = 2 のコマが、たまたま何も無い瞬間になっていないか(エディタで 2 秒のところで止めて見る)",
          en: "Does the `time` = 2 frame happen to land on an empty moment? (Pause the editor at 2 seconds to check)",
        },
        {
          ja: "タッチの端末では `mouse` が動かないことが多い。`mouse` が無くても楽しめるか",
          en: "On touch devices `mouse` often doesn't move. Is the work still enjoyable without it?",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "下の作品は、ここまでをまとめたものです。ふだんは灯籠がゆっくり息をするように明滅し、カーソルの近くの灯籠は明るく大きくなり、`attention` が上がると全体が色とりどりに灯ります。カーソルを乗せる前は `mouse` が中心なので、中央の灯籠が明るくなり、それが自然な主役になるように作っています。仕上げには [光と仕上げ](/learn/light-and-glow) のトーンマッピングとガンマ補正を使っています。",
        en: "The piece below brings it all together. At rest, the lanterns flicker slowly as if breathing; lanterns near the cursor grow brighter and larger; and as `attention` rises, they all light up in many colors. Before you hover, `mouse` is at the center, so the middle lanterns glow brighter — designed to read as a natural focal point. It is finished with the tone mapping and gamma correction from [Light and finishing](/learn/light-and-glow).",
      },
    },
    {
      type: "playground",
      attentionSlider: true,
      source: `
        #define TAU 6.28318531

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 4.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          vec2 center = (id + 0.5) / 4.0;
          float h = hash21(id);

          float breathe = 0.5 + 0.5 * sin(time * (0.8 + h) + h * TAU); //ja: ふだんの明滅 //en: the resting flicker
          float near = exp(-length(center - mouse) * 2.5);              //ja: カーソルの近く //en: near the cursor
          float glow = 0.15 + 0.25 * breathe + 0.9 * near + 0.6 * attention;
          float r = 0.12 + 0.08 * near + 0.05 * attention;
          float d = length(q) - r;

          vec3 warm = vec3(1.0, 0.55, 0.25);
          vec3 c = mix(warm, hsv2rgb(vec3(h, 0.65, 1.0)), attention);
          vec3 col = mix(vec3(0.004, 0.003, 0.012), vec3(0.01, 0.006, 0.02), uv.y);
          col += c * glow * exp(-max(d, 0.0) * 9.0) * 0.6;              //ja: まわりの光 //en: the halo
          col = mix(col, c * glow * 1.6, 1.0 - smoothstep(-0.02, 0.02, d)); //ja: 灯籠そのもの //en: the lantern itself

          col = 1.0 - exp(-col * 1.3);
          col = pow(col, vec3(1.0 / 2.2));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "カーソルを乗せずに、スライダーを 0 にしたときが静止サムネの姿です。`0.9 * near` を `0.0 * near` にすると、カーソルに反応しなくなります",
        en: "With no cursor and the slider at 0, you see the still thumbnail. Change `0.9 * near` to `0.0 * near` to stop reacting to the cursor",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "配信背景のページ(/stage)では、URL で `attention` の値を決めて固定できます。書き出しや配信のしかたは [デモを仕上げて発表する](/learn/your-demo) で扱います。",
        en: "On the streaming-background page (/stage), you can fix `attention` to a value through the URL. Exporting and streaming are covered in [Finish and share your demo](/learn/your-demo).",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "どの課題も、仕上がったら「カーソルを乗せていない」「スライダーが 0」の状態でもきれいに見えるかを確かめましょう。",
        en: "When you finish each exercise, check that it also looks good with no cursor over it and the slider at 0.",
      },
    },
    {
      type: "exercise",
      title: { ja: "カンテラで照らす", en: "Lantern light" },
      prompt: {
        ja: "画面いっぱいの曲線の迷路を、カーソルのまわりだけ照らすようにしてください。照らす光は少しあたたかい色にして、照らされていないところもうっすら見えるようにします。カーソルが無いときは、中央が照らされます。",
        en: "Light this screen-filling maze of curves only around the cursor. Give the light a slightly warm tint, and keep the unlit areas faintly visible. With no cursor, the center is lit.",
      },
      starter: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: トルシェ模様の迷路
          //en: a Truchet maze
          vec2 g = p * 4.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          if (hash21(id) < 0.5) q.x = -q.x;
          float d = min(abs(length(q - 0.5) - 0.5), abs(length(q + 0.5) - 0.5));
          float line = 1.0 - smoothstep(0.06, 0.1, d);
          vec3 pattern = mix(vec3(0.06, 0.05, 0.1), hsv2rgb(vec3(fract(length(id) * 0.07), 0.7, 1.0)), line);

          //ja: ここで、カーソルのまわりだけ照らす
          //en: light only around the cursor here
          vec3 col = pattern;
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 4.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          if (hash21(id) < 0.5) q.x = -q.x;
          float d = min(abs(length(q - 0.5) - 0.5), abs(length(q + 0.5) - 0.5));
          float line = 1.0 - smoothstep(0.06, 0.1, d);
          vec3 pattern = mix(vec3(0.06, 0.05, 0.1), hsv2rgb(vec3(fract(length(id) * 0.07), 0.7, 1.0)), line);

          float dm = length(p - mouse);
          //ja: 炎のように、光の大きさを少しゆらす
          //en: let the light's size waver a little, like a flame
          float size = 5.0 + 0.6 * sin(time * 7.0) + 0.4 * sin(time * 11.3);
          float light = exp(-dm * dm * size);
          vec3 tint = mix(vec3(1.0), vec3(1.0, 0.8, 0.55), light); //ja: 照らされたところはあたたかく //en: warm where lit
          vec3 col = pattern * tint * (0.1 + 1.3 * light);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "カーソルからの距離 `length(p - mouse)` から、近いほど 1 になる明るさを作り、`pattern` にかけます",
          en: "From the distance to the cursor, `length(p - mouse)`, make a brightness that is 1 near it, and multiply `pattern` by it",
        },
        {
          ja: "`exp(-dm * dm * 5.0)` で、釣り鐘の形の光になります。照らされていないところも見えるように、`0.1 + 1.3 * light` のように底上げします",
          en: "`exp(-dm * dm * 5.0)` gives a bell-shaped light. Lift the floor, e.g. `0.1 + 1.3 * light`, so the unlit areas stay faintly visible",
        },
        {
          ja: "あたたかい色は `mix(vec3(1.0), vec3(1.0, 0.8, 0.55), light)` のように、照らされたところだけ色をかけます。`mouse` が (0, 0) なら、何もしなくても中央が照らされます",
          en: "For warmth, tint only the lit area, e.g. `mix(vec3(1.0), vec3(1.0, 0.8, 0.55), light)`. When `mouse` is (0, 0), the center is lit with no extra work",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "逃げる点", en: "Dots that flee" },
      prompt: {
        ja: "点の格子の上でカーソルを動かすと、カーソルの近くの点が、カーソルから逃げるように外へずれるようにしてください。近い点ほど大きくずれ、色も変わります。点はマスからはみ出さないようにします。",
        en: "Make the dots in this grid shy away from the cursor: dots near it slide outward, away from it. The closer a dot, the farther it moves and the more its color changes. Dots must not leave their cells.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 5.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          vec2 center = (id + 0.5) / 5.0;

          vec2 offset = vec2(0.0); //ja: ここで、カーソルから離れる向きにずらす //en: push away from the cursor here
          float d = length(q - offset) - 0.16;

          vec3 col = vec3(0.95, 0.94, 0.9);
          col = mix(col, vec3(0.2, 0.25, 0.5), 1.0 - smoothstep(-0.03, 0.03, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 5.0;
          vec2 id = floor(g);
          vec2 q = fract(g) - 0.5;
          vec2 center = (id + 0.5) / 5.0;

          vec2 away = center - mouse;
          float dist = length(away);
          float push = exp(-dist * 2.5);                      //ja: 近いほど 1 //en: 1 when close
          vec2 offset = away / max(dist, 0.001) * 0.3 * push; //ja: 最大 0.3 マス。はみ出さない //en: at most 0.3 cells, so it stays inside
          float d = length(q - offset) - 0.16;

          vec3 col = vec3(0.95, 0.94, 0.9);
          vec3 ink = mix(vec3(0.2, 0.25, 0.5), vec3(0.95, 0.35, 0.3), push);
          col = mix(col, ink, 1.0 - smoothstep(-0.03, 0.03, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "カーソルから離れる向きは `center - mouse` です。マスの中心で測るので、1 つの点の中はどこも同じ向き・同じ量だけずれます",
          en: "The direction away from the cursor is `center - mouse`. Measuring from the cell center means every pixel of one dot moves the same way by the same amount",
        },
        {
          ja: "向きを長さ 1 にしてから(`away / max(dist, 0.001)`)、`exp(-dist * 2.5)` のような近いほど大きい数をかけます",
          en: "Make the direction unit length first (`away / max(dist, 0.001)`), then multiply by something larger when close, such as `exp(-dist * 2.5)`",
        },
        {
          ja: "点の半径は 0.16 なので、ずれは最大 0.3 マスくらいまでにすると、マスからはみ出しません。`offset = away / max(dist, 0.001) * 0.3 * push;` です",
          en: "The dot radius is 0.16, so keep the shift under about 0.3 cells and it stays inside: `offset = away / max(dist, 0.001) * 0.3 * push;`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "ホバーで咲く花", en: "A flower that blooms on hover" },
      attentionSlider: true,
      prompt: {
        ja: "緑のつぼみを、`attention` が上がると 5 枚の花びらが開いて咲く花にしてください。花びらはピンク、真ん中には遅れて黄色い芯が現れるようにします。スライダーが 0 のときは、つぼみのままきれいに見えるようにします。",
        en: "Turn the green bud into a flower whose five petals open as `attention` rises. Make the petals pink, with a yellow center that appears slightly later. With the slider at 0, it should still look nice as a bud.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float a = atan(p.y, p.x);
          float r = length(p);
          float petals = 0.5 + 0.5 * cos(a * 5.0); //ja: 花びらの向きで 1 //en: 1 toward each petal
          float edge = 0.25 + 0.04 * petals;       //ja: つぼみの形。attention で開くように変える //en: the bud's outline; make it open with attention
          float d = r - edge;

          vec3 col = mix(vec3(0.96, 0.93, 0.86), vec3(0.98, 0.9, 0.8), uv.y);
          col = mix(col, vec3(0.35, 0.6, 0.35), 1.0 - smoothstep(-0.01, 0.01, d));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          float open = smoothstep(0.0, 0.8, attention);   //ja: 花びらが先 //en: petals first
          float bloom = smoothstep(0.5, 1.0, attention);  //ja: 芯は遅れて //en: the center later

          float a = atan(p.y, p.x) + 0.1 * sin(time * 0.7); //ja: ゆっくり揺れる //en: a gentle sway
          float r = length(p);
          float petals = 0.5 + 0.5 * cos(a * 5.0);
          float edge = mix(0.25 + 0.04 * petals, 0.25 + 0.5 * pow(petals, 1.5), open);
          float d = r - edge;

          vec3 col = mix(vec3(0.96, 0.93, 0.86), vec3(0.98, 0.9, 0.8), uv.y);
          //ja: 花びらの色: つぼみの緑 → ピンク。先にいくほど明るく
          //en: petal color: from bud green to pink, lighter toward the tips
          vec3 pink = mix(vec3(0.9, 0.3, 0.5), vec3(1.0, 0.8, 0.85), r / max(edge, 0.01));
          vec3 petal = mix(vec3(0.35, 0.6, 0.35), pink, open);
          col = mix(col, petal, 1.0 - smoothstep(-0.01, 0.01, d));
          //ja: 芯
          //en: the center
          float dc = r - 0.1 * bloom;
          col = mix(col, vec3(1.0, 0.8, 0.2), 1.0 - smoothstep(-0.01, 0.01, dc));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`edge` を、つぼみの形と咲いた形の 2 つに分けて、`mix(つぼみ, 咲いた形, attention)` で切りかえます",
          en: "Split `edge` into a bud shape and a bloomed shape, and switch with `mix(bud, bloom, attention)`",
        },
        {
          ja: "咲いた形は `0.25 + 0.5 * pow(petals, 1.5)` のように、花びらの向きで大きくふくらませます。色も `mix(緑, ピンク, attention)` で変えます",
          en: "For the bloomed shape, bulge strongly toward each petal, e.g. `0.25 + 0.5 * pow(petals, 1.5)`. Shift the color with `mix(green, pink, attention)` too",
        },
        {
          ja: "時間差は、`smoothstep(0.0, 0.8, attention)` を花びらに、`smoothstep(0.5, 1.0, attention)` を芯に使います。芯は半径 `0.1 * bloom` の円です",
          en: "For the stagger, use `smoothstep(0.0, 0.8, attention)` for the petals and `smoothstep(0.5, 1.0, attention)` for the center, a circle of radius `0.1 * bloom`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`mouse` は `p` と同じ座標のカーソル位置。カーソルを乗せる前は (0, 0)、タッチの端末では動かないことが多い",
          en: "`mouse` is the cursor position in `p` coordinates. It's (0, 0) before the cursor arrives, and often doesn't move on touch devices",
        },
        {
          ja: "`length(p - mouse)` で、照らす・大きくする・波紋を立てるなど、カーソルの近くだけを変えられる。マスごとに変えるときはマスの中心で測る",
          en: "`length(p - mouse)` lets you change things near the cursor: light, size, ripples. Measure from the cell center for per-cell changes",
        },
        {
          ja: "座標を `mouse + dir * f` でずらすと、空間を引き寄せたり押しのけたりできる",
          en: "Shifting coordinates with `mouse + dir * f` pulls or pushes space",
        },
        {
          ja: "`attention` は Gallery でホバーされている間だけ 0.3 秒ほどで 1 へ上がる。作品ページとエディタでは 0",
          en: "`attention` rises to 1 in about 0.3 seconds only while hovered in the Gallery; it's 0 on the work page and in the editor",
        },
        {
          ja: "`attention` で `time` にかける速さを変えない。強さ・色・大きさ・混ぜる割合を変え、`smoothstep` で時間差をつける",
          en: "Don't scale `time` by `attention`. Change strength, color, size or blend amounts instead, and stagger with `smoothstep`",
        },
        {
          ja: "静止サムネは `time` 2・`attention` 0・`mouse` (0, 0)。この状態が作品の顔",
          en: "The still thumbnail uses `time` 2, `attention` 0, `mouse` (0, 0). That state is your work's face",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "これで「模様とノイズ」の部はおしまいです。次の回からは 3D の世界に入ります。画面の 1 点ごとに目から視線を飛ばす「レイ」の考え方で、奥行きのある場面を描いていきます。この部で学んだ距離関数・光・仕上げは、3D でもそのまま活躍します。",
        en: "That wraps up the Patterns and noise part. From the next lesson on, we step into 3D. Using rays — a line of sight cast from the eye through each pixel — we'll draw scenes with depth. The distance functions, light and finishing touches from this part carry straight over into 3D.",
      },
    },
  ],
};

export default lesson;
