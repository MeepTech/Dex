import { isArray, isObject } from "../utilities/validators";
import Dex from "./dex";
import { IReadOnlyDex } from "./readonly";
import { Entry } from "./subsets/entries";
import { HashKey } from "./subsets/hashes";
import { Tag } from "./subsets/tags";

/**
 * Used to copy a dex.
 */
export interface ICopier<TEntry extends Entry> {
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
    keys?: HashKey[] | Set<HashKey> | { entries?: HashKey[] | Set<HashKey>, tags?: Tag[] | Set<Tag> }
  ): void;
}

/** @internal */
export function CopierConstructor<TEntry extends Entry>(base: Dex<TEntry>): ICopier<TEntry> {
  const copyFunction = (): Dex<TEntry> => {
    return new Dex<TEntry>(base);
  }

  Object.defineProperty(copyFunction, "from", {
    value(
      source: Dex<TEntry>,
      keys: HashKey[] | { entries?: HashKey[], tags?: Tag[] }
    ): void {
      if (isObject(keys)) {
        if (isArray(keys)) {
          keys.forEach((key: HashKey) => {
            base.add(
              (source as any)._entriesByHash.get(key)!,
              (source as any)._tagsByEntryHash.get(key)!
            );
          });
        } else {
          
          // []: Tags with no entries
          if (keys.entries && keys.entries.length === 0) {
            for (const tag of source.tags) {
              if ((source as any)._hashesByTag.length === 0) {
                base.add(tag);
              }
            }
          }

          // [...]
          keys.entries?.forEach((key: HashKey) => {
            base.add(
              (source as any)._entriesByHash.get(key)!,
              (source as any)._tagsByEntryHash.get(key)!
            );
          });

          // []: Entries with no tags
          if (keys.tags && keys.tags.length === 0) {
            for (const key of source.keys) {
              if (source.tags.for(key)!.size === 0) {
                base.add(
                  (source as any)._entriesByHash.get(key)!,
                  []
                );
              }
            }
          }

          // [...]
          keys.tags?.forEach((tag: Tag) => {
            (source as any)._hashesByTag.get(tag)?.forEach((hash: HashKey) => {
              base.add(
                (source as any)._entriesByHash.get(hash)!,
                tag
              );
            });
          });
        }
      } else {
        (base as any)._allTags = (source as any)._allTags;
        (base as any)._allHashes = (source as any)._allHashes;
        (base as any)._entriesByHash = (source as any)._entriesByHash;
        (base as any)._hashesByTag = (source as any)._hashesByTag;
        (base as any)._tagsByEntryHash = (source as any)._tagsByEntryHash;
      }
    }
  });

  return copyFunction as ICopier<TEntry>;
}