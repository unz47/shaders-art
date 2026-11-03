import * as THREE from "three";
import { buildFragmentShader, VERTEX_SHADER } from "./glsl";

// 一覧のカードに出す静止画を、ブラウザで作品のコードから描く。投稿されたばかりの作品には
// サムネ画像が無く、あっても 384×240 と小さいので、カードの大きさに合わせて描き直す。
// カードごとに WebGL を作ると数が多いときに重く、ブラウザが持てる数の上限にも当たるので、
// 1 つの WebGL を使い回して 1 枚ずつ順番に描く。常時再生はしない(未収蔵作品は静止画だけ、という方針)。
// uniform はエディタのプレビューと同じ(attention 0、mouse は中心)。

/** 静止画にする時刻(秒)。0 秒だと動き出す前の地味なコマになりがちなので少し進める */
export const STILL_TIME = 2;

/** 描く幅の刻み(px)。大きさが少し違うだけのカードで、描いた結果を使い回せるようにする */
const WIDTH_STEP = 160;
const MAX_WIDTH = 1280;

/**
 * 表示する大きさ(CSS px)から、描く大きさ(画素)を決める。高精細な画面では 2 倍まで細かく描き、
 * 幅は刻みに切り上げる。縦横比は表示と同じにする。
 */
export function stillSize(cssWidth: number, cssHeight: number, pixelRatio: number): { width: number; height: number } {
  const scale = Math.min(Math.max(pixelRatio, 1), 2);
  const width = Math.min(MAX_WIDTH, Math.max(WIDTH_STEP, Math.ceil((cssWidth * scale) / WIDTH_STEP) * WIDTH_STEP));
  const height = Math.max(1, Math.round((width * cssHeight) / Math.max(cssWidth, 1)));
  return { width, height };
}

interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  geometry: THREE.PlaneGeometry;
}

let stage: Stage | null = null;
// 描いた結果(object URL)。同じ作品・同じ大きさならページを移っても描き直さない
const cache = new Map<string, Promise<string>>();
// 1 枚ずつ順番に描くための列
let queue: Promise<unknown> = Promise.resolve();

function getStage(): Stage {
  if (stage) return stage;
  // 描いた結果を画像にするので、描画バッファを残しておく
  const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  // ブラウザに WebGL を取り上げられたら、次に描くときに作り直す
  renderer.domElement.addEventListener("webglcontextlost", () => {
    stage = null;
  });
  stage = {
    renderer,
    scene: new THREE.Scene(),
    camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    geometry: new THREE.PlaneGeometry(2, 2),
  };
  return stage;
}

async function draw(source: string, width: number, height: number): Promise<string> {
  const { renderer, scene, camera, geometry } = getStage();
  renderer.setSize(width, height, false);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: buildFragmentShader(source),
    uniforms: {
      time: { value: STILL_TIME },
      attention: { value: 0 },
      resolution: { value: new THREE.Vector2(width, height) },
      mouse: { value: new THREE.Vector2(0, 0) },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  let failed = false;
  renderer.debug.onShaderError = () => {
    failed = true;
  };
  scene.add(mesh);
  try {
    // コンパイルは時間がかかる(重い作品だと数百ミリ秒)。KHR_parallel_shader_compile が使える
    // ブラウザでは、終わるのを待つ間に画面の処理を止めないよう compileAsync で待ってから描く
    await renderer.compileAsync(scene, camera);
    renderer.render(scene, camera);
  } finally {
    scene.remove(mesh);
    material.dispose();
  }
  if (failed) throw new Error("コンパイルに失敗しました");
  // WebP を作れないブラウザでは PNG になる
  const blob = await new Promise<Blob | null>((resolve) => renderer.domElement.toBlob(resolve, "image/webp", 0.9));
  if (!blob) throw new Error("画像を作れませんでした");
  return URL.createObjectURL(blob);
}

/** 作品の静止画を描いて、その object URL を返す。描けなければ reject する */
export function renderStillUrl(source: string, width: number, height: number): Promise<string> {
  const key = `${width}x${height}\n${source}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const task = queue.then(async () => {
    // 描く合間にブラウザへ処理を返し、スクロールなどを止めない
    await new Promise((resolve) => setTimeout(resolve, 0));
    return draw(source, width, height);
  });
  queue = task.catch(() => undefined);
  cache.set(key, task);
  return task;
}
