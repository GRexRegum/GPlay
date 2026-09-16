/**
 * საკურას ფურცლებისა და ნაწილაკების Canvas ეფექტის ძრავი
 * Sakura Petals & Stardust Canvas Engine
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
    
    this.mouse = { x: -1000, y: -1000, radius: 100 };
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
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

    // ფურცლების ინიციალიზაცია
    for (let i = 0; i < this.maxPetals; i++) {
      this.petals.push(this.createPetal(true));
    }

    // ვარსკვლავური ნაპერწკლების ინიციალიზაცია
    for (let i = 0; i < this.maxSparkles; i++) {
      this.sparkles.push(this.createSparkle(true));
    }

    this.start();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
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
    // განვაახლოთ ფურცლები
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.wobble += p.wobbleSpeed;
      p.rotation += p.rotationSpeed;
      
      p.x += p.speedX + Math.sin(p.wobble) * 1.2;
      p.y += p.speedY;

      // მაუსთან ინტერაქცია (ფურცლები ნაზად შორდებიან კურსორს)
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius) {
        const force = (1 - dist / this.mouse.radius) * 3;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // ეკრანიდან გასვლისას დაბრუნება
      if (p.y > this.height + 20 || p.x > this.width + 20 || p.x < -20) {
        this.petals[i] = this.createPetal(false);
      }
    }

    // განვაახლოთ ნაპერწკლები
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

    // დავხატოთ ნაპერწკლები (ფონის ვარსკვლავები)
    for (let s of this.sparkles) {
      const op = Math.sin(s.pulse) * 0.3 + s.opacity;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(147, 197, 253, ${Math.max(0, op)})`;
      this.ctx.shadowColor = '#60a5fa';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.restore();
    }

    // დავხატოთ საკურას ფურცლები
    for (let p of this.petals) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.scale(Math.cos(p.wobble), 1); // 3D გადატრიალების იმიტაცია

      this.ctx.beginPath();
      // ფურცლის ფორმის ხატვა ბეზიეს მრუდებით
      this.ctx.moveTo(0, -p.size);
      this.ctx.bezierCurveTo(p.size / 2, -p.size, p.size, -p.size / 3, p.size / 2, p.size);
      this.ctx.bezierCurveTo(0, p.size * 0.7, -p.size / 2, p.size, -p.size / 2, p.size / 3);
      this.ctx.bezierCurveTo(-p.size, -p.size / 3, -p.size / 2, -p.size, 0, -p.size);

      const grad = this.ctx.createRadialGradient(0, 0, 1, 0, 0, p.size);
      grad.addColorStop(0, p.shade);
      grad.addColorStop(1, p.color);

      this.ctx.fillStyle = grad;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.shadowColor = '#fb7185';
      this.ctx.shadowBlur = 4;
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
