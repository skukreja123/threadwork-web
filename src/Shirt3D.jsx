import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pathFor, shade } from './shapes';
const K = 2,
  CW = 800,
  CH = 880,
  SX = 110,
  SY = 121;

/* A blurred silhouette becomes a height map, so the garment is "inflated" like fabric with a body inside. */
function heightField(d) {
  const w = 100,
    h = 110,
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.scale(w / 400, h / 440);
  g.fillStyle = '#fff';
  g.fill(new Path2D(d));
  const px = g.getImageData(0, 0, w, h).data;
  let a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = px[i * 4 + 3] / 255;
  const blur = (src, r) => {
    const t = new Float32Array(w * h),
      o = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += src[y * w + Math.min(w - 1, Math.max(0, x + k))];
        t[y * w + x] = s / (2 * r + 1);
      }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += t[Math.min(h - 1, Math.max(0, y + k)) * w + x];
        o[y * w + x] = s / (2 * r + 1);
      }
    return o;
  };
  return { a: blur(blur(a, 4), 4), w, h };
}
const samp = (f, u, v) => {
  const x = u * (f.w - 1),
    y = v * (f.h - 1),
    x0 = Math.floor(x),
    y0 = Math.floor(y),
    x1 = Math.min(f.w - 1, x0 + 1),
    y1 = Math.min(f.h - 1, y0 + 1),
    fx = x - x0,
    fy = y - y0,
    g = (i, j) => f.a[j * f.w + i];
  return (
    (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) +
    (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy
  );
};
const ss = (t) => {
  t = Math.min(1, Math.max(0, (t - 0.5) * 2));
  return t * t * (3 - 2 * t);
};
function buildGeo(d) {
  const f = heightField(d),
    g = new THREE.PlaneGeometry(4, 4.4, SX, SY),
    p = g.attributes.position;
  for (let j = 0; j <= SY; j++)
    for (let i = 0; i <= SX; i++) {
      const u = i / SX,
        v = j / SY,
        hh = ss(samp(f, u, v));
      const wr =
        0.018 * Math.sin(u * 38 + v * 9) +
        0.014 * Math.sin(v * 52 - u * 17) +
        0.01 * Math.sin((u + v) * 70); // soft fabric wrinkles
      p.setZ(j * (SX + 1) + i, Math.pow(hh, 0.65) * 0.42 + wr * hh);
    }
  g.computeVertexNormals();
  return g;
}
const weave = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.55)';
  g.fillRect(0, 0, 2, 2);
  g.fillRect(2, 2, 2, 2);
  g.fillStyle = 'rgba(255,255,255,.4)';
  g.fillRect(2, 0, 2, 2);
  return c;
})();

