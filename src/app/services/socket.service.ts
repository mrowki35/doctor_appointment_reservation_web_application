import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket!: Socket;

  constructor() {
    if (environment.isMongo) {
      this.socket = io(environment.apiBaseUrl, {
        transports: ['websocket'],
      });
    }
  }

  listen<T>(eventName: string): Observable<T> {
    return new Observable((observer) => {
      if (!environment.isMongo) {
        observer.complete();
        return;
      }

      this.socket.on(eventName, (data: T) => {
        observer.next(data);
      });

      return () => {
        this.socket.off(eventName);
      };
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
