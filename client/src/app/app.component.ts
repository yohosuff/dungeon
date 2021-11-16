import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { io, Socket } from 'socket.io-client';
import { DungeonEvent } from '../../../shared';
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
  anonymousSocket: Socket;
  anonymousSocketConnected: boolean;

  authenticatedSocket?: Socket;
  authenticatedSocketConnected: boolean;

  game: Game;

  constructor(
    private _formBuilder: FormBuilder
  ) {
    this.form = this._formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.required],
    });

    this.anonymousSocketConnected = false;
    this.authenticatedSocketConnected = false;
    
    this.anonymousSocket = io(`${Constants.BaseUrl}/anonymous`);

    this.anonymousSocket.on(DungeonEvent.Connect, () => {
      console.log('connected!');
      this.anonymousSocketConnected = true;
      // check for stored token and attempt to use it to establish authenticated socket connection
      // if it isn't there, do nothing and wait for user to login
    });

    this.anonymousSocket.on(DungeonEvent.LoginFailed, () => {
      console.log('login failed');
    });

    this.anonymousSocket.on(DungeonEvent.EmailAlreadyTaken, () => {
      console.log('email already taken');
    });

    this.anonymousSocket.on(DungeonEvent.LoginSuccessful, token => {
      console.log('login success', token);
      localStorage.setItem('DungeonToken', token);
      this.createGame(token);
    });

    this.anonymousSocket.on(DungeonEvent.Registered, token => {
      console.log('registered', token);
      localStorage.setItem('DungeonToken', token);
      this.createGame(token);
    });

    this.anonymousSocket.on(DungeonEvent.Disconnect, () => {
      console.log('anonymous socket disconnected');
      this.anonymousSocketConnected = false;
    });

    this.game = new Game();
  }

  createGame(token: string) {
    this.game.authenticatedSocketConnected$.subscribe(authenticatedSocketConnected => {
      this.authenticatedSocketConnected = authenticatedSocketConnected;
      this.anonymousSocket.disconnect();
    });

    this.game.connect(token);
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
    this.anonymousSocket.emit(DungeonEvent.Register, { email, password });
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
    this.anonymousSocket.emit(DungeonEvent.Login, { email, password });
    this.getModalInstance('loginModal').hide();
  }

  onTransitionEnd() {
    const game = this.game as Game;
    game.transitioning = false;
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
