import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "coordinates",
  title: { ja: "座標を知る", en: "Knowing where you are" },
  summary: {
    ja: "uv と p の 2 つの座標で、画面の上の場所を自由に扱う",
    en: "Work freely with positions on the screen using the two coordinates, uv and p",
  },
  minutes: 45,
  goals: [
    {
      ja: "`uv` の向きと範囲(左下が (0, 0)、右上が (1, 1))を、色にして確かめられる",
      en: "Check the direction and range of `uv` (0, 0 at the bottom left, 1, 1 at the top right) by turning it into color",
    },
    {
      ja: "スウィズル(`.x` `.xy` `.yx` `.rgb`)で、vec の成分を取り出したり並べ替えたりできる",
      en: "Pull out and reorder the parts of a vec with swizzles such as `.x`, `.xy`, `.yx` and `.rgb`",
    },
    {
      ja: "`p` がどう作られているか(中心を原点に、-1〜1 に、縦横比の補正)と、補正しないと円がつぶれる理由がわかる",
      en: "Know how `p` is built (origin at the center, -1 to 1, aspect correction) and why circles get squashed without the correction",
    },
    {
      ja: "`if` や三項演算子 `? :` で、場所によって色を分けられる",
      en: "Give different places different colors with `if` and the ternary operator `? :`",
    },
    {
      ja: "座標を拡大・移動し、わからない値は色にして調べられる",
      en: "Scale and shift coordinates, and inspect any value by turning it into color",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "uv を色で見る", en: "Seeing uv as color" } },
    {
      type: "paragraph",
      text: {
        ja: "前の回 [はじめてのシェーダー](/learn/first-shader) で、`uv.x` が画面の左端で 0.0、右端で 1.0 になることを見ました。`uv` は `vec2` で、数を 2 つ持っています。`uv.x` が横の位置、`uv.y` が縦の位置です。この 2 つを、そのまま赤と緑に入れてみましょう。",
        en: "In [Your first shader](/learn/first-shader) you saw that `uv.x` is 0.0 at the left edge of the screen and 1.0 at the right edge. `uv` is a `vec2`, so it holds two numbers: `uv.x` is the horizontal position and `uv.y` the vertical one. Let's put them straight into red and green.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          return vec4(uv.x, uv.y, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "`uv.y` を `0.0` にすると、横の向きだけが残ります。`uv.x` を `1.0 - uv.x` にすると、赤はどちら向きに増えるでしょう?",
        en: "Change `uv.y` to `0.0` and only the horizontal direction remains. If `uv.x` becomes `1.0 - uv.x`, which way does red grow?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "四隅の色を読むと、`uv` の向きと範囲がわかります。",
        en: "Reading the four corners tells you the direction and range of `uv`.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "左下は黒 … `uv` は (0.0, 0.0)。赤も緑も 0", en: "Bottom left is black … `uv` is (0.0, 0.0): no red, no green" },
        { ja: "右下は赤 … `uv` は (1.0, 0.0)。赤だけが 1", en: "Bottom right is red … `uv` is (1.0, 0.0): only red is 1" },
        { ja: "左上は緑 … `uv` は (0.0, 1.0)。緑だけが 1", en: "Top left is green … `uv` is (0.0, 1.0): only green is 1" },
        { ja: "右上は黄 … `uv` は (1.0, 1.0)。赤 + 緑 = 黄", en: "Top right is yellow … `uv` is (1.0, 1.0): red + green = yellow" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "つまり `uv` は **左下が (0, 0)、右上が (1, 1)** で、y は **上向き** に増えます。数学のグラフと同じ向きです。画像ソフトや Web のページでは「左上が (0, 0) で、y は下向き」のことが多いので、逆になっている点に気をつけてください。",
        en: "So `uv` runs from **(0, 0) at the bottom left to (1, 1) at the top right**, and y grows **upward**, just like a math graph. Image editors and web pages usually put (0, 0) at the top left with y growing downward, so watch out: it is flipped here.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "画面が横長でも、`uv` は横も縦も 0〜1 です。横の 0〜1 のほうが、画面の上では長い距離になります。このずれは、この回の後半で大事になります。",
        en: "Even on a wide screen, `uv` goes from 0 to 1 both across and up. The horizontal 0–1 simply covers a longer distance on screen. That mismatch matters later in this lesson.",
      },
    },

    { type: "heading", text: { ja: "成分を取り出す(スウィズル)", en: "Picking components (swizzling)" } },
    {
      type: "paragraph",
      text: {
        ja: "`vec2`・`vec3`・`vec4` の中の 1 つ 1 つの数を **成分** と呼びます。成分は `.x` `.y` `.z` `.w` で取り出せます。色として使うときのために、同じものが `.r` `.g` `.b` `.a` という名前でも使えます。`.x` と `.r` は、どちらも 1 つ目の成分です。",
        en: "Each number inside a `vec2`, `vec3` or `vec4` is called a **component**. You read components with `.x`, `.y`, `.z` and `.w`. For working with colors, the same components also go by `.r`, `.g`, `.b` and `.a`: `.x` and `.r` both mean the first one.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "便利なのは、名前を **並べて書ける** ことです。`uv.yx` は「y と x をこの順に並べた `vec2`」、`color.rgb` は「`vec4` の最初の 3 つ」、`uv.xxy` は「x、x、y を並べた `vec3`」です。この書き方を **スウィズル**(swizzle、かき混ぜるという意味)と呼びます。",
        en: "The handy part is that you can **string the names together**. `uv.yx` is a `vec2` with y and x in that order, `color.rgb` is the first three components of a `vec4`, and `uv.xxy` is a `vec3` made of x, x and y. This is called **swizzling**.",
      },
    },
    {
      type: "code",
      source: `
        vec2 a = uv.yx;    // (uv.y, uv.x)
        vec3 b = uv.xxy;   // (uv.x, uv.x, uv.y)
        vec4 c = vec4(0.2, 0.4, 0.6, 1.0);
        vec3 d = c.rgb;    // (0.2, 0.4, 0.6)
        float e = c.b;     // 0.6
      `,
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 st = uv.yx;  //ja: x と y を入れ替える //en: swap x and y
          return vec4(st, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "`uv.yx` を `uv.xx` や `uv.yy` にすると? `vec4(st, 0.0, 1.0)` を `vec4(0.0, st, 1.0)` にすると?",
        en: "Try `uv.xx` or `uv.yy` instead of `uv.yx`. What about `vec4(0.0, st, 1.0)` instead of `vec4(st, 0.0, 1.0)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`uv.yx` にすると、赤は上に向かって、緑は右に向かって増えるようになります。左上と右下の色が入れ替わり、左下から右上への斜めの線を軸に、絵が裏返ったように見えます。",
        en: "With `uv.yx`, red now grows upward and green grows to the right. The top-left and bottom-right colors trade places, as if the picture were flipped over the diagonal from bottom left to top right.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "スウィズルは書き込みにも使えます。`color.r = 1.0;` は赤だけを変え、`color.gb *= 0.5;` は緑と青だけを半分にします。`a *= b` は `a = a * b` の短い書き方です(`+=` や `-=` も同じように使えます)。",
        en: "Swizzles work for writing too. `color.r = 1.0;` changes only red, and `color.gb *= 0.5;` halves only green and blue. `a *= b` is short for `a = a * b` (`+=` and `-=` work the same way).",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 color = vec3(0.9, 0.8, 0.3);
          color.r = uv.x;    //ja: 赤だけを書き換える //en: overwrite red only
          color.gb *= uv.y;  //ja: 緑と青だけを uv.y 倍 //en: scale only green and blue by uv.y
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`color.r = uv.x;` を `color.b = uv.x;` にすると? `color.gb *= uv.y;` を `color.rg *= uv.y;` にすると?",
        en: "What if `color.r = uv.x;` becomes `color.b = uv.x;`? And `color.gb *= uv.y;` becomes `color.rg *= uv.y;`?",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "1 つのスウィズルの中で `xyzw` と `rgba` を混ぜることはできません(`uv.xg` はエラー)。また、`vec2` には 3 つ目の成分が無いので、`uv.z` もエラーになります。",
        en: "You cannot mix `xyzw` and `rgba` in one swizzle (`uv.xg` is an error). And since a `vec2` has no third component, `uv.z` is an error too.",
      },
    },

    { type: "heading", text: { ja: "vec を組み立てる", en: "Building vectors" } },
    {
      type: "paragraph",
      text: {
        ja: "`vec3(…)` や `vec4(…)` のかっこの中には、数だけでなく `vec` も入れられます。中身を左から順に並べて、成分の数の合計がちょうどになれば OK です。第 1 回の `vec4(color, 1.0)` は、`vec3` の 3 つ + 数 1 つ = 4 つでした。",
        en: "Inside the parentheses of `vec3(…)` or `vec4(…)` you can put vectors as well as numbers. The parts are laid out left to right, and it works as long as the total count comes out exactly right. In lesson 1, `vec4(color, 1.0)` was three from the `vec3` plus one number: four.",
      },
    },
    {
      type: "code",
      source: `
        vec3 a = vec3(0.5);       //ja: (0.5, 0.5, 0.5) 1 つで全部 //en: (0.5, 0.5, 0.5): one value fills all
        vec3 b = vec3(uv, 0.5);   // (uv.x, uv.y, 0.5)
        vec3 c = vec3(0.5, uv);   // (0.5, uv.x, uv.y)
        vec4 d = vec4(uv, uv);    // (uv.x, uv.y, uv.x, uv.y)
        vec4 e = vec4(b, 1.0);    // (uv.x, uv.y, 0.5, 1.0)
        vec2 f = vec2(c.z, 1.0);  // (uv.y, 1.0)
      `,
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 color = vec3(0.5, uv);  //ja: 赤は 0.5、緑は uv.x、青は uv.y //en: red 0.5, green uv.x, blue uv.y
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`vec3(uv, 0.5)` や `vec3(uv.y, 0.3, uv.x)` にすると、四隅の色はどう変わるでしょう?",
        en: "Try `vec3(uv, 0.5)` or `vec3(uv.y, 0.3, uv.x)`. How do the four corners change?",
      },
    },

    { type: "heading", text: { ja: "中心を原点にする", en: "Putting the origin at the center" } },
    {
      type: "paragraph",
      text: {
        ja: "`uv` は左下が原点 (0, 0) でした。でも、円や回転のように「真ん中から外へ」広がる形を描くときは、**画面の中心が (0, 0)** のほうがずっと扱いやすくなります。`uv` から作り直してみましょう。",
        en: "`uv` has its origin (0, 0) at the bottom left. But for shapes that spread out from the middle, like circles or rotations, it is far easier when **the center of the screen is (0, 0)**. Let's build that from `uv`.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: [
        {
          ja: "`uv - 0.5` … 0〜1 が -0.5〜0.5 になる。中心が (0, 0) に",
          en: "`uv - 0.5` … 0 to 1 becomes -0.5 to 0.5, so the center is now (0, 0)",
        },
        {
          ja: "`* 2.0` … -0.5〜0.5 が -1〜1 になる。端がちょうど ±1 に",
          en: "`* 2.0` … -0.5 to 0.5 becomes -1 to 1, so the edges land exactly on ±1",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "たとえば、右端の高さのまん中は `uv` で (1.0, 0.5) です。0.5 を引くと (0.5, 0.0)、2 倍すると (1.0, 0.0) になります。`vec2` から数を 1 つ引いたりかけたりすると、x と y の両方に同じ計算がされます。",
        en: "For example, the middle of the right edge is (1.0, 0.5) in `uv`. Subtracting 0.5 gives (0.5, 0.0), and doubling gives (1.0, 0.0). When you subtract or multiply a `vec2` by a single number, both x and y get the same treatment.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv - 0.5;  //ja: 中心を (0, 0) に //en: the center becomes (0, 0)
          q = q * 2.0;        //ja: -1〜1 に広げる //en: stretch to -1..1
          return vec4(q, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "色が出るのは右上の 4 分の 1 だけです。`vec4(q, 0.0, 1.0)` を `vec4(-q, 0.0, 1.0)` にすると、どこが光るでしょう?",
        en: "Only the top-right quarter has any color. If you change `vec4(q, 0.0, 1.0)` to `vec4(-q, 0.0, 1.0)`, which part lights up?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "左半分と下半分が真っ黒になりました。そこでは `q.x` や `q.y` が **マイナス** だからです。画面は 0.0 より小さい色を 0.0 として表示するので、マイナスの値はどれも同じ黒に見えます。値が無いのではなく、見えていないだけです。`-q` にすると符号が逆になり、こんどは左下の 4 分の 1 が光ります。",
        en: "The left half and the bottom half went pitch black. That is because `q.x` or `q.y` is **negative** there. The screen shows any color below 0.0 as 0.0, so every negative value looks the same black. The values are there; you just can't see them. With `-q` the signs flip, and now the bottom-left quarter lights up instead.",
      },
    },

    { type: "heading", text: { ja: "if で画面を分ける", en: "Splitting the screen with if" } },
    {
      type: "paragraph",
      text: {
        ja: "中心が原点になると、「右か左か」は `q.x` が 0 より大きいかどうかでわかります。条件によって違うことをしたいときは `if` を使います。下のコードの `(uv - 0.5) * 2.0` は、さっきの 2 行を 1 行にまとめたものです。",
        en: "With the origin at the center, \"left or right?\" is just whether `q.x` is above 0. To do different things depending on a condition, use `if`. In the code below, `(uv - 0.5) * 2.0` is the previous two lines squeezed into one.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 q = (uv - 0.5) * 2.0;
          vec3 color;
          if (q.x < 0.0) {
            color = vec3(0.15, 0.45, 0.9);  //ja: 左は青 //en: left: blue
          } else {
            color = vec3(1.0, 0.6, 0.15);   //ja: 右はオレンジ //en: right: orange
          }
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`q.x < 0.0` を `q.y < 0.0` にすると? `q.x < 0.5` にすると、境目はどこへ動くでしょう?",
        en: "What if `q.x < 0.0` becomes `q.y < 0.0`? With `q.x < 0.5`, where does the border move?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`if (条件) { … } else { … }` は、条件が正しいときは前の `{ }` の中を、そうでないときは `else` の後の `{ }` の中を動かします。比べる記号は `<`(より小さい)、`>`(より大きい)、`<=`(以下)、`>=`(以上)、`==`(等しい)、`!=`(等しくない)です。条件どうしは `&&`(かつ)や `||`(または)でつなげます。",
        en: "`if (condition) { … } else { … }` runs the first `{ }` when the condition holds and the `{ }` after `else` when it doesn't. The comparisons are `<` (less than), `>` (greater than), `<=` (at most), `>=` (at least), `==` (equal) and `!=` (not equal). Join conditions with `&&` (and) or `||` (or).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "値を 1 つ選ぶだけなら、**三項演算子** `条件 ? A : B` を使うと短く書けます。条件が正しければ A、そうでなければ B になります。また、`if` の中身が 1 文だけなら `{ }` を省けます。",
        en: "When all you need is to pick one value, the **ternary operator** `condition ? A : B` is shorter: it gives A when the condition holds and B otherwise. Also, if an `if` body is a single statement, you can leave out the `{ }`.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 q = (uv - 0.5) * 2.0;
          vec3 color = q.x < 0.0 ? vec3(0.15, 0.45, 0.9) : vec3(1.0, 0.6, 0.15);
          color *= q.y < 0.0 ? 0.5 : 1.0;                          //ja: 下半分は暗く //en: darker in the bottom half
          if (q.x > 0.0 && q.y > 0.0) color = vec3(1.0, 0.9, 0.4);  //ja: 右上だけ黄色 //en: top right only: yellow
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`&&` を `||` にすると、黄色になる場所はどう変わるでしょう? `0.5` を `0.2` にすると?",
        en: "If you change `&&` to `||`, where does the yellow go? What about changing `0.5` to `0.2`?",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`? :` の A と B は同じ型にします。`q.x < 0.0 ? 1.0 : vec3(0.0)` のように `float` と `vec3` を混ぜるとエラーです。",
        en: "A and B in `? :` must have the same type. Mixing a `float` and a `vec3`, as in `q.x < 0.0 ? 1.0 : vec3(0.0)`, is an error.",
      },
    },

    { type: "heading", text: { ja: "縦横比を直す", en: "Fixing the aspect ratio" } },
    {
      type: "paragraph",
      text: {
        ja: "いよいよ円を描きます。中心からの距離は `length(q)` で求められます(くわしくは [円と距離](/learn/circles-and-distance) で扱います)。距離が 0.6 より小さい点を明るくすれば、半径 0.6 の円になる…はずです。",
        en: "Time to draw a circle. `length(q)` gives the distance from the center (we cover it properly in [Circles and distance](/learn/circles-and-distance)). Light up every point closer than 0.6 and you get a circle of radius 0.6… or so you'd think.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 q = (uv - 0.5) * 2.0;
          // q.x *= resolution.x / resolution.y;
          vec3 color = length(q) < 0.6 ? vec3(1.0, 0.8, 0.3) : vec3(0.1, 0.12, 0.25);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "円が横に伸びて、楕円になっています。3 行目の先頭の `//` を消すと?",
        en: "The circle is stretched sideways into an oval. What happens when you delete the `//` at the start of line 3?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "原因は、画面が横長なのに `q` が横も縦も -1〜1 だからです。プレビューが横 800、縦 450 ピクセルだとしましょう。横は 800 ピクセルで 2 進むので、`q.x` の 1 は 400 ピクセルです。縦は 450 ピクセルで 2 進むので、`q.y` の 1 は 225 ピクセルです。同じ「0.6」でも、横には 240 ピクセル、縦には 135 ピクセルしか伸びません。だから円が横長になります。",
        en: "The cause: the screen is wide, but `q` runs from -1 to 1 in both directions. Say the preview is 800 by 450 pixels. Horizontally, `q` covers 2 units in 800 pixels, so 1 unit of `q.x` is 400 pixels. Vertically it covers 2 units in 450 pixels, so 1 unit of `q.y` is 225 pixels. The same \"0.6\" reaches 240 pixels sideways but only 135 pixels up and down — hence the wide oval.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "直すには、`q.x` に **縦横比**(横の長さ ÷ 縦の長さ)をかけます。800 ÷ 450 は約 1.78 なので、`q.x` は -1.78〜1.78 になります。これで横も縦も「1 = 225 ピクセル」にそろい、円が丸くなります。ここで使った `resolution` は、描いている大きさをピクセルで持っている uniform です。`resolution.x` が横、`resolution.y` が縦のピクセル数です。",
        en: "The fix is to multiply `q.x` by the **aspect ratio** (width ÷ height). 800 ÷ 450 is about 1.78, so `q.x` now runs from -1.78 to 1.78. Now 1 unit is 225 pixels in both directions, and the circle comes out round. The `resolution` used here is a uniform holding the drawing size in pixels: `resolution.x` is the width and `resolution.y` the height.",
      },
    },

    { type: "heading", text: { ja: "p はこうして作られている", en: "This is how p is made" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまで自分で作ってきた `q` は、`render` に渡されている `p` とまったく同じものです。サイトの側で、次の 2 行を計算してから `render` を呼んでいます。",
        en: "The `q` you have been building by hand is exactly the `p` that `render` receives. Before calling `render`, the site computes these two lines:",
      },
    },
    {
      type: "code",
      source: `
        vec2 p = (uv - 0.5) * 2.0;
        p.x *= resolution.x / resolution.y;
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "なので、これからは `q` を作らずに `p` をそのまま使えます。`p` の性質をまとめておきます。",
        en: "So from now on you can skip building `q` and just use `p`. Here is what to remember about `p`:",
      },
    },
    {
      type: "list",
      items: [
        { ja: "画面の中心が (0, 0)", en: "The center of the screen is (0, 0)" },
        { ja: "`p.y` は下の端で -1、上の端で 1", en: "`p.y` is -1 at the bottom edge and 1 at the top edge" },
        {
          ja: "`p.x` の範囲は画面の形で変わる。16:9 なら -1.78〜1.78、4:3 なら -1.33〜1.33",
          en: "The range of `p.x` depends on the screen shape: -1.78 to 1.78 at 16:9, -1.33 to 1.33 at 4:3",
        },
        {
          ja: "x と y の 1 の長さが同じなので、円が丸く描ける",
          en: "One unit is the same length in x and y, so circles come out round",
        },
      ],
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 color = vec3(0.12, 0.14, 0.22);
          if (p.x > -1.0 && p.x < 1.0) color = vec3(0.2, 0.3, 0.5);  //ja: x も -1〜1 の正方形 //en: the square where x is also -1..1
          if (length(p) < 1.0) color = vec3(0.95, 0.75, 0.3);         //ja: 半径 1 の円 //en: a circle of radius 1
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "半径 1 の円が、上と下の端にちょうど接しています。円の `1.0` を `0.5` にすると? 正方形の左右の外側が、`p.x` が ±1 を超える部分です",
        en: "The radius-1 circle just touches the top and bottom edges. What if the circle's `1.0` becomes `0.5`? The strips left and right of the square are where `p.x` goes past ±1",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "使い分けの目安は、画面全体に広がるグラデーションや「端から端までの割合」を使いたいときは `uv`、図形を描くときは `p` です。",
        en: "A rule of thumb: use `uv` for gradients across the whole screen or anything measured as a fraction from edge to edge, and use `p` for drawing shapes.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "作品を見る画面の形は、人によって違います。大事なものは `p.y` が -1〜1、`p.x` が -1.3〜1.3 の中に置いておくと、4:3 から 16:9 までのどの画面でも切れずに見えます。",
        en: "Viewers' screens come in different shapes. Keep the important things within -1 to 1 in `p.y` and -1.3 to 1.3 in `p.x`, and they stay visible on anything from 4:3 to 16:9.",
      },
    },

    { type: "heading", text: { ja: "座標を拡大する・ずらす", en: "Scaling and shifting coordinates" } },
    {
      type: "paragraph",
      text: {
        ja: "座標に数をかけたり足したりすると、絵の見え方が変わります。まず、`uv * 3.0` をそのまま色にしてみましょう。",
        en: "Multiplying or adding numbers to coordinates changes how the picture looks. First, turn `uv * 3.0` directly into color.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 st = uv * 3.0;  //ja: 0〜1 が 0〜3 に //en: 0..1 becomes 0..3
          return vec4(st, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "`3.0` を `1.5` や `10.0` にすると? `uv * 3.0` を `fract(uv * 3.0)` にすると?(`fract` は小数の部分だけを取り出す関数です)",
        en: "Try `1.5` or `10.0` instead of `3.0`. What about `fract(uv * 3.0)`? (`fract` keeps only the part after the decimal point)",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "画面のほとんどが黄色になりました。`st` は 0〜3 まで増えますが、色は 1.0 で頭打ちなので、1 を超えたところは全部同じ色に見えます。グラデーションが見えるのは、`st` が 0〜1 に収まる左下の 3 分の 1 だけです。座標の数が大きくなったぶん、同じ変化が **ぎゅっと縮んで** 見えるのです。キャプションの `fract` を試すと、0〜1 がくり返されて、マス目が 3 × 3 = 9 つ並びます(くわしくは [くり返しとタイル](/learn/repetition) で)。",
        en: "Most of the screen turned yellow. `st` grows to 3, but color tops out at 1.0, so everything past 1 looks the same. The gradient only shows in the bottom-left third, where `st` stays within 0–1. Because the coordinate numbers got bigger, the same change is **squeezed** into a smaller area. Try the `fract` from the caption and 0–1 repeats, giving a 3 × 3 grid of nine tiles (more in [Repetition and tiles](/learn/repetition)).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "図形でも同じことが起きます。座標を 2 倍すると、図形は **半分の大きさ** に見えます。座標から `vec2(0.5, 0.0)` を引くと、図形は **右へ 0.5** 動きます。どちらも直感と逆向きですが、理由はかんたんです。円は「`q` の長さが 0.5 より小さいところ」でした。`q = p * 2.0` なら、`p` の長さが 0.25 のところで、もう `q` の長さは 0.5 に届きます。だから円の半径は 0.25 になります。ずらすほうも、`q = p - vec2(0.5, 0.0)` が (0, 0) になるのは `p` が (0.5, 0.0) のところなので、円の中心がそこへ動きます。",
        en: "Shapes behave the same way. Doubling the coordinates makes a shape look **half the size**. Subtracting `vec2(0.5, 0.0)` from the coordinates moves a shape **0.5 to the right**. Both feel backwards, but the reason is simple. A circle is \"where the length of `q` is under 0.5\". With `q = p * 2.0`, `q` already reaches length 0.5 where `p` has length 0.25, so the circle's radius becomes 0.25. Likewise, `q = p - vec2(0.5, 0.0)` is (0, 0) where `p` is (0.5, 0.0), so that is where the circle's center ends up.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 q = p - vec2(0.5, 0.0);  //ja: ずらす //en: shift
          q = q * 1.0;                   //ja: 拡大・縮小 //en: scale
          vec3 color = length(q) < 0.5 ? vec3(1.0, 0.8, 0.3) : vec3(0.1, 0.12, 0.25);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`q * 1.0` を `q * 2.0` にすると円は小さく、`q * 0.5` にすると大きくなります。`vec2(0.5, 0.0)` を `vec2(-0.6, 0.3)` にすると?",
        en: "Change `q * 1.0` to `q * 2.0` and the circle shrinks; `q * 0.5` makes it bigger. What happens with `vec2(-0.6, 0.3)` instead of `vec2(0.5, 0.0)`?",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "「座標を動かすと、図形は逆に動く」は、この先何度も出てくる大事な考え方です。[座標を動かす](/learn/transforms) の回で、回転も加えてくわしく扱います。",
        en: "\"Move the coordinates and the shape moves the opposite way\" is a key idea that comes up again and again. [Moving space](/learn/transforms) covers it in depth, rotation included.",
      },
    },

    { type: "heading", text: { ja: "値を色で見る(デバッグ)", en: "Seeing values as color (debugging)" } },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーには、値を文字で表示する方法がありません。そのかわり、**知りたい値を色にして返す** のが、いちばん手軽で強力な調べ方です。思ったとおりに動かないときは、途中の値を `return vec4(vec3(値), 1.0);` のように返して見てみましょう。このように、まちがいの原因を探して直すことを **デバッグ** と呼びます。",
        en: "Shaders have no way to print a value as text. Instead, the simplest and most powerful way to investigate is to **return the value you want to know as a color**. When something doesn't behave, return an intermediate value with something like `return vec4(vec3(value), 1.0);` and look at it. Hunting down and fixing mistakes like this is called **debugging**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "気をつけたいのは、色は 0〜1 の外が見えないことです。マイナスは黒に、1 より大きい値は白(か、その色のいっぱい)に張りつきます。-1〜1 の値なら、第 1 回の `sin` と同じく `* 0.5 + 0.5` で 0〜1 に直してから見ると、0 がちょうど灰色になって、プラスとマイナスの両方が見えます。範囲を超えたところには、目立つ色を付けておくと便利です。",
        en: "The catch is that color can't show anything outside 0–1: negatives stick to black, and values above 1 stick to white (or full strength of that color). For a value in -1 to 1, map it to 0–1 with `* 0.5 + 0.5`, just as with `sin` in lesson 1. Zero then shows as mid gray, and you can see both the positive and negative sides. It also helps to paint out-of-range spots in a loud color.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float v = p.x;                               //ja: 調べたい値 //en: the value to inspect
          vec3 color = vec3(v * 0.5 + 0.5);            //ja: -1〜1 を 0〜1 の灰色に //en: map -1..1 to a 0..1 gray
          if (v > 1.0) color = vec3(1.0, 0.3, 0.3);    //ja: 1 より大きい: 赤 //en: above 1: red
          if (v < -1.0) color = vec3(0.3, 0.5, 1.0);   //ja: -1 より小さい: 青 //en: below -1: blue

          //ja: 軸の線(幅 2 ピクセル)
          //en: axis lines (2 pixels wide)
          float px = 2.0 / resolution.y;
          if (p.x > -px && p.x < px) color = vec3(0.2, 1.0, 0.4);
          if (p.y > -px && p.y < px) color = vec3(0.2, 1.0, 0.4);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`v` を `p.y` や `p.x * p.y`、`uv.x - uv.y` に変えて、どこがプラスでどこがマイナスか見てみましょう",
        en: "Set `v` to `p.y`, `p.x * p.y` or `uv.x - uv.y` and see where each one is positive or negative",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`p.x` を見ると、左右の端に赤と青の帯が出ます。`p.x` は縦横比のぶんだけ ±1 を超えるからです。緑の十字は x 軸と y 軸です。ここで使った `2.0 / resolution.y` は、`p` の単位での **1 ピクセルの大きさ** です。`p.y` は縦の `resolution.y` ピクセルで 2 進むので、1 ピクセルでは `2.0 / resolution.y` 進みます。高さ 450 ピクセルなら約 0.0044 です。この値は [円と距離](/learn/circles-and-distance) で、縁をなめらかにするのに使います。",
        en: "Looking at `p.x`, red and blue strips appear at the left and right edges, because `p.x` goes past ±1 by the aspect ratio. The green cross is the x and y axes. The `2.0 / resolution.y` used here is **the size of one pixel** in `p` units: `p.y` covers 2 units over `resolution.y` pixels, so one pixel is `2.0 / resolution.y`. At 450 pixels tall that is about 0.0044. In [Circles and distance](/learn/circles-and-distance) we use it to smooth edges.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "座標を使って、場所ごとに色を決める練習をしましょう。詰まったらヒントを 1 つずつ開けてください。",
        en: "Practice deciding colors by position. If you get stuck, open the hints one at a time.",
      },
    },
    {
      type: "exercise",
      title: { ja: "4 つの部屋", en: "Four rooms" },
      prompt: {
        ja: "画面を中心で上下左右の 4 つに分けて、左上・右上・左下・右下をそれぞれ違う色にしてください。できたら、境目に細い白い十字の線も引きましょう。",
        en: "Split the screen at the center into four rooms and give top left, top right, bottom left and bottom right each a different color. Then draw a thin white cross along the borders.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 color = p.x < 0.0 ? vec3(0.9, 0.3, 0.4) : vec3(0.2, 0.6, 0.9);
          return vec4(color, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 color;
          if (p.y > 0.0) {
            color = p.x < 0.0 ? vec3(0.9, 0.3, 0.4) : vec3(0.2, 0.6, 0.9);    //ja: 上の 2 部屋 //en: the top two rooms
          } else {
            color = p.x < 0.0 ? vec3(0.95, 0.75, 0.2) : vec3(0.3, 0.8, 0.5);  //ja: 下の 2 部屋 //en: the bottom two rooms
          }
          //ja: 境目の十字(幅 4 ピクセル)
          //en: the cross on the borders (4 pixels wide)
          float px = 2.0 / resolution.y;
          if ((p.x > -2.0 * px && p.x < 2.0 * px) || (p.y > -2.0 * px && p.y < 2.0 * px)) color = vec3(1.0);
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "上か下かは `p.y` の符号で、左か右かは `p.x` の符号でわかります",
          en: "The sign of `p.y` tells you top or bottom; the sign of `p.x` tells you left or right",
        },
        {
          ja: "`if (p.y > 0.0) { … } else { … }` の中で、それぞれ `p.x < 0.0 ? … : …` を使うと 4 通りに分けられます",
          en: "Inside `if (p.y > 0.0) { … } else { … }`, use `p.x < 0.0 ? … : …` in each branch to get four cases",
        },
        {
          ja: "線は「細い範囲」で作れます。縦の線なら `p.x > -2.0 * px && p.x < 2.0 * px`(`px = 2.0 / resolution.y`)。横の線と `||` でつなぎます",
          en: "A line is just a thin range. The vertical one is `p.x > -2.0 * px && p.x < 2.0 * px` (with `px = 2.0 / resolution.y`); join it to the horizontal one with `||`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "まん丸の月", en: "A perfectly round moon" },
      prompt: {
        ja: "`uv` だけで描いた右上の月が、横長の楕円になっています。`uv` の座標を使ったまま、月をまん丸に直してください。月の中心の位置は変えないこと。",
        en: "The moon in the upper right is drawn with `uv` alone, and it came out as a wide oval. Keep using `uv`, but make the moon perfectly round — without moving its center.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv - vec2(0.75, 0.7);  //ja: 月の中心からの位置 //en: position relative to the moon's center
          vec3 sky = vec3(0.05, 0.07, 0.2) + uv.y * vec3(0.1, 0.15, 0.3);
          vec3 color = length(q) < 0.12 ? vec3(1.0, 0.95, 0.75) : sky;
          return vec4(color, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv - vec2(0.75, 0.7);
          q.x *= resolution.x / resolution.y;  //ja: 中心を引いた後で、横だけ縦横比をかける //en: after subtracting the center, scale x by the aspect ratio
          vec3 sky = vec3(0.05, 0.07, 0.2) + uv.y * vec3(0.1, 0.15, 0.3);
          vec3 color = length(q) < 0.12 ? vec3(1.0, 0.95, 0.75) : sky;
          //ja: おまけ: クレーター
          //en: bonus: craters
          if (length(q - vec2(0.04, 0.03)) < 0.03) color *= 0.85;
          if (length(q - vec2(-0.05, -0.04)) < 0.02) color *= 0.85;
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "楕円になるのは、`uv` の横の 1 と縦の 1 が、画面の上で違う長さだからでした",
          en: "It is an oval because one unit of `uv` across and one unit up are different lengths on screen",
        },
        {
          ja: "`p` を作るときと同じように、x にだけ `resolution.x / resolution.y` をかけます",
          en: "Just as when `p` is built, multiply only x by `resolution.x / resolution.y`",
        },
        {
          ja: "`q` を作った次の行に `q.x *= resolution.x / resolution.y;` を書き足します。中心を引いた **後で** かけるのがポイントです(先にかけると、中心の位置までずれます)",
          en: "Add `q.x *= resolution.x / resolution.y;` on the line after `q`. The key is to scale **after** subtracting the center (scaling first shifts the center too)",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "地平線と太陽", en: "Horizon and sun" },
      prompt: {
        ja: "下が明るいオレンジ、上が深い青になる空に、地平線(`p.y = -0.3`)に半分沈んだ太陽を描いてください。地平線より下は地面の色にします。太陽の中心は (0.0, -0.3)、半径は 0.4 です。",
        en: "Paint a sky that is bright orange at the bottom and deep blue at the top, with a sun half sunk below the horizon at `p.y = -0.3`. Below the horizon, use a ground color. The sun's center is (0.0, -0.3) and its radius is 0.4.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 color = vec3(0.5, 0.7, 1.0);  //ja: 空(上下で変わるようにする) //en: sky (make it change with height)
          //ja: 太陽と地面をここに書き足す
          //en: add the sun and the ground here
          return vec4(color, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          //ja: 空: 下で 1 になる (1.0 - uv.y) と、上で 1 になる uv.y で 2 色に重みを付けて足す
          //en: sky: weight two colors by (1.0 - uv.y), which is 1 at the bottom, and uv.y, which is 1 at the top
          vec3 color = vec3(1.0, 0.6, 0.3) * (1.0 - uv.y) + vec3(0.15, 0.25, 0.6) * uv.y;
          //ja: 太陽: 中心 (0.0, -0.3)、半径 0.4
          //en: sun: center (0.0, -0.3), radius 0.4
          if (length(p - vec2(0.0, -0.3)) < 0.4) color = vec3(1.0, 0.85, 0.4);
          //ja: 地面: 太陽より後に書くと、太陽の下半分を隠せる
          //en: ground: written after the sun, it hides the sun's lower half
          if (p.y < -0.3) color = vec3(0.1, 0.25, 0.15) + p.y * 0.05;
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "空は `uv.y` で決めます。下で 1、上で 0 になる `1.0 - uv.y` と、その逆の `uv.y` を、2 つの色にかけて足すとグラデーションになります([色を混ぜる](/learn/mixing-colors) で出てくる `mix` と同じ考え方です)",
          en: "Base the sky on `uv.y`. Multiply one color by `1.0 - uv.y` (1 at the bottom, 0 at the top) and the other by `uv.y`, then add them for a gradient (the same idea as the `mix` you'll meet in [Mixing colors](/learn/mixing-colors))",
        },
        {
          ja: "太陽は「中心からの距離が半径より小さい」場所です。中心をずらすには `p - vec2(0.0, -0.3)` の長さを使います",
          en: "The sun is wherever the distance from its center is less than the radius. To move the center, take the length of `p - vec2(0.0, -0.3)`",
        },
        {
          ja: "後に書いた `if` が上に塗られます。地面の `if (p.y < -0.3)` を太陽より後に書くと、太陽の下半分が地面に隠れます",
          en: "Whichever `if` comes later paints on top. Put the ground's `if (p.y < -0.3)` after the sun, and the ground hides the sun's lower half",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`uv` は左下が (0, 0)、右上が (1, 1)。y は上向き",
          en: "`uv` goes from (0, 0) at the bottom left to (1, 1) at the top right; y points up",
        },
        {
          ja: "スウィズル(`.xy` `.yx` `.rgb` など)で、成分の取り出し・並べ替え・書き換えができる",
          en: "Swizzles (`.xy`, `.yx`, `.rgb` and so on) read, reorder and overwrite components",
        },
        {
          ja: "`p` は中心が原点、`p.y` は -1〜1、`p.x` は縦横比をかけた範囲。だから円が丸く描ける",
          en: "`p` has its origin at the center, `p.y` from -1 to 1 and `p.x` scaled by the aspect ratio, so circles come out round",
        },
        {
          ja: "`if` と `条件 ? A : B` で、場所ごとに色を分けられる",
          en: "`if` and `condition ? A : B` give different places different colors",
        },
        {
          ja: "座標を 2 倍すると図形は半分に、座標から引くと図形はその向きへ動く",
          en: "Doubling the coordinates halves a shape; subtracting from them moves the shape that way",
        },
        {
          ja: "わからない値は、色にして見る。マイナスは黒、1 より上は張りつくことに注意",
          en: "When unsure about a value, look at it as a color — remembering that negatives show as black and anything above 1 is clipped",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、`step` や `smoothstep` などの関数で数の形を変えて、線やグラフ、しま模様を描きます。",
        en: "Next time we bend numbers with functions like `step` and `smoothstep`, and use them to draw lines, graphs and stripes.",
      },
    },
  ],
};

export default lesson;
