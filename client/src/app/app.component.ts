import { Component, HostListener } from '@angular/core';
import { HelloDto, PlayerDto } from '../../../shared';
import { Constants } from './constants';
import { CommunicationService } from './communication-service';
import { Dungeon } from './dungeon';
import { InputManager } from './input-manager';
import { MessageBus } from './message-bus';
import { ClientEvent } from './client-event';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    public dungeon: Dungeon,
    public communicationService: CommunicationService,
    private inputManager: InputManager,
    private messageBus: MessageBus,
  ) {  
    const token = localStorage.getItem(Constants.DungeonToken);

    if(token) {
      this.communicationService.establishAuthenticatedSocketConnection(token);
    } else {
      this.communicationService.establishAnonymousSocketConnection();
    }

    this.messageBus.subscribe(ClientEvent.ServerSaidHello, (helloDto: HelloDto) => {
      this.loop();
    });
  }

  loop() {
    if (this.communicationService.waitingForServer) {
      console.log('discarding input as server is still processing');
    } else if(this.communicationService.transitioning) {
      console.log('discarding input as player is still transitioning');
    } else {
      this.inputManager.handleInput();
    }
    
    window.requestAnimationFrame(this.loop.bind(this));
  }

  logout() {
    localStorage.removeItem(Constants.DungeonToken);
    this.communicationService.authenticatedSocket?.disconnect();
  }

  onTransitionEnd() {
    this.communicationService.transitioning = false;
    
    if(this.dungeon.me.action === 'walk-left') {
      this.dungeon.me.action = 'face-left';
    } else if(this.dungeon.me.action === 'walk-right') {
      this.dungeon.me.action = 'face-right';
    } else if (this.dungeon.me.action === 'walk-up') {
      this.dungeon.me.action = 'face-up';
    } else if (this.dungeon.me.action === 'walk-down') {
      this.dungeon.me.action = 'face-down';
    }
  }

  onOtherPlayerTransitionEnd(player: PlayerDto) {
    player.action = this.getStopWalkingAction(player.action as string);
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
      console.log('other players', this.dungeon.otherPlayers);
      console.log('me', this.dungeon.me);
    }

    if (event.code === 'KeyM') {
      this.inputManager.autoMoveRight = !this.inputManager.autoMoveRight;
    }
  }
}
