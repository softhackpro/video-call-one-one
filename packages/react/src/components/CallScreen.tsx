"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useVideoCall, type UseVideoCallOptions, type UseVideoCallResult } from "../useVideoCall.js";
import { VideoTile } from "./VideoTile.js";
import { ControlBar } from "./ControlBar.js";

export interface CallScreenProps {
  options: UseVideoCallOptions;
  /** Override the local video tile. Defaults to a built-in VideoTile. */
  renderLocalTile?: (call: UseVideoCallResult) => ReactNode;
  /** Override the remote video tile. Defaults to a built-in VideoTile. */
  renderRemoteTile?: (call: UseVideoCallResult) => ReactNode;
  /** Override the control bar. Defaults to a built-in ControlBar. */
  renderControls?: (call: UseVideoCallResult) => ReactNode;
  style?: CSSProperties;
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  width: "100%",
  aspectRatio: "16 / 9",
};

/**
 * Prebuilt call UI on top of useVideoCall(). Every visual piece is
 * individually overridable via render props — pass none for the
 * zero-config default, or override just the pieces you want to customize,
 * or skip this component entirely and call useVideoCall() directly for
 * fully custom UI.
 */
export function CallScreen({ options, renderLocalTile, renderRemoteTile, renderControls, style }: CallScreenProps) {
  const call = useVideoCall(options);
  const [remoteVolume, setRemoteVolume] = useState(options.defaultRemoteVolume ?? 2.5);
  const remote = call.participants[0];

  const handleRemoteVolumeChange = (level: number) => {
    setRemoteVolume(level);
    if (remote) call.setRemoteVolume(remote.id, level);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      <div style={gridStyle}>
        {renderLocalTile ? (
          renderLocalTile(call)
        ) : (
          <VideoTile stream={call.localStream} label="You" muted mirrored />
        )}
        {renderRemoteTile ? (
          renderRemoteTile(call)
        ) : (
          <VideoTile stream={remote?.stream ?? null} label={remote ? "Participant" : "Waiting..."} muted />
        )}
      </div>
      {renderControls ? (
        renderControls(call)
      ) : (
        <ControlBar
          isMuted={call.isMuted}
          isCameraOff={call.isCameraOff}
          onToggleMute={call.toggleMute}
          onToggleCamera={call.toggleCamera}
          onLeave={call.leaveRoom}
          remoteVolume={remoteVolume}
          onRemoteVolumeChange={handleRemoteVolumeChange}
        />
      )}
    </div>
  );
}
