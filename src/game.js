/**
 * Curve Climb — runner on a literal bonding bar.
 * Live mode: world length & start position follow on-chain graduation %.
 */

const GRAVITY = 2200;
const RUN_SPEED_BASE = 280;
const JUMP_VEL = -620;
const SNIPE_WINDOW = 20;
/** Must run at least this long / far before the in-game gate counts as a win */
const MIN_GATE_SECONDS = 3;
const MIN_GATE_DISTANCE = 380;

export class CurveClimbGame {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ progress: number, graduated: boolean, baseTaxBps: number }} curve
   */
  constructor(canvas, curve) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.curve = { ...curve };
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = 960;
    this.height = 540;
    this.resize();

    this.state = "idle";
    this.time = 0;
    this.runTime = 0;
    this.distance = 0;
    this.orbs = 0;
    this.momentum = 100;

    this.arcadeReplay = curve.graduated || curve.progress >= 98;
    this.startProgress = this.arcadeReplay
      ? 0
      : Math.max(0, Math.min(curve.progress, 85));
    this.goalProgress = 100;

    const span = (this.goalProgress - this.startProgress) / 100;
    this.worldLength = 2400 + span * 5200;
    this.spawnX = (this.startProgress / 100) * this.worldLength + 40;

    this.player = { x: 80, y: 0, vy: 0, w: 28, h: 36, grounded: false, jumps: 0 };
    this.platforms = [];
    this.particles = [];
    this.taxGhosts = [];
    this.shake = 0;

    this._buildLevel();
    this.player.y = this._groundAt(this.player.x) - this.player.h;
  }

  resize() {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _groundAt(x) {
    const base = this.height - 88;
    const wave = Math.sin(x * 0.008) * 12 + Math.sin(x * 0.021) * 6;
    return base + wave;
  }

  _buildLevel() {
    const startX = (this.startProgress / 100) * this.worldLength;
    this.player.x = startX + 40;

    const count = 28 + Math.floor((this.goalProgress - this.startProgress) * 0.35);
    let x = startX + 120;
    for (let i = 0; i < count; i++) {
      const gap = 90 + Math.random() * 110;
      const w = 70 + Math.random() * 120;
      const lift = 40 + Math.random() * 90;
      const kindRoll = Math.random();
      const kind = kindRoll < 0.12 ? "sell" : kindRoll < 0.22 ? "buy" : "neutral";
      this.platforms.push({
        x,
        y: this._groundAt(x) - lift,
        w,
        h: 14,
        kind,
      });
      x += gap + w;
      if (x > this.worldLength - 200) break;
    }

    this.platforms.push({
      x: this.worldLength - 160,
      y: this._groundAt(this.worldLength - 120) - 20,
      w: 140,
      h: 18,
      kind: "gate",
    });

    for (let i = 0; i < 18; i++) {
      this.taxGhosts.push({
        x: startX + 200 + i * (180 + Math.random() * 120),
        y: 120 + Math.random() * 180,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  start() {
    this.state = "playing";
    this.time = 0;
    this.runTime = 0;
    this.distance = 0;
    this.orbs = 0;
    this.momentum = 100;
    const startX = (this.startProgress / 100) * this.worldLength + 40;
    this.player.x = startX;
    this.player.y = this._groundAt(this.player.x) - this.player.h;
    this.player.vy = 0;
    this.player.grounded = true;
  }

  jump() {
    if (this.state !== "playing") return;
    if (!this.player.grounded) return;
    this.player.vy = JUMP_VEL;
    this.player.grounded = false;
    this.player.jumps++;
    this.momentum = Math.max(0, this.momentum - 2);
  }

  updateCurve(curve) {
    this.curve = { ...curve };
  }

  /** @returns {'playing'|'won'|'lost'|typeof this.state} */
  tick(dt) {
    if (this.state !== "playing") return this.state;

    this.time += dt;
    this.runTime += dt;

    const snipeActive = this.runTime < SNIPE_WINDOW;
    const speed =
      RUN_SPEED_BASE * (0.85 + this.momentum / 200) * (snipeActive ? 0.72 : 1);

    this.player.x += speed * dt;
    this.distance = this.player.x - (this.startProgress / 100) * this.worldLength;

    this.player.vy += GRAVITY * dt;
    this.player.y += this.player.vy * dt;

    const floor = this._groundAt(this.player.x);
    this.player.grounded = false;

    if (this.player.y + this.player.h >= floor) {
      this.player.y = floor - this.player.h;
      this.player.vy = 0;
      this.player.grounded = true;
    }

    for (const p of this.platforms) {
      if (
        this.player.x + this.player.w > p.x &&
        this.player.x < p.x + p.w &&
        this.player.y + this.player.h >= p.y &&
        this.player.y + this.player.h <= p.y + p.h + 18 &&
        this.player.vy >= 0
      ) {
        this.player.y = p.y - this.player.h;
        this.player.vy = 0;
        this.player.grounded = true;
        if (p.kind === "buy") {
          this.momentum = Math.min(100, this.momentum + 8);
          this._burst(p.x + p.w / 2, p.y, "#6ee7a0");
        }
        if (p.kind === "sell") {
          this.momentum = Math.max(15, this.momentum - 18);
          this.shake = 0.25;
          this._burst(p.x + p.w / 2, p.y, "#f87171");
        }
        if (p.kind === "gate") {
          if (this.runTime >= MIN_GATE_SECONDS && this.distance >= MIN_GATE_DISTANCE) {
            this.state = "won";
            return this.state;
          }
        }
      }
    }

    if (snipeActive) {
      for (const g of this.taxGhosts) {
        const gx = g.x + Math.sin(this.time * 2 + g.phase) * 30;
        const gy = g.y + Math.cos(this.time * 1.5 + g.phase) * 20;
        if (
          Math.abs(this.player.x + this.player.w / 2 - gx) < 36 &&
          Math.abs(this.player.y + this.player.h / 2 - gy) < 36
        ) {
          this.momentum = Math.max(5, this.momentum - 40 * dt);
          this.shake = 0.35;
        }
      }
    }

    if (this.player.y > this.height + 80) {
      this.state = "lost";
      return this.state;
    }

    if (this.momentum <= 8 && this.player.grounded) {
      this.state = "lost";
      return this.state;
    }

    this.momentum = Math.min(100, this.momentum + 6 * dt);

    for (const part of this.particles) {
      part.life -= dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += 400 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.shake > 0) this.shake -= dt;

    return this.state;
  }

  _burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 180,
        life: 0.35 + Math.random() * 0.2,
        color,
      });
    }
  }

  draw() {
    const ctx = this.ctx;
    const camX = this.player.x - this.width * 0.28;
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 12 * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, "#0c0a14");
    grad.addColorStop(1, "#14101f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    this._drawProgressBar(ctx);
    this._drawWorld(ctx, camX);
    this._drawPlayer(ctx, camX);
    this._drawHUD(ctx);

    ctx.restore();
  }

  _drawProgressBar(ctx) {
    const pad = 24;
    const w = this.width - pad * 2;
    const h = 22;
    const y = 18;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(pad, y, w, h);

    const live = this.curve.progress / 100;
    const runProg =
      this.startProgress / 100 +
      (this.distance / this.worldLength) * (1 - this.startProgress / 100);

    ctx.fillStyle = "rgba(167,139,250,0.35)";
    ctx.fillRect(pad, y, w * Math.min(1, live), h);

    ctx.fillStyle = "#facc15";
    ctx.fillRect(pad, y, w * Math.min(1, runProg), h * 0.55);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(pad, y, w, h);

    ctx.fillStyle = "#e9e4ff";
    ctx.font = "600 13px system-ui, sans-serif";
    const liveLabel = this.curve.graduated
      ? `Live: graduated on vibe/vibe · ${this.arcadeReplay ? "Arcade replay" : "Run"}`
      : `Bonding ${this.curve.progress.toFixed(1)}% → graduation`;
    ctx.fillText(liveLabel, pad, y + h + 18);

    if (this.runTime < SNIPE_WINDOW) {
      ctx.fillStyle = "#fca5a5";
      ctx.font = "700 12px system-ui";
      ctx.fillText("SNIPE TAX ZONE (first 20s on curve)", pad + 240, y + h + 18);
    }
  }

  _drawWorld(ctx, camX) {
    ctx.save();
    ctx.translate(-camX, 0);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < this.worldLength; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    ctx.beginPath();
    for (let x = 0; x <= this.worldLength; x += 8) {
      const gy = this._groundAt(x);
      if (x === 0) ctx.moveTo(x, gy);
      else ctx.lineTo(x, gy);
    }
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.stroke();

    for (const p of this.platforms) {
      let fill = "#334155";
      if (p.kind === "buy") fill = "#166534";
      if (p.kind === "sell") fill = "#7f1d1d";
      if (p.kind === "gate") fill = "#854d0e";
      ctx.fillStyle = fill;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      if (p.kind === "gate") {
        ctx.fillStyle = "#fde047";
        ctx.font = "700 14px system-ui";
        ctx.fillText("GRADUATE", p.x + 18, p.y - 8);
      }
    }

    if (this.runTime < SNIPE_WINDOW) {
      for (const g of this.taxGhosts) {
        const gx = g.x + Math.sin(this.time * 2 + g.phase) * 30;
        const gy = g.y + Math.cos(this.time * 1.5 + g.phase) * 20;
        ctx.fillStyle = "rgba(248,113,113,0.85)";
        ctx.beginPath();
        ctx.arc(gx, gy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 9px system-ui";
        ctx.fillText("99%", gx - 10, gy + 3);
      }
    }

    for (const part of this.particles) {
      ctx.globalAlpha = part.life;
      ctx.fillStyle = part.color;
      ctx.fillRect(part.x, part.y, 4, 4);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  _drawPlayer(ctx, camX) {
    const x = this.player.x - camX;
    const y = this.player.y;
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(x, y, this.player.w, this.player.h);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(x + 6, y + 8, 8, 8);
    ctx.fillRect(x + 16, y + 8, 8, 8);
  }

  _drawHUD(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(this.width - 200, this.height - 56, 176, 40);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 13px system-ui";
    ctx.fillText(`Momentum ${Math.round(this.momentum)}%`, this.width - 188, this.height - 30);
  }

  getShareText(tokenAddress, ticker = "GRUN") {
    const pct = this.curve.progress.toFixed(1);
    const mode = this.curve.graduated ? "graduated on chain" : `${pct}% on curve (game run cleared)`;
    return `Cleared the gate in Curve Climb — $${ticker} ${mode}\nPlay: https://curve-climb.vercel.app/?token=${tokenAddress}\nTrade: https://testnet.vibevibe.fun/token/${tokenAddress}\n@vibevibefun #GRUN #curveclimb`;
  }
}
