import { Injectable } from "@angular/core";
import { PlayerDto, Position, Tile } from "../../../shared";
import { ClientEvent } from "./client-event";
import { MessageBus } from "./message-bus";
import { PlayerManager } from "./player-manager";
import { TileManager } from "./tile-manager";

@Injectable({
    providedIn: 'root'
})
export class Camera {
    position!: Position;
    radius!: number;

    visibleTiles!: Tile[];
    borderTiles!: Tile[];
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
        this.radius = 5;
        this.position = new Position();

        this.refreshBounds();
        this.refreshVisiblePlayers();
        this.refreshVisibleTiles();

        this.messageBus.subscribe(ClientEvent.ClientUpdatedPlayer, (player: PlayerDto) => {
            player.updateLocalPosition(this.position);
            this.refreshVisiblePlayers();
        });
    }

    refreshBounds() {
        this.left = this.position.x - this.radius;
        this.right = this.position.x + this.radius;
        this.top = this.position.y - this.radius;
        this.bottom = this.position.y + this.radius;
    }

    refreshVisibleTiles() {
        const visibleTiles = [];
        const borderTiles = [];

        for(let x = this.left; x <= this.right; ++x) {
            for(let y = this.top; y <= this.bottom; ++y) {
                
                if(x === this.left || x === this.right || y === this.top || y === this.bottom) {
                    const borderTile = new Tile(x, y, 0);
                    borderTile.updateLocalPosition(this.position);
                    borderTiles.push(borderTile);
                }
                
                const tile = this.tileManager.getTile(x, y);

                if(!tile) {
                    continue;
                }

                tile.updateLocalPosition(this.position);

                visibleTiles.push(tile);
            }
        }

        this.visibleTiles = visibleTiles;
        this.borderTiles = borderTiles;
    }

    refreshVisiblePlayers() {
        const visiblePlayers = [];
        
        for(let player of this.playerManager.otherPlayers) {
            player.updateLocalPosition(this.position);
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
        this.refreshVisibleTiles();
        this.refreshVisiblePlayers();
    }
}