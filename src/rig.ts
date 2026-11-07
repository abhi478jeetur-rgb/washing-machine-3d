// Stylised 3D caricature characters built from primitives with an FK joint rig.
import * as THREE from "three";

export type Spec = {
  skin: number; hair: "blond" | "emo" | "short" | "bald"; top: "bare" | "tank" | "ff"; bottom: "shorts" | "jeans" | "ff";
  iris: number; scale: number; headR: number; mustache?: boolean; chain?: boolean; lips?: number;
};
export const SPECS: Record<string, Spec> = {
  g: { skin: 0xe8b796, hair: "blond", top: "bare", bottom: "shorts", iris: 0x5a7a4a, scale: 1, headR: 0.135, chain: true },
  gf: { skin: 0xf2c9a8, hair: "emo", top: "tank", bottom: "jeans", iris: 0x5b3a22, scale: 0.94, headR: 0.13, lips: 0xb8404a },
  mu: { skin: 0xd9a07a, hair: "short", top: "ff", bottom: "ff", iris: 0x3b2a1a, scale: 1.04, headR: 0.13, mustache: true },
  ba: { skin: 0xe2a88a, hair: "bald", top: "ff", bottom: "ff", iris: 0x4a3420, scale: 1.02, headR: 0.14 },
};

export type Pose = Partial<Record<"sp" | "nk" | "hd" | "lSh" | "rSh" | "lEl" | "rEl" | "lHp" | "rHp" | "lKn" | "rKn", number[]>>;
const Z: number[] = [0, 0, 0];
export const POSES: Record<string, Pose> = {
  stand: { lSh: [0, 0, 0.15], rSh: [0, 0, -0.15], lEl: [-0.25], rEl: [-0.25] },
  hip: { lSh: [0, 0, 0.5], rSh: [0, 0, -0.15], lEl: [-1.9, 0.6], rEl: [-0.25] },
  crouch: { sp: [0.15, 0, 0], lSh: [-0.5, 0, 0.35], rSh: [-0.5, 0, -0.35], lEl: [-1.3], rEl: [-1.3], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  cross: { sp: [0.1, 0, 0], lSh: [-0.4, 0, 0.5], rSh: [-0.4, 0, -0.5], lEl: [-0.9], rEl: [-0.9], lHp: [-1.5, 0.7, 0], rHp: [-1.5, -0.7, 0], lKn: [2.4], rKn: [2.4] },
  rim: { sp: [0.05, 0, 0], lSh: [-0.2, 0, 0.75], rSh: [-0.2, 0, -0.75], lEl: [-1.2], rEl: [-1.2], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  head: { sp: [0.1, 0, 0], lSh: [-0.6, 0, 2.3], rSh: [-0.6, 0, -2.3], lEl: [-2.3], rEl: [-2.3], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  claws: { sp: [0.05, 0, 0], lSh: [-0.3, 0, 1.6], rSh: [-0.3, 0, -1.6], lEl: [-1.6], rEl: [-1.6], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  chin: { sp: [0.1, 0, 0], nk: [0.1, 0, 0.1], lSh: [-0.5, 0, 0.35], rSh: [-1.1, 0, -0.15], lEl: [-1.3], rEl: [-2.35], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  finger: { sp: [0.05, 0, 0], lSh: [-0.5, 0, 0.35], rSh: [-1.4, 0, -0.5], lEl: [-1.3], rEl: [-1.9], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  armup: { lSh: [-0.5, 0, 0.35], rSh: [0, 0, -2.9], lEl: [-1.3], rEl: [-0.2], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  phone: { sp: [0.05, 0, 0], lSh: [-0.5, 0, 0.35], rSh: [-0.6, 0, -0.9], lEl: [-1.3], rEl: [-2.6], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  phoneSt: { lSh: [-0.6, 0, 0.5], rSh: [-0.6, 0, -0.9], lEl: [-1.3], rEl: [-2.6] },
  climb: { sp: [0.35, 0, 0], lSh: [-0.6, 0, 0.3], rSh: [-1.0, 0, -0.3], lEl: [-0.4], rEl: [-0.5], lHp: [-1.7, 0.3, 0], lKn: [1.9], rHp: [0, 0, 0], rKn: [0.2] },
  point: { lSh: [0, 0, 0.15], rSh: [-1.45, 0, -0.1], lEl: [-0.25], rEl: [-0.05] },
  handhead: { lSh: [-0.4, 0, 2.4], rSh: [0, 0, -0.2], lEl: [-2.2], rEl: [-0.25] },
  laugh: { sp: [0.25, 0, 0], lSh: [-0.6, 0, 0.3], rSh: [-0.6, 0, -0.3], lEl: [-1.6], rEl: [-1.6] },
  think: { lSh: [-0.6, 0, 0.3], rSh: [-1.1, 0, -0.15], lEl: [-1.6], rEl: [-2.35] },
  hold: { lSh: [-0.9, 0, 0.3], rSh: [-1.0, 0, -0.2], lEl: [-1.1], rEl: [-1.2] },
  pour: { sp: [0.2, 0, 0], lSh: [-0.5, 0, 0.3], rSh: [-1.9, 0, -0.2], lEl: [-0.8], rEl: [-0.4] },
  pull: { sp: [-0.25, 0, 0], lSh: [-1.35, 0, 0.1], rSh: [-1.35, 0, -0.1], lEl: [-0.4], rEl: [-0.4], lHp: [-0.3, 0, 0], lKn: [0.5], rHp: [0.3, 0, 0], rKn: [0.1] },
  scrub: { sp: [0.3, 0, 0], lSh: [-1.3, 0, 0.1], rSh: [-1.2, 0, -0.1], lEl: [-0.9], rEl: [-0.8] },
  kneel: { sp: [0.3, 0, 0], lSh: [-1.2, 0, 0.2], rSh: [-1.0, 0, -0.2], lEl: [-0.6], rEl: [-0.9], lHp: [-1.6, 0.2, 0], lKn: [2.5], rHp: [-0.6, -0.1, 0], rKn: [2.4] },
  cheer: { lSh: [0, 0, 2.6], rSh: [0, 0, -2.6], lEl: [-0.5], rEl: [-0.5] },
  peace: { sp: [0.05, 0, 0], lSh: [-0.4, 0, 0.3], rSh: [-0.3, 0, -2.2], lEl: [-1.2], rEl: [-1.4], lHp: [-1.3, 0.9, 0], rHp: [-1.3, -0.9, 0], lKn: [2.4], rKn: [2.4] },
  lying: { sp: [-0.2, 0, 0], lSh: [-0.2, 0, 1.2], rSh: [-0.2, 0, -1.2], lEl: [-0.4], rEl: [-0.4], lHp: [-1.3, 0.3, 0], rHp: [-1.4, -0.3, 0], lKn: [0.3], rKn: [0.5] },
};

export type Face = { mw: number; mh: number; teeth: number; tongue: number; eye: number; brow: number; browY: number; blush: number; look: [number, number]; smile: number };
export const FACES: Record<string, Partial<Face>> = {
  neutral: {},
  grin: { mw: 1.5, mh: 0.55, teeth: 1, smile: 1, brow: 0.2 },
  tongue: { mw: 1.45, mh: 0.9, teeth: 1, tongue: 1, smile: 0.8, brow: 0.25, eye: 1.15 },
  scream: { mw: 1.1, mh: 1.35, teeth: 1, eye: 1.25, brow: -0.35, browY: 0.012 },
  shock: { mw: 0.7, mh: 0.8, eye: 1.3, brow: -0.25, browY: 0.015 },
  smirk: { mw: 1.0, mh: 0.12, smile: 0.6, eye: 0.7, brow: 0.35, look: [0.5, 0] },
  worry: { mw: 0.7, mh: 0.25, smile: -0.5, brow: -0.5, browY: 0.008, look: [-0.4, 0.3] },
  blush: { mw: 0.75, mh: 0.3, smile: -0.4, brow: -0.55, blush: 1, eye: 0.9, look: [0.4, -0.2] },
  blushgrin: { mw: 1.4, mh: 0.5, teeth: 1, smile: 1, brow: -0.3, blush: 1 },
  blushscream: { mw: 1.0, mh: 1.1, teeth: 1, eye: 1.3, brow: -0.5, blush: 1 },
  laugh: { mw: 1.6, mh: 0.9, teeth: 1, tongue: 0.7, smile: 1, eye: 0.35, brow: 0.3 },
  side: { mw: 0.8, mh: 0.12, smile: -0.3, eye: 0.75, brow: -0.3, look: [0.9, 0.2] },
  annoyed: { mw: 0.9, mh: 0.15, smile: -0.6, eye: 0.6, brow: -0.6, look: [-0.7, 0] },
  talk: { mw: 1.0, mh: 0.6, teeth: 1, eye: 1.1, brow: -0.2 },
};
const FDEF: Face = { mw: 0.85, mh: 0.1, teeth: 0, tongue: 0, eye: 1, brow: 0, browY: 0, blush: 0, look: [0, 0], smile: 0.2 };

const std = (c: number, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const cap = (r: number, l: number, mat: THREE.Material) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), mat); m.castShadow = true; return m; };
const sph = (r: number, mat: THREE.Material, s: number[] = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat); m.scale.set(s[0], s[1], s[2]); m.castShadow = true; return m; };

export class Char {
  root = new THREE.Group(); j: Record<string, THREE.Group> = {}; spec: Spec;
  mouth!: THREE.Mesh; grin!: THREE.Mesh; teeth!: THREE.Mesh; tongue!: THREE.Mesh; eyes: THREE.Group[] = []; pupils: THREE.Group[] = []; brows: THREE.Mesh[] = []; blush: THREE.Mesh[] = [];
  skinMat: THREE.MeshStandardMaterial; handR!: THREE.Group; handL!: THREE.Group; headG!: THREE.Group; extra = new THREE.Group();
  constructor(name: string) {
    const s = (this.spec = SPECS[name]);
    const skin = (this.skinMat = std(s.skin, 0.55));
    const orange = std(0xe8741e, 0.75), stripe = std(0xd8d8c8, 0.35, 0.3);
    const topM = s.top === "bare" ? skin : s.top === "tank" ? std(0xc81e24, 0.7) : orange;
    const botM = s.bottom === "shorts" ? std(0x1c1c1e, 0.8) : s.bottom === "jeans" ? std(0x8e98a6, 0.85) : orange;
    const armM = s.top === "ff" ? orange : skin;
    const legLowM = s.bottom === "shorts" ? skin : botM;
    const g = (n: string, p?: THREE.Object3D, pos: number[] = [0, 0, 0]) => { const o = new THREE.Group(); o.position.set(pos[0], pos[1], pos[2]); (p || this.root).add(o); this.j[n] = o; return o; };
    const hips = g("hips");
    const pelvis = sph(0.14, botM, [1.05, 0.7, 0.8]); hips.add(pelvis);
    const sp = g("sp", hips, [0, 0.03, 0]);
    const torso = cap(s.top === "tank" ? 0.12 : 0.135, 0.26, topM); torso.position.y = 0.24; torso.scale.set(1.15, 1, 0.75); sp.add(torso);
    if (s.top === "tank") { const mid = cap(0.105, 0.08, skin); mid.position.y = 0.08; mid.scale.set(1.15, 1, 0.75); sp.add(mid); torso.position.y = 0.3; torso.scale.y = 0.75; }
    if (s.top === "bare") { // pecs + abs hint
      for (const x of [-0.06, 0.06]) { const p = sph(0.07, skin, [1, 0.7, 0.5]); p.position.set(x, 0.36, 0.075); sp.add(p); }
    }
    if (s.top === "ff") for (const y of [0.12, 0.3]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.025, 20, 1, true), stripe); b.scale.set(1.0, 1, 0.68); b.position.y = y; sp.add(b); }
    const shoulderY = 0.42;
    if (s.chain) { const ch = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 30), new THREE.MeshStandardMaterial({ color: 0xf2c232, roughness: 0.3, metalness: 0.35, emissive: 0x3a2800 })); ch.position.set(0, 0.4, 0.06); ch.rotation.x = 0.9; ch.scale.set(1.1, 1.3, 1); sp.add(ch); }
    const nk = g("nk", sp, [0, 0.5, 0]);
    const neck = cap(0.05, 0.06, skin); neck.position.y = 0.0; nk.add(neck);
    const hd = g("hd", nk, [0, 0.05 + s.headR, 0.01]); this.headG = hd;
    this.buildHead(hd, s, skin);
    for (const side of [1, -1]) {
      const L = side > 0 ? "l" : "r";
      const sh = g(L + "Sh", sp, [side * 0.19, shoulderY, 0]);
      const delt = sph(0.065, armM); sh.add(delt);
      const ua = cap(0.05, 0.2, armM); ua.position.y = -0.14; sh.add(ua);
      const el = g(L + "El", sh, [0, -0.29, 0]);
      const fa = cap(0.044, 0.18, armM); fa.position.y = -0.12; el.add(fa);
      if (s.top === "ff") { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14, 1, true), stripe); b.position.y = -0.14; el.add(b); }
      const hand = new THREE.Group(); hand.position.y = -0.27; el.add(hand);
      const palm = sph(0.05, skin, [0.8, 1.15, 0.55]); hand.add(palm);
      const thumb = cap(0.016, 0.04, skin); thumb.position.set(-side * 0.035, 0.0, 0.025); thumb.rotation.z = side * 0.6; hand.add(thumb);
      if (side > 0) this.handL = hand; else this.handR = hand;
      const hp = g(L + "Hp", hips, [side * 0.085, -0.04, 0]);
      const th = cap(0.075, 0.28, s.bottom === "shorts" ? botM : botM); th.position.y = -0.2; hp.add(th);
      const kn = g(L + "Kn", hp, [0, -0.41, 0]);
      const shin = cap(0.058, 0.3, legLowM); shin.position.y = -0.2; kn.add(shin);
      if (s.bottom === "ff") { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.025, 14, 1, true), stripe); b.position.y = -0.22; kn.add(b); }
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.2), s.bottom === "ff" ? std(0x1a1a1a, 0.6) : s.bottom === "jeans" ? std(0xf2f2f2, 0.5) : skin);
      foot.position.set(0, -0.4, 0.05); foot.castShadow = true; kn.add(foot);
    }
    this.root.scale.setScalar(s.scale);
    this.root.add(this.extra);
  }
  buildHead(hd: THREE.Group, s: Spec, skin: THREE.Material) {
    const R = s.headR;
    const skull = sph(R, skin, [0.92, 1.05, 0.98]); hd.add(skull);
    const jaw = sph(R * 0.82, skin, [0.95, 0.85, 0.95]); jaw.position.set(0, -R * 0.42, R * 0.1); hd.add(jaw);
    const nose = sph(R * 0.17, skin, [0.9, 1.1, 1.1]); nose.position.set(0, -R * 0.12, R * 0.98); hd.add(nose);
    for (const x of [-1, 1]) { const ear = sph(R * 0.2, skin, [0.45, 1, 0.75]); ear.position.set(x * R * 0.93, -R * 0.05, 0); hd.add(ear); }
    const white = std(0xffffff, 0.25), dark = std(0x111111, 0.2), iris = std(s.iris, 0.3);
    for (const x of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(x * R * 0.36, R * 0.16, R * 0.74); hd.add(eg); this.eyes.push(eg);
      const ball = sph(R * 0.3, white); eg.add(ball);
      const pg = new THREE.Group(); eg.add(pg); this.pupils.push(pg);
      const ir = new THREE.Mesh(new THREE.CircleGeometry(R * 0.15, 20), iris); ir.position.z = R * 0.298; pg.add(ir);
      const pu = new THREE.Mesh(new THREE.CircleGeometry(R * 0.075, 16), dark); pu.position.z = R * 0.301; pg.add(pu);
      const hl = new THREE.Mesh(new THREE.CircleGeometry(R * 0.03, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(R * 0.05, R * 0.05, R * 0.303); pg.add(hl);
      const lid = sph(R * 0.315, skin, [1, 1, 1]); (lid.geometry as THREE.SphereGeometry).dispose();
      lid.geometry = new THREE.SphereGeometry(R * 0.315, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.32); eg.add(lid);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(R * 0.5, R * 0.08, R * 0.08), std(s.hair === "blond" ? 0x9c7a36 : s.hair === "bald" ? 0x8a6a50 : 0x2a1a10, 0.8));
      brow.position.set(x * R * 0.36, R * 0.5, R * 0.86); hd.add(brow); this.brows.push(brow);
      const bl = new THREE.Mesh(new THREE.CircleGeometry(R * 0.22, 20), new THREE.MeshBasicMaterial({ color: 0xff3a4a, transparent: true, opacity: 0 }));
      bl.position.set(x * R * 0.55, -R * 0.22, R * 0.86); bl.rotation.y = x * 0.55; hd.add(bl); this.blush.push(bl);
    }
    const mg = new THREE.Group(); mg.position.set(0, -R * 0.48, R * 0.93); mg.rotation.x = -0.15; hd.add(mg);
    const mm = new THREE.MeshBasicMaterial({ color: 0x3a0a10, polygonOffset: true, polygonOffsetFactor: -2 });
    this.mouth = new THREE.Mesh(new THREE.CircleGeometry(R * 0.22, 28), mm); mg.add(this.mouth);
    this.grin = new THREE.Mesh(new THREE.CircleGeometry(R * 0.22, 28, Math.PI, Math.PI), mm); mg.add(this.grin);
    if (s.lips) { const lip = new THREE.Mesh(new THREE.TorusGeometry(R * 0.22, R * 0.03, 8, 24), std(s.lips, 0.4)); this.mouth.add(lip); }
    this.teeth = new THREE.Mesh(new THREE.PlaneGeometry(R * 0.38, R * 0.08), new THREE.MeshBasicMaterial({ color: 0xf6f0e2, polygonOffset: true, polygonOffsetFactor: -4 })); mg.add(this.teeth);
    this.tongue = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.1, R * 0.3, 4, 12), std(0xe0607a, 0.35)); this.tongue.scale.z = 0.4; mg.add(this.tongue);
    // hair
    if (s.hair === "blond") {
      const hm = std(0xd9b35a, 0.7);
      const capH = sph(R * 1.03, hm, [0.95, 0.72, 1.0]); capH.position.set(0, R * 0.38, -R * 0.08); hd.add(capH);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const tuft = new THREE.Mesh(new THREE.ConeGeometry(R * 0.22, R * 0.45, 8), hm); tuft.position.set(Math.cos(a) * R * 0.45, R * 0.85, Math.sin(a) * R * 0.4 + R * 0.05); tuft.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); tuft.castShadow = true; hd.add(tuft); }
    } else if (s.hair === "emo") {
      const hm = std(0x141014, 0.5), pk = std(0xe0287a, 0.5);
      const capH = sph(R * 1.08, hm, [1.0, 0.85, 1.02]); capH.position.set(0, R * 0.28, -R * 0.08); hd.add(capH);
      for (const x of [-1, 1]) { const side = sph(R * 0.55, hm, [0.55, 1.2, 0.9]); side.position.set(x * R * 0.85, -R * 0.15, -R * 0.05); hd.add(side); }
      const fr = sph(R * 0.6, hm, [1.3, 0.45, 0.5]); fr.position.set(R * 0.25, R * 0.72, R * 0.62); fr.rotation.z = -0.3; hd.add(fr);
      for (const [x, y, z] of [[-0.5, 0.75, 0.55], [0.55, 0.5, 0.7], [-0.9, 0.0, 0.3], [0.0, 0.95, 0.2]]) { const st = sph(R * 0.28, pk, [0.6, 1.3, 0.5]); st.position.set(x * R, y * R, z * R); hd.add(st); }
    } else if (s.hair === "short") {
      const hm = std(0x2e1d12, 0.8);
      const capH = sph(R * 1.02, hm, [0.95, 0.62, 1.0]); capH.position.set(0, R * 0.42, -R * 0.1); hd.add(capH);
    }
    if (s.mustache) { const m = cap(R * 0.12, R * 0.45, std(0x2a180c, 0.85)); m.rotation.z = Math.PI / 2; m.position.set(0, -R * 0.33, R * 0.93); m.scale.set(1, 1, 0.6); hd.add(m); }
  }
  setPose(a: Pose, b?: Pose, k = 0) {
    for (const n of ["sp", "nk", "hd", "lSh", "rSh", "lEl", "rEl", "lHp", "rHp", "lKn", "rKn"] as const) {
      const pa = a[n] || Z, pb = b ? b[n] || Z : pa;
      const v = [0, 1, 2].map((i) => (pa[i] || 0) * (1 - k) + (pb[i] || 0) * k);
      this.j[n].rotation.set(v[0], v[1], v[2]);
    }
  }
  setFace(name: string, t: number, talk = 0) {
    const f: Face = { ...FDEF, ...(FACES[name] || {}) };
    const R = this.spec.headR;
    const blink = (t * 1.0 + this.spec.headR * 37) % 3.7 < 0.12 ? 0.1 : 1;
    const open = Math.max(0.08, f.mh + talk * 0.5);
    const isGrin = f.smile > 0.5;
    this.mouth.visible = !isGrin; this.grin.visible = isGrin;
    const m = isGrin ? this.grin : this.mouth;
    m.scale.set(f.mw, isGrin ? open * 1.4 + 0.15 : open, 1);
    m.position.y = isGrin ? R * 0.05 : -f.smile * R * 0.03;
    this.teeth.visible = f.teeth > 0 && open > 0.25; this.teeth.scale.set(f.mw * 0.95, 1, 1);
    this.teeth.position.set(0, isGrin ? R * 0.01 : R * 0.22 * open * 0.75, 0.002);
    this.tongue.visible = f.tongue > 0;
    this.tongue.position.set(0, -R * (0.15 + 0.32 * f.tongue), R * 0.03); this.tongue.scale.y = 0.6 + f.tongue * 0.9;
    const ex = Math.max(1, f.eye);
    this.eyes.forEach((e) => e.scale.set(ex, f.eye * blink, ex));
    this.pupils.forEach((p) => p.rotation.set(-f.look[1] * 0.35, f.look[0] * 0.4, 0));
    this.brows.forEach((b, i) => { const x = i === 0 ? -1 : 1; b.rotation.z = x * f.brow * 0.6; b.position.y = R * 0.5 + f.browY + (f.eye - 1) * R * 0.25; });
    this.blush.forEach((b) => ((b.material as THREE.MeshBasicMaterial).opacity = f.blush * 0.55));
  }
}
