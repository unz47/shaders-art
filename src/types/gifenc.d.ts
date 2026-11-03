// gifenc(https://github.com/mattdesl/gifenc)には型定義が無いので、使う分だけ書く
declare module "gifenc" {
  export type Palette = number[][];

  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): Palette;
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette): Uint8Array;

  export interface WriteFrameOptions {
    palette?: Palette;
    /** 1 コマの表示時間(ミリ秒) */
    delay?: number;
    /** 0 で無限ループ。最初のコマでだけ意味を持つ */
    repeat?: number;
  }

  export interface Encoder {
    writeFrame(index: Uint8Array, width: number, height: number, options?: WriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
  }

  export function GIFEncoder(): Encoder;
}
