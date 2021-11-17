import { Socket } from "socket.io";
import { Game } from "./Game";
import { DungeonEvent, HelloDto, PlayerDto, Position } from "../../shared";

export class Player {

    socket: Socket;
    game: Game;
    position: Position;
    email: string;

    constructor(socket: Socket, game: Game) {
        this.socket = socket;
        this.game = game;
        this.email = game.emails.get(socket.id);
        this.setPosition();
        this.game.players.push(this);
        this.setupListeners();
        this.emitPosition();
    }

    setPosition() {
        let position = this.game.positionManager.getPosition(this);

        if(position) {
            this.position = position;
            return;
        }

        const positions = this.game.players.reduce((set, player) => {
            set.add(`${player.position.x},${player.position.y}`);
            return set;
        }, new Set<string>());
        
        position = new Position(0, 0);

        while(positions.has(`${position.x},${position.y}`)) {
            position.x += 1;
        }

        this.position = position;
        this.game.positionManager.savePosition(this);
    }

    setupListeners() {
        const socket = this.socket;
        
        socket.on(DungeonEvent.Hello, () => {
            console.log('DungeonEvent.Hello', this.email);
            const helloDto = new HelloDto();
            helloDto.players = this.game.players.map(player => player.getHelloDto());
            socket.emit(DungeonEvent.Hello, helloDto);
        });

        socket.on(DungeonEvent.Move, async direction => {
            console.log('DungeonEvent.Move', this.email, direction);

            const newPosition = {...this.position};

            switch(direction) {
                case 'right': newPosition.x += 1; break;
                case 'left': newPosition.x -= 1; break;
                case 'down': newPosition.y += 1; break;
                case 'up': newPosition.y -= 1; break;
            }

            const blocked = this.game.players.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);

            if(blocked) {
                console.log('blocked!');
                // await new Promise(resolve => setTimeout(resolve, 200)); // simulate lag
            } else {
                this.position = newPosition;
                this.game.positionManager.savePosition(this);
            }

            this.emitPosition();
        });

        socket.on(DungeonEvent.Disconnect, () => {
            this.removePlayer(this);
            socket.broadcast.emit(DungeonEvent.PlayerLeft, socket.id);
        });
    }

    removePlayer(player: Player) {
        const index = this.game.players.indexOf(player);
        
        if(index === -1) {
            console.log('did not find player to remove');
            return;
        }

        this.game.players.splice(index, 1);

        console.log('removed player', player.socket.id);
    }

    removePlayerWithSocket(socket: Socket) {
        console.log('removing player');
        for(let i = this.game.players.length - 1; i >= 0; --i) {
            const player = this.game.players[i];
            if(player.socket === socket) {
                this.game.players.splice(i, 1);
                console.log('removed player');
                return;
            }
        }
        console.log('did not remove player');
    }

    emitPosition() {
        this.game.io.of('authenticated').emit(DungeonEvent.UpdatePosition, this.getDto());
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
