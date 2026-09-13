"use client";

// DepthBust — renders a portrait as a real 3D mesh: the plane's vertices are
// displaced along Z using the depth map (face/nose pushed toward the camera,
// hair/background pushed back), then a PerspectiveCamera + slow Y/X rotation
// creates genuine parallax as it "nods" — unlike a CSS rotateY on a flat
// image, which just looks like a card flipping.
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const DEPTH_SCALE = 0.38; // world units of front-back bulge
const ROT_Y_DEG = 16;
const ROT_X_DEG = 3;
const NOD_MS = 2600; // matches the old CSS mc-nod-3d duration
const SEG_X = 64;
const SEG_Y = 80;
const AVATAR_ASSET_VERSION = 6; // bump to cache-bust /avatars/*.png after regenerating

// Recessed areas (eye sockets, under the chin) come back from the depth model
// noticeably darker than the face plane, which read as unsettling hollow/black
// eyes once pushed back in 3D. Protrusions (the nose) stay close to linear so
// the bump still reads; recesses get compressed harder so they soften instead
// of pitting.
const shapeDepth = (raw: number) => {
  const sign = raw < 0 ? -1 : 1;
  const mag = Math.min(Math.abs(raw), 1);
  const exp = raw < 0 ? 1.6 : 0.9;
  return sign * Math.pow(mag, exp);
};

export const DepthBust: React.FC<{ name: string; size?: number; glow?: string }> = ({
  name,
  size = 76,
  glow = "#f5d97a",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = React.useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let alive = true;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let geometry: THREE.PlaneGeometry | null = null;
    let material: THREE.MeshBasicMaterial | null = null;
    let texture: THREE.Texture | null = null;

    const W = size;
    const H = Math.round(size * 1.24);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 10);
    camera.position.set(0, 0, 2.4);
    const group = new THREE.Group();
    scene.add(group);

    const build = (depthImg: HTMLImageElement, colorImg: HTMLImageElement) => {
      if (!alive) return;

      const planeW = 1;
      const planeH = 1.24;
      geometry = new THREE.PlaneGeometry(planeW, planeH, SEG_X, SEG_Y);

      const gridW = SEG_X + 1;
      const gridH = SEG_Y + 1;

      // Sample the depth map at its native resolution and MAX-pool each vertex
      // cell rather than bilinear-scaling straight down to the grid: a naive
      // scaled draw smooths away small peaks (like the tip of a nose) before
      // they ever reach the mesh, which is what was flattening the face.
      const srcW = depthImg.naturalWidth;
      const srcH = depthImg.naturalHeight;
      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = srcW;
      fullCanvas.height = srcH;
      const fctx = fullCanvas.getContext("2d")!;
      fctx.drawImage(depthImg, 0, 0);
      const fullData = fctx.getImageData(0, 0, srcW, srcH).data;

      const cellW = srcW / gridW;
      const cellH = srcH / gridH;

      // PlaneGeometry actually builds iy=0 as the TOP row (it pushes
      // vertices.push(x, -y, 0), inverting Y internally) — same as image row
      // 0. No flip needed; sample rows in the same order.
      const depths = new Array(gridW * gridH);
      for (let iy = 0; iy < gridH; iy++) {
        const imgRow = iy;
        const cy0 = Math.floor(imgRow * cellH);
        const cy1 = Math.min(srcH, Math.ceil((imgRow + 1) * cellH));
        for (let ix = 0; ix < gridW; ix++) {
          const cx0 = Math.floor(ix * cellW);
          const cx1 = Math.min(srcW, Math.ceil((ix + 1) * cellW));
          let maxD = 0;
          for (let py = cy0; py < cy1; py++) {
            for (let px = cx0; px < cx1; px++) {
              const v = fullData[(py * srcW + px) * 4];
              if (v > maxD) maxD = v;
            }
          }
          depths[iy * gridW + ix] = maxD / 255;
        }
      }
      const mean = depths.reduce((a, b) => a + b, 0) / depths.length;

      const pos = geometry.attributes.position;
      for (let i = 0; i < depths.length; i++) {
        pos.setZ(i, shapeDepth(depths[i] - mean) * DEPTH_SCALE);
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();

      texture = new THREE.Texture(colorImg);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.4,
        side: THREE.DoubleSide,
      });

      group.add(new THREE.Mesh(geometry, material));

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
      mount.appendChild(renderer.domElement);

      const t0 = performance.now();
      const tick = (now: number) => {
        if (!alive || !renderer) return;
        const phase = (((now - t0) % NOD_MS) / NOD_MS) * Math.PI * 2;
        group.rotation.y = THREE.MathUtils.degToRad(Math.sin(phase) * ROT_Y_DEG);
        group.rotation.x = THREE.MathUtils.degToRad(-Math.cos(phase) * ROT_X_DEG);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const colorImg = new Image();
    const depthImg = new Image();
    let colorReady = false;
    let depthReady = false;
    let depthFailed = false;

    const tryBuild = () => {
      if (colorReady && depthReady) build(depthImg, colorImg);
    };

    colorImg.onload = () => { colorReady = true; tryBuild(); };
    depthImg.onload = () => { depthReady = true; tryBuild(); };
    depthImg.onerror = () => { depthFailed = true; if (alive) setFailed(true); };
    colorImg.onerror = () => { if (alive) setFailed(true); };

    colorImg.src = `/avatars/${name}.png?v=${AVATAR_ASSET_VERSION}`;
    depthImg.src = `/avatars/${name}-depth.png?v=${AVATAR_ASSET_VERSION}`;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (renderer) {
        mount.removeChild(renderer.domElement);
        renderer.dispose();
      }
      geometry?.dispose();
      material?.dispose();
      texture?.dispose();
    };
  }, [name, size]);

  const glowFilter = `drop-shadow(0 0 7px ${glow}99) drop-shadow(0 4px 14px rgba(0,0,0,0.7))`;

  if (failed) {
    // No depth map / WebGL issue — fall back to a flat image with CSS bobble.
    return (
      <div className="mc-figure-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/avatars/${name}.png?v=${AVATAR_ASSET_VERSION}`}
          alt={name}
          className="mc-figure"
          style={{ width: size, height: "auto", display: "block", filter: glowFilter }}
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        width: size,
        height: Math.round(size * 1.24),
        filter: glowFilter,
      }}
    />
  );
};
