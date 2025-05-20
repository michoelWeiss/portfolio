class Shape {
    constructor(position, velocity, radius, color, boundaries, draw, ctx, re_spawn) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.boundaries = boundaries;
        this.draw = draw;
        this.ctx = ctx;
        this.re_spawn = re_spawn;
    }
    isOffScreen() {
        const oldPosition = { ...this.position };
        const tempPosition = { ...this.position };
        if (this.position.x > this.boundaries.right) tempPosition.x = this.boundaries.left;
        else if (this.position.x < this.boundaries.left) tempPosition.x = this.boundaries.right;
        else if (this.position.y > this.boundaries.bottom) tempPosition.y = this.boundaries.top;
        else if (this.position.y < this.boundaries.top) tempPosition.y = this.boundaries.bottom;
        if (this.re_spawn) {
            this.position = tempPosition;
        }
        return oldPosition.x !== tempPosition.x || oldPosition.y !== tempPosition.y;
    }
    update(gameRunning = true) {
        if (gameRunning) {
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        }
        const offScreen = this.isOffScreen();
        this.draw(this.position, this.color, this.ctx, this.radius);
        return offScreen;
    }
    updateWindowHeight(length, height) {
        if (this.radius) {
            this.boundaries.right = length + this.radius;
            this.boundaries.bottom = height + this.radius;
        }
        else {
            this.boundaries.right = length + 20;
            this.boundaries.bottom = height + 20;
        }
    }
}
export class Player extends Shape {
    keys = {
        ArrowRight: {
            pressed: false
        },
        ArrowLeft: {
            pressed: false
        },
        ArrowUp: {
            pressed: false
        },
        ArrowDown: {
            pressed: false
        }
    };
    constructor(position, color, boundaries, rotationSpeed, speed, friction, ctx) {

        super(position, { x: 0, y: 0 }, null, color, boundaries,
            (position, color, ctx) => {
                ctx.save();
                ctx.translate(position.x, position.y)
                ctx.rotate(this.rotation);
                ctx.translate(-position.x, -position.y)
                ctx.beginPath();
                ctx.moveTo(position.x + 30, position.y);
                ctx.lineTo(position.x - 10, position.y - 10);
                ctx.lineTo(position.x - 10, position.y + 10);
                ctx.closePath();
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.restore();
            }, ctx, true);
        this.rotation = 0;
        this.rotationSpeed = rotationSpeed;
        this.speed = speed;
        this.friction = friction;
    }
    update(gameIsNotPaused, gameRunning) {
        let update = gameIsNotPaused === true && gameRunning === true;
        if (update) {
            if (this.keys.ArrowRight.pressed) this.rotation += this.rotationSpeed;
            if (this.keys.ArrowLeft.pressed) this.rotation -= this.rotationSpeed;

            if (this.keys.ArrowUp.pressed) {
                this.velocity.x = Math.cos(this.rotation) * this.speed;
                this.velocity.y = Math.sin(this.rotation) * this.speed;
            }
            if (this.keys.ArrowDown.pressed) {
                this.velocity.x = -Math.cos(this.rotation) * this.speed;
                this.velocity.y = -Math.sin(this.rotation) * this.speed;
            }
        }
        else {
            this.decelerate(gameIsNotPaused);
        }
        if (!this.keys.ArrowUp.pressed && !this.keys.ArrowDown.pressed) {
            if (this.velocity.x || this.velocity.y) {
                this.decelerate(gameIsNotPaused);
            }
        }
        super.update(gameIsNotPaused);
    }
    decelerate(gameIsNotPaused) {
        if(gameIsNotPaused){
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
        }
    }
    updateWindowHeight(length, height) {
        super.updateWindowHeight(length, height);
    }
    getVertices() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        return [
            {
                x: this.position.x + cos * 30 - sin * 0,
                y: this.position.y + sin * 30 + cos * 0,
            },
            {
                x: this.position.x + cos * -10 - sin * 10,
                y: this.position.y + sin * -10 + cos * 10,
            },
            {
                x: this.position.x + cos * -10 - sin * -10,
                y: this.position.y + sin * -10 + cos * -10,
            },
        ]
    }
}
export class Projectile extends Shape {
    constructor(position, velocity, radius, color, ctx, boundaries) {
        super(position, velocity, radius, color, boundaries,
            (position, color, ctx, radius) => {
                ctx.beginPath();
                ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, false);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
            }, ctx, false);
    }
    update(gameRunning) {
        return super.update(gameRunning);
    }
    updateWindowHeight(length, height) {
        super.updateWindowHeight(length, height);
    }
}
export class Asteroid extends Shape {
    #countdown = 15;
    remove = false;
    interval = window.setInterval(() => {
        this.#countdown -= 1;
        if (this.#countdown === 0) {
            this.remove = true;
            clearInterval(this.interval);
        }
    }, 1000)

