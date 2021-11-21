import { Socket } from "socket.io";
import { Game } from "./Game";
import { DungeonEvent, HelloDto, PlayerDto, Position } from "../../shared";

export class Player {

    email: string;
    game: Game;

    socket?: Socket;
    position: Position;

    constructor(email: string, game: Game) {
        this.game = game;
        this.email = email;
        
        // this.initializePosition();
    }

    attachSocket(socket: Socket) {
        this.socket = socket;
        this.setupListeners();
        socket.broadcast.emit(DungeonEvent.PlayerJoined, this.getHelloDto());
    }

    initializePosition() {
        const positions = this.game.players.reduce((set, player) => {
            set.add(`${player.position.x},${player.position.y}`);
            return set;
        }, new Set<string>());
        
        const position = new Position(0, 0);

        while(positions.has(`${position.x},${position.y}`)) {
            position.x += 1;
        }

        this.position = position;
        this.game.positionManager.savePosition(this);
    }

    setupListeners() {
        const socket = this.socket;
        
        socket.on(DungeonEvent.Hello, () => {
            const helloDto = new HelloDto();
            helloDto.players = this.game.players.map(player => player.getHelloDto());
            socket.emit(DungeonEvent.Hello, helloDto);
        });

        socket.on(DungeonEvent.Move, async direction => {
            const newPosition = {...this.position};

            switch(direction) {
                case 'right': newPosition.x += 1; break;
                case 'left': newPosition.x -= 1; break;
                case 'down': newPosition.y += 1; break;
                case 'up': newPosition.y -= 1; break;
            }

            const blocked = this.game.players.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);

            if(blocked) {
                // await new Promise(resolve => setTimeout(resolve, 200)); // simulate lag
            } else {
                this.position = newPosition;
                this.game.positionManager.savePosition(this);
            }

            this.emitPosition();
        });

        socket.on(DungeonEvent.Disconnect, () => {
            // should we still let clients know a player has disconnected?
            // socket.broadcast.emit(DungeonEvent.PlayerLeft, socket.id);
        });
    }

    removePlayer(player: Player) {
        const index = this.game.players.indexOf(player);
        
        if(index === -1) {
            console.warn('did not find player to remove', player);
            return;
        }

        this.game.players.splice(index, 1);
    }

    emitPosition() {
        this.game.io.of('authenticated').emit(DungeonEvent.UpdatePosition, this.getHelloDto());
    }

    getDto() {
        const dto = new PlayerDto();
        dto.id = this.socket.id;
        dto.position = this.position;
        return dto;
    }

    getHelloDto() {
        const dto = this.getDto();
        dto.email = this.email;
        return dto;
    }
}
