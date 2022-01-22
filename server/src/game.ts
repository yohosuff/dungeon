import { Namespace, Server } from 'socket.io';
import { Player } from './Player';
import { PlayerManager } from './player-manager';
import { DungeonEvent, Credential, Tile } from '../../shared';
import { verify, sign } from 'jsonwebtoken';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { hashSync, compareSync } from 'bcryptjs';
import { Constants } from './constants';
import { DungeonBuilder } from './dungeon-builder';
import { createServer } from 'http';

export class Game {

    players: Player[];
    usernames: Map<string, string>;
    playerManager: PlayerManager;
    tiles: Map<string, Tile>;

    io: Server;

    anonymousNamespace: Namespace;
    authenticatedNamespace: Namespace;
    
    constructor() {
        this.usernames = new Map<string, string>();
        this.playerManager = new PlayerManager(this);
                
        this.buildTiles();
        this.loadPlayers();

        this.io = new Server({
            serveClient: false,
            cors: {
                origin: "http://10.0.0.115",
            },
        });

        this.anonymousNamespace = this.io.of('anonymous');
        this.authenticatedNamespace = this.io.of('authenticated');
    }

    buildTiles() {
        const dungeonBuilder = new DungeonBuilder();
        const dungeon = dungeonBuilder.getDungeon();
        const tiles = new Map<string, Tile>();

        for(let y = 0; y < dungeon.length; ++y) {
            const row = dungeon[y];
            for(let x = 0; x < row.length; ++x) {
                const key = `${x},${y}`;
                const type = row[x];
                const tile = new Tile(x, y, type);
                tiles.set(key, tile);
            }
        }

        this.tiles = tiles;
    }

    private loadPlayers() {
        this.players = [];
        
        for(let username of this.playerManager.players.keys()) {
            const player = this.playerManager.getPlayer(username);
            player.game = this;
            this.placePlayerOnRandomTile(player);
            this.players.push(player);
            console.log('loaded player', player.getData());
        }
    }

    private placePlayerOnRandomTile(player: Player) {
        const allPlayersCoordinates = this.players
            .filter(p => p !== player)
            .reduce((set, player) => set.add(player.position.toCoordinateString()), new Set<string>());

        const tilesArray = Array.from(this.tiles.values());
        let tile: Tile;
        
        while(tilesArray.length > 0) {
            let randomIndex = Math.floor(Math.random() * tilesArray.length);
            tile = tilesArray[randomIndex];
            const tileCoordinates = tile.position.toCoordinateString();
            
            if(tile.type === 1 && !allPlayersCoordinates.has(tileCoordinates)){
                break;
            }

            tilesArray.splice(randomIndex, 1);
        }

        player.position = tile.position.clone();
    }

    start() {
        this.setupAnonymousListeners();
        this.setupAuthenticatedListeners();
        const server = createServer();
        server.listen(3000, '0.0.0.0');
        this.io.listen(server);
        console.log('server is up!');
    }

    setupAnonymousListeners() {
        this.anonymousNamespace.on(DungeonEvent.Connection, socket => {
            
            socket.on(DungeonEvent.Register, (credential: Credential) => {
                const path = Constants.CREDENTIALS_PATH;
                
                if(!existsSync(path)) {
                    writeFileSync(path, JSON.stringify([]));
                }
    
                const credentialsString = readFileSync(path, 'utf8');
                const credentials = JSON.parse(credentialsString) as Credential[];
                credential.username = credential.username.toLowerCase();
                const exists = credentials.some(c => c.username === credential.username);
    
                if(exists) {
                    socket.emit(DungeonEvent.UsernameAlreadyTaken);
                    return;
                }

                credential.password = hashSync(credential.password);
                credentials.push(credential);
                writeFileSync(path, JSON.stringify(credentials));
                const payload = { username: credential.username };
                const token = sign(payload, Constants.TOKEN_SECRET);
                socket.emit(DungeonEvent.Registered, token);
            });

            socket.on(DungeonEvent.Login, (credential: Credential) => {
                
                if(!existsSync(Constants.CREDENTIALS_PATH)) {
                    writeFileSync(Constants.CREDENTIALS_PATH, JSON.stringify([]));
                }
    
                const credentialsString = readFileSync(Constants.CREDENTIALS_PATH, 'utf8');
                const credentials = JSON.parse(credentialsString) as Credential[];
                credential.username = credential.username.toLowerCase();
                const existingCredential = credentials.find(c => c.username === credential.username);

                if(!existingCredential) {
                    socket.emit(DungeonEvent.LoginFailed);
                    return;
                }

                const passwordIsCorrect = compareSync(credential.password, existingCredential.password);

                if(!passwordIsCorrect) {
                    socket.emit(DungeonEvent.LoginFailed);
                    return;
                }

                const payload = { username: credential.username };
                const token = sign(payload, Constants.TOKEN_SECRET);

                socket.emit(DungeonEvent.LoginSuccessful, token);
            });
        });        
    }

    setupAuthenticatedListeners() {
        this.authenticatedNamespace.use((socket, next) => {
            const token = socket.handshake.auth.token;
            let payload;

            try {
                payload = verify(token, Constants.TOKEN_SECRET);
            } catch(err) {
                next(err);
                return;
            }

            this.usernames.set(socket.id, payload.username);
            next();
        });

        this.authenticatedNamespace.on(DungeonEvent.Connection, socket => {
            const username = this.usernames.get(socket.id);
            let player = this.players.find(player => player.username === username);

            if(player?.socket) {
                socket.emit(DungeonEvent.PlayerAlreadyHasSocket);
                return;
            }

            if(!player) {
                player = new Player();
                this.players.push(player);
                player.username = username;
                player.game = this;
                player.setAvatar();
                this.placePlayerOnRandomTile(player);
                this.playerManager.savePlayer(player);
            }

            player.attachSocket(socket);
        });
    }

}
