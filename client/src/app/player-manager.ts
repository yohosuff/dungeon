import { Injectable } from "@angular/core";
import { PlayerDto } from "../../../shared";
import { ClientEvent } from "./client-event";
import { MessageBus } from "./message-bus";
import { Player } from "./player";
import { TileManager } from "./tile-manager";

@Injectable({
    providedIn: 'root'
})
export class PlayerManager {
    
    me!: Player;
    otherPlayers!: Player[];
    
    constructor(
        private messageBus: MessageBus,
        private tileManager: TileManager
    ) {
        this.me = new Player();
        this.otherPlayers = [];

        this.messageBus.subscribe(ClientEvent.ServerAddedPlayer, (player: Player) => {
            this.addPlayer(player);
        });

        this.messageBus.subscribe(ClientEvent.ServerUpdatedPlayer, (playerDto: PlayerDto) => {
            if (playerDto.username === this.me.username) {
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
        let player = this.otherPlayers.find(player => player.username === playerDto.username);

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

    addPlayer(player: Player) {
        const existingPlayer = this.otherPlayers.find(p => p.username === player.username);

        if(existingPlayer) {
            return;
        }

        this.otherPlayers.push(player);
    }

    loadPlayers(players: Player[], username: string) {
        this.otherPlayers = [];

        for (let player of players) {
            
            if (player.username === username) {
                this.me = player;
                continue;
            }

            if (this.otherPlayers.some(otherPlayer => otherPlayer.username === player.username)) {
                continue;
            }

            this.otherPlayers.push(player);
        }
    }
}
