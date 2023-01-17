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
export function CopierConstructor<TEntry extends Entry>(base: Dex<TEntry>): Copier<TEntry> {
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
    value(
      source: Dex<TEntry>,
      keys?: HashKey[] | Set<HashKey> | HashKey | {
        entry?: HashKey | TEntry,
        entries?: (TEntry | HashKey)[] | Set<HashKey | TEntry>,
        tags?: Tags,
        tag?: Tag
      }
    ): void {
      if (Check.isObject(keys)) {
        if (Check.isArray(keys) || keys instanceof Set) {
          keys.forEach((key: HashKey) => {
            base.add(
              (source as any)[InternalRDexSymbols._entriesByHash].get(key)!,
              (source as any)[InternalRDexSymbols._tagsByHash].get(key)!
            );
          });
        } else {
          // []: Tags with no entries
          if (keys.entries && (keys.entries instanceof Set ? keys.entries.size : keys.entries.length) === 0) {
            for (const tag of source.tags) {
              if ((source as any)[InternalRDexSymbols._hashesByTag].get(tag).size === 0) {
                base.set(tag);
              }
            }
          } else if (keys.entries) {
            // [...]
            keys.entries?.forEach((key: HashKey | TEntry) => {
              const hash = base.hash(key);
              base.add(
                (source as any)[InternalRDexSymbols._entriesByHash].get(hash)!,
                (source as any)[InternalRDexSymbols._tagsByHash].get(hash)!
              );
            });
          }

          // []: Entries with no tags
          if (keys.tags && (keys.tags instanceof Set ? keys.tags.size : Loop.count(keys.tags)) === 0) {
            for (const key of source.hashes) {
              if (source.tags.of(key)!.size === 0) {
                base.add(
                  (source as any)[InternalRDexSymbols._entriesByHash].get(key)!,
                  []
                );
              }
            }
          } else if (keys.tags) {
            // [...]
            Loop.forEach(keys.tags, (tag: Tag) => {
              (source as any)[InternalRDexSymbols._hashesByTag].get(tag)?.forEach((hash: HashKey) => {
                base.add(
                  (source as any)[InternalRDexSymbols._entriesByHash].get(hash)!,
                  tag
                );
              });
            });
          }
        }
      } else {
        ((source as any)[InternalRDexSymbols._allTags] as Set<Tag>).forEach(((base as any)[InternalRDexSymbols._allTags] as Set<Tag>).add);
        ((source as any)[InternalRDexSymbols._allHashes] as Set<HashKey>).forEach(((base as any)[InternalRDexSymbols._allHashes] as Set<HashKey>).add);
        ((source as any)[InternalRDexSymbols._entriesByHash] as Map<HashKey, TEntry>).forEach(
          (entry, key) => ((base as any)[InternalRDexSymbols._entriesByHash] as Map<HashKey, TEntry>).set(key, entry)
        );
        ((source as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).forEach(
          (keys, tag) => {
            if (((base as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).has(tag)) {
              ((base as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).set(tag, keys);
            } else {
              keys.forEach(key => {
                ((base as any)[InternalRDexSymbols._hashesByTag] as Map<Tag, Set<HashKey>>).get(tag)?.add(key);
              });
            }
          });
          ((source as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).forEach(
            (tags, hash) => {
              if (((base as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).has(hash)) {
                ((base as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).set(hash, tags);
              } else {
                tags.forEach(tag => {
                  ((base as any)[InternalRDexSymbols._tagsByHash] as Map<HashKey, Set<Tag>>).get(hash)?.add(tag);
                });
              }
            });
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  return copyFunction as Copier<TEntry>;
}

//#endregion