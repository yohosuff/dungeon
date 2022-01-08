import { Injectable } from "@angular/core";
import { Position, Tile } from "../../../shared";

@Injectable({
    providedIn: 'root'
})
export class TileManager {
    tilesMap!: Map<string, Tile>;

    constructor() {
        this.tilesMap = new Map<string, Tile>();
    }

    loadTiles(tiles: string) {
        const tilesMap = new Map<string, Tile>(JSON.parse(tiles));

        for(let key of tilesMap.keys()) {
            tilesMap.set(key, Tile.reconstruct(tilesMap.get(key)!));
        }

        this.tilesMap = tilesMap;
    }

    isOnTile(position: Position) {
        const coordinateString = position.toCoordinateString();
        const tile = this.tilesMap.get(coordinateString);

        if(!tile) {
            return false;
        }

        return tile.type === 1;
    }

    getTile(x: number, y: number) {
        const position = new Position(x, y);
        const coordinateString = position.toCoordinateString();
        return this.tilesMap.get(coordinateString);
    }
}
