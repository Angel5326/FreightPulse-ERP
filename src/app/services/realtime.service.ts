import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:5000', { transports: ['websocket'] });
  }

  onShipmentUpdate(): Observable<any> {
    return new Observable(o => { this.socket.on('shipment_updated', (d: any) => o.next(d)); });
  }

  onShipmentCreated(): Observable<any> {
    return new Observable(o => { this.socket.on('shipment_created', (d: any) => o.next(d)); });
  }

  onShipmentDeleted(): Observable<any> {
    return new Observable(o => { this.socket.on('shipment_deleted', (d: any) => o.next(d)); });
  }

  onDataRefresh(): Observable<any> {
    return new Observable(o => { this.socket.on('data_refresh', (d: any) => o.next(d)); });
  }

  onNewNotification(): Observable<any> {
    return new Observable(o => { this.socket.on('new_notification', (d: any) => o.next(d)); });
  }
}