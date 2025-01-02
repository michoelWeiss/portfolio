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
        this.vx = (Math.random() - 0.5) * 6; // Random velocity
        this.vy = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 4 + 2; // Random size
        this.color =color;
        this.lifespan = 50; // Frames
         this.alpha = 1; // Opacity
    }

    update(ctx) {
        this.draw(ctx);
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.01; // Fade out
        this.lifespan -= 2;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha; // Apply fading

        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'white'); // Center is white
        gradient.addColorStop(0.54, 'white'); // Center is white
        gradient.addColorStop(0.85, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.2)`); // Almost at the edge, still white
        gradient.addColorStop(0.91, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`); // Thin color ring
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fully transparent beyond the edge
    
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;//;'white';//`rgb(${this.color.red}, ${this.color.green}, ${this.color.blue})`;
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

export class Wind{
    constructor(){
        this.wind = { x: 0, y: 0 };
        this.windChangeSpeed = 0.01;
        this.windStrength = 0.1;
        this.windAngle = 0;
    }
    updateWind(){
        this.windAngle += this.windChangeSpeed;
        if (this.windAngle > Math.PI * 2) this.windAngle -= Math.PI * 2;
        let x = Math.cos(this.windAngle) * this.windStrength;
        let y = Math.sin(this.windAngle) * this.windStrength;
        this.wind.x = ( x > 0 ? Math.ceil(x) : Math.floor(x));
        this.wind.y = ( y > 0 ? Math.ceil(y) : Math.floor(y));
    }
    newBreeze(initialAngle = 0) {
        this.windAngle = initialAngle;
        this.updateWind();
    }
    getWindState() {
        return {
            wind: this.wind,
            windChangeSpeed: this.windChangeSpeed,
            windStrength: this.windStrength,
            windAngle: this.windAngle
        };
    }
}