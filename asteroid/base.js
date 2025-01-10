import { Player, Score} from './UtilBox.js';
import  logicPackage  from './handleUtil.js';

(function () {                                                   // resize is not working and game is ending after 1 asteroid is hit need to fix
    const canvas = document.querySelector('#theCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const logicHandler = logicPackage(canvas.width, canvas.height, ctx);

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

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        projectiles.forEach( projectile => projectile.updateWindowHeight(canvas.width, canvas.height));
        asteroids.forEach( asteroid => asteroid.updateWindowHeight(canvas.width, canvas.height));
        logicHandler.update(canvas.width, canvas.height);
    });

    window.addEventListener('keyup', (event) => {
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
    });
    
    window.addEventListener('keydown', (event) => {
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
    });

    function handleAsteroid() {
        intervalID = window.setInterval(() => {
            asteroids.push(logicHandler.generateAsteroid());
        }, 3000);
    };

    function handleSparks(x, y) {
        sparks.push(logicHandler.generateSparks(x, y));
    };

    function handleAsteroidSplit(asteroid) {
        const flag = false;
        const array = logicHandler.splitAsteroid(asteroid);
        if(array.length){
            array.forEach(asteroid => asteroids.push(asteroid));
            flag = true;
        }
    return flag;
    }

    const player = new Player(
        { x: canvas.width / 2, y: canvas.height / 2 },
        'white',
        { top: -50, bottom: canvas.height + 50, left: -50, right: canvas.width + 50 },
        ROTATIONAL_SPEED,
        SPEED, 
        FRICTION,
        ctx
    );

    const playersScore = new Score(
        { x: canvas.width - 100, y: 50 },
        ctx
    );


    function animate() { 
        
        const animationID = window.requestAnimationFrame(animate);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        point = 0;
        player.update(player);

        sparks.forEach((spark, index) => {
            if (spark.update()) {  
                sparks.splice(index, 1);
            }
        });

        for (let i = projectiles.length - 1; i >= 0; i--) {  
            const projectile = projectiles[i];

            if (projectile.update()) {
                projectiles.splice(i, 1);
            }
        }
        
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            if(asteroid.update() && asteroid.remove){
                asteroids.splice(i, 1);
            }
            if (logicHandler.testTriangleCollision(asteroid, player.getVertices())) {  // need to handle game over
                console.log('Game Over!!!');
                window.cancelAnimationFrame(animationID);
                clearInterval(intervalID);
            }

            for (let j = projectiles.length - 1; j >= 0; j--) {
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

        playersScore.update(point); 
    }

    animate();
    handleAsteroid();
}());










