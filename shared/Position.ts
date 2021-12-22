export class Position {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    equals(position: Position) {
        return this.x === position.x && this.y === position.y;
    }

    clone(): Position {
        return Position.reconstruct(this);
    }

    static reconstruct(data: Position): Position {
        return new Position(data.x, data.y);
    }

    toCoordinateString() {
        return `${this.x},${this.y}`;
    }

    move(direction: string) {
        const newPosition = this.clone();

        switch (direction) {
            case 'right': newPosition.x += 1; break;
            case 'left': newPosition.x -= 1; break;
            case 'down': newPosition.y += 1; break;
            case 'up': newPosition.y -= 1; break;
        }

        return newPosition;
    }
}
