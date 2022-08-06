import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { Message } from '../video-chat/types/message';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private hubConnection!: HubConnection;
  private messageSubject = new Subject<Message>();
  messages$ = this.messageSubject.asObservable();

  constructor() { }

  createHubConnection(){
    this.hubConnection = new HubConnectionBuilder()
                        .withUrl('https://localhost:7093/signal')
                        .withAutomaticReconnect().build();

    this.hubConnection.start().catch(error => console.log(error));

    this.hubConnection.on('ReceiveSignal', response => {
      console.log(response);
      this.messageSubject.next(response);
    })

  }

  sendMessage(message: Message){
    this.hubConnection.invoke("SendSignal", message.type, message.data);
  }
}
