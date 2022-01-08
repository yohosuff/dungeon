import { Injectable } from "@angular/core";
import { PlayerDto } from "../../../shared";
import { Camera } from "./camera";
import { PlayerManager } from "./player-manager";
import { TileManager } from "./tile-manager";

@Injectable({
    providedIn: 'root'
})
export class Renderer {
    
    canvas!: HTMLCanvasElement;
    context!: CanvasRenderingContext2D;

    offScreenCanvas!: HTMLCanvasElement;
    offScreenContext!: CanvasRenderingContext2D;

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
        // TODO: rename these primary and secondary canvas
        this.canvas = canvas;
        this.context = canvas.getContext('2d')!;
        this.offScreenCanvas = document.createElement('canvas');
        this.offScreenCanvas.width = canvas.width;
        this.offScreenCanvas.height = canvas.height;
        this.offScreenContext = this.offScreenCanvas.getContext('2d')!;
    }

    draw() {
        const targetContext = this.offScreenContext;
        const targetCanvas = this.offScreenCanvas;

        targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

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
            this.drawTile(targetContext, tile.type === 0 ? 'water' : 'stone', dx, dy);
        }

        // this may be necessary to properly display a column of other players
        this.playerManager.otherPlayers.sort((a, b) => a.position.y - b.position.y);

        // players above me
        for(let player of this.playerManager.otherPlayers.filter(player => player.position.y < this.playerManager.me.position.y)) {

            if(!this.camera.canSee(player.position)) {
                continue;
            }

            player.updateAnimatedPosition();

            const position = player.animating ? player.animatedPosition : player.position;

            this.drawSprite(
                targetContext,
                player.avatar!,
                player.animating ? player.getFrameIndex() : 0,
                player.getDirectionIndex() ?? 2,
                position.x - this.camera.position.x + this.camera.radius,
                position.y - this.camera.position.y + this.camera.radius);
        }

        const myPosition = me.animating ? me.animatedPosition : me.position;

        this.drawSprite(
            targetContext,
            me.avatar!,
            me.animating ? me.getFrameIndex() : 0,
            me.getDirectionIndex() ?? 2,
            myPosition.x - this.camera.position.x + this.camera.radius,
            myPosition.y - this.camera.position.y + this.camera.radius,
        );

        // players at same level or below me
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
                targetContext,
                player.avatar!,
                player.animating ? player.getFrameIndex() : 0,
                player.getDirectionIndex() ?? 2,
                position.x - this.camera.position.x + this.camera.radius,
                position.y - this.camera.position.y + this.camera.radius);
        }

        for(let tile of this.camera.visibleTiles.filter(tile => !tile.inFOV)) {
            const dx = tile.position.x - this.camera.position.x + this.camera.radius;
            const dy = tile.position.y - this.camera.position.y + this.camera.radius;
            this.drawTile(targetContext, 'black', dx, dy);
        }

        this.context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        this.context.drawImage(targetCanvas, 0, 0);
    }

    playersHeadIsPokingUp(player: PlayerDto) {
        const positionAbovePlayer = player.position.move('up');
        const tileAbovePlayerIsWall = this.tileManager.getTile(positionAbovePlayer.x, positionAbovePlayer.y)?.type === 0;

        return !this.camera.coordinatesInFieldOfView.has(player.position.toCoordinateString()) && tileAbovePlayerIsWall;
    }

    drawTile(context: CanvasRenderingContext2D, name: string, dx: number, dy: number) {
        context.drawImage(
            this.images.get(name)!,
            dx * this.tileSize,
            dy * this.tileSize,
        );
    }

    drawSprite(context: CanvasRenderingContext2D, name: string, sx: number, sy: number, dx: number, dy: number) {
        context.drawImage(
            this.images.get(name)!,
            sx * this.spriteSize,
            sy * this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            dx * this.tileSize - 16,
            dy * this.tileSize - 32,
            this.spriteSize,
            this.spriteSize,
        );
    }
}
