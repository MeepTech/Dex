import { HashKey } from "./hashes";
import IUnique from "../unique";
import { IDexSubMap, SubSet } from "./subset";
import Queries from "../queries/queries";
import Loop from "../../utilities/iteration";
import { Tag, TagOrTags, TagSet } from "./tags";
import { IReadOnlyDex } from "../dexes/readonly";
import { Result, NoEntryFound, ResultType } from "../queries/results";

/**
 * Valid entry types.
 */
export type Entry
  = Simple
  | Complex
export default Entry;

//#region Sub Types

/**
 * Entries that are not tag-like
 */
export type Complex
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
export type Simple
  = string
  | number
  | symbol

//#endregion

//#region Dtos

/**
 * Values that can be used to initialize the entries 
 */
export type OrNone<TEntry extends Entry = Entry>
  = None | NoEntryFound | TEntry;

/**
 * Inputable EntryWithTag set types.
 */
export type WithTags<TEntry extends Entry = Entry>
  = { entry: OrNone<TEntry>, tags: TagOrTags }

/**
 * Standard array type container for a type of entry with all of it's tags.
 */
export type WithTagsTuple<TEntry extends Complex = Complex>
  = [OrNone<TEntry>, Tag[]]

/**
 * All ways to input an entry with tags. Used mostly for dex construction and the add function.
 */
export type XWithTags<TEntry extends Entry = Entry>
  = TEntry extends Complex
  ? (XWithTagsObject<TEntry> | XWithTagsTuple<TEntry>)
  : XWithTagsObject<TEntry>

/**
 * Inputable EntryWithTag array types.
 */
export type XWithTagsTuple<TEntry extends Complex = Complex>
  = [OrNone<TEntry> | HashKey, ...Tag[]]
  | [OrNone<TEntry> | HashKey, Iterable<Tag>]
  | [OrNone<TEntry> | HashKey, Tag]
  | WithTagsTuple

/**
 * Inputable EntryWithTag object types.
 */
export type XWithTagsObject<TEntry extends Entry = Entry>
  = WithTags<TEntry>
  | { entry: OrNone<TEntry> | HashKey, tags: TagOrTags }
  | { tag: Tag, entry?: OrNone<TEntry> | HashKey, tags?: never }
  | { tags: TagOrTags, entry?: OrNone<TEntry> | HashKey, tag?: never }
  | { entry: OrNone<TEntry> | HashKey, tags?: TagOrTags, tag?: never }
  | { entry: OrNone<TEntry> | HashKey, tag?: Tag, tags?: never }

/**
 * Used to represent the value of a tag with no entries
 */
export const NONE_FOR_TAG = null;

/**
 * Used to represent the value of a tag with no entries
 */
export type None
  = typeof NONE_FOR_TAG;

//#endregion

//#region Utility

/**
 * Used to hash entries.
 */
export interface IHasher {
  (entry: Entry): HashKey
}

/**
 * Represents a guard function for a type of entry.
 */
export interface IGuard<TEntry extends Entry> {
  (entry: Entry): entry is TEntry
}

/**
 * Represents a guard function for an object type of entry.
 */
export interface IObjectGuard<TEntry extends Entry> {
  (entry: Entry): entry is object & {[key: string]: any} & Complex & TEntry
}

/**
 * Represents a guard function for an array type of entry.
 */
export interface IArrayGuard<TEntry extends Entry> {
  (entry: Entry): entry is any[] & Complex & TEntry
}
 
//#endregion

//#region Set

/**
 * A set used to contain entries
 */
export interface EntrySet<TEntry extends Entry>
  extends IDexSubMap<TEntry>,
  Queries.Full<TEntry, ResultType.Array, TEntry>
{

  /**
   * Get all entries as a record indeed by key
   */
  map<TResult, TResults extends ResultType = ResultType.Array>(
    transform: Loop.IBreakable<[entry: TEntry, index: number], TResult>,
    resultType?: TResults
  ): TResult[];

  /**
   * Get a plain map that's a copy of the hash key and entry map of the dex.
   */
  map(): Map<HashKey, TEntry>;

  /**
   * Get all matching entries
   */
  filter<TResultType extends ResultType = ResultType.Array>(
    where: Loop.IBreakable<[entry: TEntry, index: number], boolean>,
    resultType?: TResultType
  ): Result<TEntry, TResultType>;
}

