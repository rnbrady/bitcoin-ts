import { binToHex } from './hex';

const defaultStringifySpacing = 2;

/**
 * A safe method to `JSON.stringify` a value, useful for debugging and logging
 * purposes.
 *
 * @remarks
 * Without modifications, `JSON.stringify` has several shortcomings in
 * debugging and logging usage:
 * - throws when serializing anything containing a `bigint`
 * - `Uint8Array`s are often serialized in base 10 with newlines between each
 *   index item
 * - `functions` and `symbols` are not clearly marked
 *
 * This method is more helpful in these cases:
 * - `bigint`: `0n` → `<bigint: 0n>`
 * - `Uint8Array`: `Uint8Array.of(0,0)` → `<Uint8Array: 0x0000>`
 * - `function`: `(x) => x * 2` → `<function: (x) => x * 2>`
 * - `symbol`: `Symbol(A)` → `<symbol: Symbol(A)>`
 *
 * @param value - the data to serialize
 * @param spacing - the number of spaces to use in
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stringify = (value: any, spacing = defaultStringifySpacing) =>
  JSON.stringify(
    value,
    // eslint-disable-next-line complexity
    (_, item) => {
      const type = typeof item;
      const name = type === 'object' ? (item as object).constructor.name : type;
      switch (name) {
        case 'Uint8Array':
          return `<Uint8Array: 0x${binToHex(item as Uint8Array)}>`;
        case 'bigint':
          return `<bigint: ${(item as bigint).toString()}n>`;
        case 'function':
        case 'symbol':
          return `<${name}: ${(item as symbol | Function).toString()}>`;
        default:
          return item;
      }
    },
    spacing
  );
