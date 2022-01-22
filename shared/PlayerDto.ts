import { Position } from ".";

export class PlayerDto {
    position!: Position;
    username!: string;
    direction!: string;
    avatar!: string;
    pressingKey!: boolean;
}
