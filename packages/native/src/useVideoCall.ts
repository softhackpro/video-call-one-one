import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { CallSession, type CallSessionSnapshot, type RTCIceServerLike } from "@coaching-webrtc/core";
import type { MediaStream, RTCPeerConnection } from "react-native-webrtc";
import { nativeAdapter } from "./NativeAdapter.js";

export interface UseVideoCallOptions {
  signalingUrl: string;
  roomId: string;
  iceServers?: RTCIceServerLike[];
  media?: { audio?: boolean; video?: boolean };
  /** Join automatically on mount. Default true. */
  autoJoin?: boolean;
  /**
   * Default remote loudness multiplier. Same numeric spirit as the web
   * package's GainNode value, but passed to react-native-webrtc's
   * track._setVolume (0-10 range, default 1) — values above ~5 have
   * diminishing/clipping returns on native. Default 2.5.
   */
  defaultRemoteVolume?: number;
}

export interface UseVideoCallResult extends CallSessionSnapshot<MediaStream> {
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setRemoteVolume: (participantId: string, level: number) => void;
}

export function useVideoCall(options: UseVideoCallOptions): UseVideoCallResult {
  const sessionRef = useRef<CallSession<MediaStream, RTCPeerConnection> | null>(null);
  if (!sessionRef.current) {
    sessionRef.current = new CallSession({ adapter: nativeAdapter, ...options });
  }
  const session = sessionRef.current;

  const subscribe = useCallback(
    (onStoreChange: () => void) => session.on("change", onStoreChange),
    [session],
  );
  const getSnapshot = useCallback(() => session.getSnapshot(), [session]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const autoJoin = options.autoJoin ?? true;
  useEffect(() => {
    if (autoJoin) void session.join();
    return () => session.leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return {
    ...snapshot,
    joinRoom: () => session.join(),
    leaveRoom: () => session.leave(),
    toggleMute: () => session.toggleMute(),
    toggleCamera: () => session.toggleCamera(),
    setRemoteVolume: (id, level) => session.setRemoteVolume(id, level),
  };
}
