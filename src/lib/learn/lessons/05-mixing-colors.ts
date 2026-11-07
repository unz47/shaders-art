import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "mixing-colors",
  title: { ja: "色を混ぜる", en: "Mixing colors" },
  summary: {
    ja: "mix とパレットで色を設計し、図形を背景に重ねる",
    en: "Design color with mix and palettes, and layer shapes over a background",
  },
  minutes: 55,
  goals: [
    {
      ja: "`mix(a, b, t)` で数や色を混ぜて、いくつもの色のグラデーションを作れる",
      en: "Blend numbers and colors with `mix(a, b, t)` and build multi-color gradients",
    },
    {
      ja: "`col = mix(col, shapeColor, mask)` で図形を背景に重ね、順番と半透明を使いこなせる",
      en: "Layer shapes over a background with `col = mix(col, shapeColor, mask)`, controlling order and translucency",
    },
    {
      ja: "乗算・スクリーン・加算の重ね方の違いがわかる",
      en: "Know how multiply, screen and add differ as ways of combining colors",
    },
    {
      ja: "`hsv2rgb` で色相を回し、`palette` の 4 つのパラメータで配色を設計できる",
      en: "Turn hues with `hsv2rgb` and design color schemes with the four parameters of `palette`",
    },
    {
      ja: "ガンマ補正 `pow(col, vec3(1.0 / 2.2))` が何のためにあるかを、おおまかに知る",
      en: "Get a rough idea of what gamma correction, `pow(col, vec3(1.0 / 2.2))`, is for",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "mix で混ぜる", en: "Blending with mix" } },
    {
      type: "paragraph",
      text: {
        ja: "2 つの色の間の色がほしい場面は、たくさんあります。そのための関数が `mix(a, b, t)` です。t が 0 なら a、1 なら b、その間なら途中の値を返します。中では `a * (1.0 - t) + b * t` を計算しています。",
        en: "You often want a color somewhere between two others. That is what `mix(a, b, t)` is for: it returns a when t is 0, b when t is 1, and something in between otherwise. Under the hood it computes `a * (1.0 - t) + b * t`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数にも色にも使えます。`mix(10.0, 20.0, 0.25)` は 12.5 です。赤 (1, 0, 0) と青 (0, 0, 1) を `mix` で t = 0.5 にすると、ちょうど半分ずつの (0.5, 0, 0.5) で紫になります。これまでの課題で何度か書いた `色1 * (1.0 - t) + 色2 * t` の形は、実は mix そのものだったのです。",
        en: "It works on numbers and colors alike. `mix(10.0, 20.0, 0.25)` is 12.5. Mixing red (1, 0, 0) and blue (0, 0, 1) with t = 0.5 gives exactly half of each, (0.5, 0, 0.5): purple. The `color1 * (1.0 - t) + color2 * t` pattern you wrote in earlier exercises was mix all along.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 a = vec3(1.0, 0.45, 0.35);  //ja: コーラル //en: coral
          vec3 b = vec3(0.2, 0.7, 0.75);   //ja: ティール //en: teal
          vec3 color = mix(a, b, uv.x);
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`uv.x` を `0.5` にすると、まん中の 1 色になります。`smoothstep(0.4, 0.6, uv.x)` や `uv.x * uv.x` にすると?",
        en: "Set `uv.x` to `0.5` and you get the single color halfway between. What about `smoothstep(0.4, 0.6, uv.x)` or `uv.x * uv.x`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "t に何を入れるかで、混ざり方が決まります。[関数で形を作る](/learn/shaping-functions) のシェーピング関数を t に使えば、境目をくっきりさせたり、片側に寄せたりできます。",
        en: "What you feed into t decides how the colors blend. Use a shaping function from [Shaping functions](/learn/shaping-functions) as t to sharpen the transition or push it to one side.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "t は 0〜1 の範囲で使います。mix は t を切り詰めないので、1 を超えると b の向こう側へ「行き過ぎた」色に、0 より小さいと a の反対側の色になります。範囲を超えそうなときは `clamp(t, 0.0, 1.0)` を通しましょう。",
        en: "Keep t between 0 and 1. mix doesn't clip t, so above 1 you overshoot past b, and below 0 you land on the far side of a. If t might stray, pass it through `clamp(t, 0.0, 1.0)`.",
      },
    },

    { type: "heading", text: { ja: "グラデーションを設計する", en: "Designing gradients" } },
    {
      type: "paragraph",
      text: {
        ja: "3 色以上のグラデーションは、mix を重ねて作ります。夕焼けの空なら、地平線の近くはオレンジ、少し上はピンク、上のほうは深い紺です。1 つ目の mix でオレンジからピンクへ、2 つ目の mix でその結果から紺へ混ぜます。それぞれの t は、高さ `uv.y` の区間を smoothstep で 0〜1 に直して作ります。",
        en: "For three or more colors, stack mixes. A sunset sky might be orange near the horizon, pink a little higher and deep navy at the top. The first mix goes from orange to pink; the second mixes that result toward navy. Each t comes from smoothstep turning a range of heights in `uv.y` into 0–1.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 low = vec3(1.0, 0.55, 0.25);   //ja: 地平線 //en: horizon
          vec3 mid = vec3(0.85, 0.35, 0.5);   //ja: 中ほど //en: middle
          vec3 high = vec3(0.1, 0.12, 0.35);  //ja: 上空 //en: high sky
          vec3 color = mix(low, mid, smoothstep(0.0, 0.4, uv.y));
          color = mix(color, high, smoothstep(0.3, 0.9, uv.y));
          return vec4(color, 1.0);
        }
      `,
      caption: {
        ja: "`smoothstep(0.3, 0.9, uv.y)` を `smoothstep(0.6, 0.9, uv.y)` にすると、ピンクの帯が広がります。`low` を `vec3(1.0, 0.85, 0.4)` にすると?",
        en: "Change `smoothstep(0.3, 0.9, uv.y)` to `smoothstep(0.6, 0.9, uv.y)` and the pink band widens. What if `low` becomes `vec3(1.0, 0.85, 0.4)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "2 つの区間(0.0〜0.4 と 0.3〜0.9)を少し重ねてあるので、ピンクの帯の上下でつなぎ目が目立ちません。色を決めるときは、明るさにも差をつけるのがこつです。上のほうを暗く、地平線を明るくすると、空に奥行きが出ます。",
        en: "The two ranges (0.0–0.4 and 0.3–0.9) overlap slightly, so there is no visible seam above or below the pink. When choosing colors, vary the brightness too: a darker top and a brighter horizon give the sky depth.",
      },
    },

    { type: "heading", text: { ja: "図形を重ねる", en: "Layering shapes" } },
    {
      type: "paragraph",
      text: {
        ja: "mix のいちばん大事な使い方は、**背景に図形を重ねる** ことです。形はいつもこうです。",
        en: "The single most important use of mix is **laying a shape over a background**. It always looks like this:",
      },
    },
    {
      type: "code",
      source: `
        col = mix(col, shapeColor, mask);
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "mask は図形の内側で 1、外側で 0 の数です([円と距離](/learn/circles-and-distance) の `1.0 - smoothstep(-px, px, d)`)。mask が 0 のところでは col はそのまま、1 のところでは shapeColor に置き換わります。縁の上では mask が 0.5 くらいなので、背景と図形の色がちょうど半分ずつ混ざり、なめらかな縁になります。",
        en: "The mask is 1 inside the shape and 0 outside (the `1.0 - smoothstep(-px, px, d)` from [Circles and distance](/learn/circles-and-distance)). Where the mask is 0, col stays as it was; where it is 1, col is replaced by shapeColor. On the edge the mask is around 0.5, so background and shape blend half and half, giving a smooth edge.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "[円と距離](/learn/circles-and-distance) では色を足して重ねましたが、足し算だと背景の色が図形に混ざってしまいます(青い背景に黄色を足すと、白っぽくなります)。mix なら、図形の色をそのまま置けます。",
        en: "In [Circles and distance](/learn/circles-and-distance) we layered by adding colors, but adding lets the background bleed into the shape (yellow added to a blue background turns whitish). mix puts the shape's color down exactly as it is.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(1.0, 0.55, 0.25), vec3(0.1, 0.12, 0.35), uv.y);  //ja: 背景 //en: background
          float sun = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.0, -0.1), 0.4));
          col = mix(col, vec3(1.0, 0.9, 0.6), sun);                              //ja: 太陽を重ねる //en: lay the sun on top
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`mix(col, vec3(1.0, 0.9, 0.6), sun)` を `col + vec3(1.0, 0.9, 0.6) * sun` にすると、太陽の色はどう変わるでしょう? `sun` を `sun * 0.5` にすると?",
        en: "Replace `mix(col, vec3(1.0, 0.9, 0.6), sun)` with `col + vec3(1.0, 0.9, 0.6) * sun`. How does the sun's color change? What about `sun * 0.5` instead of `sun`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`sun * 0.5` のように mask を小さくすると、図形が **半透明** になります。mask は「どれだけ図形の色にするか」の割合なので、不透明度のように働くのです。0.5 なら、背景と半分ずつ混ざります。",
        en: "Shrink the mask, as with `sun * 0.5`, and the shape becomes **translucent**. The mask is the fraction of shape color to use, so it acts just like opacity: at 0.5 the shape and the background mix half and half.",
      },
    },

    { type: "heading", text: { ja: "重ねる順番", en: "Layer order" } },
    {
      type: "paragraph",
      text: {
        ja: "`col = mix(col, …)` を何行も続けると、**後に書いたものほど上に** 重なります。紙に絵の具を塗り重ねるのと同じで、奥のものから順に描いていきます。下の絵は、空 → 太陽 → 遠くの丘 → 近くの丘の順です。丘は、中心を画面のずっと下に置いた大きな円です。",
        en: "Chain several `col = mix(col, …)` lines and **each later line lands on top**. It is like painting on paper: you work from the back to the front. The picture below goes sky → sun → far hill → near hill. The hills are huge circles centered far below the screen.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(1.0, 0.6, 0.35), vec3(0.25, 0.2, 0.45), uv.y);

          float sun = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.35, -0.25), 0.3));
          float far = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(-0.6, -1.9), 1.8));
          float near = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.7, -2.3), 1.9));

          col = mix(col, vec3(1.0, 0.85, 0.55), sun);  //ja: 1. 太陽 //en: 1. sun
          col = mix(col, vec3(0.45, 0.3, 0.5), far);   //ja: 2. 遠くの丘 //en: 2. far hill
          col = mix(col, vec3(0.2, 0.15, 0.3), near);  //ja: 3. 近くの丘 //en: 3. near hill
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "「1. 太陽」の行を、いちばん最後に移すとどうなるでしょう? `far` を `far * 0.6` にすると、遠くの丘がかすんで見えます",
        en: "Move the \"1. sun\" line to the very end. What happens? Change `far` to `far * 0.6` and the far hill turns hazy",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "影や縁取りも、同じしくみで「下の層」として先に描けます。影は、本体と同じ形を少しずらし、smoothstep の幅を広くしてぼかし、mask を小さくして半透明にしたものです。縁取りは、本体より少し大きい円を、本体より先に濃い色で塗れば作れます。",
        en: "Shadows and outlines work the same way: draw them first, as lower layers. A shadow is the shape itself, nudged a little, blurred with a wide smoothstep, and made translucent with a smaller mask. An outline is a slightly larger circle painted in a dark color before the shape.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.95, 0.92, 0.85), vec3(0.85, 0.88, 0.95), uv.y);
          float d = sdCircle(p, 0.45);
          float shadow = 1.0 - smoothstep(-0.1, 0.15, sdCircle(p - vec2(0.08, -0.1), 0.45));  //ja: ずらしてぼかした影 //en: shifted, blurred shadow
          float rim = 1.0 - smoothstep(-px, px, d - 0.03);  //ja: 少し大きい円 = 縁取り //en: slightly larger circle = outline
          float body = 1.0 - smoothstep(-px, px, d);

          col = mix(col, vec3(0.2, 0.15, 0.3), shadow * 0.35);  //ja: 1. 影(半透明) //en: 1. shadow (translucent)
          col = mix(col, vec3(0.15, 0.1, 0.25), rim);           //ja: 2. 縁取り //en: 2. outline
          col = mix(col, vec3(1.0, 0.5, 0.35), body);           //ja: 3. 本体 //en: 3. body
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`shadow * 0.35` を `shadow * 0.8` にすると? 「1. 影」と「2. 縁取り」の行を入れ替えると、どこが変わるでしょう?",
        en: "Try `shadow * 0.8` instead of `shadow * 0.35`. Swap the \"1. shadow\" and \"2. outline\" lines: what changes?",
      },
    },

    { type: "heading", text: { ja: "乗算・スクリーン・加算", en: "Multiply, screen and add" } },
    {
      type: "paragraph",
      text: {
        ja: "mix は「置き換える」重ね方でした。ほかに、下の色と上の色を **計算で合わせる** 重ね方があります。画像ソフトの「描画モード」と同じものです。下の色を a、上の色を b とします。",
        en: "mix replaces one color with another. There are also ways to **combine** the lower and upper colors with arithmetic — the same thing as blend modes in image editors. Call the lower color a and the upper color b.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "乗算 `a * b` … 暗くなる。黒(0)をかけると黒、白(1)をかけると変わらない。色セロハンやインクを重ねる感じ",
          en: "Multiply, `a * b` … darkens. Multiplying by black (0) gives black; by white (1) changes nothing. Like stacking colored film or ink",
        },
        {
          ja: "スクリーン `1.0 - (1.0 - a) * (1.0 - b)` … 明るくなるが、1 を超えない。白を重ねると白、黒を重ねると変わらない。2 台のプロジェクターの光を重ねる感じ",
          en: "Screen, `1.0 - (1.0 - a) * (1.0 - b)` … brightens but never exceeds 1. Screening white gives white; screening black changes nothing. Like two projectors shining on the same spot",
        },
        {
          ja: "加算 `a + b` … 光そのものを足す。いちばん明るくなり、1 を超えたところは白く飛ぶ",
          en: "Add, `a + b` … adds light directly. The brightest of the three, and anything over 1 blows out to white",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "数で比べてみましょう。a = 0.5、b = 0.5 のとき、乗算は 0.25、スクリーンは 1 - 0.5 × 0.5 = 0.75、加算は 1.0 です。下の playground では、下が暗く上が明るい背景の上に、同じオレンジを 3 通りの方法で重ねています。",
        en: "Compare them with numbers. For a = 0.5 and b = 0.5, multiply gives 0.25, screen gives 1 - 0.5 × 0.5 = 0.75, and add gives 1.0. In the playground below, the same orange is laid three ways over a background that is dark at the bottom and light at the top.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 a = mix(vec3(0.05, 0.05, 0.15), vec3(0.95, 0.9, 0.8), uv.y);  //ja: 下の色(下が暗く、上が明るい) //en: lower color (dark below, light above)
          vec3 b = vec3(1.0, 0.45, 0.2);                                    //ja: 上の色 //en: upper color
          float m1 = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(-0.85, 0.0), 0.38));
          float m2 = 1.0 - smoothstep(-px, px, sdCircle(p, 0.38));
          float m3 = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.85, 0.0), 0.38));

          vec3 col = a;
          col = mix(col, a * b, m1);                        //ja: 左: 乗算 //en: left: multiply
          col = mix(col, 1.0 - (1.0 - a) * (1.0 - b), m2);  //ja: 中: スクリーン //en: middle: screen
          col = mix(col, a + b, m3);                        //ja: 右: 加算 //en: right: add
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`b` を `vec3(0.3, 0.6, 1.0)` にすると? `b` を白 `vec3(1.0)` や黒 `vec3(0.0)` にすると、どの円が見えなくなるでしょう?",
        en: "Set `b` to `vec3(0.3, 0.6, 1.0)`. With white `vec3(1.0)` or black `vec3(0.0)` as `b`, which circles disappear?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "乗算の円は、背景の暗い下のほうでは黒に沈み、明るい上のほうでだけオレンジが見えます。スクリーンの円は、下ではオレンジ、上では白に近づきます。加算の円は、上のほうで 1 を超えて、白く飛んでしまいます。乗算は影やインク、スクリーンと加算は光を表すのに向いています。",
        en: "The multiply circle sinks to black over the dark bottom of the background and only shows orange near the light top. The screen circle is orange at the bottom and nearly white at the top. The add circle goes past 1 near the top and blows out to white. Multiply suits shadows and ink; screen and add suit light.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "[円と距離](/learn/circles-and-distance) では赤・緑・青の **光を足して**、重なりが黄色や白になるのを見ました。こんどは逆に、白い紙の上で水色・赤紫・黄色の **インクをかけ合わせて** みましょう。`mix(vec3(1.0), インクの色, mask)` は、円の外では白(かけても変わらない)、内側ではインクの色になる数です。",
        en: "In [Circles and distance](/learn/circles-and-distance) you **added light** — red, green and blue — and saw overlaps turn yellow and white. Now do the opposite: **multiply inks** — cyan, magenta and yellow — on white paper. `mix(vec3(1.0), inkColor, mask)` is white outside the circle (multiplying by it changes nothing) and the ink color inside.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          float a = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(-0.25, -0.15), 0.45));
          float b = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.25, -0.15), 0.45));
          float c = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.0, 0.28), 0.45));
          vec3 col = vec3(0.97, 0.95, 0.9);                    //ja: 白い紙 //en: white paper
          col *= mix(vec3(1.0), vec3(0.1, 0.75, 0.95), a);     //ja: 水色のインク //en: cyan ink
          col *= mix(vec3(1.0), vec3(0.95, 0.25, 0.65), b);    //ja: 赤紫のインク //en: magenta ink
          col *= mix(vec3(1.0), vec3(1.0, 0.85, 0.1), c);      //ja: 黄色のインク //en: yellow ink
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "重なりは青・緑・赤っぽく、3 つ全部では黒に近くなります。光の足し算とちょうど逆です。インクの色を `vec3(0.0, 1.0, 1.0)` のような純色にすると?",
        en: "Overlaps turn bluish, green and reddish, and all three together come out nearly black — the exact opposite of adding light. What if you use pure inks like `vec3(0.0, 1.0, 1.0)`?",
      },
    },

    { type: "heading", text: { ja: "HSV で色相を回す", en: "Turning hues with HSV" } },
    {
      type: "paragraph",
      text: {
        ja: "RGB は「赤・緑・青の光の量」なので、「同じ明るさのまま、もう少し青っぽく」のような調整は苦手です。そこで、色を **色相(H)・彩度(S)・明度(V)** の 3 つで表す HSV という方法がよく使われます。",
        en: "RGB is about amounts of red, green and blue light, which makes adjustments like \"a bit bluer, same brightness\" awkward. That is why people often describe color with **hue (H), saturation (S) and value (V)** instead — HSV.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "色相 H … 色の種類。0〜1 で色の輪を 1 周する。0 が赤、約 0.17 が黄、0.33 が緑、0.5 が水色、0.67 が青、0.83 が赤紫、1 でまた赤",
          en: "Hue H … which color. 0 to 1 goes once around the color wheel: 0 is red, about 0.17 yellow, 0.33 green, 0.5 cyan, 0.67 blue, 0.83 magenta, and 1 is red again",
        },
        { ja: "彩度 S … 鮮やかさ。0 で白っぽい灰色、1 でいちばん鮮やか", en: "Saturation S … vividness. 0 is washed out to gray, 1 is fully vivid" },
        { ja: "明度 V … 明るさ。0 で黒", en: "Value V … brightness. 0 is black" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "GLSL には HSV の関数が無いので、次の `hsv2rgb` をコードに入れて使います。`vec3(H, S, V)` を渡すと、RGB の色が返ってきます。このコースでは、この名前・この中身で使います。",
        en: "GLSL has no HSV function, so paste the following `hsv2rgb` into your code. Pass it `vec3(H, S, V)` and it returns an RGB color. This course always uses it with exactly this name and body.",
      },
    },
    {
      type: "code",
      source: `
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "中身は [関数で形を作る](/learn/shaping-functions) の道具だけでできています。`mod` で色相を 0〜6 のくり返しにし、`abs(… - 3.0) - 1.0` と `clamp` で、0〜1 の台形の波を作ります。赤・緑・青で波の位置を 3 分の 1 周ずつずらしてあるので、色相が進むと 3 色が順番に入れ替わります。最後の行は、彩度が 0 なら白、1 なら k のまま(`mix`)にして、明度をかけています。",
        en: "It is built entirely from tools in [Shaping functions](/learn/shaping-functions). `mod` turns the hue into a repeating 0–6, and `abs(… - 3.0) - 1.0` with `clamp` shapes it into a trapezoid wave between 0 and 1. Red, green and blue each get the wave shifted by a third of a turn, so as the hue advances the three channels take turns. The last line goes from white at zero saturation to k at full saturation (with `mix`), then multiplies by the value.",
      },
    },
    {
      type: "playground",
      source: `
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float hue = uv.x;  //ja: 横に色相 //en: hue across
          float sat = uv.y;  //ja: 縦に彩度 //en: saturation upward
          vec3 col = hsv2rgb(vec3(hue, sat, 0.95));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`uv.x` を `uv.x + time * 0.1` にすると、色の輪が流れます。`sat` を `1.0` にして、`0.95` を `uv.y` にすると?",
        en: "Change `uv.x` to `uv.x + time * 0.1` and the color wheel scrolls. What if `sat` is `1.0` and `0.95` becomes `uv.y`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "HSV の便利なところは、色相に何かを足すだけで **鮮やかさと明るさをそろえたまま** 色を変えられることです。下の絵では、中心からの距離で色相を少しずつ回しているので、同心円のしまがグラデーションのように虹色に並びます。",
        en: "The great thing about HSV is that adding something to the hue changes the color **while keeping saturation and brightness the same**. Below, the hue turns a little with distance from the center, so the concentric stripes form a smooth rainbow.",
      },
    },
    {
      type: "playground",
      source: `
        vec3 hsv2rgb(vec3 c) {
          vec3 k = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), k, c.y);
        }

        vec4 render(vec2 uv, vec2 p) {
          float d = length(p);
          float rings = smoothstep(0.3, 0.7, sin(d * 30.0) * 0.5 + 0.5);    //ja: 同心円のしま //en: concentric stripes
          float fade = 1.0 - smoothstep(0.5, 1.0, d);
          vec3 ringColor = hsv2rgb(vec3(d * 0.8 - time * 0.1, 0.65, 1.0));  //ja: 距離で色相を回す //en: hue turns with distance
          vec3 col = mix(vec3(0.04, 0.03, 0.08), ringColor, rings * fade);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "彩度の `0.65` を `0.3` や `1.0` にすると? `d * 0.8` を `p.x * 0.3` にすると、色の並び方はどう変わるでしょう?",
        en: "Change the saturation `0.65` to `0.3` or `1.0`. With `p.x * 0.3` instead of `d * 0.8`, how are the colors arranged now?",
      },
    },

    { type: "heading", text: { ja: "コサインパレット", en: "Cosine palettes" } },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つ、少しの数で配色を作れる便利な関数があります。Inigo Quilez さんが広めた **コサインパレット** です。このコースでは、この名前・この中身で使います。",
        en: "One more handy function builds whole color schemes from a few numbers: the **cosine palette**, popularized by Inigo Quilez. This course always uses it with this name and body.",
      },
    },
    {
      type: "code",
      source: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "t は 0〜1 の数で、t を進めると色が変わっていきます。赤・緑・青のそれぞれが、cos の波で上がったり下がったりするしくみです。4 つの `vec3` は、それぞれの波の形を決めます(x が赤、y が緑、z が青の波)。",
        en: "t is a number from 0 to 1, and the color changes as t advances. Each of red, green and blue rides its own cosine wave up and down. The four `vec3`s set the shape of those waves (x for red, y for green, z for blue).",
      },
    },
    {
      type: "list",
      items: [
        { ja: "`a` … 波のまん中の高さ。色全体の明るさ", en: "`a` … the middle height of each wave: overall brightness" },
        { ja: "`b` … 波の振れ幅。大きいほど色の変化が強い(コントラスト)", en: "`b` … how far each wave swings: bigger means stronger contrast" },
        { ja: "`c` … t が 0〜1 進む間に、波が何回くり返すか", en: "`c` … how many times each wave repeats while t goes from 0 to 1" },
        { ja: "`d` … 波の始まりの位置(位相)。r・g・b でずらすと、色相が回る", en: "`d` … where each wave starts (its phase). Offsetting r, g and b from each other makes the hue turn" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "たとえば a = b = (0.5, 0.5, 0.5)、c = (1, 1, 1) なら、どのチャンネルも 0〜1 の間を 1 回ずつ往復します。d = (0, 0, 0) だと 3 色がそろって動くので、白 → 黒 → 白の灰色になります。d = (0.0, 0.33, 0.67) のように 3 分の 1 ずつずらすと、虹のような色になります。下の playground では、上半分にパレットを、下半分に r・g・b の 3 本の波をグラフで描いています。",
        en: "With a = b = (0.5, 0.5, 0.5) and c = (1, 1, 1), each channel swings once between 0 and 1. With d = (0, 0, 0) all three move together, giving grays from white to black and back. Offset them by thirds, d = (0.0, 0.33, 0.67), and you get a rainbow. The playground below shows the palette on top and graphs the r, g and b waves underneath.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.025, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.0, 0.33, 0.67);
          vec3 pal = palette(uv.x, a, b, c, d);

          vec3 col = pal;
          if (uv.y < 0.5) {
            //ja: 下半分: r・g・b の波のグラフ
            //en: bottom half: graphs of the r, g and b waves
            vec2 q = vec2(uv.x, uv.y * 2.4 - 0.1);
            col = vec3(0.08);
            col += plot(q, pal.r) * vec3(1.0, 0.25, 0.25);
            col += plot(q, pal.g) * vec3(0.25, 1.0, 0.25);
            col += plot(q, pal.b) * vec3(0.3, 0.45, 1.0);
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`d` を `vec3(0.0)` にすると? `vec3(0.0, 0.1, 0.2)` にすると? `c` を `vec3(2.0)` にすると、波は何回くり返すでしょう?",
        en: "Set `d` to `vec3(0.0)`, then to `vec3(0.0, 0.1, 0.2)`. With `c` at `vec3(2.0)`, how many times do the waves repeat?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "グラフと見比べると、どこで何色になるかがわかります。赤の波だけが高いところは赤、赤と緑が高いところは黄色、3 本とも高いところは白に近くなります。気に入った組み合わせを見つけたら、数をメモしておきましょう。よく使われる例をいくつか挙げておきます。",
        en: "Compare with the graph to see why each color appears where it does: where only red is high you get red, red and green high gives yellow, and all three high is nearly white. When you find a combination you like, note the numbers down. Here are some popular ones:",
      },
    },
    {
      type: "code",
      source: `
        //ja: a, b, c, d の順
        //en: in order: a, b, c, d
        //ja: 虹
        //en: rainbow
        vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)
        //ja: 暖色と寒色
        //en: warm and cool
        vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2)
        //ja: 黄色から深い青緑
        //en: yellow to deep teal
        vec3(0.5), vec3(0.5), vec3(1.0, 1.0, 0.5), vec3(0.8, 0.9, 0.3)
        //ja: ポップ
        //en: pop
        vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.2, 0.25)
        //ja: やわらかい赤と緑
        //en: soft reds and greens
        vec3(0.8, 0.5, 0.4), vec3(0.2, 0.4, 0.2), vec3(2.0, 1.0, 1.0), vec3(0.0, 0.25, 0.25)
      `,
    },
    {
      type: "paragraph",
      text: {
        ja: "パレットは、画面全体のグラデーションだけでなく、**いくつもの図形に色を配る** のにも便利です。t を 0.2 ずつずらして 5 色を取り出すと、なじみのよい 5 色の組み合わせが手に入ります。背景も同じパレットから暗めに取ると、全体の色がまとまります。",
        en: "Palettes aren't only for full-screen gradients; they are great for **handing out colors to several shapes**. Take five colors at t steps of 0.2 and you have five colors that sit well together. Take the background from the same palette, darkened, and the whole picture feels unified.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        //ja: この絵で使うパレット
        //en: the palette for this picture
        vec3 pal(float t) {
          return palette(t, vec3(0.65, 0.55, 0.6), vec3(0.35, 0.35, 0.3), vec3(1.0), vec3(0.0, 0.15, 0.3));
        }
        //ja: 中心 c、半径 r の円のマスク
        //en: the mask of a circle with center c and radius r
        float disc(vec2 p, vec2 c, float r) {
          float px = 2.0 / resolution.y;
          return 1.0 - smoothstep(-px, px, sdCircle(p - c, r));
        }

        vec4 render(vec2 uv, vec2 p) {
          float shift = time * 0.05;                    //ja: ゆっくり色を回す //en: rotate the colors slowly
          vec3 col = pal(uv.y * 0.3 + 0.55 + shift) * 0.35;  //ja: 背景も同じパレットから暗めに //en: the background, darker, from the same palette
          col = mix(col, pal(0.0 + shift), disc(p, vec2(-0.9, -0.2), 0.35));
          col = mix(col, pal(0.2 + shift), disc(p, vec2(-0.45, 0.1), 0.35));
          col = mix(col, pal(0.4 + shift), disc(p, vec2(0.0, -0.15), 0.35));
          col = mix(col, pal(0.6 + shift), disc(p, vec2(0.45, 0.15), 0.35));
          col = mix(col, pal(0.8 + shift), disc(p, vec2(0.9, -0.1), 0.35));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`pal` の中の `vec3(0.0, 0.15, 0.3)` を `vec3(0.0, 0.33, 0.67)` にすると、5 つの円の色はどう変わるでしょう? `shift` を `0.0` にすると、色の流れが止まります",
        en: "Inside `pal`, change `vec3(0.0, 0.15, 0.3)` to `vec3(0.0, 0.33, 0.67)`. How do the five circles change? Set `shift` to `0.0` to stop the colors drifting",
      },
    },

    { type: "heading", text: { ja: "ガンマをちょっとだけ", en: "A little about gamma" } },
    {
      type: "paragraph",
      text: {
        ja: "最後に、色の数と見た目の明るさの関係を、少しだけ見ておきます。画面は、色の数 0.5 を「光の量の半分」としては表示しません。だいたい 0.5 の 2.2 乗、つまり約 0.22 の光しか出しません。人の目は暗いところの違いに敏感なので、0〜1 の数を暗いほうに細かく割り振っておくためです。この、数と光の量のずれを **ガンマ** と呼びます。",
        en: "Finally, a quick look at how color numbers relate to brightness on screen. A screen does not show the number 0.5 as half the light. It emits roughly 0.5 to the power of 2.2 — about 0.22 of the light. Our eyes are more sensitive to differences in the dark, so the 0–1 range is spent more finely on dark shades. This mismatch between numbers and light is called **gamma**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ふだんは気にしなくてかまいません。目で見て選んだ色は、最初からこの「画面用の数」になっているからです。困るのは、**光の量として計算したい** ときです。たとえば赤 (1, 0, 0) と緑 (0, 1, 0) を mix で半分ずつ混ぜると (0.5, 0.5, 0) になりますが、画面ではそれぞれ約 0.22 の光しか出ないので、まん中が暗くにごって見えます。",
        en: "Most of the time you can ignore it: colors you picked by eye are already in these screen numbers. It matters when you want to **compute with amounts of light**. Mix red (1, 0, 0) and green (0, 1, 0) half and half and you get (0.5, 0.5, 0), but on screen each channel emits only about 0.22 of its light, so the middle looks dark and muddy.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "光の量で正しく混ぜるには、混ぜる前に `pow(色, vec3(2.2))` で「光の量」に直し、混ぜた後で `pow(色, vec3(1.0 / 2.2))` で「画面用の数」に戻します。この最後の一手を **ガンマ補正** と呼びます。",
        en: "To mix as light, convert to light amounts with `pow(color, vec3(2.2))` before mixing, then convert back to screen numbers with `pow(color, vec3(1.0 / 2.2))` afterward. That final step is called **gamma correction**.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          vec3 a = vec3(1.0, 0.1, 0.1);
          vec3 b = vec3(0.1, 1.0, 0.2);
          vec3 col;
          if (uv.y > 0.5) {
            col = mix(a, b, uv.x);                                   //ja: 上: そのまま混ぜる //en: top: mixed as-is
          } else {
            col = mix(pow(a, vec3(2.2)), pow(b, vec3(2.2)), uv.x);  //ja: 下: 光の量に直してから混ぜる //en: bottom: mixed as light
            col = pow(col, vec3(1.0 / 2.2));                         //ja: 画面用の数に戻す(ガンマ補正) //en: back to screen numbers (gamma correction)
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "上の帯は、まん中がにごったオリーブ色になります。下の帯は、明るい黄色を通ります。`a` と `b` を青 `vec3(0.1, 0.2, 1.0)` と黄 `vec3(1.0, 0.9, 0.1)` にしても比べてみましょう",
        en: "The top band dips to a dull olive in the middle; the bottom band passes through a bright yellow. Compare them again with blue `vec3(0.1, 0.2, 1.0)` and yellow `vec3(1.0, 0.9, 0.1)` as `a` and `b`",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ガンマ補正は、光をたくさん足し合わせる場面(光のにじみや 3D の照明)で大事になります。このコースでは [光と仕上げ](/learn/light-and-glow) で、明るすぎる光を整える方法と一緒にきちんと扱い、3D の回では仕上げに `pow(col, vec3(1.0 / 2.2))` を付けます。それまでは、目で見て選んだ色をそのまま使ってかまいません。",
        en: "Gamma correction matters most when you add up lots of light, as in glows and 3D lighting. This course covers it properly in [Light and finishing](/learn/light-and-glow), together with taming over-bright light, and the 3D lessons finish with `pow(col, vec3(1.0 / 2.2))`. Until then, colors picked by eye are fine as they are.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "[関数で形を作る](/learn/shaping-functions) で見たとおり、`pow` はマイナスの数に使えません。色がマイナスになりうるときは、`pow(max(col, 0.0), vec3(1.0 / 2.2))` のようにしてから使います。",
        en: "As you saw in [Shaping functions](/learn/shaping-functions), `pow` must not see negative numbers. If a color might go negative, write `pow(max(col, 0.0), vec3(1.0 / 2.2))`.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "ここからは、絵として見て楽しいものを目指しましょう。重ねる順番と、色の選び方がポイントです。",
        en: "From here on, aim for pictures that are a pleasure to look at. Layer order and color choice are what count.",
      },
    },
    {
      type: "exercise",
      title: { ja: "目玉焼き", en: "A fried egg" },
      prompt: {
        ja: "青い皿の上に目玉焼きを描いてください。白身は円を 3 つ `min` でつないだ、少しいびつな形にします。その上に黄身、黄身の左上に小さな光、白身の右下にぼんやりした半透明の影を付けます。",
        en: "Draw a fried egg on a blue plate. Make the egg white a slightly lumpy shape by joining three circles with `min`. Put the yolk on top, a small highlight on the yolk's upper left, and a soft, translucent shadow under the white toward the lower right.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.95, 0.85, 0.7), vec3(0.85, 0.7, 0.55), uv.y);                  //ja: テーブル //en: table
          col = mix(col, vec3(0.4, 0.6, 0.9), 1.0 - smoothstep(-px, px, sdCircle(p, 0.8)));    //ja: 皿 //en: plate
          col = mix(col, vec3(1.0, 0.98, 0.94), 1.0 - smoothstep(-px, px, sdCircle(p, 0.4)));  //ja: 白身(いまは丸いだけ) //en: egg white (just a circle for now)
          //ja: 白身の形・黄身・影・光を足す
          //en: shape the white, then add the yolk, a shadow and a highlight
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        //ja: 白身の形: 3 つの円を min でつなぐ
        //en: the egg white: three circles joined with min
        float eggWhite(vec2 p) {
          float a = sdCircle(p - vec2(-0.12, 0.05), 0.38);
          float b = sdCircle(p - vec2(0.2, -0.05), 0.32);
          float c = sdCircle(p - vec2(0.0, -0.2), 0.3);
          return min(a, min(b, c));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.95, 0.85, 0.7), vec3(0.85, 0.7, 0.55), uv.y);                         //ja: テーブル //en: table
          col = mix(col, vec3(0.3, 0.5, 0.8), 1.0 - smoothstep(-px, px, sdCircle(p, 0.8)));           //ja: 皿のふち //en: plate rim
          col = mix(col, vec3(0.4, 0.6, 0.9), 1.0 - smoothstep(-px, px, sdCircle(p, 0.72)));          //ja: 皿の内側 //en: plate center

          float shadow = 1.0 - smoothstep(-0.05, 0.08, eggWhite(p - vec2(0.04, -0.05)));              //ja: ずらしてぼかす //en: shifted and blurred
          col = mix(col, vec3(0.1, 0.15, 0.35), shadow * 0.4);                                         //ja: 1. 影 //en: 1. shadow
          col = mix(col, vec3(1.0, 0.98, 0.94), 1.0 - smoothstep(-px, px, eggWhite(p)));              //ja: 2. 白身 //en: 2. white
          col = mix(col, vec3(1.0, 0.6, 0.1), 1.0 - smoothstep(-px, px, sdCircle(p - vec2(0.02, 0.0), 0.17)));  //ja: 3. 黄身 //en: 3. yolk
          float shine = 1.0 - smoothstep(-px, px, sdCircle(p - vec2(-0.04, 0.06), 0.04));
          col = mix(col, vec3(1.0), shine * 0.7);                                                      //ja: 4. 光 //en: 4. highlight
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "重ねる順番は、皿 → 影 → 白身 → 黄身 → 光です。後に書いた mix が上に来ます",
          en: "The layer order is plate → shadow → white → yolk → highlight. Each later mix lands on top",
        },
        {
          ja: "影は、白身と同じ形を少し右下にずらし、smoothstep の幅を広くしてぼかし、mask に 0.4 をかけて半透明にします",
          en: "For the shadow, take the white's shape, shift it slightly down and right, blur it with a wide smoothstep, and multiply its mask by 0.4 to make it translucent",
        },
        {
          ja: "白身の形は 2 回使うので、`float eggWhite(vec2 p)` という関数にまとめます。影は `eggWhite(p - vec2(0.04, -0.05))` で、右下にずれた形になります",
          en: "You need the white's shape twice, so wrap it in a function, `float eggWhite(vec2 p)`. Then `eggWhite(p - vec2(0.04, -0.05))` gives the same shape moved down and right for the shadow",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "夕焼けパレットを作る", en: "Design a sunset palette" },
      prompt: {
        ja: "`palette` の a・b・c・d を調整して、t = 0 で深い青、t = 0.5 で紫、t = 1 でオレンジになる「夕焼けパレット」を作ってください。下半分のグラフで、r・g・b の波を見ながら調整します。",
        en: "Tune `palette`'s a, b, c and d to make a sunset palette: deep blue at t = 0, purple at t = 0.5 and orange at t = 1. Use the graph in the bottom half to watch the r, g and b waves as you adjust.",
      },
      starter: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.025, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: ここの 4 つを調整する
          //en: tune these four
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.0, 0.33, 0.67);
          vec3 pal = palette(uv.x, a, b, c, d);

          vec3 col = pal;
          if (uv.y < 0.5) {
            vec2 q = vec2(uv.x, uv.y * 2.4 - 0.1);
            col = vec3(0.08);
            col += plot(q, pal.r) * vec3(1.0, 0.25, 0.25);
            col += plot(q, pal.g) * vec3(0.25, 1.0, 0.25);
            col += plot(q, pal.b) * vec3(0.3, 0.45, 1.0);
          }
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        float plot(vec2 q, float y) {
          return 1.0 - smoothstep(0.0, 0.025, abs(q.y - y));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 a = vec3(0.55, 0.35, 0.3);
          vec3 b = vec3(0.45, 0.25, 0.3);
          vec3 c = vec3(0.5, 0.5, 0.5);   //ja: 0〜1 で波の半分だけ進む //en: only half a wave over 0..1
          vec3 d = vec3(0.5, 0.5, 0.8);   //ja: 赤と緑は谷から山へ、青は途中で山になる //en: red and green go trough to peak; blue peaks midway
          vec3 pal = palette(uv.x, a, b, c, d);

          vec3 col = pal;
          if (uv.y < 0.5) {
            vec2 q = vec2(uv.x, uv.y * 2.4 - 0.1);
            col = vec3(0.08);
            col += plot(q, pal.r) * vec3(1.0, 0.25, 0.25);
            col += plot(q, pal.g) * vec3(0.25, 1.0, 0.25);
            col += plot(q, pal.b) * vec3(0.3, 0.45, 1.0);
          }
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "c を 0.5 にすると、t が 0〜1 進む間に波は半分(谷から山へ、など 1 回)しか動きません。端から端へ「一方向に」変わる色が作りやすくなります",
          en: "With c at 0.5, each wave moves only half a cycle (say, trough to peak) as t goes 0 to 1. That makes it easy to build colors that change in one direction from end to end",
        },
        {
          ja: "c = 0.5 で d = 0.5 にすると、そのチャンネルは t = 0 で谷(a - b)、t = 1 で山(a + b)になります。赤は 0.1 から 1.0 へ上がってほしいので、a = 0.55、b = 0.45 です",
          en: "With c = 0.5 and d = 0.5, a channel sits at its trough (a - b) at t = 0 and its peak (a + b) at t = 1. Red should climb from 0.1 to 1.0, so a = 0.55 and b = 0.45",
        },
        {
          ja: "答えの一例: `a = vec3(0.55, 0.35, 0.3)`、`b = vec3(0.45, 0.25, 0.3)`、`c = vec3(0.5)`、`d = vec3(0.5, 0.5, 0.8)`。青は d = 0.8 にして、まん中で山になるようにしています",
          en: "One answer: `a = vec3(0.55, 0.35, 0.3)`, `b = vec3(0.45, 0.25, 0.3)`, `c = vec3(0.5)`, `d = vec3(0.5, 0.5, 0.8)`. Blue uses d = 0.8 so that it peaks in the middle",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "輪のある惑星", en: "A ringed planet" },
      prompt: {
        ja: "しま模様の惑星と、そのまわりを回る輪を描いてください。輪の上半分は惑星の **後ろ** を、下半分は **前** を通ります。重ねる順番で前後を表しましょう。惑星のしまの色は `palette` で選び、左上から光が当たっているように、右下を暗くします。",
        en: "Draw a striped planet with a ring around it. The upper half of the ring passes **behind** the planet and the lower half **in front**; show this with layer order. Pick the planet's stripe colors with `palette`, and darken the lower right as if light were coming from the upper left.",
      },
      starter: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.02, 0.02, 0.06), vec3(0.1, 0.05, 0.2), uv.y);  //ja: 宇宙 //en: space

          vec2 q = p * vec2(1.0, 4.0);  //ja: 縦を縮めた座標 → 平たい輪 //en: squashed coordinates → a flat ring
          float l = length(q);
          float ring = smoothstep(0.65, 0.68, l) * (1.0 - smoothstep(0.95, 0.98, l));
          float planet = 1.0 - smoothstep(-px, px, sdCircle(p, 0.45));

          col = mix(col, vec3(0.9, 0.6, 0.4), planet);    //ja: 惑星(いまは 1 色) //en: planet (one flat color for now)
          col = mix(col, vec3(0.9, 0.85, 0.7), ring);     //ja: 輪(いまは全部が手前) //en: ring (all in front for now)
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.02, 0.02, 0.06), vec3(0.1, 0.05, 0.2), uv.y);  //ja: 宇宙 //en: space
          float d = sdCircle(p, 0.45);
          col += (1.0 - smoothstep(0.0, 0.25, d)) * vec3(0.15, 0.1, 0.25);     //ja: 大気のにじみ //en: a faint atmosphere

          vec2 q = p * vec2(1.0, 4.0);
          float l = length(q);
          float ring = smoothstep(0.65, 0.68, l) * (1.0 - smoothstep(0.95, 0.98, l));
          vec3 ringColor = palette(l * 2.0, vec3(0.75), vec3(0.15), vec3(1.0), vec3(0.1, 0.15, 0.25));
          float back = step(0.0, p.y);  //ja: 上半分 = 惑星の後ろ //en: upper half = behind the planet

          //ja: しま: 高さ p.y で色を選び、sin で少し波打たせる
          //en: stripes: pick the color by height p.y, with a slight sin wobble
          float t = p.y * 3.0 + 0.05 * sin(p.x * 8.0 + p.y * 20.0);
          vec3 planetColor = palette(t, vec3(0.7, 0.55, 0.4), vec3(0.25, 0.2, 0.15), vec3(1.0), vec3(0.0, 0.05, 0.1));
          float light = 1.0 - smoothstep(0.0, 0.8, length(p - vec2(-0.2, 0.2)));
          planetColor *= 0.25 + 0.9 * light;  //ja: 左上から光 //en: lit from the upper left

          col = mix(col, ringColor, ring * back * 0.85);                         //ja: 1. 後ろの輪 //en: 1. back of the ring
          col = mix(col, planetColor, 1.0 - smoothstep(-px, px, d));             //ja: 2. 惑星 //en: 2. planet
          col = mix(col, ringColor, ring * (1.0 - back) * 0.85);                 //ja: 3. 前の輪 //en: 3. front of the ring
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "輪を 2 つに分けます。`step(0.0, p.y)` は上半分で 1、下半分で 0 です。輪の mask にこれをかけると後ろ半分、`1.0 - step(0.0, p.y)` をかけると前半分になります",
          en: "Split the ring in two. `step(0.0, p.y)` is 1 in the upper half and 0 in the lower. Multiply the ring mask by it for the back half, or by `1.0 - step(0.0, p.y)` for the front half",
        },
        {
          ja: "順番は、後ろの輪 → 惑星 → 前の輪です。惑星が後ろの輪を隠し、前の輪が惑星の上に重なります",
          en: "The order is back of the ring → planet → front of the ring. The planet hides the back half, and the front half crosses over the planet",
        },
        {
          ja: "しまは `palette(p.y * 3.0, …)` のように、高さで色を選ぶとできます。暗くするには、左上の点からの距離で `1.0 - smoothstep(0.0, 0.8, length(p - vec2(-0.2, 0.2)))` を作って色にかけます",
          en: "For stripes, pick the color by height, e.g. `palette(p.y * 3.0, …)`. For shading, build `1.0 - smoothstep(0.0, 0.8, length(p - vec2(-0.2, 0.2)))` from the distance to a point in the upper left and multiply the color by it",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`mix(a, b, t)` は a と b を t の割合で混ぜる。t は 0〜1 で使い、シェーピング関数で混ざり方を変えられる",
          en: "`mix(a, b, t)` blends a and b by t; keep t in 0–1 and shape it with shaping functions",
        },
        {
          ja: "図形は `col = mix(col, shapeColor, mask)` で重ねる。後に書いたものが上。mask を小さくすると半透明",
          en: "Layer shapes with `col = mix(col, shapeColor, mask)`: later lines go on top, and a smaller mask means translucent",
        },
        {
          ja: "乗算は暗く(影・インク)、スクリーンは明るく(1 を超えない)、加算は光を足す(白く飛ぶ)",
          en: "Multiply darkens (shadow, ink), screen brightens without passing 1, and add piles up light (and blows out)",
        },
        {
          ja: "`hsv2rgb` で色相・彩度・明度から色を作れる。色相を回すと、鮮やかさをそろえたまま色が変わる",
          en: "`hsv2rgb` builds color from hue, saturation and value; turning the hue keeps the vividness steady",
        },
        {
          ja: "`palette(t, a, b, c, d)` は 4 つの `vec3` で配色を決める。a 明るさ、b 強さ、c くり返し、d ずれ",
          en: "`palette(t, a, b, c, d)` sets a scheme with four `vec3`s: a brightness, b contrast, c repeats, d phase",
        },
        {
          ja: "画面の数と光の量は違う(ガンマ)。光として計算したら、最後に `pow(col, vec3(1.0 / 2.2))`",
          en: "Screen numbers aren't amounts of light (gamma); if you compute in light, finish with `pow(col, vec3(1.0 / 2.2))`",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、`time` を使って図形を動かします。往復・回転・点滅・イージングで、ここまで描いてきた絵に動きを付けましょう。",
        en: "Next time we use `time` to set shapes in motion. With back-and-forth swings, orbits, blinking and easing, you'll bring the pictures you've drawn so far to life.",
      },
    },
  ],
};

export default lesson;
