export async function register() {
  // Node.js 25+ has an experimental localStorage global that is incomplete.
  // Some libraries try to use it server-side and crash. Patch it with a no-op
  // implementation so server-side rendering doesn't break.
  if (typeof globalThis.localStorage !== "undefined") {
    const storage = globalThis.localStorage;
    if (typeof storage.getItem !== "function") {
      const store = new Map<string, string>();
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => store.set(key, value),
          removeItem: (key: string) => store.delete(key),
          clear: () => store.clear(),
          get length() { return store.size; },
          key: (index: number) => [...store.keys()][index] ?? null,
        },
        writable: true,
        configurable: true,
      });
    }
  }
}
