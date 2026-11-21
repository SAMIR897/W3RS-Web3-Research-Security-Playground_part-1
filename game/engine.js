/**
 * ==============================================================================
 * w3rs Game Engine - 2D Pixel Canvas Runtime
 * ==============================================================================
 * High-performance 60 FPS Canvas Game Loop, Screen-Shake, Particle FX,
 * Floating Combat Text, and State Machine.
 */

class W3RSEngine {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        
        // Logical Resolution
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Boss State
        this.maxHp = 1000;
        this.currentHp = 1000;
        this.targetHp = 1000;
        this.isBossDead = false;

        // Visual FX
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.particles = [];
        this.floatingTexts = [];

        // Animation Clocks
        this.lastTime = performance.now();
        this.globalTick = 0;

        // Entities Animation States
        this.heroState = "idle"; // "idle" | "attacking"
        this.heroAttackTimer = 0;
        this.bossState = "idle"; // "idle" | "block" | "hurt" | "dead"
        this.bossHurtTimer = 0;

        // DOM Elements
        this.hpFill = document.getElementById("healthBarFill");
        this.hpText = document.getElementById("healthBarText");
        this.statusDot = document.getElementById("statusDot");
        this.statusText = document.getElementById("statusText");
        this.blockHeightEl = document.getElementById("blockHeight");
        this.logBody = document.getElementById("logBody");
        this.bannerOverlay = document.getElementById("bannerOverlay");

