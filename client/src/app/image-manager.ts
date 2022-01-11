import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ImageManager {
    
    images: Map<string, HTMLImageElement>;

    constructor(){
        this.images = new Map<string, HTMLImageElement>();
        this.images.set('water', this.loadImage("/assets/dngn_deep_water.png"));
        this.images.set('stone', this.loadImage("/assets/rect_gray0.png"));
        this.images.set('black', this.loadImage("/assets/black.png"));
        this.images.set('brad', this.loadImage("/assets/brad.png"));
        this.images.set('jack', this.loadImage("/assets/jack.png"));
    }

    getImage(name: string): CanvasImageSource {
        return this.images.get(name)!;
    }

    private loadImage(src: string) {
        const image = new Image();
        image.src = src;
        return image;
    }
}
