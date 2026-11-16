import type { Lesson } from "../types";

const lesson: Lesson = {
  slug: "tunnels",
  title: { ja: "トンネルと飛行", en: "Tunnels and flight" },
  summary: {
    ja: "2D と 3D のトンネルで、どこまでも進んでいく映像を作る",
    en: "Build endless flights with 2D and 3D tunnels",
  },
  minutes: 55,
  goals: [
    {
      ja: "画面の中心からの距離の逆数と角度を使って、2D のトンネルを描ける",
      en: "Draw a 2D tunnel from the angle and the inverse of the distance to the center",
    },
    {
      ja: "模様の座標に `time` を足して、奥へ進む動きや回る動きを作れる",
      en: "Add `time` to the pattern coordinates to fly forward and to spin",
    },
    {
      ja: "筒の内側を距離関数で表し、道を `sin` で曲げた 3D のトンネルを作れる",
      en: "Build a 3D tunnel from the inside of a tube, bent along a path made with `sin`",
    },
    {
      ja: "カメラを道に沿って進め、少し先を向かせ、曲がるときに傾けられる",
      en: "Move the camera along the path, aim it a little ahead and bank it into turns",
    },
    {
      ja: "光の筋・流れる目印・画角・霧で、速さを感じる映像に仕上げられる",
      en: "Use light streaks, passing markers, field of view and fog to make the flight feel fast",
    },
  ],
  blocks: [
    { type: "heading", text: { ja: "トンネルはどう見えるか", en: "What a tunnel looks like" } },
    {
      type: "paragraph",
      text: {
        ja: "トンネルや長い廊下の写真を思い浮かべてください。壁の模様は手前では大きく、奥へ行くほど小さくなって、画面の真ん中の一点(**消失点**)に集まっていきます。これを逆向きに使うと、平らな 2D の画面に奥行きを作れます。",
        en: "Picture a photo of a tunnel or a long corridor. The pattern on the walls is large up close and shrinks with distance, gathering at one point in the middle of the picture (the **vanishing point**). Run that idea backwards and you can fake depth on a flat 2D screen.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "遠くのものが小さく見えるのは、見かけの大きさが距離に **反比例** するからです。距離が 2 倍なら、大きさは半分です。トンネルの壁の 1 周(輪)も同じで、奥行き `z` にある輪は、画面では半径がおよそ `1 / z` の円に見えます。これを逆にすると、画面で中心から `r` だけ離れた点は、奥行きがおよそ `1 / r` の壁を見ていることになります。",
        en: "Distant things look small because apparent size is **inversely proportional** to distance: twice as far, half as big. A ring of tunnel wall at depth `z` shows up on screen as a circle with a radius of roughly `1 / z`. Turn that around, and a pixel at distance `r` from the center is looking at the wall at a depth of roughly `1 / r`.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "周りの方向は、[極座標](/learn/polar-coordinates) の角度 `atan(p.y, p.x)` がそのまま使えます。この 2 つ、「周りの位置」と「奥行き」が、トンネルの壁に貼る模様の座標になります。下の例では、その座標でマス目を塗っています。",
        en: "For the position around the tunnel, the angle `atan(p.y, p.x)` from [Polar coordinates](/learn/polar-coordinates) works as is. These two values, the position around and the depth, become the coordinates of the pattern on the tunnel wall. The example below paints a checkerboard with them.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531

        vec4 render(vec2 uv, vec2 p) {
          float r = length(p);
          float a = atan(p.y, p.x);
          //ja: 壁の上の座標。u は周りの位置(0〜1)、z は奥行き
          //en: coordinates on the wall: u goes around (0 to 1), z goes into the distance
          float u = a / TAU + 0.5;
          float z = 0.4 / r;
          float check = mod(floor(u * 12.0) + floor(z * 2.0), 2.0);
          vec3 col = mix(vec3(0.1, 0.12, 0.25), vec3(0.95, 0.75, 0.45), check);
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`0.4` を `1.0` にすると、トンネルが太くなったように、マス目が小さく見えます。`12.0` を `6.0` にすると、周りのマス目の数が半分になります",
        en: "Change `0.4` to `1.0`: the tunnel seems wider and the tiles look smaller. Change `12.0` to `6.0` to halve the number of tiles around",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`r` が 1.0 の点(画面の上下の端)では `z` は 0.4、`r` が 0.1 の点では 4.0 です。中心に近づくほど奥行きはどんどん大きくなり、`r` が 0.01 なら 40 にもなります。中心のあたりがざらざらして見えるのはこのためで、1 ピクセルの中に何十ものマス目が入ってしまっています。そこは「ずっと遠く」なので、次の例で暗くして隠します。",
        en: "Where `r` is 1.0 (the top and bottom edges of the screen), `z` is 0.4; where `r` is 0.1, it is 4.0. Depth grows faster and faster toward the center, reaching 40 at `r` = 0.01. That is why the center looks noisy: dozens of tiles are squeezed into each pixel. That spot is \"very far away\", so in the next example we hide it in darkness.",
      },
    },

    { type: "heading", text: { ja: "模様を流す", en: "Making it flow" } },
    {
      type: "paragraph",
      text: {
        ja: "トンネルの中を進むには、模様の奥行き `z` に時間を足します。`z + time` にすると、同じ模様が 1 秒に 1 ずつ手前へずれてくるので、自分が奥へ進んでいるように見えます。周りの位置 `u` に時間を足すと、トンネルが回ります。",
        en: "To travel down the tunnel, add time to the depth `z`. With `z + time`, the pattern slides one unit toward you every second, so it feels like you are moving forward. Add time to the position around, `u`, and the tunnel spins.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "あわせて、遠くを暗くします。[質感と空気](/learn/materials-and-atmosphere) の霧と同じで、`exp(-距離 * 濃さ)` をかけて、遠いほど暗くするだけです。ざらざらした中心が闇に沈み、奥行きがぐっとはっきりします。",
        en: "We also darken the distance. Just like the fog in [Materials and atmosphere](/learn/materials-and-atmosphere), multiply by `exp(-distance * density)` so that farther means darker. The noisy center sinks into the dark and the depth suddenly reads.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531

        vec4 render(vec2 uv, vec2 p) {
          float r = length(p);
          float a = atan(p.y, p.x);
          float depth = 0.4 / r;
          float u = a / TAU + 0.5 + time * 0.03; //ja: 回る //en: spin
          float z = depth + time * 1.5;          //ja: 進む //en: move forward
          float check = mod(floor(u * 12.0) + floor(z * 2.0), 2.0);
          vec3 col = mix(vec3(0.1, 0.12, 0.25), vec3(0.95, 0.75, 0.45), check);
          col *= exp(-depth * 0.6); //ja: 遠いほど暗く //en: darker with distance
          return vec4(col, 1.0);
        }
      `,
      caption: {
        ja: "`time * 1.5` を `time * 5.0` にすると速く進みます。`exp(-depth * 0.6)` の `0.6` を `0.2` にすると、霧が薄くなります",
        en: "Change `time * 1.5` to `time * 5.0` to go faster. Change the `0.6` in `exp(-depth * 0.6)` to `0.2` for thinner fog",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ここで `depth` と `z` を分けたのは、役目が違うからです。`depth` は「その点に見えている壁がどれだけ遠いか」で、霧に使います。`z` は「模様のどこが見えているか」で、時間とともにずれていきます。もし霧に `z` を使うと、時間がたつほど画面全体が暗くなってしまいます。",
        en: "We keep `depth` and `z` apart because they do different jobs. `depth` is how far away the visible bit of wall is, and it drives the fog. `z` is which part of the pattern you see, and it slides over time. If the fog used `z`, the whole screen would get darker and darker as time went on.",
      },
    },

    { type: "heading", text: { ja: "模様を工夫する", en: "Better patterns" } },
    {
      type: "paragraph",
      text: {
        ja: "マス目の代わりに、どんな 2D の模様でも壁に貼れます。`(u, z)` を普通の座標だと思って、[くり返しとタイル](/learn/repetition) の `fract` や、[色を混ぜる](/learn/mixing-colors) のパレットを使えばよいのです。下は、タイルの縁を光らせ、奥行きの輪ごとに色を変えた例です。",
        en: "Instead of checkers, you can put any 2D pattern on the wall. Treat `(u, z)` as ordinary coordinates and reach for `fract` from [Repetition and tiles](/learn/repetition) or a palette from [Mixing colors](/learn/mixing-colors). Below, the tile edges glow and each ring of tiles gets its own color.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = length(p);
          float a = atan(p.y, p.x);
          float depth = 0.4 / r;
          float u = a / TAU + 0.5;
          float z = depth + time * 1.5;
          vec2 g = vec2(u * 16.0, z * 2.0);
          vec2 f = abs(fract(g) - 0.5);
          //ja: タイルの縁(f が 0.5 に近いところ)を光らせる
          //en: light up the tile edges, where f is close to 0.5
          float edge = smoothstep(0.3, 0.5, max(f.x, f.y));
          //ja: 奥行きの輪ごとに色を変える
          //en: a different color for each ring
          vec3 tint = palette(floor(g.y) * 0.13, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          vec3 col = vec3(0.03, 0.02, 0.08) + tint * edge * 1.5;
          col *= exp(-depth * 0.5);
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`u * 16.0` を `u * 15.5` にすると、画面の左に継ぎ目が出ます。`smoothstep(0.3, 0.5, …)` の `0.3` を `0.45` にすると、縁の線が細くなります",
        en: "Change `u * 16.0` to `u * 15.5` and a seam appears on the left. Change the `0.3` in `smoothstep(0.3, 0.5, …)` to `0.45` for thinner edge lines",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "周りの方向のくり返しの数は、**整数** にします。`atan` の角度は画面の真左の方向で π から -π へ飛ぶので、`u` もそこで 1 から 0 へ飛びます。くり返しの数が整数なら、`u` が 1 のところと 0 のところの模様が同じなのでつながりますが、15.5 のような半端な数だと、左側に模様の食い違う継ぎ目ができます([極座標](/learn/polar-coordinates) で見た ±π の継ぎ目と同じです)。",
        en: "Always repeat a **whole number** of times around. The `atan` angle jumps from π to -π when pointing straight left, so `u` jumps from 1 to 0 there. With a whole number of repeats, the pattern at `u` = 1 and at `u` = 0 is the same, so it lines up; with something like 15.5 you get a broken seam on the left (the same ±π seam you met in [Polar coordinates](/learn/polar-coordinates)).",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "手前の線は太く、奥の線は細く見えることにも注目してください。模様の座標の上では、どれも同じ太さの線です。これも遠近の効果で、近くのものほど大きく見えるからです。",
        en: "Notice also that lines near you look thick while distant ones look thin. In pattern coordinates they are all the same width; this is perspective again, making nearby things look bigger.",
      },
    },

    { type: "heading", text: { ja: "形を変える・曲げる", en: "Changing the shape, bending the view" } },
    {
      type: "paragraph",
      text: {
        ja: "トンネルの断面は円でなくてもかまいません。`r = length(p)` は中心からの距離を「円」で測っていました。これを `max(abs(p.x), abs(p.y))` にすると「四角」で測ることになり、四角いトンネルになります。[円と距離](/learn/circles-and-distance) で、距離の測り方を変えると形が変わったのと同じ考え方です。",
        en: "The cross-section doesn't have to be a circle. `r = length(p)` measures distance from the center in circles. Switch it to `max(abs(p.x), abs(p.y))` and it measures in squares, giving a square tunnel. It is the same idea as in [Circles and distance](/learn/circles-and-distance): change how you measure distance and the shape changes.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "もう 1 つ、消失点(トンネルの奥の中心)を動かすと、トンネルが曲がって見えます。ただし画面全体を同じだけずらすと、横に平行移動しただけに見えます。そこで、中心に近いところ(遠いところ)ほど大きくずらし、画面の端(手前)はほとんどずらしません。手前はまっすぐで、奥だけが横へ逃げていく。これが、曲がっていく道の見え方です。",
        en: "Move the vanishing point (the center at the far end) and the tunnel seems to bend. Shifting the whole screen by the same amount just looks like a sideways slide, though. So shift the area near the center (far away) a lot, and the edges of the screen (close to you) hardly at all. Straight up close, veering off in the distance: that is what a curving road looks like.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          //ja: 奥の中心の行き先と、その点がどれだけ奥か(中心ほど 1)
          //en: where the far center goes, and how far away this pixel is (1 at the center)
          vec2 bend = 0.4 * vec2(sin(time * 0.7), cos(time * 0.5));
          float far = 1.0 - smoothstep(0.0, 1.2, length(p));
          vec2 q = p - bend * far;
          float r = max(abs(q.x), abs(q.y));
          // float r = length(q);
          // float r = pow(pow(abs(q.x), 4.0) + pow(abs(q.y), 4.0), 0.25);
          float a = atan(q.y, q.x);
          float depth = 0.4 / r;
          float u = a / TAU + 0.5;
          float z = depth + time * 1.5;
          vec2 g = vec2(u * 16.0, z * 2.0);
          vec2 f = abs(fract(g) - 0.5);
          float edge = smoothstep(0.3, 0.5, max(f.x, f.y));
          vec3 tint = palette(floor(g.y) * 0.13, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          vec3 col = vec3(0.03, 0.02, 0.08) + tint * edge * 1.5;
          col *= exp(-depth * 0.5);
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`max(abs(q.x), abs(q.y))` の行の先頭に `//` を付け、その下の 2 行のどちらかの `//` を消すと、丸や角の丸い四角になります。`0.4 * vec2(` の `0.4` を `0.0` にすると、まっすぐに戻ります",
        en: "Put `//` in front of the `max(abs(q.x), abs(q.y))` line and remove the `//` from one of the two lines below it to get a round or rounded-square tunnel. Change the `0.4` in `0.4 * vec2(` to `0.0` to straighten it again",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "`pow(pow(abs(q.x), 4.0) + pow(abs(q.y), 4.0), 0.25)` は、円(2 乗)と四角(とても大きな数の乗)の中間の形です。`4.0` と `0.25` を `8.0` と `0.125` にすると、もっと四角に近づきます。`pow` は 1 つ目の数がマイナスだと結果が決まらないので、先に `abs` をかけています。",
        en: "`pow(pow(abs(q.x), 4.0) + pow(abs(q.y), 4.0), 0.25)` sits between a circle (power 2) and a square (a very large power). Change `4.0` and `0.25` to `8.0` and `0.125` and it gets even squarer. `pow` is undefined for a negative first argument, which is why `abs` comes first.",
      },
    },

    { type: "heading", text: { ja: "3D のトンネル", en: "A 3D tunnel" } },
    {
      type: "paragraph",
      text: {
        ja: "2D のトンネルは軽くて楽しいのですが、光は当たらず、本当に曲がったり、中に物を置いたりはできません。そこで [レイマーチング](/learn/raymarching) で、本物の筒の中を飛んでみます。",
        en: "2D tunnels are cheap and fun, but nothing is lit, nothing truly bends, and you can't put objects inside. So let's use [Raymarching](/learn/raymarching) and fly through a real tube.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "z 軸に沿った、半径 1 の筒を考えます。点 `p` から筒の軸までの距離は `length(p.xy)` です(z は関係ありません)。これまでの距離関数は「物の外で正、中で負」でしたが、今回カメラがいるのは **筒の中の空洞** です。空洞で正、壁の向こうで負にしたいので、引き算を逆にして `1.0 - length(p.xy)` にします。軸の上(`length` が 0)なら距離は 1、壁から 0.3 のところなら 0.3 で、ちゃんと「壁までの距離」になっています。",
        en: "Take a tube of radius 1 along the z axis. The distance from a point `p` to the tube's axis is `length(p.xy)` (z doesn't matter). Our distance functions have been positive outside an object and negative inside, but this time the camera lives **in the hollow inside the tube**. We want positive in the hollow and negative beyond the wall, so we flip the subtraction: `1.0 - length(p.xy)`. On the axis (`length` is 0) the distance is 1; at 0.3 from the wall it is 0.3. It really is the distance to the wall.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "光は、カメラに付けたライト(ヘッドライト)にします。法線と視線の向きの内積 `dot(n, -rd)` で、こちらを向いた壁ほど明るくなります。さらに `1.0 / (1.0 + t * t * 0.05)` をかけて、遠くの壁ほど光が届かずに暗くなるようにします。光は距離の 2 乗で弱まるので `t * t` を使います。",
        en: "For light we use a lamp attached to the camera, like a headlight. The dot product `dot(n, -rd)` of the normal and the view direction makes walls that face us brighter. Then we multiply by `1.0 / (1.0 + t * t * 0.05)` so that far walls, which the light barely reaches, get darker. Light weakens with the square of distance, hence `t * t`.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531

        //ja: 半径 1 の筒の内側。空洞で正、壁の向こうで負
        //en: the inside of a radius-1 tube: positive in the hollow, negative beyond the wall
        float map(vec3 p) {
          return 1.0 - length(p.xy);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          vec3 ro = vec3(0.0, 0.0, time * 2.0);
          vec3 rd = normalize(vec3(p, 1.5));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 40.0) break;
            t += d;
          }
          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          //ja: 壁の上の座標は 2D と同じ。角度と z
          //en: wall coordinates, just like in 2D: the angle and z
          float a = atan(pos.y, pos.x);
          float check = mod(floor(a / TAU * 12.0) + floor(pos.z * 0.5), 2.0);
          vec3 base = mix(vec3(0.15, 0.2, 0.4), vec3(0.9, 0.75, 0.55), check);
          float dif = max(dot(n, -rd), 0.0);
          float fall = 1.0 / (1.0 + t * t * 0.05);
          vec3 col = base * dif * fall;
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`1.0 - length(p.xy)` の `1.0` を `0.5` にすると細い筒になります。`vec3(p, 1.5)` の `1.5` を `0.8` にすると、広角のレンズになります",
        en: "Change the `1.0` in `1.0 - length(p.xy)` to `0.5` for a narrow tube. Change the `1.5` in `vec3(p, 1.5)` to `0.8` for a wide-angle lens",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "見た目は 2D のトンネルとよく似ています。でも今度は、模様は本当に壁の z の位置に貼られていて、明るさは光の計算から出ています。ここから、2D ではできなかったことをしていきます。",
        en: "It looks a lot like the 2D tunnel. But now the pattern sits at real z positions on the wall, and the brightness comes from actual lighting. From here on, we do what 2D couldn't.",
      },
    },

    { type: "heading", text: { ja: "道を曲げる", en: "Bending the path" } },
    {
      type: "paragraph",
      text: {
        ja: "筒を曲げるには、[無限の空間と変形](/learn/infinite-space) でやったように、形ではなく空間をずらします。まず、奥行き `z` ごとに筒の中心がどこにあるかを返す関数 `path(z)` を作ります。`sin` を 2 つ使って、左右と上下にゆるやかにうねる道にします。",
        en: "To bend the tube, shift space rather than the shape, as in [Infinite space and deformation](/learn/infinite-space). First write `path(z)`, which returns where the tube's center is at each depth `z`. Two `sin` waves give a road that gently weaves left and right, up and down.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "`map` では、点の xy から、その z での中心 `path(p.z)` を引いてから、筒の距離を測ります。たとえば z = 10 の場所では筒の中心が `path(10.0)` にあるので、そこからの距離を測れば、その場所での筒になるというわけです。カメラも `ro = vec3(path(z0), z0)` で道の上に置きます。",
        en: "In `map`, subtract the center at that depth, `path(p.z)`, from the point's xy before measuring the tube distance. At z = 10, say, the tube's center is at `path(10.0)`, so measuring from there gives you the tube at that spot. The camera goes on the path too, with `ro = vec3(path(z0), z0)`.",
      },
    },
    {
      type: "playground",
      source: `
        #define PI 3.14159265
        #define TAU 6.28318531

        //ja: 奥行き z での、道(筒の中心)の位置
        //en: where the path (the tube's center) is at depth z
        vec2 path(float z) {
          return vec2(sin(z * 0.15) * 2.0, cos(z * 0.11) * 1.5);
        }

        float map(vec3 p) {
          p.xy -= path(p.z);
          return 1.0 - length(p.xy);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float z0 = time * 2.0;
          vec3 ro = vec3(path(z0), z0);
          vec3 rd = normalize(vec3(p, 1.5));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 40.0) break;
            t += d;
          }
          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          vec2 q = pos.xy - path(pos.z);
          float a = atan(q.y, q.x);
          float check = mod(floor(a / TAU * 12.0) + floor(pos.z * 0.5), 2.0);
          vec3 base = mix(vec3(0.15, 0.2, 0.4), vec3(0.9, 0.75, 0.55), check);
          float dif = max(dot(n, -rd), 0.0);
          float fall = 1.0 / (1.0 + t * t * 0.05);
          vec3 col = base * dif * fall;
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`sin(z * 0.15) * 2.0` の `2.0` を `4.0` にすると、大きく曲がります。カメラは道の上にいますが、まっすぐ前(+z の向き)しか見ていないので、曲がった先は壁に隠れてしまいます",
        en: "Change the `2.0` in `sin(z * 0.15) * 2.0` to `4.0` for sharper bends. The camera is on the path, but it only looks straight ahead (along +z), so the walls hide where the road goes",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "空間をずらすと、`map` の値は正確な距離から少しずれます(曲がりが急なほど大きくずれます)。ずれが大きいと、レイが壁を突き抜けて穴があきます。そのときは `t += d` を `t += d * 0.7` のようにして、控えめに進めます。この例くらいのゆるい曲がりなら、そのままで大丈夫です。",
        en: "Shifting space makes `map` drift slightly from the true distance, more so the sharper the bend. If it drifts too far, rays punch through the wall and leave holes. When that happens, step more cautiously, e.g. `t += d * 0.7` instead of `t += d`. Gentle bends like this one are fine as they are.",
      },
    },

    { type: "heading", text: { ja: "道に沿って飛ぶ", en: "Flying along the path" } },
    {
      type: "paragraph",
      text: {
        ja: "カメラを前に向けるには、[レイとカメラ](/learn/rays-and-camera) の `camera(ro, ta)` を使い、見る先 `ta` を **少し先の道の上** に置きます。`ro` が z0 にあるなら、`ta` は z0 + 3 の道の上です。車を運転するとき、すぐ目の前ではなく少し先を見るのと同じです。",
        en: "To aim the camera ahead, use `camera(ro, ta)` from [Rays and cameras](/learn/rays-and-camera) and put the target `ta` **on the path a little ahead**. If `ro` is at z0, `ta` is on the path at z0 + 3. It's like driving: you look a bit down the road, not right in front of the car.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "仕上げに、曲がるときに体を傾けます(**バンク**と呼びます)。少し先の道が右にずれていれば、右に曲がるところです。そのずれ `path(z0 + ahead).x - path(z0).x` に比例した角度で、画面の座標 `p` を [座標を動かす](/learn/transforms) の `rot` で回します。`p` を回すと、見える景色全体が傾きます。",
        en: "As a finishing touch, lean into the turns (this is called **banking**). If the path a little ahead is further right, we're turning right. Rotate the screen coordinates `p` with `rot` from [Moving space](/learn/transforms), by an angle proportional to that offset, `path(z0 + ahead).x - path(z0).x`. Rotating `p` tilts the whole view.",
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

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec2 path(float z) {
          return vec2(sin(z * 0.15) * 2.0, cos(z * 0.11) * 1.5);
        }

        float map(vec3 p) {
          p.xy -= path(p.z);
          return 1.0 - length(p.xy);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float z0 = time * 3.0;
          float ahead = 3.0;
          vec3 ro = vec3(path(z0), z0);
          vec3 ta = vec3(path(z0 + ahead), z0 + ahead); //ja: 少し先の道を見る //en: look a little down the road
          float bank = (path(z0 + ahead).x - path(z0).x) * 0.4;
          vec3 rd = camera(ro, ta) * normalize(vec3(rot(bank) * p, 1.5));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 40.0) break;
            t += d;
          }
          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          vec2 q = pos.xy - path(pos.z);
          float a = atan(q.y, q.x);
          float check = mod(floor(a / TAU * 12.0) + floor(pos.z * 0.5), 2.0);
          vec3 base = mix(vec3(0.15, 0.2, 0.4), vec3(0.9, 0.75, 0.55), check);
          float dif = max(dot(n, -rd), 0.0);
          float fall = 1.0 / (1.0 + t * t * 0.05);
          vec3 col = base * dif * fall;
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`ahead` を `0.5` にすると、すぐ目の前を見てカメラがせわしなく揺れます。`* 0.4` を `* 1.5` にすると、大きく傾きます",
        en: "Set `ahead` to `0.5` and the camera stares at the road right in front of it and jitters around. Change `* 0.4` to `* 1.5` to bank hard",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "カメラの位置も向きも傾きも、すべて同じ `path` から作っているので、道の形を変えれば飛び方も自動でついてきます。`path` の `sin` の数や速さを変えて、自分好みの道を探してみてください。",
        en: "The camera's position, direction and tilt all come from the same `path`, so if you change the road, the flight follows automatically. Play with the number and speed of the `sin` waves in `path` to find a road you like.",
      },
    },
    {
      type: "note",
      tone: "warning",
      text: {
        ja: "カメラの z は `time * 3.0` で増え続けます。配信の背景のように何時間も流すと、z がとても大きくなって小数の細かさが足りなくなり、絵が乱れてきます。道の模様や灯りの置き方に乱数を使うときも、`hash21(floor(pos.z))` のように進んだ距離をそのまま入れると、長く流したときに模様が崩れます([乱数をつくる](/learn/randomness))。長く流す作品では、[時間で演出する](/learn/timeline) の「つなぎ目の無いループ」のように、時間や距離を `mod` で包んで小さく保ちます。",
        en: "The camera's z keeps growing with `time * 3.0`. Run it for hours, as a stream background might, and z gets so large that floats run out of precision and the picture breaks up. Likewise, if you use randomness for the wall pattern or the placement of lights, feeding in the distance traveled directly, as in `hash21(floor(pos.z))`, makes the pattern fall apart over long runs ([Making randomness](/learn/randomness)). For works meant to run a long time, keep time and distance small by wrapping them with `mod`, as in \"Seamless loops\" in [Directing with time](/learn/timeline).",
      },
    },

    { type: "heading", text: { ja: "光の筋と速度感", en: "Light streaks and a sense of speed" } },
    {
      type: "paragraph",
      text: {
        ja: "最後に、飛んでいる感じを強めます。速さを感じさせるものには、次のようなものがあります。",
        en: "Finally, let's make the flight feel fast. A few things sell speed:",
      },
    },
    {
      type: "list",
      items: [
        {
          ja: "進む向きに長い線(光の筋)。動いている向きがはっきりする",
          en: "Long lines along the direction of travel (light streaks), which make the direction of motion obvious",
        },
        {
          ja: "横を通りすぎていく、くり返しの目印(輪やタイル)。速く通りすぎるほど速く感じる",
          en: "Repeating markers that whiz past (rings, tiles): the faster they go by, the faster you feel",
        },
        {
          ja: "広い画角。焦点距離を短くすると、手前のものが大きく、速く流れる",
          en: "A wide field of view: a shorter focal length makes nearby things large and quick",
        },
        {
          ja: "霧。奥を隠すと、どこまでも続いているように見える",
          en: "Fog: hiding the far end makes the tunnel feel endless",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "光の筋は、レイを進めるループの中で作ります。1 歩ごとに、その点から「光のレール」(壁ぎわを通る細い線)までの距離を測り、近いほど多くの光をためていきます。レールのすぐそばを通ったレイほど明るくなるので、細く光る線が空中に浮かびます。[光と仕上げ](/learn/light-and-glow) の `1 / 距離` のにじみを、3D の中で足し合わせているわけです。",
        en: "The streaks are built inside the raymarch loop. At every step, measure the distance from that point to a light rail (a thin line running along the wall) and collect more light the closer it is. Rays that pass right by a rail end up brightest, so thin glowing lines hang in the air. It is the `1 / distance` glow from [Light and finishing](/learn/light-and-glow), added up in 3D.",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "ためる量に `min(d, 0.3)` をかけているのは、1 歩の長さで重みを付けるためです。大きく進んだ 1 歩は長い区間を飛ばしているので、その分多めに足します。ただ、筒の真ん中では 1 歩がとても長くなるので、0.3 で頭打ちにして、明るくなりすぎないようにしています。",
        en: "Multiplying by `min(d, 0.3)` weights each step by its length: a long step skips a long stretch, so it should add more. In the middle of the tube, though, steps get very long, so we cap the weight at 0.3 to keep it from blowing out.",
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

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec2 path(float z) {
          return vec2(sin(z * 0.15) * 2.0, cos(z * 0.11) * 1.5);
        }

        float map(vec3 p) {
          p.xy -= path(p.z);
          return 1.0 - length(p.xy);
        }

        //ja: 4 本の光のレール(壁ぎわを通る細い線)までの距離
        //en: distance to the four light rails running along the wall
        float rails(vec3 p) {
          vec2 q = rot(PI * 0.25) * (p.xy - path(p.z));
          return length(abs(q) - vec2(0.62));
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float z0 = time * 4.0;
          float ahead = 3.0;
          vec3 ro = vec3(path(z0), z0);
          vec3 ta = vec3(path(z0 + ahead), z0 + ahead);
          float bank = (path(z0 + ahead).x - path(z0).x) * 0.4;
          vec3 rd = camera(ro, ta) * normalize(vec3(rot(bank) * p, 1.2));

          float t = 0.0;
          vec3 glow = vec3(0.0);
          for (int i = 0; i < 64; i++) {
            vec3 pos = ro + rd * t;
            float d = map(pos);
            //ja: レールの近くを通るほど光をためる。光の粒がレールを前へ走る
            //en: collect light near the rails; pulses of light race forward along them
            float pulse = 0.5 + 0.5 * sin(pos.z * 0.8 - time * 12.0);
            float r = rails(pos);
            glow += vec3(0.2, 0.6, 1.0) * 0.0012 / (0.0004 + r * r) * (0.2 + pulse) * min(d, 0.3);
            if (d < 0.001 || t > 40.0) break;
            t += d;
          }

          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          vec2 q = pos.xy - path(pos.z);
          float a = atan(q.y, q.x);
          vec2 g = vec2(a / TAU * 16.0, pos.z * 0.5);
          vec2 f = abs(fract(g) - 0.5);
          float seam = smoothstep(0.44, 0.5, max(f.x, f.y));
          vec3 base = mix(vec3(0.03, 0.025, 0.055), vec3(0.0), seam);
          float dif = max(dot(n, -rd), 0.0);
          float fall = 1.0 / (1.0 + t * t * 0.05);
          vec3 col = base * dif * fall;
          //ja: 6 単位ごとに光る輪。色は輪の番号で変える
          //en: a glowing ring every 6 units, colored by its number
          float ring = abs(fract(pos.z / 6.0) - 0.5) * 6.0;
          vec3 ringCol = palette(floor(pos.z / 6.0) * 0.17, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          col += ringCol * (1.0 - smoothstep(0.0, 0.15, ring)) * 3.0;
          col = mix(col, vec3(0.012, 0.005, 0.03), 1.0 - exp(-t * 0.06));
          col += glow;
          col = 1.0 - exp(-col * 1.5);
          col *= 1.0 - 0.15 * dot(p, p);
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      caption: {
        ja: "`vec3(rot(bank) * p, 1.2)` の `1.2` を `0.7` にすると広角になり、速さが増して見えます。`time * 4.0` を `time * 8.0` にすると、倍の速さで飛びます",
        en: "Change the `1.2` in `vec3(rot(bank) * p, 1.2)` to `0.7` for a wider angle, and the flight looks faster. Change `time * 4.0` to `time * 8.0` to fly twice as fast",
      },
    },
    {
      type: "paragraph",
      text: {
        ja: "輪は、壁の `pos.z` を 6 ごとに区切り、区切りの真ん中のすぐ近くだけを光らせて作っています。色は区切りの番号 `floor(pos.z / 6.0)` をパレットに入れて変えています。最後の `1.0 - exp(-col * 1.5)` は [光と仕上げ](/learn/light-and-glow) のトーンマッピングで、光がたまりすぎて白く飛んだところを、なめらかに抑えます。",
        en: "The rings come from slicing the wall's `pos.z` every 6 units and lighting up only a narrow band in the middle of each slice. The color comes from feeding the slice number `floor(pos.z / 6.0)` into a palette. The final `1.0 - exp(-col * 1.5)` is the tone mapping from [Light and finishing](/learn/light-and-glow), which gently tames spots where too much light piled up.",
      },
    },
    {
      type: "note",
      tone: "tip",
      text: {
        ja: "ループの中でためる光は、何歩進んだかで明るさが変わります。ループの上限や `break` の条件、歩幅を変えたら、光の強さ(ここでは `0.0012`)も合わせて見直してください。",
        en: "Light gathered inside the loop depends on how many steps the ray takes. If you change the loop limit, the `break` condition or the step size, revisit the glow strength (`0.0012` here) as well.",
      },
    },

    { type: "heading", text: { ja: "課題", en: "Exercises" } },
    {
      type: "paragraph",
      text: {
        ja: "2D のトンネルから始めて、3D のトンネルに物を置いたり、形を変えたりしてみましょう。どれも、この回の例のどこかが土台になっています。",
        en: "Start with a 2D tunnel, then put objects into the 3D one and reshape it. Each exercise builds on one of the examples in this lesson.",
      },
    },
    {
      type: "exercise",
      title: { ja: "渦を巻くトンネル", en: "A swirling tunnel" },
      prompt: {
        ja: "2D のトンネルの模様を、6 本のしまが奥へ向かってねじれていく渦巻きにしてください。しまの色は奥行きによって変わり、しまの境目は細く光るようにします。",
        en: "Turn the 2D tunnel pattern into a swirl: six stripes that twist as they head into the distance. The stripe color should change with depth, and the edges between stripes should glow as thin lines.",
      },
      starter: `
        #define PI 3.14159265
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = length(p);
          float a = atan(p.y, p.x);
          float depth = 0.4 / r;
          float u = a / TAU + 0.5;
          float z = depth + time * 1.5;
          //ja: ここを書き換える(いまはマス目)
          //en: change this part (it is a checkerboard for now)
          float check = mod(floor(u * 12.0) + floor(z * 2.0), 2.0);
          vec3 col = mix(vec3(0.1, 0.12, 0.25), vec3(0.95, 0.75, 0.45), check);
          col *= exp(-depth * 0.5);
          return vec4(col, 1.0);
        }
      `,
      solution: `
        #define PI 3.14159265
        #define TAU 6.28318531

        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
          return a + b * cos(TAU * (c * t + d));
        }

        vec4 render(vec2 uv, vec2 p) {
          float r = length(p);
          float a = atan(p.y, p.x);
          float depth = 0.4 / r;
          float u = a / TAU + 0.5;
          float z = depth + time * 1.5;
          //ja: 6 本のしま。奥へ行くほど角度をずらしてねじる
          //en: six stripes, shifted around more and more with depth to twist them
          float s = sin((u * 6.0 + z * 0.5 - time * 0.2) * TAU);
          float band = smoothstep(-0.3, 0.3, s);
          vec3 bright = palette(z * 0.15, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
          vec3 dark = vec3(0.02, 0.03, 0.08);
          vec3 col = mix(bright, dark, band);
          //ja: しまの境目(s が 0 に近いところ)を細く光らせる
          //en: a thin glowing line where s is close to 0, on each stripe edge
          col += vec3(1.0, 0.9, 0.8) * (1.0 - smoothstep(0.0, 0.15, abs(s))) * 0.6;
          col *= exp(-depth * 0.5);
          return vec4(col, 1.0);
        }
      `,
      hints: [
        {
          ja: "`sin(u * 6.0 * TAU)` は角度だけで決まり、6 本のしまになります。ここに奥行き `z` を少し足すと、奥へ行くほど角度がずれて、しまがねじれます",
          en: "`sin(u * 6.0 * TAU)` depends only on the angle and gives six stripes. Add a little of the depth `z` inside it and the stripes shift around with depth, which twists them",
        },
        {
          ja: "`smoothstep(-0.3, 0.3, s)` で、しまの値 `s` を 0〜1 の塗り分けにします。境目は `s` が 0 に近いところなので、`1.0 - smoothstep(0.0, 0.15, abs(s))` で光らせられます",
          en: "`smoothstep(-0.3, 0.3, s)` turns the stripe value `s` into a 0–1 split. The edges are where `s` is near 0, so `1.0 - smoothstep(0.0, 0.15, abs(s))` lights them up",
        },
        {
          ja: "`float s = sin((u * 6.0 + z * 0.5) * TAU);` から始めましょう。色は `palette(z * 0.15, …)` のように奥行きで選びます",
          en: "Start from `float s = sin((u * 6.0 + z * 0.5) * TAU);` and pick the color by depth, as in `palette(z * 0.15, …)`",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "門をくぐる", en: "Flying through gates" },
      prompt: {
        ja: "道に沿って飛ぶトンネルに、10 単位ごとに四角い門(真ん中が抜けた枠)を置いて、その中をくぐり抜けていくようにしてください。門は道の中心に置き、1 つごとに少しずつ違う角度に回して、壁とは違う色で塗ります。",
        en: "In the tunnel flight, place a square gate (a frame with a hole in the middle) every 10 units so you fly through them. Center each gate on the path, give each one a slightly different rotation, and paint the gates a different color from the walls.",
      },
      starter: `
        #define PI 3.14159265
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        vec2 path(float z) {
          return vec2(sin(z * 0.15) * 2.0, cos(z * 0.11) * 1.5);
        }

        float tunnel(vec3 p) {
          p.xy -= path(p.z);
          return 1.0 - length(p.xy);
        }

        float map(vec3 p) {
          //ja: ここに門を足す
          //en: add the gates here
          return tunnel(p);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float z0 = time * 3.0;
          float ahead = 3.0;
          vec3 ro = vec3(path(z0), z0);
          vec3 ta = vec3(path(z0 + ahead), z0 + ahead);
          float bank = (path(z0 + ahead).x - path(z0).x) * 0.4;
          vec3 rd = camera(ro, ta) * normalize(vec3(rot(bank) * p, 1.5));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 40.0) break;
            t += d;
          }
          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          vec2 q = pos.xy - path(pos.z);
          float a = atan(q.y, q.x);
          float check = mod(floor(a / TAU * 12.0) + floor(pos.z * 0.5), 2.0);
          vec3 base = mix(vec3(0.15, 0.2, 0.4), vec3(0.9, 0.75, 0.55), check);
          float dif = max(dot(n, -rd), 0.0);
          float fall = 1.0 / (1.0 + t * t * 0.05);
          vec3 col = base * dif * fall;
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      solution: `
        #define PI 3.14159265
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        float sdBox(vec3 p, vec3 b) {
          vec3 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }

        vec2 path(float z) {
          return vec2(sin(z * 0.15) * 2.0, cos(z * 0.11) * 1.5);
        }

        float tunnel(vec3 p) {
          p.xy -= path(p.z);
          return 1.0 - length(p.xy);
        }

        //ja: 10 単位ごとの門。いちばん近い門の番号 k を求め、その門の中心から測る
        //en: a gate every 10 units: find the nearest gate number k and measure from its center
        float gates(vec3 p) {
          float k = floor(p.z / 10.0 + 0.5);
          vec3 q = vec3(p.xy - path(k * 10.0), p.z - k * 10.0);
          q.xy = rot(k * 0.6) * q.xy;
          float outer = sdBox(q, vec3(0.75, 0.75, 0.08));
          float inner = sdBox(q, vec3(0.6, 0.6, 1.0));
          return max(outer, -inner);
        }

        float map(vec3 p) {
          return min(tunnel(p), gates(p));
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float z0 = time * 3.0;
          float ahead = 3.0;
          vec3 ro = vec3(path(z0), z0);
          vec3 ta = vec3(path(z0 + ahead), z0 + ahead);
          float bank = (path(z0 + ahead).x - path(z0).x) * 0.4;
          vec3 rd = camera(ro, ta) * normalize(vec3(rot(bank) * p, 1.5));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 40.0) break;
            t += d * 0.9; //ja: 門のくり返しで距離が少し不正確なので控えめに //en: the repeated gates make the distance slightly inexact
          }
          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          vec2 q = pos.xy - path(pos.z);
          float a = atan(q.y, q.x);
          float check = mod(floor(a / TAU * 12.0) + floor(pos.z * 0.5), 2.0);
          vec3 base = mix(vec3(0.15, 0.2, 0.4), vec3(0.9, 0.75, 0.55), check);
          //ja: 門のほうが近ければ、門に当たっている
          //en: if the gate is closer than the wall, we hit the gate
          if (gates(pos) < tunnel(pos)) {
            base = vec3(1.0, 0.35, 0.1);
          }
          float dif = max(dot(n, -rd), 0.0);
          float fall = 1.0 / (1.0 + t * t * 0.05);
          vec3 col = base * dif * fall;
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      hints: [
        {
          ja: "`floor(p.z / 10.0 + 0.5)` で、いちばん近い門の番号が求まります。その門の中心は、z が 番号 × 10、xy が `path(番号 * 10.0)` です",
          en: "`floor(p.z / 10.0 + 0.5)` gives the number of the nearest gate. Its center is at z = number × 10, with xy at `path(number * 10.0)`",
        },
        {
          ja: "枠は、外側の箱から内側の箱をくりぬいた形です。くりぬきは `max(外, -内)` でした([図形を組み合わせる](/learn/combining-shapes))。内側の箱を z の向きに長くすると、手前から奥まで穴が抜けます",
          en: "A frame is an outer box with an inner box cut out of it. Cutting is `max(outer, -inner)` (from [Combining shapes](/learn/combining-shapes)). Make the inner box long in z so the hole goes all the way through",
        },
        {
          ja: "`map` は `min(tunnel(p), gates(p))` にします。当たった点で `gates(pos) < tunnel(pos)` なら門の色に。門のくり返しで距離が少し不正確になるので、歩幅は `d * 0.9` くらいにすると安全です",
          en: "Make `map` return `min(tunnel(p), gates(p))`, and at the hit point use the gate color if `gates(pos) < tunnel(pos)`. The repeated gates make the distance slightly inexact, so stepping by `d * 0.9` is safer",
        },
      ],
    },
    {
      type: "exercise",
      title: { ja: "溶岩の洞くつ", en: "A lava cave" },
      prompt: {
        ja: "筒のトンネルを、場所によって太さが変わり、壁がでこぼこした洞くつにしてください。カメラのすぐ上のライトで岩を照らし、岩の割れ目からはオレンジ色の溶岩が光るようにします。奥は赤黒い闇に沈めます。",
        en: "Turn the tube into a cave whose width changes along the way and whose walls are bumpy. Light the rock with a lamp just above the camera, and let orange lava glow through cracks in the rock. Let the far end sink into a dark red gloom.",
      },
      starter: `
        #define PI 3.14159265
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec2 path(float z) {
          return vec2(sin(z * 0.15) * 2.0, cos(z * 0.11) * 1.5);
        }

        float map(vec3 p) {
          p.xy -= path(p.z);
          return 1.0 - length(p.xy);
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float z0 = time * 2.0;
          float ahead = 3.0;
          vec3 ro = vec3(path(z0), z0);
          vec3 ta = vec3(path(z0 + ahead), z0 + ahead);
          float bank = (path(z0 + ahead).x - path(z0).x) * 0.4;
          vec3 rd = camera(ro, ta) * normalize(vec3(rot(bank) * p, 1.3));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 30.0) break;
            t += d;
          }
          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          //ja: 照らし方と色を書き換える
          //en: change the lighting and colors
          float dif = max(dot(n, -rd), 0.0);
          float fall = 1.0 / (1.0 + t * t * 0.05);
          vec3 col = vec3(0.6, 0.55, 0.5) * dif * fall;
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      solution: `
        #define PI 3.14159265
        #define TAU 6.28318531

        mat2 rot(float a) {
          float c = cos(a), s = sin(a);
          return mat2(c, s, -s, c);
        }

        mat3 camera(vec3 ro, vec3 ta) {
          vec3 f = normalize(ta - ro);
          vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
          vec3 u = cross(f, r);
          return mat3(r, u, f);
        }

        vec2 path(float z) {
          return vec2(sin(z * 0.15) * 2.0, cos(z * 0.11) * 1.5);
        }

        float map(vec3 p) {
          vec2 q = p.xy - path(p.z);
          //ja: 場所によって太さが変わる筒
          //en: a tube whose radius changes along the way
          float radius = 1.6 + 0.6 * sin(p.z * 0.21) + 0.3 * sin(p.z * 0.53);
          float d = radius - length(q);
          //ja: 岩のでこぼこ(向きと細かさの違う波を足す)
          //en: rocky bumps: waves of different directions and sizes added together
          d += 0.2 * sin(p.x * 2.1 + p.z * 0.7) * sin(p.y * 1.9 - p.z * 1.3);
          d += 0.08 * sin(p.x * 5.3 - p.y * 3.1) * sin(p.z * 4.7 + p.y * 2.3);
          return d;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(0.001, 0.0);
          return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)));
        }

        vec4 render(vec2 uv, vec2 p) {
          float z0 = time * 2.0;
          float ahead = 3.0;
          vec3 ro = vec3(path(z0), z0);
          vec3 ta = vec3(path(z0 + ahead), z0 + ahead);
          float bank = (path(z0 + ahead).x - path(z0).x) * 0.4;
          vec3 rd = camera(ro, ta) * normalize(vec3(rot(bank) * p, 1.3));
          float t = 0.0;
          for (int i = 0; i < 64; i++) {
            float d = map(ro + rd * t);
            if (d < 0.001 || t > 30.0) break;
            //ja: でこぼこで距離が不正確になるので、控えめに進む
            //en: the bumps make the distance inexact, so step cautiously
            t += d * 0.7;
          }
          vec3 pos = ro + rd * t;
          vec3 n = calcNormal(pos);
          //ja: カメラの少し上に、手元を照らすライト
          //en: a lamp just above the camera
          vec3 lp = ro + vec3(0.0, 0.4, 0.5);
          vec3 toL = lp - pos;
          float dist = length(toL);
          float dif = max(dot(n, toL / dist), 0.0);
          float fall = 1.0 / (1.0 + dist * dist * 0.5);
          //ja: くぼみを暗くする(表面から少し離れた点の距離で、手軽な AO)
          //en: darken the hollows with a quick AO: the distance a little off the surface
          float occ = clamp(map(pos + n * 0.25) / 0.25, 0.0, 1.0);
          vec3 rock = vec3(0.16, 0.13, 0.12);
          vec3 col = rock * vec3(0.7, 0.8, 1.0) * dif * fall * occ;
          //ja: 岩の割れ目から溶岩の光
          //en: lava glowing through cracks in the rock
          float vein = abs(sin(pos.x * 5.3 - pos.y * 3.1) * sin(pos.z * 4.7 + pos.y * 2.3));
          col += vec3(1.0, 0.3, 0.05) * (1.0 - smoothstep(0.0, 0.06, vein)) * (0.4 + 0.6 * occ) * 1.5 * exp(-t * 0.1);
          col = mix(col, vec3(0.03, 0.006, 0.0), 1.0 - exp(-t * 0.12));
          return vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
        }
      `,
      hints: [
        {
          ja: "太さは `1.6 + 0.6 * sin(p.z * 0.21)` のように z で変えます。でこぼこは、向きの違う `sin` のかけ算を距離に足して作ります([無限の空間と変形](/learn/infinite-space) の、表面を波打たせる方法です)",
          en: "Vary the radius with z, e.g. `1.6 + 0.6 * sin(p.z * 0.21)`. For bumps, add products of `sin` waves running in different directions to the distance (the surface ripples from [Infinite space and deformation](/learn/infinite-space))",
        },
        {
          ja: "でこぼこを足すと距離が不正確になるので、`t += d * 0.7` で控えめに進めます。ライトは `ro + vec3(0.0, 0.4, 0.5)` に置いた点光源にして、`1.0 / (1.0 + 距離 * 距離 * 0.5)` で弱めます",
          en: "Bumps make the distance inexact, so step with `t += d * 0.7`. Make the lamp a point light at `ro + vec3(0.0, 0.4, 0.5)` and weaken it with `1.0 / (1.0 + dist * dist * 0.5)`",
        },
        {
          ja: "割れ目は、`abs(sin(…) * sin(…))` が 0 に近い細い線です。`1.0 - smoothstep(0.0, 0.06, vein)` にオレンジ色をかけて足し、霧の色は `vec3(0.03, 0.006, 0.0)` のような赤黒にします",
          en: "The cracks are the thin lines where `abs(sin(…) * sin(…))` is close to 0. Add orange times `1.0 - smoothstep(0.0, 0.06, vein)`, and use a dark red fog color such as `vec3(0.03, 0.006, 0.0)`",
        },
      ],
    },

    { type: "heading", text: { ja: "まとめ", en: "Recap" } },
    {
      type: "list",
      items: [
        {
          ja: "画面の中心からの距離 `r` の逆数が奥行き、角度が周りの位置。この 2 つで、壁に模様を貼れる",
          en: "The inverse of the distance `r` from the center is depth, and the angle is the position around: together they map a pattern onto the wall",
        },
        {
          ja: "奥行きに `time` を足すと進み、周りの位置に足すと回る。遠くは `exp` で暗くして隠す",
          en: "Add `time` to the depth to move forward, or to the position around to spin; hide the distance by darkening it with `exp`",
        },
        {
          ja: "周りの方向のくり返しの数は整数にする(±π の継ぎ目)",
          en: "Repeat a whole number of times around the tunnel (the ±π seam)",
        },
        {
          ja: "3D では、筒の内側は `1.0 - length(p.xy)`。`path(p.z)` を引くと道が曲がる",
          en: "In 3D, the inside of a tube is `1.0 - length(p.xy)`; subtract `path(p.z)` to bend it",
        },
        {
          ja: "カメラは道の上に置き、少し先の道を見て、曲がる向きに傾ける",
          en: "Put the camera on the path, look a little ahead, and bank into the turns",
        },
        {
          ja: "速さは、光の筋・流れる目印・広い画角・霧で感じさせる",
          en: "Speed comes from light streaks, passing markers, a wide field of view and fog",
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        ja: "次の回では、時間を場面に分けて、場面の切り替えやつなぎ、拍に合わせた動きで、デモ全体の流れを組み立てます。",
        en: "Next time we split time into scenes and use cuts, transitions and beat-synced motion to shape the flow of a whole demo.",
      },
    },
  ],
};

export default lesson;
