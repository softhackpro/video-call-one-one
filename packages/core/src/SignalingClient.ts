import { io, type Socket } from "socket.io-client";
import type { IceCandidateLike, SessionDescriptionLike } from "./types.js";

/**
 * Thin wrapper around the backend's exact Socket.IO contract
 * (src/sockets/call-handlers.js). This is the only file in the whole
 * SDK that knows these event names.
 */
export class SignalingClient {
  private socket: Socket;

  constructor(signalingUrl: string) {
    this.socket = io(signalingUrl, { autoConnect: true });
  }

  get id(): string | undefined {
    return this.socket.id;
  }

  join(roomId: string): void {
    this.socket.emit("join", { roomId });
  }

  sendOffer(to: string, offer: SessionDescriptionLike): void {
    this.socket.emit("offer", { to, offer });
  }

  sendAnswer(to: string, answer: SessionDescriptionLike): void {
    this.socket.emit("answer", { to, answer });
  }

  sendIceCandidate(to: string, candidate: IceCandidateLike): void {
    this.socket.emit("ice-candidate", { to, candidate });
  }

  onConnect(cb: () => void): () => void {
    this.socket.on("connect", cb);
    return () => this.socket.off("connect", cb);
  }

  onExistingUsers(cb: (userIds: string[]) => void): () => void {
    this.socket.on("existing-users", cb);
    return () => this.socket.off("existing-users", cb);
  }

  onUserJoined(cb: (data: { socketId: string }) => void): () => void {
    this.socket.on("user-joined", cb);
    return () => this.socket.off("user-joined", cb);
  }

  onOffer(cb: (data: { from: string; offer: SessionDescriptionLike }) => void): () => void {
    this.socket.on("offer", cb);
    return () => this.socket.off("offer", cb);
  }

  onAnswer(cb: (data: { from: string; answer: SessionDescriptionLike }) => void): () => void {
    this.socket.on("answer", cb);
    return () => this.socket.off("answer", cb);
  }

  onIceCandidate(
    cb: (data: { from: string; candidate: IceCandidateLike }) => void,
  ): () => void {
    this.socket.on("ice-candidate", cb);
    return () => this.socket.off("ice-candidate", cb);
  }

  /**
   * Backend currently broadcasts `user-left` globally (not room-scoped).
   * Callers MUST filter by socketId against peers they actually track —
   * see CallSession, which does exactly that.
   */
  onUserLeft(cb: (data: { socketId: string }) => void): () => void {
    this.socket.on("user-left", cb);
    return () => this.socket.off("user-left", cb);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
