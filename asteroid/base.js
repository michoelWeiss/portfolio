import { Player, Score, Star } from './UtilBox.js';
import logicPackage from './handleUtil.js';

(function () {                                                   // resize is not working,  need to fix
    const canvas = document.querySelector('#theCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const logicHandler = logicPackage(canvas.width, canvas.height, ctx);

    const SPEED = 7;
    const ROTATIONAL_SPEED = 0.12;
    const FRICTION = 0.98;
    const PROJECTILE_SPEED = 10;

    let projectiles;
    let asteroids;
    let sparks;
    let stars;

    let point;
    let intervalID;
    let animationID;
    let shoot;
    let player;
    let playersScore;
    let gameRunning;


    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        projectiles?.forEach(projectile => projectile.updateWindowHeight(canvas.width, canvas.height));
        asteroids?.forEach(asteroid => asteroid.updateWindowHeight(canvas.width, canvas.height));
        logicHandler.update(canvas.width, canvas.height);
        playersScore?.updatePosition({ x: canvas.width, y: 0 });
        player?.updateWindowHeight(canvas.width, canvas.height);
    });

    const keyUpEvent = (event) => {
        switch (event.code) {
            case 'ArrowRight':
                player.keys.ArrowRight.pressed = false;
                break;
            case 'ArrowDown':
                player.keys.ArrowDown.pressed = false;
                break;
            case 'ArrowLeft':
                player.keys.ArrowLeft.pressed = false;
                break;
            case 'ArrowUp':
                player.keys.ArrowUp.pressed = false;
                break;
            case 'Space':
                shoot = true;
                break;
        }
    };

    const keyDownEvent = (event) => {
        switch (event.code) {
            case 'ArrowRight':
                player.keys.ArrowRight.pressed = true;
                break;
            case 'ArrowDown':
                player.keys.ArrowDown.pressed = true;
                break;
            case 'ArrowLeft':
                player.keys.ArrowLeft.pressed = true;
                break;
            case 'ArrowUp':
                player.keys.ArrowUp.pressed = true;
                break;
            case 'Space':
                if (shoot) {
                    projectiles.push(logicHandler.generateProjectile(player, PROJECTILE_SPEED));
                    shoot = false;
                }
                break;
        }
    };

    const newGame = (event) => {    // need to handle new game better      
        if (event.code === 'Space')
            buildGame();
    };

    function handleAsteroid() {
        intervalID = window.setInterval(() => {
            asteroids.push(logicHandler.generateAsteroid());
        }, 3000);
    };

    function handleSparks(x, y) {
        const sparkArray = logicHandler.generateSparks(x, y);
        sparkArray.forEach(spark => sparks.push(spark));
    };

    function handleAsteroidSplit(asteroid) {
        let flag = false;
        const array = logicHandler.splitAsteroid(asteroid);
        if (array.length) {
            array.forEach(asteroid => asteroids.push(asteroid));
            flag = true;
        }
        return flag;
    }

    function handleStars(amount) {
        if (!amount) { amount = 3000 }
        for (let i = 0; i < amount; i++) {
            stars.push(new Star(
                { x: Math.random() * canvas.width, y: Math.random() * canvas.height },
                'white',
                ctx
            ));
        }
    }

    function buildGame() {

        projectiles = [];
        asteroids = [];
        sparks = [];
        stars = [];

        point = 0;
        shoot = true;
        gameRunning = true;

        player = new Player(
            { x: canvas.width / 2, y: canvas.height / 2 },
            'white',
            { top: -25, bottom: canvas.height + 25, left: -25, right: canvas.width + 25 },
            ROTATIONAL_SPEED,
            SPEED,
            FRICTION,
            ctx
        );
        playersScore = new Score(
            { x: canvas.width, y: 0 },
            { x: -100, y: 50 },
            ctx
        );

        window.addEventListener('keydown', keyDownEvent);
        window.addEventListener('keyup', keyUpEvent);
        window.removeEventListener('keydown', newGame);

        animate();
        handleAsteroid();
        handleStars(300);
    }
    function clearGame() {

        point = null;
        shoot = null;
        player = null;
        playersScore = null;
        gameRunning = false;

        window.removeEventListener('keydown', keyDownEvent);
        window.removeEventListener('keyup', keyUpEvent);
        window.cancelAnimationFrame(animationID);
        clearInterval(intervalID);

        window.addEventListener('keydown', newGame);
    }


    function animate() {
        if (!gameRunning) { return; }
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        point = 0;
        stars?.forEach(star => star.draw());
        player?.update(player);

        for (let i = projectiles?.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            if (projectile.update()) {
                projectiles.splice(i, 1);
            }
        }

        sparks?.forEach((spark, index) => {
            if (spark.update()) {
                sparks.splice(index, 1);
            }
        });

        for (let i = asteroids?.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            if (asteroid.update() && asteroid.remove) {
                asteroids.splice(i, 1);
            }
            if (logicHandler.testTriangleCollision(asteroid, player?.getVertices())) {  // need to handle game over
                clearGame();
                console.log('Game Over!!!');
            }

            for (let j = projectiles?.length - 1; j >= 0; j--) {
                const projectile = projectiles[j];
                const collision = logicHandler.circleCollision(projectile, asteroid);
                if (collision.collided) {
                    handleSparks(collision.collisionPoint.x, collision.collisionPoint.y);
                    if (handleAsteroidSplit(asteroid)) point = 2;
                    else point = 1;
                    asteroids.splice(i, 1);
                    projectiles.splice(j, 1);
                }
            }
        }

        playersScore?.update(point);
        animationID = window.requestAnimationFrame(animate);
    }
    buildGame();
}());










