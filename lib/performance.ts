import { cache } from 'react'

export const memoizedFetch = cache(async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options)
  return response.json()
})

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}