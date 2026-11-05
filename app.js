import { Engine, GENRES, nearest } from './music.js';

const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Where each classifier emotion sits on Russell's valence–arousal circumplex.
const EMO = {
  anger:     { v: -0.68, a: 0.62,  c: '#c97f78', label: 'Anger' },
  fear:      { v: -0.42, a: 0.84,  c: '#a98bd0', label: 'Fear' },
  happiness: { v: 0.78,  a: 0.5,   c: '#e3b765', label: 'Happiness' },
  neutral:   { v: 0.1,   a: -0.15, c: '#a49bb0', label: 'Neutral' },
  sadness:   { v: -0.66, a: -0.55, c: '#6c7cc4', label: 'Sadness' },
};
// Mood words from the circumplex in the original write-up (Ferreira et al.).
const MOODS = [
  ['Excited', .32, .86], ['Happy', .72, .58], ['Delighted', .92, .18], ['Content', .88, -.22], ['Relaxed', .6, -.62],
  ['Sleepy', .2, -.9], ['Depressed', -.32, -.86], ['Bored', -.66, -.6], ['Sad', -.92, -.18], ['Angry', -.88, .24],
  ['Nervous', -.62, .6], ['Tense', -.3, .86],
];

const $ = id => document.getElementById(id);
const engine = new Engine();
let model = null;

// ---------- state ----------
const pt = { v: GENRES.at(-1).v, a: GENRES.at(-1).a };        // drawn point
const target = { ...pt };
let dragging = false, manualUntil = 0, hold = false;
let camOn = false, landmarker = null, stream = null, lastVideoTime = -1, lastFaceAt = 0;
let probs = null, baseline = null, calib = null;
const trail = [];

// ---------- plane drawing ----------
const canvas = $('planeCanvas'), ctx = canvas.getContext('2d');
let W = 0, H = 0, dpr = 1, bgImg = null;
const toX = v => (v + 1) / 2 * W, toY = a => (1 - a) / 2 * H;
const fromXY = (x, y) => ({ v: clamp(x / W * 2 - 1, -1, 1), a: clamp(1 - y / H * 2, -1, 1) });
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

function buildBackground() {
  const N = 180, off = document.createElement('canvas'); off.width = off.height = N;
  const o = off.getContext('2d'), img = o.createImageData(N, N);
  // corners: top-left tense, top-right excited, bottom-right relaxed, bottom-left sad
  const TL = [176, 66, 70], TR = [232, 178, 96], BR = [96, 160, 138], BL = [64, 80, 156], BG = [21, 17, 27];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / (N - 1), w = y / (N - 1), i = (y * N + x) * 4;
    const su = u * u * (3 - 2 * u), sw = w * w * (3 - 2 * w);
    const r = Math.hypot(u - .5, w - .5) * 2;                 // 0 centre → ~1.41 corner
    const glow = Math.max(0, 1 - r) ** 2 * .22;               // soft light in the middle
    const fade = clamp(1.25 - r * .62, .35, 1);               // corners sink into the room
    for (let c = 0; c < 3; c++) {
      const top = TL[c] * (1 - su) + TR[c] * su, bot = BL[c] * (1 - su) + BR[c] * su;
      let col = top * (1 - sw) + bot * sw;
      col = col * .78 + 255 * glow;
      img.data[i + c] = BG[c] + (col - BG[c]) * fade;
    }
    img.data[i + 3] = 255;
  }
  o.putImageData(img, 0, 0);
  bgImg = off;
}

function resize() {
  const r = canvas.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
  W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
}

