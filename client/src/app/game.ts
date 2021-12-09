import { Socket } from "socket.io-client";
import { DungeonEvent, HelloDto, PlayerDto, Tile } from "../../../shared";
import { Dungeon } from "./dungeon";

export class Game {
    
    authenticatedSocket!: Socket;
    input: Map<string, boolean>;
    transitioning: boolean;
    waitingForServer: boolean;
    autoMoveRight: boolean;

    dungeon: Dungeon;
    
    constructor() {
        this.autoMoveRight = false;
        this.waitingForServer = false;
        this.transitioning = false;
        this.input = new Map<string, boolean>();
        this.dungeon = new Dungeon();
    }

    connect(authenticatedSocket: Socket) {
        
        this.authenticatedSocket = authenticatedSocket;

        authenticatedSocket.on(DungeonEvent.Hello, (helloDto: HelloDto) => {
            helloDto.players = helloDto.players.map(p => PlayerDto.reconstruct(p));           
            this.dungeon.loadPlayers(helloDto.players, helloDto.email);
            this.afterHello();
        });

        authenticatedSocket.on(DungeonEvent.PlayerJoined, (playerDto: PlayerDto) => {
            playerDto = PlayerDto.reconstruct(playerDto);
            this.dungeon.addPlayer(playerDto);
        });

        authenticatedSocket.on(DungeonEvent.UpdatePlayer, (playerDto: PlayerDto) => {
            playerDto = PlayerDto.reconstruct(playerDto);
            
            if (playerDto.email === this.dungeon.me.email) {
                this.waitingForServer = false;
                return;
            }

            this.dungeon.updatePlayer(playerDto);
        });

        authenticatedSocket.on(DungeonEvent.PlayerLeft, (email: string) => {
            console.log('player left', email);
        });

        authenticatedSocket.emit(DungeonEvent.Hello);
    }

    afterHello() {
        this.dungeon.me.action = 'face-right';
        window.requestAnimationFrame(this.loop.bind(this));
    }

    loop() {
        this.handleInput();
        window.requestAnimationFrame(this.loop.bind(this));
    }

    handleInput() {

        if (this.transitioning || this.waitingForServer) {
            return;
        }

        // use a map here between input key and direction

        const right = this.input.get('KeyD') || this.input.get('ArrowRight');
        const left = this.input.get('KeyA') || this.input.get('ArrowLeft');
        const down = this.input.get('KeyS') || this.input.get('ArrowDown');
        const up = this.input.get('KeyW') || this.input.get('ArrowUp');

        let direction;

        if (right || this.autoMoveRight) {
            direction = 'right';
        } else if (left) {
            direction = 'left';
        } else if (down) {
            direction = 'down';
        } else if (up) {
            direction = 'up';
        } else {
            direction = '';
        }

        if(!direction) {
            return;
        }

        const moveMeResult = this.dungeon.moveMe(direction);

        switch(moveMeResult) {
            case 'position-changed':
                this.transitioning = true;
                this.waitingForServer = true;
                this.authenticatedSocket.emit(DungeonEvent.Move, direction);
                break;
            case 'direction-changed':
                this.authenticatedSocket.emit(DungeonEvent.Move, direction);
                break;
        }
    }    
}