    constructor(position, velocity, radius, color, ctx, boundaries) {
        super(position, velocity, radius, color, boundaries,
            (position, color, ctx, radius) => {
                ctx.beginPath();
                ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, false);
                ctx.closePath();
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.stroke();
            }, ctx, true);
    }
    update(gameRunning) {
        return super.update(gameRunning);
    }
    updateWindowHeight(length, height) {
        super.updateWindowHeight(length, height);
    }
}
export class Spark extends Shape {
    constructor(position, color, ctx, radius, lifespan = 100, alpha = 1) {
        radius = radius ? radius : 1;
        super(position, { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 }, radius, color, { top: 0, bottom: 0, left: 0, right: 0 },
            (position, color, ctx, radius) => {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.restore();
            }, ctx, false);
        this.alpha = alpha;
        this.lifespan = lifespan;

    }
    isDead() {
        return this.lifespan <= 0 || this.alpha <= 0;
    }
    update(gameRunning) {
        super.update(gameRunning);
        if (gameRunning) {
            this.alpha -= 0.01;
            this.lifespan -= 1;
        }
        return this.isDead();
    }
    updateWindowHeight(length, height) {
        super.updateWindowHeight(length, height);
    }
}
export class Score {
    constructor(position, positionOffset, ctx) {
        this.position = { x: position.x + positionOffset.x, y: position.y + positionOffset.y };
        this.positionOffset = positionOffset;
        this.ctx = ctx;
        this.score = 0;
    }
    draw() {
        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = 'blue';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Score: ' + this.score, this.position.x, this.position.y);
    }
    update(newPoint) {
        if (newPoint) {
            this.score += newPoint;
        }
        this.draw();
    }
    updatePosition(position) {
        this.position = { x: position.x + this.positionOffset.x, y: position.y + this.positionOffset.y };
    }
    currentScore() {
        return this.score;
    }
}
export class GameOver {
    constructor(position, score, ctx) {
        this.position = { x: position.x / 2, y: position.y / 2 };
        this.ctx = ctx;
        this.score = score;

        this.alpha = 1;
        this.fadeDirection = -1;
        this.fadeInterval = 3000;
        this.fadeCooldown = 1000;
        this.lastFadeTime = Date.now();
    }
    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.alpha;
        this.ctx.font = '50px Arial';
        this.ctx.fillStyle = 'blue';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Game Over: Your Score is ' + this.score, this.position.x, this.position.y);
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = 'gray';
        this.ctx.fillText('Press R to play again', this.position.x, this.position.y + 40);
        this.ctx.restore();
    }
    update() {
        const now = Date.now();

        if (this.fadeDirection === -1 && this.alpha <= 0) {
            // Fully faded out, start cooldown before fading back in
            if (now - this.lastFadeTime >= this.fadeCooldown) {
                this.fadeDirection = 1;
                this.lastFadeTime = now;
            }
        } else if (this.fadeDirection === 1 && this.alpha >= 1) {
            if (now - this.lastFadeTime >= this.fadeInterval) {
                this.fadeDirection = -1;
                this.lastFadeTime = now;
            }
        } else {
            const fadeSpeed = 0.01;
            this.alpha += fadeSpeed * this.fadeDirection;
            this.alpha = Math.max(0, Math.min(1, this.alpha));
        }

        this.draw();
    }
    updatePosition(position) {
        this.position = { x: position.x / 2, y: position.y / 2 };
    }
    newScore(score) {
        this.score = score;
    }
}

export class PauseMessage {
    constructor(size, ctx) {
        this.position = { x: size.x / 2, y: size.y * 0.15 };
        this.ctx = ctx;
    }
    draw() {
        this.ctx.font = '40px Arial';
        this.ctx.fillStyle = 'blue';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Paused', this.position.x, this.position.y);

    }
    updatePosition(size) {
        this.position = { x: size.x / 2, y: size.y * 0.15 };
    }
}
export class Star {
    constructor(position, color, ctx) {
        this.position = position;
        this.color = color;
        this.ctx = ctx;
    }
    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.position.x, this.position.y, 1, 0, Math.PI * 2, false);
        this.ctx.closePath();
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}





