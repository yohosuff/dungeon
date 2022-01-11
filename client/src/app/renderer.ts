import { Injectable } from "@angular/core";
import { PlayerDto } from "../../../shared";
import { Camera } from "./camera";
import { PlayerManager } from "./player-manager";
import { ImageManager as ImageManager } from "./image-manager";
import { TileManager } from "./tile-manager";

@Injectable({
    providedIn: 'root'
})
export class Renderer {
    
    primaryCanvas!: HTMLCanvasElement;
    primaryContext!: CanvasRenderingContext2D;

    secondaryCanvas!: HTMLCanvasElement;
    secondaryContext!: CanvasRenderingContext2D;

    tileSize = 32;
    spriteSize = 64;

    constructor(
        private camera: Camera,
        private playerManager: PlayerManager,
        private tileManager: TileManager,
        private imageManager: ImageManager,
    ) {}

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

        this.playerManager.sortOtherPlayersByY();

        for(let player of this.playerManager.getOtherPlayersAboveMe()) {

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

        for(let player of this.playerManager.getOtherPlayersBelowMe()) {

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
        const tileAbovePlayerIsWall = this.tileManager.getTileByPosition(positionAbovePlayer)?.type === 0;
        const tileInFieldOfView = this.camera.coordinatesInFieldOfView.has(player.position.toCoordinateString());
        return !tileInFieldOfView && tileAbovePlayerIsWall;
    }

    drawTile(context: CanvasRenderingContext2D, name: string, destinationX: number, destinationY: number) {
        context.drawImage(
            this.imageManager.getImage(name),
            destinationX * this.tileSize,
            destinationY * this.tileSize,
        );
    }

    drawSprite(context: CanvasRenderingContext2D, name: string, sourceX: number, sourceY: number, destinationX: number, destinationY: number) {
        context.drawImage(
            this.imageManager.getImage(name),
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
