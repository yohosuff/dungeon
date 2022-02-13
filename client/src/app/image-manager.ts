import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageManager {
    
  images: Map<string, HTMLImageElement>;

  constructor(){
    this.images = new Map<string, HTMLImageElement>();
    this.images.set('wall', this.loadImage('/assets/stone_gray0.png'));
    this.images.set('floor', this.loadImage('/assets/rect_gray0.png'));
    this.images.set('black', this.loadImage('/assets/black.png'));
    this.images.set('skeleton', this.loadImage('/assets/skeleton.png'));
  }

  getImage(name: string): CanvasImageSource {
    if(!this.images.has(name)) {
      throw new Error(`could not get image ${name}`);
    }

    return this.images.get(name) as HTMLImageElement;
  }

  private loadImage(src: string) {
    const image = new Image();
    image.src = src;
    return image;
  }
}
