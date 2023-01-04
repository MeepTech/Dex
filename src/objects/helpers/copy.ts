import { count, forEach } from "../../utilities/iteration";
import { isArray, isObject } from "../../utilities/validators";
import Dex from "../dex";
import { SealedDex } from "../sealed";
import { IReadOnlyDex } from "../idex";
import { Entry } from "../subsets/entries";
import { HashKey } from "../subsets/hashes";
import { Tag, Tags } from "../subsets/tags";

/**
 * Used to copy a dex.
 */
export interface Copier<TEntry extends Entry> {
  (): Dex<TEntry>;

  /**
   * Copy values from another dex into the current one.
   * 
   * @param keys Keys to query for.
   *     - No keys gets the whole dex,
   *     - An array is interpreted as entity hash keys
   *     - tags and entry hash keys can be seperated into an object with two lists as well.
   */
  from(
    source: IReadOnlyDex<TEntry>,
    keys?: HashKey[] | Set<HashKey> | HashKey | {
      entry?: HashKey | TEntry,
      entries?: (TEntry | HashKey)[] | Set<HashKey | TEntry>,
      tags?: Tags,
      tag?: Tag
    }
  ): void;

  sealed(): SealedDex<TEntry>;
}

/** @internal */
export function CopierConstructor<TEntry extends Entry>(base: Dex<TEntry>): Copier<TEntry> {
  const copyFunction = (): Dex<TEntry> => {
    return new Dex<TEntry>(base);
  }

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
      if (isObject(keys)) {
        if (isArray(keys) || keys instanceof Set) {
          keys.forEach((key: HashKey) => {
            base.add(
              (source as any)._entriesByHash.get(key)!,
              (source as any)._tagsByHash.get(key)!
            );
          });
        } else {
          // []: Tags with no entries
          if (keys.entries && (keys.entries instanceof Set ? keys.entries.size : keys.entries.length) === 0) {
            for (const tag of source.tags) {
              if ((source as any)._hashesByTag.get(tag).size === 0) {
                base.set(tag);
              }
            }
          } else if (keys.entries) {
            // [...]
            keys.entries?.forEach((key: HashKey | TEntry) => {
              const hash = base.hash(key);
              base.add(
                (source as any)._entriesByHash.get(hash)!,
                (source as any)._tagsByHash.get(hash)!
              );
            });
          }

          // []: Entries with no tags
          if (keys.tags && (keys.tags instanceof Set ? keys.tags.size : count(keys.tags)) === 0) {
            for (const key of source.hashes) {
              if (source.tags.of(key)!.size === 0) {
                base.add(
                  (source as any)._entriesByHash.get(key)!,
                  []
                );
              }
            }
          } else if (keys.tags) {
            // [...]
            forEach(keys.tags, (tag: Tag) => {
              (source as any)._hashesByTag.get(tag)?.forEach((hash: HashKey) => {
                base.add(
                  (source as any)._entriesByHash.get(hash)!,
                  tag
                );
              });
            });
          }
        }
      } else {
        ((source as any)._allTags as Set<Tag>).forEach(((base as any)._allTags as Set<Tag>).add);
        ((source as any)._allHashes as Set<HashKey>).forEach(((base as any)._allHashes as Set<HashKey>).add);
        ((source as any)._entriesByHash as Map<HashKey, TEntry>).forEach(
          (entry, key) => ((base as any)._entriesByHash as Map<HashKey, TEntry>).set(key, entry)
        );
        ((source as any)._hashesByTag as Map<Tag, Set<HashKey>>).forEach(
          (keys, tag) => {
            if (((base as any)._hashesByTag as Map<Tag, Set<HashKey>>).has(tag)) {
              ((base as any)._hashesByTag as Map<Tag, Set<HashKey>>).set(tag, keys);
            } else {
              keys.forEach(key => {
                ((base as any)._hashesByTag as Map<Tag, Set<HashKey>>).get(tag)?.add(key);
              });
            }
          });
          ((source as any)._tagsByHash as Map<HashKey, Set<Tag>>).forEach(
            (tags, hash) => {
              if (((base as any)._tagsByHash as Map<HashKey, Set<Tag>>).has(hash)) {
                ((base as any)._tagsByHash as Map<HashKey, Set<Tag>>).set(hash, tags);
              } else {
                tags.forEach(tag => {
                  ((base as any)._tagsByHash as Map<HashKey, Set<Tag>>).get(hash)?.add(tag);
                });
              }
            });
      }
    }
  });

  return copyFunction as Copier<TEntry>;
}