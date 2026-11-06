import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";
import type { WebRTCAdapter } from "@coaching-webrtc/core";
import type {
  IceCandidateLike,
  PeerConnectionState,
  RTCConfigLike,
  SessionDescriptionLike,
} from "@coaching-webrtc/core";
import { setRemoteStreamVolume, startCallAudioRouting, stopCallAudioRouting } from "./audio/audioRouting.js";

/**
 * WebRTCAdapter implementation against react-native-webrtc. Mirrors
 * @coaching-webrtc/react's WebAdapter API-for-API, but the volume fix here
 * is InCallManager (speaker routing) + track._setVolume (gain), since RN
 * has no Web Audio API / GainNode equivalent.
 */
export const nativeAdapter: WebRTCAdapter<MediaStream, RTCPeerConnection> = {
  async getUserMedia(constraints) {
    startCallAudioRouting();
    return mediaDevices.getUserMedia({
      video: constraints.video,
      audio: constraints.audio
        ? { autoGainControl: true, echoCancellation: true, noiseSuppression: true }
        : false,
    }) as unknown as Promise<MediaStream>;
  },

  createPeerConnection(config: RTCConfigLike) {
    return new RTCPeerConnection(config as any) as unknown as RTCPeerConnection;
  },

  attachLocalTracks(pc, stream) {
    stream.getTracks().forEach((track) => (pc as any).addTrack(track, stream));
  },

  async createOffer(pc) {
    const offer = await (pc as any).createOffer();
    return { type: "offer", sdp: offer.sdp ?? "" };
  },

  async createAnswer(pc) {
    const answer = await (pc as any).createAnswer();
    return { type: "answer", sdp: answer.sdp ?? "" };
  },

  async setLocalDescription(pc, desc: SessionDescriptionLike) {
    await (pc as any).setLocalDescription(new RTCSessionDescription(desc as any));
  },

  async setRemoteDescription(pc, desc: SessionDescriptionLike) {
    await (pc as any).setRemoteDescription(new RTCSessionDescription(desc as any));
  },

  async addIceCandidate(pc, candidate: IceCandidateLike) {
    await (pc as any).addIceCandidate(new RTCIceCandidate(candidate as any));
  },

  onIceCandidate(pc, cb) {
    const handler = (event: any) => {
      if (!event.candidate) return;
      cb({
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
      });
    };
    (pc as any).addEventListener("icecandidate", handler);
    return () => (pc as any).removeEventListener("icecandidate", handler);
  },

  onTrack(pc, cb) {
    const handler = (event: any) => {
      if (event.streams?.[0]) cb(event.streams[0]);
    };
    (pc as any).addEventListener("track", handler);
    return () => (pc as any).removeEventListener("track", handler);
  },

  onConnectionStateChange(pc, cb) {
    const handler = () => cb((pc as any).connectionState as PeerConnectionState);
    (pc as any).addEventListener("connectionstatechange", handler);
    return () => (pc as any).removeEventListener("connectionstatechange", handler);
  },

  closePeerConnection(pc) {
    (pc as any).close();
    stopCallAudioRouting();
  },

  stopStream(stream) {
    stream.getTracks().forEach((track) => track.stop());
  },

  setMicEnabled(stream, enabled) {
    stream.getAudioTracks().forEach((track) => (track.enabled = enabled));
  },

  setCameraEnabled(stream, enabled) {
    stream.getVideoTracks().forEach((track) => (track.enabled = enabled));
  },

  setRemoteVolume(stream, level) {
    setRemoteStreamVolume(stream, level);
  },
};
