
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
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
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
            this.boundaries.right = length + 30;
            this.boundaries.bottom = height + 30;
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
    update(player) {
        if (this.keys.ArrowRight.pressed) player.rotation += this.rotationSpeed;
        if (this.keys.ArrowLeft.pressed) player.rotation -= this.rotationSpeed;

        if (this.keys.ArrowUp.pressed) {
            player.velocity.x = Math.cos(player.rotation) * this.speed;
            player.velocity.y = Math.sin(player.rotation) * this.speed;
        }
        if (this.keys.ArrowDown.pressed) {
            player.velocity.x = -Math.cos(player.rotation) * this.speed;
            player.velocity.y = -Math.sin(player.rotation) * this.speed;
        }
        if (!this.keys.ArrowUp.pressed || !this.keys.ArrowDown.pressed) {
            if (player.velocity) {
                player.velocity.x *= this.friction;
                player.velocity.y *= this.friction;
            }
        }

        super.update();
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
    update() {
        return super.update();
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
    update() {
        return super.update();
    }
    updateWindowHeight(length, height) {
        console.log(length, height)
        super.updateWindowHeight(length, height);
        console.log(this.boundaries)
    }
}
export class Spark extends Shape {
    constructor(position, color, ctx) {
        super(position, { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 }, 1, color, { top: 0, bottom: 0, left: 0, right: 0 },
            (position, color, ctx, radius) => {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.restore();
            }, ctx, false);
        this.alpha = 1;
        this.lifespan = 100;

    }
    isDead() {
        return this.lifespan <= 0 || this.alpha <= 0;
    }
    update() {
        super.update();
        this.alpha -= 0.02;
        this.lifespan -= 2;
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





