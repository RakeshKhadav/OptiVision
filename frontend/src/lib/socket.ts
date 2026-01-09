import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

// Singleton to ensure only one connection exists
export const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually in the hook
  transports: ["websocket"],
});
