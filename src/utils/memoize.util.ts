const cache = new Map<string, unknown>();

export function memoize<T>(id: string, fn: () => T): T {
  if (cache.has(id)) {
    return cache.get(id) as T;
  }

  const result = fn();
  cache.set(id, result);

  return result;
}
