import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'public/fixtures')
const sampleRate = 44_100
const durationSeconds = 18
const introSeconds = 2

function wavHeader(sampleCount) {
  const buffer = Buffer.alloc(44)
  const dataBytes = sampleCount * 2
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataBytes, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataBytes, 40)
  return buffer
}

function createFixture(bpm) {
  const sampleCount = durationSeconds * sampleRate
  const pcm = Buffer.alloc(sampleCount * 2)
  const beatInterval = 60 / bpm
  for (let beat = 0, at = introSeconds; at < durationSeconds; beat += 1, at += beatInterval) {
    const accented = beat % 4 === 0
    const frequency = accented ? 1320 : 880
    const clickLength = Math.floor(sampleRate * 0.045)
    const start = Math.round(at * sampleRate)
    for (let index = 0; index < clickLength && start + index < sampleCount; index += 1) {
      const envelope = Math.exp(-index / (sampleRate * 0.009))
      const sample = Math.sin(2 * Math.PI * frequency * index / sampleRate) * envelope * (accented ? 0.72 : 0.46)
      pcm.writeInt16LE(Math.round(sample * 32767), (start + index) * 2)
    }
  }
  return Buffer.concat([wavHeader(sampleCount), pcm])
}

await mkdir(output, { recursive: true })
for (const bpm of [60, 90, 120]) {
  await writeFile(resolve(output, `${bpm}-bpm-accented.wav`), createFixture(bpm))
}
console.log('Generated deterministic 60/90/120 BPM WAV fixtures with 2-second intros.')
