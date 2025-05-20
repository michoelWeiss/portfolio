export function HandleCollision(){

    function hitWall(bubble) {
        const { position, border, velocity} = bubble;
        console.log(border)
        if (position.x >  border.right) {
            position.x = border.right;
            velocity.x *= -1;
        }
        else if (position.x < border.left) {
            position.x = border.left;
            velocity.x *= -1;
        }
        if (bubble.isWallLocked()) {
            if (position.y > border.bottom) {
                position.y = border.bottom;
                velocity.y *= -1;
            }
            else if (position.y < border.top) {
                position.y = border.top;
                velocity.y *= -1;
            }
        }
    }

    function collisionDetector(bubble, otherBubble) {
        if (bubble === otherBubble) return true;
        const { position, radius} = bubble;
        const { position: otherP, radius: otherR} = otherBubble;

        const xdiff = position.x - otherP.x;
        const ydiff = position.y - otherP.y;
        const distance = Math.sqrt(xdiff * xdiff + ydiff * ydiff); // Finds distance from center of circle A to B
        if (distance <= radius + otherR) {
            if (bubble.isUnlocked() && otherBubble.isUnlocked()) {
                collisionResolution(bubble, otherBubble);
            }
            return false;
        }
        return true;
    }
    function collisionResolution(bubble, otherBubble) {
        const { position, velocity, mass} = bubble;
        const { position: otherP, velocity: otherV, mass: otherM} = otherBubble;

        let mSum = mass + otherM;
        let impact = {
            x: otherP.x - position.x,
            y: otherP.y - position.y
        };
        let magnitude = Math.sqrt(impact.x ** 2 + impact.y ** 2);
        impact.x /= magnitude;
        impact.y /= magnitude;
        let vDiff = {
            x: otherV.x - velocity.x,
            y: otherV.y - velocity.y
        };
        let dotProduct = vDiff.x * impact.x + vDiff.y * impact.y;
        if (dotProduct > 0) return;
        let impulse = (2 * dotProduct) / mSum;
        velocity.x += (impulse * otherM * impact.x);
        velocity.y += (impulse * otherM * impact.y);
        otherV.x -= (impulse * mass * impact.x);
        otherV.y -= (impulse * mass * impact.y);
    }

    return{
        hitWall,
        collisionDetector
    };
}