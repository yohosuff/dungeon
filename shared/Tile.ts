import { Position } from ".";

export class Tile {
    worldPosition: Position;
    localPosition: Position;
    
    // 0 - empty (boundary; unwalkable)
    // 1 - floor (walkable)
    type: number;
    
    constructor(x: number = 0, y: number = 0, type: number = 0) {
        this.worldPosition = new Position(x, y);
        this.localPosition = new Position()
        this.type = type;
    }

    updateLocalPosition(referencePosition: Position) {
        this.localPosition.x = this.worldPosition.x - referencePosition.x;
        this.localPosition.y = this.worldPosition.y - referencePosition.y;
    }

    static reconstruct(data: Tile): Tile {
        const tile = new Tile();
        tile.worldPosition = Position.reconstruct(data.worldPosition);
        tile.type = data.type;
        return tile;
    }
}
