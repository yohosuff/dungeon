import { Injectable } from "@angular/core";
import { DungeonEvent } from "../../../shared";
import { Camera } from "./camera";
import { CommunicationService } from "./communication-service";
import { PlayerManager } from "./player-manager";

@Injectable({
    providedIn: 'root',
})
export class InputManager {
    
    input: Map<string, boolean>;
    keys: string[];
    directionMap: Map<string, string>;
    autoMoveRight: boolean;
    nextMoveTime: number;
    
    constructor(
        private playerManager: PlayerManager,
        private communicationService: CommunicationService,
    ) {
        this.nextMoveTime = 0;
        this.input = new Map<string, boolean>();
        this.autoMoveRight = false;

        this.keys = [
            'KeyD', 'ArrowRight',
            'KeyA', 'ArrowLeft',
            'KeyS', 'ArrowDown',
            'KeyW', 'ArrowUp',
        ];

        this.directionMap = new Map<string, string>();
        this.directionMap.set('KeyD', 'right');
        this.directionMap.set('KeyA', 'left');
        this.directionMap.set('KeyS', 'down');
        this.directionMap.set('KeyW', 'up');
        this.directionMap.set('ArrowRight', 'right');
        this.directionMap.set('ArrowLeft', 'left');
        this.directionMap.set('ArrowDown', 'down');
        this.directionMap.set('ArrowUp', 'up');
    }

    handleInput() {
        if(performance.now() < this.nextMoveTime || this.communicationService.waitingForServer) {
            return;
        }

        let chosenDirection;

        for(let key of this.keys) {
            const pressed = this.input.get(key);
            
            if(pressed) {
                chosenDirection = this.directionMap.get(key);
                break;
            }
        }

        const me = this.playerManager.me;

        if(!chosenDirection) {

            if(me.pressingKey) {
                this.communicationService.authenticatedSocket.emit(DungeonEvent.ChangeDirection, me.direction);
            }

            me.pressingKey = false;
            return;
        }

        me.pressingKey = true;
        me.direction = chosenDirection;
        me.action === `walk-${chosenDirection}`;

        this.playerManager.moveMe(chosenDirection);
        this.nextMoveTime = performance.now() + 200;       
        this.communicationService.waitingForServer = true;
        this.communicationService.authenticatedSocket.emit(DungeonEvent.Move, chosenDirection);
    }
}
