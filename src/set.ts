// Basement laundry room, washers, props and fluids, all procedural three.js.
import * as THREE from "three";

const std = (c: number, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: number[] = [0, 0, 0], parent?: THREE.Object3D) => {
  const o = new THREE.Mesh(g, m); o.position.set(p[0], p[1], p[2]); o.castShadow = true; o.receiveShadow = true; parent?.add(o); return o;
};
const box = (w: number, h: number, d: number, m: THREE.Material, p: number[], parent?: THREE.Object3D) => mesh(new THREE.BoxGeometry(w, h, d), m, p, parent);
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep: number[] = [1, 1]) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!; draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t;
}
const grime = (g: CanvasRenderingContext2D, w: number, h: number, base: string, n: number, a: number) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(90,70,30,${a * rnd()})`; const r = 4 + rnd() * 40; g.beginPath(); g.arc(rnd() * w, rnd() * h, r, 0, 7); g.fill(); }
};

export type World = {
  wash: THREE.Group; body: THREE.Group; lid: THREE.Group; shellMats: THREE.MeshStandardMaterial[]; butterRim: THREE.Group; front: THREE.Group;
  wires: THREE.Mesh[]; clockH: THREE.Group; clockM: THREE.Group; stream: THREE.Mesh; streamMats: Record<string, THREE.Material>; puddle: THREE.Mesh;
  props: Record<string, THREE.Object3D>; mats: Record<string, THREE.Material>; key: THREE.DirectionalLight;
};

export function buildWorld(scene: THREE.Scene): World {
  scene.background = new THREE.Color(0x2a2418);
  const hemi = new THREE.HemisphereLight(0xfff0c8, 0x7a6038, 1.25); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe2a8, 2.1); key.position.set(1.6, 3.2, 2.6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -2.5; key.shadow.camera.right = 2.5; key.shadow.camera.top = 3; key.shadow.camera.bottom = -1.5;
  key.shadow.radius = 4; key.shadow.bias = -0.0008; scene.add(key);
  const fill = new THREE.PointLight(0xffd890, 1.6, 6, 1.5); fill.position.set(-0.6, 2.4, 1.2); scene.add(fill);

  // room
  const wallT = canvasTex(512, 512, (g) => { grime(g, 512, 512, "#d6c48c", 160, 0.035); }, [3, 2]);
  const wallM = new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9 });
  const floorT = canvasTex(512, 512, (g) => {
    grime(g, 512, 512, "#cfc6ad", 120, 0.07);
    g.strokeStyle = "#8d8471"; g.lineWidth = 5; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
  }, [3, 3]);
  const floor = mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.55 }), [0, 0, 0.5], scene); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  const back = mesh(new THREE.PlaneGeometry(6, 4), wallM, [0, 2, -0.76], scene); back.castShadow = false;
  const left = mesh(new THREE.PlaneGeometry(6, 4), wallM, [-1.55, 2, 1.5], scene); left.rotation.y = Math.PI / 2; left.castShadow = false;
  const right = mesh(new THREE.PlaneGeometry(6, 4), wallM, [1.75, 2, 1.5], scene); right.rotation.y = -Math.PI / 2; right.castShadow = false;
  const ceil = mesh(new THREE.PlaneGeometry(6, 6), std(0xcabb8a, 0.9), [0, 2.7, 0.5], scene); ceil.rotation.x = Math.PI / 2;
  // shelf + bottles
  const wood = std(0x5e3f22, 0.75);
  box(2.6, 0.035, 0.26, wood, [0, 1.9, -0.63], scene);
  for (const x of [-1.1, 0, 1.1]) box(0.03, 0.18, 0.2, std(0x333333, 0.5, 0.6), [x, 1.8, -0.65], scene);
  const bottleCols = [0xf4f4f0, 0xe8e8e0, 0x2f6fd0, 0xf0f0f0, 0xd03030, 0xf4f4f0, 0x3a7ee0];
  for (let i = 0; i < 9; i++) {
    const h = 0.16 + rnd() * 0.12, x = -1.15 + i * 0.27 + rnd() * 0.05;
    const b = mesh(new THREE.CylinderGeometry(0.045, 0.05, h, 14), std(bottleCols[i % bottleCols.length], 0.35), [x, 1.92 + h / 2, -0.62], scene);
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 10), std(0x2a5ab0, 0.4), [0, h / 2 + 0.02, 0], b);
  }
  // pipes
  const pipeM = std(0x8a8476, 0.45, 0.6);
  for (const [x, z] of [[-0.42, -0.72], [-0.3, -0.72], [0.55, -0.72]]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.0, 10), pipeM, [x, 1.65, z], scene);
  const hp = mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.0, 10), pipeM, [0, 2.45, -0.7], scene); hp.rotation.z = Math.PI / 2;
  const valve = box(0.26, 0.2, 0.05, std(0xf2f2ea, 0.4), [-0.35, 1.2, -0.73], scene);
  for (const x of [-0.06, 0.06]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), std(x < 0 ? 0xc03030 : 0x3050c0, 0.4), [x, 0, 0.04], valve).rotation.x = Math.PI / 2;
  // sink
  const white = std(0xf1efe6, 0.35);
  const sink = new THREE.Group(); sink.position.set(1.3, 0, -0.45); scene.add(sink);
  box(0.6, 0.06, 0.5, white, [0, 0.9, 0], sink); box(0.6, 0.3, 0.04, white, [0, 0.76, 0.23], sink); box(0.04, 0.3, 0.5, white, [0.28, 0.76, 0], sink); box(0.04, 0.3, 0.5, white, [-0.28, 0.76, 0], sink);
  for (const x of [-0.25, 0.25]) for (const z of [-0.2, 0.2]) mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.62, 8), pipeM, [x, 0.31, z], sink);
  const fau = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8), pipeM, [0, 1.05, -0.22], sink);
  // clock
  const clock = new THREE.Group(); clock.position.set(1.3, 1.55, -0.74); scene.add(clock);
  const face = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 40), std(0xfafafa, 0.4), [0, 0, 0.015], clock); face.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(0.2, 0.018, 10, 40), std(0x111111, 0.4), [0, 0, 0.03], clock);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; box(0.012, i % 3 ? 0.025 : 0.045, 0.005, std(0x111111), [Math.sin(a) * 0.16, Math.cos(a) * 0.16, 0.033], clock).rotation.z = -a; }
  const clockH = new THREE.Group(); clockH.position.z = 0.038; clock.add(clockH); box(0.016, 0.1, 0.006, std(0x111111), [0, 0.045, 0], clockH);
  const clockM = new THREE.Group(); clockM.position.z = 0.042; clock.add(clockM); box(0.01, 0.15, 0.006, std(0x111111), [0, 0.07, 0], clockM);
  // basket + bottles on floor
  const basket = new THREE.Group(); basket.position.set(-0.5, 0, 0.62); scene.add(basket);
  mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.32, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x8fc4c8, roughness: 0.5, side: THREE.DoubleSide }), [0, 0.16, 0], basket);
  for (let i = 0; i < 7; i++) mesh(new THREE.SphereGeometry(0.09, 10, 8), std([0x3a4e78, 0xe8e8e8, 0x5a6a8a, 0x8a3030][i % 4], 0.9), [(rnd() - 0.5) * 0.25, 0.26 + rnd() * 0.06, (rnd() - 0.5) * 0.25], basket);
  for (let i = 0; i < 4; i++) { const b = box(0.11, 0.22, 0.07, std(i % 2 ? 0x2c66c8 : 0xf0f0f0, 0.35), [0.32 + i * 0.12, 0.11, 0.6 + (i % 2) * 0.08], scene); mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 10), std(0x1f4fa8, 0.4), [0, 0.13, 0], b); }

  // ---- top-loading washer, pivot at front-bottom edge for tipping ----
  const wash = new THREE.Group(); wash.position.set(0, 0, 0.36); scene.add(wash);
  const body = new THREE.Group(); body.position.set(0, 0, -0.36); wash.add(body);
  const shellMats: THREE.MeshStandardMaterial[] = [];
  const sm = () => { const m = std(0xf3f1e8, 0.3); shellMats.push(m); return m; };
  box(0.76, 0.9, 0.02, sm(), [0, 0.45, 0.35], body); box(0.76, 0.9, 0.02, sm(), [0, 0.45, -0.35], body);
  box(0.02, 0.9, 0.72, sm(), [-0.37, 0.45, 0], body); box(0.02, 0.9, 0.72, sm(), [0.37, 0.45, 0], body);
  const shape = new THREE.Shape(); shape.moveTo(-0.38, -0.36); shape.lineTo(0.38, -0.36); shape.lineTo(0.38, 0.36); shape.lineTo(-0.38, 0.36);
  const hole = new THREE.Path(); hole.absarc(0, -0.03, 0.3, 0, Math.PI * 2, true); shape.holes.push(hole);
  const top = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false, curveSegments: 40 }), sm(), [0, 0.9, 0], body); top.rotation.x = -Math.PI / 2;
  const ctrl = box(0.76, 0.17, 0.08, sm(), [0, 1.015, -0.32], body);
  for (const x of [-0.25, 0.2, 0.28]) mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 14), std(0xbbbbbb, 0.3, 0.5), [x, 0.02, 0.045], ctrl).rotation.x = Math.PI / 2;
  const drumT = canvasTex(256, 256, (g) => { g.fillStyle = "#b9bcc0"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#4a4c50"; for (let y = 8; y < 256; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 256; x += 16) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } }, [6, 3]);
  const drumM = new THREE.MeshStandardMaterial({ map: drumT, roughness: 0.35, metalness: 0.65, side: THREE.DoubleSide });
  mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.64, 40, 1, true), drumM, [0, 0.6, 0.03], body);
  mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.02, 40), drumM, [0, 0.28, 0.03], body);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.935, -0.29); body.add(lidPivot);
  box(0.7, 0.025, 0.6, sm(), [0, 0.0125, 0.3], lidPivot);
  // butter goo on the rim
  const butterM = std(0xf6e050, 0.22); const oilM = new THREE.MeshStandardMaterial({ color: 0xd8a018, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.75 });
  const foamM = std(0xc8a2f0, 0.5);
  const butterRim = new THREE.Group(); body.add(butterRim);
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.05 + rnd() * 0.03, 12, 8), butterM, [Math.cos(a) * 0.32, 0.94, -0.03 + Math.sin(a) * 0.32], butterRim).scale.y = 0.55; }
  for (let i = 0; i < 9; i++) { const x = -0.33 + i * 0.083, l = 0.1 + rnd() * 0.35; const d = mesh(new THREE.CapsuleGeometry(0.018 + rnd() * 0.012, l * 0.7, 4, 8), butterM, [x, 0.92 - l / 2, 0.365], butterRim); }
  // front loader
  const front = new THREE.Group(); front.position.set(-0.86, 0, -0.05); scene.add(front);
  box(0.7, 0.88, 0.66, std(0xf3f1e8, 0.3), [0, 0.44, 0], front);
  box(0.7, 0.1, 0.02, std(0xdedcd2, 0.4), [0, 0.8, 0.335], front);
  const door = mesh(new THREE.TorusGeometry(0.21, 0.04, 14, 40), std(0xe8e8e8, 0.3, 0.3), [0, 0.42, 0.35], front);
  mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ color: 0x1c2c48, roughness: 0.1, metalness: 0.3 }), [0, 0.42, 0.336], front);
  const wires: THREE.Mesh[] = [];
  const wcols = [0x2040e0, 0xe02020, 0x20b040, 0x3060ff, 0xd02828];
  for (let i = 0; i < 10; i++) {
    const pts = [new THREE.Vector3(0, 0.42, 0.34)]; let p = pts[0].clone();
    for (let k = 0; k < 6; k++) { p = p.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.35, -0.06 - rnd() * 0.05, 0.08 + rnd() * 0.12)); p.y = Math.max(0.02, p.y); pts.push(p); }
    const w = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 6), std(wcols[i % 5], 0.4), [0, 0, 0], front); wires.push(w);
  }
  // pour stream (world space)
  const stream = mesh(new THREE.CylinderGeometry(0.035, 0.05, 1, 12, 1, true), butterM, [0, -5, 0], scene);
  const puddle = mesh(new THREE.CircleGeometry(0.6, 32), oilM, [0, 0.006, 0.9], scene); puddle.rotation.x = -Math.PI / 2;
  // hand props
  const props: Record<string, THREE.Object3D> = {};
  const P = (n: string, build: (g: THREE.Group) => void) => { const g = new THREE.Group(); build(g); props[n] = g; g.visible = false; scene.add(g); };
  P("phone", (g) => box(0.045, 0.1, 0.012, std(0x2346c8, 0.3, 0.2), [0, 0.02, 0.02], g));
  P("phoneP", (g) => box(0.045, 0.1, 0.012, std(0x7a2ad0, 0.3, 0.2), [0, 0.02, 0.02], g));
  P("tub", (g) => { mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.12, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2d838, roughness: 0.4, side: THREE.DoubleSide }), [0, -0.02, 0.09], g); mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 20), butterM, [0, 0.02, 0.09], g); });
  P("spatula", (g) => { const h = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 8), std(0x9a3ae0, 0.4), [0, -0.05, 0.05], g); h.rotation.x = 1.2; box(0.09, 0.008, 0.12, std(0x9a3ae0, 0.4), [0, -0.1, 0.18], g); mesh(new THREE.SphereGeometry(0.05, 10, 8), butterM, [0, -0.09, 0.19], g).scale.y = 0.4; });
  P("soap", (g) => box(0.1, 0.07, 0.15, std(0x9a5ae6, 0.45), [0, -0.03, 0.06], g));
  P("bottle", (g) => { mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 18), new THREE.MeshStandardMaterial({ color: 0xa8b828, roughness: 0.1, transparent: true, opacity: 0.85 }), [0, 0, 0.08], g); mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.08, 12), std(0x6a7a18, 0.2), [0, 0.17, 0.08], g); });
  P("bulb", (g) => { mesh(new THREE.SphereGeometry(0.07, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfff1a0, emissive: 0xffd84a, emissiveIntensity: 1.6, roughness: 0.2 }), [0, 0.06, 0], g); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), std(0xaaaaaa, 0.3, 0.8), [0, -0.02, 0], g); });
  // stuck-on blobs (butter / soap foam) for the guy, built by caller
  return { wash, body, lid: lidPivot, shellMats, butterRim, front, wires, clockH, clockM, stream, streamMats: { butter: butterM, oil: oilM }, puddle, props, mats: { butter: butterM, oil: oilM, foam: foamM }, key };
}
