import { Injectable } from "@angular/core";
import { Position, Tile } from "../../../shared";
import { ClientEvent } from "./client-event";
import { MessageBus } from "./message-bus";
import { PlayerManager } from "./player-manager";
import { TileManager } from "./tile-manager";
import * as ROT from 'rot-js';
import { Player } from "./player";

@Injectable({
    providedIn: 'root'
})
export class Camera {
    position!: Position;
    radius = 8;

    visibleTiles!: Tile[];
    visiblePlayers!: Player[];

    left!: number;
    right!: number;
    top!: number;
    bottom!: number;
    coordinatesInFieldOfView!: Set<string>;

    constructor(
        private tileManager: TileManager,
        private playerManager: PlayerManager,
        private messageBus: MessageBus,
    ) {
        this.position = new Position();

        this.refreshBounds();
        this.refreshVisiblePlayers();
        this.refreshVisibleTiles();
        this.updateCoordinatesInFOV();

        this.messageBus.subscribe(ClientEvent.ClientUpdatedPlayer, (player: Player) => {
            this.refreshVisiblePlayers();
        });
    }

    getLocalPosition(worldPosition: Position) {
        const localPosition = new Position();
        localPosition.x = worldPosition.x - this.position.x + this.radius;
        localPosition.y = worldPosition.y - this.position.y + this.radius;
        return localPosition;
    }

    refreshBounds() {
        const radiusAdjusted = this.radius + 1;
        this.left = this.position.x - radiusAdjusted;
        this.right = this.position.x + radiusAdjusted;
        this.top = this.position.y - radiusAdjusted;
        this.bottom = this.position.y + radiusAdjusted;
    }

    refreshVisibleTiles() {
        const visibleTiles = [];
        this.updateCoordinatesInFOV();

        const left = Math.round(this.left);
        const right = Math.round(this.right);
        const top = Math.round(this.top);
        const bottom = Math.round(this.bottom);
        
        for(let x = left; x <= right; ++x) {
            for(let y = top; y <= bottom; ++y) {
                
                const tile = this.tileManager.getTileByXY(x, y);

                if(!tile) {
                    continue;
                }

                tile.inFOV = this.coordinatesInFieldOfView.has(`${x},${y}`);

                visibleTiles.push(tile);
            }
        }

        this.visibleTiles = visibleTiles;
    }

    updateCoordinatesInFOV() {
        const fieldOfView = new ROT.FOV.PreciseShadowcasting((x, y) => {
            const tile = this.tileManager.getTileByXY(x, y);

            if(!tile) {
                return false;
            }

            if(tile.type === 0) {
                return false;
            }

            return true;
        });

        const coordinatesInFieldOfView = new Set<string>();

        const x = Math.round(this.position.x);
        const y = Math.round(this.position.y);

        fieldOfView.compute(x, y, this.radius + 1, (x, y, r, visibility) => {
            const coordinateString = `${x},${y}`;
            coordinatesInFieldOfView.add(coordinateString);
        });

        this.coordinatesInFieldOfView = coordinatesInFieldOfView;
    }

    refreshVisiblePlayers() {
        const visiblePlayers = [];
        
        for(let player of this.playerManager.otherPlayers) {
            const visible = this.canSee(player.position);

            if(visible) {
                visiblePlayers.push(player);
            }
        }
        
        this.visiblePlayers = visiblePlayers;
    }

    canSee(position: Position) {
        return position.x >= this.left
            && position.x <= this.right
            && position.y >= this.top
            && position.y <= this.bottom;
    }

    moveToPosition(position: Position) {
        this.position.x = position.x;
        this.position.y = position.y;
        this.refreshBounds();
        this.refreshVisiblePlayers();
        this.refreshVisibleTiles();
    }
}