/* Paints the colour map and the bump map. Embroidery gets raised satin stitches in the bump map, so light catches it. */
function paint(c, b, side, pid, color, sleeve, dz, img) {
  const d = pathFor(pid, sleeve),
    e = shade(color, -45),
    P = new Path2D(d);
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, CW, CH);
  x.save();
  x.setTransform(K, 0, 0, K, 0, 0);
  x.clip(P);
  x.fillStyle = color;
  x.fillRect(0, 0, 400, 440);
  const gr = x.createLinearGradient(0, 0, 400, 0);
  gr.addColorStop(0, 'rgba(0,0,0,.1)');
  gr.addColorStop(0.5, 'rgba(255,255,255,.06)');
  gr.addColorStop(1, 'rgba(0,0,0,.12)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 400, 440);
  x.strokeStyle = e;
  x.lineJoin = 'round';
  const st = (p, w, fill) => {
    const Q = new Path2D(p);
    if (fill) {
      x.fillStyle = fill;
      x.fill(Q);
    }
    x.lineWidth = w;
    x.stroke(Q);
  };
  st(d, 6);
  if (side === 'back') st('M130 62Q200 78 270 62', 3);
  else if (pid === 'polo') {
    st('M130 62L175 108L200 82L225 108L270 62Z', 2, shade(color, -20));
    st('M200 82V170', 2);
    [110, 135, 160].forEach((y) => {
      x.fillStyle = e;
      x.beginPath();
      x.arc(200, y, 3, 0, 7);
      x.fill();
    });
  } else if (pid === 'hoodie') {
    st('M150 75Q200 115 250 75', 3);
    st('M165 330H235L250 380H150Z', 2);
  } else st('M130 62Q200 100 270 62', 6);
  const y = b.getContext('2d');
  y.setTransform(1, 0, 0, 1, 0, 0);
  y.fillStyle = '#707070';
  y.fillRect(0, 0, CW, CH);
  y.globalAlpha = 0.5;
  y.fillStyle = y.createPattern(weave, 'repeat');
  y.fillRect(0, 0, CW, CH);
  y.globalAlpha = 1;
  if (dz && img) {
    const ar = img.width / img.height;
    let w = dz.size,
      h = dz.size;
    if (ar > 1) h = w / ar;
    else w = h * ar;
    if (dz.mode === 'embroidery') {
      const ow = Math.ceil(w * K),
        oh = Math.ceil(h * K),
        mk = () => {
          const o = document.createElement('canvas');
          o.width = ow;
          o.height = oh;
          const q = o.getContext('2d');
          q.drawImage(img, 0, 0, ow, oh);
          return [o, q];
        };
      const lines = (q, c1, c2) => {
        q.globalCompositeOperation = 'source-atop';
        q.lineWidth = 1.5;
        for (let i = -oh; i < ow; i += 5) {
          q.strokeStyle = c1;
          q.beginPath();
          q.moveTo(i, 0);
          q.lineTo(i + oh, oh);
          q.stroke();
          q.strokeStyle = c2;
          q.beginPath();
          q.moveTo(i + 2.5, 0);
          q.lineTo(i + 2.5 + oh, oh);
          q.stroke();
        }
      };
      const [o, q] = mk();
      lines(q, 'rgba(0,0,0,.3)', 'rgba(255,255,255,.25)');
      const [bo, bq] = mk();
      bq.globalCompositeOperation = 'source-in';
      bq.fillStyle = '#fff';
      bq.fillRect(0, 0, ow, oh);
      lines(bq, 'rgba(0,0,0,.6)', 'rgba(255,255,255,0)');
      y.drawImage(bo, (dz.x - w / 2) * K, (dz.y - h / 2) * K);
      x.save();
      x.shadowColor = 'rgba(0,0,0,.65)';
      x.shadowBlur = 5;
      x.shadowOffsetY = 2;
      x.drawImage(o, dz.x - w / 2, dz.y - h / 2, w, h);
      x.restore();
    } else {
      x.globalAlpha = 0.94;
      x.drawImage(img, dz.x - w / 2, dz.y - h / 2, w, h);
      x.globalAlpha = 1;
    }
  }
  x.restore();
  x.save();
  x.globalAlpha = 0.14;
  x.fillStyle = x.createPattern(weave, 'repeat');
  x.globalCompositeOperation = 'source-atop';
  x.fillRect(0, 0, CW, CH);
  x.restore(); // fabric texture shows through the ink
}

