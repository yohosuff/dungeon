import { Injectable } from "@angular/core";
import { PlayerDto, Position } from "../../../shared";
import { Camera } from "./camera";
import { PlayerManager } from "./player-manager";
import { ImageManager as ImageManager } from "./image-manager";
import { TileManager } from "./tile-manager";
import { Player } from "./player";

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
        private _camera: Camera,
        private _playerManager: PlayerManager,
        private _tileManager: TileManager,
        private _imageManager: ImageManager,
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
        const me = this._playerManager.me;

        context.clearRect(0, 0, canvas.width, canvas.height);

        me.updateAnimatedPosition();
        
        this._camera.moveToPosition(me.animatedPosition);

        for(let tile of this._camera.visibleTiles.filter(tile => tile.inFOV)) {
            this.drawTile(context, tile.type === 0 ? 'wall' : 'floor', tile.position);
        }

        this._playerManager.sortOtherPlayersByY();

        for(let player of this._playerManager.getOtherPlayersAboveMe()) {

            if(!this._camera.canSee(player.position)) {
                continue;
            }

            player.updateAnimatedPosition();

            this.drawSprite(
                context,
                player.avatar!,
                player.pressingKey ? player.getFrameIndex() : 0,
                player.getDirectionIndex() ?? 2,
                player.animatedPosition);

            this.drawUsername(context, player);
        }

        this.drawSprite(
            context,
            me.avatar!,
            me.pressingKey ? me.getFrameIndex() : 0,
            me.getDirectionIndex() ?? 2,
            me.animatedPosition,
        );

        for(let player of this._playerManager.getOtherPlayersBelowMe()) {

            if(!this._camera.canSee(player.position)) {
                continue;
            }

            if(this.playersHeadIsPokingUp(player)) {
                continue;
            }

            player.updateAnimatedPosition();

            this.drawSprite(
                context,
                player.avatar!,
                player.pressingKey ? player.getFrameIndex() : 0,
                player.getDirectionIndex() ?? 2,
                player.animatedPosition);

            this.drawUsername(context, player);
        }

        for(let tile of this._camera.visibleTiles.filter(tile => !tile.inFOV)) {
            this.drawTile(context, 'black', tile.position);
        }

        this.primaryContext.clearRect(0, 0, canvas.width, canvas.height);
        this.primaryContext.drawImage(canvas, 0, 0);
    }

    playersHeadIsPokingUp(player: PlayerDto) {
        const positionAbovePlayer = player.position.move('up');
        const tileAbovePlayerIsWall = this._tileManager.getTileByPosition(positionAbovePlayer)?.type === 0;
        const tileInFieldOfView = this._camera.coordinatesInFieldOfView.has(player.position.toCoordinateString());
        return !tileInFieldOfView && tileAbovePlayerIsWall;
    }

    drawTile(context: CanvasRenderingContext2D, name: string, position: Position) {
        const dx = position.x - this._camera.position.x + this._camera.radius;
        const dy = position.y - this._camera.position.y + this._camera.radius;

        context.drawImage(
            this._imageManager.getImage(name),
            dx * this.tileSize,
            dy * this.tileSize,
        );
    }

    drawSprite(context: CanvasRenderingContext2D, name: string, sourceX: number, sourceY: number, position: Position) {
        const x = position.x - this._camera.position.x + this._camera.radius;
        const y = position.y - this._camera.position.y + this._camera.radius;

        context.drawImage(
            this._imageManager.getImage(name),
            sourceX * this.spriteSize,
            sourceY * this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            x * this.tileSize - 16,
            y * this.tileSize - 32,
            this.spriteSize,
            this.spriteSize,
        );
    }

    drawUsername(context: CanvasRenderingContext2D, player: Player) {
        const localPosition = this._camera.getLocalPosition(player.animatedPosition);
        const x = localPosition.x * this.tileSize + this.spriteSize / 4;
        const y = localPosition.y * this.tileSize - 20;
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.fillStyle = player.connected ? 'green' : 'red';
        context.strokeStyle = 'white';
        context.strokeText(player.username, x, y)
        context.fillText(player.username, x, y);
    }
}
