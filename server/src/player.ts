import { Socket } from "socket.io";
import { Game } from "./game";
import { DungeonEvent, HelloDto, PlayerDto, Position } from "../../shared";
import { PlayerData } from "./player-data";

export class Player {
    
    username: string;
    game: Game;
    socket: Socket;
    position: Position;
    direction: string;
    avatar: string;
    pressingKey: boolean;

    setAvatar() {
        this.avatar = 'skeleton';
    }

    static reconstruct(data: PlayerData) {
        const player = new Player();
        player.username = data.username;
        player.position = Position.reconstruct(data.position);
        player.direction = data.direction;
        player.avatar = data.avatar;
        return player;
    }

    attachSocket(socket: Socket) {
        this.socket = socket;
        this.setupListeners();
        socket.broadcast.emit(DungeonEvent.PlayerJoined, this.getDto());
    }

    setupListeners() {
        const socket = this.socket;
        
        socket.on(DungeonEvent.Hello, () => {
            const helloDto = new HelloDto();
            helloDto.players = this.game.players.map(player => player.getDto());
            helloDto.username = this.username;
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
            const onTile = this.game.tiles.get(newPosition.toCoordinateString())?.type === 1;
            const blocked = playerCollision || !onTile;

            if(blocked) {
                // await new Promise(resolve => setTimeout(resolve, 200)); // simulate lag
            } else {
                this.position = Position.reconstruct(newPosition);
            }

            this.game.playerManager.savePlayer(this);

            this.pressingKey = true;
            this.emitUpdate();
        });

        socket.on(DungeonEvent.ChangeDirection, async direction => {
            this.direction = direction;
            this.game.playerManager.savePlayer(this);
            this.pressingKey = false;
            this.emitUpdate();
        });

        socket.on(DungeonEvent.Disconnect, () => {
            this.socket = undefined;
            this.emitUpdate();
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
        dto.username = this.username;
        dto.position = this.position;
        dto.direction = this.direction;
        dto.pressingKey = this.pressingKey;
        dto.avatar = this.avatar; // this shouldn't change much... might not need to send it with every update
        dto.connected = !!this.socket?.connected;
        return dto;
    }

    getData() {
        const data = new PlayerData();
        data.position = this.position;
        data.username = this.username;
        data.direction = this.direction;
        data.avatar = this.avatar;
        return data;
    }
}
