# Device testing

For what the e2e suite can't reach: real Safari and Chrome on phones, the installed PWA, audio, real camera hardware. Layout at phone and tablet widths is already covered by the e2e `phone` and `tablet` projects.

Test a PR's deploy preview, `https://deploy-preview-<PR>--dog-watch.netlify.app`. It talks to the one Supabase project (ADR-0004), so every Stanza you create is real: close it when done (camera menu → Chiudi la Stanza).

## iOS simulator

- Open pages with `xcrun simctl openurl <udid> "<url>"`. The simulator can't take pasted text, so type by tapping keys, or open an invite link (`/entra#<chiave>&<nome>`), which skips the Chiave step.
- It has no camera: use it as a Spettatore. Its audio plays through the Mac's speakers, so a person can listen.
- Install the PWA from Safari: Share → scroll the sheet → Aggiungi alla schermata Home.

## Android emulator

- Use a recent Chrome image (Android 11's Chrome is too old). Create it once, with Android Studio's Java:

  ```bash
  JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ~/Library/Android/sdk/cmdline-tools/latest/bin/avdmanager create avd -n veglia -k "system-images;android-36;google_apis_playstore;arm64-v8a" -d pixel_8
  ```

  then set `hw.camera.back=virtualscene` and `hw.camera.front=emulated` in `~/.android/avd/veglia.avd/config.ini`.
- Chrome's first run asks for its terms: choose "Use without an account".
- Read the page as text, not screenshots: `adb forward tcp:9222 localabstract:chrome_devtools_remote`, then send `Runtime.evaluate` to the page's `webSocketDebuggerUrl` listed at `http://localhost:9222/json`. Keep `adb exec-out screencap -p` for what must be seen.
- The virtual camera crashes Chrome on a lens switch: check lens switching on a real phone.

## A second camera

`node scripts/test-camera.mjs "<invite link>" [name]` joins the Stanza as a Telecamera with Chromium's fake camera, whose microphone beeps every second. With a real camera in the same Stanza, a Spettatore checks audio: the beep is heard only while the test camera is in the big video. Ctrl-C leaves the Stanza.

## Load

Simulators, the emulator and the e2e suite together saturate this Mac. Check `uptime` first, run one device at a time, and shut each down when done (`xcrun simctl shutdown <udid>`, `adb emu kill`).
