export const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `id-${Math.random().toString(36).slice(2, 11)}`
}

export const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }

  return result
}

export const shuffle = <T,>(items: T[]) => {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

export const rotate = <T,>(items: T[], amount: number) => {
  if (items.length === 0) {
    return []
  }

  const offset = ((amount % items.length) + items.length) % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}
