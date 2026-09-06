package com.morkmork26.rhythmsongtrainer

import androidx.media3.common.C
import androidx.media3.common.audio.AudioProcessor
import androidx.media3.common.audio.BaseAudioProcessor
import androidx.media3.common.util.UnstableApi
import java.nio.ByteBuffer
import kotlin.math.PI
import kotlin.math.max
import kotlin.math.sin

/** Mixes metronome clicks into original-time PCM before Media3 changes playback speed. */
@UnstableApi
class BeatClickAudioProcessor : BaseAudioProcessor() {
    @Volatile private var enabled = false
    @Volatile private var volume = 0.5f
    @Volatile private var requestedStartMs = 0L
    @Volatile private var requestedBeatsMs = longArrayOf()

    private var mediaFrame = 0L
    private var beatFrames = longArrayOf()
    private var beatIndex = 0
    private var activeClickStartFrame = Long.MIN_VALUE
    private var activeAccent = false

    fun setEnabled(value: Boolean) {
        enabled = value
    }

    fun setVolume(value: Float) {
        volume = value.coerceIn(0f, 1f)
    }

    fun setTimeline(startMs: Long, beatsMs: LongArray) {
        requestedStartMs = max(0L, startMs)
        requestedBeatsMs = beatsMs.copyOf()
        if (inputAudioFormat != AudioProcessor.AudioFormat.NOT_SET) resetCursor()
    }

    override fun onConfigure(inputAudioFormat: AudioProcessor.AudioFormat): AudioProcessor.AudioFormat {
        if (inputAudioFormat.encoding != C.ENCODING_PCM_16BIT) {
            throw AudioProcessor.UnhandledAudioFormatException(inputAudioFormat)
        }
        return inputAudioFormat
    }

    override fun onFlush(streamMetadata: AudioProcessor.StreamMetadata) {
        requestedStartMs = streamMetadata.positionOffsetUs / 1000
        resetCursor()
    }

    override fun queueInput(inputBuffer: ByteBuffer) {
        val output = replaceOutputBuffer(inputBuffer.remaining())
        val channels = inputAudioFormat.channelCount
        val clickFrames = max(1, inputAudioFormat.sampleRate * 18 / 1000)

        while (inputBuffer.remaining() >= channels * Short.SIZE_BYTES) {
            while (beatIndex < beatFrames.size && beatFrames[beatIndex] <= mediaFrame) {
                activeClickStartFrame = beatFrames[beatIndex]
                activeAccent = beatIndex % 4 == 0
                beatIndex += 1
            }

            val clickOffset = mediaFrame - activeClickStartFrame
            val click = if (enabled && clickOffset in 0 until clickFrames.toLong()) {
                clickSample(clickOffset.toInt(), clickFrames, activeAccent)
            } else 0

            repeat(channels) {
                val source = inputBuffer.short.toInt()
                output.putShort((source + click).coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort())
            }
            mediaFrame += 1
        }
        output.flip()
    }

    private fun resetCursor() {
        val sampleRate = inputAudioFormat.sampleRate
        if (sampleRate <= 0) return
        mediaFrame = requestedStartMs * sampleRate / 1000
        beatFrames = requestedBeatsMs.map { it * sampleRate / 1000 }.toLongArray()
        beatIndex = beatFrames.binarySearch(mediaFrame).let { index -> if (index >= 0) index else -index - 1 }
        activeClickStartFrame = Long.MIN_VALUE
    }

    private fun clickSample(offset: Int, length: Int, accent: Boolean): Int {
        val frequency = if (accent) 1760.0 else 1320.0
        val phase = 2.0 * PI * frequency * offset / inputAudioFormat.sampleRate
        val envelope = 1.0 - offset.toDouble() / length
        return (sin(phase) * envelope * volume * 9000.0).toInt()
    }
}
