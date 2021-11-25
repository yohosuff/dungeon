export class Position {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    equals(position: Position) {
        const result =
            this.x === position.x && 
            this.y === position.y;

        return result;
    }

    clone(): Position {
        return Position.reconstruct(this);
    }

    static reconstruct(data: Position): Position {
        const position = new Position();
        position.x = data.x;
        position.y = data.y;
        return position;
    }
}
