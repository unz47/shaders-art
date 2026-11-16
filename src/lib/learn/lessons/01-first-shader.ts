import type { Lesson } from "../types";

// 第 1 回。ほかの回を書くときの見本(文体・ブロックの使い方・課題の作り方)でもある。

const lesson: Lesson = {
  slug: "first-shader",
  title: { ja: "はじめてのシェーダー", en: "Your first shader" },
  summary: {
    ja: "シェーダーが「画面の全部の点で同時に動く関数」だと知り、最初の 1 色を出す",
    en: "Learn that a shader is a function that runs for every pixel at once, and paint your first color",
  },
  minutes: 30,
  // 目次の絵。この回で習う uv と time だけで描ける
  cover: `
    vec4 render(vec2 uv, vec2 p) {
      return vec4(uv.x, uv.y, 0.5 + 0.5 * sin(time), 1.0);
    }
  `,
  goals: [
    {
      ja: "シェーダーが、ピクセル 1 つぶんの色を決める小さな関数だとわかる",
      en: "Understand that a shader is a small function that decides the color of one pixel",
    },
    {
      ja: "`render` 関数が返す `vec4` で、色(赤・緑・青・不透明度)を指定できる",
      en: "Choose a color (red, green, blue, opacity) with the `vec4` that `render` returns",
    },
    {
      ja: "`float`・`vec3`・`vec4` の書き方と、`1.0` のように小数点を付ける理由がわかる",
      en: "Write `float`, `vec3` and `vec4`, and know why we write `1.0` instead of `1`",
    },
    {
      ja: "コンパイルエラーの文を読んで、自分で直せる",
      en: "Read a compile error and fix it yourself",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "シェーダーってなに?", en: "What is a shader?" } },
    {
      type: "paragraph",
      text: {
        ja: "画面は、小さな点(ピクセル)がびっしり並んでできています。フル HD の画面なら、およそ 200 万個です。**シェーダー**は、そのうちの **1 つの点の色を決める** 小さなプログラムです。",
        en: "A screen is made of tiny dots called pixels. A Full HD screen has about two million of them. A **shader** is a small program that **decides the color of a single pixel**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "1 つの点のためのプログラムを、どうやって画面全体に使うのでしょう。答えは、GPU(グラフィックス用の計算装置)が **同じプログラムを全部の点で同時に** 動かす、です。しかも 1 秒に 60 回ほど、毎回やり直します。",
        en: "How does a program for one pixel paint the whole screen? The GPU (the graphics processor) runs **the same program for every pixel at the same time** — and does it again about 60 times per second.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "このサイトでは、その小さなプログラムを `render` という名前の関数として書きます。言語は **GLSL**(ジーエルエスエル)です。形はいつも次のとおりです。",
        en: "On this site you write that small program as a function named `render`, in a language called **GLSL**. It always looks like this:",
      },
    },
    {
      type: "code",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          //ja: ここに、この点の色を決める計算を書く
          //en: the math that decides this pixel's color goes here
          return vec4(1.0, 0.5, 0.0, 1.0);
        }
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "先頭の `vec4` は、この関数が返すものの型です。色は数を 4 つ並べた `vec4` で表します",
          en: "The leading `vec4` is the type of what the function returns. A color is a `vec4`: four numbers in a row",
        },
        {
          ja: "`uv` と `p` は、いま色を決めようとしている点の **場所** です。この回の後半で少し使い、次の回でくわしく見ます",
          en: "`uv` and `p` tell you **where** the pixel being colored is. We peek at them later in this lesson and dig in next time",
        },
        {
          ja: "`//` から行の終わりまでは **コメント** で、プログラムとしては無視されます。メモを書いておく場所です",
          en: "Everything from `//` to the end of the line is a **comment**. The computer ignores it; it is a place for notes",
        },
        {
          ja: "`return` で、決めた色を返します。文の終わりには `;` を付けます",
          en: "`return` hands back the color you chose. Every statement ends with `;`",
        },
      ],
    },

    { type: "heading", text: { ja: "最初の 1 色", en: "Your first color" } },
    {
      type: "paragraph",
      text: {
        ja: "下のコードは、どの点にも同じオレンジ色を返します。全部の点が同じ答えを返すので、画面全体がオレンジになります。数を書き換えると、右のプレビューがすぐに変わります。",
        en: "The code below returns the same orange for every pixel. Since every pixel gives the same answer, the whole screen turns orange. Change the numbers and the preview updates right away.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          return vec4(1.0, 0.5, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "1 つ目の `1.0` を `0.0` にすると? 3 つ目の `0.0` を `1.0` にすると?",
        en: "What happens if the first `1.0` becomes `0.0`? What if the third `0.0` becomes `1.0`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`vec4` の 4 つの数は、順に **赤・緑・青・不透明度** です(頭文字をとって RGBA と呼びます)。どれも **0.0 から 1.0** の範囲で、0.0 が「まったく無い」、1.0 が「いっぱい」です。画像ソフトでよく見る 0〜255 ではないので気をつけてください。",
        en: "The four numbers in `vec4` are **red, green, blue and opacity**, in that order (RGBA for short). Each goes from **0.0 to 1.0**: 0.0 means none and 1.0 means full. Note that this is not the 0–255 range you may know from image editors.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "`vec4(1.0, 0.0, 0.0, 1.0)` … 赤", en: "`vec4(1.0, 0.0, 0.0, 1.0)` … red" },
        { ja: "`vec4(1.0, 1.0, 0.0, 1.0)` … 黄(赤 + 緑)", en: "`vec4(1.0, 1.0, 0.0, 1.0)` … yellow (red + green)" },
        { ja: "`vec4(0.0, 0.0, 0.0, 1.0)` … 黒", en: "`vec4(0.0, 0.0, 0.0, 1.0)` … black" },
        { ja: "`vec4(1.0, 1.0, 1.0, 1.0)` … 白", en: "`vec4(1.0, 1.0, 1.0, 1.0)` … white" },
        { ja: "`vec4(0.5, 0.5, 0.5, 1.0)` … 灰色(3 つが同じなら灰色)", en: "`vec4(0.5, 0.5, 0.5, 1.0)` … gray (equal amounts make gray)" },
      ],
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "光の色は、絵の具とは逆に **足すほど明るく** なります。赤と緑の光を足すと黄色、3 色を全部足すと白です。",
        en: "Light mixes the opposite way from paint: **adding makes it brighter**. Red light plus green light is yellow, and all three together make white.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "4 つ目の不透明度は、このサイトの作品では `1.0` のままにしておきます。作品は 1 枚の絵として描かれ、下に透けて見えるものが無いからです。",
        en: "Keep the fourth number, opacity, at `1.0` for works on this site. A work is drawn as a single picture, so there is nothing underneath to show through.",
      },
    },

    { type: "heading", text: { ja: "1 と 1.0 は違う", en: "1 and 1.0 are different" } },
    {
      type: "paragraph",
      text: {
        ja: "GLSL は、整数(`int`)と小数(`float`)をきっちり区別します。色や座標の計算はほとんどが小数なので、数には **いつも小数点を付けて** `1.0` や `0.5` と書く習慣にしましょう。",
        en: "GLSL is strict about whole numbers (`int`) versus decimal numbers (`float`). Almost everything in color and position math is a decimal, so make a habit of **always writing the decimal point**: `1.0`, `0.5`.",
      },
    },
    {
      type: "code",
      source: `
        float a = 1.0;        // OK
        float b = 1;          //ja: エラー: int を float に入れようとしている //en: error: putting an int into a float
        float c = 0.5 * 2.0;  // OK
        float d = 0.5 * 2;    //ja: エラー: float と int はそのまま計算できない //en: error: float times int
      `,
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`vec4(1, 0, 0, 1)` のように `vec4(…)` の中に整数を書くのは、例外的に許されます(自動で小数に直されます)。それでも、ほかの場所でつまずかないよう、いつも `1.0` と書いておくのがおすすめです。",
        en: "As an exception, integers inside a constructor like `vec4(1, 0, 0, 1)` are allowed — they are converted for you. Still, writing `1.0` everywhere keeps you from tripping elsewhere.",
      },
    },

    { type: "heading", text: { ja: "変数に名前を付ける", en: "Giving values names" } },
    {
      type: "paragraph",
      text: {
        ja: "数をそのまま書く代わりに、名前を付けて **変数** に入れておけます。`型 名前 = 値;` の形で書きます。",
        en: "Instead of writing numbers inline, you can store them in named **variables**. The form is `type name = value;`.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float r = 0.2;
          float g = 0.6;
          float b = 1.0;
          vec3 color = vec3(r, g, b);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`r`・`g`・`b` の値を変えて、好きな色を探してみましょう",
        en: "Change `r`, `g` and `b` to find a color you like",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ここで使った型は 2 つです。`float` は小数 1 つ、`vec3` は小数 3 つの組です。最後の `vec4(color, 1.0)` は、3 つの組 `color` に 4 つ目の `1.0` を付け足して `vec4` を作っています。",
        en: "Two types appear here. `float` is one decimal number; `vec3` is a group of three. The final `vec4(color, 1.0)` builds a `vec4` by appending a fourth number, `1.0`, to the three in `color`.",
      },
    },
    {
      type: "list",
      items: [
        { ja: "`float` … 数 1 つ。明るさ、時間、半径など", en: "`float` … one number: a brightness, a time, a radius" },
        { ja: "`vec2` … 数 2 つ。画面の上の位置(x, y)など", en: "`vec2` … two numbers: a position on the screen (x, y)" },
        { ja: "`vec3` … 数 3 つ。色(r, g, b)や 3D の位置など", en: "`vec3` … three numbers: a color (r, g, b) or a 3D position" },
        { ja: "`vec4` … 数 4 つ。不透明度つきの色など", en: "`vec4` … four numbers: a color with opacity" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "`vec3(0.5)` のように数を 1 つだけ渡すと、3 つとも同じ値になります。灰色を作るときに便利です。",
        en: "Passing a single number, as in `vec3(0.5)`, fills all three with it — handy for grays.",
      },
    },

    { type: "heading", text: { ja: "色を計算する", en: "Doing math with colors" } },
    {
      type: "paragraph",
      text: {
        ja: "`vec3` どうしの足し算やかけ算は、**同じ位置の数どうし** で計算されます。数 1 つ(`float`)とかけると、3 つ全部にかかります。これだけで、色を暗くしたり明るくしたり重ねたりできます。",
        en: "Adding or multiplying two `vec3`s works **component by component**. Multiplying by a single `float` scales all three. That alone lets you darken, brighten and combine colors.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 orange = vec3(1.0, 0.5, 0.1);
          vec3 sky = vec3(0.3, 0.6, 1.0);

          vec3 color = orange * 0.5;  //ja: 半分の明るさ //en: half as bright
          // color = orange + sky;    //ja: 足すと明るくなる //en: adding brightens
          // color = orange * sky;    //ja: かけると重なる //en: multiplying layers them
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "行の先頭の `//` を消すと、その行が動きます。1 行ずつ試してみましょう",
        en: "Delete the `//` at the start of a line to switch it on. Try them one at a time",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "画面に出るときは、1.0 より大きい値は 1.0 に、0.0 より小さい値は 0.0 に切り詰められます。`orange + sky` の赤は 1.3 になりますが、画面では 1.0 として表示されます。",
        en: "On screen, values above 1.0 are clipped to 1.0 and values below 0.0 to 0.0. The red in `orange + sky` is 1.3, but it shows as 1.0.",
      },
    },

    { type: "heading", text: { ja: "場所ごとに違う色にする", en: "A different color in each place" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでは、どの点も同じ色を返していました。シェーダーがおもしろくなるのはここからです。`render` には、いま色を決めている点の場所 `uv` が渡されます。`uv.x` は画面の左端で 0.0、右端で 1.0 です。",
        en: "So far every pixel has returned the same color. Here is where shaders get interesting. `render` receives `uv`, the position of the pixel being colored. `uv.x` is 0.0 at the left edge and 1.0 at the right edge.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          return vec4(uv.x, 0.0, 0.0, 1.0);
        }
      `,
      caption: {
        ja: "`uv.x` を `uv.y` にすると? `vec4(uv.x, uv.y, 0.0, 1.0)` にすると?",
        en: "What if `uv.x` becomes `uv.y`? What about `vec4(uv.x, uv.y, 0.0, 1.0)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "プログラムは 1 行だけで、全部の点で同じものが動いています。それでも点ごとに `uv.x` が違うので、左の黒から右の赤へのグラデーションになります。",
        en: "It is a one-line program, and every pixel runs the same thing. But `uv.x` differs from pixel to pixel, so you get a gradient from black on the left to red on the right.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "これがシェーダーの考え方の中心です。「円を描く」「線を引く」と命令するのではなく、**「この場所は何色?」という質問に、全部の点がそれぞれ答える** のです。これから先の回では、この答え方をいろいろ工夫していきます。",
        en: "This is the heart of thinking in shaders. You never command \"draw a circle\" or \"draw a line\". Instead, **every pixel answers the question \"what color am I?\" on its own**. The rest of this course is about clever ways to answer it.",
      },
    },

    { type: "heading", text: { ja: "時間で色を変える", en: "Changing color over time" } },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つ、`time` という値も使えます。作品が動き出してからの秒数です。`sin(time)` は -1.0 と 1.0 の間を行ったり来たりするので、`* 0.5 + 0.5` で 0.0〜1.0 の範囲に直してから色に使います。",
        en: "One more value is available: `time`, the number of seconds since the work started. `sin(time)` swings between -1.0 and 1.0, so we map it to 0.0–1.0 with `* 0.5 + 0.5` before using it as a color.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float t = sin(time) * 0.5 + 0.5;
          return vec4(t, 0.3, 1.0 - t, 1.0);
        }
      `,
      caption: {
        ja: "`sin(time)` を `sin(time * 3.0)` にすると速くなります",
        en: "Change `sin(time)` to `sin(time * 3.0)` to speed it up",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`time` のように、そのコマの間はどの点にも同じ値が渡されるものを **uniform**(ユニフォーム)と呼びます。このサイトで使える uniform は `time`・`resolution`・`mouse`・`attention` の 4 つです。それぞれは [時間で動かす](/learn/time-and-motion) や [触って動く](/learn/mouse-and-attention) の回でくわしく扱います。",
        en: "Values like `time`, which are the same for every pixel within a frame, are called **uniforms**. This site gives you four: `time`, `resolution`, `mouse` and `attention`. We cover them in [Time and motion](/learn/time-and-motion) and [Touch and response](/learn/mouse-and-attention).",
      },
    },

    { type: "heading", text: { ja: "エラーを読む", en: "Reading errors" } },
    {
      type: "paragraph",
      text: {
        ja: "書き間違いがあると、プレビューの代わりに **コンパイルエラー** が出ます。シェーダーは動かす前に GPU 用の命令に翻訳(コンパイル)され、翻訳できないところがあると止まるからです。下のコードは、わざと 1 か所まちがえてあります。",
        en: "If there is a mistake, a **compile error** appears instead of the preview. Shaders are translated (compiled) into GPU instructions before they run, and translation stops at anything it cannot understand. The code below has one deliberate mistake.",
      },
    },
    {
      type: "playground",
      expectError: true,
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 color = vec3(0.2, 0.8, 0.5)
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "2 行目の終わりに `;` を足すと直ります",
        en: "Add `;` at the end of line 2 to fix it",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "エラーの文は `ERROR: 3: 'return' : syntax error` のような形です。`3` が **行番号**、その後ろが理由です。ここでは「3 行目の `return` で文法がおかしい」と言っています。でも本当にまちがっているのは 2 行目です。`;` が無いので、2 行目と 3 行目がつながって 1 つの文に見えてしまったのです。",
        en: "The message looks like `ERROR: 3: 'return' : syntax error`. The `3` is the **line number** and the rest is the reason: \"the grammar breaks at `return` on line 3\". But the real mistake is on line 2 — without the `;`, lines 2 and 3 run together into one statement.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "エラーが出たら、まず書かれた行番号と **その 1 つ前の行** を見ましょう。よくある原因は、`;` の付け忘れ、`1.0` の小数点の付け忘れ、かっこの閉じ忘れ、名前の打ちまちがいの 4 つです。",
        en: "When you see an error, look at the reported line **and the one before it**. The usual suspects are a missing `;`, a missing decimal point in `1.0`, an unclosed bracket, and a misspelled name.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでの内容を使って、自分で書いてみましょう。詰まったらヒントを 1 つずつ開けてください。見本は最後に確かめる用です。",
        en: "Use what you have learned to write some code yourself. If you get stuck, open the hints one at a time. Save the example solution for checking at the end.",
      },
    },
    {
      type: "exercise",
      title: { ja: "うすい紫", en: "Pale purple" },
      prompt: {
        ja: "画面全体を、うすい紫(ラベンダーのような色)にしてください。",
        en: "Make the whole screen a pale purple, like lavender.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          return vec4(0.0, 0.0, 0.0, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          //ja: 紫は赤 + 青。うすくするには 3 つとも 1.0 に近づける
          //en: purple is red + blue; push all three toward 1.0 to make it pale
          return vec4(0.8, 0.7, 1.0, 1.0);
        }
      `,
      hints: [
        { ja: "紫は、赤と青の光を混ぜた色です", en: "Purple is red light mixed with blue light" },
        {
          ja: "「うすい」色は白に近い色です。白は 3 つとも 1.0 でした。緑も少し入れてみましょう",
          en: "A pale color is close to white, and white is all three at 1.0. Try adding some green too",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "下から上へのグラデーション", en: "A bottom-to-top gradient" },
      prompt: {
        ja: "画面の下が黒、上が緑になるグラデーションを作ってください。",
        en: "Make a gradient that is black at the bottom and green at the top.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          return vec4(uv.x, 0.0, 0.0, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          return vec4(0.0, uv.y, 0.0, 1.0);
        }
      `,
      hints: [
        {
          ja: "`uv.x` は左右の位置でした。上下の位置は `uv.y` です(下が 0.0、上が 1.0)",
          en: "`uv.x` was the left-right position. The up-down position is `uv.y` (0.0 at the bottom, 1.0 at the top)",
        },
        { ja: "緑は `vec4` の 2 つ目の数です", en: "Green is the second number in the `vec4`" },
      ],
    },
    {
      type: "exercise",
      title: { ja: "エラーを直す", en: "Fix the errors" },
      starterHasError: true,
      prompt: {
        ja: "このコードには、まちがいが 2 つあります。エラーの文を手がかりに直して、黄色っぽい画面を出してください。",
        en: "This code has two mistakes. Use the error messages to fix them and get a yellowish screen.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float r = 1;
          float g = 0.8
          return vec4(r, g, 0.2, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          float r = 1.0;
          float g = 0.8;
          return vec4(r, g, 0.2, 1.0);
        }
      `,
      hints: [
        {
          ja: "エラーは 2 行出ています。行番号を見て、上から 1 つずつ片付けましょう",
          en: "There are two error lines. Check their line numbers and fix them one at a time, top to bottom",
        },
        {
          ja: "`float` の変数には、`1` ではなく `1.0` を入れます。文の終わりの `;` も確かめましょう",
          en: "A `float` variable needs `1.0`, not `1`. Check the `;` at the end of each statement as well",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "シェーダーは、1 つの点の色を決める関数。GPU が全部の点で同時に動かす",
          en: "A shader is a function that decides one pixel's color; the GPU runs it for every pixel at once",
        },
        {
          ja: "色は `vec4(赤, 緑, 青, 不透明度)`。どれも 0.0〜1.0",
          en: "A color is `vec4(red, green, blue, opacity)`, each from 0.0 to 1.0",
        },
        { ja: "数には小数点を付けて `1.0` と書く", en: "Write numbers with a decimal point: `1.0`" },
        {
          ja: "`uv` を使うと点ごとに違う色になり、`time` を使うと時間で変わる",
          en: "`uv` makes the color differ per pixel; `time` makes it change over time",
        },
        {
          ja: "エラーが出たら、行番号とその 1 つ前の行を見る",
          en: "On an error, check the reported line and the line before it",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、`uv` と `p` の 2 つの座標をくわしく見て、画面の上の「場所」を自由に扱えるようにします。",
        en: "Next time we look closely at the two coordinates, `uv` and `p`, so you can work freely with positions on the screen.",
      },
    },
  ],
};

export default lesson;
