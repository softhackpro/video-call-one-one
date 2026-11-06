import InCallManager from "react-native-incall-manager";
import type { MediaStream } from "react-native-webrtc";

let started = false;

/**
 * Fixes the actual "low volume" root cause on mobile: WebRTC calls default
 * to earpiece/phone-call audio routing, which is much quieter than the
 * loudspeaker/media path. Call once when a call starts.
 */
export function startCallAudioRouting(): void {
  if (started) return;
  started = true;
  InCallManager.start({ media: "video" });
  InCallManager.setForceSpeakerphoneOn(true);
}

export function stopCallAudioRouting(): void {
  if (!started) return;
  started = false;
  InCallManager.stop();
}

/**
 * Loudness boost on top of routing — the native analog of the web GainNode
 * fix. `_setVolume` is a real, currently-shipped, cross-platform (iOS +
 * Android) API on react-native-webrtc's MediaStreamTrack, range 0-10,
 * default 1. It's a non-spec "custom API" (underscore-prefixed, not on
 * vanilla DOM types), so we feature-detect and swallow failures — a future
 * removal should degrade to "no extra boost", not a crash.
 */
export function setRemoteStreamVolume(stream: MediaStream, level: number): void {
  const audioTrack = stream.getAudioTracks()[0] as
    | (MediaStreamTrack & { _setVolume?: (volume: number) => void })
    | undefined;
  if (!audioTrack || typeof audioTrack._setVolume !== "function") return;

  // Speaker routing is what makes a gain boost audible in the first place —
  // lazily force it on the first time a boost above unity is requested.
  if (level > 1 && !started) startCallAudioRouting();

  try {
    audioTrack._setVolume(Math.min(Math.max(level, 0), 10));
  } catch {
    // Custom, non-spec API — degrade silently if a future version removes it.
  }
}
