import { Component, HostListener } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Position } from './position';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  socket: Socket;
  position: Position;

  constructor() {
    this.position = new Position(0, 0);
    
    const socket = io('http://localhost:3000');
    
    this.socket = socket;
    
    socket.on("connect", () => {
      console.log('connected');
    });
  }

  @HostListener('document:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    switch(event.code) {
      case 'KeyD': this.position.x += 1; break;
      case 'KeyA': this.position.x -= 1; break;
      case 'KeyS': this.position.y += 1; break;
      case 'KeyW': this.position.y -= 1; break;
    }
  }
}