export default function Shirt3D({
  pid,
  color,
  sleeve = 'short',
  view = 'front',
  designs,
  onDrag,
  animate = false,
}) {
  const host = useRef(null),
    S = useRef({}),
    D = useRef({}),
    [imgs, setImgs] = useState({});
  D.current = { designs, view, onDrag, animate };
  const fs = designs.front && designs.front.src,
    bs = designs.back && designs.back.src;
  useEffect(() => {
    [
      ['front', fs],
      ['back', bs],
    ].forEach(([k, s]) => {
      if (!s) return setImgs((m) => ({ ...m, [k]: null }));
      const im = new Image();
      im.onload = () => setImgs((m) => ({ ...m, [k]: im }));
      im.src = s;
    });
  }, [fs, bs]);
  const sleeveKey = pid === 'hoodie' ? 'full' : sleeve;
  useEffect(() => {
    const el = host.current;
    let raf;
    const w0 = el.clientWidth || 520;
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setPixelRatio(Math.min(devicePixelRatio, 2));
    ren.setSize(w0, w0 * 1.1, false);
    ren.outputColorSpace = THREE.SRGBColorSpace;
    const cv = ren.domElement;
    cv.style.cssText = 'width:100%;height:auto;display:block;touch-action:none;cursor:grab';
    el.appendChild(cv);
    const scene = new THREE.Scene(),
      cam = new THREE.PerspectiveCamera(30, 1 / 1.1, 0.1, 50);
    cam.position.set(0, 0, 12.5);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8892a6, 1.1));
    const k = new THREE.DirectionalLight(0xffffff, 1.9);
    k.position.set(3, 5, 6);
    scene.add(k);
    const r = new THREE.DirectionalLight(0xbcd0ff, 1.1);
    r.position.set(-4, 2, -6);
    scene.add(r);
    const geo = buildGeo(pathFor(pid, sleeveKey));
    const mk = () => {
      const c = document.createElement('canvas'),
        b = document.createElement('canvas');
      c.width = b.width = CW;
      c.height = b.height = CH;
      const t = new THREE.CanvasTexture(c),
        bt = new THREE.CanvasTexture(b);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      bt.anisotropy = 8;
      return {
        c,
        b,
        m: new THREE.MeshStandardMaterial({
          map: t,
          bumpMap: bt,
          bumpScale: 2.4,
          roughness: 0.93,
          metalness: 0,
          alphaTest: 0.5,
        }),
        t,
        bt,
      };
    };
    const F = mk(),
      B = mk();
    const group = new THREE.Group();
    scene.add(group);
    const front = new THREE.Mesh(geo, F.m);
    front.position.z = 0.012;
    const back = new THREE.Mesh(geo, B.m);
    back.rotation.y = Math.PI;
    back.position.z = -0.012;
    group.add(front, back);
    const hoodM = new THREE.MeshStandardMaterial({ roughness: 0.95 });
    if (pid === 'hoodie') {
      const hd = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        hoodM
      );
      hd.scale.set(0.62, 0.6, 0.4);
      hd.position.set(0, 1.38, -0.12);
      group.add(hd);
    }
    const sc = document.createElement('canvas');
    sc.width = sc.height = 128;
    const sg = sc.getContext('2d'),
      rg = sg.createRadialGradient(64, 64, 4, 64, 64, 62);
    rg.addColorStop(0, 'rgba(0,0,0,.5)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = rg;
    sg.fillRect(0, 0, 128, 128);
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 1.3),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(sc),
        transparent: true,
        depthWrite: false,
      })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = -2.35;
    scene.add(sh);
    const st = {
      rot: 0,
      vel: 0,
      target: D.current.view === 'back' ? Math.PI : 0,
      mode: null,
      lx: 0,
      off: { x: 0, y: 0 },
      disp: {},
    };
    const ray = new THREE.Raycaster(),
      mv = new THREE.Vector2();
    const hit = (e) => {
      const rc = cv.getBoundingClientRect();
      mv.set(
        ((e.clientX - rc.left) / rc.width) * 2 - 1,
        -((e.clientY - rc.top) / rc.height) * 2 + 1
      );
      ray.setFromCamera(mv, cam);
      const hs = ray.intersectObjects([front, back]);
      if (!hs.length) return null;
      return {
        side: hs[0].object === front ? 'front' : 'back',
        x: hs[0].uv.x * 400,
        y: (1 - hs[0].uv.y) * 440,
      };
    };
    cv.onpointerdown = (e) => {
      const q = D.current,
        hh = hit(e);
      st.mode = 'rot';
      st.lx = e.clientX;
      st.vel = 0;
      const dz = hh && q.designs[hh.side];
      if (dz && dz.src && hh.side === q.view) {
        const rr = dz.size / 2 + 6;
        if (Math.abs(hh.x - dz.x) < rr && Math.abs(hh.y - dz.y) < rr) {
          st.mode = 'move';
          st.off = { x: dz.x - hh.x, y: dz.y - hh.y };
        }
      }
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
      cv.style.cursor = st.mode === 'move' ? 'move' : 'grabbing';
    };
    cv.onpointermove = (e) => {
      const q = D.current;
      if (st.mode === 'move') {
        const hh = hit(e);
        if (hh && hh.side === q.view && q.onDrag)
          q.onDrag(
            hh.side,
            Math.max(20, Math.min(380, hh.x + st.off.x)),
            Math.max(20, Math.min(420, hh.y + st.off.y))
          );
      } else if (st.mode === 'rot') {
        st.vel = (e.clientX - st.lx) * 0.012;
        st.target += st.vel;
        st.lx = e.clientX;
      }
    };
    cv.onpointerup = cv.onpointercancel = () => {
      st.mode = null;
      cv.style.cursor = 'grab';
    };
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w) ren.setSize(w, w * 1.1, false);
    });
    ro.observe(el);
    const repaint = () => {
      const q = D.current,
        s = S.current;
      if (!s.imgs) return;
      ['front', 'back'].forEach((side) => {
        const o = side === 'front' ? F : B,
          dz = q.designs[side];
        if (q.animate && dz && !st.disp[side]) st.disp[side] = { x: dz.x, y: dz.y, size: dz.size };
        const dd = dz && { ...dz, ...(st.disp[side] || {}) };
        paint(o.c, o.b, side, pid, s.color, sleeveKey, dd, s.imgs[side]);
        o.t.needsUpdate = o.bt.needsUpdate = true;
      });
    };
    S.current = { ...S.current, repaint, st, hoodM, F, B };
    const t0 = performance.now();
    const tick = () => {
      const t = performance.now() - t0,
        q = D.current;
      if (!st.mode) {
        st.vel *= 0.93;
        st.target += st.vel;
      }
      st.rot += (st.target - st.rot) * 0.12;
      group.rotation.y = st.rot;
      group.rotation.x = Math.sin(t / 1900) * 0.03;
      group.position.y = Math.sin(t / 1500) * 0.04;
      if (q.animate) {
        let moved = false;
        ['front', 'back'].forEach((side) => {
          const dz = q.designs[side];
          if (!dz) return;
          const c = st.disp[side] || (st.disp[side] = { x: dz.x, y: dz.y, size: dz.size });
          ['x', 'y', 'size'].forEach((kk) => {
            const df = dz[kk] - c[kk];
            if (Math.abs(df) > 0.15) {
              c[kk] += df * 0.1;
              moved = true;
            }
          });
        });
        if (moved) repaint();
      }
      ren.render(scene, cam);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ren.dispose();
      geo.dispose();
      [F, B].forEach((o) => {
        o.t.dispose();
        o.bt.dispose();
        o.m.dispose();
      });
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      S.current = {};
    };
  }, [pid, sleeveKey]);
  useEffect(() => {
    const st = S.current.st;
    if (!st) return;
    const b = view === 'back' ? Math.PI : 0,
      T = Math.PI * 2;
    st.vel = 0;
    st.target = b + T * Math.round((st.target - b) / T);
  }, [view, pid, sleeveKey]);
  useEffect(() => {
    const s = S.current;
    if (!s.repaint) return;
    s.color = color;
    s.imgs = imgs;
    s.hoodM.color.set(shade(color, -30));
    ['front', 'back'].forEach((k) => {
      if (!designs[k] || !animate) delete s.st.disp[k];
    });
    s.repaint();
  }, [
    pid,
    sleeveKey,
    color,
    imgs,
    designs.front && designs.front.x,
    designs.front && designs.front.y,
    designs.front && designs.front.size,
    designs.front && designs.front.mode,
    designs.back && designs.back.x,
    designs.back && designs.back.y,
    designs.back && designs.back.size,
    designs.back && designs.back.mode,
  ]);
  return <div ref={host} className="s3d" />;
}
