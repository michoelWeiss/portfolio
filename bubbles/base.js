import { Spark } from './decorations.js';
import { Bubble } from './bubble.js';
import { LogicHandler } from './logicHandler.js';

const canvas = document.querySelector('#theCanvas');   // need to make the size dynamic
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight + 200;  // extra room so bubbles can manafest below the screen 

const BubbleRadius = 35;
const BubbleMass = 5;

let sparks = [];
let bubbles = [];

Bubble.setCanvasDimensions(window.innerWidth, window.innerHeight);
const logicHandler = LogicHandler(canvas.width, canvas.height, BubbleMass, BubbleRadius, bubbles, sparks, ctx);

canvas.addEventListener('click', logicHandler.removeBubble);

logicHandler.handleBubbleGenerator();
animate();

function animate() {
    ctx.fillStyle = 'rgba(210, 210, 210, .8)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    bubbles.forEach((bubble, index) => {
        let unlock = true;
        let j = (bubble.isUnlocked() ? index + 1 : 0);
        for (; j < bubbles.length; j++) {
            if (!bubble.collisionDetector(bubbles[j]))
                unlock = false;
        }

        if (unlock && bubble.isWallLocked())
            bubble.unlock();
        bubble.update(ctx);
    });
    for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i];






    }
    sparks.forEach((spark, index) => {
        spark.update(ctx);
        if (spark.isDead()) {
            sparks.splice(index, 1);
        }
    });

    requestAnimationFrame(animate);
}








