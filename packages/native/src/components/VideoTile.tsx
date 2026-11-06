import { StyleSheet, Text, View } from "react-native";
import { RTCView } from "react-native-webrtc";
import type { MediaStream } from "react-native-webrtc";
import type { StyleProp, ViewStyle } from "react-native";

export interface VideoTileProps {
  stream: MediaStream | null;
  label?: string;
  mirror?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function VideoTile({ stream, label, mirror = false, style }: VideoTileProps) {
  return (
    <View style={[styles.container, style]}>
      {stream ? (
        // RN has no srcObject — react-native-webrtc's MediaStream exposes
        // toURL() specifically for RTCView.
        <RTCView streamURL={stream.toURL()} style={styles.video} objectFit="cover" mirror={mirror} />
      ) : (
        <View style={styles.video} />
      )}
      {label ? (
        <View style={styles.labelWrap}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 8, overflow: "hidden", backgroundColor: "#111" },
  video: { flex: 1 },
  labelWrap: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  labelText: { color: "#fff", fontSize: 12 },
});
