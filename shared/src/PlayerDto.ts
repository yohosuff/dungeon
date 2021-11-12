import { Position } from "./Position";

export class PlayerDto {
    id: string;
    position: Position;

    constructor(x: number = 0, y: number = 0) {
        this.position = new Position(x, y);
        this.id = '';
    }
}
