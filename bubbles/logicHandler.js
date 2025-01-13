import { Bubble } from './bubble.js';
import { Spark } from './decorations.js';

export function LogicHandler (width, height, mass, radius, bubbleArray, sparkArray, ctx){
    LogicHandler.height = height;
    LogicHandler.width = width;

    function handleBubbleGenerator(){
         createBubblesRecursively(numberOfBubblesPerScreenSize(), 600);
    }
    function numberOfBubblesPerScreenSize() {
        const bubbleSize = (Math.sqrt(mass) * radius) * 2;
        const maxBubbleW = LogicHandler.width / bubbleSize;
        const maxBubbleH = LogicHandler.height / bubbleSize;
        return Math.floor((maxBubbleW * maxBubbleH) * .33);
    }
    
    function createBubblesRecursively(count, delay) {
        if (count <= 0) return;
        setTimeout(() => {
            bubbleArray.push(createBubble());
            createBubblesRecursively(count - 1, delay);
        }, delay);
    }
    function createBubble() {
        return new Bubble({
            position: {
                x: 100,
                y: LogicHandler.height
            },
            velocity: {
                x: (3 * Math.random()),
                y: -10
            },
            colorPhase: Math.floor(6 * Math.random()),
            color: firstColor(),
            mass,
            radius
        });
    }
    
    function firstColor() {
        return [Math.floor(255 * Math.random()),
        Math.floor(255 * Math.random()),
        Math.floor(255 * Math.random())
        ];
    }

    function createSparks(mouseX, mouseY, color) {
        for (let i = 0; i < 20; i++) {
            sparkArray.push(new Spark(mouseX, mouseY, color));
        }
    }

    function removeBubble(event) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        for (let i = bubbleArray.length - 1; i >= 0; i--) {
            let bubble = bubbleArray[i];
            const xdiff = mouseX - bubble.position.x;
            const ydiff = mouseY - bubble.position.y;
            const distance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
            if (distance < bubble.radius) {
                bubbleArray.splice(i, 1);
                createSparks(mouseX, mouseY, bubble.rgb);
                setTimeout(() => {
                    bubbleArray.push(createBubble());
                }, 3000);
            }
        }
    }
    return{
        handleBubbleGenerator,
        createSparks,
        createBubble,
        removeBubble
    };
}