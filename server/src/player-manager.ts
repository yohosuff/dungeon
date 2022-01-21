import { Player } from "./Player";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { Constants } from "./constants";
import { Game } from "./Game";
import { PlayerDto } from "../../shared";

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
        const playersDtos = JSON.parse(playersJson) as Array<PlayerDto>;
        const players = new Map<string, Player>();

        for(let playerDto of playersDtos) {
            const player = Player.reconstruct(playerDto);
            players.set(player.username, player);
        }

        this.players = players;
    }
    
    savePlayers(players: Map<string, Player>) {
        const playersDtos = Array.from(players.values()).map(player => player.getDto());
        const playersJson = JSON.stringify(playersDtos);
        
        if(!existsSync(Constants.PLAYERS_PATH)) {
            const directoryPath = Constants.PLAYERS_PATH.substring(0, Constants.PLAYERS_PATH.lastIndexOf('/'));
            mkdirSync(directoryPath, {recursive: true});
        }

        writeFileSync(Constants.PLAYERS_PATH, playersJson);
    }
}
