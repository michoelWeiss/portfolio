(function () {
    'use strict';
    const canvas = document.querySelector('#theCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const SPEED = 7;
    const ROTATIONAL_SPEED = 0.12;
    const FRICTION = 0.98;
    const PROJECTILE_SPEED = 10;

    const projectiles = [];
    const asteroids = [];
    const sparks = [];

    let point = 0;
    let intervalID;
    let shoot = true;

    class Player {
        constructor({ position, velocity }) {
            this.position = position;
            this.velocity = velocity;
            this.rotation = 0;
        }

        draw() {
            ctx.save();
            ctx.translate(this.position.x, this.position.y)
            ctx.rotate(this.rotation);
            ctx.translate(-this.position.x, -this.position.y)
            ctx.beginPath();
            ctx.moveTo(this.position.x + 30, this.position.y);
            ctx.lineTo(this.position.x - 10, this.position.y - 10);
            ctx.lineTo(this.position.x - 10, this.position.y + 10);
            ctx.closePath();
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.restore();
        }
        update() {
            this.draw();
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.isOffScreen();
        }

        isOffScreen() {
            if (this.position.x > canvas.width + 50) this.position.x = -50;
            else if (this.position.x < -50) this.position.x = canvas.width + 50;
            else if (this.position.y > canvas.height + 50) this.position.y = -50;
            else if (this.position.y < -50) this.position.y = canvas.height + 50;
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

    class Projectile {
        constructor({ position, velocity }) {
            this.position = position;
            this.velocity = velocity;
            this.radius = 5;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fillStyle = 'white';
            ctx.fill();
        }
        update() {
            this.draw();
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        }
    }
    class Asteroid {

        #countdown = 15;
        remove = false;
        interval = window.setInterval(() => {
            this.#countdown -= 1;
            if (this.#countdown === 0) {
                this.remove = true;
                clearInterval(this.interval);
            }
        }, 1000)

        constructor({ position, velocity, radius }) {
            this.position = position;
            this.velocity = velocity;
            this.radius = radius;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }
        update() {
            this.draw();
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.isOffScreen();
        }

        isOffScreen() {
            if (!this.remove) {
                if (this.position.x + this.radius < 0) this.position.x = canvas.width + this.radius;
                else if (this.position.x - this.radius > canvas.width) this.position.x = 0 - this.radius;
                else if (this.position.y + this.radius < 0) this.position.y = canvas.height + this.radius;
                else if (this.position.y - this.radius > canvas.height) this.position.y = 0 - this.radius;
            }

        }
    }
    class Spark {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 8; // Random velocity
            this.vy = (Math.random() - 0.5) * 8;
            this.alpha = 1; // Opacity
            this.size = 1;//Math.random() * 3 + 1; // Random size
            this.color = color;
            this.lifespan = 100; // Frames
        }

        update() {
            this.draw();
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.02; // Fade out
            this.lifespan -= 2;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha; // Apply fading
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        isDead() {
            return this.lifespan <= 0 || this.alpha <= 0;
        }
    }

    class Score {
        score = 0;
        draw() {
            ctx.font = '30px Arial'; // Set the font size and family
            ctx.fillStyle = 'blue';  // Set the fill color
            ctx.textAlign = 'center'; // Set text alignment
            ctx.textBaseline = 'middle'; // Set text baseline

            // Draw filled text
            ctx.fillText('Score: ' + this.score, canvas.width - 100, 50);
        }
        update(newPoint) {
            this.draw();
            if (newPoint)
                this.score += newPoint;
        }
    }

    const player = new Player({
        position: { x: canvas.width / 2, y: canvas.height / 2 },
        velocity: { x: 0, y: 0 },
    });
    const keys = {
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
    }
    const playersScore = new Score();
    function generateAsteroid() {
        intervalID = window.setInterval(() => {
            const index = Math.floor(Math.random() * 4);
            let radius = 70 * Math.random() + 20;
            let x, y;
            let vx, vy;
            let r = Math.floor(Math.random() * 3) - 1;

            switch (index) {
                case 0:
                    x = 0 - radius;
                    y = Math.random() * canvas.height;
                    vx = 1;
                    vy = r;
                    break;
                case 1:
                    x = canvas.width + radius;
                    y = Math.random() * canvas.height;
                    vx = -1;
                    vy = r;
                    break;
                case 2:
                    x = Math.random() * canvas.width;
                    y = 0 - radius;
                    vx = r;
                    vy = 1;
                    break;
                case 3:
                    x = Math.random() * canvas.width;
                    y = canvas.height + radius;
                    vx = r;
                    vy = -1;
                    break;
            }
            asteroids.push(new Asteroid({
                position: {
                    x: x,
                    y: y,
                },

                velocity: {
                    x: vx,
                    y: vy,
                },
                radius
            }));
        }, 3000);
    }

    function createSparks(x, y, color = 'white') {
        for (let i = 0; i < 100; i++) {
            sparks.push(new Spark(x, y, color));
        }
    }

    function animate() {
        const animationID = window.requestAnimationFrame(animate);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        player.update();

        sparks.forEach((spark, index) => {
            spark.update();
            if (spark.isDead()) {
                sparks.splice(index, 1);
            }
        });

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            projectile.update();

            if (projectile.position.x + projectile.radius < 0 ||
                projectile.position.x - projectile.radius > canvas.width ||
                projectile.position.y + projectile.radius < 0 ||
                projectile.position.y - projectile.radius > canvas.height
            ) projectiles.splice(i, 1);
        }
        point = 0;

        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            asteroid.update();

            if (circleTriangleCollision(asteroid, player.getVertices())) {
                console.log('Game Over!!!');
                window.cancelAnimationFrame(animationID);
                clearInterval(intervalID);

            }

            if (asteroid.remove &&
                (asteroid.position.x + asteroid.radius < 0 ||
                    asteroid.position.x - asteroid.radius > canvas.width ||
                    asteroid.position.y + asteroid.radius < 0 ||
                    asteroid.position.y - asteroid.radius > canvas.height)
            ) asteroids.splice(i, 1);


            for (let j = projectiles.length - 1; j >= 0; j--) {
                const projectile = projectiles[j];
                if (circleCollision(projectile, asteroid).collided) {
                    if (splitAsteroid(asteroid, asteroids, i))
                        point = 2;
                    else point = 1;
                    asteroids.splice(i, 1);
                    projectiles.splice(j, 1);
                }
            }

            //   for(let j = asteroids.length - 1; j >= 0; j--){
            //      const asteroid2 = asteroids[j];
            //     asteroidsCollide(asteroid2, asteroid);
            //  }
        }

        playersScore.update(point);


        if (keys.ArrowRight.pressed) player.rotation += ROTATIONAL_SPEED;
        if (keys.ArrowLeft.pressed) player.rotation -= ROTATIONAL_SPEED;

        if (keys.ArrowUp.pressed) {
            player.velocity.x = Math.cos(player.rotation) * SPEED;
            player.velocity.y = Math.sin(player.rotation) * SPEED;
        }
        if (keys.ArrowDown.pressed) {
            player.velocity.x = -Math.cos(player.rotation) * SPEED;
            player.velocity.y = -Math.sin(player.rotation) * SPEED;
        }
        if (!keys.ArrowUp.pressed || !keys.ArrowDown.pressed) {
            player.velocity.x *= FRICTION;
            player.velocity.y *= FRICTION;
        }
    }
    function circleCollision(circle1, circle2) {
        const xdiff = circle1.position.x - circle2.position.x;
        const ydiff = circle1.position.y - circle2.position.y;


        const distance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

        if (distance <= circle2.radius + circle1.radius) {

            const nx = xdiff / distance;
            const ny = ydiff / distance;

            const collisionPoint = {
                x: circle1.position.x - nx * circle1.radius,
                y: circle1.position.y - ny * circle1.radius,
            };
            createSparks(collisionPoint.x, collisionPoint.y);
            return {
                collided: true,
                collisionPoint: collisionPoint,
            };
        }

        return { collided: false };
    }
    function splitAsteroid(asteroid) {

        if (asteroid.radius >= 50) {
            let px;
            let vx;
            for (let i = 0; i < 2; i++) {
                if (i === 0) {
                    px = asteroid.position.x + asteroid.radius;
                    vx = 2;
                }
                else {
                    px = asteroid.position.x - asteroid.radius;
                    vx = -2;
                }
                asteroids.push(new Asteroid({
                    position: {
                        x: px,
                        y: asteroid.position.y,
                    },

                    velocity: {
                        x: vx,
                        y: asteroid.velocity.y,
                    },
                    radius: asteroid.radius / 2,
                }));
            }
            return true;
        }
        return false;
    }

    /*    function asteroidsCollide(asteroid1, asteroid2){
            if(asteroid1 === asteroid2){return;}
            const collision = circleCollision(asteroid1, asteroid2);
            if(collision.collided){
                console.log('collision detected');
               handleCollision(asteroid1, asteroid2, collision.collisionPoint);
            }
        }
        function handleSimpleCollision(circle1, circle2, collisionPoint) {
           
       }*/
    function circleTriangleCollision(circle, triangle) {
        for (let i = 0; i < 3; i++) {
            let start = triangle[i];
            let end = triangle[(i + 1) % 3];

            let dx = end.x - start.x;
            let dy = end.y - start.y;
            let length = Math.sqrt(dx * dx + dy * dy);

            let dot =
                ((circle.position.x - start.x) * dx +
                    (circle.position.y - start.y) * dy) /
                Math.pow(length, 2);

            let closestX = start.x + dot * dx;
            let closestY = start.y + dot * dy;

            if (!isPointOnLineSegment(closestX, closestY, start, end)) {
                closestX = closestX < start.x ? start.x : end.x;
                closestY = closestY < start.y ? start.y : end.y;
            }

            dx = closestX - circle.position.x;
            dy = closestY - circle.position.y;

            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= circle.radius) {
                return true;
            }
        }
        // No collision 
        return false;
    }

    function isPointOnLineSegment(x, y, start, end) {
        return (
            x >= Math.min(start.x, end.x) &&
            x <= Math.max(start.x, end.x) &&
            y >= Math.min(start.y, end.y) &&
            y <= Math.max(start.y, end.y)
        );
    }
    animate();
    generateAsteroid();
    window.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'ArrowRight':
                keys.ArrowRight.pressed = true;
                break;
            case 'ArrowDown':
                keys.ArrowDown.pressed = true;
                break;
            case 'ArrowLeft':
                keys.ArrowLeft.pressed = true;
                break;
            case 'ArrowUp':
                keys.ArrowUp.pressed = true;
                break;
            case 'Space':
                if (shoot) {
                    projectiles.push(new Projectile({
                        position: {
                            x: player.position.x + Math.cos(player.rotation) * 30,
                            y: player.position.y + Math.sin(player.rotation) * 30,
                        },
                        velocity: {
                            x: Math.cos(player.rotation) * PROJECTILE_SPEED
                            //         + (keys.ArrowUp.pressed && player.velocity.x != 0 ? player.velocity.x : 0)
                            ,
                            y: Math.sin(player.rotation) * PROJECTILE_SPEED
                            //          + (keys.ArrowUp.pressed && player.velocity.y != 0 ? player.velocity.y : 0)    // needs work, only works when player is moving to the right
                            ,
                        }
                    }));
                    shoot = false;
                }

                break;
        }
    });
    window.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'ArrowRight':
                keys.ArrowRight.pressed = false;
                break;
            case 'ArrowDown':
                keys.ArrowDown.pressed = false;
                break;
            case 'ArrowLeft':
                keys.ArrowLeft.pressed = false;
                break;
            case 'ArrowUp':
                keys.ArrowUp.pressed = false;
                break;
            case 'Space':
                shoot = true;
                break;
        }
    });
}());