import { Break, IBreakable } from "../../utilities/loops";
import { isArray, isFunction, isTag } from "../../utilities/validators";
import Dex from "../dex";
import { IReadOnlyDex } from "../readonly";
import { IEntry } from "./entries";
import { IHashKey } from "./hashes";
import { IDexSubSet } from "./subset";

/**
 * A Tag for a dex.
 */
export type ITag = string | symbol | number;

/**
 * A collection of tags for a dex.
 */
export type ITags = Iterable<ITag>;

/**
 * A single tag, or collection of tags for a dex.
 */
export type ITagOrTags = ITag | ITags;

/**
 * Turn a tag or tags into an easy to use Set<ITag>
 */
export function toSet(tags: ITagOrTags, ...otherTags: ITag[]): Set<ITag> {
  tags = tags instanceof Set ? tags : isTag(tags) ? new Set<ITag>([tags]) : new Set<ITag>(tags);
  otherTags.forEach(o => (tags as Set<ITag>).add(o));

  return tags as Set<ITag>;
}

/**
 * A collection used to access hashes
 */
export interface ITagSet<TEntry extends IEntry = IEntry>
  extends IDexSubSet<ITag, TEntry> {
  
    /**
     * Fetch all the items that match a given entry into a set.
     */
    of(
      target: TEntry | IHashKey
    ): Set<ITag> | undefined;
  }

/** @internal */
export function TagSetConstructor<TEntry extends IEntry>(dex: IReadOnlyDex<TEntry>, base: Set<ITag>): ITagSet<TEntry> {
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
    value: function get(target: TEntry | IHashKey) {
      return [...(dex as any)._tagsByEntryHash.get(dex.hash(target))];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'for', {
    value: function get(target: TEntry | IHashKey) {
      return (dex as any)._tagsByEntryHash.get(dex.hash(target));
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'where', {
    value: function where(
      a: IBreakable<[entry: TEntry, index: number], boolean> | ITag[],
      b?: IFlag[]
    ): ITag | Set<ITag> | Dex<TEntry> | undefined {
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
            } else if (result) {
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
              } else if (result) {
                return e;
              }
            }

            return NO_RESULT;
          } else {
            const results: Set<ITag> = new Set();

            for (const e of base.values()) {
              const result = a(dex.get(e)!, index++);
              if (result instanceof Break) {
                if (result.hasReturn && result.return) {
                  results.add(e);
                }

                break;
              } else if (result) {
                results.add(e);
              }
            }
    
            return results;
          }
        }
      } else {
        const results = dex.keys(a, b as IFlag[] as any);
        if (isArray(results)) {
          return new Set(results);
        } else {
          return results as ITag | Dex<TEntry>;
        }
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'map', {
    value: function <TResult>(transform: IBreakable<[item: ITag, index: number], TResult>): Array<TResult> {
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
    value: function (where: IBreakable<[item: ITag, index: number], boolean>): ITag | undefined {
      let index = 0;

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            return e;
          }

          break;
        } else if (result) {
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
    value: function (where: IBreakable<[item: ITag, index: number], boolean>): Set<ITag> {
      let index = 0;
      const results: Set<ITag> = new Set();

      for (const e of base.values()) {
        const result = where(e, index++);
        if (result instanceof Break) {
          if (result.hasReturn && result.return) {
            results.add(e);
          }

          break;
        } else if (result) {
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
    get(): () => IterableIterator<ITag> {
      return base[Symbol.iterator].bind(base);
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
    value(callbackfn: (value: ITag, value2: ITag, set: Set<ITag>) => void, thisArg?: any) {
      base.forEach(callbackfn, thisArg);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });

  Object.defineProperty(tagSet, 'has', {
    value(tag: ITag) {
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
