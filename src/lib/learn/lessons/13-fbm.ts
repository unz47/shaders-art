import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "fbm",
  title: { ja: "重ねて自然に(fBm)", en: "Layering noise (fBm)" },
  summary: {
    ja: "ノイズを何層も重ねて、雲・山・炎のような自然の質感を作る",
    en: "Stack octaves of noise for natural textures like clouds, mountains and fire",
  },
  minutes: 55,
  goals: [
    {
      ja: "細かさを 2 倍・強さを半分にしたノイズを重ねる **fBm** の考え方と、オクターブという言葉がわかる",
      en: "Understand **fBm**, which stacks noise at double the detail and half the strength each time, and what an octave is",
    },
    {
      ja: "`for` ループで層を重ね、層の数・ラクナリティ・ゲインで見た目を調整できる",
      en: "Stack layers with a `for` loop, and tune the look with the number of octaves, lacunarity and gain",
    },
    {
      ja: "層ごとに回してずらす理由がわかり、このコースの `fbm` 関数を読める",
      en: "Know why each layer is rotated and shifted, and read this course's `fbm` function",
    },
    {
      ja: "fBm で雲・山並み・炎・水面を描ける",
      en: "Paint clouds, mountain ranges, fire and water with fBm",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "自然には大きな形と小さな形がある", en: "Nature has big shapes and small ones" } },
    {
      type: "paragraph",
      text: {
        ja: "海岸線を飛行機から見ると、大きな湾と岬が見えます。浜辺に降りると小さな入り江が、さらにしゃがむと岩のでこぼこが見えてきます。雲も山も同じで、**大きな形の上に、小さな形が何段階も重なっています**。",
        en: "From a plane, a coastline shows big bays and headlands. Walk down to the beach and you see small coves; crouch down and you see the bumps on the rocks. Clouds and mountains are the same: **smaller shapes are layered on top of bigger ones, level after level**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "[なめらかなノイズ](/learn/value-noise) で作ったノイズには、1 つの大きさのうねりしかありません。だから丘はいつも丸く、雲はのっぺりしていました。そこで、大きなノイズに、小さなノイズを弱めに足し、さらに小さなノイズをもっと弱めに足していきます。これを **fBm**(fractional Brownian motion の略。日本語では非整数ブラウン運動)と呼びます。名前は数学から来ていますが、ここでは「大きさの違うノイズを重ねたもの」と覚えておけば十分です。",
        en: "The noise from [Smooth noise](/learn/value-noise) has swells of just one size. That's why the hills were always round and the clouds looked flat. So we take a big noise, add a smaller noise at lower strength, then an even smaller one at even lower strength, and so on. This is called **fBm**, short for fractional Brownian motion. The name comes from mathematics, but for our purposes \"noise stacked at different sizes\" is all you need to remember.",
      },
    },

    { type: "heading", text: { ja: "オクターブを重ねる", en: "Stacking octaves" } },
    {
      type: "paragraph",
      text: {
        ja: "重ね方の基本は、1 層ごとに **細かさを 2 倍、強さを半分** にすることです。ノイズに入れる座標を 2 倍にすると、模様は半分の大きさになり、2 倍細かくなります。この細かさを **周波数**、強さ(ゆれの大きさ)を **振幅** と呼びます。音楽では周波数が 2 倍の音を「1 オクターブ上」と言うので、重ねる 1 層 1 層を **オクターブ** と呼びます。",
        en: "The basic recipe is to make each layer **twice as fine and half as strong**. Doubling the coordinates you feed to noise halves the size of the pattern, making it twice as fine. That fineness is called **frequency**, and the strength (how far it swings) is the **amplitude**. In music, a note at twice the frequency is \"one octave up\", so each layer is called an **octave**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下のプレビューは、山の稜線として 1D の fBm を描いたものです。いまは 1 層目だけです。2 層目からの行は `//` で止めてあるので、上から 1 つずつ外していきましょう。",
        en: "The preview below draws a 1D fBm as a mountain ridge. Right now only the first layer is on. The lines for layer 2 onward are switched off with `//`, so remove them one at a time from the top.",
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
          float x = p.x * 1.5 + 2.0;
          float n = 0.0;
          n += 0.5 * noise(vec2(x, 0.0));
          // n += 0.25 * noise(vec2(x * 2.0, 10.0));
          // n += 0.125 * noise(vec2(x * 4.0, 20.0));
          // n += 0.0625 * noise(vec2(x * 8.0, 30.0));
          // n += 0.03125 * noise(vec2(x * 16.0, 40.0));

          float h = n * 1.5 - 0.6;                     //ja: 稜線の高さ //en: ridge height
          vec3 col = mix(vec3(0.85, 0.9, 1.0), vec3(0.35, 0.55, 0.9), uv.y);
          float px = 2.0 / resolution.y;
          col = mix(col, vec3(0.15, 0.2, 0.3), 1.0 - smoothstep(-px, px, p.y - h));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`//` を 1 行外すたびに、細かいでこぼこが 1 段階加わり、丸い丘がだんだん岩山らしくなります。全部外したあと、`0.5`・`0.25`… を全部 `0.2` にそろえると?",
        en: "Each line you switch on adds one more level of finer bumps, and the round hill slowly turns into a rocky peak. Once they're all on, try setting `0.5`, `0.25` and the rest all to `0.2`",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "強さを半分ずつにするのは、大きな形を主役に保つためです。1 層目が山全体の形を決め、2 層目以降はその上に細部を足すだけになります。強さを全部同じにすると、細かい層が大きな形を埋もれさせて、ざらざらした雑音のようになります。強さの合計は 0.5 + 0.25 + 0.125 + 0.0625 + 0.03125 = 0.96875 なので、答えはおよそ 0〜1 に収まります。",
        en: "Halving the strength each time keeps the big shape in charge. The first layer decides the overall form of the mountain, and the later layers only add detail on top. Give every layer the same strength and the fine layers bury the big shape, leaving something like gritty static. The strengths add up to 0.5 + 0.25 + 0.125 + 0.0625 + 0.03125 = 0.96875, so the result stays roughly within 0 to 1.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`noise(vec2(x * 2.0, 10.0))` の 2 つ目の数は、層ごとに変えてあります。[なめらかなノイズ](/learn/value-noise) の山と同じく、y の数を変えると、ノイズの別の列、つまり別の乱数を使うことになります。全部の層が同じ列を使うと、同じ形が大きさを変えてくり返し現れ、不自然に見えます。",
        en: "The second number in `noise(vec2(x * 2.0, 10.0))` differs for each layer. As with the hills in [Smooth noise](/learn/value-noise), changing y means using a different row of the noise, and so different random values. If every layer used the same row, the same shapes would reappear at different sizes, and it would look artificial.",
      },
    },

    { type: "heading", text: { ja: "ループで重ねる", en: "Layering in a loop" } },
    {
      type: "paragraph",
      text: {
        ja: "さっきの 5 行は、[時間で動かす](/learn/time-and-motion) の `for` ループにまとめられます。fBm では、1 回ごとに「ノイズを足す・座標を 2 倍にする・強さを半分にする」の 3 つをくり返すので、ループの回数がそのまま層の数になります。",
        en: "Those five lines fold neatly into a `for` loop like the ones in [Time and motion](/learn/time-and-motion). For fBm, each pass does three things: add a noise, double the coordinates, and halve the strength. So the loop count is simply the number of layers.",
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

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);  //ja: いまの強さで足す //en: add at the current strength
            p *= 2.0;           //ja: 次の層は 2 倍細かく //en: next layer is twice as fine
            a *= 0.5;           //ja: 次の層は半分の強さ //en: next layer is half as strong
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = fbm(p * 2.0 + vec2(5.0, 3.0));
          vec3 col = mix(vec3(0.08, 0.12, 0.3), vec3(1.0, 0.95, 0.88), smoothstep(0.25, 0.75, n));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`i < 5` の `5` を `1`、`2`、`8` に変えてみましょう。`1` は前の回のノイズ 1 層だけ(強さは半分)、`8` は細かい層がほとんど見分けられないくらい小さくなります",
        en: "Change the `5` in `i < 5` to `1`, `2` and `8`. With `1` it's a single layer of last lesson's noise (at half strength); with `8` the finest layers are too small to make out",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "層を増やすほど重くなります。1 層は `noise` 1 回、つまり `hash21` 4 回なので、5 層なら 1 つの点で 20 回です。さらに、細かすぎる層は 1 ピクセルより小さくなり、見た目は変わらないのに計算だけが増え、動かすとちらつきの原因にもなります。`fbm(p * 3.0)` を 8 層にすると、いちばん細かい層は画面の高さに 768 マスぶんで、ふつうのプレビューのピクセルより細かくなります。層は **5〜6 層まで** を目安にしましょう。",
        en: "More layers means more work. One layer is one `noise` call, which is four `hash21` calls, so five layers cost 20 per pixel. On top of that, layers that are too fine get smaller than a pixel: they add cost without changing the picture, and they flicker when things move. With `fbm(p * 3.0)` and 8 layers, the finest layer has 768 cells across the screen's height, finer than the pixels of a typical preview. Aim for **5 or 6 layers at most**.",
      },
    },

    { type: "heading", text: { ja: "ラクナリティとゲイン", en: "Lacunarity and gain" } },
    {
      type: "paragraph",
      text: {
        ja: "「細かさを 2 倍、強さを半分」の 2 と 0.5 には名前があります。1 層ごとに周波数を何倍にするかを **ラクナリティ**(lacunarity。ラテン語の「すき間」から来た言葉)、振幅を何倍にするかを **ゲイン**(gain。増幅率)と呼びます。この 2 つで、fBm の質感が大きく変わります。",
        en: "The 2 and the 0.5 in \"twice as fine, half as strong\" have names. How much the frequency is multiplied per layer is the **lacunarity** (from the Latin for \"gap\"), and how much the amplitude is multiplied is the **gain**. These two change the texture of fBm dramatically.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "ゲインを大きく(0.6〜0.7)すると、細かい層が強く残り、岩肌のようなざらざらした質感になります",
          en: "A higher gain (0.6–0.7) keeps the fine layers strong, giving a gritty texture like rock",
        },
        {
          ja: "ゲインを小さく(0.3 くらい)すると、細かい層がすぐに消え、やわらかくぼんやりした質感になります",
          en: "A lower gain (around 0.3) lets the fine layers fade out fast, giving a soft, hazy texture",
        },
        {
          ja: "ラクナリティを大きくすると、層と層の大きさの差が開き、大きな形と細かな粒がはっきり分かれます",
          en: "A higher lacunarity widens the size gap between layers, so the big shapes and fine grain separate clearly",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "ゲインを変えると、強さの合計も変わります。たとえばゲイン 0.7 なら合計は 1.4 近くになり、答えが 1 を超えてしまいます。そこで、足した強さの合計 `total` も数えておき、最後に `v / total` で割ると、ゲインを変えても答えが 0〜1 に収まります。",
        en: "Changing the gain also changes the total strength. With a gain of 0.7, for example, the total approaches 1.4 and the result goes past 1. So we also keep a running `total` of the strengths and divide by it at the end, `v / total`, which keeps the result within 0 to 1 whatever the gain.",
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

        float fbm(vec2 p) {
          float lacunarity = 2.0;  //ja: 層ごとに周波数を何倍にするか //en: frequency multiplier per layer
          float gain = 0.5;        //ja: 層ごとに振幅を何倍にするか //en: amplitude multiplier per layer
          float v = 0.0;
          float a = 0.5;
          float total = 0.0;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            total += a;
            p *= lacunarity;
            a *= gain;
          }
          return v / total;        //ja: 強さの合計で割って 0〜1 に //en: divide by the total strength to stay in 0–1
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = fbm(p * 2.0 + vec2(5.0, 3.0));
          vec3 dark = vec3(0.25, 0.12, 0.1);
          vec3 light = vec3(0.98, 0.82, 0.6);
          vec3 col = mix(dark, light, smoothstep(0.25, 0.75, n));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`gain` を `0.7` にすると岩肌のように、`0.3` にするとやわらかくなります。`lacunarity` を `3.0` にすると?",
        en: "Set `gain` to `0.7` for a rocky look, or `0.3` for a soft one. What happens with `lacunarity` at `3.0`?",
      },
    },

    { type: "heading", text: { ja: "層ごとに回してずらす", en: "Rotate and shift each layer" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの fBm には、目立たない弱点があります。座標を 2 倍しかしていないので、**どの層も格子の向きがそろっていて、格子点の場所も重なっている** のです。1 層目の格子点(x も y も整数の点)は、2 倍した 2 層目でも、4 倍した 3 層目でも、やはり格子点です。",
        en: "The fBm so far has a subtle weakness. Since we only ever double the coordinates, **every layer's grid faces the same way, and their lattice points coincide**. A lattice point of the first layer (where x and y are whole numbers) is still a lattice point in the second layer after doubling, and in the third after doubling again.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "いちばん目立つのが原点 (0, 0) です。原点はすべての層で格子点になり、しかも `hash21(vec2(0.0))` はちょうど 0 です。つまり原点では全部の層が 0 になります。しかも格子点のまわりでは、どの層もなめらかな曲線の平らなところ(傾きが 0 のところ)にいるので、細かいでこぼこまで消えてしまいます。こうして画面の真ん中に、細部の無い、のっぺりした暗いくぼみができます。そのほかの場所でも、縦と横の格子に沿ったくせが層ごとに重なり、筋のように見えやすくなります。",
        en: "The most obvious spot is the origin, (0, 0). It's a lattice point in every layer, and `hash21(vec2(0.0))` happens to be exactly 0. So at the origin every layer is 0. What's more, around a lattice point every layer sits on the flat part of its smooth curve (where the slope is 0), so even the fine bumps vanish. The result is a dark, featureless pit in the middle of the screen. Elsewhere, the horizontal and vertical habits of the grid pile up layer on layer and tend to show as streaks.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "直し方は、1 層ごとに座標を少し **回して、ずらす** ことです。[座標を動かす](/learn/transforms) で作った `rot(a)` で 0.5 ラジアン(約 29 度)ずつ回すと、層ごとに格子の向きがばらばらになります。さらに `vec2(17.0, 9.0)` のような中途半端な数を足すと、格子点の場所もそろわなくなります。",
        en: "The fix is to **rotate and shift** the coordinates a little for each layer. Rotating by 0.5 radians (about 29 degrees) each time with `rot(a)` from [Moving space](/learn/transforms) points every layer's grid in a different direction. Adding an arbitrary offset like `vec2(17.0, 9.0)` also stops their lattice points from lining up.",
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
            p = p * 2.0;
            // p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = fbm(p * 0.8);
          vec3 col = mix(vec3(0.05, 0.08, 0.25), vec3(1.0, 0.9, 0.75), smoothstep(0.2, 0.8, n));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "画面の中央の、細かい模様の無いのっぺりした暗い部分を見つけてから、`p = p * 2.0;` の先頭に `//` を付け、その次の行の `//` を外してみましょう。のっぺりした部分が消え、どこにも細部があるようになります",
        en: "Find the smooth, dark patch with no fine detail in the middle of the screen. Then put `//` in front of `p = p * 2.0;` and remove the `//` from the line after it. The featureless patch is gone, and there's detail everywhere",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "これが、このコースでこれから使う `fbm` です。5 層で、答えはおよそ 0〜1 です。使うときは、`rot` と `hash21` と `noise` も一緒にコードに入れます。",
        en: "Here is the `fbm` this course uses from now on. It has five layers and returns roughly 0 to 1. Whenever you use it, include `rot`, `hash21` and `noise` in your code as well.",
      },
    },
    {
      type: "code",
      source: `
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
      `,
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`rot(a) * v` は、ベクトル `v` を反時計回りに `a` ラジアン回します。fBm では向きがばらばらになれば良いので、回す向きや角度にこだわる必要はありません。0.5 のような、90 度の倍数から離れた角度なら何でもかまいません。",
        en: "`rot(a) * v` rotates the vector `v` counterclockwise by `a` radians. For fBm all that matters is that the directions differ, so the exact angle and direction don't matter. Any angle well away from a multiple of 90 degrees, such as 0.5, will do.",
      },
    },

    { type: "heading", text: { ja: "雲", en: "Clouds" } },
    {
      type: "paragraph",
      text: {
        ja: "fBm の使い道の代表が雲です。fBm の値を「雲の濃さ」と考え、`smoothstep` で「ここから下は晴れ、ここから上は雲」と区切ります。下の例では、0.42 より小さいところは青空のまま、0.72 より大きいところは雲で埋まり、その間はなめらかに移ります。x に `time` を足して、雲を風で流しています。",
        en: "Clouds are the classic use of fBm. Treat the fBm value as cloud density and use `smoothstep` to split it into clear sky and cloud. In the example below, anything below 0.42 stays blue sky, anything above 0.72 is solid cloud, and values in between blend smoothly. Adding `time` to x lets the wind carry the clouds along.",
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
          vec3 sky = mix(vec3(0.55, 0.75, 0.95), vec3(0.15, 0.4, 0.85), uv.y);
          vec2 q = p * 1.2 + vec2(time * 0.08, 0.0);   //ja: 風で左へ流す //en: the wind carries them left
          float n = fbm(q);

          float cover = smoothstep(0.42, 0.72, n);     //ja: 雲の濃さ //en: cloud density
          vec3 cloud = mix(vec3(0.7, 0.74, 0.82), vec3(1.0), smoothstep(0.5, 0.8, n));
          vec3 col = mix(sky, cloud, cover);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.42` を `0.3` にすると曇り空に、`0.55` にするとまばらな雲になります(`0.72` より小さいままにします)。`p * 1.2` を `p * 3.0` にすると、小さな雲がたくさん浮かびます",
        en: "Change `0.42` to `0.3` for an overcast sky, or `0.55` for scattered clouds (keep it below `0.72`). Change `p * 1.2` to `p * 3.0` for lots of little clouds",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "このままでは雲が平たく見えます。立体感を出すには、光の当たり方を「それらしく」まねします。太陽が左上にあるとして、いまの点から **太陽の方向へ少しずらした場所** の濃さを調べます。そこがいまの点より薄ければ、いまの点は雲の太陽側の面なので明るく、濃ければ雲の陰なので暗くします。本当の光の計算ではありませんが、`fbm` をもう 1 回呼ぶだけで、ぐっと雲らしくなります。",
        en: "As it is, the clouds look flat. To give them volume, we fake the lighting. Assume the sun is up and to the left, and look up the density at **a spot shifted slightly toward the sun**. If that spot is thinner than the current point, the current point is on the sunlit side of the cloud, so brighten it; if it's thicker, the point is in the cloud's shadow, so darken it. It isn't real lighting, but one extra `fbm` call makes the clouds far more convincing.",
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
          vec3 sky = mix(vec3(0.55, 0.75, 0.95), vec3(0.15, 0.4, 0.85), uv.y);
          vec2 q = p * 1.2 + vec2(time * 0.08, 0.0);
          float n = fbm(q);
          float cover = smoothstep(0.42, 0.72, n);

          float toSun = fbm(q + vec2(-0.03, 0.06));         //ja: 太陽(左上)の方向へ少しずらした場所の濃さ //en: density a little toward the sun (upper left)
          float lit = clamp(0.55 + (n - toSun) * 8.0, 0.0, 1.0);
          vec3 cloud = mix(vec3(0.55, 0.6, 0.72), vec3(1.0), lit);
          vec3 col = mix(sky, cloud, cover);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`vec2(-0.03, 0.06)` を `vec2(0.03, -0.06)` にすると、光が右下から当たっているように見えます。`8.0` を `20.0` にすると、陰影が強くなります",
        en: "Change `vec2(-0.03, 0.06)` to `vec2(0.03, -0.06)` and the light seems to come from the lower right. Change `8.0` to `20.0` for stronger shading",
      },
    },

    { type: "heading", text: { ja: "山並み", en: "Mountain ranges" } },
    {
      type: "paragraph",
      text: {
        ja: "[なめらかなノイズ](/learn/value-noise) では丸い丘しか作れませんでした。fBm の横 1 列を稜線にすれば、ごつごつした山になります。さらにループで 5 列の山を奥から順に描き、手前の山で奥の山を上書きすると、山並みが何重にも重なった景色になります。",
        en: "In [Smooth noise](/learn/value-noise) we could only make round hills. Use one row of fBm as the ridgeline and you get rugged mountains. Then loop to draw five ranges from back to front, letting each nearer range paint over the ones behind it, and you get a landscape of ridges layered one behind another.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "奥の山ほど高い位置に置き、横に大きく(ゆったり)、ゆっくり流れるようにします",
          en: "Farther ranges sit higher on the screen, are broader, and scroll more slowly",
        },
        {
          ja: "奥の山ほど空の色に近づけ、手前ほど暗くします。遠くのものは空気を通して見えるので、空の色に溶けていきます",
          en: "Farther ranges are closer to the sky color, nearer ones darker. Distant things are seen through more air, so they fade into the sky",
        },
        {
          ja: "層ごとに `fi * 10.0` で fBm の別の列を読み、山の形がそろわないようにします",
          en: "Each range reads a different row of the fBm via `fi * 10.0`, so their shapes don't match",
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
          vec3 sky = mix(vec3(1.0, 0.72, 0.55), vec3(0.3, 0.35, 0.68), uv.y);
          float sun = 1.0 - smoothstep(0.15, 0.17, length(p - vec2(-0.5, 0.35)));
          vec3 col = mix(sky, vec3(1.0, 0.95, 0.8), sun);

          float px = 2.0 / resolution.y;
          for (int i = 0; i < 5; i++) {
            float fi = float(i);                       //ja: 0 が奥、4 が手前 //en: 0 is farthest, 4 is nearest
            float x = p.x * (0.6 + fi * 0.3) + time * 0.03 * (fi + 1.0);
            float h = 0.3 - fi * 0.2 + 0.55 * (fbm(vec2(x, fi * 10.0)) - 0.5);
            vec3 c = mix(sky * vec3(0.8, 0.75, 0.9), vec3(0.06, 0.05, 0.1), fi / 4.0);
            col = mix(col, c, 1.0 - smoothstep(-px, px, p.y - h));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.55 * (…)` の `0.55` を `1.0` にすると、険しい山脈になります。`fi * 0.2` の `0.2` を `0.1` にすると、山並みが詰まって重なります",
        en: "Change the `0.55` in `0.55 * (…)` to `1.0` for a jagged range. Change the `0.2` in `fi * 0.2` to `0.1` to pack the ranges closer together",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "1 つの点で `fbm` を 5 回(`noise` なら 25 回)呼んでいるので、この絵はこれまでより重めです。山並みを増やすときは、層の数とのかね合いに気をつけましょう。",
        en: "Each pixel calls `fbm` five times (25 `noise` calls), so this picture is heavier than the earlier ones. If you add more ranges, keep an eye on how that multiplies with the number of fBm layers.",
      },
    },

    { type: "heading", text: { ja: "炎と水面", en: "Fire and water" } },
    {
      type: "paragraph",
      text: {
        ja: "炎は、fBm の模様を **上へ流す** ところから始まります。`p.y * 2.0 - time * 1.5` のように y から時間を引くと、模様は上へ動きます(足すと下へ動きます)。次に、下で太く上で細い「炎の土台」の形 `body` を作り、そこに fBm を足して縁をちぎります。最後に、熱いところほど明るく白っぽくなるように、黒 → 赤 → オレンジ → 黄 → 白 と色を重ねます。",
        en: "Fire starts by making the fBm pattern **flow upward**. Subtracting time from y, as in `p.y * 2.0 - time * 1.5`, moves the pattern up (adding would move it down). Next, build a base flame shape, `body`, that's wide at the bottom and narrow at the top, and add fBm to tear its edges into tongues. Finally, layer the colors black → red → orange → yellow → white, so that hotter parts are brighter and whiter.",
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
          float n = fbm(vec2(p.x * 3.0, p.y * 2.0 - time * 1.5));  //ja: 模様を上へ流す //en: make the pattern flow upward

          float y = p.y + 0.9;                                     //ja: 画面の下からの高さ //en: height above the bottom of the screen
          float body = 1.0 - abs(p.x) * (1.3 + y * 1.3) - y * 0.42; //ja: 下で太く上で細い形 //en: wide at the bottom, narrow at the top
          float heat = body + (n - 0.5) * 1.4;                     //ja: fBm で縁をちぎる //en: tear the edges with fBm

          vec3 col = vec3(0.04, 0.01, 0.02) + vec3(0.25, 0.06, 0.02) * clamp(body, 0.0, 1.0);
          col = mix(col, vec3(0.7, 0.08, 0.03), smoothstep(0.0, 0.2, heat));
          col = mix(col, vec3(1.0, 0.45, 0.08), smoothstep(0.2, 0.45, heat));
          col = mix(col, vec3(1.0, 0.85, 0.4), smoothstep(0.45, 0.7, heat));
          col = mix(col, vec3(1.0, 1.0, 0.9), smoothstep(0.7, 0.95, heat));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`(n - 0.5) * 1.4` の `1.4` を `0.5` にすると、おとなしいろうそくのような炎に、`2.5` にすると荒々しい炎になります。`time * 1.5` を `time * 4.0` にすると?",
        en: "Change the `1.4` in `(n - 0.5) * 1.4` to `0.5` for a calm, candle-like flame, or `2.5` for a wild one. What about `time * 4.0` instead of `time * 1.5`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "水面は、fBm を横に長く伸ばすと作れます。さらに奥行きを出すために、水平線に近いほど模様を細かくします。水平線の近くは遠くの水面なので、波が小さく見えるはずだからです。`z = 1.0 / (horizon - p.y + 0.03)` は、画面の下では 1 くらい、水平線に近づくほど大きくなる数で、「その点に映っている水面がどれだけ遠いか」の代わりに使えます。x にも `z` をかけるのは、遠くほど横の幅も縮んで見えるからです(このしくみは [レイとカメラ](/learn/rays-and-camera) でくわしく扱います)。",
        en: "You can make a water surface by stretching fBm out sideways. To add depth, make the pattern finer near the horizon: water near the horizon is far away, so its waves should look small. `z = 1.0 / (horizon - p.y + 0.03)` is about 1 at the bottom of the screen and grows as you approach the horizon, so it works as a stand-in for how far away the water at that point is. We multiply x by `z` too, because distant things look narrower as well. ([Rays and cameras](/learn/rays-and-camera) explains this properly.)",
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
          float horizon = 0.1;
          vec3 col = mix(vec3(1.0, 0.7, 0.5), vec3(0.3, 0.35, 0.65), smoothstep(horizon, 1.0, p.y));
          float sun = 1.0 - smoothstep(0.12, 0.13, length(p - vec2(0.0, 0.3)));
          col = mix(col, vec3(1.0, 0.95, 0.8), sun);

          if (p.y < horizon) {
            float z = 1.0 / (horizon - p.y + 0.03);       //ja: 水面の遠さ //en: how far away the water is
            vec2 w = vec2(p.x * z, z);
            float n = fbm(w * vec2(0.3, 3.0) + vec2(0.0, time * 0.4));  //ja: 横に長い波 //en: long, sideways waves

            vec3 water = mix(vec3(0.05, 0.12, 0.25), vec3(0.9, 0.55, 0.45), smoothstep(0.35, 0.75, n) * 0.6);
            float column = 1.0 - smoothstep(0.0, 0.25, abs(p.x));  //ja: 太陽の真下の帯 //en: the strip right below the sun
            water += vec3(1.0, 0.85, 0.6) * column * smoothstep(0.5, 0.65, n);
            water = mix(water, vec3(0.95, 0.65, 0.55), smoothstep(5.0, 30.0, z));  //ja: 遠くはかすませる //en: haze in the distance
            col = water;
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`vec2(0.3, 3.0)` を `vec2(1.0, 1.0)` にすると、波が伸びずに、まだら模様になります。`horizon` を `-0.2` にすると、空が広くなります",
        en: "Change `vec2(0.3, 3.0)` to `vec2(1.0, 1.0)` and the waves stop stretching, leaving blotches. Set `horizon` to `-0.2` for more sky",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "fBm の値を「濃さ」「高さ」「熱さ」のどれと考えるかで、同じ関数がまったく違う絵になります。どの課題でも、まず値の意味を決めてから色を付けてみましょう。",
        en: "Depending on whether you treat the fBm value as density, height or heat, the same function makes completely different pictures. In each exercise, decide what the value means first, then color it.",
      },
    },
    {
      type: "exercise",
      title: { ja: "月夜の雲", en: "Clouds on a moonlit night" },
      prompt: {
        ja: "夜空に月が出ています。fBm で雲を作り、ゆっくり流れて月の前を横切るようにしてください。雲は月に近いところほど月明かりで明るく、離れるほど暗くすると、夜らしい雰囲気になります。",
        en: "The moon is out in the night sky. Use fBm to make clouds that drift slowly across the face of the moon. Make the clouds brighter near the moon, lit by moonlight, and darker farther away, for a proper nighttime mood.",
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
          vec3 col = mix(vec3(0.05, 0.07, 0.15), vec3(0.01, 0.01, 0.04), uv.y);
          float m = length(p - vec2(0.4, 0.35));         //ja: 月の中心からの距離 //en: distance from the moon's center
          float px = 2.0 / resolution.y;
          col += vec3(0.12, 0.15, 0.2) * (1.0 - smoothstep(0.0, 0.8, m));  //ja: 月のまわりの明るさ //en: glow around the moon
          col = mix(col, vec3(1.0, 0.97, 0.88), 1.0 - smoothstep(0.18 - px, 0.18 + px, m));

          float cloud = 0.0;                             //ja: ここを書き換える //en: change this
          vec3 cloudColor = vec3(0.3, 0.32, 0.4);
          col = mix(col, cloudColor, cloud);
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
          vec3 col = mix(vec3(0.05, 0.07, 0.15), vec3(0.01, 0.01, 0.04), uv.y);
          float m = length(p - vec2(0.4, 0.35));
          float px = 2.0 / resolution.y;
          col += vec3(0.12, 0.15, 0.2) * (1.0 - smoothstep(0.0, 0.8, m));
          col = mix(col, vec3(1.0, 0.97, 0.88), 1.0 - smoothstep(0.18 - px, 0.18 + px, m));

          //ja: 横に少し伸ばした fBm を、時間で左へ流す
          //en: fBm stretched a little sideways, drifting left over time
          float n = fbm(p * vec2(1.0, 1.8) + vec2(time * 0.06, 0.0));
          float cloud = smoothstep(0.4, 0.7, n);

          //ja: 月に近いほど明るく、雲の薄い縁ほど光を通す
          //en: brighter near the moon, and the thin edges let more light through
          float moonlight = 1.0 - smoothstep(0.0, 1.4, m);
          vec3 cloudColor = mix(vec3(0.14, 0.15, 0.24), vec3(0.85, 0.85, 0.92), moonlight * (1.0 - 0.4 * cloud));
          col = mix(col, cloudColor, cloud * 0.95);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "雲の濃さは、雲のところで学んだように `smoothstep(0.4, 0.7, fbm(…))` で作れます",
          en: "As in the Clouds section, you can get density with `smoothstep(0.4, 0.7, fbm(…))`",
        },
        {
          ja: "`fbm(p * 1.5 + vec2(time * 0.06, 0.0))` のように x に時間を足すと、雲が流れます",
          en: "Add time to x, as in `fbm(p * 1.5 + vec2(time * 0.06, 0.0))`, to make the clouds drift",
        },
        {
          ja: "月からの距離 `m` を使って `1.0 - smoothstep(0.0, 1.4, m)` を作り、それで暗い雲の色と明るい雲の色を `mix` します",
          en: "Use the distance `m` from the moon to compute `1.0 - smoothstep(0.0, 1.4, m)`, and `mix` a dark cloud color with a bright one by that amount",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "稲妻の筋", en: "Lightning veins" },
      prompt: {
        ja: "starter の `ridge` 関数は、いまはふつうの fBm と同じなので、ぼんやりした紫の雲にしか見えません。各層のノイズを「0.5 のところで 1、0 や 1 に近いほど 0」になる形に折り返してから足すと、ノイズの真ん中の値のところが細い尾根になり、稲妻やプラズマのような光る筋が現れます。`ridge` を書き換えて、筋の模様を作ってください。",
        en: "The `ridge` function in the starter is currently plain fBm, so all you see is a hazy purple cloud. If you fold each layer's noise so that it's 1 at 0.5 and drops to 0 near 0 and 1 before adding it, the middle values of the noise become thin ridges, and glowing veins like lightning or plasma appear. Rewrite `ridge` to make the veins.",
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

        float ridge(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            float n = noise(p);
            v += a * n;                    //ja: ここを書き換える //en: change this
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = ridge(p * 1.5 + vec2(time * 0.1, 0.0));
          float vein = pow(r, 6.0);        //ja: 1 に近いところだけを残す //en: keep only the values near 1
          vec3 col = vec3(0.02, 0.01, 0.06) + vec3(0.25, 0.1, 0.5) * r * r;
          col += vec3(0.5, 0.8, 1.0) * vein * 1.5;
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

        float ridge(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            float n = noise(p);
            //ja: 0〜1 を -1〜1 にして abs で折り返し、上下を逆にする
            //en: map 0–1 to -1–1, fold with abs, then flip it upside down
            v += a * (1.0 - abs(n * 2.0 - 1.0));
            p = rot(0.5) * p * 2.0 + vec2(17.0, 9.0);
            a *= 0.5;
          }
          return v;
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = ridge(p * 1.5 + vec2(time * 0.1, 0.0));
          float vein = pow(r, 6.0);
          vec3 col = vec3(0.02, 0.01, 0.06) + vec3(0.25, 0.1, 0.5) * r * r;
          col += vec3(0.5, 0.8, 1.0) * vein * 1.5;
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`n * 2.0 - 1.0` は、0〜1 の `n` を -1〜1 に直します。`n` が 0.5 のとき、ちょうど 0 になります",
          en: "`n * 2.0 - 1.0` turns `n` from 0–1 into -1–1. It's exactly 0 when `n` is 0.5",
        },
        {
          ja: "`abs(n * 2.0 - 1.0)` は、`n` が 0.5 のとき 0、0 や 1 のとき 1 です。これを `1.0 -` で上下逆にします",
          en: "`abs(n * 2.0 - 1.0)` is 0 when `n` is 0.5 and 1 when `n` is 0 or 1. Flip it upside down with `1.0 -`",
        },
        {
          ja: "`v += a * (1.0 - abs(n * 2.0 - 1.0));`",
          en: "`v += a * (1.0 - abs(n * 2.0 - 1.0));`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "小さな惑星", en: "A small planet" },
      prompt: {
        ja: "宇宙に、海だけの青い惑星が浮かんでいます。球の表面の座標 `sp`(経度と緯度)と光の当たり方は用意してあります。`sp` を fBm に入れて、海・浅瀬・陸・砂漠を色分けし、北極と南極を氷で白くしてください。`sp.x` には時間が足してあるので、陸を描けば惑星が回って見えます。余裕があれば、もう 1 つの fBm で白い雲も浮かべてみましょう。",
        en: "A blue planet covered entirely by ocean floats in space. The surface coordinates `sp` (longitude and latitude) and the lighting are already set up. Feed `sp` into fBm to color ocean, shallows, land and desert, and make the north and south poles white with ice. Time is already added to `sp.x`, so once there's land the planet will appear to spin. If you have time, add white clouds with a second fBm.",
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
          vec3 col = vec3(0.01, 0.01, 0.03);
          float r = 0.75;                                  //ja: 惑星の半径 //en: planet radius
          vec2 q = p / r;
          float len = length(q);
          float z = sqrt(max(1.0 - dot(q, q), 0.0));       //ja: 球の手前へのふくらみ //en: how far the sphere bulges toward us
          //ja: 球の表面の座標(経度と緯度)。経度に時間を足して回す
          //en: surface coordinates (longitude, latitude); adding time to longitude spins it
          vec2 sp = vec2(atan(q.x, z) + time * 0.15, asin(clamp(q.y, -1.0, 1.0)));
          float light = clamp(dot(vec3(q, z), normalize(vec3(-0.6, 0.4, 0.7))), 0.0, 1.0);  //ja: 左上から光 //en: lit from the upper left

          vec3 surface = vec3(0.05, 0.2, 0.5);             //ja: ここを書き換える(いまは海だけ) //en: change this (ocean only for now)

          vec3 planet = surface * (0.05 + 0.95 * light);
          float px = 2.0 / resolution.y / r;
          float mask = 1.0 - smoothstep(1.0 - px, 1.0 + px, len);
          col = mix(col, planet, mask);
          float halo = 1.0 - smoothstep(1.0, 1.25, len);  //ja: 大気のぼんやりした光 //en: soft glow of the atmosphere
          col += vec3(0.3, 0.55, 1.0) * halo * halo * (1.0 - mask) * 0.6;
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
          vec3 col = vec3(0.01, 0.01, 0.03);
          float r = 0.75;
          vec2 q = p / r;
          float len = length(q);
          float z = sqrt(max(1.0 - dot(q, q), 0.0));
          vec2 sp = vec2(atan(q.x, z) + time * 0.15, asin(clamp(q.y, -1.0, 1.0)));
          float light = clamp(dot(vec3(q, z), normalize(vec3(-0.6, 0.4, 0.7))), 0.0, 1.0);

          //ja: 高さで色分け: 深い海 → 浅瀬 → 陸 → 砂漠
          //en: color by height: deep sea, shallows, land, desert
          float h = fbm(sp * 1.5);
          vec3 surface = mix(vec3(0.03, 0.12, 0.4), vec3(0.08, 0.35, 0.65), smoothstep(0.3, 0.5, h));
          surface = mix(surface, vec3(0.25, 0.5, 0.2), step(0.5, h));
          surface = mix(surface, vec3(0.65, 0.55, 0.35), step(0.62, h));
          //ja: 緯度が高いほど氷。h を少し混ぜて氷の縁をぎざぎざに
          //en: ice toward the poles; mixing in h makes the ice edge ragged
          surface = mix(surface, vec3(0.95), smoothstep(1.0, 1.2, abs(sp.y) + h * 0.5));
          //ja: もう 1 つの fBm で雲。陸より少し速く流す
          //en: clouds from a second fBm, drifting a bit faster than the land
          float cloud = smoothstep(0.5, 0.75, fbm(sp * 3.0 + vec2(time * 0.05, 7.0)));
          surface = mix(surface, vec3(1.0), cloud * 0.8);

          vec3 planet = surface * (0.05 + 0.95 * light);
          float px = 2.0 / resolution.y / r;
          float mask = 1.0 - smoothstep(1.0 - px, 1.0 + px, len);
          col = mix(col, planet, mask);
          float halo = 1.0 - smoothstep(1.0, 1.25, len);
          col += vec3(0.3, 0.55, 1.0) * halo * halo * (1.0 - mask) * 0.6;
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`float h = fbm(sp * 1.5);` で、球の表面の「高さ」が作れます。あとは [なめらかなノイズ](/learn/value-noise) の地図と同じく、`step` と `mix` で色を重ねます",
          en: "`float h = fbm(sp * 1.5);` gives you a height over the sphere's surface. From there it's just like the map in [Smooth noise](/learn/value-noise): layer the colors with `step` and `mix`",
        },
        {
          ja: "`sp.y` は緯度で、赤道で 0、北極と南極で ±1.57 くらいです。`abs(sp.y)` が大きいところを白くすれば、極の氷になります",
          en: "`sp.y` is the latitude: 0 at the equator and about ±1.57 at the poles. Paint white where `abs(sp.y)` is large to get polar ice",
        },
        {
          ja: "氷は `smoothstep(1.0, 1.2, abs(sp.y) + h * 0.5)` のように `h` を少し足すと、縁が自然なぎざぎざになります。雲は `fbm(sp * 3.0 + vec2(time * 0.05, 7.0))` を `smoothstep` で区切って白を重ねます",
          en: "For the ice, adding a bit of `h`, as in `smoothstep(1.0, 1.2, abs(sp.y) + h * 0.5)`, gives it a natural ragged edge. For clouds, threshold `fbm(sp * 3.0 + vec2(time * 0.05, 7.0))` with `smoothstep` and layer white on top",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "fBm は、細かさを 2 倍・強さを半分にしたノイズ(オクターブ)を何層も重ねたもの。大きな形の上に細部が重なる",
          en: "fBm stacks layers of noise (octaves), each twice as fine and half as strong, so detail sits on top of big shapes",
        },
        {
          ja: "`for` ループで層を重ねる。ループの回数がそのまま層の数で、5〜6 層までを目安に",
          en: "Stack the layers with a `for` loop. The loop count is the number of layers; keep it to 5–6",
        },
        {
          ja: "ラクナリティ(周波数の倍率)とゲイン(振幅の倍率)で質感が変わる。ゲインを変えるなら強さの合計で割る",
          en: "Lacunarity (frequency multiplier) and gain (amplitude multiplier) change the texture. If you change the gain, divide by the total strength",
        },
        {
          ja: "層ごとに `rot(0.5)` で回し、`vec2(17.0, 9.0)` でずらすと、格子のくせと原点のくぼみが消える",
          en: "Rotating each layer with `rot(0.5)` and shifting it by `vec2(17.0, 9.0)` removes grid artifacts and the pit at the origin",
        },
        {
          ja: "値を濃さと見れば雲、高さと見れば山や惑星、熱さと見れば炎になる",
          en: "Read the value as density and you get clouds, as height and you get mountains and planets, as heat and you get fire",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、fBm の値で **座標そのものをゆがめる** ドメインワーピングに進みます。fBm を fBm に入れるだけで、煙や大理石、流れる液体のような模様が生まれます。",
        en: "Next time we move on to domain warping, where fBm values **bend the coordinates themselves**. Just feeding fBm into fBm produces patterns like smoke, marble and flowing liquid.",
      },
    },
  ],
};

export default lesson;
