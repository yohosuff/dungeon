import { Position } from ".";

export class Tile {
    position: Position;
    
    // 0 - empty (boundary; unwalkable)
    // 1 - floor (walkable)
    type: number;
    
    constructor(x: number = 0, y: number = 0, type: number = 0) {
        this.position = new Position(x, y);
        this.type = type;
    }

    static reconstruct(data: Tile): Tile {
        const tile = new Tile();
        tile.position = Position.reconstruct(data.position);
        tile.type = data.type;
        return tile;
    }
}
