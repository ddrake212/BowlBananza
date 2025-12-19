export function objectToNumberMap<T>(obj: Record<string, T>): Map<number, T> {
    const map = new Map<number, T>();

    for (const [key, value] of Object.entries(obj)) {
        map.set(Number(key), value);
    }

    return map;
}
