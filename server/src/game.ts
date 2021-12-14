import { Namespace, Server } from 'socket.io';
import { Player } from './Player';
import { PlayerManager } from './player-manager';
import { DungeonEvent, Credential, Tile } from '../../shared';
import { verify, sign } from 'jsonwebtoken';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { hashSync, compareSync } from 'bcryptjs';
import { Constants } from './constants';

export class Game {

    players: Player[];
    emails: Map<string, string>;
    playerManager: PlayerManager;
    tiles: Map<string, Tile>;

    io: Server;

    anonymousNamespace: Namespace;
    authenticatedNamespace: Namespace;
    
    constructor() {
        this.emails = new Map<string, string>();
        this.playerManager = new PlayerManager(this);
                
        this.buildTiles();
        this.loadPlayers();

        this.io = new Server({
            serveClient: false,
            cors: {
                origin: "http://localhost:4200",
            },
        });

        this.anonymousNamespace = this.io.of('anonymous');
        this.authenticatedNamespace = this.io.of('authenticated');
    }

    buildTiles() {
        const rows = [
            [0,1,0,0,0,0,0,0,0,0],
            [0,1,0,0,0,0,0,0,0,0],
            [0,1,0,0,0,0,0,0,0,0],
            [0,1,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1],
            [0,0,0,0,1,1,1,1,1,1],
            [0,0,0,0,0,1,0,1,0,1],
            [0,0,0,0,0,1,0,1,0,1],
            [0,0,0,0,0,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0],
        ];

        const tiles = new Map<string, Tile>();

        for(let y = 0; y < rows.length; ++y) {
            const row = rows[y];
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
        
        for(let email of this.playerManager.players.keys()) {
            const player = this.playerManager.getPlayer(email);
            player.game = this;
            this.players.push(player);
            console.log('loaded player', player.getDto());
        }
    }

    start() {
        this.setupAnonymousListeners();
        this.setupAuthenticatedListeners();
        this.io.listen(3000);
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
                credential.email = credential.email.toLowerCase();
                const exists = credentials.some(c => c.email === credential.email);
    
                if(exists) {
                    socket.emit(DungeonEvent.EmailAlreadyTaken);
                    return;
                }

                credential.password = hashSync(credential.password);
                credentials.push(credential);
                writeFileSync(path, JSON.stringify(credentials));
                const payload = { email: credential.email };
                const token = sign(payload, Constants.TOKEN_SECRET);
                socket.emit(DungeonEvent.Registered, token);
            });

            socket.on(DungeonEvent.Login, (credential: Credential) => {
                const path = Constants.CREDENTIALS_PATH;
                
                if(!existsSync(path)) {
                    writeFileSync(path, JSON.stringify([]));
                }
    
                const credentialsString = readFileSync(path, 'utf8');
                const credentials = JSON.parse(credentialsString) as Credential[];
                credential.email = credential.email.toLowerCase();
                const existingCredential = credentials.find(c => c.email === credential.email);

                if(!existingCredential) {
                    socket.emit(DungeonEvent.LoginFailed);
                    return;
                }

                const passwordIsCorrect = compareSync(credential.password, existingCredential.password);

                if(!passwordIsCorrect) {
                    socket.emit(DungeonEvent.LoginFailed);
                    return;
                }

                const payload = { email: credential.email };
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

            this.emails.set(socket.id, payload.email);
            next();
        });

        this.authenticatedNamespace.on(DungeonEvent.Connection, socket => {
            const email = this.emails.get(socket.id);
            let player = this.players.find(player => player.email === email);

            if(!player) {
                player = new Player();
                player.email = email;
                player.game = this;
                player.setAvatar();
                player.initializePosition();
                this.players.push(player);
            }

            player.attachSocket(socket);
        });
    }

}
