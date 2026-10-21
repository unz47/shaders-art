import * as THREE from "three";
import { buildFragmentShader, VERTEX_SHADER } from "./glsl";

// 作品を、プレビューとは別の一時的な WebGL で指定した大きさに描く(書き出しメニューの PNG と GIF)。
// プレビューの canvas をそのまま保存すると表示サイズでしか撮れないので、描き直す。
// uniform はプレビューと同じ(attention 0、mouse は中心)。

export interface OffscreenShader {
  /** 描いた結果が入っている canvas(描画バッファは残してある) */
  canvas: HTMLCanvasElement;
  /** time 秒のコマを描く。コンパイルに失敗していたら例外 */
  render(time: number): void;
  dispose(): void;
}

export function createOffscreenShader(source: string, width: number, height: number): OffscreenShader {
  // 描いた結果を読み出すので、描画バッファを残しておく
  const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    time: { value: 0 },
    attention: { value: 0 },
    resolution: { value: new THREE.Vector2(width, height) },
    mouse: { value: new THREE.Vector2(0, 0) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: buildFragmentShader(source),
    uniforms,
  });
  const dispose = () => {
    material.dispose();
    geometry.dispose();
    renderer.dispose();
    // ブラウザが持てる WebGL の数には上限があるので、すぐに返す
    renderer.forceContextLoss();
  };

  const max = renderer.capabilities.maxTextureSize;
  if (width > max || height > max) {
    dispose();
    throw new Error(`この環境では ${max}px より大きい画像は書き出せません`);
  }
  let compileError: string | null = null;
  renderer.debug.onShaderError = (gl, _program, glVertexShader, glFragmentShader) => {
    compileError = (gl.getShaderInfoLog(glFragmentShader) || gl.getShaderInfoLog(glVertexShader) || "").trim();
  };

  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    canvas: renderer.domElement,
    render(time) {
      uniforms.time.value = time;
      renderer.render(scene, camera);
      if (compileError !== null) throw new Error(`コンパイルに失敗しました: ${compileError}`);
    },
    dispose,
  };
}

export interface StillOptions {
  width: number;
  height: number;
  /** 描く時刻(秒)。プレビューと同じコマにしたいときは、その経過時間を渡す */
  time: number;
}

export async function renderStillPng(source: string, { width, height, time }: StillOptions): Promise<Blob> {
  const shader = createOffscreenShader(source, width, height);
  try {
    shader.render(time);
    const blob = await new Promise<Blob | null>((resolve) => shader.canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("画像を作れませんでした");
    return blob;
  } finally {
    shader.dispose();
  }
}
