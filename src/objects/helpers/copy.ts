import Loop from "../../utilities/iteration";
import Check from "../../utilities/validators";
import Dex from "../dexes/dex";
import {
  ArchiDex,
  InternalRDexSymbols,
  IReadableDex,
  ReadableDex
} from "../dexes/read";
import { Entry } from "../subsets/entries";
import { HashKey } from "../subsets/hashes";
import { Tag, Tags } from "../subsets/tags";

/**
 * Used to copy a dex.
 */
export interface Copier<TEntry extends Entry> extends ReadOnlyCopier<TEntry> {
  
  /**
   * Copy values from another dex into the current one.
   * 
   * @param keys Keys to query for.
   *     - No keys gets the whole dex,
   *     - An array is interpreted as entity hash keys
   *     - tags and entry hash keys can be seperated into an object with two lists as well.
   */
  from(
    source: IReadableDex<TEntry>,
    keys?: HashKey[] | Set<HashKey> | HashKey | {
      entry?: HashKey | TEntry,
      entries?: (TEntry | HashKey)[] | Set<HashKey | TEntry>,
      tags?: Tags,
      tag?: Tag
    }
  ): void;
}

export type ReadOnlyCopier<TEntry extends Entry>
  = (() => Dex<TEntry>)
  & {
    sealed(): ArchiDex<TEntry>;
  };

//#region Internal

/** @internal */
export function ReadOnlyCopierConstructor<TEntry extends Entry>(toCopy: IReadableDex<TEntry>): ReadOnlyCopier<TEntry> {
  const copier = (() => new Dex<TEntry>(toCopy)) as (() => Dex<TEntry>) & { sealed(): ArchiDex<TEntry> };
  Object.defineProperty(copier, "sealed", {
    value() { return new ArchiDex(toCopy) },
    enumerable: false,
    writable: false,
    configurable: false
  });

  return copier as ReadOnlyCopier<TEntry>;
}

