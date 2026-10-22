export function keepDevice(): () => void {
  let wakeLock: Promise<WakeLockSentinel | null> = Promise.resolve(null)
  let stopped = false

  function holdScreen() {
    wakeLock = wakeLock.then(async (held) => {
      if (stopped || (held && !held.released))
        return held
      // Refused on low battery, power saving or a hidden page: the next visibility change retries.
      return navigator.wakeLock.request('screen').catch(() => null)
    })
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible')
      holdScreen()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  holdScreen()

  return () => {
    stopped = true
    document.removeEventListener('visibilitychange', onVisibilityChange)
    void wakeLock.then(held => held?.release())
  }
}
