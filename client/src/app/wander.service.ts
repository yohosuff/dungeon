import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PlayerManager } from './player-manager';

@Injectable({providedIn: 'root'})
export class WanderService {
  wandering: boolean;
  wandered: Subject<string>;
  keys: string[];

  constructor(private _playerManager: PlayerManager) {
    this.wandering = false;
    this.wandered = new Subject<string>();
    this.keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  }

  init() {
    this.wandering = localStorage.getItem(`wandering-${this._playerManager.me.username}`) === 'true';
    
    if(this.wandering) {
      this.wander(0);
    }
  }

  private wander(timeout: number) {
    setTimeout(() => {
      const keyIndex = Math.floor(Math.random() * this.keys.length);
      const key = this.keys[keyIndex];
      this.wandered.next(key);

      if(this.wandering) {
        const timeout = 500;
        this.wander(timeout);
      }
    }, timeout);
  }

  toggle() {
    this.wandering = !this.wandering;
    localStorage.setItem(`wandering-${this._playerManager.me.username}`, this.wandering ? 'true' : 'false');
    
    if(this.wandering) {
      this.wander(0);
    }
  }
}