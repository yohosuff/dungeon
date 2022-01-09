import { Injectable } from "@angular/core";
import { PlayerDto } from "../../../shared";
import { Camera } from "./camera";
import { PlayerManager } from "./player-manager";
import { TileManager } from "./tile-manager";

@Injectable({
    providedIn: 'root'
})
export class Renderer {
    
    primaryCanvas!: HTMLCanvasElement;
    primaryContext!: CanvasRenderingContext2D;

    secondaryCanvas!: HTMLCanvasElement;
    secondaryContext!: CanvasRenderingContext2D;

    images: Map<string, HTMLImageElement>;
    tileSize: number;
    spriteSize: number;

    constructor(
        private camera: Camera,
        private playerManager: PlayerManager,
        private tileManager: TileManager,
    ) {
        this.images = new Map<string, HTMLImageElement>();
        this.images.set('water', this.loadImage("/assets/dngn_deep_water.png"));
        this.images.set('stone', this.loadImage("/assets/rect_gray0.png"));
        this.images.set('black', this.loadImage("/assets/black.png"));
        this.images.set('brad', this.loadImage("/assets/brad.png"));
        this.images.set('jack', this.loadImage("/assets/jack.png"));
        this.tileSize = 32;
        this.spriteSize = 64;
    }

    private loadImage(src: string) {
        const image = new Image();
        image.src = src;
        return image;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.primaryCanvas = canvas;
        this.primaryContext = canvas.getContext('2d')!;
        this.secondaryCanvas = document.createElement('canvas');
        this.secondaryCanvas.width = canvas.width;
        this.secondaryCanvas.height = canvas.height;
        this.secondaryContext = this.secondaryCanvas.getContext('2d')!;
    }

    draw() {
        const context = this.secondaryContext;
        const canvas = this.secondaryCanvas;

        context.clearRect(0, 0, canvas.width, canvas.height);

        const me = this.playerManager.me;

        me.updateAnimatedPosition();
        
        if(me.animating) {
            this.camera.moveToPosition(me.animatedPosition, false);
        } else {
            this.camera.moveToPosition(me.position);
        }
        
        for(let tile of this.camera.visibleTiles.filter(tile => tile.inFOV)) {
            const dx = tile.position.x - this.camera.position.x + this.camera.radius;
            const dy = tile.position.y - this.camera.position.y + this.camera.radius;
            this.drawTile(context, tile.type === 0 ? 'water' : 'stone', dx, dy);
        }

        // this may be necessary to properly display a column of other players
        this.playerManager.otherPlayers.sort((a, b) => a.position.y - b.position.y);

        // render other players above me
        for(let player of this.playerManager.otherPlayers.filter(player => player.position.y < this.playerManager.me.position.y)) {

            if(!this.camera.canSee(player.position)) {
                continue;
            }

            player.updateAnimatedPosition();

            const position = player.animating ? player.animatedPosition : player.position;

            this.drawSprite(
                context,
                player.avatar!,
                player.animating ? player.getFrameIndex() : 0,
                player.getDirectionIndex() ?? 2,
                position.x - this.camera.position.x + this.camera.radius,
                position.y - this.camera.position.y + this.camera.radius);
        }

        // render me
        const myPosition = me.animating ? me.animatedPosition : me.position;

        this.drawSprite(
            context,
            me.avatar!,
            me.animating ? me.getFrameIndex() : 0,
            me.getDirectionIndex() ?? 2,
            myPosition.x - this.camera.position.x + this.camera.radius,
            myPosition.y - this.camera.position.y + this.camera.radius,
        );

        // render other players at same level or below me
        for(let player of this.playerManager.otherPlayers.filter(player => player.position.y >= this.playerManager.me.position.y)) {

            if(!this.camera.canSee(player.position)) {
                continue;
            }

            if(this.playersHeadIsPokingUp(player)) {
                continue;
            }

            player.updateAnimatedPosition();

            const position = player.animating ? player.animatedPosition : player.position;

            this.drawSprite(
                context,
                player.avatar!,
                player.animating ? player.getFrameIndex() : 0,
                player.getDirectionIndex() ?? 2,
                position.x - this.camera.position.x + this.camera.radius,
                position.y - this.camera.position.y + this.camera.radius);
        }

        // render black 'covering' tiles
        for(let tile of this.camera.visibleTiles.filter(tile => !tile.inFOV)) {
            const dx = tile.position.x - this.camera.position.x + this.camera.radius;
            const dy = tile.position.y - this.camera.position.y + this.camera.radius;
            this.drawTile(context, 'black', dx, dy);
        }

        this.primaryContext.clearRect(0, 0, canvas.width, canvas.height);
        this.primaryContext.drawImage(canvas, 0, 0);
    }

    playersHeadIsPokingUp(player: PlayerDto) {
        const positionAbovePlayer = player.position.move('up');
        const tileAbovePlayerIsWall = this.tileManager.getTile(positionAbovePlayer.x, positionAbovePlayer.y)?.type === 0;

        return !this.camera.coordinatesInFieldOfView.has(player.position.toCoordinateString()) && tileAbovePlayerIsWall;
    }

    drawTile(context: CanvasRenderingContext2D, name: string, destinationX: number, destinationY: number) {
        context.drawImage(
            this.images.get(name)!,
            destinationX * this.tileSize,
            destinationY * this.tileSize,
        );
    }

    drawSprite(context: CanvasRenderingContext2D, name: string, sourceX: number, sourceY: number, destinationX: number, destinationY: number) {
        context.drawImage(
            this.images.get(name)!,
            sourceX * this.spriteSize,
            sourceY * this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            destinationX * this.tileSize - 16,
            destinationY * this.tileSize - 32,
            this.spriteSize,
            this.spriteSize,
        );
    }
}
