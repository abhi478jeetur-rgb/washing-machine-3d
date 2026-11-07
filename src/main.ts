// "Man stuck in washing machine" — real-time three.js recreation, runs on the viewer's GPU.
// Live playback synced to AudioContext.currentTime, plus deterministic offline render -> MP4 (WebCodecs + mp4-muxer).
import * as THREE from "three";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { Char, POSES } from "./rig";
import { buildWorld } from "./set";
import { SHOTS, St, CS, Num } from "./shots";
import WORDS from "./words.json";

const FPS = 30, W = 720, H = 1280, DUR = 67.3, TOTAL = Math.round(DUR * FPS);

// ---------- timeline state (sticky shot list) ----------
const carry = (v: any): any => (Array.isArray(v) ? v[1] : v);
const RES: St[] = [];
{
  let prev: any = {};
  for (const [, , st] of SHOTS) {
    const cur: any = {};
    for (const k of Object.keys(prev)) cur[k] = typeof prev[k] === "object" && prev[k] && !Array.isArray(prev[k]) ? Object.fromEntries(Object.entries(prev[k]).map(([a, b]) => [a, carry(b)])) : carry(prev[k]);
    for (const [k, v] of Object.entries(st || {})) cur[k] = typeof v === "object" && v && !Array.isArray(v) ? { ...(cur[k] || {}), ...v } : v;
    RES.push(cur); prev = cur;
  }
}
const ease = (k: number) => k * k * (3 - 2 * k);
const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1][0] <= t) i++; const t0 = SHOTS[i][0], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR; return { i, k: Math.min(1, Math.max(0, (t - t0) / (t1 - t0))), t0 }; };
const val = (v: Num | undefined, k: number, d = 0) => (v === undefined ? d : Array.isArray(v) ? v[0] + (v[1] - v[0]) * ease(k) : v);
const WD = (WORDS as { w: string; s: number; e: number }[]).map((w, i, a) => (i > 0 && w.s <= a[i - 1].s ? { ...w, s: a[i - 1].s + 0.25 } : w));
const wordAt = (t: number) => { let cur = ""; for (const w of WD) if (w.s <= t + 0.03) cur = w.w; return t > WD[WD.length - 1].e + 0.6 ? "" : cur; };

// ---------- three.js scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(40, W / H, 0.02, 30);
const world = buildWorld(scene);
const chars: Record<string, Char> = {};
for (const n of ["g", "gf", "mu", "ba"]) { chars[n] = new Char(n); scene.add(chars[n].root); }
const mkBlobs = (mat: THREE.Material, pts: number[][]) => { const grp = new THREE.Group(); for (const [x, y, z, r] of pts) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat); m.position.set(x, y, z); m.scale.set(1.2, 0.7, 0.6); grp.add(m); } chars.g.j.sp.add(grp); return grp; };
const gBut = mkBlobs(world.mats.butter, [[-0.15, 0.44, 0.06, 0.07], [0.16, 0.45, 0.05, 0.07], [0, 0.3, 0.1, 0.08], [-0.08, 0.18, 0.1, 0.06], [0.1, 0.22, 0.1, 0.06], [0.22, 0.4, 0, 0.06], [-0.22, 0.38, 0, 0.06]]);
const gFoam = mkBlobs(world.mats.foam, [[-0.12, 0.4, 0.09, 0.05], [0.12, 0.34, 0.1, 0.05], [0.02, 0.24, 0.11, 0.045], [-0.2, 0.3, 0.05, 0.04], [0.18, 0.2, 0.08, 0.04], [0.06, 0.45, 0.07, 0.04]]);
const baseSkin = chars.g.skinMat.color.clone();
const v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);

