"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildFragmentShader, VERTEX_SHADER } from "@/lib/glsl";

// 一覧カードのホバー再生。常時6枚ぶんWebGLコンテキストを張り続けるのは
// 重いので、ホバー中(+ attentionが0に落ち着くまでの余韻)だけcanvasを
// マウントして描画する。非ホバー時は静止サムネイルのみ。
export function ShaderThumbnail({ source, thumbnail, alt }: { source: string; thumbnail: string; alt: string }) {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const hoveredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      className="relative h-full w-full"
      onMouseEnter={() => {
        hoveredRef.current = true;
        setActive(true);
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      <Image src={thumbnail} alt={alt} fill className="object-cover" />
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
