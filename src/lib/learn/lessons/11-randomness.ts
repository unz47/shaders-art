import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "randomness",
  title: { ja: "乱数をつくる", en: "Making randomness" },
  summary: {
    ja: "ハッシュ関数で疑似乱数を作り、マスごとのばらつきやトルシェ模様を描く",
    en: "Build pseudo-random numbers with hash functions for per-cell variety and Truchet tiles",
  },
  minutes: 50,
  goals: [
    {
      ja: "GLSL に `random()` が無い理由と、場所から乱数を作る **ハッシュ関数** の考え方がわかる",
      en: "Know why GLSL has no `random()`, and how a **hash function** turns a position into a random-looking number",
    },
    {
      ja: "昔ながらの `fract(sin(…) * 43758.5453)` のしくみと落とし穴を知り、`hash21` を使える",
      en: "Understand the classic `fract(sin(…) * 43758.5453)` trick and its pitfalls, and use `hash21` instead",
    },
    {
      ja: "マスの番号から、マスごとに色・大きさ・向き・あるかないかを変えられる",
      en: "Use cell numbers to vary color, size, angle and presence from cell to cell",
    },
    {
      ja: "トルシェ模様(迷路のような模様)を描ける",
      en: "Draw Truchet tiles, the maze-like pattern",
    },
    {
      ja: "`floor(time)` で時間ごとに変わる乱数を作り、`hash22` で 2 つの乱数を一度に得られる",
      en: "Make random values that change over time with `floor(time)`, and get two at once with `hash22`",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "GLSL に random() は無い", en: "There is no random() in GLSL" } },
    {
      type: "paragraph",
      text: {
        ja: "絵に少し「ばらつき」を入れると、一気に生き生きします。夜空の星の位置、モザイクのタイルの色、舞い散る紙吹雪の向き。どれも、きっちりそろっていないことが自然さを生んでいます。[くり返しとタイル](/learn/repetition) では、マスの番号を `sin` に入れてマスごとに変化を付けました。でも `sin` は波なので、よく見ると規則的なくり返しが見えてしまいます。欲しいのは、本当にでたらめに見える数、つまり **乱数** です。ほかのプログラミング言語なら `random()` のような関数を呼べば乱数が手に入りますが、GLSL にはそれがありません。",
        en: "A little variation brings a picture to life: the positions of stars in a night sky, the colors of mosaic tiles, the angles of falling confetti. Their natural feel comes from not being perfectly regular. In [Repetition and tiles](/learn/repetition) you varied each cell by feeding its number into `sin`. But `sin` is a wave, so if you look closely you can see the regular repeat. What we really want are numbers that look truly haphazard: **random numbers**. In most programming languages you would call something like `random()` to get one, but GLSL has no such function.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "理由はシェーダーの動き方にあります。[はじめてのシェーダー](/learn/first-shader) で見たように、同じ関数が全部の点で **同時に** 動きます。ふつうの乱数は「前に出した数」を覚えておき、それをもとに次の数を作ります。でも、同時に動く何百万もの点が、1 つの記憶を順番に書き換えることはできません。それに、もし毎コマ違う乱数が出たら、絵は 1 秒に 60 回ちらついてしまいます。",
        en: "The reason is how shaders run. As you saw in [Your first shader](/learn/first-shader), the same function runs for every pixel **at the same time**. An ordinary random generator remembers the last number it produced and derives the next one from it. Millions of pixels running in parallel can't take turns updating one shared memory. And if every frame produced fresh random numbers, the picture would flicker 60 times a second.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "そこで発想を変えます。欲しいのは「場所を入れると、でたらめに見える数が出てくる関数」です。同じ場所を入れれば必ず同じ数が出るので、絵はちらつきません。でも、少しでも違う場所を入れると、まったく関係のなさそうな数が出ます。こういう関数を **ハッシュ関数** と呼び、そこから出る数を **疑似乱数**(本物の乱数のように見える、決まった計算の結果)と呼びます。",
        en: "So we flip the idea around. What we want is a function that takes a position and returns a number that looks random. Give it the same position and you always get the same number, so the picture holds still. Give it a slightly different position and you get a number that seems completely unrelated. Such a function is called a **hash function**, and its output is a **pseudo-random number**: the result of a fixed calculation that merely looks random.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "同じ入力から必ず同じ答えが出るのは、弱点ではなく長所です。作品を開くたびに同じ星空が現れ、静止画のサムネイルも毎回同じ絵になります。",
        en: "Always getting the same answer for the same input is a strength, not a weakness. The same starry sky appears every time the work is opened, and its still thumbnail comes out the same every time too.",
      },
    },

    { type: "heading", text: { ja: "昔ながらのハッシュ", en: "The classic hash" } },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーの世界で昔から使われてきたのが、`fract(sin(x) * 43758.5453)` という 1 行です。しくみは 3 段です。`sin(x)` は -1〜1 をなめらかに行き来する波です。そこに 43758.5453 という大きな数をかけると、`x` のわずかな違いが大きな違いに引き伸ばされます。最後に `fract` で小数の部分だけを残すと、整数の部分は捨てられ、細かい桁だけが残ります。この細かい桁が、でたらめに見えるのです。",
        en: "One line has been used in shaders for a very long time: `fract(sin(x) * 43758.5453)`. It works in three steps. `sin(x)` is a wave that glides smoothly between -1 and 1. Multiplying by a big number like 43758.5453 stretches tiny differences in `x` into large ones. Finally, `fract` keeps only the part after the decimal point: the whole-number part is thrown away and only the fine digits remain. Those fine digits are what look random.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数で確かめてみましょう。`x` が 1.0 のとき、`sin(x)` は 0.841471 です。43758.5453 をかけると 36821.546 で、`fract` を取ると 0.546 です。`x` を 1.01 にすると、`sin(x)` は 0.846832 とほんの少ししか変わりません。でもかけ算の後は 37056.13 になり、`fract` は 0.13 です。入力は 0.01 しか違わないのに、答えはまるで関係のない数になりました。",
        en: "Let's check with numbers. When `x` is 1.0, `sin(x)` is 0.841471. Times 43758.5453 that is 36821.546, and its `fract` is 0.546. Change `x` to 1.01 and `sin(x)` barely moves, to 0.846832. But after the multiplication it becomes 37056.13, and the `fract` is 0.13. The inputs differ by only 0.01, yet the answers look completely unrelated.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下のプレビューは、`x` を 0.1 ずつ増やした 60 個の値について、`fract(sin(x) * k)` を棒の高さにしたものです。`k` が引き伸ばす倍率です。",
        en: "The preview below takes 60 values of `x`, each 0.1 apart, and draws `fract(sin(x) * k)` as the height of a bar. `k` is the stretch factor.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float x = floor(uv.x * 60.0) * 0.1;  //ja: 60 本の棒。x は 0.0, 0.1, 0.2, … //en: 60 bars; x is 0.0, 0.1, 0.2, ...
          float k = 1.0;                       //ja: 引き伸ばす倍率 //en: stretch factor
          float h = fract(sin(x) * k);

          vec3 col = vec3(0.06, 0.07, 0.12);
          if (uv.y < h) col = mix(vec3(0.2, 0.55, 1.0), vec3(1.0, 0.4, 0.6), uv.x);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`k` を `10.0`、`100.0`、`43758.5453` と大きくしていくと? 波の形がだんだん崩れて、でたらめな高さに変わっていきます",
        en: "Raise `k` to `10.0`, then `100.0`, then `43758.5453`. The wave falls apart step by step until the heights look random",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`k` が `1.0` のときは、`sin` の波がそのまま見えます(途中で高さが跳ぶのは、`sin` が負になると `fract` が 1.0 の側から数えるからです。`fract(-0.3)` は 0.7 です)。`k` を大きくすると、波は何周も折り返され、隣の棒との関係が見えなくなります。かける数が大きいほど、でたらめらしさが増すのです。",
        en: "With `k` at `1.0` you can still see the `sin` wave. (The jump halfway across happens because `fract` of a negative number counts down from 1.0: `fract(-0.3)` is 0.7.) As `k` grows, the wave gets folded over again and again, and each bar stops having anything to do with its neighbors. The bigger the multiplier, the more random it looks.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "2D の点に使うときは、2 つの数を 1 つにまとめてから `sin` に入れます。`dot(p, vec2(12.9898, 78.233))` は `p.x * 12.9898 + p.y * 78.233` と同じで、x と y に半端な重みをかけて足し合わせます。重みがきりの良い数だと、違う点が同じ合計になりやすいので、わざと半端な数にしてあります。",
        en: "To use it on a 2D point, first fold the two numbers into one, then pass that to `sin`. `dot(p, vec2(12.9898, 78.233))` is the same as `p.x * 12.9898 + p.y * 78.233`: it adds x and y with odd-looking weights. With round weights, different points would land on the same sum too often, so the weights are deliberately messy.",
      },
    },
    {
      type: "playground",
      source: `
        float classic(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = classic(uv);
          return vec4(vec3(r), 1.0);
        }
      `,
      caption: {
        ja: "ピクセルごとに違う値が出て、テレビの砂嵐のようになります。`classic(uv)` を `classic(uv + fract(time))` にすると、砂嵐が動き出します",
        en: "Every pixel gets its own value, like static on an old TV. Change `classic(uv)` to `classic(uv + fract(time))` and the static starts to crawl",
      },
    },

    { type: "heading", text: { ja: "昔ながらのハッシュの落とし穴", en: "Where the classic hash falls short" } },
    {
      type: "paragraph",
      text: {
        ja: "この 1 行は短くて覚えやすいので、本やサンプルを通じて広く使われてきました。ただ、いくつか落とし穴があります。まず知っておきたいのは、ハッシュ関数は魔法ではなく、**ものすごく速く変わる、ふつうの関数** にすぎないということです。入れる数を間違えると、隠れていた規則性が模様になって見えてしまいます。",
        en: "Because this one-liner is short and easy to remember, it spread through books and examples everywhere. But it has a few pitfalls. The first thing to understand is that a hash function isn't magic. It's just **an ordinary function that changes extremely fast**. Feed it the wrong numbers and its hidden regularity shows up as a visible pattern.",
      },
    },
    {
      type: "playground",
      source: `
        float classic(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = floor(uv * resolution);  //ja: ピクセルの番号(0, 1, 2, …) //en: pixel number (0, 1, 2, ...)
          float scale = 1.0;
          float offset = 0.0;
          float r = classic(q * scale + offset);
          return vec4(vec3(r), 1.0);
        }
      `,
      caption: {
        ja: "`scale` を `0.00001` にすると? 次に `scale` を `1.0` に戻し、`offset` を `100000.0` にすると? どちらも、砂嵐に縞やななめの規則的な模様が浮かびます",
        en: "Set `scale` to `0.00001`. Then put `scale` back to `1.0` and set `offset` to `100000.0`. Either way, stripes or diagonal patterns show through the static",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "**入力の差が小さすぎる**: 隣の点との差がごく小さいと、`sin` の波が十分に引き伸ばされず、波の名残りが縞になって見えます",
          en: "**Inputs too close together**: if neighboring points differ by only a tiny amount, the `sin` wave isn't stretched enough, and what's left of the wave shows up as stripes",
        },
        {
          ja: "**入力が大きすぎる**: `float` が正確に持てるのは 7 桁ほどです。大きな数を入れると、でたらめさを生むはずの細かい桁が丸められて消え、規則的な模様が出ます",
          en: "**Inputs too large**: a `float` holds only about 7 significant digits. Feed it a big number and the fine digits that should create the randomness get rounded away, leaving a regular pattern",
        },
        {
          ja: "**GPU によって答えが変わる**: GLSL の決まりでは、`sin` をどこまで正確に計算するかは GPU に任されています。とくに大きな数の `sin` は差が出やすく、パソコンではきれいな砂嵐なのに、一部のスマートフォンでは縞が出る、ということが起きます",
          en: "**Different GPUs, different answers**: the GLSL spec leaves the precision of `sin` up to the GPU. The `sin` of a large number varies the most, so you can get clean static on your laptop and stripes on some phones",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "1 つ目と 2 つ目は、どんなハッシュ関数にもある性質です。3 つ目が、この昔ながらの 1 行に特有の弱点です。作品は見る人の GPU で動くので、自分の画面できれいに見えても、ほかの人の画面で同じに見えるとは限りません。",
        en: "The first two apply to every hash function. The third is specific to this classic one-liner. Your work runs on the viewer's GPU, so looking fine on your screen does not guarantee it looks the same on theirs.",
      },
    },

    { type: "heading", text: { ja: "このコースのハッシュ: hash21", en: "This course's hash: hash21" } },
    {
      type: "paragraph",
      text: {
        ja: "そこでこのコースでは、`sin` を使わず、かけ算・足し算・`fract` だけでできたハッシュ関数 `hash21` を使います。こうした計算はどの GPU でもほぼ同じ答えになるので、見る人の環境による違いが出にくくなります。名前の `21` は「数 2 つ(`vec2`)を入れると、数 1 つ(`float`)が出る」という意味です。",
        en: "So in this course we use a hash function called `hash21`, which avoids `sin` and uses only multiplication, addition and `fract`. Those operations give practically the same answer on every GPU, so the picture depends far less on the viewer's hardware. The `21` in the name means \"2 numbers in (`vec2`), 1 number out (`float`)\".",
      },
    },
    {
      type: "code",
      source: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`p = fract(p * vec2(123.34, 456.21))`: x と y に半端で大きな数をかけて、小数の部分だけにします。ここで値が 0〜1 に収まるので、この先の計算で数が大きくなりすぎません",
          en: "`p = fract(p * vec2(123.34, 456.21))` multiplies x and y by large, messy numbers and keeps only the fractional parts. Everything is now between 0 and 1, so the numbers never grow too large in the steps that follow",
        },
        {
          ja: "`p += dot(p, p + 45.32)`: x と y の両方から作った数を、両方に足します。これで x の結果が y に、y の結果が x に影響するようになります",
          en: "`p += dot(p, p + 45.32)` builds one number from both x and y and adds it to each, so x now depends on y and y depends on x",
        },
        {
          ja: "`fract(p.x * p.y)`: 2 つをかけ合わせて 1 つの数にし、その小数の部分を答えにします。答えは 0 以上 1 未満です",
          en: "`fract(p.x * p.y)` multiplies the two into one number and returns its fractional part, which is at least 0 and less than 1",
        },
      ],
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
          float r = hash21(uv);
          return vec4(vec3(r), 1.0);
        }
      `,
      caption: {
        ja: "`hash21(uv)` を `hash21(uv + fract(time))` にすると、砂嵐が動きます。`fract` を付けるのは、`time` がどんどん大きくなっても、入力を小さく保つためです",
        en: "Change `hash21(uv)` to `hash21(uv + fract(time))` to animate the static. The `fract` keeps the input small even as `time` keeps growing",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`hash21` も、入力が大きすぎると模様が出ます(`float` の桁の限界は、どのハッシュ関数でも同じです)。入れる数は、マスの番号のように **数百くらいまで** に収めると安全です。ピクセルの細かさの砂嵐なら、`uv` のような小さな座標をそのまま入れれば十分です。",
        en: "`hash21` also shows patterns when its input is too large — the digit limit of a `float` is the same for every hash function. It's safest to keep inputs **within a few hundred**, like cell numbers. Even for pixel-fine static, small coordinates such as `uv` are all you need.",
      },
    },

    { type: "heading", text: { ja: "マスごとの乱数", en: "One random number per cell" } },
    {
      type: "paragraph",
      text: {
        ja: "ピクセルごとの乱数からは、砂嵐しか生まれません。絵に使いやすいのは、**マスごとに 1 つ** の乱数です。[くり返しとタイル](/learn/repetition) で、`floor(p * n)` がマスの番号になることを見ました。同じマスの中ではどの点も同じ番号なので、それを `hash21` に入れると、マスの中はどこも同じ値、隣のマスでは別の値になります。",
        en: "Random values per pixel only ever give you static. What's far more useful for pictures is **one random number per cell**. In [Repetition and tiles](/learn/repetition) you saw that `floor(p * n)` gives the number of the cell a point falls in. Every point in a cell shares that number, so passing it to `hash21` gives one value across the whole cell and a different one in the next.",
      },
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

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = 5.0;
          vec2 q = p * n;
          vec2 id = floor(q);        //ja: マスの番号 //en: cell number
          vec2 gv = fract(q) - 0.5;  //ja: マスの中の位置(-0.5〜0.5) //en: position inside the cell (-0.5 to 0.5)

          float r = hash21(id);      //ja: マスの中ではどこも同じ値 //en: the same value everywhere in the cell
          vec3 tile = palette(r, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));

          float px = 2.0 / resolution.y * n;  //ja: 1 ピクセルの大きさ(マスの単位で) //en: one pixel, in cell units
          float d = max(abs(gv.x), abs(gv.y)) - 0.44;
          float mask = 1.0 - smoothstep(-px, px, d);
          vec3 col = mix(vec3(0.05), tile, mask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`n` を `12.0` にすると、マスが細かくなります。`hash21(id)` を `hash21(id + 0.5)` にすると、色の組み合わせががらりと変わります",
        en: "Set `n` to `12.0` for smaller cells. Change `hash21(id)` to `hash21(id + 0.5)` and the whole color arrangement changes",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`mask` は、[円と距離](/learn/circles-and-distance) で作ったのと同じ、図形の内側で 1・外側で 0 になる **マスク** です。縁をなめらかにする幅 `px` には注意が要ります。`p` を `n` 倍してマスを作ったので、マスの中の座標 `gv` では 1 ピクセルが `n` 倍の大きさになります。そのため `2.0 / resolution.y` にも `n` をかけています。",
        en: "`mask` is the same kind of **mask** you made in [Circles and distance](/learn/circles-and-distance): 1 inside the shape and 0 outside. The edge-smoothing width `px` needs care, though. Since we multiplied `p` by `n` to make the cells, one pixel is `n` times larger in the cell coordinates `gv`. That's why `2.0 / resolution.y` is multiplied by `n` as well.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`hash21(id + 0.5)` のように、入れる前に小数を足すと、まったく別の乱数の組が得られます。この足す数を **シード**(種)と呼びます。1 つのマスで乱数をいくつも使いたいときは、`hash21(id)`、`hash21(id + 0.31)`、`hash21(id + 0.73)` のように、シードを変えて何度も呼びます。",
        en: "Add a fraction before hashing, as in `hash21(id + 0.5)`, and you get a completely different set of random numbers. The number you add is called a **seed**. When you need several random numbers for one cell, call the hash several times with different seeds: `hash21(id)`, `hash21(id + 0.31)`, `hash21(id + 0.73)`.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "シードに **整数** を足すのは避けましょう。`hash21(id + 1.0)` は、ななめ隣のマス `id + vec2(1.0, 1.0)` の値そのものです。たとえば色と大きさに使うと、「このマスの大きさ」が「ななめ隣のマスの色」と同じになり、ななめにずれた規則性が見えてしまいます。",
        en: "Avoid adding **whole numbers** as seeds. `hash21(id + 1.0)` is exactly the value of the diagonal neighbor `id + vec2(1.0, 1.0)`. If you use one for color and the other for size, every cell's size matches its diagonal neighbor's color, and a diagonal pattern gives the trick away.",
      },
    },

    { type: "heading", text: { ja: "大きさ・向き・あるかないか", en: "Size, angle, and whether it's there" } },
    {
      type: "paragraph",
      text: {
        ja: "マスの中の位置 `gv` を使えば、マスごとに違う図形を描けます。乱数を半径に使えば大きさがばらつき、しきい値と比べれば「描くか描かないか」を決められます。0〜1 の乱数が `0.3` より小さくなるのは、だいたい全体の 3 割のマスです。",
        en: "With the in-cell position `gv`, you can draw a different shape in each cell. Use a random number as the radius and the sizes vary; compare one against a threshold and you decide whether to draw at all. A random number between 0 and 1 is below `0.3` in roughly 30% of the cells.",
      },
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

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float n = 6.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          float size = hash21(id);         //ja: 大きさの乱数 //en: random size
          float hue = hash21(id + 0.31);   //ja: 色の乱数 //en: random color
          float show = hash21(id + 0.73);  //ja: 描くかどうかの乱数 //en: random on/off

          float radius = mix(0.12, 0.45, size);
          float px = 2.0 / resolution.y * n;
          float mask = 1.0 - smoothstep(-px, px, sdCircle(gv, radius));
          if (show < 0.3) mask = 0.0;      //ja: 3 割くらいのマスは空にする //en: leave about 30% of cells empty

          vec3 ink = palette(hue, vec3(0.55), vec3(0.45), vec3(1.0), vec3(0.0, 0.1, 0.2));
          vec3 col = mix(vec3(0.97, 0.94, 0.87), ink, mask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.3` を `0.7` にすると、空のマスが増えます。`mix(0.12, 0.45, size)` の 2 つの数を変えて、大きさの幅を変えてみましょう",
        en: "Change `0.3` to `0.7` and more cells go empty. Change the two numbers in `mix(0.12, 0.45, size)` to widen or narrow the range of sizes",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "向きも同じように決められます。0〜1 の乱数に `TAU`(一回り、約 6.28)をかけると、0〜360 度のどれかの角度になります。図形をその角度だけ回したいので、[座標を動かす](/learn/transforms) と同じく、マスの中の座標を `rot(-angle)` で逆向きに回してから図形を描きます。",
        en: "Angles work the same way. Multiply a random number between 0 and 1 by `TAU` (one full turn, about 6.28) and you get an angle anywhere from 0 to 360 degrees. To turn the shape by that angle, do as in [Moving space](/learn/transforms): rotate the in-cell coordinates the opposite way with `rot(-angle)`, then draw the shape.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
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

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = 7.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          float angle = hash21(id) * TAU;  //ja: 0〜1 の乱数を 0〜360 度に //en: turn 0–1 into 0–360 degrees
          gv = rot(-angle) * gv;

          float px = 2.0 / resolution.y * n;
          float d = sdBox(gv, vec2(0.3, 0.05)) - 0.03;  //ja: 角の丸い細長い四角 //en: a thin box with rounded corners
          float mask = 1.0 - smoothstep(-px, px, d);

          vec3 ink = palette(hash21(id + 0.31), vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          vec3 col = mix(vec3(0.07, 0.06, 0.12), ink, mask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`hash21(id) * TAU` を `floor(hash21(id) * 4.0) * PI * 0.5` にすると、向きが 4 通りだけになります。さらに `angle` の式の最後に `+ time * (hash21(id + 0.73) - 0.5) * 4.0` を足すと、1 本ずつ違う速さで回り出します",
        en: "Replace `hash21(id) * TAU` with `floor(hash21(id) * 4.0) * PI * 0.5` and only four directions remain. Then add `+ time * (hash21(id + 0.73) - 0.5) * 4.0` to the end of the `angle` line and each stick spins at its own speed",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "マスの中に描く図形は、どの向きに回しても **マスからはみ出さない大きさ** にします。このシェーダーが見ているのは、いまの点が入っているマスだけです。はみ出した部分は隣のマスの側で描かれないので、図形がマスの境目でぷつりと切れてしまいます。上の棒は、角まで含めた長さが 0.5 より短くなるようにしてあります。",
        en: "Keep each shape **small enough to stay inside its cell** at any angle. The shader only ever looks at the cell the current point is in. Anything that pokes out would have to be drawn by the neighboring cell, which knows nothing about it, so the shape gets sliced off at the cell border. The sticks above are short enough that even their corners stay within 0.5 of the center.",
      },
    },

    { type: "heading", text: { ja: "トルシェ模様", en: "Truchet tiles" } },
    {
      type: "paragraph",
      text: {
        ja: "マスごとの乱数で 2 種類のタイルのどちらを置くかを選ぶだけで、驚くほど複雑な模様が生まれます。こうした模様を **トルシェ模様** と呼びます。18 世紀のはじめにタイルの並べ方を研究したフランスの学者、セバスチャン・トルシェにちなんだ名前です。1980 年代には、ななめ線 `/` と `\\` をでたらめに打ち続けるだけで迷路のような絵を描く、BASIC の 1 行のプログラム `10 PRINT` が有名になりました。",
        en: "Just picking one of two tiles at random in each cell produces surprisingly intricate patterns. These are called **Truchet tiles**, after Sébastien Truchet, a French scholar who studied tile arrangements in the early 1700s. In the 1980s a one-line BASIC program, `10 PRINT`, became famous for drawing a maze simply by printing `/` or `\\` at random, over and over.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "まずは `10 PRINT` と同じ迷路を作ります。マスの中に、左下の角から右上の角へ、ななめの線分を引きます([図形を組み合わせる](/learn/combining-shapes) の `sdSegment` です)。乱数が 0.5 より小さいマスでは、`gv.x` の符号を反対にします。左右が裏返るので、線は右下から左上へのななめになります。",
        en: "Let's start with the same maze as `10 PRINT`. In each cell, draw a diagonal segment from the bottom-left corner to the top-right corner (that's `sdSegment` from [Combining shapes](/learn/combining-shapes)). In cells whose random number is below 0.5, flip the sign of `gv.x`. That mirrors the cell left to right, so the line runs from bottom-right to top-left instead.",
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

        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = 8.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          if (hash21(id) < 0.5) gv.x = -gv.x;  //ja: 半分くらいのマスは左右を裏返す //en: mirror about half of the cells
          float d = sdSegment(gv, vec2(-0.5), vec2(0.5));

          float px = 2.0 / resolution.y * n;
          float line = 1.0 - smoothstep(0.08 - px, 0.08 + px, d);
          vec3 ink = mix(vec3(0.3, 0.9, 1.0), vec3(1.0, 0.5, 0.8), uv.x);
          vec3 col = mix(vec3(0.1, 0.08, 0.25), ink, line);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.5` を `0.2` や `0.9` にすると? 片方の向きが増えて、迷路が流れのある模様に変わります",
        en: "Change `0.5` to `0.2` or `0.9`. One direction takes over, and the maze turns into a pattern with a flow to it",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "線はマスの角から角へ引いてあるので、隣のマスの線と角でぴったりつながります。1 枚 1 枚はただのななめ線なのに、全体では行き止まりや分かれ道のある迷路に見えるのはそのためです。",
        en: "Every line runs corner to corner, so it meets the lines in neighboring cells exactly at the corners. That's why, although each tile is just a diagonal stroke, together they read as a maze full of dead ends and forks.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "次は、ななめ線の代わりに **4 分の 1 の円弧** を 2 本置きます。左下の角と右上の角を中心に半径 0.5 の円を描くと、どちらの円弧もマスの辺のちょうど真ん中を通ります。隣のマスの円弧も辺の真ん中を通るので、裏返しても裏返さなくても、線は必ずなめらかにつながります。円弧の距離は、[円と距離](/learn/circles-and-distance) で作ったリングと同じ `abs(length(…) - r)` です。",
        en: "Next, replace the diagonal with two **quarter-circle arcs**. Draw circles of radius 0.5 around the bottom-left and top-right corners, and both arcs pass exactly through the midpoints of the cell's edges. The neighboring cells' arcs pass through those midpoints too, so flipped or not, the curves always join smoothly. The distance to an arc is the same `abs(length(…) - r)` you used for rings in [Circles and distance](/learn/circles-and-distance).",
      },
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

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = 6.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          if (hash21(id) < 0.5) gv.x = -gv.x;
          float d1 = abs(length(gv - vec2(0.5)) - 0.5);  //ja: 右上の角を中心にした円弧 //en: arc around the top-right corner
          float d2 = abs(length(gv + vec2(0.5)) - 0.5);  //ja: 左下の角を中心にした円弧 //en: arc around the bottom-left corner
          float d = min(d1, d2);

          float w = 0.14;                                //ja: 帯の半分の幅 //en: half the band width
          float px = 2.0 / resolution.y * n;
          float band = 1.0 - smoothstep(w - px, w + px, d);
          float shade = clamp(1.0 - d / w, 0.0, 1.0);    //ja: 帯の中心ほど明るい //en: brighter toward the middle of the band

          vec3 ink = palette(p.x * 0.15 + p.y * 0.1 + time * 0.1, vec3(0.6), vec3(0.4), vec3(1.0), vec3(0.0, 0.33, 0.67));
          vec3 col = mix(vec3(0.03, 0.03, 0.07), ink * (0.35 + 0.65 * shade), band);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`w` を `0.25` にすると、帯が太くなって編み物のような模様になります。`0.5` を `0.1` にして、向きの割合を片寄らせてみましょう",
        en: "Set `w` to `0.25` and the bands thicken into something like knitting. Change `0.5` to `0.1` to skew the mix of directions",
      },
    },

    { type: "heading", text: { ja: "時間で変わる乱数", en: "Random numbers that change over time" } },
    {
      type: "paragraph",
      text: {
        ja: "`time` は小数でなめらかに増えますが、`floor(time)` は 1 秒ごとに 1 ずつ増える整数です。これを乱数の入力に混ぜると、1 秒ごとに新しい乱数に切り替わります。`floor(time * 4.0)` なら 1 秒に 4 回、`floor(time * 0.5)` なら 2 秒に 1 回です。",
        en: "`time` grows smoothly, but `floor(time)` is a whole number that goes up by one each second. Mix it into the hash input and you get a fresh random number every second. `floor(time * 4.0)` changes four times a second; `floor(time * 0.5)` once every two seconds.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ただし、混ぜ方に 1 つ注意があります。`hash21(id + floor(time))` と書くと、1 秒後のマス `id` の値は、ななめ隣のマス `id + vec2(1.0, 1.0)` のいまの値と同じになります(シードに整数を足してはいけないのと同じ理由です)。これでは新しい模様にならず、模様がななめにずれていくだけです。`floor(time)` に `0.37` のような半端な数をかけてから足せば、毎回まったく新しい値になります。",
        en: "There's one catch in how you mix it in. If you write `hash21(id + floor(time))`, then one second later cell `id` takes on the value its diagonal neighbor `id + vec2(1.0, 1.0)` has right now — the same reason whole-number seeds are a bad idea. Instead of rerolling, the pattern just slides diagonally. Multiply `floor(time)` by an odd fraction like `0.37` before adding it, and every step gives genuinely new values.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の例では、さらにマスごとに時計をずらしています。`time` に `hash21(id + 0.5)` を足すと、切り替わる瞬間がマスごとに違うタイミングになり、全体がいっせいに変わるのではなく、あちこちでぽつぽつと変わります。`fract(t)` は切り替わった直後に 0 で、次の切り替えに向けて 1 に近づくので、`1.0 - fract(t)` を明るさにかけると、変わった瞬間に光ってから落ち着きます。",
        en: "The example below also gives each cell its own clock. Adding `hash21(id + 0.5)` to `time` makes every cell switch at a different moment, so instead of the whole grid changing at once, cells flip here and there. `fract(t)` is 0 right after a switch and climbs toward 1 before the next, so multiplying the brightness by `1.0 - fract(t)` makes each cell flash when it changes and then settle down.",
      },
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

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = 6.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          float t = time * 0.7 + hash21(id + 0.5);  //ja: マスごとに時計をずらす //en: give each cell its own clock
          float beat = floor(t);
          float r = hash21(id + 0.37 * beat);       //ja: 1 拍ごとに新しい乱数 //en: a new random number every beat
          float flash = 1.0 - fract(t);             //ja: 変わった直後ほど明るい //en: brightest right after a change

          vec3 tile = palette(r, vec3(0.8, 0.5, 0.4), vec3(0.2, 0.4, 0.2), vec3(2.0, 1.0, 1.0), vec3(0.0, 0.25, 0.25));
          tile *= 0.5 + 0.5 * flash;

          float px = 2.0 / resolution.y * n;
          float d = sdBox(gv, vec2(0.36)) - 0.06;
          float mask = 1.0 - smoothstep(-px, px, d);
          vec3 col = mix(vec3(0.04, 0.04, 0.06), tile, mask);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.37 * beat` を `beat` にすると、新しい色にならず、模様がななめに流れていくのがわかります。`+ hash21(id + 0.5)` を消すと、全部のマスが同時に変わります",
        en: "Change `0.37 * beat` to just `beat` and the colors stop being new: the pattern simply drifts diagonally. Remove `+ hash21(id + 0.5)` and every cell switches at the same moment",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ここでは色がぱっと切り替わりました。前の乱数と次の乱数を `mix(前, 次, fract(t))` でつなげば、急に変わるのではなく、ゆるやかに移り変わる値になります。この考え方を広げたものが、次の回の **ノイズ** です。",
        en: "Here the colors snap from one to the next. If you blend the previous and next random numbers with `mix(previous, next, fract(t))`, the value glides from one to the other instead. Stretching that idea further gives you **noise**, the topic of the next lesson.",
      },
    },

    { type: "heading", text: { ja: "2 つの乱数を一度に: hash22", en: "Two random numbers at once: hash22" } },
    {
      type: "paragraph",
      text: {
        ja: "マスの中のどこに点を置くかを決めるには、x と y の 2 つの乱数が要ります。シードを変えて `hash21` を 2 回呼んでもよいのですが、`hash22` を使うと一度に `vec2` で受け取れます。名前のとおり「2 つ入れて 2 つ出る」ハッシュ関数で、中身は `hash21` と同じ考え方を 3 つの数に広げたものです。",
        en: "To decide where in a cell to put a point, you need two random numbers, one for x and one for y. You could call `hash21` twice with different seeds, but `hash22` hands you both at once as a `vec2`. As the name says, it takes 2 numbers and returns 2; inside, it's the same idea as `hash21`, stretched to three numbers.",
      },
    },
    {
      type: "code",
      source: `
        vec2 hash22(vec2 p) {
          vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
          a += dot(a, a + 34.45);
          return fract(vec2(a.x * a.y, a.y * a.z));
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "これで星空を作ってみます。画面をマスに分け、マスごとに星を 1 つ、`hash22` で決めた位置に置きます。`hash22` の答えは 0〜1 なので、`- 0.5` で -0.5〜0.5 にし、さらに `0.8` をかけて -0.4〜0.4 にします。星がマスの外にはみ出して切れないようにするためです。明るさ、またたく速さ、またたくタイミングも、シードを変えた乱数で星ごとに変えます。",
        en: "Let's use it to build a starry sky. Divide the screen into cells and place one star in each, at a position chosen by `hash22`. `hash22` returns values from 0 to 1, so `- 0.5` shifts them to -0.5 to 0.5, and multiplying by `0.8` narrows that to -0.4 to 0.4, so no star spills over its cell edge and gets clipped. Brightness, twinkle speed and twinkle timing also vary per star, using hashes with different seeds.",
      },
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

        vec4 render(vec2 uv, vec2 p) {
          vec3 col = mix(vec3(0.12, 0.1, 0.3), vec3(0.01, 0.01, 0.05), uv.y);  //ja: 夜空 //en: night sky

          float n = 10.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          vec2 pos = (hash22(id) - 0.5) * 0.8;  //ja: マスの中の星の位置 //en: where the star sits in its cell
          float d = length(gv - pos);

          float bright = hash21(id + 0.31);
          float speed = 1.0 + 3.0 * hash21(id + 0.73);
          float twinkle = 0.6 + 0.4 * sin(time * speed + bright * TAU);
          float size = 0.03 + 0.07 * bright * bright;

          float core = 1.0 - smoothstep(0.0, size, d);
          float halo = 1.0 - smoothstep(0.0, size * 5.0, d);
          vec3 tint = mix(vec3(1.0, 0.85, 0.7), vec3(0.75, 0.85, 1.0), hash21(id + 0.5));
          col += tint * (core + halo * halo * 0.4) * twinkle * (0.3 + 0.7 * bright);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`pos` を `vec2(0.0)` にすると、星が格子のようにきっちり並んでしまいます。位置のばらつきが自然さを生んでいるのがわかります。`n` を `20.0` にすると星が増えます",
        en: "Set `pos` to `vec2(0.0)` and the stars line up in a rigid grid. You can see how much the scattered positions add to the natural look. Set `n` to `20.0` for more stars",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "「マスごとに 1 つ、`hash22` でずらした点を置く」という考え方は、[セルの模様(ボロノイ)](/learn/voronoi) でそのまま主役になります。点と点の間の距離を調べると、細胞やひび割れのような模様が生まれます。",
        en: "The idea of one point per cell, nudged by `hash22`, takes center stage in [Cellular patterns (Voronoi)](/learn/voronoi). Measure the distances between those points and you get patterns like cells and cracks.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "マスの番号を `hash21` に入れる、シードを変えて乱数を増やす、`floor(time)` で時間ごとに変える。この 3 つを使って、自分で書いてみましょう。",
        en: "Feed cell numbers to `hash21`, change seeds to get more random numbers, and use `floor(time)` to make them change over time. Put those three moves to work in your own code.",
      },
    },
    {
      type: "exercise",
      title: { ja: "夜のビルの窓", en: "Windows at night" },
      prompt: {
        ja: "ビルの壁に窓が並んでいます。いまは全部の窓に明かりがついています。乱数を使って、明かりのついた窓を 3 割くらいにしてください。ついている窓は、明るさを少しずつ変え、ところどころに青白い蛍光灯の色の窓も混ぜましょう。",
        en: "A building wall is covered in windows, and right now every one of them is lit. Use random numbers so that only about 30% of the windows are lit. Vary the brightness of the lit ones a little, and mix in a few windows with a bluish fluorescent white.",
      },
      starter: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 wall = vec3(0.05, 0.06, 0.12);
          vec2 q = p * vec2(9.0, 12.0);   //ja: 横 9、縦 12 の割合でマスに分ける //en: 9 cells across and 12 up per unit
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;
          float window = step(abs(gv.x), 0.3) * step(abs(gv.y), 0.32);

          vec3 off = vec3(0.1, 0.12, 0.2);
          vec3 on = vec3(1.0, 0.78, 0.4);
          float lit = 1.0;                //ja: ここを書き換える //en: change this
          vec3 glass = mix(off, on, lit);

          vec3 col = mix(wall, glass, window);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 wall = vec3(0.05, 0.06, 0.12);
          vec2 q = p * vec2(9.0, 12.0);
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;
          float window = step(abs(gv.x), 0.3) * step(abs(gv.y), 0.32);

          vec3 off = vec3(0.1, 0.12, 0.2);
          vec3 warm = vec3(1.0, 0.75, 0.38);
          vec3 cool = vec3(0.8, 0.9, 1.0);
          //ja: 2 割の窓は青白い蛍光灯にする
          //en: make 20% of the windows fluorescent white
          vec3 on = mix(warm, cool, step(0.8, hash21(id + 0.73)));
          on *= mix(0.55, 1.0, hash21(id + 0.31));  //ja: 明るさをばらつかせる //en: vary the brightness

          float lit = hash21(id) < 0.3 ? 1.0 : 0.0; //ja: 3 割だけ明かりをつける //en: light up only 30%
          vec3 glass = mix(off, on, lit);

          vec3 col = mix(wall, glass, window);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`hash21(id)` は窓ごとに決まった 0〜1 の数です。それが 0.3 より小さい窓は、だいたい全体の 3 割です",
          en: "`hash21(id)` is a fixed number from 0 to 1 for each window. It is below 0.3 for roughly 30% of them",
        },
        {
          ja: "明るさや色には、シードを変えた `hash21(id + 0.31)` や `hash21(id + 0.73)` を使うと、明かりの有無とは関係のない乱数になります",
          en: "For brightness and color, use hashes with different seeds, like `hash21(id + 0.31)` and `hash21(id + 0.73)`, so they don't depend on whether the light is on",
        },
        {
          ja: "`float lit = hash21(id) < 0.3 ? 1.0 : 0.0;` と、`on *= mix(0.55, 1.0, hash21(id + 0.31));` を組み合わせます",
          en: "Combine `float lit = hash21(id) < 0.3 ? 1.0 : 0.0;` with `on *= mix(0.55, 1.0, hash21(id + 0.31));`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "トルシェの三角タイル", en: "Truchet's triangle tiles" },
      prompt: {
        ja: "トルシェが最初に研究したのは、正方形をななめに 2 色に塗り分けたタイルでした。starter では全部のタイルが同じ向きなので、大きなななめのしまにしか見えません。マスごとに 0 度・90 度・180 度・270 度のどれかにでたらめに回して、トルシェの模様を作ってください。",
        en: "The tiles Truchet first studied were squares split diagonally into two colors. In the starter every tile faces the same way, so all you see are big diagonal stripes. Rotate each tile at random by 0, 90, 180 or 270 degrees to make a Truchet pattern.",
      },
      starter: `
        #define PI 3.14159265

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = 6.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          float angle = 0.0;              //ja: ここを書き換える //en: change this
          gv = rot(-angle) * gv;

          float side = step(gv.x, gv.y);  //ja: 左上の三角は 1、右下は 0 //en: 1 in the upper-left triangle, 0 in the lower-right
          vec3 a = vec3(0.95, 0.9, 0.8);
          vec3 b = vec3(0.8, 0.32, 0.2);
          vec3 col = mix(a, b, side);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define PI 3.14159265

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float n = 6.0;
          vec2 q = p * n;
          vec2 id = floor(q);
          vec2 gv = fract(q) - 0.5;

          //ja: 0, 1, 2, 3 のどれかに 90 度をかける
          //en: 0, 1, 2 or 3, times 90 degrees
          float angle = floor(hash21(id) * 4.0) * PI * 0.5;
          gv = rot(-angle) * gv;

          float side = step(gv.x, gv.y);
          vec3 a = vec3(0.95, 0.9, 0.8);
          vec3 b = vec3(0.8, 0.32, 0.2);
          vec3 col = mix(a, b, side);

          //ja: タイルの間に細い目地を入れる
          //en: add thin grout lines between the tiles
          float px = 2.0 / resolution.y * n;
          float edge = max(abs(gv.x), abs(gv.y));
          col *= 0.6 + 0.4 * (1.0 - smoothstep(0.47 - px, 0.47 + px, edge));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`floor(hash21(id) * 4.0)` は、0・1・2・3 のどれかになります",
          en: "`floor(hash21(id) * 4.0)` is one of 0, 1, 2 or 3",
        },
        {
          ja: "90 度は `PI * 0.5` です。0〜3 の数にかけると、4 通りの角度になります",
          en: "90 degrees is `PI * 0.5`. Multiply the 0–3 number by it to get the four angles",
        },
        {
          ja: "`float angle = floor(hash21(id) * 4.0) * PI * 0.5;`",
          en: "`float angle = floor(hash21(id) * 4.0) * PI * 0.5;`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "イコライザー", en: "Equalizer" },
      prompt: {
        ja: "音楽プレーヤーのイコライザーのように、縦の棒が並んで踊る絵を作ります。starter では 24 本の棒が全部同じ高さです。棒ごとの高さを乱数にして、1 秒に 4 回、新しい高さに変わるようにしてください。できたら、棒を LED のような小さな四角の積み重ねにして、下は緑、上にいくほど黄色から赤になるように色を付けてみましょう。",
        en: "Make a row of dancing bars like the equalizer on a music player. In the starter, all 24 bars have the same height. Give each bar a random height that changes four times a second. Then, if you can, split the bars into stacked LED-like blocks and color them green at the bottom, turning yellow and then red toward the top.",
      },
      starter: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float bars = 24.0;
          float column = floor(uv.x * bars);  //ja: 何本目の棒か //en: which bar this is
          float x = fract(uv.x * bars);       //ja: 棒の中の横の位置(0〜1) //en: position across the bar (0–1)

          float h = 0.5;                      //ja: ここを書き換える //en: change this

          float bar = step(uv.y, h) * step(0.15, x) * step(x, 0.85);
          vec3 col = mix(vec3(0.04, 0.04, 0.07), vec3(0.3, 0.9, 0.5), bar);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float bars = 24.0;
          float column = floor(uv.x * bars);
          float x = fract(uv.x * bars);

          //ja: 棒の番号と拍の番号の組で乱数を作る
          //en: hash the pair (bar number, beat number)
          float beat = floor(time * 4.0);
          float h = 0.1 + 0.85 * hash21(vec2(column, beat));

          float across = step(0.15, x) * step(x, 0.85);
          float led = step(0.3, fract(uv.y * 20.0));  //ja: LED のすき間 //en: gaps between the LEDs
          vec3 green = vec3(0.2, 0.95, 0.4);
          vec3 yellow = vec3(1.0, 0.85, 0.2);
          vec3 red = vec3(1.0, 0.25, 0.2);
          vec3 tone = mix(green, yellow, smoothstep(0.45, 0.65, uv.y));
          tone = mix(tone, red, smoothstep(0.75, 0.9, uv.y));

          float on = step(uv.y, h);
          vec3 col = vec3(0.04, 0.04, 0.07);
          col = mix(col, tone * mix(0.12, 1.0, on), across * led);  //ja: 消えた LED もうっすら見せる //en: unlit LEDs stay faintly visible
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "棒の番号 `column` と、1 秒に 4 回増える `floor(time * 4.0)` を組にして `hash21` に入れると、棒ごと・時間ごとに違う乱数になります",
          en: "Pair the bar number `column` with `floor(time * 4.0)`, which goes up four times a second, and pass them to `hash21`. That gives a different random number for each bar at each moment",
        },
        {
          ja: "`float h = 0.1 + 0.85 * hash21(vec2(column, floor(time * 4.0)));` で、高さが 0.1〜0.95 の間でばらつきます",
          en: "`float h = 0.1 + 0.85 * hash21(vec2(column, floor(time * 4.0)));` spreads the heights between 0.1 and 0.95",
        },
        {
          ja: "LED のすき間は `step(0.3, fract(uv.y * 20.0))` で作れます。色は `uv.y` を使って、緑・黄・赤を `mix` で混ぜます",
          en: "You can make the LED gaps with `step(0.3, fract(uv.y * 20.0))`. For the colors, `mix` green, yellow and red using `uv.y`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "GLSL には `random()` が無い。場所を入れると、決まった・でたらめに見える数が出る **ハッシュ関数** で乱数を作る",
          en: "GLSL has no `random()`. Instead, a **hash function** turns a position into a fixed number that looks random",
        },
        {
          ja: "昔ながらの `fract(sin(…) * 43758.5453)` は短いが、`sin` の精度が GPU によって違う。このコースでは `hash21` を使う",
          en: "The classic `fract(sin(…) * 43758.5453)` is short, but `sin` precision varies between GPUs. This course uses `hash21`",
        },
        {
          ja: "ハッシュ関数に入れる数は、近すぎず大きすぎず。マスの番号のような、1 ずつ違う数百までの数が向いている",
          en: "Feed hash functions numbers that are neither too close together nor too large; cell numbers, a few hundred at most and one apart, are ideal",
        },
        {
          ja: "`floor` で作ったマスの番号を入れると、マスごとの乱数になる。乱数を増やすときは、シードに小数を足す",
          en: "Hashing the cell number from `floor` gives one random number per cell. For more of them, add fractional seeds",
        },
        {
          ja: "`floor(time)` に半端な数をかけて混ぜると、時間ごとに変わる乱数になる。`hash22` は 2 つの乱数を一度に返す",
          en: "Mixing in `floor(time)` times an odd fraction gives random numbers that change over time. `hash22` returns two at once",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、マスごとにばらばらだった乱数を **なめらかにつなぎ**、雲や地形の元になる「ノイズ」を作ります。",
        en: "Next time we **join these scattered random values smoothly** to build noise, the raw material for clouds and landscapes.",
      },
    },
  ],
};

export default lesson;
