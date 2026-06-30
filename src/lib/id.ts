// Простой генератор id без внешних зависимостей.
let counter = 0
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 1_000_000
  const rand = Math.floor(performance.now() * 1000) % 1_000_000
  return `${prefix}_${Date.now().toString(36)}_${rand.toString(36)}_${counter.toString(36)}`
}
