import { Break, Breakable } from "../../utilities/breakable";
import { isArray, isFunction } from "../../utilities/validators";
import Dex from "../dex";
import { Entry } from "./entries";
import {
  IQuery,
  QueryConstructor,
  QueryResults
} from "../queries/queries";
import {
  FLAGS,
  Flag
} from "../queries/flags";
import { IDexSubSet } from "./subset";
import { Tag } from "./tags";
import { IReadOnlyDex } from "../readonly";

/**
 * A hash key for a dex item.
 */
export type HashKey = string | number | symbol;

/**
 * A collection used to access hashes
 */
export interface IHashSet<TEntry extends Entry>
  extends IDexSubSet<HashKey, TEntry>,
  IQuery<HashKey, TEntry, Flag, HashKey[]> { }

/** @internal */
export function HashSetConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: Set<HashKey>
): IHashSet<TEntry> {

  /**
   * Basic query function
   */
  const query: IQuery<HashKey, TEntry, Flag, HashKey[]> = QueryConstructor<
    HashKey,
    TEntry,
    Flag,
    QueryResults<HashKey, TEntry>,
    HashKey[],
    QueryResults<HashKey, TEntry>,
    Flag
  >((tags, flags) => {
    if (flags?.includes(FLAGS.CHAIN)) {
      const hashes = dex.hashes(tags, flags as any);
      const result = new Dex<TEntry>();
      result.copy.from(dex, hashes);

      return result;
    } else if (flags?.includes(FLAGS.FIRST)) {
      return dex.hashes.first(tags, flags);
    } else {
      return dex.hashes(tags, flags as any);
    }
  });

  /**
   * Sub functions
   */
  const hashSet = query as IHashSet<TEntry>;

  Object.defineProperty(hashSet, 'size', {
    get() {
      return base.size;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'count', {
    get() {
      return base.size;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'length', {
    get() {
      return base.size;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'toArray', {
    value: function toArray() {
      return [...base];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'of', {
    value: function get(target: TEntry) {
      const hash = Dex.hash(target);
      if (hash !== undefined && base.has(hash)) {
        return hash;
      }

      return undefined;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'where', {
    value: function where(
      a: Breakable<[entry: TEntry, index: number], boolean> | Tag[],
      b?: Flag[]
    ): HashKey | Set<HashKey> | Dex<TEntry> | undefined {
      if (isFunction(a)) {
        if (b?.includes(FLAGS.CHAIN) && !b.includes(FLAGS.FIRST)) {
          const results = new Dex<TEntry>();
          let index = 0;

          for (const e of base.keys()) {
            const result = a(dex.get(e)!, index++);
            if (result instanceof Break) {
              if (result.hasReturn && result.return) {
                (results as Dex<TEntry>).copy.from(dex, [e]);
              }

              break;
            } else {
              (results as Dex<TEntry>).copy.from(dex, [e]);
            }
          }

          return results;
        } else {
          let index = 0;

          if (b?.includes(FLAGS.FIRST)) {
            for (const e of base.values()) {
              const result = a(dex.get(e)!, index++);
              if (result instanceof Break) {
                if (result.hasReturn && result.return) {
                  return e;
                }

                break;
              } else {
                return e;
              }
            }

            return undefined!;
          } else {
            const results: Set<HashKey> = new Set();

            for (const e of base.values()) {
              const result = a(dex.get(e)!, index++);
              if (result instanceof Break) {
                if (result.hasReturn && result.return) {
                  results.add(e);
                }

                break;
              } else {
                results.add(e);
              }
            }

            return results;
          }
        }
      } else {
        const results = dex.keys(a, b);
        if (isArray(results)) {
          return new Set(results);
        } else {
          return results as HashKey | Dex<TEntry>;
        }
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'map', {
    value: function <TResult>(transform: Breakable<[item: HashKey, index: number], TResult>): Array<TResult> {
      let index = 0;
      const results: Array<TResult> = [];

      for (const e of base.values()) {
        const result = transform(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn) {
            results.push(result.return as TResult);
          }

          break;
        } else {
          results.push(result);
        }
      }

      return results;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'first', {
    value: function (where: Breakable<[item: HashKey, index: number], boolean>): HashKey | undefined {
      let index = 0;

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            return e;
          }

          break;
        } else {
          return e;
        }
      }

      return undefined;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'filter', {
    value: function (where: Breakable<[item: HashKey, index: number], boolean>): Set<HashKey> {
      let index = 0;
      const results: Set<HashKey> = new Set();

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            results.add(e);
          }

          break;
        } else {
          results.add(e);
        }
      }

      return results;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, Symbol.iterator, {
    get(): IterableIterator<HashKey> {
      return base[Symbol.iterator]()
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, Symbol.toStringTag, {
    value: "DexHashes",
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'forEach', {
    value: base.forEach,
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'has', {
    value: base.has,
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'entries', {
    value: base.entries,
    get() {
      return base.entries();
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'keys', {
    value: base.keys,
    get() {
      return base.keys();
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'values', {
    value: base.values,
    get() {
      return base.values();
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  return hashSet;
}
