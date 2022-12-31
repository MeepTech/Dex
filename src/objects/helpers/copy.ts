import { isArray, isObject } from "../../utilities/validators";
import Dex from "../dex";
import { IReadOnlyDex } from "../readonly";
import { IEntry } from "../subsets/entries";
import { IHashKey } from "../subsets/hashes";
import { ITag, ITagOrTags, ITags } from "../subsets/tags";

/**
 * Used to copy a dex.
 */
export interface ICopier<TEntry extends IEntry> {
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
    keys?: IHashKey[] | Set<IHashKey> | IHashKey | {
      entry?: IHashKey | TEntry,
      entries?: (TEntry | IHashKey)[] | Set<IHashKey | TEntry>,
      tags?: ITags,
      tag?: ITag
    }
  ): void;
}

/** @internal */
export function CopierConstructor<TEntry extends IEntry>(base: Dex<TEntry>): ICopier<TEntry> {
  const copyFunction = (): Dex<TEntry> => {
    return new Dex<TEntry>(base);
  }

  Object.defineProperty(copyFunction, "from", {
    value(
      source: Dex<TEntry>,
      keys?: IHashKey[] | Set<IHashKey> | IHashKey | {
        entry?: IHashKey | TEntry,
        entries?: (TEntry | IHashKey)[] | Set<IHashKey | TEntry>,
        tags?: ITags,
        tag?: ITag
      }
    ): void {
      if (isObject(keys)) {
        if (isArray(keys) || keys instanceof Set) {
          keys.forEach((key: IHashKey) => {
            base.add(
              (source as any)._entriesByHash.get(key)!,
              (source as any)._tagsByEntryHash.get(key)!
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
            keys.entries?.forEach((key: IHashKey | TEntry) => {
              const hash = base.hash(key);
              base.add(
                (source as any)._entriesByHash.get(hash)!,
                (source as any)._tagsByEntryHash.get(hash)!
              );
            });
          }

          // []: Entries with no tags
          if (keys.tags && (keys.tags instanceof Set ? keys.tags.size : keys.tags.length) === 0) {
            for (const key of source.hashes) {
              if (source.tags.for(key)!.size === 0) {
                base.add(
                  (source as any)._entriesByHash.get(key)!,
                  []
                );
              }
            }
          } else if (keys.tags) {
            // [...]
            keys.tags?.forEach((tag: ITag) => {
              (source as any)._hashesByTag.get(tag)?.forEach((hash: IHashKey) => {
                base.add(
                  (source as any)._entriesByHash.get(hash)!,
                  tag
                );
              });
            });
          }
        }
      } else {
        ((source as any)._allTags as Set<ITag>).forEach(((base as any)._allTags as Set<ITag>).add);
        ((source as any)._allHashes as Set<IHashKey>).forEach(((base as any)._allHashes as Set<IHashKey>).add);
        ((source as any)._entriesByHash as Map<IHashKey, TEntry>).forEach(
          (entry, key) => ((base as any)._entriesByHash as Map<IHashKey, TEntry>).set(key, entry)
        );
        ((source as any)._hashesByTag as Map<ITag, Set<IHashKey>>).forEach(
          (keys, tag) => {
            if (((base as any)._hashesByTag as Map<ITag, Set<IHashKey>>).has(tag)) {
              ((base as any)._hashesByTag as Map<ITag, Set<IHashKey>>).set(tag, keys);
            } else {
              keys.forEach(key => {
                ((base as any)._hashesByTag as Map<ITag, Set<IHashKey>>).get(tag)?.add(key);
              });
            }
          });
          ((source as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>).forEach(
            (tags, hash) => {
              if (((base as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>).has(hash)) {
                ((base as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>).set(hash, tags);
              } else {
                tags.forEach(tag => {
                  ((base as any)._tagsByEntryHash as Map<IHashKey, Set<ITag>>).get(hash)?.add(tag);
                });
              }
            });
      }
    }
  });

  return copyFunction as ICopier<TEntry>;
}