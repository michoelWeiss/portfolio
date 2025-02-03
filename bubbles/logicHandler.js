import { Bubble } from './bubble.js';
import { Spark } from './decorations.js';

export function LogicHandler (width, height, mass, radius, bubbleArray, sparkArray, ctx){
    LogicHandler.height = height;
    LogicHandler.width = width;  
    LogicHandler.makingBubbles = false;
    LogicHandler.popSound = document.createElement('audio');
    LogicHandler.popSound.src = './Audio/popSound.mp3'; 
    LogicHandler.popSound.volume = 0.1;

    function updateSize(width, height){
        LogicHandler.height = height;
        LogicHandler.width = width; 
    }
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
        if (count <= 0) { LogicHandler.makingBubbles = false; return;}
        LogicHandler.makingBubbles = true;
        setTimeout(() => {
            bubbleArray.push(createBubble());
            createBubblesRecursively(count - 1, delay);
        }, delay);
    }
    function createBubble() {
        return new Bubble({
            position: {
                x: 100,
                y: LogicHandler.height + 200   // extra room so bubbles can manafest below the screen 
            },
            velocity: {
                x: (3 * Math.random()),
                y: -10
            },
            colorPhase: Math.floor(6 * Math.random()),
            color: firstColor(),
            mass,
            radius, 
            width : LogicHandler.width, 
            height: LogicHandler.height,
            ctx
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
            sparkArray.push(new Spark(mouseX, mouseY, color, ctx));
        }
    }

    function removeBubble(event) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        bubbleArray.forEach( (bubble, index) => {
             const xdiff = mouseX - bubble.position.x;
            const ydiff = mouseY - bubble.position.y;
            const distance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
             if (distance < bubble.radius) {
                if (!LogicHandler.popSound.paused) {
                    LogicHandler.popSound.currentTime = 0;
                }
                LogicHandler.popSound.play();
                bubbleArray.splice(index, 1);
                createSparks(mouseX, mouseY, bubble.rgb);
                const maxNumOfBubbles = numberOfBubblesPerScreenSize();
                const makeNew = maxNumOfBubbles - bubbleArray.length;
                if(makeNew > 0 && !LogicHandler.makingBubbles)
                    createBubblesRecursively(makeNew, 1000);
            }
        });
    }
    return{
        handleBubbleGenerator,
        createSparks,
        createBubble,
        removeBubble,
        updateSize
    };
}