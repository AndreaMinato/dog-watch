import type { CameraSession } from '../room/camera-session'

export function keepScreenAndCameraOn(
  session: Pick<CameraSession, 'reacquire'>,
  onScreenKeptOn: (keptOn: boolean) => void,
): () => void {
  let wakeLock: Promise<WakeLockSentinel | null> = Promise.resolve(null)
  let stopped = false

  async function requestScreen() {
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      sentinel.addEventListener('release', onRelease)
      onScreenKeptOn(true)
      return sentinel
    }
    catch (error) {
      // Refused on low battery, power saving or a hidden page: the next visibility change retries.
      console.error(error)
      onScreenKeptOn(false)
      return null
    }
  }

  function holdScreen() {
    wakeLock = wakeLock.then((held) => {
      if (stopped || (held && !held.released))
        return held
      return requestScreen()
    })
  }

  function onRelease() {
    // The browser releases the lock of a hidden page: the visibility change takes it back.
    if (!stopped && document.visibilityState === 'visible')
      holdScreen()
  }

  function onVisibilityChange() {
    if (document.visibilityState !== 'visible')
      return
    holdScreen()
    session.reacquire().catch(console.error)
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  holdScreen()

  return () => {
    stopped = true
    document.removeEventListener('visibilitychange', onVisibilityChange)
    void wakeLock.then(held => held?.release())
  }
}
