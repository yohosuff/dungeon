import { Player } from "./Player";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { Constants } from "./constants";
import { Game } from "./Game";
import { PlayerData } from "./player-data";

export class PlayerManager {
    
    players: Map<string, Player>;
    game: Game;
    
    constructor(game: Game) {
        this.game = game;
        this.loadPlayers();
    }

    getPlayer(username: string) {
        return this.players.get(username);
    }

    savePlayer(player: Player) {
        this.players.set(player.username, player);
        this.savePlayers(this.players);
    }

    loadPlayers() {
        if(!existsSync(Constants.PLAYERS_PATH)) {
            this.savePlayers(new Map<string, Player>());
        }

        const playersJson = readFileSync(Constants.PLAYERS_PATH, 'utf8');
        const playersDatas = JSON.parse(playersJson) as Array<PlayerData>;
        const players = new Map<string, Player>();

        for(let playerData of playersDatas) {
            const player = Player.reconstruct(playerData);
            players.set(player.username, player);
        }

        this.players = players;
    }
    
    savePlayers(players: Map<string, Player>) {
        const playersDatas = Array.from(players.values()).map(player => player.getData());
        const playersJson = JSON.stringify(playersDatas, null, 2);
        
        if(!existsSync(Constants.PLAYERS_PATH)) {
            const directoryPath = Constants.PLAYERS_PATH.substring(0, Constants.PLAYERS_PATH.lastIndexOf('/'));
            mkdirSync(directoryPath, {recursive: true});
        }

        writeFileSync(Constants.PLAYERS_PATH, playersJson);
    }
}
