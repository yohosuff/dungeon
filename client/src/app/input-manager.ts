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
    map: Map<string, string>;
    autoMoveRight: boolean;
    nextMoveTime: number;
    
    constructor(
        private playerManager: PlayerManager,
        private communicationService: CommunicationService,
        private camera: Camera,
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

        this.map = new Map<string, string>();
        this.map.set('KeyD', 'right');
        this.map.set('KeyA', 'left');
        this.map.set('KeyS', 'down');
        this.map.set('KeyW', 'up');
        this.map.set('ArrowRight', 'right');
        this.map.set('ArrowLeft', 'left');
        this.map.set('ArrowDown', 'down');
        this.map.set('ArrowUp', 'up');
    }

    handleInput() {

        if(Date.now() < this.nextMoveTime) {
            return;
        }

        let direction;

        for(let key of this.keys) {
            const pressed = this.input.get(key);
            
            if(pressed) {
                direction = this.map.get(key);
                break;
            }
        }

        if(!direction) {
            return;
        }

        this.playerManager.me.action === `walk-${direction}`;
        
        const result = this.playerManager.moveMe(direction);

        switch(result) {
            case 'position-changed':
                this.nextMoveTime = Date.now() + 200;
                this.communicationService.waitingForServer = true;
                this.communicationService.authenticatedSocket.emit(DungeonEvent.Move, direction);
                this.camera.moveToPosition(this.playerManager.me.position);
                break;
            case 'direction-changed':
                this.communicationService.authenticatedSocket.emit(DungeonEvent.ChangeDirection, direction);
                break;
        }
    }
}