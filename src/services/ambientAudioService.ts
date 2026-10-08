// Web Audio API based ambient sound generator and serene chimes
// Zero external assets required, fully offline and lightweight

export type AmbientSoundType = 'none' | 'rain' | 'coffee' | 'whitenoise' | 'flow';

class AmbientAudioService {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'none';
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.25;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.4, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public stopAmbient() {
    if (this.noiseNode) {
      try {
        if ('stop' in this.noiseNode && typeof (this.noiseNode as any).stop === 'function') {
          (this.noiseNode as any).stop();
        }
        this.noiseNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.noiseNode = null;
    }
    this.currentType = 'none';
  }

  public playAmbient(type: AmbientSoundType) {
    this.stopAmbient();
    if (type === 'none') return;

    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    const ctx = this.ctx;

    // Master gain for ambient
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.35, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.gainNode = masterGain;

    if (type === 'whitenoise') {
      // Pink / Soft noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(masterGain);
      noiseSource.start();
      this.noiseNode = noiseSource;
    } else if (type === 'rain') {
      // Warm rain: filtered brown noise with slow undulating filter
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 1.8;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(800, ctx.currentTime);

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(120, ctx.currentTime);

      noiseSource.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(masterGain);
      noiseSource.start();
      this.noiseNode = noiseSource;
    } else if (type === 'coffee') {
      // Cozy coffee shop murmur / warm low frequency rumble
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(450, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

      noiseSource.connect(bandpass);
      bandpass.connect(masterGain);
      noiseSource.start();
      this.noiseNode = noiseSource;
    } else if (type === 'flow') {
      // Serene binaural flow drone (warm 216Hz + 220Hz harmonic interval)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(216, ctx.currentTime); // Base calm
      osc2.frequency.setValueAtTime(220, ctx.currentTime); // 4Hz alpha wave beat

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.12, ctx.currentTime);

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(masterGain);

      osc1.start();
      osc2.start();

      this.noiseNode = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (e) {}
        },
        disconnect: () => {
          try {
            osc1.disconnect();
            osc2.disconnect();
            oscGain.disconnect();
          } catch (e) {}
        },
      } as any;
    }
  }

  // Play serene chime on session finish or micro-step completion
  public playChime(success = true) {
    try {
      this.initContext();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const freqs = success ? [528, 660, 792, 1056] : [440, 554];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
    } catch (e) {
      // Audio might fail if user hasn't interacted with page yet
    }
  }
}

export const ambientAudio = new AmbientAudioService();
