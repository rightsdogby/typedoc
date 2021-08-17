import { ok } from "assert";

export function getEnumFlags<T extends number>(flags: T): T[] {
    const result: T[] = [];
    for (let i = 1; i <= flags; i *= 2) {
        if (flags & i) {
            result.push(i as T);
        }
    }

    return result;
}

/**
 * Takes `flag` and unsets any bits set in `remove`.
 */
export function removeFlag<T extends number>(flag: T, remove: T & {}): T {
    return ((flag ^ remove) & flag) as T;
}

/**
 * Returns true if `flags` has all of the bits in `check` set.
 */
export function hasAllFlags(flags: number, check: number): boolean {
    return (flags & check) === check;
}

/**
 * Returns true if `flags` has any of the bits in `check` set.
 */
export function hasAnyFlag(flags: number, check: number): boolean {
    return (flags & check) !== 0;
}

/**
 * Create a helper function to return the name of a kind given a bitwise kind TS enum.
 * @param enumObj the enumeration itself.
 */
export function makeToKindString(
    enumObj: Record<number, string | number>
): (kind: number) => string {
    return (kind) => {
        ok(
            Number.isInteger(Math.log2(kind)),
            `Tried to get a kind string for kind ${kind}, which is not an exact kind.`
        );
        const kindString = enumObj[kind];
        ok(
            typeof kindString === "string",
            `Tried to get a kind string for kind ${kind}, but the provided kind does not exist.`
        );
        return kindString[0].toLowerCase() + kindString.substr(1);
    };
}
