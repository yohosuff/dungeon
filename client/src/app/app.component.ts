import { Component, HostListener } from '@angular/core';
import { DungeonEvent, HelloDto } from '../../../shared';
import { Constants } from './constants';
import { CommunicationService } from './communication-service';
import { InputManager } from './input-manager';
import { MessageBus } from './message-bus';
import { ClientEvent } from './client-event';
import { Camera } from './camera';
import { PlayerManager } from './player-manager';
import { TileManager } from './tile-manager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  Z_INDEX_OFFSET = 10000;

  constructor(
    public communicationService: CommunicationService,
    private inputManager: InputManager,
    private messageBus: MessageBus,
    public camera: Camera,
    public playerManager: PlayerManager,
    private tileManager: TileManager
  ) {
    const token = localStorage.getItem(Constants.DungeonToken);

    if(token) {
      this.communicationService.establishAuthenticatedSocketConnection(token);
    } else {
      this.communicationService.establishAnonymousSocketConnection();
    }

    this.messageBus.subscribe(ClientEvent.ServerSaidHello, (helloDto: HelloDto) => {
      this.playerManager.loadPlayers(helloDto.players, helloDto.email);
      this.tileManager.loadTiles(helloDto.tiles);
      this.camera.moveToPosition(this.playerManager.me.position);
      this.playerManager.me.updateLocalPosition(this.camera.position);
      this.camera.refreshVisiblePlayers();
      this.camera.refreshVisibleTiles();
      this.loop();
    });
  }

  loop() {
    if (!this.communicationService.waitingForServer && !this.communicationService.transitioning) {
      this.inputManager.handleInput();
    }

    if (this.communicationService.waitingForServer) {
      console.log('discarding input as server is still processing');
    } else {
      this.inputManager.handleInput();
    }

    if (this.inputManager.nextMoveTime <= Date.now()) {
      const me = this.playerManager.me;
      me.action = `face-${me.direction}`;
      this.communicationService.authenticatedSocket.emit(DungeonEvent.ChangeDirection, me.direction);
    }
    
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
