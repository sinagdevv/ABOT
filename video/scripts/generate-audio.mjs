import fs from "node:fs";
import path from "node:path";

const sampleRate = 48000;
const seconds = 120;
const channels = 2;
const samples = sampleRate * seconds;
const data = Buffer.alloc(samples * channels * 2);

function tone(t, frequency, attack = 0.01, release = 0.2) {
  const phase = (t * frequency) % 1;
  const envelope = Math.min(1, t / attack) * Math.min(1, (seconds - t) / release);
  return Math.sin(phase * Math.PI * 2) * envelope;
}

for (let i = 0; i < samples; i += 1) {
  const t = i / sampleRate;
  const beat = t % 2;
  const pulse = Math.max(0, 1 - beat / 0.14) ** 3;
  const bass = tone(t, 55, 0.04, 0.35) * (0.12 + pulse * 0.13);
  const pad = tone(t, 110, 0.8, 1.2) * 0.06 + tone(t, 164.81, 1.2, 1.5) * 0.035;
  const shimmer = tone(t, 880, 0.01, 0.08) * (t % 8 < 0.08 ? 0.09 : 0);
  const click = (t % 4 < 0.018 ? tone(t % 4, 1500, 0.002, 0.02) : 0) * 0.12;
  const sweep = tone(t, 260 + 260 * Math.sin(t * 0.17), 0.2, 0.5) * (t % 16 < 2 ? 0.012 : 0);
  const value = Math.max(-1, Math.min(1, bass + pad + shimmer + click + sweep));
  const left = Math.round(value * 0.78 * 32767);
  const right = Math.round((value * 0.72 + tone(t, 73.42, 0.04, 0.35) * 0.03) * 32767);
  data.writeInt16LE(left, (i * 2) * 2);
  data.writeInt16LE(right, (i * 2 + 1) * 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVE", 8);
header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * channels * 2, 28); header.writeUInt16LE(channels * 2, 32);
header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(data.length, 40);

const output = path.resolve("public/audio/abot-original.wav");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, data]));
console.log(`wrote ${output} (${seconds}s stereo PCM)`);
