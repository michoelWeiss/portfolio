import { Shadow, Reflection } from "./decorations.js";
export class Bubble {

    #collisionResolutionOn = false;
    #wallLocked = false;
    speedUp = false;

    static ID = 1;

    constructor({ position, color, velocity, colorPhase, mass, radius, width, height, ctx}) {
        this.id = Bubble.ID++;
        this.canvasWidth = width;
        this.canvasHeight = height
        this.ctx = ctx;
        this.position = position;
        this.velocity = velocity;
        this.mass = mass;
        this.radius = Math.sqrt(this.mass) * radius;
        this.rgb = color;
        this.border = {top: this.radius, bottom: this.canvasHeight - this.radius, left: this.radius, right: this.canvasWidth - this.radius};
        this.phase = {
            index: colorPhase,
            rgbIndex: [{ num: 0, increaseColor: true },
            { num: 1, increaseColor: true }, { num: 0, increaseColor: false },
            { num: 2, increaseColor: true }, { num: 1, increaseColor: false },
            { num: 0, increaseColor: true }, { num: 2, increaseColor: false },
            ]
        };

        this.shadow = new Shadow(this.radius, this.ctx);
        this.reflection = new Reflection(this.radius, this.ctx);

        this.colorIterator = this.colorIterator.bind(this);                              // binds ColorIterator to this instince
        setInterval(this.colorIterator, 50);                                             // Handles Changing Colors
        this.i = setInterval(() => { this.lockWall(); clearInterval(this.i) }, 1000);    // Handles Locking Wall after bubble generates
        setInterval(() => this.speedUp = !this.speedUp, (2000 * Math.random() + 3000));  // to speedup and slowdown 
    }

    setCanvasDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.border = {top: this.radius, bottom: this.canvasHeight - this.radius, left: this.radius, right: this.canvasWidth - this.radius};
    }

    draw() {                                   // Draw Bubble
        const { x, y } = this.position;
        this.ctx.beginPath();
        this.gradient = this.ctx.createRadialGradient(x, y, this.radius * 0.7, x, y, this.radius);
        this.gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        this.gradient.addColorStop(0.5, `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, 0.3)`);
        this.gradient.addColorStop(0.9, `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, 1)`);
        this.gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        this.ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.gradient;
        this.ctx.fill();
        this.ctx.closePath();
        // Draw Decorations 
        this.reflection.draw(this.position);
        this.shadow.draw(this.position);
    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.hitWall();
        (this.speedUp ? this.speedup() : this.slowdown());
        this.draw();
    }
    slowdown() {
        let speed = 2;
        if (this.velocity.x > speed || this.velocity.x < -speed) {
            this.velocity.x *= 0.99;
        }
        if (this.velocity.y > speed || this.velocity.y < -speed) {
            this.velocity.y *= 0.99;
        }
    }
    speedup() {
        let speed = 3;
        if (this.velocity.x < speed && this.velocity.x > -speed) {
            this.velocity.x *= 1.03;
        }
        if (this.velocity.y < speed && this.velocity.y > -speed) {
            this.velocity.y *= 1.03;
        }
    }

    colorIterator() {
        const rgbIndex = this.phase.rgbIndex[this.phase.index];
        if(rgbIndex.increaseColor){
            this.rgb[rgbIndex.num] += 10;
            if ( this.rgb[rgbIndex.num] >= 255) {
                this.rgb[rgbIndex.num] = 255;
                this.phase.index += 1;
            }
        }
        else{
            this.rgb[rgbIndex.num] -= 10;
            if (this.rgb[rgbIndex.num] <= 0) {
                this.rgb[rgbIndex.num] = 0;
                this.phase.index += 1;
            }
        }
        if(this.phase.index >= this.phase.rgbIndex.length)
            this.phase.index = 0;
    }

    hitWall() {
        if (this.position.x >  this.border.right) {
            this.position.x = this.border.right;
            this.velocity.x *= -1;
        }
        else if (this.position.x < this.border.left) {
            this.position.x = this.border.left;
            this.velocity.x *= -1;
        }
        if (this.#wallLocked) {
            if (this.position.y > this.border.bottom) {
                this.position.y = this.border.bottom;
                this.velocity.y *= -1;
            }
            else if (this.position.y < this.border.top) {
                this.position.y = this.border.top;
                this.velocity.y *= -1;
            }
        }
    }
    collisionDetector(other) {
        if (this === other) return true;

        const xdiff = this.position.x - other.position.x;
        const ydiff = this.position.y - other.position.y;
        const distance = Math.sqrt(xdiff * xdiff + ydiff * ydiff); // Finds distance from center of circle A to B
        if (distance <= this.radius + other.radius) {
            if (this.isUnlocked() && other.isUnlocked()) {
                this.collisionResolution(other, distance);
            }
            return false;
        }
        return true;
    }
    collisionResolution(other) {
        let mSum = this.mass + other.mass;

        // Calculate the impact vector (normalized)
        let impact = {
            x: other.position.x - this.position.x,
            y: other.position.y - this.position.y
        };
        let magnitude = Math.sqrt(impact.x ** 2 + impact.y ** 2);
        impact.x /= magnitude;
        impact.y /= magnitude;

        // Relative velocity
        let vDiff = {
            x: other.velocity.x - this.velocity.x,
            y: other.velocity.y - this.velocity.y
        };

        // Dot product of relative velocity and impact vector
        let dotProduct = vDiff.x * impact.x + vDiff.y * impact.y;

        // Skip if objects are moving away from each other
        if (dotProduct > 0) return;

        // Calculate impulse scalar
        let impulse = (2 * dotProduct) / mSum;

        // Update velocities
        this.velocity.x += (impulse * other.mass * impact.x);
        this.velocity.y += (impulse * other.mass * impact.y);

        other.velocity.x -= (impulse * this.mass * impact.x);
        other.velocity.y -= (impulse * this.mass * impact.y);
    }
    unlock() {
        this.#collisionResolutionOn = true;
    }
    isUnlocked() {
        return this.#collisionResolutionOn;
    }
    lockWall() {
        this.#wallLocked = true;
    }
    isWallLocked() {
        return this.#wallLocked;
    }
}