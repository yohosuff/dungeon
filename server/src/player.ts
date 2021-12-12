import { Socket } from "socket.io";
import { Game } from "./Game";
import { DungeonEvent, HelloDto, PlayerDto, Position } from "../../shared";

export class Player {

    email: string;
    game: Game;
    socket?: Socket;
    position: Position;
    direction: string;
    avatar: string;

    constructor(email: string, game: Game) {
        this.game = game;
        this.email = email;

        // temporary code to get started
        if(email === 'joey.goertzen@gmail.com') {
            this.avatar = 'brad';
        } else if(email === 'jody.goertzen@gmail.com') {
            this.avatar = 'jack';
        } else {
            this.avatar = 'jack';
        }
    }

    attachSocket(socket: Socket) {
        this.socket = socket;
        this.setupListeners();
        socket.broadcast.emit(DungeonEvent.PlayerJoined, this.getDto());
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
            helloDto.players = this.game.players.map(player => player.getDto());
            helloDto.email = this.email;
            helloDto.tiles = JSON.stringify(Array.from(this.game.tiles.entries()));
            socket.emit(DungeonEvent.Hello, helloDto);
        });

        socket.on(DungeonEvent.Move, async direction => {
            
            this.direction = direction;
            
            const newPosition = this.position.clone();

            switch(direction) {
                case 'right': newPosition.x += 1; break;
                case 'left': newPosition.x -= 1; break;
                case 'down': newPosition.y += 1; break;
                case 'up': newPosition.y -= 1; break;
            }

            const playerCollision = this.game.players.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);
            // add position.toCoordinateString to quickly get "x,y"
            const onTile = this.game.tiles.get(`${newPosition.x},${newPosition.y}`)?.type === 1;
            const blocked = playerCollision || !onTile;

            if(blocked) {
                // await new Promise(resolve => setTimeout(resolve, 200)); // simulate lag
            } else {
                this.position = Position.reconstruct(newPosition);
                this.game.positionManager.savePosition(this);
            }

            this.emitUpdate();
        });

        socket.on(DungeonEvent.Disconnect, () => {
            socket.broadcast.emit(DungeonEvent.PlayerLeft, this.email);
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

    emitUpdate() {
        this.game.io.of('authenticated').emit(DungeonEvent.UpdatePlayer, this.getDto());
    }

    getDto() {
        const dto = new PlayerDto();
        dto.position = this.position;
        dto.email = this.email;
        dto.direction = this.direction;
        dto.avatar = this.avatar;
        return dto;
    }
}
