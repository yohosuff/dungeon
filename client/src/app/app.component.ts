import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { io, Socket } from 'socket.io-client';
import { DungeonEvent, PlayerDto } from '../../../shared';
import { Game } from './game';
import { Modal } from 'bootstrap';
import { Constants } from './constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  form: FormGroup;

  anonymousSocket?: Socket;
  anonymousSocketConnected: boolean;

  authenticatedSocket?: Socket;
  authenticatedSocketConnected: boolean;

  game: Game;

  constructor(
    private _formBuilder: FormBuilder
  ) {  
    this.game = new Game();

    this.form = this._formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.required],
    });

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
        this.anonymousSocket?.disconnect();
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

  getModalInstance(id: string) {
    const modalElement = document.getElementById(id) as Element;
    const modal = Modal.getInstance(modalElement) as Modal;
    return modal;
  }

  showRegisterModal() {
    const registerModalElement = document.getElementById('registerModal') as Element;
    const registerModal = new Modal(registerModalElement);
    this.form.reset();
    registerModal.show();
  }

  register() {
    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;
    this.anonymousSocket?.emit(DungeonEvent.Register, { email, password });
    this.getModalInstance('registerModal').hide();
  }

  showLoginModal() {
    const loginModalElement = document.getElementById('loginModal') as Element;
    const loginModal = new Modal(loginModalElement);
    this.form.reset();
    loginModal.show();
  }

  login() {
    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;
    this.anonymousSocket?.emit(DungeonEvent.Login, { email, password });
    this.getModalInstance('loginModal').hide();
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
    if(player.action === 'walk-left') {
      player.action = 'face-left';
    } else if(player.action === 'walk-right') {
      player.action = 'face-right';
    } else if (player.action === 'walk-up') {
      player.action = 'face-up';
    } else if (player.action === 'walk-down') {
      player.action = 'face-down';
    }
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
