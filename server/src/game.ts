import { Namespace, Server } from 'socket.io';
import { Player } from './Player';
import { PositionManager } from './PositionManager';
import { DungeonEvent, Credential } from '../../shared';
import { verify, sign } from 'jsonwebtoken';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { hashSync, compareSync } from 'bcryptjs';

export class Game {

    players: Player[];
    emails: Map<string, string>;
    positionManager: PositionManager;

    io: Server;

    anonymousNamespace: Namespace;
    authenticatedNamespace: Namespace;
    
    TOKEN_SECRET = '123qwe';

    constructor() {
        this.players = [];
        this.emails = new Map<string, string>();
        this.positionManager = new PositionManager();

        this.io = new Server({
            serveClient: false,
            cors: {
                origin: "http://localhost:4200",
            },
        });

        this.anonymousNamespace = this.io.of('anonymous');
        this.authenticatedNamespace = this.io.of('authenticated');
    }

    start() {
        this.setupAnonymousListeners();
        this.setupAuthenticatedListeners();
        this.io.listen(3000);
        console.log('server is up!');
    }

    setupAnonymousListeners() {
        this.anonymousNamespace.on(DungeonEvent.Connection, socket => {
            console.log('connection on anonymous namespace', socket.id);

            socket.on(DungeonEvent.Register, (credential: Credential) => {
                // read credentials from disk
                const path = 'credentials.json';
                
                if(!existsSync(path)) {
                    writeFileSync(path, JSON.stringify([]));
                }
    
                const credentialsString = readFileSync(path, 'utf8');
                const credentials = JSON.parse(credentialsString) as Credential[];
    
                // check if email already exists
                credential.email = credential.email.toLowerCase();
                const exists = credentials.some(c => c.email === credential.email);
    
                if(exists) {
                    socket.emit(DungeonEvent.EmailAlreadyTaken);
                    return;
                }

                // save credentials to disk (encrypted password)
                credential.password = hashSync(credential.password);
                credentials.push(credential);

                writeFileSync(path, JSON.stringify(credentials));

                const payload = { email: credential.email };
                const token = sign(payload, this.TOKEN_SECRET);

                socket.emit(DungeonEvent.Registered, token);
            });

            socket.on(DungeonEvent.Login, (credential: Credential) => {
                console.log(credential);
                // get credentials from disk
                const path = 'credentials.json';
                
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

                // check encrypted password
                const ok = compareSync(credential.password, existingCredential.password);

                if(!ok) {
                    socket.emit(DungeonEvent.LoginFailed);
                    return;
                }

                // return token if successful
                const payload = { email: credential.email };
                const token = sign(payload, this.TOKEN_SECRET);

                socket.emit(DungeonEvent.LoginSuccessful, token);
            });
        });        
    }

    setupAuthenticatedListeners() {
        this.authenticatedNamespace.use((socket, next) => {
            const token = socket.handshake.auth.token;
            let payload;

            try {
                payload = verify(token, this.TOKEN_SECRET);
            } catch(err) {
                next(err);
                return;
            }

            console.log('token verification passed', payload);

            this.emails.set(socket.id, payload.email); // need this to retrieve players position saved to disk
            
            next();
        });

        this.authenticatedNamespace.on(DungeonEvent.Connection, socket => {
            console.log('connection on authenticated namespace', this.emails.get(socket.id));
            new Player(socket, this);
        });
    }

}
