import { Component, HostListener } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { PlayerDto, Position } from '../../../shared/out';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  socket: Socket;
  position: Position;
  transitioning: boolean;
  queuedMove?: string;
  input: Map<string, boolean>;
  moveStart: number;
  waitingForServer: boolean;
  players: PlayerDto[];

  constructor() {
    this.players = [];
    this.waitingForServer = false;
    this.moveStart = performance.now();
    this.input = new Map<string, boolean>();
    this.transitioning = false;
    this.position = new Position(0, 0);
    
    const socket = io('http://localhost:3000');
    
    this.socket = socket;
    
    socket.on("connect", () => {
      console.log('connected');
    });

    socket.on('update-position', playerDto => {
      this.position.x = playerDto.position.x;
      this.position.y = playerDto.position.y;
      this.waitingForServer = false;
      this.handleQueuedMove();
    });

    window.requestAnimationFrame(this.loop.bind(this));
  }

  handleQueuedMove() {
    if(this.queuedMove) {
      this.move(this.queuedMove);
      this.queuedMove = undefined;
    }
  }

  onTransitionEnd() {
    this.transitioning = false;
    this.handleQueuedMove();
  }

  loop(timeStamp: DOMHighResTimeStamp) {
    this.handleInput();
    window.requestAnimationFrame(this.loop.bind(this));
  }

  handleInput() {
    const right = !!this.input.get('KeyD') || !!this.input.get('ArrowRight');
    const left = !!this.input.get('KeyA') || !!this.input.get('ArrowLeft');
    const down = !!this.input.get('KeyS') || !!this.input.get('ArrowDown');
    const up = !!this.input.get('KeyW') || !!this.input.get('ArrowUp');
    
    if(right) {
      this.move('right');
    } else if(left) {
      this.move('left');
    } else if(down) {
      this.move('down');
    } else if(up) {
      this.move('up');
    }
  }

  move(direction: string) {
    if(this.transitioning || this.waitingForServer) {
      if(performance.now() - this.moveStart > 150) {
        this.queuedMove = direction;
      }
      return;
    }

    this.transitioning = true;
    this.waitingForServer = true;
    this.moveStart = performance.now();

    switch (direction) {
      case 'right': this.position.x += 1; break;
      case 'left': this.position.x -= 1; break;
      case 'down': this.position.y += 1; break;
      case 'up': this.position.y -= 1; break;
    }

    this.socket.emit('move', direction);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.input.set(event.code, true);
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.input.set(event.code, false);
  }
}
