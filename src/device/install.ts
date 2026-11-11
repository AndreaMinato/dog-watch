import { computed, shallowRef } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<unknown>
}

/** Chromium offers the install with this event, which opens its prompt only once. */
const offer = shallowRef<BeforeInstallPromptEvent | null>(null)

addEventListener('beforeinstallprompt', (event) => {
  // Our button replaces the banner Chrome would show on Android.
  event.preventDefault()
  offer.value = event as BeforeInstallPromptEvent
})
addEventListener('appinstalled', () => {
  offer.value = null
})

/** iPhone and iPad install a web app only from Share. Safari on the iPad says it is a Mac, one with a touch screen. */
const installsFromShare = /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 0)

const installed = matchMedia('(display-mode: standalone)').matches

export const installMethod = computed(() => {
  if (installed)
    return null
  if (offer.value)
    return 'prompt'
  return installsFromShare ? 'share' : null
})

export async function install(): Promise<void> {
  const used = offer.value
  offer.value = null
  await used?.prompt()
}
