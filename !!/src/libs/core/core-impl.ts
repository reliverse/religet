/**
 * Represents the standard cache operations all adapters must provide.
 */
export type CacheAdapter<T = unknown> = {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  remove(key: string): void;
  clear(): void;
};

/**
 * A utility type storing items with metadata about expiration times.
 */
export type CacheItem<T> = {
  value: T;
  expiresAt?: number;
};

/**
 * Creates a new Memory Cache adapter.
 */
export function createMemoryCacheAdapter<T = unknown>(): CacheAdapter<T> {
  // We'll keep a Map in this closure-scoped variable:
  const store = new Map<string, CacheItem<T>>();

  function get(key: string): T | undefined {
    const item = store.get(key);
    if (!item) {
      return undefined;
    }
    if (item.expiresAt !== undefined && item.expiresAt < Date.now()) {
      // Expired -> remove from store and return undefined
      store.delete(key);
      return undefined;
    }
    return item.value;
  }

  function set(key: string, value: T, ttl?: number): void {
    let expiresAt: number | undefined;
    if (ttl && ttl > 0) {
      expiresAt = Date.now() + ttl;
    }
    store.set(key, { value, expiresAt });
  }

  function remove(key: string): void {
    store.delete(key);
  }

  function clear(): void {
    store.clear();
  }

  return {
    get,
    set,
    remove,
    clear,
  };
}
