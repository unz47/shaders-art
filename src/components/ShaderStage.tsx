"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";

// 投稿規約は vec4 render(vec2 uv, vec2 p) の本体だけ。ここでその本体を
// Three.js の ShaderMaterial で動くフラグメントシェーダーに包む。
// uv は 0-1、p は中心原点・アスペクト補正済みの座標(データ側の source が前提にしている座標系)。
const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

function buildFragmentShader(source: string): string {
  return `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform float attention;
uniform vec2 resolution;

${source}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= resolution.x / resolution.y;
  gl_FragColor = render(uv, p);
}
`;
}

export function ShaderStage({ source, bytes }: { source: string; bytes: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // rAF ループから最新の playing を読むための ref(state だと古い値を閉じ込めてしまうため)
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setError(null);
    elapsedRef.current = 0;
    setElapsed(0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    let errored = false;
    renderer.debug.onShaderError = (_gl, _program, _vs, fs) => {
      errored = true;
      setError("シェーダーのコンパイルに失敗しました");
      console.error(fs);
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      time: { value: 0 },
      attention: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
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

    let raf = 0;
    let last = performance.now();
    let fpsAcc = 0;
    let fpsFrames = 0;
    let fpsLast = last;
    let badgeLast = last;

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;
      if (errored) return;

      if (playingRef.current) {
        elapsedRef.current += dt;
        uniforms.time.value = elapsedRef.current;
      }

      fpsAcc += dt;
      fpsFrames++;
      if (now - fpsLast > 500) {
        setFps(Math.round(fpsFrames / fpsAcc));
        fpsAcc = 0;
        fpsFrames = 0;
        fpsLast = now;
      }
      // 経過時間の表示は毎フレーム更新すると再描画が無駄に多いので間引く
      if (now - badgeLast > 100) {
        setElapsed(elapsedRef.current);
        badgeLast = now;
      }

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [source]);

  const reset = () => {
    elapsedRef.current = 0;
    setElapsed(0);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-surface border border-border-subtle [&>canvas]:h-full [&>canvas]:w-full"
      >
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-bg-base/90 p-4 text-center text-sm text-text-muted">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? "一時停止" : "再生"}
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          先頭へ
        </Button>
        <div className="flex-1" />
        <Badge>{bytes} bytes</Badge>
        <Badge>{fps} fps</Badge>
        <Badge>{elapsed.toFixed(1)} s</Badge>
      </div>
    </>
  );
}
