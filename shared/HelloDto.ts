import { PlayerDto } from ".";

export class HelloDto {
    players!: PlayerDto[];
    email!: string;
    tiles!: string; //serialized from Map<string, Tile>
}
