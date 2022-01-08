import { Injectable } from "@angular/core";
import { PlayerDto, Position, Tile } from "../../../shared";
import { ClientEvent } from "./client-event";
import { MessageBus } from "./message-bus";
import { PlayerManager } from "./player-manager";
import { TileManager } from "./tile-manager";
import * as ROT from 'rot-js';

@Injectable({
    providedIn: 'root'
})
export class Camera {
    position!: Position;
    radius!: number;

    visibleTiles!: Tile[];
    visiblePlayers!: PlayerDto[];

    left!: number;
    right!: number;
    top!: number;
    bottom!: number;

    constructor(
        private tileManager: TileManager,
        private playerManager: PlayerManager,
        private messageBus: MessageBus,
    ) {
        this.radius = 8;
        this.position = new Position();

        this.refreshBounds();
        this.refreshVisiblePlayers();
        this.refreshVisibleTiles();

        this.messageBus.subscribe(ClientEvent.ClientUpdatedPlayer, (player: PlayerDto) => {
            this.refreshVisiblePlayers();
        });
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
        const coordinatesInFOV = this.getCoordinatesInFOV();
        
        for(let x = this.left; x <= this.right; ++x) {
            for(let y = this.top; y <= this.bottom; ++y) {
                
                const tile = this.tileManager.getTile(x, y);

                if(!tile) {
                    continue;
                }

                tile.inFOV = coordinatesInFOV.has(`${x},${y}`);

                visibleTiles.push(tile);
            }
        }

        this.visibleTiles = visibleTiles;
    }

    getCoordinatesInFOV() {
        const fieldOfView = new ROT.FOV.PreciseShadowcasting((x, y) => {
            const tile = this.tileManager.getTile(x, y);

            if(!tile) {
                return false;
            }

            if(tile.type === 0) {
                return false;
            }

            return true;
        });

        const coordinatesInFieldOfView = new Set<string>();

        fieldOfView.compute(this.position.x, this.position.y, this.radius + 1, (x, y, r, visibility) => {
            coordinatesInFieldOfView.add(`${x},${y}`);
        });

        return coordinatesInFieldOfView;
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

    moveToPosition(position: Position, refresh: boolean = true) {
        this.position.x = position.x;
        this.position.y = position.y;
        
        if(refresh) {
            this.refreshBounds();
            this.refreshVisiblePlayers();
            this.refreshVisibleTiles();
        }
    }
}