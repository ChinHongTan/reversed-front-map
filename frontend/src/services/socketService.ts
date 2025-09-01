/// <reference types="vite/client" />
import { WS_URL } from "../config";
const BACKEND_URL = WS_URL;

let socket: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export type MessageHandler = (data: any) => void;
const listeners: MessageHandler[] = [];

function startReconnectInterval() {
  if (reconnectInterval) return;

  reconnectInterval = setInterval(() => {
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      connectWebSocket();
    }
  }, 5000);
}

function stopReconnectInterval() {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
}

export function connectWebSocket(onOpen?: () => void, onClose?: () => void) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  socket = new WebSocket(BACKEND_URL);

  socket.onopen = () => {
    console.log('Connected to backend WebSocket');
    stopReconnectInterval(); // Stop reconnection attempts on successful connection
    if (onOpen) onOpen();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string);
      listeners.forEach(listener => listener(data));
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('Backend WebSocket error:', error);
    socket?.close(); // Close the socket on error
  };

  socket.onclose = () => {
    console.log('Disconnected from backend WebSocket');
    if (onClose) onClose();
    socket = null; // Allow reconnection
    startReconnectInterval(); // Start reconnection attempts
  };
}

export function addWebSocketListener(handler: MessageHandler) {
  listeners.push(handler);
}

export function removeWebSocketListener(handler: MessageHandler) {
  const index = listeners.indexOf(handler);
  if (index > -1) {
    listeners.splice(index, 1);
  }
}