import { Position } from "../../shared";
import { Player } from "./Player";
import { existsSync, writeFileSync, readFileSync } from 'fs';

// this should really be called the PlayerManager and should save more stuff than just positions (eg. health, inventory, etc...)
export class PositionManager {
    
    positions: Map<string,Position>;
    
    private static readonly Path = 'positions.json';

    constructor() {
        this.readPositions();
    }

    readPositions() {
        if(!existsSync(PositionManager.Path)) {
            this.writePositions(new Map<string, Position>());
        }

        const positionsJson = readFileSync(PositionManager.Path, 'utf8');
        const positionsObject = JSON.parse(positionsJson);
        const positionsEntries = Object.entries(positionsObject);
        const positions = new Map(positionsEntries) as Map<string, Position>;

        for(let email of positions.keys()) {
            const data = positions.get(email);
            const position = Position.reconstruct(data);
            positions.set(email, position);
        }

        this.positions = positions;
    }

    writePositions(positions: Map<string,Position>) {
        const positionsObject = Object.fromEntries(positions);
        const positionsJson = JSON.stringify(positionsObject);
        writeFileSync(PositionManager.Path, positionsJson);
    }
    
    savePosition(player: Player) {
        this.positions.set(player.email, player.position);
        this.writePositions(this.positions);
    }

    getPosition(email: string) {
        return this.positions.get(email);
    }
}
