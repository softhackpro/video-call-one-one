import { Emitter } from "./Emitter.js";
import { SignalingClient } from "./SignalingClient.js";
import type { WebRTCAdapter } from "./WebRTCAdapter.js";
import {
  DEFAULTS,
  type CallConnectionState,
  type CallSessionOptions,
  type PeerConnectionState,
  type RemoteParticipant,
} from "./types.js";

interface PeerRecord<TStream, TPeer> {
  pc: TPeer;
  stream: TStream | null;
  connectionState: PeerConnectionState;
  unsubscribers: Array<() => void>;
  volume: number;
}

export interface CallSessionSnapshot<TStream> {
  connectionState: CallConnectionState;
  localStream: TStream | null;
  participants: RemoteParticipant<TStream>[];
  isMuted: boolean;
  isCameraOff: boolean;
  error: Error | null;
}

interface CallSessionEvents<TStream> {
  change: CallSessionSnapshot<TStream>;
  error: Error;
}

/**
 * Owns the entire signaling protocol + call state machine. Never touches a
 * real RTCPeerConnection/getUserMedia — only through the injected adapter.
 * One CallSession = one room. Currently supports one remote peer (the
 * backend's 1:1 room design); `participants` stays array-shaped so this can
 * grow to multi-party without an API-breaking change later.
 */
export class CallSession<TStream, TPeer> extends Emitter<CallSessionEvents<TStream>> {
  private readonly adapter: WebRTCAdapter<TStream, TPeer>;
  private readonly signalingUrl: string;
  private readonly roomId: string;
  private readonly iceServers;
  private readonly media;
  private readonly defaultRemoteVolume: number;

  private signaling: SignalingClient | null = null;
  private peers = new Map<string, PeerRecord<TStream, TPeer>>();

  private connectionState: CallConnectionState = "idle";
  private localStream: TStream | null = null;
  private isMuted = false;
  private isCameraOff = false;
  private error: Error | null = null;
  private cachedSnapshot: CallSessionSnapshot<TStream> | null = null;

  constructor(options: CallSessionOptions<TStream, TPeer>) {
    super();
    this.adapter = options.adapter;
    this.signalingUrl = options.signalingUrl;
    this.roomId = options.roomId;
    this.iceServers = options.iceServers ?? DEFAULTS.iceServers;
    this.media = { ...DEFAULTS.media, ...options.media };
    this.defaultRemoteVolume = options.defaultRemoteVolume ?? DEFAULTS.remoteVolume;
  }

  /**
   * Cached until the next `notify()` so React's useSyncExternalStore (which
   * calls getSnapshot on every render to check for tearing) sees a stable
   * reference between actual state changes, instead of a new object each call.
   */
  getSnapshot(): CallSessionSnapshot<TStream> {
    if (!this.cachedSnapshot) {
      this.cachedSnapshot = {
        connectionState: this.connectionState,
        localStream: this.localStream,
        participants: Array.from(this.peers.entries()).map(([id, p]) => ({
          id,
          stream: p.stream,
          connectionState: p.connectionState,
        })),
        isMuted: this.isMuted,
        isCameraOff: this.isCameraOff,
        error: this.error,
      };
    }
    return this.cachedSnapshot;
  }

