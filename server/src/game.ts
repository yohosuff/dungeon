import { Server } from 'socket.io';
import { Player } from './Player';

export class Game {

    players: Player[];
    io: Server;

    constructor() {
        this.players = [];

        this.io = new Server({
            serveClient: false,
            cors: {
                origin: "http://localhost:4200"
            }
        });
    }

    start() {
        this.setupListeners();
        this.io.listen(3000);
        console.log('server is up!');
    }

    setupListeners() {
        const io = this.io;

        io.on("connection", socket => {
            console.log('connection', socket.id);
            new Player(socket, this);
        });
    }

}
