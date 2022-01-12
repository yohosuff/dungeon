import { Injectable } from "@angular/core";
import { PlayerDto } from "../../../shared";
import { ClientEvent } from "./client-event";
import { MessageBus } from "./message-bus";
import { TileManager } from "./tile-manager";

@Injectable({
    providedIn: 'root'
})
export class PlayerManager {
    
    me!: PlayerDto;
    otherPlayers!: PlayerDto[];
    
    constructor(
        private messageBus: MessageBus,
        private tileManager: TileManager
    ) {
        this.me = new PlayerDto();
        this.otherPlayers = [];

        this.messageBus.subscribe(ClientEvent.ServerAddedPlayer, (playerDto: PlayerDto) => {
            this.addPlayer(playerDto);
        });

        this.messageBus.subscribe(ClientEvent.ServerUpdatedPlayer, (playerDto: PlayerDto) => {
            if (playerDto.email === this.me.email) {
                this.messageBus.publish(ClientEvent.ServerUpdatedMe, playerDto);
            } else {
                this.updatePlayer(playerDto);
            }
        });
    }

    // this will be necessary to properly display a column of other players
    sortOtherPlayersByY() {
        this.otherPlayers.sort((a, b) => a.position.y - b.position.y);
    }

    getOtherPlayersAboveMe() {
        return this.otherPlayers.filter(player => player.position.y < this.me.position.y);
    }

    getOtherPlayersBelowMe() {
        return this.otherPlayers.filter(player => player.position.y >= this.me.position.y);
    }

    moveMe(direction: string) {
        this.me.actionStartTime = performance.now();
        this.me.animating = true;
        this.me.lastPosition = this.me.position;

        const newPosition = this.me.position.move(direction);
        const playerCollision = this.otherPlayers.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);
        const onTile = this.tileManager.isOnTile(newPosition);
        const cannotMove = playerCollision || !onTile;

        if (cannotMove) {
            return;
        }
        
        this.me.position = newPosition;
    }

    updatePlayer(playerDto: PlayerDto) {
        let player = this.otherPlayers.find(player => player.email === playerDto.email);

        if (!player) {
            console.warn('received playerDto for player not in otherPlayers list');
            return;
        }

        const moved = !player.position.equals(playerDto.position);
        
        player.lastPosition = player.position;
        player.position = playerDto.position;
        player.direction = playerDto.direction;
        player.actionStartTime = performance.now();
        player.animating = moved;
        player.pressingKey = playerDto.pressingKey;

        this.messageBus.publish(ClientEvent.ClientUpdatedPlayer, player);
    }

    addPlayer(playerDto: PlayerDto) {
        const existingPlayer = this.otherPlayers.find(player => player.email === playerDto.email);

        if(existingPlayer) {
            return;
        }

        this.otherPlayers.push(playerDto);
    }

    loadPlayers(players: PlayerDto[], email: string) {
        this.otherPlayers = [];

        for (let player of players) {
            
            if (player.email === email) {
                this.me = player;
                continue;
            }

            if (this.otherPlayers.some(otherPlayer => otherPlayer.email === player.email)) {
                continue;
            }

            this.otherPlayers.push(player);
        }
    }
}
