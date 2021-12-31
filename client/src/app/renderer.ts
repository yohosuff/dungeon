import { Injectable } from "@angular/core";
import { Camera } from "./camera";

@Injectable({
    providedIn: 'root'
})
export class Renderer {
    
    canvas!: HTMLCanvasElement;
    context!: CanvasRenderingContext2D;

    waterImage: HTMLImageElement;
    stoneImage: HTMLImageElement;
    bradImage: HTMLImageElement;
    blackImage: HTMLImageElement;

    constructor(
        public camera: Camera,
    ) {
        this.waterImage = this.loadImage("/assets/dngn_deep_water.png");
        this.stoneImage = this.loadImage("/assets/rect_gray0.png");
        this.bradImage = this.loadImage("/assets/brad.png");
        this.blackImage = this.loadImage("/assets/black.png");
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

        //console.log(this.camera.visibleTiles);
        
        for(let tile of this.camera.visibleTiles) {
            
            const x = tile.localPosition.x + this.camera.radius;
            const y = tile.localPosition.y + this.camera.radius;

            let image;

            if(tile.inFOV) {
                image = tile.type === 0 ? this.waterImage : this.stoneImage;
            } else {
                image = this.blackImage;
            }

            this.context.drawImage(
                image,
                x * 32,
                y * 32);
        }

        this.context.drawImage(this.bradImage, 0 * 64, 2 * 64, 64, 64, this.camera.radius * 32 - 16, this.camera.radius * 32 - 32, 64, 64);
    }
}
