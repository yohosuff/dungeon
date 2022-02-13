import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { DungeonEvent } from '../../../../shared'; //use @shared or something here instead of going up all those levels
import { CommunicationService } from '../communication-service';
import { PlayerManager } from '../player-manager';

@Component({
  selector: 'authentication-widget',
  templateUrl: './authentication-widget.component.html',
  styleUrls: ['./authentication-widget.component.scss']
})
export class AuthenticationWidgetComponent {

  form: FormGroup;
  
  constructor(
    private _formBuilder: FormBuilder,
    public _communicationService: CommunicationService,
    public _playerManager: PlayerManager,
  ) {
    this.form = this._formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  showLoginModal() {
    const loginModalElement = document.getElementById('loginModal') as Element;
    const loginModal = new Modal(loginModalElement);
    this.form.reset();
    loginModal.show();
  }

  login() {
    const username = this.form.get('username')?.value;
    const password = this.form.get('password')?.value;
    this._communicationService.anonymousSocket.emit(DungeonEvent.Login, { username, password });
    this.getModalInstance('loginModal').hide();
  }

  logout() {
    this._communicationService.logout();
  }

  showRegisterModal() {
    const registerModalElement = document.getElementById('registerModal') as Element;
    const registerModal = new Modal(registerModalElement);
    this.form.reset();
    registerModal.show();
  }

  register() {
    const username = this.form.get('username')?.value;
    const password = this.form.get('password')?.value;
    this._communicationService.anonymousSocket.emit(DungeonEvent.Register, { username, password });
    this.getModalInstance('registerModal').hide();
  }

  getModalInstance(id: string) {
    const modalElement = document.getElementById(id) as Element;
    const modal = Modal.getInstance(modalElement) as Modal;
    return modal;
  }
}
