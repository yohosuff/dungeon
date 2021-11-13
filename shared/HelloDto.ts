import { PlayerDto } from ".";

export class HelloDto {
    players: PlayerDto[];

    constructor() {
        this.players = [];
    }
}
