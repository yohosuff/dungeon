import { Injectable } from "@angular/core";
import { DungeonEvent } from "../../../shared";
import { CommunicationService } from "./communication-service";
import { Dungeon } from "./dungeon";

@Injectable({
    providedIn: 'root',
})
export class InputManager {
    
    input: Map<string, boolean>;
    keys: string[];
    map: Map<string, string>;
    autoMoveRight: boolean;
    
    constructor(
        private dungeon: Dungeon,
        private communicationService: CommunicationService,
    ) {
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

        const result = this.dungeon.moveMe(direction);

        switch(result) {
            case 'position-changed':
                this.communicationService.transitioning = true;
                this.communicationService.waitingForServer = true;
                this.communicationService.authenticatedSocket.emit(DungeonEvent.Move, direction);
                break;
            case 'direction-changed':
                this.communicationService.authenticatedSocket.emit(DungeonEvent.Move, direction);
                break;
        }
    }
}