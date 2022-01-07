import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { DungeonEvent, HelloDto } from '../../../shared';
import { Constants } from './constants';
import { CommunicationService } from './communication-service';
import { InputManager } from './input-manager';
import { MessageBus } from './message-bus';
import { ClientEvent } from './client-event';
import { Camera } from './camera';
import { PlayerManager } from './player-manager';
import { TileManager } from './tile-manager';
import { Renderer } from './renderer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  Z_INDEX_OFFSET = 10000;

  @ViewChild('canvas') canvasElementRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    public communicationService: CommunicationService,
    private inputManager: InputManager,
    private messageBus: MessageBus,
    public camera: Camera,
    private playerManager: PlayerManager,
    private tileManager: TileManager,
    private renderer: Renderer,
  ) {

    const token = localStorage.getItem(Constants.DungeonToken);

    if(token) {
      this.communicationService.establishAuthenticatedSocketConnection(token);
    } else {
      this.communicationService.establishAnonymousSocketConnection();
    }

    this.messageBus.subscribe(ClientEvent.ServerSaidHello, (helloDto: HelloDto) => {
      this.renderer.setCanvas(this.canvasElementRef.nativeElement);
      this.playerManager.loadPlayers(helloDto.players, helloDto.email);
      this.tileManager.loadTiles(helloDto.tiles);
      this.camera.moveToPosition(this.playerManager.me.position);
      this.camera.refreshVisiblePlayers();
      this.camera.refreshVisibleTiles();
      
      window.requestAnimationFrame(this.loop.bind(this));
    });
  }

  loop() {
    const me = this.playerManager.me;

    if (!this.communicationService.waitingForServer) {
      this.inputManager.handleInput();
    }

    if (this.inputManager.nextMoveTime <= performance.now() && me.action?.startsWith('walk-')) {
      me.action = `face-${me.direction}`;
      this.communicationService.authenticatedSocket.emit(DungeonEvent.ChangeDirection, me.direction);
    }

    this.renderer.draw();
    
    window.requestAnimationFrame(this.loop.bind(this));
  }

  getStopWalkingAction(action: string) {
    const direction = action.split("-")[1];
    return `face-${direction}`;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.inputManager.input.set(event.code, true);
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    
    this.inputManager.input.set(event.code, false);

    if (event.code === 'KeyP') {
      console.log('other players', this.playerManager.otherPlayers);
      console.log('me', this.playerManager.me);
    }

    if (event.code === 'KeyM') {
      this.inputManager.autoMoveRight = !this.inputManager.autoMoveRight;
    }
  }
}
