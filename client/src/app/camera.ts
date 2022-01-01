import { Injectable } from "@angular/core";
import { PlayerDto, Position, Tile } from "../../../shared";
import { ClientEvent } from "./client-event";
import { MessageBus } from "./message-bus";
import { PlayerManager } from "./player-manager";
import { TileManager } from "./tile-manager";
import { Border } from "./border";
import * as ROT from 'rot-js';

@Injectable({
    providedIn: 'root'
})
export class Camera {
    position!: Position;
    radius!: number;

    visibleTiles!: Tile[];
    borders!: Border[];
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
        this.radius = 9;
        this.position = new Position();

        this.refreshBounds();
        this.refreshVisiblePlayers();
        this.refreshVisibleTiles();
        this.refreshBorders();

        this.messageBus.subscribe(ClientEvent.ClientUpdatedPlayer, (player: PlayerDto) => {
            this.refreshVisiblePlayers();
        });
    }

    refreshBorders() {
        const leftBorder = new Border();
        leftBorder.left = this.left - 1;
        leftBorder.top = this.top - 1;
        leftBorder.width = 3;
        leftBorder.height = (this.radius + 1) * 2 + 1;

        const rightBorder = new Border();
        rightBorder.left = this.right - 1;
        rightBorder.top = this.top - 1;
        rightBorder.width = 3;
        rightBorder.height = (this.radius + 1) * 2 + 1;

        const topBorder = new Border();
        topBorder.left = this.left - 1;
        topBorder.top = this.top - 1;
        topBorder.width = (this.radius + 1) * 2 + 1;
        topBorder.height = 3;

        const bottomBorder = new Border();
        bottomBorder.left = this.left - 1;
        bottomBorder.top = this.bottom - 1;
        bottomBorder.width = (this.radius + 1) * 2 + 1;
        bottomBorder.height = 3;
                
        this.borders = [leftBorder, rightBorder, topBorder, bottomBorder];
    }

    refreshBounds() {
        this.left = this.position.x - this.radius;
        this.right = this.position.x + this.radius;
        this.top = this.position.y - this.radius;
        this.bottom = this.position.y + this.radius;
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
        const fov = new ROT.FOV.PreciseShadowcasting((x, y) => {
            const tile = this.tileManager.getTile(x, y);

            if(!tile) {
                return false;
            }

            if(tile.type === 0) {
                return false;
            }

            return true;
        });

        const coordinatesInFOV = new Set<string>();

        fov.compute(this.position.x, this.position.y, 9, (x, y, r, visibility) => {
            coordinatesInFOV.add(`${x},${y}`);
        });

        return coordinatesInFOV;
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
        this.moveToCoordinates(position.x, position.y);
    }

    moveToCoordinates(x: number, y: number) {
        // const innerRadius = this.radius - 1;
        
        // if(x - innerRadius >= 0 && x + innerRadius <= 14) {
        //     this.position.x = x;
        // }
        
        this.position.x = x;
        this.position.y = y;
        
        this.refreshBounds();
        this.refreshVisiblePlayers();
        this.refreshVisibleTiles();
    }
}