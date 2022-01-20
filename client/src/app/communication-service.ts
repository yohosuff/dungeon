import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import Swal from "sweetalert2";
import { DungeonEvent, HelloDto, PlayerDto } from "../../../shared";
import { ClientEvent } from "./client-event";
import { Constants } from "./constants";
import { MessageBus } from "./message-bus";

@Injectable({
    providedIn: 'root'
})
export class CommunicationService {

    anonymousSocket!: Socket;
    anonymousSocketConnected: boolean;

    authenticatedSocket!: Socket;
    authenticatedSocketConnected: boolean;

    waitingForServer: boolean;

    constructor(
        private messageBus: MessageBus,
    ) {
        this.anonymousSocketConnected = false;
        this.authenticatedSocketConnected = false;
        this.waitingForServer = false;

        this.messageBus.subscribe(ClientEvent.ServerUpdatedMe, (playerDto: PlayerDto) => {
            this.waitingForServer = false;
        });
    }

    logout() {
        localStorage.removeItem(Constants.DungeonToken);
        this.authenticatedSocket.disconnect();
    }

    establishAnonymousSocketConnection() {
        
        let anonymousSocket = this.anonymousSocket;

        if(anonymousSocket){
            anonymousSocket.removeAllListeners();
            anonymousSocket.disconnect();
        }

        anonymousSocket = io(`${Constants.ServerUrl}/anonymous`);

        this.anonymousSocket = anonymousSocket;
        
        anonymousSocket.on(DungeonEvent.Connect, () => {
            const token = localStorage.getItem(Constants.DungeonToken);

            if(token) {
                this.establishAuthenticatedSocketConnection(token);
            } else {
                this.anonymousSocketConnected = true;
            }
        });

        anonymousSocket.on(DungeonEvent.LoginFailed, () => {
            Swal.fire('Login failed.');
        });

        anonymousSocket.on(DungeonEvent.EmailAlreadyTaken, () => {
            Swal.fire('Email already taken.');
        });

        anonymousSocket.on(DungeonEvent.LoginSuccessful, token => {
            localStorage.setItem(Constants.DungeonToken, token);
            this.establishAuthenticatedSocketConnection(token);
        });

        anonymousSocket.on(DungeonEvent.Registered, token => {
            localStorage.setItem(Constants.DungeonToken, token);
            this.establishAuthenticatedSocketConnection(token);
        });

        anonymousSocket.on(DungeonEvent.Disconnect, () => {
            this.anonymousSocketConnected = false;
        });
    }

    establishAuthenticatedSocketConnection(token: string) {

        let authenticatedSocket = this.authenticatedSocket;

        if(authenticatedSocket) {
            authenticatedSocket.removeAllListeners();
            authenticatedSocket.disconnect();
        }

        authenticatedSocket = io(`${Constants.ServerUrl}/authenticated`, { auth: { token } });

        this.authenticatedSocket = authenticatedSocket;

        authenticatedSocket.on(DungeonEvent.ConnectError, (error: Error) => {
            console.warn('could not connect authenticated socket with token', token);
            console.warn(error);
            authenticatedSocket.removeAllListeners();
            this.establishAnonymousSocketConnection();
        });

        authenticatedSocket.on(DungeonEvent.Connect, () => {
            if (this.anonymousSocket) {
                this.anonymousSocket.removeAllListeners();
                this.anonymousSocket.disconnect();
                this.anonymousSocketConnected = false;
            }

            this.authenticatedSocketConnected = true;
            authenticatedSocket.emit(DungeonEvent.Hello);
        });

        authenticatedSocket.on(DungeonEvent.PlayerAlreadyHasSocket, () => {
            Swal.fire('Your player is already connected to another client.');
            this.logout();
        });

        authenticatedSocket.on(DungeonEvent.Hello, (helloDto: HelloDto) => {
            helloDto.players = helloDto.players.map(p => PlayerDto.reconstruct(p));
            this.messageBus.publish(ClientEvent.ServerSaidHello, helloDto);
        });

        authenticatedSocket.on(DungeonEvent.PlayerJoined, (playerDto: PlayerDto) => {
            playerDto = PlayerDto.reconstruct(playerDto);
            this.messageBus.publish(ClientEvent.ServerAddedPlayer, playerDto);
        });

        authenticatedSocket.on(DungeonEvent.UpdatePlayer, (playerDto: PlayerDto) => {
            playerDto = PlayerDto.reconstruct(playerDto);
            this.messageBus.publish(ClientEvent.ServerUpdatedPlayer, playerDto);
        });

        authenticatedSocket.on(DungeonEvent.PlayerLeft, (email: string) => {
            console.log('player left', email);
        });

        authenticatedSocket.on(DungeonEvent.Disconnect, () => {
            this.authenticatedSocketConnected = false;
            this.establishAnonymousSocketConnection();
        });
    }
}
