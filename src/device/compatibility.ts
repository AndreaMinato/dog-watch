export interface Compatibility {
  app: boolean
  camera: boolean
}

export function detectCompatibility(scope: typeof globalThis = globalThis): Compatibility {
  const app = typeof scope.RTCPeerConnection === 'function'
  const canCapture = typeof scope.navigator.mediaDevices?.getUserMedia === 'function'
  const canKeepScreenOn = 'wakeLock' in scope.navigator
  return { app, camera: app && canCapture && canKeepScreenOn }
}

export const compatibility = detectCompatibility()
