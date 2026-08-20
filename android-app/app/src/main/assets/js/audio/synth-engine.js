/**
 * synth-engine.js
 * Procedural Web Audio API Synthesizer
 * Generates ambient soundscapes (Rain, Ocean, Thunder, Forest, Lo-Fi) and feeding SFX (Crunch, Gulp)
 * 100% offline-capable with zero external audio files.
 */

class SynthEngine {
  constructor() {
    this.ctx = null;
    this.channels = {};
    this.masterGain = null;
    this.initialized = false;
    this.isMuted = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // ==========================================
  // FEEDING SOUND EFFECTS (Crunch & Gulp)
  // ==========================================
  
  /**
   * Procedural Crunch SFX:
   * 1,200Hz bandpass filtered white noise burst that decays in ~80ms.
   */
  playCrunch() {
    try {
      const ctx = this.ensureContext();
      const sampleRate = ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * 0.09); // ~90ms
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.025));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200, ctx.currentTime);
      bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.085);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      noise.start();
    } catch (e) {
      console.warn('Crunch SFX error:', e);
    }
  }

  /**
   * Procedural Gulp SFX:
   * Triangle-wave oscillator that slides from 220Hz to 440Hz with a quick bubble pop envelope.
   */
  playGulp() {
    try {
      const ctx = this.ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime;

      // Frequency slide 220Hz -> 440Hz
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);

      // Cute bubble envelope
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {
      console.warn('Gulp SFX error:', e);
    }
  }

  /**
   * Joyful Cheerful Chime SFX:
   * Arpeggiated golden starlight chime when Kiro is happy or petted.
   */
  playStarlightChime() {
    try {
      const ctx = this.ensureContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.36);
      });
    } catch (e) {
      console.warn('Chime SFX error:', e);
    }
  }

  // ==========================================
  // AMBIENT ATMOSPHERIC CHANNELS
  // ==========================================

  startRain(volume = 0.35) {
    this.stopChannel('rain');
    const ctx = this.ensureContext();
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1200;
    bandpass.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    this.channels['rain'] = {
      source: noise,
      gain: gain,
      stop: () => {
        try { noise.stop(); } catch(e){}
      }
    };
  }

  startOcean(volume = 0.3) {
    this.stopChannel('ocean');
    const ctx = this.ensureContext();
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.8;

    // LFO for slow ocean swells (0.12 Hz)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = volume * 0.5;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    lfo.start();
    noise.start();

    this.channels['ocean'] = {
      source: noise,
      lfo: lfo,
      gain: gain,
      stop: () => {
        try { noise.stop(); lfo.stop(); } catch(e){}
      }
    };
  }

  startThunder(volume = 0.45) {
    this.stopChannel('thunder');
    const ctx = this.ensureContext();

    // Background rain layer for thunder
    this.startRain(volume * 0.4);

    const schedulers = [];
    const triggerRumble = () => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 1.8);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 2.3);
      } catch(e){}
    };

    const intervalId = setInterval(triggerRumble, 7000 + Math.random() * 9000);
    schedulers.push(intervalId);

    this.channels['thunder'] = {
      stop: () => {
        schedulers.forEach(id => clearInterval(id));
        this.stopChannel('rain');
      }
    };
  }

  startForest(volume = 0.25) {
    this.stopChannel('forest');
    const ctx = this.ensureContext();
    const schedulers = [];

    // Ambient wind background
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 320;
    bandpass.Q.value = 0.6;

    const windGain = ctx.createGain();
    windGain.gain.value = volume * 0.4;
    noise.connect(bandpass);
    bandpass.connect(windGain);
    windGain.connect(this.masterGain);
    noise.start();

    // Procedural bird chirp generator
    const chirp = () => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3200 + Math.random() * 800, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 0.08);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch(e){}
    };

    const intervalId = setInterval(() => {
      chirp();
      setTimeout(chirp, 65);
      if (Math.random() > 0.4) setTimeout(chirp, 130);
    }, 1200 + Math.random() * 2000);
    schedulers.push(intervalId);

    this.channels['forest'] = {
      source: noise,
      stop: () => {
        try { noise.stop(); } catch(e){}
        schedulers.forEach(id => clearInterval(id));
      }
    };
  }

  startLofi(volume = 0.35) {
    this.stopChannel('lofi');
    const ctx = this.ensureContext();
    const schedulers = [];

    // Warm chord progression: FM7 -> G6 -> Em7 -> Am7
    const chords = [
      [349.23, 440.00, 523.25, 659.25], // FM7 (F4, A4, C5, E5)
      [392.00, 493.88, 587.33, 659.25], // G6  (G4, B4, D5, E5)
      [329.63, 392.00, 493.88, 587.33], // Em7 (E4, G4, B4, D5)
      [440.00, 523.25, 659.25, 783.99]  // Am7 (A4, C5, E5, G5)
    ];
    let chordIdx = 0;

    // 72-BPM timer
    const playChord = () => {
      try {
        const chord = chords[chordIdx % chords.length];
        chordIdx++;
        const now = ctx.currentTime;

        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(volume * 0.08, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.1);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now + idx * 0.03);
          osc.stop(now + 3.2);
        });
      } catch(e){}
    };

    playChord();
    const chordTimer = setInterval(playChord, 3333);
    schedulers.push(chordTimer);

    // Vinyl crackle / tape hiss background
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleRate; i++) data[i] = Math.random() * 2 - 1;
    const hiss = ctx.createBufferSource();
    hiss.buffer = buffer;
    hiss.loop = true;
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 3500;
    const hissGain = ctx.createGain();
    hissGain.gain.value = volume * 0.035;
    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.masterGain);
    hiss.start();

    this.channels['lofi'] = {
      source: hiss,
      stop: () => {
        try { hiss.stop(); } catch(e){}
        schedulers.forEach(id => clearInterval(id));
      }
    };
  }

  stopChannel(name) {
    if (this.channels[name]) {
      try {
        if (typeof this.channels[name].stop === 'function') {
          this.channels[name].stop();
        }
      } catch (e) {
        console.warn(`Error stopping channel ${name}:`, e);
      }
      delete this.channels[name];
    }
  }

  stopAll() {
    Object.keys(this.channels).forEach(name => this.stopChannel(name));
  }

  playPreset(key, volume = 0.35) {
    this.stopAll();
    switch (key) {
      case 'rain': this.startRain(volume); break;
      case 'ocean': this.startOcean(volume); break;
      case 'thunder': this.startThunder(volume); break;
      case 'forest': this.startForest(volume); break;
      case 'lofi': this.startLofi(volume); break;
      default: this.startRain(volume); break;
    }
  }
}

// Global singleton instance
window.SynthEngine = SynthEngine;
window.synthEngine = new SynthEngine();
