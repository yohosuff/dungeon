import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Constants } from './constants';
import { CommunicationService } from './communication-service';
import { InputManager } from './input-manager';
import { MessageBus } from './message-bus';
import { ClientEvent } from './client-event';
import { Camera } from './camera';
import { PlayerManager } from './player-manager';
import { TileManager } from './tile-manager';
import { Renderer } from './renderer';
import screenfull from 'screenfull';
import { Player } from './player';
import { WanderService } from './wander.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  Z_INDEX_OFFSET = 10000;

  @ViewChild('canvas') canvasElementRef!: ElementRef<HTMLCanvasElement>;

  isTouchDevice = 'ontouchstart' in window;

  constructor(
    public _communicationService: CommunicationService,
    public _camera: Camera,
    public _wanderService: WanderService,
    private _inputManager: InputManager,
    private _messageBus: MessageBus,
    private _playerManager: PlayerManager,
    private _tileManager: TileManager,
    private _renderer: Renderer,
  ) {

    const token = localStorage.getItem(Constants.DungeonToken);

    if(token) {
      this._communicationService.establishAuthenticatedSocketConnection(token);
    } else {
      this._communicationService.establishAnonymousSocketConnection();
    }

    this._messageBus.subscribe(ClientEvent.ServerSaidHello, (data: { players: Player[]; tiles: string; username: string; }) => {
      this._renderer.setCanvas(this.canvasElementRef.nativeElement);
      this._playerManager.loadPlayers(data.players, data.username);
      this._tileManager.loadTiles(data.tiles);
      this._camera.moveToPosition(this._playerManager.me.position);
      this._wanderService.init();
      window.requestAnimationFrame(this.loop.bind(this));
    });

    this._wanderService.wandered.subscribe(key => {
      this._inputManager.input.set(key, true);
      setTimeout(() => this._inputManager.input.set(key, false), 100);
    });
  }

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }

  toggleWandering() {
    this._wanderService.toggle();
  }

  loop() {
    this._inputManager.handleInput();
    this._renderer.draw();
    window.requestAnimationFrame(this.loop.bind(this));
  }

  getStopWalkingAction(action: string) {
    const direction = action.split('-')[1];
    return `face-${direction}`;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this._inputManager.input.set(event.code, true);
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this._inputManager.input.set(event.code, false);

    if (event.code === 'KeyP') {
      console.log('other players', this._playerManager.otherPlayers);
      console.log('me', this._playerManager.me);
    }

    if (event.code === 'KeyM') {
      this._inputManager.autoMoveRight = !this._inputManager.autoMoveRight;
    }
  }

  touchStart(code: string) {
    this._inputManager.input.set(code, true);
  }

  touchEnd(code: string) {
    this._inputManager.input.set(code, false);
  }
}
