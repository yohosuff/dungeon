import { Position } from ".";

// rename this PlayerData
export class PlayerDto {
    lastPosition!: Position;
    position!: Position;
    animatedPosition!: Position;
    
    email?: string;
    action?: string;
    direction?: string;
    avatar?: string;
    actionStartTime!: number;
    animating!: boolean;

    constructor(x: number = 0, y: number = 0) {
        this.position = new Position(x, y);
    }

    static reconstruct(data: PlayerDto): PlayerDto {
        const dto = new PlayerDto();
        dto.position = Position.reconstruct(data.position);
        dto.email = data.email;
        dto.action = `face-${data.direction}`;
        dto.direction = data.direction;
        dto.avatar = data.avatar;
        return dto;
    }
}