function updateScene(t: number) {
  const { i, k, t0 } = shotAt(t); const st = RES[i]; const shot = SHOTS[i]; const lt = t - t0;
  world.lid.rotation.x = val(st.ld, k, -1.75);
  const tip = val(st.tip, k);
  world.wash.rotation.x = (Math.PI / 2) * (SHOTS[i][0] === 52.2 ? ease(Math.min(1, Math.max(0, (lt - 0.2) / 0.9))) : tip);
  world.shellMats.forEach((m) => { if (m.transparent !== !!st.xr) m.needsUpdate = true; m.transparent = !!st.xr; m.opacity = st.xr ? 0.22 : 1; m.depthWrite = !st.xr; });
  const bu = val(st.bu, k); world.butterRim.visible = bu > 0.01;
  world.butterRim.children.forEach((c, n) => (c.visible = n / world.butterRim.children.length < bu));
  world.wires.forEach((m, n) => (m.visible = n / world.wires.length < val(st.wi, k)));
  const clkSpin = st.clk ? (t - 59.6) * 6 : 0;
  world.clockM.rotation.z = -(t * 0.02 + clkSpin * 12); world.clockH.rotation.z = -(1.2 + clkSpin);
  for (const n of ["g", "gf", "mu", "ba"]) {
    const c = chars[n], cs: CS = (st as any)[n] || {};
    c.root.visible = !cs.h;
    const parent = n === "g" && cs.inW ? world.body : scene;
    if (c.root.parent !== parent) parent.add(c.root);
    const yDef = cs.inW ? 0.45 : 0.87 * c.spec.scale;
    c.root.position.set(val(cs.x, k), val(cs.y, k, yDef), val(cs.z, k));
    c.root.rotation.set(0, val(cs.ry, k), cs.rock ? Math.sin(t * 9) * 0.22 : 0);
    const [pa, pb] = (cs.p || "stand").split(">");
    c.setPose(POSES[pa] || POSES.stand, pb ? POSES[pb] : undefined, ease(k));
    c.j.sp.rotation.x += Math.sin(t * 2.2 + n.length) * 0.02 + (cs.e === "laugh" ? Math.abs(Math.sin(t * 12)) * 0.08 : 0);
    if (n === "g" && cs.inW) c.j.hd.rotation.x -= 1.45 * Math.min(1, world.wash.rotation.x / (Math.PI / 2));
    c.j.hd.rotation.x += cs.hx || 0;
    c.j.hd.rotation.z = Math.sin(t * 1.3 + n.length * 2) * 0.05 + (cs.rock ? -Math.sin(t * 9) * 0.15 : 0);
    if (cs.p === "scrub" || cs.p === "pull") { c.j.rSh.rotation.x += Math.sin(t * 14) * 0.18; c.j.lSh.rotation.x += Math.cos(t * 14) * 0.18; }
    if (cs.p === "kneel") c.j.rEl.rotation.x += Math.sin(t * 10) * 0.4;
    if (cs.p === "cheer") { c.j.lSh.rotation.z += Math.sin(t * 8) * 0.2; c.j.rSh.rotation.z -= Math.sin(t * 8) * 0.2; }
    const talk = cs.e === "talk" ? Math.abs(Math.sin(t * 13)) * 0.7 : cs.e === "scream" || cs.e === "laugh" ? Math.abs(Math.sin(t * 17)) * 0.15 : 0;
    c.setFace(cs.e || "neutral", t, talk);
    if (n === "g") world.wash.rotation.z = cs.rock ? Math.sin(t * 9) * 0.03 : 0;
  }
  for (const p of Object.values(world.props)) p.visible = false;
  for (const n of ["g", "gf", "mu", "ba"]) {
    const cs: CS = (st as any)[n] || {};
    if (cs.prop && !cs.h) { const p = world.props[cs.prop]; if (p.parent !== chars[n].handR) chars[n].handR.add(p); p.visible = true; }
  }
  const bulb = world.props.bulb;
  if (st.bulb) { if (bulb.parent !== chars.ba.headG) chars.ba.headG.add(bulb); bulb.position.set(0, 0.36, 0); bulb.visible = true; bulb.scale.setScalar(Math.max(0.01, Math.min(1, lt / 0.12)) * (1 + Math.sin(lt * 20) * 0.06)); }
  gBut.visible = val(st.gb, k) > 0.01; gBut.scale.setScalar(Math.max(0.01, val(st.gb, k)));
  gFoam.visible = val(st.so, k) > 0.01; gFoam.scale.setScalar(Math.max(0.01, val(st.so, k)));
  const oi = val(st.oi, k);
  chars.g.skinMat.color.copy(baseSkin).lerp(new THREE.Color(0xe0a040), oi * 0.45); chars.g.skinMat.roughness = 0.55 - oi * 0.42;
  world.puddle.visible = oi > 0.01; world.puddle.scale.setScalar(Math.max(0.01, oi)); world.puddle.position.set(0, 0.006, tip > 0.5 ? 1.6 : 0.75);
  scene.updateMatrixWorld(true);
  if (st.pour) {
    const src = world.props[st.pour === "gf" ? "tub" : "bottle"]; src.getWorldPosition(v3); v3.y += 0.08;
    chars.g.headG.getWorldPosition(v4); v4.y += 0.12;
    const d = v4.clone().sub(v3), L = d.length();
    world.stream.position.copy(v3).addScaledVector(d, 0.5); world.stream.scale.set(1, L, 1);
    world.stream.quaternion.setFromUnitVectors(UP, d.normalize());
    world.stream.material = world.streamMats[st.pour === "gf" ? "butter" : "oil"]; world.stream.visible = true;
  } else world.stream.visible = false;
  const c = shot[1];
  let pos: THREE.Vector3, look: THREE.Vector3, fov: number, push: number;
  if (c[0] === "F") {
    const ch = chars[c[1] as string]; const [dist, dy, yaw] = [c[2], c[3], c[4]] as number[];
    ch.headG.getWorldPosition(v3); ch.root.getWorldQuaternion(q);
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(q); dir.y = 0; dir.normalize().applyAxisAngle(UP, yaw);
    look = v3.clone().add(new THREE.Vector3(0, dy, 0)); pos = v3.clone().addScaledVector(dir, dist * 1.4).add(new THREE.Vector3(0, 0.03, 0));
    fov = c[5] as number; push = (c[6] as number) || 0;
  } else { const n = c as number[]; pos = new THREE.Vector3(n[0], n[1], n[2]); look = new THREE.Vector3(n[3], n[4], n[5]); fov = n[6]; push = n[7] || 0; }
  pos.lerp(look, push * ease(k));
  if (st.shake) { pos.x += Math.sin(t * 61) * 0.012; pos.y += Math.cos(t * 47) * 0.012; }
  pos.lerp(look, -0.04 * Math.max(0, 1 - lt / 0.18));
  cam.position.copy(pos); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(look);
  return st;
}

