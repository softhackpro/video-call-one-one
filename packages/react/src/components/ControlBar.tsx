"use client";

import type { CSSProperties } from "react";

export interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  /** Current remote volume multiplier, for a live boost slider. Omit to hide the slider. */
  remoteVolume?: number;
  onRemoteVolumeChange?: (level: number) => void;
}

const barStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 12,
  background: "#1c1c1e",
  borderRadius: 8,
};

const buttonStyle: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  color: "#fff",
  background: "#3a3a3c",
};

export function ControlBar({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onLeave,
  remoteVolume,
  onRemoteVolumeChange,
}: ControlBarProps) {
  return (
    <div style={barStyle}>
      <button type="button" style={buttonStyle} onClick={onToggleMute}>
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <button type="button" style={buttonStyle} onClick={onToggleCamera}>
        {isCameraOff ? "Camera On" : "Camera Off"}
      </button>
      {remoteVolume !== undefined && onRemoteVolumeChange ? (
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 12 }}>
          Volume
          <input
            type="range"
            min={0}
            max={4}
            step={0.1}
            value={remoteVolume}
            onChange={(e) => onRemoteVolumeChange(Number(e.target.value))}
          />
        </label>
      ) : null}
      <button type="button" style={{ ...buttonStyle, background: "#ff453a" }} onClick={onLeave}>
        Leave
      </button>
    </div>
  );
}
