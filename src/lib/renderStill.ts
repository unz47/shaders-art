import * as THREE from "three";
import { buildFragmentShader, VERTEX_SHADER } from "./glsl";

// 作品の 1 コマを、指定した大きさで PNG にする(書き出しメニューの「PNG 画像」)。
// プレビューの canvas をそのまま保存すると表示サイズでしか撮れないので、書き出し用に
// 一時的な WebGL を用意して描き直す。uniform はプレビューと同じ(attention 0、mouse は中心)。

export interface StillOptions {
  width: number;
  height: number;
  /** 描く時刻(秒)。プレビューと同じコマにしたいときは、その経過時間を渡す */
  time: number;
}

export async function renderStillPng(source: string, { width, height, time }: StillOptions): Promise<Blob> {
  // 描いた結果を toBlob で読むので、描画バッファを残しておく
  const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: buildFragmentShader(source),
    uniforms: {
      time: { value: time },
      attention: { value: 0 },
      resolution: { value: new THREE.Vector2(width, height) },
      mouse: { value: new THREE.Vector2(0, 0) },
    },
  });

  try {
    const max = renderer.capabilities.maxTextureSize;
    if (width > max || height > max) {
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
    renderer.render(scene, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
    if (compileError !== null) throw new Error(`コンパイルに失敗しました: ${compileError}`);

    const blob = await new Promise<Blob | null>((resolve) => renderer.domElement.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("画像を作れませんでした");
    return blob;
  } finally {
    material.dispose();
    geometry.dispose();
    renderer.dispose();
    // ブラウザが持てる WebGL の数には上限があるので、すぐに返す
    renderer.forceContextLoss();
  }
}
