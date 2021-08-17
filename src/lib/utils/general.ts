/**
 * This type provides a flag that can be used to turn off more lax overloads intended for
 * plugin use only to catch type errors in the TypeDoc codebase. The prepublishOnly npm
 * script will be used to switch this flag to false when publishing, then immediately back
 * to true after a successful publish.
 */
type InternalOnly = true;

/**
 * Helper type to convert `T` to `F` if strict mode is on.
 *
 * Can be used in overloads to map a parameter type to `never`. For example, the
 * following function will work with any string argument, but to improve the type safety
 * of internal code, we only ever want to pass 'a' or 'b' to it. Plugins on the other
 * hand need to be able to pass any string to it. Overloads similar to this are used
 * in the {@link Options} class.
 *
 * ```ts
 * function over(flag: 'a' | 'b'): string
 * function over(flag: IfInternal<string, never>): string
 * function over(flag: string): string { return flag }
 * ```
 *
 * This is also heavily used to prevent TypeDoc code from using deprecated overloads
 * or properties.
 */
export type IfInternal<T, F> = InternalOnly extends true ? T : F;

/**
 * Helper type to convert `T` to `never` if strict mode is on.
 *
 * See {@link IfInternal} for the rationale.
 */
export type NeverIfInternal<T> = IfInternal<never, T>;

/**
 * Helper type to allow widening a string literal for external consumers.
 *
 * @privateRemarks
 * Uses `string & {}` to prevent TypeScript from collapsing `string | 'a'` down
 * to `string`, which improves intellisense.
 */
export type StringIfExternal<T extends string> =
    | T
    | NeverIfInternal<string & {}>;

/**
 * Inverse of `Readonly<T>`
 */
export type Writable<T> = {
    -readonly [K in keyof T]: T[K];
};

/**
 * Helper to convert an object literal into a discriminated union.
 * Note that this does not add properties to the value. This is intentional since
 * it means that it can be used with objects of any shape safely, with the small
 * downside of needing to access a `value` property.
 */
export type ToDiscriminatedUnion<T> = {
    [K in keyof T]: { type: K; value: T[K] };
}[keyof T];

/**
 * Check if two types are equivalent, return `A` if they are, `B` if not.
 * @see https://stackoverflow.com/a/49579497/7186598
 */
export type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <
    T
>() => T extends Y ? 1 : 2
    ? A
    : B;

/**
 * Get all non-readonly keys of `T`
 * @see https://stackoverflow.com/a/49579497/7186598
 */
export type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<
        { [Q in P]: T[P] },
        { -readonly [Q in P]: T[P] },
        P,
        never
    >;
}[keyof T];

/**
 * Get the keys of `T` which are assignable to `U`
 */
export type KeysOfType<T, U> = {
    [K in keyof T]-?: T[K] extends U ? K : never;
}[keyof T];
