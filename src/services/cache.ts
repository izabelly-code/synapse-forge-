const store = new Map<string, unknown>();

export function getCached<T>(key: string): T | undefined {
    return store.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T): void {
    store.set(key, value);
}

export function invalidateCached(key: string): void {
    store.delete(key);
}
