import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { Socket } from 'socket.io-client';
import { DungeonEvent } from '../../../../shared'; //use @shared or something here instead of going up all those levels

@Component({
  selector: 'authentication-widget',
  templateUrl: './authentication-widget.component.html',
  styleUrls: ['./authentication-widget.component.scss']
})
export class AuthenticationWidgetComponent implements OnInit {

  @Input() anonymousSocket!: Socket;

  form: FormGroup;

  constructor(private _formBuilder: FormBuilder) {
    this.form = this._formBuilder.group({
      email: ['', Validators.email],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
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
    this.anonymousSocket.emit(DungeonEvent.Login, { email, password });
    this.getModalInstance('loginModal').hide();
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
    this.anonymousSocket.emit(DungeonEvent.Register, { email, password });
    this.getModalInstance('registerModal').hide();
  }

  getModalInstance(id: string) {
    const modalElement = document.getElementById(id) as Element;
    const modal = Modal.getInstance(modalElement) as Modal;
    return modal;
  }

}