        this.initEventListeners();
        this.initBridge();
        this.startLoop();
    }

    initBridge() {
        if (window.chainBridge) {
            window.chainBridge.onStatusChange((status) => {
                if (status.online) {
                    this.statusDot.className = "status-dot online";
                    this.statusText.textContent = "Anvil EVM Node: Online";
                    this.blockHeightEl.textContent = `[Block: #${status.block}]`;
                } else {
                    this.statusDot.className = "status-dot offline";
                    this.statusText.textContent = "Node Standby (Offline Mode)";
                    this.blockHeightEl.textContent = "[Block: Standby]";
                }
            });
            window.chainBridge.init();
        }
    }

    initEventListeners() {
        // Direct Attack (Fails due to tx.origin == msg.sender)
        document.getElementById("btnDirectAttack").addEventListener("click", () => {
            if (this.isBossDead) return;
            this.triggerDirectAttack();
        });

        // Trigger Exploit (Succeeds via Smart Contract Proxy)
        document.getElementById("btnExploit").addEventListener("click", () => {
            if (this.isBossDead) return;
            this.triggerExploit();
        });

        // Restart
        document.getElementById("btnRestart").addEventListener("click", () => {
            this.resetGame();
        });
    }

    addLog(text, type = "system") {
        const line = document.createElement("div");
        line.className = `log-line ${type}`;
        line.textContent = `> ${text}`;
        this.logBody.appendChild(line);
        this.logBody.scrollTop = this.logBody.scrollHeight;
    }

    triggerDirectAttack() {
        this.heroState = "attacking";
        this.heroAttackTimer = 20;

        setTimeout(() => {
            this.bossState = "block";
            this.bossHurtTimer = 25;
            this.triggerShake(4, 8);
            
            this.spawnFloatingText("BLOCKED! (tx.origin == msg.sender)", this.width * 0.65, 140, "#f87171");
            this.spawnParticles(this.width * 0.65, 230, 8, "#fbbf24");

            this.addLog("Direct wallet call initiated: attack(100)", "warn");
            this.addLog("[REVERT] _isOffBalance() returned false. Creature blocked your attack!", "fail");
        }, 150);
    }

    triggerExploit() {
        this.heroState = "attacking";
        this.heroAttackTimer = 25;

        setTimeout(() => {
            this.bossState = "hurt";
            this.bossHurtTimer = 40;
            this.triggerShake(12, 24);

            this.targetHp = 0;
            this.spawnFloatingText("CRITICAL EXPLOIT! -1000 HP", this.width * 0.65, 120, "#4ade80");
            this.spawnParticles(this.width * 0.65, 220, 30, "#ef4444");

            this.addLog("Exploit Contract deployed: AttackProxy.sol", "exploit");
            this.addLog("[SUCCESS] tx.origin (Wallet) != msg.sender (Contract)! Boss Off-Balance!", "exploit");
            this.addLog("Creature defeated! lifePoints dropped to 0.", "exploit");

            setTimeout(() => {
                this.bossState = "dead";
                this.isBossDead = true;
                this.bannerOverlay.classList.remove("hidden");
                this.addLog("FLAG CAPTURED: FLAG{w3rs_tx_origin_bypass_complete}", "exploit");
            }, 600);
        }, 200);
    }

    resetGame() {
        this.currentHp = this.maxHp;
        this.targetHp = this.maxHp;
        this.isBossDead = false;
        this.bossState = "idle";
        this.heroState = "idle";
        this.bannerOverlay.classList.add("hidden");
        this.updateHpBar();
        this.addLog("Battle state reset. Boss health restored to 1000 HP.", "system");
    }

    triggerShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    spawnFloatingText(text, x, y, color) {
        this.floatingTexts.push({
            text, x, y, color,
            alpha: 1.0,
            vy: -1.2,
            life: 60
        });
    }

    spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.0;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                size: 2 + Math.random() * 3,
                life: 30 + Math.random() * 20,
                maxLife: 50
            });
        }
    }

    updateHpBar() {
        // Smooth health lerp
        if (this.currentHp !== this.targetHp) {
            const diff = this.targetHp - this.currentHp;
            if (Math.abs(diff) < 2) {
                this.currentHp = this.targetHp;
            } else {
                this.currentHp += diff * 0.15;
            }
        }

        const pct = Math.max(0, (this.currentHp / this.maxHp) * 100);
        this.hpFill.style.width = `${pct}%`;
        this.hpText.textContent = `${Math.round(this.currentHp)} / ${this.maxHp} HP`;
    }

    startLoop() {
        const loop = (time) => {
            const dt = (time - this.lastTime) / 1000;
            this.lastTime = time;
            this.globalTick++;

            this.update(dt);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update() {
        this.updateHpBar();

        // Shake Decay
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
        }

        // Entity State Clocks
        if (this.heroAttackTimer > 0) {
            this.heroAttackTimer--;
            if (this.heroAttackTimer === 0) this.heroState = "idle";
        }

        if (this.bossHurtTimer > 0) {
            this.bossHurtTimer--;
            if (this.bossHurtTimer === 0 && !this.isBossDead) this.bossState = "idle";
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Floating Text
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life--;
            ft.alpha = ft.life / 60;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.save();

        // Screen Shake Transform
        if (this.shakeTimer > 0) {
            const rx = (Math.random() - 0.5) * this.shakeIntensity;
            const ry = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(rx, ry);
        }

        // 1. Draw Forest Background
        this.drawBackground(ctx);

        // 2. Draw Heroes (Left)
        this.drawHeroes(ctx);

        // 3. Draw Boss (Right)
        this.drawBoss(ctx);

        // 4. Draw Particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }

        // 5. Draw Floating Text
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = "bold 13px 'Courier New', monospace";
            ctx.fillStyle = "#000000";
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        ctx.restore();
    }

    drawBackground(ctx) {
        // Deep misty background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, "#192c2b");
        bgGrad.addColorStop(0.6, "#22423c");
        bgGrad.addColorStop(1, "#12201d");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Ancient Stone Arch Ruins (Left & Right)
        ctx.fillStyle = "#2a4d46";
        // Left Arch
        ctx.fillRect(80, 140, 24, 180);
        ctx.fillRect(150, 160, 24, 160);
        ctx.fillRect(70, 130, 114, 20);

        // Right Tower Pillars
        ctx.fillStyle = "#2d524a";
        ctx.fillRect(660, 110, 36, 210);
        ctx.fillRect(645, 95, 66, 18);

        // Ancient Trees
        ctx.fillStyle = "#1e3732";
        ctx.beginPath();
        ctx.arc(260, 180, 90, 0, Math.PI * 2);
        ctx.arc(520, 160, 110, 0, Math.PI * 2);
        ctx.fill();

        // Stone Bridge Platform
        ctx.fillStyle = "#162522";
        ctx.fillRect(0, 310, this.width, 110);
        ctx.fillStyle = "#2b4a43";
        ctx.fillRect(0, 310, this.width, 14);

        // Stone Tiles Texture
        ctx.fillStyle = "#1d322d";
        for (let x = 0; x < this.width; x += 40) {
            ctx.fillRect(x, 324, 38, 22);
            ctx.fillRect(x + 20, 348, 38, 22);
        }
    }

    drawHeroes(ctx) {
        ctx.save();
        // Breathing bob
        const bob = Math.sin(this.globalTick * 0.08) * 2;
        let lungeX = 0;
        if (this.heroState === "attacking") {
            lungeX = 45;
        }

        const baseX = 90 + lungeX;
        const baseY = 240 + bob;

        // Knight (Warrior)
        ctx.fillStyle = "#3b82f6"; // armor blue
        ctx.fillRect(baseX, baseY, 22, 42);
        ctx.fillStyle = "#e2e8f0"; // helmet
        ctx.fillRect(baseX + 2, baseY - 16, 18, 16);
        ctx.fillStyle = "#0f172a"; // visor
        ctx.fillRect(baseX + 6, baseY - 10, 10, 4);

        // Knight Sword
        ctx.fillStyle = "#cbd5e1";
        if (this.heroState === "attacking") {
            ctx.fillRect(baseX + 22, baseY + 6, 42, 6); // thrusting
        } else {
            ctx.fillRect(baseX - 8, baseY - 8, 6, 44); // resting
        }

        // Rogue (Assassin behind Knight)
        ctx.fillStyle = "#9333ea"; // tunic
        ctx.fillRect(baseX - 35, baseY + 4, 18, 38);
        ctx.fillStyle = "#f43f5e"; // hair/cloak
        ctx.fillRect(baseX - 38, baseY - 14, 20, 16);

        // Rogue Daggers
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(baseX - 16, baseY + 18, 14, 4);

        ctx.restore();
    }

    drawBoss(ctx) {
        if (this.isBossDead) {
            // Defeated / Fallen Boss Rubble
            ctx.fillStyle = "#334155";
            ctx.fillRect(520, 285, 110, 30);
            ctx.fillRect(540, 270, 70, 20);
            return;
        }

        ctx.save();
        const bob = Math.sin(this.globalTick * 0.06) * 3;
        let bossX = 510;
        let bossY = 160 + bob;

        if (this.bossState === "hurt") {
            bossX += (Math.random() - 0.5) * 8;
        }

        // Boss Body (Stone Golem)
        ctx.fillStyle = (this.bossState === "hurt") ? "#ffffff" : "#65a30d"; // flash white on hurt, else mossy green
        ctx.fillRect(bossX, bossY, 90, 110);

        // Shoulder Pads & Plates
        ctx.fillStyle = (this.bossState === "hurt") ? "#fecaca" : "#4d7c0f";
        ctx.fillRect(bossX - 16, bossY + 10, 24, 45);
        ctx.fillRect(bossX + 82, bossY + 10, 24, 45);

        // Boss Head & Golden Horn
        ctx.fillStyle = (this.bossState === "hurt") ? "#ffffff" : "#3f6212";
        ctx.fillRect(bossX + 20, bossY - 26, 48, 30);
        // Golden Horn
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.moveTo(bossX + 44, bossY - 26);
        ctx.lineTo(bossX + 32, bossY - 56);
        ctx.lineTo(bossX + 56, bossY - 26);
        ctx.fill();

        // Glowing Red Eyes
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(bossX + 28, bossY - 14, 8, 6);
        ctx.fillRect(bossX + 48, bossY - 14, 8, 6);

        // Giant Stone Hammer
        ctx.fillStyle = "#1e293b";
        if (this.bossState === "block") {
            // Raised defensively
            ctx.fillRect(bossX - 40, bossY + 20, 32, 65);
            ctx.fillRect(bossX - 25, bossY + 80, 8, 40);
        } else {
            // Resting on ground
            ctx.fillRect(bossX - 25, bossY + 30, 8, 90);
            ctx.fillRect(bossX - 45, bossY + 95, 46, 30);
        }

        ctx.restore();
    }
}

// Boot Engine on DOM Load
window.addEventListener("DOMContentLoaded", () => {
    window.gameEngine = new W3RSEngine();
});
