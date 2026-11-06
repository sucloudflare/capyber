'use client'

// CAPYBER — Cliente socket.io do motor CAPYCORE (porta 3003 via gateway Caddy)

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/?XTransformPort=3003', {
      // polling primeiro: conecta instantaneamente através de qualquer gateway;
      // o upgrade para websocket é oportunista (engine.io tenta depois do handshake)
      transports: ['polling', 'websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })
  }
  return socket
}
