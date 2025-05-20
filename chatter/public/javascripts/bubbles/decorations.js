export class Reflection {
    constructor(radius, ctx) {
        this.radius = radius;
        this.ctx = ctx;
    }
    draw(position) {
        const x = position.x - this.radius * 0.55;
        const y = position.y - this.radius * 0.6;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 13, 5, 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(position.x, position.y - (this.radius / 3), 68, 45, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fill();
    }
}

export class Spark {
    constructor(x, y, color, ctx) {
        this.x = x;
        this.y = y;
        this.velocity = {x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5)};
        this.size = Math.random() * 4 + 2;
        this.color = color;
        this.lifespan = 50;
        this.alpha = 1;
        this.ctx = ctx;
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
        this.lifespan -= 2;
        return this.isDead();
    }
    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.alpha;
        const gradient = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.54, 'white');
        gradient.addColorStop(0.85, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.2)`);
        gradient.addColorStop(0.91, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.restore();
    }

    isDead() {
        return this.lifespan <= 0 || this.alpha <= 0;
    }
}
export class Shadow {
    constructor(radius, ctx) {
        this.radius = radius - 3;
        this.ctx = ctx;
    }
    draw(position) {
        this.ctx.beginPath();
        this.ctx.arc(position.x + 13, position.y + 23, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(175, 175, 175, .3)';
        this.ctx.fill();
        this.ctx.closePath();
    }
}