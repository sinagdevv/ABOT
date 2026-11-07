import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 44100;
const seconds = 120;
const channels = 2;
const frames = sampleRate * seconds;
const pcm = Buffer.alloc(frames * channels * 2);
const TAU = Math.PI * 2;

const notes = [55, 65.41, 73.42, 82.41, 98, 110, 130.81, 146.83];
const clamp = (v) => Math.max(-1, Math.min(1, v));
const pulse = (t, at, length, frequency) => {
  const age = t - at;
  if (age < 0 || age > length) return 0;
  const decay = Math.exp(-age * (10 / length));
  return Math.sin(TAU * frequency * age) * decay;
};

for (let i = 0; i < frames; i++) {
  const t = i / sampleRate;
  const section = Math.floor(t / 8) % 8;
  const root = notes[section];
  const fadeIn = Math.min(1, t / 2);
  const fadeOut = Math.min(1, (seconds - t) / 3);
  const bed = (Math.sin(TAU * root * t) * 0.08 + Math.sin(TAU * root * 1.5 * t) * 0.045 + Math.sin(TAU * root * 2.01 * t) * 0.025) * fadeIn * fadeOut;
  const bass = Math.sin(TAU * root * 0.5 * t) * 0.11 * (0.7 + 0.3 * Math.sin(TAU * 0.125 * t));
  const shimmer = Math.sin(TAU * (root * 4 + 0.6 * Math.sin(TAU * 0.09 * t)) * t) * 0.012;
  const tick = (t % 1 < 0.045 ? Math.exp(-(t % 1) * 90) * Math.sin(TAU * 1800 * t) * 0.045 : 0);
  const eventTimes = [0.2, 9.8, 25, 37, 53, 77, 92, 107, 114, 118.5];
  const impact = eventTimes.reduce((sum, at) => sum + pulse(t, at, 0.7, 72) * 0.18, 0);
  const click = eventTimes.reduce((sum, at) => sum + pulse(t, at + 0.18, 0.08, 1800) * 0.05, 0);
  const left = clamp(bed + bass + shimmer + tick + impact + click);
  const right = clamp(bed * 0.95 + bass * 0.98 + shimmer * 0.9 + tick * 0.8 + impact * 0.95 + click);
  pcm.writeInt16LE(Math.round(left * 32767), i * 4);
  pcm.writeInt16LE(Math.round(right * 32767), i * 4 + 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVE", 8);
header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * channels * 2, 28); header.writeUInt16LE(channels * 2, 32);
header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
await mkdir("public/audio", { recursive: true });
await writeFile("public/audio/abot-original-score.wav", Buffer.concat([header, pcm]));
