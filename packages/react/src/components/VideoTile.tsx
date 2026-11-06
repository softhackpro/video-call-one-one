"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

export interface VideoTileProps {
  stream: MediaStream | null;
  label?: string;
  /**
   * Mute this element's own audio playback. Remote tiles should stay muted —
   * their audio is played through the boosted Web Audio graph instead (see
   * WebAdapter.setRemoteVolume), so playing it again here would double it up.
   */
  muted?: boolean;
  mirrored?: boolean;
  style?: CSSProperties;
}

const baseStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  backgroundColor: "#111",
  borderRadius: 8,
};

export function VideoTile({ stream, label, muted = false, mirrored = false, style }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          ...baseStyle,
          transform: mirrored ? "scaleX(-1)" : undefined,
          ...style,
        }}
      />
      {label ? (
        <span
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            padding: "2px 8px",
            borderRadius: 4,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: 12,
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
