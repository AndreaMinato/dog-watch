export interface Listeners<Args extends unknown[]> {
  readonly size: number
  add: (listener: (...args: Args) => void) => () => void
  notify: (...args: Args) => void
  clear: () => void
}

export function createListeners<Args extends unknown[]>(): Listeners<Args> {
  const listeners = new Set<(...args: Args) => void>()
  return {
    get size() {
      return listeners.size
    },
    add(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    notify(...args) {
      listeners.forEach(listener => listener(...args))
    },
    clear() {
      listeners.clear()
    },
  }
}
