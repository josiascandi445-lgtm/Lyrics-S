type Listener = (time: number, isPlaying: boolean) => void;

/**
 * Fonte única de verdade sobre o tempo de reprodução.
 *
 * Usa o `currentTime` real do elemento <audio> (secção 11: "A sincronização
 * deve utilizar o tempo real do elemento Audio") e propaga atualizações via
 * requestAnimationFrame (secção 20: nunca setInterval/setTimeout como
 * relógio principal).
 */
export class AudioClock {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private rafId: number | null = null;

  attach(audio: HTMLAudioElement) {
    this.audio = audio;
    this.startLoop();
  }

  detach() {
    this.stopLoop();
    this.audio = null;
  }

  get element(): HTMLAudioElement | null {
    return this.audio;
  }

  get currentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  get duration(): number {
    return this.audio?.duration ?? 0;
  }

  get isPlaying(): boolean {
    return !!this.audio && !this.audio.paused && !this.audio.ended;
  }

  play() {
    void this.audio?.play();
  }

  pause() {
    this.audio?.pause();
  }

  toggle() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  seek(time: number) {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(time, this.audio.duration || time));
    this.audio.currentTime = clamped;
    this.notify();
  }

  seekBy(deltaSeconds: number) {
    this.seek(this.currentTime + deltaSeconds);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l(this.currentTime, this.isPlaying);
  }

  private startLoop() {
    if (this.rafId !== null) return;
    const tick = () => {
      this.notify();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}

export const audioClock = new AudioClock();
