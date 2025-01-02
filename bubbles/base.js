import { Spark } from './decorations.js';
import { Bubble } from './bubble.js';
(function () {
    'use strict';

    const canvas = document.querySelector('#theCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight + 200;  // extra room so bubbles can manafest below the screen 

    Bubble.setCanvasDimensions(window.innerWidth, window.innerHeight);

    canvas.addEventListener('click', removeBubble);

    let sparks = [];
    let bubbles = [];

    function animate() {

        ctx.fillStyle = 'rgba(210, 210, 210, .8)';

        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = 0; i < bubbles.length; i++) {
            const bubble = bubbles[i];

            let unlock = true;
            let j = (bubble.isUnlocked() ? i + 1 : 0);
            for (; j < bubbles.length; j++) {
                if (!bubble.collisionDetector(bubbles[j]))
                    unlock = false;
            }
            if (unlock && bubble.isWallLocked())
                bubble.unlock();
            bubble.update(ctx);

        }
        sparks.forEach((spark, index) => {
            spark.update(ctx);
            if (spark.isDead()) {
                sparks.splice(index, 1);
            }
        });

        requestAnimationFrame(animate);
    }
    function firstColor() {
        return [Math.floor(255 * Math.random()),
        Math.floor(255 * Math.random()),
        Math.floor(255 * Math.random())
        ];
    }

    function makeBubble() {
        bubbles.push(new Bubble({
            position: {
                x: 100,
                y: canvas.height
            },
            velocity: {
                x: (3 * Math.random()),
                y: -11
            },
            colorPhase: Math.floor(6 * Math.random()),
            color: firstColor()
        }));
    }
    function numberOfBubblesPerScreenSize() {
        const bubbleSize = (Math.sqrt(5) * 35) * 2;
        const maxBubbleW = canvas.width / bubbleSize;
        const maxBubbleH = window.innerHeight / bubbleSize; // window.innerWidth, window.innerHeight
        return Math.floor((maxBubbleW * maxBubbleH) * .33);
    }
    function removeBubble(event) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        for (let i = bubbles.length - 1; i >= 0; i--) {
            let bubble = bubbles[i];
            const xdiff = mouseX - bubble.position.x;
            const ydiff = mouseY - bubble.position.y;
            const distance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
            if (distance < bubble.radius) {
                bubbles.splice(i, 1);
                createSparks(mouseX, mouseY, bubble.rgb);
                setTimeout(() => {
                    makeBubble();
                }, 3000);
            }
        }
    }
    function createSparks(mouseX, mouseY, color) {
        for (let i = 0; i < 20; i++) {
            sparks.push(new Spark(mouseX, mouseY, color));
        }
    }

    function createBubblesRecursively(count, delay) {
        if (count <= 0) return;

        setTimeout(() => {
            makeBubble();
            console.log(`Bubble ${count} created`);
            createBubblesRecursively(count - 1, delay);
        }, delay);
    }
    createBubblesRecursively(numberOfBubblesPerScreenSize(), 600);
    animate();
}()); 