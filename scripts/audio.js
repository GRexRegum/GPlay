/**
 * ქართული ვიზუალური ნოველების პორტალი - Web Audio Ambient & SFX Engine
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMusicPlaying = false;
    this.isMuted = false; // По умолчанию эффекты интерфейса разрешены
    this.notes = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25]; // Pentatonic calm scale (A minor / C major)
    this.currentTimer = null;
    this.masterGain = null;
    this.musicGain = null;
  }

  // Инициализация аудио-контекста по жесткому требованию браузеров (User Interaction)
  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;

      this.ctx = new AudioContext();
      
      // Общий мастер-гейн
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Отдельный гейн для фоновой музыки
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  // Воспроизведение одиночной ноты
  playNote(freq, duration = 2.5, timeOffset = 0, type = 'sine', isMusic = false) {
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
      
      // Направляем ноту в соответствующий шину (музыка или общие эффекты)
      const targetGain = isMusic ? this.musicGain : this.masterGain;
      gain.connect(targetGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Запуск фонового эмбиента
  startAmbient() {
    if (!this.initContext()) return;

    // Сбрасываем предыдущий цикл, если он уже запущен
    this.stopAmbient(false);

    this.isMusicPlaying = true;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    const playChord = () => {
      if (!this.isMusicPlaying) return;

      const baseFreq = this.notes[Math.floor(Math.random() * this.notes.length)];
      this.playNote(baseFreq, 4.0, 0, 'sine', true);
      this.playNote(baseFreq * 1.5, 3.5, 0.4, 'triangle', true);
      this.playNote(baseFreq * 2, 3.0, 0.8, 'sine', true);

      const nextDelay = Math.random() * 2500 + 3500;
      this.currentTimer = setTimeout(playChord, nextDelay);
    };

    playChord();
  }

  // Остановка фонового эмбиента
  stopAmbient(fade = true) {
    this.isMusicPlaying = false;

    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    // Плавное затухание текущих звучащих аккордов
    if (fade && this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    }
  }

  // Переключатель музыки
  toggleMusic() {
    if (this.isMusicPlaying) {
      this.stopAmbient(true);
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  // Интерфейсный эффект: Клик
  playClickSound() {
    if (this.isMuted) return;
    if (!this.initContext()) return;

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

  // Интерфейсный эффект: Открытие модального окна (Chime)
  playChimeSound() {
    if (this.isMuted) return;
    if (!this.initContext()) return;

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

  // Интерфейсный эффект: Успешное действие (Форма)
  playSuccessSound() {
    if (this.isMuted) return;
    if (!this.initContext()) return;

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
