import { Server } from 'socket.io';

const io = new Server({});

io.on("connection", socket => {
    console.log('got a connection!', socket);
});

io.listen(3000);

console.log('server is up');
