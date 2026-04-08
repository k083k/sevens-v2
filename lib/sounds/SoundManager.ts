/**
 * SoundManager — Synthesizes and plays game sound effects using Web Audio API.
 *
 * No external audio files needed. All sounds are generated programmatically.
 * Persists mute/volume preference in localStorage.
 */

type SoundName =
  | "cardPlay"
  | "cardFlip"
  | "cardSlide"
  | "shuffle"
  | "deal"
  | "invalidMove"
  | "turnNotify"
  | "cantPlay"
  | "cardTransfer"
  | "win"
  | "lose"
  | "gameStart"
  | "buttonClick";

const STORAGE_KEY_MUTED = "sevens-sound-muted";
const STORAGE_KEY_VOLUME = "sevens-sound-volume";

class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted: boolean = false;
  private _volume: number = 0.6;
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this._muted = localStorage.getItem(STORAGE_KEY_MUTED) === "true";
      const storedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
      if (storedVol !== null) this._volume = parseFloat(storedVol);
    }
  }

  /** Lazily create AudioContext (must be triggered by user gesture) */
  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Initialize on first user interaction */
  init() {
    if (this.initialized) return;
    this.getContext();
    this.initialized = true;
  }

  // ─── Public API ─────────────────────────────────────────────

  get muted() { return this._muted; }
  get volume() { return this._volume; }

  setMuted(muted: boolean) {
    this._muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this._muted);
    return this._muted;
  }

  setVolume(vol: number) {
    this._volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(this._volume));
    }
  }

  play(sound: SoundName) {
    if (this._muted || typeof window === "undefined") return;
    this.init();

    try {
      switch (sound) {
        case "cardPlay": this.playCardPlace(); break;
        case "cardFlip": this.playCardFlip(); break;
        case "cardSlide": this.playCardSlide(); break;
        case "shuffle": this.playShuffle(); break;
        case "deal": this.playDeal(); break;
        case "invalidMove": this.playInvalidMove(); break;
        case "turnNotify": this.playTurnNotify(); break;
        case "cantPlay": this.playCantPlay(); break;
        case "cardTransfer": this.playCardTransfer(); break;
        case "win": this.playWin(); break;
        case "lose": this.playLose(); break;
        case "gameStart": this.playGameStart(); break;
        case "buttonClick": this.playButtonClick(); break;
      }
    } catch {
      // Silently fail — audio is non-critical
    }
  }

  // ─── Sound Generators ───────────────────────────────────────

  /** Short percussive snap — card hitting table */
  private playCardPlace() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    // Noise burst for the "thwack"
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.06);

    // Low thump
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(vol * 0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Lighter flick sound */
  private playCardFlip() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 12);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 4000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.04);
  }

  /** Sliding whoosh */
  private playCardSlide() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.3;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.linearRampToValueAtTime(5000, now + 0.12);
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  /** Rapid series of card flicks */
  private playShuffle() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;
    const count = 12;

    for (let i = 0; i < count; i++) {
      const t = now + i * 0.06;

      const bufferSize = ctx.sampleRate * 0.03;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / bufferSize, 10);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 3000 + Math.random() * 2000;
      filter.Q.value = 0.5;

      const gain = ctx.createGain();
      const amplitude = vol * (0.15 + 0.15 * Math.sin((i / count) * Math.PI));
      gain.gain.setValueAtTime(amplitude, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.03);
    }
  }

  /** Single card flick for dealing (lighter than place) */
  private playDeal() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const bufferSize = ctx.sampleRate * 0.035;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 15);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.035);
  }

  /** Low buzz for invalid move */
  private playInvalidMove() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.15, now);
    gain.gain.setValueAtTime(vol * 0.15, now + 0.08);
    gain.gain.setValueAtTime(0, now + 0.1);
    gain.gain.setValueAtTime(vol * 0.12, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /** Gentle chime — your turn */
  private playTurnNotify() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    [523, 659].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = now + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol * 0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /** Descending tone — can't play */
  private playCantPlay() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Swoosh — card transfer */
  private playCardTransfer() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    // Swoosh noise
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(6000, now + 0.2);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.2);
  }

  /** Ascending fanfare — victory */
  private playWin() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq;

      const gain = ctx.createGain();
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol * 0.2, start + 0.03);
      gain.gain.setValueAtTime(vol * 0.2, start + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      osc.connect(gain).connect(ctx.destination);
      osc2.connect(gain);
      osc.start(start);
      osc2.start(start);
      osc.stop(start + 0.5);
      osc2.stop(start + 0.5);
    });
  }

  /** Descending tones — loss */
  private playLose() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const notes = [392, 349, 330, 262]; // G4 F4 E4 C4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = now + i * 0.2;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol * 0.15, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  /** Rising shimmer — game start */
  private playGameStart() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const notes = [262, 330, 392, 523]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol * 0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  /** Quick tick */
  private playButtonClick() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this._volume;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}

/** Singleton instance */
export const soundManager = new SoundManager();
