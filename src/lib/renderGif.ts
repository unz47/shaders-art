import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { createOffscreenShader, RenderError } from "./renderStill";

// 作品をループする GIF にする(書き出しメニューの「GIF」)。画面を録画するのではなく、
// 1 コマずつ決まった時刻で描くので、PC の性能に関係なく滑らかになる。
// 色はコマごとに 256 色へ減らす(gifenc)。作品の動きが書き出す長さで一周しないと、
// ループのつなぎ目で絵が飛ぶ。

export interface GifOptions {
  width: number;
  height: number;
  seconds: number;
  fps: number;
  /** 最初のコマの時刻(秒)。プレビューと同じところから始めるときは、その経過時間を渡す */
  startTime: number;
  /** 0〜1 の進み具合 */
  onProgress?: (ratio: number) => void;
}

export async function renderGif(
  source: string,
  { width, height, seconds, fps, startTime, onProgress }: GifOptions,
): Promise<Blob> {
  const shader = createOffscreenShader(source, width, height);
  try {
    // WebGL の canvas から画素を読むために、2D の canvas に写す(上下の向きもそのまま)
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new RenderError("no-image");

    const frames = Math.max(1, Math.round(seconds * fps));
    const gif = GIFEncoder();
    for (let i = 0; i < frames; i++) {
      shader.render(startTime + i / fps);
      context.drawImage(shader.canvas, 0, 0);
      const { data } = context.getImageData(0, 0, width, height);
      const palette = quantize(data, 256);
      gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay: 1000 / fps, repeat: 0 });
      onProgress?.((i + 1) / frames);
      // 書き出し中も画面が固まらないよう、1 コマごとにブラウザへ処理を返す
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    gif.finish();
    return new Blob([gif.bytes()], { type: "image/gif" });
  } finally {
    shader.dispose();
  }
}
