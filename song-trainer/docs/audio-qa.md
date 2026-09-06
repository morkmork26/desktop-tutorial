# Windows Audio QA

Run this checklist on Windows 11 after synchronization, analysis/correction, and V1 completion checkpoints. Record the device, WebView2 version, headphones/speakers, and build identifier.

- Play the 120 BPM fixture for two minutes (repeat if needed); listen and watch for perceptible click/marker drift.
- Pause for five seconds and resume; the next click must align without a catch-up burst.
- Seek forward and backward while playing; stale clicks should stop within the short scheduling horizon and alignment should recover immediately.
- Change between 50%, 75%, and 100%; markers retain original positions and clicks remain aligned.
- Enable a short phrase loop; each restart must rebuild click scheduling without doubling clicks.
- Repeat through headphones and speakers.
- Listen for pitch preservation at every speed before describing it as verified.
- Exercise sleep/wake and audio-device changes; failures must remain recoverable by pause/resume or reload.

Automated browser checks prove timing calculations and state transitions. They do not prove WebView2 audio latency or native pitch quality.
