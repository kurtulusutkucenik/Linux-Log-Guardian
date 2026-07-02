import { create } from "zustand";

/**
 * High-performance shared interaction context.
 * Hot values live inside a STABLE `ref` object that is mutated directly
 * (inside a single rAF / useFrame loop) so React never re-renders on
 * mouse/scroll updates → locked 60fps between DOM and WebGL.
 *
 * Only `activeSection` uses real state (changes rarely).
 */
export interface DynamicRef {
  mouse: { x: number; y: number; tx: number; ty: number; nx: number; ny: number };
  scroll: { current: number; target: number; velocity: number };
  /**
   * Live audio spectrum written by the AudioKernel each frame (0..1).
   * `level` = overall energy, `bass` = low band, `treble` = high band,
   * `beat` = short-lived transient spike used for bloom/scatter pulses.
   */
  audio: { level: number; bass: number; treble: number; beat: number };
  hovering: boolean;
}

interface DynamicStore {
  ref: DynamicRef;
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export const useDynamicContext = create<DynamicStore>((set) => ({
  ref: {
    mouse: { x: 0, y: 0, tx: 0, ty: 0, nx: 0, ny: 0 },
    scroll: { current: 0, target: 0, velocity: 0 },
    audio: { level: 0, bass: 0, treble: 0, beat: 0 },
    hovering: false,
  },
  activeSection: "hero",
  setActiveSection: (s) => set({ activeSection: s }),
}));

/** Direct (non-reactive) access to the hot ref — use inside rAF/useFrame. */
export const dynamicRef = (): DynamicRef => useDynamicContext.getState().ref;
