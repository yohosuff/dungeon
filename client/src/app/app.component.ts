import { Component, HostListener } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { PlayerDto } from '../../../shared/out';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  socket: Socket;
  
  input: Map<string, boolean>;

  transitioning: boolean;
  waitingForServer: boolean;
  
  me: PlayerDto;
  otherPlayers: PlayerDto[];
  autoMoveRight: boolean;

  constructor() {
    this.autoMoveRight = false;
    this.me = new PlayerDto();
    this.otherPlayers = [];
    this.waitingForServer = false;
    this.transitioning = false;
    this.input = new Map<string, boolean>();
    
    const socket = io('http://localhost:3000');

    this.socket = socket;

    socket.on("connect", () => {
      console.log('connected');
      socket.emit('request-players');
    });

    socket.on('players', (players: PlayerDto[]) => {
      console.log('got players!', players);

      for(let player of players) {
        if(player.id === socket.id) {
          this.me = player;
          continue;
        }

        if(this.otherPlayers.some(p => p.id === player.id)) {
          continue;
        }

        this.otherPlayers.push(player);
      }
    });

    socket.on('update-position', (playerDto: PlayerDto) => {

      if (playerDto.id === socket.id) {
        this.waitingForServer = false;
        return;
      }

      let player = this.otherPlayers.find(player => player.id === playerDto.id);

      if (!player) {
        player = playerDto;
        this.otherPlayers.push(player);
      }

      player.position = playerDto.position;
    });

    socket.on('player-left', id => {
      this.removePlayer(this.otherPlayers, id);
    });

    window.requestAnimationFrame(this.loop.bind(this));
  }

  removePlayer(players: PlayerDto[], id: string) {
    for (let i = players.length - 1; i >= 0; --i) {
      const player = players[i];
      if (player.id === id) {
        players.splice(i, 1);
        break;
      }
    }
  }

  onTransitionEnd() {
    this.transitioning = false;
  }

  loop(timeStamp: DOMHighResTimeStamp) {
    this.handleInput();
    window.requestAnimationFrame(this.loop.bind(this));
  }

  handleInput() {
    const right = this.input.get('KeyD') || this.input.get('ArrowRight');
    const left = this.input.get('KeyA') || this.input.get('ArrowLeft');
    const down = this.input.get('KeyS') || this.input.get('ArrowDown');
    const up = this.input.get('KeyW') || this.input.get('ArrowUp');

    if (right || this.autoMoveRight) {
      this.move('right');
    } else if (left) {
      this.move('left');
    } else if (down) {
      this.move('down');
    } else if (up) {
      this.move('up');
    }
  }

  move(direction: string) {
    
    if (this.transitioning || this.waitingForServer) {
      return;
    }

    const newPosition = {...this.me.position};

    switch (direction) {
      case 'right': newPosition.x += 1; break;
      case 'left': newPosition.x -= 1; break;
      case 'down': newPosition.y += 1; break;
      case 'up': newPosition.y -= 1; break;
    }

    const blocked = this.otherPlayers.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);

    if(blocked) {
      return;
    }
    
    this.me.position = newPosition;
    this.transitioning = true;
    this.waitingForServer = true;
    this.socket.emit('move', direction);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.input.set(event.code, true);
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.input.set(event.code, false);

    if(event.code === 'KeyP') {
      console.log('other players', this.otherPlayers);
      console.log('me', this.me);
    }

    if(event.code === 'KeyM') {
      this.autoMoveRight = !this.autoMoveRight;
    }
  }
}
