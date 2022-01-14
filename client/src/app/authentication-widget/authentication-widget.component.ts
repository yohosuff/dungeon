import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { DungeonEvent } from '../../../../shared'; //use @shared or something here instead of going up all those levels
import { CommunicationService } from '../communication-service';
import { Constants } from '../constants';
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
    public communicationService: CommunicationService,
    public playerManager: PlayerManager,
  ) {
    this.form = this._formBuilder.group({
      email: ['', Validators.email],
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
    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;
    this.communicationService.anonymousSocket.emit(DungeonEvent.Login, { email, password });
    this.getModalInstance('loginModal').hide();
  }

  logout() {
    localStorage.removeItem(Constants.DungeonToken);
    this.communicationService.authenticatedSocket.disconnect();
  }

  showRegisterModal() {
    const registerModalElement = document.getElementById('registerModal') as Element;
    const registerModal = new Modal(registerModalElement);
    this.form.reset();
    registerModal.show();
  }

  register() {
    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;
    this.communicationService.anonymousSocket.emit(DungeonEvent.Register, { email, password });
    this.getModalInstance('registerModal').hide();
  }

  getModalInstance(id: string) {
    const modalElement = document.getElementById(id) as Element;
    const modal = Modal.getInstance(modalElement) as Modal;
    return modal;
  }
}
