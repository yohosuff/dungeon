import { Socket } from "socket.io";
import { Game } from "./Game";
import { PlayerDto, Position } from "../../shared/out";

export class Player {

    socket: Socket;
    game: Game;

    position: Position;

    constructor(socket: Socket, game: Game) {
        this.socket = socket;
        this.game = game;
        this.position = new Position(0, 0);
        this.setupListeners();
        this.emitPosition();
    }

    setupListeners() {
        this.socket.on('move', async direction => {

            // use this to resolve invalid move
            const originalPosition = {...this.position};

            switch(direction) {
                case 'right': this.position.x += 1; break;
                case 'left': this.position.x -= 1; break;
                case 'down': this.position.y += 1; break;
                case 'up': this.position.y -= 1; break;
            }

            // simulate lag
            // await new Promise(resolve => setTimeout(resolve, 500));

            // simulate collision
            // if (Math.random() > 0.75) { this.position = originalPosition; }

            this.emitPosition();
        });
    }

    emitPosition() {
        this.game.io.emit('update-position', this.getDto());
    }

    getDto() {
        const dto = new PlayerDto();
        dto.id = this.socket.id;
        dto.position = this.position;
        return dto;
    }
}
