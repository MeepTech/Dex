import { IHashKey } from "./hashes";
import IUnique from "../unique";
import { IDexSubMap } from "./subset";
import {
  FullQueryConstructor,
  IFullQuery
} from "../queries/queries";
import Dex from "../dex";
import { Break, IBreakable } from "../../utilities/loops";
import { ITag, ITagOrTags, ITagSet } from "./tags";
import { IReadOnlyDex } from "../readonly";
import {isFunction, isArray} from "../../utilities/validators";
import { NoEntryFound, ResultType } from "../queries/results";

/**
 * Valid entry types.
 */
export type IEntry
  = ISimpleEntry
  | IComplexEntry

//#region Sub Types

/**
 * Entries that are not tag-like
 */
export type IComplexEntry
  = Function
  | Array<unknown>
  | []
  | {}
  | Object
  | object
  | { [k: string]: unknown }
  | IUnique

/**
 * Entries that are tag like
 */
export type ISimpleEntry
  = string
  | number
  | symbol

//#endregion

//#region Dtos

/**
 * Values that can be used to initialize the entries 
 */
export type IEntryOrNone<TEntry extends IEntry = IEntry>
  = NoEntries | NoEntryFound | TEntry;

/**
 * Inputable EntryWithTag set types.
 */
export type IEntryWithTags<TEntry extends IEntry = IEntry>
  = { entry?: IEntryOrNone<TEntry>, tags?: ITagOrTags }

/**
 * Standard array type container for a type of entry with all of it's tags.
 */
export type IEntryWithTagsArray<TEntry extends IComplexEntry = IComplexEntry>
  = [IEntryOrNone<TEntry>, ITag[]]

/**
 * All ways to input an entry with tags. Used mostly for dex construction and the add function.
 */
export type IInputEntryWithTags<TEntry extends IEntry = IEntry>
  = TEntry extends IComplexEntry
  ? (IInputEntryWithTagsObject<TEntry> | IInputEntryWithTagsArray<TEntry>)
  : IInputEntryWithTagsObject<TEntry>

/**
 * Inputable EntryWithTag array types.
 */
export type IInputEntryWithTagsArray<TEntry extends IComplexEntry = IComplexEntry>
  = [IEntryOrNone<TEntry>, ...ITag[]]
  | [IEntryOrNone<TEntry>, Set<ITag>]
  | [IEntryOrNone<TEntry>, ITag]
  | [IEntryOrNone<TEntry>, ITagSet]
  | IEntryWithTagsArray

/**
 * Inputable EntryWithTag object types.
 */
export type IInputEntryWithTagsObject<TEntry extends IEntry = IEntry>
  = IEntryWithTags<TEntry> & { tag?: ITagOrTags, tags?: ITagOrTags }

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
 * Used to hash entries.
 */
export interface IHasher {
  (entry: IEntry): IHashKey
}

/**
 * Represents a guard function for a type of entry.
 */
export interface IGuardFunction<TEntry extends IEntry> {
  (entry: IEntry): entry is TEntry
}

/**
 * Represents a guard function for an object type of entry.
 */
export interface IObjectGuardFunction<TEntry extends IEntry> {
  (entry: IEntry): entry is object & {[key: string]: any} & IComplexEntry & TEntry
}

/**
 * Represents a guard function for an array type of entry.
 */
export interface IArrayGuardFunction<TEntry extends IEntry> {
  (entry: IEntry): entry is any[] & IComplexEntry & TEntry
}
 
//#endregion

//#region Entry Set

/**
 * A set used to contain entries
 */
export interface IEntrySet<TEntry extends IEntry>
  extends IDexSubMap<TEntry>,
  IFullQuery<TEntry, ResultType.Array>
{

  /**
   * Get all entries as a record indeed by key
   */
  map<TResult>(
    transform: IBreakable<[entry: TEntry, index: number], TResult>
  ): TResult[];

  /**
   * Get a plain map that's a copy of the hash key and entry map of the dex.
   */
  map(): Map<IHashKey, TEntry>
}

/** @internal */
export function EntryMapConstructor<TEntry extends IEntry>(
  dex: IReadOnlyDex<TEntry>,
  base: Map<IHashKey, TEntry>
): IEntrySet<TEntry> {
  const query: IEntrySet<TEntry>
    = <IEntrySet<TEntry>>(
      FullQueryConstructor<TEntry, ResultType.Array>(
        dex,
        ResultType.Array
      )
    );
  
  Object.defineProperty(query, "map", {
    value<TResult = never>(
      transform?: IBreakable<[entry: TEntry, index: number], TResult>
    ): TResult[] | Map<IHashKey, TEntry> {
      if (transform) {
        const results: TResult[] = [];
        let index = 0;
  
        for (const e of base.values()) {
          const result = transform(e, index++);
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
  } as {
    value: IEntrySet<TEntry>["map"],
    enumerable: false,
    writable: false,
    configurable: false
  });
  
  Object.defineProperty(query, "where", {
    value: function (
      validator: IBreakable<[entry: TEntry, index: number], boolean>,
    ): TEntry[] {
      const results: TEntry[] = [];
      let index = 0;
      for (const e of base.values()) {
        const result = validator(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            results.push(e);
          }

          break;
        } else if (result) {
          results.push(e);
        }
      }

      return results;
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: IEntrySet<TEntry>["where"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, "filter", {
    value(
      where: IBreakable<[entry: TEntry, index: number], boolean>
    ): Set<TEntry> {
      let index = 0;
      const results: Set<TEntry> = new Set();

      for (const [k, e] of base.entries()) {
        const result = where(e, index++, k);
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
  } as {
    value: IEntrySet<TEntry>["filter"],
    enumerable: false,
    writable: false,
    configurable: false
  });
  
  return query;

  const entryMap: IEntrySet<TEntry> = query as any;

  Object.defineProperty(entryMap, "keys", {
    get(): IterableIterator<IHashKey> {
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
    get(): IterableIterator<[IHashKey, TEntry]> {
      return base.entries();
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "toRecord", {
    value(): Record<IHashKey, TEntry> {
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

  Object.defineProperty(entryMap, Symbol.toStringTag, {
    value: "DexEntries",
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, Symbol.iterator, {
    get(): () => IterableIterator<[IHashKey, TEntry]> {
      return base[Symbol.iterator].bind(base);
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "get", {
    value(tag: ITag) {
      return base.get(tag);
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(entryMap, "has", {
    value(tag: ITag) {
      return base.has(tag);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  return entryMap;
}

//#endregion