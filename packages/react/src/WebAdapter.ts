"use client";

import type { WebRTCAdapter } from "@coaching-webrtc/core";
import type {
  IceCandidateLike,
  PeerConnectionState,
  RTCConfigLike,
  SessionDescriptionLike,
} from "@coaching-webrtc/core";

let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext {
  // Never touch `window`/AudioContext at module top level — only inside
  // this function, so importing the package stays safe under SSR.
  if (!sharedAudioContext) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new Ctor();
  }
  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

// One GainNode per remote MediaStream, reused across repeated setRemoteVolume
// calls (e.g. from a live volume slider) instead of rebuilding the graph.
const gainNodes = new WeakMap<MediaStream, GainNode>();

/**
 * WebRTCAdapter implementation against real browser globals. This is where
 * the volume fix proven in index.html lives: remote audio is routed through
 * a Web Audio GainNode (not just the <video> element) because element
 * volume caps at 100% and can't go louder on its own.
 */
export const webAdapter: WebRTCAdapter<MediaStream, RTCPeerConnection> = {
  async getUserMedia(constraints) {
    return navigator.mediaDevices.getUserMedia({
      video: constraints.video,
      audio: constraints.audio
        ? { autoGainControl: true, echoCancellation: true, noiseSuppression: true }
        : false,
    });
  },

  createPeerConnection(config: RTCConfigLike) {
    return new RTCPeerConnection(config);
  },

  attachLocalTracks(pc, stream) {
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  },

  async createOffer(pc) {
    const offer = await pc.createOffer();
    return { type: "offer", sdp: offer.sdp ?? "" };
  },

  async createAnswer(pc) {
    const answer = await pc.createAnswer();
    return { type: "answer", sdp: answer.sdp ?? "" };
  },

  async setLocalDescription(pc, desc: SessionDescriptionLike) {
    await pc.setLocalDescription(desc as RTCSessionDescriptionInit);
  },

  async setRemoteDescription(pc, desc: SessionDescriptionLike) {
    await pc.setRemoteDescription(new RTCSessionDescription(desc));
  },

  async addIceCandidate(pc, candidate: IceCandidateLike) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  },

  onIceCandidate(pc, cb) {
    const handler = (event: RTCPeerConnectionIceEvent) => {
      if (!event.candidate) return;
      cb({
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
      });
    };
    pc.addEventListener("icecandidate", handler);
    return () => pc.removeEventListener("icecandidate", handler);
  },

  onTrack(pc, cb) {
    const handler = (event: RTCTrackEvent) => {
      if (event.streams[0]) cb(event.streams[0]);
    };
    pc.addEventListener("track", handler);
    return () => pc.removeEventListener("track", handler);
  },

  onConnectionStateChange(pc, cb) {
    const handler = () => cb(pc.connectionState as PeerConnectionState);
    pc.addEventListener("connectionstatechange", handler);
    return () => pc.removeEventListener("connectionstatechange", handler);
  },

  closePeerConnection(pc) {
    pc.close();
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
    if (stream.getAudioTracks().length === 0) return;
    const ctx = getSharedAudioContext();
    let gain = gainNodes.get(stream);
    if (!gain) {
      const source = ctx.createMediaStreamSource(stream);
      gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      gainNodes.set(stream, gain);
    }
    gain.gain.value = level;
  },
};
