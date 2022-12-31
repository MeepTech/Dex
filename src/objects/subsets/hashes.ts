import { Break, IBreakable } from "../../utilities/breakable";
import { isArray, isFunction } from "../../utilities/validators";
import Dex from "../dex";
import { IEntry } from "./entries";
import {
  IFullQuery,
  NO_RESULT_FOUND_FOR_QUERY,
  QueryConstructor,
  QueryResults
} from "../queries/queries";
import {
  FLAGS,
  hasFlag,
  IFlag
} from "../queries/flags";
import { IDexSubSet } from "./subset";
import { ITag } from "./tags";
import { IReadOnlyDex } from "../readonly";

/**
 * A hash key for a dex item.
 */
export type IHashKey = string | number | symbol;

export type IHashOrHashes = IHashKey | IHashKey[] | Set<IHashKey>

/**
 * A collection used to access hashes
 */
export interface IHashSet<TEntry extends IEntry>
  extends IDexSubSet<IHashKey, TEntry>,
  IFullQuery<IHashKey, IFlag, TEntry, IHashKey[]> { }

/** @internal */
export function HashSetConstructor<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  base: Set<IHashKey>
): IHashSet<TEntry> {

  // Basic query function
  const query: IFullQuery<IHashKey, IFlag, TEntry, IHashKey[]> = QueryConstructor<
    IHashKey,
    TEntry,
    IFlag,
    QueryResults<IHashKey, TEntry>,
    IHashKey[],
    QueryResults<IHashKey, TEntry>,
    IFlag
  >(
    (tags, flags) => {
      if (flags && hasFlag(flags, FLAGS.CHAIN)) {
        const hashes = dex.keys(tags, flags as any);
        const result = new Dex<TEntry>();
        result.copy.from(dex, hashes);

        return result;
      } else if (flags && hasFlag(flags, FLAGS.FIRST)) {
        return dex.keys.first(tags, flags);
      } else {
        return dex.keys(tags, flags as any);
      }
    },
    dex
  );

  /**
   * Sub functions
   */
  const hashSet = query as IHashSet<TEntry>;

  Object.defineProperty(hashSet, 'size', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'count', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'length', {
    get() {
      return base.size;
    },
    enumerable: false,
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
      const hash = dex.hash(target);
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
      a: IBreakable<[entry: TEntry, index: number], boolean> | ITag[],
      b?: IFlag[]
    ): IHashKey | Set<IHashKey> | Dex<TEntry> | undefined {
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
            } else if (result) {
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
              } else if (result) {
                return e;
              }
            }

            return NO_RESULT_FOUND_FOR_QUERY;
          } else {
            const results: Set<IHashKey> = new Set();

            for (const e of base.values()) {
              const result = a(dex.get(e)!, index++);
              if (result instanceof Break) {
                if (result.hasReturn && result.return) {
                  results.add(e);
                }

                break;
              } else if (result) {
                results.add(e);
              }
            }

            return results;
          }
        }
      } else {
        const results = dex.hashes(a, b);
        if (isArray(results)) {
          return new Set(results);
        } else {
          return results as IHashKey | Dex<TEntry>;
        }
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'map', {
    value: function <TResult>(transform: IBreakable<[item: IHashKey, index: number], TResult>): Array<TResult> {
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
    value: function (where: IBreakable<[item: IHashKey, index: number], boolean>): IHashKey | undefined {
      let index = 0;

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            return e;
          }

          break;
        } else if (result) {
          return e;
        }
      }

      return NO_RESULT_FOUND_FOR_QUERY;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'filter', {
    value: function (where: IBreakable<[item: IHashKey, index: number], boolean>): Set<IHashKey> {
      let index = 0;
      const results: Set<IHashKey> = new Set();

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            results.add(e);
          }

          break;
        } else if (result) {
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
    get(): () => IterableIterator<IHashKey> {
      return base[Symbol.iterator].bind(base);
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, Symbol.toStringTag, {
    value: "DexHashes",
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'forEach', {
    value(callbackfn: (value: IHashKey, value2: IHashKey, set: Set<IHashKey>) => void, thisArg?: any) {
      base.forEach(callbackfn, thisArg);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'has', {
    value(tag: ITag) {
      return base.has(tag);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'entries', {
    get() {
      return base.entries();
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'keys', {
    get() {
      return base.keys();
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(hashSet, 'values', {
    get() {
      return base.values();
    },
    enumerable: false,
    configurable: false
  });

  return hashSet;
}
