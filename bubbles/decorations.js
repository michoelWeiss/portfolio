export class Reflection {
    constructor(radius) {
        this.radius = radius;
    }
    draw(position, ctx) {
        const x = position.x - this.radius * 0.55;
        const y = position.y - this.radius * 0.6;
        ctx.beginPath();
        ctx.ellipse(x, y, 13, 5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(position.x, position.y - (this.radius / 3), 68, 45, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
    }
} 

export class Spark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6; 
        this.vy = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 4 + 2; 
        this.color =color;
        this.lifespan = 50; 
         this.alpha = 1; 
    }
    update(ctx) {
        this.draw(ctx);
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.01; 
        this.lifespan -= 2;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha; 
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'white'); 
        gradient.addColorStop(0.54, 'white'); 
        gradient.addColorStop(0.85, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.2)`); 
        gradient.addColorStop(0.91, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`); 
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 
    
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.lifespan <= 0 || this.alpha <= 0;
    }
}
export class Shadow {
    constructor(radius) {
        this.radius = radius - 3;
    }
    draw(position, ctx) {
        ctx.beginPath();
        ctx.arc(position.x + 13, position.y + 23, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(175, 175, 175, .3)';
        ctx.fill();
        ctx.closePath();
    }
}