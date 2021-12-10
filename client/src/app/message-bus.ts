import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ClientEvent } from "./client-event";

@Injectable({
    providedIn: 'root'
})
export class MessageBus {

    subjects: Map<string, Subject<any>>;

    constructor() {
        this.subjects = new Map<string, Subject<any>>();
        this.subjects.set(ClientEvent.ServerSaidHello, new Subject<any>());
        this.subjects.set(ClientEvent.ServerAddedPlayer, new Subject<any>());
        this.subjects.set(ClientEvent.ServerUpdatedPlayer, new Subject<any>());
        this.subjects.set(ClientEvent.ServerUpdatedMe, new Subject<any>());
    }
    
    public publish<T>(dungeonEvent: string, data: T) {
        this.subjects.get(dungeonEvent)?.next(data);
    }

    public getSubject(dungeonEvent: string) {
        return this.subjects.get(dungeonEvent);
    }
}