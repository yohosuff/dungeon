import { PlayerDto } from ".";

export class HelloDto {
    players!: PlayerDto[];
    username!: string;
    tiles!: string; //serialized from Map<string, Tile>
}