// ---------- 2D overlays drawn into the output canvas (so they are in the download) ----------
const out = document.getElementById("out") as HTMLCanvasElement;
out.width = W; out.height = H;
const g2 = out.getContext("2d")!;
const vign = (() => { const gr = g2.createRadialGradient(W / 2, H * 0.45, W * 0.45, W / 2, H * 0.45, H * 0.62); gr.addColorStop(0, "rgba(30,18,0,0)"); gr.addColorStop(1, "rgba(30,18,0,0.42)"); return gr; })();
const circ = (x: number, y: number, r: number, fill: string, stroke = "#222", lw = 5) => { g2.beginPath(); g2.arc(x, y, r, 0, 7); g2.fillStyle = fill; g2.fill(); g2.lineWidth = lw; g2.strokeStyle = stroke; g2.stroke(); };
function drawBubble(kind: number) {
  g2.save(); g2.shadowColor = "rgba(0,0,0,.35)"; g2.shadowBlur = 14;
  g2.beginPath(); g2.ellipse(360, 205, 110, 85, 0, 0, 7); g2.fillStyle = "white"; g2.fill(); g2.restore();
  g2.lineWidth = 6; g2.strokeStyle = "#222"; g2.beginPath(); g2.ellipse(360, 205, 110, 85, 0, 0, 7); g2.stroke();
  circ(347, 312, 17, "white"); circ(300, 345, 10, "white");
  if (kind === 1) { circ(360, 172, 24, "#c98a62", "#3a2416", 6); g2.fillStyle = "#2f7fd0"; g2.beginPath(); g2.roundRect(325, 200, 70, 66, [30, 30, 8, 8]); g2.fill(); }
  else { g2.fillStyle = "#efe7d8"; g2.fillRect(325, 145, 70, 118); g2.lineWidth = 5; g2.strokeStyle = "#8a7a66"; g2.strokeRect(325, 145, 70, 118); circ(383, 206, 5, "#b08a3a", "#b08a3a", 1); }
}
function drawSearch(mode: number, t: number) {
  const txt = "man stuck in washing machine"; const n = mode === 2 ? txt.length : Math.max(0, Math.min(txt.length, Math.floor((t - 65.0) * 40)));
  const big = mode === 2, x = big ? 20 : 36, y = big ? 120 : 60, w = big ? 680 : 420, h = big ? 70 : 58;
  g2.save(); if (!big) { g2.translate(x + w / 2, y + h / 2); g2.rotate(-3 * Math.PI / 180); g2.translate(-(x + w / 2), -(y + h / 2)); }
  g2.shadowColor = "rgba(0,0,0,.35)"; g2.shadowBlur = 14; g2.fillStyle = "white"; g2.beginPath(); g2.roundRect(x, y, w, h, big ? 6 : 10); g2.fill(); g2.shadowBlur = 0;
  g2.lineWidth = big ? 5 : 2; g2.strokeStyle = big ? "#1a4fe0" : "#ccc"; g2.stroke();
  g2.strokeStyle = "#555"; g2.lineWidth = 3.5; g2.beginPath(); g2.arc(x + 28, y + h / 2 - 3, 10, 0, 7); g2.moveTo(x + 35, y + h / 2 + 4); g2.lineTo(x + 44, y + h / 2 + 13); g2.stroke();
  g2.fillStyle = "#222"; g2.font = `${big ? 30 : 24}px Arial, sans-serif`; g2.textBaseline = "middle"; g2.fillText(txt.slice(0, n), x + 60, y + h / 2 + 1); g2.restore();
}
function drawFrame(t: number) {
  const st = updateScene(t);
  renderer.render(scene, cam);
  g2.globalCompositeOperation = "source-over"; g2.drawImage(renderer.domElement, 0, 0, W, H);
  g2.fillStyle = vign; g2.fillRect(0, 0, W, H);
  if (st.bub) drawBubble(st.bub);
  if (st.sb) drawSearch(st.sb, t);
  if (st.blk) { g2.fillStyle = "#000"; g2.fillRect(0, 0, W, H); }
  const word = wordAt(t);
  if (word) {
    g2.font = "800 52px Mont, Arial Black, sans-serif"; g2.textAlign = "center"; g2.textBaseline = "top"; g2.lineJoin = "round";
    g2.lineWidth = 10; g2.strokeStyle = "black"; g2.strokeText(word, W / 2, 712); g2.fillStyle = "white"; g2.fillText(word, W / 2, 712); g2.textAlign = "left";
  }
}