export {
  EntrySet as Set
}

//#region Internal

/** @internal */
export function EntryMapConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: Map<HashKey, TEntry>
): EntrySet<TEntry> {
  const query: EntrySet<TEntry>
    = Queries.FullQueryConstructor<TEntry, ResultType.Array, TEntry>(
        dex,
        ResultType.Array,
        {
          allOnNoParams: true
        }
      ) as EntrySet<TEntry>
  
  Object.defineProperty(query, "map", {
    value<TResult = never, TResults extends ResultType = ResultType.Array>(
      transform?: Loop.IBreakable<[entry: TEntry, index: number], TResult>,
      resultType?: TResults
    ): Result<TResult, TResults, TEntry> | Map<HashKey, TEntry> {
      if (transform !== undefined) {
        return SubSet.map<TResult, TResults, TEntry, TEntry>(
          dex,
          transform,
          resultType,
          key => dex.get(key)!,
        );
      } else {
        return new Map(base);
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: EntrySet<TEntry>["map"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, "filter", {
    value<TResults extends ResultType = ResultType.Array>(
      where: Loop.IBreakable<[entry: TEntry, index: number], boolean>,
      resultType?: TResults
    ): Result<TEntry, TResults, TEntry> {
      return SubSet.filter<TResults, TEntry, TEntry>(
        dex,
        where,
        resultType,
        key => dex.get(key)!
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: EntrySet<TEntry>["filter"],
    enumerable: false,
    writable: false,
    configurable: false
  });
  
  Object.defineProperty(query, "first", {
    value(
      where: Loop.IBreakable<[entry: TEntry, index: number], boolean>
    ): TEntry | NoEntryFound {
      return SubSet.first<TEntry, TEntry>(
        dex,
        where
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: EntrySet<TEntry>["first"],
    enumerable: false,
    writable: false,
    configurable: false
  });
  
  Object.defineProperty(query, 'forEach', {
    value(doThis: (entry: TEntry, key: HashKey, set: Readonly<Map<HashKey, TEntry>>) => void, thisArg?: any) {
      base.forEach(doThis, thisArg ?? base);
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: EntrySet<TEntry>["forEach"],
    enumerable: false,
    writable: false,
    configurable: false
  });
  
  Object.defineProperty(query, "keys", {
    get(): IterableIterator<HashKey> {
      return base.keys();
    },
    enumerable: false,
    configurable: false,
  } as {
    get(): EntrySet<TEntry>["keys"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, "values", {
    get(): IterableIterator<TEntry> {
      return base.values();
    },
    enumerable: false,
    configurable: false
  } as {
    get(): EntrySet<TEntry>["values"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, "pairs", {
    get(): IterableIterator<[HashKey, TEntry]> {
      return base.entries();
    },
    enumerable: false,
    configurable: false
  } as {
    get(): EntrySet<TEntry>["pairs"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, "toRecord", {
    value(): Record<HashKey, TEntry> {
      return Object.fromEntries(base);
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: EntrySet<TEntry>["toRecord"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, "toArray", {
    value(): TEntry[] {
      return Array.from(base.values());
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: EntrySet<TEntry>["toArray"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  ["count", "size", "length"].forEach(key =>
    Object.defineProperty(query, key, {
      get(): number {
        return base.size;
      },
      enumerable: false,
      configurable: false
    } as {
      get(): EntrySet<TEntry>["count"],
      enumerable: false,
      configurable: false
    }));

  Object.defineProperty(query, Symbol.toStringTag, {
    value: "DexEntries",
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: string,
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, Symbol.iterator, {
    get(): () => IterableIterator<[HashKey, TEntry]> {
      return base[Symbol.iterator].bind(base);
    },
    enumerable: false,
    configurable: false
  } as {
    get(): EntrySet<TEntry>[typeof Symbol["iterator"]],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, "get", {
    value(tag: Tag) {
      return base.get(tag);
    },
    enumerable: false,
    configurable: false,
    writable: false
  } as {
    value: EntrySet<TEntry>["get"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, "has", {
    value(tag: Tag) {
      return base.has(tag);
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: EntrySet<TEntry>["has"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  return query;
}

//#endregion

//#endregion