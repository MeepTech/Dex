import Loop from "../../utilities/iteration";
import { Entry } from "./entries";
import Queries from "../queries/queries";
import { IDexSubSet, SubSet } from "./subset";
import { Tag } from "./tags";
import { IReadOnlyDex } from "../dexes/readonly";
import {
  Result,
  NoEntryFound,
  ResultType
} from "../queries/results";

/**
 * A hash key for a dex item.
 */
export type HashKey = string | number | symbol;
export default HashKey;

/**
 * multiple hash keys for a dex.
 */
export type HashKeys = Iterable<HashKey>;

/**
 * One or more hash keys.
 */
export type HashKeyOrKeys = HashKey | HashKeys

/**
 * A collection used to access hashes
 */
export interface HashSet<TEntry extends Entry>
  extends IDexSubSet<HashKey, TEntry>,
  Queries.Full<HashKey, ResultType.Set, TEntry> { 
  
    /**
     * Fetch all the items that match a given entry into a set.
     */
  of(
    target: TEntry
  ): HashKey | undefined;
}

export {
  HashSet as Set
}

//#region Internal

/** @internal */
export function HashSetConstructor<TEntry extends Entry>(
  dex: IReadOnlyDex<TEntry>,
  base: Set<HashKey>
): HashSet<TEntry> {

  // Basic query function
  const query = Queries.FullQueryConstructor<
    HashKey,
    ResultType.Set,
    TEntry
  >(
    dex,
    ResultType.Set,
    {
      transform: false,
      allOnNoParams: true
    }
  ) as HashSet<TEntry>;

  Object.defineProperty(query, 'map', {
    value<TResult, TResults extends ResultType>(
      transform: Loop.IBreakable<[key: HashKey, index: number], TResult>,
      resultType?: TResults
    ): Result<TResult, TResults, TEntry> {
      return SubSet.map<TResult, TResults, HashKey, TEntry>(
        dex,
        transform,
        resultType
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: HashSet<TEntry>["map"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, 'filter', {
    value<TResults extends ResultType = ResultType.Array>(
      where: Loop.IBreakable<[hashKey: HashKey, index: number], boolean>,
      resultType?: TResults
    ): Result<HashKey, TResults, TEntry> {
      return SubSet.filter<TResults, HashKey, TEntry>(
        dex,
        where,
        resultType
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: HashSet<TEntry>["filter"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, 'first', {
    value(
      where: Loop.IBreakable<[item: HashKey, index: number], boolean>
    ): HashKey | NoEntryFound {
      return SubSet.first<HashKey, TEntry>(
        dex,
        where
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: HashSet<TEntry>["first"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, 'size', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): HashSet<TEntry>["size"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, 'count', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): HashSet<TEntry>["count"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, 'length', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): HashSet<TEntry>["length"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, 'toArray', {
    value() {
      return [...base];
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: HashSet<TEntry>["toArray"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, 'of', {
    value(target: TEntry) {
      const hash = dex.hash(target);
      if (hash !== undefined && base.has(hash)) {
        return hash;
      }

      return undefined;
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: HashSet<TEntry>["of"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, Symbol.iterator, {
    get(): () => IterableIterator<HashKey> {
      return base[Symbol.iterator].bind(base);
    },
    enumerable: false,
    configurable: false
  } as {
    get(): HashSet<TEntry>[typeof Symbol["iterator"]],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, Symbol.toStringTag, {
    value: "DexHashes",
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: string,
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, 'forEach', {
    value(callbackfn: (value: HashKey, value2: HashKey, set: Readonly<Set<HashKey>>) => void, thisArg?: any) {
      base.forEach(callbackfn, thisArg);
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: HashSet<TEntry>["forEach"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, 'has', {
    value(tag: Tag) {
      return base.has(tag);
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: HashSet<TEntry>["has"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(query, 'entries', {
    get() {
      return base.entries;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): HashSet<TEntry>["entries"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, 'keys', {
    get() {
      return base.keys;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): HashSet<TEntry>["keys"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(query, 'values', {
    get() {
      return base.values;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): HashSet<TEntry>["values"],
    enumerable: false,
    configurable: false
  });

  return query;
}

//#endregion