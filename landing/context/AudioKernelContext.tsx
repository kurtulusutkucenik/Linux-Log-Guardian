"use client";

/**
 * AudioKernelContext
 * ------------------
 * The sound brain of Linux Log Guardian.
 *
 *  1. A pure Web Audio synthesizer (no external samples) that renders the
 *     futuristic UI SFX: hover blips, switch-throw clicks, hyperspace warps
 *     and error alarms — all from Oscillator / Gain / BiquadFilter nodes.
 *  2. A hidden, looping YouTube player ("Summer Piano" · Nx5c_JZIM6M) that
 *     provides the ambient score. It is muted/faded through the IFrame API.
 *  3. An AnalyserNode on the synth master bus + a gentle musical LFO that,
 *     together, publish a live spectrum into the global interaction store so
 *     the WebGL core and click bursts can react to sound in real time.
 *
 * Everything boots lazily on the first user gesture (the INITIALIZE CORE
 * button) to respect browser autoplay policies.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { dynamicRef } from "@/hooks/useDynamicContext";

const PIANO_VIDEO_ID = "Nx5c_JZIM6M";

export type Sfx = "hover" | "click" | "warp" | "error" | "type";

interface AudioKernelValue {
  ready: boolean;
  started: boolean;
  muted: boolean;
  volume: number; // 0..1
  spectrum: Uint8Array | null; // shared analyser buffer (read-only)
  initialize: () => Promise<void>;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  play: (sfx: Sfx) => void;
}

const AudioKernelContext = createContext<AudioKernelValue | null>(null);

/* ------------------------------------------------------------------ */
/* YouTube IFrame API typings (minimal)                                */
/* ------------------------------------------------------------------ */
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  setLoop?: (l: boolean) => void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement | string,
    opts: Record<string, unknown>
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/* ================================================================== */
/*  Web Audio synthesizer                                              */
/* ================================================================== */
class AudioSynth {
  ctx: AudioContext;
  master: GainNode;
  analyser: AnalyserNode;
  freq: Uint8Array<ArrayBuffer>;
  time: Uint8Array<ArrayBuffer>;

