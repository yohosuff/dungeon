import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageBus {

  private subjects: Map<string, Subject<never>>;

  constructor() {
    this.subjects = new Map<string, Subject<never>>();
  }
    
  public publish<T>(clientEvent: string, data?: T) {
    this.getSubject(clientEvent).next(data as never);
  }

  public subscribe<T>(clientEvent: string, subscriber: (data: T) => void) {
    return this.getSubject(clientEvent).subscribe(subscriber);
  }

  private getSubject(clientEvent: string) {
    let subject = this.subjects.get(clientEvent);

    if(subject === undefined) {
      subject = new Subject<never>();
      this.subjects.set(clientEvent, subject);
    }

    return subject;
  }
}
