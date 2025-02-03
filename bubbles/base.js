import { LogicHandler } from './logicHandler.js';

const canvas = document.querySelector('#theCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const BubbleRadius = 35;
const BubbleMass = 5;

let sparks = [];
let bubbles = [];


const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    logicHandler.updateSize(canvas.width, canvas.height);
    bubbles.forEach(bubble => bubble.setCanvasDimensions(canvas.width, canvas.height));
};
const logicHandler = LogicHandler(canvas.width, canvas.height, BubbleMass, BubbleRadius, bubbles, sparks, ctx);

window.addEventListener('resize', handleResize);
window.addEventListener('fullscreenchange', handleResize);
canvas.addEventListener('mousedown', logicHandler.removeBubble);

logicHandler.handleBubbleGenerator();
animate();

function animate() {
    ctx.fillStyle = 'rgba(210, 210, 210, .8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach((bubble, index) => {
        let unlock = true;
        for (let j = 0; j < bubbles.length; j++) {
            if (!bubble.checkIfCollided(bubbles[j]))
                unlock = false;
        }

        if (unlock && bubble.isWallLocked())
            bubble.unlock();
        bubble.update();
    });

    sparks.forEach((spark, index) => {
        if (spark.update()) {
            sparks.splice(index, 1);
        }
    });

    requestAnimationFrame(animate);
}








