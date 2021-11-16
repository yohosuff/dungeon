import { Subject } from "rxjs";
import { io, Socket } from "socket.io-client";
import { DungeonEvent, HelloDto, PlayerDto } from "../../../shared";
import { Constants } from "./constants";

export class Game {
    
    token?: string;
    authenticatedSocket?: Socket;

    input: Map<string, boolean>;

    transitioning: boolean;
    waitingForServer: boolean;

    me: PlayerDto;
    otherPlayers: PlayerDto[];
    autoMoveRight: boolean;

    authenticatedSocketConnected$: Subject<boolean>;
        
    constructor() {
        this.autoMoveRight = false;
        this.me = new PlayerDto();
        this.otherPlayers = [];
        this.waitingForServer = false;
        this.transitioning = false;
        this.input = new Map<string, boolean>();
        this.authenticatedSocketConnected$ = new Subject<boolean>();
    }

    connect(token: string) {
        this.token = token;

        const authenticatedSocket = io(`${Constants.BaseUrl}/authenticated`, { auth: { token: this.token } });

        this.authenticatedSocket = authenticatedSocket;

        authenticatedSocket.on(DungeonEvent.Connect, () => {
            console.log('authenticated socket connected');
            this.authenticatedSocketConnected$.next(true);
            authenticatedSocket.emit(DungeonEvent.Hello);
        });

        authenticatedSocket.on(DungeonEvent.Hello, (helloDto: HelloDto) => {
            console.log('got hello back from server', helloDto);

            this.otherPlayers = [];

            for (let player of helloDto.players) {
                if (player.id === authenticatedSocket.id) {
                    this.me = player;
                    continue;
                }

                if (this.otherPlayers.some(p => p.id === player.id)) {
                    continue;
                }

                this.otherPlayers.push(player);
            }

            window.requestAnimationFrame(this.loop.bind(this));
        });

        authenticatedSocket.on(DungeonEvent.UpdatePosition, (playerDto: PlayerDto) => {

            console.log('DungeonEvent.UpdatePosition', playerDto);

            if (playerDto.id === authenticatedSocket.id) {
                this.waitingForServer = false;
                return;
            }

            let player = this.otherPlayers.find(player => player.id === playerDto.id);

            if (!player) {
                player = playerDto;
                this.otherPlayers.push(player);
            }

            player.position = playerDto.position;
        });

        authenticatedSocket.on(DungeonEvent.PlayerLeft, id => {
            this.removePlayer(this.otherPlayers, id);
        });
    }

    removePlayer(players: PlayerDto[], id: string) {
        for (let i = players.length - 1; i >= 0; --i) {
            const player = players[i];
            if (player.id === id) {
                players.splice(i, 1);
                break;
            }
        }
    }

    loop(timeStamp: DOMHighResTimeStamp) {
        this.handleInput();
        window.requestAnimationFrame(this.loop.bind(this));
    }

    handleInput() {
        const right = this.input.get('KeyD') || this.input.get('ArrowRight');
        const left = this.input.get('KeyA') || this.input.get('ArrowLeft');
        const down = this.input.get('KeyS') || this.input.get('ArrowDown');
        const up = this.input.get('KeyW') || this.input.get('ArrowUp');

        if (right || this.autoMoveRight) {
            this.move('right');
        } else if (left) {
            this.move('left');
        } else if (down) {
            this.move('down');
        } else if (up) {
            this.move('up');
        }
    }

    move(direction: string) {

        console.log('move', direction);

        if (this.transitioning || this.waitingForServer) {
            return;
        }

        const newPosition = { ...this.me.position };

        switch (direction) {
            case 'right': newPosition.x += 1; break;
            case 'left': newPosition.x -= 1; break;
            case 'down': newPosition.y += 1; break;
            case 'up': newPosition.y -= 1; break;
        }

        const blocked = this.otherPlayers.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);

        if (blocked) {
            return;
        }

        this.me.position = newPosition;
        this.transitioning = true;
        this.waitingForServer = true;
        
        this.authenticatedSocket?.emit(DungeonEvent.Move, direction);
    }
    
}
