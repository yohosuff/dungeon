import { Injectable } from '@angular/core';
import { Position, Tile } from '../../../shared';

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

    for(const key of tilesMap.keys()) {
      const tile = tilesMap.get(key) as Tile;
      tilesMap.set(key, Tile.reconstruct(tile));
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

  getTileByXY(x: number, y: number) {
    const position = new Position(x, y);
    const coordinateString = position.toCoordinateString();
    return this.tilesMap.get(coordinateString);
  }

  getTileByPosition(position: Position) {
    return this.getTileByXY(position.x, position.y);
  }
}
