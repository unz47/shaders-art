import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "time-and-motion",
  title: { ja: "時間で動かす", en: "Time and motion" },
  summary: {
    ja: "time と sin で動きを作り、周期・速さ・イージングを操る",
    en: "Animate with time and sin, controlling period, speed and easing",
  },
  minutes: 50,
  goals: [
    {
      ja: "`time` を使って、図形の位置・大きさ・色を時間で変えられる",
      en: "Use `time` to change a shape's position, size and color over time",
    },
    {
      ja: "`sin` の振幅・周期・位相を自分で決めて、往復や円運動を作れる",
      en: "Choose the amplitude, period and phase of `sin` to make back-and-forth and circular motion",
    },
    {
      ja: "`fract(time)` で、同じ動きを一定の間隔でくり返せる",
      en: "Repeat a motion at a fixed interval with `fract(time)`",
    },
    {
      ja: "`smoothstep` や `t * t` でイージング(加速・減速)を付けられる",
      en: "Add easing (speeding up and slowing down) with `smoothstep` or `t * t`",
    },
    {
      ja: "場所や番号で時間をずらして、進む波や順番に動く列を作れる",
      en: "Offset time by position or index to make traveling waves and rows that move in sequence",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "time は増え続ける数", en: "Time is a number that keeps growing" } },
    {
      type: "paragraph",
      text: {
        ja: "[はじめてのシェーダー](/learn/first-shader) で少し使った `time` は、作品が動き出してからの **秒数** です。始まった瞬間は `0.0`、2 秒後は `2.0`、1 分後は `60.0` と、ずっと増え続けます。同じコマの中では、どの点にも同じ値が渡されます。",
        en: "`time`, which we touched on in [Your first shader](/learn/first-shader), is the number of **seconds** since the work started. It is `0.0` at the very start, `2.0` two seconds later, `60.0` after a minute, and it keeps growing. Within a single frame, every pixel gets the same value.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "シェーダーは 1 秒に 60 回ほど、毎回すべての点の色を計算し直します。計算の中に `time` が入っていれば、コマごとに答えが少しずつ変わり、それが **動き** に見えます。パラパラ漫画と同じしくみです。まずは、円の中心の x を `time` で増やしてみます。",
        en: "A shader recomputes every pixel about 60 times per second. If `time` is part of the math, the answer changes a little from frame to frame, and that reads as **motion** — just like a flip book. Let's start by making the x of a circle's center grow with `time`.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.05, 0.07, 0.15), vec3(0.15, 0.1, 0.3), uv.y);

          vec2 c = vec2(-1.2 + time * 0.3, 0.0); //ja: 中心の x が時間で増える //en: the center's x grows with time
          float d = sdCircle(p - c, 0.25);
          col = mix(col, vec3(1.0, 0.6, 0.2), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.3` を `1.0` にすると速くなります。`-1.2` を `0.0` にすると、どこから出発するでしょう?",
        en: "Change `0.3` to `1.0` to speed it up. If `-1.2` becomes `0.0`, where does it start?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "中心の x は `-1.2 + time * 0.3` です。0 秒で `-1.2`(左のほう)、2 秒で `-0.6`、4 秒で `0.0`(まん中)と、1 秒に 0.3 ずつ右へ進みます。`0.3` が **速さ** です。ただし、10 秒ほどで画面の右へ出ていき、二度と戻ってきません。`time` が増え続けるからです。作品として見せ続けるには、**行ったり来たり** する動きや、**くり返す** 動きが必要です。",
        en: "The center's x is `-1.2 + time * 0.3`. At 0 seconds it is `-1.2` (toward the left), at 2 seconds `-0.6`, at 4 seconds `0.0` (the middle): it moves right by 0.3 every second. `0.3` is the **speed**. But after about 10 seconds it leaves the screen on the right and never comes back, because `time` never stops growing. For a work that people keep watching, you need motion that **goes back and forth** or **repeats**.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "このサイトの静止画のサムネイルは、`time` が `2.0` のときの 1 コマで描かれます。動く作品でも、2 秒の時点で見て良い絵になっているかを気にしておくと安心です(くわしくは [触って動く](/learn/mouse-and-attention) で扱います)。",
        en: "Still thumbnails on this site are drawn from a single frame at `time` = `2.0`. Even for an animated work, it pays to check that the picture looks good at the 2-second mark (more on this in [Touch and response](/learn/mouse-and-attention)).",
      },
    },

    { type: "heading", text: { ja: "sin で行ったり来たり", en: "Back and forth with sin" } },
    {
      type: "paragraph",
      text: {
        ja: "`sin` は、入れる数がどれだけ大きくなっても、答えが **-1.0 と 1.0 の間を行ったり来たり** する関数です。`sin(0.0)` は `0.0`、`sin(1.57)` は `1.0`、`sin(3.14)` は `0.0`、`sin(4.71)` は `-1.0`、`sin(6.28)` でまた `0.0` に戻ります。`time` をそのまま入れれば、増え続ける時間を「往復」に変えられます。",
        en: "`sin` is a function whose answer **swings between -1.0 and 1.0** no matter how large its input gets. `sin(0.0)` is `0.0`, `sin(1.57)` is `1.0`, `sin(3.14)` is `0.0`, `sin(4.71)` is `-1.0`, and `sin(6.28)` is back to `0.0`. Feed it `time` and the ever-growing clock turns into a round trip.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.05, 0.07, 0.15), vec3(0.15, 0.1, 0.3), uv.y);

          vec2 c = vec2(sin(time) * 0.8, 0.0); //ja: -0.8〜0.8 を往復 //en: swings between -0.8 and 0.8
          float d = sdCircle(p - c, 0.25);
          col = mix(col, vec3(1.0, 0.6, 0.2), 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.8` を `0.3` にすると振れ幅が小さくなります。`sin(time)` を `sin(time * 3.0)` にすると?",
        en: "Change `0.8` to `0.3` for a smaller swing. What does `sin(time * 3.0)` do?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "[関数で形を作る](/learn/shaping-functions) で見たとおり、`sin` の波は、入れる数が約 6.28 進むごとに 1 回くり返します。この長さが **周期** でした。`time` を入れると、周期は秒数になります。`sin(time)` なら、1 往復に約 6.28 秒かかります。動きを自分の思いどおりにするには、次の形で考えるとわかりやすくなります。",
        en: "As we saw in [Shaping functions](/learn/shaping-functions), the `sin` wave repeats every time its input advances by about 6.28; that length is its **period**. Feed it `time` and the period becomes a number of seconds: `sin(time)` takes about 6.28 seconds per round trip. To get exactly the motion you want, think of it in this form:",
      },
    },
    {
      type: "code",
      source: `
        float x = 0.8 * sin(time * 2.0 + 1.0);
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`0.8` … **振幅**。どこまで振れるか。答えは -0.8〜0.8 になる",
          en: "`0.8` … the **amplitude**: how far it swings. The result goes from -0.8 to 0.8",
        },
        {
          ja: "`2.0` … **速さ**。大きいほど速い。周期は 6.28 ÷ 2.0 で約 3.14 秒",
          en: "`2.0` … the **speed**: bigger is faster. The period is 6.28 ÷ 2.0, about 3.14 seconds",
        },
        {
          ja: "`1.0` … **位相**。波のどこから始めるか。動きを少し先に進めたり遅らせたりする",
          en: "`1.0` … the **phase**: where in the wave it starts. It moves the motion a little earlier or later",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "「2 秒で 1 往復」のように周期を秒で決めたいときは、`sin(time * TAU / 2.0)` と書きます。`TAU` は円周率 π の 2 倍(約 6.28)で、ちょうど `sin` が 1 回くり返す長さです。[関数で形を作る](/learn/shaping-functions) で見たように、GLSL には用意されていないので、コードの先頭に `#define TAU 6.28318531` と書いて自分で決めます。`time` が 2 秒進むと、中身がちょうど `TAU` だけ進むので、2 秒で 1 往復になります。",
        en: "When you want to set the period in seconds — say, one round trip every 2 seconds — write `sin(time * TAU / 2.0)`. `TAU` is twice pi (about 6.28), exactly the length of one `sin` repetition. As in [Shaping functions](/learn/shaping-functions), GLSL doesn't provide it, so you define it yourself with `#define TAU 6.28318531` at the top of the code. When `time` advances by 2 seconds, the inside advances by exactly `TAU`, so you get one round trip every 2 seconds.",
      },
    },
    {
      type: "playground",
      source: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.05, 0.07, 0.15), vec3(0.15, 0.1, 0.3), uv.y);

          float period = 2.0; //ja: 1 往復にかかる秒数 //en: seconds per round trip
          float w = time * TAU / period;
          vec2 a = vec2(0.8 * sin(w), 0.4);
          vec2 b = vec2(0.8 * sin(w + 1.5), -0.4); //ja: 1.5 が位相のずれ //en: 1.5 is the phase offset

          col = mix(col, vec3(1.0, 0.6, 0.2), 1.0 - smoothstep(-px, px, sdCircle(p - a, 0.2)));
          col = mix(col, vec3(0.3, 0.8, 1.0), 1.0 - smoothstep(-px, px, sdCircle(p - b, 0.2)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`1.5` を `0.0` にすると 2 つがそろって動きます。`3.14` にすると、いつも逆向きに動きます。`period` を `5.0` にすると?",
        en: "Set `1.5` to `0.0` and the two move together. At `3.14` they always move in opposite directions. What about `period = 5.0`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "下の青い円は、上のオレンジの円と同じ周期で動いていますが、位相が `1.5` だけ先に進んでいます。`3.14`(半周ぶん)ずらすと、片方が右端にいるとき、もう片方は左端にいます。位相は「同じ動きを、いつ始めるか」をずらすつまみです。この考え方は、この回の最後で、たくさんの図形を順番に動かすときに使います。",
        en: "The blue circle at the bottom moves with the same period as the orange one on top, but its phase is `1.5` ahead. Shift it by `3.14` (half a cycle) and when one is at the right end, the other is at the left. Phase is the knob for when the same motion starts. We will use this idea at the end of the lesson to move many shapes one after another.",
      },
    },

    { type: "heading", text: { ja: "円周上を回る", en: "Going around a circle" } },
    {
      type: "paragraph",
      text: {
        ja: "x に `cos(time)`、y に `sin(time)` を使うと、点は **円を描いて** 回ります。`cos` は `sin` と同じ形の波で、4 分の 1 周(約 1.57)だけ先を行っています。0 秒では `(cos, sin)` が `(1.0, 0.0)` で右、1.57 秒では `(0.0, 1.0)` で上、3.14 秒では `(-1.0, 0.0)` で左にあります。どの時刻でも中心からの距離は 1.0 のままなので、点は円の上を **反時計回り** に進みます。",
        en: "Use `cos(time)` for x and `sin(time)` for y and the point **travels around a circle**. `cos` is the same wave as `sin`, just a quarter cycle (about 1.57) ahead. At 0 seconds, `(cos, sin)` is `(1.0, 0.0)`, on the right; at 1.57 seconds it is `(0.0, 1.0)`, at the top; at 3.14 seconds it is `(-1.0, 0.0)`, on the left. Its distance from the center stays 1.0 the whole time, so the point moves **counterclockwise** around the circle.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.04, 0.05, 0.12);

          float orbit = abs(sdCircle(p, 0.6)) - 0.003; //ja: 通り道の細い輪 //en: a thin ring for the path
          col = mix(col, vec3(0.25, 0.3, 0.5), 1.0 - smoothstep(-px, px, orbit));
          col = mix(col, vec3(1.0, 0.75, 0.3), 1.0 - smoothstep(-px, px, sdCircle(p, 0.18)));

          vec2 c = 0.6 * vec2(cos(time), sin(time)); //ja: 半径 0.6 の円の上 //en: on a circle of radius 0.6
          col = mix(col, vec3(0.3, 0.8, 1.0), 1.0 - smoothstep(-px, px, sdCircle(p - c, 0.08)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`vec2(cos(time), sin(time))` を `vec2(sin(time), cos(time))` にすると、時計回りになります。`vec2(1.5 * cos(time), 0.5 * sin(time))` にすると?",
        en: "Swap to `vec2(sin(time), cos(time))` and it goes clockwise. What about `vec2(1.5 * cos(time), 0.5 * sin(time))`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "x と y に別々の振幅をかけると、横長や縦長の **楕円** の上を回ります。x と y の速さを変えると(たとえば `cos(time)` と `sin(time * 2.0)`)、8 の字のような複雑な道すじになります。sin と cos の組み合わせだけで、いろいろな軌道が作れます。",
        en: "Give x and y different amplitudes and the point travels around a wide or tall **ellipse**. Give them different speeds (say `cos(time)` and `sin(time * 2.0)`) and you get a figure-eight and other intricate paths. Combinations of sin and cos alone make a whole family of orbits.",
      },
    },

    { type: "heading", text: { ja: "点滅と脈動", en: "Blinking and pulsing" } },
    {
      type: "paragraph",
      text: {
        ja: "動かすのは位置だけではありません。**半径** に sin を足せば、円が大きくなったり小さくなったりして脈打ちます。`0.35 + 0.08 * sin(time * 3.0)` は、0.35 を中心に ±0.08、つまり 0.27〜0.43 の間をゆれます。色を `time` で変えれば、ゆっくり色が移り変わります。ここでは [色を混ぜる](/learn/mixing-colors) で使ったパレットに `time * 0.1` を渡しています。",
        en: "Position isn't the only thing you can animate. Add a sin to the **radius** and the circle grows and shrinks, as if pulsing. `0.35 + 0.08 * sin(time * 3.0)` sways ±0.08 around 0.35, between 0.27 and 0.43. Drive the color with `time` and it slowly drifts. Here we pass `time * 0.1` to the palette from [Mixing colors](/learn/mixing-colors).",
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

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.06, 0.04, 0.1);

          float beat = sin(time * 3.0);  //ja: -1〜1 //en: -1 to 1
          float r = 0.35 + 0.08 * beat;  //ja: 0.27〜0.43 で脈打つ //en: pulses between 0.27 and 0.43
          vec3 shapeColor = palette(time * 0.1, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));

          col = mix(col, shapeColor, 1.0 - smoothstep(-px, px, sdCircle(p, r)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`beat` を `abs(sin(time * 3.0))` にすると、ドクンと打つような動きに。`step(0.0, sin(time * 3.0))` にすると、2 つの大きさを切り替える点滅になります",
        en: "Make `beat` equal `abs(sin(time * 3.0))` for a thumping heartbeat. With `step(0.0, sin(time * 3.0))` it blinks between two sizes",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`abs(sin(…))` は、sin の負の側を折り返して 0〜1 にしたものです。0 のところで向きが急に変わるので、なめらかな sin よりも「打つ」感じが出ます。`step(0.0, sin(…))` は、sin が正なら 1.0、負なら 0.0 なので、半周期ごとにパッと切り替わる **点滅** になります。明るさにかければ、ランプのように点いたり消えたりします。",
        en: "`abs(sin(…))` folds the negative half of the sine up, giving 0 to 1. Its direction flips sharply at 0, so it feels more like a beat than the smooth sine does. `step(0.0, sin(…))` is 1.0 when the sine is positive and 0.0 when it is negative, so it snaps every half period: a **blink**. Multiply a brightness by it and you get a lamp switching on and off.",
      },
    },

    { type: "heading", text: { ja: "fract でくり返す", en: "Repeating with fract" } },
    {
      type: "paragraph",
      text: {
        ja: "sin は「行って戻る」動きでした。「同じ方向に進んでは、最初に戻る」動きには、[関数で形を作る](/learn/shaping-functions) で少しだけ見た `fract` を使います。`fract(x)` は x の **小数の部分** だけを取り出す関数です。`fract(2.3)` は `0.3`、`fract(5.75)` は `0.75` です。`fract(time)` は 0 から 1 まで増えて、1 になった瞬間に 0 に戻り、またそこから増えます。グラフにするとのこぎりの歯のような形なので、**のこぎり波** と呼ばれます。",
        en: "sin gives you there-and-back motion. For motion that moves in one direction and then jumps back to the start, use `fract`, which we glimpsed in [Shaping functions](/learn/shaping-functions). `fract(x)` keeps only the **fractional part** of x: `fract(2.3)` is `0.3`, `fract(5.75)` is `0.75`. `fract(time)` climbs from 0 to 1, drops back to 0 the moment it reaches 1, and climbs again. Its graph looks like the teeth of a saw, so it is called a **sawtooth wave**.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`fract(time * 0.4)` は、中身が 1 進むのに 1 ÷ 0.4 = 2.5 秒かかるので、2.5 秒ごとにくり返します。`fract(time / 3.0)` なら 3 秒ごとです。0〜1 の値ができたら、[色を混ぜる](/learn/mixing-colors) の `mix(a, b, t)` で、好きな範囲に広げられます。",
        en: "In `fract(time * 0.4)` the inside takes 1 ÷ 0.4 = 2.5 seconds to advance by 1, so it repeats every 2.5 seconds. `fract(time / 3.0)` repeats every 3 seconds. Once you have a 0-to-1 value, `mix(a, b, t)` from [Mixing colors](/learn/mixing-colors) stretches it to any range you like.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.05, 0.07, 0.15), vec3(0.15, 0.1, 0.3), uv.y);

          float t = fract(time * 0.4);         //ja: 2.5 秒ごとに 0 → 1 //en: 0 → 1 every 2.5 seconds
          vec2 c = vec2(mix(-2.2, 2.2, t), 0.0); //ja: 画面の左の外から右の外へ //en: from off-screen left to off-screen right
          col = mix(col, vec3(1.0, 0.6, 0.2), 1.0 - smoothstep(-px, px, sdCircle(p - c, 0.25)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.4` を `1.0` にすると、1 秒ごとにくり返します。`mix(-2.2, 2.2, t)` を `mix(2.2, -2.2, t)` にすると?",
        en: "Change `0.4` to `1.0` and it repeats every second. What happens with `mix(2.2, -2.2, t)` instead of `mix(-2.2, 2.2, t)`?",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "円は画面の外から外へ動くので、0 に戻る瞬間の「ワープ」が見えません。くり返しの継ぎ目を画面の外に隠すのは、よく使う工夫です。同じ考え方で、円の **半径** を `fract` で広げれば、水面の波紋のように広がって消える輪が作れます。広がるほど薄くすれば、0 に戻る瞬間も目立ちません。",
        en: "The circle travels from off-screen to off-screen, so you never see the warp back to 0. Hiding the seam of a loop outside the screen is a common trick. With the same idea, let `fract` grow a circle's **radius** and you get a ring that spreads and vanishes like a ripple on water. Fade it as it grows and the jump back to 0 goes unnoticed too.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.02, 0.06, 0.12);

          float t = fract(time / 3.0);               //ja: 3 秒ごとに 0 → 1 //en: 0 → 1 every 3 seconds
          float ring = abs(sdCircle(p, t * 1.2)) - 0.02; //ja: 半径 0 → 1.2 の輪 //en: a ring whose radius goes 0 → 1.2
          float fade = 1.0 - t;                      //ja: 広がるほど薄く //en: fainter as it grows
          col = mix(col, vec3(0.4, 0.8, 1.0), (1.0 - smoothstep(-px, px, ring)) * fade);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`fade` を `1.0` にすると、輪が消える瞬間が目立ちます。`float t` から `col = mix(…)` までの 4 行をもう 1 組書き足し、そちらを `fract(time / 3.0 + 0.5)` にすると、半周期ずれた輪がもう 1 つ出ます(2 組目は変数の名前を変えます)",
        en: "Set `fade` to `1.0` and the moment the ring disappears becomes obvious. Copy the four lines from `float t` to `col = mix(…)` once more, using `fract(time / 3.0 + 0.5)` in the copy, to add a second ring half a cycle apart (give the copy's variables new names)",
      },
    },

    { type: "heading", text: { ja: "イージング: 速さに表情を付ける", en: "Easing: giving speed some character" } },
    {
      type: "paragraph",
      text: {
        ja: "`fract` で作った 0〜1 の値は、ずっと同じ速さで増えます。そのまま位置に使うと、動き出しも止まり際も同じ速さで、機械のように見えます。現実の物は、動き出すときはゆっくり加速し、止まるときはゆっくり減速します。0〜1 の値を **別の 0〜1 の曲線に通して** 速さの変わり方を作ることを **イージング** と呼びます。",
        en: "A 0-to-1 value from `fract` grows at a constant speed. Used directly as a position, it starts and stops at full speed and looks mechanical. Real objects ease into motion and ease out of it. Passing the 0-to-1 value **through another 0-to-1 curve** to shape how the speed changes is called **easing**.",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "`t` … そのまま。一定の速さ(t が 0.5 のとき 0.5)",
          en: "`t` … unchanged: constant speed (0.5 when t is 0.5)",
        },
        {
          ja: "`smoothstep(0.0, 1.0, t)` … ゆっくり → 速く → ゆっくり。t が 0.1 のとき約 0.03、0.5 のとき 0.5、0.9 のとき約 0.97",
          en: "`smoothstep(0.0, 1.0, t)` … slow, fast, slow: about 0.03 at t = 0.1, 0.5 at t = 0.5, about 0.97 at t = 0.9",
        },
        {
          ja: "`t * t` … だんだん速く(イーズイン)。t が 0.5 のとき、まだ 0.25 しか進んでいない",
          en: "`t * t` … speeding up (ease-in): at t = 0.5 it has only covered 0.25",
        },
        {
          ja: "`1.0 - (1.0 - t) * (1.0 - t)` … だんだん遅く(イーズアウト)。t が 0.5 のとき、もう 0.75 進んでいる",
          en: "`1.0 - (1.0 - t) * (1.0 - t)` … slowing down (ease-out): at t = 0.5 it has already covered 0.75",
        },
      ],
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.07, 0.06, 0.1);

          float t = fract(time * 0.5);         //ja: 0 → 1 を 2 秒で //en: 0 → 1 in 2 seconds
          float e1 = t;                        //ja: 一定の速さ //en: constant speed
          float e2 = smoothstep(0.0, 1.0, t);  //ja: ゆっくり → 速く → ゆっくり //en: slow, fast, slow
          float e3 = t * t;                    //ja: だんだん速く //en: speeding up

          col = mix(col, vec3(0.7), 1.0 - smoothstep(-px, px, sdCircle(p - vec2(mix(-1.0, 1.0, e1), 0.5), 0.12)));
          col = mix(col, vec3(1.0, 0.5, 0.3), 1.0 - smoothstep(-px, px, sdCircle(p - vec2(mix(-1.0, 1.0, e2), 0.0), 0.12)));
          col = mix(col, vec3(0.3, 0.7, 1.0), 1.0 - smoothstep(-px, px, sdCircle(p - vec2(mix(-1.0, 1.0, e3), -0.5), 0.12)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`e3` を `1.0 - (1.0 - t) * (1.0 - t)` にすると、だんだん遅くなります。`t * t * t * t` にすると、もっと急な加速になります",
        en: "Change `e3` to `1.0 - (1.0 - t) * (1.0 - t)` and it slows down instead. `t * t * t * t` gives an even sharper acceleration",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "3 つの円は同じ時刻に出発して同じ時刻に着きますが、途中の速さがまったく違います。オレンジの円(`smoothstep`)は、両端でゆっくりなので、いちばん自然に見えます。`t * t` は 0〜1 の数をかけると小さくなる性質を使っています。0.5 × 0.5 = 0.25 のように、前半は小さいまま、終わり近くで急に 1 に追いつきます。`pow(t, 3.0)` のように `pow` を使えば、曲がり具合を数で調整できます。",
        en: "All three circles leave at the same moment and arrive at the same moment, but their speeds along the way are completely different. The orange one (`smoothstep`) is slow at both ends, so it looks the most natural. `t * t` uses the fact that multiplying numbers between 0 and 1 makes them smaller: 0.5 × 0.5 = 0.25, so it stays small for the first half and races to 1 near the end. With `pow`, as in `pow(t, 3.0)`, you can tune how strong the curve is with a number.",
      },
    },

    { type: "heading", text: { ja: "行って戻る(ピンポン)", en: "There and back (ping-pong)" } },
    {
      type: "paragraph",
      text: {
        ja: "`fract` は 1 になると 0 に飛びますが、`1.0 - abs(t * 2.0 - 1.0)` という式を通すと、0 → 1 → 0 と **行って戻る** 三角の波になります。t が 0 のとき `t * 2.0 - 1.0` は -1、abs で 1、1 から引いて 0。t が 0.25 なら -0.5 → 0.5 → 0.5。t が 0.5 なら 0 → 0 → 1。t が 0.75 なら再び 0.5、t が 1 で 0 に戻ります。始まりと終わりが同じ 0 なので、継ぎ目なしでくり返せます。",
        en: "`fract` jumps from 1 back to 0, but run it through `1.0 - abs(t * 2.0 - 1.0)` and you get a triangle wave that **goes there and back**: 0 → 1 → 0. When t is 0, `t * 2.0 - 1.0` is -1; abs makes it 1; subtracting from 1 gives 0. At t = 0.25: -0.5 → 0.5 → 0.5. At t = 0.5: 0 → 0 → 1. At t = 0.75 it is 0.5 again, and at t = 1 it is back to 0. It starts and ends at the same 0, so it loops without a seam.",
      },
    },
    {
      type: "playground",
      source: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.07, 0.06, 0.1);

          float t = fract(time * 0.4);
          float tri = 1.0 - abs(t * 2.0 - 1.0); //ja: 0 → 1 → 0 //en: 0 → 1 → 0
          float e = smoothstep(0.0, 1.0, tri);  //ja: 両端でゆっくり //en: gentle at both ends

          vec3 ballColor = mix(vec3(1.0, 0.4, 0.5), vec3(0.3, 0.8, 0.7), e);
          vec2 c = vec2(mix(-1.0, 1.0, e), 0.0);
          col = mix(col, ballColor, 1.0 - smoothstep(-px, px, sdCircle(p - c, 0.2)));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`smoothstep(0.0, 1.0, tri)` を `smoothstep(0.2, 0.8, tri)` にすると、両端で少し止まってから動きます。`e` を `tri` にすると、壁で跳ね返るような硬い動きになります",
        en: "Change `smoothstep(0.0, 1.0, tri)` to `smoothstep(0.2, 0.8, tri)` and it pauses at each end before moving. Set `e` to `tri` for a stiff, bounce-off-the-wall motion",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "往復は sin でも作れますが、三角の波とイージングに分けると、**途中で止まる時間** を作れるのが強みです。`smoothstep(0.2, 0.8, tri)` は、tri が 0.2 より小さい間はずっと 0、0.8 より大きい間はずっと 1 なので、そのぶん両端で静止します。「動いて、少し止まって、戻る」というリズムは、作品にめりはりを付けるのに役立ちます。",
        en: "You could make a round trip with sin, but splitting it into a triangle wave plus easing lets you **build in pauses**. `smoothstep(0.2, 0.8, tri)` stays at 0 while tri is below 0.2 and at 1 while it is above 0.8, so the circle rests at each end for that long. A rhythm of move, pause, return gives a work a sense of timing.",
      },
    },

    { type: "heading", text: { ja: "場所で時間をずらす: 進む波", en: "Offsetting time by position: traveling waves" } },
    {
      type: "paragraph",
      text: {
        ja: "ここまでは、どの点にも同じ「時刻」を使ってきました。今度は、**場所によって時間をずらし** ます。`sin(p.x * 4.0)` は、画面の横方向に並んだ動かない波です。そこから `time` を引いて `sin(p.x * 4.0 - time * 2.0)` にすると、波が右へ進みます。",
        en: "So far every pixel has used the same moment in time. Now we **shift time depending on position**. `sin(p.x * 4.0)` is a wave laid out across the screen, standing still. Subtract `time` to get `sin(p.x * 4.0 - time * 2.0)` and the wave travels to the right.",
      },
    },
    {
      type: "playground",
      source: `
        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.95, 0.75, 0.55), vec3(0.45, 0.6, 0.9), uv.y);

          float y = 0.3 * sin(p.x * 4.0 - time * 2.0); //ja: 右へ進む波 //en: a wave moving right
          float water = 1.0 - smoothstep(-px, px, p.y - y); //ja: 波より下 //en: below the wave
          col = mix(col, vec3(0.1, 0.35, 0.65), water);
          col = mix(col, vec3(0.8, 0.95, 1.0), 1.0 - smoothstep(0.0, 2.0 * px, abs(p.y - y) - 0.01));
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`- time * 2.0` を `+ time * 2.0` にすると左へ進みます。`y` の式の最後に `+ 0.1 * sin(p.x * 9.0 + time * 3.0)` を足すと、海らしくなります",
        en: "Change `- time * 2.0` to `+ time * 2.0` and it travels left. Append `+ 0.1 * sin(p.x * 9.0 + time * 3.0)` to the `y` line for a more ocean-like surface",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "なぜ右へ進むのでしょう。波の山は、sin の中身が 1.57 になるところです。`p.x * 4.0 - time * 2.0 = 1.57` を p.x について解くと、`p.x = (1.57 + time * 2.0) / 4.0` です。time が 1 秒増えると、山の位置 p.x は 2.0 ÷ 4.0 = 0.5 だけ右へずれます。つまり、**時間を引くと、模様は正の向きへ進む** のです。進む速さは「time にかけた数 ÷ p.x にかけた数」で決まります。",
        en: "Why does it move right? A crest sits where the inside of sin equals 1.57. Solving `p.x * 4.0 - time * 2.0 = 1.57` for p.x gives `p.x = (1.57 + time * 2.0) / 4.0`. Each second, the crest's p.x shifts right by 2.0 ÷ 4.0 = 0.5. In other words, **subtracting time moves the pattern in the positive direction**. Its speed is the number multiplying time divided by the number multiplying p.x.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "「引くと正の向きへ動く」は、この先も何度も出てくる大事な性質です。[座標を動かす](/learn/transforms) では、同じ理由で `p - c` と書くと図形が `+c` のほうへ動くことを見ます。",
        en: "\"Subtract to move in the positive direction\" is an important rule that keeps coming back. In [Moving space](/learn/transforms) you will see that, for the same reason, writing `p - c` moves a shape toward `+c`.",
      },
    },

    { type: "heading", text: { ja: "ループで並べて、位相をずらす", en: "Lining things up with a loop and staggering the phase" } },
    {
      type: "paragraph",
      text: {
        ja: "進む波の考え方を、並んだ図形に使ってみます。円を 9 個並べ、それぞれの上下の動きを番号ごとに少しずつ遅らせると、波が列を伝わっていくように見えます。円を 9 回書く代わりに、**for ループ** を使います。",
        en: "Let's apply the traveling-wave idea to a row of shapes. Line up nine circles and delay each one's up-and-down motion a little more than the last, and a wave seems to ripple down the row. Instead of writing the circle nine times, we use a **for loop**.",
      },
    },
    {
      type: "code",
      source: `
        for (int i = 0; i < 9; i++) {
          //ja: ここが i = 0, 1, 2, …, 8 の 9 回動く
          //en: this runs 9 times, with i = 0, 1, 2, …, 8
        }
      `,
    },
    {
      type: "list",
      items: [
        {
          ja: "`int i = 0` … 数える変数 `i` を整数の 0 から始める",
          en: "`int i = 0` … start a counter `i` as the integer 0",
        },
        {
          ja: "`i < 9` … i が 9 より小さい間、`{ }` の中をくり返す",
          en: "`i < 9` … keep repeating the `{ }` block while i is less than 9",
        },
        {
          ja: "`i++` … 1 回終わるごとに i に 1 を足す",
          en: "`i++` … add 1 to i after each pass",
        },
        {
          ja: "`float(i)` … i は整数なので、小数の計算に使う前に `float` に直す([はじめてのシェーダー](/learn/first-shader) で見たとおり、int と float はそのまま混ぜられない)",
          en: "`float(i)` … i is an integer, so convert it to `float` before using it in decimal math (as in [Your first shader](/learn/first-shader), int and float don't mix directly)",
        },
      ],
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "このサイトに投稿する作品では、ループは必ず `for (int i = 0; i < 9; i++)` の形にし、上限は **64 以下の数字** で書きます(`i < n` のように変数にはできません)。`while` は使えません。ループの中身は全部の点で毎コマ動くので、回数が多いほど重くなります。",
        en: "In works you post on this site, loops must take the form `for (int i = 0; i < 9; i++)`, with the limit written as **a literal number of 64 or less** (not a variable like `i < n`). `while` is not allowed. A loop body runs for every pixel on every frame, so more passes means more work.",
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

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.06, 0.05, 0.1);

          for (int i = 0; i < 9; i++) {
            float fi = float(i);
            float x = -1.2 + fi * 0.3;                  //ja: 左から 0.3 ずつ並べる //en: spaced 0.3 apart from the left
            float y = 0.4 * sin(time * 3.0 - fi * 0.5); //ja: 番号ごとに 0.5 ずつ遅らせる //en: each one 0.5 behind the last
            vec3 c = palette(fi / 9.0, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
            col = mix(col, c, 1.0 - smoothstep(-px, px, sdCircle(p - vec2(x, y), 0.1)));
          }
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`fi * 0.5` を `fi * 0.0` にすると、全部そろって上下します。`fi * 1.2` にすると? `- fi` を `+ fi` にすると、波の進む向きが変わります",
        en: "Change `fi * 0.5` to `fi * 0.0` and they all bob in unison. What about `fi * 1.2`? Flip `- fi` to `+ fi` and the wave travels the other way",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "i 番目の円は `sin(time * 3.0 - fi * 0.5)` で動きます。位相が番号ごとに 0.5 ずつ遅れているので、左の円が先に上がり、少し遅れて右隣が上がり…と、動きが右へ伝わっていきます。円の x は番号に比例しているので、これは前の節の `sin(p.x * k - time)` を、とびとびの場所で見ているのと同じことです。色もパレットに `fi / 9.0` を渡して、番号ごとに変えています。",
        en: "Circle number i moves with `sin(time * 3.0 - fi * 0.5)`. Each one's phase lags 0.5 behind the previous, so the leftmost rises first, its right neighbor a moment later, and so on: the motion travels right. Since each circle's x is proportional to its index, this is the `sin(p.x * k - time)` wave from the previous section, sampled at separate spots. The color also changes per circle, by passing `fi / 9.0` to the palette.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "時間の使い方を組み合わせて、動きを作ってみましょう。「何秒で 1 回」「どこからどこまで」を先に決めてから式にすると、迷いにくくなります。",
        en: "Combine these ways of using time to build some motion of your own. Decide \"once every how many seconds\" and \"from where to where\" first, then turn that into a formula — it keeps you from getting lost.",
      },
    },
    {
      type: "exercise",
      title: { ja: "呼吸する円", en: "A breathing circle" },
      prompt: {
        ja: "画面の中央の円が、**ちょうど 4 秒に 1 回** ゆっくり大きくなったり小さくなったりするようにしてください。半径は 0.2〜0.5 の間で変え、大きいときほど明るい色にします。",
        en: "Make the circle in the center slowly grow and shrink **exactly once every 4 seconds**. Vary the radius between 0.2 and 0.5, and make the color brighter the bigger it gets.",
      },
      starter: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.03, 0.05, 0.1);

          float b = 0.5; //ja: ここを、4 秒で 0 → 1 → 0 と変わる式にする //en: make this go 0 → 1 → 0 every 4 seconds
          float r = mix(0.2, 0.5, b);
          vec3 c = mix(vec3(0.2, 0.4, 0.8), vec3(0.6, 0.9, 1.0), b);
          col = mix(col, c, 1.0 - smoothstep(-px, px, sdCircle(p, r)));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.03, 0.05, 0.1);

          //ja: 4 秒で中身が TAU だけ進む。* 0.5 + 0.5 で 0〜1 に直す
          //en: the inside advances by TAU every 4 seconds; * 0.5 + 0.5 maps it to 0–1
          float b = sin(time * TAU / 4.0) * 0.5 + 0.5;
          float r = mix(0.2, 0.5, b);
          vec3 c = mix(vec3(0.2, 0.4, 0.8), vec3(0.6, 0.9, 1.0), b);

          //ja: 外側にうっすら光の輪。大きいときほど強く
          //en: a faint halo outside, stronger when the circle is big
          float d = sdCircle(p, r);
          col += c * 0.35 * b * (1.0 - smoothstep(0.0, 0.4, d));
          col = mix(col, c, 1.0 - smoothstep(-px, px, d));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "周期を秒で決めるには `sin(time * TAU / 秒数)` でした",
          en: "To set the period in seconds, use `sin(time * TAU / seconds)`",
        },
        {
          ja: "`sin` は -1〜1 なので、`* 0.5 + 0.5` で 0〜1 に直してから `b` に入れます",
          en: "`sin` runs from -1 to 1, so map it to 0–1 with `* 0.5 + 0.5` before storing it in `b`",
        },
        {
          ja: "`float b = sin(time * TAU / 4.0) * 0.5 + 0.5;` で完成です",
          en: "`float b = sin(time * TAU / 4.0) * 0.5 + 0.5;` does it",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "弾むボール", en: "A bouncing ball" },
      prompt: {
        ja: "床の上でボールが弾み続けるようにしてください。床に着く瞬間に向きがパッと変わり、上のほうではゆっくりになると、弾んでいるように見えます。できたら、床の影をボールが高いほど小さく薄くしてみましょう。",
        en: "Make the ball keep bouncing on the floor. If it changes direction sharply the instant it touches the floor and moves slowly near the top, it will look like it bounces. Once that works, make its shadow on the floor smaller and fainter the higher the ball is.",
      },
      starter: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.95, 0.85, 0.7), vec3(0.6, 0.75, 0.95), uv.y);
          float ground = -0.6;
          col = mix(col, vec3(0.45, 0.35, 0.3), 1.0 - smoothstep(-px, px, p.y - ground));

          float h = 0.0; //ja: ボールの高さ(0〜1)。ここを時間で変える //en: the ball's height (0 to 1); animate this
          float r = 0.15;
          vec2 c = vec2(0.0, ground + r + h * 0.9);
          col = mix(col, vec3(1.0, 0.35, 0.3), 1.0 - smoothstep(-px, px, sdCircle(p - c, r)));
          return vec4(col, 1.0);
        }
      `,
      solution: `
        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = mix(vec3(0.95, 0.85, 0.7), vec3(0.6, 0.75, 0.95), uv.y);
          float ground = -0.6;
          col = mix(col, vec3(0.45, 0.35, 0.3), 1.0 - smoothstep(-px, px, p.y - ground));

          //ja: abs(sin) は 0 のところで鋭く折り返すので、床で跳ねたように見える
          //en: abs(sin) turns sharply at 0, so it looks like a bounce off the floor
          float h = abs(sin(time * 3.0));
          float r = 0.15;
          vec2 c = vec2(0.0, ground + r + h * 0.9);

          //ja: 影は縦につぶした楕円。高いほど小さく、薄く
          //en: the shadow is a squashed ellipse, smaller and fainter the higher the ball
          vec2 sp = (p - vec2(0.0, ground)) * vec2(1.0, 4.0);
          float shadow = 1.0 - smoothstep(-4.0 * px, 4.0 * px, sdCircle(sp, mix(0.2, 0.08, h)));
          col = mix(col, vec3(0.25, 0.18, 0.15), shadow * mix(0.6, 0.15, h));

          col = mix(col, vec3(1.0, 0.35, 0.3), 1.0 - smoothstep(-px, px, sdCircle(p - c, r)));
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`sin` のままだと、下でもなめらかに向きが変わって、ふわふわ浮いているように見えます。下で「カツン」と向きを変えるには?",
          en: "With plain `sin`, the turn at the bottom is smooth and the ball seems to float. How can you make it turn with a sharp tap at the bottom?",
        },
        {
          ja: "「点滅と脈動」の節で見た `abs(sin(…))` は、0 のところで鋭く折り返す 0〜1 の波でした",
          en: "The `abs(sin(…))` from the pulsing section is a 0-to-1 wave that turns sharply at 0",
        },
        {
          ja: "`float h = abs(sin(time * 3.0));` で弾みます。影は `mix(0.2, 0.08, h)` のように、h で半径と濃さを変えます",
          en: "`float h = abs(sin(time * 3.0));` makes it bounce. For the shadow, change its radius and darkness with h, as in `mix(0.2, 0.08, h)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "読み込み中の輪", en: "A loading spinner" },
      prompt: {
        ja: "円の上に並んだ 8 個の点のうち、明るい点が 1 秒で 1 周するようにしてください。明るい点のうしろには、だんだん暗く小さくなる尾が続きます。読み込み中によく見る、あのくるくる回る印です。",
        en: "Of the eight dots arranged in a circle, make a bright one travel all the way around once per second, followed by a tail of dots that get darker and smaller. It's the familiar spinning \"loading\" indicator.",
      },
      starter: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.05, 0.06, 0.1);

          for (int i = 0; i < 8; i++) {
            float fi = float(i);
            float a = fi / 8.0 * TAU;           //ja: i 番目の点の角度 //en: the angle of dot i
            vec2 c = 0.45 * vec2(cos(a), sin(a));
            float k = 1.0;                      //ja: 明るさ(0〜1)。ここを書き換える //en: brightness (0 to 1); change this
            vec3 dotColor = mix(vec3(0.15, 0.2, 0.35), vec3(0.4, 0.9, 1.0), k);
            float d = sdCircle(p - c, mix(0.05, 0.09, k));
            col = mix(col, dotColor, 1.0 - smoothstep(-px, px, d));
          }
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define TAU 6.28318531

        float sdCircle(vec2 p, float r) { return length(p) - r; }

        vec4 render(vec2 uv, vec2 p) {
          float px = 2.0 / resolution.y;
          vec3 col = vec3(0.05, 0.06, 0.1);

          for (int i = 0; i < 8; i++) {
            float fi = float(i);
            float a = fi / 8.0 * TAU;
            vec2 c = 0.45 * vec2(cos(a), sin(a));
            //ja: 番号ぶん時間を遅らせてから fract。点けた瞬間が 1 で、だんだん 0 へ
            //en: delay time by the index, then fract: 1 the moment it lights up, fading toward 0
            float k = 1.0 - fract(time - fi / 8.0);
            k = k * k; //ja: 早めに暗くして尾を短く //en: fade faster for a shorter tail
            vec3 dotColor = mix(vec3(0.15, 0.2, 0.35), vec3(0.4, 0.9, 1.0), k);
            float d = sdCircle(p - c, mix(0.05, 0.09, k));
            col = mix(col, dotColor, 1.0 - smoothstep(-px, px, d));
          }
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "1 秒ごとにくり返す 0〜1 の値は `fract(time)` です。点ごとに少しずつ遅らせるには?",
          en: "`fract(time)` is a 0-to-1 value that repeats every second. How can you delay it a little for each dot?",
        },
        {
          ja: "8 個で 1 周なので、i 番目の点は `fi / 8.0` 秒だけ遅らせます。`fract(time - fi / 8.0)` は、その点が「点いてからの時間」です",
          en: "Eight dots make one lap, so delay dot i by `fi / 8.0` seconds. `fract(time - fi / 8.0)` is how long ago that dot lit up",
        },
        {
          ja: "点いた瞬間に明るく、だんだん暗くしたいので `float k = 1.0 - fract(time - fi / 8.0);` です",
          en: "It should be bright the moment it lights and fade after, so use `float k = 1.0 - fract(time - fi / 8.0);`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "`time` は増え続ける秒数。計算に入れるとコマごとに答えが変わり、動きになる",
          en: "`time` is an ever-growing count of seconds; put it in the math and the answer changes each frame, which reads as motion",
        },
        {
          ja: "`A * sin(time * speed + phase)` で往復。周期を秒で決めるなら `sin(time * TAU / 秒数)`",
          en: "`A * sin(time * speed + phase)` makes a round trip; to set the period in seconds, use `sin(time * TAU / seconds)`",
        },
        {
          ja: "`vec2(cos(time), sin(time))` で反時計回りの円運動",
          en: "`vec2(cos(time), sin(time))` moves counterclockwise around a circle",
        },
        {
          ja: "`fract(time * k)` は 0 → 1 をくり返すのこぎり波。`1.0 - abs(t * 2.0 - 1.0)` で行って戻る三角の波",
          en: "`fract(time * k)` is a sawtooth that repeats 0 → 1; `1.0 - abs(t * 2.0 - 1.0)` turns it into a there-and-back triangle wave",
        },
        {
          ja: "0〜1 の値を `smoothstep` や `t * t` に通すと、加速・減速(イージング)が付く",
          en: "Passing a 0-to-1 value through `smoothstep` or `t * t` adds acceleration and deceleration (easing)",
        },
        {
          ja: "場所や番号で時間をずらすと、進む波や順番に動く列になる。時間を引くと正の向きへ進む",
          en: "Offsetting time by position or index gives traveling waves and staggered rows; subtracting time moves things in the positive direction",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、円に加えて四角と線分を描けるようにし、図形を足したり引いたりして、もっと複雑な形を組み立てます。",
        en: "Next time we add boxes and line segments to our circles, and combine shapes by adding and subtracting them to build more complex forms.",
      },
    },
  ],
};

export default lesson;
