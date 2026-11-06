"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { CallSession, type CallSessionSnapshot, type RTCIceServerLike } from "@coaching-webrtc/core";
import { webAdapter } from "./WebAdapter.js";

export interface UseVideoCallOptions {
  signalingUrl: string;
  roomId: string;
  iceServers?: RTCIceServerLike[];
  media?: { audio?: boolean; video?: boolean };
  /** Join automatically on mount. Default true. */
  autoJoin?: boolean;
  /** Default remote loudness multiplier (Web Audio GainNode value). Default 2.5. */
  defaultRemoteVolume?: number;
}

export interface UseVideoCallResult extends CallSessionSnapshot<MediaStream> {
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  /** level: 1.0 = normal volume; above 1.0 amplifies past the browser's 100% cap. */
  setRemoteVolume: (participantId: string, level: number) => void;
}

export function useVideoCall(options: UseVideoCallOptions): UseVideoCallResult {
  const sessionRef = useRef<CallSession<MediaStream, RTCPeerConnection> | null>(null);
  if (!sessionRef.current) {
    sessionRef.current = new CallSession({ adapter: webAdapter, ...options });
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
    // Intentionally only re-runs if the session instance itself changes —
    // autoJoin/roomId/etc. are read once at construction, matching the
    // "one CallSession per mount" model.
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
