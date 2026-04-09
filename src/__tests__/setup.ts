import '@testing-library/jest-dom/vitest';

class StorageMock {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  get length(): number {
    return this.store.size;
  }
  key(_index: number): string | null {
    return null;
  }
}

Object.defineProperty(globalThis, 'sessionStorage', {
  value: new StorageMock(),
});

Object.defineProperty(globalThis, 'localStorage', {
  value: new StorageMock(),
});