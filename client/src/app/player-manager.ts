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

    moveMe(direction: string): string {

        // move this into a method on the Position object, have it return a new object the same way as this does
        const newPosition = this.me.position.clone();

        switch (direction) {
            case 'right': newPosition.x += 1; break;
            case 'left': newPosition.x -= 1; break;
            case 'down': newPosition.y += 1; break;
            case 'up': newPosition.y -= 1; break;
        }
        //////////////////////////////////////////////

        const playerCollision = this.otherPlayers.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);
        const onTile = this.tileManager.isOnTile(newPosition);

        const blocked = playerCollision || !onTile;

        if (blocked) {
            this.me.action = `face-${direction}`;
            
            if(this.me.direction !== direction) {
                this.me.direction = direction;
                return 'direction-changed';
            }

            return 'blocked';
        }

        this.me.action = `walk-${direction}`;
        this.me.position = newPosition;
        this.me.direction = direction;
        
        return 'position-changed';
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

    updatePlayer(playerDto: PlayerDto) {
        let player = this.otherPlayers.find(player => player.email === playerDto.email);

        if (!player) {
            console.warn('received playerDto for player not in otherPlayers list');
            return;
        }

        const moving = !player.position.equals(playerDto.position);
        
        player.position = playerDto.position;
        player.direction = playerDto.direction;
        player.action = `${moving ? 'walk' : 'face'}-${playerDto.direction}`;

        this.messageBus.publish(ClientEvent.ClientUpdatedPlayer, player);
    }

    addPlayer(playerDto: PlayerDto) {
        const existingPlayer = this.otherPlayers.find(player => player.email === playerDto.email);

        if(existingPlayer) {
            return;
        }

        this.otherPlayers.push(playerDto);
    }
}
