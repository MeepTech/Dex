import { HashKey } from "./hashes";
import IUnique from "../unique";
import { IDexSubMap } from "./subset";
import {
  IQuery,
  QueryResultCalculator,
  QueryConstructor,
  QueryResults
} from "../queries/queries";
import {
  FLAGS,
  Flag
} from "../queries/flags";
import Dex from "../dex";
import { Break, Breakable } from "../../utilities/breakable";
import { Tag } from "./tags";
import { IReadOnlyDex } from "../readonly";
import { isFunction, isArray } from "../../utilities/validators";

/**
 * Valid entry types.
 */
export type Entry
  = string
  | number
  | symbol
  | Function
  | Array<unknown>
  | {}
  | Object
  | object
  | { [k: string]: unknown }
  | IUnique

/**
 * A set used to contain entries
 */
export interface IEntrySet<TEntry extends Entry>
  extends IDexSubMap<
    TEntry,
    HashKey,
    TEntry
  >,
  IQuery<TEntry> {

  /**
   * Get all entries as a record indeed by key
   */
  map<TResult>(
    transform: Breakable<[entry: TEntry, index: number, key: HashKey], TResult>
  ): TResult[];

  /**
   * Get a plain map that's a copy of the hash key and entry map of the dex.
   */
  map(): Map<HashKey, TEntry>
}

/** @internal */
export function EntryMapConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: Map<HashKey, TEntry>
): IEntrySet<TEntry> {
  const query: IQuery<TEntry> = QueryConstructor<
    TEntry,
    TEntry,
    Flag,
    QueryResults<TEntry>,
    TEntry[],
    QueryResults<TEntry>,
    Flag
  >(dex.find);

  const entryMap: IEntrySet<TEntry> = query as any;
  Object.defineProperty(entryMap, "map", {
    value: function <TResult = never>(
      transform?: Breakable<[entry: TEntry, index: number, key: HashKey], TResult>
    ): TResult[] | Map<HashKey, TEntry> {
      if (transform) {
        const results: TResult[] = [];
        let index = 0;

        for (const [k, e] of base) {
          const result = transform(e,index++, k);
          if (result instanceof Break) {
            if (result.hasReturn) {
              results.push(result.return!);
            }

            break;
          } else {
            results.push(result);
          }
        }

        return results;
      } else {
        return new Map(base);
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "keys", {
    get(): IterableIterator<HashKey> {
      return base.keys();
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "values", {
    get(): IterableIterator<TEntry> {
      return base.values();
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "pairs", {
    get(): IterableIterator<[HashKey, TEntry]> {
      return base.entries();
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "toRecord", {
    value(): Record<HashKey, TEntry> {
      return Object.fromEntries(base);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "toArray", {
    value(): TEntry[] {
      return Array.from(base.values());
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  ["count", "size", "length"].forEach(key =>
    Object.defineProperty(entryMap, key, {
      get(): number {
        return base.size;
      },
      enumerable: false,
      writable: false,
      configurable: false
    }));

  Object.defineProperty(entryMap, "where", {
    value: function(
        a: Breakable<[entry: TEntry, index: number], boolean> | Tag[],
        b?: Flag[]
      ): TEntry | Set<TEntry> | Dex<TEntry> | undefined {
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
                const result = a(e, index++);
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
              const results: Set<TEntry> = new Set();

              for (const e of base.values()) {
                const result = a(e, index++);
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
          const results = dex.find(a, b);
          if (isArray(results) && !b?.includes(FLAGS.FIRST)) {
            return new Set(results);
          } else {
            return results as TEntry | Dex<TEntry>;
          }
        }
      },
      enumerable: false,
      writable: false,
      configurable: false
  });

  Object.defineProperty(entryMap, "first", {
    value: function (where: Breakable<[entry: TEntry, index: number, key: HashKey], boolean>): TEntry | undefined {
      let index = 0;
      for (const [k, e] of base.entries()) {
        const result = where(e, index++, k);
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
    }
  });

  Object.defineProperty(entryMap, "filter", {
    value: function (where: Breakable<[entry: TEntry, index: number, key: HashKey], boolean>): Set<TEntry> {
      let index = 0;
      const results: Set<TEntry> = new Set();

      for (const [k, e] of base.entries()) {
        const result = where(e, index++, k);
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
  });

  Object.defineProperty(entryMap, Symbol.toStringTag, {
    value: "DexEntries",
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, Symbol.iterator, {
    get(): IterableIterator<[HashKey, TEntry]> {
      return base[Symbol.iterator]()
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "get", {
    value: base.get,
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "has", {
    value: base.has,
    enumerable: false,
    writable: false,
    configurable: false
  });

  return entryMap;
}