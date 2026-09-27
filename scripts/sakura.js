/**
 * ქართული ვიზუალური ნოველების პორტალი - Sakura Petals & Stardust Canvas Engine
 */

class SakuraEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.petals = [];
    this.sparkles = [];
    this.maxPetals = 45;
    this.maxSparkles = 25;
    this.animationId = null;
    this.isEnabled = true;
    this.dpr = window.devicePixelRatio || 1;
    
    this.mouse = { x: -1000, y: -1000, radius: 100 };
    this.resizeTimeout = null;
    
    this.init();
  }

  init() {
    this.resize();

    // Оптимизированный resize с дебаунсом
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.resize(), 100);
    });
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else if (this.isEnabled) {
        this.start();
      }
    });

    // Инициализация лепестков
    for (let i = 0; i < this.maxPetals; i++) {
      this.petals.push(this.createPetal(true));
    }

    // Инициализация блесток
    for (let i = 0; i < this.maxSparkles; i++) {
      this.sparkles.push(this.createSparkle(true));
    }

    this.start();
  }

  // Поддержка четких Retina / High-DPI экранов
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
  }

  createPetal(randomY = false) {
    const size = Math.random() * 12 + 8;
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -20,
      size: size,
      speedX: Math.random() * 1.5 - 0.2 + 0.5,
      speedY: Math.random() * 1.2 + 0.8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      opacity: Math.random() * 0.4 + 0.4,
      color: Math.random() > 0.3 ? '#ff9ebb' : '#f472b6',
      shade: Math.random() > 0.5 ? '#fda4af' : '#fb7185'
    };
  }

  createSparkle(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : Math.random() * this.height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.7 + 0.2,
      pulse: Math.random() * Math.PI,
      pulseSpeed: Math.random() * 0.05 + 0.02
    };
  }

  update() {
    // Обновляем лепестки
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.wobble += p.wobbleSpeed;
      p.rotation += p.rotationSpeed;
      
      p.x += p.speedX + Math.sin(p.wobble) * 1.2;
      p.y += p.speedY;

      // Отталкивание от мыши (Защищено от NaN / деления на ноль)
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius && dist > 0.1) {
        const force = (1 - dist / this.mouse.radius) * 3;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Пересоздание при выходе за границы
      if (p.y > this.height + 20 || p.x > this.width + 20 || p.x < -20) {
        this.petals[i] = this.createPetal(false);
      }
    }

    // Обновляем блестки
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      s.pulse += s.pulseSpeed;
      s.y -= s.speedY;
      if (s.y < 0) {
        s.y = this.height;
        s.x = Math.random() * this.width;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Рисуем блестки (Фоновые звездочки)
    for (let s of this.sparkles) {
      const op = Math.sin(s.pulse) * 0.3 + s.opacity;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(147, 197, 253, ${Math.max(0, op)})`;
      this.ctx.fill();
      this.ctx.restore();
    }

    // Рисуем лепестки сакуры
    for (let p of this.petals) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      
      // Защита от нулевого масштаба 3D-переворота
      const scaleX = Math.cos(p.wobble);
      this.ctx.scale(Math.abs(scaleX) < 0.01 ? 0.01 : scaleX, 1);

      this.ctx.beginPath();
      this.ctx.moveTo(0, -p.size);
      this.ctx.bezierCurveTo(p.size / 2, -p.size, p.size, -p.size / 3, p.size / 2, p.size);
      this.ctx.bezierCurveTo(0, p.size * 0.7, -p.size / 2, p.size, -p.size / 2, p.size / 3);
      this.ctx.bezierCurveTo(-p.size, -p.size / 3, -p.size / 2, -p.size, 0, -p.size);

      const grad = this.ctx.createRadialGradient(0, 0, 1, 0, 0, p.size);
      grad.addColorStop(0, p.shade);
      grad.addColorStop(1, p.color);

      this.ctx.fillStyle = grad;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  loop() {
    if (!this.isEnabled) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.loop());
  }

  start() {
    if (!this.animationId) {
      this.loop();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.start();
    } else {
      this.stop();
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
    return this.isEnabled;
  }
}

window.SakuraEngine = SakuraEngine;
