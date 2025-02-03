import { Player, Score, Star, GameOver } from './UtilBox.js';
import logicPackage from './handleUtil.js';

const canvas = document.querySelector('#theCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const logicHandler = logicPackage(canvas.width, canvas.height, ctx);

const SPEED = 8;
const ROTATIONAL_SPEED = 0.12;
const FRICTION = 0.98;
const PROJECTILE_SPEED = 12;

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
let shipExplodeInterval;
let gameOverDisplay;

const explosionSound = document.createElement('audio');
explosionSound.src = './Audio/explosionSound.mp3';
explosionSound.volume = 0.1;

const shootingSound = document.createElement('audio');
shootingSound.src = './Audio/blasterSound.mp3';
shootingSound.volume = 0.05;

const backgroundSound = document.createElement('audio');
backgroundSound.src = './Audio/Background-Music.mp3';
backgroundSound.volume = 0.3;
backgroundSound.loop = true;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    projectiles?.forEach(projectile => projectile.updateWindowHeight(canvas.width, canvas.height));
    asteroids?.forEach(asteroid => asteroid.updateWindowHeight(canvas.width, canvas.height));
    logicHandler.update(canvas.width, canvas.height);
    playersScore?.updatePosition({ x: canvas.width, y: 0 });
    player?.updateWindowHeight(canvas.width, canvas.height);
    gameOverDisplay?.updatePosition({ x: canvas.width, y: canvas.height });
});
const keyEvent = (event) => {
    const name = event.code;
    if (name === 'ArrowRight' || name === 'ArrowDown' || name === 'ArrowLeft' || name === 'ArrowUp') {
        player.keys[name].pressed = event.type === 'keydown';
    }
    else if (name === 'Space') {
        if (event.type === 'keydown' && shoot) {
            if (!shootingSound.paused) {
                shootingSound.currentTime = 0;
            }
            shootingSound.play();
            backgroundSound.play(); //temp
            projectiles.push(logicHandler.generateProjectile(player, PROJECTILE_SPEED));
            shoot = false;
        }
        else {
            shoot = true;
        }
    }
};
const newGame = (event) => {
    if (event.code === 'KeyR')
        clearAndResetGame();
};

function handleAsteroid() {
    intervalID = window.setInterval(() => {
        asteroids.push(logicHandler.generateAsteroid());
    }, 3000);
};

function handleSparks(x, y, radius, lifespan, alpha, amount) {
    const sparkArray = logicHandler.generateSparks(x, y, radius, lifespan, alpha, amount);
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

function handleStars() {
    stars = [];
    const starsToCreate = 1500;
    for (let i = 0; i < starsToCreate; i++) {
        stars.push(new Star(
            { x: Math.random() * canvas.width * 2, y: Math.random() * canvas.height * 2 },
            'white',
            ctx
        ));
    }
}
function removeAsteroids(collisionPoint, index) {
    if (index >= 0) {
        handleSparks(collisionPoint.x, collisionPoint.y);
        asteroids.splice(index, 1);
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
        { top: -20, bottom: canvas.height + 20, left: -20, right: canvas.width + 20 },
        ROTATIONAL_SPEED,
        SPEED,
        FRICTION,
        ctx
    ); console.log(player)
    playersScore = new Score(
        { x: canvas.width, y: 0 },
        { x: -100, y: 50 },
        ctx
    );
    gameOverDisplay = new GameOver({ x: canvas.width, y: canvas.height }, null, ctx);

    window.addEventListener('keydown', keyEvent);
    window.addEventListener('keyup', keyEvent);
    window.removeEventListener('keydown', newGame);

    animate();
    handleAsteroid();
    handleStars(300);
}
function clearAndResetGame() {

    point = null;
    shoot = null;
    player = null;
    playersScore = null;
    gameOverDisplay = null;

    window.cancelAnimationFrame(animationID);
    clearInterval(intervalID);
    clearInterval(shipExplodeInterval);
    buildGame();
}
function gameOver() {
    gameRunning = false;
    gameOverDisplay.newScore(playersScore.currentScore());
    window.removeEventListener('keydown', keyEvent);
    window.removeEventListener('keyup', keyEvent);
    window.addEventListener('keydown', newGame);
    if (!shipExplodeInterval)
        shipExplodeInterval = setInterval(() => handleSparks(player.position.x, player.position.y, 1, 75, 1, 10), 100);
}

function animate() {

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    point = 0;
    stars?.forEach(star => star.draw());
    player?.update(gameRunning);

    for (let i = projectiles?.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        if (projectile.update()) {
            projectiles.splice(i, 1);
        }
    }

    for (let i = asteroids?.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        if (asteroid.update() && asteroid.remove) {
            asteroids.splice(i, 1);
        }
        const crash = logicHandler.testTriangleCollision(asteroid, player?.getVertices());
        if (crash) {
            removeAsteroids(crash, i);
            gameOver();
            console.log('Game Over!!!');
        }

        for (let j = projectiles?.length - 1; j >= 0; j--) {
            const projectile = projectiles[j];
            const collision = logicHandler.circleCollision(projectile, asteroid);
            if (collision.collided) {
                if (!explosionSound.paused) {
                    explosionSound.currentTime = 0;
                }
                explosionSound.play();
                removeAsteroids(collision.collisionPoint, i);
                projectiles.splice(j, 1);
                if (handleAsteroidSplit(asteroid)) point = 2;
                else point = 1;
            }
        }
    }

    sparks?.forEach((spark, index) => {
        if (spark.update()) {
            sparks.splice(index, 1);
        }
    });

    if (gameRunning) {
        playersScore?.update(point);
    }
    else {
        gameOverDisplay.update();
    }
    animationID = window.requestAnimationFrame(animate);
}
buildGame();











