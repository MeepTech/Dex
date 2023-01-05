import { IBreakable } from "../../utilities/iteration";
import { isIterable, isTag } from "../../utilities/validators";
import { Result, NoEntryFound, ResultType } from "../queries/results";
import { IReadonlyDex } from "../readonly";
import { Entry } from "./entries";
import { HashKey } from "./hashes";
import { IDexSubSet, SubSet } from "./subset";

/**
 * A Tag for a dex.
 */
export type Tag = string | symbol | number;

/**
 * A collection of tags for a dex.
 */
export type Tags = Iterable<Tag>;

/**
 * A single tag, or collection of tags for a dex.
 */
export type TagOrTags = Tag | Tags;

/**
 * A collection used to access hashes
 */
export interface TagSet<TEntry extends Entry = Entry>
  extends IDexSubSet<Tag, TEntry> {

  /**
   * Get all tags for a single entry.
   */
  (forEntry: TEntry | HashKey): Set<Tag>;

  /**
   * Get all tags for multiple entries
   */
  <TShouldSplit extends true | undefined = undefined>(
    forEntries: Iterable<TEntry | HashKey>,
    options?: {
      // TODO: implement not
      //not?: true,
      /**
       * Option to split results by entry key. (only works with 'or' type options.)
       */
      split?: TShouldSplit
    } | {
      or?: false,
      and?: true,
      // TODO: implement not
      //not?: true,
    }
  ): TShouldSplit extends undefined
    ? Set<Tag>
    : Map<HashKey, Set<Tag>>;

  /**
   * Fetch all the items that match a given entry into a set.
   */
  of(
    target: TEntry | HashKey
  ): Set<Tag> | undefined;
}

//#region Utility

/**
 * Turn a tag or tags into an easy to use Set<ITag>
 */
export function toSet(tags: TagOrTags, ...otherTags: Tag[]): Set<Tag> {
  tags = tags instanceof Set ? tags : isTag(tags) ? new Set<Tag>([tags]) : new Set<Tag>(tags);
  otherTags.forEach(o => (tags as Set<Tag>).add(o));

  return tags as Set<Tag>;
}

//#endregion

/** @internal */
export function TagSetConstructor<TEntry extends Entry>(dex: IReadonlyDex<TEntry>, base: Set<Tag>): TagSet<TEntry> {
  const tagSet = function tagSetBase<TShouldSplit extends true | undefined = undefined>(
    forEntries: TEntry | Iterable<TEntry>,
    options?: {
      // TODO: implement not
      //not?: true,
      split?: TShouldSplit
    } | {
      or?: false,
      and?: true,
      // TODO: implement not
      //not?: true,
    }
  ): TShouldSplit extends undefined
    ? Set<Tag>
    : Map<HashKey, Set<Tag>> {
    const targets = isIterable(forEntries)
      ? forEntries
      : [forEntries];
    
    const config: {
      // TODO: implement not
      //not?: true,
      split?: TShouldSplit
      or?: false,
      and?: true,
    } | undefined = options;
    
    if (config?.split) {
      // Can only split with OR
      const results = new Map<HashKey, Set<Tag>>();
      for (const target of targets) {
        const hash = dex.hash(target)!;
        const tagsForHash = (dex as any)._tagsByHash.get(hash)! as Set<Tag>;
        results.set(hash, new Set(tagsForHash));
      }

      return results as TShouldSplit extends undefined
        ? Set<Tag>
        : Map<HashKey, Set<Tag>>;
    } else {
      let results: Set<Tag> = undefined!
      // AND
      if (config?.and || config?.or === false) {
        for (const target of targets) {
          const hash = dex.hash(target)!;
          const tagsForHash = (dex as any)._tagsByHash.get(hash)! as Set<Tag>;
          if (results.size === 0) {
            results = new Set(tagsForHash);
          } else {
            for (const oldTag of results) {
              if (!tagsForHash.has(oldTag)) {
                results.delete(oldTag);
              }
            }
          }
        }
      } // OR
      else {
        for (const target of targets) {
          const hash = dex.hash(target)!;
          const tagsForHash = (dex as any)._tagsByHash.get(hash)! as Set<Tag>;
          if (results.size === 0) {
            results = new Set(tagsForHash);
          } else {
            for (const newTag of tagsForHash) {
              results.add(newTag);
            }
          }
        }
      }

      return results as TShouldSplit extends undefined
      ? Set<Tag>
      : Map<HashKey, Set<Tag>>;
    }
  } as TagSet<TEntry>;

  
  Object.defineProperty(tagSet, 'map', {
    value<TResult, TResults extends ResultType>(
      transform: IBreakable<[tag: Tag, index: number], TResult>,
      resultType?: TResults
    ): Result<TResult, TResults, TEntry> {
      return SubSet.map<TResult, TResults, Tag, TEntry>(
        dex,
        transform,
        resultType
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: TagSet<TEntry>["map"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'filter', {
    value<TResults extends ResultType = ResultType.Array>(
      where: IBreakable<[tag: Tag, index: number], boolean>,
      resultType?: TResults
    ): Result<Tag, TResults, TEntry> {
      return SubSet.filter<TResults, Tag, TEntry>(
        dex,
        where,
        resultType
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: TagSet<TEntry>["filter"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'first', {
    value(
      where: IBreakable<[tag: Tag, index: number], boolean>
    ): Tag | NoEntryFound {
      return SubSet.first<Tag, TEntry>(
        dex,
        where
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: TagSet<TEntry>["first"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'size', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): TagSet<TEntry>["size"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'count', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): TagSet<TEntry>["count"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'length', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): TagSet<TEntry>["length"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'toArray', {
    value: function toArray() {
      return [...base];
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: TagSet<TEntry>["toArray"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'of', {
    value: function get(target: TEntry | HashKey): Set<Tag> {
      return (dex as any)._tagsByHash.get(dex.hash(target))!;
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: TagSet<TEntry>["of"],
    enumerable: false,
    writable: false,
    configurable: false
  });


  Object.defineProperty(tagSet, Symbol.iterator, {
    get(): () => IterableIterator<Tag> {
      return base[Symbol.iterator].bind(base);
    },
    enumerable: false,
    configurable: false,
  } as {
    get(): TagSet<TEntry>[typeof Symbol["iterator"]],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, Symbol.toStringTag, {
    value: "DexTags",
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: string,
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'forEach', {
    value(callbackfn: (value: Tag, value2: Tag, set: Set<Tag>) => void, thisArg?: any) {
      base.forEach(callbackfn, thisArg);
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: TagSet<TEntry>["forEach"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'has', {
    value(tag: Tag) {
      return base.has(tag);
    },
    enumerable: false,
    writable: false,
    configurable: false
  } as {
    value: TagSet<TEntry>["has"],
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'entries', {
    get() {
      return base.entries;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): TagSet<TEntry>["entries"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'keys', {
    get() {
      return base.keys;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): TagSet<TEntry>["keys"],
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'values', {
    get() {
      return base.values;
    },
    enumerable: false,
    configurable: false
  } as {
    get(): TagSet<TEntry>["values"],
    enumerable: false,
    configurable: false
  });

  return tagSet;
}
