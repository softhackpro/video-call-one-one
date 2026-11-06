import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useVideoCall } from "../useVideoCall.js";
import type { UseVideoCallOptions, UseVideoCallResult } from "../useVideoCall.js";
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
  style?: StyleProp<ViewStyle>;
}

/**
 * Prebuilt call UI on top of useVideoCall(). Every visual piece is
 * individually overridable via render props — pass none for the
 * zero-config default, or skip this component entirely and call
 * useVideoCall() directly for fully custom UI.
 */
export function CallScreen({ options, renderLocalTile, renderRemoteTile, renderControls, style }: CallScreenProps) {
  const call = useVideoCall(options);
  const remote = call.participants[0];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.grid}>
        {renderLocalTile ? renderLocalTile(call) : <VideoTile stream={call.localStream} label="You" mirror />}
        {renderRemoteTile ? (
          renderRemoteTile(call)
        ) : (
          <VideoTile stream={remote?.stream ?? null} label={remote ? "Participant" : "Waiting..."} />
        )}
      </View>
      {renderControls ? (
        renderControls(call)
      ) : (
        <ControlBar
          isMuted={call.isMuted}
          isCameraOff={call.isCameraOff}
          onToggleMute={call.toggleMute}
          onToggleCamera={call.toggleCamera}
          onLeave={call.leaveRoom}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  grid: { flex: 1, flexDirection: "row", gap: 8 },
});
