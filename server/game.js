import { Server } from 'socket.io';

export class Game {

    position = {x: 0, y: 0};

    start() {
        const io = new Server({
            serveClient: false,
            cors: {
                origin: "http://localhost:4200"
            }
        });

        io.on("connection", socket => {

            console.log('connection', socket.id)
            
            io.emit('update-position', this.position);

            socket.on('move', async direction => {

                // use this to resolve invalid move
                const originalPosition = {...this.position};

                switch(direction) {
                    case 'right': this.position.x += 1; break;
                    case 'left': this.position.x -= 1; break;
                    case 'down': this.position.y += 1; break;
                    case 'up': this.position.y -= 1; break;
                }

                // simulate lag
                // await new Promise(resolve => setTimeout(resolve, 150));

                // simulate collision
                // if (Math.random() > 0.75) { this.position = originalPosition; }
                
                io.emit('update-position', this.position);
            });
        });

        io.listen(3000);
    }

}
