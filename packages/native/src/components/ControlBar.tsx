import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}

export function ControlBar({ isMuted, isCameraOff, onToggleMute, onToggleCamera, onLeave }: ControlBarProps) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.button} onPress={onToggleMute}>
        <Text style={styles.buttonText}>{isMuted ? "Unmute" : "Mute"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onToggleCamera}>
        <Text style={styles.buttonText}>{isCameraOff ? "Camera On" : "Camera Off"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.leaveButton]} onPress={onLeave}>
        <Text style={styles.buttonText}>Leave</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1c1c1e",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#3a3a3c",
  },
  leaveButton: { backgroundColor: "#ff453a" },
  buttonText: { color: "#fff" },
});
