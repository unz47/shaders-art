import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "voronoi",
  title: { ja: "セルの模様(ボロノイ)", en: "Cellular patterns (Voronoi)" },
  summary: {
    ja: "近くの点までの距離で、細胞・ひび割れ・ステンドグラスの模様を作る",
    en: "Use the distance to nearby points for cells, cracks and stained glass",
  },
  minutes: 55,
  goals: [
    {
      ja: "マスごとに 1 つの点を置き(`hash22`)、3x3 の近傍を探す 2 重ループで、いちばん近い点までの距離 F1 を求められる",
      en: "Place one point per cell with `hash22`, and find the distance to the nearest point (F1) with a double loop over the 3×3 neighborhood",
    },
    {
      ja: "いちばん近い点のマスの番号を覚えて、セルごとに色を塗り分けられる",
      en: "Remember which cell the nearest point belongs to, and give every cell its own color",
    },
    {
      ja: "2 番目に近い点との差(F2 - F1)で、セルの境界線を描ける",
      en: "Draw the borders between cells with the difference to the second-nearest point (F2 - F1)",
    },
    {
      ja: "点を時間で動かし、ステンドグラス・ひび割れ・細胞・泡の模様に仕上げられる",
      en: "Animate the points, and turn the pattern into stained glass, cracks, living cells and bubbles",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "いちばん近い点で塗り分ける", en: "Coloring by the nearest point" } },
    {
      type: "paragraph",
      text: {
        ja: "平面にいくつか点をばらまき、画面のどの場所も「いちばん近い点」で塗り分けると、石畳のような区画ができます。これを **ボロノイ図** と呼び、1 つ 1 つの区画を **セル** と呼びます。キリンの模様、乾いた泥のひび割れ、石けんの泡、葉の細胞など、自然の中によく見つかる形です。",
        en: "Scatter a few points on the plane and color every place by its **nearest point**, and you get regions like paving stones. This is called a **Voronoi diagram**, and each region is a **cell**. The shape shows up all over nature: giraffe skin, cracks in dried mud, soap bubbles, the cells of a leaf.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーでは「この場所は何色?」に答えるのでした。ボロノイでは、それが「この場所から、いちばん近い点までの距離はいくつ?」という質問になります。まずはいちばん素直な方法で、8 つの点への距離を全部測って、いちばん小さいものを選んでみます。",
        en: "A shader answers the question \"what color is this place?\". For Voronoi, that becomes \"how far is this place from the nearest point?\". Let's start the most direct way: measure the distance to all 8 points and keep the smallest.",
      },
    },
    {
      type: "playground",
      source: `
        vec2 hash22(vec2 p) {
          vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
          a += dot(a, a + 34.45);
          return fract(vec2(a.x * a.y, a.y * a.z));
        }

        vec4 render(vec2 uv, vec2 p) {
          float d1 = 8.0;
          for (int i = 0; i < 8; i++) {
            //ja: i 番目の点。0〜1 の乱数を画面の広さに広げる
            //en: point number i: a 0–1 random value stretched over the screen
            vec2 pt = (hash22(vec2(float(i), 7.0)) - 0.5) * vec2(2.6, 1.8);
            d1 = min(d1, length(p - pt));
          }
          vec3 col = d1 * vec3(1.2, 1.0, 0.8);
          col = mix(col, vec3(1.0, 0.3, 0.2), 1.0 - smoothstep(0.02, 0.03, d1));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`i < 8` を `i < 20` にすると点が増えます。`7.0` をほかの数にすると、点の並びが変わります",
        en: "Change `i < 8` to `i < 20` for more points. Change `7.0` to another number to get a different layout",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "点(赤)の近くは距離が小さいので暗く、点から離れるほど明るくなります。明るさが山の尾根のように折れ曲がっている線が見えるでしょうか。そこは **2 つの点からちょうど同じ距離** の場所、つまりセルとセルの境目です。",
        en: "Near a point (red) the distance is small, so it is dark; it gets brighter as you move away. Can you see the lines where the brightness folds like a mountain ridge? Those are the places **exactly as far from two points**, which is to say the borders between cells.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この方法には弱点があります。1 つの点ごとに、全部の点への距離を測っているので、点を 200 個にすると 1 つの点で 200 回の計算です。しかもこのサイトでは、ループの回数は 64 までと決まっています。画面いっぱいの細かい模様を作るには、もっとうまい方法が要ります。",
        en: "This approach has a weakness. Every pixel measures the distance to every point, so with 200 points, each pixel does 200 calculations. On top of that, this site limits loops to 64 iterations. To fill the screen with a fine pattern, we need something smarter.",
      },
    },

    { type: "heading", text: { ja: "マスごとに 1 つの点", en: "One point per cell" } },
    {
      type: "paragraph",
      text: {
        ja: "そこで、[くり返しとタイル](/learn/repetition) のマス目を使います。画面をマスに分け、**どのマスにも点を 1 つずつ** 置きます。点の場所は、[乱数をつくる](/learn/randomness) で作った `hash22` にマスの番号を渡して決めます。`hash22` は 0〜1 の数を 2 つ返すので、それをそのまま「マスの中のどこか」として使えます。",
        en: "This is where the grid from [Repetition and tiles](/learn/repetition) comes in. Split the screen into cells and put **exactly one point in every cell**. To decide where, pass the cell index to `hash22` from [Making randomness](/learn/randomness). It returns two numbers between 0 and 1, which we can use directly as \"somewhere inside the cell\".",
      },
    },
    {
      type: "playground",
      source: `
        vec2 hash22(vec2 p) {
          vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
          a += dot(a, a + 34.45);
          return fract(vec2(a.x * a.y, a.y * a.z));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 3.0;
          vec2 id = floor(g); //ja: マスの番号 //en: cell index
          vec2 f = fract(g);  //ja: マスの中の位置(0〜1) //en: position inside the cell (0–1)

          vec2 pt = hash22(id); //ja: このマスの点 //en: this cell's point
          float d = length(f - pt);

          vec3 col = d * vec3(1.2, 1.0, 0.8);
          col = mix(col, vec3(1.0, 0.3, 0.2), 1.0 - smoothstep(0.06, 0.09, d));
          //ja: マスの境目に青い線
          //en: blue lines on the cell borders
          vec2 e = abs(f - 0.5);
          col = mix(col, vec3(0.3, 0.6, 1.0), smoothstep(0.48, 0.49, max(e.x, e.y)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`p * 3.0` の `3.0` を `6.0` にすると、マスが細かくなっても点はちゃんと 1 つずつです。青い線のところで、明るさがぷつっと切れているのに気づきましたか?",
        en: "Change the `3.0` in `p * 3.0` to `6.0`: the cells shrink, but each still has one point. Did you notice how the brightness jumps at the blue lines?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "点は散らばりましたが、模様はまだボロノイになっていません。ここでは **自分のマスの点** への距離しか測っていないからです。マスの右の端にいる場所は、本当は右どなりのマスの点のほうが近いかもしれません。それを見ていないので、マスの境目で明るさが切れてしまいます。[くり返しとタイル](/learn/repetition) で、マスからはみ出した図形がまっすぐ切れてしまったのと同じ問題です。どのマスも、自分のマスの中のことしか知らないのです。",
        en: "The points are scattered, but this is not Voronoi yet. We only measure the distance to **our own cell's point**. A place near the right edge of a cell may actually be closer to the point in the cell to the right, and since we never look there, the brightness breaks at every cell border. It's the same problem we met in [Repetition and tiles](/learn/repetition), where shapes poking out of their cell got cut off in a straight line: each cell only knows about itself.",
      },
    },

    { type: "heading", text: { ja: "3x3 の近傍を探す", en: "Searching the 3×3 neighborhood" } },
    {
      type: "paragraph",
      text: {
        ja: "では、どこまで見ればよいのでしょう。どの点も **自分のマスの中** にあります。だから、いちばん近い点は、ほとんどの場合、自分のマスか、それを囲む 8 つのマスのどれかにあります。2 つ以上離れたマスの点は、少なくともマス 1 つぶん遠いからです。家の窓から探すなら、自分の家と、まわりの 8 軒を見れば足りる、というわけです。",
        en: "So how far do we need to look? Every point stays **inside its own cell**. That means the nearest point is almost always in our own cell or one of the 8 cells around it, because a point two or more cells away is at least one whole cell away. It is like searching from your window: your own house and the 8 houses around it are enough.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "全部で 9 つのマスを、`x` と `y` の 2 重ループで順に調べます。`x` も `y` も -1・0・1 の 3 通りなので、`(-1, -1)` から `(1, 1)` まで 9 通りの組み合わせになります。",
        en: "We visit the 9 cells with a double loop over `x` and `y`. Each takes the values -1, 0 and 1, which gives the 9 combinations from `(-1, -1)` to `(1, 1)`.",
      },
    },
    {
      type: "playground",
      source: `
        vec2 hash22(vec2 p) {
          vec3 a = fract(p.xyx * vec3(123.34, 234.34, 345.65));
          a += dot(a, a + 34.45);
          return fract(vec2(a.x * a.y, a.y * a.z));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 3.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y)); //ja: となりのマスへのずれ //en: offset to a neighbor cell
              vec2 pt = o + hash22(id + o);      //ja: そのマスの点(自分のマスから見た位置) //en: its point, seen from our cell
              d1 = min(d1, length(pt - f));
            }
          }

          vec3 col = d1 * vec3(1.2, 1.0, 0.8);
          col = mix(col, vec3(1.0, 0.3, 0.2), 1.0 - smoothstep(0.06, 0.09, d1));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "境目の切れ目が消え、きれいなボロノイになりました。`3.0` を `8.0` にして細かくしても、計算は 1 点あたり 9 回のままです",
        en: "The breaks are gone and we have a clean Voronoi pattern. Raise `3.0` to `8.0` for a finer one — it is still just 9 distances per pixel",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`o` は、となりのマスへのずれです。`float(x)` は、整数の `x` を小数に直しています(int と float はそのまま混ぜられないため)",
          en: "`o` is the offset to a neighboring cell. `float(x)` turns the integer `x` into a decimal (ints and floats cannot be mixed directly)",
        },
        {
          ja: "`id + o` がとなりのマスの番号で、`hash22(id + o)` はそのマスの中での点の位置(0〜1)です。それに `o` を足すと、**自分のマスから見た** 点の位置になります",
          en: "`id + o` is the neighbor's cell index, and `hash22(id + o)` is its point's position inside that cell (0–1). Adding `o` gives the point's position **as seen from our cell**",
        },
        {
          ja: "`f` も自分のマスの中の位置なので、`length(pt - f)` で、この場所からその点までの距離が出ます",
          en: "`f` is our position inside our cell, so `length(pt - f)` is the distance from here to that point",
        },
        {
          ja: "`d1` は大きな数 `8.0` から始めて、`min` で小さいほうを残していきます。9 マス調べ終わったとき、`d1` はいちばん近い点までの距離です",
          en: "`d1` starts at a large number, `8.0`, and `min` keeps the smaller value each time. After all 9 cells, `d1` is the distance to the nearest point",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "このいちばん近い点までの距離を、**F1**(1 番目の距離)と呼びます。点の上で 0、セルの境目に近いほど大きくなります。距離はマスの大きさを 1 とした単位なので、`3.0` を変えてマスの大きさを変えても、F1 の範囲はだいたい 0〜0.8 のままです。",
        en: "This distance to the nearest point is called **F1** (the first distance). It is 0 on a point and grows toward the cell borders. Because it is measured in cell units, F1 stays roughly between 0 and 0.8 even when you change `3.0` and resize the cells.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "[時間で動かす](/learn/time-and-motion) で見たとおり、`for` の上限は 64 以下の **数値で** 書くのがこのサイトの投稿チェックの決まりです。-1 から始めるループも同じで、`for (int y = -1; y < 2; y++)` と書きます。`y <= 1` も同じ意味ですが、チェックが読み取れる `y < 2` の形にしましょう。",
        en: "As we saw in [Time and motion](/learn/time-and-motion), the site's publishing check requires every `for` loop to be bounded by **a number** no larger than 64. Loops starting at -1 are no different: write `for (int y = -1; y < 2; y++)`. `y <= 1` means the same thing, but stick to the `y < 2` form so the check can read it.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "点がマスの角の近くに集まると、ごくまれに 2 つ先のマスの点のほうが近いことがあり、3x3 では見落とします。それでも見た目にはほとんどわからないので、模様を作るには 3x3 で十分です。",
        en: "If points bunch up near cell corners, a point two cells away can, very rarely, be the nearest one, and the 3×3 search misses it. The result is almost never visible, so 3×3 is plenty for making patterns.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "「となりのマスも見る」この方法は、[くり返しとタイル](/learn/repetition) の、はみ出した図形が切れる問題の解き方にもなります。となりの 8 マスの図形の距離も測って `min` を取れば、マスの境目をまたぐ図形も切れずに描けます。",
        en: "This \"look at the neighbors too\" approach also solves the clipping problem from [Repetition and tiles](/learn/repetition). Measure the distance to the shapes in the 8 neighboring cells as well and take the `min`, and shapes that straddle cell borders are drawn without being cut off.",
      },
    },

    { type: "heading", text: { ja: "セルごとに色を塗る", en: "A color for every cell" } },
    {
      type: "paragraph",
      text: {
        ja: "F1 は距離だけで、「どのセルにいるか」はわかりません。そこで、ループの中で距離を比べるとき、いちばん近い点が見つかったら、その点の **マスの番号** `id + o` もいっしょに覚えておきます。同じセルの中なら、どの場所でも同じ番号になるので、番号から作った色はセル全体で同じになります。",
        en: "F1 is just a distance; it doesn't tell us which cell we are in. So inside the loop, whenever we find a new nearest point, we also remember its **cell index**, `id + o`. Every place in the same cell ends up with the same index, so a color made from the index fills the whole cell evenly.",
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
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 3.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d1 = d;
                cell = id + o; //ja: いちばん近い点のマスを覚える //en: remember whose point is nearest
              }
            }
          }

          float h = hash21(cell);
          vec3 col = palette(h, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col *= 1.0 - 0.6 * d1; //ja: 点から離れるほど少し暗く //en: a little darker away from the point
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`1.0 - 0.6 * d1` の `0.6` を `0.0` にすると、ベタ塗りのモザイクになります。`vec3(0.0, 0.33, 0.67)` を `vec3(0.0, 0.1, 0.2)` にすると色合いが変わります",
        en: "Set the `0.6` in `1.0 - 0.6 * d1` to `0.0` for a flat mosaic. Change `vec3(0.0, 0.33, 0.67)` to `vec3(0.0, 0.1, 0.2)` to shift the colors",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`if (d < d1)` の中で、距離と番号を **同時に** 更新しているのがポイントです。`min` だけでは「どの点が勝ったか」がわからないので、ここでは `if` を使います。番号 `cell` は [乱数をつくる](/learn/randomness) の `hash21` で 0〜1 の数にして、[色を混ぜる](/learn/mixing-colors) の `palette` で色に変えています。",
        en: "The key is that `if (d < d1)` updates the distance and the index **together**. `min` alone can't tell you which point won, so we use `if` here. The index `cell` becomes a 0–1 number through `hash21` from [Making randomness](/learn/randomness), and then a color through `palette` from [Mixing colors](/learn/mixing-colors).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "セルの番号は、色だけでなく何にでも使えます。セルごとに明るさ・大きさ・回転・動く速さを変えれば、同じ形がくり返しているのに単調に見えない模様になります。",
        en: "The cell index is good for much more than color. Vary brightness, size, rotation or speed per cell, and the same shape repeats without ever looking monotonous.",
      },
    },

    { type: "heading", text: { ja: "境界線を描く(F2 - F1)", en: "Drawing the borders (F2 - F1)" } },
    {
      type: "paragraph",
      text: {
        ja: "ステンドグラスの鉛の枠や、ひび割れの線を描くには、セルの境目がどこかを知る必要があります。ここで役に立つのが、**2 番目に近い点** までの距離 **F2** です。最初の playground で見たとおり、境目は「2 つの点から同じ距離」の場所でした。そこでは F1 と F2 が等しいので、`F2 - F1` が 0 になります。セルの中心に近いほど、1 番目の点がはっきり勝つので、差は大きくなります。",
        en: "To draw the lead lines of stained glass or the lines of a crack, we need to know where the borders are. This is where the distance to the **second-nearest point**, **F2**, helps. As we saw in the first playground, a border is a place equally far from two points. There F1 equals F2, so `F2 - F1` is 0. Toward the middle of a cell the nearest point wins clearly, and the difference grows.",
      },
    },
    {
      type: "code",
      source: `
        if (d < d1) {
          d2 = d1;  //ja: これまでの 1 番が 2 番に下がる //en: the old winner drops to second place
          d1 = d;
          cell = id + o;
        } else if (d < d2) {
          d2 = d;   //ja: 1 番ではないが 2 番より近い //en: not the nearest, but closer than second place
        }
      `,
      caption: {
        ja: "かけっこの順位と同じです。新しく 1 番が来たら、それまでの 1 番は 2 番になります",
        en: "It works like a race: when a new runner takes first place, the old leader drops to second",
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
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 3.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          vec3 col = palette(hash21(cell), vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          float edge = d2 - d1;
          col *= smoothstep(0.02, 0.06, edge); //ja: 境目の近くを黒く //en: darken near the borders
          // col = vec3(edge);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`// col = vec3(edge);` の `//` を消すと、`F2 - F1` そのものが見えます。`0.02, 0.06` を `0.0, 0.2` にすると、ふちがやわらかくなります",
        en: "Remove the `//` from `// col = vec3(edge);` to see `F2 - F1` itself. Change `0.02, 0.06` to `0.0, 0.2` for softer edges",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`vec3(edge)` を表示すると、境目が黒い線になり、セルの中に向かって明るくなる絵が見えます。`smoothstep(0.02, 0.06, edge)` は、差が 0.02 より小さいところを 0(黒)、0.06 より大きいところを 1 にするので、境目に沿って黒い線が残ります。",
        en: "Showing `vec3(edge)` reveals black lines along the borders that brighten toward the inside of each cell. `smoothstep(0.02, 0.06, edge)` gives 0 (black) where the difference is below 0.02 and 1 where it is above 0.06, which leaves a dark line along every border.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`F2 - F1` は境目までの本当の距離ではないので、線の太さが場所によって少し変わります。手描きのような味になるので模様にはむしろ向いていますが、正確な太さが欲しいときの方法は Inigo Quilez の [記事](https://iquilezles.org/articles/voronoilines/) にあります。",
        en: "`F2 - F1` is not the true distance to the border, so the line width varies a little from place to place. That hand-drawn feel often suits patterns, but if you need exact widths, Inigo Quilez describes a method in [this article](https://iquilezles.org/articles/voronoilines/).",
      },
    },

    { type: "heading", text: { ja: "点を動かす", en: "Moving the points" } },
    {
      type: "paragraph",
      text: {
        ja: "点を時間で動かすと、セルが押し合いながら形を変える、生き物のような動きになります。点の位置を `hash22(id + o)` から次の式に変えます。",
        en: "Move the points over time and the cells jostle and reshape like something alive. Replace the point position `hash22(id + o)` with this:",
      },
    },
    {
      type: "code",
      source: `
        vec2 pt = o + 0.5 + 0.4 * sin(time + TAU * hash22(id + o));
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "`sin(…)` は -1〜1 なので、`0.4` をかけると -0.4〜0.4、それに `0.5` を足すと **0.1〜0.9** です。点はマスの中心のまわりを動き、マスの外には出ません。`TAU * hash22(id + o)` は点ごとに違う **位相**(波のずれ)で、これがあるので全部の点がばらばらに動きます。x と y で位相が違うので、点はまっすぐ往復するのではなく、斜めにつぶれた楕円の上を回ります。",
        en: "`sin(…)` goes from -1 to 1, so multiplying by `0.4` gives -0.4 to 0.4, and adding `0.5` gives **0.1 to 0.9**. The point wanders around the middle of its cell and never leaves it. `TAU * hash22(id + o)` gives each point its own **phase** (an offset in the wave), so they all move out of step. Since x and y get different phases, each point circles along a tilted, squashed ellipse instead of sliding back and forth on a line.",
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
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 3.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + 0.5 + 0.4 * sin(time + TAU * hash22(id + o)); //ja: マスの中を動く点 //en: a point wandering inside its cell
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          vec3 col = palette(hash21(cell), vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col *= 1.0 - 0.6 * d1;
          col *= smoothstep(0.02, 0.06, d2 - d1);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`sin(time + …)` を `sin(time * 3.0 + …)` にすると速くなります。`0.4` を `0.9` にすると、点がマスからはみ出して、境目がところどころ崩れます",
        en: "Use `sin(time * 3.0 + …)` to speed it up. Raise `0.4` to `0.9` and the points leave their cells, so the borders break up in places",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "3x3 の探し方は「点は自分のマスの中にいる」ことが前提です。点を大きく動かしてマスの外へ出すと、探していないマスの点がいちばん近くなり、境目が途中で切れたり、セルが欠けたりします。動く範囲は 0.1〜0.9 くらいに収めましょう。",
        en: "The 3×3 search assumes that each point stays inside its own cell. Push the points out of their cells and the nearest one may sit in a cell we never check, so borders snap and cells get chipped. Keep the motion within roughly 0.1–0.9.",
      },
    },

    { type: "heading", text: { ja: "ステンドグラス", en: "Stained glass" } },
    {
      type: "paragraph",
      text: {
        ja: "ここからは、同じ F1・F2・セルの番号を使って、いろいろな模様に仕上げてみます。まずはステンドグラスです。セルごとに深い色を選び、境目に太めの黒い枠を入れます。ガラスの後ろから光が当たっているように、点の近く(F1 が小さいところ)と画面の中央を明るくすると、それらしく見えます。",
        en: "From here on we use the same F1, F2 and cell index to build different looks. First, stained glass. Pick a deep color per cell and put a thick dark frame on the borders. To make it look lit from behind, brighten the area near each point (where F1 is small) and the middle of the screen.",
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
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 2.5;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + 0.5 + 0.35 * sin(time * 0.3 + TAU * hash22(id + o));
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          float h = hash21(cell);
          //ja: 青・赤・金のあたりの深い色
          //en: deep blues, reds and golds
          vec3 glass = palette(h, vec3(0.45, 0.35, 0.4), vec3(0.45, 0.35, 0.4), vec3(1.0), vec3(0.6, 0.1, 0.0));
          glass *= 1.3 - 0.9 * d1;          //ja: 点の近くほど光が通る //en: more light near the point
          glass *= 1.2 - 0.5 * length(p);   //ja: 画面の中央が明るい //en: brighter in the middle
          float lead = smoothstep(0.06, 0.1, d2 - d1); //ja: 鉛の枠 //en: the lead frame
          vec3 col = mix(vec3(0.03, 0.02, 0.02), glass, lead);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.06, 0.1` を `0.02, 0.04` にすると枠が細くなります。`vec3(0.6, 0.1, 0.0)` の数を変えて、窓の色調を選んでみましょう",
        en: "Change `0.06, 0.1` to `0.02, 0.04` for a thinner frame. Play with the numbers in `vec3(0.6, 0.1, 0.0)` to choose the window's color scheme",
      },
    },

    { type: "heading", text: { ja: "ひび割れと細胞", en: "Cracks and living cells" } },
    {
      type: "paragraph",
      text: {
        ja: "乾いた地面のひび割れは、境目の線をうんと細くして、土の色で塗ると作れます。ただし、ボロノイの境目はまっすぐな線なので、そのままでは人工的に見えます。そこで [空間をゆがめる](/learn/domain-warping) と同じように、マス目の座標 `g` に [なめらかなノイズ](/learn/value-noise) を少し足して、境目をぎざぎざにします。",
        en: "For cracks in dry earth, make the border lines very thin and paint the rest in soil colors. But Voronoi borders are straight, which looks artificial. So, just as in [Domain warping](/learn/domain-warping), we add a little [smooth noise](/learn/value-noise) to the grid coordinate `g` to make the borders jagged.",
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

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 4.0;
          //ja: 座標を少しゆがめて、境目をぎざぎざに
          //en: warp the coordinate a little to make the borders jagged
          g += 0.25 * (vec2(noise(g * 3.0), noise(g * 3.0 + 5.2)) - 0.5);
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + 0.2 + 0.6 * hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          float edge = d2 - d1;
          vec3 soil = mix(vec3(0.55, 0.38, 0.24), vec3(0.75, 0.58, 0.4), hash21(cell));
          soil *= 0.8 + 0.3 * noise(p * 30.0);           //ja: 土のざらつき //en: grainy soil
          soil *= 0.6 + 0.4 * smoothstep(0.0, 0.25, edge); //ja: 割れ目のふちが沈む //en: the plates sink near the cracks
          float crack = smoothstep(0.015, 0.03, edge);
          vec3 col = mix(vec3(0.12, 0.07, 0.04), soil, crack);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.25 * (…)` の `0.25` を `0.0` にすると、ゆがみが消えてまっすぐな線に戻ります。`0.6` にすると、溶けたようにうねります",
        en: "Set the `0.25` in `0.25 * (…)` to `0.0` and the lines turn straight again. Try `0.6` for a melted, wavy look",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ここでは点の位置を `0.2 + 0.6 * hash22(…)` にして、マスの中央寄り(0.2〜0.8)に置いています。点がマスの端に寄りすぎないので、セルの大きさがそろい、ひび割れの網目が整って見えます。また、`smoothstep(0.0, 0.25, edge)` で割れ目に近いところを暗くしているので、土のかたまりのふちが少し沈んで見え、立体感が出ます。",
        en: "Here the points sit at `0.2 + 0.6 * hash22(…)`, nearer the middle of each cell (0.2–0.8). Since no point hugs an edge, the cells come out similar in size and the crack network looks tidy. Also, `smoothstep(0.0, 0.25, edge)` darkens the soil near the cracks, so the edges of each clod seem to sink a little, which adds depth.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "同じ材料で、顕微鏡で見た細胞も作れます。F1 が小さいところ(点のまわり)に **核** を、F2 - F1 が小さいところ(境目)に **膜** を描きます。細胞らしい半透明の緑にして、点をゆっくり動かせば、生きているように見えます。",
        en: "The same ingredients give you cells under a microscope. Draw a **nucleus** where F1 is small (around each point) and a **membrane** where F2 - F1 is small (on the borders). Use a translucent green and move the points slowly, and it looks alive.",
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
          vec2 g = p * 3.5;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + 0.5 + 0.3 * sin(time * 0.6 + TAU * hash22(id + o));
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          float h = hash21(cell);
          float edge = d2 - d1;
          vec3 col = mix(vec3(0.05, 0.2, 0.12), vec3(0.3, 0.6, 0.3), h);   //ja: 中身 //en: cytoplasm
          col *= 0.7 + 0.5 * smoothstep(0.0, 0.3, edge);                  //ja: ふちほど濃い //en: denser near the wall
          float wall = 1.0 - smoothstep(0.0, 0.05, edge);
          col = mix(col, vec3(0.75, 0.95, 0.6), wall);                     //ja: 膜 //en: membrane
          float r = 0.1 + 0.05 * h;
          float nucleus = 1.0 - smoothstep(r - 0.02, r, d1);
          col = mix(col, vec3(0.15, 0.35, 0.2), nucleus);                 //ja: 核 //en: nucleus
          col += vec3(0.4, 0.6, 0.3) * (1.0 - smoothstep(0.0, 0.05, abs(d1 - r))) * 0.5; //ja: 核のふち //en: nucleus rim
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`r = 0.1 + 0.05 * h` を `r = 0.05 + 0.15 * h` にすると、核の大きさがばらばらになります。`p * 3.5` を `p * 6.0` にすると、倍率の低い顕微鏡になります",
        en: "Change `r = 0.1 + 0.05 * h` to `r = 0.05 + 0.15 * h` for nuclei of all sizes. Change `p * 3.5` to `p * 6.0` to zoom the microscope out",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "F1・F2・セルの番号の 3 つを、どう組み合わせて絵にするかが腕の見せどころです。課題はどれも、近傍を探すループまではできあがっています。",
        en: "The craft lies in how you combine three ingredients: F1, F2 and the cell index. In every exercise the neighbor-search loop is already written for you.",
      },
    },
    {
      type: "exercise",
      title: { ja: "キリンの模様", en: "Giraffe pattern" },
      prompt: {
        ja: "クリーム色の太い境目で区切られた、茶色のまだら模様を作ってください。茶色はセルごとに少しずつ濃さを変えると、本物らしくなります。",
        en: "Make brown patches separated by thick cream-colored borders. Vary the brown slightly from cell to cell to make it look real.",
      },
      starter: `
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
          vec2 g = p * 3.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          //ja: ここを書き換える
          //en: change this
          vec3 col = vec3(d2 - d1);
          return vec4(col, 1.0);
        }
      `,
      solution: `
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
          vec2 g = p * 3.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + 0.15 + 0.7 * hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          vec3 cream = vec3(0.96, 0.88, 0.7);
          //ja: セルごとに茶色の濃さを変える
          //en: a different shade of brown per cell
          vec3 brown = mix(vec3(0.45, 0.22, 0.08), vec3(0.65, 0.36, 0.14), hash21(cell));
          brown *= 1.0 - 0.3 * d1; //ja: 点から離れるほど少し暗く //en: a little darker away from the point
          //ja: 境目から 0.12 までをクリーム色に。ふちを少しぼかす
          //en: cream within 0.12 of a border, with a slightly soft edge
          float inner = smoothstep(0.12, 0.16, d2 - d1);
          vec3 col = mix(cream, brown, inner);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`d2 - d1` は境目で 0、セルの中ほど大きくなります。「`d2 - d1` が小さいところをクリーム色、大きいところを茶色」にします",
          en: "`d2 - d1` is 0 on a border and grows toward the inside of a cell. Make small values cream and large values brown",
        },
        {
          ja: "`smoothstep(0.12, 0.16, d2 - d1)` で 0〜1 の切り替えを作り、`mix(cream, brown, …)` で塗り分けます",
          en: "Use `smoothstep(0.12, 0.16, d2 - d1)` as the 0–1 switch, and `mix(cream, brown, …)` to paint",
        },
        {
          ja: "茶色は `mix(vec3(0.45, 0.22, 0.08), vec3(0.65, 0.36, 0.14), hash21(cell))` のように、セルの番号で 2 つの茶色を混ぜます",
          en: "For the brown, blend two browns by the cell index: `mix(vec3(0.45, 0.22, 0.08), vec3(0.65, 0.36, 0.14), hash21(cell))`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "またたくセル", en: "Twinkling cells" },
      prompt: {
        ja: "暗い背景に、色とりどりのセルが並んでいます。セルが 1 つずつ、自分のペースで明るくなったり暗くなったりするようにしてください。全部が同時に光るのではなく、ばらばらにまたたくのがねらいです。",
        en: "A grid of colorful cells sits on a dark background. Make each cell brighten and dim at its own pace. The goal is a scattered twinkle, not every cell flashing at once.",
      },
      starter: `
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

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 4.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          float h = hash21(cell);
          vec3 col = palette(h, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          float glow = 0.5; //ja: ここを時間で変える //en: make this change over time
          col *= glow * smoothstep(0.02, 0.06, d2 - d1);
          return vec4(col, 1.0);
        }
      `,
      solution: `
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

        vec4 render(vec2 uv, vec2 p) {
          vec2 g = p * 4.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          float d2 = 8.0;
          vec2 cell = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                cell = id + o;
              } else if (d < d2) {
                d2 = d;
              }
            }
          }

          float h = hash21(cell);
          vec3 col = palette(h, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          //ja: セルごとに違う速さと位相で 0〜1 を往復
          //en: swing 0–1 with a speed and phase of its own per cell
          float wave = 0.5 + 0.5 * sin(time * (1.0 + 2.0 * h) + TAU * h);
          //ja: pow で、明るい時間を短くして「またたき」に
          //en: pow shortens the bright moments into a twinkle
          float glow = 0.15 + 1.1 * pow(wave, 4.0);
          col *= glow * smoothstep(0.02, 0.06, d2 - d1);
          //ja: 光っているセルは、中心がさらに白く
          //en: lit cells get a whiter core
          col += vec3(1.0, 0.95, 0.85) * pow(wave, 8.0) * (1.0 - smoothstep(0.0, 0.35, d1)) * 0.6;
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "セルの番号から作った `h`(0〜1)は、セルの中ならどこでも同じ値です。これを `sin` の位相や速さに使えば、セルごとにばらばらに動きます",
          en: "`h` (0–1), made from the cell index, is the same everywhere inside a cell. Use it as the phase or speed of a `sin`, and every cell moves on its own",
        },
        {
          ja: "`0.5 + 0.5 * sin(time + TAU * h)` で、セルごとに位相のずれた 0〜1 の往復になります",
          en: "`0.5 + 0.5 * sin(time + TAU * h)` gives a 0–1 swing with a different phase per cell",
        },
        {
          ja: "その値を `pow(wave, 4.0)` にすると、明るい時間が短くなって、またたきらしくなります。`glow = 0.15 + 1.1 * pow(wave, 4.0)` のように、暗いときも少し見えるようにします",
          en: "Raising it with `pow(wave, 4.0)` shortens the bright moments into a twinkle. Keep a little light when dark, e.g. `glow = 0.15 + 1.1 * pow(wave, 4.0)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "のぼる泡", en: "Rising bubbles" },
      prompt: {
        ja: "青い水の中を、大きさのそろわない泡がゆっくりのぼっていく絵を作ってください。泡は、セルの点を中心にした輪(リング)で描きます。泡の左上に小さな光の点を入れると、ぐっと泡らしくなります。",
        en: "Draw bubbles of different sizes slowly rising through blue water. Draw each bubble as a ring centered on its cell's point. A small highlight on the upper left of each bubble makes them much more convincing.",
      },
      starter: `
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
          vec2 g = p * 3.0;
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          vec2 cell = vec2(0.0);
          vec2 nearest = vec2(0.0); //ja: いちばん近い点の位置 //en: position of the nearest point
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + 0.25 + 0.5 * hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d1 = d;
                cell = id + o;
                nearest = pt;
              }
            }
          }

          vec3 col = mix(vec3(0.0, 0.1, 0.25), vec3(0.1, 0.45, 0.65), uv.y);
          //ja: ここに泡を描く
          //en: draw the bubbles here
          return vec4(col, 1.0);
        }
      `,
      solution: `
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
          vec2 g = p * 3.0;
          g.y -= time * 0.4; //ja: 模様ごと下へずらすと、泡がのぼる //en: shifting the pattern down makes the bubbles rise
          vec2 id = floor(g);
          vec2 f = fract(g);

          float d1 = 8.0;
          vec2 cell = vec2(0.0);
          vec2 nearest = vec2(0.0);
          for (int y = -1; y < 2; y++) {
            for (int x = -1; x < 2; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + 0.25 + 0.5 * hash22(id + o);
              float d = length(pt - f);
              if (d < d1) {
                d1 = d;
                cell = id + o;
                nearest = pt;
              }
            }
          }

          vec3 col = mix(vec3(0.0, 0.1, 0.25), vec3(0.1, 0.45, 0.65), uv.y);
          float h = hash21(cell);
          //ja: 半径はセルごとに 0.08〜0.22。点が中央寄りなので、泡はとなりのセルにはみ出さない
          //en: radius 0.08–0.22 per cell; the points sit near the middle, so bubbles never spill into a neighbor
          float r = 0.08 + 0.14 * h;
          float ring = 1.0 - smoothstep(0.0, 0.025, abs(d1 - r));
          float inside = 1.0 - smoothstep(r - 0.01, r, d1);
          col += vec3(0.1, 0.25, 0.3) * inside * (d1 / r); //ja: ふちに向かって明るい膜 //en: a film that brightens toward the rim
          col = mix(col, vec3(0.75, 0.95, 1.0), ring * 0.8);
          //ja: 左上の光の点。泡の中心から見た位置で測る
          //en: the highlight on the upper left, measured from the bubble's center
          float spot = length((f - nearest) - vec2(-0.4, 0.4) * r);
          col += vec3(1.0) * (1.0 - smoothstep(0.0, 0.25 * r, spot)) * inside;
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "泡の輪は、[円と距離](/learn/circles-and-distance) のリングと同じです。`d1` は点からの距離なので、`abs(d1 - r)` が小さいところが半径 `r` の輪になります",
          en: "A bubble ring is the same as the rings in [Circles and distance](/learn/circles-and-distance). `d1` is the distance from the point, so `abs(d1 - r)` is small on a ring of radius `r`",
        },
        {
          ja: "半径はセルごとに `r = 0.08 + 0.14 * hash21(cell)` のように変えます。泡をのぼらせるには、ループの前に `g.y -= time * 0.4;` を足して、模様全体を下へずらします",
          en: "Vary the radius per cell, e.g. `r = 0.08 + 0.14 * hash21(cell)`. To make the bubbles rise, add `g.y -= time * 0.4;` before the loop so the whole pattern slides",
        },
        {
          ja: "光の点は、泡の中心 `nearest` から左上へ `vec2(-0.4, 0.4) * r` ずれた場所です。`length((f - nearest) - vec2(-0.4, 0.4) * r)` が小さいところを白くします",
          en: "The highlight sits `vec2(-0.4, 0.4) * r` up and to the left of the center `nearest`. Brighten where `length((f - nearest) - vec2(-0.4, 0.4) * r)` is small",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "ボロノイは「いちばん近い点」で平面を塗り分けた模様。マスごとに 1 つの点を `hash22` で置く",
          en: "Voronoi colors the plane by the nearest point. Put one point per cell with `hash22`",
        },
        {
          ja: "点は自分のマスの中にあるので、自分と 8 つのとなり、3x3 のマスを調べれば足りる",
          en: "Each point stays in its own cell, so checking the 3×3 block — our cell and its 8 neighbors — is enough",
        },
        {
          ja: "F1 はいちばん近い点までの距離。点のまわりの丸い形や、明るさのグラデーションに使う",
          en: "F1 is the distance to the nearest point: use it for round shapes around points and for shading",
        },
        {
          ja: "いちばん近い点のマスの番号を覚えておけば、セルごとに色や動きを変えられる",
          en: "Remember the nearest point's cell index to vary color or motion per cell",
        },
        {
          ja: "F2 - F1 は境目で 0。枠・ひび割れ・膜の線を描くのに使う",
          en: "F2 - F1 is 0 on the borders: use it for frames, cracks and membranes",
        },
        {
          ja: "点を動かすときは、マスの外に出ないよう 0.1〜0.9 くらいに収める",
          en: "When moving points, keep them within about 0.1–0.9 so they never leave their cells",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、[円と距離](/learn/circles-and-distance) や [図形を組み合わせる](/learn/combining-shapes) で使ってきた「距離」をもう一度きちんと見直します。距離に符号を付けると、図形をなめらかにつないだり、影や光を付けたりが、ぐっと楽になります。",
        en: "Next time we take a careful second look at the distances we have been using since [Circles and distance](/learn/circles-and-distance) and [Combining shapes](/learn/combining-shapes). Give a distance a sign, and smoothly merging shapes or adding shadows and glow becomes much easier.",
      },
    },
  ],
};

export default lesson;
