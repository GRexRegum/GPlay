/**
 * ვებ-აუდიო სინთეზატორი და ემბიენტ ფლეიერი
 * Web Audio Ambient Music & Sound Effects Engine
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = true;
    this.notes = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25]; // Pentatonic calm scale (A minor / C major)
    this.currentTimer = null;
    this.masterGain = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(freq, duration = 2.5, timeOffset = 0, type = 'sine') {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime + timeOffset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  startAmbient() {
    this.initContext();
    this.isPlaying = true;
    this.isMuted = false;

    const playChord = () => {
      if (!this.isPlaying || this.isMuted) return;

      // აკორდის არჩევა
      const baseFreq = this.notes[Math.floor(Math.random() * this.notes.length)];
      this.playNote(baseFreq, 4.0, 0, 'sine');
      this.playNote(baseFreq * 1.5, 3.5, 0.4, 'triangle');
      this.playNote(baseFreq * 2, 3.0, 0.8, 'sine');

      // მომდევნო აკორდის დაგეგმვა (მშვიდი, წყნარი ინტერვალებით)
      const nextDelay = Math.random() * 2500 + 3500;
      this.currentTimer = setTimeout(playChord, nextDelay);
    };

    playChord();
  }

  stopAmbient() {
    this.isPlaying = false;
    this.isMuted = true;
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
  }

  toggleMusic() {
    if (this.isPlaying && !this.isMuted) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  // ინტერფეისის ხმოვანი ეფექტი: ნაზი კლიკი
  playClickSound() {
    if (this.isMuted) return;
    this.initContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // მოდალის გახსნის ზანზალაკის ეფექტი
  playChimeSound() {
    if (this.isMuted) return;
    this.initContext();
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.6);
      });
    } catch (e) {}
  }

  // წარმატების ხმოვანი ეფექტი (ფორმის გაგზავნისას)
  playSuccessSound() {
    if (this.isMuted) return;
    this.initContext();
    try {
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880]; // A major fanfare
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.8);
      });
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();
