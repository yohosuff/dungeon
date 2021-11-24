import { Socket } from "socket.io-client";
import { DungeonEvent, HelloDto, PlayerDto } from "../../../shared";

export class Game {
    
    private authenticatedSocket?: Socket;

    input: Map<string, boolean>;

    transitioning: boolean;
    waitingForServer: boolean;

    me: PlayerDto;
    otherPlayers: PlayerDto[];
    autoMoveRight: boolean;
    
    constructor() {
        this.autoMoveRight = false;
        this.me = new PlayerDto();
        this.otherPlayers = [];
        this.waitingForServer = false;
        this.transitioning = false;
        this.input = new Map<string, boolean>();
    }

    connect(authenticatedSocket: Socket) {
        
        this.authenticatedSocket = authenticatedSocket;

        authenticatedSocket.on(DungeonEvent.Hello, (helloDto: HelloDto) => {
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

            this.afterHello();
        });

        authenticatedSocket.on(DungeonEvent.PlayerJoined, (playerDto: PlayerDto) => {
            const existingPlayer = this.otherPlayers.find(player => player.email === playerDto.email);
            
            if(!existingPlayer) {
                this.otherPlayers.push(playerDto);
            }
            
        });

        authenticatedSocket.on(DungeonEvent.UpdatePosition, (playerDto: PlayerDto) => {

            if (playerDto.email === this.me.email) {
                this.waitingForServer = false;
                return;
            }

            let player = this.otherPlayers.find(player => player.email === playerDto.email);

            if (!player) {
                console.warn('received playerDto for player not in otherPlayers list');
                return;
            }

            player.position = playerDto.position;
        });

        authenticatedSocket.on(DungeonEvent.PlayerLeft, id => {
            this.removePlayer(this.otherPlayers, id);
        });

        authenticatedSocket.emit(DungeonEvent.Hello);
    }

    afterHello() {
        this.me.action = 'face-right';
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
            this.me.action = `face-${direction}`;
            return;
        }

        this.me.action = `walk-${direction}`;

        this.me.position = newPosition;
        this.transitioning = true;
        this.waitingForServer = true;
        
        this.authenticatedSocket?.emit(DungeonEvent.Move, direction);
    }
    
}
