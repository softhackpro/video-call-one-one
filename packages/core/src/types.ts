export interface RTCIceServerLike {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RTCConfigLike {
  iceServers: RTCIceServerLike[];
}

export interface SessionDescriptionLike {
  type: "offer" | "answer";
  sdp: string;
}

export interface IceCandidateLike {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export type CallConnectionState =
  | "idle"
  | "joining"
  | "waiting-for-peer"
  | "connecting"
  | "connected"
  | "left"
  | "error";

export interface RemoteParticipant<TStream = unknown> {
  id: string;
  stream: TStream | null;
  connectionState: PeerConnectionState;
}

export interface CallSessionOptions<TStream, TPeer> {
  adapter: import("./WebRTCAdapter.js").WebRTCAdapter<TStream, TPeer>;
  signalingUrl: string;
  roomId: string;
  iceServers?: RTCIceServerLike[];
  media?: { audio?: boolean; video?: boolean };
  /** Default remote loudness multiplier applied to new remote streams. Default 2.5. */
  defaultRemoteVolume?: number;
}

const DEFAULT_ICE_SERVERS: RTCIceServerLike[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export const DEFAULTS = {
  iceServers: DEFAULT_ICE_SERVERS,
  media: { audio: true, video: true },
  remoteVolume: 2.5,
};
