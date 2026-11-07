import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "raymarching",
  title: { ja: "レイマーチング", en: "Raymarching" },
  summary: {
    ja: "距離関数を少しずつたどって、3D の形を描く",
    en: "Step along distance functions to draw 3D shapes",
  },
  minutes: 55,
  goals: [
    {
      ja: "式で当たりを解けない形でも描ける理由(距離がわかれば安全に進める)を説明できる",
      en: "Explain why shapes with no hit formula can still be drawn: knowing the distance lets you step safely",
    },
    {
      ja: "3D の距離関数 `sdSphere` と床 `p.y + h` を書き、`map` 関数に場面をまとめられる",
      en: "Write the 3D distance functions `sdSphere` and the floor `p.y + h`, and gather a scene into a `map` function",
    },
    {
      ja: "64 歩のレイマーチのループ(当たりの判定と遠くでの打ち切り)を書ける",
      en: "Write the 64-step raymarching loop, with its hit test and far cutoff",
    },
    {
      ja: "何歩かかったかを色で見て、重い所やうまくいかない所を見つけられる",
      en: "Visualize the step count as color to find slow spots and trouble spots",
    },
    {
      ja: "一色の画面・おかしな色の帯・途切れる遠景など、よくある失敗の原因がわかる",
      en: "Recognize the causes of common failures: flat screens, stray bands of color, backgrounds that end too soon",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "式で解けない形", en: "Shapes with no formula" } },
    {
      type: "paragraph",
      text: {
        ja: "[レイとカメラ](/learn/rays-and-camera) では、床と球を描きました。どちらも「レイが何だけ進むと当たるか」を式で解けたからです。床は割り算 1 回、球は 2 次方程式でした。",
        en: "In [Rays and cameras](/learn/rays-and-camera) we drew a floor and a sphere. Both worked because we could solve \"how far does the ray go before it hits?\" with algebra: one division for the floor, a quadratic equation for the sphere.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "でも、形が少し複雑になると、とたんに式は手に負えなくなります。ドーナツ形(トーラス)は 4 次方程式になり、2 つの球を [距離で描く](/learn/sdf-2d) の `smin` でなめらかにくっつけた形には、解ける式がそもそもありません。形ごとに式を解くやり方では、作れるものがすぐに行き止まりになります。",
        en: "As soon as shapes get a little more complex, though, the algebra gets out of hand. A doughnut (a torus) needs a fourth-degree equation, and two spheres blended with the `smin` from [Drawing with distance](/learn/sdf-2d) have no solvable formula at all. Solving an equation per shape quickly leads to a dead end.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "そこで発想を変えます。「どこで当たるか」は解けなくても、「**いまいる点から、いちばん近い表面までの距離**」なら、たいていの形で簡単に計算できます。2D の回で何度も書いてきた **距離関数**(SDF)です。この回では、距離関数だけを頼りにレイを少しずつ進めて形を描く **レイマーチング** を作ります。この先の 3D の回は、すべてこの方法の上に建っています。",
        en: "So we change our thinking. Even when \"where does it hit?\" can't be solved, \"**how far is the nearest surface from where I am now?**\" is usually easy to compute. That is the **distance function** (SDF) you wrote many times in the 2D lessons. In this lesson we build **raymarching**: drawing shapes by stepping a ray forward bit by bit, guided only by a distance function. Every 3D lesson from here on is built on it.",
      },
    },

    { type: "heading", text: { ja: "3D の距離関数", en: "Distance functions in 3D" } },
    {
      type: "paragraph",
      text: {
        ja: "2D の円の距離関数 `sdCircle` は `length(p) - r` でした。3D の球もまったく同じ形で、`p` が `vec3` になるだけです。`length` は `vec3` にも使え、3 つの数の 2 乗の和の平方根、つまり 3D での原点からの距離を返します。",
        en: "The 2D circle's distance function, `sdCircle`, was `length(p) - r`. The 3D sphere has exactly the same form; `p` just becomes a `vec3`. `length` works on a `vec3` too, returning the square root of the sum of the three squares: the distance from the origin in 3D.",
      },
    },
    {
      type: "code",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        //ja: 高さ -h の床(平らな面)までの距離
        //en: distance to a floor (a flat plane) at height -h
        float ground = p.y + h;
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`sdSphere(p, 1.0)` は、`p = (0, 3, 0)` なら 3 - 1 = 2(外に 2 離れている)、`p = (0.6, 0, 0.8)` なら長さがちょうど 1 なので 0(表面の上)、`p = (0, 0.5, 0)` なら -0.5(内側)",
          en: "`sdSphere(p, 1.0)` gives 3 - 1 = 2 at `p = (0, 3, 0)` (2 units outside), 0 at `p = (0.6, 0, 0.8)` since its length is exactly 1 (on the surface), and -0.5 at `p = (0, 0.5, 0)` (inside)",
        },
        {
          ja: "平らな床でいちばん近い点は、いつも真下にあります。だから床までの距離は、ただの高さの差 `p.y + h` です。床の高さが -1(`h = 1`)なら、`y = 2` の点で 3、床の上で 0、床の下では負になります",
          en: "On a flat floor, the nearest point is always straight down, so the distance is simply the height difference `p.y + h`. With the floor at height -1 (`h = 1`), a point at `y = 2` is 3 away, a point on the floor is 0, and points below it are negative",
        },
        {
          ja: "形を動かすときは、2D と同じく座標のほうをずらします。`sdSphere(p - vec3(1.0, 0.0, 0.0), 0.5)` は、中心が `(1, 0, 0)` で半径 0.5 の球です",
          en: "To move a shape, shift the coordinates, just as in 2D. `sdSphere(p - vec3(1.0, 0.0, 0.0), 0.5)` is a sphere of radius 0.5 centered at `(1, 0, 0)`",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "3D の距離関数は、空間のどの点にも「いちばん近い表面までの距離」という 1 つの数を決めています。画面は平らなので、空間を丸ごと見ることはできませんが、ある奥行き `z` で切った **断面** なら、2D の回と同じ等高線の絵で見られます。下では断面の位置 `z` を時間で前後させています。",
        en: "A 3D distance function assigns one number to every point in space: the distance to the nearest surface. The screen is flat, so we can't see the whole volume at once, but we can look at a **slice** at some depth `z`, using the same contour-line picture as in the 2D lessons. Below, the slice position `z` slides back and forth over time.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 画面を、奥行き z で空間を切った断面として見る
          //en: treat the screen as a slice through space at depth z
          float z = cos(time * 0.8) * 1.2;
          float d = sdSphere(vec3(p, z), 1.0);

          //ja: 外は青、内はオレンジ。しまが等高線
          //en: blue outside, orange inside; the stripes are contour lines
          vec3 col = d > 0.0 ? vec3(0.3, 0.55, 0.95) : vec3(1.0, 0.55, 0.25);
          col *= 1.0 - exp(-4.0 * abs(d));
          col *= 0.8 + 0.2 * cos(40.0 * d);
          col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.015, abs(d)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`cos(time * 0.8) * 1.2` を `0.6` にして止めると、円の半径は √(1 - 0.36) = 0.8 になります。球の半径の `1.0` を `0.5` にすると?",
        en: "Freeze it by replacing `cos(time * 0.8) * 1.2` with `0.6`, and the circle's radius is √(1 - 0.36) = 0.8. What if the sphere's radius `1.0` becomes `0.5`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "断面が球の真ん中(`z = 0`)を通るときは半径 1 の円、端に近づくほど円は小さくなり、`z` が 1 を超えると断面は球に触れず、全部が外側(青)になります。白い線が球の表面、つまり距離がちょうど 0 の所です。そして白い線から離れた場所にも、ちゃんと距離の値が入っていることが、しまの模様からわかります。この「表面から離れた所の距離」こそが、レイマーチングの道しるべになります。",
        en: "When the slice passes through the sphere's middle (`z = 0`), you see a circle of radius 1. Toward the ends the circle shrinks, and once `z` passes 1 the slice misses the sphere and everything is outside (blue). The white line is the surface, where the distance is exactly 0. The stripes show that points far from the white line have distance values too. Those distances away from the surface are exactly what will guide raymarching.",
      },
    },

    { type: "heading", text: { ja: "球を置きながら進む", en: "Stepping with spheres" } },
    {
      type: "paragraph",
      text: {
        ja: "レイの上のある点で距離関数を測って、`d` が返ってきたとします。これは「**この点から半径 `d` の球の中には、何の表面も無い**」という約束です。いちばん近い表面でも `d` 離れているのですから。だとすれば、レイの向きがどちらであっても、`d` だけ進む分には絶対に何も突き抜けません。",
        en: "Say we measure the distance function at some point on the ray and get back `d`. That is a promise: **inside a ball of radius `d` around this point, there is no surface at all**, since even the nearest one is `d` away. So whichever way the ray points, moving forward by `d` can never punch through anything.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "そこで、`d` だけ進みます。進んだ先でまた距離を測り、また進みます。これをくり返すと、レイは何もない所では大またで、表面に近づくと小またになりながら、表面へ吸い寄せられていきます。`d` がとても小さく(たとえば 0.001 未満に)なったら「当たった」とします。何にも当たらないレイは、測るたびに `d` が大きくなってどんどん遠くへ行くので、ある程度遠く(たとえば `t` が 20 を超えたら)であきらめます。この方法を **スフィアトレーシング**(球でたどる方法)と呼びます。",
        en: "So we move forward by `d`. At the new point we measure again, and move again. Repeat, and the ray takes big strides through empty space and smaller ones near a surface, homing in on it. When `d` gets very small (say, under 0.001), we call it a hit. A ray that hits nothing finds `d` growing at each step and races away, so we give up once it is far enough (say, `t` over 20). This method is called **sphere tracing**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下のプレビューは、場面(球と床)を真横から切った断面に、1 本のレイの進み方を描いたものです。黄色い点が立ち寄った点、水色の円がそこで測った「安全な球」です。それぞれの円は、必ずどこかで表面にちょうど触れていることを確かめてください。",
        en: "The preview below shows a side-on slice of a scene (a ball and a floor) with one ray's journey drawn in. The yellow dots are where the ray stopped, and the light-blue circles are the \"safe spheres\" measured there. Notice that each circle just touches a surface somewhere.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }
        float sdSegment(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        float map(vec3 p) {
          float ball = sdSphere(p - vec3(0.6, 0.0, 0.0), 0.5);
          float ground = p.y + 0.7;
          return min(ball, ground);
        }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          //ja: 場面を真横から切った断面(z = 0)。中が茶色
          //en: a side-on slice of the scene (z = 0); brown is inside
          float d = map(vec3(p, 0.0));
          vec3 col = d > 0.0 ? vec3(0.08, 0.1, 0.17) : vec3(0.35, 0.25, 0.22);
          col *= 0.85 + 0.15 * cos(60.0 * d);

          //ja: レイ。向きを時間でゆっくり上下させる
          //en: the ray; its direction slowly tilts up and down
          vec3 ro = vec3(-1.5, 0.3, 0.0);
          vec3 rd = normalize(vec3(1.0, -0.18 + 0.42 * sin(time * 0.5), 0.0));

          float t = 0.0;
          for (int i = 0; i < 24; i++) {
            vec3 pos = ro + rd * t;
            float h = map(pos);
            //ja: 安全な球(断面では円)
            //en: the safe sphere (a circle in this slice)
            float ring = abs(length(p - pos.xy) - h);
            col = mix(col, vec3(0.35, 0.8, 1.0), 0.6 * (1.0 - smoothstep(0.0, 1.5 * px, ring)));
            //ja: 立ち寄った点
            //en: the point where we stopped
            col = mix(col, vec3(1.0, 0.85, 0.3), 1.0 - smoothstep(0.02, 0.02 + 1.5 * px, length(p - pos.xy)));
            if (h < 0.001 || t > 3.5) break;
            t += h;
          }
          //ja: 進んだ道のり
          //en: the path traveled
          float line = sdSegment(p, ro.xy, ro.xy + rd.xy * t);
          col = mix(col, vec3(1.0, 0.85, 0.3), 1.0 - smoothstep(0.004, 0.004 + 1.5 * px, line));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`sin(time * 0.5)` を `1.0` にすると、レイが球のすぐ上をかすめて、小さな円がびっしり並びます。`-1.0` にすると、まっすぐ床へ向かいます",
        en: "Replace `sin(time * 0.5)` with `1.0` and the ray grazes just over the ball, leaving a crowd of tiny circles. With `-1.0` it heads straight for the floor",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "数で 1 本追ってみましょう。目が `(0, 0, -3)`、原点に半径 1 の球があり、レイが少し右へずれた向き `rd ≈ (0.29, 0, 0.96)` に進むとします。",
        en: "Let's follow one ray in numbers. The eye is at `(0, 0, -3)`, a sphere of radius 1 sits at the origin, and the ray heads slightly to the right, `rd ≈ (0.29, 0, 0.96)`.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: [
        { ja: "`t = 0` で測ると `d = 2.0`。2.0 進む", en: "At `t = 0`, we measure `d = 2.0` and move 2.0" },
        { ja: "`t = 2.0` で `d ≈ 0.23`。球のすぐ手前まで来て、歩幅が急に小さくなる", en: "At `t = 2.0`, `d ≈ 0.23`. We are near the sphere and the step suddenly shrinks" },
        { ja: "`t ≈ 2.23` で `d ≈ 0.08`、`t ≈ 2.31` で `d ≈ 0.03`、`t ≈ 2.34` で `d ≈ 0.015`…と、半分以下ずつ小さくなる", en: "At `t ≈ 2.23`, `d ≈ 0.08`; at `t ≈ 2.31`, `d ≈ 0.03`; at `t ≈ 2.34`, `d ≈ 0.015`… each less than half the last" },
        { ja: "9 回目の測定で `d` が 0.001 を下回り、`t ≈ 2.37` で当たりとする", en: "On the ninth measurement `d` drops below 0.001, and we call it a hit at `t ≈ 2.37`" },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "まっすぐ球の中心へ向かうレイなら、1 歩目で `d = 2` 進んだ所がちょうど表面なので、2 回の測定で終わります。逆に、球のふちをわずかにかすめて外れるレイは、表面のすぐそばを小またで歩き続け、抜けきるまでに 40 回近く測ることになります。かかる歩数は、レイによって大きく違うのです。",
        en: "A ray aimed straight at the center lands exactly on the surface after its first step of `d = 2`, so it finishes after two measurements. A ray that just grazes the rim and misses, on the other hand, keeps taking tiny steps along the surface and needs nearly 40 measurements to get clear. The step count varies a lot from ray to ray.",
      },
    },

    { type: "heading", text: { ja: "ループを書く", en: "Writing the loop" } },
    {
      type: "paragraph",
      text: {
        ja: "これをシェーダーにします。場面全体の距離関数を `map` という名前の関数にし、`for` のループでレイを進めます。このサイトではループの回数の上限は 64 までなので、64 歩で打ち切ります。",
        en: "Now let's turn this into a shader. We put the whole scene's distance function in a function called `map` and advance the ray in a `for` loop. This site caps loops at 64 iterations, so we stop after 64 steps.",
      },
    },
    {
      type: "code",
      source: `
        float t = 0.0;                     //ja: 進んだ距離 //en: distance traveled
        for (int i = 0; i < 64; i++) {
          float d = map(ro + rd * t);      //ja: いまの点で距離を測る //en: measure the distance here
          if (d < 0.001 || t > 20.0) break; //ja: 当たった、または遠すぎる //en: a hit, or too far
          t += d;                          //ja: その分だけ進む //en: step forward by that much
        }
        //ja: ループの後、t < 20.0 なら当たり。当たった点は ro + rd * t
        //en: after the loop, t < 20.0 means a hit, at ro + rd * t
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`d < 0.001` が「当たり」の判定。0 ちょうどになるのを待つと永遠に終わらないので、十分近ければよしとする",
          en: "`d < 0.001` is the hit test. Waiting for exactly 0 would take forever, so close enough counts",
        },
        {
          ja: "`t > 20.0` が「遠くで打ち切り」。この先には何も無いとみなして、空の色にする",
          en: "`t > 20.0` is the far cutoff. We assume nothing lies beyond and use the sky color",
        },
        {
          ja: "`break` でループを途中で抜ける。当たった後も歩き続けると、計算の無駄になる",
          en: "`break` exits the loop early. Walking on after a hit is wasted work",
        },
        {
          ja: "64 歩使い切っても当たりも打ち切りも起きなかったレイは、`t < 20.0` なので当たり扱いになる。たいていは表面のすぐそばにいるので、ほぼ正しい",
          en: "A ray that uses up all 64 steps without hitting or passing the cutoff still has `t < 20.0`, so it counts as a hit. It is usually right next to a surface, so that is nearly correct",
        },
      ],
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          return sdSphere(p, 1.0);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.0, -3.0);
          vec3 rd = normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = vec3(0.1, 0.12, 0.2);
          if (t < 20.0) {
            //ja: 当たった。近いほど明るく(前の回と同じ)
            //en: a hit: nearer is brighter (as in the last lesson)
            col = vec3(1.0, 0.45, 0.3) * clamp(1.0 - (t - 2.0), 0.0, 1.0);
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`map` の中を `sdSphere(p - vec3(sin(time), 0.0, 0.0), 1.0)` にすると球が動きます。`64` を `3` にすると、背景が黒くなり、球はぼやけて大きくなります。なぜでしょう?(答えは「よくある失敗」の節で)",
        en: "Change the body of `map` to `sdSphere(p - vec3(sin(time), 0.0, 0.0), 1.0)` and the ball moves. Change `64` to `3` and the background turns black while the ball swells into a blur. Why? (The answer is in \"Common failures\".)",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "前の回で 2 次方程式を解いて描いた球と、同じ絵になりました。でも、このコードには球の式がどこにもありません。`map` の中身を差し替えるだけで、どんな形でも同じループで描けます。",
        en: "It is the same picture as the sphere we drew last time by solving a quadratic. But this code contains no sphere equation anywhere. Swap out the body of `map`, and the same loop draws any shape.",
      },
    },

    { type: "heading", text: { ja: "map に場面をまとめる", en: "Gathering the scene in map" } },
    {
      type: "paragraph",
      text: {
        ja: "物を増やしましょう。複数の形の距離関数を `min` でまとめると、「どれかの表面までのいちばん近い距離」になります。2D で図形の和を `min` で作ったのとまったく同じです。球を 2 つと床を 1 つ、`map` の中で `min` します。[距離で描く](/learn/sdf-2d) で見たとおり、和・積・差で組み合わせた値は、本当の距離 **以下** になります。本当より大きくならないことが、レイマーチングではとても大事です。その理由は、この後の「よくある失敗」で確かめます。",
        en: "Let's add more objects. Combining several distance functions with `min` gives the distance to the nearest surface of any of them. It is exactly how you made unions with `min` in 2D. Here we `min` two balls and a floor inside `map`. As we saw in [Drawing with distance](/learn/sdf-2d), values combined by union, intersection and subtraction are **never more** than the true distance. Never overshooting the truth matters a great deal for raymarching; you will see why in \"Common failures\" below.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "当たった後、何に当たったかで色を変えたくなります。床は高さ -1 の所にあるので、当たった点 `pos` の `pos.y` が -1 にほぼ等しければ床、そうでなければ球、と決められます。床には前の回の市松模様を描き、球は高さで色を変えます。光の当て方は次の回で習うので、ここではまだ平らな色です。",
        en: "After a hit, we want a different color depending on what we hit. The floor is at height -1, so if the hit point `pos` has a `pos.y` of about -1 it is the floor; otherwise it is a ball. The floor gets last lesson's checkerboard, and the balls get a color based on height. Lighting comes next lesson, so the colors are still flat for now.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float ball = sdSphere(p, 1.0);
          float small = sdSphere(p - vec3(1.7, -0.5, -0.6), 0.5);
          float ground = p.y + 1.0;
          return min(min(ball, small), ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.5, 1.2, -4.5);
          vec3 ta = vec3(0.5, -0.2, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            if (pos.y < -0.99) {
              //ja: 床に当たった
              //en: we hit the floor
              float c = mod(floor(pos.x) + floor(pos.z), 2.0);
              col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            } else {
              //ja: 球に当たった。高いほど明るい色
              //en: we hit a ball: lighter color the higher up
              col = mix(vec3(0.45, 0.1, 0.2), vec3(1.0, 0.65, 0.4), (pos.y + 1.0) * 0.5);
            }
            col = mix(col, sky, 1.0 - exp(-t * 0.12));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`map` に `sdSphere(p - vec3(-1.6, -0.3, 0.5), 0.7)` を足して 3 つ目の球を置いてみましょう。`min` をもう 1 つ重ねます",
        en: "Add a third ball, `sdSphere(p - vec3(-1.6, -0.3, 0.5), 0.7)`, to `map`. Wrap one more `min` around it",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "霧を前の回より少し濃く(`0.12`)しているのは、床が `t = 20` の所で打ち切られるからです。20 の所で霧がほぼ空の色になっていれば、床の終わりが見えません。打ち切りの距離と霧の濃さは、いつも組で考えます。",
        en: "The fog is a bit thicker than last time (`0.12`) because the floor is cut off at `t = 20`. If the fog is almost pure sky color by then, you can't see where the floor ends. Always think of the cutoff distance and the fog density as a pair.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`map` の中では `time` も使えます。形の位置を時間で動かせば、物が動く場面になります。カメラも前の回と同じように回してみましょう。ループや色付けのコードは 1 文字も変わりません。変えるのは `map` とカメラだけです。",
        en: "You can use `time` inside `map`, too. Move a shape's position over time, and objects move in the scene. Let's also orbit the camera as in the last lesson. The loop and the coloring code don't change by a single character; only `map` and the camera do.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float ball = sdSphere(p, 1.0);
          //ja: 大きい球のまわりを回りながら、はずむ球
          //en: a ball that circles the big one while bouncing
          vec3 c = vec3(1.7 * cos(time), -0.5 + abs(sin(time * 3.0)), 1.7 * sin(time));
          float small = sdSphere(p - c, 0.5);
          float ground = p.y + 1.0;
          return min(min(ball, small), ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          float a = time * 0.2;
          vec3 ta = vec3(0.0, -0.2, 0.0);
          vec3 ro = ta + vec3(5.0 * sin(a), 1.6, -5.0 * cos(a));
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            if (pos.y < -0.99) {
              float c = mod(floor(pos.x) + floor(pos.z), 2.0);
              col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            } else {
              col = mix(vec3(0.45, 0.1, 0.2), vec3(1.0, 0.65, 0.4), (pos.y + 1.0) * 0.5);
            }
            col = mix(col, sky, 1.0 - exp(-t * 0.12));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`abs(sin(time * 3.0))` を `abs(sin(time * 3.0)) * 2.0` にすると高くはずみます。大きい球の半径 `1.0` を `0.8 + 0.2 * sin(time * 2.0)` にすると脈を打ちます",
        en: "Change `abs(sin(time * 3.0))` to `abs(sin(time * 3.0)) * 2.0` for higher bounces. Make the big ball's radius `0.8 + 0.2 * sin(time * 2.0)` and it pulses",
      },
    },

    { type: "heading", text: { ja: "何歩かかったかを色で見る", en: "Step counts as a heat map" } },
    {
      type: "paragraph",
      text: {
        ja: "レイマーチは、レイによってかかる歩数がまったく違いました。どこで歩数がかかっているかは、そのまま色にすると一目でわかります。ループの中で数を数え、64 で割って 0〜1 にし、黒 → 赤 → 黄 → 白 の「熱」の色にします。`s * 3.0` を赤、`s * 3.0 - 1.0` を緑、`s * 3.0 - 2.0` を青にして 0〜1 に切り詰めると、`s` が 1/3 で赤、2/3 で黄、1 で白になります。",
        en: "We saw that the number of steps varies wildly between rays. Turning the count straight into a color shows at a glance where the steps are going. Count inside the loop, divide by 64 to get 0–1, and map it to a \"heat\" ramp of black → red → yellow → white. Using `s * 3.0` as red, `s * 3.0 - 1.0` as green and `s * 3.0 - 2.0` as blue, each clamped to 0–1, gives red at `s` = 1/3, yellow at 2/3 and white at 1.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float ball = sdSphere(p, 1.0);
          float small = sdSphere(p - vec3(1.7, -0.5, -0.6), 0.5);
          float ground = p.y + 1.0;
          return min(min(ball, small), ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.5, 1.2, -4.5);
          vec3 ta = vec3(0.5, -0.2, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          float steps = 0.0;  //ja: 測った回数 //en: how many times we measured
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            steps += 1.0;
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          float s = steps / 64.0;
          //ja: 黒 → 赤 → 黄 → 白
          //en: black -> red -> yellow -> white
          vec3 col = clamp(vec3(s * 3.0, s * 3.0 - 1.0, s * 3.0 - 2.0), 0.0, 1.0);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.001` を `0.01` にすると全体が暗く(歩数が少なく)なります。`20.0` を `60.0` にすると、空のどこが重くなるでしょう?",
        en: "Change `0.001` to `0.01` and everything darkens (fewer steps). Change `20.0` to `60.0`: which parts of the sky get heavier?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "球の正面は暗く、数歩で当たっています。明るいのは、球のふち(表面をかすめるレイ)と、地平線の近くの床です。遠くの床を見るレイは、床とほとんど平行に進むので、1 歩ごとに床までの距離(高さ)が少ししか減らず、なかなか届きません。白くなっている所は 64 歩を使い切ったレイで、本当はまだ当たっていないかもしれない所です。",
        en: "The fronts of the balls are dark: they are hit in a few steps. The bright areas are the balls' rims (rays grazing the surface) and the floor near the horizon. A ray looking at the distant floor travels almost parallel to it, so each step only shaves a little off its height, and it takes ages to arrive. White areas are rays that used up all 64 steps and may not truly have hit anything yet.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "この熱の地図は、重さを調べるときにも、うまく描けないときにも役に立ちます。画面のほとんどが赤や黄なら、その場面は重く、歩数の上限やシーンの作りを見直す合図です。描きたい形の所が白くなっているなら、歩数が足りずに穴があいている可能性があります。",
        en: "This heat map helps both when chasing performance and when something won't render right. If most of the screen is red or yellow, the scene is heavy, and it is time to rethink the step budget or how the scene is built. If the shape you care about shows up white, it may be getting holes from running out of steps.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "このサイトの投稿チェックでは、1 コマを 8 ms 以内で描けることが条件です。レイマーチは「ピクセルの数 × 歩数 × `map` の重さ」で時間がかかります。歩数を 64 以内に抑え、`map` を軽く保つのは、そのためでもあります。くわしくは [速く、小さく](/learn/performance-and-size) で扱います。",
        en: "Works on this site must render a frame within 8 ms. Raymarching costs roughly pixels × steps × the cost of `map`. Keeping the steps at 64 or fewer and `map` light is partly for that reason. [Fast and small](/learn/performance-and-size) covers this in depth.",
      },
    },

    { type: "heading", text: { ja: "よくある失敗", en: "Common failures" } },
    {
      type: "paragraph",
      text: {
        ja: "うまく描けないときに起きていることは、だいたい決まっています。まずは、いちばんよく出会う「歩数が足りない」を見てみましょう。下は、熱の地図と同じ場面で、ループの上限だけを 64 から 12 に減らしたものです。",
        en: "When a render goes wrong, the cause is usually one of a few familiar ones. Let's start with the one you will meet most: running out of steps. Below is the same scene as the heat map, with only the loop limit cut from 64 to 12.",
      },
    },
    {
      type: "playground",
      source: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float ball = sdSphere(p, 1.0);
          float small = sdSphere(p - vec3(1.7, -0.5, -0.6), 0.5);
          float ground = p.y + 1.0;
          return min(min(ball, small), ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.5, 1.2, -4.5);
          vec3 ta = vec3(0.5, -0.2, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 12; i++) {  //ja: 歩数が足りない //en: not enough steps
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            if (pos.y < -0.99) {
              float c = mod(floor(pos.x) + floor(pos.z), 2.0);
              col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            } else {
              col = mix(vec3(0.45, 0.1, 0.2), vec3(1.0, 0.65, 0.4), (pos.y + 1.0) * 0.5);
            }
            col = mix(col, sky, 1.0 - exp(-t * 0.12));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`12` を `64` に戻すと直ります。`24` や `40` ではどこまで直るでしょう?",
        en: "Put `12` back to `64` and it heals. How much of it is fixed at `24`, or `40`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "地平線の近くに球の色の帯が出て、球のまわりにも、ふちどりのような輪ができました。どちらも、熱の地図で明るかった所、つまり歩数のかかる所です。12 歩で止められたレイは、まだ表面に届かず宙に浮いています。それでも `t` が 20 より小さいので「当たり」として扱われ、その点の高さが -1 ではないので、床ではなく球の色が塗られてしまったのです。",
        en: "A band of ball color appears near the horizon, and the balls grow a halo-like outline. Both sit where the heat map was bright: where steps pile up. Rays cut off after 12 steps are still hanging in mid-air, short of any surface. Their `t` is under 20, though, so they count as hits, and since their height isn't -1 they get the ball color instead of the floor's.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ほかにも、よく出会う症状と原因を挙げておきます。困ったら、まず熱の地図や、`t` を色にした絵を出して、どこで何が起きているかを見るのが近道です。",
        en: "Here are the other symptoms you are likely to meet, with their usual causes. When stuck, the quickest route is to show the heat map, or `t` as a color, and see what is happening where.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "**画面が一色になる**: 目 `ro` が形の内側にある。最初の 1 回で `d` が負になり、すぐに「当たり」で止まる。床の符号を `-p.y - 1.0` のように逆にしたときも、目のいる空間が内側になって同じことが起きる",
          en: "**The screen is one flat color**: the eye `ro` is inside a shape. The very first `d` is negative, so the loop stops at once with a \"hit\". Flipping the floor's sign, as in `-p.y - 1.0`, does the same, because the space the eye is in becomes inside",
        },
        {
          ja: "**形のまわりや地平線がおかしな色になる**: 歩数が足りない(上の例)。上限を増やすか、場面を小さく・近くにまとめる",
          en: "**Odd colors around shapes or at the horizon**: not enough steps (as above). Raise the limit, or keep the scene compact and close",
        },
        {
          ja: "**形に穴があく・表面がざらつく**: `map` の距離が本当より大きい。[座標を動かす](/learn/transforms) の「`p / s` で縮めたら距離に `* s` をかけて戻す」を忘れたときや、`normalize` を忘れて `rd` の長さが 1 より大きいときに起きる。単純な球では目立たないこともあるが、細い形や変形した形では穴になる",
          en: "**Holes or a grainy surface**: `map` returns more than the true distance. It happens when you forget the rule from [Moving space](/learn/transforms), \"after shrinking with `p / s`, multiply the distance by `s`\", or forget `normalize` so `rd` is longer than 1. On a plain sphere it may barely show, but thin or deformed shapes get holes",
        },
        {
          ja: "**遠くの床が途中で切れる**: 打ち切りの距離(`t > 20.0`)が場面に対して短い。霧を濃くして隠すか、距離を延ばす",
          en: "**The far floor ends abruptly**: the cutoff (`t > 20.0`) is too short for the scene. Hide it with thicker fog, or extend the distance",
        },
        {
          ja: "**形が太って、角が丸くにじむ**: 当たりの判定(`0.001`)が大きすぎる。0.1 にすると、表面の 0.1 手前で止まる",
          en: "**Shapes look swollen with blurry corners**: the hit threshold (`0.001`) is too large. At 0.1, rays stop 0.1 short of the surface",
        },
      ],
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "`map` が本当の距離より **大きい** 値を返すと、レイは安全な球からはみ出して進み、表面を飛び越えることがあります。逆に **小さい** 値を返すぶんには安全で、歩幅が小さくなって歩数が増えるだけです。和・積・差で組み合わせた `map` を安心して使えるのは、このためです。形をねじったり曲げたりして距離が不正確になったときは、わざと距離に 0.5 などをかけて歩幅を縮める手がよく使われます。この話は [無限の空間と変形](/learn/infinite-space) でくわしく扱います。",
        en: "If `map` returns values **larger** than the true distance, the ray can step outside its safe sphere and leap over a surface. Values that are **smaller** are safe: steps just get shorter and you need more of them. That is why a `map` built from unions, intersections and subtractions can be trusted. When twisting or bending a shape makes its distance inaccurate, a common fix is to deliberately multiply the distance by something like 0.5 to shorten the steps. [Infinite space and deformation](/learn/infinite-space) covers this in detail.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "`map` を書きかえて、場面を作ってみましょう。ループと色付けの部分はほとんど変えなくてよいはずです。",
        en: "Rewrite `map` to build some scenes. You should barely need to touch the loop or the coloring.",
      },
    },
    {
      type: "exercise",
      title: { ja: "回る 3 つの球", en: "Three orbiting balls" },
      prompt: {
        ja: "床の上で、3 つの球(半径 0.4)が、中心のまわりの半径 1.5 の円の上を、等しい間隔を保ったまま回り続けるようにしてください。",
        en: "Make three balls (radius 0.4) circle the center on a ring of radius 1.5 above the floor, staying evenly spaced as they go.",
      },
      starter: `
        #define TAU 6.28318531

        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float ground = p.y + 1.0;
          //ja: ここに 3 つの球を足す
          //en: add the three balls here
          float balls = sdSphere(p - vec3(1.5, -0.4, 0.0), 0.4);
          return min(balls, ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.0, -4.5);
          vec3 ta = vec3(0.0, -0.6, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            if (pos.y < -0.99) {
              float c = mod(floor(pos.x) + floor(pos.z), 2.0);
              col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            } else {
              col = mix(vec3(0.15, 0.3, 0.6), vec3(0.5, 0.9, 1.0), (pos.y + 0.8) / 0.8);
            }
            col = mix(col, sky, 1.0 - exp(-t * 0.12));
          }
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float ground = p.y + 1.0;
          float balls = 100.0;  //ja: まだ何も無い //en: nothing yet
          for (int i = 0; i < 3; i++) {
            //ja: 3 つの球を 1/3 周ずつずらす
            //en: offset the three balls by a third of a turn each
            float a = time + float(i) * TAU / 3.0;
            vec3 c = vec3(1.5 * cos(a), -0.4, 1.5 * sin(a));
            balls = min(balls, sdSphere(p - c, 0.4));
          }
          return min(balls, ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 2.0, -4.5);
          vec3 ta = vec3(0.0, -0.6, 0.0);
          vec3 rd = camera(ro, ta) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            if (pos.y < -0.99) {
              float c = mod(floor(pos.x) + floor(pos.z), 2.0);
              col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            } else {
              col = mix(vec3(0.15, 0.3, 0.6), vec3(0.5, 0.9, 1.0), (pos.y + 0.8) / 0.8);
            }
            col = mix(col, sky, 1.0 - exp(-t * 0.12));
          }
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "円の上を回る点は `vec3(1.5 * cos(a), 高さ, 1.5 * sin(a))` です。xz の面の円なので、y ではなく z に `sin` を使います",
          en: "A point circling around is `vec3(1.5 * cos(a), height, 1.5 * sin(a))`. The circle lies in the xz plane, so `sin` goes in z, not y",
        },
        {
          ja: "等しい間隔にするには、3 つの角度を 1/3 周(`TAU / 3.0`)ずつずらします",
          en: "For even spacing, offset the three angles by a third of a turn (`TAU / 3.0`) each",
        },
        {
          ja: "`for (int i = 0; i < 3; i++)` の中で `balls = min(balls, sdSphere(p - c, 0.4));` とすると、3 つをまとめられます。`balls` は最初に `100.0` にしておきます",
          en: "Inside `for (int i = 0; i < 3; i++)`, `balls = min(balls, sdSphere(p - c, 0.4));` collects all three. Start `balls` at `100.0`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "3D のメタボール", en: "3D metaballs" },
      prompt: {
        ja: "[距離で描く](/learn/sdf-2d) の `smin` は 3D でもそのまま使えます。大きな球のまわりを 2 つの小さな球が動き回り、近づくと水滴のようにとろりとくっつくようにしてください。",
        en: "The `smin` from [Drawing with distance](/learn/sdf-2d) works unchanged in 3D. Have two small balls wander around a big one and melt into it like droplets when they come close.",
      },
      starter: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p, 0.7);
          float b = sdSphere(p - vec3(1.2 * sin(time), 0.3, 0.0), 0.4);
          float c = sdSphere(p - vec3(0.0, 1.1 * sin(time * 1.3), 0.3), 0.35);
          //ja: ここを smin でつなぐ
          //en: join these with smin
          return min(min(a, b), c);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.5, -4.0);
          vec3 rd = camera(ro, vec3(0.0)) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = mix(vec3(0.05, 0.05, 0.1), vec3(0.15, 0.1, 0.25), uv.y);
          if (t < 20.0) {
            //ja: 近いほど明るく
            //en: nearer is brighter
            float shade = clamp(1.0 - (t - 3.0) * 0.8, 0.0, 1.0);
            col = mix(vec3(0.2, 0.05, 0.3), vec3(0.4, 0.9, 1.0), shade);
          }
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float map(vec3 p) {
          float a = sdSphere(p, 0.7);
          float b = sdSphere(p - vec3(1.2 * sin(time), 0.3, 0.0), 0.4);
          float c = sdSphere(p - vec3(0.0, 1.1 * sin(time * 1.3), 0.3), 0.35);
          //ja: k が大きいほど、遠くからとろりとくっつく
          //en: the larger k, the farther apart they start to melt together
          return smin(smin(a, b, 0.5), c, 0.5);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.5, -4.0);
          vec3 rd = camera(ro, vec3(0.0)) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 col = mix(vec3(0.05, 0.05, 0.1), vec3(0.15, 0.1, 0.25), uv.y);
          if (t < 20.0) {
            float shade = clamp(1.0 - (t - 3.0) * 0.8, 0.0, 1.0);
            col = mix(vec3(0.2, 0.05, 0.3), vec3(0.4, 0.9, 1.0), shade);
          }
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "2D のメタボールと同じく、`min` を `smin` に置きかえます",
          en: "Just like 2D metaballs, replace `min` with `smin`",
        },
        {
          ja: "3 つをつなぐには、まず 2 つを `smin` し、その結果と 3 つ目をもう一度 `smin` します",
          en: "To join three, `smin` two of them, then `smin` that result with the third",
        },
        {
          ja: "`return smin(smin(a, b, 0.5), c, 0.5);`。`0.5` を変えると、くっつき方が変わります",
          en: "`return smin(smin(a, b, 0.5), c, 0.5);`. Change the `0.5` to change how they melt together",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "壊れた場面を直す", en: "Fix the broken scene" },
      prompt: {
        ja: "球が 2 つ床に並ぶ場面のはずが、画面が一色になってしまいました。原因は 3 つあります。1 つ直すと、次の症状が見えてきます。「よくある失敗」の一覧や熱の地図を手がかりに、全部直してください。",
        en: "This should be two balls sitting on a floor, but the screen is one flat color. There are three causes, and fixing one reveals the next symptom. Use the \"Common failures\" list and the heat map as clues, and fix them all.",
      },
      starter: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.8, -0.3, 0.0), 0.7);
          float b = sdSphere(p - vec3(0.9, -0.5, 0.5), 0.5);
          float ground = -p.y - 1.0;
          return min(min(a, b), ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, -4.0);
          vec3 rd = camera(ro, vec3(0.0, -0.4, 0.0)) * normalize(vec3(p, 1.5));

          float t = 0.0;
          for (int i = 0; i < 12; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 6.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 6.0) {
            vec3 pos = ro + rd * t;
            if (pos.y < -0.99) {
              float c = mod(floor(pos.x) + floor(pos.z), 2.0);
              col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            } else {
              col = mix(vec3(0.45, 0.1, 0.2), vec3(1.0, 0.65, 0.4), (pos.y + 1.0) * 0.6);
            }
            col = mix(col, sky, 1.0 - exp(-t * 0.12));
          }
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdSphere(vec3 p, float r) { return length(p) - r; }

        float map(vec3 p) {
          float a = sdSphere(p - vec3(-0.8, -0.3, 0.0), 0.7);
          float b = sdSphere(p - vec3(0.9, -0.5, 0.5), 0.5);
          //ja: 1. 床の上(目のいる側)が正になる向きに直す
          //en: 1. flip it so above the floor (where the eye is) is positive
          float ground = p.y + 1.0;
          return min(min(a, b), ground);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 1.0, -4.0);
          vec3 rd = camera(ro, vec3(0.0, -0.4, 0.0)) * normalize(vec3(p, 1.5));

          float t = 0.0;
          //ja: 2. 歩数を 64 に戻す
          //en: 2. raise the step count back to 64
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            //ja: 3. 打ち切りの距離を 20 に延ばす(下の if も)
            //en: 3. push the cutoff out to 20 (and in the if below)
            if (d < 0.001 || t > 20.0) break;
            t += d;
          }

          vec3 sky = mix(vec3(0.95, 0.8, 0.65), vec3(0.25, 0.45, 0.85), clamp(rd.y * 2.0, 0.0, 1.0));
          vec3 col = sky;
          if (t < 20.0) {
            vec3 pos = ro + rd * t;
            if (pos.y < -0.99) {
              float c = mod(floor(pos.x) + floor(pos.z), 2.0);
              col = mix(vec3(0.2, 0.25, 0.35), vec3(0.9, 0.85, 0.75), c);
            } else {
              col = mix(vec3(0.45, 0.1, 0.2), vec3(1.0, 0.65, 0.4), (pos.y + 1.0) * 0.6);
            }
            col = mix(col, sky, 1.0 - exp(-t * 0.12));
          }
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "一色の画面は、最初の 1 回で `d` が負になっている合図です。目 `ro = (0, 1, -4)` での `map` の値を、部品ごとに手で計算してみましょう",
          en: "A flat screen means the very first `d` is negative. Work out `map` at the eye, `ro = (0, 1, -4)`, part by part, by hand",
        },
        {
          ja: "床が直ると、地平線の近くに球の色の帯と、手前で途切れる床が見えるはずです。それぞれ、ループの上限と打ち切りの距離が原因です",
          en: "Once the floor is fixed, you should see a band of ball color near the horizon and a floor that ends too soon. Those come from the loop limit and the cutoff distance",
        },
        {
          ja: "床を `p.y + 1.0` に、ループの `12` を `64` に、`6.0` を 2 か所とも `20.0` にします",
          en: "Make the floor `p.y + 1.0`, change the loop's `12` to `64`, and change both `6.0`s to `20.0`",
        },
      ],
    },
    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "距離関数の値 `d` は「半径 `d` の中には何も無い」という約束。だから `d` だけ進んでも突き抜けない",
          en: "A distance value `d` promises nothing lies within radius `d`, so stepping forward by `d` can't punch through anything",
        },
        {
          ja: "3D の球は `length(p) - r`、高さ -h の床は `p.y + h`。場面は `map` に `min` でまとめる",
          en: "A 3D sphere is `length(p) - r`; a floor at height -h is `p.y + h`. Gather the scene in `map` with `min`",
        },
        {
          ja: "ループは 64 歩まで。`d < 0.001` で当たり、`t > 20.0` で打ち切り。`map` を変えれば、同じループでどんな形も描ける",
          en: "Loop for up to 64 steps; `d < 0.001` is a hit, `t > 20.0` is the cutoff. Change `map`, and the same loop draws any shape",
        },
        {
          ja: "歩数を色にすると、重い所(ふちや地平線)と、歩数が足りない所が見える",
          en: "Coloring by step count shows the heavy spots (rims, the horizon) and where the steps run out",
        },
        {
          ja: "距離が本当より大きいと穴があく。小さいぶんには遅くなるだけで安全",
          en: "Distances that are too large cause holes; too small only costs speed",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "形は描けるようになりましたが、まだ光の当たり方が無く、平らに見えます。次の回の [法線と光](/learn/normals-and-lighting) では、距離関数から表面の向き(法線)を求めて、光の当たった立体に仕上げます。",
        en: "We can draw shapes now, but they still look flat because nothing lights them. Next, in [Normals and lighting](/learn/normals-and-lighting), we will find the surface direction (the normal) from the distance function and shade our shapes into solid, lit objects.",
      },
    },
  ],
};

export default lesson;
