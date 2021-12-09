import { PlayerDto, Tile } from "../../../shared";

// the dungeon is not aware of sockets, input, etc...
// it is only concerned with players and tiles
export class Dungeon {

    me: PlayerDto;
    otherPlayers: PlayerDto[];
    tiles: Tile[];

    constructor(){
        this.me = new PlayerDto();
        this.otherPlayers = [];

        // temporary - move to server, add view port so we can see only a limited number of tiles
        // add tile type (eg 1 is floor, 2 is lava)
        this.tiles = [
            new Tile(11, 10),
            // side wall
            new Tile(5, 10),
            new Tile(5, 11),
            new Tile(5, 12),
            new Tile(5, 13),
            new Tile(5, 14),
            // bottom wall
            new Tile(8, 16),
            new Tile(9, 16),
            new Tile(10, 16),
            new Tile(11, 16),
            new Tile(12, 16),
            
        ];
    }

    moveMe(direction: string): string {

        // move this into a method on the Position object, have it return a new object the same way as this does
        const newPosition = this.me.position.clone();

        switch (direction) {
            case 'right': newPosition.x += 1; break;
            case 'left': newPosition.x -= 1; break;
            case 'down': newPosition.y += 1; break;
            case 'up': newPosition.y -= 1; break;
        }
        //////////////////////////////////////////////

        const playerCollision = this.otherPlayers.some(player => player.position.x === newPosition.x && player.position.y === newPosition.y);
        const onTile = true || this.tiles.some(tile => tile.position.equals(newPosition));

        const blocked = playerCollision || !onTile;

        if (blocked) {
            this.me.action = `face-${direction}`;
            
            if(this.me.direction !== direction) {
                this.me.direction = direction;
                return 'direction-changed';
            }

            return 'blocked';
        }

        this.me.action = `walk-${direction}`;
        this.me.position = newPosition;
        this.me.direction = direction;
        
        return 'position-changed';
    }

    updatePlayer(playerDto: PlayerDto) {
        let player = this.otherPlayers.find(player => player.email === playerDto.email);

        if (!player) {
            console.warn('received playerDto for player not in otherPlayers list');
            return;
        }

        const moving = !player.position.equals(playerDto.position);
        
        player.position = playerDto.position;
        player.direction = playerDto.direction;
        player.action = `${moving ? 'walk' : 'face'}-${playerDto.direction}`;
    }

    addPlayer(playerDto: PlayerDto) {
        const existingPlayer = this.otherPlayers.find(player => player.email === playerDto.email);

        if(existingPlayer) {
            return;
        }

        this.otherPlayers.push(playerDto);
    }

    loadPlayers(players: PlayerDto[], email: string) {
        this.otherPlayers = [];

        for (let player of players) {
            
            if (player.email === email) {
                this.me = player;
                continue;
            }

            if (this.otherPlayers.some(otherPlayer => otherPlayer.email === player.email)) {
                continue;
            }

            this.otherPlayers.push(player);
        }
    }
}
