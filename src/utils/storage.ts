/**
 * Defensive localStorage wrapper matching pattern from south-lebanon-map
 */
export function safeStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    // localStorage blocked or parse error
    return defaultValue;
  }
}

export function safeStorageSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // localStorage blocked or quota exceeded
    return false;
  }
}

export function safeStorageRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