  async join(): Promise<void> {
    if (this.connectionState !== "idle" && this.connectionState !== "left") return;

    this.setState("joining");

    try {
      this.localStream = await this.adapter.getUserMedia(this.media);
    } catch (err) {
      this.fail(err as Error);
      return;
    }
    this.notify();

    const signaling = new SignalingClient(this.signalingUrl);
    this.signaling = signaling;

    signaling.onConnect(() => signaling.join(this.roomId));

    signaling.onExistingUsers((userIds) => {
      const [firstPeerId] = userIds;
      if (!firstPeerId) {
        this.setState("waiting-for-peer");
        return;
      }
      // We're the newcomer — we already know who's here, so we initiate.
      void this.connectToPeer(firstPeerId, true);
    });

    signaling.onUserJoined(() => {
      // A peer joined after us; we wait for their offer (they initiate,
      // since they're the one who received our id via existing-users).
      this.setState("waiting-for-peer");
    });

    signaling.onOffer(async ({ from, offer }) => {
      if (this.peers.has(from)) return;
      const pc = await this.connectToPeer(from, false);
      await this.adapter.setRemoteDescription(pc, offer);
      const answer = await this.adapter.createAnswer(pc);
      await this.adapter.setLocalDescription(pc, answer);
      signaling.sendAnswer(from, answer);
    });

    signaling.onAnswer(async ({ from, answer }) => {
      const peer = this.peers.get(from);
      if (!peer) return;
      await this.adapter.setRemoteDescription(peer.pc, answer);
    });

    signaling.onIceCandidate(async ({ from, candidate }) => {
      const peer = this.peers.get(from);
      if (!peer) return;
      try {
        await this.adapter.addIceCandidate(peer.pc, candidate);
      } catch (err) {
        this.error = err as Error;
        this.emit("error", this.error);
      }
    });

    // Backend broadcasts user-left globally, not room-scoped — only act on
    // it if the socketId is actually a peer we're tracking.
    signaling.onUserLeft(({ socketId }) => {
      if (!this.peers.has(socketId)) return;
      this.removePeer(socketId);
      this.setState(this.peers.size > 0 ? "connecting" : "waiting-for-peer");
    });
  }

  leave(): void {
    for (const id of Array.from(this.peers.keys())) {
      this.removePeer(id);
    }
    if (this.localStream) {
      this.adapter.stopStream(this.localStream);
      this.localStream = null;
    }
    this.signaling?.disconnect();
    this.signaling = null;
    this.setState("left");
  }

  toggleMute(): void {
    if (!this.localStream) return;
    this.isMuted = !this.isMuted;
    this.adapter.setMicEnabled(this.localStream, !this.isMuted);
    this.notify();
  }

  toggleCamera(): void {
    if (!this.localStream) return;
    this.isCameraOff = !this.isCameraOff;
    this.adapter.setCameraEnabled(this.localStream, !this.isCameraOff);
    this.notify();
  }

  setRemoteVolume(participantId: string, level: number): void {
    const peer = this.peers.get(participantId);
    if (!peer) return;
    peer.volume = level;
    if (peer.stream) this.adapter.setRemoteVolume(peer.stream, level);
  }

  private async connectToPeer(id: string, isCaller: boolean): Promise<TPeer> {
    const pc = this.adapter.createPeerConnection({ iceServers: this.iceServers });
    if (this.localStream) this.adapter.attachLocalTracks(pc, this.localStream);

    const unsubscribers: Array<() => void> = [];
    const record: PeerRecord<TStream, TPeer> = {
      pc,
      stream: null,
      connectionState: "new",
      unsubscribers,
      volume: this.defaultRemoteVolume,
    };
    this.peers.set(id, record);

    unsubscribers.push(
      this.adapter.onIceCandidate(pc, (candidate) => {
        this.signaling?.sendIceCandidate(id, candidate);
      }),
    );
    unsubscribers.push(
      this.adapter.onTrack(pc, (stream) => {
        record.stream = stream;
        this.adapter.setRemoteVolume(stream, record.volume);
        this.notify();
      }),
    );
    unsubscribers.push(
      this.adapter.onConnectionStateChange(pc, (state) => {
        record.connectionState = state;
        this.setState(state === "connected" ? "connected" : "connecting");
      }),
    );

    this.setState("connecting");

    if (isCaller && this.signaling) {
      const offer = await this.adapter.createOffer(pc);
      await this.adapter.setLocalDescription(pc, offer);
      this.signaling.sendOffer(id, offer);
    }

    return pc;
  }

  private removePeer(id: string): void {
    const peer = this.peers.get(id);
    if (!peer) return;
    peer.unsubscribers.forEach((unsub) => unsub());
    this.adapter.closePeerConnection(peer.pc);
    this.peers.delete(id);
    this.notify();
  }

  private setState(state: CallConnectionState): void {
    this.connectionState = state;
    this.notify();
  }

  private fail(err: Error): void {
    this.error = err;
    this.connectionState = "error";
    this.emit("error", err);
    this.notify();
  }

  private notify(): void {
    this.cachedSnapshot = null;
    this.emit("change", this.getSnapshot());
  }
}
