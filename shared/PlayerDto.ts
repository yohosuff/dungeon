import { Position } from ".";

export class PlayerDto {
    id: string;
    position: Position;
    email?: string;

    constructor(x: number = 0, y: number = 0) {
        this.position = new Position(x, y);
        this.id = '';
    }
}
