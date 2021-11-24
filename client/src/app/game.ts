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
                if (player.email === helloDto.email) {
                    this.me = player;
                    continue;
                }

                if (this.otherPlayers.some(otherPlayer => otherPlayer.email === player.email)) {
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

            console.log('authenticatedSocket DungeonEvent.UpdatePosition');

            if (playerDto.email === this.me.email) {
                this.waitingForServer = false;
                return;
            }

            let player = this.otherPlayers.find(player => player.email === playerDto.email);

            if (!player) {
                console.warn('received playerDto for player not in otherPlayers list');
                return;
            }

            if(player.position.x - playerDto.position.x < 0) {
                player.action = 'walk-right';
            } else if(player.position.x - playerDto.position.x > 0) {
                player.action = 'walk-left';
            } else if (player.position.y - playerDto.position.y < 0) {
                player.action = 'walk-down';
            } else if (player.position.y - playerDto.position.y > 0) {
                player.action = 'walk-up';
            }

            player.position = playerDto.position;
        });

        authenticatedSocket.on(DungeonEvent.PlayerLeft, (email: string) => {
            console.log('player left', email);
        });

        authenticatedSocket.emit(DungeonEvent.Hello);
    }

    afterHello() {
        this.me.action = 'face-right';
    }

    loop() {
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
