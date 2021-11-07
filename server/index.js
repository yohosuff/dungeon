import { Server } from 'socket.io';

const io = new Server({
    serveClient: false,
    cors: {
        origin: "http://localhost:4200"
    }
});

io.on("connection", socket => {
    console.log('got a connection!', socket.id);
});

io.listen(3000);
