import type {
  IceCandidateLike,
  PeerConnectionState,
  RTCConfigLike,
  SessionDescriptionLike,
} from "./types.js";

/**
 * Everything CallSession needs from a real WebRTC implementation.
 * `react` implements this against browser globals; `native` implements it
 * against react-native-webrtc. CallSession never touches RTCPeerConnection
 * or getUserMedia directly — only through this interface.
 */
export interface WebRTCAdapter<TStream = unknown, TPeer = unknown> {
  getUserMedia(constraints: { audio: boolean; video: boolean }): Promise<TStream>;

  createPeerConnection(config: RTCConfigLike): TPeer;
  attachLocalTracks(pc: TPeer, stream: TStream): void;

  createOffer(pc: TPeer): Promise<SessionDescriptionLike>;
  createAnswer(pc: TPeer): Promise<SessionDescriptionLike>;
  setLocalDescription(pc: TPeer, desc: SessionDescriptionLike): Promise<void>;
  setRemoteDescription(pc: TPeer, desc: SessionDescriptionLike): Promise<void>;
  addIceCandidate(pc: TPeer, candidate: IceCandidateLike): Promise<void>;

  onIceCandidate(pc: TPeer, cb: (candidate: IceCandidateLike) => void): () => void;
  onTrack(pc: TPeer, cb: (stream: TStream) => void): () => void;
  onConnectionStateChange(pc: TPeer, cb: (state: PeerConnectionState) => void): () => void;

  closePeerConnection(pc: TPeer): void;
  stopStream(stream: TStream): void;

  setMicEnabled(stream: TStream, enabled: boolean): void;
  setCameraEnabled(stream: TStream, enabled: boolean): void;

  /** Platform-specific loudness boost. Web: Web Audio GainNode. Native: InCallManager + track._setVolume. */
  setRemoteVolume(stream: TStream, level: number): void;
}
