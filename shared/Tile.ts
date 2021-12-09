import { Position } from ".";

export class Tile {
    position: Position;
    
    constructor(x: number = 0, y: number = 0) {
        this.position = new Position(x, y);
    }

    static reconstruct(data: Tile): Tile {
        const dto = new Tile();
        dto.position = Position.reconstruct(data.position);
        return dto;
    }
}
