import { Shadow, Reflection } from "./decorations.js";
import { HandleCollision } from './handleCollision.js';

export class Bubble {
    #collisionResolutionOn = false;
    #wallLocked = false;
    speedChange = 0.99;

    changeSpeed = () => {
        return [
            (velocity) => { // SlowDown
                if (velocity > 2 || velocity < -2) {
                    return velocity * this.speedChange;
                }
                return velocity;
            },
            (velocity) => { // SpeedUp
                if (velocity < 3 && velocity > -3) {
                    return velocity * this.speedChange;
                }
                return velocity;
            },
        ];
    };
    speedFunctions = this.changeSpeed();
    handleCollision = HandleCollision();

    constructor({ position, color, velocity, colorPhase, mass, radius, width, height, ctx }) {
        this.position = position;
        this.velocity = velocity;
        this.mass = mass;
        this.radius = Math.sqrt(this.mass) * radius;
        this.rgb = color;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.border = { top: this.radius, bottom: this.canvasHeight - this.radius, left: this.radius, right: this.canvasWidth - this.radius };
        this.ctx = ctx;

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

        this.colorIterator = this.colorIterator.bind(this);                             // Handles Changing Colors
        setInterval(this.colorIterator, 50);

        this.i = setInterval(() => { this.lockWall(); clearInterval(this.i) }, 1000);    // Handles Locking Wall after bubble generates

        setInterval(() => {                                                              // Handles speedup and slowdown 
            this.speedChange = this.speedChange > 1 ? 0.99 : 1.03;
        }, (2000 * Math.random() + 3000));
    }

    setCanvasDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.border = { top: this.radius, bottom: this.canvasHeight - this.radius, left: this.radius, right: this.canvasWidth - this.radius };
    }

    draw() {
        const { x, y } = this.position;
        this.ctx.beginPath();
        const gradient = this.ctx.createRadialGradient(x, y, this.radius * 0.7, x, y, this.radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(0.5, `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, 0.3)`);
        gradient.addColorStop(0.9, `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, 1)`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        this.ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.closePath();
        // Draw Decorations 
        this.reflection.draw(this.position);
        this.shadow.draw(this.position);
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.handleCollision.hitWall(this);
        if (this.speedChange > 1) {
            this.velocity.x = this.speedFunctions[1](this.velocity.x);
            this.velocity.y = this.speedFunctions[1](this.velocity.y);
        } else {
            this.velocity.x = this.speedFunctions[0](this.velocity.x);
            this.velocity.y = this.speedFunctions[0](this.velocity.y);
        }
        this.draw();
    }
    checkIfCollided(otherBubble) {
        return this.handleCollision.collisionDetector(this, otherBubble);
    }
    colorIterator() {
        const rgbIndex = this.phase.rgbIndex[this.phase.index];
        if (rgbIndex.increaseColor) {
            this.rgb[rgbIndex.num] += 10;
            if (this.rgb[rgbIndex.num] >= 255) {
                this.rgb[rgbIndex.num] = 255;
                this.phase.index += 1;
            }
        }
        else {
            this.rgb[rgbIndex.num] -= 10;
            if (this.rgb[rgbIndex.num] <= 0) {
                this.rgb[rgbIndex.num] = 0;
                this.phase.index += 1;
            }
        }
        if (this.phase.index >= this.phase.rgbIndex.length)
            this.phase.index = 0;
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