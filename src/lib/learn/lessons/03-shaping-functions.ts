import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "shaping-functions",
  title: { ja: "関数で形を作る", en: "Shaping functions" },
  summary: {
    ja: "step・smoothstep・abs などで数の形を変え、線やグラフを描く",
    en: "Bend numbers with step, smoothstep and abs, and draw lines and graphs",
  },
  minutes: 55,
  goals: [
    {
      ja: "0〜1 の数を関数で曲げて、明るさの変わり方や形を作る考え方がわかる",
      en: "Understand how bending a 0–1 number with a function shapes brightness and form",
    },
    {
      ja: "y = f(x) のグラフを細い線で描いて、関数の形を目で確かめられる",
      en: "Plot y = f(x) as a thin line to see the shape of a function",
    },
    {
      ja: "`step` と `smoothstep` を使い分け、smoothstep の約束(a < b、下がる形は `1.0 - smoothstep`)を守って書ける",
      en: "Choose between `step` and `smoothstep`, and follow smoothstep's rule (a < b; for a falling shape write `1.0 - smoothstep`)",
    },
    {
      ja: "`min`・`max`・`clamp`・`abs`・`pow`・`sqrt`・`sin` で、数を切る・折る・曲げる・波打たせることができる",
      en: "Clip, fold, bend and wave numbers with `min`, `max`, `clamp`, `abs`, `pow`, `sqrt` and `sin`",
    },
    {
      ja: "関数を組み合わせて、しま模様や揺れる模様を作れる",
      en: "Combine functions into stripes and wobbling patterns",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "数の形を変える", en: "Changing the shape of a number" } },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーで扱う数の多くは、0〜1 の範囲にあります。`uv.x` もそうですし、色の成分もそうです。その 0〜1 の数を、別の 0〜1 の数に変える関数に通すと、同じ画面からいろいろな明るさの変わり方が作れます。このような関数を **シェーピング関数**(形を作る関数)と呼びます。",
        en: "Many of the numbers in a shader live between 0 and 1: `uv.x` does, and so does every color component. Run such a number through a function that turns it into another 0–1 number, and the same screen can produce all sorts of brightness changes. Functions used this way are called **shaping functions**.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float x = uv.x;
          float y = x;  //ja: ここで x の形を変える //en: reshape x here
          return vec4(y * vec3(1.0, 0.75, 0.4), 1.0);
        }
      `,
      caption: {
        ja: "`y = x` を `y = x * x` や `y = 1.0 - x`、`y = x * x * x` にすると、明るさの変わり方はどうなるでしょう?",
        en: "Try `y = x * x`, `y = 1.0 - x` or `y = x * x * x` instead of `y = x`. How does the brightness change across the screen?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`y = x * x` にすると、x が 0.5 のとき y は 0.25 です。まん中でもまだ暗く、右端の近くで急に明るくなります。`y = 1.0 - x` なら向きが逆になります。どれも左端と右端の値は 0 か 1 のままで、**間の通り方** だけが変わっています。この「通り方」を自由に作れるようになるのが、この回の目標です。",
        en: "With `y = x * x`, x = 0.5 gives y = 0.25: still dark in the middle, then brightening quickly near the right edge. `y = 1.0 - x` flips the direction. In every case the ends stay at 0 or 1; only **the path in between** changes. Learning to shape that path freely is the goal of this lesson.",
      },
    },

    { type: "heading", text: { ja: "グラフを描く", en: "Plotting a graph" } },
    {
      type: "paragraph",
      text: {
        ja: "明るさだけだと、形が読み取りにくいことがあります。そこで、y = f(x) の **グラフを線で描く** 道具を作りましょう。グラフの線の上の点とは、「点の高さが f(x) と等しい」点です。ぴったり等しい点はほとんど無いので、「差が 0.01 より小さい」点を線とみなします。",
        en: "Brightness alone can be hard to read, so let's build a tool that **draws the graph** of y = f(x) as a line. A point is on the line when its height equals f(x). Almost no point is exactly equal, so we treat any point within 0.01 as part of the line.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "差の大きさを測るのに `abs` を使います。`abs` は数の符号を取って正にする関数で、`abs(-0.3)` も `abs(0.3)` も 0.3 です。`abs(q.y - y)` は「点の高さと、グラフの高さがどれだけ離れているか」になります。各点が「自分はグラフの近くか?」に答えると、線が浮かび上がります。",
        en: "To measure how big the difference is, we use `abs`, which drops the sign of a number: `abs(-0.3)` and `abs(0.3)` are both 0.3. So `abs(q.y - y)` is how far the point's height is from the graph's height. When every point answers \"am I near the graph?\", the line appears.",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return abs(q.y - y) < 0.01 ? 1.0 : 0.0;  //ja: 線から 0.01 以内なら 1 //en: 1 within 0.01 of the curve
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;  //ja: -0.1〜1.1(まわりに少し余白) //en: -0.1..1.1 (a small margin around)
          float x = q.x;
          float y = x * x;          //ja: ここを書き換える //en: change this

          vec3 color = y * vec3(0.3, 0.4, 0.6);                                //ja: 背景: y を明るさで //en: background: y as brightness
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;  //ja: 0〜1 の外は暗く //en: darker outside 0..1
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);                           //ja: グラフの線 //en: the graph line
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`y = x * x` を `y = x` や `y = 0.5`、`y = 1.0 - x` にすると、線はどうなるでしょう?",
        en: "Change `y = x * x` to `y = x`, `y = 0.5` or `y = 1.0 - x`. What does the line do?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "このコードでは、`render` の前に `plot` という **自分の関数** を書きました。形は `render` と同じで、`返す型 名前(引数の型 名前, …) { … return 値; }` です。関数は、使う場所よりも前に書いておきます。`q = uv * 1.2 - 0.1` は、[座標を知る](/learn/coordinates) で見た拡大とずらしです。`uv` が 0 のとき -0.1、1 のとき 1.1 になるので、0〜1 の四角のまわりに少し余白ができます。四角の外側は暗くしてあります。",
        en: "This code defines **your own function**, `plot`, before `render`. It has the same shape as `render`: `returnType name(argType arg, …) { … return value; }`. A function must be written before the place that uses it. `q = uv * 1.2 - 0.1` is the scaling and shifting from [Knowing where you are](/learn/coordinates): it gives -0.1 where `uv` is 0 and 1.1 where `uv` is 1, leaving a small margin around the 0–1 square. Everything outside the square is darkened.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "背景の明るさも y にしてあるので、**グラフが高いところほど、背景が明るい** ことに注目してください。1 つ目の playground の明るさと、このグラフは同じものを別の見せ方で見ているのです。この先、新しい関数が出てきたら、まずこのグラフで形を確かめます。",
        en: "The background brightness is y as well, so notice that **the higher the graph, the brighter the background**. The brightness in the first playground and this graph are the same thing shown two ways. From here on, every new function gets a first look on this graph.",
      },
    },

    { type: "heading", text: { ja: "step で切り分ける", en: "Cutting with step" } },
    {
      type: "paragraph",
      text: {
        ja: "`step(edge, x)` は、x が edge より小さければ 0.0、そうでなければ 1.0 を返します。前の回の三項演算子なら `x < 0.5 ? 0.0 : 1.0` と書くところを、1 つの関数で書けます。たとえば `step(0.5, 0.3)` は 0.0、`step(0.5, 0.7)` は 1.0 です。",
        en: "`step(edge, x)` returns 0.0 when x is less than edge, and 1.0 otherwise. It does in a single function what you would write with last lesson's ternary operator as `x < 0.5 ? 0.0 : 1.0`. For example, `step(0.5, 0.3)` is 0.0 and `step(0.5, 0.7)` is 1.0.",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return abs(q.y - y) < 0.01 ? 1.0 : 0.0;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = q.x;
          float y = step(0.5, x);

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`0.5` を `0.2` にすると、段はどこへ動くでしょう? `step(0.5, x)` を `1.0 - step(0.5, x)` にすると?",
        en: "Change `0.5` to `0.2`: where does the step move? What about `1.0 - step(0.5, x)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "グラフは、0 の高さの線と 1 の高さの線に分かれ、0.5 のところで途切れます。間をつなぐ縦の線が無いのは、step が 0 から 1 へ **一瞬で跳ぶ** からです。途中の値をとる点が 1 つも無いのです。",
        en: "The graph splits into a line at height 0 and a line at height 1, broken at 0.5. There is no vertical line joining them because step **jumps** from 0 to 1 instantly: no point takes a value in between.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "引数の順番に注意しましょう。境目の edge が先、調べる値 x が後です。`step(x, 0.5)` と逆に書くと、「x が 0.5 以下のとき 1」という逆の意味になります。",
        en: "Mind the argument order: the edge comes first, the value being tested second. Written the other way round, `step(x, 0.5)` means the opposite: 1 when x is at most 0.5.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "step を 2 つ組み合わせると、**帯** が作れます。`step(0.3, x) - step(0.7, x)` は、x が 0.5 なら 1 - 0 = 1、x が 0.8 なら 1 - 1 = 0、x が 0.2 なら 0 - 0 = 0 です。0.3〜0.7 の間だけが 1 になります。また、0 か 1 の数どうしを **かける** と、「両方 1 のところだけ 1」になります。",
        en: "Two steps together make a **band**. `step(0.3, x) - step(0.7, x)` is 1 - 0 = 1 at x = 0.5, 1 - 1 = 0 at x = 0.8, and 0 - 0 = 0 at x = 0.2: it is 1 only between 0.3 and 0.7. And **multiplying** two such 0-or-1 values gives 1 only where both are 1.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float band = step(0.3, uv.x) - step(0.7, uv.x);  //ja: 0.3〜0.7 だけ 1 //en: 1 only between 0.3 and 0.7
          // band *= step(0.4, uv.y);                       //ja: かけ算で「かつ」 //en: multiply for "and"
          vec3 color = vec3(0.1, 0.15, 0.3) + band * vec3(0.9, 0.6, 0.2);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "3 行目の `//` を消すと、帯はどうなるでしょう? `0.3` と `0.7` を変えて、帯の幅を変えてみましょう",
        en: "Remove the `//` on line 3. What happens to the band? Change `0.3` and `0.7` to resize it",
      },
    },

    { type: "heading", text: { ja: "smoothstep でなめらかに", en: "Smoothing with smoothstep" } },
    {
      type: "paragraph",
      text: {
        ja: "step の境目はくっきりしすぎて、斜めや曲がった境目ではギザギザが目立ちます。そこで出てくるのが `smoothstep(a, b, x)` です。x が a 以下なら 0、b 以上なら 1、その間は **なめらかな S 字** でつなぎます。",
        en: "step's edge is so sharp that slanted or curved edges look jagged. That is where `smoothstep(a, b, x)` comes in: it is 0 when x is at or below a, 1 when x is at or above b, and joins them with **a smooth S-curve** in between.",
      },
    },
    {
      type: "code",
      source: `
        //ja: smoothstep(a, b, x) の中身(組み込みの関数なので、自分で書く必要はありません)
        //en: what smoothstep(a, b, x) does inside (it is built in, so you never write this yourself)
        float t = clamp((x - a) / (b - a), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "1 行目で、x が a〜b の中のどのあたりにいるかを割合(0〜1)に直します(`clamp` は 0〜1 の外に出た値を切り詰める関数で、この回の後半で出てきます)。2 行目で、その割合を S 字に曲げます。`smoothstep(0.2, 0.8, 0.5)` なら、割合 t は 0.5 で、答えも 0.5 です。`smoothstep(0.2, 0.8, 0.35)` なら、t は 0.25 で、答えは 0.25 × 0.25 × 2.5 ≈ 0.16 です。両端で傾きが 0 になるので、0 や 1 とのつなぎ目が目立ちません。",
        en: "The first line turns x into a fraction (0 to 1) of the way from a to b (`clamp` cuts off anything outside 0–1; it shows up later in this lesson). The second line bends that fraction into an S. For `smoothstep(0.2, 0.8, 0.5)`, the fraction t is 0.5 and so is the answer. For `smoothstep(0.2, 0.8, 0.35)`, t is 0.25 and the answer is 0.25 × 0.25 × 2.5 ≈ 0.16. The slope is zero at both ends, so it blends into 0 and 1 without a visible seam.",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return abs(q.y - y) < 0.01 ? 1.0 : 0.0;
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = q.x;
          float y = smoothstep(0.2, 0.8, x);

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`0.2` と `0.8` を近づけて `0.45` と `0.55` にすると? `step(0.5, x)` とどこが違うでしょう?",
        en: "Bring `0.2` and `0.8` closer, to `0.45` and `0.55`. How is it different from `step(0.5, x)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "a と b を近づけるほど step に近づき、離すほどゆるやかになります。「0 から 1 へ、どこからどこまでで変わるか」を 2 つの数で指定できるのが smoothstep の便利なところです。",
        en: "The closer a and b are, the more it looks like step; the further apart, the gentler the slope. The beauty of smoothstep is that two numbers say exactly where the change from 0 to 1 begins and ends.",
      },
    },

    { type: "heading", text: { ja: "smoothstep の約束", en: "smoothstep's one rule" } },
    {
      type: "paragraph",
      text: {
        ja: "smoothstep には、必ず守る約束が 1 つあります。**1 つ目の数 a は、2 つ目の数 b より小さくする** ことです。GLSL の仕様書には「a >= b のときの結果は決まっていない(undefined)」と書かれています。さっきの中身の式で、a と b が同じだと 0 で割ることになり、a > b だと割合が逆向きになるからです。",
        en: "smoothstep has one rule you must always keep: **the first number, a, must be smaller than the second, b**. The GLSL specification says the result is undefined when a >= b. Look back at the formula: if a equals b you divide by zero, and if a is larger the fraction runs backwards.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "「決まっていない」とは、GPU やドライバーによって答えが違ってよい、という意味です。多くのパソコンでは逆向きの S 字になるので、うっかり `smoothstep(0.8, 0.2, x)` と書いても、自分の画面ではうまく動いて見えることがあります。でも、ほかの人のスマートフォンでは違う絵になるかもしれません。作品は、いろいろな人のいろいろな GPU で動きます。",
        en: "Undefined means different GPUs and drivers are allowed to give different answers. Many computers happen to produce a reversed S-curve, so if you accidentally write `smoothstep(0.8, 0.2, x)` it may look fine on your screen. Someone else's phone, though, might draw something different. Your work runs on many people's many GPUs.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "1 から 0 へ **下がる** 形がほしいときは、a < b のまま作って、**1.0 から引いて** 裏返します。",
        en: "When you want a shape that **falls** from 1 to 0, build it with a < b and then **subtract it from 1.0** to flip it.",
      },
    },
    {
      type: "code",
      source: `
        float bad  = smoothstep(0.8, 0.2, x);        //ja: × a > b: 結果が決まっていない //en: × a > b: the result is undefined
        float good = 1.0 - smoothstep(0.2, 0.8, x);  //ja: ○ 同じ形を、約束を守って作る //en: ○ the same shape, written safely
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "グラフの線を描く `plot` も、この形でなめらかにできます。`abs(q.y - y)` は線の上で 0、離れるほど大きくなる数でした。`1.0 - smoothstep(0.0, 0.012, …)` に通すと、線の上で 1、0.012 離れると 0 になり、その間はなめらかにぼけます。ここからの playground は、このなめらかな `plot` を使います。",
        en: "The `plot` function can be smoothed the same way. `abs(q.y - y)` is 0 on the line and grows as you move away. Pass it through `1.0 - smoothstep(0.0, 0.012, …)` and you get 1 on the line, 0 at a distance of 0.012, and a smooth fade in between. The playgrounds from here on use this smoother `plot`.",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.012, abs(q.y - y));  //ja: 線の上で 1、離れると 0 //en: 1 on the line, 0 away from it
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = q.x;
          float y = 1.0 - smoothstep(0.2, 0.8, x);  //ja: 1 から 0 へ下がる //en: falls from 1 to 0

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`plot` の中の `0.012` を `0.05` にすると、線はどうなるでしょう? `y` を `smoothstep(0.2, 0.5, x) - smoothstep(0.5, 0.8, x)` にすると?",
        en: "Change the `0.012` inside `plot` to `0.05`. What happens to the line? Then try `smoothstep(0.2, 0.5, x) - smoothstep(0.5, 0.8, x)` for `y`",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "このコースでは、smoothstep をいつも a < b で書きます。図形の内側を 1 にする `1.0 - smoothstep(-px, px, d)` のような形が、次の回から何度も出てきます。下がる形がほしくなったら、引数を入れ替えるのではなく、`1.0 -` を付けると覚えておきましょう。",
        en: "This course always writes smoothstep with a < b. From the next lesson on you will see shapes like `1.0 - smoothstep(-px, px, d)`, which is 1 inside a shape, over and over. When you want a falling shape, don't swap the arguments — put `1.0 -` in front.",
      },
    },

    { type: "heading", text: { ja: "切る・折る(min・max・clamp・abs)", en: "Clipping and folding (min, max, clamp, abs)" } },
    {
      type: "paragraph",
      text: {
        ja: "`min(a, b)` は小さいほう、`max(a, b)` は大きいほうを返します。グラフで見ると、`min(x, 0.6)` は 0.6 で頭打ちになり、`max(x, 0.3)` は 0.3 より下がりません。`clamp(x, lo, hi)` は、その 2 つをいっぺんにして、x を lo〜hi の範囲に閉じ込めます(`min(max(x, lo), hi)` と同じです)。",
        en: "`min(a, b)` returns the smaller value and `max(a, b)` the larger. On the graph, `min(x, 0.6)` flattens out at 0.6, and `max(x, 0.3)` never drops below 0.3. `clamp(x, lo, hi)` does both at once, keeping x inside lo to hi (the same as `min(max(x, lo), hi)`).",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.012, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = q.x;
          float y = clamp(x, 0.3, 0.7);

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`min(x, 0.6)` や `max(x, 0.3)` にすると? `min(x, 1.0 - x) * 2.0` にすると、どんな形になるでしょう?",
        en: "Try `min(x, 0.6)` or `max(x, 0.3)`. What shape does `min(x, 1.0 - x) * 2.0` make?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`abs(x)` は、マイナスをプラスにする関数でした。グラフで見ると、0 より下の部分が上へ **折り返されます**。`x - 0.5` は -0.5〜0.5 の右上がりの直線ですが、`abs(x - 0.5)` は 0.5 のところで折れた V 字になります。「0.5 からどれだけ離れているか」が、そのまま数になるのです。",
        en: "`abs(x)` turns negatives into positives. On a graph, everything below 0 gets **folded** upward. `x - 0.5` is a straight line rising from -0.5 to 0.5, but `abs(x - 0.5)` is a V bent at 0.5. It turns \"how far from 0.5\" directly into a number.",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.012, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = q.x;
          float y = abs(x - 0.5) * 2.0;  //ja: 0.5 で折れた V 字 //en: a V bent at 0.5

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`1.0 - abs(x - 0.5) * 2.0` にすると(山)? `abs(abs(x - 0.5) - 0.25) * 4.0` にすると、何回折れるでしょう?",
        en: "Try `1.0 - abs(x - 0.5) * 2.0` (a peak). How many bends does `abs(abs(x - 0.5) - 0.25) * 4.0` have?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "abs は座標にも使えます。`abs(p)` にすると、左半分は右半分の、下半分は上半分の **鏡うつし** になります。右上の 4 分の 1 に描いたものが、上下左右に折り返されて 4 つに増えるのです。右上に `y = 0.8 - x` の斜めの線を 1 本描くだけで、ひし形ができます。",
        en: "abs works on coordinates too. With `abs(p)`, the left half becomes a **mirror image** of the right half, and the bottom of the top. Whatever you draw in the top-right quarter gets folded into all four. Draw one slanted line, `y = 0.8 - x`, in the top-right quarter and you get a diamond.",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.015, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = abs(p);                  //ja: 上下左右を折り返す //en: fold left-right and top-bottom
          float line = plot(q, 0.8 - q.x);  //ja: y = 0.8 - x の線 //en: the line y = 0.8 - x
          vec3 color = vec3(0.08, 0.1, 0.2) + line * vec3(1.0, 0.7, 0.3);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`abs(p)` を `p` にすると、線は 1 本に戻ります。`0.8 - q.x` を `0.8 - q.x * q.x` や `0.5 - q.x * 0.3` にすると?",
        en: "Change `abs(p)` back to `p` and you get a single line again. What about `0.8 - q.x * q.x` or `0.5 - q.x * 0.3`?",
      },
    },

    { type: "heading", text: { ja: "曲げる(pow・sqrt)", en: "Bending (pow, sqrt)" } },
    {
      type: "paragraph",
      text: {
        ja: "`pow(x, n)` は x の n 乗です。0〜1 の x に使うと、両端の 0 と 1 は動かず、間だけが曲がります。n が 1 より大きいと下にたわみ(ゆっくり始まって、最後に急に上がる)、1 より小さいと上にふくらみます(すぐに上がって、ゆっくり 1 に近づく)。x が 0.5 のとき、`pow(x, 2.0)` は 0.25、`pow(x, 0.5)` は約 0.71 です。`sqrt(x)` は平方根で、`pow(x, 0.5)` と同じです。",
        en: "`pow(x, n)` is x to the power of n. On x between 0 and 1, the ends 0 and 1 stay put and only the middle bends. With n above 1 the curve sags (slow start, sharp rise at the end); with n below 1 it bulges (quick rise, then easing into 1). At x = 0.5, `pow(x, 2.0)` is 0.25 and `pow(x, 0.5)` is about 0.71. `sqrt(x)` is the square root, the same as `pow(x, 0.5)`.",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.012, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = max(q.x, 0.0);  //ja: 左の余白でマイナスにならないように //en: keep it from going negative in the left margin
          float y = pow(x, 2.0);

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`2.0` を `5.0`、`0.5`、`0.2` に変えてみましょう。`sqrt(x)` と `pow(x, 0.5)` が同じ線になるかも確かめてみましょう",
        en: "Change `2.0` to `5.0`, `0.5` and `0.2`. Also check that `sqrt(x)` and `pow(x, 0.5)` draw the same line",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`pow(x, n)` も、x がマイナスのときの結果が決まっていません(`sqrt` も同じです)。この playground は左の余白で `q.x` がマイナスになるので、`max(q.x, 0.0)` で 0 より下がらないようにしてから使っています。マイナスになりうる値には、`pow(max(x, 0.0), n)` や `pow(abs(x), n)` のようにひと手間かけましょう。",
        en: "`pow(x, n)` is also undefined when x is negative (and so is `sqrt`). In this playground `q.x` goes negative in the left margin, so `max(q.x, 0.0)` keeps it from dropping below 0 before `pow` sees it. Whenever a value might be negative, add that extra step: `pow(max(x, 0.0), n)` or `pow(abs(x), n)`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "pow は「明るいところだけを残す」のにも便利です。0〜1 の値を大きな数で累乗すると、1 に近いところ以外はほとんど 0 になります。0.9 の 10 乗は約 0.35 ですが、0.5 の 10 乗は約 0.001 です。この性質は、この後のしま模様や課題で使います。",
        en: "pow is also handy for keeping only the bright parts. Raise a 0–1 value to a large power and almost everything except values near 1 drops to nearly 0: 0.9 to the 10th is about 0.35, while 0.5 to the 10th is about 0.001. We'll use this in the stripes and exercises below.",
      },
    },

    { type: "heading", text: { ja: "sin で波", en: "Waves with sin" } },
    {
      type: "paragraph",
      text: {
        ja: "`sin(x)` は、-1〜1 の間をなめらかに行き来する波です。x が 2π(約 6.283)進むごとに同じ形をくり返します。このくり返しの長さを **周期** と呼びます。GLSL には π の定数が無いので、使うときは `#define TAU 6.28318531` のように自分で名前を付けます(TAU は 2π のことです)。`#define 名前 値` は「コードの中のこの名前を、この値に置き換える」という指示で、関数の外のいちばん上に書きます。",
        en: "`sin(x)` is a wave that glides back and forth between -1 and 1. It repeats every time x advances by 2π (about 6.283); that repeat length is called the **period**. GLSL has no built-in constant for π, so you name it yourself, as in `#define TAU 6.28318531` (TAU means 2π). `#define name value` tells the compiler to replace that name with the value everywhere; write it at the very top, outside any function.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`sin(x * TAU * 2.0)` なら、x が 0〜1 進む間にちょうど 2 回くり返します。そのままだと -1〜1 なので、`* 0.4 + 0.5` で 0.1〜0.9 に直してグラフの枠に収めます。さらに `- time` を入れると、波が右へ流れていきます(動きについては [時間で動かす](/learn/time-and-motion) でくわしく扱います)。",
        en: "`sin(x * TAU * 2.0)` repeats exactly twice as x goes from 0 to 1. On its own it spans -1 to 1, so `* 0.4 + 0.5` maps it to 0.1–0.9 to fit the graph. Add `- time` inside and the wave flows to the right (motion gets its own lesson in [Time and motion](/learn/time-and-motion)).",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.012, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = q.x;
          float y = sin(x * TAU * 2.0 - time) * 0.4 + 0.5;  //ja: 2 回くり返し、右へ流れる //en: two repeats, flowing right

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`2.0` を `5.0` にすると? `* 0.4` を `* 0.1` にすると? `- time` を `+ time` にすると、どちらへ流れるでしょう?",
        en: "Change `2.0` to `5.0`, and `* 0.4` to `* 0.1`. If `- time` becomes `+ time`, which way does it flow?",
      },
    },

    { type: "heading", text: { ja: "しま模様", en: "Stripes" } },
    {
      type: "paragraph",
      text: {
        ja: "関数の答えをグラフの線ではなく、**画面全体の明るさ** として使うと、模様になります。`sin(p.x * 20.0)` は、`p.x` が 2π ÷ 20 ≈ 0.31 進むごとに同じ明るさに戻るので、縦のしまになります。そのままだと、なめらかに明暗をくり返す柔らかいしまです。ここに step や smoothstep を通すと、くっきりしたしまになります。",
        en: "Use a function's answer as **brightness across the whole screen** instead of a graph line, and you get a pattern. `sin(p.x * 20.0)` returns to the same brightness every time `p.x` advances 2π ÷ 20 ≈ 0.31, giving vertical stripes. As-is they are soft, smoothly rising and falling. Pass them through step or smoothstep to sharpen them.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float s = sin(p.x * 20.0) * 0.5 + 0.5;  //ja: 0〜1 の波 //en: a 0..1 wave
          // s = step(0.5, s);                    //ja: くっきり //en: crisp
          // s = smoothstep(0.45, 0.55, s);       //ja: くっきり、でも縁はなめらか //en: crisp, but with smooth edges
          vec3 color = vec3(0.1, 0.15, 0.35) + s * vec3(0.9, 0.6, 0.2);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "3 行目と 4 行目の `//` を、1 つずつ消して比べましょう。`p.x` を `p.x + p.y` にすると、しまは斜めになります",
        en: "Remove the `//` on line 3, then on line 4, and compare. Change `p.x` to `p.x + p.y` for diagonal stripes",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "関数の中に、別の関数を入れることもできます。`sin` の中の座標に、`p.y` で変わる小さな `sin` を足すと、しまが左右に揺れます。さらに `time` を入れれば、ゆらゆら動きます。シェーダーの模様の多くは、このような「関数の組み合わせ」でできています。",
        en: "You can also put functions inside functions. Add a small `sin` that depends on `p.y` to the coordinate inside the main `sin`, and the stripes wiggle sideways. Put `time` in as well and they sway. A great many shader patterns are built from combinations like this.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float wave = sin(p.y * 4.0 + time) * 0.3;         //ja: 高さによって左右にずれる量 //en: sideways shift that depends on height
          float s = sin((p.x + wave) * 20.0) * 0.5 + 0.5;
          s = smoothstep(0.3, 0.7, s);
          vec3 color = vec3(0.1, 0.15, 0.35) + s * vec3(0.9, 0.6, 0.2);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`0.3` を `0.8` にすると、揺れはどうなるでしょう? `p.y * 4.0` を `p.y * 10.0` にすると?",
        en: "What happens to the wiggle if `0.3` becomes `0.8`? What about `p.y * 10.0` instead of `p.y * 4.0`?",
      },
    },

    { type: "heading", text: { ja: "fract と mod をちょっとだけ", en: "A quick peek at fract and mod" } },
    {
      type: "paragraph",
      text: {
        ja: "最後に、くり返しを作る関数を 2 つ紹介しておきます。`fract(x)` は x の小数の部分だけを返します。`fract(2.7)` は 0.7、`fract(0.3)` は 0.3 です。x が増えていくと、0〜1 を何度もくり返す **のこぎりの歯** の形になります。`mod(x, m)` は x を m で割った余りで、0〜m をくり返します(`fract(x)` は `mod(x, 1.0)` と同じです)。",
        en: "To finish, two functions that make repetition. `fract(x)` returns only the fractional part of x: `fract(2.7)` is 0.7 and `fract(0.3)` is 0.3. As x grows, it climbs 0 to 1 again and again like the **teeth of a saw**. `mod(x, m)` is the remainder of x divided by m, repeating 0 to m (`fract(x)` is the same as `mod(x, 1.0)`).",
      },
    },
    {
      type: "playground",
      source: `
        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.012, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 q = uv * 1.2 - 0.1;
          float x = q.x;
          float y = fract(x * 3.0);  //ja: 0〜1 を 3 回くり返す //en: 0..1 three times over

          vec3 color = y * vec3(0.3, 0.4, 0.6);
          if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) color *= 0.4;
          color += plot(q, y) * vec3(0.3, 1.0, 0.5);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`abs(fract(x * 3.0) - 0.5) * 2.0` にすると(三角の波)? `mod(x, 0.4)` にすると?",
        en: "Try `abs(fract(x * 3.0) - 0.5) * 2.0` (a triangle wave). What about `mod(x, 0.4)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "くり返しは、マス目やタイル模様を作る [くり返しとタイル](/learn/repetition) や、同じ動きを何度もくり返す [時間で動かす](/learn/time-and-motion) で主役になります。ここでは「fract は 0〜1 をくり返す」とだけ覚えておけば十分です。",
        en: "Repetition takes center stage in [Repetition and tiles](/learn/repetition), for grids and tiles, and in [Time and motion](/learn/time-and-motion), for looping movement. For now, it is enough to remember that fract repeats 0 to 1.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "関数を組み合わせて、形と模様を作ってみましょう。グラフで形を確かめながら進めると、迷いにくくなります。",
        en: "Combine functions to make shapes and patterns. Checking shapes on the graph as you go makes it much easier.",
      },
    },
    {
      type: "exercise",
      title: { ja: "光の帯", en: "A soft band of light" },
      prompt: {
        ja: "画面のまん中を横に通る、ふちのやわらかい光の帯を作ってください。中心(`p.y` が 0)がいちばん明るく、上下に離れるほど暗くなり、`p.y` が ±0.3 のところで消えるようにします。",
        en: "Make a soft-edged band of light running across the middle of the screen. It should be brightest at the center (`p.y` = 0), fade as you move up or down, and vanish at `p.y` = ±0.3.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float band = 1.0 - step(0.3, abs(p.y));  //ja: いまは、ふちがくっきり //en: hard edges for now
          vec3 color = vec3(0.05, 0.05, 0.12) + band * vec3(0.3, 0.8, 1.0);
          return vec4(color, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          float band = 1.0 - smoothstep(0.0, 0.3, abs(p.y));  //ja: 中心で 1、±0.3 で 0 //en: 1 at the center, 0 at ±0.3
          band = pow(band, 2.0);                               //ja: 光らしく、中心に集める //en: gather it toward the center, like light
          vec3 color = vec3(0.05, 0.05, 0.12) + band * vec3(0.3, 0.8, 1.0);
          color += pow(band, 8.0) * 0.6;                       //ja: 芯を白く //en: a white-hot core
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "「中心からの離れぐあい」は `abs(p.y)` で表せます。上にも下にも、離れるほど大きくなります",
          en: "`abs(p.y)` measures how far you are from the center, growing both upward and downward",
        },
        {
          ja: "0 で 1、0.3 で 0 になる「下がる形」は、smoothstep を 1.0 から引いて作ります(a < b を守る)",
          en: "A falling shape — 1 at 0, 0 at 0.3 — is smoothstep subtracted from 1.0 (keeping a < b)",
        },
        {
          ja: "`1.0 - smoothstep(0.0, 0.3, abs(p.y))`。さらに `pow` で 2 乗すると、光が中心に集まります",
          en: "`1.0 - smoothstep(0.0, 0.3, abs(p.y))`. Squaring it with `pow` pulls the light toward the center",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "山の稜線", en: "Mountain ridges" },
      prompt: {
        ja: "画面の下から 3 分の 1 くらいの高さに、でこぼこした山の稜線を作ってください。稜線より下は山の色、上は空の色にします。できたら、うすい色の遠くの山をもう 1 列、後ろに重ねましょう。",
        en: "Make a bumpy mountain ridge about a third of the way up the screen, with mountain color below it and sky above. Then add a second, paler row of distant mountains behind it.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float h = 0.35;                       //ja: 山の高さ(いまは平ら) //en: mountain height (flat for now)
          float ground = 1.0 - step(h, uv.y);   //ja: 高さより下なら 1 //en: 1 below the height
          vec3 sky = vec3(0.55, 0.75, 1.0);
          vec3 color = sky * (1.0 - ground) + vec3(0.15, 0.3, 0.25) * ground;
          return vec4(color, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          //ja: 空: 下は明るいクリーム色、上は青
          //en: sky: pale cream low, blue high
          vec3 color = vec3(1.0, 0.85, 0.65) * (1.0 - uv.y) + vec3(0.4, 0.6, 0.95) * uv.y;

          //ja: 遠くの山: ゆるやかな波 + 細かい波。色はうすく
          //en: far mountains: a slow wave plus a fast one, in a pale color
          float h2 = 0.45 + 0.06 * sin(uv.x * 5.0 + 2.0) + 0.03 * sin(uv.x * 17.0);
          float far = 1.0 - smoothstep(h2 - 0.003, h2 + 0.003, uv.y);
          color = color * (1.0 - far) + vec3(0.45, 0.55, 0.7) * far;

          //ja: 近くの山: 後に書くので、遠くの山の上に重なる
          //en: near mountains: written later, so they cover the far ones
          float h = 0.3 + 0.08 * sin(uv.x * 9.0) + 0.04 * sin(uv.x * 23.0 + 1.0);
          float ground = 1.0 - smoothstep(h - 0.003, h + 0.003, uv.y);
          color = color * (1.0 - ground) + vec3(0.12, 0.25, 0.2) * ground;
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "山の高さ `h` を、`uv.x` によって変わる関数にします。`sin(uv.x * 9.0)` は、画面の左右で 1.4 回ほど上下します",
          en: "Make the mountain height `h` a function of `uv.x`. `sin(uv.x * 9.0)` rises and falls about 1.4 times across the screen",
        },
        {
          ja: "大きくゆっくりした sin と、小さく速い sin を足すと、自然な稜線になります。縁は `1.0 - smoothstep(h - 0.003, h + 0.003, uv.y)` でなめらかに",
          en: "Adding a big, slow sin to a small, fast one gives a natural ridge. Smooth the edge with `1.0 - smoothstep(h - 0.003, h + 0.003, uv.y)`",
        },
        {
          ja: "`float h = 0.3 + 0.08 * sin(uv.x * 9.0) + 0.04 * sin(uv.x * 23.0);`。遠くの山は、別の高さ `h2` で先に重ねておきます",
          en: "`float h = 0.3 + 0.08 * sin(uv.x * 9.0) + 0.04 * sin(uv.x * 23.0);`. Layer the far mountains first, with their own height `h2`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "水面のきらめき", en: "Shimmer on the water" },
      prompt: {
        ja: "暗い青の水面に、横向きの細い光の線がたくさん並び、ゆらゆら揺れる模様を作ってください。線は細く明るく、線と線の間は暗くします。",
        en: "On a dark blue water surface, make many thin horizontal lines of light that wobble gently. The lines should be thin and bright, with darkness between them.",
      },
      starter: `
        vec4 render(vec2 uv, vec2 p) {
          float s = sin(p.y * 30.0) * 0.5 + 0.5;  //ja: 横のしま //en: horizontal stripes
          vec3 color = vec3(0.02, 0.08, 0.2) + s * vec3(0.5, 0.8, 1.0);
          return vec4(color, 1.0);
        }
      `,
      solution: `
        vec4 render(vec2 uv, vec2 p) {
          //ja: 横の位置と時間で変わる揺れを、sin の中に足す
          //en: add a wobble that depends on x and time inside the sin
          float wobble = sin(p.x * 3.0 + time) * 2.0 + sin(p.x * 7.0 - time * 1.3) * 0.7;
          float s = sin(p.y * 30.0 + wobble) * 0.5 + 0.5;
          s = pow(s, 10.0);                                     //ja: 1 に近いところだけ残して細い線に //en: keep only values near 1, for thin lines
          vec3 color = vec3(0.02, 0.06, 0.18) + uv.y * vec3(0.0, 0.08, 0.15);
          color += s * (0.3 + 0.7 * uv.y) * vec3(0.6, 0.9, 1.0);  //ja: 上(遠く)ほど明るく //en: brighter toward the top (far away)
          return vec4(color, 1.0);
        }
      `,
      hints: [
        {
          ja: "しまを揺らすには、`sin` の中に、`p.x` と `time` で変わる別の `sin` を足します",
          en: "To make the stripes wobble, add another `sin` that depends on `p.x` and `time` inside the main `sin`",
        },
        {
          ja: "線を細くするには、0〜1 の値を `pow(s, 10.0)` のように大きな数で累乗します。1 に近いところだけが残ります",
          en: "To thin the lines, raise the 0–1 value to a big power, like `pow(s, 10.0)`. Only values near 1 survive",
        },
        {
          ja: "`float s = sin(p.y * 30.0 + sin(p.x * 3.0 + time) * 2.0) * 0.5 + 0.5;` の後に `s = pow(s, 10.0);`",
          en: "`float s = sin(p.y * 30.0 + sin(p.x * 3.0 + time) * 2.0) * 0.5 + 0.5;` followed by `s = pow(s, 10.0);`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "シェーピング関数は、0〜1 の数を別の 0〜1 の数に変えて、明るさや形を作る",
          en: "Shaping functions turn a 0–1 number into another 0–1 number to create brightness and form",
        },
        {
          ja: "`abs(q.y - f(x))` が小さいところを光らせると、グラフの線が描ける",
          en: "Light up the points where `abs(q.y - f(x))` is small and you have drawn a graph",
        },
        {
          ja: "`step` はくっきり、`smoothstep` はなめらかに 0 から 1 へ変わる",
          en: "`step` switches from 0 to 1 sharply; `smoothstep` does it smoothly",
        },
        {
          ja: "smoothstep は **いつも a < b**。下がる形は `1.0 - smoothstep(a, b, x)` で作る",
          en: "smoothstep **always takes a < b**; for a falling shape, write `1.0 - smoothstep(a, b, x)`",
        },
        {
          ja: "`min`・`max`・`clamp` で切り、`abs` で折り、`pow` で曲げ、`sin` で波打たせる。pow はマイナスに使わない",
          en: "Clip with `min`, `max` and `clamp`, fold with `abs`, bend with `pow` and wave with `sin` — and never feed pow a negative",
        },
        {
          ja: "関数を組み合わせると、しま・稜線・揺れる模様が作れる。`fract` は 0〜1 をくり返す",
          en: "Combining functions gives stripes, ridges and wobbling patterns; `fract` repeats 0 to 1",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、中心からの距離を使って円やリングを描き、ここで覚えた `smoothstep` で縁をなめらかにします。",
        en: "Next time we draw circles and rings from the distance to a center, and use the `smoothstep` you learned here to smooth their edges.",
      },
    },
  ],
};

export default lesson;
