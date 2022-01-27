import { PlayerDto, Position } from "../../../shared";

export class Player {
    directionIndexMap: Map<string,number>;

    lastPosition!: Position;
    position!: Position;
    direction!: string;
    actionStartTime!: number;
    animating!: boolean;
    pressingKey!: boolean;
    username!: string;
    action!: string;
    avatar!: string;
    animatedPosition!: Position;

    readonly animationDuration = 200;
    connected!: boolean;

    constructor() {
        const directionIndexMap = new Map<string,number>();
        directionIndexMap.set('up', 8);
        directionIndexMap.set('left', 9);
        directionIndexMap.set('down', 10);
        directionIndexMap.set('right', 11);
        this.directionIndexMap = directionIndexMap;
    }

    static reconstruct(dto: PlayerDto): Player {
        const player = new Player();
        const position = Position.reconstruct(dto.position);
        player.position = position;
        player.lastPosition = position.clone();
        player.username = dto.username;
        player.action = `face-${dto.direction}`;
        player.direction = dto.direction;
        player.avatar = dto.avatar;
        player.pressingKey = dto.pressingKey;
        player.actionStartTime = performance.now();
        player.connected = dto.connected;
        return player;
    }

    getDirectionIndex() {
        return this.directionIndexMap.get(this.direction);
    }

    getFrameIndex() {
        const timePerFrame = 50;
        const frameCount = 8;
        const frameIndex = 1 + Math.floor((performance.now() % (timePerFrame * frameCount)) / timePerFrame);
        return frameIndex;
    }

    // https://stackoverflow.com/questions/43626268/html-canvas-move-circle-from-a-to-b-with-animation
    // Magnitude of vectors will always be 1 for players moving 1 square at a time.
    // Players will only ever move in one dimension at a time, but it is just simpler to update both dimensions.
    updateAnimatedPosition() {
        const animationElapsed = performance.now() - this.actionStartTime;
        const percentComplete = Math.min(animationElapsed, this.animationDuration) / this.animationDuration;

        // could probably use a vector type here to do subtraction, multiplication, and addition
        const x = this.position.x - this.lastPosition.x;
        const y = this.position.y - this.lastPosition.y;
        
        this.animatedPosition = new Position(
            this.lastPosition.x + x * percentComplete,
            this.lastPosition.y + y * percentComplete,
        );
    }
}
