import { Injectable } from '@angular/core';
import { ClientEvent } from './client-event';
import { MessageBus } from './message-bus';
import { Player } from './player';
import { TileManager } from './tile-manager';

@Injectable({
  providedIn: 'root'
})
export class PlayerManager {
    
  me!: Player;
  otherPlayers!: Player[];
    
  constructor(
        private _messageBus: MessageBus,
        private _tileManager: TileManager
  ) {
    this.me = new Player();
    this.otherPlayers = [];

    this._messageBus.subscribe(ClientEvent.ServerAddedPlayer, (player: Player) => {
      this.addPlayer(player);
    });

    this._messageBus.subscribe(ClientEvent.ServerRemovedPlayer, (username: string) => {
      const player = this.otherPlayers.find(player => player.username === username);
            
      if(!player) {
        return;
      }

      const playerIndex = this.otherPlayers.indexOf(player);
      this.otherPlayers.splice(playerIndex, 1);
    });

    this._messageBus.subscribe(ClientEvent.ServerUpdatedPlayer, (player: Player) => {
      if (player.username === this.me.username) {
        this._messageBus.publish(ClientEvent.ServerUpdatedMe, player);
      } else {
        this.updatePlayer(player);
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
    const onTile = this._tileManager.isOnTile(newPosition);
    const cannotMove = playerCollision || !onTile;

    if (cannotMove) {
      return;
    }
        
    this.me.position = newPosition;
  }

  updatePlayer(updatedPlayer: Player) {
    const player = this.otherPlayers.find(player => player.username === updatedPlayer.username);

    if (!player) {
      console.warn('received playerDto for player not in otherPlayers list');
      return;
    }

    const moved = !player.position.equals(updatedPlayer.position);
        
    player.lastPosition = player.position;
    player.position = updatedPlayer.position;
    player.direction = updatedPlayer.direction;
    player.actionStartTime = performance.now();
    player.animating = moved;
    player.pressingKey = updatedPlayer.pressingKey;
    player.connected = updatedPlayer.connected;

    this._messageBus.publish(ClientEvent.ClientUpdatedPlayer, player);
  }

  addPlayer(player: Player) {
    const existingPlayer = this.otherPlayers.find(p => p.username === player.username);

    if(existingPlayer) {
      this.updatePlayer(player);
      return;
    }

    this.otherPlayers.push(player);
  }

  loadPlayers(players: Player[], username: string) {
    this.otherPlayers = [];

    for (const player of players) {
            
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
