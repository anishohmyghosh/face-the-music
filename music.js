// Face the Music: generative Web Audio engine.
// Each genre is a small recipe (tempo, scale, drum grid, bass style, chord instrument).
// The nearest genre decides the patterns (switched on bar lines); tempo, brightness,
// reverb and drive glide between the three nearest genres so movement feels continuous.

export const GENRES = [
  // Excited (positive, energetic)
  { id: 'disco',  name: 'Disco Funk',   v: 0.82, a: 0.66, bpm: 118, mode: 'mixolydian', swing: 0,    k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', bass: 'octave', chord: 'pluck', comp: '..x...x...x..x..', lead: false, bright: .8, verb: .25, prog: [0, 3, 4, 3] },
  { id: 'house',  name: 'House',        v: 0.46, a: 0.48, bpm: 124, mode: 'dorian',     swing: 0,    k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', bass: 'offbeat', chord: 'stab', comp: '...x.....x..x...', lead: false, bright: .75, verb: .35, prog: [0, 0, 5, 3] },
  { id: 'pop',    name: 'Synth Pop',    v: 0.72, a: 0.3,  bpm: 112, mode: 'major',      swing: 0,    k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'root8',   chord: 'pad',   comp: 'x...............', lead: true,  bright: .7, verb: .4,  prog: [0, 4, 5, 3] },
  { id: 'dnb',    name: 'Drum & Bass',  v: 0.14, a: 0.8,  bpm: 172, mode: 'minor',      swing: 0,    k: 'x.........x.....', s: '....x.......x...', h: 'x.xxx.x.x.xxx.x.', bass: 'reese',   chord: 'pad',   comp: 'x...............', lead: true,  bright: .7, verb: .45, prog: [0, 5, 3, 4] },
  // Tense (negative, energetic)
  { id: 'metal',  name: 'Metal',        v: -0.8, a: 0.86, bpm: 150, mode: 'phrygian',   swing: 0,    k: 'x.x.x.x.x.x.x.x.', s: '....x.......x...', h: 'x...x...x...x...', bass: 'chug',    chord: 'power', comp: 'x.x.x.xxx.x.x.xx', lead: false, bright: .65, verb: .2, drive: 1, prog: [0, 0, 1, 0] },
  { id: 'techno', name: 'Dark Techno',  v: -0.45,a: 0.62, bpm: 130, mode: 'phrygian',   swing: 0,    k: 'x...x...x...x...', s: '........x.......', h: '..x...x...x...x.', bass: 'rolling', chord: 'stab',  comp: 'x.....x.........', lead: false, bright: .45, verb: .5, prog: [0, 0, 0, 1] },
  { id: 'trap',   name: 'Trap',         v: -0.3, a: 0.35, bpm: 140, mode: 'minor',      swing: 0,    k: 'x......x..x.....', s: '........x.......', h: 'x.x.x.xxx.x.x.xx', bass: 'sub808',  chord: 'keys',  comp: 'x.......x.......', lead: false, bright: .5, verb: .4, half: true, prog: [0, 5, 3, 4] },
  // Sad (negative, calm)
  { id: 'triphop',name: 'Trip-Hop',     v: -0.3, a: -0.2, bpm: 84,  mode: 'minor',      swing: .25,  k: 'x......x.x......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'sub',     chord: 'keys',  comp: 'x.......x.......', lead: false, bright: .35, verb: .6, crackle: true, prog: [0, 5, 2, 6] },
  { id: 'ballad', name: 'Piano Ballad', v: -0.7, a: -0.45,bpm: 68,  mode: 'minor',      swing: 0,    k: '................', s: '................', h: '................', bass: 'sub',     chord: 'keys',  comp: 'x...x...x...x...', lead: false, bright: .4, verb: .75, prog: [0, 5, 3, 4] },
  { id: 'drone',  name: 'Dark Ambient', v: -0.55,a: -0.78,bpm: 60,  mode: 'phrygian',   swing: 0,    k: '................', s: '................', h: '................', bass: 'none',    chord: 'pad',   comp: 'x...............', lead: false, bright: .2, verb: .9, prog: [0, 1, 0, 6] },
  // Relaxed (positive, calm)
  { id: 'lofi',   name: 'Lo-fi',        v: 0.35, a: -0.42,bpm: 78,  mode: 'dorian',     swing: .3,   k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'sub',     chord: 'keys',  comp: 'x.........x.....', lead: false, bright: .35, verb: .45, crackle: true, sevenths: true, prog: [1, 4, 0, 5] },
  { id: 'bossa',  name: 'Bossa Nova',   v: 0.68, a: -0.25,bpm: 96,  mode: 'major',      swing: 0,    k: 'x..x..x.x..x..x.', s: '................', h: 'x.xxx.xxx.xxx.xx', bass: 'bossa',   chord: 'pluck', comp: 'x..x..x...x..x..', lead: false, bright: .55, verb: .3, sevenths: true, soft: true, prog: [1, 4, 0, 0] },
  { id: 'ambient',name: 'Ambient',      v: 0.25, a: -0.82,bpm: 64,  mode: 'lydian',     swing: 0,    k: '................', s: '................', h: '................', bass: 'none',    chord: 'pad',   comp: 'x...............', lead: true,  bright: .5, verb: .95, sparse: true, prog: [0, 1, 0, 4] },
  { id: 'soul',   name: 'Neo-Soul',     v: 0.55, a: -0.02,bpm: 88,  mode: 'dorian',     swing: .2,   k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'walk',    chord: 'keys',  comp: 'x.....x...x.....', lead: false, bright: .5, verb: .4, sevenths: true, prog: [1, 4, 0, 3] },
  // Centre
  { id: 'indie',  name: 'Indie',        v: 0.05, a: 0.12, bpm: 104, mode: 'major',      swing: 0,    k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'root8',   chord: 'pluck', comp: 'x.x.x.x.x.x.x.x.', lead: false, bright: .6, verb: .35, prog: [0, 5, 3, 4] },
];

const MODES = {
  major: [0, 2, 4, 5, 7, 9, 11], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10], minor: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
};
const ROOT = 45; // A2
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const on = (p, i) => p[i % p.length] === 'x';

export function nearest(v, a, n = 3) {
  return GENRES.map(g => ({ g, d: Math.hypot(g.v - v, g.a - a) })).sort((x, y) => x.d - y.d).slice(0, n);
}

export class Engine {
  constructor() { this.ctx = null; this.playing = false; this.v = 0; this.a = 0; this.volume = 0.7; this.genre = GENRES[GENRES.length - 1]; }

  _build() {
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain(); this.master.gain.value = 0;
    this.comp = ctx.createDynamicsCompressor(); this.comp.threshold.value = -16; this.comp.ratio.value = 4; this.comp.attack.value = .005; this.comp.release.value = .2;
    this.tone = ctx.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 8000; this.tone.Q.value = .4;
    this.bus = ctx.createGain(); this.bus.gain.value = .9;
    this.verb = ctx.createConvolver(); this.verb.buffer = this._impulse(3.2);
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = .3;
    this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512;
    this.bus.connect(this.tone); this.tone.connect(this.comp);
    this.bus.connect(this.verbSend); this.verbSend.connect(this.verb); this.verb.connect(this.comp);
    this.comp.connect(this.master); this.master.connect(this.analyser); this.analyser.connect(ctx.destination);
    this.noise = this._noiseBuffer();
    this.shaper = ctx.createWaveShaper(); this.shaper.curve = this._driveCurve(60); this.shaper.oversample = '2x';
    this.shaperOut = ctx.createGain(); this.shaperOut.gain.value = .5;
    this.shaper.connect(this.shaperOut); this.shaperOut.connect(this.bus);
    // vinyl crackle bed
    this.crackleGain = ctx.createGain(); this.crackleGain.gain.value = 0;
    const cr = ctx.createBufferSource(); cr.buffer = this._crackleBuffer(); cr.loop = true;
    const crf = ctx.createBiquadFilter(); crf.type = 'bandpass'; crf.frequency.value = 2500; crf.Q.value = .7;
    cr.connect(crf); crf.connect(this.crackleGain); this.crackleGain.connect(this.master); cr.start();
    this.step = 0; this.bar = 0; this.nextTime = 0; this.params = { bpm: 100, bright: .5, verb: .4 };
  }

  _impulse(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    return b;
  }
  _noiseBuffer() {
    const ctx = this.ctx, b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  _crackleBuffer() {
    const ctx = this.ctx, b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .04 + (Math.random() < .0007 ? (Math.random() * 2 - 1) * .9 : 0);
    return b;
  }
  _driveCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    return c;
  }

  async play() {
    if (!this.ctx) this._build();
    await this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + .25);
    this.nextTime = t + .06; this.playing = true;
    clearInterval(this.timer); this.timer = setInterval(() => this._schedule(), 25);
  }
  async pause() {
    if (!this.ctx || !this.playing) return;
    this.playing = false; clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + .2);
    await new Promise(r => setTimeout(r, 240));
    if (!this.playing) await this.ctx.suspend();
  }
  setVolume(v) {
    this.volume = v;
    if (this.ctx && this.playing) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, .05);
  }
  setPoint(v, a) { this.v = v; this.a = a; }
  level() {
    if (!this.analyser || !this.playing) return 0;
    const d = new Uint8Array(this.analyser.fftSize); this.analyser.getByteTimeDomainData(d);
    let s = 0; for (const x of d) s += ((x - 128) / 128) ** 2;
    return Math.sqrt(s / d.length);
  }

  _blend() {
    const nn = nearest(this.v, this.a, 3);
    let W = 0; const p = { bpm: 0, bright: 0, verb: 0 };
    for (const { g, d } of nn) { const w = 1 / (d * d + .015); W += w; p.bpm += g.bpm * w; p.bright += g.bright * w; p.verb += g.verb * w; }
    for (const k in p) p[k] /= W;
    return { p, top: nn[0].g };
  }

  _schedule() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + .12) {
      if (this.step % 16 === 0) this._onBar();
      this._playStep(this.step % 16, this.nextTime);
      const g = this.genre, sixteenth = 60 / this.params.bpm / 4;
      this.step++;
      // swing: lengthen even 16ths, shorten odd
      const sw = g.swing || 0;
      this.nextTime += sixteenth * (this.step % 2 === 1 ? 1 + sw : 1 - sw);
    }
  }

  _onBar() {
    const { p, top } = this._blend();
    this.genre = top; this.params = p;
    const t = this.ctx.currentTime;
    this.tone.frequency.setTargetAtTime(900 + p.bright * p.bright * 14000, t, .4);
    this.verbSend.gain.setTargetAtTime(.08 + p.verb * .55, t, .4);
    this.crackleGain.gain.setTargetAtTime(top.crackle ? .5 : 0, t, .5);
    const scale = MODES[top.mode];
    const deg = top.prog[this.bar % top.prog.length];
    const chordDegs = top.sevenths ? [0, 2, 4, 6] : [0, 2, 4];
    this.chord = chordDegs.map(o => { const d = deg + o; return ROOT + 12 + scale[d % 7] + 12 * Math.floor(d / 7); });
    this.rootNote = ROOT + scale[deg % 7];
    this.scale = scale;
    this.bar++;
    if (this.onBar) this.onBar(top, p);
  }

  _playStep(i, t) {
    const g = this.genre, spb = 60 / this.params.bpm, sixteenth = spb / 4;
    const vel = g.soft ? .6 : 1;
    if (on(g.k, i)) this._kick(t, vel, g.id === 'trap' || g.bass === 'sub808');
    if (on(g.s, i)) g.id === 'house' || g.id === 'disco' ? this._clap(t, vel) : this._snare(t, vel);
    if (on(g.h, i)) this._hat(t, g.id === 'house' && i % 4 === 2 ? .2 : .045, vel * (i % 4 === 0 ? .9 : .6));
    // bass
    const r = this.rootNote, fifth = r + 7;
    switch (g.bass) {
      case 'root8': if (i % 2 === 0) this._bass(t, r, sixteenth * 1.8, 'saw'); break;
      case 'octave': if (i % 2 === 0) this._bass(t, i % 4 === 0 ? r : r + 12, sixteenth * 1.5, 'saw'); break;
      case 'offbeat': if (i % 4 === 2) this._bass(t, r, sixteenth * 1.6, 'saw'); break;
      case 'rolling': if (i % 4 !== 0) this._bass(t, r, sixteenth * .9, 'saw'); break;
      case 'reese': if (i === 0 || i === 6 || i === 10) this._bass(t, r, sixteenth * 4, 'reese'); break;
      case 'chug': if (on(g.comp, i)) this._bass(t, r - 12, sixteenth * .8, 'saw'); break;
      case 'sub': if (i === 0 || (i === 10 && g.id !== 'ballad')) this._bass(t, r, sixteenth * (g.id === 'ballad' ? 14 : 6), 'sine'); break;
      case 'sub808': if (on(g.k, i)) this._bass(t, r, sixteenth * 5, '808'); break;
      case 'bossa': if (i === 0 || i === 6) this._bass(t, r, sixteenth * 3, 'sine'); else if (i === 8 || i === 14) this._bass(t, fifth - 12, sixteenth * 2, 'sine'); break;
      case 'walk': if (i % 4 === 0) this._bass(t, r + [0, this.scale[2], this.scale[4], this.scale[5]][i / 4], sixteenth * 3.6, 'sine'); break;
    }
    // chords
    if (on(g.comp, i) && this.chord) {
      const barLeft = (16 - i) * sixteenth;
      switch (g.chord) {
        case 'pad': this._pad(t, this.chord, Math.min(barLeft, 16 * sixteenth) + .3); break;
        case 'keys': this._keys(t, this.chord, sixteenth * 6); break;
        case 'pluck': this._pluck(t, this.chord, sixteenth * 1.5); break;
        case 'stab': this._stab(t, this.chord, sixteenth * 1.2); break;
        case 'power': this._power(t, this.rootNote, sixteenth * .9); break;
      }
    }
    // lead / arp
    if (g.lead && this.chord) {
      const every = g.sparse ? 4 : g.id === 'dnb' ? 2 : 2;
      if (i % every === 0 && (!g.sparse || Math.random() < .55)) {
        const notes = this.chord, idx = (i / every + this.bar) % (notes.length + 1);
        const n = (notes[idx % notes.length]) + 12 + (idx === notes.length ? 12 : 0);
        this._lead(t, n, sixteenth * (g.sparse ? 6 : 1.6), g.sparse);
      }
    }
  }

  // ---------- voices ----------
  _env(node, t, a, peak, dur, rel = .08) {
    const g = node.gain; g.setValueAtTime(0, t); g.linearRampToValueAtTime(peak, t + a);
    g.setValueAtTime(peak, t + Math.max(a, dur)); g.exponentialRampToValueAtTime(.0001, t + Math.max(a, dur) + rel);
  }
  _kick(t, vel, long) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(long ? 120 : 155, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
    g.gain.setValueAtTime(.95 * vel, t); g.gain.exponentialRampToValueAtTime(.001, t + (long ? .5 : .32));
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + .6);
  }
  _noise(t, dur, type, freq, q, peak, dest = this.bus) {
    const ctx = this.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
  }
  _snare(t, vel) {
    this._noise(t, .18, 'bandpass', 1900, .8, .55 * vel);
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(140, t + .08);
    g.gain.setValueAtTime(.35 * vel, t); g.gain.exponentialRampToValueAtTime(.001, t + .1);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + .15);
  }
  _clap(t, vel) { for (let k = 0; k < 3; k++) this._noise(t + k * .011, k === 2 ? .16 : .03, 'bandpass', 1300, 1.1, .45 * vel); }
  _hat(t, dur, vel) { this._noise(t, dur, 'highpass', 7500, .7, .22 * vel); }
  _bass(t, midi, dur, kind) {
    const ctx = this.ctx, g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = kind === 'sine' || kind === '808' ? 900 : 260 + this.params.bright * 900; f.Q.value = kind === 'saw' ? 3 : .7;
    const oscs = [];
    if (kind === 'reese') { for (const det of [-14, 14]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(midi); o.detune.value = det; oscs.push(o); } f.frequency.value = 500; }
    else { const o = ctx.createOscillator(); o.type = kind === 'saw' ? 'sawtooth' : 'sine'; o.frequency.value = hz(midi);
      if (kind === '808') { o.frequency.setValueAtTime(hz(midi + 12), t); o.frequency.exponentialRampToValueAtTime(hz(midi), t + .06); }
      oscs.push(o); }
    const peak = kind === 'sine' || kind === '808' ? .5 : .28;
    this._env(g, t, .006, peak, dur * .85, .12);
    oscs.forEach(o => { o.connect(f); o.start(t); o.stop(t + dur + .3); }); f.connect(g); g.connect(this.bus);
  }
  _pad(t, notes, dur) {
    const ctx = this.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = 500 + this.params.bright * 2200; f.Q.value = .5;
    const atk = Math.min(.9, dur * .35);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + atk); g.gain.setValueAtTime(.05, t + dur - .2); g.gain.linearRampToValueAtTime(0, t + dur + .9);
    for (const n of notes) for (const det of [-8, 8]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 1); }
    f.connect(g); g.connect(this.bus);
  }
  _keys(t, notes, dur) {
    const ctx = this.ctx;
    notes.forEach((n, k) => {
      const tt = t + k * .012, g = ctx.createGain(), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o.type = 'sine'; o.frequency.value = hz(n); o2.type = 'sine'; o2.frequency.value = hz(n) * 4; g2.gain.setValueAtTime(.25, tt); g2.gain.exponentialRampToValueAtTime(.001, tt + .25);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(.11, tt + .008); g.gain.exponentialRampToValueAtTime(.035, tt + .5); g.gain.exponentialRampToValueAtTime(.0005, tt + dur + .6);
      o2.connect(g2); g2.connect(g); o.connect(g); g.connect(this.bus); o.start(tt); o2.start(tt); o.stop(tt + dur + .7); o2.stop(tt + .3);
    });
  }
  _pluck(t, notes, dur) {
    const ctx = this.ctx;
    notes.forEach((n, k) => {
      const tt = t + k * .008, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = hz(n + 12); f.type = 'lowpass'; f.frequency.setValueAtTime(800 + this.params.bright * 3500, tt); f.frequency.exponentialRampToValueAtTime(400, tt + dur);
      g.gain.setValueAtTime(.09, tt); g.gain.exponentialRampToValueAtTime(.001, tt + dur + .15);
      o.connect(f); f.connect(g); g.connect(this.bus); o.start(tt); o.stop(tt + dur + .2);
    });
  }
  _stab(t, notes, dur) {
    const ctx = this.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(600 + this.params.bright * 4000, t); f.frequency.exponentialRampToValueAtTime(300, t + dur);
    g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + dur + .1);
    for (const n of notes) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n + 12); o.connect(f); o.start(t); o.stop(t + dur + .15); }
    f.connect(g); g.connect(this.bus);
  }
  _power(t, root, dur) {
    const ctx = this.ctx, g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2600;
    g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + dur + .05);
    for (const n of [root, root + 7, root + 12]) for (const det of [-6, 6]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = det; o.connect(g); o.start(t); o.stop(t + dur + .1); }
    g.connect(this.shaper);
  }
  _lead(t, n, dur, soft) {
    const ctx = this.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = soft ? 'sine' : 'square'; o.frequency.value = hz(n); f.type = 'lowpass'; f.frequency.value = soft ? 3000 : 1200 + this.params.bright * 3000;
    this._env(g, t, soft ? .3 : .005, soft ? .05 : .035, dur * .8, soft ? 1.2 : .1);
    o.connect(f); f.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 1.4);
  }
}