  constructor() {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;

    // A soft limiter keeps the synth from clipping on rapid clicks.
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 24;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;
    this.freq = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.time = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));

    this.master.connect(limiter);
    limiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  private now() {
    return this.ctx.currentTime;
  }

  /** High, short sine blip — element hover. */
  hover() {
    const t = this.now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  /** Very light mechanical key tick — terminal typing. */
  type() {
    const t = this.now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1200 + Math.random() * 500, t);
    g.gain.setValueAtTime(0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /** Sub-bass square + click transient — switch throw / element click. */
  click() {
    const t = this.now();

    // sub-bass thump
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = "square";
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(46, t + 0.18);
    subG.gain.setValueAtTime(0.28, t);
    subG.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    sub.connect(subG);
    subG.connect(this.master);
    sub.start(t);
    sub.stop(t + 0.24);

    // high digital chirp
    const hi = this.ctx.createOscillator();
    const hiG = this.ctx.createGain();
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2000;
    hi.type = "sawtooth";
    hi.frequency.setValueAtTime(2600, t);
    hi.frequency.exponentialRampToValueAtTime(600, t + 0.08);
    hiG.gain.setValueAtTime(0.12, t);
    hiG.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    hi.connect(hp);
    hp.connect(hiG);
    hiG.connect(this.master);
    hi.start(t);
    hi.stop(t + 0.12);
    // pulse the shared beat channel so visuals kick on click
    dynamicRef().audio.beat = 1;
  }

  /** Falling sawtooth sweep — hyperspace / page warp. */
  warp() {
    const t = this.now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(6000, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 0.55);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.7);
    dynamicRef().audio.beat = 1;
  }

  /** Detuned dual-oscillator alarm — error. */
  error() {
    const t = this.now();
    [0, 7].forEach((detune, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 220;
      osc.detune.value = detune + (i === 0 ? -6 : 6);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
      g.gain.setValueAtTime(0.1, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.24);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  setMasterGain(v: number) {
    const t = this.now();
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(v, t + 0.15);
  }

  dispose() {
    try {
      this.master.disconnect();
      this.analyser.disconnect();
      void this.ctx.close();
    } catch {
      /* already closed */
    }
  }
}

/* ================================================================== */
/*  Provider                                                          */
/* ================================================================== */
export function AudioKernelProvider({ children }: { children: React.ReactNode }) {
  const synthRef = useRef<AudioSynth | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const rafRef = useRef(0);
  const fadeRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.55);
  const [spectrum, setSpectrum] = useState<Uint8Array | null>(null);

  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  mutedRef.current = muted;
  volumeRef.current = volume;

  /* ---- analyser → global store loop ---- */
  const startAnalysisLoop = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return;
    const { analyser, freq, time } = synth;
    const bins = freq.length;
    const bassEnd = Math.max(1, Math.floor(bins * 0.12));
    const trebleStart = Math.floor(bins * 0.6);

    const loop = () => {
      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(time);

      let bass = 0;
      for (let i = 0; i < bassEnd; i++) bass += freq[i];
      bass /= bassEnd * 255;

      let treble = 0;
      for (let i = trebleStart; i < bins; i++) treble += freq[i];
      treble /= (bins - trebleStart) * 255;

      let level = 0;
      for (let i = 0; i < bins; i++) level += freq[i];
      level /= bins * 255;

      // Gentle musical LFO so the scene keeps breathing while the (cross-origin,
      // non-analysable) piano plays — layered on top of real synth energy.
      const t = performance.now() * 0.001;
      const musical =
        started && !mutedRef.current
          ? (0.5 + 0.5 * Math.sin(t * 0.9)) * 0.35 +
            (0.5 + 0.5 * Math.sin(t * 2.3 + 1.7)) * 0.15
          : 0;

      const a = dynamicRef().audio;
      a.level = Math.min(1, level * 1.6 + musical);
      a.bass = Math.min(1, bass * 1.9 + musical * 0.8);
      a.treble = Math.min(1, treble * 2.2);
      a.beat *= 0.86; // decay transient

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [started]);

  /* ---- YouTube player boot ---- */
  const bootYouTube = useCallback(() => {
    const create = () => {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player("lg-piano-frame", {
        videoId: PIANO_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          playlist: PIANO_VIDEO_ID,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(0);
            e.target.playVideo();
            // fade the score in over ~2.5s
            fadeTo(Math.round(volumeRef.current * 100), 2500);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      create();
      return;
    }
    window.onYouTubeIframeAPIReady = create;
    if (!document.getElementById("lg-yt-api")) {
      const s = document.createElement("script");
      s.id = "lg-yt-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  }, []);

  /* ---- volume fade helper ---- */
  const fadeTo = (target: number, ms: number) => {
    const player = playerRef.current;
    if (!player) return;
    if (fadeRef.current) window.clearInterval(fadeRef.current);
    const steps = Math.max(1, Math.round(ms / 40));
    const from = player.getVolume?.() ?? 0;
    let i = 0;
    fadeRef.current = window.setInterval(() => {
      i++;
      const p = i / steps;
      const eased = p * p * (3 - 2 * p); // smoothstep
      player.setVolume(Math.round(from + (target - from) * eased));
      if (i >= steps && fadeRef.current) {
        window.clearInterval(fadeRef.current);
        fadeRef.current = null;
      }
    }, 40);
  };

  /* ---- public: initialize (first gesture) ---- */
  const initialize = useCallback(async () => {
    if (synthRef.current) return;
    try {
      const synth = new AudioSynth();
      await synth.ctx.resume();
      synthRef.current = synth;
      setSpectrum(synth.freq);
      setReady(true);
      setStarted(true);
      startAnalysisLoop();
      bootYouTube();
    } catch {
      // Audio unavailable — the visual experience still works fully.
      setStarted(true);
    }
  }, [startAnalysisLoop, bootYouTube]);

  /* ---- public: mute / volume ---- */
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const player = playerRef.current;
      if (player) fadeTo(next ? 0 : Math.round(volumeRef.current * 100), 400);
      synthRef.current?.setMasterGain(next ? 0 : 0.6);
      return next;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    if (!mutedRef.current) playerRef.current?.setVolume(Math.round(clamped * 100));
  }, []);

  /* ---- public: sfx ---- */
  const play = useCallback(
    (sfx: Sfx) => {
      const synth = synthRef.current;
      if (!synth || mutedRef.current) return;
      switch (sfx) {
        case "hover":
          synth.hover();
          break;
        case "click":
          synth.click();
          break;
        case "warp":
          synth.warp();
          break;
        case "error":
          synth.error();
          break;
        case "type":
          synth.type();
          break;
      }
    },
    []
  );

  /* ---- cleanup ---- */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (fadeRef.current) window.clearInterval(fadeRef.current);
      synthRef.current?.dispose();
      synthRef.current = null;
      try {
        playerRef.current?.pauseVideo();
      } catch {
        /* noop */
      }
    };
  }, []);

  const value = useMemo<AudioKernelValue>(
    () => ({
      ready,
      started,
      muted,
      volume,
      spectrum,
      initialize,
      toggleMute,
      setVolume,
      play,
    }),
    [ready, started, muted, volume, spectrum, initialize, toggleMute, setVolume, play]
  );

  return (
    <AudioKernelContext.Provider value={value}>
      {children}
      {/* hidden audio-only YouTube host */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          width: 1,
          height: 1,
          left: -9999,
          top: -9999,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <div id="lg-piano-frame" />
      </div>
    </AudioKernelContext.Provider>
  );
}

export function useAudioKernel(): AudioKernelValue {
  const ctx = useContext(AudioKernelContext);
  if (!ctx) {
    // Safe no-op fallback so components never crash outside the provider.
    return {
      ready: false,
      started: false,
      muted: false,
      volume: 0,
      spectrum: null,
      initialize: async () => {},
      toggleMute: () => {},
      setVolume: () => {},
      play: () => {},
    };
  }
  return ctx;
}