/** @internal */
export function CopierConstructor<TEntry extends Entry>(
  base: Dex<TEntry>,
  fullCopyOverride?: (source: Dex<TEntry>, into: Dex<TEntry>, base: (source: Dex<TEntry>, into: Dex<TEntry>) => void) => void,
  partialCopyOverride?: (undefined | ((
    keys: Set<HashKey> | HashKey[] | { entry?: HashKey | TEntry | undefined; entries?: (HashKey | TEntry)[] | Set<HashKey | TEntry> | undefined; tags?: Tags | undefined; tag?: Tag | undefined; },
    into: Dex<TEntry>,
    source: Dex<TEntry>,
    base: (keys: Set<HashKey>
      | HashKey[]
      | {
        entry?: HashKey | TEntry | undefined;
        entries?: (HashKey | TEntry)[] | Set<HashKey | TEntry> | undefined;
        tags?: Tags | undefined;
        tag?: Tag | undefined;
      },
      into: Dex<TEntry>,
      source: Dex<TEntry>) => void
  ) => void))
): Copier<TEntry> {
  const copyFunction = (): Dex<TEntry> => {
    return new Dex<TEntry>(base);
  }

  Object.defineProperty(copyFunction, "sealed", {
    value() { return new ArchiDex(base) },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(copyFunction, "from", {
    value(...args: [any, ...any]) {
      return _copyFromOtherDex(
        base,
        fullCopyOverride,
        partialCopyOverride,
        ...args
      )
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  return copyFunction as Copier<TEntry>;
}

/** @internal */
function _copyFromOtherDex<TEntry extends Entry>(
  into: Dex<TEntry>,
  fullCopyOverride: (undefined | ((source: Dex<TEntry>, into: Dex<TEntry>, base: (source: Dex<TEntry>, into: Dex<TEntry>) => void) => void)),
  partialCopyOverride: (undefined | ((
    keys: Set<HashKey> | HashKey[] | { entry?: HashKey | TEntry | undefined; entries?: (HashKey | TEntry)[] | Set<HashKey | TEntry> | undefined; tags?: Tags | undefined; tag?: Tag | undefined; },
    into: Dex<TEntry>,
    source: Dex<TEntry>,
    base: (keys: Set<HashKey>
      | HashKey[]
      | {
        entry?: HashKey | TEntry | undefined;
        entries?: (HashKey | TEntry)[] | Set<HashKey | TEntry> | undefined;
        tags?: Tags | undefined;
        tag?: Tag | undefined;
      },
      into: Dex<TEntry>,
      source: Dex<TEntry>) => void
  ) => void)),
  source: Dex<TEntry>,
  keys?: HashKey[] | Set<HashKey> | HashKey | {
    entry?: HashKey | TEntry,
    entries?: (TEntry | HashKey)[] | Set<HashKey | TEntry>,
    tags?: Tags,
    tag?: Tag
  }
): void {
  if (Check.isObject(keys)) {
    partialCopyOverride
      ? partialCopyOverride(keys, into, source, _partialCopy)
      : _partialCopy<TEntry>(keys, into, source);
  } else {
    fullCopyOverride
      ? fullCopyOverride(source, into, _fullCopy)
      : _fullCopy<TEntry>(source, into);
  }
}

/** @internal */
function _partialCopy<TEntry extends Entry>(
  keys: Set<HashKey> | HashKey[] | {
    entry?: HashKey | TEntry | undefined;
    entries?: (HashKey | TEntry)[] | Set<HashKey | TEntry> | undefined;
    tags?: Tags | undefined;
    tag?: Tag | undefined;
  },
  into: Dex<TEntry>,
  source: Dex<TEntry>
) {
  if (Check.isArray(keys) || keys instanceof Set) {
    keys.forEach((key: HashKey) => {
      into.add(
        (source as any)[InternalRDexSymbols._entriesByHash].get(key)!,
        (source as any)[InternalRDexSymbols._tagsByHash].get(key)!
      );
    });
  } else {
    // []: Tags with no entries
    if (keys.entries && (keys.entries instanceof Set ? keys.entries.size : keys.entries.length) === 0) {
      for (const tag of source.tags) {
        if ((source as any)[InternalRDexSymbols._hashesByTag].get(tag).size === 0) {
          into.set(tag);
        }
      }
    } else if (keys.entries) {
      // [...]
      keys.entries?.forEach((key: HashKey | TEntry) => {
        const hash = into.hash(key);
        into.add(
          (source as any)[InternalRDexSymbols._entriesByHash].get(hash)!,
          (source as any)[InternalRDexSymbols._tagsByHash].get(hash)!
        );
      });
    }

    // []: Entries with no tags
    if (keys.tags && (keys.tags instanceof Set ? keys.tags.size : Loop.count(keys.tags)) === 0) {
      for (const key of source.hashes) {
        if (source.tags.of(key)!.size === 0) {
          into.add((source as any)[InternalRDexSymbols._entriesByHash].get(key)!);
        }
      }
    } else if (keys.tags) {
      // [...]
      Loop.forEach(keys.tags, (tag: Tag) => {
        (source as any)[InternalRDexSymbols._hashesByTag].get(tag)?.forEach((hash: HashKey) => {
          into.add(
            (source as any)[InternalRDexSymbols._entriesByHash].get(hash)!,
            tag
          );
        });
      });
    }
  }
}

/** @internal */
function _fullCopy<TEntry extends Entry>(source: Dex<TEntry>, into: Dex<TEntry>) {
  ((source as any)[InternalRDexSymbols._allTags] as Set<Tag>).forEach(((into as any)[InternalRDexSymbols._allTags] as Set<Tag>).add);
  ((source as any)[InternalRDexSymbols._allHashes] as Set<HashKey>).forEach(((into as any)[InternalRDexSymbols._allHashes] as Set<HashKey>).add);
  ((source as any)[InternalRDexSymbols._entriesByHash] as Map<HashKey, TEntry>).forEach(
    (entry, key) => ((into as any)[InternalRDexSymbols._entriesByHash] as Map<HashKey, TEntry>).set(key, entry)
  );
  ((source as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).forEach(
    (keys, tag) => {
      if (((into as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).has(tag)) {
        ((into as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).set(tag, keys);
      } else {
        keys.forEach(key => {
          ((into as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).get(tag)?.add(key);
        });
      }
    });
  ((source as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).forEach(
    (tags, hash) => {
      if (((into as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).has(hash)) {
        ((into as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).set(hash, tags);
      } else {
        tags.forEach(tag => {
          ((into as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).get(hash)?.add(tag);
        });
      }
    });
}
//#endregion