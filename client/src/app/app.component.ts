import { Component, HostListener } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { DungeonEvent, PlayerDto } from '../../../shared';
import { Game } from './game';
import { Constants } from './constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  anonymousSocket!: Socket;
  anonymousSocketConnected: boolean;

  authenticatedSocket!: Socket;
  authenticatedSocketConnected: boolean;

  game: Game;

  constructor() {  
    this.game = new Game();

    this.anonymousSocketConnected = false;
    this.authenticatedSocketConnected = false;
    
    const token = localStorage.getItem(Constants.DungeonToken);

    if(token) {
      this.startGame(token);
    } else {
      this.establishAnonymousSocketConnection();
    }
  }

  establishAnonymousSocketConnection() {
    this.anonymousSocket = io(`${Constants.BaseUrl}/anonymous`);

    this.anonymousSocket.on(DungeonEvent.Connect, () => {
      this.anonymousSocketConnected = true;
    });

    this.anonymousSocket.on(DungeonEvent.LoginFailed, () => {
      console.log('login failed');
    });

    this.anonymousSocket.on(DungeonEvent.EmailAlreadyTaken, () => {
      console.log('email already taken');
    });

    this.anonymousSocket.on(DungeonEvent.LoginSuccessful, token => {
      localStorage.setItem(Constants.DungeonToken, token);
      this.startGame(token);
    });

    this.anonymousSocket.on(DungeonEvent.Registered, token => {
      localStorage.setItem(Constants.DungeonToken, token);
      this.startGame(token);
    });

    this.anonymousSocket.on(DungeonEvent.Disconnect, () => {
      this.anonymousSocketConnected = false;
    });    
  }

  establishAuthenticatedSocketConnection(token: string) {
    const authenticatedSocket = io(`${Constants.BaseUrl}/authenticated`, { auth: { token } });

    authenticatedSocket.on(DungeonEvent.ConnectError, (error: Error) => {
      console.warn('could not connect authenticated socket with token', token);
      console.warn(error);
      this.establishAnonymousSocketConnection();
      authenticatedSocket.removeAllListeners();
    });

    this.authenticatedSocket = authenticatedSocket;

    authenticatedSocket.on(DungeonEvent.Connect, () => {
      if(this.anonymousSocket) {
        this.anonymousSocket.disconnect();
      }
      this.authenticatedSocketConnected = true;
    });

    authenticatedSocket.on(DungeonEvent.Disconnect, () => {
      this.authenticatedSocketConnected = false;
      this.establishAnonymousSocketConnection();
    });

    return authenticatedSocket;
  }

  logout() {
    localStorage.removeItem(Constants.DungeonToken);
    this.authenticatedSocket?.disconnect();
  }

  startGame(token: string) {
    console.log('startGame');
    const authenticatedSocket = this.establishAuthenticatedSocketConnection(token);
    this.game.connect(authenticatedSocket);
  }

  onTransitionEnd() {
    const game = this.game as Game;
    game.transitioning = false;
    
    if(game.me.action === 'walk-left') {
      game.me.action = 'face-left';
    } else if(game.me.action === 'walk-right') {
      game.me.action = 'face-right';
    } else if (game.me.action === 'walk-up') {
      game.me.action = 'face-up';
    } else if (game.me.action === 'walk-down') {
      game.me.action = 'face-down';
    }
  }

  onOtherPlayerTransitionEnd(player: PlayerDto) {
    console.log('onOtherPlayerTransitionEnd', player.action);
    player.action = this.getStopWalkingAction(player.action as string);
  }

  getStopWalkingAction(action: string) {
    const direction = action.split("-")[1];
    return `face-${direction}`;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const game = this.game as Game;
    game.input.set(event.code, true);
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    const game = this.game as Game;
    game.input.set(event.code, false);

    if (event.code === 'KeyP') {
      console.log('other players', game.otherPlayers);
      console.log('me', game.me);
    }

    if (event.code === 'KeyM') {
      game.autoMoveRight = !game.autoMoveRight;
    }
  }
}
