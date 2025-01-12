import { Projectile, Asteroid, Spark } from './UtilBox.js';

export default function logicPackage(width, height, ctx) {
    logicPackage.height = height;
    logicPackage.width = width;
    logicPackage.ctx = ctx;

    function generateAsteroid() {
        const index = Math.floor(Math.random() * 4);
        let radius = 70 * Math.random() + 20;
        let position = { x: null, y: null };
        let velocity = { x: null, y: null };
        let initialDirection = Math.floor(Math.random() * 3) - 1;

        switch (index) {
            case 0:
                position.x = 0 - radius;
                position.y = Math.random() * logicPackage.height;
                velocity.x = 1;
                velocity.y = initialDirection;
                break;
            case 1:
                position.x = canvas.logicPackage.width + radius;
                position.y = Math.random() * logicPackage.height;
                velocity.x = -1;
                velocity.y = initialDirection;
                break;
            case 2:
                position.x = Math.random() * logicPackage.width;
                position.y = 0 - radius;
                velocity.x = initialDirection;
                velocity.y = 1;
                break;
            case 3:
                position.x = Math.random() * logicPackage.width;
                position.y = canvas.logicPackage.height + radius;
                velocity.x = initialDirection;
                velocity.y = -1;
                break;
        }
        return (new Asteroid(
            position,
            velocity,
            radius,
            'white',
            logicPackage.ctx,
            { top: -radius, bottom: logicPackage.height + radius, left: -radius, right: logicPackage.width + radius }
        ));
    };

    function generateSparks(x, y) {
        const array = [];
        for (let i = 0; i < 100; i++) {
            array.push(new Spark({ x, y }, 'white', logicPackage.ctx));
        }
        return array;
    };

    function circleCollision(circle1, circle2) {
        const result = { collided: false, collisionPoint: null };
        const xdiff = circle1.position.x - circle2.position.x;
        const ydiff = circle1.position.y - circle2.position.y;
        const distance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

        if (distance <= circle2.radius + circle1.radius) {
            result.collided = true;

            const nx = xdiff / distance;
            const ny = ydiff / distance;

            result.collisionPoint = {
                x: circle1.position.x - nx * circle1.radius,
                y: circle1.position.y - ny * circle1.radius,
            };
        }
        return result;
    }

    function splitAsteroid(asteroid) {

        const array = [];
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
                array.push(new Asteroid(
                    { x: px, y: asteroid.position.y },
                    { x: vx, y: asteroid.velocity.y },
                    asteroid.radius / 2,
                    'white',
                    logicPackage.ctx,
                    { top: -asteroid.radius, bottom: logicPackage.height + asteroid.radius, left: -asteroid.radius, right: logicPackage.width + asteroid.radius }
                ));
            }
        }
        return array;
    };

    function testTriangleCollision(circle, triangle) {
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
        return false;
    };

    function generateProjectile(player, speed) {
        return new Projectile(
            {
                x: player.position.x + Math.cos(player.rotation) * 30,
                y: player.position.y + Math.sin(player.rotation) * 30
            },
            {
                x: Math.cos(player.rotation) * speed,
                y: Math.sin(player.rotation) * speed
            },
            5,       // radius
            'white',
            logicPackage.ctx,
            { top: -3, bottom: logicPackage.height + 3, left: -3, right: logicPackage.width + 3 }
        );
    };

    function update(width, height) {
        logicPackage.logicPackage.height = height;
        logicPackage.logicPackage.width = width;
    }

    function isPointOnLineSegment(x, y, start, end) {
        return (
            x >= Math.min(start.x, end.x) &&
            x <= Math.max(start.x, end.x) &&
            y >= Math.min(start.y, end.y) &&
            y <= Math.max(start.y, end.y)
        );
    };

    return {
        generateAsteroid,
        generateSparks,
        circleCollision,
        splitAsteroid,
        testTriangleCollision,
        generateProjectile,
        update
    };
}


