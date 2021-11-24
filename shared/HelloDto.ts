import { PlayerDto } from ".";

export class HelloDto {
    players: PlayerDto[];
    email: string;

    constructor() {
        this.players = [];
        this.email = '';
    }
}
