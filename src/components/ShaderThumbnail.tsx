"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildFragmentShader, VERTEX_SHADER } from "@/lib/glsl";
import { renderStillUrl, STILL_TIME, stillSize } from "@/lib/stillRenderer";

// 一覧カードのサムネ。
// - 静止画: 画面に入ったら、作品のコードから 1 コマ描いたものを出す(lib/stillRenderer)。
//   描き終わるまではサムネ画像(あれば)を出しておく。投稿されたばかりの作品にはサムネ画像が無い。
// - ホバー再生: 常に何枚ぶんも WebGL を張り続けるのは重いので、ホバー中(+ attention が 0 に
//   落ち着くまでの余韻)だけ canvas をマウントして描画する。
export function ShaderThumbnail({ source, thumbnail, alt }: { source: string; thumbnail: string; alt: string }) {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const hoveredRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // どの source の静止画か。作品が入れ替わったら古い結果は使わない
  const [still, setStill] = useState<{ source: string; url: string | null } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const { width, height } = stillSize(root.clientWidth, root.clientHeight, window.devicePixelRatio);
        renderStillUrl(source, width, height).then(
          (url) => {
            if (!cancelled) setStill({ source, url });
          },
          () => {
            if (!cancelled) setStill({ source, url: null });
          },
        );
      },
      // 画面に入る少し手前から描き始める
      { rootMargin: "200px" },
    );
    observer.observe(root);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [source]);

  const stillUrl = still?.source === source ? still.url : null;
  const stillFailed = still?.source === source && still.url === null;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    let errored = false;
    renderer.debug.onShaderError = (_gl, _program, _vs, fs) => {
      errored = true;
      console.error(fs);
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      // 静止画と同じコマから動き出す(ホバーした瞬間に絵が飛ばないように)
      time: { value: STILL_TIME },
      attention: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      mouse: { value: new THREE.Vector2(0, 0) },
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

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;
      if (errored) return;

      uniforms.time.value += dt;
      // attention はホバーの入り/離れどちらも素早く反応させる
      const target = hoveredRef.current ? 1 : 0;
      uniforms.attention.value += (target - uniforms.attention.value) * Math.min(1, dt * 12);

      renderer.render(scene, camera);
      setVisible(true);

      // ホバーが外れて attention がほぼ落ち着いたら canvas ごと畳む
      if (!hoveredRef.current && uniforms.attention.value < 0.01) {
        setActive(false);
      }
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      setVisible(false);
    };
  }, [active, source]);

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full bg-bg-raised ${!thumbnail && !stillUrl && !stillFailed ? "animate-pulse" : ""}`}
      onMouseEnter={() => {
        hoveredRef.current = true;
        setActive(true);
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      {thumbnail && <Image src={thumbnail} alt={alt} fill className="object-cover" />}
      {stillUrl && (
        // ブラウザで描いた blob の URL なので、next/image の最適化は通せない
        // eslint-disable-next-line @next/next/no-img-element
        <img src={stillUrl} alt={thumbnail ? "" : alt} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {stillFailed && !thumbnail && (
        <div className="absolute inset-0 grid place-items-center font-mono text-[11px] tracking-wide text-text-muted">
          プレビューできません
        </div>
      )}
      {active && (
        <div
          ref={containerRef}
          className={`absolute inset-0 transition-opacity duration-100 [&>canvas]:h-full [&>canvas]:w-full ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
