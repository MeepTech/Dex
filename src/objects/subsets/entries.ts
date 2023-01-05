import { HashKey } from "./hashes";
import IUnique from "../unique";
import { IDexSubMap, SubSet } from "./subset";
import {
  FullQueryConstructor,
  FullQuery
} from "../queries/queries";
import { IBreakable } from "../../utilities/iteration";
import { Tag, TagOrTags, TagSet } from "./tags";
import { IReadonlyDex } from "../readonly";
import { Result, NoEntryFound, ResultType } from "../queries/results";

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
  | []
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
  = { entry: EntryOrNone<TEntry>, tags: TagOrTags }

/**
 * Standard array type container for a type of entry with all of it's tags.
 */
export type EntryWithTagsTuple<TEntry extends ComplexEntry = ComplexEntry>
  = [EntryOrNone<TEntry>, Tag[]]

/**
 * All ways to input an entry with tags. Used mostly for dex construction and the add function.
 */
export type XEntryWithTags<TEntry extends Entry = Entry>
  = TEntry extends ComplexEntry
  ? (XEntryWithTagsObject<TEntry> | XEntryWithTagsTuple<TEntry>)
  : XEntryWithTagsObject<TEntry>

/**
 * Inputable EntryWithTag array types.
 */
export type XEntryWithTagsTuple<TEntry extends ComplexEntry = ComplexEntry>
  = [EntryOrNone<TEntry>, ...Tag[]]
  | [EntryOrNone<TEntry>, Set<Tag>]
  | [EntryOrNone<TEntry>, Tag]
  | [EntryOrNone<TEntry>, TagSet]
  | EntryWithTagsTuple

/**
 * Inputable EntryWithTag object types.
 */
export type XEntryWithTagsObject<TEntry extends Entry = Entry>
  = EntryWithTags<TEntry>
  | { tag: Tag, entry?: EntryOrNone<TEntry>, tags?: never }
  | { tags: TagOrTags, entry?: EntryOrNone<TEntry>, tag?: never }
  | { entry: EntryOrNone<TEntry>, tags?: TagOrTags, tag?: never }
  | { entry: EntryOrNone<TEntry>, tag?: Tag, tags?: never }

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
  (entry: Entry): entry is object & {[key: string]: any} & ComplexEntry & TEntry
}

/**
 * Represents a guard function for an array type of entry.
 */
export interface IArrayGuard<TEntry extends Entry> {
  (entry: Entry): entry is any[] & ComplexEntry & TEntry
}
 
//#endregion

//#region Entry Set

/**
 * A set used to contain entries
 */
export interface EntrySet<TEntry extends Entry>
  extends IDexSubMap<TEntry>,
  FullQuery<TEntry, ResultType.Array, TEntry>
{

  /**
   * Get all entries as a record indeed by key
   */
  map<TResult, TResults extends ResultType = ResultType.Array>(
    transform: IBreakable<[entry: TEntry, index: number], TResult>,
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
    where: IBreakable<[entry: TEntry, index: number], boolean>,
    resultType?: TResultType
  ): Result<TEntry, TResultType>;
}

/** @internal */
export function EntryMapConstructor<TEntry extends Entry>(
  dex: IReadonlyDex<TEntry>,
  base: Map<HashKey, TEntry>
): EntrySet<TEntry> {
  const query: EntrySet<TEntry>
    = FullQueryConstructor<TEntry, ResultType.Array, TEntry>(
        dex,
        ResultType.Array,
        {
          allOnNoParams: true
        }
      ) as EntrySet<TEntry>
  
  Object.defineProperty(query, "map", {
    value<TResult = never, TResults extends ResultType = ResultType.Array>(
      transform?: IBreakable<[entry: TEntry, index: number], TResult>,
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
      where: IBreakable<[entry: TEntry, index: number], boolean>,
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
      where: IBreakable<[entry: TEntry, index: number], boolean>
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