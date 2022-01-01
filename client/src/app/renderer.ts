import { Injectable } from "@angular/core";
import { Camera } from "./camera";
import { PlayerManager } from "./player-manager";

@Injectable({
    providedIn: 'root'
})
export class Renderer {
    
    canvas!: HTMLCanvasElement;
    context!: CanvasRenderingContext2D;

    images: Map<string, HTMLImageElement>;
    tileSize: number;
    spriteSize: number;

    constructor(
        private camera: Camera,
        private playerManager: PlayerManager,
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
        this.canvas = canvas;
        this.context = canvas.getContext('2d')!;
    }

    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(let tile of this.camera.visibleTiles.filter(tile => tile.inFOV)) {
            const dx = tile.position.x - this.camera.position.x + this.camera.radius;
            const dy = tile.position.y - this.camera.position.y + this.camera.radius;

            this.drawTile(tile.type === 0 ? 'water' : 'stone', dx, dy);
        }

        this.playerManager.otherPlayers.sort((a, b) => a.position.y - b.position.y);

        for(let player of this.playerManager.otherPlayers.filter(player => player.position.y < this.playerManager.me.position.y)) {

            if(!this.camera.canSee(player.position)) {
                continue;
            }

            const dx = player.position.x - this.camera.position.x + this.camera.radius;
            const dy = player.position.y - this.camera.position.y + this.camera.radius;

            this.drawSprite(player.avatar!, 0, 2, dx, dy);
        }

        this.drawSprite(
            this.playerManager.me.avatar!, 0, 2,
            this.playerManager.me.position.x - this.camera.position.x + this.camera.radius,
            this.playerManager.me.position.y - this.camera.position.y + this.camera.radius,
        );

        for(let player of this.playerManager.otherPlayers.filter(player => player.position.y >= this.playerManager.me.position.y)) {

            if(!this.camera.canSee(player.position)) {
                continue;
            }

            const dx = player.position.x - this.camera.position.x + this.camera.radius;
            const dy = player.position.y - this.camera.position.y + this.camera.radius;

            this.drawSprite(player.avatar!, 0, 2, dx, dy);
        }

        for(let tile of this.camera.visibleTiles.filter(tile => !tile.inFOV)) {
            const dx = tile.position.x - this.camera.position.x + this.camera.radius;
            const dy = tile.position.y - this.camera.position.y + this.camera.radius;
            this.drawTile('black', dx, dy);
        }
    }

    drawTile(name: string, dx: number, dy: number) {
        this.context.drawImage(
            this.images.get(name)!,
            dx * this.tileSize,
            dy * this.tileSize,
        );
    }

    drawSprite(name: string, sx: number, sy: number, dx: number, dy: number) {
        this.context.drawImage(
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
