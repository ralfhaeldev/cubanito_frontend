import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Pedido } from '../../shared/models';

export interface PedidoNuevoEvent  { pedido: Pedido }
export interface PedidoEstadoEvent { pedidoId: string; estado: string }

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  private readonly _pedidoNuevo$  = new Subject<PedidoNuevoEvent>();
  private readonly _pedidoEstado$ = new Subject<PedidoEstadoEvent>();

  readonly pedidoNuevo$  = this._pedidoNuevo$.asObservable();
  readonly pedidoEstado$ = this._pedidoEstado$.asObservable();

  constructor(private auth: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.wsUrl, {
      auth:       { token: this.auth.getToken() },
      transports: ['websocket'],
    });

    this.socket.on('connect',       ()    => console.log('[WS] Conectado:', this.socket?.id));
    this.socket.on('disconnect',    (r)   => console.log('[WS] Desconectado:', r));
    this.socket.on('connect_error', (err) => console.error('[WS] Error:', err.message));

    this.socket.on('pedido:nuevo',              (d: PedidoNuevoEvent)  => this._pedidoNuevo$.next(d));
    this.socket.on('pedido:estado_actualizado', (d: PedidoEstadoEvent) => this._pedidoEstado$.next(d));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
