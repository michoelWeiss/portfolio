import { Shadow, Reflection } from "./decorations.js";
export class Bubble {

    #collisionResolutionOn = false;
    #wallLocked = false;
    speedUp = false;

    static canvasWidth = 800;  // defalt 
    static canvasHeight = 600;
    static ID = 1;

    constructor({ position, color, velocity, colorPhase }) {
        this.id = Bubble.ID++;
        this.position = position;
        this.velocity = velocity;
        this.acceleration = { x: 0, y: 0 };
        this.mass = 5;
        this.radius = Math.sqrt(this.mass) * 35;
        this.rgb = color;
        this.phase = colorPhase;   // is the flag for the colorchanger

        this.shadow = new Shadow(this.radius);
        this.reflection = new Reflection(this.radius);

        this.colorIterator = this.colorIterator.bind(this);                              // binds ColorIterator to this instince
        setInterval(this.colorIterator, 50);                                             // Handles Changing Colors
        this.i = setInterval(() => { this.lockWall(); clearInterval(this.i) }, 2500);    // Handles Locking Wall after bubble generates
        setInterval(() => this.speedUp = !this.speedUp, (2000 * Math.random() + 3000));  // to speedup and slowdown 
    }

    static setCanvasDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    draw(ctx) {                                   // Draw Bubble
        const { x, y } = this.position;
        ctx.beginPath();
        this.gradient = ctx.createRadialGradient(x, y, this.radius * 0.7, x, y, this.radius);
        this.gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        this.gradient.addColorStop(0.5, `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, 0.3)`);
        this.gradient.addColorStop(0.9, `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, 1)`);
        this.gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.gradient;
        ctx.fill();
        ctx.closePath();
        // Draw Decorations 
        this.reflection.draw(this.position, ctx);
        this.shadow.draw(this.position, ctx);
    }
    update(ctx) {
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;


        this.hitWall();
        (this.speedUp ? this.speedup() : this.slowdown());
        this.draw(ctx);
    }
    slowdown(){
        let speed = 2;
        if( this.velocity.x > speed || this.velocity.x < -speed){
            this.velocity.x *= 0.99;
        }
        if( this.velocity.y > speed || this.velocity.y < -speed){
            this.velocity.y *= 0.99;
        }
    }
    speedup(){
        let speed = 3;
        if( this.velocity.x < speed && this.velocity.x > -speed){
            this.velocity.x *= 1.03;
        }
        if( this.velocity.y < speed && this.velocity.y > -speed){
            this.velocity.y*= 1.03;
        }
    }

    colorIterator() {

        if (this.phase === 0) {
            this.rgb[0] += 10;
            if (this.rgb[0] >= 255) {
                this.rgb[0] = 255;
                this.phase = 1;
            }
        } else if (this.phase === 1) {
            this.rgb[1] += 10;
            if (this.rgb[1] >= 255) {
                this.rgb[1] = 255;
                this.phase = 2;
            }
        } else if (this.phase === 2) {
            this.rgb[0] -= 10;
            if (this.rgb[0] <= 0) {
                this.rgb[0] = 0;
                this.phase = 3;
            }
        } else if (this.phase === 3) {
            this.rgb[2] += 10;
            if (this.rgb[2] >= 255) {
                this.rgb[2] = 255;
                this.phase = 4;
            }
        } else if (this.phase === 4) {
            this.rgb[1] -= 10;
            if (this.rgb[1] <= 0) {
                this.rgb[1] = 0;
                this.phase = 5;
            }
        } else if (this.phase === 5) {
            this.rgb[0] += 10;
            if (this.rgb[0] >= 255) {
                this.rgb[0] = 255;
                this.phase = 6;
            }
        } else if (this.phase === 6) {
            this.rgb[2] -= 10;
            if (this.rgb[2] <= 0) {
                this.rgb[2] = 0;
                this.phase = 0;
            }
        }
    }

    hitWall() {
        if (this.position.x > Bubble.canvasWidth - this.radius) {
            this.position.x = Bubble.canvasWidth - this.radius;
            this.velocity.x *= -1;
        }
        else if (this.position.x < this.radius) {
            this.position.x = this.radius;
            this.velocity.x *= -1;
        }
        if (this.#wallLocked) {
            if (this.position.y > Bubble.canvasHeight - this.radius) {
                this.position.y = Bubble.canvasHeight - this.radius;
                this.velocity.y *= -1;
            }
            else if (this.position.y < this.radius) {
                this.position.y = this.radius;
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
            if (this.isUnlocked() && other.isUnlocked()){
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