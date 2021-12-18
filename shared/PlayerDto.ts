import { Position } from ".";

// rename this PlayerData
export class PlayerDto {
    localPosition: Position;
    position: Position;
    email?: string;
    action?: string;
    direction?: string;
    avatar?: string;

    constructor(x: number = 0, y: number = 0) {
        this.position = new Position(x, y);
        this.localPosition = new Position();
    }

    updateLocalPosition(referencePosition: Position) {
        this.localPosition.x = this.position.x - referencePosition.x;
        this.localPosition.y = this.position.y - referencePosition.y;
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
