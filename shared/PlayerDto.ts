import { Position } from ".";

// rename this PlayerData
export class PlayerDto {
    lastPosition!: Position;
    position!: Position;
    animatedPosition!: Position;
    
    email!: string;
    action!: string;
    direction!: string;
    avatar!: string;
    actionStartTime!: number;
    animating!: boolean;

    animationDuration = 200;

    directionIndexMap: Map<string,number>;
    
    constructor(x: number = 0, y: number = 0) {
        this.position = new Position(x, y);

        const directionIndexMap = new Map<string,number>();
        directionIndexMap.set('up', 8);
        directionIndexMap.set('left', 9);
        directionIndexMap.set('down', 10);
        directionIndexMap.set('right', 11);
        this.directionIndexMap = directionIndexMap;
    }

    getFrameIndex() {
        const timePerFrame = 50;
        const frameCount = 8;
        const frameIndex = 1 + Math.floor((performance.now() % (timePerFrame * frameCount)) / timePerFrame);

        return frameIndex;
    }

    getDirectionIndex() {
        return this.directionIndexMap.get(this.direction);
    }

    // https://stackoverflow.com/questions/43626268/html-canvas-move-circle-from-a-to-b-with-animation
    // magnitude of vectors will always be 1 for players moving 1 square at a time!!
    // players will only every move in one dimension at a time, but this is just simpler
    updateAnimatedPosition() {

        if(!this.animating) {
            return;
        }

        const animationElapsed = performance.now() - this.actionStartTime;
        const percentComplete = Math.min(animationElapsed, this.animationDuration) / this.animationDuration;

        if(percentComplete >= 1.0) {
            this.animating = false;
        }

        const x = this.position.x - this.lastPosition.x;
        const y = this.position.y - this.lastPosition.y;
        
        this.animatedPosition = new Position(
            this.lastPosition.x + x * percentComplete,
            this.lastPosition.y + y * percentComplete,
        );
    }

    static reconstruct(data: PlayerDto): PlayerDto {
        const dto = new PlayerDto();
        dto.position = Position.reconstruct(data.position);
        dto.email = data.email;
        dto.action = `face-${data.direction}`;
        dto.direction = data.direction;
        dto.avatar = data.avatar;
        return dto;
    }
}
