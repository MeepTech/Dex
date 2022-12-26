import { HashKey } from "./hashes";
import IUnique from "../unique";
import { IDexSubMap } from "./subset";
import {
  IFullQuery,
  NoEntryFound,
  NO_RESULTS_FOUND_FOR_QUERY,
  QueryConstructor,
  QueryResults
} from "../queries/queries";
import {
  FLAGS,
  Flag
} from "../queries/flags";
import Dex from "../dex";
import { Break, Breakable } from "../../utilities/breakable";
import { Tag, TagOrTags } from "./tags";
import { IReadOnlyDex } from "../readonly";
import { isFunction, isArray, isObject, isTag, isNumber, isString, isSymbol } from "../../utilities/validators";

/**
 * Valid entry types.
 */
export type Entry
  = SimpleEntry
  | ComplexEntry

//#region Sub Types

/**
 * Entries that are not tag-like
 */
export type ComplexEntry
  = Function
  | Array<unknown>
  | {}
  | Object
  | object
  | { [k: string]: unknown }
  | IUnique

/**
 * Entries that are tag like
 */
export type SimpleEntry
  = string
  | number
  | symbol

//#endregion

//#region Dtos

/**
 * Values that can be used to initialize the entries 
 */
export type EntryOrNone<TEntry extends Entry = Entry>
  = NoEntries | NoEntryFound | TEntry;

/**
 * Inputable EntryWithTag set types.
 */
export type EntryWithTags<TEntry extends Entry = Entry>
  = { entry?: EntryOrNone<TEntry>, tags?: Set<Tag> }

/**
 * Standard array type container for a type of entry with all of it's tags.
 */
export type EntryWithTagsArray<TEntry extends ComplexEntry = ComplexEntry>
  = [EntryOrNone<TEntry>, Tag[]]

/**
 * All ways to input an entry with tags. Used mostly for dex construction and the add function.
 */
export type InputEntryWithTags<TEntry extends Entry = Entry>
  = TEntry extends ComplexEntry
  ? (InputEntryWithTagsObject<TEntry> | InputEntryWithTagsArray<TEntry>)
  : InputEntryWithTagsObject<TEntry>

/**
 * Inputable EntryWithTag array types.
 */
export type InputEntryWithTagsArray<TEntry extends Entry = Entry>
  = [EntryOrNone<TEntry>, ...Tag[]]
  | [EntryOrNone<TEntry>, Set<Tag>]
  | [EntryOrNone<TEntry>, Tag]
  | EntryWithTagsArray

/**
 * Inputable EntryWithTag object types.
 */
export type InputEntryWithTagsObject<TEntry extends Entry = Entry>
  = EntryWithTags<TEntry> & { tag?: TagOrTags, tags?: TagOrTags }

/**
 * Used to represent the value of a tag with no entries
 */
export const NO_ENTRIES_FOR_TAG = null;

/**
 * Used to represent the value of a tag with no entries
 */
export type NoEntries
  = typeof NO_ENTRIES_FOR_TAG;

//#endregion

//#region Utility

/**
 * Represents a guard function for a type of entry.
 */
export interface GuardFunction<TEntry extends Entry> {
  (entry: Entry): entry is TEntry
}

export function inputEntryWithTagsArrayGuardFunction<TEntry extends Entry = Entry>(
  value: Entry
): value is TEntry {
  return (isArray(value))
    // if the first item in the array is a potential complex entry or an empty tag value...
    && ((isObject(value[0]) || value[0] === NO_ENTRIES_FOR_TAG)
      // if the second item of that array is a potental tag
      && (isTag(value[1])
        // or if it's an array of tags or empty array
        || (isArray(value[1])
          && (!value[1].length
            || isTag(value[1][0])))))
}

export function simpleEntryGuardFunction(
  value: Entry
): Value is SimpleEntry {
  return isString(value) || isNumber(value) || isSymbol(value)
}
 
//#endregion

//#region Entry Set

/**
 * A set used to contain entries
 */
export interface IEntrySet<TEntry extends Entry>
  extends IDexSubMap<
    TEntry,
    HashKey,
    TEntry
  >,
  IFullQuery<TEntry> {

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
  const query: IFullQuery<TEntry> = QueryConstructor<
    TEntry,
    TEntry,
    Flag,
    QueryResults<TEntry>,
    TEntry[],
    QueryResults<TEntry>,
    Flag
  >(dex.find, dex);

  const entryMap: IEntrySet<TEntry> = query as any;
  Object.defineProperty(entryMap, "map", {
    value: function <TResult = never>(
      transform?: Breakable<[entry: TEntry, index: number, key: HashKey], TResult>
    ): TResult[] | Map<HashKey, TEntry> {
      if (transform) {
        const results: TResult[] = [];
        let index = 0;

        for (const [k, e] of base) {
          const result = transform(e, index++, k);
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
    configurable: false
  });

  Object.defineProperty(entryMap, "values", {
    get(): IterableIterator<TEntry> {
      return base.values();
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "pairs", {
    get(): IterableIterator<[HashKey, TEntry]> {
      return base.entries();
    },
    enumerable: false,
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
      configurable: false
    }));

  Object.defineProperty(entryMap, "where", {
    value: function (
      a: Breakable<[entry: TEntry, index: number], boolean> | Tag[],
      b?: Flag[]
    ): TEntry | Set<TEntry> | Dex<TEntry> | NoEntryFound {
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

            return NO_RESULTS_FOUND_FOR_QUERY;
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
    value: function (where: Breakable<[entry: TEntry, index: number, key: HashKey], boolean>): TEntry | NoEntryFound {
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

      return NO_RESULTS_FOUND_FOR_QUERY;
    },
    enumerable: false,
    writable: false,
    configurable: false
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
    },
    enumerable: false,
    writable: false,
    configurable: false
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
    configurable: false
  });

  Object.defineProperty(entryMap, "get", {
    value(tag: Tag) {
      return base.get(tag);
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "has", {
    value(tag: Tag) {
      return base.has(tag);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  return entryMap;
}

//#endregion