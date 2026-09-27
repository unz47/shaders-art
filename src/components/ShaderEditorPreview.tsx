"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildFragmentShader, VERTEX_SHADER } from "@/lib/glsl";

export interface ShaderEditorStats {
  fps: number;
  elapsed: number;
  frameTimeMs: number;
  error: string | null;
}

// /edit のライブプレビュー。ShaderStage/ShaderThumbnailと同じ土台(Three.js +
// src/lib/glsl.ts)だが、ここでは:
//   - attentionはホバーではなく外部(スライダー)から直接与えられる
//   - 実測フレーム時間・実際のGLSLコンパイルエラーメッセージを親に報告する
//     (Pre-publish checksパネルに使うため)
export function ShaderEditorPreview({
  source,
  playing,
  attention,
  resetToken,
  onStats,
}: {
  source: string;
  playing: boolean;
  attention: number;
  resetToken: number;
  onStats: (stats: ShaderEditorStats) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const attentionRef = useRef(attention);
  useEffect(() => {
    attentionRef.current = attention;
  }, [attention]);

  const onStatsRef = useRef(onStats);
  useEffect(() => {
    onStatsRef.current = onStats;
  }, [onStats]);

  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = 0;
  }, [resetToken]);

  // p と同じ座標系(中心原点・アスペクト補正済み)でのカーソル位置。
  // sourceが変わって描画をやり直しても、カーソル位置はリセットしない
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setError(null);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    let errored = false;
    let errorMessage: string | null = null;
    // 実際のGLSLコンパイラのエラーログ(行番号つき)をそのまま使う
    renderer.debug.onShaderError = (gl, _program, glVertexShader, glFragmentShader) => {
      errored = true;
      const log = gl.getShaderInfoLog(glFragmentShader) || gl.getShaderInfoLog(glVertexShader) || "";
      errorMessage = log.trim() || "コンパイルに失敗しました";
      console.error(log);
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      time: { value: 0 },
      attention: { value: attentionRef.current },
      resolution: { value: new THREE.Vector2(1, 1) },
      mouse: { value: new THREE.Vector2(mouseRef.current.x, mouseRef.current.y) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: buildFragmentShader(source),
      uniforms,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    function resize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      uniforms.resolution.value.set(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function handlePointerMove(e: PointerEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const u = (e.clientX - rect.left) / rect.width;
      // DOMのY(下向き)とGLSLのuv.y(上向き、Three.jsのPlaneGeometry既定)は逆なので反転する
      const v = 1 - (e.clientY - rect.top) / rect.height;
      let mx = (u - 0.5) * 2;
      const my = (v - 0.5) * 2;
      mx *= rect.width / rect.height;
      mouseRef.current.x = mx;
      mouseRef.current.y = my;
    }
    container.addEventListener("pointermove", handlePointerMove);

    let raf = 0;
    let last = performance.now();
    let fpsAcc = 0;
    let fpsFrames = 0;
    let fpsLast = last;
    let statsLast = last;
    let fps = 0;

    let lastFrameTimeMs = 0;

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;

      // errored の判定は render() を呼んだ結果(onShaderErrorが同期的に発火する)
      // なので、チェックをrender()より前に置くと「エラーが起きた直後のtick」で
      // 古い(エラー無し)状態を報告してしまう。render()を試したあとにまとめて
      // 報告することで、エラーが発生したtickでも正しい状態が伝わるようにする。
      if (!errored) {
        if (playingRef.current) {
          elapsedRef.current += dt;
        }
        uniforms.time.value = elapsedRef.current;
        uniforms.attention.value = attentionRef.current;
        uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

        fpsAcc += dt;
        fpsFrames++;
        if (now - fpsLast > 500) {
          fps = Math.round(fpsFrames / fpsAcc);
          fpsAcc = 0;
          fpsFrames = 0;
          fpsLast = now;
        }

        const renderStart = performance.now();
        renderer.render(scene, camera);
        lastFrameTimeMs = performance.now() - renderStart;
      }

      if (now - statsLast > 100) {
        onStatsRef.current({
          fps: errored ? 0 : fps,
          elapsed: elapsedRef.current,
          frameTimeMs: errored ? 0 : lastFrameTimeMs,
          error: errorMessage,
        });
        setError(errorMessage);
        statsLast = now;
      }
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [source]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full [&>canvas]:h-full [&>canvas]:w-full" />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-base p-6 text-center">
          <p className="text-sm font-medium text-danger-solid">コンパイルエラー</p>
          <p className="max-w-full whitespace-pre-wrap font-mono text-xs text-text-primary">{error}</p>
        </div>
      )}
    </div>
  );
}
