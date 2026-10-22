const maxLength = 40

export function parseName(value: unknown): string | null {
  if (typeof value !== 'string')
    return null
  const name = value.trim()
  return name.length > 0 && name.length <= maxLength ? name : null
}
