export function extract(value, defaultValue) {
    if (typeof value === "function") {
        const getter = value;
        const gotten = getter();
        if (gotten === undefined)
            return defaultValue;
        return gotten;
    }
    if (value === undefined)
        return defaultValue;
    return value;
}
