import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
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

    transitioning: boolean; // does this really belong in the communication service?
    waitingForServer: boolean;

    constructor(
        private messageBus: MessageBus,
    ) {
        this.anonymousSocketConnected = false;
        this.authenticatedSocketConnected = false;
        this.transitioning = false;
        this.waitingForServer = false;

        this.messageBus.subscribe(ClientEvent.ServerUpdatedMe, (playerDto: PlayerDto) => {
            this.waitingForServer = false;
        });
    }

    establishAnonymousSocketConnection() {
        this.anonymousSocket = io(`${Constants.BaseUrl}/anonymous`);

        this.anonymousSocket.on(DungeonEvent.Connect, () => {
            this.anonymousSocketConnected = true;
        });

        this.anonymousSocket.on(DungeonEvent.LoginFailed, () => {
            console.log('login failed');
        });

        this.anonymousSocket.on(DungeonEvent.EmailAlreadyTaken, () => {
            console.log('email already taken');
        });

        this.anonymousSocket.on(DungeonEvent.LoginSuccessful, token => {
            localStorage.setItem(Constants.DungeonToken, token);
            this.establishAuthenticatedSocketConnection(token);
        });

        this.anonymousSocket.on(DungeonEvent.Registered, token => {
            localStorage.setItem(Constants.DungeonToken, token);
            this.establishAuthenticatedSocketConnection(token);
        });

        this.anonymousSocket.on(DungeonEvent.Disconnect, () => {
            this.anonymousSocketConnected = false;
        });
    }

    establishAuthenticatedSocketConnection(token: string) {
        const authenticatedSocket = io(`${Constants.BaseUrl}/authenticated`, { auth: { token } });

        this.authenticatedSocket = authenticatedSocket;

        authenticatedSocket.on(DungeonEvent.ConnectError, (error: Error) => {
            console.warn('could not connect authenticated socket with token', token);
            console.warn(error);
            this.establishAnonymousSocketConnection();
            authenticatedSocket.removeAllListeners();
        });

        authenticatedSocket.on(DungeonEvent.Connect, () => {
            if (this.anonymousSocket) {
                this.anonymousSocket.disconnect();
            }

            this.authenticatedSocketConnected = true;
    
            authenticatedSocket.emit(DungeonEvent.Hello);
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
