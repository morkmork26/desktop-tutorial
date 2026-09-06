package com.morkmork26.rhythmsongtrainer

import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.audio.AudioSink
import androidx.media3.exoplayer.audio.DefaultAudioSink
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@UnstableApi
@CapacitorPlugin(name = "NativeSong")
class NativeSongPlugin : Plugin() {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val clickProcessor = BeatClickAudioProcessor()
    private lateinit var player: ExoPlayer
    private var generation = 0L
    private var loopStartMs: Long? = null
    private var loopEndMs: Long? = null
    private var beatsMs = longArrayOf()

    private val positionPublisher = object : Runnable {
        override fun run() {
            if (!::player.isInitialized) return
            val end = loopEndMs
            val start = loopStartMs
            if (player.isPlaying && start != null && end != null && player.currentPosition >= end) {
                seekNative(start)
            }
            notifyListeners("transportState", snapshot())
            mainHandler.postDelayed(this, 50)
        }
    }

    override fun load() {
        val renderersFactory = object : DefaultRenderersFactory(context) {
            override fun buildAudioSink(
                context: Context,
                enableFloatOutput: Boolean,
                enableAudioOutputPlaybackParams: Boolean,
            ): AudioSink {
                return DefaultAudioSink.Builder(context)
                    .setEnableFloatOutput(false)
                    .setEnableAudioOutputPlaybackParameters(false)
                    .setAudioProcessors(arrayOf(clickProcessor))
                    .build()
            }
        }
        player = ExoPlayer.Builder(context, renderersFactory)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                true,
            )
            .setHandleAudioBecomingNoisy(true)
            .build()
        player.addListener(object : Player.Listener {
            override fun onEvents(player: Player, events: Player.Events) {
                generation += 1
                notifyListeners("transportState", snapshot())
            }
        })
        mainHandler.post(positionPublisher)
    }

    @PluginMethod
    fun loadFixture(call: PluginCall) = onMain(call) {
        beatsMs = generateSteadyBeats(120, 2_000, 18_000)
        clickProcessor.setTimeline(0, beatsMs)
        player.setMediaItem(MediaItem.fromUri("asset:///public/fixtures/120-bpm-accented.wav"))
        player.prepare()
        call.resolve(snapshot())
    }

    @PluginMethod
    fun play(call: PluginCall) = onMain(call) {
        player.play()
        call.resolve(snapshot())
    }

    @PluginMethod
    fun pause(call: PluginCall) = onMain(call) {
        player.pause()
        call.resolve(snapshot())
    }

    @PluginMethod
    fun seek(call: PluginCall) = onMain(call) {
        seekNative(call.getLong("timeMs", 0L))
        call.resolve(snapshot())
    }

    @PluginMethod
    fun setSpeed(call: PluginCall) = onMain(call) {
        val speed = call.getDouble("rate", 1.0).toFloat().coerceIn(0.5f, 1f)
        player.playbackParameters = PlaybackParameters(speed, 1f)
        call.resolve(snapshot())
    }

    @PluginMethod
    fun setLoop(call: PluginCall) = onMain(call) {
        if (call.getBoolean("enabled", false)) {
            val start = call.getLong("startMs", 0L)
            val end = call.getLong("endMs", 0L)
            if (end - start < 250L) {
                call.reject("Loop must be at least 250 ms.")
                return@onMain
            }
            loopStartMs = start
            loopEndMs = end
        } else {
            loopStartMs = null
            loopEndMs = null
        }
        generation += 1
        call.resolve(snapshot())
    }

    @PluginMethod
    fun setMetronome(call: PluginCall) = onMain(call) {
        clickProcessor.setEnabled(call.getBoolean("enabled", false))
        clickProcessor.setVolume(call.getDouble("volume", 0.5).toFloat())
        call.resolve(snapshot())
    }

    @PluginMethod
    fun getTransportSnapshot(call: PluginCall) = onMain(call) {
        call.resolve(snapshot())
    }

    override fun handleOnDestroy() {
        mainHandler.removeCallbacks(positionPublisher)
        if (::player.isInitialized) player.release()
        super.handleOnDestroy()
    }

    private fun seekNative(timeMs: Long) {
        val position = timeMs.coerceAtLeast(0)
        clickProcessor.setTimeline(position, beatsMs)
        player.seekTo(position)
        generation += 1
    }

    private fun snapshot() = JSObject().apply {
        put("generation", generation)
        put("currentTimeMs", if (::player.isInitialized) player.currentPosition.coerceAtLeast(0) else 0)
        put("durationMs", if (::player.isInitialized && player.duration != C.TIME_UNSET) player.duration else 0)
        put("paused", !::player.isInitialized || !player.isPlaying)
        put("buffering", ::player.isInitialized && player.playbackState == Player.STATE_BUFFERING)
        put("playbackRate", if (::player.isInitialized) player.playbackParameters.speed else 1f)
    }

    private fun onMain(call: PluginCall, operation: () -> Unit) {
        mainHandler.post {
            try {
                operation()
            } catch (error: Exception) {
                call.reject(error.message ?: "Native audio operation failed.", error)
            }
        }
    }

    private fun generateSteadyBeats(bpm: Int, startMs: Int, endMs: Int): LongArray {
        val interval = 60_000.0 / bpm
        val beats = mutableListOf<Long>()
        var time = startMs.toDouble()
        while (time <= endMs) {
            beats.add(time.toLong())
            time += interval
        }
        return beats.toLongArray()
    }
}