// ---------- UI ----------
const $ = (id: string) => document.getElementById(id) as HTMLElement;
const status = (s: string) => ($("status").textContent = s);
let audioBuf: AudioBuffer | null = null, actx: AudioContext | null = null, playing = false, src: AudioBufferSourceNode | null = null;
const audioBytes = fetch("audio.m4a").then((r) => r.arrayBuffer());
async function getAudio() { if (!audioBuf) { const oc = new OfflineAudioContext(2, 48000, 48000); audioBuf = await oc.decodeAudioData((await audioBytes).slice(0)); } return audioBuf; }

async function startLive(onEnd?: () => void, dest?: MediaStreamAudioDestinationNode) {
  if (playing) return; playing = true;
  actx = actx || new AudioContext({ sampleRate: 48000 }); await actx.resume();
  const buf = await getAudio();
  src = actx.createBufferSource(); src.buffer = buf; src.connect(actx.destination); if (dest) src.connect(dest);
  const t0 = actx.currentTime + 0.15; src.start(t0);
  ($("start") as HTMLButtonElement).textContent = "■ Stop";
  const loop = () => {
    if (!playing) return;
    const t = actx!.currentTime - t0;
    if (t >= DUR) { stopLive(); onEnd?.(); return; }
    drawFrame(Math.max(0, t)); (window as any).__liveT = t; requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function stopLive() { playing = false; try { src?.stop(); } catch {} ($("start") as HTMLButtonElement).textContent = "▶ Start Animation"; }
$("start").onclick = () => (playing ? stopLive() : startLive());

async function pickVideo() {
  const cands: [string, "avc" | "vp9"][] = [["avc1.640028", "avc"], ["avc1.4d0028", "avc"], ["avc1.42001f", "avc"], ["vp09.00.31.08", "vp9"]];
  for (const [codec, mux] of cands) {
    const cfg: VideoEncoderConfig = { codec, width: W, height: H, bitrate: 8_000_000, framerate: FPS };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return { cfg, mux }; } catch {}
  }
  return null;
}
async function pickAudio(sr: number, ch: number) {
  const cands: [string, "aac" | "opus"][] = [["mp4a.40.2", "aac"], ["opus", "opus"]];
  for (const [codec, mux] of cands) {
    const cfg: AudioEncoderConfig = { codec, sampleRate: sr, numberOfChannels: ch, bitrate: 160_000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { cfg, mux }; } catch {}
  }
  return null;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function renderDownload() {
  stopLive();
  const btn = $("render") as HTMLButtonElement; btn.disabled = true; $("dl").style.display = "none";
  const limit = Number(new URLSearchParams(location.search).get("frames")) || TOTAL;
  const frames = Math.min(TOTAL, limit);
  if (!("VideoEncoder" in window)) return recordFallback();
  const v = await pickVideo(); if (!v) return recordFallback();
  const buf = await getAudio();
  const a = "AudioEncoder" in window ? await pickAudio(buf.sampleRate, buf.numberOfChannels) : null;
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, fastStart: "in-memory", firstTimestampBehavior: "offset",
    video: { codec: v.mux, width: W, height: H, frameRate: FPS },
    ...(a ? { audio: { codec: a.mux, sampleRate: buf.sampleRate, numberOfChannels: buf.numberOfChannels } } : {}) });
  let err: any = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => (err = e) });
  venc.configure(v.cfg);
  // audio first (fast): planar f32 chunks of 1024 samples
  if (a) {
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => (err = e) });
    aenc.configure(a.cfg);
    const len = Math.min(buf.length, Math.round((frames / FPS) * buf.sampleRate)), ch = buf.numberOfChannels, N = 1024;
    const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
    for (let s = 0; s < len; s += N) {
      const n = Math.min(N, len - s), data = new Float32Array(n * ch);
      for (let c = 0; c < ch; c++) data.set(chans[c].subarray(s, s + n), c * n);
      const ad = new AudioData({ format: "f32-planar", sampleRate: buf.sampleRate, numberOfFrames: n, numberOfChannels: ch, timestamp: Math.round((s / buf.sampleRate) * 1e6), data });
      aenc.encode(ad); ad.close();
      if (aenc.encodeQueueSize > 50) await sleep(1);
    }
    await aenc.flush(); aenc.close();
  }
  const t0 = performance.now();
  for (let f = 0; f < frames; f++) {
    if (err) break;
    drawFrame(f / FPS);
    const vf = new VideoFrame(out, { timestamp: Math.round((f * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    venc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
    while (venc.encodeQueueSize > 4) await sleep(2);
    if (f % 5 === 0) { const p = (f + 1) / frames; ($("bar") as HTMLElement).style.width = `${(p * 100).toFixed(1)}%`; const el = (performance.now() - t0) / 1000; status(`Rendering frame ${f + 1}/${frames} · ${(el / (f + 1) * (frames - f - 1)).toFixed(0)} s left`); await sleep(0); }
  }
  await venc.flush(); venc.close();
  if (err) { status("Encoder error: " + err); btn.disabled = false; return; }
  muxer.finalize();
  const blob = new Blob([target.buffer], { type: "video/mp4" });
  finishDownload(blob, "washing_machine_3d.mp4", `${v.cfg.codec} + ${a ? a.cfg.codec : "no audio"}`);
}
function finishDownload(blob: Blob, name: string, info: string) {
  const url = URL.createObjectURL(blob); const dl = $("dl") as HTMLAnchorElement;
  dl.href = url; dl.download = name; dl.style.display = "inline-block"; dl.textContent = `⬇ Download ${name} (${(blob.size / 1e6).toFixed(1)} MB)`;
  ($("bar") as HTMLElement).style.width = "100%"; status(`Done · ${info}`); ($("render") as HTMLButtonElement).disabled = false;
  (window as any).__result = { size: blob.size, type: blob.type, info, url };
}
async function recordFallback() {
  status("WebCodecs not available — recording live playback instead (MediaRecorder)…");
  actx = actx || new AudioContext({ sampleRate: 48000 });
  const dest = actx.createMediaStreamDestination();
  const stream = new MediaStream([...out.captureStream(FPS).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mime = ["video/mp4;codecs=avc1,mp4a", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
  const parts: Blob[] = []; rec.ondataavailable = (e) => parts.push(e.data);
  rec.onstop = () => { const type = rec.mimeType || "video/webm"; finishDownload(new Blob(parts, { type }), type.includes("mp4") ? "washing_machine_3d.mp4" : "washing_machine_3d.webm", "MediaRecorder " + type); };
  rec.start(1000);
  const tick = setInterval(() => { const t = (window as any).__liveT || 0; ($("bar") as HTMLElement).style.width = `${Math.min(100, (t / DUR) * 100)}%`; }, 250);
  await startLive(() => { clearInterval(tick); rec.stop(); }, dest);
}
$("render").onclick = () => renderDownload().catch((e) => { status("Error: " + e); ($("render") as HTMLButtonElement).disabled = false; });

// first frame preview once the font is in
new FontFace("Mont", "url(mont.ttf)", { weight: "100 900" }).load().then((f) => { (document as any).fonts.add(f); drawFrame(0.6); status("Ready · press Start (live, with sound) or Render & Download"); }).catch(() => { drawFrame(0.6); status("Ready"); });
(window as any).__drawFrame = drawFrame; (window as any).__ready = true;