function draw(level) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  roundRect(0, 0, W, H, 28); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bgImg, 0, 0, W, H);

  // axes + circumplex ring
  ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2, 14); ctx.lineTo(W / 2, H - 14); ctx.moveTo(14, H / 2); ctx.lineTo(W - 14, H / 2); ctx.stroke();
  ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.arc(W / 2, H / 2, W * .46, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);

  // genres (labels collected so mood words can steer around them)
  const nn = nearest(pt.v, pt.a, 3), rank = new Map(nn.map((n, i) => [n.g.id, i]));
  const gfs = Math.max(10, W / 52), boxes = [];
  ctx.font = `500 ${gfs}px Manrope, system-ui, sans-serif`; ctx.textBaseline = 'middle';
  for (const g of GENRES) {
    const x = toX(g.v), y = toY(g.a), r = rank.has(g.id) ? rank.get(g.id) : 9;
    const rad = r === 0 ? 6 : r < 3 ? 4.5 : 3.5, left = g.v > .42;
    if (r === 0) { ctx.beginPath(); ctx.arc(x, y, 13 + level * 30, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = r === 0 ? '#fff' : r < 3 ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.45)'; ctx.fill();
    ctx.fillStyle = r === 0 ? '#fff' : r < 3 ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.5)';
    ctx.textAlign = left ? 'right' : 'left';
    const tw = ctx.measureText(g.name).width, tx = x + (left ? -11 : 11);
    ctx.fillText(g.name, tx, y);
    boxes.push([left ? tx - tw - 8 : x - 8, y - gfs, left ? x + 8 : tx + tw + 8, y + gfs]);
  }

  // mood words: try a few radii along each word's angle, skip if every spot collides with a genre label
  const fs = Math.max(12, W / 38);
  ctx.font = `italic ${fs}px "Cormorant Garamond", Georgia, serif`; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,248,240,.32)';
  for (const [w, v, a] of MOODS) {
    const ang = Math.atan2(a, v), half = ctx.measureText(w).width / 2;
    for (const rr of [.95, 1.02, .86, .78]) {
      const x = toX(Math.cos(ang) * rr), y = toY(Math.sin(ang) * rr);
      if (x - half < 10 || x + half > W - 10 || y < 14 || y > H - 14) continue;
      if (boxes.some(b => x + half > b[0] && x - half < b[2] && y + fs * .5 > b[1] && y - fs * .5 < b[3])) continue;
      ctx.fillText(w, x, y); break;
    }
  }

  // trail
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i], k = i / trail.length;
    ctx.beginPath(); ctx.arc(toX(t.v), toY(t.a), 2 + k * 4, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,244,225,${k * .18})`; ctx.fill();
  }
  // puck
  const px = toX(pt.v), py = toY(pt.a), R = 13 + level * 22;
  const glow = ctx.createRadialGradient(px, py, 0, px, py, R * 3.2);
  glow.addColorStop(0, 'rgba(255,240,210,.55)'); glow.addColorStop(1, 'rgba(255,240,210,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, R * 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,250,240,.92)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(21,17,27,.5)'; ctx.stroke();
  ctx.restore();
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

// ---------- pointer ----------
canvas.addEventListener('pointerdown', e => { dragging = true; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId); movePointer(e); });
canvas.addEventListener('pointermove', e => { if (dragging) movePointer(e); });
const endDrag = () => { if (!dragging) return; dragging = false; canvas.classList.remove('dragging'); manualUntil = performance.now() + 3000; updateHint(); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
function movePointer(e) { const r = canvas.getBoundingClientRect(); Object.assign(target, fromXY(e.clientX - r.left, e.clientY - r.top)); updateHint(); }
canvas.addEventListener('keydown', e => {
  const s = .06, k = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[e.key];
  if (!k) return; e.preventDefault(); target.v = clamp(target.v + k[0], -1, 1); target.a = clamp(target.a + k[1], -1, 1); manualUntil = performance.now() + 3000;
});
canvas.tabIndex = 0; canvas.setAttribute('aria-label', 'Emotion map. Drag or use arrow keys to move the point.');

// ---------- transport ----------
const playBtn = $('playBtn');
async function togglePlay() {
  if (engine.playing) { await engine.pause(); } else { engine.setPoint(pt.v, pt.a); await engine.play(); }
  $('iconPlay').toggleAttribute('hidden', engine.playing); $('iconPause').toggleAttribute('hidden', !engine.playing);
  playBtn.setAttribute('aria-label', engine.playing ? 'Pause' : 'Play');
}
playBtn.addEventListener('click', togglePlay);
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !['INPUT', 'BUTTON', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); togglePlay(); }
});
const vol = $('volume');
const setVol = () => { engine.setVolume(+vol.value); vol.style.setProperty('--fill', `${vol.value * 100}%`); };
vol.addEventListener('input', setVol); setVol();

// ---------- now playing ----------
let shownGenre = null;
function updateNow() {
  const g = nearest(pt.v, pt.a, 1)[0].g;
  if (g !== shownGenre) {
    shownGenre = g; const h = $('genreName'); h.classList.add('swap');
    setTimeout(() => { h.textContent = g.name; h.classList.remove('swap'); }, 180);
  }
  const bpm = engine.playing ? engine.params.bpm : blendBpm();
  $('bpm').textContent = Math.round(bpm);
  const mag = Math.hypot(pt.v, pt.a);
  let mood = 'Neutral';
  if (mag > .2) mood = MOODS.map(([w, v, a]) => [w, Math.hypot(v - pt.v, a - pt.a)]).sort((x, y) => x[1] - y[1])[0][0];
  $('moodWord').textContent = mood;
}
function blendBpm() { let W2 = 0, b = 0; for (const { g, d } of nearest(pt.v, pt.a, 3)) { const w = 1 / (d * d + .015); W2 += w; b += g.bpm * w; } return b / W2; }

// ---------- expression bars ----------
const bars = $('bars');
for (const [k, e] of Object.entries(EMO)) {
  const li = document.createElement('li'); li.dataset.k = k; li.style.setProperty('--c', e.c);
  li.innerHTML = `<span>${e.label}</span><span class="track"><span class="fill"></span></span><span class="pct">–</span>`;
  bars.appendChild(li);
}
function renderBars() {
  const lis = bars.children; let best = -1, bi = 0;
  model.classes.forEach((c, i) => { if (probs && probs[i] > best) { best = probs[i]; bi = i; } });
  model.classes.forEach((c, i) => {
    const li = [...lis].find(l => l.dataset.k === c), p = probs ? probs[i] : 0;
    li.querySelector('.fill').style.width = `${p * 100}%`;
    li.querySelector('.pct').textContent = probs ? `${Math.round(p * 100)}%` : '–';
    li.classList.toggle('lead', !!probs && i === bi);
  });
}

// ---------- classifier ----------
function features(blendshapes) {
  const m = new Map(blendshapes.map(b => [b.categoryName, b.score]));
  return model.names.map(n => m.get(n) ?? 0);
}
function classify(x) {
  if (baseline) x = x.map((v, i) => clamp(v - baseline[i] + model.neutral_mean[i], 0, 1));
  const z = x.map((v, i) => (v - model.mean[i]) / model.scale[i]);
  const logits = model.W.map((row, c) => row.reduce((s, w, i) => s + w * z[i], model.b[c]));
  const mx = Math.max(...logits), ex = logits.map(l => Math.exp(l - mx)), S = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / S);
}
function pointFromProbs(p) {
  let v = 0, a = 0;
  model.classes.forEach((c, i) => { v += p[i] * EMO[c].v; a += p[i] * EMO[c].a; });
  v *= 1.3; a *= 1.3;                                          // push a little further out so genres are reachable
  const m = Math.hypot(v, a); if (m > .98) { v *= .98 / m; a *= .98 / m; }
  return { v, a };
}

// ---------- camera ----------
const camBtn = $('camBtn'), calBtn = $('calBtn'), holdBtn = $('holdBtn'), video = $('video'), camStatus = $('camStatus');
function status(t) { camStatus.hidden = !t; camStatus.textContent = t || ''; }

camBtn.addEventListener('click', async () => {
  if (camOn) return stopCamera();
  camBtn.disabled = true; camBtn.textContent = 'Starting…';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
    video.srcObject = stream; await video.play();
    $('camEmpty').hidden = true;
    if (!landmarker) {
      status('Loading face model…');
      const { FaceLandmarker, FilesetResolver } = await import(`${MP}/vision_bundle.mjs`);
      const files = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
      const opts = d => ({ baseOptions: { modelAssetPath: FACE_MODEL, delegate: d }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true });
      try { landmarker = await FaceLandmarker.createFromOptions(files, opts('GPU')); }
      catch { landmarker = await FaceLandmarker.createFromOptions(files, opts('CPU')); }
    }
    camOn = true; status(''); camBtn.textContent = 'Turn off camera'; calBtn.disabled = false;
    lastFaceAt = performance.now();
  } catch (err) {
    console.error(err); stopCamera();
    status(err && err.name === 'NotAllowedError' ? 'Camera permission was blocked' : 'Camera unavailable');
  } finally { camBtn.disabled = false; updateHint(); }
});
function stopCamera() {
  camOn = false; probs = null; calib = null;
  if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; video.srcObject = null;
  $('camEmpty').hidden = false; camBtn.textContent = 'Turn on camera'; calBtn.disabled = true; calBtn.textContent = 'Calibrate';
  status(''); renderBars(); updateHint();
}
calBtn.addEventListener('click', () => { calib = { frames: [], until: performance.now() + 2000 }; calBtn.disabled = true; });
holdBtn.addEventListener('click', () => { hold = !hold; holdBtn.setAttribute('aria-pressed', hold); holdBtn.textContent = hold ? 'Holding' : 'Hold'; updateHint(); });

function camTick(now) {
  if (!camOn || !landmarker || video.readyState < 2 || video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;
  const res = landmarker.detectForVideo(video, now);
  const bs = res.faceBlendshapes && res.faceBlendshapes[0];
  if (!bs) { if (now - lastFaceAt > 600) status('Looking for a face…'); return; }
  lastFaceAt = now;
  const x = features(bs.categories);
  if (calib) {
    calib.frames.push(x);
    const left = Math.ceil((calib.until - now) / 1000);
    status(`Hold a relaxed face… ${Math.max(left, 1)}`);
    if (now >= calib.until) {
      baseline = model.names.map((_, i) => calib.frames.reduce((s, f) => s + f[i], 0) / calib.frames.length);
      calib = null; calBtn.disabled = false; calBtn.textContent = 'Recalibrate'; status('Calibrated');
      setTimeout(() => { if (camStatus.textContent === 'Calibrated') status(''); }, 1500);
    }
    return;
  }
  if (camStatus.textContent.startsWith('Looking')) status('');
  const p = classify(x);
  probs = probs ? probs.map((q, i) => q + (p[i] - q) * .2) : p;
  renderBars();
  if (!dragging && !hold && now > manualUntil) Object.assign(target, pointFromProbs(probs));
}

function updateHint() {
  const h = $('hint');
  if (hold) h.textContent = 'Point is held. Press Hold again to let it move.';
  else if (dragging && camOn) h.textContent = 'You’re steering. The camera takes back over a moment after you let go.';
  else if (camOn) h.textContent = 'Your face is steering. Drag the point any time to take over.';
  else h.textContent = 'Drag the glowing point, or turn on your camera and let your face steer.';
}

// ---------- main loop ----------
let last = performance.now(), trailTick = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  camTick(now);
  const k = dragging ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 2.6);
  pt.v += (target.v - pt.v) * k; pt.a += (target.a - pt.a) * k;
  if ((trailTick += dt) > .05) { trailTick = 0; trail.push({ ...pt }); if (trail.length > 24) trail.shift(); }
  engine.setPoint(pt.v, pt.a);
  draw(engine.level());
  updateNow();
  requestAnimationFrame(frame);
}

// ---------- process section ----------
function renderProcess() {
  const ev = model.eval, sizes = [10, 20, 30, 40, 50];
  const OLD = [24, 29, 34, 27, 36];                            // CreateML test accuracy from the 2025 write-up
  const NEW = sizes.map(s => ev.size_experiment[s][0]);
  const svg = $('sizeChart'), L = 60, R = 610, T = 20, B = 260, ymax = 60;
  const x = i => L + (R - L) * i / (sizes.length - 1), y = v => B - (B - T) * v / ymax;
  let s = '';
  for (let v = 0; v <= ymax; v += 10) s += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#322a3f"/><text x="${L - 10}" y="${y(v) + 4}" text-anchor="end" fill="#a49bb0" font-size="12">${v}%</text>`;
  sizes.forEach((sz, i) => s += `<text x="${x(i)}" y="${B + 22}" text-anchor="middle" fill="#a49bb0" font-size="12">${sz}</text>`);
  s += `<text x="${(L + R) / 2}" y="${B + 40}" text-anchor="middle" fill="#a49bb0" font-size="12">training images per emotion</text>`;
  s += `<line x1="${L}" x2="${R}" y1="${y(20)}" y2="${y(20)}" stroke="#6b6177" stroke-dasharray="4 4"/>`;
  const line = (arr, col, w) => `<polyline fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" points="${arr.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>` +
    arr.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${col}"/><text x="${x(i)}" y="${y(v) - 11}" text-anchor="middle" fill="${col}" font-size="12" font-weight="600">${Math.round(v)}%</text>`).join('');
  s += line(OLD, '#a49bb0', 2) + line(NEW, '#e3b765', 3);
  svg.innerHTML = s; svg.setAttribute('font-family', 'Manrope, system-ui, sans-serif');

  const f = ev.full, total = f.n_train + f.n_test;
  $('stats').innerHTML = [
    [`${Math.round(f.acc)}%`, 'accuracy of the full model, 5 emotions (chance is 20%)'],
    [`+${Math.round(NEW[4] - OLD[4])} pts`, 'over CreateML at 50 images per emotion, same protocol'],
    [`${Math.round(f.macro_f1)}%`, 'macro F1, so every emotion counts equally'],
    [total.toLocaleString(), 'labelled faces used (the original used 350)'],
  ].map(([b, t]) => `<div class="stat"><b>${b}</b><span>${t}</span></div>`).join('');

  const C = model.classes, cm = $('cm');
  let h = `<div class="h"></div>` + C.map(c => `<div class="h">${EMO[c].label}</div>`).join('');
  f.cm.forEach((row, i) => {
    const tot = row.reduce((a, b) => a + b, 0);
    h += `<div class="h rh">${EMO[C[i]].label}</div>` + row.map((n, j) => {
      const r = n / tot, bg = i === j ? `rgba(227,183,101,${.12 + r * .75})` : `rgba(201,127,120,${r * .8})`;
      return `<div style="background:${bg};color:${r > .45 ? '#1b130a' : '#efe7dc'}" title="${n} of ${tot} true ${C[i]} images guessed as ${C[j]}">${n}</div>`;
    }).join('');
  });
  cm.innerHTML = h;
}

// ---------- boot ----------
(async () => {
  model = await (await fetch('model.json')).json();
  buildBackground(); resize();
  new ResizeObserver(resize).observe(canvas);
  renderBars(); renderProcess(); updateHint();
  requestAnimationFrame(frame);
})();
