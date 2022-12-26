import { Break, Breakable } from "../../utilities/breakable";
import { isArray, isFunction } from "../../utilities/validators";
import Dex from "../dex";
import { FLAGS, Flag } from "../queries/flags";
import { IReadOnlyDex } from "../readonly";
import { Entry } from "./entries";
import { HashKey } from "./hashes";
import { IDexSubSet } from "./subset";

/**
 * A Tag for a dex.
 */
export type Tag = string | symbol | number;

/**
 * A collection of tags for a dex.
 */
export type Tags = Tag[] | [] | Set<Tag>;

/**
 * A single tag, or collection of tags for a dex.
 */
export type TagOrTags = Tag | Tags;

/**
 * A collection used to access hashes
 */
export interface ITagSet<TEntry extends Entry = Entry>
  extends IDexSubSet<Tag, TEntry> {
  
    /**
     * Fetch all the items that match a given entry.
     */
    of(
      target: TEntry | HashKey
    ): Tag[] | undefined;
  
    /**
     * Fetch all the items that match a given entry into a set.
     */
    for(
      target: TEntry | HashKey
    ): Set<Tag> | undefined;
  }

/** @internal */
export function TagSetConstructor<TEntry extends Entry>(dex: IReadOnlyDex<TEntry>, base: Set<Tag>): ITagSet<TEntry> {
  const tagSet = {} as any as ITagSet<TEntry>;

  Object.defineProperty(tagSet, 'size', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'count', {
    get() {
      return base.size;
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'length', {
    get() {
      return base.size;
    },
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
  });

  Object.defineProperty(tagSet, 'of', {
    value: function get(target: TEntry | HashKey) {
      return [...(dex as any)._tagsByEntryHash.get(Dex.hash(target))];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'for', {
    value: function get(target: TEntry | HashKey) {
      return (dex as any)._tagsByEntryHash.get(Dex.hash(target));
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'where', {
    value: function where(
      a: Breakable<[entry: TEntry, index: number], boolean> | Tag[],
      b?: Flag[]
    ): Tag | Set<Tag> | Dex<TEntry> | undefined {
      if (isFunction(a)) {
        if (b?.includes(FLAGS.CHAIN) && !b.includes(FLAGS.FIRST)) {
          const results = new Dex<TEntry>();
          let index = 0;

          for (const e of base.values()) {
            const result = a(dex.get(e)!, index++);
            if (result instanceof Break) {
              if (result.hasReturn && result.return) {
                (results as Dex<TEntry>).copy.from(dex, [e]);
              }

              break;
            } else {
              (results as Dex<TEntry>).copy.from(dex, [e]);
            }
          }

          return results;
        } else {
          let index = 0;

          if (b?.includes(FLAGS.FIRST)) {
            for (const e of base.values()) {
              const result = a(dex.get(e)!, index++);
              if (result instanceof Break) {
                if (result.hasReturn && result.return) {
                  return e;
                }

                break;
              } else {
                return e;
              }
            }

            return undefined!;
          } else {
            const results: Set<Tag> = new Set();

            for (const e of base.values()) {
              const result = a(dex.get(e)!, index++);
              if (result instanceof Break) {
                if (result.hasReturn && result.return) {
                  results.add(e);
                }

                break;
              } else {
                results.add(e);
              }
            }
    
            return results;
          }
        }
      } else {
        const results = dex.hashes(a, b as Flag[] as any);
        if (isArray(results)) {
          return new Set(results);
        } else {
          return results as Tag | Dex<TEntry>;
        }
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'map', {
    value: function <TResult>(transform: Breakable<[item: Tag, index: number], TResult>): Array<TResult> {
      let index = 0;
      const results: Array<TResult> = [];

      for (const e of base.values()) {
        const result = transform(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn) {
            results.push(result.return as TResult);
          }

          break;
        } else {
          results.push(result);
        }
      }

      return results;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'first', {
    value: function (where: Breakable<[item: Tag, index: number], boolean>): Tag | undefined {
      let index = 0;

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            return e;
          }

          break;
        } else {
          return e;
        }
      }

      return undefined;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'filter', {
    value: function (where: Breakable<[item: Tag, index: number], boolean>): Set<Tag> {
      let index = 0;
      const results: Set<Tag> = new Set();

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            results.add(e);
          }

          break;
        } else {
          results.add(e);
        }
      }

      return results;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, Symbol.iterator, {
    get(): IterableIterator<Tag> {
      return base[Symbol.iterator]()
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, Symbol.toStringTag, {
    value: "DexTags",
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
  });

  Object.defineProperty(tagSet, 'has', {
    value(tag: Tag) {
      return base.has(tag);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'entries', {
    get() {
      return base.entries();
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'keys', {
    get() {
      return base.keys();
    },
    enumerable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'values', {
    get() {
      return base.values();
    },
    enumerable: false,
    configurable: false
  });

  return tagSet;
}
