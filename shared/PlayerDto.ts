import { Position } from ".";

export class PlayerDto {
    position: Position;
    email?: string;
    action?: string;

    constructor(x: number = 0, y: number = 0) {
        this.position = new Position(x, y);
    }
}
